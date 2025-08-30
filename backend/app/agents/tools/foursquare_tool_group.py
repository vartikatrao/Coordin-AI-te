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

        # parse intent or fallback
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
            fair_lat, fair_lng = 12.9716, 77.5946  # fallback Bangalore center

        # --- query Foursquare ---
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
        except Exception as e:
            # fallback dummy venues
            venues = [
                {"fsq_id": "fallback1", "name": "Fallback Venue 1", "location": {"formatted_address": "Bangalore"}},
                {"fsq_id": "fallback2", "name": "Fallback Venue 2", "location": {"formatted_address": "Bangalore"}},
                {"fsq_id": "fallback3", "name": "Fallback Venue 3", "location": {"formatted_address": "Bangalore"}}
            ]

        return json.dumps({
            "status": "success",
            "fair_coords": {"lat": fair_lat, "lng": fair_lng},
            "venues": venues
        })

    def search_venues(self, lat: float, lng: float, intent: dict, meeting_time: str = None) -> list:
        """Direct method for group agent to call"""
        categories = intent.get("categories", "restaurant, cafe")
        query = ", ".join([intent.get("purpose", ""), intent.get("food", ""), 
                           intent.get("ambience", ""), intent.get("budget", ""), 
                           intent.get("transport", ""), categories])

        url = "https://api.foursquare.com/v3/places/search"
        headers = {"Authorization": os.getenv("FSQ_API_KEY")}
        params = {
            "ll": f"{lat},{lng}",
            "query": query or "restaurant, cafe",
            "radius": 5000,
            "limit": 3,
            "fields": "fsq_id,name,categories,location,geocodes,distance,hours,rating,price,timezone"
        }

        try:
            r = requests.get(url, headers=headers, params=params, timeout=10)
            r.raise_for_status()
            venues = r.json().get("results", [])
            return venues
        except Exception as e:
            # fallback dummy venues
            return [
                {"fsq_id": "fallback1", "name": "Fallback Venue 1", "location": {"formatted_address": "Bangalore"}},
                {"fsq_id": "fallback2", "name": "Fallback Venue 2", "location": {"formatted_address": "Bangalore"}},
                {"fsq_id": "fallback3", "name": "Fallback Venue 3", "location": {"formatted_address": "Bangalore"}}
            ]

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