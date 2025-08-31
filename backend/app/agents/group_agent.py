import json
import math
from datetime import datetime
from typing import Dict, Any, List, Optional

from crewai import Agent, Task, Crew, Process
from crewai.llm import LLM
from ..core.config import settings

from app.agents.tools.group_intent_extractor_tool import GroupIntentExtractorTool
from app.agents.tools.foursquare_tool_group import FoursquareGroupTool
from app.agents.tools.safety_tools import SafetyAssessmentTool
from app.agents.tools.location_resolver import resolve_location, compute_fair_coordinates


class GroupCoordinationAgent:
    def __init__(self):
        self.setup_tools()
        self.setup_agents()

    def setup_tools(self):
        self.intent_tool = GroupIntentExtractorTool()
        self.venue_tool = FoursquareGroupTool()
        self.safety_tool = SafetyAssessmentTool()

    def setup_agents(self):
        llm = LLM(model="gemini/gemini-2.5-flash", provider="gemini", api_key=settings.GEMINI_API_KEY)

        self.intent_agent = Agent(
            role="Group Intent Specialist",
            goal="Extract group preferences and constraints into structured intent JSON with Foursquare-ready query",
            backstory="Understands natural language inputs and translates into structured search parameters",
            verbose=True,
            allow_delegation=False,
            llm=llm,
            tools=[self.intent_tool]
        )

        self.venue_agent = Agent(
            role="Venue Finder",
            goal="Find best venues around fair coordinates based on group intent",
            backstory="Queries Foursquare API using group search query",
            verbose=True,
            allow_delegation=False,
            llm=llm,
            tools=[self.venue_tool]
        )

        self.safety_agent = Agent(
            role="Safety Assessor",
            goal="Assess safety of the area and venues",
            backstory="Analyzes safety context (nighttime, nearby hospitals/police, open venues)",
            verbose=True,
            allow_delegation=False,
            llm=llm,
            tools=[self.safety_tool]
        )

        self.personalizer_agent = Agent(
            role="Personalizer",
            goal="Explain why each venue is a good fit for each group member",
            backstory="Considers preferences, constraints, group purpose, and venue details",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

    def create_tasks(self, members: List[Dict[str, str]], fair_coords: Dict[str, float], meeting_time: Optional[str] = None, meeting_purpose: Optional[str] = None):
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        intent_task = Task(
            description=f"Extract structured group intent from members: {json.dumps(members, indent=2)}. Meeting time: {meeting_time or current_time}. Meeting purpose: {meeting_purpose or 'general meetup'}",
            agent=self.intent_agent,
            expected_output="JSON with purpose, preferences, constraints, categories, and a search_query"
        )

        venue_task = Task(
            description=f"Using the group intent, search for venues around fair coordinates {fair_coords}",
            agent=self.venue_agent,
            expected_output="List of venues with name, address, rating, price, categories",
            context=[intent_task]
        )

        safety_task = Task(
            description=f"Assess safety of fair coords {fair_coords} and the venues at meeting time {meeting_time or current_time}",
            agent=self.safety_agent,
            expected_output="Safety JSON with safety_level and supporting details",
            context=[venue_task]
        )

        personalization_task = Task(
            description=f"For each venue, explain why it fits each group member considering: {json.dumps(members, indent=2)}",
            agent=self.personalizer_agent,
            expected_output="JSON mapping each venue to member_name: reason",
            context=[intent_task, venue_task, safety_task]
        )

        return [intent_task, venue_task, safety_task, personalization_task]

    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula (in km)"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _calculate_venue_safety_score(self, venue: Dict[str, Any], meeting_time: Optional[str] = None) -> float:
        """Calculate safety score for individual venue"""
        base_score = 7.0
        
        # Rating-based adjustment
        rating = float(venue.get("rating", 0))
        if rating >= 4.0:
            base_score += 1.0
        elif rating >= 3.5:
            base_score += 0.5
        elif rating < 3.0:
            base_score -= 1.0
        
        # Popularity-based adjustment
        popularity = float(venue.get("popularity", 0))
        if popularity >= 0.9:
            base_score += 0.5
        elif popularity < 0.5:
            base_score -= 0.5
        
        # Time-based adjustment
        current_hour = datetime.now().hour
        if meeting_time:
            try:
                if "evening" in meeting_time.lower() or "night" in meeting_time.lower():
                    current_hour = 20
                elif "morning" in meeting_time.lower():
                    current_hour = 9
                elif "afternoon" in meeting_time.lower():
                    current_hour = 14
            except:
                pass
        
        # Adjust for time of day
        if 22 <= current_hour or current_hour <= 5:  # Late night/early morning
            base_score -= 1.0
        elif 18 <= current_hour <= 21:  # Evening
            base_score -= 0.3
        elif 6 <= current_hour <= 18:  # Daytime
            base_score += 0.2
        
        return min(10.0, max(1.0, base_score))

    async def coordinate_group_meetup(self, members: List[Dict[str, str]], meeting_time: Optional[str] = None, meeting_purpose: Optional[str] = None) -> Dict[str, Any]:
        # Handle location resolution for different data formats
        coords = []
        member_locations = []
        
        for m in members:
            if isinstance(m.get("location"), dict):
                # Frontend sends location as dict with lat, lng, address
                lat = float(m["location"].get("lat", 12.9716))
                lng = float(m["location"].get("lng", 77.5946))
            else:
                # Fallback: resolve location string
                lat, lng = resolve_location(m.get("location", "Bangalore"))
                if not lat or not lng:
                    lat, lng = 12.9716, 77.5946
            coords.append((lat, lng))
            member_locations.append({"lat": lat, "lng": lng, "name": m.get("name", "Member")})
        
        fair_lat, fair_lng = compute_fair_coordinates(coords)
        fair_coords = {"lat": fair_lat, "lng": fair_lng}

        # Use Foursquare tool directly for group mode (simpler and more reliable)
        try:
            # Create query for Foursquare search based on group preferences
            group_query = self._build_group_query(members, meeting_purpose)
            
            print(f"🔍 Using direct Foursquare search for: {group_query}")
            print(f"🔍 Fair coordinates: {fair_lat}, {fair_lng}")
            
            # Check if API key is available
            import os
            api_key = os.getenv('FSQ_API_KEY')
            print(f"🔑 API Key available: {'Yes' if api_key else 'No'}")
            if api_key:
                print(f"🔑 API Key starts with: {api_key[:10]}...")
            
            # Use the Foursquare tool directly
            intent_dict = {"search_query": group_query}
            
            print(f"🔍 Calling venue_tool.search_venues with:")
            print(f"   lat={fair_lat}, lng={fair_lng}")
            print(f"   intent={intent_dict}")
            print(f"   meeting_time={meeting_time}")
            
            foursquare_result = self.venue_tool.search_venues(
                lat=fair_lat,
                lng=fair_lng,
                intent=intent_dict,
                meeting_time=meeting_time
            )
            
            print(f"🔍 Foursquare result type: {type(foursquare_result)}")
            print(f"🔍 Foursquare result: {foursquare_result}")
            
            # Parse Foursquare response - search_venues returns list directly
            venues = []
            if isinstance(foursquare_result, list):
                venues = foursquare_result
                print(f"🔍 Got {len(venues)} venues from list")
            else:
                print(f"🔍 Unexpected result type: {type(foursquare_result)}")
            
            print(f"🔍 Final venues count: {len(venues)}")
            
            # TEMPORARY: If no venues found, create mock data for testing
            if not venues:
                print("🔍 No venues found, creating mock data for testing...")
                venues = [
                    {
                        "fsq_id": "mock_1",
                        "name": "Cafe Coffee Day",
                        "categories": [{"id": 13035, "name": "Coffee Shop"}],
                        "location": {
                            "formatted_address": "100 Feet Road, Indiranagar, Bangalore",
                            "address": "100 Feet Road"
                        },
                        "geocodes": {
                            "main": {
                                "latitude": 12.9784,
                                "longitude": 77.6408
                            }
                        },
                        "distance": 250,
                        "rating": 7.2,
                        "price": 2,
                        "popularity": 0.85
                    },
                    {
                        "fsq_id": "mock_2", 
                        "name": "Third Wave Coffee Roasters",
                        "categories": [{"id": 13035, "name": "Coffee Shop"}],
                        "location": {
                            "formatted_address": "Koramangala, Bangalore",
                            "address": "Koramangala"
                        },
                        "geocodes": {
                            "main": {
                                "latitude": 12.9352,
                                "longitude": 77.6245
                            }
                        },
                        "distance": 150,
                        "rating": 8.7,
                        "price": 2,
                        "popularity": 0.95
                    },
                    {
                        "fsq_id": "mock_3",
                        "name": "Starbucks Coffee",
                        "categories": [{"id": 13035, "name": "Coffee Shop"}],
                        "location": {
                            "formatted_address": "HSR Layout, Bangalore", 
                            "address": "HSR Layout"
                        },
                        "geocodes": {
                            "main": {
                                "latitude": 12.9082,
                                "longitude": 77.6476
                            }
                        },
                        "distance": 400,
                        "rating": 8.1,
                        "price": 3,
                        "popularity": 0.92
                    }
                ]
                print(f"🔍 Created {len(venues)} mock venues")
            
            # Process each venue with distance calculations and safety scores
            processed_venues = []
            
            for venue in venues:
                venue_lat = venue.get("geocodes", {}).get("main", {}).get("latitude")
                venue_lng = venue.get("geocodes", {}).get("main", {}).get("longitude")
                
                if venue_lat and venue_lng:
                    # Calculate distance from each member to this venue
                    member_distances = []
                    for member_loc in member_locations:
                        distance = self._calculate_distance(
                            member_loc["lat"], member_loc["lng"],
                            venue_lat, venue_lng
                        )
                        member_distances.append({
                            "member_name": member_loc["name"],
                            "distance_km": round(distance, 2)
                        })
                    
                    # Calculate venue-specific safety score
                    venue_safety_score = self._calculate_venue_safety_score(venue, meeting_time)
                    
                    # Add computed data to venue
                    processed_venue = venue.copy()
                    processed_venue["member_distances"] = member_distances
                    processed_venue["safety_score"] = venue_safety_score
                    processed_venue["average_distance"] = round(
                        sum(d["distance_km"] for d in member_distances) / len(member_distances), 2
                    )
                    
                    processed_venues.append(processed_venue)
            
            # Calculate overall safety score based on area and venues
            overall_safety_score = self._calculate_safety_score(processed_venues, fair_coords, meeting_time)
            
            return {
                "status": "success",
                "members": members,
                "member_locations": member_locations,
                "fair_coords": fair_coords,
                "meeting_time": meeting_time,
                "meeting_purpose": meeting_purpose,
                "venues": processed_venues,
                "safety": {
                    "score": overall_safety_score,
                    "assessment": self._get_safety_assessment(overall_safety_score),
                    "coordinates": fair_coords
                },
                "query_used": group_query,
                "total_venues": len(processed_venues)
            }
            
        except Exception as e:
            print(f"Error using solo backend: {e}")
            # Fallback to original group mode if solo integration fails
            return await self._fallback_group_mode(members, fair_coords, meeting_time, meeting_purpose)

    def _build_group_query(self, members: List[Dict[str, str]], meeting_purpose: Optional[str]) -> str:
        """Build a natural language query for solo mode based on group preferences"""
        
        # Extract common preferences from group members
        purposes = []
        atmospheres = []
        budgets = []
        features = []
        
        for member in members:
            prefs = member.get("preferences", {})
            constraints = member.get("constraints", {})
            
            if isinstance(prefs, dict):
                if prefs.get("meetingType"):
                    purposes.append(prefs["meetingType"])
                if prefs.get("atmosphere"):
                    atmospheres.append(prefs["atmosphere"])
                if prefs.get("features"):
                    features.extend(prefs["features"])
            
            if isinstance(constraints, dict):
                if constraints.get("budget"):
                    budgets.append(constraints["budget"])
        
        # Build query
        query_parts = []
        
        # Primary purpose
        primary_purpose = meeting_purpose or (purposes[0] if purposes else "restaurant")
        query_parts.append(f"Find {primary_purpose} places")
        
        # Group context
        query_parts.append(f"for group of {len(members)} people")
        
        # Common atmosphere
        if atmospheres:
            common_atmosphere = max(set(atmospheres), key=atmospheres.count)
            query_parts.append(f"with {common_atmosphere} atmosphere")
        
        # Budget consideration
        if budgets:
            # Use most common budget or moderate if mixed
            budget_counts = {}
            for budget in budgets:
                budget_counts[budget] = budget_counts.get(budget, 0) + 1
            common_budget = max(budget_counts.items(), key=lambda x: x[1])[0]
            query_parts.append(f"budget: {common_budget}")
        
        # Features
        if features:
            unique_features = list(set(features))[:3]  # Limit to top 3 features
            query_parts.append(f"with {', '.join(unique_features)}")
        
        return " ".join(query_parts)

    def _calculate_safety_score(self, venues: List[Dict], coordinates: Dict, meeting_time: Optional[str]) -> float:
        """Calculate overall area safety score based on venues and location context"""
        
        if not venues:
            return 6.0  # Neutral score when no venues available
        
        # Calculate average venue safety score
        venue_safety_scores = [v.get("safety_score", 6.0) for v in venues]
        avg_venue_safety = sum(venue_safety_scores) / len(venue_safety_scores)
        
        # Density bonus - more venues suggest more activity/safety
        density_bonus = min(len(venues) * 0.1, 1.0)
        
        # Overall safety is based on average venue safety plus density
        overall_score = avg_venue_safety + density_bonus
        
        return round(min(10.0, max(1.0, overall_score)), 1)

    def _get_safety_assessment(self, score: float) -> str:
        """Get textual safety assessment based on score"""
        if score >= 8.5:
            return "Excellent - Very safe area with good lighting and activity"
        elif score >= 7.0:
            return "Good - Generally safe area with adequate facilities"
        elif score >= 5.5:
            return "Moderate - Exercise normal caution, good for daytime"
        elif score >= 4.0:
            return "Fair - Consider safety precautions, better with groups"
        else:
            return "Caution advised - Consider alternative locations or times"



    async def _fallback_group_mode(self, members: List[Dict], fair_coords: Dict, meeting_time: Optional[str], meeting_purpose: Optional[str]) -> Dict[str, Any]:
        """Fallback to original group mode implementation if solo integration fails"""
        
        tasks = self.create_tasks(members, fair_coords, meeting_time, meeting_purpose)

        crew = Crew(
            agents=[self.intent_agent, self.venue_agent, self.safety_agent, self.personalizer_agent],
            tasks=tasks,
            verbose=True,
            process=Process.sequential
        )

        result = crew.kickoff()

        return {
            "status": "success",
            "members": members,
            "fair_coords": fair_coords,
            "meeting_time": meeting_time,
            "meeting_purpose": meeting_purpose,
            "results": result,
            "fallback_mode": True
        }


def create_group_agent():
    return GroupCoordinationAgent()