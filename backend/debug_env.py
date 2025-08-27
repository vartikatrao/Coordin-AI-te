import os
from dotenv import load_dotenv

print("Current working directory:", os.getcwd())
print("Files in current directory:", os.listdir('.'))

# Try to load .env file
load_dotenv()

print("\nEnvironment variables:")
print("GEMINI_API_KEY:", os.getenv("GEMINI_API_KEY"))
print("GEMINI_API_KEY length:", len(os.getenv("GEMINI_API_KEY") or "") if os.getenv("GEMINI_API_KEY") else 0)

# Check if .env file exists
env_file_path = os.path.join(os.getcwd(), '.env')
print(f"\n.env file exists: {os.path.exists(env_file_path)}")
if os.path.exists(env_file_path):
    print(f".env file size: {os.path.getsize(env_file_path)} bytes")
    with open(env_file_path, 'r') as f:
        content = f.read()
        print(f".env content preview: {content[:100]}...")
