from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import openai
import os

router = APIRouter()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/solo-recommendations")
async def get_solo_recommendations(request: Dict[str, Any]):
    """
    Solo Mode: Hyperlocal Smart Assistant
    Extends your existing location search with AI-powered recommendations
    """
    try:
        user_preferences = request.get("preferences", {})
        current_location = request.get("current_location", {})
        time_of_day = request.get("time_of_day", "day")
        
        # Use AI to enhance recommendations based on your existing venue data
        prompt = f"""
        Based on user preferences: {user_preferences}
        Current time: {time_of_day}
        Location: {current_location}
        
        Provide 3-5 personalized venue recommendations with reasoning.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        
        return {
            "recommendations": response.choices[0].message.content,
            "enhanced_by_ai": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/group-meetup")
async def find_group_meetup(request: Dict[str, Any]):
    """
    Group Mode: Equidistant Meetup Finder
    Extends your existing restaurant search for group coordination
    """
    try:
        group_members = request.get("group_members", [])
        purpose = request.get("purpose", "meeting")
        
        # Use AI to find optimal meeting point based on your existing venue data
        prompt = f"""
        Find the best meeting location for a group with purpose: {purpose}
        Group members: {group_members}
        
        Consider: equidistant travel, venue type matching purpose, safety
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400
        )
        
        return {
            "meetup_plan": response.choices[0].message.content,
            "ai_optimized": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/proactive-alert")
async def generate_proactive_alert(request: Dict[str, Any]):
    """
    Proactive Alerts based on user context
    Extends your existing location awareness
    """
    try:
        user_context = request.get("context", {})
        current_location = request.get("location", {})
        
        prompt = f"""
        Generate a proactive alert based on:
        User context: {user_context}
        Current location: {current_location}
        
        Provide a helpful, context-aware suggestion.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        
        return {
            "alert": response.choices[0].message.content,
            "proactive": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
