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

### Development auth guard
Staff and admin APIs can be protected with a lightweight header-based guard so you can trial authentication flows without wiring the full identity stack. Set the following environment variables when you are ready to enable it:

```
AUTH_GUARD_ENABLED=true
AUTH_GUARD_TOKEN=<shared-dev-token>
AUTH_GUARD_HEADER=x-dev-auth # optional override
```

When the guard is enabled, clients (including the Next.js dashboards) must send the configured header and token. The web app reads `NEXT_PUBLIC_API_GUARD_HEADER` and `NEXT_PUBLIC_API_GUARD_TOKEN` to attach that header automatically.

### Bar theming tokens
Bar-specific styles are injected via CSS variables exposed on the `<body>` element. Each bar can configure:

- `--bg` – background colour (80% usage)
- `--fg` – foreground / text colour (20% usage)
- `--primary` – accent colour for call-to-action elements (0–10% usage)
- `--card` – optional surface colour for cards (falls back to `--bg` if omitted)

The recommended 80/20/0 palette split keeps the quiz highly legible while still reflecting the venue’s brand identity.

### Venue go-live checklist
- Stripe test → live keys configured in `.env`
- Bar theme, intro/outro copy, and GBP pricing set in the admin dashboard
- Ingredient whitelist confirmed for the venue
- Recipe webhook secrets stored securely
- Guard token (if enabled) distributed to staff dashboard users
- QR code or short link printed to direct customers to `/b/{slug}`

## Documentation
- `PRD.md` – Product requirements.
- `ARCHITECTURE.md` – System overview and data flow.
- `APISPEC.md` – REST API contract for the NestJS service.
- `AI_RULES.md` – Contribution guardrails for AI-assisted development.

## Next Steps
- Roll out production authentication with NextAuth + JWT issuance.
- Expand staff tooling (live order updates, fulfilment flows).
- Enrich admin analytics (ingredient usage, conversion tracking).
- Add production observability (Sentry, OTEL collectors) and automated smoke tests.
