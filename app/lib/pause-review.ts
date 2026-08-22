import type { RegressionManifest, RegressionSample } from "./pause-regression";

export type ReviewPlacement = "top-left" | "top-right";
export type ReviewTargetAssessment = "correct" | "needs-adjustment";
export type ReviewAction = "show-card" | "defer";

export type ReviewWorkspaceItem = {
  sampleId: string;
  frameSha256: string;
  targetAssessment: ReviewTargetAssessment | null;
  action: ReviewAction;
  acceptablePlacements: ReviewPlacement[];
  note: string;
  confirmedAt: string | null;
};

export type ReviewWorkspace = {
  schemaVersion: 1;
  datasetId: string;
  sourceAssetSha256: string;
  items: Record<string, ReviewWorkspaceItem>;
};

export type ConfirmedReviewRecord = {
  sampleId: string;
  frameSha256: string;
  scope: "placement-and-target-draft-review";
  agentDraft: {
    targetStatus: "agent-draft";
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

function reviewableSamples(manifest: RegressionManifest) {
  return manifest.samples.filter((sample) => sample.reviewStatus === "needs-user-review");
}

function draftPlacements(sample: RegressionSample): ReviewPlacement[] {
  return sample.acceptablePlacements.filter(
    (placement): placement is ReviewPlacement => REVIEW_PLACEMENTS.has(placement as ReviewPlacement),
  );
}

function createItem(sample: RegressionSample): ReviewWorkspaceItem {
  return {
    sampleId: sample.id,
    frameSha256: sample.frameSha256,
    targetAssessment: null,
    action: sample.expectedAction,
    acceptablePlacements: sample.expectedAction === "show-card" ? draftPlacements(sample) : [],
    note: "",
    confirmedAt: null,
  };
}

export function createReviewWorkspace(manifest: RegressionManifest): ReviewWorkspace {
  return {
    schemaVersion: 1,
    datasetId: manifest.datasetId,
    sourceAssetSha256: manifest.source.sha256,
    items: Object.fromEntries(reviewableSamples(manifest).map((sample) => [sample.id, createItem(sample)])),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function restoreItem(fallback: ReviewWorkspaceItem, value: unknown): ReviewWorkspaceItem {
  if (!isObject(value) || value.sampleId !== fallback.sampleId || value.frameSha256 !== fallback.frameSha256) {
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
    || value.schemaVersion !== 1
    || value.datasetId !== fallback.datasetId
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

export function reviewStorageKey(manifest: RegressionManifest) {
  return `admind:s2-review:${manifest.datasetId}:v1`;
}

export function reviewExportFilename(manifest: RegressionManifest, generatedAt: string) {
  const date = generatedAt.slice(0, 10);
  return `${manifest.datasetId}-product-review-${date}.json`;
}
