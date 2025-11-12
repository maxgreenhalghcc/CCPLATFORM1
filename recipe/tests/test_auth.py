import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient

os.environ.setdefault('RECIPE_JWT_SECRET', 'unit-test-secret')
os.environ.setdefault('RECIPE_JWT_AUDIENCE', 'recipe-engine')
os.environ.setdefault('RECIPE_JWT_ISSUER', 'custom-cocktails-api')

from app.main import app  # noqa: E402  pylint: disable=wrong-import-position

client = TestClient(app)


def make_token(expires_in_seconds: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
    payload = {
        'aud': os.environ['RECIPE_JWT_AUDIENCE'],
        'iss': os.environ['RECIPE_JWT_ISSUER'],
        'exp': int(exp.timestamp())
    }
    return jwt.encode(payload, os.environ['RECIPE_JWT_SECRET'], algorithm='HS256')


def build_request_body():
    return {
        'bar_id': 'demo-bar',
        'session_id': 'session-123',
        'ingredient_whitelist': ['Vodka', 'Lime'],
        'seed': 123,
        'quiz': {'mood': 'Celebratory'}
    }


def test_generate_with_valid_token():
    token = make_token(300)
    response = client.post(
        '/generate',
        headers={'Authorization': f'Bearer {token}'},
        json=build_request_body()
    )
    assert response.status_code == 200
    body = response.json()
    assert 'recipe' in body
    assert body['recipe']['name']


def test_generate_rejects_long_lived_token():
    token = make_token(900)
    response = client.post(
        '/generate',
        headers={'Authorization': f'Bearer {token}'},
        json=build_request_body()
    )
    assert response.status_code == 401
