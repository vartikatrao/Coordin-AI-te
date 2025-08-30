from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import asyncio
from datetime import datetime

from ..agents.solo_agent import create_solo_agent
from ..agents.group_agent import create_group_agent, GroupCoordinationAgent  # Import both the factory and the class if needed
from ..agents.tools.preference_learning import create_preference_learning_system

# Solo Router
solo_router = APIRouter(prefix="/solo", tags=["solo"])

# Group Router
group_router = APIRouter(prefix="/group", tags=["group"])

# Global agent instances (initialized once)
solo_agent = None
group_agent = None
preference_system = None

# Pydantic models for request/response
class QueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query from user", example="study places nearby")
    user_location: Optional[str] = Field(None, description="User coordinates as 'lat,lng'", example="12.9716,77.5946")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context information")

class PlaceDetailsRequest(BaseModel):
    fsq_place_id: str = Field(..., description="Foursquare place ID")
    fields: Optional[List[str]] = Field(default=None, description="Specific fields to retrieve")

class GroupMember(BaseModel):
    name: str = Field(..., description="Member name", example="Alice")
    age: int = Field(..., description="Member age", example=25, ge=13, le=100)
    gender: str = Field(..., description="Member gender", example="F")
    location: str = Field(..., description="Member location as 'lat,lng'", example="12.9716,77.5946")
    preferences: str = Field(..., description="Personal preferences in natural language", example="loves quiet cafes, vegetarian food")
    constraints: str = Field(..., description="Constraints in natural language", example="budget under 500 rupees, no stairs")

class GroupCoordinationRequest(BaseModel):
    members: List[GroupMember] = Field(..., description="List of group members", min_items=2, max_items=10)
    meeting_purpose: Optional[str] = Field("", description="Purpose of meeting", example="casual dinner and drinks")
    quick_mode: Optional[bool] = Field(False, description="Use quick coordination mode for faster results")

class PreferenceUpdateRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    interaction_data: Dict[str, Any] = Field(..., description="Interaction data for learning")

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

def get_group_agent():
    """Get or create group agent instance"""
    global group_agent
    if group_agent is None:
        group_agent = create_group_agent()
    return group_agent

def get_preference_system():
    """Get or create preference learning system"""
    global preference_system
    if preference_system is None:
        preference_system = create_preference_learning_system()
    return preference_system


# SOLO MODE ENDPOINTS
@solo_router.get("/", response_model=APIResponse)
async def health_check():
    """Health check endpoint"""
    return APIResponse(
        status="healthy",
        data={
            "message": "Coordin-AI-te API is running",
            "version": "1.0.0",
            "modes": ["solo", "group"],
            "services": {
                "solo_agent": solo_agent is not None,
                "group_agent": group_agent is not None,
                "preference_learning": preference_system is not None
            }
        },
        timestamp=datetime.now().isoformat()
    )

@solo_router.post("/query", response_model=APIResponse)
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

@solo_router.post("/place-details", response_model=APIResponse)
async def get_place_details(request: PlaceDetailsRequest):
    """
    Get detailed information about a specific place
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
        
        return APIResponse(
            status="success",
            data=result,
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

# GROUP MODE ENDPOINTS
@group_router.post("/coordinate", response_model=APIResponse)
async def coordinate_group_meetup(request: GroupCoordinationRequest):
    """
    Coordinate a group meetup in comprehensive mode
    """
    start_time = datetime.now()
    
    try:
        # Get group agent
        agent = get_group_agent()
        
        # Process coordination
        result = await asyncio.to_thread(
            agent.coordinate_group_meetup,
            request.members,
            request.meeting_purpose,
            quick_mode=request.quick_mode
        )
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
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
            
    except Exception as e:
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="error",
            error=str(e),
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time
        )

@group_router.post("/quick-coordinate", response_model=APIResponse)
async def quick_coordinate_group_meetup(request: GroupCoordinationRequest):
    """
    Coordinate a group meetup in quick mode
    """
    request.quick_mode = True
    return await coordinate_group_meetup(request)

@group_router.post("/analyze-preferences", response_model=APIResponse)
async def analyze_group_preferences(request: GroupCoordinationRequest):
    """
    Analyze group preferences without full coordination
    """
    start_time = datetime.now()
    
    try:
        # Get group agent
        agent = get_group_agent()
        
        # Analyze preferences
        result = await asyncio.to_thread(
            agent.analyze_group_preferences,
            request.members
        )
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status=result.get("status", "error"),
            data=result.get("analysis"),
            error=result.get("error"),
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

# PREFERENCE LEARNING ENDPOINTS (could be moved to a separate router if needed)
@solo_router.post("/update-preferences", response_model=APIResponse)
async def update_user_preferences(request: PreferenceUpdateRequest):
    """
    Update user preferences based on interactions
    """
    start_time = datetime.now()
    
    try:
        # Get preference learning system
        pref_system = get_preference_system()
        
        # Update preferences
        result = await asyncio.to_thread(
            pref_system.update_user_preferences,
            request.user_id,
            request.interaction_data
        )
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="success",
            data={
                "user_id": request.user_id,
                "preferences_updated": True,
                "interaction_count": result.get("interaction_count", 0),
                "confidence_scores": result.get("confidence_scores", {})
            },
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

@solo_router.get("/user-insights/{user_id}", response_model=APIResponse)
async def get_user_insights(user_id: str):
    """
    Get insights about user's learned preferences and behavior patterns
    """
    start_time = datetime.now()
    
    try:
        # Get preference learning system
        pref_system = get_preference_system()
        
        # Get insights
        result = await asyncio.to_thread(
            pref_system.get_user_insights,
            user_id
        )
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return APIResponse(
            status="success",
            data=result,
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

# Supported intents endpoint (shared, but could be moved to a utility router)
@solo_router.get("/supported-intents")
@group_router.get("/supported-intents")
async def get_supported_intents():
    """
    Get list of supported intent categories and features
    """
    intents = {
        "solo_mode": {
            "primary_intents": [
                "study", "work", "dining", "coffee", "entertainment", 
                "nightlife", "shopping", "fitness", "healthcare", "services"
            ],
            "group_types": [
                "solo", "family", "friends", "couple", "business"
            ],
            "time_contexts": [
                "morning", "afternoon", "evening", "night", "weekend", "weekday"
            ]
        },
        "group_mode": {
            "meeting_purposes": [
                "study", "work", "dining", "coffee", "entertainment",
                "celebration", "business meeting", "casual hangout"
            ],
            "group_sizes": "2-10 members supported",
            "coordination_features": [
                "optimal location calculation",
                "travel time optimization", 
                "preference matching",
                "safety assessment",
                "personalized explanations"
            ]
        },
        "learning_system": {
            "learns_from": [
                "query patterns", "venue selections", "ratings",
                "group coordination outcomes", "time preferences"
            ],
            "provides": [
                "personalized recommendations",
                "behavioral insights", 
                "preference confidence scores"
            ]
        }
    }
    
    return APIResponse(
        status="success",
        data=intents,
        timestamp=datetime.now().isoformat()
    )