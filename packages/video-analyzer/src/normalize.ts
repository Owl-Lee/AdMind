import {
  VideoAnalysisSchema,
  type AnalysisProvider,
  type VideoAnalysis,
} from "@admind/contracts";

type ModelPayload = Pick<VideoAnalysis, "segments" | "candidateBreaks" | "limitations">;

export function parseJsonPayload(raw: string): ModelPayload {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Analyzer response did not contain a JSON object.");
  const parsed = JSON.parse(candidate.slice(start, end + 1));
  return {
    segments: parsed.segments,
    candidateBreaks: parsed.candidateBreaks ?? [],
    limitations: parsed.limitations ?? [],
  };
}

export function buildAnalysis(input: {
  provider: AnalysisProvider;
  model: string;
  fileName: string;
  durationSec: number;
  sha256: string;
  payload: ModelPayload;
}): VideoAnalysis {
  return VideoAnalysisSchema.parse({
    schemaVersion: "1.0",
    analysisId: `${input.provider}-${input.sha256.slice(0, 12)}`,
    provider: input.provider,
    mode: "live",
    model: input.model,
    generatedAt: new Date().toISOString(),
    media: {
      fileName: input.fileName,
      durationSec: input.durationSec,
      sha256: input.sha256,
    },
    ...input.payload,
  });
}
