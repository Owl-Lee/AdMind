# S2 evaluation data

[English](#english) · [中文](#中文)

## English

This directory contains the machine-readable Stage 1A fixed-frame evaluation contract and the Stage 1B comparison candidate.

- `manifest.json` defines 20 immutable 1280×720 `CHARGE` frames, protection targets, acceptable placements and review status.
- The project agent drafted every target and placement label from explicit rules. None of the 20 labels is human ground truth. Thirteen rule-clear drafts enter blocking metrics as `rule-confirmed`; seven subjective drafts remain diagnostic.
- `baselines/v0.2.7.json` preserves raw MediaPipe predictions, provenance and recomputable fixed-set metrics. The run was executed by the v0.3.0 harness commit `e3ceabe1eb401b89e9ff4307d093824b9e2b35da`; its detector configuration behavior references v0.2.7 commit `bdf66d1db7511f97feba49713f9995ea6ef13711`. The older commit did not run the new harness.
- `candidates/v0.4.0.json` preserves the Stage 1B result released with public v0.4.0. Both runner and configuration provenance point to commit `e0a033194ea04a9c926a822e4330355f41ddd152`.
- `reviews/2026-08-22-product-owner.json` preserves the product owner's completed 13-item priority-review export byte-for-byte (SHA-256 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`). It is intake evidence and does not overwrite the manifest; see `reviews/README.md`.
- The immutable frame files are served from `public/evaluation/s2/frames/` so the browser regression lab consumes the same bytes that CI verifies.
- `/regression/intake` validates a user-selected schema-v2 export locally, builds an in-memory reviewed-manifest preview and re-scores the saved v0.4.0 raw predictions without uploading or overwriting tracked files.
- `public/mediapipe/wasm/` contains the six checksum-recorded MediaPipe Tasks Vision 1.0.1 runtime assets used by `s2-vision-v5`; the fresh Playwright job writes JSON/screenshot evidence under `artifacts/s2-browser-regression/`.
- `holdout/manifest.json` and `public/evaluation/s2/holdout/*.jpg` define six sealed 1280×720 frames: four cross-source primary samples and two same-source `CHARGE` supplemental diagnostics. Every `groundTruth` is `null`, status is `sealed-unreviewed`, and `useForTuning` is `false`.

The current 13-sample blocking baseline is:

- safe-placement agreement: 6/13 (46.2%);
- unsafe placement: 4/13 (30.8%);
- over-deferral: 3/13 (23.1%);
- protected-target precision: 4/25 (16.0%);
- protected-target recall: 4/11 (36.4%);
- protected-target F1: 22.2%; and
- inference latency: 318 ms p50 / 335 ms p95.

These figures describe only this fixed regression set. They are not general model accuracy, a production SLA or a calibrated probability.

The v0.4.0 candidate completed 20/20 frames. On the same blocking set it reports:

- safe-placement agreement: 7/13 (53.8%);
- unsafe placement: 3/13 (23.1%);
- over-deferral: 3/13 (23.1%);
- protected targets: TP 5 / FP 16 / FN 6;
- protected-target precision: 23.8%, recall: 45.5%, F1: 31.3%; and
- inference latency: 277 ms p50 / 307 ms p95.

`charge-012` is genuinely corrected under the original label contract. The immutable schema-v1 first-pass artifact at `reviews/2026-08-22-product-owner.json` records 13/13 priority opinions and SHA-256 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`: five AI-assisted project-agent protection drafts were accepted and eight require exact-coordinate second review. The other seven frames remain unreviewed, so this is not a completed 20-frame human-ground-truth set. Green references are project-agent drafts; purple dashed boxes are hidden-by-default browser-local MediaPipe output. TwelveLabs generates neither S2 box type.

Public v0.4.1 adds `/regression/calibrate` for the eight adjustment cases and three placement conflicts. It supports normalized drag/resize, exact percentage entry, target add/delete/reset and undo. Proposed upper-corner cards show the scorer's composite rule-risk percentage, explicitly combining overlap and proximity rather than representing overlap alone, and warn above the 40% threshold; confirmation requires a highlighted-boundary and composite-risk acknowledgement that resets after geometry changes. Completion requires 8/8 target decisions and 3/3 placement resolutions. Answers stay in browser `localStorage`; a schema-v2 export binds the immutable v1 SHA-256 but is not uploaded, does not train the model and does not modify `manifest.json` automatically. Validation must receive the trusted source review, SHA and calibration seed, derive the eight adjustment IDs from that source, and require seed-defined `charge-005/008/009` instead of trusting export-declared IDs. A maintainer must validate the export and create a separately versioned reviewed manifest before re-scoring saved predictions.

Public v0.5.0 adds the local intake step that was previously manual. A complete schema-v2 file is accepted only after the source-bound 8/8 plus 3/3 contract passes. The resulting manifest is a preview in memory, and its before/after report re-scores the same saved v0.4.0 predictions; it is not fresh inference and does not create a new model metric. The selected JSON is not uploaded, no training is triggered and `manifest.json` remains unchanged. The other seven frames remain diagnostic and unreviewed.

The same release moves MediaPipe Tasks Vision 1.0.1 from jsDelivr to six local `/mediapipe/wasm` files and records `s2-vision-v5` provenance. The independent Playwright Chromium CI job performs fresh 20-frame inference and rejects CDN requests, critical asset failures and unavailable frames. `charge-005/008/013/016/018` are temporarily diagnostic until schema-v2 intake resolves their first-pass label/box adjustments; `charge-002` was confirmed correct and remains in the stable gate. All other stable-label samples are blocked from becoming newly unsafe. The job uploads a JSON report plus full-page screenshot. A pause-session token prevents late vision promises from delivering after user or page-state cancellation.

Release commit `3025d0ab4fdea704e77d01bfd122ec54e8853d40` is on public `main`. Actions run `32555440933` passed `quality` and `s2-browser-regression`; Sites v67 is deployed, and hosted Playwright passed 3/3 suites covering fresh 20-frame local inference, bilingual 360/430/768/1440 responsive behavior and complete schema-v2 upload/hash validation. Stage 1C browser reproducibility is complete, but the historical v0.4.0/v4 metrics below remain unchanged and no v5 model metric is published. Strict branch protection requires both checks; administrator enforcement remains disabled.

The holdout extractor produced byte-identical files in two same-host runs with the same Chromium/source bytes. Categories are sampling strata rather than product labels. The holdout is evaluation infrastructure, not a metric, human truth or tuning set; its outcomes remain sealed until the candidate is frozen, and the two same-source frames are not independent generalization evidence.

The candidate aligns scorer and rendered-card footprints at 0.30×0.30 on a 16:9 S2 stage. Weak crop suppression is limited to low-confidence crop-only `人物主体` without face corroboration. Direct, strong crop, animal and faceless character candidates remain; back-facing low-confidence people still require holdout validation. The main site's Decision view links to `/regression`.

Run `pnpm test:s2-regression` for deterministic saved-prediction validation. After installing Chromium and building, run `pnpm test:s2-browser` for the independent fresh-browser gate. Open `/regression` for visual inference, `/regression/calibrate` for exact-coordinate review and `/regression/intake` for local schema-v2 validation/preview. Neither v0.4.1 nor public v0.5.0 contains a new detector metric: the v0.4.0 figures above remain tied to the original schema-v1 agent-draft manifest. Stage 1B still requires the product owner's 8/8 coordinate decisions, 3/3 placement resolutions and later review of the other seven frames. See `docs/S2_REGRESSION_BASELINE.md` for the complete bilingual methodology, results and limitations.

---

## 中文

本目录保存阶段 1A 固定帧评估的机器可读合同，以及阶段 1B 的对比候选结果。

- `manifest.json` 定义 20 张不可变的 1280×720《CHARGE》固定帧、保护目标、可接受位置和复核状态。
- 所有保护目标与位置标签均由项目代理依据明确规则起草，20 张都不是人工标准答案。13 张规则明确初标以 `rule-confirmed` 身份进入阻断指标；7 张主观初标保持诊断状态。
- `baselines/v0.2.7.json` 保存 MediaPipe 原始预测、provenance 和可重算的固定集指标。本次运行由 v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 执行，检测配置行为参考 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711`；旧提交本身并未运行新 harness。
- `candidates/v0.4.0.json` 保存随公开 v0.4.0 发布的阶段 1B 候选结果；运行器与配置 provenance 均指向提交 `e0a033194ea04a9c926a822e4330355f41ddd152`。
- `reviews/2026-08-22-product-owner.json` 逐字节保存产品负责人已完成的 13 张优先复核导出（SHA-256 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`）。它是待接收证据，不会覆盖 manifest；详见 `reviews/README.md`。
- 不可变固定帧从 `public/evaluation/s2/frames/` 提供给浏览器回归实验室，保证浏览器使用的图片字节与 CI 校验对象一致。
- `/regression/intake` 会在本地校验用户选择的 schema v2 导出、生成内存中的复核 manifest 预览，并在不上传或覆盖受追踪文件的前提下重评分 v0.4.0 已保存原始预测。
- `public/mediapipe/wasm/` 保存 `s2-vision-v5` 使用的 6 个带校验值 MediaPipe Tasks Vision 1.0.1 runtime 文件；新鲜 Playwright 任务把 JSON/截图证据写入 `artifacts/s2-browser-regression/`。
- `holdout/manifest.json` 与 `public/evaluation/s2/holdout/*.jpg` 定义 6 张密封 1280×720 图片：4 张跨来源主要样本、2 张同源 `CHARGE` 补充诊断。全部 `groundTruth = null`、状态为 `sealed-unreviewed`、`useForTuning = false`。

当前 13 张阻断样本的基线为：

- 安全位置一致率：`6/13 = 46.2%`；
- 危险位置误投：`4/13 = 30.8%`；
- 过度顺延：`3/13 = 23.1%`；
- 保护目标精确率：`4/25 = 16.0%`；
- 保护目标召回率：`4/11 = 36.4%`；
- 保护目标 F1：`22.2%`；
- 推理耗时：P50 `318 ms` / P95 `335 ms`。

这些数字只描述当前固定回归集，不代表模型的通用准确率、生产 SLA 或经过校准的正确概率。

v0.4.0 候选 20/20 张全部完成推理。同一阻断集结果为：

- 安全位置一致率：`7/13 = 53.8%`；
- 危险位置误投：`3/13 = 23.1%`；
- 过度顺延：`3/13 = 23.1%`；
- 保护目标：TP 5 / FP 16 / FN 6；
- 保护目标精确率 `23.8%`、召回率 `45.5%`、F1 `31.3%`；
- 推理耗时：P50 `277 ms` / P95 `307 ms`。

`charge-012` 在原始标签合同下得到真实修复。`reviews/2026-08-22-product-owner.json` 中的不可变 schema v1 第一轮原件记录了 13/13 张优先样本意见，SHA-256 为 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`：5 张 AI 辅助的项目代理保护框初标被接受，8 张需要精确坐标二审；另外 7 张仍未产品审核，因此这不是 20 张全量人工真值集。绿色参考框是项目代理初标，紫色虚线框是默认隐藏的浏览器本地 MediaPipe 输出；TwelveLabs 不生成这两类 S2 框。

公开 v0.4.1 新增 `/regression/calibrate`，用于 8 张待调整样本和 3 处位置冲突。页面支持归一化拖动/缩放、精确百分比输入、目标新增/删除/重置和撤销。待确认上角广告位会显示评分器的规则综合风险百分比，明确同时考虑重叠与邻近度而非纯重叠比例，超过 40% 阈值时警告；确认前必须勾选已检查重点边界与规则综合风险，几何变化后勾选自动失效。只有完成 8/8 张目标决定和 3/3 处位置裁决，结果才完整。答案只保存在浏览器 `localStorage`；schema v2 导出绑定不可变 v1 SHA-256，但不会上传、不会训练模型，也不会自动修改 `manifest.json`。校验必须取得可信源复核、SHA 和 calibration seed，从源复核推导 8 张调整 ID，并严格要求 seed 定义的 `charge-005/008/009`，不能信任导出自报 ID。维护者必须校验导出并建立单独版本化的复核 manifest，之后才能用已保存预测重新评分。

公开 v0.5.0 新增此前需要手工完成的本地接收步骤。完整 schema v2 只有通过绑定来源的 8/8 + 3/3 合同后才会被接受；得到的 manifest 只是内存预览，前后报告重评分同一份 v0.4.0 已保存预测，不是新鲜推理，也不产生新模型指标。所选 JSON 不会上传，不触发训练，`manifest.json` 保持不变。另外 7 张继续保持诊断和未产品审核状态。

同一发布版本把 MediaPipe Tasks Vision 1.0.1 从 jsDelivr 迁移到 6 个本地 `/mediapipe/wasm` 文件，并记录 `s2-vision-v5` 来源。独立 Playwright Chromium CI 执行 20 张新鲜推理，拒绝 CDN 请求、关键资源失败和不可用帧。`charge-005/008/013/016/018` 在 schema v2 解决第一轮标签/保护框调整前暂作诊断；`charge-002` 已确认正确并继续进入稳定门，其余稳定标签样本同样不得新增危险误投。任务上传 JSON 报告和整页截图。pause session token 会阻止迟到视觉 Promise 在用户或页面状态取消后继续投放。

发布提交 `3025d0ab4fdea704e77d01bfd122ec54e8853d40` 已进入公开 `main`。Actions 运行 `32555440933` 的 `quality` 与 `s2-browser-regression` 双绿；Sites v67 已部署，线上 Playwright 3/3 通过，覆盖 20 张本地新鲜推理、360/430/768/1440 双语响应式与完整 schema v2 上传/哈希校验。阶段 1C 浏览器可复现性工程已完成，但下方历史 v0.4.0/v4 指标保持不变，没有发布 v5 模型指标。分支保护以 strict 模式要求两项检查；管理员强制执行仍关闭。

holdout 抽帧脚本在同一主机、相同 Chromium/源字节下两次生成逐字节一致文件。类别只是抽样分层，不是产品标签。该留出集是评估基础设施，不是指标、人工真值或调参集；候选冻结前结果继续密封，2 张同源帧也不是独立泛化证据。

候选已把评分器与线上卡片 footprint 统一为 `0.30 × 0.30`，S2 舞台为 16:9。弱裁剪抑制仅作用于无脸部佐证的低置信裁剪 `人物主体`；直接、强裁剪、动物与无脸角色候选继续保留。背面低置信人物仍需留出集验证。主站 Decision / 决策方式页面链接 `/regression`。

运行 `pnpm test:s2-regression` 可以确定性校验已保存预测；安装 Chromium 并完成构建后，运行 `pnpm test:s2-browser` 可执行独立新鲜浏览器门。打开 `/regression` 查看视觉推理，打开 `/regression/calibrate` 做精确坐标复核，打开 `/regression/intake` 做本地 schema v2 校验/预览。v0.4.1 与公开 v0.5.0 都没有新增检测器指标，上述 v0.4.0 数字仍绑定原始 schema v1 代理初标 manifest。阶段 1B 仍需产品负责人完成 8/8 张坐标决定、3/3 处位置裁决，并在后续复核另外 7 张。完整双语方法、结果和限制请参阅 `docs/S2_REGRESSION_BASELINE.md`。
