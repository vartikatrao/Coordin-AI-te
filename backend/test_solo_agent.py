import json
from app.agents.solo_agent import run_solo_agent

def collect_form_input():
    """Collect structured input for form mode."""
    print("Enter Form Mode Input:")
    purpose = input("Purpose (e.g., lunch, dinner, coffee): ").strip() or "food"
    mood = input("Mood (e.g., family, romantic, chill): ").strip() or "happy"
    budget = input("Budget (affordable, mid-range, premium, or leave blank for unknown): ").strip() or "unknown"
    time = input("Time (e.g., now, today, tomorrow, weekend): ").strip() or "now"
    transport = input("Transport (e.g., walking, driving, public): ").strip() or "walking"
    location_text = input("Location (e.g., Jayanagar, near me): ").strip() or "near me"
    user_lat = input("Latitude (press Enter for default 12.9716): ").strip() or "12.9716"
    user_lng = input("Longitude (press Enter for default 77.5946): ").strip() or "77.5946"

    return {
        "purpose": purpose,
        "mood": mood,
        "budget": budget,
        "time": time,
        "transport": transport,
        "location_text": location_text,
        "user_lat": float(user_lat),
        "user_lng": float(user_lng)
    }

def collect_chat_input():
    """Collect text input for chat mode."""
    user_query = input("Enter your query (e.g., 'lunch near Jaynagar with family, affordable'): ").strip()
    user_lat = input("Latitude (press Enter for default 12.9716): ").strip() or "12.9716"
    user_lng = input("Longitude (press Enter for default 77.5946): ").strip() or "77.5946"

    return {
        "user_query": user_query,
        "user_lat": float(user_lat),
        "user_lng": float(user_lng)
    }

def main():
    print("Welcome to Coordinate App Testing (Solo Mode)")
    print("Choose input mode:")
    print("1. Form Mode (structured input)")
    print("2. Chat Mode (text query)")
    mode = input("Enter 1 or 2: ").strip()

    if mode == "1":
        print("\n=== Form Mode ===")
        request = collect_form_input()
    elif mode == "2":
        print("\n=== Chat Mode ===")
        request = collect_chat_input()
    else:
        print("Invalid mode selected. Exiting.")
        return

    print("\nProcessing request...")
    result = run_solo_agent(request)
    print("\nResult:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()