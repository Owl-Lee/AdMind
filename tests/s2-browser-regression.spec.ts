import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildProtectionCalibrationExport,
  confirmPlacementResolution,
  confirmProtectionCalibration,
  createProtectionCalibrationWorkspace,
  setPlacementResolutionNote,
  setProtectionCalibrationNote,
  type ProtectionCalibrationSeed,
  type S2ReviewExport,
} from "../app/lib/pause-review";
import type { RegressionManifest } from "../app/lib/pause-regression";
import {
  S2_CALIBRATION_DRAFTS,
  S2_PLACEMENT_RESOLUTION,
  S2_SOURCE_REVIEW,
} from "../app/lib/s2-calibration-seed";

type BrowserReport = {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  provenance: {
    runner: { appVersion: string; gitCommit: string; platform: string };
    configurationReference: { appVersion: string; gitCommit: string };
    vision: { configVersion: string; wasmRoot: string; wasmAssets?: { path: string; sha256: string }[] };
  };
  metrics: {
    sampleCount: number;
    availableSampleCount: number;
    unavailableCount: number;
    blockingSampleCount: number;
    availableBlockingSampleCount: number;
    overDeferralCount: number;
  };
  failures: { sampleId: string; kind: string }[];
  predictions: { sampleId: string; status: string }[];
};

function completeCalibrationPayload() {
  const manifest = JSON.parse(readFileSync(resolve("evaluation/s2/manifest.json"), "utf8")) as RegressionManifest;
  const sourceReview = JSON.parse(
    readFileSync(resolve("evaluation/s2/reviews/2026-08-22-product-owner.json"), "utf8"),
  ) as S2ReviewExport;
  const seed: ProtectionCalibrationSeed = {
    suggestions: S2_CALIBRATION_DRAFTS,
    placementResolutions: S2_PLACEMENT_RESOLUTION,
  };
  let workspace = createProtectionCalibrationWorkspace(manifest, sourceReview, seed);
  for (const draft of S2_CALIBRATION_DRAFTS) {
    workspace = setProtectionCalibrationNote(workspace, draft.sampleId, draft.rationale);
    workspace = confirmProtectionCalibration(workspace, draft.sampleId, "2026-08-22T12:00:00.000Z");
  }
  for (const sampleId of Object.keys(S2_PLACEMENT_RESOLUTION)) {
    workspace = setPlacementResolutionNote(workspace, sampleId, `Reviewed ${sampleId}.`);
    workspace = confirmPlacementResolution(workspace, sampleId, "2026-08-22T12:01:00.000Z");
  }
  const artifact = buildProtectionCalibrationExport(manifest, sourceReview, workspace, {
    appVersion: "0.5.0",
    gitCommit: "playwright-fixture",
    generatedAt: "2026-08-22T12:02:00.000Z",
    seed,
    sourceReviewSha256: S2_SOURCE_REVIEW.sha256,
  });
  return Buffer.from(`${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}

test("runs the fixed S2 set with the local MediaPipe runtime", async ({ page }) => {
  const criticalRequestFailures: string[] = [];
  const requestedUrls: string[] = [];
  page.on("request", (request) => requestedUrls.push(request.url()));
  page.on("requestfailed", (request) => {
    if (/\/mediapipe\/wasm\/|\/models\/|\/evaluation\/s2\/frames\//.test(request.url())) {
      criticalRequestFailures.push(`${request.url()} :: ${request.failure()?.errorText ?? "unknown failure"}`);
    }
  });

  await page.goto("/regression?autorun=1", { waitUntil: "domcontentloaded" });
  const reportOutput = page.locator("[data-regression-report]");
  await expect(reportOutput).toHaveCount(1);
  const report = await page.evaluate(() => window.__ADMIND_VISION_REGRESSION__ as BrowserReport | undefined);
  expect(report).toBeDefined();
  if (!report) throw new Error("The regression lab did not expose a report");

  const historicalCandidate = JSON.parse(
    await readFile(resolve("evaluation/s2/candidates/v0.4.0.json"), "utf8"),
  ) as BrowserReport;
  const historicalUnsafeIds = new Set(
    historicalCandidate.failures.filter((failure) => failure.kind === "unsafe-placement").map((failure) => failure.sampleId),
  );
  const currentUnsafeIds = report.failures
    .filter((failure) => failure.kind === "unsafe-placement")
    .map((failure) => failure.sampleId);
  // Product review already flagged these schema-v1 agent drafts as disputed.
  // They remain diagnostic until the user's complete schema-v2 export is
  // validated; they must not force the detector back toward known-bad labels.
  const awaitingCalibrationIds = new Set([
    "charge-005",
    "charge-008",
    "charge-013",
    "charge-016",
    "charge-018",
  ]);

  const artifactDir = resolve("artifacts/s2-browser-regression");
  await mkdir(artifactDir, { recursive: true });
  await writeFile(resolve(artifactDir, "current.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await page.screenshot({ path: resolve(artifactDir, "regression-lab.png"), fullPage: true });

  expect(criticalRequestFailures).toEqual([]);
  expect(requestedUrls.some((url) => url.includes("cdn.jsdelivr.net"))).toBe(false);
  expect(requestedUrls.some((url) => /\/mediapipe\/wasm\/.*\.js(?:\?|$)/.test(url))).toBe(true);
  expect(requestedUrls.some((url) => /\/mediapipe\/wasm\/.*\.wasm(?:\?|$)/.test(url))).toBe(true);
  expect(report.schemaVersion).toBe(2);
  expect(report.datasetId).toBe("s2-charge-fixed-v1");
  expect(report.provenance.vision.configVersion).toBe("s2-vision-v5");
  expect(report.provenance.vision.wasmRoot).toBe("/mediapipe/wasm");
  expect(report.provenance.vision.wasmAssets).toHaveLength(6);
  expect(report.metrics.sampleCount).toBe(20);
  expect(report.metrics.availableSampleCount).toBe(20);
  expect(report.metrics.unavailableCount).toBe(0);
  expect(report.metrics.availableBlockingSampleCount).toBe(report.metrics.blockingSampleCount);
  expect(report.metrics.overDeferralCount).toBeLessThanOrEqual(historicalCandidate.metrics.overDeferralCount);
  expect(currentUnsafeIds.every(
    (sampleId) => historicalUnsafeIds.has(sampleId) || awaitingCalibrationIds.has(sampleId),
  )).toBe(true);
  if (process.env.CI) {
    expect(process.env.GITHUB_SHA, "GitHub CI must expose the exact checked-out SHA").toMatch(/^[a-f0-9]{40}$/);
    expect(report.provenance.runner.gitCommit).toBe(process.env.GITHUB_SHA);
    expect(report.provenance.configurationReference.gitCommit).toBe(process.env.GITHUB_SHA);
  }
});

test("keeps every public evidence route responsive and bilingual", async ({ page }) => {
  // The main demo exercises a Cloudflare-bound API and is covered by rendered
  // output plus post-deploy QA. These evidence routes are deliberately static
  // so the browser benchmark remains reproducible without cloud bindings.
  const routes = ["/regression", "/regression/calibrate", "/regression/intake"];
  const widths = [360, 430, 768, 1440];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await test.step(`${route} at ${width}px`, async () => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main")).toBeVisible();
        const overflow = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(overflow.scrollWidth, `${route} overflows at ${width}px`).toBeLessThanOrEqual(overflow.clientWidth + 1);

        const language = page.getByRole("group", { name: "Language / 语言" });
        await language.getByRole("button", { name: "中", exact: true }).click();
        await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
        await language.getByRole("button", { name: "EN", exact: true }).click();
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
      });
    }
  }

  const artifactDir = resolve("artifacts/s2-browser-regression");
  await mkdir(artifactDir, { recursive: true });
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/regression/intake", { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: resolve(artifactDir, "intake-mobile.png"), fullPage: true });
});

test("validates a complete schema-v2 file locally and preserves its byte identity", async ({ page }) => {
  const payload = completeCalibrationPayload();
  const expectedSha256 = createHash("sha256").update(payload).digest("hex");
  await page.goto("/regression/intake", { waitUntil: "domcontentloaded" });

  await page.locator('input[type="file"]').setInputFiles({
    name: "s2-calibration-v2.json",
    mimeType: "application/json",
    buffer: payload,
  });

  await expect(page.getByText("Validated preview ready", { exact: true })).toBeVisible();
  await expect(page.getByText(expectedSha256, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download preview JSON" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download rescore JSON" })).toBeVisible();

  await page.getByRole("group", { name: "Language / 语言" }).getByRole("button", { name: "中", exact: true }).click();
  await expect(page.getByText("验证通过，预览已就绪", { exact: true })).toBeVisible();
  await expect(page.getByText(expectedSha256, { exact: true })).toBeVisible();
});
