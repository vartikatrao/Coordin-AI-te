#!/usr/bin/env python3
"""
Main entry point for the Coordin-AI-te Backend
Consolidates all routes and configurations into one file
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime

# Import all routers
from app.routers import personalization, safety, location_search
from app.api.routes import router as solo_router
from app.api.solo_page.solo_page_routes import router as solo_page_router
from app.api.group_routes import router as group_router

# Create FastAPI app
app = FastAPI(
    title="Coordin-AI-te API",
    description="Coordinate better. Meet faster. Travel safer. AI-powered location discovery and recommendations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(solo_router, prefix="/api/v1", tags=["solo-mode"])
app.include_router(solo_page_router, prefix="/api/v1/solo-page", tags=["solo-page"])
app.include_router(group_router, prefix="/api/v1/group", tags=["group-mode"])
# AI assistant router removed - not being used
app.include_router(personalization.router, prefix="/api/personalization", tags=["personalization"])
app.include_router(safety.router, prefix="/api/safety", tags=["safety"])
app.include_router(location_search.router, prefix="/api/location", tags=["location-search"])

# Root endpoint
@app.get("/")
async def root():
    return JSONResponse({
        "message": "Welcome to Coordin-AI-te API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "description": "AI-powered location discovery and recommendation system",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "solo_mode": {
                "query": "/api/v1/solo/query",
                "place_details": "/api/v1/solo/place-details",
                "examples": "/api/v1/solo/examples",
                "supported_intents": "/api/v1/solo/supported-intents"
            },
            "solo_page": {
                "preferences": "/api/v1/solo-page/preferences"
            },
            "group_mode": {
                "coordinate": "/api/v1/group/coordinate",
                "health": "/api/v1/group/health",
                "test": "/api/v1/group/test"
            },

            "other_services": {
                "personalization": "/api/personalization",
                "safety": "/api/safety",
                "location_search": "/api/location"
            }
        }
    })

# Health check endpoint
@app.get("/health")
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "solo_mode": "available",
            "solo_page": "available",
            "group_mode": "available",
            "personalization": "available",
            "safety": "available",
            "location_search": "available"
        }
    })

# Test endpoint
@app.get("/test")
async def test_endpoint():
    return JSONResponse({
        "message": "Backend is working correctly",
        "timestamp": datetime.now().isoformat(),
        "note": "All routes are properly configured and available"
    })

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat(),
            "details": str(exc) if str(exc) else "Unknown error occurred"
        }
    )

if __name__ == "__main__":
    print("🚀 Starting Coordin-AI-te Backend...")
    print("📍 This extends your existing frontend with AI features")
    print("🌐 Backend will be available at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/docs")
    print("🔍 Health check at: http://localhost:8000/health")
    print("🧪 Test endpoint at: http://localhost:8000/test")
    print("\nAvailable Routes:")
    print("  • Solo Mode: /api/v1/solo/*")
    print("  • Solo Page: /api/v1/solo-page/*")
    print("  • Group Mode: /api/v1/group/*")

    print("  • Personalization: /api/personalization/*")
    print("  • Safety: /api/safety/*")
    print("  • Location Search: /api/location/*")
    print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(
        "run:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
