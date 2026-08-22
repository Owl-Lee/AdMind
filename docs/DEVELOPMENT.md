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
- `packages/video-analyzer/src/*.test.ts` covers provider normalization and repeated-run consensus.
- `services/api/src/app.test.ts` verifies the Fastify adapter.
- `tests/rendered-html.test.mjs` confirms production-rendered output.

The release acceptance pass also verifies navigation, localization, media controls, ad dismissal and responsive layout in a real browser. Converting those acceptance paths into checked-in end-to-end tests remains a roadmap item.

### Run the S2 browser baseline

Start `pnpm dev`, open `http://localhost:3000/regression`, and choose **Run fixed set**. The runner evaluates the 20 exact 1280×720 image files recorded in `evaluation/s2/manifest.json`. Every green target and placement label is an agent-authored draft, not human ground truth: 13 rule-clear samples enter blocking metrics as `rule-confirmed`, while seven remain diagnostic. Exported browser results are candidate evidence, not a new accepted baseline until the manifest, model/config hashes and bilingual report are updated together.

The page defaults to **Priority review**, a 13-frame queue made from the original seven subjective drafts plus `charge-002/005/008/013/016/018`. The other seven frames remain unreviewed agent-rule drafts. Green boxes are agent-drafted targets; purple dashed boxes are model output and are hidden by default; blue regions are the current placement choice, prefilled from the agent draft and dashed until confirmation. The four-step review is: (1) verify every green protected target, (2) select every safe upper corner or defer, (3) explain the decision or target adjustment, and (4) confirm and export. Answers stay in that browser's `localStorage`; undo is supported. Exported review JSON is not uploaded and does not modify `manifest.json`; a maintainer must validate and commit it separately. Confirmation does not train the model automatically.

The main site's **Decision** view links directly to `/regression`. The S2 player and placement scorer both use a 0.30×0.30 creative footprint on a 16:9 stage. `filterUnsupportedCropSubjects` suppresses only low-confidence crop-only `人物主体` candidates without a face center inside the box. Direct detections, strong crop detections, animal candidates and faceless character candidates remain. A back-facing low-confidence person may still be removed, so a dedicated holdout set is required before generalizing this heuristic. Detection is fail-closed: both face and object detectors must initialize and run; if either one is unavailable, the whole frame is unavailable, no placement is emitted and a blocking sample counts as a miss.

The historical pre-tuning result is 6/13 (46.2%) safe-placement agreement, 4/13 (30.8%) unsafe placement and 3/13 (23.1%) over-deferral, with 16.0% precision, 36.4% recall, 22.2% F1 and 318/335 ms p50/p95. The public v0.4.0 candidate at `evaluation/s2/candidates/v0.4.0.json` completed 20/20 available frames and measures 7/13 (53.8%) safe placement, 3/13 (23.1%) unsafe placement, 3/13 (23.1%) over-deferral, TP 5 / FP 16 / FN 6, 23.8% precision, 45.5% recall, 31.3% F1 and 277/307 ms p50/p95. Target P/R/F1 is exploratory, class-agnostic raw-box matching at IoU ≥ 0.25, not calibrated semantic accuracy. It fixes `charge-012`; remaining over-deferrals are `charge-002/008/016`, while unsafe placements are `charge-005/013/018`. Do not continue tuning the disputed `charge-002/005/008/013/018` placement drafts until their labels are reviewed. These figures apply only to this fixed set.

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
- `packages/video-analyzer/src/*.test.ts` 覆盖服务商标准化和多次运行共识。
- `services/api/src/app.test.ts` 验证 Fastify 适配器。
- `tests/rendered-html.test.mjs` 验证生产渲染结果。

发布验收还会在真实浏览器中验证导航、国际化、媒体控制、广告关闭和响应式布局。把这些路径转成仓库内端到端自动测试仍是后续任务。

### 运行 S2 浏览器基线

启动 `pnpm dev`，打开 `http://localhost:3000/regression`，选择 **Run fixed set / 运行固定集**。运行器会评估 `evaluation/s2/manifest.json` 记录的 20 张 1280×720 固定图片。所有绿色保护目标与位置标签都是代理初标，不是人工标准答案：13 张规则明确样本以 `rule-confirmed` 身份进入阻断指标，7 张保持诊断状态。浏览器导出的结果只是候选证据；只有清单、模型/配置哈希和双语报告一起更新后，才能成为新的正式基线。

页面默认进入 **Priority review / 优先复核**，共 13 张：原有 7 张主观初标加 `charge-002/005/008/013/016/018`；另外 7 张仍是未人工审核的代理规则初标。绿色框是代理保护目标；紫色虚线框是默认隐藏的模型输出；蓝色区域是当前复核位置选择，由代理初标预填，确认前保持虚线。四步审核为：(1) 检查全部绿色保护目标；(2) 选择所有安全上角，或选择顺延；(3) 说明决定或保护框调整；(4) 确认并导出。答案只保存在当前浏览器 `localStorage`，支持撤销。导出的审核 JSON 不会上传或修改 `manifest.json`，必须由维护者另行校验并提交；确认本身不会自动训练模型。

主站 **Decision / 决策方式** 页面直接链接 `/regression`。S2 播放器与位置评分器统一使用 `0.30 × 0.30` 创意占位，舞台固定为 16:9。`filterUnsupportedCropSubjects` 只抑制框内没有脸部中心佐证的低置信裁剪 `人物主体`；直接检测、强裁剪、动物与无脸角色候选继续保留。背面低置信人物仍可能被移除，因此在泛化该启发式规则前必须建立专门留出集。检测采用 fail-closed：人脸与主体检测器必须都成功初始化并运行；任一不可用时整帧标记为不可用、不输出位置，并将阻断样本计为失败。

调参前历史结果为：安全位置一致率 `6/13 = 46.2%`，危险误投 `4/13 = 30.8%`，过度顺延 `3/13 = 23.1%`，精确率 `16.0%`，召回率 `36.4%`，F1 `22.2%`，P50/P95 `318/335 ms`。公开 v0.4.0 候选位于 `evaluation/s2/candidates/v0.4.0.json`，20/20 张均可用，安全位置一致率 `7/13 = 53.8%`，危险误投 `3/13 = 23.1%`，过度顺延 `3/13 = 23.1%`；TP 5 / FP 16 / FN 6，精确率 `23.8%`，召回率 `45.5%`，F1 `31.3%`，P50/P95 `277/307 ms`。目标 P/R/F1 是 IoU ≥ 0.25 的类别无关原始框探索性匹配，不是经过校准的语义准确率。它修复了 `charge-012`；剩余过度顺延是 `charge-002/008/016`，危险误投是 `charge-005/013/018`。`charge-002/005/008/013/018` 的位置初标存在争议，在标签复核前不要继续针对它们调参。这些数字只适用于当前固定集。

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
