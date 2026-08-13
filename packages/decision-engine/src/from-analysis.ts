import {
  DecisionRequestSchema,
  type AnalysisConsensus,
  type DecisionRequest,
  type VideoAnalysis,
  type VideoAnalysisSegment,
} from "@admind/contracts";
import { createS1Request } from "./fixtures";

function segmentAt(analysis: VideoAnalysis, timeSec: number): VideoAnalysisSegment | undefined {
  return analysis.segments.find((segment) => segment.startSec <= timeSec && timeSec < segment.endSec)
    ?? analysis.segments.find((segment) => segment.endSec === timeSec)
    ?? analysis.segments.at(-1);
}

export function createS1RequestFromAnalysis(
  analysis: VideoAnalysis,
  strategy: DecisionRequest["strategy"] = "admind",
  consensus?: AnalysisConsensus,
): DecisionRequest {
  const request = createS1Request(strategy);
  const nominalTime = request.scenario.nominalOpportunitySec;
  const maxDeferral = Math.max(...request.campaigns.map((campaign) => campaign.maxDeferralSec));
  const executableBreaks = analysis.candidateBreaks
    .filter((candidate) =>
      candidate.recommendation !== "block"
      && candidate.timeSec >= nominalTime
      && candidate.timeSec - nominalTime <= maxDeferral);
  const evidenceBreak = executableBreaks
    .filter((candidate) => candidate.recommendation === "allow")
    .sort((left, right) => left.timeSec - right.timeSec || right.confidence - left.confidence)[0]
    ?? executableBreaks
      .filter((candidate) => candidate.recommendation === "delay")
      .sort((left, right) => right.timeSec - left.timeSec || right.confidence - left.confidence)[0];

  const fallback = consensus?.fallback;
  const safeBreak = fallback ? {
    timeSec: fallback.timeSec,
    label: fallback.evidenceLabels[0] ?? "多次分析的延后候选",
    recommendation: fallback.recommendation,
    confidence: fallback.confidenceMin,
  } : evidenceBreak;
  if (!safeBreak) return request;

  const nominalSegment = segmentAt(analysis, nominalTime);
  const safeSegment = segmentAt(analysis, safeBreak.timeSec);
  request.scenario.safeOpportunitySec = safeBreak.timeSec;
  const nominalRecommendation = consensus?.nominal.recommendation
    ?? analysis.candidateBreaks.find((candidate) => Math.abs(candidate.timeSec - nominalTime) <= 1)?.recommendation
    ?? "uncertain";
  const nominalConfidence = consensus?.nominal.confidenceMin
    ?? analysis.candidateBreaks.find((candidate) => Math.abs(candidate.timeSec - nominalTime) <= 1)?.confidence
    ?? 0;
  request.scenario.sceneSignals = [
    {
      timeSec: nominalTime,
      label: nominalSegment?.label ?? "模型识别的高张力区间",
      tension: nominalSegment?.narrativeIntensity ?? 0.9,
      transition: false,
      protectedContext: false,
      opportunity: "midroll",
      modelRecommendation: nominalRecommendation,
      modelConfidence: nominalConfidence,
      modelAgreement: consensus?.nominal.agreement ?? 1,
    },
    {
      timeSec: safeBreak.timeSec,
      label: safeBreak.label,
      tension: safeSegment?.narrativeIntensity ?? 0.25,
      transition: safeBreak.recommendation === "allow",
      protectedContext: false,
      opportunity: "boundary",
      modelRecommendation: safeBreak.recommendation,
      modelConfidence: safeBreak.confidence,
      modelAgreement: consensus?.fallback?.agreement ?? 1,
    },
  ];

  const shortestMutedCard = Math.max(1, Math.floor(request.scenario.durationSec - safeBreak.timeSec));
  if (shortestMutedCard < 6 && shortestMutedCard >= 3) {
    request.campaigns = request.campaigns.map((campaign) => ({
      ...campaign,
      creatives: [...campaign.creatives, {
        id: `creative-${shortestMutedCard}s-end-card`,
        name: `${shortestMutedCard} 秒静音片尾卡片（同素材重排）`,
        durationSec: shortestMutedCard,
        format: "muted_card",
        approved: true,
        muted: true,
        productCategory: "game",
        interactionRisk: 0.05,
      }],
    }));
  }

  return DecisionRequestSchema.parse(request);
}
