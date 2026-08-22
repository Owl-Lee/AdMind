import { describe, expect, it } from "vitest";
import { choosePauseAdPlacement, choosePauseAdPlacementForEvidence } from "./pause-decision";

describe("choosePauseAdPlacement", () => {
  it("fails closed when local visual evidence is unavailable", () => {
    expect(choosePauseAdPlacementForEvidence("unavailable", [], "model unavailable")).toEqual({
      placement: "none",
      assessments: [],
      reason: "model unavailable",
    });
  });

  it("moves the card away from a face on the left", () => {
    const decision = choosePauseAdPlacement([{ x: 0.02, y: 0.04, width: 0.34, height: 0.3 }]);
    expect(decision.placement).toBe("top-right");
  });

  it("moves the card away from a face on the right", () => {
    const decision = choosePauseAdPlacement([{ x: 0.65, y: 0.04, width: 0.34, height: 0.3 }]);
    expect(decision.placement).toBe("top-left");
  });

  it("prefers the top because subtitles and controls reserve the bottom", () => {
    const decision = choosePauseAdPlacement([]);
    expect(decision.placement).toBe("top-left");
    expect(decision.assessments.find((item) => item.placement === "top-left")?.region.height).toBe(0.3);
    expect(decision.assessments.find((item) => item.placement === "bottom-left")?.risk).toBeGreaterThan(0);
  });

  it("does not double-count duplicate boxes for the same visual target", () => {
    const target = { x: 0.02, y: 0.04, width: 0.34, height: 0.3 };
    const once = choosePauseAdPlacement([target]);
    const duplicated = choosePauseAdPlacement([target, target]);
    expect(duplicated.assessments).toEqual(once.assessments);
  });

  it("rejects all placements when faces occupy both upper corners and the bottom is reserved", () => {
    const decision = choosePauseAdPlacement([
      { x: 0, y: 0, width: 0.46, height: 0.4 },
      { x: 0.54, y: 0, width: 0.46, height: 0.4 },
    ]);
    expect(decision.placement).toBe("none");
  });
});
