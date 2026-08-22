import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import baselineJson from "../../evaluation/s2/baselines/v0.2.7.json";
import manifestJson from "../../evaluation/s2/manifest.json";
import { PAUSE_VISION_CONFIG } from "./face-detector";
import { choosePauseAdPlacement } from "./pause-decision";
import type { RegressionManifest, RegressionPrediction, RegressionProvenance, RegressionReport } from "./pause-regression";
import { intersectionOverUnion, scoreVisionRegression, validateRegressionManifest, validateRegressionPredictions } from "./pause-regression";

const manifest = manifestJson as RegressionManifest;
const baseline = baselineJson as unknown as RegressionReport;
const provenanceFixture: RegressionProvenance = {
  runner: { appVersion: "test", gitCommit: "fixture", platform: "vitest" },
  configurationReference: { appVersion: "0.2.7", gitCommit: "bdf66d1db7511f97feba49713f9995ea6ef13711" },
  input: { kind: "fixed-jpeg", width: 1280, height: 720 },
  vision: PAUSE_VISION_CONFIG,
};

function jpegDimensions(bytes: Buffer) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("invalid JPEG marker");
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += length + 2;
  }
  throw new Error("JPEG dimensions not found");
}

function perfectPredictions(): RegressionPrediction[] {
  return manifest.samples.map((sample) => ({
    sampleId: sample.id,
    status: "ready",
    placement: sample.expectedAction === "defer" ? "none" : sample.acceptablePlacements[0],
    targets: sample.protectionTargets.map((target) => ({
      ...target.rect,
      confidence: 1,
      kind: "subject" as const,
      label: target.kind,
      source: "ground-truth-fixture",
    })),
    assessments: [],
    inferenceMs: 10,
    message: "fixture",
  }));
}

describe("S2 fixed-frame regression scorer", () => {
  it("accepts the tracked manifest", () => {
    expect(validateRegressionManifest(manifest)).toEqual([]);
    expect(manifest.samples).toHaveLength(20);
    expect(manifest.samples.filter((sample) => sample.reviewStatus === "rule-confirmed")).toHaveLength(13);
  });

  it("locks the source, models and every 1280x720 regression frame to tracked bytes", () => {
    expect(createHash("sha256").update(readFileSync(manifest.source.asset)).digest("hex")).toBe(manifest.source.sha256);
    expect(createHash("sha256").update(readFileSync(PAUSE_VISION_CONFIG.faceModel.path.replace(/^\//, "public/"))).digest("hex"))
      .toBe(PAUSE_VISION_CONFIG.faceModel.sha256);
    expect(createHash("sha256").update(readFileSync(PAUSE_VISION_CONFIG.objectModel.path.replace(/^\//, "public/"))).digest("hex"))
      .toBe(PAUSE_VISION_CONFIG.objectModel.sha256);
    for (const sample of manifest.samples) {
      const framePath = resolve("public", sample.frame.replace(/^\//, ""));
      const bytes = readFileSync(framePath);
      const digest = createHash("sha256").update(bytes).digest("hex");
      expect(digest, sample.id).toBe(sample.frameSha256);
      expect(jpegDimensions(bytes), sample.id).toEqual({ width: manifest.source.width, height: manifest.source.height });
    }
  });

  it("recomputes the tracked v0.2.7 baseline from raw predictions", () => {
    expect(validateRegressionPredictions(manifest, baseline.predictions)).toEqual([]);
    const recomputed = scoreVisionRegression(manifest, baseline.predictions, {
      generatedAt: baseline.generatedAt,
      provenance: baseline.provenance,
    });
    expect(recomputed.metrics).toEqual(baseline.metrics);
    expect(recomputed.failures).toEqual(baseline.failures);
  });

  it("replays the current placement policy from raw baseline targets", () => {
    const replayed = baseline.predictions.map((prediction) => {
      const decision = prediction.status === "ready"
        ? choosePauseAdPlacement(prediction.targets)
        : { placement: "none" as const, assessments: [] };
      return { ...prediction, placement: decision.placement, assessments: decision.assessments };
    });
    expect(replayed.map((prediction) => prediction.placement))
      .toEqual(baseline.predictions.map((prediction) => prediction.placement));
  });

  it("keeps the current placement policy aligned with every rule-locked draft label", () => {
    for (const sample of manifest.samples.filter((item) => item.reviewStatus === "rule-confirmed")) {
      const decision = choosePauseAdPlacement(sample.protectionTargets.map((target) => target.rect));
      expect(sample.acceptablePlacements, sample.id).toContain(decision.placement);
    }
  });

  it("matches normalized targets by intersection over union", () => {
    expect(intersectionOverUnion(
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0, width: 0.5, height: 0.5 },
    )).toBe(1);
    expect(intersectionOverUnion(
      { x: 0, y: 0, width: 0.25, height: 0.25 },
      { x: 0.75, y: 0.75, width: 0.25, height: 0.25 },
    )).toBe(0);
  });

  it("scores a perfect fixture without unsafe placements or missed targets", () => {
    const report = scoreVisionRegression(manifest, perfectPredictions(), {
      generatedAt: "2026-08-21T00:00:00.000Z",
      provenance: provenanceFixture,
    });
    expect(report.metrics.safePlacementHitRate).toBe(1);
    expect(report.metrics.unsafePlacementRate).toBe(0);
    expect(report.metrics.overDeferralRate).toBe(0);
    expect(report.metrics.targetPrecision).toBe(1);
    expect(report.metrics.targetRecall).toBe(1);
    expect(report.failures).toEqual([]);
  });

  it("keeps samples awaiting review out of blocking metrics", () => {
    const predictions = perfectPredictions();
    const diagnostic = manifest.samples.find((sample) => sample.reviewStatus === "needs-user-review");
    expect(diagnostic).toBeDefined();
    const result = predictions.find((prediction) => prediction.sampleId === diagnostic?.id);
    if (result) {
      result.placement = "bottom-right";
      result.targets = [];
    }
    const report = scoreVisionRegression(manifest, predictions, {
      generatedAt: "2026-08-21T00:00:00.000Z",
      provenance: provenanceFixture,
    });
    expect(report.metrics.safePlacementHitRate).toBe(1);
    expect(report.failures).toEqual([]);
  });

  it("separates unsafe delivery from conservative deferral", () => {
    const predictions = perfectPredictions();
    const blocking = manifest.samples.filter((sample) => sample.reviewStatus === "rule-confirmed" && sample.expectedAction === "show-card");
    predictions.find((prediction) => prediction.sampleId === blocking[0]?.id)!.placement = "bottom-right";
    predictions.find((prediction) => prediction.sampleId === blocking[1]?.id)!.placement = "none";
    const report = scoreVisionRegression(manifest, predictions, {
      generatedAt: "2026-08-21T00:00:00.000Z",
      provenance: provenanceFixture,
    });
    expect(report.metrics.unsafePlacementCount).toBe(1);
    expect(report.metrics.overDeferralCount).toBe(1);
    expect(report.failures.map((failure) => failure.kind)).toContain("unsafe-placement");
    expect(report.failures.map((failure) => failure.kind)).toContain("over-deferral");
  });

  it("counts unavailable inference as a failed blocking agreement", () => {
    const predictions = perfectPredictions();
    const sample = manifest.samples.find((item) => item.reviewStatus === "rule-confirmed")!;
    const prediction = predictions.find((item) => item.sampleId === sample.id)!;
    prediction.status = "unavailable";
    prediction.placement = "none";
    prediction.targets = [];
    const report = scoreVisionRegression(manifest, predictions, {
      generatedAt: "2026-08-21T00:00:00.000Z",
      provenance: provenanceFixture,
    });
    expect(report.metrics.unavailableCount).toBe(1);
    expect(report.metrics.availableSampleCount).toBe(19);
    expect(report.metrics.safePlacementHitRate).toBe(12 / 13);
    expect(report.failures.map((failure) => failure.kind)).toContain("unavailable");
  });
});
