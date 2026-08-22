# Changelog

[English](#changelog) · [中文（最新版本）](#040-中文说明)

Notable project changes are recorded here.

## Unreleased

## 0.4.0 · 2026-08-21

Public deployment pending.

### Stage 1B fixed-set candidate

- Added `evaluation/s2/candidates/v0.4.0.json`, generated at `2026-08-22T03:42:41.155Z` by the final `s2-vision-v4` browser run at runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152`, as a reproducible comparison against the historical v0.2.7-configuration baseline. All 20/20 fixed frames were available. Public deployment is pending; the live site remains v0.3.0.
- On the same 13 rule-confirmed drafts, safe-placement agreement changed from 6/13 (46.2%) to 7/13 (53.8%), unsafe placement from 4/13 (30.8%) to 3/13 (23.1%), and over-deferral remained 3/13 (23.1%). Protected-target results changed from TP 4 / FP 21 / FN 7, 16.0% precision, 36.4% recall and 22.2% F1 to TP 5 / FP 16 / FN 6, 23.8% precision, 45.5% recall and 31.3% F1. These target P/R/F1 figures use exploratory, class-agnostic raw-box matching at IoU ≥ 0.25; they are not calibrated semantic detector accuracy. Recorded latency changed from 318/335 ms p50/p95 to 277/307 ms.
- Confirmed one genuine behavior correction: `charge-012` no longer over-defers. Remaining over-deferrals are `charge-002/008/016`; remaining unsafe placements are `charge-005/013/018`.
- Audited the remaining labels before further tuning. The accepted placement drafts for `charge-002/005/008/013/018` are disputable, so the project will not optimize against them blindly; `charge-016` remains the clear unresolved over-deferral case.
- Expanded product review to a default 13-frame priority queue: the original seven `needs-user-review` drafts plus `charge-002/005/008/013/016/018`. The other seven frames remain unreviewed agent-rule drafts; none of the 20 labels is human ground truth. Green boxes are agent-drafted targets, purple dashed boxes are hidden-by-default model output, and blue placement choices are prefilled from the agent draft and remain dashed until confirmed.
- Added a four-step confirmation guide: verify green protection targets, select every acceptable upper corner or defer, explain the decision/adjustment, then confirm and export. Choices stay in browser `localStorage`; confirmation does not train the model. Exported JSON must be validated and committed separately by a maintainer before it can affect the manifest or baseline.
- Unified scorer and rendered-card footprints at 0.30×0.30 and fixed the S2 stage at 16:9. Narrowed weak crop suppression to low-confidence crop-only `人物主体` candidates without face corroboration; direct, strong crop, animal and faceless character candidates remain. Back-facing low-confidence people remain a holdout limitation.
- Made the vision gate fail closed: face and object detectors are both required. If either detector is unavailable, the entire frame is reported unavailable, no placement is emitted and a blocking sample counts as a miss.
- Added a direct `/regression` entry from the main site's Decision view.
- These results apply only to the fixed project set. The historical v0.3.0 baseline remains preserved below.
- Traceability: an intermediate `s2-vision-v2` candidate at `c006c647a07ff047065199b22b554f14e450aa40` had the same decision/target counts and 247/293 ms p50/p95. It is superseded by the final `s2-vision-v4` artifact above and is not the current candidate.

### 0.4.0 中文说明

- 新增 `evaluation/s2/candidates/v0.4.0.json`，它由最终 `s2-vision-v4` 浏览器复跑于 `2026-08-22T03:42:41.155Z` 生成，运行器/配置提交均为 `e0a033194ea04a9c926a822e4330355f41ddd152`，用于与历史 v0.2.7 配置参考基线做可重算对比；20/20 张固定帧均可用。公开部署仍待完成，线上站点仍是 v0.3.0。
- 同一组 13 张规则确认初标中，安全位置一致率由 `6/13 = 46.2%` 提升到 `7/13 = 53.8%`，危险误投由 `4/13 = 30.8%` 降至 `3/13 = 23.1%`，过度顺延保持 `3/13 = 23.1%`。保护目标从 TP 4 / FP 21 / FN 7、精确率 `16.0%`、召回率 `36.4%`、F1 `22.2%`，变为 TP 5 / FP 16 / FN 6、精确率 `23.8%`、召回率 `45.5%`、F1 `31.3%`。这些目标 P/R/F1 使用 IoU ≥ 0.25 的类别无关原始框探索性匹配，不是经过校准的语义检测准确率；已记录耗时由 P50/P95 `318/335 ms` 变为 `277/307 ms`。
- 确认一项真实行为修复：`charge-012` 不再过度顺延。剩余过度顺延为 `charge-002/008/016`，剩余危险误投为 `charge-005/013/018`。
- 在继续调参前审计了剩余标签。`charge-002/005/008/013/018` 的可接受位置初标存在争议，项目不会继续针对这些标签盲调；`charge-016` 仍是明确未解决的过度顺延案例。
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
