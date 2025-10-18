# Service Level Objectives (SLO)

This document captures the availability and latency targets for the Custom Cocktails beta and the corresponding alert and incident response playbooks.

## Availability

| Metric | Target | Measurement |
| --- | --- | --- |
| API `/v1/status` availability | 99.5% over 7 days | GitHub Actions `monitor.yml` smoke checks + uptime provider |
| Recipe `/status` availability | 99.5% over 7 days | Same as API via smoke checks |
| Web `/` availability | 99.5% over 7 days | External uptime monitoring |

### Error budget

At 99.5% availability, the platform may be unavailable for up to **3h 30m** per 30-day window. Exceeding this budget requires a post-incident review and a pause on feature deploys until mitigations are delivered.

## Latency

| Endpoint | SLO | Measurement |
| --- | --- | --- |
| POST `/v1/quiz/sessions/:id/submit` | p95 ≤ 500 ms | Sentry transaction traces |
| POST `/v1/orders/:id/checkout` | p95 ≤ 700 ms | Sentry transaction traces |
| PATCH `/v1/orders/:id/status` | p95 ≤ 400 ms | Sentry transaction traces |
| GET `/v1/admin/metrics/*` | p95 ≤ 600 ms | Sentry transaction traces |

Breaching the latency SLO for more than 3 consecutive hours should trigger a warning and investigation.

## Alert policy

Sentry alert rules (staging + production):

- New issue at **error** level with more than 5 events in 5 minutes → Pager notification to on-call.
- Transaction p95 above thresholds above for 3 consecutive checks → Slack notification to #ops.
- Any smoke test failure in `monitor.yml` → automatic GitHub issue "Production smoke failed ❌".

## Incident response

1. When the monitor workflow or Sentry alert fires, acknowledge within 15 minutes.
2. Create an issue using the [incident template](.github/ISSUE_TEMPLATE/incident.md) if one is not automatically created.
3. Record impact, timeline, and mitigation steps in the issue.
4. Once resolved, update the issue with root cause analysis and link any remediation PRs.
5. Schedule a post-incident review if the error budget was depleted or SLOs were breached for >6h.

## Runbook references

- [README – Production runbook](../README.md#production-runbook)
- [scripts/smoke.sh](../scripts/smoke.sh)
- [GitHub Actions monitor workflow](../.github/workflows/monitor.yml)
