from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import asyncio
from datetime import datetime

from ..agents.solo_agent import create_solo_agent

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


# Error handlers
