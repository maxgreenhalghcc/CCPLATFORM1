# AI Contribution Guidelines

1. Follow the specifications in `PRD.md`, `ARCHITECTURE.md`, and `APISPEC.md` when generating code.
2. Do not introduce new API endpoints outside of `APISPEC.md` without explicit approval.
3. Keep code runnable with sensible defaults and `.env.example` updates when new configuration is required.
4. Use TypeScript end-to-end where applicable; prefer shared DTOs and types.
5. Maintain bar-level multi-tenancy by including `barId` in relevant data models.
6. Ensure authentication and authorization hooks are present even if mocked for scaffolding.
7. All generated code must include comments or README updates when behaviour is non-obvious.
8. Never commit secrets; rely on environment variables and secret managers.
9. Provide unit test placeholders when implementing new modules.
10. Update documentation when altering data models, API contracts, or deployment processes.
