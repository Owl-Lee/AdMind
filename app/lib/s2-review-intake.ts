import type { ProtectionCalibrationSeed, S2ReviewExport, S2ReviewExportV2 } from "./pause-review";
import { validateReviewExport } from "./pause-review";
import type {
  RegressionFailure,
  RegressionManifest,
  RegressionMetrics,
  RegressionPrediction,
  RegressionProvenance,
  RegressionReport,
} from "./pause-regression";
import {
  scoreVisionRegression,
  validateRegressionManifest,
  validateRegressionPredictions,
} from "./pause-regression";

export type ReviewedManifestPreview = {
  schemaVersion: 1;
  kind: "admind-s2-reviewed-manifest-preview";
  generatedAt: string;
  previewOnly: true;
  baseManifest: {
    datasetId: string;
    schemaVersion: number;
    createdAt: string;
    sourceAssetSha256: string;
  };
  sourceReview: {
    schemaVersion: 1;
    generatedAt: string;
    sha256: string;
  };
  calibrationArtifact: {
    schemaVersion: 2;
    generatedAt: string;
    generatedBy: S2ReviewExportV2["generatedBy"];
    sha256: string;
  };
  humanReviewedSampleIds: string[];
  pendingHumanReviewSampleIds: string[];
  appliedTargetSampleIds: string[];
  appliedPlacementSampleIds: string[];
  manifest: RegressionManifest;
};

export type PreviewPendingReason =
  | "source-review-missing"
  | "source-review-sha256-missing"
  | "calibration-seed-missing"
  | "calibration-artifact-missing"
  | "calibration-artifact-sha256-missing"
  | "source-review-incomplete"
  | "calibration-artifact-incomplete";

export type ReviewedManifestPreviewResult =
  | {
    status: "pending";
    stage: "review-intake";
    pending: PreviewPendingReason[];
    pendingSampleIds: string[];
  }
  | {
    status: "invalid";
    stage: "review-intake";
    issues: string[];
  }
  | {
    status: "ready";
    stage: "review-intake";
    preview: ReviewedManifestPreview;
  };

export type BuildReviewedManifestPreviewInput = {
  manifest: RegressionManifest;
  sourceReview?: unknown;
  sourceReviewSha256?: string;
  calibrationSeed?: ProtectionCalibrationSeed;
  calibrationArtifact?: unknown;
  calibrationArtifactSha256?: string;
  previewDatasetId?: string;
};

type SavedPredictionReport = {
  schemaVersion: 2;
  datasetId: string;
  generatedAt: string;
  provenance: RegressionProvenance;
  predictions: RegressionPrediction[];
};

type NumericMetric = Exclude<keyof RegressionMetrics, "datasetId">;

export type RegressionMetricDelta = Record<NumericMetric, {
  before: number;
  after: number;
  delta: number;
}>;

export type ReviewedRegressionComparison = {
  schemaVersion: 1;
  kind: "admind-s2-reviewed-label-rescore";
  generatedAt: string;
  rawPredictionSource: {
    datasetId: string;
    generatedAt: string;
    runner: RegressionProvenance["runner"];
    configurationReference: RegressionProvenance["configurationReference"];
  };
  scoringScope: {
    rawPredictionsReused: true;
    inferenceRerun: false;
    beforeBlockingSampleIds: string[];
    afterBlockingSampleIds: string[];
    addedBlockingSampleIds: string[];
    removedBlockingSampleIds: string[];
  };
  before: RegressionReport;
  after: RegressionReport;
  delta: RegressionMetricDelta;
  resolvedFailures: RegressionFailure[];
  introducedFailures: RegressionFailure[];
};

export type ReviewedRegressionResult =
  | {
    status: "pending";
    stage: "rescoring";
    pending: ["raw-predictions-missing"];
    preview: ReviewedManifestPreview;
  }
  | {
    status: "invalid";
    stage: "rescoring";
    issues: string[];
    preview: ReviewedManifestPreview;
  }
  | {
    status: "ready";
    stage: "rescoring";
    preview: ReviewedManifestPreview;
    comparison: ReviewedRegressionComparison;
  };

export type S2ReviewIntakeResult = ReviewedManifestPreviewResult | ReviewedRegressionResult;

export type IntakeS2ReviewedCalibrationInput = BuildReviewedManifestPreviewInput & {
  rawPredictionReport?: unknown;
  generatedAt?: string;
};

const NUMERIC_METRICS: NumericMetric[] = [
  "sampleCount",
  "blockingSampleCount",
  "diagnosticSampleCount",
  "availableSampleCount",
  "availableBlockingSampleCount",
  "unavailableCount",
  "safePlacementHits",
  "safePlacementHitRate",
  "unsafePlacementCount",
  "unsafePlacementRate",
  "overDeferralCount",
  "overDeferralRate",
  "targetTruePositive",
  "targetFalsePositive",
  "targetFalseNegative",
  "targetPrecision",
  "targetRecall",
  "targetF1",
  "inferenceP50Ms",
  "inferenceP95Ms",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cloneManifest(manifest: RegressionManifest) {
  return structuredClone(manifest);
}

function pendingPreview(
  pending: PreviewPendingReason[],
  pendingSampleIds: string[] = [],
): ReviewedManifestPreviewResult {
  return { status: "pending", stage: "review-intake", pending, pendingSampleIds };
}

/**
 * Builds an in-memory, explicitly preview-only reviewed manifest. The source
 * manifest is cloned before any review decision is applied.
 */
export function buildReviewedManifestPreview(
  input: BuildReviewedManifestPreviewInput,
): ReviewedManifestPreviewResult {
  const missing: PreviewPendingReason[] = [];
  if (input.sourceReview === undefined || input.sourceReview === null) missing.push("source-review-missing");
  if (!input.sourceReviewSha256) missing.push("source-review-sha256-missing");
  if (input.calibrationSeed === undefined) missing.push("calibration-seed-missing");
  const calibrationArtifactMissing = input.calibrationArtifact === undefined || input.calibrationArtifact === null;
  if (calibrationArtifactMissing) {
    missing.push("calibration-artifact-missing");
  }
  if (!calibrationArtifactMissing && !input.calibrationArtifactSha256) {
    missing.push("calibration-artifact-sha256-missing");
  }
  if (missing.length > 0) return pendingPreview(missing);

  if (!/^[a-f0-9]{64}$/.test(input.sourceReviewSha256!)) {
    return { status: "invalid", stage: "review-intake", issues: ["sourceReviewSha256 is invalid"] };
  }
  if (!/^[a-f0-9]{64}$/.test(input.calibrationArtifactSha256!)) {
    return { status: "invalid", stage: "review-intake", issues: ["calibrationArtifactSha256 is invalid"] };
  }
  const sourceIssues = validateReviewExport(input.manifest, input.sourceReview);
  if (sourceIssues.length > 0) {
    return {
      status: "invalid",
      stage: "review-intake",
      issues: sourceIssues.map((issue) => `source review: ${issue}`),
    };
  }
  const sourceReview = input.sourceReview as S2ReviewExport;
  if (!sourceReview.complete) {
    return pendingPreview(["source-review-incomplete"], sourceReview.pendingSampleIds);
  }

  const calibrationIssues = validateReviewExport(
    input.manifest,
    input.calibrationArtifact,
    sourceReview,
    input.sourceReviewSha256,
    input.calibrationSeed,
  );
  if (calibrationIssues.length > 0) {
    return { status: "invalid", stage: "review-intake", issues: calibrationIssues };
  }
  const calibration = input.calibrationArtifact as S2ReviewExportV2;
  if (!calibration.complete) {
    return pendingPreview(["calibration-artifact-incomplete"], calibration.pendingSampleIds);
  }

  const sourceById = new Map(sourceReview.reviews.map((review) => [review.sampleId, review]));
  const calibrationById = new Map(calibration.reviews.map((review) => [review.sampleId, review]));
  const placementById = new Map(calibration.placementResolutions.map((resolution) => [resolution.sampleId, resolution]));
  const reviewedIds = new Set(sourceById.keys());
  const previewManifest = cloneManifest(input.manifest);
  const previewDatasetId = input.previewDatasetId?.trim()
    || `${input.manifest.datasetId}-product-reviewed-v2-preview`;
  if (previewDatasetId === input.manifest.datasetId) {
    return {
      status: "invalid",
      stage: "review-intake",
      issues: ["previewDatasetId must differ from the tracked manifest datasetId"],
    };
  }
  previewManifest.datasetId = previewDatasetId;
  previewManifest.createdAt = calibration.generatedAt.slice(0, 10);
  previewManifest.title = `${input.manifest.title} · Product-reviewed preview`;
  previewManifest.titleZh = `${input.manifest.titleZh} · 产品复核预览`;
  previewManifest.scope = `${input.manifest.scope} Preview only: applies the complete schema-v1 and schema-v2 product review.`;
  previewManifest.scopeZh = `${input.manifest.scopeZh} 仅供预览：应用完整的 schema-v1 与 schema-v2 产品复核。`;
  previewManifest.samples = previewManifest.samples.map((sample) => {
    const source = sourceById.get(sample.id);
    if (!source) return { ...sample, reviewStatus: "needs-user-review" };
    const calibrationReview = calibrationById.get(sample.id);
    const placementResolution = placementById.get(sample.id);
    const action = placementResolution?.resolvedAction ?? source.productReview.action;
    const acceptablePlacements = placementResolution?.resolvedAcceptablePlacements
      ?? source.productReview.acceptablePlacements;
    return {
      ...sample,
      reviewStatus: "rule-confirmed",
      expectedAction: action,
      acceptablePlacements: action === "defer" ? [] : [...acceptablePlacements],
      protectionTargets: calibrationReview
        ? structuredClone(calibrationReview.replacementProtectionTargets)
        : structuredClone(sample.protectionTargets),
    };
  });

  const manifestIssues = validateRegressionManifest(previewManifest);
  if (manifestIssues.length > 0) {
    return {
      status: "invalid",
      stage: "review-intake",
      issues: manifestIssues.map((issue) => `reviewed manifest preview: ${issue}`),
    };
  }
  const preview: ReviewedManifestPreview = {
    schemaVersion: 1,
    kind: "admind-s2-reviewed-manifest-preview",
    generatedAt: calibration.generatedAt,
    previewOnly: true,
    baseManifest: {
      datasetId: input.manifest.datasetId,
      schemaVersion: input.manifest.schemaVersion,
      createdAt: input.manifest.createdAt,
      sourceAssetSha256: input.manifest.source.sha256,
    },
    sourceReview: {
      schemaVersion: 1,
      generatedAt: sourceReview.generatedAt,
      sha256: input.sourceReviewSha256!,
    },
    calibrationArtifact: {
      schemaVersion: 2,
      generatedAt: calibration.generatedAt,
      generatedBy: structuredClone(calibration.generatedBy),
      sha256: input.calibrationArtifactSha256!,
    },
    humanReviewedSampleIds: [...reviewedIds],
    pendingHumanReviewSampleIds: input.manifest.samples
      .map((sample) => sample.id)
      .filter((sampleId) => !reviewedIds.has(sampleId)),
    appliedTargetSampleIds: calibration.reviews.map((review) => review.sampleId),
    appliedPlacementSampleIds: calibration.placementResolutions.map((resolution) => resolution.sampleId),
    manifest: previewManifest,
  };
  return { status: "ready", stage: "review-intake", preview };
}

function readSavedPredictionReport(value: unknown): SavedPredictionReport | null {
  if (!isObject(value)
    || value.schemaVersion !== 2
    || typeof value.datasetId !== "string"
    || typeof value.generatedAt !== "string"
    || Number.isNaN(Date.parse(value.generatedAt))
    || !isObject(value.provenance)
    || !isObject(value.provenance.runner)
    || typeof value.provenance.runner.appVersion !== "string"
    || typeof value.provenance.runner.gitCommit !== "string"
    || typeof value.provenance.runner.platform !== "string"
    || !isObject(value.provenance.configurationReference)
    || typeof value.provenance.configurationReference.appVersion !== "string"
    || typeof value.provenance.configurationReference.gitCommit !== "string"
    || !Array.isArray(value.predictions)
    || !value.predictions.every(isSavedPrediction)) return null;
  return value as unknown as SavedPredictionReport;
}

function isSavedPrediction(value: unknown): value is RegressionPrediction {
  if (!isObject(value)
    || typeof value.sampleId !== "string"
    || (value.status !== "ready" && value.status !== "unavailable")
    || !["top-left", "top-right", "bottom-left", "bottom-right", "none"].includes(String(value.placement))
    || !Array.isArray(value.targets)
    || !Array.isArray(value.assessments)
    || typeof value.inferenceMs !== "number"
    || !Number.isFinite(value.inferenceMs)
    || value.inferenceMs < 0
    || typeof value.message !== "string") return false;
  return value.targets.every((target) => {
    if (!isObject(target)) return false;
    const coordinates = [target.x, target.y, target.width, target.height, target.confidence];
    return coordinates.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
      && (target.kind === "face" || target.kind === "subject")
      && typeof target.label === "string"
      && typeof target.source === "string"
      && (target.x as number) >= 0
      && (target.y as number) >= 0
      && (target.width as number) > 0
      && (target.height as number) > 0
      && (target.x as number) + (target.width as number) <= 1.000001
      && (target.y as number) + (target.height as number) <= 1.000001;
  });
}

function failureKey(failure: RegressionFailure) {
  return JSON.stringify([failure.sampleId, failure.kind, failure.expected, failure.actual]);
}

function metricDelta(before: RegressionMetrics, after: RegressionMetrics): RegressionMetricDelta {
  return Object.fromEntries(NUMERIC_METRICS.map((metric) => [metric, {
    before: before[metric],
    after: after[metric],
    delta: after[metric] - before[metric],
  }])) as RegressionMetricDelta;
}

/** Re-scores saved predictions only; it never invokes inference or changes targets. */
export function rescoreReviewedManifestPreview(
  baseManifest: RegressionManifest,
  preview: ReviewedManifestPreview,
  rawPredictionReportValue: unknown,
  generatedAt = new Date().toISOString(),
): ReviewedRegressionResult {
  if (rawPredictionReportValue === undefined || rawPredictionReportValue === null) {
    return {
      status: "pending",
      stage: "rescoring",
      pending: ["raw-predictions-missing"],
      preview,
    };
  }
  const rawReport = readSavedPredictionReport(rawPredictionReportValue);
  if (!rawReport) {
    return { status: "invalid", stage: "rescoring", issues: ["raw prediction report is invalid"], preview };
  }
  const issues: string[] = [];
  if (Number.isNaN(Date.parse(generatedAt))) issues.push("rescoring generatedAt is invalid");
  if (rawReport.datasetId !== baseManifest.datasetId) issues.push("raw prediction datasetId does not match the base manifest");
  if (preview.baseManifest.datasetId !== baseManifest.datasetId
    || preview.baseManifest.createdAt !== baseManifest.createdAt
    || preview.baseManifest.sourceAssetSha256 !== baseManifest.source.sha256) {
    issues.push("reviewed manifest preview does not belong to the base manifest");
  }
  issues.push(...validateRegressionManifest(preview.manifest)
    .map((issue) => `reviewed preview manifest: ${issue}`));
  issues.push(...validateRegressionPredictions(baseManifest, rawReport.predictions));
  issues.push(...validateRegressionPredictions(preview.manifest, rawReport.predictions)
    .map((issue) => `reviewed preview: ${issue}`));
  if (issues.length > 0) return { status: "invalid", stage: "rescoring", issues, preview };

  const before = scoreVisionRegression(baseManifest, structuredClone(rawReport.predictions), {
    generatedAt: rawReport.generatedAt,
    provenance: structuredClone(rawReport.provenance),
  });
  const after = scoreVisionRegression(preview.manifest, structuredClone(rawReport.predictions), {
    generatedAt,
    provenance: structuredClone(rawReport.provenance),
  });
  const beforeFailureKeys = new Set(before.failures.map(failureKey));
  const afterFailureKeys = new Set(after.failures.map(failureKey));
  const beforeBlockingSampleIds = baseManifest.samples
    .filter((sample) => sample.reviewStatus === "rule-confirmed")
    .map((sample) => sample.id);
  const afterBlockingSampleIds = preview.manifest.samples
    .filter((sample) => sample.reviewStatus === "rule-confirmed")
    .map((sample) => sample.id);
  const beforeBlockingSet = new Set(beforeBlockingSampleIds);
  const afterBlockingSet = new Set(afterBlockingSampleIds);
  const comparison: ReviewedRegressionComparison = {
    schemaVersion: 1,
    kind: "admind-s2-reviewed-label-rescore",
    generatedAt,
    rawPredictionSource: {
      datasetId: rawReport.datasetId,
      generatedAt: rawReport.generatedAt,
      runner: structuredClone(rawReport.provenance.runner),
      configurationReference: structuredClone(rawReport.provenance.configurationReference),
    },
    scoringScope: {
      rawPredictionsReused: true,
      inferenceRerun: false,
      beforeBlockingSampleIds,
      afterBlockingSampleIds,
      addedBlockingSampleIds: afterBlockingSampleIds.filter((sampleId) => !beforeBlockingSet.has(sampleId)),
      removedBlockingSampleIds: beforeBlockingSampleIds.filter((sampleId) => !afterBlockingSet.has(sampleId)),
    },
    before,
    after,
    delta: metricDelta(before.metrics, after.metrics),
    resolvedFailures: before.failures.filter((failure) => !afterFailureKeys.has(failureKey(failure))),
    introducedFailures: after.failures.filter((failure) => !beforeFailureKeys.has(failureKey(failure))),
  };
  return { status: "ready", stage: "rescoring", preview, comparison };
}

/** Runs validation, preview generation and saved-prediction rescoring as one intake pipeline. */
export function intakeS2ReviewedCalibration(
  input: IntakeS2ReviewedCalibrationInput,
): S2ReviewIntakeResult {
  const previewResult = buildReviewedManifestPreview(input);
  if (previewResult.status !== "ready") return previewResult;
  return rescoreReviewedManifestPreview(
    input.manifest,
    previewResult.preview,
    input.rawPredictionReport,
    input.generatedAt,
  );
}
