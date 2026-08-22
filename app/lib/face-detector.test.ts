import { describe, expect, it } from "vitest";
import { filterUnsupportedCropSubjects, type DetectedFace, type DetectedSubject } from "./face-detector";

const weakCropSubject: DetectedSubject = {
  x: 0.35,
  y: 0.15,
  width: 0.3,
  height: 0.7,
  confidence: 0.45,
  label: "人物主体",
  source: "subject-crop-1",
};

describe("filterUnsupportedCropSubjects", () => {
  it("removes a weak crop-only subject without face corroboration", () => {
    expect(filterUnsupportedCropSubjects([weakCropSubject], [])).toEqual([]);
  });

  it("retains a weak crop subject when it contains a detected face", () => {
    const face: DetectedFace = {
      x: 0.46,
      y: 0.28,
      width: 0.08,
      height: 0.16,
      confidence: 0.51,
      source: "face-crop-2",
    };
    expect(filterUnsupportedCropSubjects([weakCropSubject], [face])).toEqual([weakCropSubject]);
  });

  it("retains direct detections and strong crop detections without a face", () => {
    const direct = { ...weakCropSubject, source: "subject-direct" };
    const strongCrop = { ...weakCropSubject, confidence: 0.48 };
    const facelessAnimal = { ...weakCropSubject, label: "动物主体" };
    expect(filterUnsupportedCropSubjects([direct, strongCrop, facelessAnimal], [])).toEqual([direct, strongCrop, facelessAnimal]);
  });
});
