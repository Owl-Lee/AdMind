import { z } from "zod";

export const StrategySchema = z.enum(["baseline", "admind"]);
export type Strategy = z.infer<typeof StrategySchema>;

export const DeliveryModeSchema = z.enum(["consolidated", "distributed"]);
export type DeliveryMode = z.infer<typeof DeliveryModeSchema>;

export const AdFormatSchema = z.enum([
  "fullscreen",
  "muted_card",
  "pause_card",
  "lower_third",
]);
export type AdFormat = z.infer<typeof AdFormatSchema>;

export const SceneSignalSchema = z.object({
  timeSec: z.number().nonnegative(),
  label: z.string().min(1),
  tension: z.number().min(0).max(1),
  transition: z.boolean(),
  protectedContext: z.boolean(),
});
export type SceneSignal = z.infer<typeof SceneSignalSchema>;

export const ScenarioSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  episodeTitle: z.string().min(1),
  durationSec: z.number().positive(),
  nominalOpportunitySec: z.number().nonnegative(),
  safeOpportunitySec: z.number().nonnegative(),
  viewerSegment: z.string().min(1),
  sceneSignals: z.array(SceneSignalSchema).min(1),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const CreativeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  durationSec: z.number().positive(),
  format: AdFormatSchema,
  approved: z.boolean(),
  muted: z.boolean(),
  productCategory: z.string().min(1),
  interactionRisk: z.number().min(0).max(1),
});
export type Creative = z.infer<typeof CreativeSchema>;

export const CampaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  guaranteed: z.boolean(),
  eligible: z.boolean(),
  bidCpm: z.number().nonnegative(),
  relevance: z.number().min(0).max(1),
  remainingImpressions: z.number().int().nonnegative(),
  creatives: z.array(CreativeSchema).min(1),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const PolicyContextSchema = z.object({
  consentForPersonalization: z.boolean(),
  frequencyCount: z.number().int().nonnegative(),
  frequencyCap: z.number().int().positive(),
  userIsNavigating: z.boolean(),
  allowedFormats: z.array(AdFormatSchema).min(1),
});
export type PolicyContext = z.infer<typeof PolicyContextSchema>;

export const DecisionRequestSchema = z.object({
  strategy: StrategySchema,
  deliveryMode: DeliveryModeSchema,
  scenario: ScenarioSchema,
  campaigns: z.array(CampaignSchema).min(1),
  policy: PolicyContextSchema,
});
export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;

export const CandidatePlanSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  campaignName: z.string(),
  creativeId: z.string(),
  creativeName: z.string(),
  timeSec: z.number().nonnegative(),
  durationSec: z.number().positive(),
  format: AdFormatSchema,
  muted: z.boolean(),
  opportunityLabel: z.string(),
  guaranteed: z.boolean(),
  score: z.number(),
  scoreBreakdown: z.object({
    commercialValue: z.number(),
    completionLikelihood: z.number(),
    relevance: z.number(),
    contextSafety: z.number(),
    interactionSafety: z.number(),
    disruptionPenalty: z.number(),
  }),
});
export type CandidatePlan = z.infer<typeof CandidatePlanSchema>;

export const AuditStepSchema = z.object({
  stage: z.enum(["input", "hard_filter", "ranking", "decision"]),
  status: z.enum(["pass", "reject", "info"]),
  code: z.string(),
  message: z.string(),
  candidateId: z.string().optional(),
});
export type AuditStep = z.infer<typeof AuditStepSchema>;

export const DecisionResponseSchema = z.object({
  decisionId: z.string(),
  strategy: StrategySchema,
  outcome: z.enum(["scheduled", "blocked"]),
  selected: CandidatePlanSchema.nullable(),
  alternatives: z.array(CandidatePlanSchema),
  audit: z.array(AuditStepSchema),
  rejectedCount: z.number().int().nonnegative(),
  summary: z.string(),
  commercialShortfall: z.boolean(),
});
export type DecisionResponse = z.infer<typeof DecisionResponseSchema>;
