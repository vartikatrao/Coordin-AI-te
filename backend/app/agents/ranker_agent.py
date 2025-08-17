import json
import requests
from app.core.config import settings

GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_MODEL = settings.GEMINI_MODEL

def llm_rank_and_explain(places, user_budget, user_mood, purpose, time):
    """
    Uses Gemini to:
      1) Order places best→worst
      2) Output JSON with fields: fsq_id, name, score(1-10), reason, plus selected attributes.
    The prompt uses tips, rating, price, open status, and distance.
    """
    if not GEMINI_API_KEY:
        # Fallback: simple score by rating then distance
        scored = []
        for p in places:
            score = float(p.get("rating") or 0) + (1.0 if p.get("open_now") else 0.0) - (p.get("distance", 9999) / 10000.0)
            reason = f"{p['name']} matches {purpose}. "
            if p.get("price") and user_budget != "unknown" and p["price"] == user_budget:
                reason += "Budget match. "
            if p.get("open_now"):
                reason += "Open now. "
            scored.append({**p, "score": round(score, 2), "reason": reason.strip()})
        scored.sort(key=lambda x: x["score"], reverse=True)
        return {"recommendations": scored}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}

    # Keep payload concise for reliability
    compact_places = [
        {
            "fsq_id": p["fsq_id"],
            "name": p["name"],
            "rating": p.get("rating", 0),
            "distance": p.get("distance"),
            "open_now": p.get("open_now"),
            "price": p.get("price", "unknown"),
            "address": p.get("address"),
            "image_url": p.get("image_url"),
            "tips": p.get("tips", [])[:3]
        }
        for p in places
    ]

    prompt = f"""
Rank these places for the user preferences.

User:
- Purpose: {purpose}
- Mood: {user_mood}
- Budget: {user_budget}
- Time: {time}

Rules:
- Prefer places aligned with budget (affordable/mid-range/premium).
- Prefer open places for the given time, else still include with penalty if likely closed.
- Consider rating and tips sentiment for family/romantic/work/study vibes.
- Prefer closer distance when tie-breaking.

Return strictly a JSON array; each item: 
{{"fsq_id": "...", "name": "...", "score": 1-10, "reason": "short human explanation"}}
No commentary. Only JSON array.
    """

    body = {
        "contents": [
            {"parts": [
                {"text": prompt},
                {"text": json.dumps(compact_places)}
            ]}
        ],
        "generationConfig": {"response_mime_type": "application/json"}
    }

    try:
        resp = requests.post(url, headers=headers, json=body, timeout=60)
        resp.raise_for_status()
        raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]

        arr = json.loads(raw_text)
        # Merge back attributes to each item
        place_map = {p["fsq_id"]: p for p in compact_places}
        merged = []
        for item in arr:
            base = place_map.get(item.get("fsq_id"))
            if not base:
                # Try match by name
                base = next((p for p in compact_places if p["name"] == item.get("name")), None)
            if base:
                merged.append({
                    **base,
                    "score": item.get("score", 5),
                    "reason": item.get("reason", "Good fit.")
                })
        # Keep top 5 consistently
        merged.sort(key=lambda x: x.get("score", 0), reverse=True)
        return {"recommendations": merged[:5]}
    except Exception:
        # Fallback if model returns non-JSON
        compact_places.sort(key=lambda x: (x.get("rating", 0), -x.get("distance", 999999)), reverse=True)
        for p in compact_places:
            p["score"] = p.get("rating", 0)
            p["reason"] = f"{p['name']} is a reasonable match for {purpose}."
        return {"recommendations": compact_places[:5]}