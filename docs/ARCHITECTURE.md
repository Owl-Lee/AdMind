# AdMind architecture

AdMind is a policy-first decision system, not an ad blocker and not an LLM that directly decides what may be shown.

```mermaid
flowchart LR
  A[Content and session signals] --> B[AI metadata adapter]
  B --> C[Normalized decision request]
  D[Campaigns and approved creatives] --> C
  E[Consent, policy, frequency and interaction state] --> C
  C --> F[Deterministic hard filters]
  F -->|eligible plans only| G[Utility ranker]
  F -->|rejected| H[Audit trail]
  G --> I[Complete execution plan]
  I --> J[Player orchestration]
  I --> H
```

## Repository boundaries

- `app/` — interactive product console and deployable web route.
- `packages/contracts/` — Zod runtime contracts and TypeScript types.
- `packages/decision-engine/` — deterministic filters, ranking, fixtures and tests.
- `services/api/` — standalone Fastify adapter for production-style integration.
- `app/api/decisions/` — co-located HTTP adapter so the demo remains one-command runnable.
- `db/` — Drizzle persistence adapter boundary; persistence is intentionally not required for S1.

The same engine powers the page, the co-located route, and the Fastify service. This prevents the portfolio UI from becoming a disconnected mockup.

## Decision invariant

Ranking evaluates a complete plan:

`campaign + approved creative + viewer/opportunity + scheduled time + format`

Hard rules run before ranking. A rejected plan can never win because of a high bid or model score.

## Current slice and next slices

Version 0.1 implements the S1 vertical slice end to end. S2 pause-card interaction protection and S3 protected health-task blocking are deliberately visible as the next product slices, not presented as finished functionality.
