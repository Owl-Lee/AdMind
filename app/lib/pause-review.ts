import type { NormalizedRect } from "./pause-decision";
import type { RegressionManifest, RegressionSample, RegressionTarget } from "./pause-regression";

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
  schemaVersion: 3;
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

export type ProtectionCalibrationItem = {
  sampleId: string;
  frameSha256: string;
  originalDraftSignature: string;
  sourceReviewConfirmedAt: string;
  originalProtectionTargets: RegressionTarget[];
  replacementProtectionTargets: RegressionTarget[];
  nextTargetOrdinal: number;
  note: string;
  confirmedAt: string | null;
};

export type ProtectionCalibrationWorkspace = {
  schemaVersion: 3;
  kind: "admind-s2-protection-calibration-workspace";
  datasetId: string;
  manifestCreatedAt: string;
  sourceAssetSha256: string;
  sourceReviewSignature: string;
  seedSignature: string;
  items: Record<string, ProtectionCalibrationItem>;
  placementResolutions: Record<string, PlacementResolutionItem>;
};

export type PlacementResolutionItem = {
  sampleId: string;
  frameSha256: string;
  originalDraftSignature: string;
  sourceReviewConfirmedAt: string;
  originalAction: ReviewAction;
  originalAcceptablePlacements: ReviewPlacement[];
  action: ReviewAction;
  acceptablePlacements: ReviewPlacement[];
  preferredPlacement: ReviewPlacement | null;
  note: string;
  confirmedAt: string | null;
};

export type ProtectionCalibrationRecord = {
  sampleId: string;
  frameSha256: string;
  scope: "replacement-protection-targets";
  originalDraftSignature: string;
  sourceReviewConfirmedAt: string;
  sourceProductReview: ConfirmedReviewRecord["productReview"];
  replacementProtectionTargets: RegressionTarget[];
  note: string;
  confirmedAt: string;
};

export type PlacementResolutionRecord = {
  sampleId: string;
  frameSha256: string;
  scope: "placement-resolution";
  originalDraftSignature: string;
  sourceReviewConfirmedAt: string;
  originalAction: ReviewAction;
  originalAcceptablePlacements: ReviewPlacement[];
  resolvedAction: ReviewAction;
  resolvedAcceptablePlacements: ReviewPlacement[];
  preferredPlacement: ReviewPlacement | null;
  note: string;
  confirmedAt: string;
};

export type S2ReviewExportV2 = {
  schemaVersion: 2;
  kind: "admind-s2-product-review";
  baseDataset: S2ReviewExport["baseDataset"];
  sourceReview: {
    schemaVersion: 1;
    generatedAt: string;
    generatedBy: S2ReviewExport["generatedBy"];
    sha256: string;
  };
  generatedAt: string;
  generatedBy: S2ReviewExport["generatedBy"];
  reviewer: S2ReviewExport["reviewer"];
  persistence: "browser-local-download";
  complete: boolean;
  eligibleSampleIds: string[];
  pendingSampleIds: string[];
  targetCalibrationSampleIds: string[];
  placementResolutionSampleIds: string[];
  reviews: ProtectionCalibrationRecord[];
  placementResolutions: PlacementResolutionRecord[];
};

export type ProtectionCalibrationSuggestion = {
  sampleId: string;
  replacementProtectionTargets: readonly RegressionTarget[];
};

export type PlacementResolutionSuggestion = {
  action?: ReviewAction;
  acceptablePlacements: readonly ReviewPlacement[];
  preferredPlacement?: ReviewPlacement | null;
};

export type ProtectionCalibrationSeed = {
  suggestions?: readonly ProtectionCalibrationSuggestion[];
  placementResolutions?: Readonly<Record<string, PlacementResolutionSuggestion>>;
};

export type NewProtectionTarget = {
  kind: string;
  required: boolean;
  rect: NormalizedRect;
};

export const MIN_REVIEW_TARGET_SIZE = 0.02;

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
    schemaVersion: 3,
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
    || value.schemaVersion !== 3
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

function cloneProtectionTargets(targets: RegressionTarget[]) {
  return targets.map((target) => ({ ...target, rect: { ...target.rect } }));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function clampReviewTargetRect(rect: NormalizedRect): NormalizedRect {
  const values = [rect.x, rect.y, rect.width, rect.height];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Protection target coordinates must be finite numbers");
  }
  const x = clamp(rect.x, 0, 1 - MIN_REVIEW_TARGET_SIZE);
  const y = clamp(rect.y, 0, 1 - MIN_REVIEW_TARGET_SIZE);
  return {
    x,
    y,
    width: clamp(rect.width, MIN_REVIEW_TARGET_SIZE, 1 - x),
    height: clamp(rect.height, MIN_REVIEW_TARGET_SIZE, 1 - y),
  };
}

/** Moves a normalized target without changing its size when it reaches a frame edge. */
export function moveReviewTargetRect(
  rect: NormalizedRect,
  deltaX: number,
  deltaY: number,
): NormalizedRect {
  const normalized = clampReviewTargetRect(rect);
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
    throw new Error("Protection target movement must use finite numbers");
  }
  return {
    ...normalized,
    x: clamp(normalized.x + deltaX, 0, 1 - normalized.width),
    y: clamp(normalized.y + deltaY, 0, 1 - normalized.height),
  };
}

function adjustmentReviews(review: S2ReviewExport) {
  return review.reviews.filter((item) => item.productReview.targetAssessment === "needs-adjustment");
}

function requireV1ReviewExport(manifest: RegressionManifest, value: unknown): S2ReviewExport {
  if (!isObject(value) || value.schemaVersion !== 1) {
    throw new Error("Protection calibration requires a schema v1 product-review export");
  }
  const issues = validateReviewExport(manifest, value);
  if (issues.length > 0) throw new Error(`Source product review is invalid: ${issues.join("; ")}`);
  return value as unknown as S2ReviewExport;
}

function sourceReviewSignature(review: S2ReviewExport) {
  return JSON.stringify(review);
}

function normalizeSeed(
  sourceReview: S2ReviewExport,
  seed: ProtectionCalibrationSeed,
) {
  const adjustableIds = new Set(adjustmentReviews(sourceReview).map((review) => review.sampleId));
  const sourceById = new Map(sourceReview.reviews.map((review) => [review.sampleId, review]));
  const suggestions = new Map<string, RegressionTarget[]>();
  for (const suggestion of seed.suggestions ?? []) {
    if (!adjustableIds.has(suggestion.sampleId)) {
      throw new Error(`${suggestion.sampleId}: protection targets are not editable`);
    }
    if (suggestions.has(suggestion.sampleId)) throw new Error(`${suggestion.sampleId}: duplicate calibration suggestion`);
    const targets = readProtectionTargets(suggestion.replacementProtectionTargets, suggestion.sampleId);
    if (!targets) throw new Error(`${suggestion.sampleId}: calibration suggestion targets are invalid`);
    suggestions.set(suggestion.sampleId, targets);
  }

  const placementResolutions = new Map<string, {
    action: ReviewAction;
    acceptablePlacements: ReviewPlacement[];
    preferredPlacement: ReviewPlacement | null;
  }>();
  for (const [sampleId, suggestion] of Object.entries(seed.placementResolutions ?? {})) {
    const source = sourceById.get(sampleId);
    if (!source) throw new Error(`${sampleId}: placement resolution is not part of the source review`);
    const acceptablePlacements = readReviewPlacements(suggestion.acceptablePlacements);
    const action = suggestion.action ?? (acceptablePlacements?.length ? "show-card" : "defer");
    const preferredPlacement = suggestion.preferredPlacement ?? null;
    if (!acceptablePlacements
      || (action === "show-card" && acceptablePlacements.length === 0)
      || (action === "defer" && acceptablePlacements.length > 0)
      || (preferredPlacement !== null && !acceptablePlacements.includes(preferredPlacement))) {
      throw new Error(`${sampleId}: placement resolution suggestion is invalid`);
    }
    placementResolutions.set(sampleId, { action, acceptablePlacements, preferredPlacement });
  }
  return { suggestions, placementResolutions };
}

function seedSignature(
  sourceReview: S2ReviewExport,
  seed: ProtectionCalibrationSeed,
) {
  const normalized = normalizeSeed(sourceReview, seed);
  return JSON.stringify({
    suggestions: [...normalized.suggestions.entries()].sort(([left], [right]) => left.localeCompare(right)),
    placementResolutions: [...normalized.placementResolutions.entries()].sort(([left], [right]) => left.localeCompare(right)),
  });
}

export function createProtectionCalibrationWorkspace(
  manifest: RegressionManifest,
  sourceReviewValue: unknown,
  seed: ProtectionCalibrationSeed = {},
): ProtectionCalibrationWorkspace {
  const sourceReview = requireV1ReviewExport(manifest, sourceReviewValue);
  const normalizedSeed = normalizeSeed(sourceReview, seed);
  const samples = new Map(manifest.samples.map((sample) => [sample.id, sample]));
  const items = adjustmentReviews(sourceReview).map((review) => {
    const sample = samples.get(review.sampleId);
    if (!sample) throw new Error(`${review.sampleId}: sample is missing from the manifest`);
    const originalProtectionTargets = cloneProtectionTargets(sample.protectionTargets);
    const replacementProtectionTargets = normalizedSeed.suggestions.get(sample.id)
      ?? cloneProtectionTargets(originalProtectionTargets);
    const largestUsedOrdinal = Math.max(
      0,
      ...replacementProtectionTargets.map((target) => generatedTargetOrdinal(sample.id, target.id)),
    );
    const item: ProtectionCalibrationItem = {
      sampleId: sample.id,
      frameSha256: sample.frameSha256,
      originalDraftSignature: review.agentDraft.draftSignature,
      sourceReviewConfirmedAt: review.confirmedAt,
      originalProtectionTargets,
      replacementProtectionTargets: cloneProtectionTargets(replacementProtectionTargets),
      nextTargetOrdinal: largestUsedOrdinal + 1,
      note: "",
      confirmedAt: null,
    };
    return [sample.id, item] as const;
  });
  const sourceById = new Map(sourceReview.reviews.map((review) => [review.sampleId, review]));
  const placementResolutions = [...normalizedSeed.placementResolutions.entries()].map(([sampleId, suggestion]) => {
    const source = sourceById.get(sampleId);
    if (!source) throw new Error(`${sampleId}: source review is missing`);
    const item: PlacementResolutionItem = {
      sampleId,
      frameSha256: source.frameSha256,
      originalDraftSignature: source.agentDraft.draftSignature,
      sourceReviewConfirmedAt: source.confirmedAt,
      originalAction: source.productReview.action,
      originalAcceptablePlacements: [...source.productReview.acceptablePlacements],
      action: suggestion.action,
      acceptablePlacements: [...suggestion.acceptablePlacements],
      preferredPlacement: suggestion.preferredPlacement,
      note: "",
      confirmedAt: null,
    };
    return [sampleId, item] as const;
  });
  return {
    schemaVersion: 3,
    kind: "admind-s2-protection-calibration-workspace",
    datasetId: manifest.datasetId,
    manifestCreatedAt: manifest.createdAt,
    sourceAssetSha256: manifest.source.sha256,
    sourceReviewSignature: sourceReviewSignature(sourceReview),
    seedSignature: seedSignature(sourceReview, seed),
    items: Object.fromEntries(items),
    placementResolutions: Object.fromEntries(placementResolutions),
  };
}

function isNormalizedProtectionTarget(value: unknown, sampleId: string): value is RegressionTarget {
  if (!isObject(value)
    || typeof value.id !== "string"
    || value.id.trim().length === 0
    || typeof value.kind !== "string"
    || value.kind.trim().length === 0
    || typeof value.required !== "boolean"
    || !isObject(value.rect)) return false;
  const rect = value.rect as Record<string, unknown>;
  if (![rect.x, rect.y, rect.width, rect.height].every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))) {
    return false;
  }
  const normalized = clampReviewTargetRect(rect as NormalizedRect);
  if (normalized.x !== rect.x
    || normalized.y !== rect.y
    || normalized.width !== rect.width
    || normalized.height !== rect.height) return false;
  const originalId = !value.id.startsWith(`${sampleId}-review-target-`);
  const generatedId = new RegExp(`^${sampleId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-review-target-[1-9]\\d*$`).test(value.id);
  return originalId || generatedId;
}

function readProtectionTargets(value: unknown, sampleId: string): RegressionTarget[] | null {
  if (!Array.isArray(value) || !value.every((target) => isNormalizedProtectionTarget(target, sampleId))) return null;
  const targets = value as RegressionTarget[];
  return new Set(targets.map((target) => target.id)).size === targets.length
    ? cloneProtectionTargets(targets)
    : null;
}

function generatedTargetOrdinal(sampleId: string, targetId: string) {
  const match = new RegExp(`^${sampleId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-review-target-(\\d+)$`).exec(targetId);
  return match ? Number(match[1]) : 0;
}

function restoreProtectionCalibrationItem(
  fallback: ProtectionCalibrationItem,
  value: unknown,
): ProtectionCalibrationItem {
  if (!isObject(value)
    || value.sampleId !== fallback.sampleId
    || value.frameSha256 !== fallback.frameSha256
    || value.originalDraftSignature !== fallback.originalDraftSignature
    || value.sourceReviewConfirmedAt !== fallback.sourceReviewConfirmedAt
    || JSON.stringify(value.originalProtectionTargets) !== JSON.stringify(fallback.originalProtectionTargets)) {
    return fallback;
  }
  const replacementProtectionTargets = readProtectionTargets(value.replacementProtectionTargets, fallback.sampleId);
  const nextTargetOrdinal = value.nextTargetOrdinal;
  const largestUsedOrdinal = replacementProtectionTargets
    ? Math.max(0, ...replacementProtectionTargets.map((target) => generatedTargetOrdinal(fallback.sampleId, target.id)))
    : 0;
  if (!replacementProtectionTargets
    || !Number.isSafeInteger(nextTargetOrdinal)
    || (nextTargetOrdinal as number) < 1
    || (nextTargetOrdinal as number) <= largestUsedOrdinal) {
    return fallback;
  }
  const note = typeof value.note === "string" ? value.note.slice(0, 500) : "";
  const confirmedAt = validIsoTimestamp(value.confirmedAt) ? value.confirmedAt : null;
  const restored: ProtectionCalibrationItem = {
    ...fallback,
    replacementProtectionTargets,
    nextTargetOrdinal: nextTargetOrdinal as number,
    note,
    confirmedAt,
  };
  return confirmedAt && !canConfirmProtectionCalibration(restored)
    ? { ...restored, confirmedAt: null }
    : restored;
}

function validPlacementDecision(
  action: unknown,
  placements: unknown,
  preferredPlacement: unknown,
): { action: ReviewAction; acceptablePlacements: ReviewPlacement[]; preferredPlacement: ReviewPlacement | null } | null {
  const acceptablePlacements = readReviewPlacements(placements);
  const preferred = preferredPlacement === null || REVIEW_PLACEMENTS.has(preferredPlacement as ReviewPlacement)
    ? preferredPlacement as ReviewPlacement | null
    : undefined;
  if ((action !== "show-card" && action !== "defer")
    || !acceptablePlacements
    || preferred === undefined
    || (action === "show-card" && acceptablePlacements.length === 0)
    || (action === "defer" && acceptablePlacements.length > 0)
    || (preferred !== null && !acceptablePlacements.includes(preferred))) return null;
  return { action: action as ReviewAction, acceptablePlacements, preferredPlacement: preferred };
}

function restorePlacementResolutionItem(
  fallback: PlacementResolutionItem,
  value: unknown,
): PlacementResolutionItem {
  if (!isObject(value)
    || value.sampleId !== fallback.sampleId
    || value.frameSha256 !== fallback.frameSha256
    || value.originalDraftSignature !== fallback.originalDraftSignature
    || value.sourceReviewConfirmedAt !== fallback.sourceReviewConfirmedAt
    || value.originalAction !== fallback.originalAction
    || !Array.isArray(value.originalAcceptablePlacements)
    || !samePlacements(value.originalAcceptablePlacements as ReviewPlacement[], fallback.originalAcceptablePlacements)) {
    return fallback;
  }
  const decision = validPlacementDecision(value.action, value.acceptablePlacements, value.preferredPlacement);
  if (!decision) return fallback;
  const note = typeof value.note === "string" ? value.note.slice(0, 500) : "";
  const confirmedAt = validIsoTimestamp(value.confirmedAt) ? value.confirmedAt : null;
  const restored = { ...fallback, ...decision, note, confirmedAt };
  return confirmedAt && !canConfirmPlacementResolution(restored) ? { ...restored, confirmedAt: null } : restored;
}

export function restoreProtectionCalibrationWorkspace(
  manifest: RegressionManifest,
  sourceReviewValue: unknown,
  value: unknown,
  seed: ProtectionCalibrationSeed = {},
): ProtectionCalibrationWorkspace {
  const fallback = createProtectionCalibrationWorkspace(manifest, sourceReviewValue, seed);
  if (!isObject(value)
    || value.schemaVersion !== 3
    || value.kind !== fallback.kind
    || value.datasetId !== fallback.datasetId
    || value.manifestCreatedAt !== fallback.manifestCreatedAt
    || value.sourceAssetSha256 !== fallback.sourceAssetSha256
    || value.sourceReviewSignature !== fallback.sourceReviewSignature
    || value.seedSignature !== fallback.seedSignature
    || !isObject(value.items)
    || !isObject(value.placementResolutions)) {
    return fallback;
  }
  const savedItems = value.items;
  const savedPlacementResolutions = value.placementResolutions;
  return {
    ...fallback,
    items: Object.fromEntries(Object.entries(fallback.items).map(([sampleId, item]) => [
      sampleId,
      restoreProtectionCalibrationItem(item, savedItems[sampleId]),
    ])),
    placementResolutions: Object.fromEntries(Object.entries(fallback.placementResolutions).map(([sampleId, item]) => [
      sampleId,
      restorePlacementResolutionItem(item, savedPlacementResolutions[sampleId]),
    ])),
  };
}

function updateProtectionCalibrationItem(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  update: (item: ProtectionCalibrationItem) => ProtectionCalibrationItem,
) {
  const item = workspace.items[sampleId];
  if (!item) throw new Error(`${sampleId}: protection targets are not editable`);
  return { ...workspace, items: { ...workspace.items, [sampleId]: update(item) } };
}

export function addReplacementProtectionTarget(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  target: NewProtectionTarget,
) {
  const kind = target.kind.trim();
  if (!kind) throw new Error("Protection target kind is required");
  let targetId = "";
  const nextWorkspace = updateProtectionCalibrationItem(workspace, sampleId, (item) => {
    const ids = new Set(item.replacementProtectionTargets.map((candidate) => candidate.id));
    let ordinal = item.nextTargetOrdinal;
    do {
      targetId = `${sampleId}-review-target-${ordinal}`;
      ordinal += 1;
    } while (ids.has(targetId));
    return {
      ...item,
      replacementProtectionTargets: [...item.replacementProtectionTargets, {
        id: targetId,
        kind,
        required: target.required,
        rect: clampReviewTargetRect(target.rect),
      }],
      nextTargetOrdinal: ordinal,
      confirmedAt: null,
    };
  });
  return { workspace: nextWorkspace, targetId };
}

export function updateReplacementProtectionTarget(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  targetId: string,
  rect: NormalizedRect,
) {
  return updateProtectionCalibrationItem(workspace, sampleId, (item) => {
    if (!item.replacementProtectionTargets.some((target) => target.id === targetId)) {
      throw new Error(`${sampleId}/${targetId}: protection target does not exist`);
    }
    return {
      ...item,
      replacementProtectionTargets: item.replacementProtectionTargets.map((target) => target.id === targetId
        ? { ...target, rect: clampReviewTargetRect(rect) }
        : target),
      confirmedAt: null,
    };
  });
}

export function deleteReplacementProtectionTarget(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  targetId: string,
) {
  return updateProtectionCalibrationItem(workspace, sampleId, (item) => {
    if (!item.replacementProtectionTargets.some((target) => target.id === targetId)) {
      throw new Error(`${sampleId}/${targetId}: protection target does not exist`);
    }
    return {
      ...item,
      replacementProtectionTargets: item.replacementProtectionTargets.filter((target) => target.id !== targetId),
      confirmedAt: null,
    };
  });
}

export function setProtectionCalibrationNote(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  note: string,
) {
  return updateProtectionCalibrationItem(workspace, sampleId, (item) => ({
    ...item,
    note: note.slice(0, 500),
    confirmedAt: null,
  }));
}

export function canConfirmProtectionCalibration(item: ProtectionCalibrationItem) {
  return item.note.trim().length > 0
    && item.note.trim().length <= 500
    && JSON.stringify(item.replacementProtectionTargets) !== JSON.stringify(item.originalProtectionTargets)
    && readProtectionTargets(item.replacementProtectionTargets, item.sampleId) !== null;
}

export function confirmProtectionCalibration(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  confirmedAt: string,
) {
  if (!validIsoTimestamp(confirmedAt)) throw new Error("confirmedAt must be an ISO timestamp");
  return updateProtectionCalibrationItem(workspace, sampleId, (item) => {
    if (!canConfirmProtectionCalibration(item)) throw new Error("Protection calibration is incomplete");
    return { ...item, note: item.note.trim(), confirmedAt };
  });
}

export function revokeProtectionCalibration(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
) {
  return updateProtectionCalibrationItem(workspace, sampleId, (item) => ({ ...item, confirmedAt: null }));
}

function updatePlacementResolutionItem(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  update: (item: PlacementResolutionItem) => PlacementResolutionItem,
) {
  const item = workspace.placementResolutions[sampleId];
  if (!item) throw new Error(`${sampleId}: placement resolution is not editable`);
  return {
    ...workspace,
    placementResolutions: { ...workspace.placementResolutions, [sampleId]: update(item) },
  };
}

export function setPlacementResolution(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  action: ReviewAction,
  acceptablePlacementsValue: readonly ReviewPlacement[],
  preferredPlacement: ReviewPlacement | null = null,
) {
  const decision = validPlacementDecision(action, acceptablePlacementsValue, preferredPlacement);
  if (!decision) throw new Error(`${sampleId}: placement resolution is invalid`);
  return updatePlacementResolutionItem(workspace, sampleId, (item) => ({
    ...item,
    ...decision,
    confirmedAt: null,
  }));
}

export function setPlacementResolutionNote(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  note: string,
) {
  return updatePlacementResolutionItem(workspace, sampleId, (item) => ({
    ...item,
    note: note.slice(0, 500),
    confirmedAt: null,
  }));
}

export function canConfirmPlacementResolution(item: PlacementResolutionItem) {
  return item.note.trim().length > 0
    && item.note.trim().length <= 500
    && validPlacementDecision(item.action, item.acceptablePlacements, item.preferredPlacement) !== null;
}

export function confirmPlacementResolution(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
  confirmedAt: string,
) {
  if (!validIsoTimestamp(confirmedAt)) throw new Error("confirmedAt must be an ISO timestamp");
  return updatePlacementResolutionItem(workspace, sampleId, (item) => {
    if (!canConfirmPlacementResolution(item)) throw new Error("Placement resolution is incomplete");
    return { ...item, note: item.note.trim(), confirmedAt };
  });
}

export function revokePlacementResolution(
  workspace: ProtectionCalibrationWorkspace,
  sampleId: string,
) {
  return updatePlacementResolutionItem(workspace, sampleId, (item) => ({ ...item, confirmedAt: null }));
}

function calibrationWorkspaceIssues(
  expected: ProtectionCalibrationWorkspace,
  workspace: ProtectionCalibrationWorkspace,
) {
  const issues: string[] = [];
  if (workspace.schemaVersion !== expected.schemaVersion
    || workspace.kind !== expected.kind
    || workspace.datasetId !== expected.datasetId
    || workspace.manifestCreatedAt !== expected.manifestCreatedAt
    || workspace.sourceAssetSha256 !== expected.sourceAssetSha256
    || workspace.sourceReviewSignature !== expected.sourceReviewSignature
    || workspace.seedSignature !== expected.seedSignature) {
    issues.push("calibration workspace provenance does not match");
  }
  const expectedIds = Object.keys(expected.items);
  const actualIds = Object.keys(workspace.items);
  if (actualIds.length !== expectedIds.length || !expectedIds.every((sampleId) => actualIds.includes(sampleId))) {
    issues.push("calibration workspace items do not match the adjustable review set");
  }
  for (const sampleId of expectedIds) {
    const expectedItem = expected.items[sampleId];
    const item = workspace.items[sampleId];
    if (!item
      || item.frameSha256 !== expectedItem.frameSha256
      || item.originalDraftSignature !== expectedItem.originalDraftSignature
      || item.sourceReviewConfirmedAt !== expectedItem.sourceReviewConfirmedAt
      || JSON.stringify(item.originalProtectionTargets) !== JSON.stringify(expectedItem.originalProtectionTargets)
      || readProtectionTargets(item.replacementProtectionTargets, sampleId) === null) {
      issues.push(`${sampleId}: calibration item is invalid`);
    }
  }
  const expectedResolutionIds = Object.keys(expected.placementResolutions);
  const actualResolutionIds = Object.keys(workspace.placementResolutions);
  if (actualResolutionIds.length !== expectedResolutionIds.length
    || !expectedResolutionIds.every((sampleId) => actualResolutionIds.includes(sampleId))) {
    issues.push("calibration placement resolutions do not match the seed");
  }
  for (const sampleId of expectedResolutionIds) {
    const expectedItem = expected.placementResolutions[sampleId];
    const item = workspace.placementResolutions[sampleId];
    if (!item
      || item.frameSha256 !== expectedItem.frameSha256
      || item.originalDraftSignature !== expectedItem.originalDraftSignature
      || item.sourceReviewConfirmedAt !== expectedItem.sourceReviewConfirmedAt
      || item.originalAction !== expectedItem.originalAction
      || !samePlacements(item.originalAcceptablePlacements, expectedItem.originalAcceptablePlacements)
      || validPlacementDecision(item.action, item.acceptablePlacements, item.preferredPlacement) === null) {
      issues.push(`${sampleId}: placement resolution item is invalid`);
    }
  }
  return issues;
}

export function buildProtectionCalibrationExport(
  manifest: RegressionManifest,
  sourceReviewValue: unknown,
  workspace: ProtectionCalibrationWorkspace,
  options: {
    generatedAt?: string;
    appVersion: string;
    gitCommit: string;
    seed?: ProtectionCalibrationSeed;
    sourceReviewSha256: string;
  },
): S2ReviewExportV2 {
  const sourceReview = requireV1ReviewExport(manifest, sourceReviewValue);
  const expectedWorkspace = createProtectionCalibrationWorkspace(manifest, sourceReview, options.seed);
  const issues = calibrationWorkspaceIssues(expectedWorkspace, workspace);
  if (issues.length > 0) throw new Error(issues.join("; "));
  const sourceReviews = new Map(adjustmentReviews(sourceReview).map((review) => [review.sampleId, review]));
  const targetCalibrationSampleIds = Object.keys(expectedWorkspace.items);
  const placementResolutionSampleIds = Object.keys(expectedWorkspace.placementResolutions);
  const eligibleSampleIds = [...new Set([...targetCalibrationSampleIds, ...placementResolutionSampleIds])];
  const reviews = targetCalibrationSampleIds.flatMap((sampleId): ProtectionCalibrationRecord[] => {
    const item = workspace.items[sampleId];
    const source = sourceReviews.get(sampleId);
    if (!item?.confirmedAt || !source || !canConfirmProtectionCalibration(item)) return [];
    return [{
      sampleId,
      frameSha256: item.frameSha256,
      scope: "replacement-protection-targets",
      originalDraftSignature: item.originalDraftSignature,
      sourceReviewConfirmedAt: item.sourceReviewConfirmedAt,
      sourceProductReview: structuredClone(source.productReview),
      replacementProtectionTargets: cloneProtectionTargets(item.replacementProtectionTargets),
      note: item.note.trim(),
      confirmedAt: item.confirmedAt,
    }];
  });
  const placementResolutions = placementResolutionSampleIds.flatMap((sampleId): PlacementResolutionRecord[] => {
    const item = workspace.placementResolutions[sampleId];
    if (!item?.confirmedAt || !canConfirmPlacementResolution(item)) return [];
    return [{
      sampleId,
      frameSha256: item.frameSha256,
      scope: "placement-resolution",
      originalDraftSignature: item.originalDraftSignature,
      sourceReviewConfirmedAt: item.sourceReviewConfirmedAt,
      originalAction: item.originalAction,
      originalAcceptablePlacements: [...item.originalAcceptablePlacements],
      resolvedAction: item.action,
      resolvedAcceptablePlacements: [...item.acceptablePlacements],
      preferredPlacement: item.preferredPlacement,
      note: item.note.trim(),
      confirmedAt: item.confirmedAt,
    }];
  });
  const reviewedTargetIds = new Set(reviews.map((review) => review.sampleId));
  const resolvedPlacementIds = new Set(placementResolutions.map((resolution) => resolution.sampleId));
  const pendingSampleIds = eligibleSampleIds.filter((sampleId) => (
    (targetCalibrationSampleIds.includes(sampleId) && !reviewedTargetIds.has(sampleId))
    || (placementResolutionSampleIds.includes(sampleId) && !resolvedPlacementIds.has(sampleId))
  ));
  if (!/^[a-f0-9]{64}$/.test(options.sourceReviewSha256)) {
    throw new Error("sourceReviewSha256 must be a lowercase SHA-256 digest");
  }
  return {
    schemaVersion: 2,
    kind: "admind-s2-product-review",
    baseDataset: structuredClone(sourceReview.baseDataset),
    sourceReview: {
      schemaVersion: 1,
      generatedAt: sourceReview.generatedAt,
      generatedBy: structuredClone(sourceReview.generatedBy),
      sha256: options.sourceReviewSha256,
    },
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    generatedBy: { appVersion: options.appVersion, gitCommit: options.gitCommit },
    reviewer: structuredClone(sourceReview.reviewer),
    persistence: "browser-local-download",
    complete: pendingSampleIds.length === 0,
    eligibleSampleIds,
    pendingSampleIds,
    targetCalibrationSampleIds,
    placementResolutionSampleIds,
    reviews,
    placementResolutions,
  };
}

export function protectionCalibrationStorageKey(manifest: RegressionManifest) {
  return `admind:s2-protection-calibration:${manifest.datasetId}:v4`;
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
function validateV1ReviewExport(manifest: RegressionManifest, value: unknown) {
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

function sameStringSet(value: unknown, expected: string[]) {
  return Array.isArray(value)
    && value.every((item) => typeof item === "string")
    && new Set(value).size === value.length
    && value.length === expected.length
    && expected.every((item) => value.includes(item));
}

function validateV2ReviewExport(
  manifest: RegressionManifest,
  value: Record<string, unknown>,
  sourceReviewValue: unknown,
  sourceReviewSha256: string | undefined,
  calibrationSeed: ProtectionCalibrationSeed | undefined,
) {
  if (!isObject(sourceReviewValue) || sourceReviewValue.schemaVersion !== 1) {
    return ["schema v2 requires the source schema v1 product-review export"];
  }
  const sourceIssues = validateV1ReviewExport(manifest, sourceReviewValue);
  if (sourceIssues.length > 0) return sourceIssues.map((issue) => `source review: ${issue}`);
  const sourceReview = sourceReviewValue as unknown as S2ReviewExport;
  const issues: string[] = [];
  if (value.kind !== "admind-s2-product-review") issues.push("kind is invalid");
  if (JSON.stringify(value.baseDataset) !== JSON.stringify(sourceReview.baseDataset)) {
    issues.push("baseDataset does not match the source review");
  }
  if (!sourceReviewSha256 || !/^[a-f0-9]{64}$/.test(sourceReviewSha256)) {
    return ["schema v2 requires the source schema v1 SHA-256"];
  }
  const expectedSource = {
    schemaVersion: 1,
    generatedAt: sourceReview.generatedAt,
    generatedBy: sourceReview.generatedBy,
    sha256: sourceReviewSha256,
  };
  if (JSON.stringify(value.sourceReview) !== JSON.stringify(expectedSource)) {
    issues.push("sourceReview provenance does not match the supplied schema v1 export");
  }
  if (calibrationSeed === undefined) {
    return ["schema v2 requires the trusted calibration seed"];
  }
  let expectedPlacementResolutionIds: string[];
  try {
    expectedPlacementResolutionIds = [...normalizeSeed(sourceReview, calibrationSeed).placementResolutions.keys()];
  } catch {
    return ["schema v2 calibration seed is invalid"];
  }
  if (!validIsoTimestamp(value.generatedAt)) issues.push("generatedAt is invalid");
  if (!isObject(value.generatedBy)
    || typeof value.generatedBy.appVersion !== "string"
    || typeof value.generatedBy.gitCommit !== "string") issues.push("generatedBy is invalid");
  if (JSON.stringify(value.reviewer) !== JSON.stringify(sourceReview.reviewer)) issues.push("reviewer contract is invalid");
  if (value.persistence !== "browser-local-download") issues.push("persistence is invalid");

  const sourceById = new Map(sourceReview.reviews.map((review) => [review.sampleId, review]));
  const sampleById = new Map(manifest.samples.map((sample) => [sample.id, sample]));
  const expectedTargetIds = adjustmentReviews(sourceReview).map((review) => review.sampleId);
  if (!sameStringSet(value.targetCalibrationSampleIds, expectedTargetIds)) {
    issues.push("targetCalibrationSampleIds do not match the needs-adjustment review set");
  }
  const placementResolutionIds = expectedPlacementResolutionIds;
  if (!sameStringSet(value.placementResolutionSampleIds, placementResolutionIds)) {
    issues.push("placementResolutionSampleIds do not match the trusted calibration seed");
  }
  const expectedEligibleIds = [...new Set([...expectedTargetIds, ...placementResolutionIds])];
  if (!sameStringSet(value.eligibleSampleIds, expectedEligibleIds)) issues.push("eligibleSampleIds are invalid");

  const rawReviews = Array.isArray(value.reviews) ? value.reviews : [];
  if (!Array.isArray(value.reviews)) issues.push("reviews must be an array");
  const reviewedTargetIds = new Set<string>();
  for (const raw of rawReviews) {
    if (!isObject(raw) || typeof raw.sampleId !== "string") {
      issues.push("calibration review record is invalid");
      continue;
    }
    const sampleId = raw.sampleId;
    const source = sourceById.get(sampleId);
    const sample = sampleById.get(sampleId);
    if (!expectedTargetIds.includes(sampleId) || !source || !sample) {
      issues.push(`${sampleId}: sample is not eligible for protection calibration`);
      continue;
    }
    if (reviewedTargetIds.has(sampleId)) issues.push(`${sampleId}: duplicate calibration review`);
    reviewedTargetIds.add(sampleId);
    if (raw.frameSha256 !== sample.frameSha256) issues.push(`${sampleId}: frameSha256 does not match`);
    if (raw.scope !== "replacement-protection-targets") issues.push(`${sampleId}: calibration scope is invalid`);
    if (raw.originalDraftSignature !== source.agentDraft.draftSignature) issues.push(`${sampleId}: originalDraftSignature does not match`);
    if (raw.sourceReviewConfirmedAt !== source.confirmedAt) issues.push(`${sampleId}: sourceReviewConfirmedAt does not match`);
    if (JSON.stringify(raw.sourceProductReview) !== JSON.stringify(source.productReview)) {
      issues.push(`${sampleId}: sourceProductReview does not match`);
    }
    const targets = readProtectionTargets(raw.replacementProtectionTargets, sampleId);
    if (!targets) {
      issues.push(`${sampleId}: replacementProtectionTargets are invalid`);
    } else if (JSON.stringify(targets) === JSON.stringify(sample.protectionTargets)) {
      issues.push(`${sampleId}: replacementProtectionTargets did not change`);
    }
    if (typeof raw.note !== "string" || raw.note.trim().length === 0 || raw.note.trim().length > 500) {
      issues.push(`${sampleId}: calibration note is invalid`);
    }
    if (!validIsoTimestamp(raw.confirmedAt)) issues.push(`${sampleId}: calibration confirmedAt is invalid`);
  }

  const rawResolutions = Array.isArray(value.placementResolutions) ? value.placementResolutions : [];
  if (!Array.isArray(value.placementResolutions)) issues.push("placementResolutions must be an array");
  const resolvedPlacementIds = new Set<string>();
  for (const raw of rawResolutions) {
    if (!isObject(raw) || typeof raw.sampleId !== "string") {
      issues.push("placement resolution record is invalid");
      continue;
    }
    const sampleId = raw.sampleId;
    const source = sourceById.get(sampleId);
    if (!placementResolutionIds.includes(sampleId) || !source) {
      issues.push(`${sampleId}: sample is not eligible for placement resolution`);
      continue;
    }
    if (resolvedPlacementIds.has(sampleId)) issues.push(`${sampleId}: duplicate placement resolution`);
    resolvedPlacementIds.add(sampleId);
    if (raw.frameSha256 !== source.frameSha256) issues.push(`${sampleId}: placement frameSha256 does not match`);
    if (raw.scope !== "placement-resolution") issues.push(`${sampleId}: placement resolution scope is invalid`);
    if (raw.originalDraftSignature !== source.agentDraft.draftSignature) issues.push(`${sampleId}: placement originalDraftSignature does not match`);
    if (raw.sourceReviewConfirmedAt !== source.confirmedAt) issues.push(`${sampleId}: placement sourceReviewConfirmedAt does not match`);
    const originalPlacements = readReviewPlacements(raw.originalAcceptablePlacements);
    if (raw.originalAction !== source.productReview.action
      || !originalPlacements
      || !samePlacements(originalPlacements, source.productReview.acceptablePlacements)) {
      issues.push(`${sampleId}: original placement decision does not match the source review`);
    }
    if (!validPlacementDecision(raw.resolvedAction, raw.resolvedAcceptablePlacements, raw.preferredPlacement)) {
      issues.push(`${sampleId}: resolved placement decision is invalid`);
    }
    if (typeof raw.note !== "string" || raw.note.trim().length === 0 || raw.note.trim().length > 500) {
      issues.push(`${sampleId}: placement resolution note is invalid`);
    }
    if (!validIsoTimestamp(raw.confirmedAt)) issues.push(`${sampleId}: placement resolution confirmedAt is invalid`);
  }

  const expectedPending = expectedEligibleIds.filter((sampleId) => (
    (expectedTargetIds.includes(sampleId) && !reviewedTargetIds.has(sampleId))
    || (placementResolutionIds.includes(sampleId) && !resolvedPlacementIds.has(sampleId))
  ));
  if (!sameStringSet(value.pendingSampleIds, expectedPending)) issues.push("pendingSampleIds do not match the calibration records");
  if (value.complete !== (expectedPending.length === 0)) issues.push("complete is inconsistent with pending calibration work");
  return issues;
}

/** Validates both the archived schema-v1 review and schema-v2 calibration exports. */
export function validateReviewExport(
  manifest: RegressionManifest,
  value: unknown,
  sourceReviewValue?: unknown,
  sourceReviewSha256?: string,
  calibrationSeed?: ProtectionCalibrationSeed,
) {
  if (isObject(value) && value.schemaVersion === 2) {
    return validateV2ReviewExport(manifest, value, sourceReviewValue, sourceReviewSha256, calibrationSeed);
  }
  return validateV1ReviewExport(manifest, value);
}

export function reviewStorageKey(manifest: RegressionManifest) {
  return `admind:s2-review:${manifest.datasetId}:v3`;
}

export function reviewExportFilename(manifest: RegressionManifest, generatedAt: string) {
  const date = generatedAt.slice(0, 10);
  return `${manifest.datasetId}-product-review-${date}.json`;
}
