# AdMind Phase 1 验收测试 v1

**用途：** 产品、设计、开发和测试共同使用的完成定义  
**规则：** 只有通过 P0 条件才算完成纵向闭环；页面能打开不等于功能完成。

---

## 1. 测试层级

| 层级 | 目标 | 推荐实现 |
|---|---|---|
| Domain unit | 公式、频控、候选生成、理由码 | TypeScript unit tests |
| Policy unit | 硬规则永不被排序权重覆盖 | table-driven tests |
| API contract | Schema、错误、版本和事件语义 | integration tests |
| Deterministic fixture | 三场景的预期决定可重放 | snapshot + explicit assertions |
| Browser E2E | 播放、广告、关闭、恢复和对比 | Playwright |
| Accessibility | 键盘、焦点、标签、对比度、点击区域 | axe + manual checks |

## 2. P0 场景验收

### AT-S1-01 高潮处不立即打断

**Given** S1 在 45 秒产生中插机会，当前场景强度 0.94、自然转场 0.05，C1 履约紧急度 0.92  
**When** AdMind 处理该机会  
**Then** 不能在 45 秒选择 C1 的 15 秒全屏版本  
**And** 该方案作为未入选的合格备选保留分项分数  
**And** 最终决定包含 `HIGH_INTERRUPTION_NOW`  
**And** 入选方案位于允许延迟范围内。

### AT-S1-02 保持保证量活动可行

**Given** C1 仍满足受众、频控、版位和合同条件  
**When** 82 秒存在自然转场，且仍位于 40 秒最大延迟窗口内  
**Then** 入选活动仍为 C1  
**And** 入选素材是已审批 6 秒版本  
**And** action 为 `DEFER`  
**And** 理由包含 `COMMERCIAL_DELIVERY_URGENT` 与 `SAFE_TRANSITION_PREFERRED`。

### AT-S1-03 不伪造个性化

**Given** 当前只有 T0 内容上下文且与游戏语义关系弱  
**When** 系统解释 S1 决定  
**Then** 解释包含商业履约依据  
**And** 不出现“你喜欢游戏/为你精准推荐”等个人断言  
**And** 显示证据等级为 `T0_CONTEXTUAL`。

### AT-S1-04 超出延迟窗口不可投

**Given** 唯一安全转场晚于 `latestAtMs`  
**When** 生成投放方案  
**Then** 该方案以 `OUTSIDE_DELIVERY_WINDOW` 淘汰  
**And** 系统选择其他合格方案或返回 `NO_ELIGIBLE_PLAN`  
**And** 保证量活动产生短缺风险提醒。

### AT-S2-01 查看型暂停保留画面

**Given** S2 在 27 秒暂停，分类为 `INSPECTION` 且置信度 0.91  
**When** AdMind 处理暂停广告机会  
**Then** 不选择覆盖画面的 10 秒全屏版本  
**And** 选择已审批、可关闭的低遮挡卡片  
**And** 原视频帧和播放控件仍可见。

### AT-S2-02 卡片不遮挡关键区域

**Given** 左上、中央和左下为关键内容/控件区域，右上为安全区域  
**When** 卡片渲染  
**Then** 卡片边界完全位于允许区域  
**And** 关闭控件可见、可聚焦  
**And** 不使用整卡隐式跳转覆盖关闭控件。

### AT-S2-03 没有安全区域时延后

**Given** 所有允许区域均与字幕或控件冲突  
**When** AdMind 生成候选  
**Then** 卡片方案以 `NO_SAFE_RENDER_REGION` 淘汰  
**And** 系统尝试 35 秒章节边界  
**And** 不自动退回暂停霸屏。

### AT-S2-04 关闭后位置保持

**Given** 观众在 27 秒暂停并关闭卡片  
**When** 观众继续播放  
**Then** 内容从 27 秒（允许播放器误差范围内）恢复  
**And** 产生 `creative.dismissed` 与 `content.resumed` 事件  
**And** 不打开新页面。

### AT-S3-01 商业权重不能突破敏感规则

**Given** S3 场景为人工确认的 `PROTECTED_HEALTH_TASK`，C1 履约紧急度和商业价值均设为 1.00  
**When** 任意正向排序权重提高到允许上限  
**Then** 全屏、覆盖、自动音频和跳转方案仍全部以 `PROTECTED_CONTEXT` 淘汰  
**And** 当前关键流程返回 `NO_ELIGIBLE_PLAN`。

### AT-S3-02 禁止利用敏感语境定向

**Given** 候选活动试图使用健康内容推断个人需求  
**When** 进行政策检查  
**Then** 以 `SENSITIVE_TARGETING_PROHIBITED` 淘汰  
**And** 该证据不进入 `contextualUtility`  
**And** 决策审计保留淘汰原因但不存储真实病情。

### AT-S3-03 无方案必须报警且不计曝光

**Given** 当前没有合格形式  
**When** 返回 `NO_ELIGIBLE_PLAN`  
**Then** 写入 `delivery.skipped` 或 `delivery.deferred`  
**And** 产生 `DELIVERY_SHORTFALL_RISK`  
**And** 不写入 `impression.viewable`  
**And** 合同交付计数保持不变。

### AT-R1-01 跨形式品牌硬频控

**Given** 同一会话中某品牌已通过片头和中插低遮挡卡产生 2 次可视曝光，品牌硬上限为 2  
**When** 后续机会考虑该品牌任意素材和形式  
**Then** 所有该品牌方案以 `BRAND_FREQUENCY_CAP_REACHED` 淘汰  
**And** 更换素材 ID 不得绕过品牌上限。

### AT-R2-01 主动拖动时不启动或保留干扰广告

**Given** S2 卡片可见前，用户按下并开始拖动进度条  
**When** interaction state 变为 `SEEKING`  
**Then** 卡片撤下且不产生 `impression.viewable`  
**And** 不启动新的全屏广告  
**And** 拖动结束后基于新播放位置重新计算机会。

### AT-R2-02 弹幕/评论区域成为必要区域

**Given** 用户打开并正在阅读弹幕/评论层  
**When** 候选卡片与该区域重叠  
**Then** 该方案以 `ESSENTIAL_CONTROL_BLOCKED` 或 `NO_SAFE_RENDER_REGION` 淘汰  
**And** 系统移到不重叠区域或延后。

### AT-R2-03 返回操作不能被广告劫持

**Given** 用户触发应用返回/主页面操作  
**When** 交互状态变为 `NAVIGATING_AWAY`  
**Then** 系统不启动新广告  
**And** 返回操作不记录为广告点击  
**And** 未达可视阈值的卡片撤下。

### AT-R2-04 广告跳转必须有明确意图

**Given** 广告有一个明确 CTA，关闭控件、进度条和播放器区域与 CTA 热区不重叠  
**When** 打开落地页  
**Then** 同一 delivery 必须存在更早且有效的 `ad.navigation_intent_recorded`  
**And** source element 是 CTA  
**And** 没有意图记录的打开产生 `ad.unintended_navigation_detected` 并使测试失败。

### AT-R2-05 返回后恢复任务状态

**Given** 用户从明确 CTA 进入广告落地页  
**When** 返回播放器  
**Then** 恢复原 content ID、允许误差内的时间位置和播放/暂停状态  
**And** 恢复可恢复的弹幕/评论状态  
**And** 不重复计可视曝光。

### AT-R3-01 集中偏好受硬上限约束

**Given** 用户选择 `CONSOLIDATED` 且已知广告债务超过 `maxPodMs`  
**When** 生成会话计划  
**Then** 单广告段不超过上限  
**And** 超出部分进入第二安全窗口或 `remainingAdDebt`  
**And** UI 显示无法完全集中的原因。

### AT-R3-02 分散计划保持安全间隔

**Given** 用户选择 `DISTRIBUTED_SAFE_WINDOWS`  
**When** 生成会话计划  
**Then** 广告段位于安全窗口  
**And** 相邻广告段满足最小内容间隔  
**And** 不安排在高潮/受保护窗口。

### AT-R3-03 偏好不能突破合同与政策

**Given** 集中或分散偏好与素材版位、竞争品牌分隔、频控或受保护规则冲突  
**When** 规划器应用偏好  
**Then** 硬约束优先  
**And** `preferenceApplied` 与请求不一致时记录理由  
**And** 不把无法安全分配的债务隐藏为已满足。

### AT-R3-04 快进越过广告段触发版本化重规划

**Given** active plan revision 1 在 240 秒有计划广告段  
**When** 用户快进到 300 秒  
**Then** revision 1 标记 `SUPERSEDED`  
**And** 生成 revision 2 或返回 `INFEASIBLE`  
**And** 旧 revision 的实时决定返回 `STALE_SESSION_PLAN`。

### AT-R3-05 计划预留不等于曝光

**Given** 活动被预留到未来广告段  
**When** 广告段尚未执行或实时层否决该方案  
**Then** 不增加 requested/delivered/viewable 计数  
**And** 债务只在满足定义的真实事件后扣减。

## 3. P0 决策与数据验收

### AT-D-01 确定性重放

相同规范化请求、场景/政策/排序/分析版本连续重放 100 次，action、chosen plan、排序、分项分数和理由码完全相同；仅请求追踪 ID 和写入时间可以不同。

### AT-D-02 输入顺序不影响结果

同一候选集合以不同数组顺序提交，规范化后必须得到同一入选方案与排序。

### AT-D-03 稳定平局处理

两方案主分数相差小于 0.02 时，按 timing feasibility、时间、形式稳定优先级和 ID 顺序决胜；结果不得依赖数据库返回顺序。

### AT-D-04 分数可核对

API 返回十项 `scoreBreakdown` 后，测试可使用当前版本权重独立重算总分，舍入误差不超过既定容差。

### AT-D-05 硬规则在排序之前

违规方案即使商业分最高也不计算总分或明确标为未排序，且不能进入合格 alternatives。

### AT-D-06 未审批素材不可作为替代版本

若活动只有 15 秒版本已审批、6 秒版本为 `PENDING`，系统不得选择或自动生成 6 秒版本，且返回 `CREATIVE_NOT_APPROVED`。

### AT-D-07 无 AI 密钥可完整运行

所有 AI provider 环境变量为空时，Demo 使用预计算分析完成三个场景并显示分析来源，不出现阻塞主流程的凭据错误。

### AT-D-08 低置信度保守回退

AI 场景分析置信度 0.42 且没有人工确认时，系统不得以“低强度”判断放行强打断；使用预计算数据或 `LOW_CONFIDENCE_CONSERVATIVE_FALLBACK`。

### AT-D-09 撤回同意后移除个人证据

T2/T3 证据的 consent 为 `WITHDRAWN` 时，证据不进入相关性计算；依赖该证据的候选以 `CONSENT_REQUIRED` 淘汰，T0 非个性化模式仍可运行。

### AT-D-10 过期证据不可使用

`expiresAt` 早于 fixture 时钟时，证据标记 `EVIDENCE_EXPIRED` 且不影响分数。

## 4. P0 事件与指标验收

### AT-E-01 渲染不等于可视

广告组件已挂载但小于 50% 可见或不足连续 2 秒时，只记录 `creative.rendered`，不记录 `impression.viewable`，不增加可视曝光频次。

### AT-E-02 可视后频次只增加一次

同一 delivery 跨过 2 秒阈值后，无论继续展示或收到多少可见性采样，只产生一次 `impression.viewable`，品牌/活动/素材计数各增加一次。

### AT-E-03 页面后台不累计可视时间

广告渲染 1 秒后页面进入后台 5 秒，再回到前台 1 秒，后台时间不计入，两段非连续 1 秒不能满足连续 2 秒规则。

### AT-E-04 指标来源标签

会话结果中的合同、打断成本、真实点击和用户反馈分别显示 `simulated`、`modelled`、`observed-in-demo`、`user-test`，不得合并为无来源的“AI 效果分”。

### AT-E-05 合同进度来自事件

从事件账本重新构建投影后，活动进度与页面一致；删除或改变缓存投影不能改变事件事实。

## 5. P0 API 验收

### AT-A-01 非法输入返回结构化错误

`scene.intensity = 1.4` 时，POST `/api/decisions` 返回 4xx、`INVALID_DECISION_REQUEST` 和字段路径，且不产生 `decision.made`。

### AT-A-02 决策返回完整审计信息

Decision detail 返回 chosen plan、合格备选、淘汰方案、理由码、分数、证据、版本和指标来源。

### AT-A-03 重复交付事件幂等

客户端重复提交相同 event ID 时，不重复写事件或增加计数，并返回一致的已接收状态。

### AT-A-04 Reset 恢复场景初始状态

场景 reset 后，新会话使用初始 fixture，旧事件保留审计或按文档隔离，新会话决定与初始快照一致。

### AT-A-05 旧会话计划不能执行

决策请求携带的 plan revision 不是 active revision 时，API 返回 `STALE_SESSION_PLAN`，不生成 `decision.made` 或展示事件。

## 6. P0 浏览器与可访问性验收

### AT-UI-01 策略切换使用相同输入

Baseline 与 AdMind 显示相同场景版本、活动集合和会话初始状态；先运行哪一种策略都不能污染另一种策略的计数。

### AT-UI-02 键盘可完成核心流程

仅用键盘可选择场景、播放/暂停、切换策略、关闭广告、打开决策检查器、查看替代方案并返回播放器，焦点顺序与视觉位置一致。

### AT-UI-03 广告身份和控制清晰

所有广告形式都有可感知的“广告”标识；关闭控件有可访问名称和可见焦点，不使用仅靠颜色区分的状态。

### AT-UI-04 不复刻危险小叉

S3 的问题重放可以用示意框说明小关闭按钮的风险，但所有可交互 Demo 广告必须采用合格尺寸和命中区域。

### AT-UI-05 内容恢复可验证

S1 完成广告后在预期边界恢复；S2 关闭暂停卡后保持原暂停位置。浏览器测试允许小范围媒体计时误差，但不能跳过完整对白或关键画面。

### AT-UI-06 错误和回退状态

视频资产缺失、分析不可用或决定 API 失败时，UI 显示具体错误/保守回退，不无限 loading，也不静默展示未经审计的广告。

### AT-UI-07 整场计划与偏好可见

播放器展示计划广告段、预计总广告时长、集中/分散请求与实际应用、剩余债务和计划 revision；所有值标为模拟。

### AT-UI-08 控件热区不重叠

在支持的 viewport 中，广告 CTA、关闭控件、进度条、播放、返回和弹幕/评论控制的交互边界不重叠；浏览器测试验证关闭、拖动和返回均不会打开落地页。

## 7. P1（完整作品集）验收

P1 在 P0 通过后实施：

- 运营人员可创建活动和多个素材版本；
- 非法合同/形式组合在保存前被验证；
- 可视化合同预测来自可解释的模拟库存；
- 操作员可调整安全范围内的软权重，不能关闭硬规则；
- 场景元数据可人工修正并产生新版本；
- 实验可批量比较至少两个策略版本；
- 指标公式有测试并可导出 CSV/JSON；
- 新策略对旧场景重放时能自动发现政策回归；
- 可选 AI 上传失败时仍可回到预计算场景。

## 8. Phase 1 Go / No-Go 清单

### Go

- [ ] AT-S1、AT-S2、AT-S3、AT-R1、AT-R2 和 AT-R3 全部通过；
- [ ] 决策确定性与硬规则测试全部通过；
- [ ] S1 具备端到端浏览器录像/测试；
- [ ] 无 AI 密钥可运行；
- [ ] 事件与频控语义通过；
- [ ] 核心键盘路径通过；
- [ ] 公开资产许可清单完整；
- [ ] 所有效果/商业指标显示来源。

### No-Go

出现任一情况不得对外称为完成：

- 商业权重能突破受保护场景或硬频控；
- 决策无法重放或理由与结果对不上；
- 素材虽渲染但未可视仍被计为交付；
- Demo 强依赖付费 AI 密钥；
- 使用真实平台隐私数据、未授权视频或未经证明的内部机制；
- 将模拟结果表述为真实提升；
- 主要流程只有静态页面，没有从决定到事件/指标的闭环。
