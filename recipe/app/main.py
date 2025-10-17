import os

from fastapi import FastAPI

from .api.routes import router as api_router
from .core.config import get_settings

settings = get_settings()
app_version = os.getenv("APP_VERSION", "unknown")

app = FastAPI(
    title=settings.app_name,
    version=app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.include_router(api_router)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "recipe",
        "version": os.getenv("APP_VERSION", app.version),
        "commit": os.getenv("GIT_SHA", "unknown"),
        "environment": settings.environment,
    }
