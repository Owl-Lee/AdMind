import type { NormalizedRect } from "./pause-decision";

export type FaceDetectionEvidence = {
  status: "ready" | "unavailable";
  faces: NormalizedRect[];
  subjects: DetectedSubject[];
  inferenceMs: number;
  message: string;
};

export type DetectedSubject = NormalizedRect & {
  label: string;
};

let detectorPromise: Promise<import("@mediapipe/tasks-vision").FaceDetector> | null = null;
let objectDetectorPromise: Promise<import("@mediapipe/tasks-vision").ObjectDetector> | null = null;
const PRIMARY_MIN_CONFIDENCE = 0.34;
const MIRROR_MIN_CONFIDENCE = 0.46;
const CROP_MIN_CONFIDENCE = 0.48;
// Placement safety favors recall: an extra obstacle is less harmful than covering a missed character.
const SUBJECT_MIN_CONFIDENCE = 0.34;
const CROP_SUBJECT_MIN_CONFIDENCE = 0.34;

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

const SUBJECT_CATEGORIES = [
  "person",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "teddy bear",
];

const SUBJECT_LABELS: Record<string, string> = {
  person: "人物主体",
  bird: "动物主体",
  cat: "动物主体",
  dog: "动物主体",
  horse: "动物主体",
  sheep: "动物主体",
  cow: "动物主体",
  elephant: "动物主体",
  bear: "动物主体",
  zebra: "动物主体",
  giraffe: "动物主体",
  "teddy bear": "角色主体",
};

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

async function getObjectDetector() {
  if (!objectDetectorPromise) {
    objectDetectorPromise = import("@mediapipe/tasks-vision").then(async ({ ObjectDetector, FilesetResolver }) => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
      );
      return ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/efficientdet_lite0.tflite",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        scoreThreshold: SUBJECT_MIN_CONFIDENCE,
        maxResults: 12,
        categoryAllowlist: SUBJECT_CATEGORIES,
      });
    });
  }
  return objectDetectorPromise;
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
    .map(({ x, y, width, height }) => ({ x, y, width, height }));
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

function normalizeSubjects(
  detections: ReturnType<import("@mediapipe/tasks-vision").ObjectDetector["detect"]>["detections"],
  width: number,
  height: number,
  sourceRegion: SourceRegion = FULL_FRAME,
  minimumScore = SUBJECT_MIN_CONFIDENCE,
) {
  return detections.flatMap((detection) => {
    const box = detection.boundingBox;
    const category = detection.categories[0];
    if (!box || !category || category.score < minimumScore) return [];
    const normalizedWidth = Math.min(1, box.width / width);
    const normalizedHeight = Math.min(1, box.height / height);
    const localX = Math.max(0, Math.min(1 - normalizedWidth, box.originX / width));
    const localY = Math.max(0, Math.min(1 - normalizedHeight, box.originY / height));
    return [{
      x: sourceRegion.x + localX * sourceRegion.width,
      y: sourceRegion.y + localY * sourceRegion.height,
      width: normalizedWidth * sourceRegion.width,
      height: normalizedHeight * sourceRegion.height,
      confidence: category.score,
      label: SUBJECT_LABELS[category.categoryName] ?? "画面主体",
    }];
  });
}

function detectSubjectsInRegion(
  detector: import("@mediapipe/tasks-vision").ObjectDetector,
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
  return normalizeSubjects(
    detector.detect(canvas).detections,
    canvas.width,
    canvas.height,
    region,
    CROP_SUBJECT_MIN_CONFIDENCE,
  );
}

function deduplicateSubjects(subjects: Array<DetectedSubject & { confidence: number }>) {
  return subjects
    .sort((a, b) => b.confidence - a.confidence)
    .reduce<Array<DetectedSubject & { confidence: number }>>((unique, subject) => {
      if (unique.some((candidate) => isSameFace(candidate, subject))) return unique;
      unique.push(subject);
      return unique;
    }, [])
    .map(({ x, y, width, height, label }) => ({ x, y, width, height, label }));
}

export async function detectFacesInPausedFrame(video: HTMLVideoElement): Promise<FaceDetectionEvidence> {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
    return { status: "unavailable", faces: [], subjects: [], inferenceMs: 0, message: "当前帧尚未解码。" };
  }

  try {
    const [detector, objectDetector] = await Promise.all([
      getDetector(),
      getObjectDetector().catch(() => null),
    ]);
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
    const subjects = objectDetector
      ? deduplicateSubjects([
          ...normalizeSubjects(objectDetector.detect(video).detections, video.videoWidth, video.videoHeight),
          ...DETAIL_REGIONS.flatMap((region) => detectSubjectsInRegion(objectDetector, video, region)),
        ])
      : [];
    const inferenceMs = Math.round(performance.now() - startedAt);
    const faces = deduplicateFaces([...directFaces, ...mirroredFaces, ...detailFaces]);
    return {
      status: "ready",
      faces,
      subjects,
      inferenceMs,
      message: faces.length + subjects.length > 0
        ? `本地视觉检测到 ${faces.length} 个脸部与 ${subjects.length} 个角色主体。`
        : "本地视觉未在当前帧检测到稳定避让目标。",
    };
  } catch (error) {
    detectorPromise = null;
    objectDetectorPromise = null;
    return {
      status: "unavailable",
      faces: [],
      subjects: [],
      inferenceMs: 0,
      message: error instanceof Error ? `本地视觉模型暂不可用：${error.message}` : "本地视觉模型暂不可用。",
    };
  }
}
