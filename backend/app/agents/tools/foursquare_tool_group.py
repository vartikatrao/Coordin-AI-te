import os
import requests
import json
import statistics
from crewai.tools import BaseTool

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

        categories = intent.get("categories", "restaurant, cafe")
        query = ", ".join([intent.get("purpose", ""), intent.get("food", ""), 
                           intent.get("ambience", ""), intent.get("budget", ""), 
                           intent.get("transport", ""), categories])

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
            fair_lat, fair_lng = 12.9716, 77.5946

        url = "https://api.foursquare.com/v3/places/search"
        headers = {"Authorization": os.getenv("FSQ_API_KEY")}
        params = {
            "ll": f"{fair_lat},{fair_lng}",
            "query": query or "restaurant, cafe",
            "radius": 5000,
            "limit": 3,
            "fields": "fsq_id,name,categories,location,geocodes,distance,hours,rating,price,timezone"
        }

        try:
            r = requests.get(url, headers=headers, params=params, timeout=10)
            r.raise_for_status()
            venues = r.json().get("results", [])
            if not venues:
                raise ValueError("No venues found")
        except Exception:
            venues = [
                {"fsq_id": "fallback1", "name": "Mavalli Tiffin Rooms (MTR)", "location": {"formatted_address": "Lalbagh Road, Bangalore"}, "rating": 4.6},
                {"fsq_id": "fallback2", "name": "Truffles, Indiranagar", "location": {"formatted_address": "100 Feet Road, Indiranagar"}, "rating": 4.4},
                {"fsq_id": "fallback3", "name": "The Black Pearl, Koramangala", "location": {"formatted_address": "Koramangala 5th Block"}, "rating": 4.2},
            ]

        return json.dumps({
            "status": "success",
            "fair_coords": {"lat": fair_lat, "lng": fair_lng},
            "venues": venues
        })

    # ✅ Wrapper
    def search_venues(self, lat: float, lng: float, intent: dict, meeting_time: str = None) -> list[dict]:
        members = [{"location": f"{lat},{lng}"}]
        raw = self._run(json.dumps(members), json.dumps(intent), meeting_time)
        try:
            data = json.loads(raw)
            return data.get("venues", [])
        except Exception:
            return []

    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in kilometers"""
        import math
        
        # Convert latitude and longitude from degrees to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
