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

settings = Settings()
