from app.agents.tools.foursquare_tool import (
    search_places, get_place_details, get_place_photos
)
# from app.agents.tools.safety_tool import compute_safety_score

def _enrich(lat, lng, raw_results: list, include_closed: bool) -> list[dict]:
    enriched = []
    for r in raw_results:
        fsq_id = r.get("fsq_id") or r.get("id")
        details = get_place_details(fsq_id)
        photos = get_place_photos(fsq_id, limit=1)
        open_now = not r.get("closed_bucketed", False)
        distance_m = r.get("distance")
        rating = details.get("rating")
        price_message = (details.get("price") or {}).get("message") or "Not available"
        description = details.get("description") or ""

        item = {
            "fsq_id": fsq_id,
            "name": r.get("name"),
            "address": (r.get("location") or {}).get("formatted_address"),
            "distance_m": distance_m,
            "open_now": open_now if include_closed is False else open_now,  # keep value
            "rating": rating,
            "price": price_message,
            "image_url": photos[0] if photos else "https://via.placeholder.com/600x400?text=No+Image",
            "description": description
        }
        item["safety_score"] = compute_safety_score(item)
        enriched.append(item)
    return enriched

def resolve_places(lat, lng, query: str | None, category_id: str | None, limit=5, include_closed=False) -> list[dict]:
    """
    Smart resolver:
      1) try category_id (if provided) with open_now filter
      2) try query with open_now filter
      3) fallback: retry including closed places
    Returns an enriched list (details, price, photo, safety_score).
    """
    results = []

    # 1) category first (if available)
    if category_id:
        try:
            results = search_places(lat, lng, None, category_id, limit, open_now=not include_closed)
            if results:
                return _enrich(lat, lng, results, include_closed)
        except Exception as e:
            print(f"⚠️ FSQ category fetch failed: {e}")

    # 2) free text query
    if query:
        try:
            results = search_places(lat, lng, query, None, limit, open_now=not include_closed)
            if results:
                return _enrich(lat, lng, results, include_closed)
        except Exception as e:
            print(f"⚠️ FSQ query fetch failed: {e}")

    # 3) fallback: include closed
    if not results and not include_closed:
        print("🔄 [FSQ Resolver] Fallback: retry including closed places")
        return resolve_places(lat, lng, query, category_id, limit, include_closed=True)

    return _enrich(lat, lng, results, include_closed) if results else []
