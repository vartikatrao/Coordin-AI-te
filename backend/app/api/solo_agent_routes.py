# from fastapi import APIRouter
# from app.agents.solo_agent import run_solo_agent

# router = APIRouter()

# @router.post("/solo-recommendation")
# async def solo_recommendation(payload: dict):
#     """
#     Chat mode:
#     {
#       "message": "family lunch near indiranagar tomorrow 12 pm",
#       "user_lat": 12.9,      # optional but recommended
#       "user_lng": 77.6
#     }

#     Structured mode:
#     {
#       "lat": 12.97, "lng": 77.59,
#       "purpose": "food", "mood": "family",
#       "budget": "affordable", "time": "today 1 pm", "transport": "driving"
#     }
#     """
#     return run_solo_agent(payload)
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.agents.solo_agent import run_solo_agent

router = APIRouter()

class RecommendationRequest(BaseModel):
    user_query: Optional[str] = None
    purpose: Optional[str] = None
    mood: Optional[str] = None
    budget: Optional[str] = None
    time: Optional[str] = None
    transport: Optional[str] = None
    location_text: Optional[str] = None
    user_lat: Optional[float] = 12.9716
    user_lng: Optional[float] = 77.5946

@router.post("/recommend")
async def get_recommendations(request: RecommendationRequest):
    """
    Endpoint to get place recommendations based on user input (form or chat mode).
    """
    request_dict = request.dict(exclude_unset=True)
    result = run_solo_agent(request_dict)
    return result