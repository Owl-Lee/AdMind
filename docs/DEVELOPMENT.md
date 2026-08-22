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
- `app/lib/face-detector.test.ts` covers the narrow weak crop-only person suppression boundary and confirms that direct, strong crop and animal candidates remain eligible; the implementation's label guard also leaves faceless character candidates eligible.
- `app/lib/pause-regression.test.ts` validates the Stage 1A fixed-frame contract and recomputes both the historical baseline and the tracked Stage 1B candidate from raw predictions. The historical baseline was run by v0.3.0 harness commit `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` with detector configuration behavior referenced to v0.2.7 commit `bdf66d1db7511f97feba49713f9995ea6ef13711`; the older commit did not run the new harness. The final v0.4.0 browser artifact uses `s2-vision-v4`, runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152` and `generatedAt` `2026-08-22T03:42:41.155Z`.
- `app/lib/pause-review.test.ts` validates immutable schema-v1 intake and schema-v2 calibration exports, including the source SHA-256 link, normalized replacement rectangles, required eight-item coordinate queue, three placement resolutions and stale-artifact rejection.
- `packages/video-analyzer/src/*.test.ts` covers provider normalization and repeated-run consensus.
- `services/api/src/app.test.ts` verifies the Fastify adapter.
- `tests/rendered-html.test.mjs` confirms production-rendered output.

The release acceptance pass also verifies navigation, localization, media controls, ad dismissal and responsive layout in a real browser. Converting those acceptance paths into checked-in end-to-end tests remains a roadmap item.

### Run the S2 browser baseline

Start `pnpm dev`, open `http://localhost:3000/regression`, and choose **Run fixed set**. The runner evaluates the 20 exact 1280×720 image files recorded in `evaluation/s2/manifest.json`. Green boxes are AI-assisted project-agent drafts; purple dashed boxes are browser-local MediaPipe output and are hidden by default; TwelveLabs generates neither box type. The immutable schema-v1 first-pass artifact records 13/13 priority opinions: five drafts were accepted and eight require second-review coordinates. The other seven frames remain unreviewed agent drafts, so the dataset is not complete human ground truth.

Open `http://localhost:3000/regression/calibrate` for the v0.4.1 second-review workflow. It contains only the eight adjustment cases. Move a green rectangle by dragging it, resize it from the lower-right handle, or enter normalized percentages for exact keyboard control. Reviewers may add person, face or character targets, delete the selected target, reset the suggested draft, and resolve the three placement conflicts. Each proposed upper-corner card reports the scorer's composite rule-risk percentage, which combines overlap and proximity rather than measuring overlap alone; values above the 40% threshold are warned. Confirmation also requires an explicit acknowledgement of the highlighted boundary and composite geometry risk, which is invalidated whenever target geometry changes. A complete export requires 8/8 target decisions and 3/3 placement resolutions. Drafts and undo history stay in that browser's `localStorage`.

The original schema-v1 file is immutable. A downloaded schema-v2 review binds its exact SHA-256 and remains separate evidence: the page does not upload it, train the detector or modify `manifest.json`. Validation must receive that source review, its SHA-256 and the trusted calibration seed; expected target IDs come from the source's eight adjustment records, while placement resolutions are fixed to the seed's `charge-005/008/009`. Never validate queue identity from IDs declared by the export itself. A maintainer must validate the export, deliberately create a separately versioned reviewed manifest and only then re-score the saved predictions. Re-scoring saved boxes is a label-only comparison, not fresh inference.

The main site's **Decision** view links directly to `/regression`. The S2 player and placement scorer both use a 0.30×0.30 creative footprint on a 16:9 stage. `filterUnsupportedCropSubjects` suppresses only low-confidence crop-only `人物主体` candidates without a face center inside the box. Direct detections, strong crop detections, animal candidates and faceless character candidates remain. A back-facing low-confidence person may still be removed, so a dedicated holdout set is required before generalizing this heuristic. Detection is fail-closed: both face and object detectors must initialize and run; if either one is unavailable, the whole frame is unavailable, no placement is emitted and a blocking sample counts as a miss.

The historical pre-tuning result is 6/13 (46.2%) safe-placement agreement, 4/13 (30.8%) unsafe placement and 3/13 (23.1%) over-deferral, with 16.0% precision, 36.4% recall, 22.2% F1 and 318/335 ms p50/p95. The public v0.4.0 candidate at `evaluation/s2/candidates/v0.4.0.json` completed 20/20 available frames and measures 7/13 (53.8%) safe placement, 3/13 (23.1%) unsafe placement, 3/13 (23.1%) over-deferral, TP 5 / FP 16 / FN 6, 23.8% precision, 45.5% recall, 31.3% F1 and 277/307 ms p50/p95. Target P/R/F1 is exploratory, class-agnostic raw-box matching at IoU ≥ 0.25, not calibrated semantic accuracy. These figures apply only to the original schema-v1 agent-draft manifest. v0.4.1 adds no new detector run or metric.

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
- `app/lib/face-detector.test.ts` 覆盖严格限定的低置信裁剪人物抑制边界，并确认直接检测、强裁剪与动物候选仍会保留；实现中的标签守卫也会保留无脸角色候选。
- `app/lib/pause-regression.test.ts` 验证阶段 1A 固定帧合同，并使用原始预测重算历史基线与阶段 1B 候选。历史基线由 v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 运行，检测配置行为参考 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711`；旧提交本身并未运行新 harness。最终 v0.4.0 浏览器产物使用 `s2-vision-v4`，运行器/配置提交均为 `e0a033194ea04a9c926a822e4330355f41ddd152`，`generatedAt` 为 `2026-08-22T03:42:41.155Z`。
- `app/lib/pause-review.test.ts` 验证不可变 schema v1 接收与 schema v2 校框导出，覆盖源文件 SHA-256 绑定、归一化替换矩形、8 张坐标队列、3 处位置裁决和旧文件拒绝。
- `packages/video-analyzer/src/*.test.ts` 覆盖服务商标准化和多次运行共识。
- `services/api/src/app.test.ts` 验证 Fastify 适配器。
- `tests/rendered-html.test.mjs` 验证生产渲染结果。

发布验收还会在真实浏览器中验证导航、国际化、媒体控制、广告关闭和响应式布局。把这些路径转成仓库内端到端自动测试仍是后续任务。

### 运行 S2 浏览器基线

启动 `pnpm dev`，打开 `http://localhost:3000/regression`，选择 **Run fixed set / 运行固定集**。运行器会评估 `evaluation/s2/manifest.json` 记录的 20 张 1280×720 固定图片。绿色框是 AI 辅助的项目代理初标；紫色虚线框是默认隐藏的浏览器本地 MediaPipe 输出；TwelveLabs 不生成这两类框。不可变 schema v1 第一轮原件记录了 13/13 张优先样本意见：5 张初标被接受，8 张需要二审坐标；另外 7 张仍是未产品审核的代理初标，因此当前数据集不是完整人工真值。

打开 `http://localhost:3000/regression/calibrate` 进入 v0.4.1 二审流程。页面只包含 8 张待调整样本：拖动绿色矩形可移动，拖动右下角手柄可缩放，也可用归一化百分比输入完成精确键盘调整。复核者可以新增人物、人脸或角色目标，删除当前目标，重置建议，并裁决 3 处位置冲突。每个待确认上角广告位都会显示评分器的规则综合风险百分比；该分数同时考虑重叠与邻近度，不是纯重叠比例，超过 40% 阈值时显示警告。确认前还必须明确勾选已检查重点边界与规则综合风险，目标几何一旦变化，该勾选立即失效。只有完成 8/8 张目标决定和 3/3 处位置裁决，才能导出完整结果。草稿和撤销历史只保存在当前浏览器 `localStorage`。

原 schema v1 文件不可变。下载的 schema v2 复核会绑定其准确 SHA-256，并作为独立证据保存；页面不会上传文件、训练检测器或修改 `manifest.json`。校验时必须同时传入源复核、其 SHA-256 与可信 calibration seed：8 张目标 ID 来自源复核中的调整记录，位置裁决严格锁定为 seed 的 `charge-005/008/009`，绝不能信任导出自报的队列 ID。维护者必须校验导出，有意建立单独版本化的复核 manifest，之后才能用已保存预测重新评分。重放已保存检测框只是标签变化对比，不是新的推理运行。

主站 **Decision / 决策方式** 页面直接链接 `/regression`。S2 播放器与位置评分器统一使用 `0.30 × 0.30` 创意占位，舞台固定为 16:9。`filterUnsupportedCropSubjects` 只抑制框内没有脸部中心佐证的低置信裁剪 `人物主体`；直接检测、强裁剪、动物与无脸角色候选继续保留。背面低置信人物仍可能被移除，因此在泛化该启发式规则前必须建立专门留出集。检测采用 fail-closed：人脸与主体检测器必须都成功初始化并运行；任一不可用时整帧标记为不可用、不输出位置，并将阻断样本计为失败。

调参前历史结果为：安全位置一致率 `6/13 = 46.2%`，危险误投 `4/13 = 30.8%`，过度顺延 `3/13 = 23.1%`，精确率 `16.0%`，召回率 `36.4%`，F1 `22.2%`，P50/P95 `318/335 ms`。公开 v0.4.0 候选位于 `evaluation/s2/candidates/v0.4.0.json`，20/20 张均可用，安全位置一致率 `7/13 = 53.8%`，危险误投 `3/13 = 23.1%`，过度顺延 `3/13 = 23.1%`；TP 5 / FP 16 / FN 6，精确率 `23.8%`，召回率 `45.5%`，F1 `31.3%`，P50/P95 `277/307 ms`。目标 P/R/F1 是 IoU ≥ 0.25 的类别无关原始框探索性匹配，不是经过校准的语义准确率。这些数字只适用于原始 schema v1 代理初标 manifest；v0.4.1 没有新增检测器运行或指标。

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
