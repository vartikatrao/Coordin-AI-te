from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import openai
import os

router = APIRouter()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/learn-preferences")
async def learn_user_preferences(request: Dict[str, Any]):
    """
    Learn from user behavior to improve recommendations
    Extends your existing user profile system
    """
    try:
        user_id = request.get("user_id")
        user_actions = request.get("actions", [])  # Recent searches, clicks, etc.
        current_preferences = request.get("current_preferences", {})
        
        # Use AI to analyze behavior and suggest preference updates
        prompt = f"""
        Analyze user behavior and suggest preference updates:
        
        Recent actions: {user_actions}
        Current preferences: {current_preferences}
        
        Suggest 3-5 preference updates based on behavior patterns.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        
        return {
            "suggested_preferences": response.choices[0].message.content,
            "learning_enabled": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/routine-analysis")
async def analyze_user_routine(request: Dict[str, Any]):
    """
    Analyze user routines for proactive suggestions
    Extends your existing location tracking
    """
    try:
        user_id = request.get("user_id")
        location_history = request.get("location_history", [])
        time_patterns = request.get("time_patterns", {})
        
        prompt = f"""
        Analyze user routine patterns:
        
        Location history: {location_history[:10]}  # Last 10 locations
        Time patterns: {time_patterns}
        
        Identify 2-3 routine patterns and suggest proactive actions.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        
        return {
            "routine_patterns": response.choices[0].message.content,
            "proactive_suggestions": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contextual-suggestions")
async def get_contextual_suggestions(request: Dict[str, Any]):
    """
    Get context-aware suggestions based on time, weather, location
    Extends your existing search functionality
    """
    try:
        current_context = request.get("context", {})
        user_preferences = request.get("preferences", {})
        
        prompt = f"""
        Provide contextual suggestions based on:
        
        Current context: {current_context}
        User preferences: {user_preferences}
        
        Give 3-5 context-aware recommendations.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        
        return {
            "contextual_suggestions": response.choices[0].message.content,
            "context_aware": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-insights/{user_id}")
async def get_user_insights(user_id: str):
    """
    Get AI-generated insights about user behavior
    Extends your existing profile analytics
    """
    try:
        # This would typically fetch user data from your existing system
        # For now, return a template insight
        
        prompt = f"""
        Generate user insights for user {user_id}:
        
        Provide 3-4 insights about user behavior and preferences.
        Focus on actionable recommendations.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250
        )
        
        return {
            "user_id": user_id,
            "insights": response.choices[0].message.content,
            "ai_generated": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
