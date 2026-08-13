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
      },
      {
        timeSec: 82,
        label: "角色离场与燃烧空镜",
        tension: 0.12,
        transition: true,
        protectedContext: false,
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
