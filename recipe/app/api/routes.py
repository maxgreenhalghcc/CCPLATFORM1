from datetime import datetime, timezone
from typing import Annotated

from __future__ import annotations

import jwt
import sentry_sdk
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from jwt import InvalidTokenError
from sentry_sdk import configure_scope
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Annotated
from uuid import uuid4

from ..core.config import get_settings, Settings
from ..models.schemas import GenerateRequest, GenerateResponse
from ..services.generator import generate_recipe

router = APIRouter()

HEADER = "x-request-id"


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Attach a request identifier to the incoming request, tag it in Sentry, and ensure the same identifier is returned in the response header.
        
        Parameters:
            request (Request): Incoming ASGI request; a `request.state.request_id` attribute will be set.
            call_next (Callable): Next middleware/handler to invoke; called with the request and expected to return a Response.
        
        Returns:
            Response: The response returned by the next handler with the `x-request-id` header set to the request identifier.
        """
        request_id = request.headers.get(HEADER) or str(uuid4())
        request.state.request_id = request_id
        configure_scope(lambda scope: scope.set_tag('request_id', request_id))
        response = await call_next(request)
        response.headers[HEADER] = request_id
        return response


def get_app_settings() -> Settings:
    """
    Retrieve the application's configuration Settings.
    
    Returns:
        Settings: The resolved application settings instance.
    """
    return get_settings()


def verify_authorization(
    authorization: Annotated[str | None, Header(default=None)],
    settings: Settings = Depends(get_app_settings)
) -> None:
    """
    Validate the Authorization header contains a valid Bearer JWT and reject the request if the token is invalid.
    
    Parameters:
        authorization (str | None): The raw Authorization header value; expected in the form "Bearer <token>".
    
    Raises:
        HTTPException: With status 401 for any of the following conditions:
            - Missing or malformed Authorization header ("Missing bearer token").
            - JWT decoding or verification failure ("Invalid token").
            - Missing or non-numeric expiry claim ("Invalid token expiry").
            - Token expired ("Token expired").
            - Token lifetime exceeds 5 minutes into the future ("Token lifetime exceeds allowed window").
    """
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
    """
    Generate a recipe from the provided input.
    
    Parameters:
        payload (GenerateRequest): Input data describing what to generate.
    
    Returns:
        GenerateResponse: The generated recipe.
    """
    with sentry_sdk.start_span(op="service", description="recipe.generate"):
        return generate_recipe(payload)