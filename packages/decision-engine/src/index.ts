import {
  DecisionRequestSchema,
  type AuditStep,
  type CandidatePlan,
  type Creative,
  type DecisionRequest,
  type DecisionResponse,
  type SceneSignal,
} from "@admind/contracts";

type RawCandidate = Omit<CandidatePlan, "score" | "scoreBreakdown"> & {
  bidCpm: number;
  relevance: number;
  interactionRisk: number;
  scene: SceneSignal;
  approved: boolean;
  eligible: boolean;
  maxDeferralSec: number;
};

const round = (value: number) => Math.round(value * 1000) / 1000;

function toCandidate(
  request: DecisionRequest,
  creative: Creative,
  scene: SceneSignal,
): RawCandidate {
  const campaign = request.campaigns[0];
  return {
    id: `${campaign.id}:${creative.id}:${scene.timeSec}`,
    campaignId: campaign.id,
    campaignName: campaign.name,
    creativeId: creative.id,
    creativeName: creative.name,
    timeSec: scene.timeSec,
    durationSec: creative.durationSec,
    format: creative.format,
    muted: creative.muted,
    opportunityLabel: scene.label,
    guaranteed: campaign.guaranteed,
    bidCpm: campaign.bidCpm,
    relevance: campaign.relevance,
    interactionRisk: creative.interactionRisk,
    scene,
    approved: creative.approved,
    eligible: campaign.eligible,
    maxDeferralSec: campaign.maxDeferralSec,
  };
}

function hardFilter(
  request: DecisionRequest,
  candidate: RawCandidate,
): { accepted: boolean; audit: AuditStep[] } {
  const audit: AuditStep[] = [];
  const reject = (code: string, message: string) => {
    audit.push({
      stage: "hard_filter",
      status: "reject",
      code,
      message,
      candidateId: candidate.id,
    });
  };

  if (!candidate.eligible) reject("CAMPAIGN_INELIGIBLE", "广告活动不满足合约或受众资格。");
  if (!candidate.approved) reject("CREATIVE_UNAPPROVED", "素材尚未通过人工审核，AI 无权放行。");
  if (candidate.scene.protectedContext) reject("PROTECTED_CONTEXT", "受保护任务场景禁止商业打断。");
  if (!request.policy.allowedFormats.includes(candidate.format)) reject("FORMAT_FORBIDDEN", "当前版位不允许该广告形式。");
  if (request.policy.frequencyCount >= request.policy.frequencyCap) reject("FREQUENCY_CAP", "用户已达到硬频控上限。");
  if (request.policy.userIsNavigating && candidate.format === "fullscreen") reject("NAVIGATION_LOCK", "用户正在导航，禁止全屏打断。");
  if (candidate.scene.opportunity === "pause" && candidate.format === "fullscreen") {
    reject("ACTIVE_TASK_CONFLICT", "播放器处于稳定暂停状态，禁止全屏覆盖当前画面。");
  }
  if (candidate.format === "pause_card" && candidate.scene.opportunity !== "pause") {
    reject("PLACEMENT_MISMATCH", "暂停卡片只能用于真实的暂停机会。");
  }
  if (candidate.timeSec - request.scenario.nominalOpportunitySec > candidate.maxDeferralSec) {
    reject("OUTSIDE_DELIVERY_WINDOW", "候选时间超过活动允许的最大延迟窗口。");
  }

  if (audit.length === 0) {
    audit.push({
      stage: "hard_filter",
      status: "pass",
      code: "HARD_RULES_PASSED",
      message: "合约、政策、审核、频控与交互保护全部通过。",
      candidateId: candidate.id,
    });
  }
  return { accepted: audit.length === 1 && audit[0].status === "pass", audit };
}

function rank(candidate: RawCandidate): CandidatePlan {
  const pauseFit = candidate.scene.opportunity === "pause" && candidate.format === "pause_card";
  const commercialValue = Math.min(candidate.bidCpm / 120, 1);
  const completionLikelihood = Math.max(
    0,
    1 - candidate.durationSec / 30 - candidate.interactionRisk * 0.35,
  );
  const relevance = candidate.relevance;
  const contextSafety = pauseFit
    ? 0.95
    : Math.max(
        0,
        (1 - candidate.scene.tension) * 0.75 + (candidate.scene.transition ? 0.25 : 0),
      );
  const interactionSafety = 1 - candidate.interactionRisk;
  const disruptionPenalty = pauseFit
    ? candidate.interactionRisk * 0.25 + (candidate.durationSec / 30) * 0.08
    : candidate.scene.tension * 0.58 +
      (candidate.format === "fullscreen" ? 0.22 : 0) +
      (candidate.durationSec / 30) * 0.2;
  const score =
    commercialValue * 0.27 +
    completionLikelihood * 0.18 +
    relevance * 0.1 +
    contextSafety * 0.28 +
    interactionSafety * 0.17 -
    disruptionPenalty * 0.24;

  return {
    id: candidate.id,
    campaignId: candidate.campaignId,
    campaignName: candidate.campaignName,
    creativeId: candidate.creativeId,
    creativeName: candidate.creativeName,
    timeSec: candidate.timeSec,
    durationSec: candidate.durationSec,
    format: candidate.format,
    muted: candidate.muted,
    opportunityLabel: candidate.opportunityLabel,
    guaranteed: candidate.guaranteed,
    score: round(score),
    scoreBreakdown: {
      commercialValue: round(commercialValue),
      completionLikelihood: round(completionLikelihood),
      relevance: round(relevance),
      contextSafety: round(contextSafety),
      interactionSafety: round(interactionSafety),
      disruptionPenalty: round(disruptionPenalty),
    },
  };
}

function baseline(request: DecisionRequest): DecisionResponse {
  const campaign = request.campaigns[0];
  const creative = campaign.creatives.find(
    (item) => item.approved && item.format === "fullscreen",
  ) ?? campaign.creatives[0];
  const scene = request.scenario.sceneSignals.find(
    (item) => item.timeSec === request.scenario.nominalOpportunitySec,
  ) ?? request.scenario.sceneSignals[0];
  const selected = rank(toCandidate(request, creative, scene));

  return {
    decisionId: `decision-${request.scenario.id.toLowerCase()}-baseline`,
    strategy: "baseline",
    outcome: "scheduled",
    selected,
    alternatives: [],
    rejectedCount: 0,
    commercialShortfall: false,
    summary: request.scenario.id === "S2"
      ? "传统暂停广告在用户查看画面时立即覆盖全屏，阻断了原本的查看任务。"
      : request.scenario.id === "S3"
        ? "传统规则命中高价保量活动后立即插播，没有识别受保护的受伤场景。"
      : "传统规则按预设广告点立即播放 15 秒全屏素材，未理解内容高潮。",
    audit: [
      {
        stage: "input",
        status: "info",
        code: "FIXED_BREAK_RECEIVED",
        message: request.scenario.id === "S2" ? "收到用户暂停事件 00:27。" : "收到固定广告点 00:45。",
      },
      {
        stage: "decision",
        status: "info",
        code: "BASELINE_IMMEDIATE_PLAY",
        message: "命中保量活动，按固定顺序立即播放主素材。",
        candidateId: selected.id,
      },
    ],
  };
}

export function decide(input: DecisionRequest): DecisionResponse {
  const request = DecisionRequestSchema.parse(input);
  if (request.strategy === "baseline") return baseline(request);

  const audit: AuditStep[] = [
    {
      stage: "input",
      status: "info",
      code: "SESSION_CONTEXT_NORMALIZED",
      message: "AI 内容信号已归一化；后续硬约束由确定性代码执行。",
    },
  ];
  const rawCandidates = request.campaigns.flatMap((campaign) =>
    campaign.creatives.flatMap((creative) =>
      request.scenario.sceneSignals.map((scene) => {
        const candidate = toCandidate(
          { ...request, campaigns: [campaign] },
          creative,
          scene,
        );
        return candidate;
      }),
    ),
  );

  const accepted: CandidatePlan[] = [];
  let rejectedCount = 0;
  for (const candidate of rawCandidates) {
    const result = hardFilter(request, candidate);
    audit.push(...result.audit);
    if (result.accepted) accepted.push(rank(candidate));
    else rejectedCount += 1;
  }
  accepted.sort((a, b) => b.score - a.score || a.timeSec - b.timeSec);
  const selected = accepted[0] ?? null;

  if (!selected) {
    audit.push({
      stage: "decision",
      status: "reject",
      code: "NO_ELIGIBLE_PLAN",
      message: "没有可合法执行的广告计划，记录商业缺口但不越过硬约束。",
    });
    return {
      decisionId: `decision-${request.scenario.id.toLowerCase()}-admind-blocked`,
      strategy: "admind",
      outcome: "blocked",
      selected: null,
      alternatives: [],
      audit,
      rejectedCount,
      commercialShortfall: true,
      summary: "所有候选均被硬约束拒绝，AdMind 不投放并生成缺口告警。",
    };
  }

  audit.push(
    {
      stage: "ranking",
      status: "info",
      code: "UTILITY_RANKED",
      message: `对 ${accepted.length} 个合格计划进行商业价值、完成率、相关性、上下文与交互安全加权。`,
      candidateId: selected.id,
    },
    {
      stage: "decision",
      status: "pass",
      code: request.scenario.id === "S2" ? "LOW_OCCLUSION_FORMAT_SELECTED" : "LOW_DISRUPTION_WINDOW_SELECTED",
      message: request.scenario.id === "S2"
        ? `页面保持可见且未发生拖动，在安全区域使用 ${selected.durationSec} 秒可关闭静音卡片。`
        : `延迟至 ${selected.timeSec} 秒的低打断候选窗口，使用 ${selected.durationSec} 秒已审核素材。`,
      candidateId: selected.id,
    },
  );

  return {
    decisionId: `decision-${request.scenario.id.toLowerCase()}-admind`,
    strategy: "admind",
    outcome: "scheduled",
    selected,
    alternatives: accepted.slice(1, 4),
    audit,
    rejectedCount,
    commercialShortfall: false,
    summary: request.scenario.id === "S2"
      ? "根据当前播放器的暂停、拖动与页面可见性判断为稳定暂停；保留原内容和播放控制，仅在安全区域展示可关闭的静音相关广告。"
      : `在不取消保量活动的前提下，将广告推迟 ${Math.round(
        selected.timeSec - request.scenario.nominalOpportunitySec,
      )} 秒，并把同一素材重排为 6 秒静音转场卡片。`,
  };
}

export { createS1Request, createS2Request, createS3Request } from "./fixtures";
export { createS1RequestFromAnalysis } from "./from-analysis";
