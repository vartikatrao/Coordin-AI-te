from crewai import Agent, Task, Crew
from typing import Dict, Any, List, Optional
import json
from app.core.config import settings
from app.agents.tools.extractor_tool import extractor_tool
from app.agents.tools.location_resolver import resolve_location
from app.agents.tools.foursquare_tool import search_places
from app.agents.tools.categories_tool import category_lookup_tool
from app.agents.ranker_agent import llm_rank_and_explain
from langchain_google_genai import ChatGoogleGenerativeAI

# Default fallback location (Bangalore)
DEFAULT_LAT = 12.9716
DEFAULT_LNG = 77.5946

# Initialize LLM with Gemini
llm = ChatGoogleGenerativeAI(
    model=settings.GEMINI_MODEL,
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.1,
    max_tokens=8000
)

def run_solo_agent(request: dict) -> Dict[str, Any]:
    """
    CrewAI-based workflow for place recommendations using Gemini.
    Handles both form mode (structured dict) and chat mode (text query).
    """
    if not isinstance(request, dict):
        return {"error": "Invalid request format"}

    try:
        # Get user location or use defaults
        fallback_lat = float(request.get("user_lat", DEFAULT_LAT))
        fallback_lng = float(request.get("user_lng", DEFAULT_LNG))

        # Define Agents
        query_analyzer = Agent(
            role="Query Analyzer",
            goal="Extract and normalize user query parameters for place search",
            backstory="You are an expert in understanding user intentions and extracting relevant parameters like purpose, mood, budget, and location from queries.",
            tools=[extractor_tool, category_lookup_tool],
            llm=llm,
            verbose=True
        )

        location_resolver = Agent(
            role="Location Resolver", 
            goal="Resolve user location text to geographic coordinates",
            backstory="You are a skilled geocoder, adept at converting location names to precise coordinates using Foursquare's API.",
            llm=llm,
            verbose=True
        )

        place_searcher = Agent(
            role="Place Searcher",
            goal="Find relevant places using Foursquare API based on user preferences", 
            backstory="You specialize in searching for places that match user criteria, leveraging Foursquare's extensive database.",
            tools=[search_places],
            llm=llm,
            verbose=True
        )

        result_ranker = Agent(
            role="Result Ranker",
            goal="Rank and explain place recommendations based on user preferences",
            backstory="You are an expert in evaluating and ranking options, providing clear explanations for recommendations tailored to user needs.",
            llm=llm,
            verbose=True
        )

        # Define Tasks
        query_task = Task(
            description=f"Extract parameters (purpose, mood, budget, time, transport, location) from the user request: {request}",
            expected_output="A JSON object with extracted parameters: purpose, mood, budget, time, transport, location_text",
            agent=query_analyzer,
            output_json=True
        )

        location_task = Task(
            description=f"Resolve the location text to coordinates, using fallback coordinates {fallback_lat}, {fallback_lng} if needed",
            expected_output="A JSON object with lat, lng, and resolved_from",
            agent=location_resolver,
            context=[query_task],
            output_json=True
        )

        search_task = Task(
            description="Search for places near the resolved location with extracted parameters",
            expected_output="A list of place dictionaries with details like name, rating, distance, etc.",
            agent=place_searcher,
            context=[query_task, location_task],
            output_json=True
        )

        rank_task = Task(
            description="Rank the places based on user preferences and provide scores and explanations",
            expected_output="A JSON object with ranked recommendations, scores, and explanations",
            agent=result_ranker,
            context=[query_task, search_task],
            output_json=True
        )

        # Create Crew
        crew = Crew(
            agents=[query_analyzer, location_resolver, place_searcher, result_ranker],
            tasks=[query_task, location_task, search_task, rank_task],
            verbose=2,
            process="sequential"
        )

        # Execute Crew
        result = crew.kickoff(inputs={"request": request})
        
        # Handle different result types
        if hasattr(result, 'raw'):
            result_content = result.raw
        elif hasattr(result, 'content'):
            result_content = result.content
        else:
            result_content = str(result)
            
        # Ensure result is a dict
        if isinstance(result_content, str):
            try:
                parsed_result = json.loads(result_content)
            except json.JSONDecodeError:
                parsed_result = {
                    "recommendations": [],
                    "message": "Failed to parse result",
                    "suggestions": ["Try a different query", "Check API keys"]
                }
        else:
            parsed_result = result_content

        return parsed_result or {
            "recommendations": [],
            "message": "No places found",
            "suggestions": ["Try a different location", "Broaden your search terms", "Check your time preference"]
        }

    except Exception as e:
        print(f"⚠️ CrewAI error: {e}")
        return {
            "error": "Service temporarily unavailable",
            "retry_suggestion": True,
            "debug_info": str(e)
        }