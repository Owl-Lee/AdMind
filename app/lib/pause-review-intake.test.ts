import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifestJson from "../../evaluation/s2/manifest.json";
import reviewJson from "../../evaluation/s2/reviews/2026-08-22-product-owner.json";
import type { RegressionManifest } from "./pause-regression";
import type { S2ReviewExport } from "./pause-review";
import { validateReviewExport } from "./pause-review";

const manifest = manifestJson as RegressionManifest;
const review = reviewJson as S2ReviewExport;
const artifactPath = "evaluation/s2/reviews/2026-08-22-product-owner.json";

describe("S2 product-review intake", () => {
  it("locks the product owner's raw download to the archived bytes", () => {
    const digest = createHash("sha256").update(readFileSync(artifactPath)).digest("hex");
    expect(digest).toBe("a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256");
  });

  it("validates every reviewed frame and agent-draft signature against the manifest", () => {
    expect(validateReviewExport(manifest, review)).toEqual([]);
    expect(review.complete).toBe(true);
    expect(review.reviews).toHaveLength(13);
    expect(review.pendingSampleIds).toEqual([]);
  });

  it("does not confuse a complete priority queue with a fully reviewed 20-frame set", () => {
    expect(manifest.samples).toHaveLength(20);
    expect(review.eligibleSampleIds).toHaveLength(13);
    expect(manifest.samples.filter((sample) => !review.eligibleSampleIds.includes(sample.id)).map((sample) => sample.id))
      .toEqual([
        "charge-001",
        "charge-004",
        "charge-006",
        "charge-007",
        "charge-012",
        "charge-017",
        "charge-020",
      ]);
  });

  it("preserves accepted targets separately from requested coordinate adjustments", () => {
    expect(review.reviews.filter((item) => item.productReview.targetAssessment === "correct").map((item) => item.sampleId))
      .toEqual(["charge-002", "charge-003", "charge-009", "charge-010", "charge-014"]);
    expect(review.reviews.filter((item) => item.productReview.targetAssessment === "needs-adjustment").map((item) => item.sampleId))
      .toEqual([
        "charge-005",
        "charge-008",
        "charge-011",
        "charge-013",
        "charge-015",
        "charge-016",
        "charge-018",
        "charge-019",
      ]);
  });

  it("rejects an artifact tied to stale frame bytes or a stale green-box draft", () => {
    const staleFrame = structuredClone(review) as unknown as { reviews: Array<Record<string, unknown>> };
    staleFrame.reviews[0].frameSha256 = "stale";
    expect(validateReviewExport(manifest, staleFrame)).toContain("charge-002: frameSha256 does not match");

    const staleDraft = structuredClone(review) as unknown as {
      reviews: Array<{ agentDraft: Record<string, unknown> }>;
    };
    staleDraft.reviews[0].agentDraft.draftSignature = "stale";
    expect(validateReviewExport(manifest, staleDraft))
      .toContain("charge-002: agentDraft does not match the current manifest draft");
  });
});
