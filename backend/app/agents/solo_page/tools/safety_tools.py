def compute_safety_score(place):
    """Dummy safety score for now (extend later)"""
    print("🛡️ [Safety Tool] Computing safety score...")
    # Basic fallback: closer places = safer
    distance = place.get("distance", 1000)
    return round(max(0.1, min(1.0, 1.0 - distance/10000)), 2)
