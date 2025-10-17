from datetime import datetime, timezone
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, status
from jwt import InvalidTokenError

from ..core.config import get_settings, Settings
from ..models.schemas import GenerateRequest, GenerateResponse
from ..services.generator import generate_recipe

router = APIRouter()


def get_app_settings() -> Settings:
    return get_settings()


def verify_authorization(
    authorization: Annotated[str | None, Header(default=None)],
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
    return generate_recipe(payload)
