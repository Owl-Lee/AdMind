# AdMind 决策引擎规格 v1

**状态：** Phase 1 实现合同  
**目标：** 将产品原则转成确定性、可解释、可测试的领域行为  
**边界：** AI 只提供规范化场景元数据；本引擎负责候选生成、规则过滤、排序和审计。

---

## 1. 核心定义

AdMind 不对“广告活动”单独排序，而对完整投放方案 `DeliveryPlan` 排序：

```text
DeliveryPlan =
  Campaign
  + Approved CreativeVariant
  + Eligible AdOpportunity / ViewerSession
  + ScheduledWindow
  + AdFormat
```

一个活动即使商业价值最高，也可能因为当前形式、时间或频控不合格而被淘汰；同一活动的另一个已审批版本可以成为合格方案。

## 2. 决策管线

```text
DecisionRequest
  + Active SessionAdPlan revision
  ↓ schema validation / normalization
Candidate Campaigns
  ↓ generate approved variants × eligible formats × scheduled windows
DeliveryPlan candidates
  ↓ hard policy filters
Eligible plans + rejected plans with reason codes
  ↓ deterministic feature calculation
Scored plans
  ↓ stable ordering and tie-break
DecisionResponse: SHOW | DEFER | NO_ELIGIBLE_PLAN
  ↓ append-only audit events
```

任何阶段失败都必须返回结构化状态，不能让模型自由生成一个看似合理的结果。

## 3. Phase 1 领域对象

### 3.1 `SceneWindow`

```ts
type SceneWindow = {
  id: string;
  contentId: string;
  startMs: number;
  endMs: number;
  category: string[];
  intensity: number;
  naturalTransition: number;
  dialogueContinuity: number;
  subtitleImportance: number;
  sensitivity: "NONE" | "ELEVATED" | "PROTECTED";
  taskUrgency: number;
  adSuitability: number;
  occlusionZones: OcclusionZone[];
  analysisConfidence: number;
  provenance: AnalysisProvenance;
  humanConfirmed: boolean;
};
```

`adSuitability` 是便于展示的派生/人工修正值，不是替代其他特征的神秘总分。排序仍保存独立分量。

### 3.2 `ViewerSession`

```ts
type ViewerSession = {
  id: string;
  contentId: string;
  playbackPositionMs: number;
  playbackState: "PLAYING" | "PAUSED" | "ENDED";
  pauseIntent: "NONE" | "INSPECTION" | "INTERRUPTION" | "UNKNOWN";
  pauseIntentConfidence: number;
  interactionState: InteractionState;
  schedulePreference: "CONSOLIDATED" | "DISTRIBUTED_SAFE_WINDOWS" | "NO_PREFERENCE";
  activeSessionPlanId: string;
  activeSessionPlanRevision: number;
  personalizationAllowed: boolean;
  exposureCounters: ExposureCounters;
  feedbackState: FeedbackState;
};
```

Phase 1 不需要真实用户 ID。会话 ID 在 seed/reset 时生成，仅用于同次演示的事件关联。

### 3.3 `AdOpportunity`

```ts
type AdOpportunity = {
  id: string;
  placement: "PREROLL" | "MIDROLL" | "PAUSE" | "ENDCARD";
  nominalAtMs: number;
  earliestAtMs: number;
  latestAtMs: number;
  eligibleFormats: AdFormat[];
  allowedRegions: OcclusionZone[];
  source: "SCHEDULED" | "PLAYBACK_EVENT" | "OPERATOR_TEST";
};
```

### 3.4 `Campaign` 与 `ContractConstraint`

```ts
type Campaign = {
  id: string;
  advertiserId: string;
  brandId: string;
  dealType: "GUARANTEED" | "AUCTION" | "PREFERRED_FIXED" | "HOUSE_BACKFILL";
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";
  activeFrom: string;
  activeUntil: string;
  commercialValue: number;
  deliveryTarget?: number;
  deliveredQualifying: number;
  shortfallCost: number;
  eligiblePlacements: string[];
  approvedVariantIds: string[];
  audiencePolicy: AudiencePolicy;
  frequencyPolicy: FrequencyPolicy;
};
```

```ts
type FrequencyPolicy = {
  brandSessionHardCap: number;
  campaignSessionHardCap: number;
  creativeSessionHardCap: number;
  minimumSecondsBetweenBrandExposures: number;
};
```

### 3.5 `CreativeVariant`

```ts
type CreativeVariant = {
  id: string;
  campaignId: string;
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
  format: "FULLSCREEN_VIDEO" | "SPLIT_VIDEO" | "CARD" | "ENDCARD";
  durationMs: number;
  autoplayAudio: boolean;
  clickable: boolean;
  explicitCtaElementIds: string[];
  dismissible: boolean;
  dismissTargetPx: { width: number; height: number };
  requiredRegion?: string;
  categories: string[];
  assetLicenseId: string;
};
```

Phase 1 不允许运行时修改广告文案或视频。所谓“缩短/改形式”只能选择已经审批且有资产记录的 `CreativeVariant`。

### 3.6 `AudienceEvidence`

```ts
type AudienceEvidence = {
  id: string;
  tier: "T0_CONTEXTUAL" | "T1_MEDIA_COHORT" | "T2_SESSION_INTENT" | "T3_COMMERCE_INTENT";
  source: string;
  measuredAt: string;
  expiresAt?: string;
  scope: "SCENE" | "CONTENT" | "COHORT" | "SESSION";
  confidence: number;
  consentBasis: "NOT_REQUIRED" | "EXPLICIT" | "WITHDRAWN" | "UNKNOWN";
  sensitive: boolean;
};
```

排序只使用仍有效且满足同意条件的证据。T1 的群体证据不得生成第二人称个人断言。

### 3.7 `DeliveryPlan`

```ts
type DeliveryPlan = {
  id: string;
  campaignId: string;
  creativeVariantId: string;
  opportunityId: string;
  scheduledAtMs: number;
  format: AdFormat;
  region?: string;
  evidenceIds: string[];
};
```

### 3.8 `DecisionResponse`

```ts
type DecisionResponse = {
  decisionId: string;
  action: "SHOW" | "DEFER" | "NO_ELIGIBLE_PLAN";
  chosenPlan?: ScoredPlan;
  alternatives: ScoredPlan[];
  rejectedPlans: RejectedPlan[];
  reasonCodes: ReasonCode[];
  explanationFacts: ExplanationFact[];
  fallback?: FallbackAction;
  versions: {
    schema: string;
    policy: string;
    ranker: string;
    scenario: string;
    analysis: string;
  };
  metricOrigin: "SIMULATED";
};
```

## 4. 规范化和不确定性

输入进入决策前必须：

1. 通过 JSON Schema；
2. 将所有连续数值限制到 `0..1`；
3. 将时间换算为整数毫秒；
4. 按 ID 对无序集合排序；
5. 删除过期证据；
6. 将缺失敏感度按保守策略处理；
7. 记录默认值与来源。

保守规则：

- `analysisConfidence < 0.60`：不得使用 AI 的高强度/低强度判断执行强打断；优先预计算人工元数据；仍无数据则只允许低打断形式或返回延后。
- 敏感度字段缺失且内容来自高风险类别：按 `ELEVATED` 处理。
- `pauseIntentConfidence < 0.70`：暂停意图为 `UNKNOWN`，不可声称用户正在查看细节。
- 证据已过期或同意为 `WITHDRAWN/UNKNOWN`：不进入相关性特征。

## 5. 候选生成

### 5.1 活动候选

仅选择：

- 状态为 `ACTIVE`；
- 当前时间在活动窗口；
- 当前机会的版位在活动允许范围；
- 至少存在一个 `APPROVED` 素材版本；
- 受众规则在合法证据下满足。

### 5.2 时间窗口

候选时间包括：

- 名义机会时刻 `nominalAtMs`；
- 机会允许范围内自然转场超过阈值的时刻；
- 机会的最后合格时刻，用于可解释的履约回退；
- 暂停位的当前时刻，但仅限兼容暂停的形式。

Phase 1 每个机会最多生成 5 个候选时间，避免组合爆炸并保持检查器易懂。

### 5.3 形式与区域

素材形式必须同时属于机会和活动的允许集合。卡片/分屏还必须有一个不覆盖重要字幕、关键物体和主要控件的区域。没有安全区域时，该形式被淘汰，而不是随意摆放。

## 6. 硬规则

硬规则在排序前运行；商业分数和可配置权重不能覆盖。

| 规则 | 淘汰条件 | 理由码 |
|---|---|---|
| 活动有效期 | 未开始、结束、暂停 | `CAMPAIGN_INACTIVE` |
| 素材审批 | 不是 `APPROVED` | `CREATIVE_NOT_APPROVED` |
| 版位/形式 | 活动、机会、素材不兼容 | `PLACEMENT_OR_FORMAT_INELIGIBLE` |
| 受众同意 | 个性化证据无同意/已撤回 | `CONSENT_REQUIRED` |
| 敏感定向 | 使用敏感证据或利用受保护语境 | `SENSITIVE_TARGETING_PROHIBITED` |
| 受保护场景 | 禁用全屏、覆盖、自动音频或跳转 | `PROTECTED_CONTEXT` |
| 品牌/活动/素材频控 | 任一硬上限达到 | `BRAND_FREQUENCY_CAP_REACHED` 等 |
| 最小间隔 | 距离上次品牌曝光过近 | `BRAND_COOLDOWN_ACTIVE` |
| 关闭与可访问性 | 可关闭素材缺少合格控件 | `UNSAFE_DISMISS_CONTROL` |
| 必要控件冲突 | 遮挡进度、返回、播放、弹幕/评论或关闭等当前必要控件 | `ESSENTIAL_CONTROL_BLOCKED` |
| 跳转安全 | 自动跳转、无明确 CTA/主动操作、命中区域冲突 | `UNSAFE_NAVIGATION_BEHAVIOR` |
| 主动交互 | 用户正在拖动进度或离开页面时启动新强广告 | `ACTIVE_TASK_CONFLICT` |
| 遮挡 | 无可用安全区域 | `NO_SAFE_RENDER_REGION` |
| 延迟窗口 | 计划时间超出允许范围 | `OUTSIDE_DELIVERY_WINDOW` |
| 资产许可 | 缺少有效资产许可记录 | `ASSET_LICENSE_MISSING` |

`PROTECTED_CONTEXT` 不代表所有广告永久禁止；它根据政策矩阵禁止特定形式和交互。Phase 1 的 S3 关键流程内没有合格形式，因此返回 `NO_ELIGIBLE_PLAN`。

## 7. 分项特征

所有特征为 `0..1`，先分别展示，再进入总分。

### 7.1 正向特征

#### `commercialValue`

由模拟价格/优先级、可计费概率和活动类型组成，配置在场景 fixture 中，不伪装成生产模型。

#### `deliveryShortfallReduction`

```text
remainingRatio = max(0, target - delivered) / max(1, target)
deadlinePressure = clamp01(1 - timeRemaining / configuredHorizon)
deliveryShortfallReduction =
  clamp01(remainingRatio × 0.55 + deadlinePressure × 0.45) × shortfallCost
```

非保证量活动可以将此项设为 0 或使用公开的简化 pacing 参数。

#### `advertiserOutcomeValue`

Phase 1 使用 fixture 中的模拟预期完成/点击价值。必须标为 `modelled`，不得称为实际 CTR/CVR。

#### `validAttention`

基于形式是否可视、持续时间、当前任务负荷和场景适宜度的透明启发式值。它不是眼动或真实注意力测量。

#### `contextualUtility`

由内容类别匹配和合格证据计算；相关性不能抵消硬规则，也不能单独决定投放。

### 7.2 成本特征

#### `interruptionCost`

```text
interruptionCost = clamp01(
    0.28 × intensity
  + 0.22 × dialogueContinuity
  + 0.18 × subtitleImportance
  + 0.17 × taskUrgency
  + 0.15 × formatIntrusion
  - 0.25 × naturalTransition
)
```

对于 `pauseIntent = INSPECTION`：

- 全屏/覆盖形式额外 `+0.30`；
- 保留画面、控件且无关键遮挡的卡片不增加该项。

公式是 v1 可解释启发式，不是学术上已验证的真实烦躁概率；其作用是进行场景内的稳定比较。

#### `interactionInterferenceCost`

对没有触发硬淘汰的轻度交互摩擦计算：

```text
interactionInterferenceCost = clamp01(
    0.30 × taskModeMismatch
  + 0.25 × nonEssentialOcclusion
  + 0.20 × resumeFriction
  + 0.15 × focusDisplacement
  + 0.10 × dismissEffort
)
```

必要控件遮挡、自动/无意跳转和主动拖动冲突已在硬规则中淘汰，不能只通过这一项扣分。任务模式来自可观察播放事件或保守启发式，不表示系统读懂了用户心理。

#### `fatigueCost`

```text
fatigueCost = max(
  brandExposures / max(1, brandSoftCap),
  campaignExposures / max(1, campaignSoftCap),
  creativeExposures / max(1, creativeSoftCap)
) clamped to 0..1
```

硬上限由政策过滤，软上限用于排序。

#### `abandonmentRisk`

Phase 1 是建模值，由打断成本、形式强度和已有负反馈组成；不展示为真实用户流失概率。

#### `privacyFairnessRisk`

弱来源、过期、群体推个人或未经同意的证据应被过滤或提高风险。受禁止的敏感使用直接硬淘汰，不能只扣分。

## 8. v1 排序与稳定决策

合格方案得分：

```text
planScore =
    0.17 × commercialValue
  + 0.19 × deliveryShortfallReduction
  + 0.09 × advertiserOutcomeValue
  + 0.09 × validAttention
  + 0.11 × contextualUtility
  - 0.13 × interruptionCost
  - 0.08 × interactionInterferenceCost
  - 0.05 × fatigueCost
  - 0.05 × abandonmentRisk
  - 0.04 × privacyFairnessRisk
```

权重是 v1 产品假设，绝对权重和为 1.00。为了让“自然转场”既影响打断成本又避免无限延迟，额外加入：

```text
timingFeasibility = 1 - (scheduledAtMs - nominalAtMs) / maxAllowedDelayMs
```

它只用于两个总分相差小于 `0.02` 的方案之间选择，不进入主分数显示。

稳定排序键：

1. `planScore` 降序，统一保留 6 位小数；
2. 当差值小于 `0.02`，`timingFeasibility` 降序；
3. `scheduledAtMs` 升序；
4. 形式稳定优先级：`CARD > SPLIT_VIDEO > FULLSCREEN_VIDEO > ENDCARD`；
5. `creativeVariantId` 字典序；
6. `planId` 字典序。

`DEFER` 不是另一套算法：如果入选方案时间晚于名义机会时刻，则 action 为 `DEFER`；否则为 `SHOW`。

## 9. 可行性与无方案处理

如果某保证量活动没有当前可行方案，引擎依次：

1. 在允许延迟内搜索后续安全窗口；
2. 搜索该活动的其他已审批版本；
3. 搜索满足合同的其他非敏感机会；
4. 返回 `NO_ELIGIBLE_PLAN`；
5. 产生 `DELIVERY_SHORTFALL_RISK` 运营提醒。

引擎不得自动扩大到未批准受众、忽略硬频控、把不可视渲染计为曝光、生成未经审批的版本或隐藏无方案状态。

## 10. 理由码目录

### 10.1 选择/延后理由

- `COMMERCIAL_DELIVERY_URGENT`
- `HIGH_COMMERCIAL_VALUE`
- `SAFE_TRANSITION_PREFERRED`
- `HIGH_INTERRUPTION_NOW`
- `PAUSE_INSPECTION`
- `LOW_OCCLUSION_FORMAT`
- `CONTEXTUAL_MATCH`
- `LOW_CONFIDENCE_CONSERVATIVE_FALLBACK`
- `ALTERNATIVE_APPROVED_VARIANT`
- `NON_PERSONALIZED_CONTEXTUAL_MODE`
- `CROSS_FORMAT_FATIGUE_AVOIDED`

### 10.2 淘汰理由

- `CAMPAIGN_INACTIVE`
- `CREATIVE_NOT_APPROVED`
- `PLACEMENT_OR_FORMAT_INELIGIBLE`
- `CONSENT_REQUIRED`
- `SENSITIVE_TARGETING_PROHIBITED`
- `PROTECTED_CONTEXT`
- `BRAND_FREQUENCY_CAP_REACHED`
- `CAMPAIGN_FREQUENCY_CAP_REACHED`
- `CREATIVE_FREQUENCY_CAP_REACHED`
- `BRAND_COOLDOWN_ACTIVE`
- `UNSAFE_DISMISS_CONTROL`
- `ESSENTIAL_CONTROL_BLOCKED`
- `UNSAFE_NAVIGATION_BEHAVIOR`
- `ACTIVE_TASK_CONFLICT`
- `NO_SAFE_RENDER_REGION`
- `OUTSIDE_DELIVERY_WINDOW`
- `ASSET_LICENSE_MISSING`
- `EVIDENCE_EXPIRED`
- `ANALYSIS_CONFIDENCE_TOO_LOW`

### 10.3 无方案与报警

- `NO_ELIGIBLE_PLAN`
- `DELIVERY_SHORTFALL_RISK`
- `ANALYSIS_FALLBACK_USED`
- `STALE_SESSION_PLAN`
- `SESSION_REPLAN_REQUIRED`

## 11. 解释生成合同

解释分两层：事实层由确定性代码产生；语言层可由模板或大模型将事实改写成自然语言。

```json
{
  "facts": [
    {"code": "COMMERCIAL_DELIVERY_URGENT", "value": 0.92, "origin": "simulated_contract"},
    {"code": "HIGH_INTERRUPTION_NOW", "value": 0.88, "origin": "precomputed_scene"},
    {"code": "SAFE_TRANSITION_PREFERRED", "scheduled_at_ms": 55000},
    {"code": "NON_PERSONALIZED_CONTEXTUAL_MODE", "evidence_tier": "T0_CONTEXTUAL"}
  ]
}
```

允许的中文说明：

> 该活动存在较高的模拟履约压力，但当前正处于高强度连续情节。系统选择同一活动已审批的 6 秒版本，并延后到 55 秒自然转场。当前仅使用内容上下文，不表示你对游戏感兴趣。

任何语言模型输出必须能逐句映射回事实层；映射失败时使用固定模板。

## 12. 事件与计数语义

### 12.1 最小事件序列

```text
opportunity.created
decision.requested
plan.rejected (0..n)
plan.scored (1..n eligible plans; optional as separate events if stored in decision payload)
decision.made
delivery.scheduled | delivery.deferred | delivery.skipped
interaction.state_changed (0..n)
creative.rendered
impression.viewable
creative.completed | creative.dismissed
content.resumed | session.abandoned
viewer.feedback_submitted (optional)
ad.navigation_intent_recorded | ad.unintended_navigation_detected (optional)
```

### 12.2 Phase 1 可视定义

- 全屏/分屏视频：容器至少 50% 可见且连续播放 2 秒；
- 静态卡片：至少 50% 可见且连续显示 2 秒；
- 页面切到后台、容器隐藏或播放器卸载期间不累计；
- `creative.rendered` 不等于 `impression.viewable`；
- 频控只在 `impression.viewable` 后增加。

这是 Demo 的测量实现，并不声称覆盖所有行业结算规则。

## 13. 配置版本与重放

一次决定的复现键：

```text
hash(
  normalizedDecisionRequest
  + scenarioFixtureVersion
  + policyVersion
  + rankerVersion
  + analysisVersion
)
```

重放测试必须忽略当前系统时间和随机顺序；测试时钟由 fixture 提供。任何权重或政策变化必须产生新版本，不能覆盖历史配置。

## 14. Phase 1 接口草案

```text
GET  /api/scenarios
GET  /api/scenarios/:id
POST /api/scenarios/:id/reset
POST /api/decisions
GET  /api/decisions/:id
POST /api/deliveries/:decisionId/events
POST /api/sessions/:id/feedback
GET  /api/sessions/:id/comparison
```

每个决策请求必须携带当前 `sessionPlanId` 和 `sessionPlanRevision`。旧 revision 返回 `STALE_SESSION_PLAN`，不能用过期广告债务或过期频控继续执行。会话规划算法和重规划语义见 [Session Planner Spec v1](SESSION_PLANNER_SPEC_V1.md)。

接口返回统一的错误结构：

```json
{
  "error": {
    "code": "INVALID_DECISION_REQUEST",
    "message": "scene.intensity must be between 0 and 1",
    "request_id": "req-..."
  }
}
```

## 15. 实现纪律

- 决策领域逻辑不得依赖 React 组件；
- AI provider 不得被 `policy-engine` 或 `ranker` 直接调用；
- 金额/价格若以后加入，使用整数最小货币单位或明确的模拟归一值；
- 事件为追加写入，统计是事件投影而非手工改计数器；
- 时间、排序和浮点精度在测试中固定；
- 所有原因码、指标来源和版本进入 API 契约测试。

详细行为断言见 [Acceptance Tests v1](ACCEPTANCE_TESTS_V1.md)。
