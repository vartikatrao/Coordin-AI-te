import json
import os
from datetime import datetime
from typing import Dict, Any

from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool

from .tools.foursquare_tool import create_foursquare_tool
from .tools.location_resolver import create_location_resolver_tool
from .tools.extractor_tool import create_intent_extractor_tool
from .tools.context_analyzer_tool import create_context_analyzer_tool
from crewai.llm import LLM
from ...core.config import settings


class SoloPageAgent:
    """
    Main orchestrator for solo mode place recommendations using CrewAI agents.
    """
    
    def __init__(self, default_location: str = "12.9716,77.5946"):
        self.default_location = default_location
        self.setup_tools()
        self.setup_agents()
    
    # def setup_tools(self):
    #     """Initialize all tools"""
    #     self.foursquare_tool = create_foursquare_tool()
    #     self.location_resolver_tool = create_location_resolver_tool()
    #     self.intent_extractor_tool = create_intent_extractor_tool()
    #     self.context_analyzer_tool = create_context_analyzer_tool()
    def setup_tools(self):

        self.foursquare_tool = create_foursquare_tool()
        self.location_resolver_tool = create_location_resolver_tool()
        
    def setup_agents(self):
        """Setup CrewAI agents with specific roles"""
        llm = LLM(model="gemini/gemini-2.5-flash", api_key=settings.GEMINI_API_KEY)
        # Intent Analysis Agent
        self.intent_agent = Agent(
            role="Intent Analysis Specialist",
            goal="Understand user intent and extract structured information from natural language queries",
            backstory="""You are an expert at understanding human intent from natural language. 
            You can identify what people really want when they ask for places to visit, considering 
            context like time, group composition, budget, and specific needs. You always return 
            structured JSON data for further processing.""",
            verbose=True,
            allow_delegation=False,
            llm = llm
        )
        
        # Location Resolution Agent  
        self.location_agent = Agent(
            role="Location Resolution Expert",
            goal="Convert location references to precise coordinates and resolve geographic queries",
            backstory="""You are a geographic expert who can resolve any location reference to 
            precise coordinates. You understand local geography, neighborhoods, and can handle 
            ambiguous location references by finding the most relevant match.""",
            verbose=True,
            allow_delegation=False,
            llm = llm
        )
        
        # Place Search Agent
        self.search_agent = Agent(
            role="Place Discovery Specialist", 
            goal="Find relevant places using Foursquare API based on user requirements",
            backstory="""You are an expert at finding places using the Foursquare API. You know 
            how to craft optimal search queries, apply appropriate filters, and retrieve detailed 
            information about venues. You understand how to balance different search parameters 
            to get the best results.""",
            verbose=True,
            allow_delegation=False, 
            llm = llm
        )
        
        # Recommendation Agent
        self.recommendation_agent = Agent(
            role="Personalized Recommendation Expert",
            goal="Analyze found places and provide intelligent, context-aware recommendations",
            backstory="""You are a local expert who understands what makes a place perfect for 
            specific situations. You consider user context, timing, group dynamics, and personal 
            preferences to rank and explain recommendations. You provide helpful insights about 
            when to visit, what to expect, and why each place fits the user's needs.""",
            verbose=True,
            allow_delegation=False,
            llm = llm
        )
    
    def create_tasks(self, user_query: str, user_location: str = None) -> list:
        """Create tasks for the crew to execute"""
        
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        location = user_location or self.default_location
        
        # Task 1: Extract Intent
        intent_task = Task(
            description=f"""
            Analyze the user query and extract structured intent information:
            User Query: "{user_query}"
            Current Time: {current_time}
            Default Location: {location}
            
            Use the Intent Extractor tool to understand:
            - What type of places the user wants
            - Location preferences 
            - Group context and size
            - Time constraints
            - Budget and atmosphere preferences
            - Any specific requirements or constraints
            
            Return the extracted information as structured JSON.
            """,
            agent=self.intent_agent,
            expected_output="JSON object containing structured user intent information"
        )
        
        # Task 2: Resolve Location
        location_task = Task(
            description="""
            Based on the extracted intent, resolve the target location to precise coordinates:
            - If user mentioned a specific location, resolve it to coordinates
            - If user wants nearby places, use the default location
            - Provide location context and details
            
            Use the Location Resolver tool to get accurate coordinates.
            """,
            agent=self.location_agent,
            expected_output="Resolved coordinates and location context information",
            context=[intent_task]
        )
        
        # Task 3: Search Places
        search_task = Task(
            description="""
            Search for places using Foursquare API based on the extracted intent and resolved location:
            - Use the search query from intent analysis
            - Apply location coordinates from location resolution
            - Set appropriate filters based on user preferences
            - Retrieve place details for top results
            
            Use the Foursquare tool to find relevant places.
            """,
            agent=self.search_agent,
            expected_output="List of relevant places with details from Foursquare API",
            context=[intent_task, location_task]
        )
        
        return [intent_task, location_task, search_task]
    
    def process_query(self, user_query: str, user_location: str = None) -> Dict[str, Any]:
        """
        Process a user query and return personalized place recommendations.
        
        Args:
            user_query: Natural language query from user
            user_location: Optional user location coordinates (lat,lng)
            
        Returns:
            Dict containing recommendations and analysis
        """
        try:
            # Create tasks
            tasks = self.create_tasks(user_query, user_location)
            
            # Create and run crew
            crew = Crew(
                agents=[self.intent_agent, self.location_agent, self.search_agent],
                tasks=tasks,
                verbose=True,
                process=Process.sequential
            )
            
            # Execute the crew
            result = crew.kickoff()
            
            # Extract the JSON data from the search task result
            try:
                # The crew returns task outputs, get the search task result
                # which should be the last task in our 3-task sequence
                search_task_result = None
                
                # If result has task outputs, extract the search task result
                if hasattr(result, 'tasks_output') and result.tasks_output:
                    # Get the last task (search task)
                    search_task = result.tasks_output[-1]
                    search_task_result = search_task.raw
                elif isinstance(result, str):
                    search_task_result = result
                else:
                    search_task_result = str(result)
                
                # Extract JSON from the search task result
                if search_task_result:
                    # Try to parse as JSON first
                    try:
                        places_data = json.loads(search_task_result)
                    except json.JSONDecodeError:
                        # If it's not JSON, it might be markdown-wrapped JSON
                        # Extract JSON from between ```json and ```
                        import re
                        json_match = re.search(r'```json\s*(.*?)\s*```', search_task_result, re.DOTALL)
                        if json_match:
                            places_data = json.loads(json_match.group(1))
                        else:
                            raise ValueError("Could not extract JSON from result")
                    
                    # Extract just the places array if it's wrapped in a root object
                    if isinstance(places_data, dict) and 'places' in places_data:
                        places_data = places_data['places']
                    
                    return {
                        "status": "success",
                        "query": user_query,
                        "timestamp": datetime.now().isoformat(),
                        "places": places_data
                    }
                else:
                    raise ValueError("No search task result found")
                
            except (json.JSONDecodeError, ValueError) as e:
                # If we can't parse the JSON, return the raw result for debugging
                return {
                    "status": "error",
                    "query": user_query,
                    "error": f"Failed to parse places JSON: {str(e)}",
                    "raw_result": str(result),
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            return {
                "status": "error",
                "query": user_query,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def get_place_details(self, fsq_place_id: str, fields: list = None) -> Dict[str, Any]:
        """Get detailed information about a specific place"""
        try:
            if fields is None:
                fields = ["name", "location", "contact", "hours", "rating", "price", "social_media", "photos"]
            
            result = self.foursquare_tool._run(
                action="details",
                fsq_place_id=fsq_place_id,
                fields=fields
            )
            
            return json.loads(result) if isinstance(result, str) else result
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "fsq_place_id": fsq_place_id
            }


# Factory function to create solo page agent
def create_solo_page_agent(default_location: str = "12.9716,77.5946"):
    """Create and return a SoloPageAgent instance"""
    return SoloPageAgent(default_location=default_location)

# Factory function to run solo page agent
def run_solo_page_agent(user_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Factory function to create and run solo page agent
    """
    agent = SoloPageAgent()
    
    # Extract query and location from input
    user_query = user_input.get("user_query", "")
    user_location = user_input.get("user_location")
    
    return agent.process_query(user_query, user_location)