<div align="center">

<img src="public/favicon.svg" width="88" alt="AdMind logo">

# AdMind

**An explainable AI decision layer for less disruptive video advertising.**

[![CI](https://github.com/Owl-Lee/AdMind/actions/workflows/ci.yml/badge.svg)](https://github.com/Owl-Lee/AdMind/actions/workflows/ci.yml)
[![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Public%20prototype-7567E8)](#project-status)

[English](#overview) · [中文](#中文说明) ·
[Live demo](https://admind-decision-console.liyanbao06.chatgpt.site/) ·
[Architecture](docs/ARCHITECTURE.md) ·
[Case study](docs/CASE_STUDY.md) ·
[S2 baseline](docs/S2_REGRESSION_BASELINE.md) ·
[Development](docs/DEVELOPMENT.md) ·
[Roadmap](docs/ROADMAP.md) ·
[中文说明](#中文说明)

</div>

![AdMind decision experience in English](docs/images/admind-showcase-en.png)

## Overview

AdMind is a policy-first advertising decision prototype for long-form video. Instead of asking only which ad is most valuable, it decides:

- **when** an ad may appear;
- **which format** creates the least disruption;
- **where** a pause ad can be placed without covering important content; and
- **when an ad must not be shown**, even when a campaign still has delivery pressure.

AI supplies bounded evidence about the video. Deterministic rules retain final authority over policy, player state, creative eligibility and protected contexts. Every decision is designed to remain explainable and auditable.

## Product scenarios

| Scenario | Product question | Implemented evidence and behavior |
| --- | --- | --- |
| **S1 · Climax avoidance** | When should an ad appear? | Cached, time-coded TwelveLabs analyses identify narrative segments. AdMind compares a fixed break with a safer window or lower-disruption fallback. |
| **S2 · Pause protection** | Should a pause ad appear, and where? | A browser-side state machine observes pause, resume, seeking, visibility and focus. MediaPipe inspects the paused frame and scores four candidate corners. |
| **S3 · Ethical boundary** | Is advertising allowed here at all? | Rescue and medical evidence feeds deterministic hard rules that can block in-content advertising regardless of commercial value. |

The live experience presents the three scenarios as one continuous story and exposes the evidence behind each decision.

## Why it is different

- **Policy before ranking** — a high bid or model score cannot override a hard rule.
- **Evidence, not model prose** — provider output is normalized and validated before it reaches the decision engine.
- **Real player state** — pause, resume, seeking, focus and page visibility affect execution.
- **Spatial safety** — pause ads are placed using frame-level risk rather than a fixed corner.
- **Delivery-aware restraint** — an unsafe opportunity can be deferred without pretending the campaign disappeared.
- **Honest boundaries** — model evidence scores are not presented as calibrated probabilities, and the demo does not claim universal scene understanding.

## How it works

```mermaid
flowchart LR
    A["Video content"] --> B["Offline semantic analysis"]
    A --> C["Live paused-frame analysis"]
    B --> D["Normalized evidence"]
    C --> D
    E["Player and page state"] --> F["Deterministic policy engine"]
    G["Campaign and creative constraints"] --> F
    D --> F
    F --> H["Time, format, position or block"]
    H --> I["Player execution"]
    F --> J["Auditable reasons"]
```

- **S1 and S3** use cached TwelveLabs analysis so the public-facing demo does not require a visitor API key or repeat paid inference.
- **S2** runs lightweight MediaPipe inference locally in the browser after a stable pause.
- **All scenarios** use the same typed contracts and deterministic decision layer exposed by the UI and API adapters.

Read [Architecture](docs/ARCHITECTURE.md) for component boundaries and runtime flows.

## Live demo

The hosted product preview is publicly accessible without a sign-in:

**https://admind-decision-console.liyanbao06.chatgpt.site/**

English is the default public experience. The `EN / 中` control switches the complete interface and caption track without reloading. The same four-part experience is tested at desktop, tablet, narrow-window and phone widths; the page uses normal browser scrolling rather than forced scroll snapping.

The deployment is a product demonstration, not an advertising network, auction service or production campaign-management platform.

The public [S2 Vision Regression Lab](https://admind-decision-console.liyanbao06.chatgpt.site/regression) replays 20 fixed 1280×720 frames. Public v0.4.1 adds the linked [Protection Calibration Lab](https://admind-decision-console.liyanbao06.chatgpt.site/regression/calibrate): the immutable first-pass export records 13/13 priority opinions, with five protection drafts accepted and eight routed to exact-coordinate second review. The other seven frames remain unreviewed agent drafts, so the project does not claim 20-frame human ground truth. Green references are AI-assisted project-agent drafts, purple dashed boxes are hidden-by-default browser-local MediaPipe output, and blue regions are placement choices; TwelveLabs does not generate either S2 box type.

The main-site **Decision** view links directly to `/regression`, and that lab links to `/regression/calibrate`. Calibration edits stay in browser `localStorage`. A schema-v2 export binds the immutable schema-v1 review SHA-256, but it is not uploaded, does not train the model and does not modify the manifest automatically. New model metrics may be reported only after a reviewed manifest is created and the saved predictions are re-scored against it.

The v0.5.0 release candidate adds `/regression/intake`, a bilingual local intake, preview and label-only re-score workspace for that future schema-v2 export. It strictly validates the source binding and required 8/8 coordinate plus 3/3 placement decisions, reuses the saved v0.4.0 raw predictions, and never uploads or overwrites the tracked manifest. The same candidate self-hosts all six MediaPipe Tasks Vision 1.0.1 runtime files as `s2-vision-v5`, adds a fresh 20-frame Playwright Chromium CI job, and rejects late pause-analysis promises through a session token. The CI temporarily treats `charge-005/008/013/016/018` as diagnostic because first-pass review requires their labels/boxes to be resolved; `charge-002` was confirmed correct and stays in the stable gate. Every other stable-label sample is also blocked from becoming newly unsafe. These are engineering changes, not new model metrics; Stage 1C remains partial until the first v5 CI run and hosted fresh run pass.

## Quick start

### Requirements

- Node.js 24 or later
- pnpm 11 or later

### Run the web experience

```bash
git clone https://github.com/Owl-Lee/AdMind.git
cd AdMind
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

### Run the standalone API

```bash
pnpm dev:api
```

The Fastify adapter listens on `http://127.0.0.1:4000` by default.

### Run verification

```bash
pnpm check
```

Individual gates are also available:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:s2-regression
pnpm test:rendered
pnpm build
```

The fresh S2 browser gate uses a production build and pinned Chromium:

```bash
pnpm exec playwright install chromium
pnpm build
pnpm test:s2-browser
```

See [Development](docs/DEVELOPMENT.md) for environment variables, analysis commands and repository conventions.

## Optional video analysis

The checked-in demo reads cached, schema-validated analysis JSON. A new licensed video can be analyzed locally with TwelveLabs:

```bash
pnpm analyze:video \
  --provider twelvelabs \
  --file path/to/licensed-video.mp4 \
  --duration 90 \
  --output analysis/runs/example.json \
  --raw-output analysis/raw/example.json
```

Create `.env.local` with `TWELVELABS_API_KEY` before running the command. Never expose provider keys to browser code or commit them to Git.

## API surface

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/decisions` | Return the built-in baseline and AdMind scenario comparisons. |
| `POST` | `/api/decisions` | Execute a validated decision request through the shared engine. |
| `GET` | `/v1/scenarios/:id` | Return S1, S2 or S3 from the standalone Fastify adapter. |
| `POST` | `/v1/decisions` | Execute the same engine through the standalone adapter. |

## Repository map

```text
app/                         Product experience and co-located web API
packages/contracts/          Zod contracts and shared TypeScript types
packages/decision-engine/    Hard rules, plan ranking, fixtures and tests
packages/video-analyzer/     Provider adapters, prompts and normalization
services/api/                Standalone Fastify adapter
analysis/runs/               Validated analysis consumed by the demo
analysis/raw/                Provider output retained for traceability
evaluation/s2/               Fixed-frame labels, raw baseline and reports
public/evaluation/s2/        Immutable browser-consumable regression frames
worker/                      Media routing for the deployed experience
docs/                        Architecture, research, specs and handoff notes
tests/                       Rendered-output verification
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system boundaries and runtime flows.
- [Case study](docs/CASE_STUDY.md) — product problem, engineering decisions and interview-ready explanation.
- [S2 regression baseline](docs/S2_REGRESSION_BASELINE.md) — fixed-frame methodology, measured reference-configuration results and limitations.
- [Development](docs/DEVELOPMENT.md) — setup, commands and contribution workflow.
- [Roadmap](docs/ROADMAP.md) — staged path from prototype to public release.
- [Video analyzer](docs/VIDEO_ANALYZER.md) — provider contract and evidence pipeline.
- [Decision engine specification](docs/DECISION_ENGINE_SPEC_V1.md) — policy and ranking design.
- [Acceptance tests](docs/ACCEPTANCE_TESTS_V1.md) — behavior-level product criteria.
- [PRD](docs/PRD.md) — product requirements and scope.
- [Engineering handoff](docs/AdMind项目工程交接文档.md) — current facts, validation and next work.
- [Technical walkthrough](docs/AdMind项目技术亮点与讲解.md) — Chinese project explanation and interview narrative.
- [Asset manifest](docs/ASSET_MANIFEST.md) — media and model provenance, licenses, modifications and checksums.

Some design documents preserve earlier planning decisions. The README, engineering handoff and changelog are the authoritative sources for current implementation status.

## Project status

AdMind is a **public, portfolio-grade product prototype**. The complete demonstration path is implemented, but it is not a production ad platform or a claim of measured business uplift.

Current boundaries:

- S1 and S3 prove the pipeline on a fixed set of licensed or public-domain demo clips; they are not broad benchmark results.
- The historical pre-tuning result remains tracked: the v0.3.0 harness at `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` replayed the v0.2.7 configuration behavior referenced at `bdf66d1db7511f97feba49713f9995ea6ef13711`. On 13 rule-confirmed drafts it measured 6/13 (46.2%) safe-placement agreement, 4/13 (30.8%) unsafe placement, 3/13 (23.1%) over-deferral, 4/25 (16.0%) protected-target precision, 4/11 (36.4%) recall, 22.2% F1 and 318 ms p50 / 335 ms p95 latency.
- The public v0.4.0 Stage 1B candidate remains tracked at `evaluation/s2/candidates/v0.4.0.json`. The final browser run used `s2-vision-v4` at runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152` and was generated at `2026-08-22T03:42:41.155Z`. All 20/20 frames were available. On the original schema-v1 agent-draft manifest it measured 7/13 (53.8%) safe placement, 3/13 (23.1%) unsafe placement, 3/13 (23.1%) over-deferral, TP 5 / FP 16 / FN 6, 23.8% precision, 45.5% recall, 31.3% F1 and 277 ms p50 / 307 ms p95 latency. The target P/R/F1 values are exploratory, class-agnostic raw-box matches at IoU ≥ 0.25—not calibrated semantic detector accuracy. It genuinely fixes `charge-012` under that historical label contract.
- Public v0.4.1 adds the exact-coordinate calibration tool, not a new detector result. The first-pass review artifact is immutable: 13 priority opinions are archived, five green drafts were accepted, eight require replacement coordinates, and seven frames remain without product review. A future schema-v2 export must reference the v1 artifact SHA and be maintainer-validated before a separately versioned manifest or any re-scored metrics exist.
- The v0.5.0 candidate adds a local `/regression/intake` validator and preview, self-hosted MediaPipe 1.0.1 runtime provenance as `s2-vision-v5`, an independent fresh-browser CI job and stale-promise protection for pause sessions. The intake comparison re-scores the same saved v0.4.0 raw predictions; it is not new inference. No v5 metric is published until the first CI and hosted fresh runs pass, and Stage 1B still requires the product owner's 8/8 coordinate decisions, 3/3 placement resolutions and later review of the other seven frames.
- A separate six-frame 1280×720 holdout is now sealed: four cross-source primary samples plus two same-source `CHARGE` supplemental diagnostics. All six keep `groundTruth = null`, `sealed-unreviewed` and `useForTuning = false`; they are reproducible evaluation infrastructure, not labels, training data, a model metric or independent six-frame generalization evidence.
- The existing result sets describe this exact 20-frame project fixture, not general model accuracy or a production SLA. Their numbers remain tied to the original agent-draft manifest and must not be presented as product-reviewed metrics.
- The v0.4.0 implementation aligns scorer and rendered-card geometry at 0.30×0.30 on a 16:9 S2 stage. Its weak crop suppression applies only to low-confidence crop-only `人物主体` candidates without a corroborating face; strong crop, direct, animal and faceless character candidates remain. A back-facing, low-confidence person can still be suppressed, so holdout coverage is required before claiming generalization. Detection is fail-closed: both the face and object detectors are required; if either is unavailable, the frame returns no placement and counts as a blocking miss rather than silently using partial evidence.
- Pause thresholds and risk weights are product hypotheses, not industry-optimal constants.
- Deferred delivery is represented within the current session; cross-page and cross-device campaign orchestration is not implemented.
- The public release intentionally omits an earlier optional Sprite Fright sample that did not ship with a reproducible asset workflow.
- The public portfolio uses a project-owned fictional game creative confirmed by the project owner.

See the [Roadmap](docs/ROADMAP.md) for the public-release gates.

## Security and privacy

- Provider keys are local/server-side only and ignored by Git.
- Cached analysis lets visitors use the demo without sending video to an AI provider.
- S2 frame analysis happens locally in the browser.
- The demo observes only its own player and page state; it does not infer user intent or inspect other applications.

Report security issues through the process in [SECURITY.md](SECURITY.md).

## Contributing

Contributions and focused issue reports are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request.

## Licensing and media

No open-source license has been granted for the AdMind source code yet. Unless a file states otherwise, all rights are reserved. Third-party libraries, models and media remain subject to their own licenses and source terms.

See [Third-party notices](THIRD_PARTY_NOTICES.md) and the [asset manifest](docs/ASSET_MANIFEST.md). Media files are distributed only when their source and reuse basis are documented.

---

## 中文说明

![AdMind 中文决策体验](docs/images/admind-showcase.png)

## 项目概述

AdMind 是一个面向长视频广告、规则优先的广告决策原型。它不只判断“哪条广告价值最高”，还会决定：

- 广告**什么时候**可以出现；
- **哪种形式**对内容的打断最小；
- 暂停广告应该放在**什么位置**，才能避免遮挡重要画面；
- 即使广告任务仍有交付压力，**什么时候也必须不投放**。

AI 负责提供有明确边界的视频内容证据。确定性规则继续掌握广告政策、播放器状态、广告素材资格和敏感场景保护的最终决定权。每一项决定都以可解释、可审计为设计目标。

## 产品场景

| 场景 | 产品问题 | 已实现的证据与行为 |
| --- | --- | --- |
| **S1 · 剧情高点避让** | 广告应该什么时候出现？ | 使用缓存且带时间码的 TwelveLabs 分析识别叙事片段。AdMind 会比较固定广告点与更安全的窗口，并在必要时选择更低打断的形式。 |
| **S2 · 用户暂停保护** | 暂停时应该投广告吗？应该放在哪里？ | 浏览器端状态机观察暂停、恢复、拖动、页面可见性和焦点。MediaPipe 检查暂停画面，并为四个候选角落计算遮挡风险。 |
| **S3 · 伦理边界** | 这个场景是否允许出现广告？ | 救援和医疗证据进入确定性硬规则；无论商业价值多高，规则都可以阻断内容内广告。 |

线上体验把三个场景组织成一条连续叙事，并直接展示每次决定背后的证据。

## 项目差异

- **先执行政策，再进行排序** —— 高出价或高模型评分不能覆盖硬规则。
- **使用证据，而不是模型散文** —— AI 服务商的输出必须先经过标准化与结构校验，才能进入决策引擎。
- **接入真实播放器状态** —— 暂停、恢复、拖动、焦点和页面可见性都会影响实际执行。
- **关注空间安全** —— 暂停广告根据当前帧的遮挡风险选择位置，而不是永远固定在同一个角落。
- **兼顾交付但保持克制** —— 不安全的机会可以被顺延，同时保留广告任务的交付缺口。
- **诚实说明能力边界** —— 模型证据分数不会被包装成校准后的统计概率，Demo 也不宣称能够理解所有场景。

## 工作原理

```mermaid
flowchart LR
    A["视频内容"] --> B["离线语义分析"]
    A --> C["暂停画面实时分析"]
    B --> D["标准化证据"]
    C --> D
    E["播放器与页面状态"] --> F["确定性政策引擎"]
    G["广告任务与素材约束"] --> F
    D --> F
    F --> H["时间、形式、位置或阻断"]
    H --> I["播放器执行"]
    F --> J["可审计的决定理由"]
```

- **S1 和 S3** 使用缓存的 TwelveLabs 分析，因此对外展示时不需要访客提供 API Key，也不会重复触发付费推理。
- **S2** 在稳定暂停后，直接在浏览器本地运行轻量级 MediaPipe 推理。
- **所有场景** 共用同一套类型契约和确定性决策层，并通过界面和 API 适配器对外提供能力。

组件边界和运行链路详见[架构文档](docs/ARCHITECTURE.md)。

## 在线演示

托管的产品预览已经公开，无需登录即可访问：

**https://admind-decision-console.liyanbao06.chatgpt.site/**

公开页面默认使用英文。右上角 `EN / 中` 可在不刷新页面的情况下切换完整界面与字幕轨道。首页、S1、S2、S3 已在桌面、平板、窄窗口与手机宽度下回归；页面使用普通浏览器滚动，不再劫持滚轮或强制吸附。

该部署是产品能力演示，不是广告网络、广告竞价服务或生产级广告活动管理平台。

公开的 [S2 视觉回归实验室](https://admind-decision-console.liyanbao06.chatgpt.site/regression) 会重复运行 20 张 1280×720 固定帧。公开 v0.4.1 新增相连的[保护框校准页](https://admind-decision-console.liyanbao06.chatgpt.site/regression/calibrate)：不可变的第一轮导出已记录 13/13 张优先样本意见，其中 5 张保护框初标被接受，8 张进入精确坐标二审；另外 7 张仍是未产品审核的代理初标，因此项目不宣称 20 张都已形成人工真值。绿色参考框是 AI 辅助的项目代理初标，紫色虚线框是默认隐藏的浏览器本地 MediaPipe 输出，蓝色区域是位置选择；TwelveLabs 不生成这两类 S2 框。

主站 **Decision / 决策方式** 页面直接链接 `/regression`，回归实验室再链接 `/regression/calibrate`。校框编辑只保存在浏览器 `localStorage`。schema v2 导出会绑定不可变 schema v1 复核原件的 SHA-256，但不会上传、不会训练模型，也不会自动修改 manifest。只有建立经过复核的新 manifest，并用已保存预测重新评分后，才能发布新模型指标。

v0.5.0 候选新增 `/regression/intake` 双语本地接收、预览与标签重评分工作区。它会严格验证来源绑定以及 8/8 张坐标决定、3/3 处位置裁决，复用 v0.4.0 已保存原始预测，绝不会上传或覆盖受追踪 manifest。同一候选把 MediaPipe Tasks Vision 1.0.1 的 6 个 runtime 文件固定到站内并记为 `s2-vision-v5`，新增 20 张固定帧的 Playwright Chromium 新鲜推理 CI，并用 pause session token 拒绝迟到的暂停分析 Promise。CI 会把仍需解决标签/保护框的 `charge-005/008/013/016/018` 暂作诊断例外；`charge-002` 已确认正确，继续进入稳定门。除此之外，稳定标签同样不得新增危险误投。这些是工程变化，不是新模型指标；首次 v5 CI 和线上新鲜运行通过前，阶段 1C 仍只能标记为部分完成。

## 快速开始

### 环境要求

- Node.js 24 或更高版本
- pnpm 11 或更高版本

### 运行网页体验

```bash
git clone https://github.com/Owl-Lee/AdMind.git
cd AdMind
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。

### 运行独立 API

```bash
pnpm dev:api
```

Fastify 适配器默认监听 `http://127.0.0.1:4000`。

### 运行完整验证

```bash
pnpm check
```

也可以分别运行各项质量门：

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:s2-regression
pnpm test:rendered
pnpm build
```

新鲜 S2 浏览器质量门使用生产构建与固定 Chromium：

```bash
pnpm exec playwright install chromium
pnpm build
pnpm test:s2-browser
```

环境变量、分析命令和仓库约定详见[开发文档](docs/DEVELOPMENT.md)。

## 可选的视频分析

仓库内置 Demo 读取已经缓存并通过 Schema 校验的分析 JSON。如需分析一条拥有合法使用权的新视频，可以在本地调用 TwelveLabs：

```bash
pnpm analyze:video \
  --provider twelvelabs \
  --file path/to/licensed-video.mp4 \
  --duration 90 \
  --output analysis/runs/example.json \
  --raw-output analysis/raw/example.json
```

执行前，请在 `.env.local` 中设置 `TWELVELABS_API_KEY`。不得把服务商密钥暴露给浏览器代码，也不得提交到 Git。

## API 接口

| 方法 | 路由 | 用途 |
| --- | --- | --- |
| `GET` | `/api/decisions` | 返回内置场景中传统方案与 AdMind 方案的对比。 |
| `POST` | `/api/decisions` | 将通过校验的决策请求交给共享决策引擎执行。 |
| `GET` | `/v1/scenarios/:id` | 通过独立 Fastify 适配器返回 S1、S2 或 S3。 |
| `POST` | `/v1/decisions` | 通过独立适配器执行同一套决策引擎。 |

## 仓库结构

```text
app/                         产品体验与同仓 Web API
packages/contracts/          Zod 契约与共享 TypeScript 类型
packages/decision-engine/    硬规则、方案排序、测试样本与测试
packages/video-analyzer/     AI 服务适配器、提示词与结果标准化
services/api/                独立 Fastify 适配器
analysis/runs/               Demo 使用的已校验分析结果
analysis/raw/                为可追溯性保留的服务商原始输出
evaluation/s2/               固定帧标注、原始基线与报告
public/evaluation/s2/        供浏览器读取的不可变回归帧
worker/                      已部署体验的媒体路由
docs/                        架构、研究、规格与交接文档
tests/                       服务端渲染输出验证
```

## 项目文档

- [架构文档](docs/ARCHITECTURE.md) —— 系统边界和运行链路。
- [案例分析](docs/CASE_STUDY.md) —— 产品问题、工程决策和面试讲解方式。
- [S2 回归基线](docs/S2_REGRESSION_BASELINE.md) —— 固定帧方法、参考配置实测结果与限制。
- [开发文档](docs/DEVELOPMENT.md) —— 环境配置、命令和贡献流程。
- [路线图](docs/ROADMAP.md) —— 从原型到公开发布的阶段计划。
- [视频分析器](docs/VIDEO_ANALYZER.md) —— 服务商契约与证据处理链路。
- [决策引擎规格](docs/DECISION_ENGINE_SPEC_V1.md) —— 政策与排序设计。
- [验收测试](docs/ACCEPTANCE_TESTS_V1.md) —— 产品行为级验收标准。
- [产品需求文档](docs/PRD.md) —— 产品需求与范围。
- [工程交接文档](docs/AdMind项目工程交接文档.md) —— 当前事实、验证结果与后续工作。
- [技术亮点与讲解](docs/AdMind项目技术亮点与讲解.md) —— 中文项目说明与面试叙事。
- [素材清单](docs/ASSET_MANIFEST.md) —— 媒体和模型的来源、许可、修改记录与校验和。

部分设计文档保留了早期规划决策。README、工程交接文档和 Changelog 是当前实现状态的权威事实来源。

## 项目状态

AdMind 是一个**公开、达到作品集展示标准的产品原型**。完整演示链路已经实现，但它不是生产级广告平台，也不代表已经验证真实业务增益。

当前边界包括：

- S1 和 S3 使用一组固定的授权素材或公共领域 Demo 视频证明链路，不代表广泛基准测试结果。
- 调参前历史结果继续保留：v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 重放了 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711` 所参考的配置行为。13 张规则确认初标上的安全位置一致率为 `6/13 = 46.2%`，危险误投为 `4/13 = 30.8%`，过度顺延为 `3/13 = 23.1%`；保护目标精确率 `4/25 = 16.0%`、召回率 `4/11 = 36.4%`、F1 `22.2%`，推理耗时为 P50 `318 ms` / P95 `335 ms`。
- 公开 v0.4.0 的阶段 1B 候选结果继续保存在 `evaluation/s2/candidates/v0.4.0.json`。最终浏览器复跑使用 `s2-vision-v4`，运行器与配置提交均为 `e0a033194ea04a9c926a822e4330355f41ddd152`，生成时间为 `2026-08-22T03:42:41.155Z`；20/20 张均可用。它在原始 schema v1 代理初标 manifest 上的安全位置一致率为 `7/13 = 53.8%`，危险误投 `3/13 = 23.1%`，过度顺延 `3/13 = 23.1%`；TP 5 / FP 16 / FN 6，精确率 `23.8%`，召回率 `45.5%`，F1 `31.3%`，P50 `277 ms` / P95 `307 ms`。目标 P/R/F1 是 IoU ≥ 0.25 的类别无关原始框探索性匹配，不是经过校准的语义检测准确率。`charge-012` 的修复结论只属于该历史标签合同。
- 公开 v0.4.1 新增的是精确坐标校框工具，不是新的检测器结果。第一轮复核原件不可变：13 张优先意见已归档，5 张绿色初标被接受，8 张需要替换坐标，另外 7 张仍未产品审核。未来 schema v2 导出必须引用 v1 原件 SHA，经维护者校验后才能建立单独版本的 manifest 或重算指标。
- v0.5.0 候选新增本地 `/regression/intake` 校验与预览、`s2-vision-v5` 的 MediaPipe 1.0.1 本地运行时、独立新鲜浏览器 CI，以及暂停会话的迟到 Promise 防护。接收页前后对比使用同一份 v0.4.0 已保存原始预测，只是标签重评分，不是新推理。首次 CI 与线上新鲜运行通过前不发布 v5 指标；阶段 1B 仍需产品负责人完成 8/8 张坐标决定、3/3 处位置裁决，并在后续复核另外 7 张。
- 另有 6 张 1280×720 留出帧已经密封：4 张跨来源主要样本、2 张同源 `CHARGE` 补充诊断。6 张全部保持 `groundTruth = null`、`sealed-unreviewed`、`useForTuning = false`；它们是可复现评估基础设施，不是标签、训练数据、模型指标，也不能把 6 张整体包装成独立泛化证据。
- 现有两组数字只描述这 20 张项目固定帧，不是通用模型准确率或生产 SLA。数字仍绑定原代理初标 manifest，不能表述为产品复核后的模型指标。
- v0.4.0 已把评分器与线上卡片占位统一为 `0.30 × 0.30`，S2 舞台固定为 16:9。弱裁剪抑制只作用于“无脸部佐证、仅来自裁剪且置信度较低”的 `人物主体` 候选；强裁剪、直接检测、动物与无脸角色候选仍保留。背面低置信人物仍可能被抑制，必须用留出集继续验证泛化。检测链路采用 fail-closed：人脸与主体检测器必须同时可用；任一不可用时整帧返回无位置，并在阻断指标中计为失败，不会用部分证据静默继续。
- 暂停阈值和风险权重属于当前产品假设，不是行业最优常数。
- 广告顺延目前只在当前会话中表达，尚未实现跨页面、跨设备的广告任务编排。
- 公开版本有意移除了一个早期可选的 Sprite Fright 样本，因为它没有形成可复现的素材发布流程。
- 公开作品集使用由项目所有者确认拥有使用权的虚构游戏广告素材。

公开发布门槛和后续计划详见[路线图](docs/ROADMAP.md)。

## 安全与隐私

- AI 服务商密钥只在本地或服务端使用，并已被 Git 忽略。
- 缓存分析让访客无需把视频发送给 AI 服务商即可体验 Demo。
- S2 的画面分析在浏览器本地完成。
- Demo 只观察自身播放器和页面状态，不推断用户意图，也不检查其他应用。

安全问题请按照 [SECURITY.md](SECURITY.md) 中的流程报告。

## 参与贡献

欢迎提交聚焦的贡献和问题报告。创建 Pull Request 前，请阅读[贡献指南](CONTRIBUTING.md)和[行为准则](CODE_OF_CONDUCT.md)。

## 授权与媒体素材

AdMind 源代码目前尚未授予开源许可证。除非文件另有说明，否则保留所有权利。第三方库、模型和媒体素材继续遵循各自的许可证与来源条款。

详见[第三方声明](THIRD_PARTY_NOTICES.md)和[素材清单](docs/ASSET_MANIFEST.md)。只有来源与复用依据已经记录的媒体文件才会随仓库发布。
