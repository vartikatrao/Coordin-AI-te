import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import logging

logger = logging.getLogger(__name__)

class PreferenceLearningSystem:
    """
    Learning system that tracks and learns from user preferences across both solo and group modes.
    Uses file-based storage since no database is available.
    """
    
    def __init__(self, storage_path: str = "data/preferences"):
        self.storage_path = storage_path
        self.ensure_storage_directory()
        
        # In-memory cache for active session
        self.session_cache = {}
        
        # Preference categories and weights
        self.preference_categories = {
            "venue_types": ["cafe", "restaurant", "bar", "library", "mall", "park"],
            "atmosphere": ["quiet", "lively", "romantic", "casual", "professional"],
            "budget": ["budget", "affordable", "moderate", "expensive", "luxury"],
            "time_preferences": ["morning", "afternoon", "evening", "night"],
            "group_types": ["solo", "friends", "family", "couple", "business"],
            "cuisine": ["vegetarian", "vegan", "indian", "chinese", "italian", "continental"],
            "amenities": ["wifi", "parking", "outdoor", "indoor", "ac", "music"]
        }
    
    def ensure_storage_directory(self):
        """Create storage directory if it doesn't exist"""
        try:
            os.makedirs(self.storage_path, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to create storage directory: {e}")
    
    def get_user_profile_path(self, user_id: str) -> str:
        """Get file path for user's preference profile"""
        return os.path.join(self.storage_path, f"user_{user_id}.json")
    
    def load_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Load user's preference profile from storage"""
        if user_id in self.session_cache:
            return self.session_cache[user_id]
        
        profile_path = self.get_user_profile_path(user_id)
        
        try:
            if os.path.exists(profile_path):
                with open(profile_path, 'r', encoding='utf-8') as f:
                    profile = json.load(f)
            else:
                profile = self.create_default_profile(user_id)
            
            self.session_cache[user_id] = profile
            return profile
            
        except Exception as e:
            logger.error(f"Error loading user preferences for {user_id}: {e}")
            return self.create_default_profile(user_id)
    
    def save_user_preferences(self, user_id: str, profile: Dict[str, Any]) -> bool:
        """Save user's preference profile to storage"""
        try:
            profile_path = self.get_user_profile_path(user_id)
            profile["last_updated"] = datetime.now().isoformat()
            
            with open(profile_path, 'w', encoding='utf-8') as f:
                json.dump(profile, f, indent=2, ensure_ascii=False)
            
            # Update cache
            self.session_cache[user_id] = profile
            return True
            
        except Exception as e:
            logger.error(f"Error saving user preferences for {user_id}: {e}")
            return False
    
    def create_default_profile(self, user_id: str) -> Dict[str, Any]:
        """Create default preference profile for new user"""
        return {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "interaction_count": 0,
            "preferences": {
                "venue_types": {},
                "atmosphere": {},
                "budget": {},
                "time_preferences": {},
                "group_types": {},
                "cuisine": {},
                "amenities": {}
            },
            "location_patterns": {},
            "successful_recommendations": [],
            "rejected_recommendations": [],
            "constraints_history": [],
            "group_coordination_history": [],
            "confidence_scores": {
                "venue_types": 0.0,
                "atmosphere": 0.0,
                "budget": 0.0,
                "time_preferences": 0.0
            }
        }
    
    def extract_preferences_from_query(self, query: str) -> Dict[str, List[str]]:
        """Extract preference indicators from natural language query using LLM"""
        from langchain_google_genai import ChatGoogleGenerativeAI
        from ...core.config import settings
        
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.1
            )
            
            prompt = f"""
            Analyze this user query and extract preference indicators: "{query}"
            
            Extract preferences for these categories:
            - venue_types: cafe, restaurant, bar, library, mall, park, gym, etc.
            - atmosphere: quiet, lively, romantic, casual, professional, cozy, etc.
            - budget: budget/cheap, affordable, moderate, expensive, luxury
            - time_preferences: morning, afternoon, evening, night
            - cuisine: vegetarian, vegan, indian, chinese, italian, continental, etc.
            - amenities: wifi, parking, outdoor, indoor, ac, music, etc.
            
            Return as JSON format:
            {{"venue_types": ["cafe"], "atmosphere": ["quiet"], "budget": ["affordable"], ...}}
            
            Only include categories where clear preferences are mentioned. Return empty lists for unclear categories.
            """
            
            response = llm.invoke(prompt)
            
            # Parse LLM response
            import json
            try:
                extracted = json.loads(response.content.strip())
                return extracted
            except json.JSONDecodeError:
                # Fallback to simple keyword matching if JSON parsing fails
                return self._fallback_preference_extraction(query)
                
        except Exception as e:
            print(f"Error extracting preferences with LLM: {e}")
            return self._fallback_preference_extraction(query)
    
    def _fallback_preference_extraction(self, query: str) -> Dict[str, List[str]]:
        """Fallback preference extraction using basic keyword matching"""
        query_lower = query.lower()
        extracted = defaultdict(list)
        
        # Basic keyword matching as fallback
        venue_keywords = {
            "cafe": ["cafe", "coffee"],
            "restaurant": ["restaurant", "dining", "food"],
            "bar": ["bar", "drinks", "alcohol"],
            "library": ["library", "study"],
            "mall": ["mall", "shopping"]
        }
        
        for venue_type, keywords in venue_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                extracted["venue_types"].append(venue_type)
        
        # Basic atmosphere detection
        if any(word in query_lower for word in ["quiet", "peaceful", "calm"]):
            extracted["atmosphere"].append("quiet")
        if any(word in query_lower for word in ["lively", "busy", "active"]):
            extracted["atmosphere"].append("lively")
            
        return dict(extracted)
    
    def update_preferences_from_interaction(self, user_id: str, interaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user preferences based on interaction data"""
        profile = self.load_user_preferences(user_id)
        
        # Extract interaction type and details
        interaction_type = interaction_data.get("type", "query")  # query, selection, rating
        query = interaction_data.get("query", "")
        selected_venue = interaction_data.get("selected_venue")
        rating = interaction_data.get("rating")
        venue_details = interaction_data.get("venue_details", {})
        
        # Extract preferences from query
        if query:
            extracted_prefs = self.extract_preferences_from_query(query)
            self._update_preference_scores(profile, extracted_prefs, 1.0)
        
        # Learn from venue selection
        if selected_venue and venue_details:
            self._learn_from_venue_selection(profile, venue_details, rating or 5)
        
        # Update interaction count
        profile["interaction_count"] += 1
        
        # Update confidence scores based on interaction count
        self._update_confidence_scores(profile)
        
        # Record successful recommendation
        if rating and rating >= 4:
            profile["successful_recommendations"].append({
                "timestamp": datetime.now().isoformat(),
                "query": query,
                "venue": selected_venue,
                "rating": rating
            })
        elif rating and rating <= 2:
            profile["rejected_recommendations"].append({
                "timestamp": datetime.now().isoformat(),
                "query": query,
                "venue": selected_venue,
                "rating": rating
            })
        
        # Save updated profile
        self.save_user_preferences(user_id, profile)
        
        return profile
    
    def _update_preference_scores(self, profile: Dict[str, Any], extracted_prefs: Dict[str, List[str]], weight: float):
        """Update preference scores with weighted learning"""
        for category, items in extracted_prefs.items():
            if category in profile["preferences"]:
                for item in items:
                    current_score = profile["preferences"][category].get(item, 0.0)
                    # Use exponential moving average for learning
                    new_score = current_score * 0.8 + weight * 0.2
                    profile["preferences"][category][item] = round(new_score, 3)
    
    def _learn_from_venue_selection(self, profile: Dict[str, Any], venue_details: Dict[str, Any], rating: int):
        """Learn preferences from selected venue characteristics using LLM analysis"""
        from langchain_google_genai import ChatGoogleGenerativeAI
        from ...core.config import settings
        
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash", 
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.1
            )
            
            # Extract venue characteristics
            categories = venue_details.get("categories", [])
            category_names = [cat.get("name", "") for cat in categories]
            price_level = venue_details.get("price", 2)
            venue_rating = venue_details.get("rating", 0)
            venue_name = venue_details.get("name", "")
            
            prompt = f"""
            A user selected this venue and rated it {rating}/5:
            - Name: {venue_name}
            - Categories: {', '.join(category_names)}
            - Price level: {price_level}/4
            - Venue rating: {venue_rating}
            
            Based on this selection, what preferences can we infer?
            Extract learnable preferences for these categories:
            - venue_types: specific types of venues they like
            - atmosphere: what kind of ambiance they prefer
            - budget: price range preference
            - amenities: features they value
            
            Return as JSON:
            {{"venue_types": ["cafe"], "atmosphere": ["casual"], "budget": ["moderate"], "amenities": ["wifi"]}}
            
            Consider the user's rating when determining preference strength.
            """
            
            response = llm.invoke(prompt)
            
            # Parse and apply learned preferences
            import json
            try:
                learned_prefs = json.loads(response.content.strip())
                weight = max(0.1, rating / 5.0)  # Convert rating to learning weight
                self._update_preference_scores(profile, learned_prefs, weight)
            except json.JSONDecodeError:
                # Fallback to basic learning
                self._fallback_venue_learning(profile, venue_details, rating)
                
        except Exception as e:
            print(f"Error learning from venue with LLM: {e}")
            self._fallback_venue_learning(profile, venue_details, rating)
    
    def _fallback_venue_learning(self, profile: Dict[str, Any], venue_details: Dict[str, Any], rating: int):
        """Fallback venue learning using basic rules"""
        categories = venue_details.get("categories", [])
        price_level = venue_details.get("price", 2)
        weight = max(0.1, rating / 5.0)
        
        # Basic venue type learning
        venue_prefs = defaultdict(list)
        
        for category in categories:
            category_name = category.get("name", "").lower()
            if "cafe" in category_name or "coffee" in category_name:
                venue_prefs["venue_types"].append("cafe")
            elif "restaurant" in category_name:
                venue_prefs["venue_types"].append("restaurant")
            elif "bar" in category_name:
                venue_prefs["venue_types"].append("bar")
        
        # Basic price learning
        price_mapping = {1: "budget", 2: "affordable", 3: "moderate", 4: "expensive"}
        if price_level in price_mapping:
            venue_prefs["budget"].append(price_mapping[price_level])
        
        self._update_preference_scores(profile, dict(venue_prefs), weight)
    
    def _update_confidence_scores(self, profile: Dict[str, Any]):
        """Update confidence scores based on interaction history"""
        interaction_count = profile["interaction_count"]
        
        for category in profile["confidence_scores"]:
            # Base confidence on interaction count and preference diversity
            pref_count = len(profile["preferences"].get(category, {}))
            base_confidence = min(1.0, interaction_count / 10.0)  # Max confidence after 10 interactions
            diversity_bonus = min(0.2, pref_count * 0.05)  # Bonus for having diverse preferences
            
            profile["confidence_scores"][category] = round(base_confidence + diversity_bonus, 3)
    
    def get_personalized_recommendations(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate personalized recommendations based on learned preferences"""
        profile = self.load_user_preferences(user_id)
        
        # Extract context information
        current_time = datetime.now().hour
        query = context.get("query", "")
        group_size = context.get("group_size", 1)
        
        recommendations = {
            "user_id": user_id,
            "confidence_level": self._calculate_overall_confidence(profile),
            "personalized_filters": {},
            "suggested_categories": [],
            "avoid_categories": [],
            "budget_preference": None,
            "time_based_suggestions": []
        }
        
        # Generate category recommendations based on learned preferences
        for category, prefs in profile["preferences"].items():
            if prefs:
                # Get top preferences with confidence above threshold
                sorted_prefs = sorted(prefs.items(), key=lambda x: x[1], reverse=True)
                confident_prefs = [(item, score) for item, score in sorted_prefs if score > 0.3]
                
                if confident_prefs:
                    recommendations["suggested_categories"].extend([item for item, _ in confident_prefs[:3]])
                    recommendations["personalized_filters"][category] = confident_prefs[:2]
        
        # Determine budget preference
        budget_prefs = profile["preferences"].get("budget", {})
        if budget_prefs:
            top_budget = max(budget_prefs.items(), key=lambda x: x[1])
            if top_budget[1] > 0.4:  # Confidence threshold
                recommendations["budget_preference"] = top_budget[0]
        
        # Time-based suggestions
        if current_time < 12:
            recommendations["time_based_suggestions"].append("morning")
        elif current_time < 17:
            recommendations["time_based_suggestions"].append("afternoon")  
        else:
            recommendations["time_based_suggestions"].append("evening")
        
        return recommendations
    
    def _calculate_overall_confidence(self, profile: Dict[str, Any]) -> float:
        """Calculate overall confidence in user preferences"""
        confidence_scores = profile.get("confidence_scores", {})
        if not confidence_scores:
            return 0.0
        
        return round(sum(confidence_scores.values()) / len(confidence_scores), 3)
    
    def learn_from_group_coordination(self, user_id: str, group_data: Dict[str, Any], 
                                    selected_venue: Dict[str, Any], satisfaction_rating: int):
        """Learn from group coordination outcomes"""
        profile = self.load_user_preferences(user_id)
        
        # Record group coordination history
        coordination_record = {
            "timestamp": datetime.now().isoformat(),
            "group_size": group_data.get("group_size", 0),
            "meeting_purpose": group_data.get("meeting_purpose", ""),
            "selected_venue": selected_venue.get("name", ""),
            "venue_category": [cat.get("name") for cat in selected_venue.get("categories", [])],
            "satisfaction_rating": satisfaction_rating,
            "travel_time": group_data.get("user_travel_time", 0)
        }
        
        profile["group_coordination_history"].append(coordination_record)
        
        # Learn preferences from successful group coordination
        if satisfaction_rating >= 4:
            # Extract learnable patterns
            meeting_purpose = group_data.get("meeting_purpose", "").lower()
            if meeting_purpose:
                extracted_prefs = self.extract_preferences_from_query(meeting_purpose)
                weight = satisfaction_rating / 5.0
                self._update_preference_scores(profile, extracted_prefs, weight)
        
        # Update group type preferences
        group_size = group_data.get("group_size", 1)
        if group_size == 1:
            group_type = "solo"
        elif group_size <= 3:
            group_type = "friends"
        elif group_size <= 6:
            group_type = "small_group"
        else:
            group_type = "large_group"
        
        current_score = profile["preferences"]["group_types"].get(group_type, 0.0)
        weight = satisfaction_rating / 5.0
        new_score = current_score * 0.8 + weight * 0.2
        profile["preferences"]["group_types"][group_type] = round(new_score, 3)
        
        # Save updated profile
        self.save_user_preferences(user_id, profile)
        
        return profile
    
    def get_user_insights(self, user_id: str) -> Dict[str, Any]:
        """Generate insights about user's learned preferences"""
        profile = self.load_user_preferences(user_id)
        
        insights = {
            "user_id": user_id,
            "profile_maturity": self._get_profile_maturity(profile),
            "top_preferences": {},
            "behavioral_patterns": {},
            "recommendations_success_rate": 0.0,
            "preferred_times": [],
            "preferred_group_sizes": [],
            "location_preferences": {}
        }
        
        # Extract top preferences for each category
        for category, prefs in profile["preferences"].items():
            if prefs:
                top_pref = max(prefs.items(), key=lambda x: x[1])
                if top_pref[1] > 0.3:  # Minimum confidence threshold
                    insights["top_preferences"][category] = {
                        "preference": top_pref[0],
                        "confidence": top_pref[1]
                    }
        
        # Calculate success rate
        successful = len(profile.get("successful_recommendations", []))
        rejected = len(profile.get("rejected_recommendations", []))
        total_rated = successful + rejected
        
        if total_rated > 0:
            insights["recommendations_success_rate"] = round(successful / total_rated, 3)
        
        # Analyze group coordination patterns
        group_history = profile.get("group_coordination_history", [])
        if group_history:
            # Find preferred group sizes
            group_sizes = [record.get("group_size", 1) for record in group_history 
                          if record.get("satisfaction_rating", 0) >= 4]
            if group_sizes:
                insights["preferred_group_sizes"] = list(set(group_sizes))
            
            # Find successful meeting purposes
            successful_purposes = [record.get("meeting_purpose", "") for record in group_history 
                                 if record.get("satisfaction_rating", 0) >= 4]
            if successful_purposes:
                purpose_counter = Counter(successful_purposes)
                insights["behavioral_patterns"]["successful_meeting_types"] = dict(purpose_counter.most_common(3))
        
        return insights
    
    def _get_profile_maturity(self, profile: Dict[str, Any]) -> str:
        """Determine maturity level of user profile"""
        interaction_count = profile.get("interaction_count", 0)
        confidence_avg = self._calculate_overall_confidence(profile)
        
        if interaction_count < 3 or confidence_avg < 0.3:
            return "new"
        elif interaction_count < 10 or confidence_avg < 0.6:
            return "developing"
        elif interaction_count < 20 or confidence_avg < 0.8:
            return "established"
        else:
            return "mature"
    
    def cleanup_old_data(self, days_to_keep: int = 90):
        """Clean up old preference data to prevent storage bloat"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        try:
            for filename in os.listdir(self.storage_path):
                if filename.startswith("user_") and filename.endswith(".json"):
                    filepath = os.path.join(self.storage_path, filename)
                    
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            profile = json.load(f)
                        
                        last_updated = datetime.fromisoformat(profile.get("last_updated", cutoff_date.isoformat()))
                        
                        if last_updated < cutoff_date:
                            # Archive or remove old profiles
                            archive_path = os.path.join(self.storage_path, "archived")
                            os.makedirs(archive_path, exist_ok=True)
                            
                            archive_filepath = os.path.join(archive_path, filename)
                            os.rename(filepath, archive_filepath)
                            logger.info(f"Archived old preference profile: {filename}")
                            
                    except Exception as e:
                        logger.error(f"Error processing file {filename}: {e}")
                        
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export user data for privacy compliance"""
        profile = self.load_user_preferences(user_id)
        
        export_data = {
            "export_timestamp": datetime.now().isoformat(),
            "user_profile": profile,
            "summary": self.get_user_insights(user_id),
            "data_usage_note": "This data is used to personalize venue recommendations and improve coordination accuracy."
        }
        
        return export_data
    
    def delete_user_data(self, user_id: str) -> bool:
        """Delete all user data for privacy compliance"""
        try:
            profile_path = self.get_user_profile_path(user_id)
            
            if os.path.exists(profile_path):
                os.remove(profile_path)
            
            # Remove from session cache
            if user_id in self.session_cache:
                del self.session_cache[user_id]
            
            logger.info(f"Deleted user data for user_id: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting user data for {user_id}: {e}")
            return False


# Factory function for creating preference learning system
def create_preference_learning_system() -> PreferenceLearningSystem:
    """Create and return a preference learning system instance"""
    return PreferenceLearningSystem()