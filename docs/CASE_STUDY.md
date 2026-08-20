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
- Pause thresholds and placement weights are product hypotheses awaiting a fixed regression set.
- Delivery deferral is session-scoped; production campaign orchestration and durable audit storage are future work.
- No production revenue, uplift or retention claim is made.

## Stack

React 19 · TypeScript · vinext / Vite · Zod · Fastify · MediaPipe Tasks Vision · TwelveLabs · Vitest · GitHub Actions

## 60-second interview explanation

> AdMind is a policy-first ad decision layer for long-form video. I used a video-understanding API to produce time-coded semantic evidence, then normalized that output behind Zod contracts. A deterministic TypeScript engine combines it with player events, campaign constraints and ethical rules. For pause ads, MediaPipe runs locally on the current frame and a spatial scorer selects the safest region—or rejects all of them. The important design choice is that the model never gets final authority: every allow, defer, downgrade or block remains explainable and testable.

## Next milestone

Build and label a fixed S2 paused-frame regression set, report placement and rejection accuracy, then tune thresholds against that complete set rather than individual screenshots.

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
- 暂停阈值与位置权重是等待固定回归集验证的产品假设。
- 广告顺延只存在于当前会话；生产活动编排和持久化审计属于未来工作。
- 项目不宣称已经产生生产收入、增长或留存提升。

## 技术栈

React 19 · TypeScript · vinext / Vite · Zod · Fastify · MediaPipe Tasks Vision · TwelveLabs · Vitest · GitHub Actions

## 60 秒面试讲解

> AdMind 是一个面向长视频、政策优先的广告决策层。我先用视频理解 API 生成带时间码的语义证据，再通过 Zod 契约把输出标准化。确定性的 TypeScript 引擎把这些证据与播放器事件、广告任务约束和伦理规则组合起来。对于暂停广告，MediaPipe 在浏览器本地分析当前画面，空间评分器选择最安全区域，也可以拒绝所有位置。最关键的设计是模型不拥有最终决定权：允许、顺延、降级或阻断都保持可解释和可测试。

## 下一里程碑

建立并标注固定的 S2 暂停画面回归集，报告位置命中率和拒投准确率，然后根据完整样本调整阈值，而不是围绕单张截图反复调参。
