import { describe, expect, it } from "vitest";
import { VideoAnalysisSchema } from "@admind/contracts";
import { aggregateAnalyses } from "../../video-analyzer/src/consensus";
import chargeRun1 from "../../../analysis/runs/charge-twelvelabs-01.json";
import chargeRun2 from "../../../analysis/runs/charge-twelvelabs-02.json";
import usnsMedicalRun from "../../../analysis/runs/usns-medical-twelvelabs.json";
import femaRecoveryRun from "../../../analysis/runs/fema-recovery-twelvelabs.json";
import { createS1Request, createS1RequestFromAnalysis, createS2Request, createS3Request, createS3RequestFromAnalysis, decide } from "./index";

describe("AdMind decision engine", () => {
  it("keeps the baseline at the fixed 45 second break", () => {
    const result = decide(createS1Request("baseline"));

    expect(result.outcome).toBe("scheduled");
    expect(result.selected).toMatchObject({
      timeSec: 45,
      durationSec: 15,
      format: "fullscreen",
      muted: false,
    });
  });

  it("moves S1 to the real video's safe transition and selects the approved short variant", () => {
    const result = decide(createS1Request("admind"));

    expect(result.outcome).toBe("scheduled");
    expect(result.selected).toMatchObject({
      timeSec: 82,
      durationSec: 6,
      format: "muted_card",
      muted: true,
    });
    expect(result.audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CREATIVE_UNAPPROVED", status: "reject" }),
        expect.objectContaining({ code: "LOW_DISRUPTION_WINDOW_SELECTED", status: "pass" }),
      ]),
    );
  });

  it("derives the S1 safe transition from validated live provider evidence", () => {
    const analyses = [VideoAnalysisSchema.parse(chargeRun1), VideoAnalysisSchema.parse(chargeRun2)];
    const consensus = aggregateAnalyses({ analyses, nominalOpportunitySec: 45, maxDeferralSec: 40 });
    const request = createS1RequestFromAnalysis(analyses[1], "admind", consensus);
    const result = decide(request);

    expect(request.scenario.safeOpportunitySec).toBe(85);
    expect(result.selected).toMatchObject({
      timeSec: 85,
      durationSec: 4,
      format: "muted_card",
    });
    expect(result.audit).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "MODEL_CONSENSUS_BLOCK", status: "reject" }),
      expect.objectContaining({ code: "DEGRADED_FORMAT_REQUIRED", status: "reject" }),
      expect.objectContaining({ code: "CONTENT_OVERRUN", status: "reject" }),
    ]));
  });

  it("never lets a high score override a frequency cap", () => {
    const request = createS1Request("admind");
    request.policy.frequencyCount = request.policy.frequencyCap;
    const result = decide(request);

    expect(result.outcome).toBe("blocked");
    expect(result.selected).toBeNull();
    expect(result.commercialShortfall).toBe(true);
    expect(result.audit.some((item) => item.code === "FREQUENCY_CAP")).toBe(true);
  });

  it("never moves an ad beyond the campaign delivery window", () => {
    const request = createS1Request("admind");
    request.campaigns[0].maxDeferralSec = 20;
    const result = decide(request);

    expect(result.outcome).toBe("scheduled");
    expect(result.selected?.timeSec).toBe(45);
    expect(result.audit.some((item) => item.code === "OUTSIDE_DELIVERY_WINDOW")).toBe(true);
  });

  it("blocks every commercial plan in a protected context", () => {
    const request = createS1Request("admind");
    request.scenario.sceneSignals = request.scenario.sceneSignals.map((signal) => ({
      ...signal,
      protectedContext: true,
    }));
    const result = decide(request);

    expect(result.outcome).toBe("blocked");
    expect(result.audit.some((item) => item.code === "PROTECTED_CONTEXT")).toBe(true);
  });

  it("rejects unapproved creative variants before ranking", () => {
    const result = decide(createS1Request("admind"));
    const rejected = result.audit.filter((item) => item.code === "CREATIVE_UNAPPROVED");

    expect(rejected).toHaveLength(2);
    expect(result.alternatives.every((item) => item.creativeId !== "creative-unapproved")).toBe(true);
  });

  it("keeps the traditional S2 pause ad as a full-screen interruption", () => {
    const result = decide(createS2Request("baseline"));

    expect(result.selected).toMatchObject({
      timeSec: 27,
      durationSec: 10,
      format: "fullscreen",
      muted: false,
    });
  });

  it("protects an inspection pause with a dismissible low-occlusion card", () => {
    const result = decide(createS2Request("admind"));

    expect(result.selected).toMatchObject({
      timeSec: 27,
      durationSec: 6,
      format: "pause_card",
      muted: true,
    });
    expect(result.audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ACTIVE_TASK_CONFLICT", status: "reject" }),
        expect.objectContaining({ code: "LOW_OCCLUSION_FORMAT_SELECTED", status: "pass" }),
      ]),
    );
  });

  it("defers S2 to the next boundary when the pause card is unavailable", () => {
    const request = createS2Request("admind");
    request.campaigns[0].creatives = request.campaigns[0].creatives.map((creative) =>
      creative.format === "pause_card" ? { ...creative, approved: false } : creative,
    );
    const result = decide(request);

    expect(result.selected).toMatchObject({
      timeSec: 35,
      format: "muted_card",
    });
  });

  it("blocks a high-value campaign when every executable plan violates a hard boundary", () => {
    const result = decide(createS3Request("admind"));

    expect(result.outcome).toBe("blocked");
    expect(result.selected).toBeNull();
    expect(result.commercialShortfall).toBe(true);
    expect(result.audit).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "PROTECTED_CONTEXT", status: "reject" }),
      expect.objectContaining({ code: "MODEL_CONSENSUS_BLOCK", status: "reject" }),
      expect.objectContaining({ code: "CONTENT_OVERRUN", status: "reject" }),
      expect.objectContaining({ code: "NO_ELIGIBLE_PLAN", status: "reject" }),
    ]));
  });

  it.each([
    ["medical evacuation", usnsMedicalRun, "来源标注为医疗后送任务", 10],
    ["disaster aftermath", femaRecoveryRun, "模型识别为灾难与创伤语境", 15],
  ])("combines live evidence with verified S3 policy for %s", (_name, rawAnalysis, policyReason, nominalOpportunitySec) => {
    const analysis = VideoAnalysisSchema.parse(rawAnalysis);
    const request = createS3RequestFromAnalysis(analysis, {
      title: "受保护纪实内容 × 高价保量广告",
      episodeTitle: "真实公共事件素材",
      policyReason,
      nominalOpportunitySec,
    });
    const result = decide(request);

    expect(request.scenario.durationSec).toBe(analysis.media.durationSec);
    expect(request.scenario.sceneSignals[0].label).toContain(policyReason);
    expect(result.outcome).toBe("blocked");
    expect(result.audit).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "PROTECTED_CONTEXT", status: "reject" }),
      expect.objectContaining({ code: "NO_ELIGIBLE_PLAN", status: "reject" }),
    ]));
  });
});
