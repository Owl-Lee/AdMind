import type { NormalizedRect } from "./pause-decision";

export type FaceDetectionEvidence = {
  status: "ready" | "unavailable";
  faces: NormalizedRect[];
  inferenceMs: number;
  message: string;
};

let detectorPromise: Promise<import("@mediapipe/tasks-vision").FaceDetector> | null = null;

async function getDetector() {
  if (!detectorPromise) {
    detectorPromise = import("@mediapipe/tasks-vision").then(async ({ FaceDetector, FilesetResolver }) => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
      );
      return FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/blaze_face_full_range.tflite",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.42,
      });
    });
  }
  return detectorPromise;
}

export async function detectFacesInPausedFrame(video: HTMLVideoElement): Promise<FaceDetectionEvidence> {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
    return { status: "unavailable", faces: [], inferenceMs: 0, message: "当前帧尚未解码。" };
  }

  try {
    const detector = await getDetector();
    const startedAt = performance.now();
    const result = detector.detect(video);
    const inferenceMs = Math.round(performance.now() - startedAt);
    const faces = result.detections.flatMap((detection) => {
      const box = detection.boundingBox;
      if (!box) return [];
      return [{
        x: Math.max(0, box.originX / video.videoWidth),
        y: Math.max(0, box.originY / video.videoHeight),
        width: Math.min(1, box.width / video.videoWidth),
        height: Math.min(1, box.height / video.videoHeight),
      }];
    });
    return {
      status: "ready",
      faces,
      inferenceMs,
      message: faces.length > 0 ? `MediaPipe 检测到 ${faces.length} 张人脸。` : "MediaPipe 未在当前帧检测到人脸。",
    };
  } catch (error) {
    detectorPromise = null;
    return {
      status: "unavailable",
      faces: [],
      inferenceMs: 0,
      message: error instanceof Error ? `本地视觉模型暂不可用：${error.message}` : "本地视觉模型暂不可用。",
    };
  }
}
