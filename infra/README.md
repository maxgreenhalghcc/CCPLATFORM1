# Infrastructure

This directory contains container orchestration files and operational notes for the Custom Cocktails monorepo.

## Docker Compose projects

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Development stack with live-reload friendly defaults and local image builds. |
| `compose.prod.yml` | Production/staging stack that consumes GHCR images and hardened settings. |

### Prerequisites
- Docker Engine 24+
- Docker Compose plugin 2.20+

### Development usage
```bash
cp .env.development .env
cd infra
docker compose up --build
```

Services read from the root `.env` file (copied from `.env.development`) and share a named `mysql-data` volume for persistence.

### Production usage (via GitHub Actions)
The `deploy.yml` workflow writes `.env.production` from GitHub environment secrets and executes:
```bash
docker compose -f infra/compose.prod.yml up -d --remove-orphans
docker compose -f infra/compose.prod.yml exec api npx prisma migrate deploy
```

You can run the same commands manually on a target VM once the secrets file has been provisioned.

## Follow-ups
- Layer in IaC (Terraform/Ansible) after hosting environment is finalised.
- Harden networking (e.g. Traefik/Caddy reverse proxy with TLS) if the stack is exposed directly to the public internet.
- Attach observability agents (Sentry, OTEL collectors) to the Compose project when promoting to production.
