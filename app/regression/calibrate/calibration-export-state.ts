export function calibrationWorkspaceExportSignature(workspace: unknown) {
  return JSON.stringify(workspace);
}

export function isCalibrationWorkspaceExportCurrent(
  workspace: unknown,
  exportedWorkspaceSignature: string | null,
) {
  return exportedWorkspaceSignature !== null
    && exportedWorkspaceSignature === calibrationWorkspaceExportSignature(workspace);
}
