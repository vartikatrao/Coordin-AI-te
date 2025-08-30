import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import os 

from crewai import Agent, Crew
from crewai.tools import tool
# from langchain_google_genai import ChatGoogleGenerativeAI
from crewai.llm import LLM

from .tools.foursquare_tool_group import FoursquareGroupTool
from .tools.safety_tools import SafetyAssessmentTool
from .group_tasks import create_group_coordination_tasks, create_quick_coordination_tasks
from ..core.config import settings


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GroupCoordinationAgent:
    """Main agent for coordinating group meetups"""
    
    def __init__(self):
        self.foursquare_tool = FoursquareGroupTool()
        self.safety_tool = SafetyAssessmentTool()
        
        # Initialize Gemini 2.5 Flash LLM
        # self.llm = ChatGoogleGenerativeAI(
        #     model="gemini-2.5-flash",
        #     google_api_key=settings.GEMINI_API_KEY,
        #     temperature=0.1,
        #     max_tokens=4000
        # )
        # self.llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
        
        self.agents = self._create_agents()
        self.crew = self._create_crew()
        self.quick_crew = self._create_quick_crew()
    
    def _create_agents(self) -> Dict[str, Agent]:
        """Create all specialized agents for group coordination"""
        llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
        # Requirements Analysis Agent
        requirements_analyzer = Agent(
            role="Group Requirements Analyzer",
            goal="Analyze group member preferences, constraints, and meeting requirements to determine optimal coordination parameters",
            backstory="""You are an expert at understanding group dynamics and spatial coordination. 
            You excel at finding common ground between diverse preferences while respecting individual constraints. 
            You have deep knowledge of location-based optimization and user experience design.""",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )
        
        # Venue Search and Analysis Agent  
        venue_finder = Agent(
            role="Venue Search Specialist",
            goal="Find and evaluate venues that match group requirements using location intelligence",
            backstory="""You are a location intelligence expert with extensive knowledge of venue types, 
            accessibility features, and spatial analysis. You excel at using Foursquare data to find 
            perfect meeting spots that balance convenience, quality, and group preferences.""",
            verbose=True,
            allow_delegation=False,
            tools=[self.foursquare_tool],
            llm=llm
        )
        
        # Safety Assessment Agent
        safety_assessor = Agent(
            role="Safety Assessment Specialist", 
            goal="Evaluate venue and route safety based on real-time conditions and location intelligence",
            backstory="""You are a safety expert who specializes in urban navigation and risk assessment. 
            You understand how time of day, venue density, emergency services proximity, and other factors 
            impact personal safety. You provide practical, actionable safety guidance.""",
            verbose=True,
            allow_delegation=False,
            tools=[self.safety_tool],
            llm=llm
        )
        
        # Optimization Agent
        optimizer = Agent(
            role="Meeting Optimization Expert",
            goal="Optimize venue selection for fairness, convenience, and group satisfaction",
            backstory="""You are a mathematical optimization expert specializing in multi-criteria decision making. 
            You excel at balancing competing objectives like travel time fairness, preference satisfaction, 
            and practical constraints to find optimal solutions for groups.""",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )
        
        # Personalization Agent
        personalizer = Agent(
            role="Personal Experience Designer",
            goal="Create personalized explanations and recommendations for each group member",
            backstory="""You are a UX expert who specializes in personalized experiences and communication. 
            You understand how to explain complex logistics in simple terms while addressing individual 
            concerns and preferences. You excel at making recommendations feel personal and relevant.""",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )
        
        # Coordination Agent
        coordinator = Agent(
            role="Group Coordination Facilitator",
            goal="Synthesize all analyses into clear, actionable coordination recommendations",
            backstory="""You are a project coordination expert who specializes in group logistics and decision-making. 
            You excel at presenting complex information in digestible formats that help groups make 
            confident decisions quickly. You understand the psychology of group coordination.""",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )
        
        return {
            "requirements_analyzer": requirements_analyzer,
            "venue_finder": venue_finder,
            "safety_assessor": safety_assessor,
            "optimizer": optimizer,
            "personalizer": personalizer,
            "coordinator": coordinator
        }
    
    def _create_crew(self) -> Crew:
        """Create the main crew for comprehensive coordination"""
        tasks = create_group_coordination_tasks(self.agents)
        
        return Crew(
            agents=list(self.agents.values()),
            tasks=tasks,
            verbose=True,
            process_type="sequential"
        )
    
    def _create_quick_crew(self) -> Crew:
        """Create quick crew for faster processing"""
        tasks = create_quick_coordination_tasks(self.agents)
        
        # Use subset of agents for quick processing
        quick_agents = [
            self.agents["requirements_analyzer"],
            self.agents["venue_finder"], 
            self.agents["personalizer"]
        ]
        
        return Crew(
            agents=quick_agents,
            tasks=tasks,
            verbose=True,
            process_type="sequential"
        )
    
    def coordinate_group_meetup(self, members: List[Dict], meeting_purpose: str = "", 
                               quick_mode: bool = False) -> Dict[str, Any]:
        """
        Main method to coordinate group meetup
        
        Args:
            members: List of group member dictionaries with name, age, gender, location, preferences, constraints
            meeting_purpose: Optional meeting purpose/type
            quick_mode: Whether to use quick processing mode
        
        Returns:
            Coordination results with venue recommendations and personalized explanations
        """
        start_time = datetime.now()
        
        try:
            # Validate input
            if not members or len(members) < 2:
                return {
                    "status": "error",
                    "error": "At least 2 group members required for coordination",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Prepare input data
            input_data = {
                "members": members,
                "meeting_purpose": meeting_purpose,
                "group_size": len(members),
                "coordination_time": datetime.now().isoformat()
            }
            
            # Execute crew workflow
            if quick_mode:
                logger.info(f"Starting quick group coordination for {len(members)} members")
                crew_result = self.quick_crew.kickoff(inputs=input_data)
            else:
                logger.info(f"Starting full group coordination for {len(members)} members")
                crew_result = self.crew.kickoff(inputs=input_data)
            
            # Process and format results
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            # Parse crew result
            try:
                if isinstance(crew_result, str):
                    result_data = json.loads(crew_result)
                else:
                    result_data = crew_result
            except json.JSONDecodeError:
                result_data = {"raw_output": str(crew_result)}
            
            return {
                "status": "success",
                "coordination_mode": "quick" if quick_mode else "comprehensive",
                "group_size": len(members),
                "meeting_purpose": meeting_purpose,
                "processing_time_seconds": processing_time,
                "timestamp": datetime.now().isoformat(),
                "results": result_data
            }
            
        except Exception as e:
            logger.error(f"Error in group coordination: {str(e)}")
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            return {
                "status": "error",
                "error": str(e),
                "processing_time_seconds": processing_time,
                "timestamp": datetime.now().isoformat()
            }
    
    def analyze_group_preferences(self, members: List[Dict]) -> Dict[str, Any]:
        """Analyze group preferences and compatibility using LLM"""
        try:
            # Get location analysis
            location_analysis = self._analyze_location_spread(members)
            
            # Get LLM-based preference analysis
            preference_insights = self._extract_preference_insights_with_llm(members)
            
            preferences_analysis = {
                "group_size": len(members),
                "age_range": {
                    "min": min(member.get("age", 25) for member in members),
                    "max": max(member.get("age", 25) for member in members)
                },
                "gender_distribution": {},
                "location_spread": location_analysis,
                "llm_analysis": preference_insights,
                "member_details": []
            }
            
            # Analyze gender distribution
            for member in members:
                gender = member.get("gender", "").upper()
                preferences_analysis["gender_distribution"][gender] = preferences_analysis["gender_distribution"].get(gender, 0) + 1
            
            # Add member details for reference
            for member in members:
                preferences_analysis["member_details"].append({
                    "name": member.get("name", ""),
                    "age": member.get("age", 0),
                    "preferences": member.get("preferences", ""),
                    "constraints": member.get("constraints", "")
                })
            
            return {
                "status": "success",
                "analysis": preferences_analysis,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _analyze_location_spread(self, members: List[Dict]) -> Dict[str, Any]:
        """Analyze geographic spread of group members"""
        locations = []
        
        for member in members:
            try:
                lat, lng = map(float, member["location"].split(','))
                locations.append((lat, lng, member["name"]))
            except (ValueError, KeyError):
                continue
        
        if len(locations) < 2:
            return {"status": "insufficient_data"}
        
        # Calculate distances between all pairs
        distances = []
        for i in range(len(locations)):
            for j in range(i + 1, len(locations)):
                lat1, lng1, name1 = locations[i]
                lat2, lng2, name2 = locations[j]
                
                distance = self.foursquare_tool.calculate_distance(lat1, lng1, lat2, lng2)
                distances.append({
                    "from": name1,
                    "to": name2,
                    "distance_km": round(distance, 2)
                })
        
        # Calculate centroid
        centroid_lat = sum(loc[0] for loc in locations) / len(locations)
        centroid_lng = sum(loc[1] for loc in locations) / len(locations)
        
        return {
            "member_count": len(locations),
            "centroid": {
                "latitude": round(centroid_lat, 6),
                "longitude": round(centroid_lng, 6)
            },
            "max_distance_km": max(d["distance_km"] for d in distances),
            "average_distance_km": round(sum(d["distance_km"] for d in distances) / len(distances), 2),
            "pairwise_distances": distances
        }
    
    def _extract_preference_insights_with_llm(self, members: List[Dict]) -> Dict[str, Any]:
        """Use LLM to analyze group preferences and constraints dynamically"""
        try:
            # Prepare member data for LLM analysis
            member_info = []
            for member in members:
                member_info.append(f"- {member['name']}: preferences='{member.get('preferences', '')}', constraints='{member.get('constraints', '')}'")
            
            prompt = f"""
            Analyze this group's preferences and constraints for compatibility:
            
            Group Members:
            {chr(10).join(member_info)}
            
            Identify:
            1. Common preferences that most members share
            2. Conflicting preferences that might cause issues
            3. Critical constraints that must be respected
            4. Overall group compatibility assessment
            
            Return as JSON:
            {{
                "common_preferences": [list of shared preferences],
                "conflicting_preferences": [list of conflicts],
                "critical_constraints": [list of must-respect constraints],
                "compatibility_score": number 0-100,
                "compatibility_notes": "brief explanation"
            }}
            """
            
            response = self.llm.invoke(prompt)
            
            import json
            try:
                analysis = json.loads(response.content.strip())
                return analysis
            except json.JSONDecodeError:
                return self._fallback_preference_analysis(members)
                
        except Exception as e:
            logger.error(f"Error with LLM preference analysis: {e}")
            return self._fallback_preference_analysis(members)
    
    def _fallback_preference_analysis(self, members: List[Dict]) -> Dict[str, Any]:
        """Fallback preference analysis using basic keyword matching"""
        all_preferences = []
        all_constraints = []
        
        for member in members:
            pref_text = member.get("preferences", "").lower()
            const_text = member.get("constraints", "").lower()
            all_preferences.append(pref_text)
            all_constraints.append(const_text)
        
        # Simple keyword analysis
        common_words = ["vegetarian", "quiet", "outdoor", "budget", "wifi"]
        common_prefs = []
        
        for word in common_words:
            count = sum(1 for pref in all_preferences if word in pref)
            if count >= len(members) * 0.5:
                common_prefs.append(word)
        
        constraint_words = ["budget", "accessibility", "parking", "time"]
        critical_constraints = []
        
        for word in constraint_words:
            if any(word in const for const in all_constraints if const.strip()):
                critical_constraints.append(word)
        
        return {
            "common_preferences": common_prefs,
            "conflicting_preferences": [],
            "critical_constraints": critical_constraints,
            "compatibility_score": 70,
            "compatibility_notes": "Basic analysis - upgrade to LLM for detailed insights"
        }


def create_group_agent() -> GroupCoordinationAgent:
    """Factory function to create group coordination agent"""
    return GroupCoordinationAgent()