import json
import requests
from datetime import datetime
from app.core.config import settings
from crewai_tools import tool
from crewai_tools import *
print(dir())  

GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_MODEL = settings.GEMINI_MODEL

@tool("Parameter Extractor Tool")
def extractor_tool(user_input: dict) -> dict:
    """
    Extracts parameters (location, purpose, mood, budget, time, transport) from user input for place recommendations.
    """
    # Check if input is form mode (structured dict) or chat mode (string)
    if isinstance(user_input, dict) and all(key in user_input for key in ["purpose", "mood", "budget", "time", "transport", "location_text"]):
        print(f"DEBUG: Form mode input detected: {user_input}")
        return {
            "purpose": user_input.get("purpose", "food"),
            "mood": user_input.get("mood", "happy"),
            "budget": user_input.get("budget", "unknown"),
            "time": user_input.get("time", "now"),
            "transport": user_input.get("transport", "walking"),
            "location_text": user_input.get("location_text", "near me")
        }
    else:
        # Chat mode: extract from text query
        user_message = user_input.get("user_query", "") if isinstance(user_input, dict) else user_input
        return extract_parameters(user_message)

class ExtractorTool:
    """Wrapper class for backward compatibility"""
    def __init__(self):
        self.tool = extractor_tool
    
    def __call__(self, *args, **kwargs):
        return self.tool(*args, **kwargs)

def extract_parameters(user_message: str) -> dict:
    """
    Extracts parameters from a text query using Gemini LLM or fallback heuristic.
    """
    print(f"DEBUG: Extracting parameters from: '{user_message}'")
    
    raw = _gemini_extract(user_message)
    
    purpose = raw.get("purpose") or "food"
    mood = raw.get("mood") or "happy"
    budget = raw.get("budget") or "unknown"
    time_str = raw.get("time") or "now"
    transport = raw.get("transport") or "walking"
    location_text = raw.get("location_text") or "near me"

    print(f"DEBUG: Normalized parameters:")
    print(f"  - location_text: '{location_text}'")
    print(f"  - purpose: '{purpose}'")
    print(f"  - mood: '{mood}'")
    print(f"  - budget: '{budget}'")
    print(f"  - time: '{time_str}'")
    print(f"  - transport: '{transport}'")

    return {
        "purpose": purpose,
        "mood": mood,
        "budget": budget,
        "time": time_str,
        "transport": transport,
        "location_text": location_text,
    }

def _gemini_extract(user_message: str):
    """
    Extracts: location_text, purpose, mood, budget, time, transport
    Returns dict (may be partial).
    """
    if not GEMINI_API_KEY:
        print("DEBUG: No Gemini API key available")
        return _fallback_extract(user_message)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}

    system_prompt = """
You are a strict JSON extractor for a local place recommendation agent.
SPELLING CORRECTION RULES:
    - If location seems misspelled (e.g., "strret" → "street", "jaynagar" → "Jayanagar"), correct it.

BUDGET RULES:
- "1k per person" → "mid-range" (Bangalore context)
- "500/person" → "affordable"
- "3k+/person" → "premium"
- Adjust thresholds based on location (use "mid-range" as default if unsure).

TIME HANDLING RULES:
    - If time is vague ("tomorrow"), assume 12 PM for lunch, 7 PM for dinner.
    - For "now", check current time and adjust purpose:
    - "breakfast" if before 11 AM
    - "lunch" if 11 AM - 3 PM
    - "dinner" if after 6 PM

From the user message, extract these fields exactly (string or null):
- location_text: where they want to go (examples: "near me", "Indiranagar", "Koramangala", "Jayanagar", specific address)
- purpose: why they want to go (food, lunch, dinner, coffee, work, study, fun, party, romantic dinner, family lunch, shopping, etc.)
- mood: their mood/context (happy, bored, family, romantic, chill, energetic, casual, formal, etc.)
- budget: price preference 
- time: when they want to go (e.g., "today 1 pm", "tomorrow 12 pm", "this weekend", "now", "evening")
- transport: how they'll travel (walking, driving, scooty, bike, public, auto, uber)

IMPORTANT RULES:
1. If location not mentioned or intents "near me"/"nearby" → set location_text to "near me"
2. For food-related purposes, be specific: "lunch", "dinner", "breakfast", "coffee", "snacks"
3. Infer mood from context (family = "family", date = "romantic", work = "professional")
4. If budget not clear, set to null (don't guess)
5. Return ONLY valid JSON, no backticks or extra text

Examples:
"lunch near jaynagar with family, affordable and less crowded" → {"location_text": "Jayanagar", "purpose": "lunch", "mood": "family", "budget": "affordable", "time": null, "transport": null}
"coffee shop nearby" → {"location_text": "near me", "purpose": "coffee", "mood": null, "budget": null, "time": null, "transport": null}
"""

    body = {
        "contents": [
            {
                "parts": [
                    {"text": system_prompt},
                    {"text": f"User message: {user_message}\n\nExtract JSON:"}
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    }

    try:
        resp = requests.post(url, headers=headers, json=body, timeout=30)
        resp.raise_for_status()
        
        response_data = resp.json()
        txt = response_data["candidates"][0]["content"]["parts"][0]["text"]
        extracted = json.loads(txt)
        
        print(f"DEBUG: Gemini extracted: {extracted}")
        return extracted
        
    except requests.exceptions.RequestException as e:
        print(f"DEBUG: Gemini API request failed: {e}")
        return _fallback_extract(user_message)
    except json.JSONDecodeError as e:
        print(f"DEBUG: Failed to parse Gemini JSON response: {e}")
        return _fallback_extract(user_message)
    except KeyError as e:
        print(f"DEBUG: Unexpected Gemini response format: {e}")
        return _fallback_extract(user_message)
    except Exception as e:
        print(f"DEBUG: Unexpected error in Gemini extraction: {e}")
        return _fallback_extract(user_message)

def _fallback_extract(user_message: str):
    """Enhanced heuristic fallback if LLM fails."""
    msg = user_message.lower()
    print(f"DEBUG: Using fallback extraction for: '{user_message}'")
    
    # Extract purpose with better mapping
    purpose = None
    purpose_keywords = {
        "lunch": "lunch", "dinner": "dinner", "breakfast": "breakfast",
        "coffee": "coffee", "tea": "coffee", 
        "food": "food", "eat": "food", "restaurant": "food",
        "work": "work", "office": "work", "meeting": "work",
        "study": "study", "library": "study", "books": "study",
        "shopping": "shopping", "shop": "shopping", "buy": "shopping",
        "party": "party", "celebrate": "party", "drinks": "party",
        "dance": "dance", "club": "dance", "music": "dance",
        "movie": "entertainment", "cinema": "entertainment",
        "gym": "fitness", "workout": "fitness", "exercise": "fitness"
    }
    
    for keyword, purpose_type in purpose_keywords.items():
        if keyword in msg:
            purpose = purpose_type
            break
    
    # Extract mood with better inference
    mood = None
    if any(word in msg for word in ["family", "kids", "children", "parents"]):
        mood = "family"
    elif any(word in msg for word in ["date", "romantic", "partner", "girlfriend", "boyfriend"]):
        mood = "romantic"
    elif any(word in msg for word in ["friends", "gang", "group"]):
        mood = "friends"
    elif any(word in msg for word in ["work", "business", "meeting", "client"]):
        mood = "professional"
    elif any(word in msg for word in ["party", "celebrate", "fun", "energetic"]):
        mood = "energetic"
    elif any(word in msg for word in ["chill", "relax", "calm", "peaceful"]):
        mood = "chill"

    # Extract budget with better keywords
    budget = None
    if any(w in msg for w in ["cheap", "affordable", "budget", "low cost", "economical", "inexpensive"]):
        budget = "affordable"
    elif any(w in msg for w in ["mid", "mid-range", "moderate", "average", "decent"]):
        budget = "mid-range"
    elif any(w in msg for w in ["premium", "luxury", "expensive", "high-end", "fancy", "upscale"]):
        budget = "premium"

    # Extract location with better area detection
    location_text = "near me"  # Default
    
    if any(phrase in msg for phrase in ["near me", "nearby", "close by", "around here"]):
        location_text = "near me"
    else:
        bangalore_areas = [
            "jayanagar", "indiranagar", "koramangala", "whitefield", 
            "hsr layout", "hsr", "btm layout", "btm", "electronic city",
            "marathahalli", "mg road", "brigade road", "commercial street",
            "malleshwaram", "rajajinagar", "basavanagudi", "ulsoor",
            "cunningham road", "church street", "lavelle road", "residency road"
        ]
        
        for area in bangalore_areas:
            if area.replace(" ", "") in msg.replace(" ", ""):
                location_text = area.title()  # Capitalize first letter
                break
    
    # Extract transport
    transport = None
    if any(word in msg for word in ["walk", "walking"]):
        transport = "walking"
    elif any(word in msg for word in ["drive", "driving", "car"]):
        transport = "driving"
    elif any(word in msg for word in ["scooty", "scooter", "bike", "motorcycle"]):
        transport = "scooty"
    elif any(word in msg for word in ["bus", "metro", "public transport", "public"]):
        transport = "public"
    elif any(word in msg for word in ["uber", "ola", "taxi", "cab"]):
        transport = "taxi"

    # Extract time
    time_val = None
    if any(word in msg for word in ["now", "immediately", "asap"]):
        time_val = "now"
    elif any(word in msg for word in ["today", "this evening", "tonight"]):
        time_val = "today"
    elif any(word in msg for word in ["tomorrow", "next day"]):
        time_val = "tomorrow"
    elif any(word in msg for word in ["weekend", "saturday", "sunday"]):
        time_val = "weekend"

    result = {
        "location_text": location_text,
        "purpose": purpose,
        "mood": mood,
        "budget": budget,
        "time": time_val,
        "transport": transport
    }
    
    print(f"DEBUG: Fallback extracted: {result}")
    return result