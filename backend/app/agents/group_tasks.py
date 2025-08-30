# from crewai import Task

# def create_group_coordination_tasks(agents):
#     return [
#         Task(
#             description="Extract group intent",
#             expected_output="A structured JSON object with purpose, preferences, constraints, and suggested venue categories.",
#             agent=agents["intent_extractor"]
#         ),
#         Task(
#             description="Find venues around fair coords using Foursquare",
#             expected_output="Top 3 venue candidates with travel info for each member.",
#             agent=agents["venue_finder"]
#         ),
#         Task(
#             description="Assess safety of recommended venues",
#             expected_output="Safety scores and notes for each venue.",
#             agent=agents["safety_assessor"]
#         ),
#         Task(
#             description="Personalize explanations for each member",
#             expected_output="For each venue, a per-member explanation why it fits their preferences/constraints.",
#             agent=agents["personalizer"]
#         ),
#     ]
from crewai import Task

def create_group_coordination_tasks(agents, members, fair_coords, meeting_time):
    return [
        Task(
            description=f"Extract structured group intent from {members} at time {meeting_time}",
            agent=agents["intent_extractor"],
            expected_output="JSON with group purpose, preferences, constraints, categories, and search_query"
        ),
        Task(
            description=f"Find venues around fair coordinates {fair_coords} using group intent",
            agent=agents["venue_finder"],
            expected_output="Top venue list with details",
            context=["intent_extractor"]
        ),
        Task(
            description=f"Assess safety around coords {fair_coords} and venues for meeting time {meeting_time}",
            agent=agents["safety_assessor"],
            expected_output="Safety JSON",
            context=["venue_finder"]
        ),
        Task(
            description=f"Explain why each venue fits each member from {members}",
            agent=agents["personalizer"],
            expected_output="Venue → member_name: reason JSON",
            context=["intent_extractor", "venue_finder", "safety_assessor"]
        )
    ]
