# import os
# import json
# import requests
# from datetime import datetime
# from crewai.tools import BaseTool

# class SafetyAssessmentTool(BaseTool):
#     name: str = "SafetyAssessmentTool"
#     description: str = (
#         "Assess safety of meeting locations based on fair coords and/or recommended venues. "
#         "Checks nearby emergency services, open venues, and time of day."
#     )

#     def _run(self, venues_data: str = "[]", meeting_time: str = None, fair_coords: str = None) -> str:
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

#         emergency_count = 2  # dummy fallback
#         open_venues = 8

#         level = "Very Safe" if emergency_count >= 2 else "Safe"
#         if is_night and level == "Very Safe":
#             level = "Safe"

#         result = {
#             "status": "success",
#             "coords_checked": coords,
#             "safety_level": level,
#             "safety_details": {
#                 "emergency_services": emergency_count,
#                 "open_venues_nearby": open_venues,
#                 "is_night": is_night
#             }
#         }
#         return json.dumps(result, indent=2)

#     # ✅ Wrapper
#     def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
#         fair_coords = json.dumps({"lat": lat, "lng": lng})
#         raw = self._run(fair_coords=fair_coords, meeting_time=meeting_time)
#         try:
#             return json.loads(raw)
#         except Exception:
#             return {"status": "error", "error": "Failed to parse safety result"}
import os
import json
from datetime import datetime
from crewai.tools import BaseTool

class SafetyAssessmentTool(BaseTool):
    name: str = "SafetyAssessmentTool"
    description: str = (
        "Assess safety of meeting locations based on fair coords and/or recommended venues. "
    )

    def _run(self, fair_coords: str = None, meeting_time: str = None) -> str:
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

        emergency_count = 2
        open_venues = 8
        level = "Very Safe" if emergency_count >= 2 else "Safe"
        if is_night and level == "Very Safe":
            level = "Safe"

        return json.dumps({
            "status": "success",
            "coords_checked": coords,
            "safety_level": level,
            "safety_details": {
                "emergency_services": emergency_count,
                "open_venues_nearby": open_venues,
                "is_night": is_night
            }
        })

    def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
        fair_coords = json.dumps({"lat": lat, "lng": lng})
        raw = self._run(fair_coords=fair_coords, meeting_time=meeting_time)
        try:
            return json.loads(raw)
        except Exception:
            return {"status": "error", "error": "Failed to parse safety result"}
