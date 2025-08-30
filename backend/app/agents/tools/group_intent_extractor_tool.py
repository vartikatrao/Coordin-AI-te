# import os
# import json
# from crewai.tools import BaseTool
# from crewai.llm import LLM

# class GroupIntentExtractorTool(BaseTool):
#     name: str = "GroupIntentExtractorTool"
#     description: str = (
#         "Extracts structured group intent from members' natural language inputs "
#         "and merges preferences, constraints, and group purpose into a JSON object."
#     )

#     def _run(self, members_data: str) -> str:
#         try:
#             members = json.loads(members_data)
#         except Exception:
#             return json.dumps({"status": "error", "error": "Invalid members_data JSON"})

#         llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))

#         prompt = f"""
#         You are a group intent extractor.
#         Members gave these inputs: {members}.

#         Task:
#         - Normalize and merge all preferences and constraints.
#         - Extract structured intent.
#         - Suggest venue categories suitable for Foursquare search.

#         Return strictly JSON with keys:
#         {{
#           "purpose": "string",
#           "food": "string or null",
#           "ambience": "string or null",
#           "budget": "string or null",
#           "transport": "string or null",
#           "categories": "string, comma-separated (like 'restaurant, cafe')"
#         }}
#         """

#         try:
#             response = llm.predict(prompt)
#             json.loads(response)  # validate
#             return response.strip()
#         except Exception:
#             return json.dumps({
#                 "purpose": "casual hangout / fun outing",
#                 "food": "vegetarian",
#                 "ambience": "good ambience, cozy",
#                 "budget": "affordable",
#                 "transport": "near metro",
#                 "categories": "restaurant, cafe",
#                 "status": "fallback"
#             })

#     # ✅ Wrapper for agent/tests
#     def extract_intent(self, members: list[dict]) -> dict:
#         members_data = json.dumps(members)
#         raw = self._run(members_data)
#         try:
#             return json.loads(raw)
#         except Exception:
#             return {
#                 "purpose": "casual hangout / fun outing",
#                 "food": "vegetarian",
#                 "ambience": "good ambience, cozy",
#                 "budget": "affordable",
#                 "transport": "near metro",
#                 "categories": "restaurant, cafe",
#                 "status": "fallback"
#             }
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
            members = json.loads(members_data)
        except Exception:
            return json.dumps({"status": "error", "error": "Invalid members_data JSON"})

        llm = LLM(model="gemini/gemini-2.5-flash", provider="gemini", api_key=os.getenv("GEMINI_API_KEY"))

        prompt = f"""
        Extract user intent and context from natural language preferences and constraints.

        Members:
        {json.dumps(members, indent=2)}

        Fair Coordinates: {fair_coords}
        Meeting Time: {meeting_time or "not specified"}

        Analyze and return strictly JSON:
        {{
            "primary_intent": "string - main purpose (study, dining, entertainment, nightlife, shopping, etc.)",
            "search_query": "string - optimized natural-language query for Foursquare API",
            "location": {{
                "mentioned_location": "string or null",
                "coordinates": "{fair_coords}"
            }},
            "group_context": {{
                "group_type": "friends, family, couple, business, or general",
                "group_size": "{len(members)}"
            }},
            "time_context": {{
                "time_preference": "morning, afternoon, evening, night, or flexible",
                "urgency": "now, today, this_week, flexible",
                "specific_timing": "{meeting_time or 'null'}"
            }},
            "preferences": {{
                "budget": "budget, moderate, expensive, flexible",
                "atmosphere": "quiet, lively, casual, romantic, professional",
                "specific_features": ["wifi", "parking", "outdoor seating", etc.]
            }},
            "constraints": {{
                "must_have": ["essential requirements"],
                "must_avoid": ["things to avoid"],
                "accessibility": ["accessibility requirements"]
            }},
            "explanation": "short reasoning for these choices"
        }}
        """

        try:
            response = llm.predict(prompt)
            json.loads(response)  # validate
            return response.strip()
        except Exception:
            return json.dumps({
                "primary_intent": "casual dining and hangout",
                "search_query": "vegetarian affordable cozy restaurant cafe near metro at night",
                "location": {
                    "mentioned_location": None,
                    "coordinates": fair_coords or "12.9716,77.5946"
                },
                "group_context": {"group_type": "friends", "group_size": str(len(members))},
                "time_context": {"time_preference": "evening", "urgency": "today", "specific_timing": meeting_time},
                "preferences": {"budget": "affordable", "atmosphere": "cozy", "specific_features": ["vegetarian", "metro accessible"]},
                "constraints": {"must_have": ["vegetarian", "metro connectivity"], "must_avoid": [], "accessibility": []},
                "explanation": "Fallback intent based on sample inputs"
            })

    def extract_intent(self, members: list[dict], fair_coords: str = None, meeting_time: str = None) -> dict:
        raw = self._run(json.dumps(members), fair_coords, meeting_time)
        try:
            return json.loads(raw)
        except Exception:
            return {}
