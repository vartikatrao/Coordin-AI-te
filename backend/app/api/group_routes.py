from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
import traceback
from datetime import datetime

from ..agents.group_agent import GroupCoordinationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class GroupMember(BaseModel):
    """Individual group member data"""
    name: str = Field(..., description="Member's name")
    age: Optional[int] = Field(None, description="Member's age")
    gender: Optional[str] = Field(None, description="Member's gender")
    location: Dict[str, Any] = Field(..., description="Member's location with lat, lng, address")
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Member's preferences")
    constraints: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Member's constraints")

class GroupCoordinationRequest(BaseModel):
    """Request model for group coordination"""
    members: List[GroupMember] = Field(..., description="List of group members")
    meeting_purpose: Optional[str] = Field("", description="Purpose or type of meeting")
    quick_mode: Optional[bool] = Field(False, description="Whether to use quick processing mode")

class GroupCoordinationResponse(BaseModel):
    """Response model for group coordination"""
    status: str = Field(..., description="Status of the coordination request")
    results: Optional[Dict[str, Any]] = Field(None, description="Coordination results")
    error: Optional[str] = Field(None, description="Error message if any")
    timestamp: str = Field(..., description="Timestamp of the response")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")

# Initialize the group coordination agent
try:
    group_agent = GroupCoordinationAgent()
    logger.info("✅ Group coordination agent initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize group coordination agent: {e}")
    group_agent = None

@router.post("/coordinate", response_model=GroupCoordinationResponse)
async def coordinate_group_meetup(
    request: GroupCoordinationRequest = Body(..., description="Group coordination request")
):
    """
    Coordinate a group meetup by analyzing member preferences and finding optimal venues
    
    This endpoint:
    1. Analyzes all group member locations, preferences, and constraints
    2. Finds optimal meeting locations based on travel convenience
    3. Searches for suitable venues matching group requirements
    4. Provides personalized recommendations for each member
    5. Includes safety assessments and accessibility considerations
    
    Args:
        request: Group coordination request with member details and meeting purpose
        
    Returns:
        Detailed coordination results with venue recommendations and explanations
    """
    start_time = datetime.now()
    
    try:
        # Validate that group agent is initialized
        if group_agent is None:
            raise HTTPException(
                status_code=500, 
                detail="Group coordination agent not initialized. Please check server configuration."
            )
        
        # Validate request
        if not request.members or len(request.members) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 group members are required for coordination"
            )
        
        # Convert Pydantic models to dictionaries for the agent
        members_dict = []
        for member in request.members:
            member_dict = {
                "name": member.name,
                "age": member.age,
                "gender": member.gender,
                "location": member.location,
                "preferences": member.preferences or {},
                "constraints": member.constraints or {}
            }
            members_dict.append(member_dict)
        
        logger.info(f"🤝 Starting group coordination for {len(members_dict)} members")
        logger.info(f"📍 Meeting purpose: {request.meeting_purpose or 'General meetup'}")
        logger.info(f"⚡ Quick mode: {request.quick_mode}")
        
        # Process the coordination request
        coordination_results = group_agent.coordinate_group_meetup(
            members=members_dict,
            meeting_purpose=request.meeting_purpose or "",
            quick_mode=request.quick_mode or False
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Check if coordination was successful
        if coordination_results.get("status") == "error":
            raise HTTPException(
                status_code=400,
                detail=coordination_results.get("error", "Unknown coordination error")
            )
        
        logger.info(f"✅ Group coordination completed successfully in {processing_time:.2f}s")
        
        return GroupCoordinationResponse(
            status="success",
            results=coordination_results,
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle unexpected errors
        processing_time = (datetime.now() - start_time).total_seconds()
        error_trace = traceback.format_exc()
        logger.error(f"❌ Group coordination failed after {processing_time:.2f}s: {e}")
        logger.error(f"Error trace: {error_trace}")
        
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during group coordination: {str(e)}"
        )

@router.get("/health")
async def group_health_check():
    """
    Health check endpoint for group mode functionality
    """
    try:
        if group_agent is None:
            return {
                "status": "unhealthy",
                "message": "Group coordination agent not initialized",
                "timestamp": datetime.now().isoformat()
            }
        
        return {
            "status": "healthy",
            "message": "Group coordination agent is ready",
            "timestamp": datetime.now().isoformat(),
            "agents_available": True
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Health check failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@router.post("/test")
async def test_group_coordination():
    """
    Test endpoint with sample data for group coordination
    """
    try:
        # Sample test data
        test_members = [
            {
                "name": "Alice",
                "age": 25,
                "gender": "female",
                "location": {
                    "lat": 12.9716,
                    "lng": 77.5946,
                    "address": "MG Road, Bangalore"
                },
                "preferences": {
                    "cuisine": ["Italian", "Chinese"],
                    "atmosphere": "casual",
                    "price_range": "moderate"
                },
                "constraints": {
                    "accessibility": ["wheelchair_accessible"],
                    "dietary": ["vegetarian"]
                }
            },
            {
                "name": "Bob",
                "age": 28,
                "gender": "male",
                "location": {
                    "lat": 12.9352,
                    "lng": 77.6245,
                    "address": "Koramangala, Bangalore"
                },
                "preferences": {
                    "cuisine": ["Indian", "Italian"],
                    "atmosphere": "lively",
                    "price_range": "moderate"
                },
                "constraints": {
                    "budget": "under_1000"
                }
            }
        ]
        
        if group_agent is None:
            return {
                "status": "error",
                "message": "Group coordination agent not initialized"
            }
        
        # Test the coordination
        results = group_agent.coordinate_group_meetup(
            members=test_members,
            meeting_purpose="casual lunch",
            quick_mode=True
        )
        
        return {
            "status": "success",
            "message": "Test coordination completed",
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Test coordination failed: {e}")
        return {
            "status": "error",
            "message": f"Test failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
