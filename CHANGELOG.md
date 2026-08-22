# Changelog

[English](#changelog) · [中文（最新版本）](#050-中文说明)

Notable project changes are recorded here.

## Unreleased

No unreleased changes are documented yet.

## 0.5.0 · 2026-08-22

v0.5.0 is the public S2 evidence-intake and browser-reproducibility release. It does not introduce a new reviewed-label metric or replace the historical v0.4.0 `s2-vision-v4` candidate.

### Local review intake and reproducible browser inference

- Added the bilingual `/regression/intake` page. It accepts a user-selected schema-v2 calibration JSON, records that exact file's SHA-256, validates the immutable schema-v1 SHA-256, trusted calibration seed, eight coordinate decisions and three placement resolutions locally, and builds an in-memory reviewed-manifest preview only after the complete contract passes.
- The intake page can re-score the saved v0.4.0 raw predictions against that preview and download separate preview/rescore JSON files. This is a **label-only re-score**, not a fresh detector run. The selected file is not uploaded; the page does not train a model, commit a file or overwrite `evaluation/s2/manifest.json`.
- Vendored all six MediaPipe Tasks Vision 1.0.1 WASM/loader assets under `/mediapipe/wasm` with tracked SHA-256 values and advanced the runtime provenance to `s2-vision-v5`. The existing v0.4.0/v4 metrics remain historical and unchanged.
- Added a separate Playwright Chromium CI job for fresh 20-frame inference. It builds the exact revision, rejects jsDelivr requests and critical local-asset failures, and requires 20/20 model availability. `charge-005/008/013/016/018` remain diagnostic until schema-v2 intake resolves their first-pass label/box adjustments; `charge-002` was confirmed correct and stays in the stable gate. Outside that temporary exception set, a newly unsafe stable-label sample fails the job. The job uploads the JSON report and full-page screenshot; traces are retained on failure.
- Added a sealed six-frame 1280×720 holdout with four cross-source primary samples and two same-source `CHARGE` supplemental diagnostics. Every item is `sealed-unreviewed`, `useForTuning = false` and `groundTruth = null`; categories are sampling strata, not labels. The same-host Chromium extractor reproduced identical bytes in two runs and `--verify-only` checks source/frame hashes, dimensions, split counts and no-label/no-tuning invariants. This is evaluation infrastructure, not a model metric or human truth.
- Added a pause-session token guard. Resume, seeking, visibility/focus loss, reset, ad completion and component cleanup invalidate the active token so a late MediaPipe promise cannot display a stale box or ad.
- Added a bounded TwelveLabs asset lifecycle to the offline analyzer. Success, processing failure, processing timeout and analysis failure all request deletion in `finally`; a failed deletion emits an actionable warning without replacing the primary result. Regression tests cover all five lifecycle paths. Maintainers should still audit provider assets created by earlier CLI versions.
- Stage 1B is still open: the product owner must complete all 8/8 replacement-coordinate decisions and 3/3 placement resolutions, then later review the other seven frames. Until a complete schema-v2 artifact is validated and a separately versioned reviewed manifest exists, none of the 20 frames may be described as complete human ground truth and no reviewed-label metric may be published.
- Released commit `3025d0ab4fdea704e77d01bfd122ec54e8853d40` to public `main`. GitHub Actions run `32555440933` passed both `quality` and `s2-browser-regression`; Sites v67 is live at `https://admind-decision-console.liyanbao06.chatgpt.site`.
- Post-deployment Playwright passed 3/3 suites: fresh 20-frame local MediaPipe inference, complete bilingual responsive coverage at 360/430/768/1440 CSS pixels, and the full browser-local schema-v2 file-intake/hash-validation path. Stage 1C browser reproducibility is therefore complete, without creating or publishing a new v5 model metric.
- Branch protection now strictly requires `quality` and `s2-browser-regression` before merge. Administrator enforcement remains disabled and is documented as a repository-governance limitation.
- The v0.5.0 annotated tag and GitHub Release are intentionally deferred until the project owner decides how to handle historical media-redistribution records and the personal email present in old commit metadata. Public `main` and Sites v67 are deployed facts, not a claim that repository history is rights-clean.

### 0.5.0 中文说明

- v0.5.0 是已经公开的 S2 证据接收与浏览器可复现性工程版本，不新增基于复核标签的模型指标，也不替换历史 v0.4.0 `s2-vision-v4` 候选。
- 新增双语 `/regression/intake` 页面。用户选择 schema v2 校准 JSON 后，页面会记录该原件的准确 SHA-256，并只在本地严格校验不可变 schema v1 SHA-256、可信 calibration seed、8 张坐标决定与 3 处位置裁决；完整合同通过后才在内存中生成复核 manifest 预览。
- 接收页可以使用同一份 v0.4.0 已保存原始预测对预览标签做重评分，并分别下载预览 JSON 和重评分 JSON。这只是**标签变化后的重评分**，不是新的检测器运行。所选文件不会上传；页面不会训练模型、提交文件或覆盖 `evaluation/s2/manifest.json`。
- 将 MediaPipe Tasks Vision 1.0.1 的 6 个 WASM/加载器文件固定到 `/mediapipe/wasm`，记录 SHA-256，并把运行时来源版本推进到 `s2-vision-v5`。现有 v0.4.0/v4 指标继续作为历史数字保留，不发生变化。
- 新增独立 Playwright Chromium CI 新鲜推理任务：按准确提交构建，运行 20 张固定帧，禁止 jsDelivr 请求和关键本地资源失败，并要求 20/20 模型可用。`charge-005/008/013/016/018` 在 schema v2 接收解决第一轮标签/保护框调整前暂作诊断例外；`charge-002` 已确认正确，继续进入稳定门。除这 5 张外，稳定标签出现新的危险误投就会使任务失败。任务上传 JSON 报告和整页截图；失败时保留 trace。
- 新增 6 张 1280×720 密封留出集：4 张跨来源主要样本，2 张同源 `CHARGE` 补充诊断。全部保持 `sealed-unreviewed`、`useForTuning = false`、`groundTruth = null`；类别只是抽样分层，不是标签。同一主机 Chromium 抽帧两次得到逐字节一致结果，`--verify-only` 会检查源/帧哈希、尺寸、分组数量和“无标签、不可调参”约束。这是评估基础设施，不是模型指标或人工真值。
- 新增暂停会话 token 防护。恢复、拖动、页面隐藏/失焦、重置、广告完成和组件清理都会使当前 token 失效，迟到的 MediaPipe Promise 不能再展示旧框或误投广告。
- 为离线分析器补上有界的 TwelveLabs 临时素材生命周期。成功、处理失败、处理超时与分析异常都会在 `finally` 中请求删除；删除失败会给出可执行告警但不会覆盖主要结果，五条路径均由回归测试覆盖。维护者仍需盘点旧版 CLI 曾经创建的历史 provider 资产。
- 阶段 1B 仍未完成：产品负责人还需完成 8/8 张替换坐标决定与 3/3 处位置裁决，之后另行复核另外 7 张。在完整 schema v2 经校验并建立单独版本化的复核 manifest 前，不能把 20 张称为完整人工真值，也不能发布基于复核标签的新指标。
- 发布提交 `3025d0ab4fdea704e77d01bfd122ec54e8853d40` 已进入公开 `main`。GitHub Actions 运行 `32555440933` 的 `quality` 与 `s2-browser-regression` 双绿；Sites v67 已上线到 `https://admind-decision-console.liyanbao06.chatgpt.site`。
- 部署后 Playwright 3/3 通过：20 张本地 MediaPipe 新鲜推理、360/430/768/1440 CSS 像素完整双语响应式，以及完整的浏览器本地 schema v2 文件接收/哈希校验流程。阶段 1C 浏览器可复现性工程因此完成，但没有产生或发布新的 v5 模型指标。
- 分支保护现在以 strict 模式要求 `quality` 与 `s2-browser-regression` 两项检查后才能合并；管理员强制执行仍关闭，并作为仓库治理限制明确记录。
- v0.5.0 annotated tag 与 GitHub Release 暂缓创建，等待项目负责人决定历史素材再分发记录和旧提交个人邮箱的治理方式。公开 `main` 与 Sites v67 已部署只是代码/站点事实，不代表仓库历史已经完成权利清理。

## 0.4.1 · 2026-08-22

Public v0.4.1 was released as the S2 protection-calibration tool release.

### Product review evidence and exact-coordinate calibration

- Archived the product owner's byte-identical 13-item first-pass export at `evaluation/s2/reviews/2026-08-22-product-owner.json` (SHA-256 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`). It records 13/13 priority opinions: five project-agent protection drafts were accepted and eight were routed to second review. The other seven frames remain unreviewed, so this is not a completed 20-frame human-ground-truth set.
- Added the bilingual `/regression/calibrate` lab for the eight adjustment cases. Reviewers can move and resize normalized rectangles, enter exact percentages, add or delete person/face/character targets, reset a suggestion, and resolve the three placement conflicts before exporting.
- Displayed the current scorer's composite rule-risk percentage for each proposed upper-corner ad area. The score combines overlap and proximity rather than representing overlap alone, and the page warns above the 40% rule threshold. A replacement cannot be confirmed until the reviewer checks the highlighted boundary and composite geometry risk; changing the target geometry invalidates that acknowledgement.
- Kept the schema-v1 evidence immutable. A schema-v2 export references the exact v1 SHA-256 and stays in browser `localStorage` until downloaded. It is not uploaded, does not train the detector and does not update `evaluation/s2/manifest.json` automatically; a maintainer must validate and deliberately commit a separate reviewed manifest.
- Clarified provenance in both labs: green boxes are AI-assisted project-agent drafts, purple dashed boxes are browser-local MediaPipe predictions, and TwelveLabs produces neither S2 box type. A green box becomes reviewed evidence only after explicit confirmation.
- Added validation and regression coverage for dataset identity, source/frame hashes, draft signatures, v1 linkage, normalized replacement rectangles, queue completeness and stale-artifact rejection.
- Required schema-v2 validation to receive the trusted calibration seed. The validator derives the eight adjustment IDs from the immutable source review and locks placement resolution to `charge-005/008/009`; it rejects exports that omit, add or self-report different IDs.
- This release contains no new detector run or model metric. The v0.4.0 fixed-set numbers remain bound to the original schema-v1 agent-draft manifest; metrics may be recomputed only after a versioned reviewed manifest exists.

### 0.4.1 中文说明

- 公开 v0.4.1 是 S2 保护框精确校准工具版本。
- 将产品负责人完成的 13 张第一轮优先复核原件逐字节归档到 `evaluation/s2/reviews/2026-08-22-product-owner.json`（SHA-256 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`）。原件记录 13/13 张优先样本意见：5 张项目代理保护框初标被接受，8 张进入二审；另外 7 张仍未产品审核，因此这不是 20 张全量人工真值集。
- 新增双语 `/regression/calibrate` 精确坐标校框页，覆盖 8 张待调整样本。复核者可以移动和缩放归一化矩形、输入精确百分比、新增或删除人物/人脸/角色目标、重置建议，并在导出前解决 3 处位置冲突。
- 页面显示每个待确认上角广告位在当前评分器下的规则综合风险百分比；该分数同时考虑重叠与邻近度，不是纯重叠比例，超过 40% 规则阈值时明确警告。确认保护框前必须勾选“已检查重点边界与规则综合风险”；只要框坐标再次变化，这次勾选就会失效。
- schema v1 证据保持不可变。schema v2 导出会引用准确的 v1 SHA-256，并在下载前只存于浏览器 `localStorage`；它不会上传、不会训练检测器，也不会自动更新 `evaluation/s2/manifest.json`。维护者必须另行校验，并有意提交独立版本的复核 manifest。
- 两个实验室都明确框的来源：绿色框是 AI 辅助的项目代理初标，紫色虚线框是浏览器本地 MediaPipe 预测；TwelveLabs 不生成这两类 S2 框。绿色框只有经过明确确认后才成为复核证据。
- 新增校验与回归覆盖：数据集身份、源素材/帧哈希、初标签名、v1 绑定、归一化替换矩形、队列完整性和旧文件拒绝。
- schema v2 校验必须同时取得可信 calibration seed。验证器从不可变源复核推导 8 张调整 ID，并把位置裁决严格锁定为 `charge-005/008/009`；导出不能靠自报 ID 绕过、删减或扩张队列。
- 本版本没有新的检测器运行或模型指标。v0.4.0 固定集数字继续绑定原始 schema v1 代理初标 manifest；只有建立版本化复核 manifest 后才可以重算指标。

## 0.4.0 · 2026-08-21

Released to the public site.

### Stage 1B fixed-set candidate

- Added `evaluation/s2/candidates/v0.4.0.json`, generated at `2026-08-22T03:42:41.155Z` by the final `s2-vision-v4` browser run at runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152`, as a reproducible comparison against the historical v0.2.7-configuration baseline. All 20/20 fixed frames were available. The result and review lab ship on the public v0.4.0 site.
- On the same 13 rule-confirmed drafts, safe-placement agreement changed from 6/13 (46.2%) to 7/13 (53.8%), unsafe placement from 4/13 (30.8%) to 3/13 (23.1%), and over-deferral remained 3/13 (23.1%). Protected-target results changed from TP 4 / FP 21 / FN 7, 16.0% precision, 36.4% recall and 22.2% F1 to TP 5 / FP 16 / FN 6, 23.8% precision, 45.5% recall and 31.3% F1. These target P/R/F1 figures use exploratory, class-agnostic raw-box matching at IoU ≥ 0.25; they are not calibrated semantic detector accuracy. Recorded latency changed from 318/335 ms p50/p95 to 277/307 ms.
- Confirmed one genuine behavior correction: `charge-012` no longer over-defers. Remaining over-deferrals are `charge-002/008/016`; remaining unsafe placements are `charge-005/013/018`.
- Subsequent first-pass review confirmed `charge-002`'s protection target and placement. `charge-005/008/013/016/018` still require label/box resolution before they can act as stable safety-gate targets, so the project will not optimize against them blindly.
- Expanded product review to a default 13-frame priority queue: the original seven `needs-user-review` drafts plus `charge-002/005/008/013/016/018`. The other seven frames remain unreviewed agent-rule drafts; none of the 20 labels is human ground truth. Green boxes are agent-drafted targets, purple dashed boxes are hidden-by-default model output, and blue placement choices are prefilled from the agent draft and remain dashed until confirmed.
- Added a four-step confirmation guide: verify green protection targets, select every acceptable upper corner or defer, explain the decision/adjustment, then confirm and export. Choices stay in browser `localStorage`; confirmation does not train the model. Exported JSON must be validated and committed separately by a maintainer before it can affect the manifest or baseline.
- Unified scorer and rendered-card footprints at 0.30×0.30 and fixed the S2 stage at 16:9. Narrowed weak crop suppression to low-confidence crop-only `人物主体` candidates without face corroboration; direct, strong crop, animal and faceless character candidates remain. Back-facing low-confidence people remain a holdout limitation.
- Made the vision gate fail closed: face and object detectors are both required. If either detector is unavailable, the entire frame is reported unavailable, no placement is emitted and a blocking sample counts as a miss.
- Added a direct `/regression` entry from the main site's Decision view.
- These results apply only to the fixed project set. The historical v0.3.0 baseline remains preserved below.
- Traceability: an intermediate `s2-vision-v2` candidate at `c006c647a07ff047065199b22b554f14e450aa40` had the same decision/target counts and 247/293 ms p50/p95. It is superseded by the final `s2-vision-v4` artifact above and is not the current candidate.

### 0.4.0 中文说明

- 新增 `evaluation/s2/candidates/v0.4.0.json`，它由最终 `s2-vision-v4` 浏览器复跑于 `2026-08-22T03:42:41.155Z` 生成，运行器/配置提交均为 `e0a033194ea04a9c926a822e4330355f41ddd152`，用于与历史 v0.2.7 配置参考基线做可重算对比；20/20 张固定帧均可用。该结果与复核实验室已随公开站 v0.4.0 发布。
- 同一组 13 张规则确认初标中，安全位置一致率由 `6/13 = 46.2%` 提升到 `7/13 = 53.8%`，危险误投由 `4/13 = 30.8%` 降至 `3/13 = 23.1%`，过度顺延保持 `3/13 = 23.1%`。保护目标从 TP 4 / FP 21 / FN 7、精确率 `16.0%`、召回率 `36.4%`、F1 `22.2%`，变为 TP 5 / FP 16 / FN 6、精确率 `23.8%`、召回率 `45.5%`、F1 `31.3%`。这些目标 P/R/F1 使用 IoU ≥ 0.25 的类别无关原始框探索性匹配，不是经过校准的语义检测准确率；已记录耗时由 P50/P95 `318/335 ms` 变为 `277/307 ms`。
- 确认一项真实行为修复：`charge-012` 不再过度顺延。剩余过度顺延为 `charge-002/008/016`，剩余危险误投为 `charge-005/013/018`。
- 后续第一轮复核确认 `charge-002` 的保护目标与位置正确；`charge-005/008/013/016/018` 仍需完成标签/保护框裁决，才能成为稳定安全门目标，因此项目不会针对它们盲调。
- 产品复核扩展为默认 13 张优先队列：原有 7 张 `needs-user-review` 加 `charge-002/005/008/013/016/018`。另外 7 张仍是未经人工审核的代理规则初标；20 张标签都不是人工标准答案。绿色框是代理保护目标，紫色虚线框是默认隐藏的模型输出，蓝色位置选择由代理初标预填，确认前保持虚线。
- 新增四步人工确认说明：检查绿色保护目标、选择所有可接受上角或顺延、解释决定/调整、确认并导出。选择只存于浏览器 `localStorage`；确认不会自动训练模型。导出的 JSON 必须由维护者另行校验并提交，之后才可能影响 manifest 或基线。
- 评分器与线上卡片 footprint 已统一为 `0.30 × 0.30`，S2 舞台固定为 16:9。弱裁剪抑制收窄到无脸部佐证的低置信裁剪 `人物主体`；直接、强裁剪、动物和无脸角色候选仍保留。背面低置信人物仍是需要留出集验证的泛化限制。
- 视觉门改为 fail-closed：人脸与主体检测器必须同时可用；任一不可用时整帧标记为不可用、不输出位置，并将阻断样本计为失败。
- 主站 Decision / 决策方式页面新增 `/regression` 直接入口。
- 以上结果只适用于项目固定集；历史 v0.3.0 基线继续完整保留在下方。
- 可追溯说明：中间的 `s2-vision-v2` 候选提交 `c006c647a07ff047065199b22b554f14e450aa40` 得到相同决策/目标计数与 P50/P95 `247/293 ms`；它已被上方最终 `s2-vision-v4` 产物取代，不是当前候选。

## 0.3.0 · 2026-08-21

### Stage 1A evaluation baseline

- Added a checksum-backed S2 regression set made from 20 fixed 1280×720 `CHARGE` frames, with protected regions, multiple acceptable placements and explicit `rule-confirmed` / `needs-user-review` states. The project agent drafted every label from explicit placement rules; 13 rule-clear drafts enter blocking metrics, while seven subjective frames await product-owner review.
- Added a public bilingual `/regression` lab that runs the same frames through the in-browser MediaPipe pipeline, overlays rule-drafted and model boxes, separates unsafe delivery from conservative deferral and exports the raw report.
- Captured the pre-tuning baseline with the v0.3.0 harness at `e3ceabe1eb401b89e9ff4307d093824b9e2b35da`, using detector configuration behavior referenced to v0.2.7 at `bdf66d1db7511f97feba49713f9995ea6ef13711`; the older commit did not run the new harness. Across 13 rule-confirmed frames, safe-placement agreement is 6/13 (46.2%), unsafe placement is 4/13 (30.8%) and over-deferral is 3/13 (23.1%). Protected-target precision is 4/25 (16.0%), recall is 4/11 (36.4%) and F1 is 22.2%; latency is 318 ms p50 and 335 ms p95. These are fixed-set results, not general model accuracy.
- Added a deterministic offline regression gate that validates the manifest and frame hashes and recomputes every tracked metric and failure from raw predictions.
- Retained detection confidence and pass provenance through face/subject deduplication so Stage 1B tuning can be evidence-based.

### 0.3.0 中文说明

- 使用 20 张 1280×720《CHARGE》固定画面建立带校验和的 S2 回归集，记录保护区域、多个可接受位置，以及明确的 `rule-confirmed` / `needs-user-review` 状态。所有答案均由项目代理依据明确位置规则起草；13 张规则明确初标进入阻断指标，7 张主观样本等待产品负责人复核。
- 新增公开双语 `/regression` 实验室：在浏览器中用同一套 MediaPipe 链路运行固定帧，叠加规则初标框和模型框，区分危险误投与保守顺延，并可导出原始报告。
- 调参前基线由 v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 运行，检测配置行为参考 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711`；旧提交本身并未运行新 harness。13 张 `rule-confirmed` 样本中的安全位置一致率为 `6/13 = 46.2%`，危险位置误投为 `4/13 = 30.8%`，过度顺延为 `3/13 = 23.1%`；保护目标精确率为 `4/25 = 16.0%`，召回率为 `4/11 = 36.4%`，F1 为 `22.2%`，推理耗时为 P50 `318 ms`、P95 `335 ms`。这些只属于固定回归集，不是通用模型准确率。
- 新增确定性的离线回归质量门：校验标注清单和帧文件哈希，并从原始预测重算全部指标与失败案例。
- 人脸和主体去重后继续保留置信度与检测来源，为阶段 1B 提供可追溯的调参证据。

## 0.2.7 · 2026-08-20

- Made S2's delivered state the source of truth for ad visibility: while the panel says a muted card is safely displayed, the creative remains mounted even if the countdown state is interrupted or temporarily desynchronized.
- Added an explicit visible-state marker and stacking/display invariant for delivered S2 cards, while preserving skip, resume, seek and eight-second full-screen transitions.
- 中文：把 S2 的“已安全展示”状态设为广告可见性的事实来源；只要右侧仍显示静音小卡片已投放，广告素材就不会因倒计时状态短暂不同步而消失。
- 中文：为已投放的小卡片增加明确的可见状态和层级兜底，同时保留关闭、恢复播放、拖动与八秒后升级全屏的原有逻辑。

## 0.2.6 · 2026-08-20

- Replaced the homepage hero preview's background video with the original blue fantasy game advertisement, so the public first screen now shows a real ad creative instead of only a decision-state mockup.
- Preserved the safe-window, rule-decision and evidence-score context around the creative, and cache-busted the shared ad asset across homepage and scenario delivery states.
- 中文：首页首屏右侧演示卡片改为直接展示原始蓝色奇幻游戏广告，不再只显示剧情视频和决策状态。
- 中文：保留安全窗口、规则决定与证据评分上下文，并同步更新首页和场景投放状态所共用广告素材的缓存版本。

## 0.2.5 · 2026-08-20

- Added the original game-ad image as a cache-busted container background as well as the foreground creative, so a delivered ad can never degrade into an empty placement box.
- Removed the redundant dashed placement outline after an S2 ad is delivered; the creative itself now occupies the chosen position immediately.
- 中文：把原始游戏广告图同时设为带版本标识的容器背景和前景素材；广告一旦判定为已展示，就不会再退化成空白定位框。
- 中文：移除 S2 广告投放后的虚线定位框，判定成功后直接在选定位置展示广告原图。

## 0.2.4 · 2026-08-20

- Made every ad creative load directly from the public static asset, avoiding deployment-specific image optimization behavior.
- Removed the fragile opacity animation from S2's card-to-full-screen promotion, fixed its stacking level, and removed the stale placement outline after promotion.
- Rechecked S1 traditional full-screen delivery, S1 AdMind muted-card delivery, S2 card and full-screen states, S3 traditional delivery, and S3 AdMind ethical blocking in a real browser.
- 中文：所有广告素材改为直接读取公开静态资源，避免部署环境图片优化链导致素材节点存在但画面不可见。
- 中文：移除 S2 小卡片升级全屏时可能冻结透明度的动画，固定广告层级，并在升级后清除残留的虚线定位框。
- 中文：已在真实浏览器中复核 S1 传统全屏、S1 AdMind 静音卡片、S2 小卡片与全屏、S3 传统广告，以及 S3 AdMind 伦理禁投。

## 0.2.3 · 2026-08-20

- Reconciled each video element's actual `readyState` after mount, so cached media cannot remain stuck behind a disabled “Loading video…” state when metadata events fire before React attaches its handlers.
- Preserved event-driven readiness updates for fresh network loads and errors, and rechecked the decision jump, progress slider, ad trigger and skip flow.
- 中文：组件挂载后会主动读取每个视频真实的 `readyState`，避免缓存命中太快、媒体事件早于 React 绑定时，界面仍错误停留在“正在加载视频…”且禁用进度条。
- 中文：保留首次网络加载与错误事件的状态同步，并重新验证决策点跳转、进度条、广告触发和跳过关闭流程。

## 0.2.2 · 2026-08-20

- Restored the saved language only after client hydration, preventing React hydration mismatches for returning visitors who previously selected Chinese.
- Kept English as the server-rendered public default while preserving each visitor's explicit language choice after the page becomes interactive.
- 中文：语言偏好改为在客户端 hydration 完成后恢复，修复曾选择中文的访客再次打开页面时可能出现的 React hydration 不一致警告。
- 中文：服务端公开默认语言仍为英文；页面进入可交互状态后，继续尊重访客上次主动选择的语言。

## 0.2.1 · 2026-08-20

- Localized the final two consensus evidence labels on the Decision logic page, removing `Mid-Fight` and `Post-Fight Recovery` from Chinese mode while preserving their English translations.
- 中文：补齐“决策方式”页面最后两个共识证据标签的本地化；中文模式显示“战斗进行中 / 战斗后恢复”，英文模式继续显示对应英文。

## 0.2.0 · 2026-08-20

### Public experience

- Added complete English and Chinese interface modes with English as the public default.
- Kept the active language, document language and English/Chinese caption track synchronized across repeated switches.
- Completed responsive layout coverage for desktop, tablet, narrow-window and phone widths without forced scroll snapping.
- Stacked player status, jump actions and strategy controls before they can collapse into clipped or vertical text.
- Preserved full-width video controls and scenario navigation at widths down to 360 CSS pixels.

### Interaction reliability

- Kept one accessible volume icon with a vertical volume slider and dynamic high, low and muted states.
- Closed the volume panel on playback, outside interaction or Escape while keeping dynamic labels localized.
- Added a visible skip action for delivered full-screen ads and kept displayed/closed ads separate from deferred tasks.
- Completed a browser acceptance pass for scenario navigation, material and strategy switches, ad dismissal, language changes and responsive layout.

### Documentation and release

- Kept the English and Chinese README sections feature-complete and aligned with the public deployment.
- Updated the engineering handoff and roadmap to reflect the public bilingual site and current quality gates.
- Verified anonymous HTTP access to both the hosted demo and public GitHub repository.

### 0.2.0 中文说明

#### 公开体验

- 完成英文与中文两套完整界面，并将英文设为公开页面默认语言。
- 连续切换语言时，界面、HTML 文档语言与中英文字幕轨道始终同步。
- 完成桌面、平板、窄窗口和手机宽度的响应式布局，不使用强制滚动吸附。
- 在标题可能被压成竖排或控件可能被切边之前，主动把播放器状态、跳转按钮和策略开关改成纵向完整布局。
- 在最低 360 CSS 像素宽度下仍保留完整的视频控制栏与场景导航。

#### 交互可靠性

- 只保留一个具有无障碍名称的音量图标，并提供竖向音量条和高、低、静音三种动态图标状态。
- 播放、点击外部或按 Escape 都会关闭音量浮层，动态辅助文本也会跟随语言变化。
- 已展示的全屏广告提供明确的跳过入口，并将“已展示后关闭”与“尚未展示而顺延”分开记录。
- 完成场景导航、素材/策略切换、广告关闭、语言切换和多尺寸布局的浏览器验收。

#### 文档与发布

- README 的英文与中文部分保持完整对等，并与公开部署一致。
- 更新工程交接和路线图，记录双语公开站点与当前质量门。
- 使用未登录 HTTP 访问验证线上演示和公开 GitHub 仓库均可直接打开。

## 0.1.0 · 2026-08-19

### Documentation

- Rebuilt the repository landing page around the current S1/S2/S3 experience.
- Added current architecture, development, roadmap, contribution and security documentation.
- Added GitHub issue and pull-request templates.
- Added a real screenshot from the running product experience.
- Added an interview-ready case study and a checksum-backed asset manifest.
- Prepared a clean public repository with contribution, security and community files.

### Maintenance

- Removed two unused destructuring bindings so the existing CI lint gate passes cleanly.
- Updated rendered-output assertions to match the current four-part product narrative.
- Removed unverified and unused release assets from the public snapshot.
- Added a public release tag and GitHub Release.
- Updated the React, Vite and CI action toolchain to current patched releases.
- Added a reviewed regression-tested patch for an unpublished `image-size` parser fix.

## Private beta · 2026-08-16

### Product experience

- Reorganized the site into a continuous home, S1, S2 and S3 narrative.
- Introduced the current light, rounded and purple visual system.
- Replaced forced scroll snapping with normal browser scrolling.
- Added larger, clearer scenario typography and simplified product copy.

### Player and advertising behavior

- Added one compact volume control with high, low and muted states.
- Added dismissible and skippable ad behavior.
- Corrected S2 drag counting to represent one user gesture rather than repeated browser events.
- Distinguished ad opportunities that were never shown from ads that were shown, completed or skipped.
- Prevented screenshot-induced focus changes from incorrectly reverting a delivered ad to deferred state.

### Decision evidence

- Added three S1 semantic examples and three S3 protected-context examples.
- Added live S2 paused-frame detection and four-corner placement scoring.
- Clarified that evidence scores are model support signals, not statistical confidence intervals.
- Added delivery-deferral language for content with no acceptable in-window break.

## Earlier prototype milestones

- Introduced shared Zod contracts, deterministic policy filters and plan ranking.
- Added TwelveLabs provider integration, cached analysis and repeated-run consensus.
- Added the co-located web API and standalone Fastify adapter.
- Added unit, integration and rendered-output verification.
