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
    bar_id: str
    session_id: str
    ingredient_whitelist: Optional[List[str]] = None
    seed: Optional[int] = None
    quiz: dict = Field(default_factory=dict)


class GenerateResponse(BaseModel):
    id: str
    recipe: Recipe
