import { describe, expect, it } from "vitest";
import {
  calibrationWorkspaceExportSignature,
  isCalibrationWorkspaceExportCurrent,
} from "./calibration-export-state";

describe("calibration export snapshot state", () => {
  it("invalidates the downloaded state after any workspace change", () => {
    const workspace = {
      items: { "charge-005": { note: "first", confirmedAt: null } },
      placementResolutions: { "charge-005": { note: "placement", confirmedAt: null } },
    };
    const exportedSignature = calibrationWorkspaceExportSignature(workspace);
    expect(isCalibrationWorkspaceExportCurrent(workspace, exportedSignature)).toBe(true);
    expect(isCalibrationWorkspaceExportCurrent({
      ...workspace,
      items: { "charge-005": { note: "changed", confirmedAt: null } },
    }, exportedSignature)).toBe(false);
    expect(isCalibrationWorkspaceExportCurrent({
      ...workspace,
      placementResolutions: { "charge-005": { note: "placement", confirmedAt: "2026-08-22T12:00:00Z" } },
    }, exportedSignature)).toBe(false);
    expect(isCalibrationWorkspaceExportCurrent(workspace, null)).toBe(false);
  });
});
