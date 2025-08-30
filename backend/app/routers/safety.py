from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import openai
import os

router = APIRouter()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/safe-route")
async def find_safe_route(request: Dict[str, Any]):
    """
    Safety Feature: Safe Route Finder
    Extends your existing location services with safety considerations
    """
    try:
        start_location = request.get("start_location", {})
        end_location = request.get("end_location", {})
        time_of_day = request.get("time_of_day", "day")
        user_preferences = request.get("safety_preferences", {})
        
        prompt = f"""
        Find the safest route between:
        Start: {start_location}
        End: {end_location}
        Time: {time_of_day}
        Safety preferences: {user_preferences}
        
        Consider: well-lit areas, open venues, emergency services, crowd density
        Provide route with safety score and alternative options.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400
        )
        
        return {
            "safe_route": response.choices[0].message.content,
            "safety_optimized": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/area-safety")
async def get_area_safety(request: Dict[str, Any]):
    """
    Get safety assessment for a specific area
    Extends your existing venue information
    """
    try:
        coordinates = request.get("coordinates", {})
        radius = request.get("radius", 1000)
        time_of_day = request.get("time_of_day", "day")
        
        prompt = f"""
        Assess safety for area:
        Coordinates: {coordinates}
        Radius: {radius}m
        Time: {time_of_day}
        
        Evaluate: lighting, open venues, emergency services, crowd patterns
        Provide safety score (0-100) and recommendations.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        
        return {
            "area_safety": response.choices[0].message.content,
            "safety_assessed": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/safety-alerts")
async def generate_safety_alerts(request: Dict[str, Any]):
    """
    Generate proactive safety alerts
    Extends your existing notification system
    """
    try:
        user_location = request.get("user_location", {})
        current_context = request.get("context", {})
        user_preferences = request.get("safety_preferences", {})
        
        prompt = f"""
        Generate safety alerts based on:
        User location: {user_location}
        Current context: {current_context}
        Safety preferences: {user_preferences}
        
        Provide 2-3 proactive safety recommendations.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250
        )
        
        return {
            "safety_alerts": response.choices[0].message.content,
            "proactive": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emergency-coordination")
async def coordinate_emergency_contacts(request: Dict[str, Any]):
    """
    Coordinate with emergency contacts
    Extends your existing user profile system
    """
    try:
        user_id = request.get("user_id")
        emergency_type = request.get("emergency_type", "general")
        location = request.get("location", {})
        
        prompt = f"""
        Emergency coordination for user {user_id}:
        Type: {emergency_type}
        Location: {location}
        
        Provide emergency response recommendations and contact coordination.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        
        return {
            "emergency_response": response.choices[0].message.content,
            "coordinated": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/safety-tips")
async def get_safety_tips():
    """
    Get general safety tips and best practices
    Educational content for users
    """
    try:
        prompt = """
        Provide 5 general safety tips for urban navigation:
        - Walking at night
        - Using public transport
        - Meeting new people
        - Emergency situations
        - Location sharing safety
        
        Keep tips practical and actionable.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400
        )
        
        return {
            "safety_tips": response.choices[0].message.content,
            "educational": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
