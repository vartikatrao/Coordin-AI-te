import os
import json
import requests
from datetime import datetime
from crewai.tools import BaseTool

class SafetyAssessmentTool(BaseTool):
    name: str = "SafetyAssessmentTool"
    description: str = "Assess area safety around coordinates and time"

    def _run(self, lat_lng_time: str) -> str:
        """Dummy safety assessment (placeholders for now)"""
        try:
            parts = lat_lng_time.split(",")
            if len(parts) >= 2:
                lat, lng = float(parts[0]), float(parts[1])
                time_of_day = parts[2] if len(parts) > 2 else None
            else:
                return json.dumps({"error": "Invalid lat,lng format"})
        except ValueError:
            return json.dumps({"error": "Invalid coordinates"})

        # Dummy safety score calculation
        safety_score = 0.8  # Baseline safety

        # Time-based adjustments
        current_hour = datetime.now().hour
        is_night = current_hour < 6 or current_hour > 20

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
            "recommendations": [
                "Travel in groups",
                "Use well-lit routes",
                "Share location with contacts"
            ],
            "assessment": {
                "location": f"{lat},{lng}",
                "time_assessed": datetime.now().isoformat(),
                "is_night": is_night
            }
        }

        return json.dumps(result, indent=2)

    def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
        """Direct method for group agent to call"""
        try:
            # Dummy safety score calculation
            safety_score = 0.8  # Baseline safety

            # Time-based adjustments
            current_hour = datetime.now().hour
            is_night = current_hour < 6 or current_hour > 20

            if is_night:
                safety_score -= 0.2

            # Distance from city center (Bangalore)
            center_lat, center_lng = 12.9716, 77.5946
            distance_from_center = ((lat - center_lat) ** 2 + (lng - center_lng) ** 2) ** 0.5

            if distance_from_center > 0.1:  # Far from center
                safety_score -= 0.1

            safety_score = max(0.1, min(1.0, safety_score))

            return {
                "status": "success",
                "safety_score": round(safety_score, 2),
                "recommendations": [
                    "Travel in groups",
                    "Use well-lit routes",
                    "Share location with contacts"
                ],
                "assessment": {
                    "location": f"{lat},{lng}",
                    "time_assessed": datetime.now().isoformat(),
                    "is_night": is_night
                }
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }