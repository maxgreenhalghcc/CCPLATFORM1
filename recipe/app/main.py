import logging
import os
import time

import sentry_sdk
from fastapi import FastAPI
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from .api.routes import RequestIdMiddleware, router as api_router
from .core.config import get_settings


def _scrub_event(event: dict) -> dict:
    """
    Redact sensitive request fields in a Sentry event payload.
    
    Removes the `authorization` and `cookie` headers from `event['request']['headers']` (if present) and replaces `event['request']['data']` with the string "[redacted]" when a `data` field exists. The input event dictionary is mutated in place and returned.
    
    Parameters:
        event (dict): Sentry event payload containing an optional `request` mapping.
    
    Returns:
        dict: The sanitized event dictionary (the same object passed in, potentially mutated).
    """
    request_data = event.get('request') or {}
    headers = dict(request_data.get('headers') or {})
    headers.pop('authorization', None)
    headers.pop('cookie', None)
    request_data['headers'] = headers
    if 'data' in request_data:
        request_data['data'] = '[redacted]'
    event['request'] = request_data
    return event


if os.getenv('SENTRY_DSN'):
    sentry_sdk.init(
        dsn=os.getenv('SENTRY_DSN'),
        environment=os.getenv('SENTRY_ENVIRONMENT', os.getenv('NODE_ENV', 'production')),
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
        integrations=[StarletteIntegration(), FastApiIntegration()],
        before_send=_scrub_event,
    )


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


@app.middleware("http")
async def log_timing(request, call_next):
    """
    Log the HTTP request method, path, duration in milliseconds, and request id, then return the downstream response.
    
    Parameters:
        request: The incoming Starlette/FastAPI request.
        call_next: Callable that accepts the request and returns the downstream response.
    
    Returns:
        The response returned by the downstream handler.
    """
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    request_id = getattr(request.state, "request_id", None)
    logger = logging.getLogger("uvicorn.access")
    logger.info("%s %s %sms rid=%s", request.method, request.url.path, duration_ms, request_id)
    return response


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """
    Return application health metadata.
    
    Returns:
        dict[str, str]: Health information containing:
            - "status": overall health status, set to "ok".
            - "service": service name, "recipe".
            - "version": application version from APP_VERSION env or the FastAPI app version.
            - "commit": Git commit SHA from GIT_SHA env or "unknown".
            - "environment": runtime environment from settings.environment.
    """
    return {
        "status": "ok",
        "service": "recipe",
        "version": os.getenv("APP_VERSION", app.version),
        "commit": os.getenv("GIT_SHA", "unknown"),
        "environment": settings.environment,
    }


@app.get("/status", tags=["health"])
async def status() -> dict[str, object]:
    """
    Report service status and metadata including uptime and whether Sentry is enabled.
    
    Returns:
        dict: {
            "ok": True if the service is healthy,
            "service": service name,
            "version": application version string,
            "commit": git commit SHA or "unknown",
            "uptime": seconds since process start (int),
            "sentry": {"enabled": True if SENTRY_DSN is set, False otherwise}
        }
    """
    uptime = int(time.time() - START_TIME)
    return {
        "ok": True,
        "service": "recipe",
        "version": os.getenv("APP_VERSION", app.version),
        "commit": os.getenv("GIT_SHA", "unknown"),
        "uptime": uptime,
        "sentry": {"enabled": bool(os.getenv("SENTRY_DSN"))},
    }