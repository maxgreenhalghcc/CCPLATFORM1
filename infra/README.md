# Infrastructure

This directory contains container orchestration files and operational notes for the Custom Cocktails monorepo.

## docker-compose

The `docker-compose.yml` file spins up the development stack:

- **mysql** – Persistent MySQL instance for Prisma migrations.
- **api** – NestJS service exposed on port `4000`.
- **recipe** – FastAPI microservice exposed on port `5000`.
- **web** – Next.js frontend exposed on port `3000`.

### Prerequisites
- Docker Engine 24+
- Docker Compose plugin 2.20+

### Usage
```bash
cp .env.example .env          # adjust values as needed
cd infra
docker compose up --build
```

Services share the same `.env` file. The compose file mounts a named volume `mysql-data` for persistent database storage.

## Next Steps
- Add GitHub Actions workflows for linting, testing, and building containers.
- Define IaC (Terraform/Ansible) once hosting environment is confirmed.
- Harden recipe service networking by restricting ingress to the API container.
