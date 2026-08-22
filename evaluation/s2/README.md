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

`charge-012` is genuinely corrected. The remaining decision failures are `charge-002/005/008/013/016/018`; label audit found the accepted placements for `002/005/008/013/018` disputable, so those cases must be reviewed before more tuning. The UI defaults to a 13-frame priority queue: those six failures plus the original seven `needs-user-review` drafts. The other seven remain unreviewed agent-rule drafts. Green boxes are agent-drafted target references, purple dashed boxes are hidden-by-default model output, and blue placement choices are prefilled from the agent draft and remain dashed until confirmed. The four-step flow verifies targets, selects every acceptable upper corner or defer, records a note, then confirms and exports. Answers stay in browser `localStorage`; exported JSON is not uploaded, does not train the model and must be validated and committed separately by a maintainer.

The archived review now completes all 13 priority items, but it is not a 20-frame review. Five green protection drafts were accepted and eight were marked for adjustment; the export contains no replacement rectangle coordinates. `charge-005/008/009` also need placement-note adjudication. Therefore the original remains separate until those questions are resolved and a versioned reviewed manifest is produced. Green references are AI-assisted agent drafts; purple boxes are browser-local MediaPipe output. TwelveLabs does not generate either S2 box type.

The candidate aligns scorer and rendered-card footprints at 0.30×0.30 on a 16:9 S2 stage. Weak crop suppression is limited to low-confidence crop-only `人物主体` without face corroboration. Direct, strong crop, animal and faceless character candidates remain; back-facing low-confidence people still require holdout validation. The main site's Decision view links to `/regression`.

Run `pnpm test:s2-regression` for deterministic validation. Run the site and open `/regression` to execute fresh browser inference. See `docs/S2_REGRESSION_BASELINE.md` for the complete bilingual methodology, results and limitations.

---

## 中文

本目录保存阶段 1A 固定帧评估的机器可读合同，以及阶段 1B 的对比候选结果。

- `manifest.json` 定义 20 张不可变的 1280×720《CHARGE》固定帧、保护目标、可接受位置和复核状态。
- 所有保护目标与位置标签均由项目代理依据明确规则起草，20 张都不是人工标准答案。13 张规则明确初标以 `rule-confirmed` 身份进入阻断指标；7 张主观初标保持诊断状态。
- `baselines/v0.2.7.json` 保存 MediaPipe 原始预测、provenance 和可重算的固定集指标。本次运行由 v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 执行，检测配置行为参考 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711`；旧提交本身并未运行新 harness。
- `candidates/v0.4.0.json` 保存随公开 v0.4.0 发布的阶段 1B 候选结果；运行器与配置 provenance 均指向提交 `e0a033194ea04a9c926a822e4330355f41ddd152`。
- `reviews/2026-08-22-product-owner.json` 逐字节保存产品负责人已完成的 13 张优先复核导出（SHA-256 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`）。它是待接收证据，不会覆盖 manifest；详见 `reviews/README.md`。
- 不可变固定帧从 `public/evaluation/s2/frames/` 提供给浏览器回归实验室，保证浏览器使用的图片字节与 CI 校验对象一致。

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

`charge-012` 得到真实修复。剩余决策失败为 `charge-002/005/008/013/016/018`；标签审计认为 `002/005/008/013/018` 五张的可接受位置存在争议，必须先复核，不能继续盲调。UI 默认进入 13 张优先队列：上述 6 张失败加原有 7 张 `needs-user-review` 初标；另外 7 张仍是未经人工审核的代理规则初标。绿色框是代理保护目标参考，紫色虚线框是默认隐藏的模型输出，蓝色位置选择由代理初标预填，确认前保持虚线。四步流程依次检查目标、选择全部可接受上角或顺延、填写备注、确认并导出。答案保存在浏览器 `localStorage`；导出的 JSON 不会上传、不会训练模型，必须由维护者另行校验并提交。

归档复核已经完成全部 13 张优先项，但并不是 20 张全量复核。5 张绿色保护框初标被确认，8 张被标记为需要调整；导出不包含替换后的矩形坐标。`charge-005/008/009` 的结构化位置选择与备注也需要进一步裁决。因此，在这些问题解决并生成单独版本化的人工复核 manifest 前，原件继续独立保存。绿色参考框是 AI 辅助的代理初标；紫色框是浏览器本地 MediaPipe 输出。TwelveLabs 不生成这两类 S2 框。

候选已把评分器与线上卡片 footprint 统一为 `0.30 × 0.30`，S2 舞台为 16:9。弱裁剪抑制仅作用于无脸部佐证的低置信裁剪 `人物主体`；直接、强裁剪、动物与无脸角色候选继续保留。背面低置信人物仍需留出集验证。主站 Decision / 决策方式页面链接 `/regression`。

运行 `pnpm test:s2-regression` 可以进行确定性校验。启动网站并打开 `/regression` 可以执行新的浏览器推理。完整的双语方法、结果和限制请参阅 `docs/S2_REGRESSION_BASELINE.md`。
