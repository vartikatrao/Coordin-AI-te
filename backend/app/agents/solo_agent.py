import json
from app.agents.tools.extraction_tool import extract_params
from app.agents.tools.foursquare_tool import search_places
from app.agents.tools.safety_tool import compute_safety_score

def run_solo_agent(request: dict):
    """Solo Agent pipeline (with Gemini-driven FSQ mapping)"""

    # STEP 1: Structured vs Chat Input
    if "message" in request:
        print("\n🤖 [SoloAgent] Mode: Chat message")
        params = extract_params(request["message"])
    else:
        print("\n🤖 [SoloAgent] Mode: Structured JSON")
        params = request

    # STEP 2: Defaults & Fallbacks
    lat = params.get("lat") or 12.9716
    lng = params.get("lng") or 77.5946
    purpose = params.get("purpose") or "cafe"
    transport = params.get("transport") or "walking"
    time = params.get("time") or "now"
    mood = params.get("mood") or "happy"

    fsq_query = params.get("fsq_query") or purpose
    fsq_category = params.get("fsq_category_id")

    print(f"📊 [SoloAgent] Parameters: lat={lat}, lng={lng}, purpose={purpose}, mood={mood}, fsq_query={fsq_query}, fsq_category={fsq_category}")

    # STEP 3: Query Foursquare (prefer category if available)
    if fsq_category:
        results = search_places(lat, lng, None, category_id=fsq_category, limit=3)
    else:
        results = search_places(lat, lng, fsq_query, limit=3)

    # STEP 4: Add Safety Scores
    recommendations = []
    for place in results:
        recommendations.append({
            "fsq_id": place.get("fsq_id"),
            "name": place.get("name"),
            "address": place.get("location", {}).get("formatted_address"),
            "distance_m": place.get("distance"),
            "open_now": place.get("closed_bucketed", False) is False,
            "safety_score": compute_safety_score(place),
            "reason": f"{fsq_query.title()} spot, {mood} mood match."
        })

    # STEP 5: Final Agent Output
    print("✅ [SoloAgent] Final recommendations ready!")
    return {"recommendations": recommendations}
