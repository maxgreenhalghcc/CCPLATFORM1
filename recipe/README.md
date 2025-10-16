# Recipe Engine

This FastAPI microservice generates deterministic cocktail recipes from quiz answers. It is secured with a short-lived JWT that the NestJS API signs on behalf of customers and staff.

## Configuration

Environment variables consumed by the service:

| Variable | Description |
| --- | --- |
| `RECIPE_PORT` | Port to bind the HTTP server (default `5000`). |
| `RECIPE_JWT_SECRET` | Shared symmetric secret for verifying API-issued JWTs. |
| `RECIPE_JWT_AUDIENCE` | Expected audience claim (default `recipe-engine`). |
| `RECIPE_JWT_ISSUER` | Expected issuer claim (default `custom-cocktails-api`). |

## Local testing

The API signs tokens in production, but you can craft a manual request with `pyjwt` or the snippet below to validate the security layer:

```bash
TOKEN=$(python - <<'PY'
import os
import jwt
from datetime import datetime, timedelta, timezone
secret = os.environ.get('RECIPE_JWT_SECRET', 'recipe-secret-change-me')
payload = {
    'aud': os.environ.get('RECIPE_JWT_AUDIENCE', 'recipe-engine'),
    'iss': os.environ.get('RECIPE_JWT_ISSUER', 'custom-cocktails-api'),
    'exp': int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp())
}
print(jwt.encode(payload, secret, algorithm='HS256'))
PY
)

curl \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "bar_id": "demo-bar",
    "session_id": "local-session",
    "ingredient_whitelist": ["Vodka", "Lime"],
    "quiz": {"mood": "Celebratory"},
    "seed": 42
  }' \
  http://localhost:5000/generate
```

Tokens must expire within five minutes; the service rejects missing, expired, or long-lived tokens with a `401` response.
