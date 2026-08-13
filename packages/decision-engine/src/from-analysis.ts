import {
  DecisionRequestSchema,
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
): DecisionRequest {
  const request = createS1Request(strategy);
  const nominalTime = request.scenario.nominalOpportunitySec;
  const maxDeferral = Math.max(...request.campaigns.map((campaign) => campaign.maxDeferralSec));
  const executableBreaks = analysis.candidateBreaks
    .filter((candidate) =>
      candidate.recommendation !== "block"
      && candidate.timeSec >= nominalTime
      && candidate.timeSec - nominalTime <= maxDeferral)
  const safeBreak = executableBreaks
    .filter((candidate) => candidate.recommendation === "allow")
    .sort((left, right) => left.timeSec - right.timeSec || right.confidence - left.confidence)[0]
    ?? executableBreaks
      .filter((candidate) => candidate.recommendation === "delay")
      .sort((left, right) => right.timeSec - left.timeSec || right.confidence - left.confidence)[0];

  if (!safeBreak) return request;

  const nominalSegment = segmentAt(analysis, nominalTime);
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
    },
    {
      timeSec: safeBreak.timeSec,
      label: safeBreak.label,
      tension: safeSegment?.narrativeIntensity ?? 0.25,
      transition: true,
      protectedContext: false,
      opportunity: "boundary",
    },
  ];

  return DecisionRequestSchema.parse(request);
}
