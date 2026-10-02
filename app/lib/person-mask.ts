import type { NormalizedRect } from "./pause-decision";

/**
 * Person-mask geometry for the S2 `s2-vision-v6` candidate.
 *
 * The segmenter returns a per-pixel category mask. Pixel masks are too large to
 * pass through the existing placement contract, so the mask is reduced to a
 * coarse occupancy grid and then to a short stack of horizontal "bands" per
 * connected person region. Each band is an ordinary normalized rectangle, so
 * `choosePauseAdPlacement` keeps its exact overlap/proximity semantics while it
 * now sees the silhouette instead of one oversized detector rectangle.
 */

export type PersonMaskGrid = {
  columns: number;
  rows: number;
  /** Fraction of person pixels in each cell, row-major, in [0, 1]. */
  occupancy: Float32Array;
};

export type PersonMaskComponent = {
  /** Row-major grid cell indices that belong to this 4-connected component. */
  cells: number[];
  /** Mean cell occupancy of the component. */
  meanOccupancy: number;
};

export type PersonMaskOptions = {
  /** A cell counts as person when at least this fraction of its pixels is person. */
  cellThreshold: number;
  /** Components smaller than this many cells are treated as mask noise. */
  minComponentCells: number;
  /** Grid rows per horizontal band. */
  bandRows: number;
  /**
   * A detector `人物主体` box is replaced by mask bands only when at least this
   * fraction of its cells is person. Weakly supported boxes (robots, faceless
   * characters, segmentation misses) are kept unchanged.
   */
  minDetectorSupport: number;
};

export type MaskRefinableSubject = NormalizedRect & {
  confidence: number;
  label: string;
  source: string;
  maskGroup?: string;
};

export const PERSON_MASK_DEFAULTS: PersonMaskOptions = {
  cellThreshold: 0.5,
  minComponentCells: 24,
  bandRows: 3,
  minDetectorSupport: 0.25,
};

export const PERSON_MASK_GRID = { columns: 64, rows: 36 } as const;
export const PERSON_MASK_SOURCE = "segment-person";
export const PERSON_MASK_HEAD_LABEL = "人物主体";
export const PERSON_MASK_CONTINUATION_LABEL = "人物轮廓";
const DETECTOR_PERSON_LABEL = "人物主体";

/** Downsamples a full-resolution category mask into a person-occupancy grid. */
export function buildPersonMaskGrid(
  categoryMask: ArrayLike<number>,
  width: number,
  height: number,
  personCategory: number,
  columns: number = PERSON_MASK_GRID.columns,
  rows: number = PERSON_MASK_GRID.rows,
): PersonMaskGrid {
  if (width <= 0 || height <= 0 || categoryMask.length < width * height) {
    throw new Error("Person mask dimensions do not match the category mask.");
  }
  const hits = new Float32Array(columns * rows);
  const totals = new Float32Array(columns * rows);
  for (let y = 0; y < height; y += 1) {
    const rowBase = Math.min(rows - 1, Math.floor((y * rows) / height)) * columns;
    const pixelBase = y * width;
    for (let x = 0; x < width; x += 1) {
      const cell = rowBase + Math.min(columns - 1, Math.floor((x * columns) / width));
      totals[cell] += 1;
      if (categoryMask[pixelBase + x] === personCategory) hits[cell] += 1;
    }
  }
  const occupancy = new Float32Array(columns * rows);
  for (let index = 0; index < occupancy.length; index += 1) {
    occupancy[index] = totals[index] > 0 ? hits[index] / totals[index] : 0;
  }
  return { columns, rows, occupancy };
}

export function personMaskComponents(grid: PersonMaskGrid, options: PersonMaskOptions = PERSON_MASK_DEFAULTS) {
  const { columns, rows, occupancy } = grid;
  const visited = new Uint8Array(columns * rows);
  const components: PersonMaskComponent[] = [];
  for (let start = 0; start < occupancy.length; start += 1) {
    if (visited[start] || occupancy[start] < options.cellThreshold) continue;
    visited[start] = 1;
    const stack = [start];
    const cells: number[] = [];
    let sum = 0;
    while (stack.length) {
      const cell = stack.pop() as number;
      cells.push(cell);
      sum += occupancy[cell];
      const x = cell % columns;
      const y = Math.floor(cell / columns);
      const neighbors = [
        x > 0 ? cell - 1 : -1,
        x < columns - 1 ? cell + 1 : -1,
        y > 0 ? cell - columns : -1,
        y < rows - 1 ? cell + columns : -1,
      ];
      for (const next of neighbors) {
        if (next < 0 || visited[next] || occupancy[next] < options.cellThreshold) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }
    if (cells.length >= options.minComponentCells) {
      components.push({ cells: cells.sort((a, b) => a - b), meanOccupancy: sum / cells.length });
    }
  }
  return components;
}

/** Splits one component into horizontal bands, each the x-extent of its cells. */
export function componentBands(
  component: PersonMaskComponent,
  grid: Pick<PersonMaskGrid, "columns" | "rows">,
  bandRows: number = PERSON_MASK_DEFAULTS.bandRows,
): NormalizedRect[] {
  const bands = new Map<number, { left: number; right: number; top: number; bottom: number }>();
  for (const cell of component.cells) {
    const x = cell % grid.columns;
    const y = Math.floor(cell / grid.columns);
    const key = Math.floor(y / Math.max(1, bandRows));
    const band = bands.get(key);
    if (!band) {
      bands.set(key, { left: x, right: x, top: y, bottom: y });
    } else {
      band.left = Math.min(band.left, x);
      band.right = Math.max(band.right, x);
      band.top = Math.min(band.top, y);
      band.bottom = Math.max(band.bottom, y);
    }
  }
  return [...bands.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, band]) => ({
      x: band.left / grid.columns,
      y: band.top / grid.rows,
      width: (band.right - band.left + 1) / grid.columns,
      height: (band.bottom - band.top + 1) / grid.rows,
    }));
}

/** Fraction of grid cells (by center) inside `rect` that count as person. */
export function personMaskSupport(
  grid: PersonMaskGrid,
  rect: NormalizedRect,
  cellThreshold: number = PERSON_MASK_DEFAULTS.cellThreshold,
) {
  let inside = 0;
  let person = 0;
  for (let y = 0; y < grid.rows; y += 1) {
    const centerY = (y + 0.5) / grid.rows;
    if (centerY < rect.y || centerY > rect.y + rect.height) continue;
    for (let x = 0; x < grid.columns; x += 1) {
      const centerX = (x + 0.5) / grid.columns;
      if (centerX < rect.x || centerX > rect.x + rect.width) continue;
      inside += 1;
      if (grid.occupancy[y * grid.columns + x] >= cellThreshold) person += 1;
    }
  }
  return inside > 0 ? person / inside : 0;
}

/**
 * Replaces well-supported detector person boxes with silhouette bands and adds
 * bands for person regions the detector missed (for example back-facing
 * people). Every non-person subject and every weakly supported person box is
 * preserved, so the mask can tighten protection but never silently drops a
 * subject the segmenter does not recognize.
 */
export function refineSubjectsWithPersonMask<T extends MaskRefinableSubject>(
  subjects: T[],
  grid: PersonMaskGrid,
  options: PersonMaskOptions = PERSON_MASK_DEFAULTS,
): Array<T | MaskRefinableSubject> {
  const retained = subjects.filter((subject) => subject.label !== DETECTOR_PERSON_LABEL
    || personMaskSupport(grid, subject, options.cellThreshold) < options.minDetectorSupport);
  const bands = personMaskComponents(grid, options).flatMap((component, componentIndex) => (
    componentBands(component, grid, options.bandRows).map((band, bandIndex) => ({
      ...band,
      confidence: Math.round(component.meanOccupancy * 1000) / 1000,
      label: bandIndex === 0 ? PERSON_MASK_HEAD_LABEL : PERSON_MASK_CONTINUATION_LABEL,
      source: PERSON_MASK_SOURCE,
      maskGroup: `person-mask-${componentIndex + 1}`,
    }))
  ));
  return [...retained, ...bands];
}
