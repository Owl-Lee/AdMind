import { describe, expect, it } from "vitest";
import baselineJson from "../../evaluation/s2/baselines/v0.2.7.json";
import candidateJson from "../../evaluation/s2/candidates/v0.4.0.json";
import manifestJson from "../../evaluation/s2/manifest.json";
import sourceReviewJson from "../../evaluation/s2/reviews/2026-08-22-product-owner.json";
import {
  buildProtectionCalibrationExport,
  confirmPlacementResolution,
  confirmProtectionCalibration,
  createProtectionCalibrationWorkspace,
  setPlacementResolutionNote,
  setProtectionCalibrationNote,
  type ProtectionCalibrationSeed,
  type S2ReviewExport,
  type S2ReviewExportV2,
} from "./pause-review";
import type { RegressionManifest, RegressionReport } from "./pause-regression";
import { validateRegressionManifest } from "./pause-regression";
import {
  S2_CALIBRATION_DRAFTS,
  S2_PLACEMENT_RESOLUTION,
  S2_SOURCE_REVIEW,
} from "./s2-calibration-seed";
import {
  buildReviewedManifestPreview,
  intakeS2ReviewedCalibration,
  rescoreReviewedManifestPreview,
} from "./s2-review-intake";

const manifest = manifestJson as RegressionManifest;
const sourceReview = sourceReviewJson as S2ReviewExport;
const candidate = candidateJson as unknown as RegressionReport;
const baseline = baselineJson as unknown as RegressionReport;
const seed: ProtectionCalibrationSeed = {
  suggestions: S2_CALIBRATION_DRAFTS,
  placementResolutions: S2_PLACEMENT_RESOLUTION,
};
const calibrationArtifactSha256 = "a".repeat(64);

function completedCalibrationArtifact() {
  let workspace = createProtectionCalibrationWorkspace(manifest, sourceReview, seed);
  for (const draft of S2_CALIBRATION_DRAFTS) {
    workspace = setProtectionCalibrationNote(workspace, draft.sampleId, draft.rationaleZh);
    workspace = confirmProtectionCalibration(workspace, draft.sampleId, "2026-08-22T12:00:00.000Z");
  }
  for (const sampleId of Object.keys(S2_PLACEMENT_RESOLUTION)) {
    workspace = setPlacementResolutionNote(workspace, sampleId, `Resolved ${sampleId}.`);
    workspace = confirmPlacementResolution(workspace, sampleId, "2026-08-22T12:01:00.000Z");
  }
  return buildProtectionCalibrationExport(manifest, sourceReview, workspace, {
    appVersion: "0.4.1",
    gitCommit: "test",
    generatedAt: "2026-08-22T12:02:00.000Z",
    seed,
    sourceReviewSha256: S2_SOURCE_REVIEW.sha256,
  });
}

function previewInput(calibrationArtifact: unknown = completedCalibrationArtifact()) {
  return {
    manifest,
    sourceReview,
    sourceReviewSha256: S2_SOURCE_REVIEW.sha256,
    calibrationSeed: seed,
    calibrationArtifact,
    calibrationArtifactSha256,
  };
}

describe("S2 schema-v2 review intake", () => {
  it("returns explicit pending states instead of inventing missing human input", () => {
    const missingArtifact = buildReviewedManifestPreview({
      manifest,
      sourceReview,
      sourceReviewSha256: S2_SOURCE_REVIEW.sha256,
      calibrationSeed: seed,
    });
    expect(missingArtifact).toEqual({
      status: "pending",
      stage: "review-intake",
      pending: ["calibration-artifact-missing"],
      pendingSampleIds: [],
    });

    const preview = buildReviewedManifestPreview(previewInput());
    expect(preview.status).toBe("ready");
    if (preview.status !== "ready") return;
    expect(rescoreReviewedManifestPreview(manifest, preview.preview, undefined)).toMatchObject({
      status: "pending",
      stage: "rescoring",
      pending: ["raw-predictions-missing"],
    });
  });

  it("keeps a valid partial calibration pending and rejects tampered v2 input", () => {
    let workspace = createProtectionCalibrationWorkspace(manifest, sourceReview, seed);
    workspace = setProtectionCalibrationNote(workspace, "charge-005", "Still partial.");
    workspace = confirmProtectionCalibration(workspace, "charge-005", "2026-08-22T12:00:00.000Z");
    const partial = buildProtectionCalibrationExport(manifest, sourceReview, workspace, {
      appVersion: "0.4.1",
      gitCommit: "test",
      generatedAt: "2026-08-22T12:02:00.000Z",
      seed,
      sourceReviewSha256: S2_SOURCE_REVIEW.sha256,
    });
    const pending = buildReviewedManifestPreview(previewInput(partial));
    expect(pending.status).toBe("pending");
    expect(pending).toMatchObject({ pending: ["calibration-artifact-incomplete"] });
    if (pending.status === "pending") expect(pending.pendingSampleIds.length).toBeGreaterThan(0);

    const tampered = structuredClone(completedCalibrationArtifact());
    tampered.reviews[0].originalDraftSignature = "tampered";
    const invalid = buildReviewedManifestPreview(previewInput(tampered));
    expect(invalid.status).toBe("invalid");
    if (invalid.status === "invalid") {
      expect(invalid.issues).toContain("charge-005: originalDraftSignature does not match");
    }
  });

  it("generates a preview without mutating or overwriting the tracked manifest", () => {
    const original = structuredClone(manifest);
    const result = buildReviewedManifestPreview(previewInput());
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const { preview } = result;
    expect(manifest).toEqual(original);
    expect(preview.previewOnly).toBe(true);
    expect(preview.manifest).not.toBe(manifest);
    expect(preview.manifest.datasetId).toBe("s2-charge-fixed-v1-product-reviewed-v2-preview");
    expect(preview.humanReviewedSampleIds).toHaveLength(13);
    expect(preview.pendingHumanReviewSampleIds).toEqual([
      "charge-001",
      "charge-004",
      "charge-006",
      "charge-007",
      "charge-012",
      "charge-017",
      "charge-020",
    ]);
    expect(preview.appliedTargetSampleIds).toHaveLength(8);
    expect(preview.appliedPlacementSampleIds).toEqual(["charge-005", "charge-008", "charge-009"]);
    expect(preview.calibrationArtifact.sha256).toBe(calibrationArtifactSha256);
    expect(preview.manifest.samples.filter((sample) => sample.reviewStatus === "rule-confirmed").map((sample) => sample.id))
      .toEqual(preview.humanReviewedSampleIds);
    expect(validateRegressionManifest(preview.manifest)).toEqual([]);

    const charge005 = preview.manifest.samples.find((sample) => sample.id === "charge-005")!;
    const charge008 = preview.manifest.samples.find((sample) => sample.id === "charge-008")!;
    const charge009 = preview.manifest.samples.find((sample) => sample.id === "charge-009")!;
    expect(charge005.protectionTargets).toEqual(S2_CALIBRATION_DRAFTS[0].replacementProtectionTargets);
    expect(charge005.acceptablePlacements).toEqual(["top-left", "top-right"]);
    expect(charge008.protectionTargets).toEqual([]);
    expect(charge008.acceptablePlacements).toEqual(["top-left", "top-right"]);
    expect(charge009.protectionTargets).toEqual(manifest.samples.find((sample) => sample.id === "charge-009")?.protectionTargets);
    expect(charge009.acceptablePlacements).toEqual(["top-left", "top-right"]);

    const overwriteAttempt = buildReviewedManifestPreview({
      ...previewInput(),
      previewDatasetId: manifest.datasetId,
    });
    expect(overwriteAttempt).toMatchObject({
      status: "invalid",
      issues: ["previewDatasetId must differ from the tracked manifest datasetId"],
    });
  });

  it.each([
    ["candidate", candidate],
    ["baseline", baseline],
  ])("re-scores the saved %s raw predictions and reports exact before/after deltas", (_name, rawReport) => {
    const rawBefore = structuredClone(rawReport);
    const result = intakeS2ReviewedCalibration({
      ...previewInput(),
      rawPredictionReport: rawReport,
      generatedAt: "2026-08-22T13:00:00.000Z",
    });
    expect(result.status).toBe("ready");
    expect(rawReport).toEqual(rawBefore);
    if (result.status !== "ready" || result.stage !== "rescoring") return;
    expect(result.comparison.before.metrics).toEqual(rawReport.metrics);
    expect(result.comparison.before.failures).toEqual(rawReport.failures);
    expect(result.comparison.after.datasetId).toBe(result.preview.manifest.datasetId);
    expect(result.comparison.scoringScope).toMatchObject({
      rawPredictionsReused: true,
      inferenceRerun: false,
      removedBlockingSampleIds: [
        "charge-001",
        "charge-004",
        "charge-006",
        "charge-007",
        "charge-012",
        "charge-017",
        "charge-020",
      ],
    });
    expect(result.comparison.scoringScope.addedBlockingSampleIds).toEqual([
      "charge-003",
      "charge-009",
      "charge-010",
      "charge-011",
      "charge-014",
      "charge-015",
      "charge-019",
    ]);
    for (const [metric, delta] of Object.entries(result.comparison.delta)) {
      expect(delta.delta, metric).toBeCloseTo(delta.after - delta.before, 12);
    }
  });

  it("rejects incomplete saved prediction sets", () => {
    const rawReport = structuredClone(candidate);
    rawReport.predictions.pop();
    const result = intakeS2ReviewedCalibration({
      ...previewInput(),
      rawPredictionReport: rawReport,
    });
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") expect(result.issues.some((issue) => issue.includes("missing prediction"))).toBe(true);

    const malformed = structuredClone(candidate) as unknown as { predictions: unknown[] };
    malformed.predictions[0] = { sampleId: "charge-001", targets: [null] };
    const malformedResult = intakeS2ReviewedCalibration({
      ...previewInput(),
      rawPredictionReport: malformed,
    });
    expect(malformedResult).toMatchObject({
      status: "invalid",
      issues: ["raw prediction report is invalid"],
    });
  });

  it("does not accept a structurally asserted artifact that is not schema v2", () => {
    const result = buildReviewedManifestPreview(previewInput({ schemaVersion: 1 } as unknown as S2ReviewExportV2));
    expect(result.status).toBe("invalid");
  });

  it("requires and validates the exact-byte calibration artifact SHA-256", () => {
    const missing = buildReviewedManifestPreview({
      ...previewInput(),
      calibrationArtifactSha256: undefined,
    });
    expect(missing).toMatchObject({
      status: "pending",
      pending: ["calibration-artifact-sha256-missing"],
    });

    const invalid = buildReviewedManifestPreview({
      ...previewInput(),
      calibrationArtifactSha256: "not-a-sha",
    });
    expect(invalid).toMatchObject({
      status: "invalid",
      issues: ["calibrationArtifactSha256 is invalid"],
    });
  });
});
