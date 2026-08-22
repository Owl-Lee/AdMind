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
    vi.useRealTimers();
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

  it("times out a stuck processing asset and still deletes it", async () => {
    vi.useFakeTimers();
    mocks.retrieve.mockResolvedValue({ status: "processing" });

    const analysis = analyzeWithTwelveLabs({ ...input, processingTimeoutMs: 10 }).catch((error) => error);
    await vi.advanceTimersByTimeAsync(10);

    await expect(analysis).resolves.toMatchObject({ message: "TwelveLabs processing timed out after 10 ms." });
    expect(mocks.delete).toHaveBeenCalledExactlyOnceWith("asset-1");
  });

  it("warns without discarding a successful result when cleanup fails", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.retrieve.mockResolvedValue({ status: "ready" });
    mocks.analyze.mockResolvedValue({ data: '{"segments":[],"candidateBreaks":[],"limitations":[]}' });
    mocks.delete.mockRejectedValue(new Error("provider cleanup unavailable"));

    await expect(analyzeWithTwelveLabs(input)).resolves.toMatchObject({ model: "pegasus1.5" });
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining("Remove the retained asset manually"),
      "provider cleanup unavailable",
    );

    warning.mockRestore();
  });
});
