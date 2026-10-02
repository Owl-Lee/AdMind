/// <reference types="vite/client" />
import visionWorkerUrl from "./vision.worker.ts?worker&url";
import {
  PAUSE_VISION_CANDIDATES,
  createVisionRuntime,
  runVisionPipeline,
  unavailableEvidence,
  visionErrorMessage,
  type FaceDetectionEvidence,
  type PauseVisionCandidateId,
  type VisionRuntime,
  type VisualSource,
} from "./vision-pipeline";
import type { VisionWorkerRequest, VisionWorkerResponse } from "./vision-worker-protocol";

export {
  PAUSE_VISION_CANDIDATES,
  PAUSE_VISION_CONFIG_V5,
  PAUSE_VISION_CONFIG_V6,
  filterUnsupportedCropSubjects,
  isPauseVisionCandidateId,
} from "./vision-pipeline";
export type {
  DetectedFace,
  DetectedSubject,
  FaceDetectionEvidence,
  PauseVisionCandidateId,
  PauseVisionConfig,
} from "./vision-pipeline";

/**
 * Public S2 paused-frame vision API.
 *
 * Inference runs in a dedicated module worker when the browser supports
 * `Worker`, `OffscreenCanvas` and `createImageBitmap`; the main thread only
 * captures the paused frame as an `ImageBitmap` and transfers it.
 *
 * Fallback and fail-closed contract:
 * - No worker support, or the worker cannot boot / cannot create the required
 *   detectors before any inference starts: run the identical pipeline on the
 *   main thread (the pre-worker behavior). If that also fails, the frame is
 *   `unavailable` and no ad is placed.
 * - The worker crashes or misses the response deadline while a frame is in
 *   flight: that frame is `unavailable` (no ad, task deferred) and later
 *   pauses use the main-thread pipeline. A late or stale worker reply is
 *   ignored here, and callers still guard delivery with their pause-session
 *   token.
 */

// `s2-vision-v6` (person-mask bands) stays opt-in via `/regression?vision=s2-vision-v6`.
// On the agent-draft fixed set it removed two over-deferrals without changing
// the four blocking unsafe placements, but it newly placed a card on the
// diagnostic `charge-015` draft that expects deferral and lowered raw target
// matching. It is not promoted until reviewed labels confirm the trade-off.
export const DEFAULT_PAUSE_VISION_CANDIDATE: PauseVisionCandidateId = "s2-vision-v5";
export const PAUSE_VISION_CONFIG = PAUSE_VISION_CANDIDATES[DEFAULT_PAUSE_VISION_CANDIDATE];

export type PauseVisionTransport = "worker" | "main-thread";
export type PauseVisionTransportStatus = {
  preferred: "auto" | "main-thread";
  /** Transport that produced the most recent evidence, if any. */
  last: PauseVisionTransport | null;
  /** Why the worker is not used, when it has been disabled. */
  workerDisabledReason: string | null;
};

const WORKER_BOOT_TIMEOUT_MS = 10_000;
// Covers a cold start (WASM + three models) plus inference on slow devices.
const WORKER_RESPONSE_TIMEOUT_MS = 30_000;

const transportStatus: PauseVisionTransportStatus = {
  preferred: "auto",
  last: null,
  workerDisabledReason: null,
};

type WorkerOutcome =
  | { kind: "evidence"; evidence: FaceDetectionEvidence }
  | { kind: "init-failed"; message: string }
  | { kind: "crashed"; message: string }
  | { kind: "timeout" };

class VisionWorkerClient {
  readonly ready: Promise<boolean>;
  private readonly worker: Worker;
  private readonly pending = new Map<number, (outcome: WorkerOutcome) => void>();
  private nextId = 1;
  private failure: string | null = null;
  private markBooted: (booted: boolean) => void = () => undefined;

  constructor() {
    this.worker = new Worker(visionWorkerUrl, {
      type: "module",
      name: "admind-pause-vision",
    });
    this.ready = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        this.fail("worker boot timed out");
      }, WORKER_BOOT_TIMEOUT_MS);
      this.markBooted = (booted) => {
        clearTimeout(timer);
        resolve(booted);
      };
    });
    this.worker.addEventListener("message", (event: MessageEvent<VisionWorkerResponse>) => this.handle(event.data));
    this.worker.addEventListener("error", (event) => {
      event.preventDefault();
      this.fail(`worker error: ${event.message || "script failed to load"}`);
    });
    this.worker.addEventListener("messageerror", () => this.fail("worker message could not be deserialized"));
  }

  get failureReason() {
    return this.failure;
  }

  detect(frame: ImageBitmap, candidateId: PauseVisionCandidateId): Promise<WorkerOutcome> {
    if (this.failure) {
      frame.close();
      return Promise.resolve({ kind: "crashed", message: this.failure });
    }
    const id = this.nextId;
    this.nextId += 1;
    return new Promise<WorkerOutcome>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ kind: "timeout" });
      }, WORKER_RESPONSE_TIMEOUT_MS);
      this.pending.set(id, (outcome) => {
        clearTimeout(timer);
        resolve(outcome);
      });
      const request: VisionWorkerRequest = { type: "detect", id, candidateId, frame };
      try {
        this.worker.postMessage(request, [frame]);
      } catch (error) {
        frame.close();
        this.pending.delete(id);
        clearTimeout(timer);
        resolve({ kind: "crashed", message: error instanceof Error ? error.message : "postMessage failed" });
      }
    });
  }

  terminate(reason: string) {
    this.fail(reason);
  }

  private handle(message: VisionWorkerResponse) {
    if (!message) return;
    if (message.type === "booted") {
      this.markBooted(true);
      return;
    }
    const settle = this.pending.get(message.id);
    if (!settle) return; // Timed out earlier; the stale reply is ignored.
    this.pending.delete(message.id);
    settle(message.type === "result"
      ? { kind: "evidence", evidence: message.evidence }
      : { kind: "init-failed", message: message.message });
  }

  private fail(reason: string) {
    if (this.failure) return;
    this.failure = reason;
    this.markBooted(false);
    for (const settle of this.pending.values()) settle({ kind: "crashed", message: reason });
    this.pending.clear();
    this.worker.terminate();
  }
}

let workerClient: VisionWorkerClient | null = null;
const mainThreadRuntimes = new Map<PauseVisionCandidateId, Promise<VisionRuntime>>();

export function supportsPauseVisionWorker() {
  return typeof window !== "undefined"
    && typeof Worker !== "undefined"
    && typeof OffscreenCanvas !== "undefined"
    && typeof createImageBitmap === "function";
}

/** Diagnostics for the regression lab and browser tests. */
export function getPauseVisionTransportStatus(): PauseVisionTransportStatus {
  return { ...transportStatus };
}

/** Forces the main-thread pipeline (used for A/B latency measurement). */
export function setPauseVisionTransportPreference(preference: PauseVisionTransportStatus["preferred"]) {
  transportStatus.preferred = preference;
}

function disableWorker(reason: string) {
  transportStatus.workerDisabledReason = reason;
  workerClient?.terminate(reason);
  workerClient = null;
}

function getWorkerClient() {
  if (transportStatus.preferred === "main-thread" || transportStatus.workerDisabledReason) return null;
  if (!supportsPauseVisionWorker()) {
    transportStatus.workerDisabledReason = "worker, OffscreenCanvas or createImageBitmap unsupported";
    return null;
  }
  if (!workerClient) {
    try {
      workerClient = new VisionWorkerClient();
    } catch (error) {
      transportStatus.workerDisabledReason = error instanceof Error ? error.message : "worker construction failed";
      return null;
    }
  }
  return workerClient;
}

async function detectOnMainThread(
  visual: VisualSource,
  sourceWidth: number,
  sourceHeight: number,
  candidateId: PauseVisionCandidateId,
): Promise<FaceDetectionEvidence> {
  transportStatus.last = "main-thread";
  let runtime = mainThreadRuntimes.get(candidateId);
  if (!runtime) {
    runtime = createVisionRuntime(PAUSE_VISION_CANDIDATES[candidateId]);
    mainThreadRuntimes.set(candidateId, runtime);
  }
  try {
    return runVisionPipeline(await runtime, visual, sourceWidth, sourceHeight);
  } catch (error) {
    mainThreadRuntimes.delete(candidateId);
    return unavailableEvidence(visionErrorMessage(error));
  }
}

async function detectInVisualSource(
  visual: HTMLVideoElement | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  candidateId: PauseVisionCandidateId,
): Promise<FaceDetectionEvidence> {
  const client = getWorkerClient();
  if (client) {
    const booted = await client.ready;
    if (!booted || client.failureReason) {
      disableWorker(client.failureReason ?? "worker failed to boot");
    } else {
      let frame: ImageBitmap | null = null;
      try {
        frame = await createImageBitmap(visual);
      } catch {
        frame = null;
      }
      if (frame) {
        const outcome = await client.detect(frame, candidateId);
        if (outcome.kind === "evidence") {
          transportStatus.last = "worker";
          return outcome.evidence;
        }
        if (outcome.kind === "init-failed") {
          // No inference started in the worker; the same frame may safely use
          // the main-thread pipeline, which fails closed on its own.
          disableWorker(outcome.message);
        } else {
          transportStatus.last = "worker";
          disableWorker(outcome.kind === "timeout" ? "worker response timed out" : outcome.message);
          return unavailableEvidence(outcome.kind === "timeout"
            ? "本地视觉推理超时，本次暂停不展示广告并进入待交付队列。"
            : "本地视觉推理中断，本次暂停不展示广告并进入待交付队列。");
        }
      }
    }
  }
  return detectOnMainThread(visual, sourceWidth, sourceHeight, candidateId);
}

export async function detectFacesInPausedFrame(video: HTMLVideoElement): Promise<FaceDetectionEvidence> {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
    return unavailableEvidence("当前帧尚未解码。");
  }
  return detectInVisualSource(video, video.videoWidth, video.videoHeight, DEFAULT_PAUSE_VISION_CANDIDATE);
}

export async function detectFacesInRegressionFrame(
  image: HTMLImageElement,
  candidateId: PauseVisionCandidateId = DEFAULT_PAUSE_VISION_CANDIDATE,
): Promise<FaceDetectionEvidence> {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
    return unavailableEvidence("固定回归帧尚未解码。");
  }
  return detectInVisualSource(image, image.naturalWidth, image.naturalHeight, candidateId);
}
