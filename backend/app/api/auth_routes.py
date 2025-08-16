from fastapi import APIRouter, Depends
from app.core.firebase_auth import verify_token

router = APIRouter()

@router.get("/auth/me")
async def get_current_user(user=Depends(verify_token)):
    """
    Returns authenticated user info from Firebase token.
    """
    return {"user": user}
