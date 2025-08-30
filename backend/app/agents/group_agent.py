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

    def create_tasks(self, members: List[Dict[str, str]], fair_coords: Dict[str, float], meeting_time: Optional[str] = None, meeting_purpose: Optional[str] = None):
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        intent_task = Task(
            description=f"Extract structured group intent from members: {json.dumps(members, indent=2)}. Meeting time: {meeting_time or current_time}. Meeting purpose: {meeting_purpose or 'general meetup'}",
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

    async def coordinate_group_meetup(self, members: List[Dict[str, str]], meeting_time: Optional[str] = None, meeting_purpose: Optional[str] = None) -> Dict[str, Any]:
        # Handle location resolution for different data formats
        coords = []
        for m in members:
            if isinstance(m.get("location"), dict):
                # Frontend sends location as dict with lat, lng, address
                lat = float(m["location"].get("lat", 12.9716))
                lng = float(m["location"].get("lng", 77.5946))
            else:
                # Fallback: resolve location string
                lat, lng = resolve_location(m.get("location", "Bangalore"))
                if not lat or not lng:
                    lat, lng = 12.9716, 77.5946
            coords.append((lat, lng))
        
        fair_lat, fair_lng = compute_fair_coordinates(coords)
        fair_coords = {"lat": fair_lat, "lng": fair_lng}

        tasks = self.create_tasks(members, fair_coords, meeting_time, meeting_purpose)

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
            "meeting_purpose": meeting_purpose,
            "results": result
        }


def create_group_agent():
    return GroupCoordinationAgent()