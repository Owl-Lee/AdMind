import type { RegressionManifest, RegressionSample } from "./pause-regression";

export type ReviewPlacement = "top-left" | "top-right";
export type ReviewTargetAssessment = "correct" | "needs-adjustment";
export type ReviewAction = "show-card" | "defer";

export type ReviewWorkspaceItem = {
  sampleId: string;
  frameSha256: string;
  draftSignature: string;
  targetAssessment: ReviewTargetAssessment | null;
  action: ReviewAction;
  acceptablePlacements: ReviewPlacement[];
  note: string;
  confirmedAt: string | null;
};

export type ReviewWorkspace = {
  schemaVersion: 2;
  datasetId: string;
  manifestCreatedAt: string;
  sourceAssetSha256: string;
  items: Record<string, ReviewWorkspaceItem>;
};

export type ConfirmedReviewRecord = {
  sampleId: string;
  frameSha256: string;
  scope: "placement-and-target-draft-review";
  agentDraft: {
    targetStatus: "agent-draft";
    manifestReviewStatus: RegressionSample["reviewStatus"];
    draftSignature: string;
    action: ReviewAction;
    acceptablePlacements: ReviewPlacement[];
  };
  productReview: {
    targetAssessment: ReviewTargetAssessment;
    action: ReviewAction;
    acceptablePlacements: ReviewPlacement[];
    note: string;
  };
  placementChangedFromAgentDraft: boolean;
  confirmedAt: string;
};

export type S2ReviewExport = {
  schemaVersion: 1;
  kind: "admind-s2-product-review";
  baseDataset: {
    datasetId: string;
    manifestSchemaVersion: number;
    manifestCreatedAt: string;
    sourceAssetSha256: string;
  };
  generatedAt: string;
  generatedBy: {
    appVersion: string;
    gitCommit: string;
  };
  reviewer: {
    role: "product-owner";
    identityVerified: false;
  };
  persistence: "browser-local-download";
  complete: boolean;
  eligibleSampleIds: string[];
  pendingSampleIds: string[];
  reviews: ConfirmedReviewRecord[];
};

const REVIEW_PLACEMENTS = new Set<ReviewPlacement>(["top-left", "top-right"]);
const FLAGGED_AGENT_DRAFTS = new Set([
  "charge-002",
  "charge-005",
  "charge-008",
  "charge-013",
  "charge-016",
  "charge-018",
]);

export function reviewableSamples(manifest: RegressionManifest) {
  return manifest.samples.filter(
    (sample) => sample.reviewStatus === "needs-user-review" || FLAGGED_AGENT_DRAFTS.has(sample.id),
  );
}

function draftPlacements(sample: RegressionSample): ReviewPlacement[] {
  return sample.acceptablePlacements.filter(
    (placement): placement is ReviewPlacement => REVIEW_PLACEMENTS.has(placement as ReviewPlacement),
  );
}

function draftSignature(sample: RegressionSample) {
  return JSON.stringify({
    acceptablePlacements: sample.acceptablePlacements,
    expectedAction: sample.expectedAction,
    frameSha256: sample.frameSha256,
    protectionTargets: sample.protectionTargets,
    reviewStatus: sample.reviewStatus,
  });
}

function createItem(sample: RegressionSample): ReviewWorkspaceItem {
  return {
    sampleId: sample.id,
    frameSha256: sample.frameSha256,
    draftSignature: draftSignature(sample),
    targetAssessment: null,
    action: sample.expectedAction,
    acceptablePlacements: sample.expectedAction === "show-card" ? draftPlacements(sample) : [],
    note: "",
    confirmedAt: null,
  };
}

export function createReviewWorkspace(manifest: RegressionManifest): ReviewWorkspace {
  return {
    schemaVersion: 2,
    datasetId: manifest.datasetId,
    manifestCreatedAt: manifest.createdAt,
    sourceAssetSha256: manifest.source.sha256,
    items: Object.fromEntries(reviewableSamples(manifest).map((sample) => [sample.id, createItem(sample)])),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function restoreItem(fallback: ReviewWorkspaceItem, value: unknown): ReviewWorkspaceItem {
  if (!isObject(value)
    || value.sampleId !== fallback.sampleId
    || value.frameSha256 !== fallback.frameSha256
    || value.draftSignature !== fallback.draftSignature) {
    return fallback;
  }
  const action = value.action === "defer" || value.action === "show-card" ? value.action : fallback.action;
  const placements = Array.isArray(value.acceptablePlacements)
    ? [...new Set(value.acceptablePlacements.filter((placement): placement is ReviewPlacement => REVIEW_PLACEMENTS.has(placement as ReviewPlacement)))]
    : fallback.acceptablePlacements;
  const targetAssessment: ReviewTargetAssessment | null = value.targetAssessment === "correct" || value.targetAssessment === "needs-adjustment"
    ? value.targetAssessment
    : null;
  const note = typeof value.note === "string" ? value.note.slice(0, 500) : "";
  const confirmedAt = typeof value.confirmedAt === "string" && !Number.isNaN(Date.parse(value.confirmedAt))
    ? value.confirmedAt
    : null;
  const restored: ReviewWorkspaceItem = {
    ...fallback,
    targetAssessment,
    action,
    acceptablePlacements: action === "defer" ? [] : placements,
    note,
    confirmedAt,
  };
  return confirmedAt && !canConfirmReview(restored) ? { ...restored, confirmedAt: null } : restored;
}

export function restoreReviewWorkspace(manifest: RegressionManifest, value: unknown): ReviewWorkspace {
  const fallback = createReviewWorkspace(manifest);
  if (!isObject(value)
    || value.schemaVersion !== 2
    || value.datasetId !== fallback.datasetId
    || value.manifestCreatedAt !== fallback.manifestCreatedAt
    || value.sourceAssetSha256 !== fallback.sourceAssetSha256
    || !isObject(value.items)) {
    return fallback;
  }
  const savedItems = value.items;
  return {
    ...fallback,
    items: Object.fromEntries(
      Object.entries(fallback.items).map(([sampleId, item]) => [sampleId, restoreItem(item, savedItems[sampleId])]),
    ),
  };
}

export function chooseReviewAction(item: ReviewWorkspaceItem, action: ReviewAction): ReviewWorkspaceItem {
  return {
    ...item,
    action,
    acceptablePlacements: action === "defer" ? [] : item.acceptablePlacements,
    confirmedAt: null,
  };
}

export function toggleReviewPlacement(item: ReviewWorkspaceItem, placement: ReviewPlacement): ReviewWorkspaceItem {
  const selected = item.acceptablePlacements.includes(placement)
    ? item.acceptablePlacements.filter((candidate) => candidate !== placement)
    : [...item.acceptablePlacements, placement];
  return {
    ...item,
    action: "show-card",
    acceptablePlacements: selected,
    confirmedAt: null,
  };
}

export function canConfirmReview(item: ReviewWorkspaceItem) {
  return item.targetAssessment !== null
    && item.note.trim().length > 0
    && item.note.trim().length <= 500
    && (item.action === "defer" || item.acceptablePlacements.length > 0);
}

export function confirmReview(item: ReviewWorkspaceItem, confirmedAt: string): ReviewWorkspaceItem {
  if (!canConfirmReview(item)) throw new Error("Review is incomplete");
  if (Number.isNaN(Date.parse(confirmedAt))) throw new Error("confirmedAt must be an ISO timestamp");
  return { ...item, note: item.note.trim(), confirmedAt };
}

export function revokeReview(item: ReviewWorkspaceItem): ReviewWorkspaceItem {
  return { ...item, confirmedAt: null };
}

function agentDraft(sample: RegressionSample) {
  return {
    targetStatus: "agent-draft" as const,
    manifestReviewStatus: sample.reviewStatus,
    draftSignature: draftSignature(sample),
    action: sample.expectedAction,
    acceptablePlacements: sample.expectedAction === "show-card" ? draftPlacements(sample) : [],
  };
}

function decisionsMatch(sample: RegressionSample, item: ReviewWorkspaceItem) {
  const draft = agentDraft(sample);
  return draft.action === item.action
    && draft.acceptablePlacements.length === item.acceptablePlacements.length
    && draft.acceptablePlacements.every((placement) => item.acceptablePlacements.includes(placement));
}

export function buildReviewExport(
  manifest: RegressionManifest,
  workspace: ReviewWorkspace,
  options: { generatedAt?: string; appVersion: string; gitCommit: string },
): S2ReviewExport {
  const eligible = reviewableSamples(manifest);
  const reviews = eligible.flatMap((sample): ConfirmedReviewRecord[] => {
    const item = workspace.items[sample.id];
    if (!item?.confirmedAt || !item.targetAssessment || !canConfirmReview(item)) return [];
    return [{
      sampleId: sample.id,
      frameSha256: sample.frameSha256,
      scope: "placement-and-target-draft-review",
      agentDraft: agentDraft(sample),
      productReview: {
        targetAssessment: item.targetAssessment,
        action: item.action,
        acceptablePlacements: item.action === "show-card" ? item.acceptablePlacements : [],
        note: item.note.trim(),
      },
      placementChangedFromAgentDraft: !decisionsMatch(sample, item),
      confirmedAt: item.confirmedAt,
    }];
  });
  const reviewedIds = new Set(reviews.map((review) => review.sampleId));
  const pendingSampleIds = eligible.map((sample) => sample.id).filter((sampleId) => !reviewedIds.has(sampleId));
  return {
    schemaVersion: 1,
    kind: "admind-s2-product-review",
    baseDataset: {
      datasetId: manifest.datasetId,
      manifestSchemaVersion: manifest.schemaVersion,
      manifestCreatedAt: manifest.createdAt,
      sourceAssetSha256: manifest.source.sha256,
    },
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    generatedBy: {
      appVersion: options.appVersion,
      gitCommit: options.gitCommit,
    },
    reviewer: {
      role: "product-owner",
      identityVerified: false,
    },
    persistence: "browser-local-download",
    complete: pendingSampleIds.length === 0,
    eligibleSampleIds: eligible.map((sample) => sample.id),
    pendingSampleIds,
    reviews,
  };
}

function samePlacements(left: ReviewPlacement[], right: ReviewPlacement[]) {
  return left.length === right.length && left.every((placement) => right.includes(placement));
}

function validIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function readReviewPlacements(value: unknown): ReviewPlacement[] | null {
  if (!Array.isArray(value)) return null;
  const placements = value.filter(
    (placement): placement is ReviewPlacement => REVIEW_PLACEMENTS.has(placement as ReviewPlacement),
  );
  return placements.length === value.length && new Set(placements).size === placements.length
    ? placements
    : null;
}

/**
 * Validates a downloaded product-review artifact against the exact manifest draft
 * that it claims to review. This deliberately does not merge the review into the
 * manifest: target adjustments still need explicit normalized rectangles.
 */
export function validateReviewExport(manifest: RegressionManifest, value: unknown) {
  const issues: string[] = [];
  if (!isObject(value)) return ["review export must be an object"];
  if (value.schemaVersion !== 1) issues.push("schemaVersion must be 1");
  if (value.kind !== "admind-s2-product-review") issues.push("kind is invalid");

  const eligible = reviewableSamples(manifest);
  const eligibleById = new Map(eligible.map((sample) => [sample.id, sample]));
  const expectedEligibleIds = eligible.map((sample) => sample.id);
  const baseDataset = isObject(value.baseDataset) ? value.baseDataset : null;
  if (!baseDataset) {
    issues.push("baseDataset is missing");
  } else {
    if (baseDataset.datasetId !== manifest.datasetId) issues.push("datasetId does not match the manifest");
    if (baseDataset.manifestSchemaVersion !== manifest.schemaVersion) issues.push("manifestSchemaVersion does not match");
    if (baseDataset.manifestCreatedAt !== manifest.createdAt) issues.push("manifestCreatedAt does not match");
    if (baseDataset.sourceAssetSha256 !== manifest.source.sha256) issues.push("sourceAssetSha256 does not match");
  }
  if (!validIsoTimestamp(value.generatedAt)) issues.push("generatedAt is invalid");
  if (!isObject(value.generatedBy)
    || typeof value.generatedBy.appVersion !== "string"
    || typeof value.generatedBy.gitCommit !== "string") {
    issues.push("generatedBy is invalid");
  }
  if (!isObject(value.reviewer)
    || value.reviewer.role !== "product-owner"
    || value.reviewer.identityVerified !== false) {
    issues.push("reviewer contract is invalid");
  }
  if (value.persistence !== "browser-local-download") issues.push("persistence is invalid");

  const eligibleSampleIds = Array.isArray(value.eligibleSampleIds)
    ? value.eligibleSampleIds.filter((sampleId): sampleId is string => typeof sampleId === "string")
    : [];
  if (!Array.isArray(value.eligibleSampleIds)
    || eligibleSampleIds.length !== value.eligibleSampleIds.length
    || new Set(eligibleSampleIds).size !== eligibleSampleIds.length
    || eligibleSampleIds.length !== expectedEligibleIds.length
    || !expectedEligibleIds.every((sampleId) => eligibleSampleIds.includes(sampleId))) {
    issues.push("eligibleSampleIds do not match the current priority queue");
  }

  const pendingSampleIds = Array.isArray(value.pendingSampleIds)
    ? value.pendingSampleIds.filter((sampleId): sampleId is string => typeof sampleId === "string")
    : [];
  if (!Array.isArray(value.pendingSampleIds)
    || pendingSampleIds.length !== value.pendingSampleIds.length
    || new Set(pendingSampleIds).size !== pendingSampleIds.length
    || pendingSampleIds.some((sampleId) => !eligibleById.has(sampleId))) {
    issues.push("pendingSampleIds are invalid");
  }

  const reviews = Array.isArray(value.reviews) ? value.reviews : [];
  if (!Array.isArray(value.reviews)) issues.push("reviews must be an array");
  const reviewedIds = new Set<string>();
  for (const rawReview of reviews) {
    if (!isObject(rawReview) || typeof rawReview.sampleId !== "string") {
      issues.push("review record is invalid");
      continue;
    }
    const sample = eligibleById.get(rawReview.sampleId);
    if (!sample) {
      issues.push(`${rawReview.sampleId}: sample is not in the priority queue`);
      continue;
    }
    if (reviewedIds.has(sample.id)) issues.push(`${sample.id}: duplicate review`);
    reviewedIds.add(sample.id);
    if (rawReview.frameSha256 !== sample.frameSha256) issues.push(`${sample.id}: frameSha256 does not match`);
    if (rawReview.scope !== "placement-and-target-draft-review") issues.push(`${sample.id}: scope is invalid`);
    if (!validIsoTimestamp(rawReview.confirmedAt)) issues.push(`${sample.id}: confirmedAt is invalid`);

    const expectedDraft = agentDraft(sample);
    const rawDraft = isObject(rawReview.agentDraft) ? rawReview.agentDraft : null;
    if (!rawDraft) {
      issues.push(`${sample.id}: agentDraft is missing`);
    } else {
      const draftPlacementsValue = readReviewPlacements(rawDraft.acceptablePlacements);
      if (rawDraft.targetStatus !== expectedDraft.targetStatus
        || rawDraft.manifestReviewStatus !== expectedDraft.manifestReviewStatus
        || rawDraft.draftSignature !== expectedDraft.draftSignature
        || rawDraft.action !== expectedDraft.action
        || !draftPlacementsValue
        || !samePlacements(draftPlacementsValue, expectedDraft.acceptablePlacements)) {
        issues.push(`${sample.id}: agentDraft does not match the current manifest draft`);
      }
    }

    const productReview = isObject(rawReview.productReview) ? rawReview.productReview : null;
    if (!productReview) {
      issues.push(`${sample.id}: productReview is missing`);
      continue;
    }
    const productPlacements = readReviewPlacements(productReview.acceptablePlacements);
    const targetAssessment = productReview.targetAssessment;
    const action = productReview.action;
    const note = productReview.note;
    if (targetAssessment !== "correct" && targetAssessment !== "needs-adjustment") {
      issues.push(`${sample.id}: targetAssessment is invalid`);
    }
    if (action !== "show-card" && action !== "defer") issues.push(`${sample.id}: action is invalid`);
    if (!productPlacements
      || (action === "show-card" && productPlacements.length === 0)
      || (action === "defer" && productPlacements.length > 0)) {
      issues.push(`${sample.id}: product placements are invalid`);
    }
    if (typeof note !== "string" || note.trim().length === 0 || note.trim().length > 500) {
      issues.push(`${sample.id}: note is invalid`);
    }
    if (productPlacements && (action === "show-card" || action === "defer")) {
      const reviewItem: ReviewWorkspaceItem = {
        sampleId: sample.id,
        frameSha256: sample.frameSha256,
        draftSignature: expectedDraft.draftSignature,
        targetAssessment: targetAssessment === "correct" || targetAssessment === "needs-adjustment"
          ? targetAssessment
          : null,
        action,
        acceptablePlacements: productPlacements,
        note: typeof note === "string" ? note : "",
        confirmedAt: typeof rawReview.confirmedAt === "string" ? rawReview.confirmedAt : null,
      };
      if (rawReview.placementChangedFromAgentDraft !== !decisionsMatch(sample, reviewItem)) {
        issues.push(`${sample.id}: placementChangedFromAgentDraft is inconsistent`);
      }
    }
  }

  const expectedPending = expectedEligibleIds.filter((sampleId) => !reviewedIds.has(sampleId));
  if (pendingSampleIds.length !== expectedPending.length
    || !expectedPending.every((sampleId) => pendingSampleIds.includes(sampleId))) {
    issues.push("pendingSampleIds do not match the review records");
  }
  if (value.complete !== (expectedPending.length === 0)) issues.push("complete is inconsistent with pending reviews");
  return issues;
}

export function reviewStorageKey(manifest: RegressionManifest) {
  return `admind:s2-review:${manifest.datasetId}:v2`;
}

export function reviewExportFilename(manifest: RegressionManifest, generatedAt: string) {
  const date = generatedAt.slice(0, 10);
  return `${manifest.datasetId}-product-review-${date}.json`;
}
