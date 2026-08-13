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
  const nominalTime = analysis.candidateBreaks
    .slice()
    .sort((left, right) => left.timeSec - right.timeSec)[0]?.timeSec
    ?? request.scenario.nominalOpportunitySec;
  const maxDeferral = Math.max(...request.campaigns.map((campaign) => campaign.maxDeferralSec));
  request.scenario.durationSec = analysis.media.durationSec;
  request.scenario.nominalOpportunitySec = nominalTime;
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

  const nominalSegment = segmentAt(analysis, nominalTime);
  const nominalCandidate = analysis.candidateBreaks.find((candidate) => Math.abs(candidate.timeSec - nominalTime) <= 1);
  const nominalRecommendation = consensus?.nominal.recommendation
    ?? nominalCandidate?.recommendation
    ?? "uncertain";
  const nominalConfidence = consensus?.nominal.confidenceMin
    ?? nominalCandidate?.confidence
    ?? 0;

  if (!safeBreak) {
    request.scenario.safeOpportunitySec = analysis.media.durationSec;
    const blockedSignals = analysis.candidateBreaks
      .filter((candidate) =>
        candidate.timeSec >= nominalTime
        && candidate.timeSec - nominalTime <= maxDeferral)
      .map((candidate) => {
        const segment = segmentAt(analysis, candidate.timeSec);
        return {
          timeSec: candidate.timeSec,
          label: candidate.label,
          tension: segment?.narrativeIntensity ?? 0.9,
          transition: false,
          protectedContext: false,
          opportunity: candidate.timeSec === nominalTime ? "midroll" as const : "boundary" as const,
          modelRecommendation: candidate.recommendation,
          modelConfidence: candidate.confidence,
          modelAgreement: 1,
        };
      });
    request.scenario.sceneSignals = blockedSignals.length > 0 ? blockedSignals : [{
      timeSec: nominalTime,
      label: nominalSegment?.label ?? "未找到安全中断窗口",
      tension: nominalSegment?.narrativeIntensity ?? 0.9,
      transition: false,
      protectedContext: false,
      opportunity: "midroll",
      modelRecommendation: nominalRecommendation,
      modelConfidence: nominalConfidence,
      modelAgreement: consensus?.nominal.agreement ?? 1,
    }];
    return DecisionRequestSchema.parse(request);
  }

  const safeSegment = segmentAt(analysis, safeBreak.timeSec);
  request.scenario.safeOpportunitySec = safeBreak.timeSec;
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
