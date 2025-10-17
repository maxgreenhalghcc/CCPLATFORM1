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
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0')),
        integrations=[StarletteIntegration(), FastApiIntegration()],
        before_send=_scrub_event,
    )


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
