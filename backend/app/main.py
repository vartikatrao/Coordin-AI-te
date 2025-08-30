
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime

# Import existing solo routes
from app.api.routes import router as solo_router

# Import new group routes  
from app.api.routes import router as group_router

# Create FastAPI app
app = FastAPI(
    title="Coordin-AI-te API",
    description="Coordinate better. Meet faster. Travel safer. - AI-powered location discovery and recommendation system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes with updated structure
app.include_router(solo_router, prefix="/api/v1/solo", tags=["solo"])
app.include_router(group_router, prefix="/api/v1/group", tags=["group"])

# Root endpoint
@app.get("/")
async def root():
    return JSONResponse({
        "message": "Welcome to Coordin-AI-te API",
        "description": "Coordinate better. Meet faster. Travel safer.",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "modes": {
            "solo": {
                "description": "Hyperlocal smart assistant for individual recommendations",
                "endpoints": {
                    "query": "/api/v1/solo/query",
                    "place_details": "/api/v1/solo/place-details",
                    "examples": "/api/v1/solo/examples",
                    "health": "/api/v1/solo/"
                }
            },
            "group": {
                "description": "Equidistant meetup finder for group coordination", 
                "endpoints": {
                    "coordinate": "/api/v1/group/coordinate",
                    "quick_coordinate": "/api/v1/group/quick-coordinate",
                    "analyze_preferences": "/api/v1/group/analyze-preferences",
                    "examples": "/api/v1/group/examples",
                    "health": "/api/v1/group/"
                }
            }
        },
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc"
        }
    })

@app.get("/health")
async def health_check():
    """Global health check endpoint"""
    return JSONResponse({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "solo_mode": "operational",
            "group_mode": "operational", 
            "api_server": "running"
        },
        "version": "1.0.0"
    })

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": "Internal server error",
            "message": "Please check your request and try again",
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
