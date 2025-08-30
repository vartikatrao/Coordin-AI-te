import os
import json
import requests
from datetime import datetime
from crewai.tools import BaseTool


class SafetyAssessmentTool(BaseTool):
    name: str = "SafetyAssessmentTool"
    description: str = (
        "Assess safety of meeting locations based on fair coords and/or recommended venues. "
        "Checks nearby emergency services, open venues, and time of day. "
        "Always returns a structured JSON response."
    )

    def _run(self, venues_data: str = "[]", meeting_time: str = None, fair_coords: str = None) -> str:
        # Step 1: Parse venues
        try:
            venues = json.loads(venues_data) if venues_data else []
        except Exception:
            venues = []

        # Step 2: Get coords (priority: fair_coords > first venue > fallback Bangalore)
        coords = None
        if fair_coords:
            try:
                coords = json.loads(fair_coords)
            except Exception:
                coords = None

        if not coords and venues:
            try:
                if "geocodes" in venues[0] and "main" in venues[0]["geocodes"]:
                    coords = venues[0]["geocodes"]["main"]
                elif "location" in venues[0] and "lat" in venues[0]["location"]:
                    coords = {
                        "lat": venues[0]["location"]["lat"],
                        "lng": venues[0]["location"]["lng"]
                    }
            except Exception:
                coords = None

        if not coords:
            coords = {"lat": 12.9716, "lng": 77.5946}  # Default Bangalore center

        lat, lng = coords.get("lat"), coords.get("lng")

        # Step 3: Parse meeting time for day/night context
        is_night = False
        if meeting_time:
            try:
                t = datetime.fromisoformat(meeting_time)
                is_night = t.hour >= 20 or t.hour <= 6
            except Exception:
                pass  # If parsing fails, ignore

        # Step 4: Query Foursquare for emergency services
        emergency_count = 0
        try:
            url = "https://api.foursquare.com/v3/places/search"
            headers = {"Authorization": os.getenv("FSQ_API_KEY")}
            params = {
                "ll": f"{lat},{lng}",
                "query": "hospital, police",
                "radius": 2000,
                "limit": 5
            }
            r = requests.get(url, headers=headers, params=params, timeout=10)
            r.raise_for_status()
            emergency_results = r.json().get("results", [])
            emergency_count = len(emergency_results)
        except Exception:
            emergency_count = 0

        # Step 5: Query Foursquare for open venues (activity level)
        open_venues = 0
        try:
            url = "https://api.foursquare.com/v3/places/search"
            headers = {"Authorization": os.getenv("FSQ_API_KEY")}
            params = {
                "ll": f"{lat},{lng}",
                "radius": 1000,
                "limit": 10
            }
            r = requests.get(url, headers=headers, params=params, timeout=10)
            r.raise_for_status()
            open_venues = len(r.json().get("results", []))
        except Exception:
            open_venues = 0

        # Step 6: Safety scoring
        if emergency_count >= 2 and open_venues >= 5 and not is_night:
            level = "Very Safe"
        elif emergency_count >= 1 and open_venues >= 3:
            level = "Safe"
        elif open_venues >= 1:
            level = "Moderate"
        else:
            level = "Not assessed"

        # Step 7: Build structured response
        result = {
            "status": "success",
            "coords_checked": coords,
            "safety_level": level,
            "safety_details": {
                "emergency_services": emergency_count,
                "open_venues_nearby": open_venues,
                "is_night": is_night
            }
        }

        return json.dumps(result, indent=2)
