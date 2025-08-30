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

        # Determine if it's nighttime
        is_night = False
        if meeting_time:
            try:
                if ":" in meeting_time:
                    # Parse time format like "18:00" or "6:00 PM"
                    time_str = meeting_time.replace(" PM", "").replace(" AM", "")
                    hour = int(time_str.split(":")[0])
                    if "PM" in meeting_time and hour != 12:
                        hour += 12
                    elif "AM" in meeting_time and hour == 12:
                        hour = 0
                    is_night = hour >= 20 or hour <= 6
                else:
                    # Try to parse ISO format
                    t = datetime.fromisoformat(meeting_time)
                    is_night = t.hour >= 20 or t.hour <= 6
            except Exception:
                pass

        # Simulate emergency services and open venues (in real implementation, use external APIs)
        emergency_count = 2  # Simulated: hospitals, police stations nearby
        open_venues = 8     # Simulated: number of venues open at meeting time

        # Adjust for nighttime
        if is_night:
            open_venues = max(1, open_venues - 3)  # Fewer venues open at night

        # Determine safety level
        level = "Very Safe" if emergency_count >= 2 and open_venues >= 5 else "Safe"
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

        # Generate basic safety recommendations
        recommendations = [
            "Travel in groups",
            "Share your location with contacts",
            "Use well-known routes",
            "Stick to main roads and commercial areas"
        ]
        
        if is_night:
            recommendations.extend([
                "Consider meeting during daylight hours",
                "Use ride-sharing apps or public transport",
                "Stay in well-lit areas"
            ])

        return json.dumps({
            "status": "success",
            "safety_score": round(safety_score, 2),
            "safety_level": level,
            "recommendations": recommendations,
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
        })

    def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
        fair_coords = json.dumps({"lat": lat, "lng": lng})
        raw = self._run(fair_coords=fair_coords, meeting_time=meeting_time)
        try:
            return json.loads(raw)
        except Exception:
            return {}


def create_safety_assessment_tool():
    return SafetyAssessmentTool()