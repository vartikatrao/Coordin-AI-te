# from app.agents.solo_agent import run_solo_agent

# if __name__ == "__main__":
#     print("=== SOLO AGENT TEST ===")

#     # Example 1: Structured input
#     req1 = {
#         "lat": 12.9716,
#         "lng": 77.5946,
#         "purpose": "work",
#         "transport": "walking",
#         "time": "2025-08-16T16:00:00+05:30",
#         "mood": "happy"
#     }
#     print("\n📝 Structured Input Test")
#     print(run_solo_agent(req1))

#     # Example 2: Chat input
#     req2 = {"message": "I am bored, find me some fun cafes near Koramangala"}
#     print("\n💬 Chat Input Test")
#     print(run_solo_agent(req2))
from app.agents.solo_agent import run_solo_agent

def structured_input():
    print("\n📝 Structured Input Mode")
    lat = float(input("Enter latitude (default 12.9716): ") or 12.9716)
    lng = float(input("Enter longitude (default 77.5946): ") or 77.5946)
    purpose = input("Enter purpose (work, food, party, study, etc.): ") or "work"
    transport = input("Enter transport (walking/driving/public): ") or "walking"
    time = input("Enter time (ISO8601 or leave empty): ") or "now"
    mood = input("Enter mood (happy, bored, romantic, etc.): ") or "happy"

    req = {
        "lat": lat,
        "lng": lng,
        "purpose": purpose,
        "transport": transport,
        "time": time,
        "mood": mood
    }
    return req

def chat_input():
    print("\n💬 Chat Input Mode")
    message = input("Enter your message: ")
    return {"message": message}

if __name__ == "__main__":
    print("=== SOLO AGENT TEST (Dynamic) ===")
    mode = input("Choose mode [1=Structured, 2=Chat]: ")

    if mode == "1":
        req = structured_input()
    else:
        req = chat_input()

    result = run_solo_agent(req)
    print("\n🎯 Final Output:")
    print(result)
