import asyncio
import logging
from app.agents.group_agent import create_group_agent
from app.agents.tools.location_resolver import resolve_location, compute_fair_coordinates

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    print("\n==================================================")
    print("🤝 Group Meetup Coordination")
    print("   Find safe, fair venues using Foursquare        ")
    print("==================================================\n")

    # Step 1: Collect input
    num = int(input("👥 Number of group members (2-8): "))
    members = []
    for i in range(num):
        print(f"\n📝 Member {i+1}:")
        name = input("Name: ")
        loc = input("Location: ")
        pref = input("Preferences: ")
        cons = input("Constraints: ")
        group_pref = input("Group preference/purpose: ")

        members.append({
            "name": name.strip(),
            "location": loc.strip(),
            "preferences": pref.strip(),
            "constraints": cons.strip(),
            "group_pref": group_pref.strip()
        })

    meeting_time = input("\n🕒 Meeting time (press Enter to skip): ").strip()
    if not meeting_time:
        meeting_time = None

    # Print collected inputs
    print("\n📋 Summary:")
    for m in members:
        print(f" - {m['name']}: {m['location']}, Pref: {m['preferences']}, Const: {m['constraints']}, Group: {m['group_pref']}")

    proceed = input("\n🚀 Proceed? (y/n): ")
    if proceed.lower() != "y":
        return

    # Step 2: Resolve locations
    print("\n📍 Resolving locations...")
    resolved = []
    for m in members:
        coords = await resolve_location(m["location"])
        if not coords:
            coords = (12.9716, 77.5946)  # fallback Bangalore
        resolved.append({"name": m["name"], "coords": coords})
        print(f"   - {m['name']}: {m['location']} → {coords}")

    fair_coords = compute_fair_coordinates([r["coords"] for r in resolved])
    print(f"\n⚖️ Fair meeting coordinates (geometric median): {fair_coords}")

    # Step 3+: Run coordination agent
    print("\n🤖 Running group coordination agent...\n")
    agent = create_group_agent()
    result = await agent.coordinate_group_meetup(members, purpose="; ".join(m["group_pref"] for m in members), meeting_time=meeting_time)

    # Step 6: Print final results
    print("\n🎉 Final Results:")
    if isinstance(result, dict):
        for k, v in result.items():
            print(f"{k}: {v}")
    else:
        print(result)


if __name__ == "__main__":
    asyncio.run(main())
