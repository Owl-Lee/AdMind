import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FaceDetectionEvidence } from "./vision-pipeline";
import type { VisionWorkerRequest, VisionWorkerResponse } from "./vision-worker-protocol";

const pipeline = vi.hoisted(() => ({
  createVisionRuntime: vi.fn(),
  runVisionPipeline: vi.fn(),
}));

vi.mock("./vision-pipeline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./vision-pipeline")>();
  return { ...actual, ...pipeline };
});
vi.mock("./vision.worker.ts?worker&url", () => ({ default: "/vision.worker.js" }));

type WorkerBehavior = "boot-and-answer" | "init-failed" | "crash-on-detect" | "never-boot" | "hang";

const workerEvidence: FaceDetectionEvidence = {
  status: "ready",
  faces: [{ x: 0.4, y: 0.3, width: 0.1, height: 0.2, confidence: 0.9, source: "face-direct" }],
  subjects: [],
  inferenceMs: 12,
  message: "worker",
};
const mainThreadEvidence: FaceDetectionEvidence = { ...workerEvidence, inferenceMs: 34, message: "main-thread" };

let behavior: WorkerBehavior = "boot-and-answer";
const createdWorkers: FakeWorker[] = [];

class FakeWorker {
  terminated = false;
  private listeners = new Map<string, Array<(event: unknown) => void>>();

  constructor(readonly url: string, readonly options: WorkerOptions) {
    createdWorkers.push(this);
    if (behavior !== "never-boot") queueMicrotask(() => this.emit("message", { data: { type: "booted" } }));
  }

  addEventListener(type: string, listener: (event: unknown) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  postMessage(request: VisionWorkerRequest, transfer: Transferable[]) {
    expect(transfer).toEqual([request.frame]);
    queueMicrotask(() => {
      if (behavior === "boot-and-answer") this.reply({ type: "result", id: request.id, evidence: workerEvidence });
      if (behavior === "init-failed") this.reply({ type: "init-failed", id: request.id, message: "no WebGL in worker" });
      if (behavior === "crash-on-detect") this.emit("error", { message: "worker crashed", preventDefault() {} });
    });
  }

  terminate() {
    this.terminated = true;
  }

  private reply(data: VisionWorkerResponse) {
    this.emit("message", { data });
  }

  private emit(type: string, event: unknown) {
    if (this.terminated) return;
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

const fakeVideo = { videoWidth: 1280, videoHeight: 720, readyState: 4 } as HTMLVideoElement;

async function loadDetector() {
  vi.resetModules();
  return import("./face-detector");
}

describe("paused-frame vision transport", () => {
  beforeEach(() => {
    behavior = "boot-and-answer";
    createdWorkers.length = 0;
    pipeline.createVisionRuntime.mockReset().mockResolvedValue({});
    pipeline.runVisionPipeline.mockReset().mockReturnValue(mainThreadEvidence);
    vi.stubGlobal("window", {});
    vi.stubGlobal("Worker", FakeWorker);
    vi.stubGlobal("OffscreenCanvas", class {});
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 1280, height: 720, close: vi.fn() })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("runs inference in a module worker and leaves the main-thread pipeline idle", async () => {
    const detector = await loadDetector();
    await expect(detector.detectFacesInPausedFrame(fakeVideo)).resolves.toEqual(workerEvidence);
    expect(createdWorkers).toHaveLength(1);
    expect(createdWorkers[0].options).toMatchObject({ type: "module" });
    expect(pipeline.runVisionPipeline).not.toHaveBeenCalled();
    expect(detector.getPauseVisionTransportStatus()).toMatchObject({ last: "worker", workerDisabledReason: null });
  });

  it("falls back to the main-thread pipeline when the worker cannot create detectors", async () => {
    behavior = "init-failed";
    const detector = await loadDetector();
    await expect(detector.detectFacesInPausedFrame(fakeVideo)).resolves.toEqual(mainThreadEvidence);
    expect(createdWorkers[0].terminated).toBe(true);
    expect(detector.getPauseVisionTransportStatus()).toMatchObject({ last: "main-thread", workerDisabledReason: "no WebGL in worker" });
  });

  it("fails closed for the in-flight frame when the worker crashes, then uses the main thread", async () => {
    behavior = "crash-on-detect";
    const detector = await loadDetector();
    const crashed = await detector.detectFacesInPausedFrame(fakeVideo);
    expect(crashed.status).toBe("unavailable");
    expect(crashed.faces).toEqual([]);
    expect(pipeline.runVisionPipeline).not.toHaveBeenCalled();
    await expect(detector.detectFacesInPausedFrame(fakeVideo)).resolves.toEqual(mainThreadEvidence);
    expect(createdWorkers).toHaveLength(1);
  });

  it("fails closed when the worker misses the response deadline", async () => {
    behavior = "hang";
    vi.useFakeTimers();
    const detector = await loadDetector();
    const pending = detector.detectFacesInPausedFrame(fakeVideo);
    await vi.advanceTimersByTimeAsync(30_000);
    const evidence = await pending;
    expect(evidence.status).toBe("unavailable");
    expect(evidence.message).toContain("超时");
    expect(createdWorkers[0].terminated).toBe(true);
  });

  it("uses the main thread when the worker never boots", async () => {
    behavior = "never-boot";
    vi.useFakeTimers();
    const detector = await loadDetector();
    const pending = detector.detectFacesInPausedFrame(fakeVideo);
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toEqual(mainThreadEvidence);
    expect(detector.getPauseVisionTransportStatus().workerDisabledReason).toBe("worker boot timed out");
  });

  it("uses the main thread when module workers are unsupported", async () => {
    vi.stubGlobal("Worker", undefined);
    const detector = await loadDetector();
    expect(detector.supportsPauseVisionWorker()).toBe(false);
    await expect(detector.detectFacesInPausedFrame(fakeVideo)).resolves.toEqual(mainThreadEvidence);
    expect(createdWorkers).toHaveLength(0);
  });

  it("keeps the main-thread fallback fail-closed when detectors cannot load", async () => {
    vi.stubGlobal("Worker", undefined);
    pipeline.createVisionRuntime.mockRejectedValue(new Error("model 404"));
    const detector = await loadDetector();
    const evidence = await detector.detectFacesInPausedFrame(fakeVideo);
    expect(evidence).toMatchObject({ status: "unavailable", faces: [], subjects: [] });
    expect(evidence.message).toContain("model 404");
  });

  it("rejects an undecoded frame before choosing a transport", async () => {
    const detector = await loadDetector();
    const evidence = await detector.detectFacesInPausedFrame({ videoWidth: 0, videoHeight: 0, readyState: 0 } as HTMLVideoElement);
    expect(evidence.status).toBe("unavailable");
    expect(createdWorkers).toHaveLength(0);
  });
});
