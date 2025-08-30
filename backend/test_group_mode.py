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
        coords = resolve_location(m["location"])
        if not coords[0] or not coords[1]:
            coords = (12.9716, 77.5946)  # fallback Bangalore
        resolved.append({"name": m["name"], "coords": coords})
        print(f"   - {m['name']}: {m['location']} → {coords}")

    fair_coords = compute_fair_coordinates([r["coords"] for r in resolved])
    print(f"\n⚖️ Fair meeting coordinates (geometric median): {fair_coords}")

    # Step 3+: Run coordination agent
    print("\n🤖 Running group coordination agent...\n")
    agent = create_group_agent()
    result = await agent.coordinate_group_meetup(members, meeting_time=meeting_time)

    print("\n" + "="*60)
    print("🎉 COORDINATION RESULTS")
    print("="*60)
    
    if result:
        print(f"📍 Fair coordinates: {result.get('fair_coords')}")
        print(f"🎯 Intent: {result.get('intent')}")
        print(f"🏢 Venues found: {len(result.get('venues', []))}")
        
        for i, venue in enumerate(result.get('venues', []), 1):
            print(f"\n🏪 Venue {i}: {venue.get('name', 'Unknown')}")
            if venue.get('location'):
                print(f"   📍 Address: {venue['location'].get('formatted_address', 'N/A')}")
            if venue.get('categories'):
                print(f"   🏷️  Category: {venue['categories'][0].get('name', 'N/A')}")
        
        print(f"\n🛡️ Safety: {result.get('safety')}")
        
        personalized = result.get('personalized', [])
        if personalized:
            print(f"\n👥 Personalized explanations:")
            for p in personalized:
                print(f"   🏪 {p.get('venue', 'Unknown venue')}:")
                for name, reasons in p.get('why_for_each', {}).items():
                    print(f"     - {name}: {', '.join(reasons)}")
    else:
        print("❌ No results returned from agent")

if __name__ == "__main__":
    asyncio.run(main())