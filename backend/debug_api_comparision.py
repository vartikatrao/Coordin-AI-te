"""
Debug script to compare standalone API call vs application API call
"""
import requests
import json
from app.core.config import settings

def standalone_test():
    """Exact copy of your working standalone script"""
    print("=== STANDALONE TEST (Your Working Version) ===")
    
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
    
    print(f"URL: {url}")
    print(f"Headers: {json.dumps(headers, indent=2)}")
    print(f"Params: {json.dumps(params, indent=2)}")
    
    response = requests.get(url, headers=headers, params=params)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    return response.status_code == 200

def application_test():
    """Test using your application's configuration"""
    print("\n=== APPLICATION TEST (Using Your Config) ===")
    
    FSQ_API_KEY = settings.FSQ_API_KEY
    print(f"Config API Key: {FSQ_API_KEY}")
    
    url = "https://places-api.foursquare.com/places/search"
    headers = {
        "authorization": f"Bearer {FSQ_API_KEY}",
        "accept": "application/json",
        "X-Places-Api-Version": "2025-06-17"
    }
    
    params = {
        "query": "pizza",
        "ll": "12.9716,77.5946",
        "limit": 5,
        "fields": "name,location"
    }
    
    print(f"URL: {url}")
    print(f"Headers: {json.dumps(headers, indent=2)}")
    print(f"Params: {json.dumps(params, indent=2)}")
    
    response = requests.get(url, headers=headers, params=params)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    return response.status_code == 200

def detailed_comparison():
    """Compare the exact requests being made"""
    print("\n=== DETAILED COMPARISON ===")
    
    # Standalone version
    standalone_key = "KME0H5SWVNZIEJ35O1JHRBPPMBC3U1BK3I2PDNWUHQLRANFW"
    config_key = settings.FSQ_API_KEY
    
    print(f"Standalone key: '{standalone_key}'")
    print(f"Config key:     '{config_key}'")
    print(f"Keys identical: {standalone_key == config_key}")
    print(f"Key lengths: standalone={len(standalone_key)}, config={len(config_key)}")
    
    # Check for any hidden characters
    print(f"Standalone key bytes: {standalone_key.encode('utf-8')}")
    print(f"Config key bytes:     {config_key.encode('utf-8')}")
    
    # Test both with identical parameters
    base_params = {
        "query": "restaurant",
        "ll": "12.9716,77.5946",
        "limit": 1,
        "fields": "name"
    }
    
    print(f"\nTesting with minimal params: {base_params}")
    
    # Test 1: Standalone key
    headers1 = {
        "accept": "application/json",
        "X-Places-Api-Version": "2025-06-17",
        "authorization": f"Bearer {standalone_key}"
    }
    
    resp1 = requests.get("https://places-api.foursquare.com/places/search", 
                        headers=headers1, params=base_params)
    print(f"Test 1 (standalone key): {resp1.status_code}")
    
    # Test 2: Config key  
    headers2 = {
        "accept": "application/json",
        "X-Places-Api-Version": "2025-06-17",
        "authorization": f"Bearer {config_key}"
    }
    
    resp2 = requests.get("https://places-api.foursquare.com/places/search",
                        headers=headers2, params=base_params)
    print(f"Test 2 (config key): {resp2.status_code}")
    
    if resp1.status_code != resp2.status_code:
        print("DIFFERENCE FOUND!")
        print(f"Standalone response: {resp1.text}")
        print(f"Config response: {resp2.text}")

def check_foursquare_account():
    """Check if there are multiple Foursquare accounts/apps"""
    print("\n=== FOURSQUARE ACCOUNT CHECK ===")
    print("Possible causes:")
    print("1. You have multiple Foursquare developer accounts")
    print("2. Different API keys belong to different apps")
    print("3. One key is from a trial/free account, other is paid")
    print("4. Rate limits are account-specific, not key-specific")
    print("\nRecommendation: Check your Foursquare developer dashboard")
    print("URL: https://foursquare.com/developers/orgs")

if __name__ == "__main__":
    success1 = standalone_test()
    success2 = application_test()
    
    detailed_comparison()
    check_foursquare_account()
    
    if success1 and not success2:
        print("\n🚨 CONCLUSION: Same key works standalone but fails in application")
        print("This suggests a difference in how requests are being made")
    elif not success1 and not success2:
        print("\n🚨 CONCLUSION: Both failing - API key or account issue")
    else:
        print("\n✅ CONCLUSION: Both working - intermittent issue")