# # import requests

# # # Define your API key as a variable
# # FSQ_API_KEY = "55P30UNJS1MDEHNWYOWRZMQLGYD5JWTASR2QSC1BKH1AFHMS"

# # url = "https://places-api.foursquare.com/places/search"
# # headers = {
# #     "accept": "application/json",
# #     "X-Places-Api-Version": "2025-06-17",
# #     "authorization": f"Bearer {FSQ_API_KEY}"  # Use the variable with f-string
# # }

# # # Add required parameters
# # params = {
# #     "query": "pizza",
# #     "ll": "12.87,74.88",  # Bangalore coordinates
# #     "limit": 2,
# #     "fields": "name,fsq_place_id,distance"
# # }

# # response = requests.get(url, headers=headers, params=params)
# # print("Status Code:", response.status_code)
# # print("Response:", response.text)

# # # Pretty print if successful
# # if response.status_code == 200:
# #     import json
# #     data = response.json()
# #     print("\nFormatted Response:")
# #     print(json.dumps(data, indent=2))
    
# #     if 'results' in data:
# #         print(f"\nFound {len(data['results'])} places:")
# #         for i, place in enumerate(data['results'], 1):
# #             print(f"{i}. {place.get('name', 'N/A')}")

# #             dist = place.get("distance")
# #             if dist is not None:
# #              print(f"   Distance: {dist} meters")

# #             if 'fsq_place_id' in place:
# #                 print(f"   FSQ ID: {place['fsq_place_id']}")
# #             if 'location' in place:
# #                 print(f"   Address: {place['location'].get('formatted_address', 'N/A')}")
# #                 if 'latitude' in place['location'] and 'longitude' in place['location']:
# #                     lat = place['location']['latitude']
# #                     lng = place['location']['longitude']
# #                     print(f"   Coordinates: {lat}, {lng}")
# # else:
# #     print("Error occurred. Check your API key and parameters.")

# import requests
# import json

# # Define your API key as a variable
# FSQ_API_KEY = "55P30UNJS1MDEHNWYOWRZMQLGYD5JWTASR2QSC1BKH1AFHMS"

# headers = {
#     "accept": "application/json",
#     "X-Places-Api-Version": "2025-06-17",
#     "authorization": f"Bearer {FSQ_API_KEY}"
# }

# # 1. Search request
# search_url = "https://places-api.foursquare.com/places/search"
# search_params = {
#     "query": "temple",
#     "ll": "12.87,74.88",
#     "limit": 2,
#     "fields": "name,fsq_place_id,distance"
# }

# search_response = requests.get(search_url, headers=headers, params=search_params)
# print("Search Status Code:", search_response.status_code)

# if search_response.status_code == 200:
#     search_data = search_response.json()
#     print(json.dumps(search_data, indent=2))

#     if "results" in search_data:
#         for place in search_data["results"]:
#             distance = place.get("distance", "N/A")
#             print(distance)
#             fsq_id = place["fsq_place_id"]
#             print(f"\n=== Details for Place: {place['name']} (ID: {fsq_id}) ===")

#             # 2. Place details request for that fsq_place_id
#             detail_url = f"https://places-api.foursquare.com/places/{fsq_id}"
#             detail_params = {
#                 "fields": "social_media,location"
#             }

#             detail_response = requests.get(detail_url, headers=headers, params=detail_params)

#             if detail_response.status_code == 200:
#                 detail_data = detail_response.json()

#                 location = detail_data.get("location", {})
#                 print("Address:", location.get("formatted_address", "N/A"))
#                 # Attributes
#                 print("Attributes:", json.dumps(detail_data.get("attributes", {}), indent=2))
#                 # Photos
#                 print("Photos:", json.dumps(detail_data.get("photos", []), indent=2))
#                 # Social Media
#                 print("Social Media:", json.dumps(detail_data.get("social_media", {}), indent=2))
#             else:
#                 print(f"Failed to fetch details for {fsq_id} (status {detail_response.status_code})")
# else:
#     print("Error occurred in search request")
import requests
import json


# Define your API key as a variable
FSQ_API_KEY = "55P30UNJS1MDEHNWYOWRZMQLGYD5JWTASR2QSC1BKH1AFHMS"

headers = {
    "accept": "application/json",
    "X-Places-Api-Version": "2025-06-17",
    "authorization": f"Bearer {FSQ_API_KEY}"
}

# --------------------------------------------------------------------
# TEST CASE 1 : Check geotagging candidates (e.g. "jayanagar bangalore")
# --------------------------------------------------------------------
geotag_url = "https://places-api.foursquare.com/geotagging/candidates"
geotag_params = {
    "query": "jayanagar, bangalore",
    "types": "neighborhood"
}

geo_response = requests.get(geotag_url, headers=headers, params=geotag_params)
print("\nGeotagging Status:", geo_response.status_code)

if geo_response.status_code == 200:
    geo_data = geo_response.json()
    print("Geotagging candidates:")
    print(json.dumps(geo_data, indent=2))
    if (geo_data and "candidates" in geo_data and len(geo_data["candidates"]) > 0):
        first = geo_data["candidates"][0]
        print("  → Neighborhood lat/lng:", first.get("latitude"), first.get("longitude"))
else:
    print("Failed Geotagging request")

# --------------------------------------------------------------------
# TEST CASE 2 : Search then use fsq_place_id
# --------------------------------------------------------------------
search_url = "https://places-api.foursquare.com/places/search"
search_params = {
    "query": "temple",
    "ll": "12.87,74.88",
    "limit": 2,
    "fields": "name,fsq_place_id,distance"
}

search_response = requests.get(search_url, headers=headers, params=search_params)
print("\nSearch Status Code:", search_response.status_code)

if search_response.status_code == 200:
    search_data = search_response.json()
    print(json.dumps(search_data, indent=2))

    if "results" in search_data:
        for place in search_data["results"]:
            distance = place.get("distance", "N/A")
            print(distance)
            fsq_id = place["fsq_place_id"]
            print(f"\n=== Details for Place: {place['name']} (ID: {fsq_id}) ===")

            # Place details request for that fsq_place_id
            detail_url = f"https://places-api.foursquare.com/places/{fsq_id}"
            detail_params = {
                "fields": "social_media,location"
            }

            detail_response = requests.get(detail_url, headers=headers, params=detail_params)

            if detail_response.status_code == 200:
                detail_data = detail_response.json()

                location = detail_data.get("location", {})
                print("Address:", location.get("formatted_address", "N/A"))
                print("Attributes:", json.dumps(detail_data.get("attributes", {}), indent=2))
                print("Photos:", json.dumps(detail_data.get("photos", []), indent=2))
                print("Social Media:", json.dumps(detail_data.get("social_media", {}), indent=2))
            else:
                print(f"Failed to fetch details for {fsq_id} (status {detail_response.status_code})")
else:
    print("Error occurred in search request")
