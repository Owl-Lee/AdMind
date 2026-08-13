# AdMind

AdMind is a commercially-aware, policy-first ad orchestration prototype for long-form video. It asks a harder question than “which ad gets the highest score?”:

> When an ad contract must be fulfilled, which complete execution plan creates the least user cost without violating policy?

The current product includes three end-to-end scenarios:

- **S1 — climax scheduling:** compare a fixed 15-second fullscreen break at 00:45 with a repeated-run consensus fallback at 01:25. Because a 6-second creative would overrun the 89.5-second video, the complete-plan validator selects an approved 4-second muted end card.
- **S2 — pause protection:** compare a 10-second fullscreen pause takeover with a dismissible 6-second silent card that preserves the inspected frame and playback controls.
- **S3 — protected context:** compare a high-value guaranteed campaign firing inside an injury scene with a deterministic hard-rule block that records a delivery shortfall.

This is not an ad blocker. It is also not an LLM with permission to bypass policy. AI is bounded to content interpretation and normalized metadata; deterministic code executes hard constraints and ranking.

## What is real in v0.2

- Interactive strategy comparison, player timeline, ad overlays and decision inspector.
- Shared Zod request/response contracts.
- Deterministic hard filters for campaign eligibility, creative approval, protected context, format, frequency cap and navigation safety.
- Utility ranking across commercial value, predicted completion, relevance, context safety, interaction safety and disruption.
- Full audit trail, including rejected candidates.
- Both a co-located web API and a standalone Fastify adapter backed by the same engine.
- A provider-neutral video-analysis contract with TwelveLabs Pegasus 1.5 selected as the active supplier.
- Repeated-run consensus across model recommendations, timestamps, and confidence ranges.
- Separate emotional intensity, narrative criticality, and interruption-risk signals; visual calm is never assumed to be safe.
- A cached, schema-validated TwelveLabs Pegasus 1.5 analysis of the shipped CHARGE excerpt, with a human-authored fallback retained for regression testing.
- Unit, API integration and server-rendered HTML tests.
- A licensed excerpt from Blender Studio's `CHARGE` and a cleaned research-derived game creative.

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

### Run a real video analysis

Create a local `.env.local` and add `TWELVELABS_API_KEY`. The CLI loads this file automatically. Keys are read only by the local command and must never be committed or exposed to the browser.

```bash
pnpm analyze:video --provider twelvelabs --file public/admind-charge-demo-720p.mp4 --duration 89.5 --output analysis/charge-twelvelabs.json --raw-output analysis/raw/charge-twelvelabs.json
```

Both commands validate and save the same `VideoAnalysis` JSON contract. The public site reads cached analysis, so the deployed demo works without an API key or per-view inference cost.

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

- `GET /api/decisions` — complete S1, S2 and S3 baseline/AdMind comparisons.
- `POST /api/decisions` — execute a validated decision request.
- Fastify equivalents: `GET /v1/scenarios/S1`, `GET /v1/scenarios/S2`, `GET /v1/scenarios/S3`, `POST /v1/decisions`.

## Repository map

```text
app/                         Product console and web API
packages/contracts/          Runtime contracts and shared types
packages/decision-engine/    Policy filters, ranker, fixtures and tests
packages/video-analyzer/     Provider adapters, shared prompt and normalization
services/api/                Standalone Fastify adapter
analysis/                    Validated cached model or fixture outputs
docs/                        Architecture and evidence/claims notes
tests/                       Rendered output verification
```

See [architecture](docs/ARCHITECTURE.md) and [product evidence notes](docs/PRODUCT_NOTES.md).

The repository also includes the full [PRD](docs/PRD.md), [decision engine specification](docs/DECISION_ENGINE_SPEC_V1.md), [acceptance tests](docs/ACCEPTANCE_TESTS_V1.md), and [research synthesis](docs/RESEARCH_SYNTHESIS.md) developed before implementation.

## Scope honesty

S1, S2 and S3 are implemented through the deterministic decision layer. TwelveLabs Pegasus 1.5 is the selected active supplier and has been run repeatedly against the shipped CHARGE excerpt. Gemini is not part of the active product path. Persistent decision history and evaluated business impact remain future slices.

## Demo media

- `CHARGE` is credited to Blender Foundation / Blender Studio and used under CC BY 4.0.
- The cleaned game creative is included only for a private, non-commercial research demo and does not imply cooperation with the platform or advertiser. Replace it with fully cleared artwork before making the repository public.

## License

Code is provided for portfolio and educational use. Add your chosen open-source license before public release.
