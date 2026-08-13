import { describe, expect, it } from "vitest";
import { createS1Request, decide } from "./index";

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
        expect.objectContaining({ code: "SAFE_TRANSITION_SELECTED", status: "pass" }),
      ]),
    );
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
});
