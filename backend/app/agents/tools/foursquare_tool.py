import aiohttp
import asyncio
from typing import List, Dict, Optional
from crewai_tools import tool
from app.core.config import settings
from app.agents.tools.llm_tool import normalize_query_with_llm
from app.agents.tools.categories_tool import CategoryTool

FSQ_API_KEY = settings.FSQ_API_KEY
BASE_URL = "https://places-api.foursquare.com"
HEADERS = {
    "Authorization": f"Bearer {FSQ_API_KEY}",
    "accept": "application/json",
    "X-Places-Api-Version": "2025-06-17"
}

DEFAULT_FIELDS = "fsq_place_id,name,categories,location,rating,price,distance,hours,photos,tips"

@tool("Foursquare Place Search")
async def search_places(
    lat: float,
    lng: float,
    query: str,
    limit: int = 10,
    radius: int = 3500,
    open_now: bool = True,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    mood: str = None,
    time_pref: str = None,
    attributes: List[str] = None
) -> List[Dict]:
    """
    Asynchronously search for places using Foursquare Places API with location, query, and preferences like budget, mood, and attributes.
    """
    try:
        # Normalize query with LLM
        norm = normalize_query_with_llm(query)
        search_query = norm.get("query", query)
        category_ids = norm.get("category_ids", []) or [CategoryTool()._run(query)]
        norm_attributes = norm.get("attributes", [])

        # Map budget to price levels
        budget = norm.get("budget", "unknown")
        if budget != "unknown":
            if budget == "affordable":
                min_price = min_price or 1
                max_price = max_price or 1
            elif budget == "mid-range":
                min_price = min_price or 2
                max_price = max_price or 2
            elif budget == "premium":
                min_price = min_price or 3
                max_price = max_price or 4

        # Map mood to attributes
        mood_attributes = {
            "romantic": ["romantic"],
            "family": ["good_for_kids", "good_for_groups"],
            "professional": ["business_meeting"],
            "energetic": ["lively"],
            "chill": ["quiet", "outdoor_seating"]
        }
        mood_attrs = mood_attributes.get(mood.lower() if mood else "", [])

        # Combine attributes
        final_attributes = attributes or norm_attributes or []
        final_attributes.extend(mood_attrs)
        final_attributes = list(set(final_attributes))  # Remove duplicates

        params = {
            "ll": f"{lat},{lng}",
            "query": search_query,
            "limit": min(limit, 50),  # FSQ API max is 50
            "radius": radius,
            "fields": DEFAULT_FIELDS,
            "open_now": str(open_now).lower()
        }

        if category_ids:
            params["categories"] = ",".join(filter(None, category_ids))
        if final_attributes:
            params["attributes"] = ",".join(final_attributes)
        if min_price is not None:
            params["min_price"] = min_price
        if max_price is not None:
            params["max_price"] = max_price

        print(f"DEBUG: Searching with params: {params}")
        async with aiohttp.ClientSession() as session:
            resp = await make_fsq_request(session, f"{BASE_URL}/places/search", params)
            if not resp or not resp.get("results"):
                print("DEBUG: No results, trying fallback search")
                params.pop("query", None)
                params["radius"] = min(radius * 2, 10000)
                resp = await make_fsq_request(session, f"{BASE_URL}/places/search", params)

        return [enrich_place(place) for place in resp.get("results", [])] if resp else []

    except Exception as e:
        print(f"Place search failed: {e}")
        return []

def enrich_place(place: Dict) -> Dict:
    """Enrich place data with formatted fields."""
    fsq_id = place.get("fsq_place_id")
    location = place.get("location", {})

    return {
        "fsq_id": fsq_id,
        "name": place.get("name"),
        "address": location.get("formatted_address"),
        "lat": location.get("latitude"),
        "lng": location.get("longitude"),
        "rating": place.get("rating"),
        "distance": place.get("distance"),
        "categories": [c["name"] for c in place.get("categories", [])],
        "price": get_price_string(place.get("price")),
        "open_now": place.get("hours", {}).get("open_now"),
        "image_url": get_primary_photo(place.get("photos", [])),
        "tips": [t.get("text", "") for t in place.get("tips", [])][:3]
    }

def get_primary_photo(photos: List[Dict]) -> Optional[str]:
    """Get the best photo URL from photos array."""
    if not photos:
        return None
    photo = photos[0]
    return f"{photo['prefix']}original{photo['suffix']}"

async def make_fsq_request(session: aiohttp.ClientSession, url: str, params: Dict) -> Optional[Dict]:
    """Make async FSQ API request with exponential backoff."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with session.get(url, headers=HEADERS, params=params, timeout=15) as resp:
                if resp.status == 429:
                    await asyncio.sleep(2 ** attempt)
                    continue
                resp.raise_for_status()
                return await resp.json()
        except Exception as e:
            print(f"FSQ API request failed (attempt {attempt + 1}): {e}")
            if attempt == max_retries - 1:
                return None
            await asyncio.sleep(2 ** attempt)
    return None

def get_price_string(price_code: Optional[int]) -> Optional[str]:
    """Convert Foursquare price (1..4) into string format (e.g., '$$', '$$$')."""
    if price_code is None:
        return None
    return "$" * int(price_code)

# Synchronous wrapper for CrewAI compatibility
@tool("Foursquare Search Sync")
def foursquare_search_sync(
    lat: float,
    lng: float,
    query: str,
    limit: int = 10,
    radius: int = 3500,
    open_now: bool = True
) -> List[Dict]:
    """Synchronous wrapper for the async search_places function."""
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're in an async context, we need to handle this differently
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, search_places(lat, lng, query, limit, radius, open_now))
                return future.result()
        else:
            return asyncio.run(search_places(lat, lng, query, limit, radius, open_now))
    except Exception as e:
        print(f"Sync search failed: {e}")
        return []