from __future__ import annotations

import random
from typing import List

from .seed_data import BASE_RECIPES
from ..models.schemas import GenerateRequest, GenerateResponse, Ingredient, Recipe


def generate_recipe(payload: GenerateRequest) -> GenerateResponse:
    """
    Generate a cocktail recipe tailored to the provided request.
    
    Constructs a Recipe from a selected base recipe and the request data: it uses payload.seed if present or a deterministic seed derived from payload.session_id and payload.bar_id to select a base recipe, builds Ingredient objects from that base, optionally filters ingredients by payload.ingredient_whitelist (if filtering yields no matches the original ingredient list is kept), and customizes the description when payload.quiz provides a mood (from `q9` or `mood`). Warnings are derived from allergens provided in the quiz.
    
    Parameters:
        payload (GenerateRequest): Request data containing session_id, bar_id, optional seed, optional ingredient_whitelist, and optional quiz information.
    
    Returns:
        GenerateResponse: Response with `id` set to "recipe_{session_id}" and the assembled Recipe (name, description, method, glassware, garnish, ingredients, and warnings).
    """
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
    """
    Generate allergy warning messages for any ingredient whose name matches an allergen listed in the quiz.
    
    Parameters:
        ingredients (List[Ingredient]): Ingredients to check for allergen matches.
        quiz (dict | None): Optional quiz data that may include an "allergens" key with a list of allergen names (strings).
    
    Returns:
        List[str]: Warning messages of the form "Contains {ingredient.name}" for each ingredient whose name (case-insensitive) appears in the quiz's allergen list; returns an empty list if no matches or if quiz/allergens are absent.
    """
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
    """
    Compute a deterministic 32-bit non-negative seed from a session and bar identifier.
    
    Parameters:
        session_id (str): Session identifier used to derive the seed.
        bar_id (str): Bar identifier used to derive the seed.
    
    Returns:
        int: A non-negative integer in the range 0 to 2**32 - 1 deterministically derived from the inputs.
    """
    return abs(hash((session_id, bar_id))) % (2 ** 32)