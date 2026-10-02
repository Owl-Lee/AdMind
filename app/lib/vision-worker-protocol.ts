import type { FaceDetectionEvidence, PauseVisionCandidateId } from "./vision-pipeline";

export type VisionWorkerRequest = {
  type: "detect";
  id: number;
  candidateId: PauseVisionCandidateId;
  /** Transferred to the worker; the worker closes it after inference. */
  frame: ImageBitmap;
};

export type VisionWorkerResponse =
  | { type: "booted" }
  | { type: "result"; id: number; evidence: FaceDetectionEvidence }
  | { type: "init-failed"; id: number; message: string };
