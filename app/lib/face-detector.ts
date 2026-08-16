import type { NormalizedRect } from "./pause-decision";

export type FaceDetectionEvidence = {
  status: "ready" | "unavailable";
  faces: NormalizedRect[];
  inferenceMs: number;
  message: string;
};

let detectorPromise: Promise<import("@mediapipe/tasks-vision").FaceDetector> | null = null;
const PRIMARY_MIN_CONFIDENCE = 0.34;
const MIRROR_MIN_CONFIDENCE = 0.46;
const CROP_MIN_CONFIDENCE = 0.48;

type SourceRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FaceCandidate = NormalizedRect & {
  confidence: number;
};

const FULL_FRAME: SourceRegion = { x: 0, y: 0, width: 1, height: 1 };
const DETAIL_REGIONS: SourceRegion[] = [
  { x: 0, y: 0, width: 0.58, height: 1 },
  { x: 0.42, y: 0, width: 0.58, height: 1 },
  { x: 0.17, y: 0.06, width: 0.66, height: 0.88 },
];

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
        minDetectionConfidence: PRIMARY_MIN_CONFIDENCE,
      });
    });
  }
  return detectorPromise;
}

function intersectionOverUnion(a: NormalizedRect, b: NormalizedRect) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= left || bottom <= top) return 0;
  const intersection = (right - left) * (bottom - top);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

function isSameFace(a: NormalizedRect, b: NormalizedRect) {
  const aCenterX = a.x + a.width / 2;
  const aCenterY = a.y + a.height / 2;
  const bCenterX = b.x + b.width / 2;
  const bCenterY = b.y + b.height / 2;
  const centerDistance = Math.hypot(aCenterX - bCenterX, aCenterY - bCenterY);
  const faceScale = Math.max(Math.sqrt(a.width * a.height), Math.sqrt(b.width * b.height));
  return intersectionOverUnion(a, b) > 0.25 || centerDistance < faceScale * 0.32;
}

function deduplicateFaces(faces: FaceCandidate[]) {
  return faces
    .sort((a, b) => b.confidence - a.confidence)
    .reduce<FaceCandidate[]>((unique, face) => {
    if (unique.some((candidate) => isSameFace(candidate, face))) return unique;
    unique.push(face);
    return unique;
  }, [])
    .map(({ confidence: _confidence, ...face }) => face);
}

function normalizeDetections(
  detections: ReturnType<import("@mediapipe/tasks-vision").FaceDetector["detect"]>["detections"],
  width: number,
  height: number,
  mirrored = false,
  minimumScore = PRIMARY_MIN_CONFIDENCE,
  sourceRegion: SourceRegion = FULL_FRAME,
) {
  return detections.flatMap((detection) => {
    const box = detection.boundingBox;
    if (!box) return [];
    const confidence = detection.categories.reduce((highest, category) => Math.max(highest, category.score), 0);
    const aspectRatio = box.width / Math.max(1, box.height);
    if (confidence < minimumScore || aspectRatio < 0.52 || aspectRatio > 1.55) return [];
    const normalizedWidth = Math.min(1, box.width / width);
    const normalizedX = mirrored
      ? 1 - (box.originX + box.width) / width
      : box.originX / width;
    const localX = Math.max(0, Math.min(1 - normalizedWidth, normalizedX));
    const localY = Math.max(0, box.originY / height);
    return [{
      x: sourceRegion.x + localX * sourceRegion.width,
      y: sourceRegion.y + localY * sourceRegion.height,
      width: normalizedWidth * sourceRegion.width,
      height: Math.min(1, box.height / height) * sourceRegion.height,
      confidence,
    }];
  });
}

function detectRegion(
  detector: import("@mediapipe/tasks-vision").FaceDetector,
  video: HTMLVideoElement,
  region: SourceRegion,
) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) return [];
  context.drawImage(
    video,
    region.x * video.videoWidth,
    region.y * video.videoHeight,
    region.width * video.videoWidth,
    region.height * video.videoHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const result = detector.detect(canvas);
  return normalizeDetections(
    result.detections,
    canvas.width,
    canvas.height,
    false,
    CROP_MIN_CONFIDENCE,
    region,
  );
}

export async function detectFacesInPausedFrame(video: HTMLVideoElement): Promise<FaceDetectionEvidence> {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
    return { status: "unavailable", faces: [], inferenceMs: 0, message: "当前帧尚未解码。" };
  }

  try {
    const detector = await getDetector();
    const startedAt = performance.now();
    const result = detector.detect(video);
    const directFaces = normalizeDetections(result.detections, video.videoWidth, video.videoHeight);

    // A mirrored second pass improves recall for profile faces without sending frames off-device.
    const mirrorCanvas = document.createElement("canvas");
    mirrorCanvas.width = video.videoWidth;
    mirrorCanvas.height = video.videoHeight;
    const context = mirrorCanvas.getContext("2d");
    let mirroredFaces: FaceCandidate[] = [];
    if (context) {
      context.translate(mirrorCanvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, mirrorCanvas.width, mirrorCanvas.height);
      const mirroredResult = detector.detect(mirrorCanvas);
      mirroredFaces = normalizeDetections(
        mirroredResult.detections,
        mirrorCanvas.width,
        mirrorCanvas.height,
        true,
        MIRROR_MIN_CONFIDENCE,
      );
    }
    const detailFaces = DETAIL_REGIONS.flatMap((region) => detectRegion(detector, video, region));
    const inferenceMs = Math.round(performance.now() - startedAt);
    const faces = deduplicateFaces([...directFaces, ...mirroredFaces, ...detailFaces]);
    return {
      status: "ready",
      faces,
      inferenceMs,
      message: faces.length > 0 ? `MediaPipe 检测到 ${faces.length} 个脸部候选。` : "MediaPipe 未在当前帧检测到稳定脸部候选。",
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
