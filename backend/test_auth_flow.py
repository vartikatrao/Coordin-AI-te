import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Load from .env
FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")
BACKEND_URL = "http://127.0.0.1:8000/api/auth/me"

# Test credentials (user must exist in Firebase)
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "testpassword"

def get_firebase_token(email, password):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_WEB_API_KEY}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()["idToken"]

def call_backend(id_token):
    headers = {"Authorization": f"Bearer {id_token}"}
    response = requests.get(BACKEND_URL, headers=headers)
    response.raise_for_status()
    return response.json()

if __name__ == "__main__":
    token = get_firebase_token(TEST_EMAIL, TEST_PASSWORD)
    print("✅ Got Firebase ID Token")
    result = call_backend(token)
    print("✅ Backend Response:", result)
