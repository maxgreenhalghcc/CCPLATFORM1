# Custom Cocktails Architecture Overview

## Monorepo Layout
```
/ (repo root)
├── web       # Next.js frontend (customers, staff, admin)
├── api       # NestJS API (auth, orders, payments, admin)
├── recipe    # FastAPI recipe generation microservice
├── infra     # Infrastructure as code, docker-compose, ops docs
├── PRD.md
├── ARCHITECTURE.md
├── APISPEC.md
└── AI_RULES.md
```

## Services

### Web (Next.js)
- App Router with TypeScript and Tailwind.
- Theme tokens driven by bar configuration via CSS variables.
- Routes scoped by bar slug: `/b/[barSlug]`, `/staff`, `/admin`.
- Uses NextAuth for customer login and JWT sessions for staff/admin (placeholder wiring in v0).
- Interfaces with API via REST (`/v1/...`).

### API (NestJS)
- Modules for auth, bars/configuration, quiz, orders/payments, recipes (proxy), admin analytics, and webhooks.
- Prisma ORM for MySQL access with `bar_id` scoping.
- Centralised configuration via `@nestjs/config`.
- Global validation pipe, exception filters, and structured logging.

### Recipe Engine (FastAPI)
- Internal-only microservice exposing `/generate` endpoint.
- Validates quiz payloads and returns deterministic recipes given a seed.
- JWT-protected requests with `aud=recipe-engine` (stub in v0).

### Infrastructure
- Dockerfiles per service for production-ready builds.
- `docker-compose.yml` for local orchestration (API, Web, Recipe, MySQL, Mailhog, etc.).
- Documentation for environment variables and local workflow.

## Data Flow
1. Customer loads `/b/{barSlug}` from Next.js which fetches bar settings from API.
2. Quiz answers submitted to API; API stores sessions and invokes Recipe service.
3. API creates order and initiates Stripe Checkout; upon completion, Stripe webhook updates payment status.
4. Staff dashboard polls/subscribes to orders; once fulfilled, status is updated in API.
5. Admin dashboard uses analytics endpoints for revenue and ingredient usage.

## Security & Observability
- JWT-based service-to-service auth and NextAuth sessions (to be implemented).
- Stripe webhook signature verification.
- Structured logs (JSON), Sentry integration, OpenTelemetry traces stubbed.
- Env vars loaded from `.env` or secrets manager; no secrets stored in code.

## Extensibility Notes
- API versioned at `/v1` with DTOs for each route.
- Recipe engine separated for independent scaling.
- Future enhancements: Websocket order streaming, Stripe Connect transfers, audit log persistence.

