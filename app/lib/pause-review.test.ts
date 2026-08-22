import { describe, expect, it } from "vitest";
import manifestJson from "../../evaluation/s2/manifest.json";
import reviewJson from "../../evaluation/s2/reviews/2026-08-22-product-owner.json";
import type { RegressionManifest } from "./pause-regression";
import { S2_CALIBRATION_DRAFTS, S2_PLACEMENT_RESOLUTION } from "./s2-calibration-seed";
import {
  addReplacementProtectionTarget,
  buildProtectionCalibrationExport,
  buildReviewExport,
  canConfirmProtectionCalibration,
  confirmPlacementResolution,
  confirmProtectionCalibration,
  canConfirmReview,
  chooseReviewAction,
  confirmReview,
  createProtectionCalibrationWorkspace,
  createReviewWorkspace,
  deleteReplacementProtectionTarget,
  moveReviewTargetRect,
  protectionCalibrationStorageKey,
  reviewStorageKey,
  restoreProtectionCalibrationWorkspace,
  restoreReviewWorkspace,
  revokeReview,
  setPlacementResolutionNote,
  setProtectionCalibrationNote,
  toggleReviewPlacement,
  updateReplacementProtectionTarget,
  validateReviewExport,
  type ProtectionCalibrationSeed,
  type S2ReviewExport,
} from "./pause-review";

const manifest = manifestJson as RegressionManifest;
const sourceReview = reviewJson as S2ReviewExport;
const sourceReviewSha256 = "a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256";

const adjustableIds = sourceReview.reviews
  .filter((review) => review.productReview.targetAssessment === "needs-adjustment")
  .map((review) => review.sampleId);

function calibrationSeed(): ProtectionCalibrationSeed {
  return {
    suggestions: adjustableIds.map((sampleId) => {
      const original = manifest.samples.find((sample) => sample.id === sampleId)?.protectionTargets ?? [];
      return {
        sampleId,
        replacementProtectionTargets: sampleId === "charge-008"
          ? []
          : original.map((target, index) => index === 0
            ? { ...target, rect: { ...target.rect, x: Math.min(0.97, target.rect.x + 0.01) } }
            : structuredClone(target)),
      };
    }),
    placementResolutions: {
      "charge-005": { acceptablePlacements: ["top-left", "top-right"] },
      "charge-008": { acceptablePlacements: ["top-left", "top-right"] },
      "charge-009": { acceptablePlacements: ["top-left", "top-right"], preferredPlacement: "top-left" },
    },
  };
}

describe("S2 product review workspace", () => {
  it("creates a priority queue from pending and visually disputed agent drafts", () => {
    const workspace = createReviewWorkspace(manifest);
    expect(Object.keys(workspace.items)).toEqual([
      "charge-002",
      "charge-003",
      "charge-005",
      "charge-008",
      "charge-009",
      "charge-010",
      "charge-011",
      "charge-013",
      "charge-014",
      "charge-015",
      "charge-016",
      "charge-018",
      "charge-019",
    ]);
    expect(workspace.items["charge-003"].action).toBe("defer");
    expect(workspace.items["charge-009"].acceptablePlacements).toEqual(["top-right"]);
    expect(workspace.items["charge-019"].acceptablePlacements).toEqual(["top-left", "top-right"]);
    expect(Object.values(workspace.items).every((item) => item.confirmedAt === null)).toBe(true);
  });

  it("keeps defer and placement choices mutually exclusive", () => {
    const initial = createReviewWorkspace(manifest).items["charge-003"];
    const placed = toggleReviewPlacement(initial, "top-left");
    expect(placed.action).toBe("show-card");
    expect(placed.acceptablePlacements).toEqual(["top-left"]);
    expect(chooseReviewAction(placed, "defer")).toMatchObject({
      action: "defer",
      acceptablePlacements: [],
      confirmedAt: null,
    });
  });

  it("requires all three review steps before confirmation", () => {
    const initial = createReviewWorkspace(manifest).items["charge-003"];
    expect(canConfirmReview(initial)).toBe(false);
    const complete = { ...initial, targetAssessment: "correct" as const, note: "Draft box is acceptable." };
    expect(canConfirmReview(complete)).toBe(true);
    expect(confirmReview(complete, "2026-08-21T16:00:00.000Z").confirmedAt).toBe("2026-08-21T16:00:00.000Z");
    expect(() => confirmReview(initial, "2026-08-21T16:00:00.000Z")).toThrow("Review is incomplete");
  });

  it("revokes confirmation without discarding the reviewed decision", () => {
    const initial = createReviewWorkspace(manifest).items["charge-009"];
    const complete = { ...initial, targetAssessment: "needs-adjustment" as const, note: "Tighten the left target." };
    const confirmed = confirmReview(complete, "2026-08-21T16:00:00.000Z");
    expect(revokeReview(confirmed)).toEqual({ ...confirmed, confirmedAt: null });
  });

  it("restores matching local data and rejects stale dataset data", () => {
    const workspace = createReviewWorkspace(manifest);
    workspace.items["charge-003"] = {
      ...workspace.items["charge-003"],
      targetAssessment: "correct",
      note: "Reviewed locally.",
    };
    expect(restoreReviewWorkspace(manifest, workspace).items["charge-003"].note).toBe("Reviewed locally.");
    expect(restoreReviewWorkspace(manifest, { ...workspace, datasetId: "stale" }).items["charge-003"].note).toBe("");
    const staleDraft = structuredClone(workspace);
    staleDraft.items["charge-003"].draftSignature = "stale-agent-draft";
    expect(restoreReviewWorkspace(manifest, staleDraft).items["charge-003"].note).toBe("");
    expect(restoreReviewWorkspace(manifest, { ...workspace, schemaVersion: 2 }).items["charge-003"].note).toBe("");
    expect(reviewStorageKey(manifest)).toContain(":v3");
  });

  it("exports confirmed reviews separately without changing the manifest contract", () => {
    const workspace = createReviewWorkspace(manifest);
    const sampleId = "charge-009";
    workspace.items[sampleId] = confirmReview({
      ...workspace.items[sampleId],
      targetAssessment: "correct",
      note: "Upper-right remains acceptable.",
    }, "2026-08-21T16:00:00.000Z");
    const exported = buildReviewExport(manifest, workspace, {
      generatedAt: "2026-08-21T16:01:00.000Z",
      appVersion: "0.3.0",
      gitCommit: "test",
    });
    expect(exported.persistence).toBe("browser-local-download");
    expect(exported.complete).toBe(false);
    expect(exported.reviews).toHaveLength(1);
    expect(exported.reviews[0]).toMatchObject({
      sampleId,
      scope: "placement-and-target-draft-review",
      placementChangedFromAgentDraft: false,
      productReview: { targetAssessment: "correct", action: "show-card", acceptablePlacements: ["top-right"] },
    });
    expect(exported.pendingSampleIds).toHaveLength(12);
    expect(exported.reviews[0].agentDraft.manifestReviewStatus).toBe("needs-user-review");
    expect(exported.reviews[0].agentDraft.draftSignature).toBe(workspace.items[sampleId].draftSignature);
    expect(exported.reviews[0]).not.toHaveProperty("protectionTargets");
    expect(manifest.samples.find((sample) => sample.id === sampleId)?.reviewStatus).toBe("needs-user-review");
  });
});

describe("S2 protection calibration data contract", () => {
  it("builds the tracked calibration plan with exactly eight box reviews and three placement resolutions", () => {
    const trackedSeed: ProtectionCalibrationSeed = {
      suggestions: S2_CALIBRATION_DRAFTS.map((draft) => ({
        sampleId: draft.sampleId,
        replacementProtectionTargets: draft.replacementProtectionTargets,
      })),
      placementResolutions: S2_PLACEMENT_RESOLUTION,
    };
    const workspace = createProtectionCalibrationWorkspace(manifest, sourceReview, trackedSeed);
    expect(Object.keys(workspace.items)).toHaveLength(8);
    expect(Object.keys(workspace.placementResolutions)).toEqual(["charge-005", "charge-008", "charge-009"]);
  });

  it("limits target editing to the eight explicit needs-adjustment reviews and accepts external seeds", () => {
    const seed = calibrationSeed();
    const workspace = createProtectionCalibrationWorkspace(manifest, sourceReview, seed);
    expect(Object.keys(workspace.items)).toEqual(adjustableIds);
    expect(Object.keys(workspace.placementResolutions)).toEqual(["charge-005", "charge-008", "charge-009"]);
    expect(workspace.items["charge-008"].replacementProtectionTargets).toEqual([]);
    expect(workspace.items).not.toHaveProperty("charge-009");
    expect(() => addReplacementProtectionTarget(workspace, "charge-009", {
      kind: "person",
      required: true,
      rect: { x: 0, y: 0, width: 0.2, height: 0.2 },
    })).toThrow("protection targets are not editable");
    expect(() => createProtectionCalibrationWorkspace(manifest, sourceReview, {
      suggestions: [{ sampleId: "charge-002", replacementProtectionTargets: [] }],
    })).toThrow("protection targets are not editable");
  });

  it("clamps normalized rectangles and never reuses generated target ids", () => {
    let workspace = createProtectionCalibrationWorkspace(manifest, sourceReview);
    const first = addReplacementProtectionTarget(workspace, "charge-005", {
      kind: " face ",
      required: true,
      rect: { x: 0.99, y: -4, width: 0.001, height: 4 },
    });
    workspace = first.workspace;
    expect(first.targetId).toBe("charge-005-review-target-1");
    expect(workspace.items["charge-005"].replacementProtectionTargets.at(-1)).toEqual({
      id: first.targetId,
      kind: "face",
      required: true,
      rect: { x: 0.98, y: 0, width: 0.02, height: 1 },
    });
    workspace = deleteReplacementProtectionTarget(workspace, "charge-005", first.targetId);
    const second = addReplacementProtectionTarget(workspace, "charge-005", {
      kind: "face",
      required: true,
      rect: { x: 0.2, y: 0.2, width: 0.2, height: 0.2 },
    });
    expect(second.targetId).toBe("charge-005-review-target-2");
    workspace = updateReplacementProtectionTarget(
      second.workspace,
      "charge-005",
      second.targetId,
      { x: -1, y: 0.99, width: 2, height: 0 },
    );
    expect(workspace.items["charge-005"].replacementProtectionTargets.at(-1)?.id).toBe(second.targetId);
    expect(workspace.items["charge-005"].replacementProtectionTargets.at(-1)?.rect)
      .toEqual({ x: 0, y: 0.98, width: 1, height: 0.02 });
  });

  it("binds restoration to schema, source review, and seed provenance", () => {
    const seed = calibrationSeed();
    let workspace = createProtectionCalibrationWorkspace(manifest, sourceReview, seed);
    workspace = setProtectionCalibrationNote(workspace, "charge-005", "Use the centered subject box.");
    workspace = confirmProtectionCalibration(workspace, "charge-005", "2026-08-22T12:00:00.000Z");
    expect(restoreProtectionCalibrationWorkspace(manifest, sourceReview, workspace, seed)
      .items["charge-005"].confirmedAt).toBe("2026-08-22T12:00:00.000Z");
    expect(restoreProtectionCalibrationWorkspace(manifest, sourceReview, { ...workspace, schemaVersion: 2 }, seed)
      .items["charge-005"].confirmedAt).toBeNull();
    expect(restoreProtectionCalibrationWorkspace(manifest, sourceReview, workspace, {})
      .items["charge-005"].confirmedAt).toBeNull();
    expect(protectionCalibrationStorageKey(manifest)).toContain(":v4");
  });

  it("exports and verifies a complete schema-v2 calibration without weakening schema v1", () => {
    const seed = calibrationSeed();
    let workspace = createProtectionCalibrationWorkspace(manifest, sourceReview, seed);
    for (const sampleId of adjustableIds) {
      expect(canConfirmProtectionCalibration(workspace.items[sampleId])).toBe(false);
      workspace = setProtectionCalibrationNote(workspace, sampleId, `Confirmed replacement targets for ${sampleId}.`);
      workspace = confirmProtectionCalibration(workspace, sampleId, "2026-08-22T12:00:00.000Z");
    }
    for (const sampleId of ["charge-005", "charge-008", "charge-009"]) {
      workspace = setPlacementResolutionNote(workspace, sampleId, `Resolved placement ambiguity for ${sampleId}.`);
      workspace = confirmPlacementResolution(workspace, sampleId, "2026-08-22T12:01:00.000Z");
    }
    const exported = buildProtectionCalibrationExport(manifest, sourceReview, workspace, {
      generatedAt: "2026-08-22T12:02:00.000Z",
      appVersion: "0.4.0",
      gitCommit: "test",
      seed,
      sourceReviewSha256,
    });
    expect(exported.complete).toBe(true);
    expect(exported.reviews).toHaveLength(8);
    expect(exported.placementResolutions.map((item) => item.sampleId)).toEqual([
      "charge-005",
      "charge-008",
      "charge-009",
    ]);
    expect(exported.reviews.every((item) => item.originalDraftSignature.length > 0)).toBe(true);
    expect(exported.reviews.every((item) => Array.isArray(item.replacementProtectionTargets))).toBe(true);
    expect(validateReviewExport(manifest, exported, sourceReview, sourceReviewSha256, seed)).toEqual([]);
    expect(validateReviewExport(manifest, sourceReview)).toEqual([]);
    expect(validateReviewExport(manifest, exported)).toEqual([
      "schema v2 requires the source schema v1 product-review export",
    ]);
    expect(validateReviewExport(manifest, exported, sourceReview)).toEqual([
      "schema v2 requires the source schema v1 SHA-256",
    ]);
    expect(validateReviewExport(manifest, exported, sourceReview, "0".repeat(64), seed))
      .toContain("sourceReview provenance does not match the supplied schema v1 export");
    expect(validateReviewExport(manifest, exported, sourceReview, sourceReviewSha256)).toEqual([
      "schema v2 requires the trusted calibration seed",
    ]);

    const stale = structuredClone(exported);
    stale.reviews[0].originalDraftSignature = "stale";
    expect(validateReviewExport(manifest, stale, sourceReview, sourceReviewSha256, seed))
      .toContain("charge-005: originalDraftSignature does not match");
    const invalidRect = structuredClone(exported);
    invalidRect.reviews[0].replacementProtectionTargets[0].rect.width = 0.001;
    expect(validateReviewExport(manifest, invalidRect, sourceReview, sourceReviewSha256, seed))
      .toContain("charge-005: replacementProtectionTargets are invalid");
    const missingResolution = structuredClone(exported);
    missingResolution.placementResolutionSampleIds = [];
    missingResolution.eligibleSampleIds = [...missingResolution.targetCalibrationSampleIds];
    missingResolution.placementResolutions = [];
    missingResolution.pendingSampleIds = [];
    missingResolution.complete = true;
    expect(validateReviewExport(manifest, missingResolution, sourceReview, sourceReviewSha256, seed))
      .toContain("placementResolutionSampleIds do not match the trusted calibration seed");
  });

  it("moves boxes to frame edges without shrinking them", () => {
    const rect = { x: 0.3, y: 0.2, width: 0.4, height: 0.6 };
    expect(moveReviewTargetRect(rect, 0.8, 0.8)).toEqual({ x: 0.6, y: 0.4, width: 0.4, height: 0.6 });
    expect(moveReviewTargetRect(rect, -0.8, -0.8)).toEqual({ x: 0, y: 0, width: 0.4, height: 0.6 });
  });
});
