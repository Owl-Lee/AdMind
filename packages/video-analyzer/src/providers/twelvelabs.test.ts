import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyze: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  retrieve: vi.fn(),
}));

vi.mock("twelvelabs-js", () => ({
  TwelveLabs: class {
    assets = {
      create: mocks.create,
      delete: mocks.delete,
      retrieve: mocks.retrieve,
    };

    analyze = mocks.analyze;
  },
}));

import { analyzeWithTwelveLabs } from "./twelvelabs";

const input = {
  apiKey: "test-key",
  filePath: "package.json",
} as const;

describe("analyzeWithTwelveLabs asset lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({ id: "asset-1" });
    mocks.delete.mockResolvedValue(undefined);
  });

  it("deletes the uploaded asset after successful analysis", async () => {
    mocks.retrieve.mockResolvedValue({ status: "ready" });
    mocks.analyze.mockResolvedValue({ data: '{"segments":[],"candidateBreaks":[],"limitations":[]}' });

    await expect(analyzeWithTwelveLabs(input)).resolves.toMatchObject({ model: "pegasus1.5" });
    expect(mocks.delete).toHaveBeenCalledExactlyOnceWith("asset-1");
  });

  it("deletes the uploaded asset when processing fails", async () => {
    mocks.retrieve.mockResolvedValue({ status: "failed" });

    await expect(analyzeWithTwelveLabs(input)).rejects.toThrow("could not process the video");
    expect(mocks.delete).toHaveBeenCalledExactlyOnceWith("asset-1");
  });

  it("deletes the uploaded asset when analysis throws", async () => {
    mocks.retrieve.mockResolvedValue({ status: "ready" });
    mocks.analyze.mockRejectedValue(new Error("provider unavailable"));

    await expect(analyzeWithTwelveLabs(input)).rejects.toThrow("provider unavailable");
    expect(mocks.delete).toHaveBeenCalledExactlyOnceWith("asset-1");
  });
});
