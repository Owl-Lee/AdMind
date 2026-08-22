# Development

[English](#development) · [中文](#开发说明)

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
| `pnpm test:s2-regression` | Validate the fixed S2 manifest, frame hashes, scorer and tracked baseline. |
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
- `app/lib/pause-regression.test.ts` validates the Stage 1A fixed-frame contract and recomputes the tracked baseline from raw predictions. That baseline was run by the v0.3.0 harness commit `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` with detector configuration behavior referenced to v0.2.7 commit `bdf66d1db7511f97feba49713f9995ea6ef13711`; the older commit did not run the new harness.
- `packages/video-analyzer/src/*.test.ts` covers provider normalization and repeated-run consensus.
- `services/api/src/app.test.ts` verifies the Fastify adapter.
- `tests/rendered-html.test.mjs` confirms production-rendered output.

The release acceptance pass also verifies navigation, localization, media controls, ad dismissal and responsive layout in a real browser. Converting those acceptance paths into checked-in end-to-end tests remains a roadmap item.

### Run the S2 browser baseline

Start `pnpm dev`, open `http://localhost:3000/regression`, and choose **Run fixed set**. The runner evaluates the 20 exact 1280×720 image files recorded in `evaluation/s2/manifest.json`; green boxes are rule-drafted protection targets and purple dashed boxes are current predictions. The project agent drafted every target and acceptable placement from explicit rules: 13 rule-clear samples are locked as `rule-confirmed`, while seven subjective samples remain diagnostic until the product owner reviews them. Exported browser results are candidate evidence, not a new accepted baseline until the manifest, model/config hashes and bilingual baseline report are updated together.

The tracked fixed-set result is 6/13 (46.2%) safe-placement agreement, 4/13 (30.8%) unsafe placement and 3/13 (23.1%) over-deferral. Protected-target precision is 4/25 (16.0%), recall is 4/11 (36.4%), F1 is 22.2%, and the recorded run measured 318 ms p50 / 335 ms p95. These figures apply only to this fixed set.

Ordinary CI deliberately replays the tracked raw predictions instead of running fresh MediaPipe inference. The current WASM runtime is fetched from jsDelivr, so making it a blocking network-dependent CI step would create false failures. Stage 1C will vendor the runtime and add a separate browser benchmark job.

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

---

# 开发说明

## 环境要求

- Node.js 24 或更高版本
- pnpm 11 或更高版本
- Git

## 安装与启动

```bash
git clone https://github.com/Owl-Lee/AdMind.git
cd AdMind
pnpm install
```

启动网页产品体验：

```bash
pnpm dev
```

打开 `http://localhost:3000`。需要独立 API 时，在另一个终端运行：

```bash
pnpm dev:api
```

## 环境变量

只有本地命令需要服务商凭证或 API 配置时，才把 `.env.example` 复制为 `.env.local`。

| 变量 | 是否必需 | 用途 |
| --- | --- | --- |
| `PORT` | 否 | 独立 API 端口，默认 `4000`。 |
| `HOST` | 否 | 独立 API 绑定地址，默认 `127.0.0.1`。 |
| `ADMIND_WEB_ORIGIN` | 否 | 本地 API 集成允许的网页来源。 |
| `TWELVELABS_API_KEY` | 仅分析时 | 运行 TwelveLabs 适配器。 |
| `GEMINI_API_KEY` | 非活动/实验 | 为当前未启用的服务商适配器保留。 |

绝不能提交 `.env.local`、服务商密钥或生成的凭证。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动 vinext 开发服务器。 |
| `pnpm dev:api` | 启动独立 Fastify 适配器。 |
| `pnpm lint` | 运行 ESLint。 |
| `pnpm typecheck` | 运行 TypeScript 检查但不生成文件。 |
| `pnpm test:unit` | 运行 Vitest 单元与集成测试。 |
| `pnpm test:s2-regression` | 验证 S2 固定清单、帧校验和、评分器与已保存基线。 |
| `pnpm test:rendered` | 构建并验证渲染后的 HTML。 |
| `pnpm test` | 运行单元测试和渲染结果验证。 |
| `pnpm check` | 依次运行 lint、typecheck 和完整测试。 |
| `pnpm build` | 生成生产 Worker 构建。 |
| `pnpm analyze:video` | 运行已配置的视频分析服务商。 |

## 分析具有合法使用权的视频

```bash
pnpm analyze:video \
  --provider twelvelabs \
  --file path/to/licensed-video.mp4 \
  --duration 90 \
  --output analysis/runs/example.json \
  --raw-output analysis/raw/example.json
```

保留服务商原始输出用于追溯，标准化结果供应用读取。如果视频或分析结果的来源、再分发权和用途没有记录，不要提交到仓库。

## 测试策略

- `packages/decision-engine/src/engine.test.ts` 覆盖硬规则、排序和审计理由。
- `app/lib/pause-decision.test.ts` 覆盖 S2 空间位置规则。
- `app/lib/pause-regression.test.ts` 验证阶段 1A 固定帧合同，并使用原始预测重算已保存基线。该基线由 v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 运行，检测配置行为参考 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711`；旧提交本身并未运行新 harness。
- `packages/video-analyzer/src/*.test.ts` 覆盖服务商标准化和多次运行共识。
- `services/api/src/app.test.ts` 验证 Fastify 适配器。
- `tests/rendered-html.test.mjs` 验证生产渲染结果。

发布验收还会在真实浏览器中验证导航、国际化、媒体控制、广告关闭和响应式布局。把这些路径转成仓库内端到端自动测试仍是后续任务。

### 运行 S2 浏览器基线

启动 `pnpm dev`，打开 `http://localhost:3000/regression`，选择 **Run fixed set / 运行固定集**。运行器会评估 `evaluation/s2/manifest.json` 记录的 20 张 1280×720 固定图片；绿色框是规则初标保护目标，紫色虚线框是当前预测。全部保护目标和可接受位置均由项目代理依据明确规则起草：13 张规则明确样本锁定为 `rule-confirmed`，7 张主观样本在产品负责人复核前保持诊断状态。浏览器导出的结果只是候选证据；只有清单、模型/配置哈希和双语基线报告一起更新后，才能成为新的正式基线。

当前固定集结果为：安全位置一致率 `6/13 = 46.2%`，危险误投 `4/13 = 30.8%`，过度顺延 `3/13 = 23.1%`；保护目标精确率 `4/25 = 16.0%`，召回率 `4/11 = 36.4%`，F1 `22.2%`，已记录运行耗时为 P50 `318 ms` / P95 `335 ms`。这些数字仅适用于当前固定集。

普通 CI 会重放已保存的原始预测，而不会重新执行 MediaPipe。当前 WASM 运行时仍从 jsDelivr 加载，把它作为强制联网 CI 会制造假失败。阶段 1C 会把运行时固定到仓库并增加独立浏览器基准任务。

## 本地开发媒体

仓库包含所有公开可选场景所需且已经记录来源的媒体。早期可选的 Sprite Fright 样本在形成可复现素材流程前被明确排除，公开界面不会暴露指向缺失文件的入口。

在精确来源与再分发条款记录完成前，不要把该文件加入公开分支。

## Pull Request 流程

1. 从 `main` 创建聚焦的小分支。
2. 只做一组完整且相关的修改。
3. 行为改变时同步更新测试和用户文档。
4. 运行 `pnpm check`。
5. 使用仓库模板创建 Pull Request。

CI 会在每个 Pull Request 和每次推送到 `main` 时重复运行主要质量门。
