# # import requests
# # import time
# # from typing import Dict, Any, Optional
# # from app.core.config import settings

# # FSQ_API_KEY = settings.FSQ_API_KEY
# # BASE_URL = "https://places-api.foursquare.com"
# # HEADERS = {
# #     "authorization": f"Bearer {FSQ_API_KEY}",
# #     "accept": "application/json",
# #     "X-Places-Api-Version": "2025-06-17"
# # }

# # def resolve_location(query: str, fallback_lat: float, fallback_lng: float) -> Dict[str, Any]:
# #     """
# #     Resolves location text to geographic coordinates using Foursquare's API.
# #     Returns a dictionary with lat, lng, and resolved_from.
# #     """
# #     if not query or query.strip().lower() in ["near me", "nearby", "my location"]:
# #         return {
# #             "lat": fallback_lat,
# #             "lng": fallback_lng,
# #             "resolved_from": "user_location"
# #         }
    
# #     query = query.strip()
    
# #     # Try different search strategies
# #     strategies = [
# #         {"query": query, "categories": "16000"},  # Landmarks
# #         {"query": f"{query} area", "radius": 10000},  # Wider area search
# #         {"query": query, "ll": f"{fallback_lat},{fallback_lng}"}  # Generic search
# #     ]
    
# #     for params in strategies:
# #         try:
# #             search_params = {
# #                 "query": params["query"],
# #                 "limit": 1,
# #                 "ll": f"{fallback_lat},{fallback_lng}",
# #                 "fields": "location",
# #                 **params
# #             }
            
# #             resp = make_fsq_request(f"{BASE_URL}/places/search", search_params)
# #             if not resp:
# #                 continue
                
# #             results = resp.get("results", [])
# #             if results:
# #                 location = results[0].get("location", {})
# #                 if "latitude" in location and "longitude" in location:
# #                     return {
# #                         "lat": location["latitude"],
# #                         "lng": location["longitude"],
# #                         "resolved_from": "fsq_geocode"
# #                     }
                    
# #         except Exception as e:
# #             print(f"Location resolution attempt failed: {e}")
# #             continue
    
# #     # Final fallback
# #     return {
# #         "lat": fallback_lat,
# #         "lng": fallback_lng,
# #         "resolved_from": "fallback"
# #     }

# # def make_fsq_request(url: str, params: Dict[str, Any]) -> Optional[Dict]:
# #     """Helper for making FSQ API requests with rate limit handling."""
# #     try:
# #         resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        
# #         if resp.status_code == 429:
# #             time.sleep(1)
# #             resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
            
# #         resp.raise_for_status()
# #         return resp.json()
        
# #     except Exception as e:
# #         print(f"FSQ API request failed: {e}")
# #         return None
# import requests
# import time
# import math
# from typing import Dict, Any, Optional, List
# from app.core.config import settings

# FSQ_API_KEY = settings.FSQ_API_KEY
# BASE_URL = "https://places-api.foursquare.com"
# HEADERS = {
#     "authorization": f"Bearer {FSQ_API_KEY}",
#     "accept": "application/json",
#     "X-Places-Api-Version": "2025-06-17"
# }

# def resolve_location(query: str, fallback_lat: float, fallback_lng: float, current_lat: float = None, current_lng: float = None) -> Dict[str, Any]:
#     """
#     Resolves location text to geographic coordinates using Foursquare's geotagging endpoint.
#     Returns a dictionary with lat, lng, and resolved_from.
#     """
#     if not query or query.strip().lower() in ["near me", "nearby", "my location"]:
#         return {
#             "lat": current_lat or fallback_lat,
#             "lng": current_lng or fallback_lng,
#             "resolved_from": "user_location"
#         }
    
#     query = query.strip()
    
#     # First try geotagging endpoint for location names
#     try:
#         geotagging_params = {
#             "query": query,
#             "limit": 10,  # Get multiple candidates
#             "fields": "name,location"
#         }
        
#         resp = make_fsq_request(f"{BASE_URL}/geotagging", geotagging_params)
        
#         if resp and resp.get("results"):
#             candidates = resp.get("results", [])
            
#             # If we have current location, find closest candidate
#             if current_lat and current_lng:
#                 best_candidate = find_closest_candidate(candidates, current_lat, current_lng)
#                 if best_candidate:
#                     location = best_candidate.get("location", {})
#                     if "latitude" in location and "longitude" in location:
#                         return {
#                             "lat": location["latitude"],
#                             "lng": location["longitude"],
#                             "resolved_from": "fsq_geotagging_closest",
#                             "matched_name": best_candidate.get("name", query)
#                         }
            
#             # Fallback to first candidate if current location not available
#             first_candidate = candidates[0]
#             location = first_candidate.get("location", {})
#             if "latitude" in location and "longitude" in location:
#                 return {
#                     "lat": location["latitude"],
#                     "lng": location["longitude"],
#                     "resolved_from": "fsq_geotagging_first",
#                     "matched_name": first_candidate.get("name", query)
#                 }
                
#     except Exception as e:
#         print(f"Geotagging failed: {e}")
    
#     # Fallback to places search as secondary option
#     try:
#         search_params = {
#             "query": query,
#             "limit": 1,
#             "ll": f"{current_lat or fallback_lat},{current_lng or fallback_lng}",
#             "fields": "location,name"
#         }
        
#         resp = make_fsq_request(f"{BASE_URL}/places/search", search_params)
#         if resp and resp.get("results"):
#             result = resp["results"][0]
#             location = result.get("location", {})
#             if "latitude" in location and "longitude" in location:
#                 return {
#                     "lat": location["latitude"],
#                     "lng": location["longitude"],
#                     "resolved_from": "fsq_search_fallback",
#                     "matched_name": result.get("name", query)
#                 }
                
#     except Exception as e:
#         print(f"Search fallback failed: {e}")
    
#     # Final fallback to current/default location
#     return {
#         "lat": current_lat or fallback_lat,
#         "lng": current_lng or fallback_lng,
#         "resolved_from": "fallback_coordinates"
#     }

# def find_closest_candidate(candidates: List[Dict], current_lat: float, current_lng: float) -> Optional[Dict]:
#     """Find the candidate closest to current location using haversine distance."""
#     if not candidates:
#         return None
    
#     min_distance = float('inf')
#     closest_candidate = None
    
#     for candidate in candidates:
#         location = candidate.get("location", {})
#         if "latitude" not in location or "longitude" not in location:
#             continue
            
#         distance = haversine_distance(
#             current_lat, current_lng,
#             location["latitude"], location["longitude"]
#         )
        
#         if distance < min_distance:
#             min_distance = distance
#             closest_candidate = candidate
    
#     return closest_candidate

# def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
#     """Calculate haversine distance between two points in kilometers."""
#     R = 6371  # Earth's radius in kilometers
    
#     dlat = math.radians(lat2 - lat1)
#     dlon = math.radians(lon2 - lon1)
    
#     a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
#          math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
#          math.sin(dlon / 2) * math.sin(dlon / 2))
    
#     c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
#     distance = R * c
    
#     return distance

# def make_fsq_request(url: str, params: Dict[str, Any]) -> Optional[Dict]:
#     """Helper for making FSQ API requests with rate limit handling."""
#     try:
#         resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        
#         if resp.status_code == 429:
#             print("Rate limited, waiting...")
#             time.sleep(2)
#             resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
            
#         resp.raise_for_status()
#         return resp.json()
        
#     except Exception as e:
#         print(f"FSQ API request failed: {e}")
#         return None
# import requests
# import json
# from typing import Dict, Tuple, Optional
# from crewai.tools import BaseTool
# from geopy.geocoders import Nominatim
# import time


# class LocationResolverTool(BaseTool):
#     name: str = "Location Resolver"
#     description: str = """
#     Resolve location names to coordinates and vice versa. This tool can:
#     1. Convert place names to latitude/longitude coordinates
#     2. Find neighborhoods and areas within cities
#     3. Resolve ambiguous location references
#     4. Get location context and boundaries
    
#     Use this tool when you need to convert location names like 'Jayanagar, Bangalore' to coordinates.
#     """
    
#     def __init__(self):
#         super().__init__()
#         self.api_key = "55P30UNJS1MDEHNWYOWRZMQLGYD5JWTASR2QSC1BKH1AFHMS"
#         self.headers = {
#             "accept": "application/json",
#             "X-Places-Api-Version": "2025-06-17",
#             "authorization": f"Bearer {self.api_key}"
#         }
#         self.geolocator = Nominatim(user_agent="coordinate_app")
        
#     def resolve_with_foursquare(self, location_query: str) -> Dict:
#         """Use Foursquare geotagging API to resolve location"""
#         url = "https://places-api.foursquare.com/geotagging/candidates"
#         params = {
#             "query": location_query,
#             "types": "neighborhood,locality,region"
#         }
        
#         try:
#             response = requests.get(url, headers=self.headers, params=params)
#             if response.status_code == 429:
#                 time.sleep(1)
#                 response = requests.get(url, headers=self.headers, params=params)
                
#             if response.status_code == 200:
#                 return response.json()
#             else:
#                 return {"error": f"Foursquare geotagging failed with status {response.status_code}"}
#         except Exception as e:
#             return {"error": f"Foursquare request failed: {str(e)}"}
    
#     def resolve_with_nominatim(self, location_query: str) -> Optional[Dict]:
#         """Fallback to Nominatim geocoding"""
#         try:
#             location = self.geolocator.geocode(location_query)
#             if location:
#                 return {
#                     "latitude": location.latitude,
#                     "longitude": location.longitude,
#                     "display_name": location.address,
#                     "source": "nominatim"
#                 }
#             return None
#         except Exception as e:
#             return {"error": f"Nominatim geocoding failed: {str(e)}"}
    
#     def extract_coordinates(self, location_text: str, default_location: str = "12.9716,77.5946") -> str:
#         """Extract coordinates from location text or return default"""
#         if not location_text or location_text.strip() == "":
#             return default_location
        
#         # Try Foursquare first
#         fsq_result = self.resolve_with_foursquare(location_text)
        
#         if "error" not in fsq_result and "candidates" in fsq_result and fsq_result["candidates"]:
#             candidate = fsq_result["candidates"][0]
#             lat = candidate.get("latitude")
#             lng = candidate.get("longitude")
#             if lat and lng:
#                 return f"{lat},{lng}"
        
#         # Fallback to Nominatim
#         nom_result = self.resolve_with_nominatim(location_text)
#         if nom_result and "error" not in nom_result:
#             return f"{nom_result['latitude']},{nom_result['longitude']}"
        
#         # Return default if all fails
#         return default_location
    
#     def get_location_context(self, coordinates: str) -> Dict:
#         """Get context about a location from coordinates"""
#         try:
#             lat, lng = coordinates.split(",")
#             location = self.geolocator.reverse(f"{lat},{lng}")
#             if location:
#                 return {
#                     "formatted_address": location.address,
#                     "coordinates": coordinates,
#                     "components": location.raw.get("address", {})
#                 }
#         except Exception as e:
#             pass
        
#         return {"coordinates": coordinates, "context": "Location context unavailable"}
    
#     def _run(self, **kwargs) -> str:
#         """Main execution method for the tool"""
#         action = kwargs.get("action", "resolve")
#         location_query = kwargs.get("location_query", "")
#         default_location = kwargs.get("default_location", "12.9716,77.5946")  # Bangalore default
        
#         if action == "resolve":
#             # Resolve location name to coordinates
#             coordinates = self.extract_coordinates(location_query, default_location)
#             context = self.get_location_context(coordinates)
            
#             result = {
#                 "status": "success",
#                 "query": location_query,
#                 "coordinates": coordinates,
#                 "context": context
#             }
            
#             return json.dumps(result, indent=2)
        
#         elif action == "context":
#             # Get context for coordinates
#             coordinates = kwargs.get("coordinates", default_location)
#             context = self.get_location_context(coordinates)
            
#             result = {
#                 "status": "success",
#                 "coordinates": coordinates,
#                 "context": context
#             }
            
#             return json.dumps(result, indent=2)
        
#         else:
#             return json.dumps({"error": "Invalid action. Use 'resolve' or 'context'"})


# # Factory function to create the tool
# def create_location_resolver_tool():
#     return LocationResolverTool()

import requests
import json
from typing import Dict, Optional
from crewai.tools import BaseTool
from geopy.geocoders import Nominatim
import time
from pydantic import PrivateAttr


class LocationResolverTool(BaseTool):
    name: str = "Location Resolver"
    description: str = """
    Resolve location names to coordinates and vice versa. This tool can:
    1. Convert place names to latitude/longitude coordinates
    2. Find neighborhoods and areas within cities
    3. Resolve ambiguous location references
    4. Get location context and boundaries
    
    Use this tool when you need to convert location names like 'Jayanagar, Bangalore' to coordinates.
    """

    # Private attributes
    _api_key: str = PrivateAttr()
    _headers: dict = PrivateAttr()
    _geolocator: Nominatim = PrivateAttr()

    def __init__(self):
        super().__init__()
        import os
        self._api_key = os.getenv("FSQ_API_KEY")
        self._headers = {
            "accept": "application/json",
            "X-Places-Api-Version": "2025-06-17",
            "authorization": f"Bearer {self._api_key}"
        }
        self._geolocator = Nominatim(user_agent="coordinate_app")

    def resolve_with_foursquare(self, location_query: str) -> Dict:
        """Use Foursquare geotagging API to resolve location"""
        url = "https://places-api.foursquare.com/geotagging/candidates"
        params = {"query": location_query, "types": "neighborhood,locality,region"}

        try:
            response = requests.get(url, headers=self._headers, params=params)
            if response.status_code == 429:
                time.sleep(1)
                response = requests.get(url, headers=self._headers, params=params)

            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Foursquare geotagging failed with status {response.status_code}"}
        except Exception as e:
            return {"error": f"Foursquare request failed: {str(e)}"}

    def resolve_with_nominatim(self, location_query: str) -> Optional[Dict]:
        """Fallback to Nominatim geocoding"""
        try:
            location = self._geolocator.geocode(location_query)
            if location:
                return {
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "display_name": location.address,
                    "source": "nominatim"
                }
            return None
        except Exception as e:
            return {"error": f"Nominatim geocoding failed: {str(e)}"}

    def extract_coordinates(self, location_text: str, default_location: str = "12.9716,77.5946") -> str:
        """Extract coordinates from location text or return default"""
        if not location_text or location_text.strip() == "":
            return default_location

        # Try Foursquare first
        fsq_result = self.resolve_with_foursquare(location_text)
        if "error" not in fsq_result and "candidates" in fsq_result and fsq_result["candidates"]:
            candidate = fsq_result["candidates"][0]
            lat = candidate.get("latitude")
            lng = candidate.get("longitude")
            if lat and lng:
                return f"{lat},{lng}"

        # Fallback to Nominatim
        nom_result = self.resolve_with_nominatim(location_text)
        if nom_result and "error" not in nom_result:
            return f"{nom_result['latitude']},{nom_result['longitude']}"

        # Return default if all fails
        return default_location

    def get_location_context(self, coordinates: str) -> Dict:
        """Get context about a location from coordinates"""
        try:
            lat, lng = coordinates.split(",")
            location = self._geolocator.reverse(f"{lat},{lng}")
            if location:
                return {
                    "formatted_address": location.address,
                    "coordinates": coordinates,
                    "components": location.raw.get("address", {})
                }
        except Exception:
            pass

        return {"coordinates": coordinates, "context": "Location context unavailable"}

    def _run(self, **kwargs) -> str:
        """Main execution method for the tool"""
        action = kwargs.get("action", "resolve")
        location_query = kwargs.get("location_query", "")
        default_location = kwargs.get("default_location", "12.9716,77.5946")  # Bangalore default

        if action == "resolve":
            # Resolve location name to coordinates
            coordinates = self.extract_coordinates(location_query, default_location)
            context = self.get_location_context(coordinates)

            return json.dumps({
                "status": "success",
                "query": location_query,
                "coordinates": coordinates,
                "context": context
            }, indent=2)

        elif action == "context":
            # Get context for coordinates
            coordinates = kwargs.get("coordinates", default_location)
            context = self.get_location_context(coordinates)

            return json.dumps({
                "status": "success",
                "coordinates": coordinates,
                "context": context
            }, indent=2)

        else:
            return json.dumps({"error": "Invalid action. Use 'resolve' or 'context'"})


# Factory function
def create_location_resolver_tool():
    return LocationResolverTool()
