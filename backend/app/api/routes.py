from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import asyncio
from datetime import datetime

from ..agents.solo_agent import create_solo_agent
from ..core.config import settings

# Create router
router = APIRouter()

# Global solo agent instance (initialized once)
solo_agent = None

# Pydantic models for request/response
class QueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query from user", example="study places nearby")
    user_location: Optional[str] = Field(None, description="User coordinates as 'lat,lng'", example="12.9716,77.5946")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context information")

class PlaceDetailsRequest(BaseModel):
    fsq_place_id: str = Field(..., description="Foursquare place ID")
    fields: Optional[List[str]] = Field(default=None, description="Specific fields to retrieve")

class TitleGenerationRequest(BaseModel):
    message: str = Field(..., description="User message to generate title from", example="Find me coffee shops near Indiranagar")
    max_length: Optional[int] = Field(default=100, description="Maximum title length", example=100)

class APIResponse(BaseModel):
    status: str = Field(..., description="Response status")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    error: Optional[str] = Field(None, description="Error message if any")
    timestamp: str = Field(..., description="Response timestamp")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")


def get_solo_agent():
    """Get or create solo agent instance"""
    global solo_agent
    if solo_agent is None:
        solo_agent = create_solo_agent(default_location="12.9716,77.5946")
    return solo_agent


@router.get("/", response_model=APIResponse)
async def health_check():
    """Health check endpoint"""
    return APIResponse(
        status="healthy",
        data={"message": "Coordinate API is running", "version": "1.0.0"},
        timestamp=datetime.now().isoformat()
    )


@router.post("/solo/query", response_model=APIResponse)
async def process_solo_query(request: QueryRequest):
    """
    Process a natural language query in solo mode
    
    This endpoint:
    1. Extracts user intent from natural language
    2. Resolves location preferences
    3. Searches for relevant places using Foursquare API
    4. Provides intelligent recommendations with explanations
    """
    start_time = datetime.now()
    
    try:
        # Validate query
        if not request.query or not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Get solo agent
        agent = get_solo_agent()
        
        # Process query
        result = await asyncio.to_thread(
            agent.process_query,
            request.query,
            request.user_location
        )
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        # Format response
        if result.get("status") == "success":
            return APIResponse(
                status="success",
                data=result,
                timestamp=datetime.now().isoformat(),
                processing_time=processing_time
            )
        else:
            return APIResponse(
                status="error",
                error=result.get("error", "Unknown error occurred"),
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


@router.post("/solo/place-details", response_model=APIResponse)
async def get_place_details(request: PlaceDetailsRequest):
    """
    Get detailed information about a specific place
    
    Retrieve comprehensive details about a place using its Foursquare ID
    """
    start_time = datetime.now()
    
    try:
        # Get solo agent
        agent = get_solo_agent()
        
        # Get place details
        result = await asyncio.to_thread(
            agent.get_place_details,
            request.fsq_place_id,
            request.fields
        )
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        # Format response
        if result.get("status") == "success" or "place_details" in result:
            return APIResponse(
                status="success",
                data=result,
                timestamp=datetime.now().isoformat(),
                processing_time=processing_time
            )
        else:
            return APIResponse(
                status="error", 
                error=result.get("error", "Failed to retrieve place details"),
                timestamp=datetime.now().isoformat(),
                processing_time=processing_time
            )
            
    except Exception as e:
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="error",
            error=str(e),
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time
        )


@router.get("/solo/examples")
async def get_query_examples():
    """
    Get example queries that work well with the system
    """
    examples = [
        {
            "category": "Study & Work",
            "queries": [
                "study places nearby",
                "quiet cafe for work with wifi",
                "library near MG Road",
                "peaceful place to read and study"
            ]
        },
        {
            "category": "Dining",
            "queries": [
                "family dinner near jayanagar with kids",
                "affordable lunch places around here",
                "romantic dinner for date night",
                "best breakfast spots nearby"
            ]
        },
        {
            "category": "Entertainment",
            "queries": [
                "fun places for tonight",
                "family entertainment center with kids",
                "movie theater near me",
                "activities for weekend with friends"
            ]
        },
        {
            "category": "Coffee & Casual",
            "queries": [
                "cozy cafe for catch up with friends",
                "coffee shop for business meeting",
                "tea place with good ambience",
                "casual place to hangout"
            ]
        }
    ]
    
    return APIResponse(
        status="success",
        data={"examples": examples},
        timestamp=datetime.now().isoformat()
    )


@router.get("/solo/supported-intents")
async def get_supported_intents():
    """
    Get list of supported intent categories
    """
    intents = {
        "primary_intents": [
            "study", "work", "dining", "coffee", "entertainment", 
            "nightlife", "shopping", "fitness", "healthcare", "services"
        ],
        "group_types": [
            "solo", "family", "friends", "couple", "business"
        ],
        "time_contexts": [
            "morning", "afternoon", "evening", "night", "weekend", "weekday"
        ],
        "budget_preferences": [
            "budget", "affordable", "moderate", "expensive", "luxury"
        ],
        "atmosphere_types": [
            "quiet", "lively", "romantic", "casual", "professional", 
            "family-friendly", "cozy", "spacious"
        ]
    }
    
    return APIResponse(
        status="success",
        data=intents,
        timestamp=datetime.now().isoformat()
    )


async def generate_title_with_gemini(message: str, max_length: int = 100) -> str:
    """
    Generate an intelligent title for a chat conversation using Gemini AI
    """
    try:
        import google.generativeai as genai
        
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Create prompt for title generation
        prompt = f"""
        Generate a concise, descriptive title for a conversation that started with this message:
        
        "{message}"
        
        Requirements:
        - Maximum {max_length} characters
        - Be descriptive and relevant
        - Keep it conversational but concise
        - Don't include quotes or special formatting
        - Focus on the main topic or intent
        
        Return only the title, nothing else.
        """
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Clean up the response
        title = response.text.strip()
        
        # Ensure it's within the max length
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
        
        return title
        
    except Exception as e:
        # Fallback to simple title generation
        print(f"Error generating title with Gemini: {e}")
        
        # Simple fallback: use first 50 characters or first sentence
        if len(message) <= max_length:
            return message
        
        # Try to find a sentence boundary
        for i in range(min(50, len(message))):
            if message[i] in '.!?':
                return message[:i+1]
        
        return message[:max_length-3] + "..."


@router.post("/solo/generate-title", response_model=APIResponse)
async def generate_chat_title(request: TitleGenerationRequest):
    """
    Generate an intelligent title for a chat conversation using Gemini AI
    
    Takes a user message and generates a concise, descriptive title
    that captures the essence of the conversation topic.
    """
    start_time = datetime.now()
    
    try:
        # Validate input
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Call Gemini API to generate title
        title = await generate_title_with_gemini(request.message, request.max_length)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="success",
            data={
                "title": title,
                "original_message": request.message,
                "max_length": request.max_length,
                "generated_with": "gemini-2.0-flash-exp"
            },
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


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint for debugging"""
    return APIResponse(
        status="success",
        data={
            "message": "Test endpoint working",
            "timestamp": datetime.now().isoformat(),
            "agent_initialized": solo_agent is not None
        },
        timestamp=datetime.now().isoformat()
    )

from ..agents.group_agent import create_group_agent

# Global group agent instance
group_agent = None

def get_group_agent():
    global group_agent
    if group_agent is None:
        group_agent = create_group_agent()
    return group_agent

group_router = APIRouter()

class GroupMember(BaseModel):
    name: str
    location: str
    preferences: Optional[str] = None
    constraints: Optional[str] = None
    group_pref: Optional[str] = None

class GroupRequest(BaseModel):
    members: List[GroupMember]
    meeting_time: Optional[str] = None  # e.g. "2025-08-30T21:00:00"

@group_router.post("/group/coordinate", response_model=APIResponse)
async def coordinate_group_meetup(request: GroupRequest):
    """
    Coordinate a group meetup:
    - Resolve locations
    - Compute fair coordinates
    - Extract intent
    - Query Foursquare
    - Assess safety
    - Personalize recommendations
    """
    start_time = datetime.now()
    try:
        agent = get_group_agent()
        result = await agent.coordinate_group_meetup(
            members=[m.dict() for m in request.members],
            meeting_time=request.meeting_time
        )
        end_time = datetime.now()
        return APIResponse(
            status="success",
            data=result,
            timestamp=datetime.now().isoformat(),
            processing_time=(end_time - start_time).total_seconds()
        )
    except Exception as e:
        end_time = datetime.now()
        return APIResponse(
            status="error",
            error=str(e),
            timestamp=datetime.now().isoformat(),
            processing_time=(end_time - start_time).total_seconds()
        )


# Error handlers

solo_router = router
group_router = group_router
