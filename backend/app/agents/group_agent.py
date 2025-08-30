import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.agents.tools.location_resolver import resolve_location, compute_fair_coordinates
from app.agents.tools.foursquare_tool_group import FoursquareGroupTool
from app.agents.tools.safety_tools import SafetyAssessmentTool
from app.agents.tools.group_intent_extractor_tool import GroupIntentExtractorTool

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class GroupCoordinationAgent:
    def __init__(self):
        self.fsq_tool = FoursquareGroupTool()
        self.safety_tool = SafetyAssessmentTool()
        self.intent_tool = GroupIntentExtractorTool()

    async def coordinate_group_meetup(
        self,
        members: List[Dict[str, str]],
        meeting_time: Optional[str] = None,
        meeting_purpose: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Full pipeline for group coordination:
        1. Resolve locations
        2. Compute fair coordinates
        3. Extract group intent
        4. Find venues
        5. Assess safety
        6. Personalize
        """

        # STEP 1: Resolve member locations
        resolved_members = []
        coords = []
        logger.info("=== STEP 1: Resolving Locations ===")
        for m in members:
            # Handle location data that might be a dict or string
            if isinstance(m["location"], dict):
                # Frontend sends location as dict with lat, lng, address
                lat = float(m["location"].get("lat", 12.9716))
                lng = float(m["location"].get("lng", 77.5946))
                location_text = m["location"].get("address", "Bangalore")
                logger.info(f"✅ Using provided coordinates for {m['name']}: ({lat}, {lng})")
            else:
                # Fallback: resolve location string
                lat, lng = resolve_location(m["location"])
                location_text = m["location"]
                if not lat or not lng:
                    logger.warning(f"❌ Failed to resolve {m['name']} location ({m['location']}), using Bangalore center fallback.")
                    lat, lng = 12.9716, 77.5946
            
            # Handle preferences and constraints that might be dicts or strings
            preferences = m.get("preferences", "")
            if isinstance(preferences, dict):
                preferences_text = preferences.get("description", "")
                if not preferences_text:
                    # Build description from dict properties
                    parts = []
                    if preferences.get("meetingType"):
                        parts.append(f"Looking for {preferences['meetingType']} places")
                    if preferences.get("atmosphere"):
                        parts.append(f"prefers {preferences['atmosphere']} atmosphere")
                    if preferences.get("features") and isinstance(preferences["features"], list):
                        parts.append(f"needs {', '.join(preferences['features'])}")
                    preferences_text = ", ".join(parts) if parts else "General preferences"
            else:
                preferences_text = str(preferences) if preferences else ""
            
            constraints = m.get("constraints", "")
            if isinstance(constraints, dict):
                constraints_text = constraints.get("description", "")
                if not constraints_text:
                    # Build description from dict properties
                    parts = []
                    if constraints.get("budget"):
                        parts.append(f"budget level {constraints['budget']}")
                    if constraints.get("timePreference"):
                        parts.append(f"prefers {constraints['timePreference']} timing")
                    constraints_text = ", ".join(parts) if parts else "No specific constraints"
            else:
                constraints_text = str(constraints) if constraints else ""
            
            group_pref = m.get("group_pref", "")
            if isinstance(group_pref, dict):
                group_pref = str(group_pref)
            
            resolved = {
                "name": m["name"],
                "location_text": location_text,
                "lat": lat,
                "lng": lng,
                "preferences": preferences_text,
                "constraints": constraints_text,
                "group_pref": group_pref
            }
            resolved_members.append(resolved)
            coords.append((lat, lng))
            logger.info(f"✅ {m['name']} → {lat},{lng}")

        # STEP 2: Compute fair coordinates
        logger.info("=== STEP 2: Computing Fair Coordinates ===")
        fair_lat, fair_lng = compute_fair_coordinates(coords)
        if not fair_lat or not fair_lng:
            logger.warning("❌ Failed to compute fair coords, fallback to first valid.")
            fair_lat, fair_lng = coords[0]
        logger.info(f"📍 Fair coords → ({fair_lat},{fair_lng})")

        # STEP 3: Extract group intent
        logger.info("=== STEP 3: Extracting Group Intent ===")
        try:
            intent_json = self.intent_tool.extract_intent(resolved_members, meeting_purpose)
            logger.info(f"🎯 Extracted intent:\n{json.dumps(intent_json, indent=2)}")
        except Exception as e:
            logger.error(f"❌ Intent extraction failed: {e}")
            # fallback: merge text
            merged_prefs = ", ".join([m["preferences"] for m in resolved_members])
            merged_constraints = ", ".join([m["constraints"] for m in resolved_members])
            merged_group = ", ".join([m["group_pref"] for m in resolved_members])
            intent_json = {
                "purpose": merged_group or "casual hangout",
                "food": merged_prefs,
                "constraints": merged_constraints,
                "categories": "restaurant, cafe"
            }

        # STEP 4: Find venues with Foursquare
        logger.info("=== STEP 4: Searching Venues ===")
        try:
            venues = self.fsq_tool.search_venues(
                lat=fair_lat,
                lng=fair_lng,
                intent=intent_json,
                meeting_time=meeting_time
            )
            if not venues:
                logger.warning("❌ No venues found, fallback to generic query.")
                venues = self.fsq_tool.search_venues(
                    lat=fair_lat,
                    lng=fair_lng,
                    intent={"categories": "restaurant, cafe"},
                    meeting_time=meeting_time
                )
            logger.info(f"🏬 Found {len(venues)} venues")
        except Exception as e:
            logger.error(f"❌ Venue search failed: {e}")
            venues = []

        # STEP 5: Safety assessment
        logger.info("=== STEP 5: Assessing Safety ===")
        safety = {}
        try:
            # Pass venues data to safety assessment for location-specific recommendations
            venues_json = json.dumps(venues)
            safety = self.safety_tool._run(venues_data=venues_json, 
                                         meeting_time=meeting_time,
                                         fair_coords=json.dumps({"lat": fair_lat, "lng": fair_lng}))
            safety = json.loads(safety)
            logger.info(f"🛡️ Safety assessment: {json.dumps(safety, indent=2)}")
        except Exception as e:
            logger.error(f"❌ Safety tool failed: {e}")

        # STEP 6: Enhanced Personalization with Distance Calculation
        logger.info("=== STEP 6: Personalizing Explanations ===")
        personalized = []
        for v in venues:
            # Get venue coordinates
            venue_lat, venue_lng = self._get_venue_coordinates(v)
            logger.info(f"🏢 Venue {v.get('name')} at ({venue_lat}, {venue_lng})")
            
            entry = {
                "venue": v.get("name"),
                "address": v.get("address"),
                "venue_coordinates": {"lat": venue_lat, "lng": venue_lng},
                "why_for_each": {},
                "member_distances": {}
            }
            
            for m in resolved_members:
                # Calculate distance from member to venue
                distance_km = self.fsq_tool.calculate_distance(m["lat"], m["lng"], venue_lat, venue_lng)
                travel_time_min = max(int(distance_km * 2.5), 1)  # Estimate ~2.5 min per km in city traffic
                
                entry["member_distances"][m["name"]] = {
                    "distance_km": round(distance_km, 1),
                    "travel_time_min": travel_time_min
                }
                
                # Generate personalized reasons based on member data
                reasons = self._generate_personalized_reasons(m, v, distance_km, intent_json)
                entry["why_for_each"][m["name"]] = reasons
                
                logger.info(f"👤 {m['name']}: {distance_km:.1f}km ({travel_time_min}min) - {', '.join(reasons)}")
            
            personalized.append(entry)

        # Final result
        return {
            "fair_coords": (fair_lat, fair_lng),
            "intent": intent_json,
            "venues": venues,
            "safety": safety,
            "personalized": personalized
        }


def create_group_agent():
    return GroupCoordinationAgent()
