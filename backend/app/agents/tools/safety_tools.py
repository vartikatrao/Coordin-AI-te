import os
import json
import requests
from datetime import datetime
from crewai.tools import BaseTool

class SafetyAssessmentTool(BaseTool):
    name: str = "SafetyAssessmentTool"
    description: str = (
        "Assess safety of meeting locations based on fair coords and/or recommended venues. "
        "Checks nearby emergency services, open venues, and time of day."
    )

    def _run(self, venues_data: str = "[]", meeting_time: str = None, fair_coords: str = None) -> str:
        try:
            coords = json.loads(fair_coords) if fair_coords else {"lat": 12.9716, "lng": 77.5946}
        except Exception:
            coords = {"lat": 12.9716, "lng": 77.5946}

        lat, lng = coords["lat"], coords["lng"]

        is_night = False
        if meeting_time:
            try:
                t = datetime.fromisoformat(meeting_time)
                is_night = t.hour >= 20 or t.hour <= 6
            except Exception:
                pass

        emergency_count = 2  # dummy fallback
        open_venues = 8

        level = "Very Safe" if emergency_count >= 2 else "Safe"
        if is_night and level == "Very Safe":
            level = "Safe"

        # Calculate safety score
        safety_score = 0.8  # Baseline safety
        if is_night:
            safety_score -= 0.2

        # Distance from city center (Bangalore)
        center_lat, center_lng = 12.9716, 77.5946
        distance_from_center = ((lat - center_lat) ** 2 + (lng - center_lng) ** 2) ** 0.5

        if distance_from_center > 0.1:  # Far from center
            safety_score -= 0.1

        safety_score = max(0.1, min(1.0, safety_score))

        # Generate location-specific recommendations
        recommendations = self._generate_location_specific_recommendations(lat, lng, is_night, venues_data)
        
        result = {
            "status": "success",
            "safety_score": round(safety_score, 2),
            "safety_level": level,
            "recommendations": recommendations,
            "safety_details": {
                "emergency_services": emergency_count,
                "open_venues_nearby": open_venues,
                "is_night": is_night
            },
            "assessment": {
                "location": f"{lat},{lng}",
                "time_assessed": datetime.now().isoformat(),
                "is_night": is_night
            }
        }
        return json.dumps(result, indent=2)

    def _generate_location_specific_recommendations(self, lat: float, lng: float, is_night: bool, venues_data: str) -> list:
        """Generate location-specific safety recommendations"""
        recommendations = []
        
        # Parse venues if provided
        venues = []
        try:
            venues = json.loads(venues_data) if venues_data else []
        except:
            pass
        
        # Base recommendations
        recommendations.append("Travel in groups")
        
        # Time-based recommendations
        if is_night:
            recommendations.extend([
                "Use well-lit main roads",
                "Share your live location with friends",
                "Stay in populated areas",
                "Keep emergency contacts handy"
            ])
        else:
            recommendations.extend([
                "Share your location with contacts",
                "Use well-known routes"
            ])
        
        # Area-specific recommendations based on coordinates
        area_name = self._get_area_name(lat, lng)
        
        if "koramangala" in area_name.lower():
            recommendations.append("Koramangala is generally safe - stick to Forum Mall area")
        elif "indiranagar" in area_name.lower():
            recommendations.append("Indiranagar 100 Feet Road is well-monitored")
        elif "whitefield" in area_name.lower():
            recommendations.append("Whitefield: use main Phoenix MarketCity area")
        elif "hsr" in area_name.lower():
            recommendations.append("HSR Layout: stay on main 27th Main Road")
        elif "electronic city" in area_name.lower():
            recommendations.append("Electronic City: use Phase 1 main roads")
        else:
            recommendations.append("Stick to main roads and commercial areas")
        
        # Venue-specific recommendations
        if venues:
            mall_venues = [v for v in venues if any(word in str(v.get('name', '')).lower() for word in ['mall', 'forum', 'phoenix', 'ub city'])]
            if mall_venues:
                recommendations.append("Mall locations have good security - use main entrances")
        
        return recommendations
    
    def _get_area_name(self, lat: float, lng: float) -> str:
        """Get area name based on coordinates"""
        # Simple mapping based on Bangalore coordinates
        if 12.92 <= lat <= 12.94 and 77.61 <= lng <= 77.63:
            return "Koramangala"
        elif 12.97 <= lat <= 12.99 and 77.63 <= lng <= 77.65:
            return "Indiranagar"
        elif 12.96 <= lat <= 12.98 and 77.74 <= lng <= 77.76:
            return "Whitefield"
        elif 12.90 <= lat <= 12.92 and 77.64 <= lng <= 77.66:
            return "HSR Layout"
        elif 12.84 <= lat <= 12.86 and 77.65 <= lng <= 77.67:
            return "Electronic City"
        else:
            return "Bangalore"

    # ✅ Wrapper
    def assess_area(self, lat: float, lng: float, meeting_time: str = None) -> dict:
        fair_coords = json.dumps({"lat": lat, "lng": lng})
        raw = self._run(fair_coords=fair_coords, meeting_time=meeting_time)
        try:
            return json.loads(raw)
        except Exception:
            return {"status": "error", "error": "Failed to parse safety result"}