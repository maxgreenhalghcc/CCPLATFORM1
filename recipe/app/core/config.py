from functools import lru_cache
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


def _require_env(key: str) -> str:
    """
    Require that an environment variable is set and return its value.
    
    Parameters:
        key (str): Name of the environment variable to read.
    
    Returns:
        value (str): The environment variable's value.
    
    Raises:
        RuntimeError: If the environment variable is missing or is an empty string after trimming whitespace.
    """
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


@lru_cache()
def get_settings() -> Settings:
    """
    Retrieve the application's Settings instance.
    
    Returns:
        Settings: The application configuration populated from environment variables and defaults; the same cached instance is returned on subsequent calls.
    """
    return Settings()