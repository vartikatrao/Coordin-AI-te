import os
import json
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def extract_params(message: str):
    """Uses Gemini API to extract structured params + FSQ-friendly query"""
    print("🤖 [Extraction Tool] Analysing user message...")

    prompt = f"""
    Task: Extract structured parameters for place recommendation.
    From the message, identify:
    - lat (float, null if not mentioned)
    - lng (float, null if not mentioned)
    - purpose (short user intent like work, party, food, etc.)
    - transport (walking, driving, public, null if not mentioned)
    - time (ISO8601 if mentioned, otherwise null)
    - mood (happy, bored, romantic, adventurous, etc.)
    - fsq_query (natural search query like 'ice cream', 'library', 'bar')
    - fsq_category_id (Foursquare category ID if confidently mappable, else null)

    Message: "{message}"

    Respond ONLY in JSON.
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
    resp.raise_for_status()

    raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    try:
        return json.loads(raw_text)
    except Exception as e:
        print("⚠️ Extraction JSON parse error:", e)
        return {}
