import logging
import os
import time

from fastapi import FastAPI

from .api.routes import RequestIdMiddleware, router as api_router
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

app.add_middleware(RequestIdMiddleware)
app.include_router(api_router)


@app.middleware("http")
async def log_timing(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    request_id = getattr(request.state, "request_id", None)
    logger = logging.getLogger("uvicorn.access")
    logger.info("%s %s %sms rid=%s", request.method, request.url.path, duration_ms, request_id)
    return response


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "recipe",
        "version": os.getenv("APP_VERSION", app.version),
        "commit": os.getenv("GIT_SHA", "unknown"),
        "environment": settings.environment,
    }
