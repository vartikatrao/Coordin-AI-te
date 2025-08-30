import requests
import json
import math
from datetime import datetime, time
from typing import List, Dict, Any, Optional
from crewai.tools import BaseTool
from ...core.config import settings
from pydantic import PrivateAttr

class SafetyAssessmentTool(BaseTool):
    name: str = "SafetyAssessmentTool"
    description: str = "Assess safety of venues and routes based on open venues, emergency services, time of day, and ratings"
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
    
    def get_current_hour(self) -> int:
        """Get current hour for time-based safety assessment"""
        return datetime.now().hour
    
    def is_venue_open_now(self, venue_hours: Dict) -> bool:
        """Check if venue is currently open"""
        if not venue_hours or not venue_hours.get("regular"):
            return True  # Assume open if no hours data
            
        current_time = datetime.now()
        current_day = current_time.strftime("%A").lower()
        current_hour = current_time.hour
        current_minute = current_time.minute
        
        day_hours = venue_hours.get("regular", {})
        
        for day_info in day_hours:
            if day_info.get("day", "").lower() == current_day:
                if day_info.get("open"):
                    open_time = day_info["open"]
                    close_time = day_info["close"]
                    
                    # Parse open/close times (format: "HHMM")
                    try:
                        open_hour = int(open_time[:2])
                        open_min = int(open_time[2:])
                        close_hour = int(close_time[:2])
                        close_min = int(close_time[2:])
                        
                        current_minutes = current_hour * 60 + current_minute
                        open_minutes = open_hour * 60 + open_min
                        close_minutes = close_hour * 60 + close_min
                        
                        # Handle overnight hours (close_time < open_time)
                        if close_minutes < open_minutes:
                            return current_minutes >= open_minutes or current_minutes <= close_minutes
                        else:
                            return open_minutes <= current_minutes <= close_minutes
                            
                    except (ValueError, TypeError):
                        return True  # Assume open if time parsing fails
                        
                return False  # Closed today
                
        return True  # Default to open if day not found
    
    def search_nearby_emergency_services(self, lat: float, lng: float, radius: int = 2000) -> List[Dict]:
        """Search for emergency services near a location"""
        url = f"{self.base_url}/search"
        
        # Categories for emergency services
        emergency_categories = "15014,15015,15016"  # Hospitals, Police, Fire stations
        
        params = {
            "ll": f"{lat},{lng}",
            "categories": emergency_categories,
            "radius": radius,
            "limit": 20,
            "fields": "fsq_id,name,categories,location,geocodes,distance,hours"
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("results", [])
            
        except requests.exceptions.RequestException as e:
            print(f"Error searching emergency services: {e}")
            return []
    
    def search_nearby_open_venues(self, lat: float, lng: float, radius: int = 1000) -> List[Dict]:
        """Search for currently open venues near a location"""
        url = f"{self.base_url}/search"
        
        params = {
            "ll": f"{lat},{lng}",
            "radius": radius,
            "limit": 50,
            "fields": "fsq_id,name,categories,location,geocodes,distance,hours,rating"
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            venues = data.get("results", [])
            
            # Filter for currently open venues
            open_venues = []
            for venue in venues:
                if self.is_venue_open_now(venue.get("hours", {})):
                    open_venues.append(venue)
            
            return open_venues
            
        except requests.exceptions.RequestException as e:
            print(f"Error searching open venues: {e}")
            return []
    
    def calculate_time_safety_factor(self, hour: int) -> float:
        """Calculate safety factor based on time of day (0.0 to 1.0)"""
        if 6 <= hour <= 18:  # Daytime (6 AM to 6 PM)
            return 1.0
        elif 19 <= hour <= 22:  # Evening (7 PM to 10 PM)
            return 0.8
        elif 23 <= hour or hour <= 5:  # Late night/early morning
            return 0.4
        else:  # Transition hours
            return 0.6
    
    def calculate_venue_safety_score(self, venue: Dict, emergency_services: List[Dict], 
                                   open_venues: List[Dict]) -> Dict[str, Any]:
        """Calculate comprehensive safety score for a venue"""
        safety_data = {
            "venue_name": venue.get("name", "Unknown"),
            "venue_rating": venue.get("rating", 0),
            "is_currently_open": self.is_venue_open_now(venue.get("hours", {})),
            "time_safety_factor": self.calculate_time_safety_factor(self.get_current_hour()),
            "nearby_emergency_services": 0,
            "nearby_open_venues": 0,
            "overall_safety_score": 0.0,
            "safety_level": "Unknown",
            "safety_recommendations": []
        }
        
        venue_lat = venue.get("geocodes", {}).get("main", {}).get("latitude")
        venue_lng = venue.get("geocodes", {}).get("main", {}).get("longitude")
        
        if not venue_lat or not venue_lng:
            safety_data["safety_level"] = "Cannot assess - location unavailable"
            return safety_data
        
        # Count nearby emergency services within 2km
        nearby_emergency = 0
        for service in emergency_services:
            service_lat = service.get("geocodes", {}).get("main", {}).get("latitude")
            service_lng = service.get("geocodes", {}).get("main", {}).get("longitude")
            
            if service_lat and service_lng:
                distance = self.calculate_distance(venue_lat, venue_lng, service_lat, service_lng)
                if distance <= 2.0:  # Within 2km
                    nearby_emergency += 1
        
        # Count nearby open venues within 1km
        nearby_open = 0
        for open_venue in open_venues:
            open_lat = open_venue.get("geocodes", {}).get("main", {}).get("latitude")
            open_lng = open_venue.get("geocodes", {}).get("main", {}).get("longitude")
            
            if open_lat and open_lng:
                distance = self.calculate_distance(venue_lat, venue_lng, open_lat, open_lng)
                if distance <= 1.0:  # Within 1km
                    nearby_open += 1
        
        safety_data["nearby_emergency_services"] = nearby_emergency
        safety_data["nearby_open_venues"] = nearby_open
        
        # Calculate overall safety score (0-100)
        base_score = 50  # Starting baseline
        
        # Time factor (up to +25 or -25 points)
        time_adjustment = (safety_data["time_safety_factor"] - 0.5) * 50
        
        # Emergency services factor (up to +15 points)
        emergency_adjustment = min(nearby_emergency * 3, 15)
        
        # Open venues factor (up to +15 points)  
        open_venues_adjustment = min(nearby_open * 2, 15)
        
        # Venue rating factor (up to +10 points)
        rating_adjustment = (safety_data["venue_rating"] / 5.0) * 10 if safety_data["venue_rating"] > 0 else 0
        
        # Currently open bonus (+5 points)
        open_bonus = 5 if safety_data["is_currently_open"] else -5
        
        overall_score = base_score + time_adjustment + emergency_adjustment + open_venues_adjustment + rating_adjustment + open_bonus
        overall_score = max(0, min(100, overall_score))  # Clamp between 0-100
        
        safety_data["overall_safety_score"] = round(overall_score, 1)
        
        # Determine safety level
        if overall_score >= 80:
            safety_data["safety_level"] = "Very Safe"
        elif overall_score >= 65:
            safety_data["safety_level"] = "Safe"
        elif overall_score >= 50:
            safety_data["safety_level"] = "Moderately Safe"
        elif overall_score >= 35:
            safety_data["safety_level"] = "Caution Advised"
        else:
            safety_data["safety_level"] = "High Caution Required"
        
        # Generate recommendations
        recommendations = []
        
        if not safety_data["is_currently_open"]:
            recommendations.append("Venue appears to be closed - verify hours before visiting")
        
        if safety_data["time_safety_factor"] < 0.6:
            recommendations.append("Consider visiting during daylight hours for better safety")
        
        if nearby_emergency < 2:
            recommendations.append("Limited emergency services nearby - share your location with friends")
        
        if nearby_open < 3:
            recommendations.append("Few open venues nearby - area may be less active")
        
        if overall_score < 50:
            recommendations.append("Consider alternative venues with better safety profiles")
        
        if len(recommendations) == 0:
            recommendations.append("Good safety profile for the selected time and location")
        
        safety_data["safety_recommendations"] = recommendations
        
        return safety_data
    
    def assess_venues_safety(self, venues: List[Dict]) -> Dict[str, Any]:
        """Assess safety for multiple venues"""
        if not venues:
            return {
                "status": "error",
                "message": "No venues provided for safety assessment",
                "assessments": []
            }
        
        # Get first venue location for emergency services search (assuming venues are in same general area)
        first_venue = venues[0]
        first_lat = first_venue.get("geocodes", {}).get("main", {}).get("latitude")
        first_lng = first_venue.get("geocodes", {}).get("main", {}).get("longitude")
        
        if not first_lat or not first_lng:
            return {
                "status": "error", 
                "message": "Cannot determine venue locations for safety assessment",
                "assessments": []
            }
        
        # Search for emergency services and open venues in the area
        emergency_services = self.search_nearby_emergency_services(first_lat, first_lng)
        open_venues = self.search_nearby_open_venues(first_lat, first_lng)
        
        # Assess each venue
        assessments = []
        for venue in venues:
            safety_data = self.calculate_venue_safety_score(venue, emergency_services, open_venues)
            assessments.append(safety_data)
        
        return {
            "status": "success",
            "assessment_time": datetime.now().isoformat(),
            "area_info": {
                "emergency_services_count": len(emergency_services),
                "open_venues_count": len(open_venues),
                "time_of_assessment": self.get_current_hour()
            },
            "assessments": assessments
        }
    
    def _run(self, venues_data: str) -> str:
        """Main execution method for CrewAI"""
        try:
            # Parse venues data (expecting JSON string)
            if isinstance(venues_data, str):
                venues = json.loads(venues_data)
            else:
                venues = venues_data
            
            # Perform safety assessment
            results = self.assess_venues_safety(venues)
            
            return json.dumps(results, indent=2)
            
        except Exception as e:
            error_result = {
                "status": "error",
                "error": str(e),
                "assessments": []
            }
            return json.dumps(error_result, indent=2)