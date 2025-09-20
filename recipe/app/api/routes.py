from fastapi import APIRouter, Depends
from ..core.config import get_settings, Settings
from ..models.schemas import GenerateRequest, GenerateResponse
from ..services.generator import generate_recipe

router = APIRouter()


def get_app_settings() -> Settings:
    return get_settings()


@router.post("/generate", response_model=GenerateResponse)
async def generate_endpoint(payload: GenerateRequest, settings: Settings = Depends(get_app_settings)) -> GenerateResponse:
    # TODO: verify JWT from caller (API service) using settings.jwt_secret
    _ = settings
    return generate_recipe(payload)
