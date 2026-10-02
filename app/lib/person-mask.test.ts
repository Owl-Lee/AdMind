import { describe, expect, it } from "vitest";
import {
  PERSON_MASK_CONTINUATION_LABEL,
  PERSON_MASK_DEFAULTS,
  PERSON_MASK_HEAD_LABEL,
  PERSON_MASK_SOURCE,
  buildPersonMaskGrid,
  componentBands,
  personMaskComponents,
  personMaskSupport,
  refineSubjectsWithPersonMask,
  type MaskRefinableSubject,
  type PersonMaskGrid,
} from "./person-mask";

const PERSON = 15;

/** Builds a grid directly from a list of occupied (x, y) cells. */
function gridWith(columns: number, rows: number, cells: Array<[number, number]>): PersonMaskGrid {
  const occupancy = new Float32Array(columns * rows);
  for (const [x, y] of cells) occupancy[y * columns + x] = 1;
  return { columns, rows, occupancy };
}

function block(x0: number, y0: number, x1: number, y1: number) {
  const cells: Array<[number, number]> = [];
  for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) cells.push([x, y]);
  return cells;
}

describe("buildPersonMaskGrid", () => {
  it("downsamples category pixels into per-cell person occupancy", () => {
    // 4x2 image -> 2x1 grid. Left cell is 3/4 person, right cell 1/4 person.
    const mask = Uint8Array.from([
      PERSON, PERSON, 0, PERSON,
      PERSON, 0, 0, 0,
    ]);
    const grid = buildPersonMaskGrid(mask, 4, 2, PERSON, 2, 1);
    expect(Array.from(grid.occupancy)).toEqual([0.75, 0.25]);
  });

  it("rejects a mask whose dimensions do not match", () => {
    expect(() => buildPersonMaskGrid(new Uint8Array(3), 4, 2, PERSON)).toThrow(/dimensions/);
  });
});

describe("person mask components and bands", () => {
  it("keeps 4-connected regions above the size floor and drops noise", () => {
    const grid = gridWith(10, 10, [...block(1, 1, 3, 6), [8, 8]]);
    const components = personMaskComponents(grid, { ...PERSON_MASK_DEFAULTS, minComponentCells: 4 });
    expect(components).toHaveLength(1);
    expect(components[0].cells).toHaveLength(18);
  });

  it("splits a silhouette into horizontal bands that follow its width", () => {
    // Narrow head (rows 0-2) above wide shoulders (rows 3-5).
    const grid = gridWith(10, 6, [...block(4, 0, 5, 2), ...block(1, 3, 8, 5)]);
    const [component] = personMaskComponents(grid, { ...PERSON_MASK_DEFAULTS, minComponentCells: 1 });
    const bands = componentBands(component, grid, 3);
    expect(bands).toHaveLength(2);
    expect(bands[0]).toEqual({ x: 0.4, y: 0, width: 0.2, height: 0.5 });
    expect(bands[1]).toEqual({ x: 0.1, y: 0.5, width: 0.8, height: 0.5 });
  });

  it("measures how much of a rectangle the mask supports", () => {
    const grid = gridWith(10, 10, block(0, 0, 4, 9));
    expect(personMaskSupport(grid, { x: 0, y: 0, width: 1, height: 1 })).toBeCloseTo(0.5);
    expect(personMaskSupport(grid, { x: 0.5, y: 0, width: 0.5, height: 1 })).toBe(0);
  });
});

describe("refineSubjectsWithPersonMask", () => {
  // A person silhouette on the left half of a 20x10 grid.
  const grid = gridWith(20, 10, [...block(4, 1, 6, 3), ...block(2, 4, 8, 9)]);
  const options = { ...PERSON_MASK_DEFAULTS, minComponentCells: 10 };
  const oversizedPerson: MaskRefinableSubject = {
    x: 0, y: 0, width: 0.75, height: 1, confidence: 0.86, label: "人物主体", source: "subject-direct",
  };
  const facelessRobot: MaskRefinableSubject = {
    x: 0.6, y: 0.1, width: 0.35, height: 0.8, confidence: 0.4, label: "人物主体", source: "subject-crop-2",
  };
  const animal: MaskRefinableSubject = {
    x: 0.1, y: 0.2, width: 0.3, height: 0.5, confidence: 0.7, label: "动物主体", source: "subject-direct",
  };

  it("replaces a well-supported oversized person box with silhouette bands", () => {
    const refined = refineSubjectsWithPersonMask([oversizedPerson], grid, options);
    expect(refined.some((subject) => subject.source === "subject-direct")).toBe(false);
    const bands = refined.filter((subject) => subject.source === PERSON_MASK_SOURCE);
    expect(bands.length).toBeGreaterThan(1);
    expect(bands[0].label).toBe(PERSON_MASK_HEAD_LABEL);
    expect(bands.slice(1).every((band) => band.label === PERSON_MASK_CONTINUATION_LABEL)).toBe(true);
    expect(new Set(bands.map((band) => band.maskGroup))).toEqual(new Set(["person-mask-1"]));
    expect(Math.max(...bands.map((band) => band.x + band.width))).toBeCloseTo(0.45);
  });

  it("keeps person boxes the mask does not support and every non-person subject", () => {
    const refined = refineSubjectsWithPersonMask([facelessRobot, animal], grid, options);
    expect(refined).toContain(facelessRobot);
    expect(refined).toContain(animal);
  });

  it("adds mask-only people that the detector missed", () => {
    const refined = refineSubjectsWithPersonMask([], grid, options);
    expect(refined.length).toBeGreaterThan(0);
    expect(refined.every((subject) => subject.source === PERSON_MASK_SOURCE)).toBe(true);
  });

  it("is a no-op on an empty mask", () => {
    const empty = gridWith(20, 10, []);
    expect(refineSubjectsWithPersonMask([oversizedPerson, animal], empty, options)).toEqual([oversizedPerson, animal]);
  });
});
