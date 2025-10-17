# API Specification v1

All routes are prefixed with `/v1` and expect/return JSON unless stated otherwise. Authentication and bar-level scoping are stubbed for scaffolding purposes.

## Auth

### `POST /v1/auth/login`
- Body: `{ "email": string, "password": string }`
- Response: `{ "accessToken": string, "refreshToken": string, "expiresIn": number }`

### `POST /v1/auth/magic`
- Body: `{ "email": string }`
- Response: `{ "status": "sent" }`

### `POST /v1/auth/token/refresh`
- Body: `{ "refreshToken": string }`
- Response: `{ "accessToken": string, "refreshToken": string, "expiresIn": number }`

## Bars & Configuration

### `GET /v1/bars`
- Query: optional `status`
- Response: `{ "items": BarSummary[] }`

### `POST /v1/bars`
- Body: `CreateBarDto`
- Response: `BarDetail`

### `GET /v1/bars/{id}`
- Response: `BarDetail`

### `PUT /v1/bars/{id}`
- Body: `UpdateBarDto`
- Response: `BarDetail`

### `GET /v1/bars/{id}/settings`
- Response: `BarSettings`

### `PUT /v1/bars/{id}/settings`
- Body: `UpdateBarSettingsDto`
- Response: `BarSettings`

### `POST /v1/bars/{id}/assets`
- Multipart upload placeholder.
- Response: `{ "uploadUrl": string }`

## Quiz

### `POST /v1/bars/{slug}/quiz/sessions`
- Body: `{ "source": string | null }`
- Response: `{ "sessionId": string }`

### `POST /v1/quiz/sessions/{id}/answers`
- Body: `{ "questionId": string, "value": unknown }`
- Response: `{ "status": "recorded" }`

### `POST /v1/quiz/sessions/{id}/submit`
- Body: `{ "final": boolean }`
- Response: `{ "orderId": string }`

## Recipes

### `POST /v1/recipes:generate`
- Body: `{ "sessionId": string, "barId": string }`
- Response: `Recipe`

### `GET /v1/orders/{id}/recipe`
- Response: `Recipe`

## Orders & Payments

### `POST /v1/orders/{id}/checkout`
- Body: `{ "successUrl": string, "cancelUrl": string }`
- Response: `{ "checkoutUrl": string }`

### `GET /v1/bars/{id}/orders`
- Query: `status?`
- Response: `{ "items": OrderSummary[] }`

## Webhooks

### `POST /v1/webhooks/stripe`
- Expects Stripe webhook payload.
- Response: `{ "received": true }`

## Admin Analytics

### `GET /v1/admin/metrics/revenue`
- Query: `barId?`, `range?`
- Response: `{ "total": number, "currency": string, "series": Array<{ date: string, value: number }> }`

### `GET /v1/admin/metrics/orders`
- Query: `barId?`, `range?`
- Response: `{ "total": number, "series": Array<{ date: string, count: number }> }`

### `GET /v1/admin/metrics/ingredients`
- Query: `barId?`, `range?`
- Response: `{ "top": Array<{ ingredient: string, usageCount: number }> }`

