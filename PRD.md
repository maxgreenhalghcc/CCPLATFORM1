# Custom Cocktails Product Requirements Document

> Last updated: 9 July 2025

## 1. Overview

Custom Cocktails is a management and fulfilment platform for cocktail bars. The system provides a customer personality quiz that produces unique cocktail recipes, streamlines onboarding for new venues, and supplies administrators with actionable insights into orders, finances, and ingredient trends.

## 2. Objectives & Goals

- Accelerate onboarding of new cocktail bars with minimal configuration.
- Reduce administrative overhead and operational costs.
- Deliver end-to-end quiz, payment, and recipe fulfilment flows.
- Provide insights into customer preferences and recipe performance.
- Ensure the platform is maintainable and extensible for future teams.

## 3. User Roles

| Role | Description | Primary Responsibilities |
| --- | --- | --- |
| Admin | Platform manager | Manage bars, ingredients, branding, and finances |
| Customer | End user of the quiz | Complete quiz, pay, and receive cocktail |
| Bar Staff | Venue operators | Verify payment, view recipes, fulfil orders |

## 4. Functional Requirements

### 4.1 Admin
- Manage cocktail bars and configuration (branding, pricing, ingredient whitelists).
- View customer orders, ingredient trends, and financial performance.
- Manage staff access and audit logs.

### 4.2 Customer
- Access bar-specific landing pages and quizzes.
- Complete payment via Stripe Checkout and receive recipe confirmation.

### 4.3 Bar Staff
- Securely access staff dashboard.
- Monitor orders in real time and verify payment status.
- View generated cocktail recipes and mark fulfilment status.

## 5. Core Features
- Role-based access control and authentication.
- Themed quiz experience per bar (CSS variables).
- Admin, staff, and customer applications.
- Recipe generation microservice with deterministic results.
- Stripe Checkout integration with webhook processing.
- Observability with structured logging and Sentry.

## 6. Recipe Service
- Python FastAPI microservice.
- Accepts structured quiz data and bar context.
- Secured with signed JWT and private networking.
- Deterministic seeds for reproducibility and audit logging.

## 7. Integrations
- Stripe for payments (initial platform charges, optional Stripe Connect Standard).
- Internal recipe engine service.
- Error reporting via Sentry and telemetry via OpenTelemetry.

## 8. Technical Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- Backend API: NestJS + Prisma + MySQL.
- Recipe Engine: FastAPI.
- Infrastructure: Docker, docker-compose for dev, GitHub Actions for CI.

## 9. Testing Strategy
- Unit tests for recipe logic, order/payment state machines.
- Integration tests for payment webhooks and recipe API.
- Optional E2E tests for key flows.

## 10. Security
- Role-based guards and bar-level scoping.
- HTTPS-only communication.
- Stripe webhook signature verification and idempotency.
- Audit logging for admin/staff actions.
- GDPR-compliant handling of customer data.

## Appendix A: Bar Configuration
- Bar metadata (name, slug, location).
- Branding assets and theme variables.
- Quiz intro/outro copy.
- Ingredient whitelist.
- Pricing per cocktail.
- Stripe account identifiers.
