# AdMind 会话广告规划器规格 v1

**定位：** 在播放开始/场景加载时生成整场广告计划；实时决策引擎在每个机会重新验证并执行或重规划。  
**Phase 1 边界：** 对单个模拟观看会话使用透明、确定性的启发式，不解决生产级全站库存分配。

---

## 1. 为什么需要这一层

只优化当前一个机会，可能得到每一步都“局部合理”、整场却反复打断的结果。会话规划器回答：

- 预计这场内容需要承担多少广告负荷；
- 哪些合同必须在本会话的合格机会中预留；
- 广告集中成一个广告段还是分散到多个安全转场；
- 每个广告段最多多长，品牌之间怎样分隔；
- 当观众跳过内容、拖动进度、退出或真实曝光与计划不同时，怎样重规划。

它输出的是可审计的计划，不是对未来播放行为的保证。

## 2. 两层职责

| 层 | 决定 | 不负责 |
|---|---|---|
| Session Planner | 广告段数量/时间窗、预留活动、最大负荷、剩余广告债务、集中/分散偏好 | 在未来时刻提前认定某素材一定合格或计为曝光 |
| Real-time Orchestrator | 当前完整方案、硬规则复检、形式/版本、展示/延后/撤下/无方案 | 静默改变整场承诺或突破广告段/安全上限 |

实时层永远拥有最终安全否决权。计划中的预留活动在实际时刻仍可能因敏感场景、频控、同意撤回、素材失效或交互状态而不可投。

## 3. 输入

```ts
type SessionPlanRequest = {
  sessionId: string;
  contentId: string;
  expectedStartMs: number;
  expectedEndMs: number;
  sceneTimeline: SceneWindow[];
  opportunities: AdOpportunity[];
  campaigns: CampaignSnapshot[];
  existingExposures: ExposureCounters;
  viewerPreference: {
    schedule: "CONSOLIDATED" | "DISTRIBUTED_SAFE_WINDOWS" | "NO_PREFERENCE";
    source: "EXPLICIT" | "DEFAULT";
  };
  policy: {
    maxTotalAdMs: number;
    maxPodMs: number;
    maxPods: number;
    minimumContentMsBetweenPods: number;
  };
  versions: PlanInputVersions;
};
```

`expectedEndMs` 不是观看承诺；用户可能快进或提前离开，因此计划必须暴露对这些假设的依赖。

## 4. 输出

```ts
type SessionAdPlan = {
  id: string;
  revision: number;
  status: "ACTIVE" | "SUPERSEDED" | "COMPLETED" | "INFEASIBLE";
  preferenceRequested: SchedulePreference;
  preferenceApplied: SchedulePreference;
  pods: PlannedAdPod[];
  reservations: CampaignReservation[];
  totalPlannedAdMs: number;
  remainingAdDebt: AdDebt[];
  risks: PlanRisk[];
  assumptions: PlanAssumption[];
  reasonCodes: PlanReasonCode[];
  versions: PlanInputVersions;
};
```

```ts
type PlannedAdPod = {
  id: string;
  earliestAtMs: number;
  preferredAtMs: number;
  latestAtMs: number;
  maxDurationMs: number;
  reservedCampaignIds: string[];
  allowedFormats: AdFormat[];
  status: "PLANNED" | "EXECUTED" | "PARTIAL" | "SKIPPED";
};
```

`CampaignReservation` 只表示为一个活动预留机会，不等于已经交付，也不锁定尚未复检的具体素材。

## 5. 规划硬约束

- 所有广告段必须位于内容和机会允许范围；
- 受保护场景不能成为强广告段；
- `totalPlannedAdMs <= maxTotalAdMs`；
- 单广告段不超过 `maxPodMs`；
- 广告段数量不超过 `maxPods`；
- 相邻广告段之间满足最小内容时长；
- 活动版位、时间窗、品牌间隔和硬频控必须在预测时可行；
- 只预留至少有一个已审批素材版本的活动；
- 集中偏好不能把不可拼接素材、冲突品牌或不兼容版位强塞进同一广告段；
- 任何无法安全分配的保证量压力进入 `remainingAdDebt` 和风险列表，不隐藏。

## 6. v1 确定性规划算法

### 6.1 生成安全窗口

1. 从 `AdOpportunity` 生成允许窗口；
2. 排除 `PROTECTED` 场景；
3. 根据自然转场、任务紧迫性、对话/字幕连续性计算窗口安全成本；
4. 按安全成本、时间和 ID 稳定排序；
5. 合并彼此重叠且形式兼容的窗口。

### 6.2 估算本会话广告债务

对每个活动计算：

```text
sessionReservationNeed =
  min(
    eligibleOpportunityCapacity,
    configuredSessionContribution × deliveryShortfallPressure
  )
```

这是演示用分配参数，不声称等于生产系统的 pacing 算法。竞价/固定价/补量活动没有“必须完成”的债务，可作为剩余安全容量的候选。

### 6.3 应用观看偏好

`CONSOLIDATED`：

1. 优先选择足够安全且容量最大的一个窗口；
2. 在 `maxPodMs` 内安排互相兼容的活动/版本；
3. 超出的债务再分配到下一个安全窗口并明确“无法完全集中”的原因；
4. 不承诺本场结束前绝无其他广告，除非所有当前可知债务均已安全分配且 UI 显示假设。

`DISTRIBUTED_SAFE_WINDOWS`：

1. 在安全窗口间分配，避免相邻广告段过近；
2. 每段优先更短的已审批版本；
3. 平衡品牌重复和合同截止风险。

`NO_PREFERENCE`：

使用产品默认 `DISTRIBUTED_SAFE_WINDOWS`，但在 UI 明确标为默认而不是用户选择。

### 6.4 预留顺序

硬规则合格后，按以下稳定顺序处理活动：

1. 保证量短缺成本与截止压力；
2. 当前会话对履约的可行贡献；
3. 模拟商业价值；
4. 品牌疲劳预测；
5. 活动 ID。

该顺序用于预留，不替代实时层对完整方案的多目标排序。

## 7. 重规划触发器

以下事件会生成新 revision，旧计划改为 `SUPERSEDED`：

- `viewer.schedule_preference_changed`；
- `player.seek_started` 或跳过计划广告段；
- `session.expected_end_changed`；
- `impression.viewable` / `creative.dismissed` 导致债务或频次变化；
- `viewer.feedback_submitted` 改变后续资格/软成本；
- 当前计划广告段返回 `NO_ELIGIBLE_PLAN`；
- 活动暂停、结束或素材审批状态变化；
- 个性化同意撤回；
- 场景人工修正为受保护状态。

页面进入后台或用户准备返回主页面时，实时层先保护当前交互；只有当它使未来计划失效时才重规划，避免每个小动作都产生无意义版本。

## 8. 交互状态契约

Phase 1 通过播放器可观察事件建模，而不是推断用户心理：

```ts
type InteractionState = {
  taskMode:
    | "PASSIVE_VIEWING"
    | "INSPECTING_FRAME"
    | "READING_OVERLAY_CONTENT"
    | "SEEKING"
    | "NAVIGATING_AWAY"
    | "BACKGROUND"
    | "UNKNOWN";
  activeControls: ("PLAYBACK" | "SEEK_BAR" | "COMMENTS" | "BACK" | "CLOSE")[];
  lastExplicitAction: string;
  changedAtMs: number;
  confidence: number;
  origin: "OBSERVED_EVENT" | "HEURISTIC";
};
```

安全响应矩阵：

| 状态 | 强全屏 | 低遮挡卡片 | 系统行为 |
|---|---|---|---|
| `PASSIVE_VIEWING` | 仅在计划安全窗口可选 | 可选 | 正常实时排序 |
| `INSPECTING_FRAME` | 禁止覆盖 | 仅安全区域 | 保留原帧和控件 |
| `READING_OVERLAY_CONTENT` | 禁止 | 不得挡弹幕/评论区域 | 无安全区域则撤下/延后 |
| `SEEKING` | 禁止新启强广告 | 撤下非必要卡片 | 完成拖动后重新计算机会 |
| `NAVIGATING_AWAY` | 禁止新启 | 撤下未计费卡片 | 不劫持返回操作 |
| `BACKGROUND` | 不启动 | 不累计可视 | 等回到前台后重新验证 |
| `UNKNOWN` | 保守处理 | 仅明确安全区域 | 不生成自信的意图解释 |

## 9. 跳转归因与误触定义

每次广告跳转必须携带：

```ts
type NavigationIntent = {
  deliveryId: string;
  sourceElementId: string;
  action: "POINTER_UP" | "KEYBOARD_ACTIVATE";
  explicitCta: true;
  occurredAt: string;
};
```

没有有效 `NavigationIntent` 的广告落地页打开记为 `unintended_navigation`，属于 P0 缺陷。关闭控件、播放器控件、拖动条和广告 CTA 的命中区域不得重叠；返回后必须按场景策略恢复内容时间、暂停/播放状态及可恢复 UI。

## 10. 会话计划 UI

播放器上方/下方展示：

- 内容总时长和计划广告段；
- 每段时间窗而不是虚假精确的“必定在 55.000 秒”；
- 当前计划总广告时长；
- 观众请求的偏好与实际应用的偏好；
- 保证量预留、未分配广告债务和风险；
- 重规划次数和每次原因；
- `模拟计划` 标识。

UI 不得暗示用户选择“一次看完”就能覆盖未知的未来直播插单或真实平台政策；Demo 只承诺当前模拟场景的可知输入。

## 11. 事件

```text
session.plan_requested
session.plan_created
session.plan_activated
viewer.schedule_preference_changed (optional)
session.replan_requested (0..n)
session.plan_superseded (0..n)
session.plan_completed | session.plan_infeasible
player.seek_started | player.seek_completed
player.navigation_away_started
ad.navigation_intent_recorded
ad.navigation_opened
ad.unintended_navigation_detected (must remain zero)
```

所有计划事件包含 plan ID、revision、触发事件、输入版本和 `simulated` 来源。

## 12. API 草案

```text
POST /api/session-plans
GET  /api/session-plans/:id
POST /api/session-plans/:id/replan
POST /api/sessions/:id/schedule-preference
GET  /api/sessions/:id/plan-comparison
```

实时 `/api/decisions` 请求必须包含 active plan ID/revision；若 revision 过期，返回 `STALE_SESSION_PLAN` 并要求获取新版本，避免依据旧债务执行。

## 13. 完成定义

- 相同输入和版本生成相同计划；
- 集中和分散偏好产生可解释的不同计划；
- 偏好永远不能突破受保护场景、最大广告段或频控；
- 快进越过计划广告段后生成新 revision；
- 已完成可视曝光从广告债务扣除且只扣一次；
- 实时层否决预留时，不把预留计成交付；
- 计划和实际结果可以逐项对账；
- 非预期跳转和必要控件阻塞均为零。
