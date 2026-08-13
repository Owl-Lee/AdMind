import { describe, expect, it } from "vitest";
import { buildAnalysis, parseJsonPayload } from "./normalize";

const payload = {
  segments: [{
    id: "segment-1",
    startSec: 0,
    endSec: 8,
    label: "Opening",
    description: "A quiet opening shot.",
    narrativeIntensity: 0.2,
    emotionalIntensity: 0.15,
    narrativeCriticality: 0.2,
    interruptionRisk: 0.18,
    interruptionRiskCategories: [],
    motionIntensity: 0.1,
    audioIntensity: 0.2,
    dialogueActive: false,
    transitionConfidence: 0.8,
    sensitiveCategories: [],
    confidence: 0.9,
  }],
  candidateBreaks: [{
    timeSec: 8,
    label: "Natural cut",
    recommendation: "allow" as const,
    reasons: ["The opening shot has ended."],
    confidence: 0.86,
    sourceSegmentIds: ["segment-1"],
  }],
  limitations: ["No transcript was available."],
};

describe("video analyzer normalization", () => {
  it("extracts JSON from a fenced model response", () => {
    expect(parseJsonPayload(`\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``)).toEqual(payload);
  });

  it("builds a validated provider-neutral analysis", () => {
    const analysis = buildAnalysis({
      provider: "gemini",
      model: "test-model",
      fileName: "test.mp4",
      durationSec: 8,
      sha256: "a".repeat(64),
      payload,
    });
    expect(analysis.mode).toBe("live");
    expect(analysis.candidateBreaks[0].recommendation).toBe("allow");
  });
});
