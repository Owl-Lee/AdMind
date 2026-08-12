import type { DecisionRequest } from "@admind/contracts";

const shared = {
  deliveryMode: "consolidated" as const,
  scenario: {
    id: "S1",
    title: "高潮场景 × 保量游戏广告",
    episodeTitle: "《临界追踪》· 第 7 集（原创演示内容）",
    durationSec: 90,
    nominalOpportunitySec: 45,
    safeOpportunitySec: 55,
    viewerSegment: "长视频悬疑内容用户",
    sceneSignals: [
      {
        timeSec: 45,
        label: "追逐高潮",
        tension: 0.96,
        transition: false,
        protectedContext: false,
      },
      {
        timeSec: 55,
        label: "镜头转场",
        tension: 0.24,
        transition: true,
        protectedContext: false,
      },
    ],
  },
  campaigns: [
    {
      id: "cmp-aurora-game",
      name: "极昼边境（虚构品牌）",
      guaranteed: true,
      eligible: true,
      bidCpm: 96,
      relevance: 0.31,
      remainingImpressions: 18420,
      creatives: [
        {
          id: "creative-15s-fullscreen",
          name: "15 秒全屏主素材",
          durationSec: 15,
          format: "fullscreen" as const,
          approved: true,
          muted: false,
          productCategory: "game",
          interactionRisk: 0.58,
        },
        {
          id: "creative-6s-muted",
          name: "6 秒静音转场版",
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
