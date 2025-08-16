import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

FSQ_API_KEY = os.getenv("FSQ_API_KEY")

def search_places(lat, lng, query=None, category_id=None, limit=5, open_now=True, radius=2000):
    """Search nearby places from Foursquare"""
    print("🛠️ [Foursquare Tool] Searching places...")

    url = "https://api.foursquare.com/v3/places/search"
    headers = {"Authorization": FSQ_API_KEY}
    params = {
        "ll": f"{lat},{lng}",
        "limit": limit,
        "radius": radius,
        "open_now": str(open_now).lower()
    }
    if query:
        params["query"] = query
    if category_id:
        params["categories"] = category_id

    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    return resp.json().get("results", [])
