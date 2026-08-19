# Third-party notices

AdMind combines open-source software, browser-side model assets and credited demonstration media. Each component remains subject to its own license and source terms.

## Major software components

| Component | Purpose | Upstream |
| --- | --- | --- |
| React | Product interface | [facebook/react](https://github.com/facebook/react) |
| TypeScript | Static typing | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) |
| Vite / vinext | Development and production build | [vitejs/vite](https://github.com/vitejs/vite) · [cloudflare/vinext](https://github.com/cloudflare/vinext) |
| Fastify | Standalone API adapter | [fastify/fastify](https://github.com/fastify/fastify) |
| Zod | Runtime contracts | [colinhacks/zod](https://github.com/colinhacks/zod) |
| MediaPipe Tasks Vision | Browser-side paused-frame detection | [google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe) |
| Vitest | Test runner | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) |
| Drizzle ORM | Persistence boundary | [drizzle-team/drizzle-orm](https://github.com/drizzle-team/drizzle-orm) |

The package lockfile is the authoritative inventory of installed JavaScript packages and versions. This summary does not replace dependency license files.

## Model assets

The files under `public/models/` are runtime assets used by MediaPipe Tasks Vision. Their exact upstream URLs, variants and SHA-256 checksums are recorded in [the asset manifest](docs/ASSET_MANIFEST.md). MediaPipe is distributed under Apache License 2.0; model use remains subject to the upstream notices linked in the manifest.

## Demonstration media

- Blender Studio / Blender Foundation clips are credited in the product UI and [asset manifest](docs/ASSET_MANIFEST.md) under their applicable Creative Commons Attribution licenses.
- The distributed U.S. Coast Guard and U.S. Navy clips link to exact DVIDS source pages that mark them Public Domain. The appearance of U.S. Department of War (DoW) visual information does not imply or constitute DoW endorsement. Publicity, privacy, trademark and third-party rights may still apply.
- The fictional game-ad artwork is a project-owned asset that the project owner has confirmed may remain in the public portfolio release.
- The optional Sprite Fright S2 clip used in the hosted private build is not distributed in Git.
- An earlier FEMA news excerpt is excluded because its source and downstream rights were not documented to the release standard.

## Asset record

[The asset manifest](docs/ASSET_MANIFEST.md) is the release record for source URLs, authors or agencies, license or public-domain basis, modifications, local filenames and checksums. Unverified assets are excluded from the public repository.
