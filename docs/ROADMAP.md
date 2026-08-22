# Roadmap

[English](#roadmap) · [中文](#中文路线图)

AdMind is moving from a stable public portfolio prototype toward a calibrated, evidence-backed product demonstration. Roadmap items are ordered by product risk rather than visual novelty.

## Phase 0 · Stable demonstration — complete

- S1, S2 and S3 run in one continuous product experience.
- Cached semantic evidence is connected to the decision layer.
- Pause, resume, seeking, focus and visibility state are represented.
- S2 can score candidate ad positions and clean up stale UI state.
- Ethical hard rules can block commercially valuable plans.
- The project has a repeatable build, tests, CI, public source repository and hosted deployment.

## Phase 1 · Calibrate S2 — in progress

- **1A complete:** 20 immutable 1280×720 `CHARGE` frames, checksum-backed labels, a bilingual browser runner and the raw pre-tuning baseline are tracked. All 20 labels are agent-authored drafts, not human ground truth: 13 rule-clear samples enter blocking metrics as `rule-confirmed`, while seven subjective frames remain diagnostic.
- **1A measured:** the v0.3.0 harness at `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` captured detector behavior configured from the v0.2.7 reference at `bdf66d1db7511f97feba49713f9995ea6ef13711`; the older commit did not run the new harness. Across the 13 rule-confirmed frames, safe-placement agreement is 6/13 (46.2%), unsafe placement is 4/13 (30.8%) and over-deferral is 3/13 (23.1%). Protected-target precision is 4/25 (16.0%), recall is 4/11 (36.4%), F1 is 22.2%, and latency is 318 ms p50 / 335 ms p95. These are fixed-set results, not general accuracy.
- **1B candidate measured and released:** the final `s2-vision-v4` browser run at runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152` generated the public v0.4.0 candidate at `2026-08-22T03:42:41.155Z`. On the same fixed set, all 20/20 frames were available; safe-placement agreement is 7/13 (53.8%), unsafe placement is 3/13 (23.1%), over-deferral is 3/13 (23.1%), and raw target matching is TP 5 / FP 16 / FN 6 with 23.8% precision, 45.5% recall and 31.3% F1. Those target figures are exploratory, class-agnostic raw-box matches at IoU ≥ 0.25 rather than calibrated semantic accuracy. Latency is 277 ms p50 / 307 ms p95. `charge-012` is genuinely fixed.
- **1B first pass archived:** the immutable schema-v1 export records 13/13 priority opinions. Five project-agent protection drafts were accepted; eight require exact replacement coordinates. The other seven frames are still unreviewed agent drafts, so this is not a completed 20-frame human-ground-truth set.
- **v0.4.1 calibration tool released:** `/regression/calibrate` focuses on the eight adjustment cases and three placement conflicts. It supports drag, resize, exact percentage entry, target add/delete/reset and local undo. Completion requires 8/8 coordinate decisions and 3/3 placement resolutions. Work stays in browser `localStorage`; the schema-v2 export binds the immutable v1 SHA-256 and neither uploads data, trains the detector nor updates the manifest automatically.
- **1B metric gate:** v0.4.1 is an annotation-calibration release, not a new detector candidate. The v0.4.0 metrics remain tied to the original schema-v1 agent-draft manifest. A maintainer must validate the v2 evidence, create a separately versioned reviewed manifest and then re-score saved predictions before publishing any reviewed-label comparison. The remaining seven frames still require a later product-review pass.
- **1B implementation boundary:** scorer and rendered-card footprints are aligned at 0.30×0.30 on a 16:9 S2 stage. Weak crop suppression is deliberately limited to low-confidence crop-only `人物主体` without face corroboration; animals, characters, direct detections and strong crop detections remain. A back-facing low-confidence person still needs holdout coverage. The vision gate is fail-closed: face and object detectors are both required, and either one being unavailable yields no placement and a blocking miss. The main Decision view links to `/regression`.
- **v0.5.0 engineering candidate:** `/regression/intake` now validates a complete schema-v2 export locally, creates an in-memory reviewed-manifest preview and re-scores the saved v0.4.0 raw predictions. It does not upload, train, commit or overwrite the tracked manifest, and the comparison is label-only rather than fresh inference. The page cannot finish Stage 1B by itself: the product owner still owes 8/8 coordinate decisions, 3/3 placement resolutions and a later review of the other seven frames.
- **1C partially implemented:** all six MediaPipe Tasks Vision 1.0.1 runtime files are self-hosted under `/mediapipe/wasm` with checksums and `s2-vision-v5` provenance. A separate Playwright Chromium job builds the exact revision, runs all 20 fixed frames, blocks jsDelivr and critical-asset failures, requires 20/20 availability and uploads JSON plus a screenshot. `charge-005/008/013/016/018` are temporarily diagnostic until schema-v2 intake resolves their first-pass label/box adjustments; `charge-002` was confirmed correct and stays in the stable gate. Outside that exception set, stable labels may not become newly unsafe. A pause-session token prevents a late vision promise from delivering after resume, seek, focus/visibility loss or reset.
- **Sealed holdout infrastructure added:** six immutable 1280×720 frames are split into four cross-source primary samples and two same-source `CHARGE` supplemental diagnostics. Every entry remains `sealed-unreviewed`, `useForTuning = false` and `groundTruth = null`. Same-host Chromium extraction was byte-identical in two runs. The set is infrastructure, not a metric, label set or tuning input; the two supplemental frames are not independent generalization evidence.
- **1C completion gate:** do not mark 1C complete or publish a v5 model result until the first v5 CI run and a fresh hosted-site run verify local runtime loading, 20/20 availability and the temporary safety gate. The v0.4.0/v4 numbers remain historical. Holdout outcomes must stay sealed until the candidate is frozen and a separate product-review artifact exists.

Exit criterion: a source-bound reviewed manifest exists, fresh browser inference is reproducible without a CDN, and the checked-in safety gate passes. Repeatable agent-draft samples alone are not enough to declare calibration complete.

## Phase 2 · Evidence credibility

- Verify S1 and S3 segment transitions through continuous playback.
- Document the source, model, run date and limitations of each cached analysis.
- Keep model evidence separate from deterministic policy decisions in the UI and API.
- Add browser-level regression for media switching, seeking and scenario transitions.

## Phase 3 · Product completeness — bilingual and responsive foundation complete

- A shared Chinese/English localization layer now switches visible copy, dynamic labels, document language and caption tracks.
- English is the public default; Chinese remains a complete mode rather than a shortened summary.
- Desktop, tablet, narrow-window and phone layouts are covered without scroll snapping or clipped player controls.
- Interactive controls have accessible names; reduced-motion behavior is preserved.
- Move heavier paused-frame inference into a worker when profiling justifies it.
- Upgrade deferred delivery from session UI state to a durable task object.

## Phase 4 · Public portfolio release — complete

- Confirm the project-owned game-ad artwork for public portfolio use.
- Publish a clip-by-clip asset manifest with source URLs, authors, licenses, modifications and checksums.
- Publish the source repository with an explicit all-rights-reserved position; no open-source license is implied.
- Add release notes, a version tag and a GitHub Release.
- Run a final secret, dependency and repository-size audit.

Still open after the portfolio release:

- Validate a clean clone on macOS and Linux in addition to CI.
- Complete a dedicated screen-reader and contrast audit beyond the current keyboard/name checks.

## Future production research

- Persistent decision and audit storage.
- Campaign administration and approved-creative workflows.
- Cross-page and cross-device delivery orchestration.
- Larger licensed evaluation sets and calibrated business metrics.
- A/B experimentation for interruption, completion and advertiser outcomes.

These items are research directions, not claims about the current implementation.

---

## 中文路线图

AdMind 正从稳定的公开作品集原型，继续走向经过校准、以证据为基础的产品演示。路线图按产品风险排序，而不是按视觉新鲜感排序。

### 阶段 0 · 稳定演示 — 已完成

- S1、S2、S3 已组成一条连续的产品体验。
- 缓存的语义分析证据已经接入决策层。
- 暂停、恢复、拖动、焦点和页面可见性均进入播放器状态。
- S2 可以评估候选广告位置，并清理过期界面状态。
- 伦理硬规则能够阻止商业价值较高但不合规的方案。
- 项目具备可重复构建、测试、CI、公开源码仓库与线上部署。

### 阶段 1 · 校准 S2 — 进行中

- **1A 已完成：** 已保存 20 张不可变的 1280×720《CHARGE》固定帧、带校验和的规则初标、双语浏览器运行器和调参前原始基线。20 张标签全部由代理起草，不是人工标准答案：13 张规则明确样本以 `rule-confirmed` 身份进入阻断指标，7 张主观样本保持诊断状态。
- **1A 已测量：** v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 运行了本次基线，检测配置行为参考 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711`；旧提交本身并未运行新 harness。13 张 `rule-confirmed` 样本中的安全位置一致率为 `6/13 = 46.2%`，危险位置误投为 `4/13 = 30.8%`，过度顺延为 `3/13 = 23.1%`；保护目标精确率为 `4/25 = 16.0%`，召回率为 `4/11 = 36.4%`，F1 为 `22.2%`，推理耗时为 P50 `318 ms` / P95 `335 ms`。这些属于固定回归集结果，不是通用准确率。
- **1B 候选结果已测量并发布：** 最终 `s2-vision-v4` 浏览器复跑由运行器/配置提交 `e0a033194ea04a9c926a822e4330355f41ddd152` 于 `2026-08-22T03:42:41.155Z` 生成公开 v0.4.0 候选。同一固定集 20/20 张均可用；安全位置一致率 `7/13 = 53.8%`，危险误投 `3/13 = 23.1%`，过度顺延 `3/13 = 23.1%`；原始目标匹配 TP 5 / FP 16 / FN 6，精确率 `23.8%`、召回率 `45.5%`、F1 `31.3%`。这些目标数字是 IoU ≥ 0.25 的类别无关原始框探索性匹配，不是经过校准的语义准确率；P50/P95 为 `277/307 ms`。`charge-012` 得到真实修复。
- **1B 第一轮复核已归档：** 不可变 schema v1 导出记录了 13/13 张优先样本意见。5 张项目代理保护框初标被接受，8 张需要精确替换坐标；另外 7 张仍是未产品审核的代理初标，因此不能称为 20 张全量人工真值集。
- **v0.4.1 校框工具已发布：** `/regression/calibrate` 聚焦 8 张待调整样本与 3 处位置冲突，支持拖动、缩放、精确百分比输入、目标新增/删除/重置和本地撤销。只有完成 8/8 张坐标确认与 3/3 处位置裁决才可导出完整结果。工作内容保存在浏览器 `localStorage`；schema v2 导出绑定不可变 v1 SHA-256，不会上传、不会训练检测器，也不会自动修改 manifest。
- **1B 指标门：** v0.4.1 是标注校准版本，不是新的检测器候选。v0.4.0 指标仍绑定原始 schema v1 代理初标 manifest。维护者必须先校验 v2 证据、建立单独版本化的复核 manifest，再用已保存预测重新评分，之后才能发布基于复核标签的对比数字。另外 7 张仍需要后续产品复核。
- **1B 实现边界：** 评分器与线上卡片 footprint 已统一为 `0.30 × 0.30`，S2 舞台为 16:9。弱裁剪抑制仅针对无脸部佐证的低置信裁剪 `人物主体`；动物、角色、直接检测和强裁剪候选继续保留。背面低置信人物仍需留出集覆盖。视觉链路采用 fail-closed：人脸与主体检测器必须同时可用，任一不可用都会返回无位置并在阻断指标中计为失败。主站 Decision / 决策方式页面直接链接 `/regression`。
- **v0.5.0 工程候选：** `/regression/intake` 已能在本地校验完整 schema v2 导出、生成内存中的复核 manifest 预览，并使用 v0.4.0 已保存原始预测做重评分。页面不会上传、训练、提交或覆盖受追踪 manifest；前后对比只是标签重评分，不是新推理。该页面不能自行完成阶段 1B：产品负责人仍需完成 8/8 张坐标决定、3/3 处位置裁决，并在后续复核另外 7 张。
- **1C 已部分实现：** MediaPipe Tasks Vision 1.0.1 的 6 个 runtime 文件已带校验值固定到 `/mediapipe/wasm`，运行来源标记为 `s2-vision-v5`。独立 Playwright Chromium 任务会按准确提交构建、运行 20 张固定帧、阻止 jsDelivr 与关键资源失败、要求 20/20 可用，并上传 JSON 和截图。`charge-005/008/013/016/018` 在 schema v2 接收解决第一轮标签/保护框调整前暂作诊断例外；`charge-002` 已确认正确，继续进入稳定门。除此之外，稳定标签不得新增危险误投。pause session token 会阻止迟到的视觉 Promise 在恢复、拖动、失焦/隐藏或重置后继续投放。
- **密封留出集基础设施已建立：** 6 张不可变 1280×720 图片分为 4 张跨来源主要样本与 2 张同源 `CHARGE` 补充诊断。全部保持 `sealed-unreviewed`、`useForTuning = false`、`groundTruth = null`；同一主机 Chromium 两次抽帧字节一致。这是基础设施，不是指标、标签集或调参输入；2 张补充帧不能包装成独立泛化证据。
- **1C 完成门：** 首次 v5 CI 与线上新鲜运行验证本地 runtime、20/20 可用性和临时安全门之前，不得把 1C 标为完成，也不得发布 v5 模型结果。v0.4.0/v4 数字继续保留为历史证据。候选冻结并形成单独产品复核文件前，不得查看或使用 holdout 结果。

退出标准：建立绑定来源的复核 manifest；新鲜浏览器推理在无 CDN 情况下可复现；仓库内安全门通过。仅有可重复的代理初标样本不足以宣布校准完成。

### 阶段 2 · 证据可信度

- 使用连续播放验证 S1 与 S3 的片段切换。
- 记录每份缓存分析的来源、模型、运行日期和限制。
- 在界面和 API 中持续区分模型证据与确定性政策决定。
- 为素材切换、拖动和场景跳转增加浏览器级自动回归。

### 阶段 3 · 产品完整度 — 双语与响应式基础已完成

- 共享的中英文国际化层会同步切换可见文案、动态辅助标签、HTML 文档语言和字幕轨道。
- 公开页面默认英文，中文是完整模式，不是缩略摘要。
- 桌面、平板、窄窗口和手机布局已经覆盖，不使用滚动吸附，也不会切掉播放器控件。
- 交互控件具有无障碍名称，并保留减少动画设置。
- 后续只在性能分析证明有必要时，才把较重的暂停画面推理移入 Worker。
- 后续把当前会话内的顺延状态升级为可持久化任务对象。

### 阶段 4 · 公开作品集发布 — 已完成

- 已确认项目自有游戏广告图可用于公开作品集。
- 已发布逐素材清单，记录来源、作者、授权、修改和校验值。
- 已明确采用保留所有权利的源码公开方式；公开仓库不自动代表开源授权。
- 已发布版本标签、GitHub Release 与发布说明。
- 已运行密钥、依赖与仓库体积检查。

公开发布后仍需继续：

- 除 CI 外，再分别在 macOS 和 Linux 上验证干净克隆。
- 在现有键盘操作与辅助名称检查基础上，完成专门的屏幕阅读器和对比度审计。

### 未来生产研究

- 持久化决策与审计记录。
- 广告活动管理和已审批素材流程。
- 跨页面、跨设备的广告交付编排。
- 更大的授权评估集和经过校准的商业指标。
- 用于评估打断程度、完成率和广告主效果的 A/B 实验。

以上属于研究方向，不代表当前实现已经具备这些生产能力。
