import json
from crewai.tools import BaseTool

class GroupIntentExtractorTool(BaseTool):
    name: str = "GroupIntentExtractorTool"
    description: str = "Extract group intent from member preferences and constraints"

    def _run(self, members_data: str) -> str:
        """Extract group intent from member data"""
        try:
            members = json.loads(members_data) if isinstance(members_data, str) else members_data
        except Exception:
            return json.dumps({"error": "Invalid members data"})

        return json.dumps(self.extract_intent(members))

    def extract_intent(self, members: list) -> dict:
        """Extract structured intent from group members"""
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
            "constraints": ", ".join(constraints) if constraints else "flexible",
            "categories": categories
        }