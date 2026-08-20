# Third-party notices

[English](#third-party-notices) · [中文](#第三方声明)

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

---

# 第三方声明

AdMind 组合开源软件、浏览器端模型资源和已经标注来源的演示媒体。每个组件仍受各自的 License 与来源条款约束。

## 主要软件组件

| 组件 | 用途 | 上游 |
| --- | --- | --- |
| React | 产品界面 | [facebook/react](https://github.com/facebook/react) |
| TypeScript | 静态类型 | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) |
| Vite / vinext | 开发与生产构建 | [vitejs/vite](https://github.com/vitejs/vite) · [cloudflare/vinext](https://github.com/cloudflare/vinext) |
| Fastify | 独立 API 适配器 | [fastify/fastify](https://github.com/fastify/fastify) |
| Zod | 运行时契约 | [colinhacks/zod](https://github.com/colinhacks/zod) |
| MediaPipe Tasks Vision | 浏览器端暂停画面检测 | [google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe) |
| Vitest | 测试运行器 | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) |
| Drizzle ORM | 持久化边界 | [drizzle-team/drizzle-orm](https://github.com/drizzle-team/drizzle-orm) |

锁文件是已安装 JavaScript 包与版本的权威清单，本摘要不替代各依赖自己的授权文件。

## 模型资源

`public/models/` 中的文件是 MediaPipe Tasks Vision 使用的运行时资源。精确上游 URL、模型变体和 SHA-256 校验值记录在[素材清单](docs/ASSET_MANIFEST.md)中。MediaPipe 使用 Apache License 2.0；模型使用仍受清单链接的上游声明约束。

## 演示媒体

- Blender Studio / Blender Foundation 片段在产品界面和[素材清单](docs/ASSET_MANIFEST.md)中按对应 Creative Commons Attribution 条款标注来源。
- 仓库中的美国海岸警卫队和美国海军片段链接到明确标为 Public Domain 的 DVIDS 来源页。美国国防部视觉信息的出现不代表国防部背书；公开权、隐私、商标和第三方权利仍可能适用。
- 虚构游戏广告图为项目自有素材，项目所有者已经确认可以保留在公开作品集版本中。
- 早期托管私有版本使用的可选 Sprite Fright S2 片段没有进入 Git 仓库。
- 早期 FEMA 新闻节选因来源与后续使用权未达到发布记录标准而被排除。

## 素材记录

[素材清单](docs/ASSET_MANIFEST.md)是来源 URL、作者或机构、授权/公有领域依据、修改、本地文件名和校验值的发布记录。未验证素材不会进入公开仓库。
