import { describe, expect, it } from "vitest";
import { translateUiText } from "./ui-localization";

describe("UI localization", () => {
  it("translates the primary product navigation and headline", () => {
    expect(translateUiText("体验演示 · 决策方式")).toBe("Experience · Decision logic");
    expect(translateUiText("广告必须出现，也不必毁掉剧情。")).toBe("Ads must appear—without ruining the story.");
  });

  it("translates dynamic evidence while preserving timestamps and scores", () => {
    expect(translateUiText("00:45 战斗高潮；证据评分 0.90")).toBe("00:45 Battle climax；Evidence score 0.90");
  });
});
