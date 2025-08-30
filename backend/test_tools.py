import asyncio
import json

from app.agents.tools.location_resolver import resolve_location, compute_fair_coordinates
from app.agents.tools.group_intent_extractor_tool import GroupIntentExtractorTool
from app.agents.tools.foursquare_tool_group import FoursquareGroupTool
from app.agents.tools.safety_tools import SafetyAssessmentTool


async def test_location_resolver():
    print("\n=== TEST 1: Location Resolver ===")
    locs = ["Jayanagar Bangalore", "Indiranagar Bangalore"]
    results = []
    for l in locs:
        lat, lng = resolve_location(l)
        results.append((lat, lng))
        print(f"{l} → {lat}, {lng}")
    fair = compute_fair_coordinates(results)
    print(f"Fair coords → {fair}")


async def test_intent_extractor():
    print("\n=== TEST 2: Group Intent Extractor ===")
    members = [
        {"name": "sakshi", "location": "jayanagar", "preferences": "good veg food", "constraints": "metro connectivity", "group_pref": "casual hangout"},
        {"name": "abhin", "location": "indiranagar", "preferences": "good ambience", "constraints": "affordable", "group_pref": "fun outing"}
    ]
    extractor = GroupIntentExtractorTool()
    intent = extractor.extract_intent(members)
    print("Extracted Intent JSON:")
    print(json.dumps(intent, indent=2))


async def test_foursquare_tool():
    print("\n=== TEST 3: Foursquare Group Tool ===")
    tool = FoursquareGroupTool()
    lat, lng = 12.9716, 77.5946  # Bangalore center
    intent = {
        "purpose": "casual hangout",
        "food": "vegetarian",
        "ambience": "cozy",
        "budget": "affordable",
        "transport": "near metro",
        "categories": "restaurant, cafe"
    }
    venues = tool.search_venues(lat, lng, intent, meeting_time=None)
    print(f"Found {len(venues)} venues")
    for v in venues[:3]:
        print(json.dumps(v, indent=2))


async def test_safety_tool():
    print("\n=== TEST 4: Safety Assessment Tool ===")
    tool = SafetyAssessmentTool()
    lat, lng = 12.9716, 77.5946
    safety = tool.assess_area(lat, lng, meeting_time=None)
    print("Safety Assessment:")
    print(json.dumps(safety, indent=2))


async def main():
    await test_location_resolver()
    await test_intent_extractor()
    await test_foursquare_tool()
    await test_safety_tool()


if __name__ == "__main__":
    asyncio.run(main())
