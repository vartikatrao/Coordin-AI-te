# # import aiohttp
# # import asyncio
# # from typing import List, Dict, Optional
# # from app.core.config import settings
# # from app.agents.tools.llm_tool import normalize_query_with_llm
# # from app.agents.tools.categories_tool import CategoryTool

# # FSQ_API_KEY = settings.FSQ_API_KEY
# # BASE_URL = "https://places-api.foursquare.com"
# # HEADERS = {
# #     "Authorization": f"Bearer {FSQ_API_KEY}",
# #     "accept": "application/json",
# #     "X-Places-Api-Version": "2025-06-17"
# # }

# # DEFAULT_FIELDS = "fsq_place_id,name,categories,location,rating,price,distance,hours,photos,tips"

# # async def search_places(
# #     lat: float,
# #     lng: float,
# #     query: str,
# #     limit: int = 10,
# #     radius: int = 3500,
# #     open_now: bool = True,
# #     min_price: Optional[int] = None,
# #     max_price: Optional[int] = None,
# #     mood: str = None,
# #     time_pref: str = None,
# #     attributes: List[str] = None
# # ) -> List[Dict]:
# #     """
# #     Asynchronously search for places using Foursquare Places API with location, query, and preferences like budget, mood, and attributes.
# #     """
# #     try:
# #         # Normalize query with LLM
# #         norm = normalize_query_with_llm(query)
# #         search_query = norm.get("query", query)
# #         category_ids = norm.get("category_ids", []) or [CategoryTool()._run(query)]
# #         norm_attributes = norm.get("attributes", [])

# #         # Map budget to price levels
# #         budget = norm.get("budget", "unknown")
# #         if budget != "unknown":
# #             if budget == "affordable":
# #                 min_price = min_price or 1
# #                 max_price = max_price or 1
# #             elif budget == "mid-range":
# #                 min_price = min_price or 2
# #                 max_price = max_price or 2
# #             elif budget == "premium":
# #                 min_price = min_price or 3
# #                 max_price = max_price or 4

# #         # Map mood to attributes
# #         mood_attributes = {
# #             "romantic": ["romantic"],
# #             "family": ["good_for_kids", "good_for_groups"],
# #             "professional": ["business_meeting"],
# #             "energetic": ["lively"],
# #             "chill": ["quiet", "outdoor_seating"]
# #         }
# #         mood_attrs = mood_attributes.get(mood.lower() if mood else "", [])

# #         # Combine attributes
# #         final_attributes = attributes or norm_attributes or []
# #         final_attributes.extend(mood_attrs)
# #         final_attributes = list(set(final_attributes))  # Remove duplicates

# #         params = {
# #             "ll": f"{lat},{lng}",
# #             "query": search_query,
# #             "limit": min(limit, 50),  # FSQ API max is 50
# #             "radius": radius,
# #             "fields": DEFAULT_FIELDS,
# #             "open_now": str(open_now).lower()
# #         }

# #         if category_ids:
# #             params["categories"] = ",".join(filter(None, category_ids))
# #         if final_attributes:
# #             params["attributes"] = ",".join(final_attributes)
# #         if min_price is not None:
# #             params["min_price"] = min_price
# #         if max_price is not None:
# #             params["max_price"] = max_price

# #         print(f"DEBUG: Searching with params: {params}")
# #         async with aiohttp.ClientSession() as session:
# #             resp = await make_fsq_request(session, f"{BASE_URL}/places/search", params)
# #             if not resp or not resp.get("results"):
# #                 print("DEBUG: No results, trying fallback search")
# #                 params.pop("query", None)
# #                 params["radius"] = min(radius * 2, 10000)
# #                 resp = await make_fsq_request(session, f"{BASE_URL}/places/search", params)

# #         return [enrich_place(place) for place in resp.get("results", [])] if resp else []

# #     except Exception as e:
# #         print(f"Place search failed: {e}")
# #         return []

# # def enrich_place(place: Dict) -> Dict:
# #     """Enrich place data with formatted fields."""
# #     fsq_id = place.get("fsq_place_id")
# #     location = place.get("location", {})

# #     return {
# #         "fsq_id": fsq_id,
# #         "name": place.get("name"),
# #         "address": location.get("formatted_address"),
# #         "lat": location.get("latitude"),
# #         "lng": location.get("longitude"),
# #         "rating": place.get("rating"),
# #         "distance": place.get("distance"),
# #         "categories": [c["name"] for c in place.get("categories", [])],
# #         "price": get_price_string(place.get("price")),
# #         "open_now": place.get("hours", {}).get("open_now"),
# #         "image_url": get_primary_photo(place.get("photos", [])),
# #         "tips": [t.get("text", "") for t in place.get("tips", [])][:3]
# #     }

# # def get_primary_photo(photos: List[Dict]) -> Optional[str]:
# #     """Get the best photo URL from photos array."""
# #     if not photos:
# #         return None
# #     photo = photos[0]
# #     return f"{photo['prefix']}original{photo['suffix']}"

# # async def make_fsq_request(session: aiohttp.ClientSession, url: str, params: Dict) -> Optional[Dict]:
# #     """Make async FSQ API request with exponential backoff."""
# #     max_retries = 3
# #     for attempt in range(max_retries):
# #         try:
# #             async with session.get(url, headers=HEADERS, params=params, timeout=15) as resp:
# #                 if resp.status == 429:
# #                     await asyncio.sleep(2 ** attempt)
# #                     continue
# #                 resp.raise_for_status()
# #                 return await resp.json()
# #         except Exception as e:
# #             print(f"FSQ API request failed (attempt {attempt + 1}): {e}")
# #             if attempt == max_retries - 1:
# #                 return None
# #             await asyncio.sleep(2 ** attempt)
# #     return None

# # def get_price_string(price_code: Optional[int]) -> Optional[str]:
# #     """Convert Foursquare price (1..4) into string format (e.g., '$$', '$$$')."""
# #     if price_code is None:
# #         return None
# #     return "$" * int(price_code)

# # # Synchronous wrapper for CrewAI compatibility
# # def foursquare_search_sync(
# #     lat: float,
# #     lng: float,
# #     query: str,
# #     limit: int = 10,
# #     radius: int = 3500,
# #     open_now: bool = True
# # ) -> List[Dict]:
# #     """Synchronous wrapper for the async search_places function."""
# #     try:
# #         # Try to get the current event loop
# #         try:
# #             loop = asyncio.get_event_loop()
# #             if loop.is_running():
# #                 # If we're in an async context, create a new event loop in a thread
# #                 import concurrent.futures
# #                 with concurrent.futures.ThreadPoolExecutor() as executor:
# #                     future = executor.submit(asyncio.run, search_places(lat, lng, query, limit, radius, open_now))
# #                     return future.result(timeout=30)  # 30 second timeout
# #             else:
# #                 return asyncio.run(search_places(lat, lng, query, limit, radius, open_now))
# #         except RuntimeError:
# #             # No event loop, create one
# #             return asyncio.run(search_places(lat, lng, query, limit, radius, open_now))
# #     except Exception as e:
# #         print(f"Sync search failed: {e}")
# #         return []

# # class FoursquareSearchTool:
# #     """Simple tool class for CrewAI compatibility"""
# #     name = "Foursquare Place Search"
# #     description = "Searches for places using Foursquare API based on location, query, and preferences."
    
# #     def __init__(self):
# #         pass
    
# #     def _run(self, lat: float, lng: float, query: str, **kwargs) -> List[Dict]:
# #         return foursquare_search_sync(lat, lng, query, **kwargs)
    
# #     def run(self, lat: float, lng: float, query: str, **kwargs) -> List[Dict]:
# #         return self._run(lat, lng, query, **kwargs)
# import aiohttp
# import asyncio
# import requests
# from typing import List, Dict, Optional
# from app.core.config import settings

# FSQ_API_KEY = settings.FSQ_API_KEY
# BASE_URL = "https://places-api.foursquare.com"
# HEADERS = {
#     "Authorization": f"Bearer {FSQ_API_KEY}",
#     "accept": "application/json",
#     "X-Places-Api-Version": "2025-06-17"
# }

# # Default fields for each endpoint
# SEARCH_DEFAULT_FIELDS = "fsq_place_id,name,distance"
# DETAILS_DEFAULT_FIELDS = "location,social_media"

# async def search_places_enhanced(
#     lat: float,
#     lng: float,
#     query: str = None,
#     category_ids: List[str] = None,
#     limit: int = 10,
#     radius: int = 3500,
#     user_context: Dict = None
# ) -> List[Dict]:
#     """
#     Enhanced two-stage place search:
#     1. First call places/search to get basic info + fsq_place_id
#     2. Second call places/{fsq_place_id} to get detailed info
#     """
#     try:
#         # Stage 1: Search for places
#         search_params = {
#             "ll": f"{lat},{lng}",
#             "limit": min(limit, 10),  # Reduced to avoid 429
#             "radius": radius,
#             "fields": SEARCH_DEFAULT_FIELDS
#         }
        
#         # Use either query or category_ids based on context
#         if category_ids:
#             search_params["categories"] = ",".join(category_ids)
#             print(f"DEBUG: Searching by category IDs: {category_ids}")
#         elif query:
#             search_params["query"] = query
#             print(f"DEBUG: Searching by query: {query}")
        
#         async with aiohttp.ClientSession() as session:
#             search_resp = await make_fsq_request_async(session, f"{BASE_URL}/places/search", search_params)
            
#             if not search_resp or not search_resp.get("results"):
#                 print("DEBUG: No search results found")
#                 return []
            
#             search_results = search_resp.get("results", [])[:2]  # Only get 2 places as requested
            
#             # Stage 2: Get detailed info for each place
#             detailed_places = []
#             for place in search_results:
#                 fsq_id = place.get("fsq_place_id")
#                 if not fsq_id:
#                     continue
                
#                 # Determine which additional fields to request based on user context
#                 detail_fields = determine_detail_fields(user_context)
                
#                 details = await get_place_details_async(session, fsq_id, detail_fields)
#                 if details:
#                     # Merge search results with detailed info
#                     merged_place = merge_place_data(place, details)
#                     detailed_places.append(merged_place)
            
#             return detailed_places

#     except Exception as e:
#         print(f"Enhanced place search failed: {e}")
#         return []

# async def get_place_details_async(session: aiohttp.ClientSession, fsq_id: str, fields: str) -> Optional[Dict]:
#     """Get detailed place information using fsq_place_id."""
#     try:
#         params = {"fields": fields}
#         details_resp = await make_fsq_request_async(session, f"{BASE_URL}/places/{fsq_id}", params)
#         return details_resp
#     except Exception as e:
#         print(f"Failed to get details for {fsq_id}: {e}")
#         return None

# def determine_detail_fields(user_context: Dict) -> str:
#     """
#     AI-driven field selection based on user context to avoid 429 errors.
#     Always includes defaults: location, social_media
#     """
#     base_fields = DETAILS_DEFAULT_FIELDS.split(",")
#     additional_fields = []
    
#     if not user_context:
#         return DETAILS_DEFAULT_FIELDS
    
#     purpose = user_context.get("purpose", "").lower()
#     mood = user_context.get("mood", "").lower()
#     time_pref = user_context.get("time", "").lower()
#     user_query = user_context.get("original_query", "").lower()
    
#     # Smart field selection based on context
#     if any(keyword in purpose + user_query for keyword in ["temple", "worship", "church", "mosque", "prayer"]):
#         additional_fields.extend(["hours", "description"])
    
#     elif any(keyword in purpose + user_query for keyword in ["restaurant", "food", "lunch", "dinner", "eat"]):
#         additional_fields.extend(["price", "rating", "hours"])
#         if "family" in mood:
#             additional_fields.append("features")  # For family-friendly features
    
#     elif any(keyword in purpose + user_query for keyword in ["coffee", "cafe", "work", "study"]):
#         additional_fields.extend(["hours", "features", "rating"])
    
#     elif any(keyword in purpose + user_query for keyword in ["fun", "party", "night", "bar", "club"]):
#         additional_fields.extend(["hours", "price", "rating"])
    
#     elif any(keyword in purpose + user_query for keyword in ["hotel", "stay", "accommodation"]):
#         additional_fields.extend(["price", "rating", "features", "photos"])
    
#     elif any(keyword in purpose + user_query for keyword in ["shop", "shopping", "buy"]):
#         additional_fields.extend(["hours", "features"])
    
#     # Time-based field additions
#     if any(keyword in time_pref + user_query for keyword in ["now", "open", "timing", "hours"]):
#         if "hours" not in additional_fields:
#             additional_fields.append("hours")
    
#     # Remove duplicates and combine with base fields
#     all_fields = base_fields + list(set(additional_fields))
#     return ",".join(all_fields)

# def merge_place_data(search_result: Dict, details: Dict) -> Dict:
#     """Merge search results with detailed place information."""
#     merged = {
#         "fsq_id": search_result.get("fsq_place_id"),
#         "name": search_result.get("name"),
#         "distance": search_result.get("distance"),
#     }
    
#     if details:
#         # Handle location data
#         location = details.get("location", {})
#         merged.update({
#             "address": location.get("formatted_address"),
#             "lat": location.get("latitude"),
#             "lng": location.get("longitude"),
#             "neighborhood": location.get("neighborhood"),
#             "region": location.get("region")
#         })
        
#         # Handle social media
#         social_media = details.get("social_media", {})
#         merged["social_media"] = social_media
        
#         # Handle hours with nested structure
#         hours = details.get("hours", {})
#         if hours:
#             merged["hours"] = {
#                 "open_now": hours.get("open_now"),
#                 "regular": hours.get("regular", []),
#                 "display": hours.get("display")
#             }
#             # Flatten some commonly used hour fields
#             merged["open_now"] = hours.get("open_now")
        
#         # Handle other fields
#         for field in ["price", "rating", "features", "photos", "description"]:
#             if field in details:
#                 merged[field] = details[field]
        
#         # Handle features (if present) - flatten for easier access
#         features = details.get("features", {})
#         if features:
#             merged["features"] = features
#             # Flatten commonly used features
#             merged["has_wifi"] = features.get("wifi")
#             merged["outdoor_seating"] = features.get("outdoor_seating")
#             merged["good_for_kids"] = features.get("good_for_kids")
    
#     return merged

# async def make_fsq_request_async(session: aiohttp.ClientSession, url: str, params: Dict) -> Optional[Dict]:
#     """Make async FSQ API request with rate limit handling."""
#     max_retries = 2  # Reduced retries to save time
#     for attempt in range(max_retries):
#         try:
#             async with session.get(url, headers=HEADERS, params=params, timeout=15) as resp:
#                 if resp.status == 429:
#                     wait_time = 2 ** attempt
#                     print(f"Rate limited, waiting {wait_time}s...")
#                     await asyncio.sleep(wait_time)
#                     continue
#                 resp.raise_for_status()
#                 return await resp.json()
#         except Exception as e:
#             print(f"FSQ API request failed (attempt {attempt + 1}): {e}")
#             if attempt == max_retries - 1:
#                 return None
#             await asyncio.sleep(1)
#     return None

# # Synchronous wrapper
# def search_places_enhanced_sync(
#     lat: float,
#     lng: float,
#     query: str = None,
#     category_ids: List[str] = None,
#     limit: int = 2,
#     user_context: Dict = None
# ) -> List[Dict]:
#     """Synchronous wrapper for the enhanced search."""
#     try:
#         import concurrent.futures
#         with concurrent.futures.ThreadPoolExecutor() as executor:
#             future = executor.submit(
#                 asyncio.run, 
#                 search_places_enhanced(lat, lng, query, category_ids, limit, 3500, user_context)
#             )
#             return future.result(timeout=30)
#     except Exception as e:
#         print(f"Enhanced sync search failed: {e}")
#         return []

# class FoursquareSearchToolEnhanced:
#     """Enhanced tool class for CrewAI compatibility with two-stage API calls."""
#     name = "Enhanced Foursquare Place Search"
#     description = "Searches for places using two-stage API calls with intelligent field selection."
    
#     def __init__(self):
#         pass
    
#     def _run(self, lat: float, lng: float, query: str = None, category_ids: List[str] = None, user_context: Dict = None, **kwargs) -> List[Dict]:
#         return search_places_enhanced_sync(lat, lng, query, category_ids, 2, user_context)
    
#     def run(self, lat: float, lng: float, query: str = None, category_ids: List[str] = None, user_context: Dict = None, **kwargs) -> List[Dict]:
#         return self._run(lat, lng, query, category_ids, user_context, **kwargs)

# # Placeholder tools for future implementation
# class WebSearchTool:
#     """Placeholder for web search to get cool facts about places."""
#     name = "Web Search Tool"
#     description = "Searches the web for interesting facts, history, and additional information about places."
    
#     def _run(self, place_name: str, location: str = "") -> Dict:
#         # TODO: Implement web search using Google/Bing API
#         return {
#             "facts": f"Placeholder: Interesting facts about {place_name}",
#             "history": f"Placeholder: Historical information about {place_name}",
#             "tips": ["Placeholder tip 1", "Placeholder tip 2"]
#         }
    
#     def run(self, place_name: str, location: str = "") -> Dict:
#         return self._run(place_name, location)

# class ImageSearchTool:
#     """Placeholder for image search to get additional images of places."""
#     name = "Image Search Tool"
#     description = "Searches for additional high-quality images of places."
    
#     def _run(self, place_name: str, location: str = "") -> Dict:
#         # TODO: Implement image search using Google Images API or Unsplash
#         return {
#             "images": [
#                 f"placeholder_image_1_of_{place_name.replace(' ', '_')}.jpg",
#                 f"placeholder_image_2_of_{place_name.replace(' ', '_')}.jpg"
#             ],
#             "image_count": 2
#         }
    
#     def run(self, place_name: str, location: str = "") -> Dict:
#         return self._run(place_name, location)
# import requests
# import json
# import time
# from typing import Dict, List, Optional, Any
# from crewai.tools import BaseTool
# from pydantic import BaseModel, Field


# class FoursquareSearchParams(BaseModel):
#     query: str = Field(description="Search query (e.g., 'restaurant', 'coffee', 'library')")
#     ll: str = Field(description="Latitude,longitude string (e.g., '12.9716,77.5946')")
#     radius: Optional[int] = Field(default=2000, description="Search radius in meters")
#     limit: Optional[int] = Field(default=2, description="Number of results to return")
#     categories: Optional[str] = Field(default=None, description="Category filter")
#     price: Optional[str] = Field(default=None, description="Price range filter (1,2,3,4)")


# class FoursquareTool(BaseTool):
#     name: str = "Foursquare Places Search"
#     description: str = """
#     Search for places using Foursquare API. This tool can:
#     1. Search for places by query and location
#     2. Get detailed information about specific places
#     3. Filter by categories, price, distance, etc.
    
#     Use this tool when you need to find restaurants, cafes, libraries, entertainment venues, etc.
#     """
    
#     def __init__(self):
#         super().__init__()
#         import os
#         from dotenv import load_dotenv
#         load_dotenv()
#         self.api_key = os.getenv("FSQ_API_KEY", "55P30UNJS1MDEHNWYOWRZMQLGYD5JWTASR2QSC1BKH1AFHMS")
#         self.headers = {
#             "accept": "application/json",
#             "X-Places-Api-Version": "2025-06-17",
#             "authorization": f"Bearer {self.api_key}"
#         }
#         self.base_url = "https://places-api.foursquare.com"
   
#     def _make_request(self, url: str, params: Dict) -> Dict:
#         """Make API request with rate limiting"""
#         try:
#             response = requests.get(url, headers=self.headers, params=params)
#             if response.status_code == 429:
#                 # Rate limited, wait and retry
#                 time.sleep(1)
#                 response = requests.get(url, headers=self.headers, params=params)
            
#             if response.status_code == 200:
#                 return response.json()
#             else:
#                 return {"error": f"API request failed with status {response.status_code}"}
#         except Exception as e:
#             return {"error": f"Request failed: {str(e)}"}
    
#     def search_places(self, search_params: FoursquareSearchParams) -> Dict:
#         """Search for places using Foursquare API"""
#         url = f"{self.base_url}/places/search"
        
#         params = {
#             "query": search_params.query,
#             "ll": search_params.ll,
#             "radius": search_params.radius,
#             "limit": min(search_params.limit,2),
#             "fields": "name,fsq_place_id,distance,location,categories,rating,price"
#         }
        
#         if search_params.categories:
#             params["categories"] = search_params.categories
#         if search_params.price:
#             params["price"] = search_params.price
            
#         return self._make_request(url, params)
    
#     def get_place_details(self, fsq_place_id: str, fields: List[str] = None) -> Dict:
#         """Get detailed information about a specific place"""
#         if fields is None:
#             fields = ["name", "location", "contact", "hours", "rating", "price", "social_media", "photos"]
        
#         url = f"{self.base_url}/places/{fsq_place_id}"
#         params = {
#             "fields": ",".join(fields)
#         }
        
#         return self._make_request(url, params)
    
#     def _run(self, **kwargs) -> str:
#         """Main execution method for the tool"""
#         action = kwargs.get("action", "search")
        
#         if action == "search":
#             # Search for places
#             query = kwargs.get("query", "")
#             ll = kwargs.get("ll", "12.9716,77.5946")  # Default to Bangalore
#             radius = kwargs.get("radius", 2000)
#             limit = kwargs.get("limit", 10)
#             categories = kwargs.get("categories")
#             price = kwargs.get("price")
            
#             search_params = FoursquareSearchParams(
#                 query=query,
#                 ll=ll,
#                 radius=radius,
#                 limit=limit,
#                 categories=categories,
#                 price=price
#             )
            
#             result = self.search_places(search_params)
            
#             if "error" in result:
#                 return f"Search failed: {result['error']}"
            
#             # Format results for better readability
#             if "results" in result and result["results"]:
#                 formatted_results = []
#                 for place in result["results"]:
#                     place_info = {
#                         "name": place.get("name", "Unknown"),
#                         "fsq_place_id": place.get("fsq_place_id", ""),
#                         "distance": place.get("distance", "N/A"),
#                         "rating": place.get("rating", "N/A"),
#                         "price": place.get("price", "N/A"),
#                         "address": place.get("location", {}).get("formatted_address", "Address not available"),
#                         "categories": [cat.get("name", "") for cat in place.get("categories", [])]
#                     }
#                     formatted_results.append(place_info)
                
#                 return json.dumps({
#                     "status": "success",
#                     "count": len(formatted_results),
#                     "places": formatted_results
#                 }, indent=2)
#             else:
#                 return json.dumps({"status": "no_results", "message": "No places found matching your criteria"})
        
#         elif action == "details":
#             # Get place details
#             fsq_place_id = kwargs.get("fsq_place_id", "")
#             fields = kwargs.get("fields", ["name", "location", "contact", "hours", "rating", "price", "social_media"])
            
#             if not fsq_place_id:
#                 return json.dumps({"error": "fsq_place_id is required for details"})
            
#             result = self.get_place_details(fsq_place_id, fields)
            
#             if "error" in result:
#                 return f"Details fetch failed: {result['error']}"
            
#             # Format the response
#             formatted_result = {
#                 "status": "success",
#                 "place_details": result
#             }
            
#             return json.dumps(formatted_result, indent=2)
        
#         else:
#             return json.dumps({"error": "Invalid action. Use 'search' or 'details'"})


# # Factory function to create the tool
# def create_foursquare_tool():
#     return FoursquareTool()

import requests
import json
import time
from typing import Dict, List, Optional
from crewai.tools import BaseTool
from pydantic import BaseModel, Field, PrivateAttr


class FoursquareSearchParams(BaseModel):
    query: str = Field(description="Search query (e.g., 'restaurant', 'coffee', 'library')")
    ll: str = Field(description="Latitude,longitude string (e.g., '12.9716,77.5946')")
    radius: Optional[int] = Field(default=2000, description="Search radius in meters")
    limit: Optional[int] = Field(default=2, description="Number of results to return")
    categories: Optional[str] = Field(default=None, description="Category filter")
    price: Optional[str] = Field(default=None, description="Price range filter (1,2,3,4)")


class FoursquareTool(BaseTool):
    name: str = "Foursquare Places Search"
    description: str = """
    Search for places using Foursquare API. This tool can:
    1. Search for places by query and location
    2. Get detailed information about specific places
    3. Filter by categories, price, distance, etc.
    
    Use this tool when you need to find restaurants, cafes, libraries, entertainment venues, etc.
    """

    # Private attributes (not part of Pydantic validation)
    _api_key: str = PrivateAttr()
    _headers: dict = PrivateAttr()
    _base_url: str = PrivateAttr(default="https://places-api.foursquare.com")

    def __init__(self):
        super().__init__()
        import os
        from dotenv import load_dotenv
        load_dotenv()

        # Load key (use env var if available, fallback otherwise)
        self._api_key = os.getenv(
            "FSQ_API_KEY")


        self._headers = {
            "accept": "application/json",
            "X-Places-Api-Version": "2025-06-17",
            "authorization": f"Bearer {self._api_key}"
        }

    def _make_request(self, url: str, params: Dict) -> Dict:
        """Make API request with basic rate-limit handling"""
        try:
            response = requests.get(url, headers=self._headers, params=params)
            if response.status_code == 429:  # Too Many Requests
                time.sleep(1)
                response = requests.get(url, headers=self._headers, params=params)

            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API request failed with status {response.status_code}"}
        except Exception as e:
            return {"error": f"Request failed: {str(e)}"}

    def search_places(self, search_params: FoursquareSearchParams) -> Dict:
        """Search for places using Foursquare API"""
        url = f"{self._base_url}/places/search"

        params = {
            "query": search_params.query,
            "ll": search_params.ll,
            "radius": search_params.radius,
            "limit": min(search_params.limit, 2),  # cap results
            "fields": "name,fsq_place_id,distance,location,categories,rating,price"
        }

        if search_params.categories:
            params["categories"] = search_params.categories
        if search_params.price:
            params["price"] = search_params.price

        return self._make_request(url, params)

    def get_place_details(self, fsq_place_id: str, fields: List[str] = None) -> Dict:
        """Get detailed information about a specific place"""
        if fields is None:
            fields = ["name", "location", "contact", "hours", "rating", "price", "social_media", "photos"]

        url = f"{self._base_url}/places/{fsq_place_id}"
        params = {"fields": ",".join(fields)}

        return self._make_request(url, params)

    def _run(self, **kwargs) -> str:
        """Main execution method for the tool"""
        action = kwargs.get("action", "search")

        if action == "search":
            # Search for places
            search_params = FoursquareSearchParams(
                query=kwargs.get("query", ""),
                ll=kwargs.get("ll", "12.9716,77.5946"),  # Default Bangalore
                radius=kwargs.get("radius", 2000),
                limit=kwargs.get("limit", 10),
                categories=kwargs.get("categories"),
                price=kwargs.get("price")
            )

            result = self.search_places(search_params)
            if "error" in result:
                return f"Search failed: {result['error']}"

            if "results" in result and result["results"]:
                formatted_results = []
                for place in result["results"]:
                    # Format categories to ensure proper JSON structure
                    categories = []
                    for cat in place.get("categories", []):
                        categories.append({
                            "id": str(cat.get("id", "")),  # Convert ID to string to ensure valid JSON
                            "name": cat.get("name", ""),
                            "icon": cat.get("icon", {})
                        })
                    
                    formatted_place = {
                        "fsq_id": place.get("fsq_place_id", ""),
                        "name": place.get("name", "Unknown"),
                        "distance": place.get("distance", "N/A"),
                        "rating": place.get("rating", "N/A"),
                        "price": place.get("price", "N/A"),
                        "location": {
                            "address": place.get("location", {}).get("formatted_address", "Address not available"),
                            "latitude": place.get("location", {}).get("latitude"),
                            "longitude": place.get("location", {}).get("longitude"),
                            "country": place.get("location", {}).get("country", ""),
                            "locality": place.get("location", {}).get("locality", ""),
                            "region": place.get("location", {}).get("region", "")
                        },
                        "categories": categories,
                        "chains": place.get("chains", []),
                        "geocodes": {
                            "main": {
                                "latitude": place.get("location", {}).get("latitude"),
                                "longitude": place.get("location", {}).get("longitude")
                            }
                        },
                        "link": place.get("link", ""),
                        "popularity": place.get("popularity", 0),
                        "related_places": place.get("related_places", {}),
                        "tel": place.get("tel", ""),
                        "timezone": place.get("timezone", ""),
                        "website": place.get("website", "")
                    }
                    formatted_results.append(formatted_place)

                return json.dumps(formatted_results, indent=2, ensure_ascii=False)

            return json.dumps({"status": "no_results", "message": "No places found matching your criteria"})

        elif action == "details":
            fsq_place_id = kwargs.get("fsq_place_id", "")
            fields = kwargs.get("fields", ["name", "location", "contact", "hours", "rating", "price", "social_media"])

            if not fsq_place_id:
                return json.dumps({"error": "fsq_place_id is required for details"})

            result = self.get_place_details(fsq_place_id, fields)
            if "error" in result:
                return f"Details fetch failed: {result['error']}"

            return json.dumps({"status": "success", "place_details": result}, indent=2)

        else:
            return json.dumps({"error": "Invalid action. Use 'search' or 'details'"})


# Factory function
def create_foursquare_tool():
    return FoursquareTool()
