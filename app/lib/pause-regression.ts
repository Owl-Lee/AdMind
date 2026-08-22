import type { AdPlacement, NormalizedRect, PlacementAssessment } from "./pause-decision";

export type RegressionReviewStatus = "rule-confirmed" | "needs-user-review";
export type RegressionExpectedAction = "show-card" | "defer";

export type RegressionTarget = {
  id: string;
  kind: string;
  required: boolean;
  rect: NormalizedRect;
};

export type RegressionSample = {
  id: string;
  timeSec: number;
  frame: string;
  frameSha256: string;
  tags: string[];
  reviewStatus: RegressionReviewStatus;
  expectedAction: RegressionExpectedAction;
  acceptablePlacements: Array<Exclude<AdPlacement, "none">>;
  protectionTargets: RegressionTarget[];
  note: string;
  noteZh: string;
};

export type RegressionManifest = {
  schemaVersion: number;
  datasetId: string;
  title: string;
  titleZh: string;
  createdAt: string;
  scope: string;
  scopeZh: string;
  source: {
    asset: string;
    sha256: string;
    work: string;
    author: string;
    license: string;
    width: number;
    height: number;
    fps: number;
    durationSec: number;
  };
  annotationPolicy: {
    coordinateSpace: string;
    scorerCandidateFootprint: { width: number; height: number };
    renderedCreativeFootprint: { width: number; height: number };
    reservedBottom: NormalizedRect;
    targetMatchIou: number;
    ruleConfirmedSamplesBlockRegression: boolean;
    needsUserReviewSamplesAreDiagnosticOnly: boolean;
  };
  samples: RegressionSample[];
};

export type RegressionPredictionTarget = NormalizedRect & {
  confidence: number;
  kind: "face" | "subject";
  label: string;
  source: string;
};

export type RegressionPrediction = {
  sampleId: string;
  status: "ready" | "unavailable";
  placement: AdPlacement;
  targets: RegressionPredictionTarget[];
  assessments: PlacementAssessment[];
  inferenceMs: number;
  message: string;
};

export type RegressionFailure = {
  sampleId: string;
  kind: "unsafe-placement" | "over-deferral" | "target-miss" | "false-positive" | "unavailable";
  expected: string;
  actual: string;
};

export type RegressionMetrics = {
  datasetId: string;
  sampleCount: number;
  blockingSampleCount: number;
  diagnosticSampleCount: number;
  availableSampleCount: number;
  availableBlockingSampleCount: number;
  unavailableCount: number;
  safePlacementHits: number;
  safePlacementHitRate: number;
  unsafePlacementCount: number;
  unsafePlacementRate: number;
  overDeferralCount: number;
  overDeferralRate: number;
  targetTruePositive: number;
  targetFalsePositive: number;
  targetFalseNegative: number;
  targetPrecision: number;
  targetRecall: number;
  targetF1: number;
  inferenceP50Ms: number;
  inferenceP95Ms: number;
};

export type RegressionProvenance = {
  runner: {
    appVersion: string;
    gitCommit: string;
    platform: string;
  };
  configurationReference: {
    appVersion: string;
    gitCommit: string;
  };
  input: {
    kind: "fixed-jpeg";
    width: number;
    height: number;
  };
  vision: {
    configVersion: string;
    mediapipeTasksVision: string;
    wasmRoot: string;
    faceModel: { path: string; sha256: string };
    objectModel: { path: string; sha256: string };
    thresholds: {
      facePrimary: number;
      faceMirrored: number;
      faceCrop: number;
      subjectPrimary: number;
      subjectCrop: number;
      subjectCropStandalone?: number;
    };
    filters?: {
      weakCropRequiresFaceForLabels: readonly string[];
    };
    availability?: {
      requiredDetectors: readonly string[];
    };
  };
};

export type RegressionReport = {
  schemaVersion: 2;
  datasetId: string;
  generatedAt: string;
  provenance: RegressionProvenance;
  metrics: RegressionMetrics;
  failures: RegressionFailure[];
  predictions: RegressionPrediction[];
};

function clampRatio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
}

export function intersectionOverUnion(a: NormalizedRect, b: NormalizedRect) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= left || bottom <= top) return 0;
  const intersection = (right - left) * (bottom - top);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

function matchTargets(expected: RegressionTarget[], predicted: RegressionPredictionTarget[], minimumIou: number) {
  const remaining = new Set(predicted.map((_, index) => index));
  let truePositive = 0;
  let falseNegative = 0;

  for (const target of expected.filter((item) => item.required)) {
    const best = [...remaining]
      .map((index) => ({ index, iou: intersectionOverUnion(target.rect, predicted[index]) }))
      .sort((left, right) => right.iou - left.iou)[0];
    if (best && best.iou >= minimumIou) {
      truePositive += 1;
      remaining.delete(best.index);
    } else {
      falseNegative += 1;
    }
  }

  return { truePositive, falseNegative, falsePositive: remaining.size };
}

export function validateRegressionManifest(manifest: RegressionManifest) {
  const errors: string[] = [];
  const placements = new Set(["top-left", "top-right", "bottom-left", "bottom-right"]);
  if (manifest.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (!manifest.datasetId.trim()) errors.push("datasetId is required");
  if (!/^[a-f0-9]{64}$/.test(manifest.source.sha256)) errors.push("source sha256 is invalid");
  if (manifest.samples.length < 15) errors.push("the fixed set must contain at least 15 samples");
  for (const [name, footprint] of Object.entries({
    scorerCandidateFootprint: manifest.annotationPolicy.scorerCandidateFootprint,
    renderedCreativeFootprint: manifest.annotationPolicy.renderedCreativeFootprint,
  })) {
    if (footprint.width <= 0 || footprint.height <= 0 || footprint.width > 1 || footprint.height > 1) {
      errors.push(`${name} must fit normalized bounds`);
    }
  }
  const ids = new Set<string>();

  for (const sample of manifest.samples) {
    if (ids.has(sample.id)) errors.push(`duplicate sample id: ${sample.id}`);
    ids.add(sample.id);
    if (!sample.frame.startsWith("/evaluation/s2/frames/")) errors.push(`${sample.id}: frame path is outside the fixed set`);
    if (!/^[a-f0-9]{64}$/.test(sample.frameSha256)) errors.push(`${sample.id}: invalid frame sha256`);
    if (sample.timeSec < 0 || sample.timeSec > manifest.source.durationSec) errors.push(`${sample.id}: timestamp outside source duration`);
    if (sample.reviewStatus !== "rule-confirmed" && sample.reviewStatus !== "needs-user-review") errors.push(`${sample.id}: invalid review status`);
    if (sample.expectedAction !== "show-card" && sample.expectedAction !== "defer") errors.push(`${sample.id}: invalid expected action`);
    if (sample.acceptablePlacements.some((placement) => !placements.has(placement))) errors.push(`${sample.id}: invalid acceptable placement`);
    if (sample.expectedAction === "defer" && sample.acceptablePlacements.length) errors.push(`${sample.id}: deferred samples cannot list acceptable placements`);
    if (sample.expectedAction === "show-card" && !sample.acceptablePlacements.length) errors.push(`${sample.id}: card samples need an acceptable placement`);
    const targetIds = new Set<string>();
    for (const target of sample.protectionTargets) {
      if (targetIds.has(target.id)) errors.push(`${sample.id}: duplicate target id ${target.id}`);
      targetIds.add(target.id);
      const { x, y, width, height } = target.rect;
      if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1.000001 || y + height > 1.000001) {
        errors.push(`${sample.id}/${target.id}: target rectangle is outside normalized bounds`);
      }
    }
  }

  return errors;
}

export function validateRegressionPredictions(
  manifest: RegressionManifest,
  predictions: RegressionPrediction[],
) {
  const errors: string[] = [];
  const expectedIds = new Set(manifest.samples.map((sample) => sample.id));
  const seen = new Set<string>();
  for (const prediction of predictions) {
    if (seen.has(prediction.sampleId)) errors.push(`duplicate prediction: ${prediction.sampleId}`);
    seen.add(prediction.sampleId);
    if (!expectedIds.has(prediction.sampleId)) errors.push(`unknown prediction: ${prediction.sampleId}`);
    if (prediction.status !== "ready" && prediction.status !== "unavailable") errors.push(`${prediction.sampleId}: invalid prediction status`);
    if (!["top-left", "top-right", "bottom-left", "bottom-right", "none"].includes(prediction.placement)) errors.push(`${prediction.sampleId}: invalid predicted placement`);
    if (prediction.status === "unavailable" && prediction.placement !== "none") errors.push(`${prediction.sampleId}: unavailable prediction must not place an ad`);
  }
  for (const sample of manifest.samples) {
    if (!seen.has(sample.id)) errors.push(`missing prediction: ${sample.id}`);
  }
  return errors;
}

export function scoreVisionRegression(
  manifest: RegressionManifest,
  predictions: RegressionPrediction[],
  options: { generatedAt?: string; provenance: RegressionProvenance },
): RegressionReport {
  const predictionById = new Map(predictions.map((prediction) => [prediction.sampleId, prediction]));
  const blocking = manifest.samples.filter((sample) => sample.reviewStatus === "rule-confirmed");
  const failures: RegressionFailure[] = [];
  const unavailableCount = manifest.samples.filter((sample) => predictionById.get(sample.id)?.status !== "ready").length;
  const availableSampleCount = manifest.samples.length - unavailableCount;
  let safePlacementHits = 0;
  let unsafePlacementCount = 0;
  let overDeferralCount = 0;
  let targetTruePositive = 0;
  let targetFalsePositive = 0;
  let targetFalseNegative = 0;
  const inferenceTimes = manifest.samples
    .map((sample) => predictionById.get(sample.id))
    .filter((prediction): prediction is RegressionPrediction => prediction?.status === "ready")
    .map((prediction) => prediction.inferenceMs);

  for (const sample of blocking) {
    const prediction = predictionById.get(sample.id);
    if (!prediction || prediction.status === "unavailable") {
      const requiredTargetCount = sample.protectionTargets.filter((target) => target.required).length;
      targetFalseNegative += requiredTargetCount;
      failures.push({
        sampleId: sample.id,
        kind: "unavailable",
        expected: sample.expectedAction,
        actual: prediction?.message ?? "missing prediction",
      });
      if (requiredTargetCount > 0) {
        failures.push({
          sampleId: sample.id,
          kind: "target-miss",
          expected: `${requiredTargetCount} protected target(s)`,
          actual: "0 matched target(s); inference unavailable",
        });
      }
      continue;
    }

    const placementAccepted = sample.expectedAction === "defer"
      ? prediction.placement === "none"
      : prediction.placement !== "none" && sample.acceptablePlacements.includes(prediction.placement);
    if (placementAccepted) {
      safePlacementHits += 1;
    } else if (prediction.placement === "none" && sample.expectedAction === "show-card") {
      overDeferralCount += 1;
      failures.push({
        sampleId: sample.id,
        kind: "over-deferral",
        expected: sample.acceptablePlacements.join(" or "),
        actual: "none",
      });
    } else {
      unsafePlacementCount += 1;
      failures.push({
        sampleId: sample.id,
        kind: "unsafe-placement",
        expected: sample.expectedAction === "defer" ? "none" : sample.acceptablePlacements.join(" or "),
        actual: prediction.placement,
      });
    }

    const targetScore = matchTargets(
      sample.protectionTargets,
      prediction.targets,
      manifest.annotationPolicy.targetMatchIou,
    );
    targetTruePositive += targetScore.truePositive;
    targetFalsePositive += targetScore.falsePositive;
    targetFalseNegative += targetScore.falseNegative;
    if (targetScore.falseNegative > 0) {
      failures.push({
        sampleId: sample.id,
        kind: "target-miss",
        expected: `${sample.protectionTargets.filter((target) => target.required).length} protected target(s)`,
        actual: `${targetScore.truePositive} matched target(s)`,
      });
    }
    if (targetScore.falsePositive > 0) {
      failures.push({
        sampleId: sample.id,
        kind: "false-positive",
        expected: `${sample.protectionTargets.length} annotated target(s)`,
        actual: `${prediction.targets.length} detected target(s)`,
      });
    }
  }

  const availableBlockingSampleCount = blocking.filter((sample) => predictionById.get(sample.id)?.status === "ready").length;
  const decisionDenominator = Math.max(1, blocking.length);
  const precision = clampRatio(targetTruePositive, targetTruePositive + targetFalsePositive);
  const recall = clampRatio(targetTruePositive, targetTruePositive + targetFalseNegative);
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    schemaVersion: 2,
    datasetId: manifest.datasetId,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    provenance: options.provenance,
    metrics: {
      datasetId: manifest.datasetId,
      sampleCount: manifest.samples.length,
      blockingSampleCount: blocking.length,
      diagnosticSampleCount: manifest.samples.length - blocking.length,
      availableSampleCount,
      availableBlockingSampleCount,
      unavailableCount,
      safePlacementHits,
      safePlacementHitRate: safePlacementHits / decisionDenominator,
      unsafePlacementCount,
      unsafePlacementRate: unsafePlacementCount / decisionDenominator,
      overDeferralCount,
      overDeferralRate: overDeferralCount / decisionDenominator,
      targetTruePositive,
      targetFalsePositive,
      targetFalseNegative,
      targetPrecision: precision,
      targetRecall: recall,
      targetF1: f1,
      inferenceP50Ms: percentile(inferenceTimes, 0.5),
      inferenceP95Ms: percentile(inferenceTimes, 0.95),
    },
    failures,
    predictions,
  };
}
