from __future__ import annotations

import random
from typing import Any, Dict, List

import httpx

from .seed_data import BASE_RECIPES
from ..models.schemas import GenerateRequest
from ..core.config import get_settings

settings = get_settings()
RECIPEBUILDER_BASE_URL = settings.recipebuilder_base_url


def _stable_seed(session_id: str, bar_id: str) -> int:
    """Deterministic seed so the same guest gets the same drink."""
    return abs(hash((session_id, bar_id))) % (2**32)


def _derive_warnings(
    ingredients: List[Dict[str, str]],
    quiz: Dict[str, Any] | None,
) -> List[str]:
    """Simple warning system for allergens."""
    warnings: List[str] = []

    if not quiz:
        return warnings

    allergens = quiz.get("allergens")
    if isinstance(allergens, list):
        allergen_set = {str(a).lower() for a in allergens}
        for ing in ingredients:
            name = ing.get("name", "").lower()
            if name in allergen_set:
                warnings.append(f"Contains {ing.get('name', '')}")

    return warnings


def _local_recipe(payload: GenerateRequest) -> Dict[str, Any]:
    """
    Fallback recipe generator used when the hosted engine fails.

    Returns a flat recipe dict:
    {
      id, name, description, method, glassware, garnish,
      ingredients: [{name, amount}], warnings: [...]
    }
    """
    seed_value = payload.seed or _stable_seed(payload.session_id, payload.bar_id)
    random.seed(seed_value)

    base = random.choice(BASE_RECIPES)

    ingredients: List[Dict[str, str]] = [
        {
            "name": ing["name"],
            "amount": ing.get("amount", ""),
        }
        for ing in base["ingredients"]
    ]

    # Optional whitelist filtering
    if payload.ingredient_whitelist:
        wl = {s.lower() for s in payload.ingredient_whitelist}
        filtered = [ing for ing in ingredients if ing["name"].lower() in wl]
        if filtered:
            ingredients = filtered

    warnings = _derive_warnings(ingredients, payload.quiz)

    return {
        "id": f"recipe_{payload.session_id}",
        "name": base["name"],
        "description": base.get("description", ""),
        "method": base["method"],
        "glassware": base["glassware"],
        "garnish": base["garnish"],
        "ingredients": ingredients,
        "warnings": warnings,
    }


def generate_recipe(payload: GenerateRequest) -> Dict[str, Any]:
    """
    Main entry point used by the FastAPI route.

    1. Try the hosted engine at RECIPEBUILDER_BASE_URL.
    2. If it errors / times out / 5xx's, fall back to the local generator.
    3. Always return a *flat* recipe dict, matching what the Node API expects.
    """
    request_json = payload.model_dump(exclude_none=True)
    print("Sending to hosted recipe engine at", f"{RECIPEBUILDER_BASE_URL}/generate")
    print("Request payload:", request_json)

    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(
                f"{RECIPEBUILDER_BASE_URL}/generate",
                json=request_json,
                headers={
                    # The CC API uses this header already; we just propagate a fixed value
                    "x-request-id": "internal-proxy",
                    # Swap this for a real token if/when the hosted service enforces auth
                    "Authorization": "Bearer test-token",
                },
            )

        print("Hosted engine HTTP status:", resp.status_code)
        if resp.status_code >= 500:
            # Log the body so you can debug hosted-engine problems
            print("Hosted engine 5xx body:", resp.text)
            raise RuntimeError(f"Hosted engine 5xx: {resp.status_code}")

        resp.raise_for_status()

        raw = resp.json()
        print("Hosted engine JSON:", raw)

        # Render currently returns shape:
        # { "data": { "barId": "...", "name": "...", "body": { ... } } }
        remote = raw.get("data", raw)
        body = remote.get("body") or {}

        ingredient_strings = body.get("ingredients") or []
        ingredients: List[Dict[str, str]] = []

        for item in ingredient_strings:
            if isinstance(item, str):
                ingredients.append({"name": item, "amount": ""})
            elif isinstance(item, dict):
                name = item.get("name") or str(item)
                amount = item.get("amount", "")
                ingredients.append({"name": name, "amount": amount})

        recipe: Dict[str, Any] = {
            "id": f"recipe_{payload.session_id}",
            "name": remote.get("name") or "Custom Cocktail",
            "description": body.get("description") or "",
            "method": body.get("method") or "",
            "glassware": body.get("glassware") or "",
            "garnish": body.get("garnish") or "",
            "ingredients": ingredients,
            "warnings": body.get("warnings") or [],
        }

        return recipe

    except Exception as exc:
        # Any problem talking to the hosted engine → log & fall back
        print(
            "Error calling hosted recipe engine, falling back to local generator:",
            repr(exc),
        )
        return _local_recipe(payload)
