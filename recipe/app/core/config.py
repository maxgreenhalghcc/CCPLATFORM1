from functools import lru_cache
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseModel):
    app_name: str = "Custom Cocktails Recipe Engine"
    environment: str = os.getenv("NODE_ENV", "development")
    port: int = int(os.getenv("RECIPE_PORT", "5000"))
    jwt_secret: str = os.getenv("RECIPE_JWT_SECRET", "recipe-secret-change-me")
    jwt_audience: str = os.getenv("RECIPE_JWT_AUDIENCE", "recipe-engine")
    jwt_issuer: str = os.getenv("RECIPE_JWT_ISSUER", "custom-cocktails-api")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
