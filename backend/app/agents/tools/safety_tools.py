# # import os
# # import json
# # import requests
# # from datetime import datetime
# # from crewai.tools import BaseTool

# # class SafetyAssessmentTool(BaseTool):
# #     name: str = "SafetyAssessmentTool"
# #     description: str = (
# #         "Assess safety of meeting locations based on fair coords and/or recommended venues. "
# #         "Checks nearby emergency services, open venues, and time of day."
# #     )

# #     def _run(self, venues_data: str = "[]", meeting_time: str = None, fair_coords: str = None) -> str:
# #         try:
# #             coords = json.loads(fair_coords) if fair_coords else {"lat": 12.9716, "lng": 77.5946}
# #         except Exception:
# #             coords = {"lat": 12.9716, "lng": 77.5946}

# #         lat, lng = coords["lat"], coords["lng"]

# #         is_night = False
# #         if meeting_time:
# #             try:
# #                 t = datetime.fromisoformat(meeting_time)
# #                 is_night = t.hour >= 20 or t.hour <= 6
# #             except Exception:
# #                 pass

# #         emergency_count = 2  # dummy fallback
# #         open_venues = 8

# #         level = "Very Safe" if emergency_count >= 2 else "Safe"
# #         if is_night and level == "Very Safe":
# #             level = "Safe"

# #         result = {
# #             "status": "success",
# #             "coords_checked": coords,
# #             "safety_level": level,
# #             "safety_details": {
# #                 "emergency_services": emergency_count,
# #                 "open_venues_nearby": open_venues,
# #                 "is_night": is_night
# #             }
# #         }
# #         return json.dumps(result, indent=2)

# #     # ✅ Wrapper
# #     def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
# #         fair_coords = json.dumps({"lat": lat, "lng": lng})
# #         raw = self._run(fair_coords=fair_coords, meeting_time=meeting_time)
# #         try:
# #             return json.loads(raw)
# #         except Exception:
# #             return {"status": "error", "error": "Failed to parse safety result"}
# import os
# import json
# from datetime import datetime
# from crewai.tools import BaseTool

# class SafetyAssessmentTool(BaseTool):
#     name: str = "SafetyAssessmentTool"
#     description: str = (
#         "Assess safety of meeting locations based on fair coords and/or recommended venues. "
#     )

#     def _run(self, fair_coords: str = None, meeting_time: str = None) -> str:
#         try:
#             coords = json.loads(fair_coords) if fair_coords else {"lat": 12.9716, "lng": 77.5946}
#         except Exception:
#             coords = {"lat": 12.9716, "lng": 77.5946}

#         lat, lng = coords["lat"], coords["lng"]

#         is_night = False
#         if meeting_time:
#             try:
#                 t = datetime.fromisoformat(meeting_time)
#                 is_night = t.hour >= 20 or t.hour <= 6
#             except Exception:
#                 pass

#         emergency_count = 2
#         open_venues = 8
#         level = "Very Safe" if emergency_count >= 2 else "Safe"
#         if is_night and level == "Very Safe":
#             level = "Safe"

#         return json.dumps({
#             "status": "success",
#             "coords_checked": coords,
#             "safety_level": level,
#             "safety_details": {
#                 "emergency_services": emergency_count,
#                 "open_venues_nearby": open_venues,
#                 "is_night": is_night
#             }
#         })

#     def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
#         fair_coords = json.dumps({"lat": lat, "lng": lng})
#         raw = self._run(fair_coords=fair_coords, meeting_time=meeting_time)
#         try:
#             return json.loads(raw)
#         except Exception:
#             return {"status": "error", "error": "Failed to parse safety result"}
import os
import json
import requests
from datetime import datetime
from crewai.tools import BaseTool
from crewai.llm import LLM

class SafetyAssessmentTool(BaseTool):
    name: str = "SafetyAssessmentTool"
    description: str = (
        "Assess safety of meeting locations based on fair coords and/or recommended venues. "
        "Queries Foursquare for hospitals, police, and open venues."
    )

    def __init__(self):
        super().__init__()
        from dotenv import load_dotenv
        load_dotenv()

        self._api_key = os.getenv("FSQ_API_KEY")
        self._headers = {
            "accept": "application/json",
            "X-Places-Api-Version": "2025-06-17",
            "authorization": f"Bearer {self._api_key}"
        }
        self._base_url = "https://places-api.foursquare.com"

    def _search_places(self, lat: float, lng: float, query: str, limit: int = 5):
        """Helper to query Foursquare Places API."""
        url = f"{self._base_url}/places/search"
        params = {
            "ll": f"{lat},{lng}",
            "query": query,
            "radius": 2000,
            "limit": limit,
            "fields": "fsq_place_id,name,location,categories,hours"
        }
        try:
            r = requests.get(url, headers=self._headers, params=params, timeout=10)
            r.raise_for_status()
            return r.json().get("results", [])
        except Exception as e:
            print(f"[SafetyTool] FSQ search failed for query={query}: {e}")
            return []

    def _run(self, fair_coords: str = None, meeting_time: str = None) -> str:
        try:
            coords = json.loads(fair_coords) if fair_coords else {"lat": 12.9716, "lng": 77.5946}
        except Exception:
            coords = {"lat": 12.9716, "lng": 77.5946}

        lat, lng = coords["lat"], coords["lng"]

        # Search emergency services
        hospitals = self._search_places(lat, lng, "hospital", limit=5)
        police = self._search_places(lat, lng, "police", limit=5)

        # Estimate foot traffic via open venues
        venues = self._search_places(lat, lng, "restaurant", limit=10)
        open_venues = [
            v for v in venues if "hours" in v and v["hours"].get("open_now", False)
        ]

        # Nighttime context
        is_night = False
        if meeting_time:
            try:
                t = datetime.fromisoformat(meeting_time)
                is_night = t.hour >= 20 or t.hour <= 6
            except Exception:
                pass

        result = {
            "status": "success",
            "coords_checked": coords,
            "hospitals_found": [{"name": h["name"], "address": h["location"].get("formatted_address", "N/A")} for h in hospitals],
            "police_found": [{"name": p["name"], "address": p["location"].get("formatted_address", "N/A")} for p in police],
            "open_venues_count": len(open_venues),
            "context": {
                "is_night": is_night,
                "meeting_time": meeting_time
            }
        }
        return json.dumps(result)

    def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
        fair_coords = json.dumps({"lat": lat, "lng": lng})
        raw = self._run(fair_coords=fair_coords, meeting_time=meeting_time)
        try:
            return json.loads(raw)
        except Exception:
            return {"status": "error", "error": "Failed to parse safety result"}


class SafetyExplainerAgent:
    """LLM agent to explain and score safety results."""

    def __init__(self):
        self.llm = LLM(model="gemini/gemini-2.5-flash", provider="gemini", api_key=os.getenv("GEMINI_API_KEY"))

    def explain(self, safety_json: dict) -> dict:
        hospitals = safety_json.get("hospitals_found", [])
        police = safety_json.get("police_found", [])
        open_venues = safety_json.get("open_venues_count", 0)
        is_night = safety_json.get("context", {}).get("is_night", False)

        prompt = f"""
        Analyze this safety context and explain:

        Hospitals nearby: {len(hospitals)} → {hospitals}
        Police nearby: {len(police)} → {police}
        Open venues: {open_venues}
        Nighttime: {is_night}

        Rules:
        - If at least 1 hospital + 1 police + 5 open venues are found, calculate a "safety_score" (0–100).
        - Otherwise, provide only a natural language explanation without a score.
        - Keep it short and clear for end users.
        Return strictly JSON:
        {{
            "explanation": "string",
            "safety_score": number or null
        }}
        """

        try:
            resp = self.llm.predict(prompt)
            return json.loads(resp)
        except Exception as e:
            print(f"[SafetyExplainerAgent] LLM failed: {e}")
            return {
                "explanation": "Could not calculate safety score, but basic safety info is available.",
                "safety_score": None
            }
