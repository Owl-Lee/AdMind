import {
  PAUSE_VISION_CANDIDATES,
  closeVisionRuntime,
  createVisionRuntime,
  isPauseVisionCandidateId,
  runVisionPipeline,
  unavailableEvidence,
  visionErrorMessage,
  type PauseVisionCandidateId,
  type VisionRuntime,
} from "./vision-pipeline";
import type { VisionWorkerRequest, VisionWorkerResponse } from "./vision-worker-protocol";

/**
 * Module worker that owns MediaPipe for paused-frame inference so the
 * synchronous WASM work never blocks the player's main thread.
 */

type WorkerScope = {
  postMessage: (message: VisionWorkerResponse) => void;
  addEventListener: (type: "message", listener: (event: MessageEvent<VisionWorkerRequest>) => void) => void;
  importScripts?: (...urls: string[]) => void;
};

const scope = self as unknown as WorkerScope;
const runtimes = new Map<PauseVisionCandidateId, Promise<VisionRuntime>>();

function usesModuleLoader() {
  // Module workers expose `importScripts` but throw a TypeError when it is
  // called. Classic workers (for example an IIFE production bundle) accept it.
  try {
    if (typeof scope.importScripts !== "function") return true;
    scope.importScripts();
    return false;
  } catch {
    return true;
  }
}

function getRuntime(candidateId: PauseVisionCandidateId) {
  let runtime = runtimes.get(candidateId);
  if (!runtime) {
    runtime = createVisionRuntime(PAUSE_VISION_CANDIDATES[candidateId], { useModuleLoader: usesModuleLoader() });
    runtimes.set(candidateId, runtime);
  }
  return runtime;
}

function reply(message: VisionWorkerResponse) {
  scope.postMessage(message);
}

scope.addEventListener("message", async (event: MessageEvent<VisionWorkerRequest>) => {
  const request = event.data;
  if (!request || request.type !== "detect") return;
  const { id, frame, candidateId } = request;
  try {
    if (!isPauseVisionCandidateId(candidateId)) {
      reply({ type: "result", id, evidence: unavailableEvidence(`本地视觉模型暂不可用：unknown candidate ${String(candidateId)}`) });
      return;
    }
    let runtime: VisionRuntime;
    try {
      runtime = await getRuntime(candidateId);
    } catch (error) {
      runtimes.delete(candidateId);
      reply({ type: "init-failed", id, message: visionErrorMessage(error) });
      return;
    }
    try {
      reply({ type: "result", id, evidence: runVisionPipeline(runtime, frame, frame.width, frame.height) });
    } catch (error) {
      // Same semantics as the main-thread path: drop the runtime so the next
      // pause re-initializes, and report this frame as unavailable.
      runtimes.delete(candidateId);
      closeVisionRuntime(runtime);
      reply({ type: "result", id, evidence: unavailableEvidence(visionErrorMessage(error)) });
    }
  } finally {
    frame.close();
  }
});

reply({ type: "booted" });
