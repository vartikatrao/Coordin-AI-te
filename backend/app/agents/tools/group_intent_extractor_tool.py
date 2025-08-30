import json
import os
from crewai.tools import BaseTool
from crewai.llm import LLM

class GroupIntentExtractorTool(BaseTool):
    name: str = "GroupIntentExtractorTool"
    description: str = "Extract group intent from member preferences and constraints"

    def _run(self, members_data: str) -> str:
        """Extract group intent from member data"""
        try:
            members = json.loads(members_data) if isinstance(members_data, str) else members_data
        except Exception:
            return json.dumps({"error": "Invalid members data"})

        # Try to use LLM for intent extraction
        try:
            llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
            
            # Prepare member data for LLM analysis
            member_info = []
            for member in members:
                member_info.append(f"- {member.get('name', 'Unknown')}: preferences='{member.get('preferences', '')}', constraints='{member.get('constraints', '')}', group_pref='{member.get('group_pref', '')}'")
            
            prompt = f"""
            Analyze this group's preferences and extract intent for venue search:
            
            Group Members:
            {chr(10).join(member_info)}
            
            Extract and return ONLY a JSON object with:
            {{
                "purpose": "main purpose of the meeting",
                "food": "food preferences mentioned",
                "ambience": "ambience/atmosphere preferences", 
                "budget": "budget preferences",
                "transport": "transport/location preferences",
                "categories": "venue categories (restaurant, cafe, etc)"
            }}
            """
            
            response = llm.predict(prompt)
            json.loads(response)  # validate JSON
            return response.strip()
        except Exception:
            # Fallback to simple extraction
            return json.dumps(self.extract_intent_fallback(members))

    def extract_intent_fallback(self, members: list) -> dict:
        """Fallback intent extraction without LLM"""
        # Collect all preferences and constraints
        all_preferences = []
        all_constraints = []
        all_group_prefs = []

        for member in members:
            if member.get("preferences"):
                all_preferences.append(member["preferences"].lower())
            if member.get("constraints"):
                all_constraints.append(member["constraints"].lower())
            if member.get("group_pref"):
                all_group_prefs.append(member["group_pref"].lower())

        # Extract common food preferences
        food_keywords = ["vegetarian", "vegan", "indian", "chinese", "italian", "pizza", "burger", "coffee", "tea"]
        food_prefs = []
        for keyword in food_keywords:
            if any(keyword in pref for pref in all_preferences):
                food_prefs.append(keyword)

        # Extract constraints
        constraint_keywords = ["budget", "accessible", "parking", "wifi", "quiet", "outdoor"]
        constraints = []
        for keyword in constraint_keywords:
            if any(keyword in const for const in all_constraints):
                constraints.append(keyword)

        # Determine venue categories
        categories = "restaurant, cafe"  # default
        if any("coffee" in pref for pref in all_group_prefs + all_preferences):
            categories = "cafe, coffee shop"
        elif any("bar" in pref for pref in all_group_prefs + all_preferences):
            categories = "bar, pub"
        elif any("work" in pref or "study" in pref for pref in all_group_prefs + all_preferences):
            categories = "cafe, library, coworking"

        # Determine purpose
        purpose = "casual hangout"
        if all_group_prefs:
            purpose = ", ".join(all_group_prefs)

        return {
            "purpose": purpose,
            "food": ", ".join(food_prefs) if food_prefs else "mixed preferences",
            "ambience": "good ambience, cozy",
            "budget": "affordable",
            "transport": "accessible location",
            "categories": categories
        }

    # ✅ Wrapper for agent/tests
    def extract_intent(self, members: list) -> dict:
        members_data = json.dumps(members)
        raw = self._run(members_data)
        try:
            return json.loads(raw)
        except Exception:
            return {
                "purpose": "casual hangout / fun outing",
                "food": "vegetarian",
                "ambience": "good ambience, cozy",
                "budget": "affordable",
                "transport": "near metro",
                "categories": "restaurant, cafe",
                "status": "fallback"
            }