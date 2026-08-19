import { describe, expect, it } from "vitest";
import { choosePauseAdPlacement } from "./pause-decision";

describe("choosePauseAdPlacement", () => {
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
    expect(decision.assessments.find((item) => item.placement === "bottom-left")?.risk).toBeGreaterThan(0);
  });

  it("rejects all placements when faces occupy both upper corners and the bottom is reserved", () => {
    const decision = choosePauseAdPlacement([
      { x: 0, y: 0, width: 0.46, height: 0.4 },
      { x: 0.54, y: 0, width: 0.46, height: 0.4 },
    ]);
    expect(decision.placement).toBe("none");
  });
});
