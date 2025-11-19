from __future__ import annotations

import logging
import os
import time

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import RequestIdMiddleware, router as api_router
from .core.config import get_settings
from .models.schemas import GenerateRequest, GenerateResponse
from .services.generator import generate_recipe


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger("recipe.app")
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Sentry
# ---------------------------------------------------------------------------


def _scrub_event(event: dict) -> dict:
    request_data = event.get("request") or {}
    headers = dict(request_data.get("headers") or {})
    headers.pop("authorization", None)
    headers.pop("cookie", None)
    request_data["headers"] = headers
    if "data" in request_data:
        request_data["data"] = "[redacted]"
    event["request"] = request_data
    return event


if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        environment=os.getenv("SENTRY_ENVIRONMENT", os.getenv("NODE_ENV", "production")),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        integrations=[StarletteIntegration(), FastApiIntegration()],
        before_send=_scrub_event,
    )


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

settings = get_settings()
app_version = os.getenv("APP_VERSION", "unknown")
START_TIME = time.time()

app = FastAPI(
    title=settings.app_name,
    version=app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(RequestIdMiddleware)
app.include_router(api_router)

# CORS – keep permissive for local dev; can be tightened via settings later
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Middleware: request timing
# ---------------------------------------------------------------------------


@app.middleware("http")
async def log_timing(request: Request, call_next):
    start = time.perf_counter()
    request_id = request.headers.get("x-request-id", "-")

    try:
        response = await call_next(request)
    except Exception:
        # Let the standard FastAPI / Uvicorn error handling log the exception
        logger.exception(
            "Unhandled error while processing request (rid=%s)", request_id
        )
        raise

    duration_ms = int((time.perf_counter() - start) * 1000)

    # Use f-string to avoid interaction with uvicorn's own logging styles
    logger.info(
        f"{request.method} {request.url.path} {duration_ms}ms rid={request_id}"
    )
    return response


# ---------------------------------------------------------------------------
# Recipe generation endpoint
# ---------------------------------------------------------------------------


@app.post("/generate", response_model=GenerateResponse, tags=["recipes"])
async def generate_endpoint(payload: GenerateRequest, request: Request):
    """
    Main recipe generation endpoint.

    Delegates to services.generator.generate_recipe, which:
    - Tries the hosted Render service first
    - On timeout / 5xx, falls back to the local recipe generator
    """
    request_id = request.headers.get("x-request-id", "-")
    logger.info("Handling /generate rid=%s", request_id)

    response = generate_recipe(payload)
    return response


# ---------------------------------------------------------------------------
# Health / status
# ---------------------------------------------------------------------------


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "recipe",
        "version": os.getenv("APP_VERSION", app.version),
        "commit": os.getenv("GIT_SHA", "unknown"),
        "environment": settings.environment,
    }


@app.get("/status", tags=["health"])
async def status() -> dict[str, object]:
    uptime = int(time.time() - START_TIME)
    return {
        "ok": True,
        "service": "recipe",
        "version": os.getenv("APP_VERSION", app.version),
        "commit": os.getenv("GIT_SHA", "unknown"),
        "uptime": uptime,
        "sentry": {"enabled": bool(os.getenv("SENTRY_DSN"))},
    }
