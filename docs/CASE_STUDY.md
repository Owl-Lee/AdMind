# AdMind case study

[English](#admind-case-study) · [中文](#admind-项目案例)

## The short version

AdMind is an explainable decision layer for long-form video advertising. It combines offline video understanding, live player state, browser-side computer vision and deterministic policy rules to decide **when**, **how**, **where** or **whether** an ad should appear.

The project is a working product prototype, not a claim that advertising can be optimized by one model score. AI produces bounded evidence; testable rules retain final authority.

## Problem

Fixed-time ad breaks ignore what the viewer is watching. A break can land during a climax, a pause ad can cover the subject the viewer stopped to inspect, and a commercially valuable slot can still be inappropriate in rescue or medical content.

The product question was therefore larger than “which ad should win?”:

1. Is this moment eligible for an ad?
2. If it is, which format and position cause the least disruption?
3. If it is not, can delivery be deferred without hiding the trade-off?

## What I built

- A React and TypeScript product experience with real video playback, seeking, pause, focus and page-visibility state.
- A typed decision engine that ranks candidates only after hard eligibility and ethical rules pass.
- A provider boundary that normalizes time-coded TwelveLabs video analysis into schema-validated evidence.
- Browser-side MediaPipe face and subject detection for paused-frame placement.
- A four-region risk scorer that protects subjects, subtitles and controls and can reject every position.
- Three end-to-end scenarios: climax avoidance, pause protection and ethical blocking.
- Cached analysis, 30 unit/integration tests, 5 rendered/dependency checks, CI and a production deployment path.

## Key engineering decisions

### AI supplies evidence; rules make the decision

Provider output is useful but variable. AdMind converts it into a typed internal contract and keeps policy decisions deterministic. This makes a result inspectable, repeatable and testable.

### Real interaction state matters

S2 does not claim to read intent. It observes only the current page and player: pause, play, seeking, focus and visibility. An observation token invalidates stale asynchronous inference when the viewer resumes or moves elsewhere.

### Safe placement can return “none”

The placement scorer compares candidate regions against detected faces and subjects plus reserved subtitle and control areas. If every region is risky, it defers the ad instead of forcing a cosmetic answer.

### Ethical boundaries outrank delivery pressure

Rescue and medical evidence can trigger a hard block. A high bid cannot override it; the system records the delivery gap for later handling.

## Evidence and honest limits

- The demonstration uses cached analyses for a small, fixed media set; it is not a broad benchmark.
- Model confidence is evidence quality, not a calibrated probability of business success.
- Pause thresholds and placement weights now have a 20-frame 1280×720 historical baseline and a same-set Stage 1B candidate, but they remain product hypotheses. None of the 20 labels is human ground truth. Thirteen frames are prioritized for product review—the original seven subjective drafts plus `charge-002/005/008/013/016/018`—and the other seven remain unreviewed agent-rule drafts.
- Delivery deferral is session-scoped; production campaign orchestration and durable audit storage are future work.
- No production revenue, uplift or retention claim is made.

## Stack

React 19 · TypeScript · vinext / Vite · Zod · Fastify · MediaPipe Tasks Vision · TwelveLabs · Vitest · GitHub Actions

## 60-second interview explanation

> AdMind is a policy-first ad decision layer for long-form video. I used a video-understanding API to produce time-coded semantic evidence, then normalized that output behind Zod contracts. A deterministic TypeScript engine combines it with player events, campaign constraints and ethical rules. For pause ads, MediaPipe runs locally on the current frame and a spatial scorer selects the safest region—or rejects all of them. The important design choice is that the model never gets final authority: every allow, defer, downgrade or block remains explainable and testable.

## Current evidence and next milestone

Stage 1A established a checksum-backed set of 20 fixed 1280×720 S2 frames. The project agent drafted every label from explicit placement rules; none is human ground truth. Thirteen rule-clear samples enter blocking metrics as `rule-confirmed`, while seven remain diagnostic. The current priority-review queue contains 13 frames, and the other seven are still unreviewed agent-rule drafts. The historical v0.3.0 harness at `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` captured the v0.2.7 configuration behavior referenced at `bdf66d1db7511f97feba49713f9995ea6ef13711`: 6/13 (46.2%) safe placement, 4/13 (30.8%) unsafe placement, 3/13 (23.1%) over-deferral, 16.0% precision, 36.4% recall, 22.2% F1 and 318/335 ms p50/p95.

The deployment-pending v0.4.0 candidate was generated at `2026-08-22T03:42:41.155Z` by the final `s2-vision-v4` browser run at runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152`; the live site remains v0.3.0. All 20/20 frames were available. On the same blocking set it measured 7/13 (53.8%) safe placement, 3/13 (23.1%) unsafe placement, 3/13 (23.1%) over-deferral, TP 5 / FP 16 / FN 6, 23.8% precision, 45.5% recall, 31.3% F1 and 277/307 ms p50/p95. The P/R/F1 figures are exploratory, class-agnostic raw-box matching at IoU ≥ 0.25, not calibrated semantic detector accuracy. It genuinely corrects `charge-012`. Remaining over-deferrals are `charge-002/008/016`; remaining unsafe placements are `charge-005/013/018`. Label audit found `002/005/008/013/018` disputable, so the next milestone is label resolution rather than blind threshold tuning. Scorer and rendered-card geometry now agree at 0.30×0.30 on the 16:9 S2 stage. Weak crop suppression removes only low-confidence crop-only `人物主体` without face corroboration; animals, characters, direct detections and strong crop detections stay eligible. Back-facing low-confidence people still require holdout validation. The vision pipeline is fail-closed: both face and object detectors are required; either one being unavailable yields no placement and a blocking miss. The main Decision view links directly to the regression lab. These are project-local fixed-set results, not general accuracy.

---

# AdMind 项目案例

## 一句话版本

AdMind 是一个面向长视频广告、可解释的决策层。它组合离线视频理解、实时播放器状态、浏览器端计算机视觉和确定性政策规则，决定广告应该在**什么时候**、以**什么形式**、放在**什么位置**，以及**是否根本不应该出现**。

这是一个可以运行的产品原型，不是“一个模型分数就能优化广告”的宣传。AI 只产生有边界的证据，最终决定权保留给可测试的规则。

## 问题

固定时间广告点不了解用户正在观看什么：广告可能切进剧情高潮，暂停广告可能遮住用户停下来查看的主体，而商业价值很高的位置也可能出现在救援或医疗内容中。

因此产品问题不只是“哪条广告获胜”：

1. 这一刻是否有资格出现广告？
2. 如果可以，什么形式和位置的打断最小？
3. 如果不可以，能否顺延，同时如实记录商业取舍？

## 我完成的内容

- 使用 React 与 TypeScript 构建真实视频播放、拖动、暂停、焦点和页面可见性状态的产品体验。
- 构建类型化决策引擎，只在硬性资格和伦理规则通过后排序候选方案。
- 建立服务商边界，把带时间码的 TwelveLabs 视频分析标准化为经过 Schema 校验的证据。
- 在浏览器本地使用 MediaPipe 检测暂停画面中的人脸和主体。
- 构建四区域风险评分器，保护主体、字幕和控制栏，并允许返回“所有位置都不安全”。
- 完成剧情高点避让、暂停保护和伦理阻断三个端到端场景。
- 提供缓存分析、30 项单元/集成测试、5 项渲染/依赖检查、CI 与生产部署路径。

## 关键工程决定

### AI 提供证据，规则做最终决定

服务商输出有价值但存在波动。AdMind 将其转换为内部类型契约，并让政策决定保持确定性，因此结果可检查、可重放、可测试。

### 真实交互状态很重要

S2 不宣称读取用户意图，只观察当前页面和播放器：暂停、播放、拖动、焦点和可见性。当用户恢复播放或转移操作时，观察令牌会使过期的异步推理失效。

### 安全位置可以返回“无”

位置评分器把候选区域与检测到的人脸、主体、字幕和控制栏保留区比较。如果每个位置都有风险，系统会顺延广告，而不是强行给出一个看起来合理的答案。

### 伦理边界高于交付压力

救援和医疗证据可以触发硬阻断。高出价不能覆盖规则；系统会记录交付缺口，交给后续流程处理。

## 证据与诚实边界

- Demo 使用少量固定素材的缓存分析，不是大规模基准测试。
- 模型证据分数表示证据质量，不是商业成功率的校准概率。
- 暂停阈值与位置权重已经有 20 张 1280×720 固定帧历史基线和同集阶段 1B 候选，但仍属于产品假设。20 张标签都不是人工标准答案；优先复核队列包含原有 7 张主观初标与 `charge-002/005/008/013/016/018`，共 13 张，另外 7 张仍是未经人工审核的代理规则初标。
- 广告顺延只存在于当前会话；生产活动编排和持久化审计属于未来工作。
- 项目不宣称已经产生生产收入、增长或留存提升。

## 技术栈

React 19 · TypeScript · vinext / Vite · Zod · Fastify · MediaPipe Tasks Vision · TwelveLabs · Vitest · GitHub Actions

## 60 秒面试讲解

> AdMind 是一个面向长视频、政策优先的广告决策层。我先用视频理解 API 生成带时间码的语义证据，再通过 Zod 契约把输出标准化。确定性的 TypeScript 引擎把这些证据与播放器事件、广告任务约束和伦理规则组合起来。对于暂停广告，MediaPipe 在浏览器本地分析当前画面，空间评分器选择最安全区域，也可以拒绝所有位置。最关键的设计是模型不拥有最终决定权：允许、顺延、降级或阻断都保持可解释和可测试。

## 当前证据与下一里程碑

阶段 1A 已建立带校验和的 20 张 1280×720 S2 固定帧。全部标签都由项目代理依据明确位置规则起草，没有一张是人工标准答案。13 张规则明确样本以 `rule-confirmed` 身份进入阻断指标，7 张保持诊断状态；当前优先复核队列为 13 张，另外 7 张仍是未人工审核的代理规则初标。历史 v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 重放了 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711` 所参考的配置行为：安全位置一致率 `6/13 = 46.2%`，危险误投 `4/13 = 30.8%`，过度顺延 `3/13 = 23.1%`，精确率 `16.0%`，召回率 `36.4%`，F1 `22.2%`，P50/P95 `318/335 ms`。

待部署的 v0.4.0 候选由最终 `s2-vision-v4` 浏览器复跑于 `2026-08-22T03:42:41.155Z` 生成，运行器/配置提交均为 `e0a033194ea04a9c926a822e4330355f41ddd152`，线上站点仍是 v0.3.0；20/20 张均可用。同一阻断集上的安全位置一致率为 `7/13 = 53.8%`，危险误投 `3/13 = 23.1%`，过度顺延 `3/13 = 23.1%`；TP 5 / FP 16 / FN 6，精确率 `23.8%`，召回率 `45.5%`，F1 `31.3%`，P50/P95 `277/307 ms`。P/R/F1 是 IoU ≥ 0.25 的类别无关原始框探索性匹配，不是经过校准的语义检测准确率。`charge-012` 得到真实修复；剩余过度顺延为 `charge-002/008/016`，剩余危险误投为 `charge-005/013/018`。标签审计认为 `002/005/008/013/018` 五张存在争议，所以下一步是先解决标签分歧，而不是继续盲调阈值。评分器与线上卡片占位已统一为 `0.30 × 0.30`，S2 舞台为 16:9。弱裁剪抑制只移除无脸部佐证的低置信裁剪 `人物主体`；动物、角色、直接检测与强裁剪候选仍保留。背面低置信人物仍需留出集验证。视觉链路采用 fail-closed：人脸与主体检测器必须同时可用，任一不可用都会返回无位置并在阻断指标中计为失败。主站 Decision / 决策方式页面直接链接回归实验室。这些仍只是项目内部固定集结果，不是通用准确率。
