# Database Operations

This stack uses MySQL 8.0 for all environments. Prisma migrations are the source of truth for schema changes.

## Backups

1. Connect to the database host (or the Compose project) with credentials from the environment secrets.
2. Run `mysqldump --single-transaction -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > backup.sql`.
3. Store the dump in an encrypted bucket or vault (do not commit dumps to git).

## Restores

1. Provision an empty database (matching character set `utf8mb4`).
2. Load the dump: `mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < backup.sql`.
3. Run `npx prisma migrate deploy` from the API container to ensure migrations are applied.
4. Restart API/recipe/web services once the restore completes.

## Local snapshots

For development, `docker compose -f infra/docker-compose.yml exec mysql mysqldump ...` provides quick snapshots. Remember to rotate credentials when promoting dumps between environments.
