import os
import json
from crewai.tools import BaseTool
from crewai.llm import LLM


class GroupIntentExtractorTool(BaseTool):
    name: str = "GroupIntentExtractorTool"
    description: str = (
        "Extracts structured group intent from members' preferences and constraints, "
        "and produces a Foursquare-ready search query."
    )

    def _run(self, members_data: str, fair_coords: str = None, meeting_time: str = None) -> str:
        try:
            members = json.loads(members_data) if isinstance(members_data, str) else members_data
        except Exception:
            return json.dumps({"status": "error", "error": "Invalid members_data JSON"})

        llm = LLM(model="gemini/gemini-2.5-flash", provider="gemini", api_key=os.getenv("GEMINI_API_KEY"))

        prompt = f"""
        You are a group coordination specialist. Extract and merge the group's intent from member data.

        Members: {json.dumps(members, indent=2)}
        Fair Coordinates: {fair_coords or "Central Bangalore"}
        Meeting Time: {meeting_time or "Evening"}

        Task: Analyze the group's collective preferences and constraints to create structured intent.

        Return ONLY valid JSON in this exact format:
        {{
            "primary_intent": "string describing main purpose (e.g., 'casual dining', 'study session')",
            "search_query": "optimized Foursquare search string combining key terms",
            "categories": "comma-separated Foursquare categories (e.g., 'restaurant,cafe')",
            "preferences": {{
                "cuisine": ["array of preferred cuisines"],
                "atmosphere": "preferred atmosphere",
                "price_range": "budget preference",
                "accessibility": ["any accessibility needs"]
            }},
            "constraints": {{
                "budget": "budget level",
                "time_preference": "timing constraints",
                "dietary": ["dietary restrictions"],
                "transport": "transport preferences"
            }},
            "explanation": "short reasoning for these choices"
        }}
        """

        # Try to use LLM for intent extraction
        try:
            response = llm.predict(prompt)
            # Clean response and validate JSON
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            json.loads(response)  # validate JSON
            return response.strip()
        except Exception:
            return json.dumps({
                "primary_intent": "casual dining and hangout",
                "search_query": "vegetarian affordable cozy restaurant cafe near metro at night",
                "categories": "restaurant,cafe",
                "preferences": {
                    "cuisine": ["vegetarian", "indian"],
                    "atmosphere": "casual",
                    "price_range": "moderate",
                    "accessibility": []
                },
                "constraints": {
                    "budget": "affordable",
                    "time_preference": "evening",
                    "dietary": ["vegetarian"],
                    "transport": "metro_accessible"
                },
                "explanation": "Fallback intent based on common group preferences"
            })

    def extract_intent(self, members: list, meeting_purpose: str = None) -> dict:
        raw = self._run(json.dumps(members), meeting_purpose=meeting_purpose)
        try:
            return json.loads(raw)
        except Exception:
            return {}


def create_group_intent_extractor_tool():
    return GroupIntentExtractorTool()