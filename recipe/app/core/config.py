from functools import lru_cache
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


def _require_env(key: str) -> str:
    value = os.getenv(key)
    if value is None or value.strip() == "":
        raise RuntimeError(f"{key} must be set")
    return value


class Settings(BaseModel):
    app_name: str = "Custom Cocktails Recipe Engine"
    environment: str = os.getenv("NODE_ENV", "development")
    port: int = int(os.getenv("RECIPE_PORT", "5000"))
    jwt_secret: str = _require_env("RECIPE_JWT_SECRET")
    jwt_audience: str = os.getenv("RECIPE_JWT_AUDIENCE", "recipe-engine")
    jwt_issuer: str = os.getenv("RECIPE_JWT_ISSUER", "custom-cocktails-api")
    recipebuilder_base_url: str = "https://ccrecipebuilder.onrender.com"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
