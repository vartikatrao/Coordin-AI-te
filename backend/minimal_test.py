"""
Minimal test that exactly replicates your working standalone script
"""
import requests
import json

def test_exact_copy():
    """Exact copy of your working script"""
    FSQ_API_KEY = "KME0H5SWVNZIEJ35O1JHRBPPMBC3U1BK3I2PDNWUHQLRANFW"
    
    url = "https://places-api.foursquare.com/places/search"
    headers = {
        "accept": "application/json",
        "X-Places-Api-Version": "2025-06-17", 
        "authorization": f"Bearer {FSQ_API_KEY}"
    }
    
    params = {
        "query": "pizza",
        "ll": "12.9716,77.5946",
        "limit": 5,
        "fields": "name,location"
    }
    
    response = requests.get(url, headers=headers, params=params)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
    
    return response.status_code == 200

def test_with_config():
    """Test using your config but with exact same request format"""
    from app.core.config import settings
    
    FSQ_API_KEY = settings.FSQ_API_KEY
    
    url = "https://places-api.foursquare.com/places/search"  
    headers = {
        "accept": "application/json",
        "X-Places-Api-Version": "2025-06-17",
        "authorization": f"Bearer {FSQ_API_KEY}"  # Exact same format
    }
    
    params = {
        "query": "pizza",
        "ll": "12.9716,77.5946", 
        "limit": 5,
        "fields": "name,location"
    }
    
    response = requests.get(url, headers=headers, params=params)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
    
    return response.status_code == 200

if __name__ == "__main__":
    print("=== Test 1: Exact Copy of Working Script ===")
    result1 = test_exact_copy()
    
    print("\n=== Test 2: Using Config with Same Format ===")
    result2 = test_with_config()
    
    print(f"\nResults: Standalone={result1}, Config={result2}")
    
    if result1 and not result2:
        print("Issue is with config loading")
    elif not result1 and not result2:  
        print("Account/API key issue")
    else:
        print("Both working - issue might be elsewhere")