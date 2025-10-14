# Custom Cocktails Monorepo

This repository contains the scaffolding for the Custom Cocktails platform described in `PRD.md`, `ARCHITECTURE.md`, and `APISPEC.md`.

## Structure
```
/           # Documentation and shared configuration
├── api     # NestJS API service (Stripe, quiz, orders, admin)
├── web     # Next.js frontend (customers, staff, admin)
├── recipe  # FastAPI recipe generation microservice
└── infra   # Docker Compose and infrastructure notes
```

## Getting Started
1. Copy `.env.example` to `.env` and adjust secrets.
2. Install dependencies for each service (`npm install` for `web` and `api`, `pip install -e .` for `recipe`).
3. Run `docker compose up --build` from the `infra` directory for an end-to-end local stack.

## Documentation
- `PRD.md` – Product requirements.
- `ARCHITECTURE.md` – System overview and data flow.
- `APISPEC.md` – REST API contract for the NestJS service.
- `AI_RULES.md` – Contribution guardrails for AI-assisted development.

## Next Steps
- Implement real authentication flows with NextAuth and JWT guards.
- Connect Prisma models to the placeholder service logic.
- Wire Stripe checkout sessions and webhook verification.
- Harden the recipe service with JWT verification and network policies.
