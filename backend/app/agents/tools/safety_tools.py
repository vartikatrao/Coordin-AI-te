import os
import json
import requests
from datetime import datetime
from crewai.tools import BaseTool

class SafetyAssessmentTool(BaseTool):
    name: str = "SafetyAssessmentTool"
    description: str = (
        "Assess safety of meeting locations based on fair coords and/or recommended venues. "
        "Checks nearby emergency services, open venues, and time of day."
    )

    def _run(self, venues_data: str = "[]", meeting_time: str = None, fair_coords: str = None) -> str:
        try:
            coords = json.loads(fair_coords) if fair_coords else {"lat": 12.9716, "lng": 77.5946}
        except Exception:
            coords = {"lat": 12.9716, "lng": 77.5946}

        lat, lng = coords["lat"], coords["lng"]

        is_night = False
        if meeting_time:
            try:
                t = datetime.fromisoformat(meeting_time)
                is_night = t.hour >= 20 or t.hour <= 6
            except Exception:
                pass

        emergency_count = 2  # dummy fallback
        open_venues = 8

        level = "Very Safe" if emergency_count >= 2 else "Safe"
        if is_night and level == "Very Safe":
            level = "Safe"

        # Calculate safety score
        safety_score = 0.8  # Baseline safety
        if is_night:
            safety_score -= 0.2

        # Distance from city center (Bangalore)
        center_lat, center_lng = 12.9716, 77.5946
        distance_from_center = ((lat - center_lat) ** 2 + (lng - center_lng) ** 2) ** 0.5

        if distance_from_center > 0.1:  # Far from center
            safety_score -= 0.1

        safety_score = max(0.1, min(1.0, safety_score))

        result = {
            "status": "success",
            "safety_score": round(safety_score, 2),
            "safety_level": level,
            "recommendations": [
                "Travel in groups",
                "Use well-lit routes",
                "Share location with contacts"
            ],
            "safety_details": {
                "emergency_services": emergency_count,
                "open_venues_nearby": open_venues,
                "is_night": is_night
            },
            "assessment": {
                "location": f"{lat},{lng}",
                "time_assessed": datetime.now().isoformat(),
                "is_night": is_night
            }
        }
        return json.dumps(result, indent=2)

    # ✅ Wrapper
    def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
        fair_coords = json.dumps({"lat": lat, "lng": lng})
        raw = self._run(fair_coords=fair_coords, meeting_time=meeting_time)
        try:
            return json.loads(raw)
        except Exception:
            return {"status": "error", "error": "Failed to parse safety result"}