from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import json

from app.agents.solo_page.solo_page_agent import run_solo_page_agent
import google.generativeai as genai
from app.core.config import settings

router = APIRouter()

class SoloPageRequest(BaseModel):
    # Support both structured preferences and text query formats
    purpose: Optional[str] = None
    mood: Optional[str] = None
    budget: Optional[str] = None
    time: Optional[str] = None
    transport: Optional[str] = None
    location: Optional[str] = None
    user_location: Optional[str] = None
    user_lat: Optional[float] = 12.9716
    user_lng: Optional[float] = 77.5946
    
    # Support rich query format for mood/routine based requests
    query: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class SoloPageTitleRequest(BaseModel):
    purpose: str
    mood: Optional[str] = None
    budget: Optional[str] = None
    time: Optional[str] = None
    transport: Optional[str] = None
    location: Optional[str] = None

class APIResponse(BaseModel):
    status: str = Field(..., description="Response status")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    error: Optional[str] = Field(None, description="Error message if any")
    timestamp: str = Field(..., description="Response timestamp")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")

@router.post("/preferences", response_model=APIResponse)
async def get_solo_page_recommendations(request: SoloPageRequest):
    """
    Get place recommendations based on user preferences from the solo page form.
    """
    start_time = datetime.now()
    
    try:
        # Handle both query and structured preference formats
        if request.query:
            # Rich query format (from mood/routine layout)
            query = request.query
            request_dict = {
                "user_query": query,
                "user_location": request.user_location or f"{request.user_lat},{request.user_lng}",
                "context": request.context or {}
            }
        else:
            # Structured preferences format
            if not request.purpose:
                raise HTTPException(status_code=400, detail="Purpose is required when not using query format")
            
            # Convert preferences to a query string
            query_parts = [f"Find {request.purpose} places"]
            
            if request.mood:
                query_parts.append(f"for {request.mood} mood")
            if request.budget:
                query_parts.append(f"budget: {request.budget}")
            if request.time:
                query_parts.append(f"time: {request.time}")
            if request.transport:
                query_parts.append(f"transport: {request.transport}")
            if request.location:
                query_parts.append(f"near {request.location}")
            
            query = ", ".join(query_parts)
            
            request_dict = {
                "user_query": query,
                "user_location": request.user_location or f"{request.user_lat},{request.user_lng}",
                "preferences": {
                    "purpose": request.purpose,
                    "mood": request.mood,
                    "budget": request.budget,
                    "time": request.time,
                    "transport": request.transport,
                    "location": request.location
                }
            }
        
        result = run_solo_page_agent(request_dict)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="success",
            data=result,
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="error",
            error=str(e),
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time
        )

@router.post("/generate-title", response_model=APIResponse)
async def generate_solo_page_title(request: SoloPageTitleRequest):
    """
    Generate a descriptive title for a solo page recommendation session.
    """
    start_time = datetime.now()
    
    try:
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Create a context-aware title based on preferences
        preferences_text = f"purpose: {request.purpose}"
        if request.mood:
            preferences_text += f", mood: {request.mood}"
        if request.budget:
            preferences_text += f", budget: {request.budget}"
        if request.time:
            preferences_text += f", time: {request.time}"
        if request.location:
            preferences_text += f", location: {request.location}"
        
        prompt = f"""
        Based on the following user preferences for finding places, create a short, descriptive title for their recommendation session.
        
        Requirements:
        - Maximum 80 characters
        - Be descriptive and capture the key preferences
        - Use appropriate emojis when relevant
        - Make it conversational and friendly
        - Focus on the main purpose and key attributes
        
        User preferences: {preferences_text}
        
        Generate only the title, nothing else.
        """
        
        # Generate title
        response = model.generate_content(prompt)
        title = response.text.strip()
        
        # Ensure it's within 80 characters
        if len(title) > 80:
            title = title[:77] + "..."
            
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="success",
            data={
                "title": title,
                "preferences": request.dict(),
                "generated_with": "gemini-2.0-flash-exp"
            },
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time
        )
        
    except Exception as e:
        # Fallback to simple title generation
        fallback_title = f"🔍 {request.purpose.title()} Recommendations"
        if request.mood:
            fallback_title += f" ({request.mood})"
        
        # Ensure fallback is within 80 characters
        if len(fallback_title) > 80:
            fallback_title = fallback_title[:77] + "..."
            
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="success",
            data={
                "title": fallback_title,
                "preferences": request.dict(),
                "generated_with": "fallback",
                "error": str(e)
            },
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time
        )

@router.get("/examples", response_model=APIResponse)
async def get_solo_page_examples():
    """
    Get example preference combinations for the solo page.
    """
    examples = [
        {
            "title": "🍕 Casual Food Hunt",
            "preferences": {
                "purpose": "food",
                "mood": "casual",
                "budget": "affordable",
                "time": "now",
                "location": "nearby"
            }
        },
        {
            "title": "💕 Romantic Dinner",
            "preferences": {
                "purpose": "food",
                "mood": "romantic",
                "budget": "moderate",
                "time": "evening",
                "transport": "driving"
            }
        },
        {
            "title": "☕ Work & Coffee",
            "preferences": {
                "purpose": "coffee",
                "mood": "quiet",
                "budget": "budget",
                "time": "today",
                "transport": "walking"
            }
        },
        {
            "title": "🛍️ Weekend Shopping",
            "preferences": {
                "purpose": "shopping",
                "mood": "lively",
                "budget": "moderate",
                "time": "weekend",
                "location": "any"
            }
        }
    ]
    
    return APIResponse(
        status="success",
        data={"examples": examples},
        timestamp=datetime.now().isoformat()
    )
