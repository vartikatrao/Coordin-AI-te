import os
import json
from crewai.tools import BaseTool
from crewai.llm import LLM

class GroupIntentExtractorTool(BaseTool):
    name: str = "GroupIntentExtractorTool"
    description: str = (
        "Extracts structured group intent from members' natural language inputs "
        "and merges preferences, constraints, and group purpose into a JSON object."
    )

    def _run(self, members_data: str) -> str:
        try:
            members = json.loads(members_data)
        except Exception:
            return json.dumps({"status": "error", "error": "Invalid members_data JSON"})

        # init LLM
        llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))

        prompt = f"""
        You are a group intent extractor.
        Members gave these inputs: {members}.

        Task:
        - Normalize and merge all preferences and constraints.
        - Extract structured intent.
        - Suggest venue categories suitable for Foursquare search.

        Return strictly JSON with keys:
        {{
          "purpose": "string",
          "food": "string or null",
          "ambience": "string or null",
          "budget": "string or null",
          "transport": "string or null",
          "categories": "string, comma-separated (like 'restaurant, cafe')"
        }}
        """

        try:
            response = llm.predict(prompt)   # ✅ fixed from .chat
            # If output is not JSON, fallback
            try:
                json.loads(response)
                return response.strip()
            except:
                return json.dumps({
                    "purpose": "casual hangout",
                    "food": "any",
                    "ambience": "any",
                    "budget": "any",
                    "transport": "any",
                    "categories": "restaurant, cafe"
                })
        except Exception as e:
            return json.dumps({
                "purpose": "casual hangout",
                "food": "any",
                "ambience": "any",
                "budget": "any",
                "transport": "any",
                "categories": "restaurant, cafe",
                "status": "fallback",
                "error": str(e)
            })


