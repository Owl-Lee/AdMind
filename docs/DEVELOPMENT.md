# Development

## Requirements

- Node.js 24 or later
- pnpm 11 or later
- Git

## Setup

```bash
git clone https://github.com/Owl-Lee/AdMind.git
cd AdMind
pnpm install
```

Start the product experience:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Start the standalone API in another terminal when needed:

```bash
pnpm dev:api
```

## Environment variables

Copy `.env.example` to `.env.local` only when a local command needs provider credentials or API configuration.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Standalone API port; defaults to `4000`. |
| `HOST` | No | Standalone API bind address; defaults to `127.0.0.1`. |
| `ADMIND_WEB_ORIGIN` | No | Allowed web origin for local API integration. |
| `TWELVELABS_API_KEY` | Analysis only | Runs the TwelveLabs adapter. |
| `GEMINI_API_KEY` | Inactive/experimental | Reserved for the non-active provider adapter. |

Never commit `.env.local`, provider keys or generated credentials.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the vinext development server. |
| `pnpm dev:api` | Start the standalone Fastify adapter. |
| `pnpm lint` | Run ESLint. |
| `pnpm typecheck` | Run TypeScript without emitting files. |
| `pnpm test:unit` | Run Vitest unit and integration tests. |
| `pnpm test:rendered` | Build and verify rendered HTML. |
| `pnpm test` | Run unit tests and rendered-output verification. |
| `pnpm check` | Run lint, typecheck and the full test command. |
| `pnpm build` | Create the production worker build. |
| `pnpm analyze:video` | Run a configured video-analysis provider. |

## Analyze a licensed clip

```bash
pnpm analyze:video \
  --provider twelvelabs \
  --file path/to/licensed-video.mp4 \
  --duration 90 \
  --output analysis/runs/example.json \
  --raw-output analysis/raw/example.json
```

Keep the raw provider response for traceability and the normalized run for application use. Never commit a video or provider output unless its origin, redistribution rights and intended use are documented.

## Test strategy

- `packages/decision-engine/src/engine.test.ts` covers hard filters, ranking and audit reasons.
- `app/lib/pause-decision.test.ts` covers S2 spatial placement rules.
- `packages/video-analyzer/src/*.test.ts` covers provider normalization and repeated-run consensus.
- `services/api/src/app.test.ts` verifies the Fastify adapter.
- `tests/rendered-html.test.mjs` confirms production-rendered output.

For player behavior, manually verify pause, resume, seeking, visibility changes, ad dismissal and stale-state cleanup. Browser automation remains a roadmap item.

## Media in local development

The repository includes the documented media required by every selectable public scenario. An earlier optional Sprite Fright sample is intentionally excluded until it has a reproducible asset workflow; the public interface does not expose a broken selector for that file.

Do not add that file to a public branch until its exact source and redistribution terms are recorded.

## Pull-request workflow

1. Create a focused branch from `main`.
2. Make the smallest coherent change.
3. Update tests and user-facing documentation when behavior changes.
4. Run `pnpm check`.
5. Open a pull request using the repository template.

CI repeats the main quality gates on every pull request and push to `main`.
