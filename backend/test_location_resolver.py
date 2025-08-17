import requests

# Define your API key as a variable
FSQ_API_KEY = "55P30UNJS1MDEHNWYOWRZMQLGYD5JWTASR2QSC1BKH1AFHMS"

url = "https://places-api.foursquare.com/places/search"
headers = {
    "accept": "application/json",
    "X-Places-Api-Version": "2025-06-17",
    "authorization": f"Bearer {FSQ_API_KEY}"  # Use the variable with f-string
}

# Add required parameters
params = {
    "query": "pizza",
    "ll": "12.9716,77.5946",  # Bangalore coordinates
    "limit": 5,
    "fields": "name,location"
}

response = requests.get(url, headers=headers, params=params)
print("Status Code:", response.status_code)
print("Response:", response.text)

# Pretty print if successful
if response.status_code == 200:
    import json
    data = response.json()
    print("\nFormatted Response:")
    print(json.dumps(data, indent=2))
    
    if 'results' in data:
        print(f"\nFound {len(data['results'])} places:")
        for i, place in enumerate(data['results'], 1):
            print(f"{i}. {place.get('name', 'N/A')}")
            if 'location' in place:
                print(f"   Address: {place['location'].get('formatted_address', 'N/A')}")
                if 'latitude' in place['location'] and 'longitude' in place['location']:
                    lat = place['location']['latitude']
                    lng = place['location']['longitude']
                    print(f"   Coordinates: {lat}, {lng}")
else:
    print("Error occurred. Check your API key and parameters.")