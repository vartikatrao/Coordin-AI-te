import requests
import json
import math
from typing import List, Dict, Optional, Any
from crewai.tools import BaseTool
from pydantic import BaseModel,PrivateAttr
from ...core.config import settings
import os


class GroupMember(BaseModel):
    name: str
    age: int
    gender: str
    location: str  # "lat,lng" format
    preferences: str
    constraints: str

class FoursquareGroupTool(BaseTool):
    name: str = "FoursquareGroupTool"
    description: str = "Search for places suitable for group meetups using Foursquare Places API"
    
    # api_key: str = os.getenv("FOURSQUARE_API_KEY", "")
    # base_url: str = "https://places-api.foursquare.com/places"
    # headers: Dict[str, str] = {}
    _api_key: str =  PrivateAttr()
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
    def calculate_centroid(self, locations: List[str]) -> tuple:
        """Calculate geographic centroid of multiple locations"""
        total_lat = 0
        total_lng = 0
        count = len(locations)
        
        for location in locations:
            try:
                lat, lng = map(float, location.split(','))
                total_lat += lat
                total_lng += lng
            except ValueError:
                continue
                
        if count == 0:
            return 12.9716, 77.5946  # Default Bangalore coordinates
            
        return total_lat / count, total_lng / count
    
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points using Haversine formula (in km)"""
        R = 6371  # Earth's radius in km
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng/2) * math.sin(dlng/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance
    
    def estimate_travel_time(self, distance_km: float, transport_mode: str = "driving") -> int:
        """Estimate travel time based on distance and transport mode"""
        if transport_mode == "walking":
            # Average walking speed: 5 km/h
            return int(distance_km * 12)  # minutes
        elif transport_mode == "public_transit":
            # Average public transit speed in Bangalore: 20 km/h
            return int(distance_km * 3)  # minutes
        else:  # driving
            # Average driving speed in Bangalore: 25 km/h
            return int(distance_km * 2.4)  # minutes
    
    def search_venues_near_location(self, lat: float, lng: float, query: str = "", 
                                  categories: str = "", limit: int = 20) -> List[Dict]:
        """Search for venues near a specific location"""
        url = f"{self.base_url}/search"
        
        params = {
            "ll": f"{lat},{lng}",
            "limit": limit,
            "radius": 5000,  # 5km radius
            "fields": "fsq_id,name,categories,location,geocodes,distance,tel,email,website,social_media,link,chains,hours,rating,price,photos,date_closed"
        }
        
        if query:
            params["query"] = query
        if categories:
            params["categories"] = categories
            
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("results", [])
            
        except requests.exceptions.RequestException as e:
            print(f"Error searching venues: {e}")
            return []
    
    def get_place_details(self, fsq_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific place"""
        url = f"{self.base_url}/{fsq_id}"
        
        params = {
            "fields": "fsq_id,name,categories,location,geocodes,tel,email,website,social_media,link,chains,hours,rating,price,photos,description,date_closed,store_id,related_places"
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Error getting place details: {e}")
            return {}
    
    def extract_venue_categories_from_purpose(self, meeting_purpose: str, group_preferences: List[str]) -> str:
        """Use LLM to extract appropriate Foursquare categories from meeting purpose and preferences"""
        from langchain_google_genai import ChatGoogleGenerativeAI
        from ...core.config import settings
        
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.1
            )
            
            # Available Foursquare category IDs (major ones)
            available_categories = """
            Food & Dining: 13065 (Restaurant), 13032 (Cafe), 13003 (Bar), 13004 (Pub), 13005 (Brewery), 13025 (Fast Food)
            Study & Work: 13033 (Library), 13034 (Coworking Space), 13032 (Cafe with WiFi)
            Entertainment: 10000 (Arts & Entertainment), 10001 (Movie Theater), 10002 (Music Venue), 10003 (Nightclub)
            Shopping: 17000 (Retail), 17001 (Shopping Mall), 17002 (Market)
            Health & Fitness: 18000 (Gym), 18001 (Yoga Studio), 18002 (Spa)
            Services: 19000 (Professional Services), 19001 (Bank), 19002 (Gas Station)
            Outdoors: 16000 (Park), 16001 (Beach), 16002 (Recreation Area)
            """
            
            prompt = f"""
            Based on the meeting purpose: "{meeting_purpose}" and group preferences: {group_preferences}
            
            Available Foursquare categories:
            {available_categories}
            
            Extract the most relevant category IDs that would be suitable for this group meetup.
            Return ONLY comma-separated category IDs (e.g., "13065,13032,13003").
            If no specific purpose is given, return the most versatile categories.
            Focus on the top 3-5 most relevant categories.
            """
            
            response = llm.invoke(prompt)
            categories = response.content.strip().replace(" ", "")
            
            # Validate that response contains only numbers and commas
            if categories and all(c.isdigit() or c == ',' for c in categories):
                return categories
            else:
                # Fallback to general categories
                return "13065,13032,13003"  # Restaurant, Cafe, Bar
                
        except Exception as e:
            print(f"Error extracting categories with LLM: {e}")
            # Fallback to general categories
            return "13065,13032,13003"
    
    def search_venues_for_group(self, members: List[GroupMember], meeting_purpose: str = "", 
                               max_venues: int = 50) -> List[Dict]:
        """Search for venues suitable for group meetup"""
        # Calculate centroid of all member locations
        locations = [member.location for member in members]
        centroid_lat, centroid_lng = self.calculate_centroid(locations)
        
        # Extract group preferences for context
        group_preferences = [member.preferences for member in members]
        
        # Use LLM to determine appropriate categories
        categories = self.extract_venue_categories_from_purpose(meeting_purpose, group_preferences)
        
        # Search for venues
        venues = self.search_venues_near_location(
            centroid_lat, centroid_lng, 
            query=meeting_purpose if meeting_purpose else "",
            categories=categories,
            limit=max_venues
        )
        
        # Calculate travel distances and times for each venue
        enhanced_venues = []
        for venue in venues:
            if not venue.get("geocodes", {}).get("main"):
                continue
                
            venue_lat = venue["geocodes"]["main"]["latitude"]
            venue_lng = venue["geocodes"]["main"]["longitude"]
            
            # Calculate distances and travel times for each member
            member_travel_info = []
            total_distance = 0
            max_travel_time = 0
            
            for member in members:
                try:
                    member_lat, member_lng = map(float, member.location.split(','))
                    distance = self.calculate_distance(member_lat, member_lng, venue_lat, venue_lng)
                    travel_time = self.estimate_travel_time(distance)
                    
                    member_travel_info.append({
                        "member_name": member.name,
                        "distance_km": round(distance, 2),
                        "travel_time_minutes": travel_time,
                        "travel_modes": {
                            "driving": travel_time,
                            "walking": self.estimate_travel_time(distance, "walking"),
                            "public_transit": self.estimate_travel_time(distance, "public_transit")
                        }
                    })
                    
                    total_distance += distance
                    max_travel_time = max(max_travel_time, travel_time)
                    
                except ValueError:
                    continue
            
            if member_travel_info:
                venue["group_travel_info"] = {
                    "members": member_travel_info,
                    "average_distance_km": round(total_distance / len(members), 2),
                    "max_travel_time_minutes": max_travel_time,
                    "fairness_score": self.calculate_fairness_score(member_travel_info)
                }
                enhanced_venues.append(venue)
        
        # Sort by fairness score and other factors
        enhanced_venues.sort(key=lambda x: (
            x.get("group_travel_info", {}).get("fairness_score", 100),
            x.get("group_travel_info", {}).get("max_travel_time_minutes", 100),
            -x.get("rating", 0)
        ))
        
        return enhanced_venues[:3]  # Return top 3 recommendations
    
    def calculate_fairness_score(self, member_travel_info: List[Dict]) -> float:
        """Calculate fairness score - lower is better (less variance in travel times)"""
        if not member_travel_info:
            return 100
            
        travel_times = [info["travel_time_minutes"] for info in member_travel_info]
        
        if len(travel_times) <= 1:
            return 0
            
        # Calculate variance in travel times
        mean_time = sum(travel_times) / len(travel_times)
        variance = sum((t - mean_time) ** 2 for t in travel_times) / len(travel_times)
        
        return round(variance, 2)
    
    def get_venue_capacity_estimate(self, venue: Dict) -> str:
        """Use LLM to estimate venue capacity based on categories and other info"""
        from langchain_google_genai import ChatGoogleGenerativeAI
        from ...core.config import settings
        
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.1
            )
            
            categories = venue.get("categories", [])
            category_names = [cat.get("name", "") for cat in categories]
            venue_name = venue.get("name", "")
            
            prompt = f"""
            Based on this venue information:
            - Name: {venue_name}
            - Categories: {', '.join(category_names)}
            
            Estimate the group capacity suitability in one short phrase.
            Examples: "Small groups (2-4)", "Medium groups (4-8)", "Large groups welcome", "Individual focused"
            
            Return only the capacity estimate phrase.
            """
            
            response = llm.invoke(prompt)
            return response.content.strip()
            
        except Exception as e:
            print(f"Error estimating capacity with LLM: {e}")
            return "Capacity varies"
    
    def _run(self, members_data: str, meeting_purpose: str = "") -> str:
        """Main execution method for CrewAI"""
        try:
            # Parse members data (expecting JSON string)
            if isinstance(members_data, str):
                members_dict = json.loads(members_data)
            else:
                members_dict = members_data
                
            # Convert to GroupMember objects
            members = []
            for member_data in members_dict:
                member = GroupMember(**member_data)
                members.append(member)
            
            # Search for venues
            venues = self.search_venues_for_group(members, meeting_purpose)
            
            # Format results for agent consumption
            results = {
                "status": "success",
                "meeting_purpose": meeting_purpose,
                "group_size": len(members),
                "centroid_calculated": True,
                "venues_found": len(venues),
                "recommendations": []
            }
            
            for venue in venues:
                recommendation = {
                    "fsq_id": venue.get("fsq_id"),
                    "name": venue.get("name"),
                    "address": venue.get("location", {}).get("formatted_address", "Address not available"),
                    "categories": [cat.get("name") for cat in venue.get("categories", [])],
                    "rating": venue.get("rating", "Not rated"),
                    "price_level": venue.get("price", "Price not available"),
                    "contact": {
                        "phone": venue.get("tel"),
                        "email": venue.get("email"),
                        "website": venue.get("website")
                    },
                    "social_media": venue.get("social_media", {}),
                    "photos": venue.get("photos", []),
                    "hours": venue.get("hours", {}),
                    "capacity_estimate": self.get_venue_capacity_estimate(venue),
                    "group_travel_info": venue.get("group_travel_info", {}),
                    "foursquare_link": venue.get("link")
                }
                results["recommendations"].append(recommendation)
            
            return json.dumps(results, indent=2)
            
        except Exception as e:
            error_result = {
                "status": "error",
                "error": str(e),
                "recommendations": []
            }
            return json.dumps(error_result, indent=2)