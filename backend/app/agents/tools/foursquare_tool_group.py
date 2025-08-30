import os
import requests
import json
import statistics
from crewai.tools import BaseTool
from app.agents.tools.foursquare_tool import create_foursquare_tool, FoursquareSearchParams

class FoursquareGroupTool(BaseTool):
    name: str = "FoursquareGroupTool"
    description: str = "Find venues fairly for group members around median coords using Foursquare Places API"

    def _run(self, members_data: str, intent_json: str = None, meeting_time: str = None) -> str:
        try:
            members = json.loads(members_data)
        except Exception:
            return json.dumps({"status": "error", "error": "Invalid members_data JSON"})

        try:
            intent = json.loads(intent_json) if intent_json else {}
        except:
            intent = {}

        # --- compute fair coords ---
        lats, lngs = [], []
        for m in members:
            if "location" in m and "," in str(m["location"]):
                try:
                    lat, lng = map(float, m["location"].split(","))
                    lats.append(lat)
                    lngs.append(lng)
                except:
                    pass
        if lats and lngs:
            fair_lat = statistics.median(lats)
            fair_lng = statistics.median(lngs)
        else:
            fair_lat, fair_lng = 12.9716, 77.5946  # default Bangalore

        # --- use search_query if provided ---
        query = intent.get("search_query") or "restaurant, cafe"

        url = "https://api.foursquare.com/v3/places/search"
        headers = {"Authorization": os.getenv("FSQ_API_KEY")}
        params = {
            "ll": f"{fair_lat},{fair_lng}",
            "query": query,
            "radius": 5000,
            "limit": 5,
            "fields": "fsq_id,name,categories,location,geocodes,distance,hours,rating,price,timezone"
        }

        try:
            r = requests.get(url, headers=headers, params=params, timeout=10)
            r.raise_for_status()
            venues = r.json().get("results", [])
            if not venues:
                raise ValueError("No venues found at fair coords")
        except Exception as e:
            print(f"[Group FSQ] Fair coord search failed: {e}, falling back near first member")

            # fallback: retry search near first member’s coords
            fallback_lat, fallback_lng = fair_lat, fair_lng
            if members:
                try:
                    loc = members[0].get("location", "")
                    if loc and "," in loc:
                        fallback_lat, fallback_lng = map(float, loc.split(","))
                except:
                    pass

            fsq_tool = create_foursquare_tool()
            search_params = FoursquareSearchParams(
                query=query,
                ll=f"{fallback_lat},{fallback_lng}",
                radius=3000,
                limit=3
            )
            result = fsq_tool.search_places(search_params)
            venues = result.get("results", []) if isinstance(result, dict) else []

        return json.dumps({
            "status": "success",
            "fair_coords": {"lat": fair_lat, "lng": fair_lng},
            "venues": venues
        })

    def search_venues(self, lat: float, lng: float, intent: dict, meeting_time: str = None) -> list[dict]:
        members = [{"location": f"{lat},{lng}"}]
        raw = self._run(json.dumps(members), json.dumps(intent), meeting_time)
        try:
            data = json.loads(raw)
            return data.get("venues", [])
        except Exception:
            return []
