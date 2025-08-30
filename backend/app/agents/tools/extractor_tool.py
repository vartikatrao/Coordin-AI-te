
import json
from typing import Dict, Any
from crewai.tools import BaseTool
from datetime import datetime


class IntentExtractorTool(BaseTool):
    name: str = "Intent Extractor"
    description: str = """
    Extract user intent and context from natural language queries using LLM reasoning.
    This tool analyzes user input and returns structured JSON with:
    - Primary intent/purpose
    - Location preferences
    - Group composition and size
    - Time context
    - Budget/price preferences
    - Specific requirements or constraints
    
    Use this tool first to understand what the user wants before searching for places.
    """
    
    def _run(self, user_query: str, current_time: str = None, user_location: str = "12.9716,77.5946") -> str:
        """
        Analyze user query and extract structured intent information.
        This will be processed by the LLM agent to understand user needs.
        """
        
        if not current_time:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Return structured prompt for LLM to process
        extraction_prompt = f"""
        Analyze the following user query and extract structured information in JSON format:
        
        User Query: "{user_query}"
        Current Time: {current_time}
        User Default Location: {user_location}
        
        Please extract and return a JSON object with the following structure:
        {{
            "primary_intent": "string - main purpose (study, dining, entertainment, nightlife, shopping, etc.)",
            "search_query": "string - optimized search term for Foursquare API",
            "location": {{
                "mentioned_location": "string - any specific location mentioned or null",
                "is_nearby_search": "boolean - if user wants places near their current location",
                "coordinates": "string - lat,lng if location resolved or default location"
            }},
            "group_context": {{
                "group_type": "string - family, friends, couple, business, solo, or general",
                "group_size": "number - estimated number of people or null",
                "special_requirements": "array - any specific needs (kid-friendly, pet-friendly, etc.)"
            }},
            "time_context": {{
                "time_preference": "string - morning, afternoon, evening, night, or flexible",
                "urgency": "string - now, today, this_week, flexible",
                "specific_timing": "string - any specific time mentioned or null"
            }},
            "preferences": {{
                "budget": "string - budget, moderate, expensive, or flexible",
                "atmosphere": "string - quiet, lively, romantic, casual, professional, etc.",
                "specific_features": "array - wifi, parking, outdoor seating, etc."
            }},
            "constraints": {{
                "must_have": "array - essential requirements",
                "must_avoid": "array - things to avoid (bars for family, noisy places for study, etc.)",
                "accessibility": "array - any accessibility requirements"
            }},
            "explanation": "string - brief explanation of why these choices were made"
        }}
        
        Consider context clues:
        - "family dinner" should avoid bars/pubs, prefer family-friendly restaurants
        - "study places" should prioritize quiet environments like libraries, cafes with wifi
        - "fun tonight" should consider current time and suggest appropriate entertainment
        - Extract budget hints from words like "affordable", "cheap", "premium", etc.
        - Consider group size and composition for appropriate venue suggestions
        
        Return only the JSON object, no additional text.
        """
        
        return extraction_prompt


def create_intent_extractor_tool():
    return IntentExtractorTool()