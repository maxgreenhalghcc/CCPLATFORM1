<<<<<<< HEAD
from __future__ import annotations
from datetime import datetime, timezone
from typing import Annotated

import jwt
import sentry_sdk
=======
from datetime import datetime, timezone
from typing import Annotated

from __future__ import annotations

import jwt
import sentry_sdk
from datetime import datetime, timezone
>>>>>>> pr-22
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from jwt import InvalidTokenError
from sentry_sdk import configure_scope
from starlette.middleware.base import BaseHTTPMiddleware
<<<<<<< HEAD
=======
from typing import Annotated
>>>>>>> pr-22
from uuid import uuid4

from ..core.config import get_settings, Settings
from ..models.schemas import GenerateRequest, GenerateResponse
from ..services.generator import generate_recipe

router = APIRouter()

HEADER = "x-request-id"


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(HEADER) or str(uuid4())
        request.state.request_id = request_id
        configure_scope(lambda scope: scope.set_tag('request_id', request_id))
        response = await call_next(request)
        response.headers[HEADER] = request_id
        return response


def get_app_settings() -> Settings:
    return get_settings()


def verify_authorization(
<<<<<<< HEAD
    authorization: Annotated[str | None, Header()] = None,
=======
    authorization: Annotated[str | None, Header(default=None)],
>>>>>>> pr-22
    settings: Settings = Depends(get_app_settings)
) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={"require": ["exp", "aud", "iss"]}
        )
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    exp = payload.get("exp")
    if not isinstance(exp, (int, float)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token expiry")

    now = datetime.now(timezone.utc).timestamp()
    if exp <= now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    if exp - now > 300:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token lifetime exceeds allowed window"
        )


@router.post("/generate", response_model=GenerateResponse)
async def generate_endpoint(
    payload: GenerateRequest,
    _: None = Depends(verify_authorization)
) -> GenerateResponse:
    with sentry_sdk.start_span(op="service", description="recipe.generate"):
        return generate_recipe(payload)
<<<<<<< HEAD
@router.get("/health")
def health():
    return {"status": "ok"}
=======
>>>>>>> pr-22
