# S2 evaluation data

[English](#english) · [中文](#中文)

## English

This directory contains the machine-readable Stage 1A fixed-frame evaluation contract.

- `manifest.json` defines 20 immutable 1280×720 `CHARGE` frames, protection targets, acceptable placements and review status.
- The project agent drafted every label from explicit placement rules. Thirteen rule-clear drafts are locked as `rule-confirmed` and enter blocking metrics; seven subjective drafts remain `needs-user-review` and stay diagnostic until the product owner reviews them.
- `baselines/v0.2.7.json` preserves raw MediaPipe predictions, provenance and recomputable fixed-set metrics. The run was executed by the v0.3.0 harness commit `e3ceabe1eb401b89e9ff4307d093824b9e2b35da`; its detector configuration behavior references v0.2.7 commit `bdf66d1db7511f97feba49713f9995ea6ef13711`. The older commit did not run the new harness.
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

Run `pnpm test:s2-regression` for deterministic validation. Run the site and open `/regression` to execute fresh browser inference. See `docs/S2_REGRESSION_BASELINE.md` for the complete bilingual methodology, results and limitations.

---

## 中文

本目录保存阶段 1A 固定帧评估的机器可读合同。

- `manifest.json` 定义 20 张不可变的 1280×720《CHARGE》固定帧、保护目标、可接受位置和复核状态。
- 所有标准答案均由项目代理依据明确位置规则起草。13 张规则明确初标锁定为 `rule-confirmed` 并进入阻断指标；7 张主观初标保持 `needs-user-review`，在产品负责人复核前只用于诊断。
- `baselines/v0.2.7.json` 保存 MediaPipe 原始预测、provenance 和可重算的固定集指标。本次运行由 v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 执行，检测配置行为参考 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711`；旧提交本身并未运行新 harness。
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

运行 `pnpm test:s2-regression` 可以进行确定性校验。启动网站并打开 `/regression` 可以执行新的浏览器推理。完整的双语方法、结果和限制请参阅 `docs/S2_REGRESSION_BASELINE.md`。
