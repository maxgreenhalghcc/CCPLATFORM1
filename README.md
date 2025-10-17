# Custom Cocktails Monorepo

This repository contains the source for the Custom Cocktails platform described in `PRD.md`, `ARCHITECTURE.md`, and `APISPEC.md`. It is organised as a multi-service monorepo with shared tooling and deployment automation.

## Structure
```
/           # Documentation and shared configuration
├── api     # NestJS API service (auth, quiz, orders, admin)
├── web     # Next.js frontend (customers, staff, admin)
├── recipe  # FastAPI recipe generation microservice
└── infra   # Docker Compose definitions and infra notes
```

## Getting started (development)
1. Copy `.env.development` to `.env` (or export the variables into your shell) and adjust any secrets you want to override locally.
2. Install dependencies for each service:
   - `cd api && npm install`
   - `cd web && npm install`
   - `cd recipe && pip install -e .`
3. Generate Prisma client code where required: `cd api && npx prisma generate`.
4. Boot the full stack: `docker compose -f infra/docker-compose.yml up --build`.
5. Visit `http://localhost:3000` for the web app, `http://localhost:4000/v1/health` for the API, and `http://localhost:5000/health` for the recipe service.

### Authentication & sign-in flow
NextAuth powers staff and admin access using passwordless email links backed by Prisma. Local development uses Nodemailer’s JSON transport so no external SMTP service is required.

1. Ensure `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `EMAIL_FROM`, and `EMAIL_SERVER` are configured in your environment (the development file provides sane defaults).
2. Start the stack as above and visit `/login`.
3. Enter one of the seeded addresses (`staff@demo.bar` or `admin@platform.bar`).
4. The JSON transport logs the magic link URL to the terminal running the Next.js app. Open that URL in a browser to authenticate.

Sessions embed a short-lived API token so guarded NestJS routes (admin metrics, staff fulfilment) work out of the box. Update the mail transport to a production SMTP provider before going live by setting `EMAIL_SERVER`.

### Admin bar management & theming
An admin session unlocks the `/admin/bars` workspace where you can paginate through venues, create new ones, and adjust pricing or theming in real time.

1. Sign in as `admin@platform.bar` using the magic-link flow above.
2. Open `/admin/bars` to view existing tenants (the seed adds **Demo Bar** and **Sample Bar 2** for reference).
3. Use **Add bar** to capture name, slug, and location. After saving, switch to the **Settings** tab to edit intro/outro copy, GBP pricing, and colour tokens.
4. Visit `/b/{slug}` to verify the live quiz theme reflects your updates immediately.

Bar-specific styles are injected via CSS variables exposed on the `<body>` element. Each bar can configure:

- `--bg` – background colour (80% usage)
- `--fg` – foreground / text colour (20% usage)
- `--primary` – accent colour for call-to-action elements (0–10% usage)
- `--card` – optional surface colour for cards (falls back to `--bg` if omitted)

## Environment matrices

| Environment | File | Compose file | Notes |
| --- | --- | --- | --- |
| Development | `.env.development` (copy to `.env` locally) | `infra/docker-compose.yml` | Builds images locally, enables verbose logging, relaxed Stripe checks. |
| Staging | `.env.production` (populated by GitHub Actions) | `infra/compose.prod.yml` | Uses GHCR images, applies Prisma migrations automatically. |
| Production | `.env.production` (populated by GitHub Actions) | `infra/compose.prod.yml` | Same as staging but with live domains/credentials. |

### Required GitHub environment secrets
Configure the following secrets on the `staging` and `production` environments before running `deploy.yml`:

- `DATABASE_URL`
- `LOG_LEVEL`
- `CORS_ORIGINS`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW_MS`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RECIPE_JWT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EMAIL_FROM`
- `EMAIL_SERVER`
- `SENTRY_API_DSN`
- `SENTRY_WEB_DSN`
- `SENTRY_RECIPE_DSN`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

(You can set empty strings for optional Sentry values if you are not using them yet.)

## Deploying to staging / production
GitHub Actions contains two workflows:

- `ci.yml` – runs linting, builds images, and pushes tags to GHCR on every push to `main`.
- `deploy.yml` – manually deploys a tagged commit to either staging or production.

To deploy the current commit to staging:

```bash
gh workflow run deploy.yml \
  -R <owner>/<repo> \
  -f environment=staging
```

The workflow will:
1. Pull the images published by CI for the current commit (`ghcr.io/<owner>/<repo>-{api,web,recipe}:<sha>`).
2. Materialise `.env.production` from environment secrets.
3. Launch the stack with `infra/compose.prod.yml` (`mysql`, `api`, `recipe`, `web`).
4. Run `npx prisma migrate deploy` inside the API container.
5. Output container health so you can verify `/v1/health`.

For rollbacks, re-run the workflow against the desired commit SHA (the CI job publishes an image per SHA, so no retagging is required).

## Production runbook

Follow this checklist when promoting a build to staging or production:

1. Prepare the environment secrets for the target GitHub Environment so `.env.production` can be materialised (see the matrix and required variables above).
2. Ensure CI has produced container images for the commit you want to promote (the `ci.yml` workflow publishes `ghcr.io/<owner>/<repo>-{api,web,recipe}:<sha>`).
3. Trigger the deployment workflow with the desired tag and environment:
   ```bash
   gh workflow run deploy.yml \
     -R <owner>/<repo> \
     -f environment=staging \
     -f tag=<git-ref>
   ```
4. After the workflow completes, run the smoke test helper against the deployed stack:
   ```bash
   API_URL=https://<api-domain>/v1 \
   RECIPE_URL=https://<recipe-domain> \
   WEB_URL=https://<web-domain> \
   BAR_SLUG=demo-bar \
   ./scripts/smoke.sh
   ```
   The script checks service health endpoints and validates that bar settings are being served; finish the checklist by completing a quiz, verifying Stripe webhook processing, and fulfilling the order via the staff dashboard.
5. Once the smoke test is clean, tag and publish the release (for example `v1.0.0`) and re-run the deployment workflow with the released tag to promote the exact build to production.

Keep a history of successful tags so that rerunning `deploy.yml` with an older tag performs a controlled rollback.

### Stripe live-mode checklist
- Switch publishable/secret keys to live mode in GitHub environment secrets.
- Point `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_URL` at the live API domain.
- Configure Stripe Checkout success URL → `https://<app-domain>/checkout/success` and cancel URL → `https://<app-domain>/checkout/cancel`.
- Register the webhook endpoint `https://<api-domain>/v1/webhooks/stripe` with the live signing secret in secrets.
- Run a live-mode payment to confirm the webhook flips the order status to `paid`.

## Observability & security notes
- Structured JSON logging is enabled through `nestjs-pino`; set `LOG_LEVEL` to tune verbosity. In development, pretty-print logs are enabled automatically.
- Basic in-memory rate limiting is configured via `express-rate-limit` (defaults to 180 req/min in development). Tune via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`.
- CORS is locked down via the `CORS_ORIGINS` allow-list; set multiple origins by comma separating values.
- The recipe engine refuses to boot without `RECIPE_JWT_SECRET`, and every `/generate` request requires a short-lived HS256 token issued by the API.

## Database operations
Refer to `infra/db/README.md` for mysqldump backup/restore steps and Prisma migration guidance. Always run `npx prisma migrate deploy` after restoring data.

## Venue go-live checklist
- Stripe keys (live) installed via GitHub environment secrets.
- Bar theme, intro/outro copy, and GBP pricing set in the admin dashboard.
- Ingredient whitelist confirmed for the venue.
- Recipe webhook secrets stored securely.
- Staff and admin accounts provisioned with the correct email addresses.
- QR code or short link printed to direct customers to `/b/{slug}`.

## Documentation
- `PRD.md` – Product requirements.
- `ARCHITECTURE.md` – System overview and data flow.
- `APISPEC.md` – REST API contract for the NestJS service.
- `AI_RULES.md` – Contribution guardrails for AI-assisted development.

## Roadmap highlights
- Switch the email transport to production-ready SMTP (and configure DMARC/SPF).
- Expand staff tooling (live order updates, fulfilment flows).
- Enrich admin analytics (ingredient usage, conversion tracking).
- Add production observability (Sentry, OTEL collectors) and automated smoke tests.
