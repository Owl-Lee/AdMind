# AdMind

AdMind is a commercially-aware, policy-first ad orchestration prototype for long-form video. It asks a harder question than “which ad gets the highest score?”:

> When an ad contract must be fulfilled, which complete execution plan creates the least user cost without violating policy?

The current product includes two end-to-end scenarios:

- **S1 — climax scheduling:** compare a fixed 15-second fullscreen break at 00:45 with an approved 6-second muted card at the 01:22 recovery boundary.
- **S2 — pause protection:** compare a 10-second fullscreen pause takeover with a dismissible 6-second silent card that preserves the inspected frame and playback controls.

This is not an ad blocker. It is also not an LLM with permission to bypass policy. AI is bounded to content interpretation and normalized metadata; deterministic code executes hard constraints and ranking.

## What is real in v0.1

- Interactive strategy comparison, player timeline, ad overlays and decision inspector.
- Shared Zod request/response contracts.
- Deterministic hard filters for campaign eligibility, creative approval, protected context, format, frequency cap and navigation safety.
- Utility ranking across commercial value, predicted completion, relevance, context safety, interaction safety and disruption.
- Full audit trail, including rejected candidates.
- Both a co-located web API and a standalone Fastify adapter backed by the same engine.
- Unit, API integration and server-rendered HTML tests.
- A licensed excerpt from Blender Studio's `CHARGE`, a cleaned research-derived game creative, and a fictional NovaGear campaign for the interaction scenario.

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

- `GET /api/decisions` — complete S1 and S2 baseline/AdMind comparisons.
- `POST /api/decisions` — execute a validated decision request.
- Fastify equivalents: `GET /v1/scenarios/S1`, `GET /v1/scenarios/S2`, `POST /v1/decisions`.

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

S1 and S2 are implemented end to end. S3 (protected high-priority-task blocking), persistent decision history and live model inference are the next slices. The product does not label hypotheses as measured business impact.

## Demo media

- `CHARGE` is credited to Blender Foundation / Blender Studio and used under CC BY 4.0.
- The cleaned game creative is included only for a private, non-commercial research demo and does not imply cooperation with the platform or advertiser. Replace it with fully cleared artwork before making the repository public.

## License

Code is provided for portfolio and educational use. Add your chosen open-source license before public release.
