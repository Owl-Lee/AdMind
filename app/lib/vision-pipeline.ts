import type { NormalizedRect } from "./pause-decision";
import {
  PERSON_MASK_CONTINUATION_LABEL,
  PERSON_MASK_DEFAULTS,
  PERSON_MASK_GRID,
  PERSON_MASK_HEAD_LABEL,
  PERSON_MASK_SOURCE,
  buildPersonMaskGrid,
  refineSubjectsWithPersonMask,
} from "./person-mask";

/**
 * Environment-agnostic S2 pause-frame vision pipeline.
 *
 * The same code runs inside the module worker (`vision.worker.ts`) and, as a
 * fallback, on the main thread. It never touches `document`: scratch canvases
 * are `OffscreenCanvas` when available.
 */

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
  /** Rectangles that share a group are bands of one segmented silhouette. */
  maskGroup?: string;
};

export type VisualSource =
  | HTMLVideoElement
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageBitmap
  | OffscreenCanvas;

type TasksVision = typeof import("@mediapipe/tasks-vision");
type FaceDetectorTask = import("@mediapipe/tasks-vision").FaceDetector;
type ObjectDetectorTask = import("@mediapipe/tasks-vision").ObjectDetector;
type ImageSegmenterTask = import("@mediapipe/tasks-vision").ImageSegmenter;

const PRIMARY_MIN_CONFIDENCE = 0.34;
const MIRROR_MIN_CONFIDENCE = 0.46;
const CROP_MIN_CONFIDENCE = 0.48;
// Placement safety favors recall: an extra obstacle is less harmful than covering a missed character.
const SUBJECT_MIN_CONFIDENCE = 0.34;
const CROP_SUBJECT_MIN_CONFIDENCE = 0.34;
// Weak crop-only object detections are retained only when a face corroborates the same region.
const CROP_SUBJECT_STANDALONE_MIN_CONFIDENCE = 0.48;
const MEDIAPIPE_TASKS_VISION_VERSION = "1.0.1";
const MEDIAPIPE_WASM_ROOT = "/mediapipe/wasm";
const FACE_MODEL_PATH = "/models/blaze_face_full_range.tflite";
const OBJECT_MODEL_PATH = "/models/efficientdet_lite0.tflite";
const SEGMENTATION_MODEL_PATH = "/models/deeplab_v3.tflite";
// Pascal VOC label index used by the MediaPipe DeepLab v3 model metadata.
const DEEPLAB_PERSON_CATEGORY = 15;

const SHARED_VISION_CONFIG = {
  mediapipeTasksVision: MEDIAPIPE_TASKS_VISION_VERSION,
  wasmRoot: MEDIAPIPE_WASM_ROOT,
  wasmAssets: [
    { path: "/mediapipe/wasm/vision_wasm_internal.js", sha256: "e170ee67dd4e16c1a6fcd8840a206687e5a59b22c20e4a902bc445b095454d73" },
    { path: "/mediapipe/wasm/vision_wasm_internal.wasm", sha256: "8da277a733926eacd0474b8704b36742d6ec3231c57a860c5b889dff8f1df886" },
    { path: "/mediapipe/wasm/vision_wasm_module_internal.js", sha256: "da8934057f147b622e82cfb4c0dbd85461c598e268588b5a8ba9ca963a8ff82d" },
    { path: "/mediapipe/wasm/vision_wasm_module_internal.wasm", sha256: "2dabd8e23c60984628beb7bb338764c81a08e6837145273f59578684b5d53c1b" },
    { path: "/mediapipe/wasm/vision_wasm_nosimd_internal.js", sha256: "e81d715a3d42cc3373602eb2f7aff795d164934db680e32496b65dab537f9658" },
    { path: "/mediapipe/wasm/vision_wasm_nosimd_internal.wasm", sha256: "a28483cd42e74e855bf5ebdb6b40d9b66a5b49e35e95020bc97669e6822a3192" },
  ],
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
} as const;

/** Released v0.5.0 behavior: face + object detectors, rectangle subjects. */
export const PAUSE_VISION_CONFIG_V5 = {
  configVersion: "s2-vision-v5",
  ...SHARED_VISION_CONFIG,
  filters: {
    weakCropRequiresFaceForLabels: ["人物主体"],
  },
  availability: {
    requiredDetectors: ["face", "object"],
  },
} as const;

/**
 * Stage 1B candidate: v5 plus a DeepLab v3 person mask. Well-supported detector
 * person boxes become silhouette bands; mask-only people are added. The mask
 * is a required detector, so the gate stays fail-closed.
 */
export const PAUSE_VISION_CONFIG_V6 = {
  configVersion: "s2-vision-v6",
  ...SHARED_VISION_CONFIG,
  segmentationModel: {
    path: SEGMENTATION_MODEL_PATH,
    sha256: "ff36e24d40547fe9e645e2f4e8745d1876d6e38b332d39a82f0bf0f5d1d561b3",
    personCategory: DEEPLAB_PERSON_CATEGORY,
  },
  filters: {
    weakCropRequiresFaceForLabels: ["人物主体"],
    personMask: {
      grid: PERSON_MASK_GRID,
      cellThreshold: PERSON_MASK_DEFAULTS.cellThreshold,
      minComponentCells: PERSON_MASK_DEFAULTS.minComponentCells,
      bandRows: PERSON_MASK_DEFAULTS.bandRows,
      minDetectorSupport: PERSON_MASK_DEFAULTS.minDetectorSupport,
      source: PERSON_MASK_SOURCE,
      labels: [PERSON_MASK_HEAD_LABEL, PERSON_MASK_CONTINUATION_LABEL],
    },
  },
  availability: {
    requiredDetectors: ["face", "object", "segmentation"],
  },
} as const;

export const PAUSE_VISION_CANDIDATES = {
  "s2-vision-v5": PAUSE_VISION_CONFIG_V5,
  "s2-vision-v6": PAUSE_VISION_CONFIG_V6,
} as const;

export type PauseVisionCandidateId = keyof typeof PAUSE_VISION_CANDIDATES;
export type PauseVisionConfig = (typeof PAUSE_VISION_CANDIDATES)[PauseVisionCandidateId];

export function isPauseVisionCandidateId(value: unknown): value is PauseVisionCandidateId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PAUSE_VISION_CANDIDATES, value);
}

const WEAK_CROP_FACE_LABELS = new Set<string>(PAUSE_VISION_CONFIG_V5.filters.weakCropRequiresFaceForLabels);

type SourceRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FaceCandidate = DetectedFace;
type Scratch2D = {
  drawImage: CanvasRenderingContext2D["drawImage"];
  translate: (x: number, y: number) => void;
  scale: (x: number, y: number) => void;
};
type ScratchCanvas = HTMLCanvasElement | OffscreenCanvas;

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

function createScratchCanvas(width: number, height: number): { canvas: ScratchCanvas; context: Scratch2D | null } {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    return { canvas, context: canvas.getContext("2d") as Scratch2D | null };
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return { canvas, context: canvas.getContext("2d") as Scratch2D | null };
  }
  return { canvas: null as unknown as ScratchCanvas, context: null };
}

export type VisionRuntime = {
  candidate: PauseVisionConfig;
  face: FaceDetectorTask;
  object: ObjectDetectorTask;
  segmenter: ImageSegmenterTask | null;
};

export type VisionRuntimeOptions = {
  /** Load the ES-module WASM loader (required inside module workers). */
  useModuleLoader?: boolean;
};

/**
 * Creates every detector required by `candidate`. Rejects when any required
 * detector cannot be created; callers must treat that as "vision unavailable".
 */
export async function createVisionRuntime(
  candidate: PauseVisionConfig,
  options: VisionRuntimeOptions = {},
): Promise<VisionRuntime> {
  const tasks: TasksVision = await import("@mediapipe/tasks-vision");
  const vision = await tasks.FilesetResolver.forVisionTasks(candidate.wasmRoot, options.useModuleLoader ?? false);
  const segmentationModel = "segmentationModel" in candidate ? candidate.segmentationModel : null;
  const [face, object, segmenter] = await Promise.all([
    tasks.FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: candidate.faceModel.path, delegate: "CPU" },
      runningMode: "IMAGE",
      minDetectionConfidence: candidate.thresholds.facePrimary,
    }),
    tasks.ObjectDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: candidate.objectModel.path, delegate: "CPU" },
      runningMode: "IMAGE",
      scoreThreshold: candidate.thresholds.subjectPrimary,
      maxResults: 12,
      categoryAllowlist: SUBJECT_CATEGORIES,
    }),
    segmentationModel
      ? tasks.ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: segmentationModel.path, delegate: "CPU" },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        })
      : Promise.resolve(null),
  ]);
  return { candidate, face, object, segmenter };
}

export function closeVisionRuntime(runtime: VisionRuntime) {
  for (const task of [runtime.face, runtime.object, runtime.segmenter]) {
    try {
      task?.close();
    } catch {
      // Closing a partially initialized task must not mask the original error.
    }
  }
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
  detections: ReturnType<FaceDetectorTask["detect"]>["detections"],
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

function drawRegion(visual: VisualSource, sourceWidth: number, sourceHeight: number, region: SourceRegion) {
  const { canvas, context } = createScratchCanvas(sourceWidth, sourceHeight);
  if (!context) return null;
  context.drawImage(
    visual,
    region.x * sourceWidth,
    region.y * sourceHeight,
    region.width * sourceWidth,
    region.height * sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
  );
  return canvas;
}

function detectRegion(
  detector: FaceDetectorTask,
  visual: VisualSource,
  sourceWidth: number,
  sourceHeight: number,
  region: SourceRegion,
  regionIndex: number,
) {
  const canvas = drawRegion(visual, sourceWidth, sourceHeight, region);
  if (!canvas) return [];
  const result = detector.detect(canvas);
  return normalizeDetections(
    result.detections,
    sourceWidth,
    sourceHeight,
    false,
    CROP_MIN_CONFIDENCE,
    region,
    `face-crop-${regionIndex + 1}`,
  );
}

function normalizeSubjects(
  detections: ReturnType<ObjectDetectorTask["detect"]>["detections"],
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
  detector: ObjectDetectorTask,
  visual: VisualSource,
  sourceWidth: number,
  sourceHeight: number,
  region: SourceRegion,
  regionIndex: number,
) {
  const canvas = drawRegion(visual, sourceWidth, sourceHeight, region);
  if (!canvas) return [];
  return normalizeSubjects(
    detector.detect(canvas).detections,
    sourceWidth,
    sourceHeight,
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

function segmentPersonMask(runtime: VisionRuntime, visual: VisualSource) {
  const segmentationModel = "segmentationModel" in runtime.candidate ? runtime.candidate.segmentationModel : null;
  if (!segmentationModel) return null;
  if (!runtime.segmenter) throw new Error("segmentation detector is required by this candidate");
  const result = runtime.segmenter.segment(visual);
  try {
    const mask = result.categoryMask;
    if (!mask) throw new Error("segmentation returned no category mask");
    return buildPersonMaskGrid(mask.getAsUint8Array(), mask.width, mask.height, segmentationModel.personCategory);
  } finally {
    result.close();
  }
}

export function describeEvidence(faces: DetectedFace[], subjects: DetectedSubject[]) {
  return faces.length + subjects.length > 0
    ? `本地视觉检测到 ${faces.length} 个脸部与 ${subjects.length} 个角色主体。`
    : "本地视觉未在当前帧检测到稳定避让目标。";
}

/**
 * Runs the full candidate pipeline on one decoded frame. Throws on inference
 * failure; callers convert that into fail-closed `unavailable` evidence.
 */
export function runVisionPipeline(
  runtime: VisionRuntime,
  visual: VisualSource,
  sourceWidth: number,
  sourceHeight: number,
): FaceDetectionEvidence {
  const { face: detector, object: objectDetector } = runtime;
  const startedAt = performance.now();
  const result = detector.detect(visual);
  const directFaces = normalizeDetections(result.detections, sourceWidth, sourceHeight);

  // A mirrored second pass improves recall for profile faces without sending frames off-device.
  const mirror = createScratchCanvas(sourceWidth, sourceHeight);
  let mirroredFaces: FaceCandidate[] = [];
  if (mirror.context) {
    mirror.context.translate(sourceWidth, 0);
    mirror.context.scale(-1, 1);
    mirror.context.drawImage(visual, 0, 0, sourceWidth, sourceHeight);
    const mirroredResult = detector.detect(mirror.canvas);
    mirroredFaces = normalizeDetections(
      mirroredResult.detections,
      sourceWidth,
      sourceHeight,
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
  const rectangleSubjects = deduplicateSubjects(filterUnsupportedCropSubjects([
    ...normalizeSubjects(objectDetector.detect(visual).detections, sourceWidth, sourceHeight),
    ...DETAIL_REGIONS.flatMap((region, index) => detectSubjectsInRegion(
      objectDetector,
      visual,
      sourceWidth,
      sourceHeight,
      region,
      index,
    )),
  ], faces));
  const personMask = segmentPersonMask(runtime, visual);
  const subjects: DetectedSubject[] = personMask
    ? refineSubjectsWithPersonMask(rectangleSubjects, personMask)
    : rectangleSubjects;
  const inferenceMs = Math.round(performance.now() - startedAt);
  return {
    status: "ready",
    faces,
    subjects,
    inferenceMs,
    message: describeEvidence(faces, subjects),
  };
}

export function unavailableEvidence(message: string): FaceDetectionEvidence {
  return { status: "unavailable", faces: [], subjects: [], inferenceMs: 0, message };
}

export function visionErrorMessage(error: unknown) {
  return error instanceof Error ? `本地视觉模型暂不可用：${error.message}` : "本地视觉模型暂不可用。";
}
