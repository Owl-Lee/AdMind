import {
  DecisionRequestSchema,
  type AnalysisConsensus,
  type DecisionRequest,
  type VideoAnalysis,
  type VideoAnalysisSegment,
} from "@admind/contracts";
import { createS1Request, createS3Request } from "./fixtures";

export type ProtectedSourceContext = {
  title: string;
  episodeTitle: string;
  viewerSegment?: string;
  policyReason: string;
  nominalOpportunitySec?: number;
};

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

/**
 * Combines live video-understanding evidence with a verified source classification.
 * The model describes the sequence and interruption risk; the deterministic policy
 * owns the ethical boundary and therefore marks every in-content opportunity as
 * protected. This deliberately avoids asking the model to make the final policy call.
 */
export function createS3RequestFromAnalysis(
  analysis: VideoAnalysis,
  source: ProtectedSourceContext,
  strategy: DecisionRequest["strategy"] = "admind",
): DecisionRequest {
  const request = createS3Request(strategy);
  const nominalTime = source.nominalOpportunitySec
    ?? analysis.candidateBreaks.slice().sort((left, right) => left.timeSec - right.timeSec)[0]?.timeSec
    ?? Math.min(5, analysis.media.durationSec / 4);

  request.scenario = {
    ...request.scenario,
    title: source.title,
    episodeTitle: source.episodeTitle,
    durationSec: analysis.media.durationSec,
    nominalOpportunitySec: nominalTime,
    safeOpportunitySec: analysis.media.durationSec,
    viewerSegment: source.viewerSegment ?? "长视频纪实内容用户",
    sceneSignals: analysis.candidateBreaks
      .filter((candidate) => candidate.timeSec >= nominalTime && candidate.timeSec <= analysis.media.durationSec)
      .sort((left, right) => left.timeSec - right.timeSec)
      .map((candidate) => {
        const segment = segmentAt(analysis, candidate.timeSec);
        return {
          timeSec: candidate.timeSec,
          label: `${source.policyReason} · ${candidate.label}`,
          tension: Math.max(segment?.narrativeIntensity ?? 0, segment?.interruptionRisk ?? 0.5),
          transition: candidate.recommendation === "allow",
          protectedContext: candidate.timeSec < analysis.media.durationSec,
          opportunity: candidate.timeSec < analysis.media.durationSec ? "protected" as const : "boundary" as const,
          modelRecommendation: candidate.recommendation,
          modelConfidence: candidate.confidence,
          modelAgreement: 1,
        };
      }),
  };

  if (request.scenario.sceneSignals.length === 0) {
    const segment = segmentAt(analysis, nominalTime);
    request.scenario.sceneSignals = [{
      timeSec: nominalTime,
      label: `${source.policyReason} · 片段内机会点`,
      tension: Math.max(segment?.narrativeIntensity ?? 0, segment?.interruptionRisk ?? 0.5),
      transition: false,
      protectedContext: true,
      opportunity: "protected",
      modelRecommendation: "uncertain",
      modelConfidence: segment?.confidence ?? 0,
      modelAgreement: 1,
    }];
  }

  request.campaigns = request.campaigns.map((campaign) => ({
    ...campaign,
    maxDeferralSec: Math.max(0, analysis.media.durationSec - nominalTime),
  }));

  return DecisionRequestSchema.parse(request);
}
