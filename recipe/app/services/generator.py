from __future__ import annotations

import random
from typing import List

from .seed_data import BASE_RECIPES
from ..models.schemas import GenerateRequest, GenerateResponse, Ingredient, Recipe


def generate_recipe(payload: GenerateRequest) -> GenerateResponse:
    seed_value = payload.seed or stable_seed(payload.session_id, payload.bar_id)
    random.seed(seed_value)

    base_recipe = random.choice(BASE_RECIPES)

    ingredients = [Ingredient(**ingredient) for ingredient in base_recipe["ingredients"]]

    if payload.ingredient_whitelist:
        whitelist = {item.lower() for item in payload.ingredient_whitelist}
        ingredients = [ingredient for ingredient in ingredients if ingredient.name.lower() in whitelist] or ingredients

    description = base_recipe.get("description")
    if payload.quiz:
        mood = payload.quiz.get("q9") or payload.quiz.get("mood")
        if isinstance(mood, str):
            description = f"Tailored for a {mood.lower()} kind of evening."

    recipe = Recipe(
        name=base_recipe["name"],
        description=description,
        method=base_recipe["method"],
        glassware=base_recipe["glassware"],
        garnish=base_recipe["garnish"],
        ingredients=ingredients,
        warnings=derive_warnings(ingredients, payload.quiz)
    )

    return GenerateResponse(id=f"recipe_{payload.session_id}", recipe=recipe)


def derive_warnings(ingredients: List[Ingredient], quiz: dict | None) -> List[str]:
    warnings: List[str] = []
    if not quiz:
        return warnings
    allergens = quiz.get("allergens")
    if isinstance(allergens, list):
        allergen_set = {str(item).lower() for item in allergens}
        for ingredient in ingredients:
            if ingredient.name.lower() in allergen_set:
                warnings.append(f"Contains {ingredient.name}")
    return warnings


def stable_seed(session_id: str, bar_id: str) -> int:
    return abs(hash((session_id, bar_id))) % (2 ** 32)
