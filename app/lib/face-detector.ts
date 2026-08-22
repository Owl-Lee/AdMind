import type { NormalizedRect } from "./pause-decision";

export type FaceDetectionEvidence = {
  status: "ready" | "unavailable";
  faces: DetectedFace[];
  subjects: DetectedSubject[];
  inferenceMs: number;
  message: string;
};

export type DetectedFace = NormalizedRect & {
  confidence: number;
  source: string;
};

export type DetectedSubject = NormalizedRect & {
  confidence: number;
  label: string;
  source: string;
};

let detectorPromise: Promise<import("@mediapipe/tasks-vision").FaceDetector> | null = null;
let objectDetectorPromise: Promise<import("@mediapipe/tasks-vision").ObjectDetector> | null = null;
const PRIMARY_MIN_CONFIDENCE = 0.34;
const MIRROR_MIN_CONFIDENCE = 0.46;
const CROP_MIN_CONFIDENCE = 0.48;
// Placement safety favors recall: an extra obstacle is less harmful than covering a missed character.
const SUBJECT_MIN_CONFIDENCE = 0.34;
const CROP_SUBJECT_MIN_CONFIDENCE = 0.34;
// Weak crop-only object detections are retained only when a face corroborates the same region.
const CROP_SUBJECT_STANDALONE_MIN_CONFIDENCE = 0.48;
const MEDIAPIPE_TASKS_VISION_VERSION = "1.0.1";
const MEDIAPIPE_WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;
const FACE_MODEL_PATH = "/models/blaze_face_full_range.tflite";
const OBJECT_MODEL_PATH = "/models/efficientdet_lite0.tflite";

export const PAUSE_VISION_CONFIG = {
  configVersion: "s2-vision-v3",
  mediapipeTasksVision: MEDIAPIPE_TASKS_VISION_VERSION,
  wasmRoot: MEDIAPIPE_WASM_ROOT,
  faceModel: {
    path: FACE_MODEL_PATH,
    sha256: "3698b18f063835bc609069ef052228fbe86d9c9a6dc8dcb7c7c2d69aed2b181b",
  },
  objectModel: {
    path: OBJECT_MODEL_PATH,
    sha256: "0720bf247bd76e6594ea28fa9c6f7c5242be774818997dbbeffc4da460c723bb",
  },
  thresholds: {
    facePrimary: PRIMARY_MIN_CONFIDENCE,
    faceMirrored: MIRROR_MIN_CONFIDENCE,
    faceCrop: CROP_MIN_CONFIDENCE,
    subjectPrimary: SUBJECT_MIN_CONFIDENCE,
    subjectCrop: CROP_SUBJECT_MIN_CONFIDENCE,
    subjectCropStandalone: CROP_SUBJECT_STANDALONE_MIN_CONFIDENCE,
  },
  filters: {
    weakCropRequiresFaceForLabels: ["人物主体"],
  },
} as const;

const WEAK_CROP_FACE_LABELS = new Set<string>(PAUSE_VISION_CONFIG.filters.weakCropRequiresFaceForLabels);

type SourceRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FaceCandidate = DetectedFace;
type VisualSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

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
        MEDIAPIPE_WASM_ROOT,
      );
      return FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_MODEL_PATH,
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
        MEDIAPIPE_WASM_ROOT,
      );
      return ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: OBJECT_MODEL_PATH,
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
  }, []);
}

function normalizeDetections(
  detections: ReturnType<import("@mediapipe/tasks-vision").FaceDetector["detect"]>["detections"],
  width: number,
  height: number,
  mirrored = false,
  minimumScore = PRIMARY_MIN_CONFIDENCE,
  sourceRegion: SourceRegion = FULL_FRAME,
  source = "face-direct",
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
      source,
    }];
  });
}

function detectRegion(
  detector: import("@mediapipe/tasks-vision").FaceDetector,
  visual: VisualSource,
  sourceWidth: number,
  sourceHeight: number,
  region: SourceRegion,
  regionIndex: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext("2d");
  if (!context) return [];
  context.drawImage(
    visual,
    region.x * sourceWidth,
    region.y * sourceHeight,
    region.width * sourceWidth,
    region.height * sourceHeight,
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
    `face-crop-${regionIndex + 1}`,
  );
}

function normalizeSubjects(
  detections: ReturnType<import("@mediapipe/tasks-vision").ObjectDetector["detect"]>["detections"],
  width: number,
  height: number,
  sourceRegion: SourceRegion = FULL_FRAME,
  minimumScore = SUBJECT_MIN_CONFIDENCE,
  source = "subject-direct",
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
      source,
    }];
  });
}

function detectSubjectsInRegion(
  detector: import("@mediapipe/tasks-vision").ObjectDetector,
  visual: VisualSource,
  sourceWidth: number,
  sourceHeight: number,
  region: SourceRegion,
  regionIndex: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext("2d");
  if (!context) return [];
  context.drawImage(
    visual,
    region.x * sourceWidth,
    region.y * sourceHeight,
    region.width * sourceWidth,
    region.height * sourceHeight,
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
    `subject-crop-${regionIndex + 1}`,
  );
}

function deduplicateSubjects(subjects: DetectedSubject[]) {
  return subjects
    .sort((a, b) => b.confidence - a.confidence)
    .reduce<DetectedSubject[]>((unique, subject) => {
      if (unique.some((candidate) => isSameFace(candidate, subject))) return unique;
      unique.push(subject);
      return unique;
  }, []);
}

function containsFaceCenter(subject: NormalizedRect, face: NormalizedRect, padding = 0.02) {
  const centerX = face.x + face.width / 2;
  const centerY = face.y + face.height / 2;
  return centerX >= Math.max(0, subject.x - padding)
    && centerX <= Math.min(1, subject.x + subject.width + padding)
    && centerY >= Math.max(0, subject.y - padding)
    && centerY <= Math.min(1, subject.y + subject.height + padding);
}

export function filterUnsupportedCropSubjects(subjects: DetectedSubject[], faces: DetectedFace[]) {
  return subjects.filter((subject) => {
    const isWeakCropCandidate = subject.source.startsWith("subject-crop-")
      && subject.confidence < CROP_SUBJECT_STANDALONE_MIN_CONFIDENCE
      && WEAK_CROP_FACE_LABELS.has(subject.label);
    if (!isWeakCropCandidate) return true;
    return faces.some((face) => containsFaceCenter(subject, face));
  });
}

async function detectFacesInVisualSource(
  visual: VisualSource,
  sourceWidth: number,
  sourceHeight: number,
): Promise<FaceDetectionEvidence> {
  try {
    const [detector, objectDetector] = await Promise.all([
      getDetector(),
      getObjectDetector().catch(() => null),
    ]);
    const startedAt = performance.now();
    const result = detector.detect(visual);
    const directFaces = normalizeDetections(result.detections, sourceWidth, sourceHeight);

    // A mirrored second pass improves recall for profile faces without sending frames off-device.
    const mirrorCanvas = document.createElement("canvas");
    mirrorCanvas.width = sourceWidth;
    mirrorCanvas.height = sourceHeight;
    const context = mirrorCanvas.getContext("2d");
    let mirroredFaces: FaceCandidate[] = [];
    if (context) {
      context.translate(mirrorCanvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(visual, 0, 0, mirrorCanvas.width, mirrorCanvas.height);
      const mirroredResult = detector.detect(mirrorCanvas);
      mirroredFaces = normalizeDetections(
        mirroredResult.detections,
        mirrorCanvas.width,
        mirrorCanvas.height,
        true,
        MIRROR_MIN_CONFIDENCE,
        FULL_FRAME,
        "face-mirrored",
      );
    }
    const detailFaces = DETAIL_REGIONS.flatMap((region, index) => detectRegion(
      detector,
      visual,
      sourceWidth,
      sourceHeight,
      region,
      index,
    ));
    const faces = deduplicateFaces([...directFaces, ...mirroredFaces, ...detailFaces]);
    const subjects = objectDetector
      ? deduplicateSubjects(filterUnsupportedCropSubjects([
          ...normalizeSubjects(objectDetector.detect(visual).detections, sourceWidth, sourceHeight),
          ...DETAIL_REGIONS.flatMap((region, index) => detectSubjectsInRegion(
            objectDetector,
            visual,
            sourceWidth,
            sourceHeight,
            region,
            index,
          )),
        ], faces))
      : [];
    const inferenceMs = Math.round(performance.now() - startedAt);
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

export async function detectFacesInPausedFrame(video: HTMLVideoElement): Promise<FaceDetectionEvidence> {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
    return { status: "unavailable", faces: [], subjects: [], inferenceMs: 0, message: "当前帧尚未解码。" };
  }
  return detectFacesInVisualSource(video, video.videoWidth, video.videoHeight);
}

export async function detectFacesInRegressionFrame(image: HTMLImageElement): Promise<FaceDetectionEvidence> {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
    return { status: "unavailable", faces: [], subjects: [], inferenceMs: 0, message: "固定回归帧尚未解码。" };
  }
  return detectFacesInVisualSource(image, image.naturalWidth, image.naturalHeight);
}
