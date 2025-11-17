from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    name: str
    amount: str = Field(..., description="Human-readable quantity, e.g. 45ml")


class Recipe(BaseModel):
    name: str
    description: Optional[str] = None
    method: str
    glassware: str
    garnish: str
    ingredients: List[Ingredient]
    warnings: List[str] = Field(default_factory=list)


class GenerateRequest(BaseModel):
    # Bar identifier (slug), matches `bar` field sent from QuizService
    bar: str

    # Quiz-derived answers – all optional strings
    base_spirit: Optional[str] = None
    season: Optional[str] = None
    house_type: Optional[str] = None
    dining_style: Optional[str] = None
    music_preference: Optional[str] = None
    aroma_preference: Optional[str] = None
    bitterness_tolerance: Optional[str] = None
    sweetener_question: Optional[str] = None

    # Extra knobs / randomisers
    carbonation_texture: Optional[str] = None
    foam_toggle: Optional[str] = None
    abv_lane: Optional[str] = None
    allergens: Optional[str] = None

    # Required seed (we always send this from the API)
    seed: int

    class Config:
        # Ignore any extra fields if the caller sends more than we define here
        extra = "ignore"


class GenerateResponse(BaseModel):
    id: str
    recipe: Recipe
