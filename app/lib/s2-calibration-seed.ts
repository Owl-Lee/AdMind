import type { RegressionTarget } from "./pause-regression";

export const S2_SOURCE_REVIEW = {
  path: "evaluation/s2/reviews/2026-08-22-product-owner.json",
  sha256: "a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256",
  generatedAt: "2026-08-22T04:10:38.781Z",
} as const;

export type CalibrationDraft = {
  sampleId: string;
  replacementProtectionTargets: RegressionTarget[];
  acceptablePlacements: Array<"top-left" | "top-right">;
  rationale: string;
  rationaleZh: string;
  boundary: string;
  boundaryZh: string;
};

export const S2_CALIBRATION_DRAFTS: CalibrationDraft[] = [
  {
    sampleId: "charge-005",
    replacementProtectionTargets: [
      { id: "person-1", kind: "person", required: true, rect: { x: 0.3, y: 0.23, width: 0.4, height: 0.65 } },
    ],
    acceptablePlacements: ["top-left", "top-right"],
    rationale: "Center the protected character and keep both upper corners available.",
    rationaleZh: "把保护人物改到画面中央，同时保留两个上角。",
    boundary: "The far-left forearm is outside this tight subject box.",
    boundaryZh: "紧框不会包含最左侧伸出的前臂。",
  },
  {
    sampleId: "charge-008",
    replacementProtectionTargets: [],
    acceptablePlacements: ["top-left", "top-right"],
    rationale: "Treat the isolated visual effect as a negative target and allow either card corner.",
    rationaleZh: "把单独特效作为无保护目标的负样本，两个上角都允许卡片。",
    boundary: "This does not add a new full-screen ad format; it only resolves the current card contract.",
    boundaryZh: "本轮不会新增全屏广告形式，只裁决当前卡片位置合同。",
  },
  {
    sampleId: "charge-011",
    replacementProtectionTargets: [
      { id: "person-1", kind: "person", required: true, rect: { x: 0.2, y: 0.21, width: 0.4, height: 0.67 } },
    ],
    acceptablePlacements: ["top-left", "top-right"],
    rationale: "Keep the central person and remove the broad draft over machinery and empty space.",
    rationaleZh: "保留中央人物，删除覆盖机械和空白区域的宽泛初标。",
    boundary: "The right-side mechanical arm is treated as non-critical.",
    boundaryZh: "右侧机械臂暂按非关键内容处理。",
  },
  {
    sampleId: "charge-013",
    replacementProtectionTargets: [
      { id: "character-1", kind: "robot-character", required: true, rect: { x: 0.36, y: 0.21, width: 0.31, height: 0.66 } },
    ],
    acceptablePlacements: ["top-left", "top-right"],
    rationale: "Move the robot target from the left into a tight central body box.",
    rationaleZh: "把偏左的机器人框移到中央，并收紧到核心躯干。",
    boundary: "The extended arms are not fully enclosed by this core-character box.",
    boundaryZh: "这个核心角色框不会完整包住横向展开的双臂。",
  },
  {
    sampleId: "charge-015",
    replacementProtectionTargets: [
      { id: "person-1", kind: "person", required: true, rect: { x: 0.29, y: 0.22, width: 0.48, height: 0.65 } },
    ],
    acceptablePlacements: ["top-left", "top-right"],
    rationale: "Tighten around the central person and remove the incorrect left-side robot draft.",
    rationaleZh: "收紧中央人物框，并删除左侧错误的机器人初标。",
    boundary: "The left foreground machinery is treated as non-critical.",
    boundaryZh: "左侧前景机械暂按非关键内容处理。",
  },
  {
    sampleId: "charge-016",
    replacementProtectionTargets: [
      { id: "face-1", kind: "face", required: true, rect: { x: 0.39, y: 0.3, width: 0.29, height: 0.5 } },
    ],
    acceptablePlacements: ["top-left", "top-right"],
    rationale: "Replace the half-person draft with a centered face target, following the product note.",
    rationaleZh: "按照产品备注，用居中的脸部目标替换只框半边人的旧框。",
    boundary: "If the full hat silhouette must be protected, top-right should be removed.",
    boundaryZh: "如果帽子轮廓也必须完整保护，就应取消右上角。",
  },
  {
    sampleId: "charge-018",
    replacementProtectionTargets: [
      { id: "person-1", kind: "person", required: true, rect: { x: 0.38, y: 0.25, width: 0.2, height: 0.62 } },
    ],
    acceptablePlacements: ["top-left", "top-right"],
    rationale: "Move the partial right-side box onto the complete small central person.",
    rationaleZh: "把右侧残缺框移到中央较小人物的完整主体上。",
    boundary: "The box intentionally stays tight around the visible person.",
    boundaryZh: "该框有意紧贴可见人物，不额外吞入背景。",
  },
  {
    sampleId: "charge-019",
    replacementProtectionTargets: [
      { id: "person-1", kind: "person", required: true, rect: { x: 0.4, y: 0.35, width: 0.16, height: 0.52 } },
    ],
    acceptablePlacements: ["top-left", "top-right"],
    rationale: "Replace the wide right-shifted draft with a tight box around the small central person.",
    rationaleZh: "用紧贴中央小人物的框替换偏右、过宽的旧框。",
    boundary: "Both upper corners remain available under the current 0.30 × 0.30 card footprint.",
    boundaryZh: "按当前 0.30 × 0.30 卡片占位，两个上角仍可使用。",
  },
];

export const S2_PLACEMENT_RESOLUTION = {
  "charge-005": { acceptablePlacements: ["top-left", "top-right"], preferredPlacement: null },
  "charge-008": { acceptablePlacements: ["top-left", "top-right"], preferredPlacement: null },
  "charge-009": { acceptablePlacements: ["top-left", "top-right"], preferredPlacement: "top-left" },
} as const;
