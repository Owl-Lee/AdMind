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
- **1B review gate:** remaining over-deferrals are `charge-002/008/016`, and remaining unsafe placements are `charge-005/013/018`. Label audit found `002/005/008/013/018` disputable, so tuning is paused until those accepted-placement drafts are resolved; `charge-016` remains the clear over-deferral case. The default priority-review queue now contains 13 frames: those six plus the original seven subjective drafts. The other seven are still unreviewed agent-rule drafts. Review stays local, follows four explicit confirmation steps and requires maintainer validation/commit after JSON export; it neither edits the manifest nor trains the model automatically.
- **1B implementation boundary:** scorer and rendered-card footprints are aligned at 0.30×0.30 on a 16:9 S2 stage. Weak crop suppression is deliberately limited to low-confidence crop-only `人物主体` without face corroboration; animals, characters, direct detections and strong crop detections remain. A back-facing low-confidence person still needs holdout coverage. The vision gate is fail-closed: face and object detectors are both required, and either one being unavailable yields no placement and a blocking miss. The main Decision view links to `/regression`.
- **1C:** vendor the MediaPipe WASM runtime, add a dedicated browser benchmark job and convert the agreed behavior into a stable regression gate.

Exit criterion: S2 results are reported from repeatable samples rather than visual intuition.

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
- **1B 复核门：** 剩余过度顺延是 `charge-002/008/016`，剩余危险误投是 `charge-005/013/018`。标签审计认为 `002/005/008/013/018` 五张存在争议，因此必须先确定可接受位置初标，不能继续盲调；`charge-016` 仍是明确过度顺延。默认优先复核队列现为 13 张：上述 6 张加原有 7 张主观初标；另外 7 张仍是未人工审核的代理规则初标。复核只在本地完成，按四步确认，导出后必须由维护者校验并提交；不会修改 manifest，也不会自动训练模型。
- **1B 实现边界：** 评分器与线上卡片 footprint 已统一为 `0.30 × 0.30`，S2 舞台为 16:9。弱裁剪抑制仅针对无脸部佐证的低置信裁剪 `人物主体`；动物、角色、直接检测和强裁剪候选继续保留。背面低置信人物仍需留出集覆盖。视觉链路采用 fail-closed：人脸与主体检测器必须同时可用，任一不可用都会返回无位置并在阻断指标中计为失败。主站 Decision / 决策方式页面直接链接 `/regression`。
- **1C：** 把 MediaPipe WASM 固定到本地，增加独立浏览器基准任务，并把最终认可行为固化为稳定回归门。

退出标准：S2 的结果来自可重复样本，而不是对单张截图的主观感觉。

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
