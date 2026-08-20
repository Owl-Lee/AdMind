import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { translateUiText } from "./ui-localization";

describe("UI localization", () => {
  it("translates the primary product navigation and headline", () => {
    expect(translateUiText("体验演示 · 决策方式")).toBe("Experience · Decision logic");
    expect(translateUiText("广告必须出现，也不必毁掉剧情。")).toBe("Ads must appear—without ruining the story.");
    expect(`${translateUiText("也不必")}${translateUiText("毁掉剧情。")}`).toBe("without ruining the story.");
  });

  it("translates dynamic evidence while preserving timestamps and scores", () => {
    expect(translateUiText("00:45 战斗高潮；证据评分 0.90")).toBe("00:45 Battle climax；Evidence score 0.90");
  });

  it("keeps the interactive player fully English", () => {
    const samples = [
      "点击画面暂停，体验实时判断",
      "00:05 到点即播，不读取伦理信号",
      "hidden 取消；visible + blur 暂缓",
      "本次会话已拖动 4 次",
      "本次已经产生展示记录；用户主动关闭后，不再进入待交付队列。",
      "海上救援处于受保护区间；高价保量活动不得越过伦理边界。",
      "广告必须出现，也不必毁掉剧情。",
      "也不必",
    ];

    for (const sample of samples) {
      expect(translateUiText(sample)).not.toMatch(/[\u3400-\u9fff]/u);
    }
  });

  it("covers every Chinese UI literal used by the public showcase", () => {
    const files = [
      "../components/ShowcaseDemo.tsx",
      "../components/AdCreative.tsx",
      "../page.tsx",
      "./pause-decision.ts",
      "./face-detector.ts",
    ];
    const untranslated = new Set<string>();
    const literalPattern = /"([^"\r\n]*[\u3400-\u9fff][^"\r\n]*)"|'([^'\r\n]*[\u3400-\u9fff][^'\r\n]*)'|`([^`\r\n]*[\u3400-\u9fff][^`\r\n]*)`/gu;

    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      for (const match of source.matchAll(literalPattern)) {
        const literal = match[1] ?? match[2] ?? match[3] ?? "";
        if (/[\u3400-\u9fff]/u.test(translateUiText(literal))) untranslated.add(literal);
      }
    }

    expect([...untranslated].sort()).toEqual([]);
  });
});
