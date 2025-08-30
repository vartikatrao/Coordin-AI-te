import asyncio
import json
from app.agents.group_agent import create_group_agent
from app.agents.tools.location_resolver import resolve_location, compute_fair_coordinates

async def main():
    print("\n==================================================")
    print("🤝 Group Meetup Coordination (CrewAI Orchestration)")
    print("==================================================\n")

    # Input
    num = int(input("👥 Number of group members: "))
    members = []
    for i in range(num):
        print(f"\n📝 Member {i+1}:")
        name = input("Name: ")
        loc = input("Location: ")
        pref = input("Preferences: ")
        cons = input("Constraints: ")
        group_pref = input("Group purpose: ")
        members.append({"name": name, "location": loc, "preferences": pref, "constraints": cons, "group_pref": group_pref})

    meeting_time = input("\n🕒 Meeting time (optional): ").strip() or None
    meeting_purpose = input("🎯 Meeting purpose (optional): ").strip() or None

    # Step 1: Resolve
    print("\n📍 Step 1: Resolved Locations")
    coords = []
    for m in members:
        lat, lng = resolve_location(m["location"])
        coords.append((lat, lng))
        print(f"   - {m['name']}: {m['location']} → {lat},{lng}")

    fair_coords = compute_fair_coordinates(coords)
    print(f"\n⚖️ Step 2: Fair Meeting Coordinates → {fair_coords}\n")

    # Step 3: CrewAI orchestration
    agent = create_group_agent()
    result = await agent.coordinate_group_meetup(members, meeting_time=meeting_time, meeting_purpose=meeting_purpose)

    # Step 4: Pretty Print Results
    print("\n🎯 Group Intent")
    if result.get("results"):
        intent_data = result["results"].get("intent", {})
        print(json.dumps(intent_data, indent=2))

        print("\n🛡️ Safety Check")
        safety_data = result["results"].get("safety", {})
        print(json.dumps(safety_data, indent=2))

        print("\n🎉 Recommendations")
        venues = result["results"].get("venues", [])
        personalized = result["results"].get("personalized", [])
        for idx, v in enumerate(venues, start=1):
            print(f"{idx}. {v.get('name')} - {v.get('location', {}).get('formatted_address', 'N/A')}")
            for per in personalized:
                if per.get("venue") == v.get("name"):
                    for member, reason in per["why_for_each"].items():
                        print(f"   - {member}: {reason}")
            print()
    else:
        print("No detailed results available")
        print(json.dumps(result, indent=2))

    print("\n✅ Done!\n")

if __name__ == "__main__":
    asyncio.run(main())