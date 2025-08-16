from fastapi import FastAPI
from app.api import auth_routes
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME)

# Register routes
app.include_router(auth_routes.router, prefix="/api", tags=["Auth"])

@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} is running 🚀", "env": settings.APP_ENV}
