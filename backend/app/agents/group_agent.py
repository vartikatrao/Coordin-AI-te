# import logging
# import json
# from typing import List, Dict, Any, Optional
# from datetime import datetime

# from app.agents.tools.location_resolver import resolve_location, compute_fair_coordinates
# from app.agents.tools.foursquare_tool_group import FoursquareGroupTool
# from app.agents.tools.safety_tools import SafetyAssessmentTool
# from app.agents.tools.group_intent_extractor_tool import GroupIntentExtractorTool

# logger = logging.getLogger(__name__)
# logger.setLevel(logging.INFO)


# class GroupCoordinationAgent:
#     def __init__(self):
#         self.fsq_tool = FoursquareGroupTool()
#         self.safety_tool = SafetyAssessmentTool()
#         self.intent_tool = GroupIntentExtractorTool()

#     async def coordinate_group_meetup(
#         self,
#         members: List[Dict[str, str]],
#         meeting_time: Optional[str] = None
#     ) -> Dict[str, Any]:
#         """
#         Full pipeline for group coordination:
#         1. Resolve locations
#         2. Compute fair coordinates
#         3. Extract group intent
#         4. Find venues
#         5. Assess safety
#         6. Personalize
#         """

#         # STEP 1: Resolve member locations
#         resolved_members = []
#         coords = []
#         logger.info("=== STEP 1: Resolving Locations ===")
#         for m in members:
#             lat, lng = resolve_location(m["location"])
#             if not lat or not lng:
#                 logger.warning(f"❌ Failed to resolve {m['name']} location ({m['location']}), using Bangalore center fallback.")
#                 lat, lng = 12.9716, 77.5946
#             resolved = {
#                 "name": m["name"],
#                 "location_text": m["location"],
#                 "lat": lat,
#                 "lng": lng,
#                 "preferences": m.get("preferences", ""),
#                 "constraints": m.get("constraints", ""),
#                 "group_pref": m.get("group_pref", "")
#             }
#             resolved_members.append(resolved)
#             coords.append((lat, lng))
#             logger.info(f"✅ {m['name']} → {lat},{lng}")

#         # STEP 2: Compute fair coordinates
#         logger.info("=== STEP 2: Computing Fair Coordinates ===")
#         fair_lat, fair_lng = compute_fair_coordinates(coords)
#         if not fair_lat or not fair_lng:
#             logger.warning("❌ Failed to compute fair coords, fallback to first valid.")
#             fair_lat, fair_lng = coords[0]
#         logger.info(f"📍 Fair coords → ({fair_lat},{fair_lng})")

#         # STEP 3: Extract group intent
#         logger.info("=== STEP 3: Extracting Group Intent ===")
#         try:
#             intent_json = self.intent_tool.extract_intent(resolved_members)
#             logger.info(f"🎯 Extracted intent:\n{json.dumps(intent_json, indent=2)}")
#         except Exception as e:
#             logger.error(f"❌ Intent extraction failed: {e}")
#             # fallback: merge text
#             merged_prefs = ", ".join([m["preferences"] for m in resolved_members])
#             merged_constraints = ", ".join([m["constraints"] for m in resolved_members])
#             merged_group = ", ".join([m["group_pref"] for m in resolved_members])
#             intent_json = {
#                 "purpose": merged_group or "casual hangout",
#                 "food": merged_prefs,
#                 "constraints": merged_constraints,
#                 "categories": "restaurant, cafe"
#             }

#         # STEP 4: Find venues with Foursquare
#         logger.info("=== STEP 4: Searching Venues ===")
#         try:
#             venues = self.fsq_tool.search_venues(
#                 lat=fair_lat,
#                 lng=fair_lng,
#                 intent=intent_json,
#                 meeting_time=meeting_time
#             )
#             if not venues:
#                 logger.warning("❌ No venues found, fallback to generic query.")
#                 venues = self.fsq_tool.search_venues(
#                     lat=fair_lat,
#                     lng=fair_lng,
#                     intent={"categories": "restaurant, cafe"},
#                     meeting_time=meeting_time
#                 )
#             logger.info(f"🏬 Found {len(venues)} venues")
#         except Exception as e:
#             logger.error(f"❌ Venue search failed: {e}")
#             venues = []

#         # STEP 5: Safety assessment
#         logger.info("=== STEP 5: Assessing Safety ===")
#         safety = {}
#         try:
#             safety = self.safety_tool.assess_area(fair_lat, fair_lng, meeting_time)
#             logger.info(f"🛡️ Safety assessment: {json.dumps(safety, indent=2)}")
#         except Exception as e:
#             logger.error(f"❌ Safety tool failed: {e}")

#         # STEP 6: Personalization
#         import os
#         import json
#         from crewai.llm import LLM
#         ...

#         # STEP 6: Personalization
#         logger.info("=== STEP 6: Personalizing Explanations with LLM ===")
#         llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))

#         personalized = []
#         for v in venues:
#             prompt = f"""
#             You are helping explain why a recommended venue is a good fit for each member of a group.

#             Venue details:
#             - Name: {v.get('name')}
#             - Address: {v.get('address')}
#             - Rating: {v.get('rating')}
#             - Categories: {v.get('categories')}
#             - Price: {v.get('price')}

#             Group intent (merged preferences):
#             {json.dumps(intent_json, indent=2)}

#             Members:
#             {json.dumps(resolved_members, indent=2)}

#             Task:
#             For each member, explain in 1 short bullet (max 2 sentences) why this venue fits
#             their preferences, constraints, and group purpose. 
#             Return STRICTLY valid JSON in this format:
#             {{
#             "MemberName1": "reason",
#             "MemberName2": "reason",
#             ...
#             }}
#             """

#             try:
#                 response = llm.predict(prompt)
#                 reasons = json.loads(response)   # parse JSON
#             except Exception as e:
#                 reasons = {m["name"]: f"General fit (fallback, error: {e})" for m in resolved_members}

#             entry = {
#                 "venue": v.get("name"),
#                 "address": v.get("address"),
#                 "why_for_each": reasons
#             }
#             personalized.append(entry)


#         # Final result
#         return {
#             "fair_coords": (fair_lat, fair_lng),
#             "intent": intent_json,
#             "venues": venues,
#             "safety": safety,
#             "personalized": personalized
#         }


# def create_group_agent():
#     return GroupCoordinationAgent()

import json
from datetime import datetime
from typing import Dict, Any, List, Optional

from crewai import Agent, Task, Crew, Process
from crewai.llm import LLM
from ..core.config import settings

from app.agents.tools.group_intent_extractor_tool import GroupIntentExtractorTool
from app.agents.tools.foursquare_tool_group import FoursquareGroupTool
from app.agents.tools.safety_tools import SafetyAssessmentTool
from app.agents.tools.location_resolver import resolve_location, compute_fair_coordinates


class GroupCoordinationAgent:
    def __init__(self):
        self.setup_tools()
        self.setup_agents()

    def setup_tools(self):
        self.intent_tool = GroupIntentExtractorTool()
        self.venue_tool = FoursquareGroupTool()
        self.safety_tool = SafetyAssessmentTool()

    def setup_agents(self):
        llm = LLM(model="gemini/gemini-2.5-flash", provider="gemini", api_key=settings.GEMINI_API_KEY)

        self.intent_agent = Agent(
            role="Group Intent Specialist",
            goal="Extract group preferences and constraints into structured intent JSON with Foursquare-ready query",
            backstory="Understands natural language inputs and translates into structured search parameters",
            verbose=True,
            allow_delegation=False,
            llm=llm,
            tools=[self.intent_tool]
        )

        self.venue_agent = Agent(
            role="Venue Finder",
            goal="Find best venues around fair coordinates based on group intent",
            backstory="Queries Foursquare API using group search query",
            verbose=True,
            allow_delegation=False,
            llm=llm,
            tools=[self.venue_tool]
        )

        self.safety_agent = Agent(
            role="Safety Assessor",
            goal="Assess safety of the area and venues",
            backstory="Analyzes safety context (nighttime, nearby hospitals/police, open venues)",
            verbose=True,
            allow_delegation=False,
            llm=llm,
            tools=[self.safety_tool]
        )

        self.personalizer_agent = Agent(
            role="Personalizer",
            goal="Explain why each venue is a good fit for each group member",
            backstory="Considers preferences, constraints, group purpose, and venue details",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

    def create_tasks(self, members: List[Dict[str, str]], fair_coords: Dict[str, float], meeting_time: Optional[str] = None):
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        intent_task = Task(
            description=f"Extract structured group intent from members: {json.dumps(members, indent=2)}. Meeting time: {meeting_time or current_time}",
            agent=self.intent_agent,
            expected_output="JSON with purpose, preferences, constraints, categories, and a search_query"
        )

        venue_task = Task(
            description=f"Using the group intent, search for venues around fair coordinates {fair_coords}",
            agent=self.venue_agent,
            expected_output="List of venues with name, address, rating, price, categories",
            context=[intent_task]
        )

        safety_task = Task(
            description=f"Assess safety of fair coords {fair_coords} and the venues at meeting time {meeting_time or current_time}",
            agent=self.safety_agent,
            expected_output="Safety JSON with safety_level and supporting details",
            context=[venue_task]
        )

        personalization_task = Task(
            description=f"For each venue, explain why it fits each group member considering: {json.dumps(members, indent=2)}",
            agent=self.personalizer_agent,
            expected_output="JSON mapping each venue to member_name: reason",
            context=[intent_task, venue_task, safety_task]
        )

        return [intent_task, venue_task, safety_task, personalization_task]

    async def coordinate_group_meetup(self, members: List[Dict[str, str]], meeting_time: Optional[str] = None) -> Dict[str, Any]:
        coords = [resolve_location(m["location"]) for m in members]
        fair_lat, fair_lng = compute_fair_coordinates(coords)
        fair_coords = {"lat": fair_lat, "lng": fair_lng}

        tasks = self.create_tasks(members, fair_coords, meeting_time)

        crew = Crew(
            agents=[self.intent_agent, self.venue_agent, self.safety_agent, self.personalizer_agent],
            tasks=tasks,
            verbose=True,
            process=Process.sequential
        )

        result = crew.kickoff()

        return {
            "status": "success",
            "members": members,
            "fair_coords": fair_coords,
            "meeting_time": meeting_time,
            "results": result
        }


def create_group_agent():
    return GroupCoordinationAgent()
