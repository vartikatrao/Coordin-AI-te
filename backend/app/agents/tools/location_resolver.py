

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

from statistics import median

# Convenience: single location → tuple
def resolve_location(location_text: str) -> tuple[float, float]:
    """Resolve location text into (lat,lng) with fallbacks."""
    tool = create_location_resolver_tool()
    coords_str = tool.extract_coordinates(location_text)
    try:
        lat, lng = map(float, coords_str.split(","))
        return lat, lng
    except Exception:
        # Fallback: Bangalore center
        return 12.9716, 77.5946


def compute_fair_coordinates(coords: list[tuple[float, float]]) -> tuple[float, float]:
    """Compute fair meeting point as geometric median (fallback: simple median)."""
    if not coords:
        return 12.9716, 77.5946

    try:
        lats = [c[0] for c in coords]
        lngs = [c[1] for c in coords]
        return median(lats), median(lngs)
    except Exception:
        # fallback to first coord
        return coords[0]
