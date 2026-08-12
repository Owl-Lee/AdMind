# AdMind

AdMind is a commercially-aware, policy-first ad orchestration prototype for long-form video. It asks a harder question than “which ad gets the highest score?”:

> When an ad contract must be fulfilled, which complete execution plan creates the least user cost without violating policy?

The current S1 vertical slice compares two strategies for the same guaranteed campaign:

- **Baseline:** play a 15-second fullscreen creative at the fixed 00:45 break, even though the story is at its climax.
- **AdMind:** defer by 10 seconds to a safe transition and use an approved 6-second muted variant.

This is not an ad blocker. It is also not an LLM with permission to bypass policy. AI is bounded to content interpretation and normalized metadata; deterministic code executes hard constraints and ranking.

## What is real in v0.1

- Interactive strategy comparison, player timeline, ad overlays and decision inspector.
- Shared Zod request/response contracts.
- Deterministic hard filters for campaign eligibility, creative approval, protected context, format, frequency cap and navigation safety.
- Utility ranking across commercial value, predicted completion, relevance, context safety, interaction safety and disruption.
- Full audit trail, including rejected candidates.
- Both a co-located web API and a standalone Fastify adapter backed by the same engine.
- Unit, API integration and server-rendered HTML tests.
- Original fictional demo assets safe for a public portfolio.

## Quick start

Requirements: Node.js 24+ and pnpm 11+.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Run the standalone integration API separately when needed:

```bash
pnpm dev:api
```

The API listens on `http://127.0.0.1:4000` by default.

## Verification

```bash
pnpm check
```

Or run individual gates:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:rendered
pnpm build
```

## Key routes

- `GET /api/decisions` — complete S1 baseline and AdMind result.
- `POST /api/decisions` — execute a validated decision request.
- Fastify equivalents: `GET /v1/scenarios/S1`, `POST /v1/decisions`.

## Repository map

```text
app/                         Product console and web API
packages/contracts/          Runtime contracts and shared types
packages/decision-engine/    Policy filters, ranker, fixtures and tests
services/api/                Standalone Fastify adapter
docs/                        Architecture and evidence/claims notes
tests/                       Rendered output verification
```

See [architecture](docs/ARCHITECTURE.md) and [product evidence notes](docs/PRODUCT_NOTES.md).

The repository also includes the full [PRD](docs/PRD.md), [decision engine specification](docs/DECISION_ENGINE_SPEC_V1.md), [acceptance tests](docs/ACCEPTANCE_TESTS_V1.md), and [research synthesis](docs/RESEARCH_SYNTHESIS.md) developed before implementation.

## Scope honesty

S1 is implemented end to end. S2 (pause-card interaction protection), S3 (protected health-task blocking), persistent decision history and live model inference are the next slices. The product does not label hypotheses as measured business impact.

## License

Code is provided for portfolio and educational use. Add your chosen open-source license before public release.
