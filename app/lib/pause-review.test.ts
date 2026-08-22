import { describe, expect, it } from "vitest";
import manifestJson from "../../evaluation/s2/manifest.json";
import type { RegressionManifest } from "./pause-regression";
import {
  buildReviewExport,
  canConfirmReview,
  chooseReviewAction,
  confirmReview,
  createReviewWorkspace,
  restoreReviewWorkspace,
  revokeReview,
  toggleReviewPlacement,
} from "./pause-review";

const manifest = manifestJson as RegressionManifest;

describe("S2 product review workspace", () => {
  it("creates a seven-sample queue from the agent drafts", () => {
    const workspace = createReviewWorkspace(manifest);
    expect(Object.keys(workspace.items)).toEqual([
      "charge-003",
      "charge-009",
      "charge-010",
      "charge-011",
      "charge-014",
      "charge-015",
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
    expect(exported.pendingSampleIds).toHaveLength(6);
    expect(exported.reviews[0]).not.toHaveProperty("protectionTargets");
    expect(manifest.samples.find((sample) => sample.id === sampleId)?.reviewStatus).toBe("needs-user-review");
  });
});
