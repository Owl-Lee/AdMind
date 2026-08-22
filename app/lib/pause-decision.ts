export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AdPlacement = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "none";

export type PlacementAssessment = {
  placement: Exclude<AdPlacement, "none">;
  region: NormalizedRect;
  faceOverlap: number;
  reservedAreaOverlap: number;
  risk: number;
};

export type PlacementDecision = {
  placement: AdPlacement;
  assessments: PlacementAssessment[];
  reason: string;
};

const CANDIDATES: Record<Exclude<AdPlacement, "none">, NormalizedRect> = {
  "top-left": { x: 0.025, y: 0.055, width: 0.3, height: 0.3 },
  "top-right": { x: 0.675, y: 0.055, width: 0.3, height: 0.3 },
  "bottom-left": { x: 0.025, y: 0.615, width: 0.3, height: 0.3 },
  "bottom-right": { x: 0.675, y: 0.615, width: 0.3, height: 0.3 },
};

// 字幕与播放器控制条属于页面已知的“保留区”，不需要 AI 猜测。
const RESERVED_BOTTOM: NormalizedRect = { x: 0, y: 0.72, width: 1, height: 0.28 };

function area(rect: NormalizedRect) {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function intersectionRatio(region: NormalizedRect, obstacle: NormalizedRect) {
  const left = Math.max(region.x, obstacle.x);
  const top = Math.max(region.y, obstacle.y);
  const right = Math.min(region.x + region.width, obstacle.x + obstacle.width);
  const bottom = Math.min(region.y + region.height, obstacle.y + obstacle.height);
  if (right <= left || bottom <= top) return 0;
  return ((right - left) * (bottom - top)) / area(region);
}

function intersectionRect(region: NormalizedRect, obstacle: NormalizedRect): NormalizedRect | null {
  const left = Math.max(region.x, obstacle.x);
  const top = Math.max(region.y, obstacle.y);
  const right = Math.min(region.x + region.width, obstacle.x + obstacle.width);
  const bottom = Math.min(region.y + region.height, obstacle.y + obstacle.height);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function unionArea(rects: NormalizedRect[]) {
  const xEdges = [...new Set(rects.flatMap((rect) => [rect.x, rect.x + rect.width]))].sort((a, b) => a - b);
  return xEdges.slice(0, -1).reduce((total, left, index) => {
    const right = xEdges[index + 1];
    if (right <= left) return total;
    const intervals = rects
      .filter((rect) => rect.x < right && rect.x + rect.width > left)
      .map((rect) => [rect.y, rect.y + rect.height] as const)
      .sort((a, b) => a[0] - b[0]);
    if (intervals.length === 0) return total;
    let coveredHeight = 0;
    let [start, end] = intervals[0];
    for (const [nextStart, nextEnd] of intervals.slice(1)) {
      if (nextStart > end) {
        coveredHeight += end - start;
        start = nextStart;
        end = nextEnd;
      } else {
        end = Math.max(end, nextEnd);
      }
    }
    return total + (right - left) * (coveredHeight + end - start);
  }, 0);
}

function intersectionUnionRatio(region: NormalizedRect, obstacles: NormalizedRect[]) {
  const intersections = obstacles.flatMap((obstacle) => {
    const intersection = intersectionRect(region, obstacle);
    return intersection ? [intersection] : [];
  });
  return area(region) > 0 ? unionArea(intersections) / area(region) : 0;
}

function proximityRatio(region: NormalizedRect, obstacle: NormalizedRect) {
  const horizontalGap = Math.max(
    region.x - (obstacle.x + obstacle.width),
    obstacle.x - (region.x + region.width),
    0,
  );
  const verticalGap = Math.max(
    region.y - (obstacle.y + obstacle.height),
    obstacle.y - (region.y + region.height),
    0,
  );
  const distance = Math.hypot(horizontalGap, verticalGap);
  return Math.max(0, 1 - distance / 0.48);
}

function expand(rect: NormalizedRect, padding = 0.035): NormalizedRect {
  const x = Math.max(0, rect.x - padding);
  const y = Math.max(0, rect.y - padding);
  const right = Math.min(1, rect.x + rect.width + padding);
  const bottom = Math.min(1, rect.y + rect.height + padding);
  return { x, y, width: right - x, height: bottom - y };
}

export function choosePauseAdPlacement(targets: NormalizedRect[]): PlacementDecision {
  const assessments = Object.entries(CANDIDATES).map(([placement, region]) => {
    const faceOverlap = Math.min(1, intersectionUnionRatio(region, targets.map((target) => expand(target, 0.065))));
    const faceProximity = targets.reduce((highest, target) => Math.max(highest, proximityRatio(region, expand(target, 0.045))), 0);
    const reservedAreaOverlap = intersectionRatio(region, RESERVED_BOTTOM);
    const risk = Math.min(1, faceOverlap * 0.72 + faceProximity * 0.28 + reservedAreaOverlap * 0.68);
    return {
      placement: placement as PlacementAssessment["placement"],
      region,
      faceOverlap,
      reservedAreaOverlap,
      risk,
    };
  }).sort((a, b) => a.risk - b.risk);

  const best = assessments[0];
  if (!best || best.risk > 0.4) {
    return {
      placement: "none",
      assessments,
      reason: "四个候选区域都会遮挡人物或播放器保留区，本次暂停不展示广告。",
    };
  }

  const side = best.placement.endsWith("left") ? "左侧" : "右侧";
  return {
    placement: best.placement,
    assessments,
    reason: targets.length > 0
      ? `检测到 ${targets.length} 个视觉避让目标，${side}的画面遮挡风险最低。`
      : "当前帧未检测到稳定主体，优先使用不遮挡字幕与控制条的顶部区域。",
  };
}
