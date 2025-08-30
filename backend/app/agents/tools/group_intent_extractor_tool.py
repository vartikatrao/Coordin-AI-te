import json
import os
from crewai.tools import BaseTool
from crewai.llm import LLM

class GroupIntentExtractorTool(BaseTool):
    name: str = "GroupIntentExtractorTool"
    description: str = "Extract group intent from member preferences and constraints"

    def _run(self, members_data: str, meeting_purpose: str = None) -> str:
        """Extract group intent from member data and meeting purpose"""
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
            
            # Include meeting purpose if provided
            purpose_context = f"\nMeeting Purpose: {meeting_purpose}" if meeting_purpose else ""
            
            prompt = f"""
            Analyze this group's preferences and extract intent for venue search:
            
            Group Members:
            {chr(10).join(member_info)}{purpose_context}
            
            Extract and return ONLY a JSON object with:
            {{
                "purpose": "main purpose of the meeting",
                "food": "food preferences mentioned",
                "ambience": "ambience/atmosphere preferences", 
                "budget": "budget preferences",
                "transport": "transport/location preferences",
                "categories": "venue categories (restaurant, cafe, etc)"
            }}
            
            IMPORTANT: If the meeting purpose mentions 'work', 'study', 'library', or 'coworking', set categories to 'library, coworking, cafe'.
            If it mentions 'coffee' or 'cafe', use 'cafe, coffee shop'.
            If it mentions 'restaurant', 'food', 'dining', use 'restaurant, cafe'.
            If it mentions 'entertainment', 'fun', 'game', 'movie', use 'entertainment, arcade, cinema, bowling'.
            If it mentions 'shopping', 'mall', use 'shopping, mall, retail'.
            If it mentions 'fitness', 'gym', 'sport', use 'gym, fitness, sports'.
            """
            
            response = llm.predict(prompt)
            json.loads(response)  # validate JSON
            return response.strip()
        except Exception:
            # Fallback to simple extraction
            return json.dumps(self.extract_intent_fallback(members, meeting_purpose))

    def extract_intent_fallback(self, members: list, meeting_purpose: str = None) -> dict:
        """Fallback intent extraction without LLM"""
        # Collect all preferences and constraints
        all_preferences = []
        all_constraints = []
        all_group_prefs = []

        for member in members:
            if member.get("preferences"):
                pref = member["preferences"]
                if isinstance(pref, str):
                    all_preferences.append(pref.lower())
                else:
                    all_preferences.append(str(pref).lower())
            if member.get("constraints"):
                const = member["constraints"]
                if isinstance(const, str):
                    all_constraints.append(const.lower())
                else:
                    all_constraints.append(str(const).lower())
            if member.get("group_pref"):
                gpref = member["group_pref"]
                if isinstance(gpref, str):
                    all_group_prefs.append(gpref.lower())
                else:
                    all_group_prefs.append(str(gpref).lower())

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

        # Determine venue categories - check meeting purpose first
        categories = "restaurant, cafe"  # default
        meeting_purpose_lower = meeting_purpose.lower() if meeting_purpose else ""
        
        # Priority: meeting purpose overrides member preferences
        if "work" in meeting_purpose_lower or "study" in meeting_purpose_lower or "library" in meeting_purpose_lower or "coworking" in meeting_purpose_lower:
            categories = "library, coworking, cafe"
        elif "coffee" in meeting_purpose_lower or "cafe" in meeting_purpose_lower:
            categories = "cafe, coffee shop"
        elif "restaurant" in meeting_purpose_lower or "food" in meeting_purpose_lower or "dining" in meeting_purpose_lower:
            categories = "restaurant, cafe"
        elif "entertainment" in meeting_purpose_lower or "fun" in meeting_purpose_lower or "game" in meeting_purpose_lower or "movie" in meeting_purpose_lower:
            categories = "entertainment, arcade, cinema, bowling"
        elif "shopping" in meeting_purpose_lower or "mall" in meeting_purpose_lower:
            categories = "shopping, mall, retail"
        elif "fitness" in meeting_purpose_lower or "gym" in meeting_purpose_lower or "sport" in meeting_purpose_lower:
            categories = "gym, fitness, sports"
        elif "bar" in meeting_purpose_lower or "pub" in meeting_purpose_lower:
            categories = "bar, pub"
        # Fallback to member preferences if meeting purpose doesn't specify
        elif any("coffee" in pref for pref in all_group_prefs + all_preferences):
            categories = "cafe, coffee shop"
        elif any("bar" in pref for pref in all_group_prefs + all_preferences):
            categories = "bar, pub"
        elif any("work" in pref or "study" in pref for pref in all_group_prefs + all_preferences):
            categories = "cafe, library, coworking"

        # Determine purpose - use meeting purpose if available
        if meeting_purpose:
            purpose = meeting_purpose
        elif all_group_prefs:
            purpose = ", ".join(all_group_prefs)
        else:
            purpose = "casual hangout"

        return {
            "purpose": purpose,
            "food": ", ".join(food_prefs) if food_prefs else "mixed preferences",
            "ambience": "good ambience, cozy",
            "budget": "affordable",
            "transport": "accessible location",
            "categories": categories
        }

    # ✅ Wrapper for agent/tests
    def extract_intent(self, members: list, meeting_purpose: str = None) -> dict:
        members_data = json.dumps(members)
        raw = self._run(members_data, meeting_purpose)
        try:
            return json.loads(raw)
        except Exception:
            return {
                "purpose": meeting_purpose or "casual hangout / fun outing",
                "food": "vegetarian",
                "ambience": "good ambience, cozy",
                "budget": "affordable",
                "transport": "near metro",
                "categories": "restaurant, cafe",
                "status": "fallback"
            }