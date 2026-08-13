import {
  AnalysisConsensusSchema,
  type AnalysisConsensus,
  type BreakRecommendation,
  type CandidateBreak,
  type VideoAnalysis,
} from "@admind/contracts";

function confidenceRange(items: CandidateBreak[]) {
  const values = items.map((item) => item.confidence);
  return { confidenceMin: Math.min(...values), confidenceMax: Math.max(...values) };
}

function agreement(items: CandidateBreak[], runCount: number) {
  const counts = new Map<BreakRecommendation, number>();
  for (const item of items) counts.set(item.recommendation, (counts.get(item.recommendation) ?? 0) + 1);
  return Math.max(0, ...counts.values()) / runCount;
}

function fallbackForRun(
  analysis: VideoAnalysis,
  nominalOpportunitySec: number,
  deadlineSec: number,
) {
  const candidates = analysis.candidateBreaks.filter((item) =>
    item.timeSec > nominalOpportunitySec
    && item.timeSec <= deadlineSec
    && item.recommendation !== "block");
  return candidates
    .filter((item) => item.recommendation === "allow")
    .sort((left, right) => left.timeSec - right.timeSec || right.confidence - left.confidence)[0]
    ?? candidates
      .filter((item) => item.recommendation === "delay")
      .sort((left, right) => right.timeSec - left.timeSec || right.confidence - left.confidence)[0]
    ?? candidates[0];
}

export function aggregateAnalyses(input: {
  analyses: VideoAnalysis[];
  nominalOpportunitySec: number;
  maxDeferralSec: number;
  timestampToleranceSec?: number;
}): AnalysisConsensus {
  if (input.analyses.length < 2) throw new Error("At least two analyses are required for consensus.");
  const [first] = input.analyses;
  if (input.analyses.some((item) => item.provider !== first.provider || item.model !== first.model || item.media.sha256 !== first.media.sha256)) {
    throw new Error("Consensus runs must use the same provider, model, and media hash.");
  }

  const deadlineSec = Math.min(first.media.durationSec, input.nominalOpportunitySec + input.maxDeferralSec);
  const nominalItems = input.analyses.map((analysis) =>
    analysis.candidateBreaks
      .filter((item) => Math.abs(item.timeSec - input.nominalOpportunitySec) <= 1)
      .sort((left, right) => Math.abs(left.timeSec - input.nominalOpportunitySec) - Math.abs(right.timeSec - input.nominalOpportunitySec))[0])
    .filter((item): item is CandidateBreak => Boolean(item));
  const nominalStable = nominalItems.length === input.analyses.length
    && nominalItems.every((item) => item.recommendation === nominalItems[0].recommendation);
  const nominalRecommendation = nominalStable ? nominalItems[0].recommendation : "uncertain";
  const nominalConfidence = nominalItems.length ? confidenceRange(nominalItems) : { confidenceMin: 0, confidenceMax: 0 };

  const fallbacks = input.analyses
    .map((analysis) => fallbackForRun(analysis, input.nominalOpportunitySec, deadlineSec))
    .filter((item): item is CandidateBreak => Boolean(item));
  const tolerance = input.timestampToleranceSec ?? 3;
  const fallbackStable = fallbacks.length === input.analyses.length
    && fallbacks.every((item) => item.recommendation === fallbacks[0].recommendation)
    && Math.max(...fallbacks.map((item) => item.timeSec)) - Math.min(...fallbacks.map((item) => item.timeSec)) <= tolerance;
  const fallbackTime = fallbacks.length
    ? Math.round(fallbacks.map((item) => item.timeSec).sort((a, b) => a - b)[Math.floor(fallbacks.length / 2)] * 10) / 10
    : deadlineSec;
  const fallbackConfidence = fallbacks.length ? confidenceRange(fallbacks) : { confidenceMin: 0, confidenceMax: 0 };

  return AnalysisConsensusSchema.parse({
    schemaVersion: "1.0",
    provider: first.provider,
    model: first.model,
    runCount: input.analyses.length,
    mediaSha256: first.media.sha256,
    nominalOpportunitySec: input.nominalOpportunitySec,
    deadlineSec,
    nominal: {
      recommendation: nominalRecommendation,
      timeSec: input.nominalOpportunitySec,
      agreement: nominalItems.length ? agreement(nominalItems, input.analyses.length) : 0,
      ...nominalConfidence,
      evidenceLabels: nominalItems.map((item) => item.label),
    },
    fallback: fallbacks.length ? {
      recommendation: fallbackStable ? fallbacks[0].recommendation : "uncertain",
      timeSec: fallbackTime,
      agreement: agreement(fallbacks, input.analyses.length),
      ...fallbackConfidence,
      evidenceLabels: fallbacks.map((item) => item.label),
    } : null,
    status: nominalStable && fallbackStable ? "stable" : "uncertain",
    limitations: [...new Set(input.analyses.flatMap((analysis) => analysis.limitations))],
  });
}
