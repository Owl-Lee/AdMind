import type { DecisionRequest } from "@admind/contracts";

const shared = {
  deliveryMode: "consolidated" as const,
  scenario: {
    id: "S1",
    title: "机器人战斗高潮 × 保量游戏广告",
    episodeTitle: "《CHARGE》节选（Blender Studio，CC BY 4.0）",
    durationSec: 89.5,
    nominalOpportunitySec: 45,
    safeOpportunitySec: 82,
    viewerSegment: "长视频动作内容用户",
    sceneSignals: [
      {
        timeSec: 45,
        label: "机器人近身战斗",
        tension: 0.96,
        transition: false,
        protectedContext: false,
        opportunity: "midroll" as const,
      },
      {
        timeSec: 82,
        label: "角色离场与燃烧空镜",
        tension: 0.12,
        transition: true,
        protectedContext: false,
        opportunity: "boundary" as const,
      },
    ],
  },
  campaigns: [
    {
      id: "cmp-aurora-game",
      name: "保量游戏广告（真实截图案例）",
      guaranteed: true,
      eligible: true,
      bidCpm: 96,
      relevance: 0.31,
      remainingImpressions: 18420,
      maxDeferralSec: 40,
      creatives: [
        {
          id: "creative-15s-fullscreen",
          name: "15 秒全屏主素材（真实截图）",
          durationSec: 15,
          format: "fullscreen" as const,
          approved: true,
          muted: false,
          productCategory: "game",
          interactionRisk: 0.58,
        },
        {
          id: "creative-6s-muted",
          name: "6 秒静音转场卡片（同素材重排）",
          durationSec: 6,
          format: "muted_card" as const,
          approved: true,
          muted: true,
          productCategory: "game",
          interactionRisk: 0.08,
        },
        {
          id: "creative-unapproved",
          name: "实验版素材（未审核）",
          durationSec: 6,
          format: "lower_third" as const,
          approved: false,
          muted: true,
          productCategory: "game",
          interactionRisk: 0.12,
        },
      ],
    },
  ],
  policy: {
    consentForPersonalization: true,
    frequencyCount: 1,
    frequencyCap: 3,
    userIsNavigating: false,
    allowedFormats: ["fullscreen", "muted_card", "pause_card", "lower_third"] as const,
  },
};

export function createS1Request(
  strategy: DecisionRequest["strategy"] = "admind",
): DecisionRequest {
  return {
    ...shared,
    strategy,
    policy: {
      ...shared.policy,
      allowedFormats: [...shared.policy.allowedFormats],
    },
    campaigns: shared.campaigns.map((campaign) => ({
      ...campaign,
      creatives: campaign.creatives.map((creative) => ({ ...creative })),
    })),
    scenario: {
      ...shared.scenario,
      sceneSignals: shared.scenario.sceneSignals.map((signal) => ({ ...signal })),
    },
  };
}

const pauseScenario = {
  deliveryMode: "consolidated" as const,
  scenario: {
    id: "S2",
    title: "稳定暂停状态 × 保量游戏广告",
    episodeTitle: "《CHARGE》细节查看场景",
    durationSec: 89.5,
    nominalOpportunitySec: 27,
    safeOpportunitySec: 35,
    viewerSegment: "长视频主动暂停用户",
    sceneSignals: [
      {
        timeSec: 27,
        label: "页面可见、未拖动的稳定暂停",
        tension: 0.4,
        transition: false,
        protectedContext: false,
        opportunity: "pause" as const,
      },
      {
        timeSec: 35,
        label: "下一章节自然边界",
        tension: 0.2,
        transition: true,
        protectedContext: false,
        opportunity: "boundary" as const,
      },
    ],
  },
  campaigns: [
    {
      id: "cmp-aurora-game-pause",
      name: "保量游戏广告（真实截图案例）",
      guaranteed: true,
      eligible: true,
      bidCpm: 72,
      relevance: 0.31,
      remainingImpressions: 6240,
      maxDeferralSec: 12,
      creatives: [
        {
          id: "game-10s-fullscreen",
          name: "10 秒全屏游戏广告",
          durationSec: 10,
          format: "fullscreen" as const,
          approved: true,
          muted: false,
          productCategory: "game",
          interactionRisk: 0.82,
        },
        {
          id: "game-6s-pause-card",
          name: "6 秒可关闭静音卡片",
          durationSec: 6,
          format: "pause_card" as const,
          approved: true,
          muted: true,
          productCategory: "game",
          interactionRisk: 0.04,
        },
        {
          id: "game-6s-boundary-card",
          name: "6 秒章节边界卡片",
          durationSec: 6,
          format: "muted_card" as const,
          approved: true,
          muted: true,
          productCategory: "game",
          interactionRisk: 0.08,
        },
      ],
    },
  ],
  policy: {
    consentForPersonalization: false,
    frequencyCount: 0,
    frequencyCap: 3,
    userIsNavigating: false,
    allowedFormats: ["fullscreen", "muted_card", "pause_card"] as const,
  },
};

export function createS2Request(
  strategy: DecisionRequest["strategy"] = "admind",
): DecisionRequest {
  return {
    ...pauseScenario,
    strategy,
    policy: {
      ...pauseScenario.policy,
      allowedFormats: [...pauseScenario.policy.allowedFormats],
    },
    campaigns: pauseScenario.campaigns.map((campaign) => ({
      ...campaign,
      creatives: campaign.creatives.map((creative) => ({ ...creative })),
    })),
    scenario: {
      ...pauseScenario.scenario,
      sceneSignals: pauseScenario.scenario.sceneSignals.map((signal) => ({ ...signal })),
    },
  };
}

const protectedScenario = {
  deliveryMode: "consolidated" as const,
  scenario: {
    id: "S3",
    title: "真实海上救援 × 高价保量广告",
    episodeTitle: "美国海岸警卫队飓风救援实拍（Public Domain）",
    durationSec: 40,
    nominalOpportunitySec: 5,
    safeOpportunitySec: 40,
    viewerSegment: "长视频纪实内容用户",
    sceneSignals: [
      {
        timeSec: 5,
        label: "海上救援正在进行",
        tension: 0.95,
        transition: false,
        protectedContext: true,
        opportunity: "protected" as const,
        modelRecommendation: "block" as const,
        modelConfidence: 0.95,
        modelAgreement: 1,
      },
      {
        timeSec: 40,
        label: "救援完成，片段结束",
        tension: 0.1,
        transition: true,
        protectedContext: false,
        opportunity: "boundary" as const,
        modelRecommendation: "allow" as const,
        modelConfidence: 0.9,
        modelAgreement: 1,
      },
    ],
  },
  campaigns: [
    {
      id: "cmp-premium-guaranteed",
      name: "高价保量游戏活动",
      guaranteed: true,
      eligible: true,
      bidCpm: 180,
      relevance: 0.33,
      remainingImpressions: 25800,
      maxDeferralSec: 35,
      creatives: [
        {
          id: "premium-15s-fullscreen",
          name: "15 秒全屏游戏广告",
          durationSec: 15,
          format: "fullscreen" as const,
          approved: true,
          muted: false,
          productCategory: "game",
          interactionRisk: 0.64,
        },
      ],
    },
  ],
  policy: {
    consentForPersonalization: false,
    frequencyCount: 0,
    frequencyCap: 3,
    userIsNavigating: false,
    allowedFormats: ["fullscreen"] as const,
  },
};

export function createS3Request(
  strategy: DecisionRequest["strategy"] = "admind",
): DecisionRequest {
  return {
    ...protectedScenario,
    strategy,
    policy: {
      ...protectedScenario.policy,
      allowedFormats: [...protectedScenario.policy.allowedFormats],
    },
    campaigns: protectedScenario.campaigns.map((campaign) => ({
      ...campaign,
      creatives: campaign.creatives.map((creative) => ({ ...creative })),
    })),
    scenario: {
      ...protectedScenario.scenario,
      sceneSignals: protectedScenario.scenario.sceneSignals.map((signal) => ({ ...signal })),
    },
  };
}
