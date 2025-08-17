from fastapi import FastAPI
from app.api import auth_routes
from app.api import solo_agent_routes
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME)

# Include routes
app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(solo_agent_routes.router, prefix="/api", tags=["solo-recommendation"])

@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} is running 🚀", "env": settings.APP_ENV}
