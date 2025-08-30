from crewai import Task

def create_group_coordination_tasks(agents):
    return [
        Task(
            description="Extract group intent",
            expected_output="A structured JSON object with purpose, preferences, constraints, and suggested venue categories.",
            agent=agents["intent_extractor"]
        ),
        Task(
            description="Find venues around fair coords using Foursquare",
            expected_output="Top 3 venue candidates with travel info for each member.",
            agent=agents["venue_finder"]
        ),
        Task(
            description="Assess safety of recommended venues",
            expected_output="Safety scores and notes for each venue.",
            agent=agents["safety_assessor"]
        ),
        Task(
            description="Personalize explanations for each member",
            expected_output="For each venue, a per-member explanation why it fits their preferences/constraints.",
            agent=agents["personalizer"]
        ),
    ]
