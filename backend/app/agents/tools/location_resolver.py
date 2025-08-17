import requests
import time
from typing import Dict, Any, Optional
from app.core.config import settings

FSQ_API_KEY = settings.FSQ_API_KEY
BASE_URL = "https://places-api.foursquare.com"
HEADERS = {
    "authorization": f"Bearer {FSQ_API_KEY}",
    "accept": "application/json",
    "X-Places-Api-Version": "2025-06-17"
}

def resolve_location(query: str, fallback_lat: float, fallback_lng: float) -> Dict[str, Any]:
    """
    Resolves location text to geographic coordinates using Foursquare's API.
    Returns a dictionary with lat, lng, and resolved_from.
    """
    if not query or query.strip().lower() in ["near me", "nearby", "my location"]:
        return {
            "lat": fallback_lat,
            "lng": fallback_lng,
            "resolved_from": "user_location"
        }
    
    query = query.strip()
    
    # Try different search strategies
    strategies = [
        {"query": query, "categories": "16000"},  # Landmarks
        {"query": f"{query} area", "radius": 10000},  # Wider area search
        {"query": query, "ll": f"{fallback_lat},{fallback_lng}"}  # Generic search
    ]
    
    for params in strategies:
        try:
            search_params = {
                "query": params["query"],
                "limit": 1,
                "ll": f"{fallback_lat},{fallback_lng}",
                "fields": "location",
                **params
            }
            
            resp = make_fsq_request(f"{BASE_URL}/places/search", search_params)
            if not resp:
                continue
                
            results = resp.get("results", [])
            if results:
                location = results[0].get("location", {})
                if "latitude" in location and "longitude" in location:
                    return {
                        "lat": location["latitude"],
                        "lng": location["longitude"],
                        "resolved_from": "fsq_geocode"
                    }
                    
        except Exception as e:
            print(f"Location resolution attempt failed: {e}")
            continue
    
    # Final fallback
    return {
        "lat": fallback_lat,
        "lng": fallback_lng,
        "resolved_from": "fallback"
    }

def make_fsq_request(url: str, params: Dict[str, Any]) -> Optional[Dict]:
    """Helper for making FSQ API requests with rate limit handling."""
    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        
        if resp.status_code == 429:
            time.sleep(1)
            resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
            
        resp.raise_for_status()
        return resp.json()
        
    except Exception as e:
        print(f"FSQ API request failed: {e}")
        return None