import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "Coordin-AI-te Backend")
    APP_ENV: str = os.getenv("APP_ENV", "development")

    # Firebase
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS", "firebase-service-key.json")
    FIREBASE_WEB_API_KEY: str = os.getenv("FIREBASE_WEB_API_KEY")

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    FSQ_API_KEY = os.getenv("FSQ_API_KEY")

    DEFAULT_LAT = float(os.getenv("DEFAULT_LAT", 12.9716))
    DEFAULT_LNG = float(os.getenv("DEFAULT_LNG", 77.5946))

    CONFIRM_BEFORE_SEARCH = os.getenv("CONFIRM_BEFORE_SEARCH", "true").lower() == "true"
    DEBUG_AGENT_LOGS = os.getenv("DEBUG_AGENT_LOGS", "true").lower() == "true"


settings = Settings()
