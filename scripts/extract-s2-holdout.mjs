#!/usr/bin/env node

import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const OUTPUT_DIR = join(REPO_ROOT, "public", "evaluation", "s2", "holdout");
const MANIFEST_PATH = join(REPO_ROOT, "evaluation", "s2", "holdout", "manifest.json");
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 720;
const JPEG_QUALITY = 0.92;

const SOURCES = {
  coast: {
    id: "coast",
    asset: "public/coast-guard-rescue-720p.mp4",
    work: "Coast Guard rescues man and dog during Hurricane Helene",
    author: "U.S. Coast Guard PADET Jacksonville",
    license: "Public Domain",
  },
  usns: {
    id: "usns",
    asset: "public/usns-medical-evacuation-720p.mp4",
    work: "USNS Comfort Sailors conduct medical evacuation with the Sea Knights",
    author: "U.S. Navy",
    license: "Public Domain",
  },
  llamigos: {
    id: "llamigos",
    asset: "public/llamigos-chase-720p.mp4",
    work: "Caminandes: Llamigos",
    author: "Blender Foundation",
    license: "CC BY 3.0",
  },
  charge: {
    id: "charge",
    asset: "public/admind-charge-demo-720p.mp4",
    work: "CHARGE",
    author: "Blender Foundation / Blender Studio",
    license: "CC BY 4.0",
  },
};

const PRIMARY = [
  {
    id: "holdout-coast-005000",
    sourceId: "coast",
    timeSec: 5,
    category: "faceless-partial-body",
    note: "A gloved foreground arm and a distant vessel stress partial-person and no-visible-face handling.",
  },
  {
    id: "holdout-usns-040000",
    sourceId: "usns",
    timeSec: 40,
    category: "back-facing-helmeted-crowd",
    note: "Several people are shown mostly from the back or side under low-light deck illumination.",
  },
  {
    id: "holdout-llamigos-073000",
    sourceId: "llamigos",
    timeSec: 73,
    category: "animal-crowd",
    note: "A crowded animated-animal scene stresses dense non-human subject handling.",
  },
  {
    id: "holdout-llamigos-048000",
    sourceId: "llamigos",
    timeSec: 48,
    category: "animal-two-species",
    note: "Two animated animal species occupy a snowy scene with different apparent salience.",
  },
];

const SUPPLEMENTAL = [
  {
    id: "holdout-charge-079000",
    sourceId: "charge",
    timeSec: 79,
    category: "robot-close-up",
    note: "Same-source correlated diagnostic for a face-like robot close-up; not an independent holdout.",
  },
  {
    id: "holdout-charge-089200",
    sourceId: "charge",
    timeSec: 89.2,
    category: "empty-aftermath",
    note: "Same-source correlated diagnostic near the existing empty-scene boundary; not an independent holdout.",
  },
];

const EXPECTED_SOURCE_SHA256 = {
  coast: "015e5fcf3f9906260d11f8e3c78db4ec3c8bfe936deda9646b286fc91908e512",
  usns: "ed0634d484009894a4a744b36439f61059d586f5af60be343159c5020cb9c6c7",
  llamigos: "4feb570456e8afc77af20a73f65b07733d32cdc1a8e3e2f366289c9154452831",
  charge: "060b30c3b09c9734ac7806d940dcde7cc853e4bc73fd63a0eb9f6acb3300debe",
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function sha256File(path) {
  return sha256(await readFile(path));
}

function frameRelativePath(id) {
  return `/evaluation/s2/holdout/${id}.jpg`;
}

function frameDiskPath(id) {
  return join(OUTPUT_DIR, `${id}.jpg`);
}

function jpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Frame is not a JPEG file.");
  }

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;

  while (offset + 8 < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) continue;
    if (offset + 2 > bytes.length) break;

    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }

  throw new Error("JPEG dimensions could not be read.");
}

function parseRange(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader ?? "");
  if (!match) return null;

  let start;
  let end;
  if (match[1] === "") {
    const suffixLength = Number(match[2]);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Number(match[2]);
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= size || end < start) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

async function serveMedia(request, response, source) {
  const sourcePath = join(REPO_ROOT, source.asset);
  const sourceStat = await stat(sourcePath);
  const range = request.headers.range ? parseRange(request.headers.range, sourceStat.size) : null;

  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "video/mp4");

  if (request.headers.range && !range) {
    response.writeHead(416, { "Content-Range": `bytes */${sourceStat.size}` });
    response.end();
    return;
  }

  const start = range?.start ?? 0;
  const end = range?.end ?? sourceStat.size - 1;
  response.setHeader("Content-Length", end - start + 1);
  if (range) {
    response.statusCode = 206;
    response.setHeader("Content-Range", `bytes ${start}-${end}/${sourceStat.size}`);
  }

  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(sourcePath, { start, end }).pipe(response);
}

async function createMediaServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname === "/") {
        response.writeHead(200, {
          "Cache-Control": "no-store",
          "Content-Type": "text/html; charset=utf-8",
        });
        response.end("<!doctype html><meta charset=utf-8><title>S2 holdout extractor</title>");
        return;
      }

      const mediaMatch = /^\/media\/([a-z-]+)\.mp4$/.exec(url.pathname);
      const source = mediaMatch ? SOURCES[mediaMatch[1]] : undefined;
      if (!source) {
        response.writeHead(404).end();
        return;
      }
      await serveMedia(request, response, source);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(error instanceof Error ? error.message : String(error));
    }
  });

  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not determine media server port.");
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function captureFrame(page, origin, sample) {
  const result = await page.evaluate(
    async ({ sourceUrl, timeSec, width, height, jpegQuality }) => {
      const waitFor = (target, event) => new Promise((resolvePromise, reject) => {
        const timeout = window.setTimeout(() => reject(new Error(`Timed out waiting for ${event}.`)), 15_000);
        target.addEventListener(event, () => {
          window.clearTimeout(timeout);
          resolvePromise();
        }, { once: true });
        target.addEventListener("error", () => {
          window.clearTimeout(timeout);
          reject(new Error(`Video error while waiting for ${event}.`));
        }, { once: true });
      });

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = sourceUrl;
      document.body.replaceChildren(video);
      await waitFor(video, "loadedmetadata");

      if (video.videoWidth !== width || video.videoHeight !== height) {
        throw new Error(`Unexpected source dimensions ${video.videoWidth}x${video.videoHeight}.`);
      }
      if (!(timeSec >= 0 && timeSec < video.duration)) {
        throw new Error(`Timestamp ${timeSec}s is outside duration ${video.duration}s.`);
      }

      const seeked = waitFor(video, "seeked");
      video.currentTime = timeSec;
      await seeked;
      await new Promise((resolvePromise) => requestAnimationFrame(() => requestAnimationFrame(resolvePromise)));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Could not create a 2D canvas context.");
      context.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
      const observed = {
        durationSec: Number(video.duration.toFixed(6)),
        width: video.videoWidth,
        height: video.videoHeight,
        currentTimeSec: Number(video.currentTime.toFixed(6)),
      };
      video.removeAttribute("src");
      video.load();
      return { dataUrl, observed };
    },
    {
      sourceUrl: `${origin}/media/${sample.sourceId}.mp4`,
      timeSec: sample.timeSec,
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      jpegQuality: JPEG_QUALITY,
    },
  );

  const prefix = "data:image/jpeg;base64,";
  if (!result.dataUrl.startsWith(prefix)) throw new Error(`Chromium did not return JPEG data for ${sample.id}.`);
  return {
    bytes: Buffer.from(result.dataUrl.slice(prefix.length), "base64"),
    observed: result.observed,
  };
}

function manifestSample(sample, frameSha256) {
  return {
    id: sample.id,
    sourceId: sample.sourceId,
    timeSec: sample.timeSec,
    frame: frameRelativePath(sample.id),
    frameSha256,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    category: sample.category,
    status: "sealed-unreviewed",
    useForTuning: false,
    groundTruth: null,
    note: sample.note,
  };
}

async function buildManifest(captures, chromiumVersion) {
  const usedSourceIds = [...new Set([...PRIMARY, ...SUPPLEMENTAL].map((sample) => sample.sourceId))];
  const sourceRecords = [];

  for (const sourceId of usedSourceIds) {
    const source = SOURCES[sourceId];
    const actualSha256 = await sha256File(join(REPO_ROOT, source.asset));
    if (actualSha256 !== EXPECTED_SOURCE_SHA256[sourceId]) {
      throw new Error(`Source SHA-256 mismatch for ${source.asset}: ${actualSha256}`);
    }
    const observed = captures.get([...PRIMARY, ...SUPPLEMENTAL].find((sample) => sample.sourceId === sourceId).id).observed;
    sourceRecords.push({
      ...source,
      sha256: actualSha256,
      width: observed.width,
      height: observed.height,
      durationSec: observed.durationSec,
    });
  }

  return {
    schemaVersion: 1,
    datasetId: "s2-cross-source-holdout-v1",
    title: "AdMind S2 sealed holdout set",
    titleZh: "AdMind S2 封存留出集",
    createdAt: "2026-08-22",
    status: "sealed-unreviewed",
    useForTuning: false,
    purpose: "A label-hidden evaluation set. Do not inspect outcomes, tune rules, select thresholds, or train models against these frames before the candidate system is frozen.",
    purposeZh: "标签隐藏的评估集。在候选系统冻结前，不得根据这些帧查看结果、调整规则、选择阈值或训练模型。",
    extraction: {
      script: "scripts/extract-s2-holdout.mjs",
      engine: "Playwright Chromium",
      chromiumVersion,
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      format: "image/jpeg",
      jpegQuality: JPEG_QUALITY,
      determinismScope: "Byte-identical when re-run on the same host with the same installed Chromium build and source bytes.",
    },
    sources: sourceRecords,
    sets: {
      primaryCrossSource: {
        role: "primary",
        independence: "cross-source",
        count: PRIMARY.length,
        status: "sealed-unreviewed",
        useForTuning: false,
        samples: PRIMARY.map((sample) => manifestSample(sample, sha256(captures.get(sample.id).bytes))),
      },
      supplementalSameSource: {
        role: "supplemental",
        independence: "same-source-correlated",
        count: SUPPLEMENTAL.length,
        status: "sealed-unreviewed",
        useForTuning: false,
        samples: SUPPLEMENTAL.map((sample) => manifestSample(sample, sha256(captures.get(sample.id).bytes))),
      },
    },
  };
}

function allManifestSamples(manifest) {
  return [
    ...manifest.sets.primaryCrossSource.samples,
    ...manifest.sets.supplementalSameSource.samples,
  ];
}

function validateSetContract(name, set, expected, role, independence) {
  if (
    set.role !== role
    || set.independence !== independence
    || set.status !== "sealed-unreviewed"
    || set.useForTuning !== false
  ) {
    throw new Error(`${name} has an invalid sealed-set contract.`);
  }
  if (set.count !== expected.length || set.samples.length !== expected.length) {
    throw new Error(`${name} count does not match its sample array.`);
  }

  set.samples.forEach((sample, index) => {
    const expectedSample = expected[index];
    if (
      sample.id !== expectedSample.id
      || sample.sourceId !== expectedSample.sourceId
      || sample.timeSec !== expectedSample.timeSec
      || sample.category !== expectedSample.category
    ) {
      throw new Error(`${name} sample ${index + 1} no longer matches the sealed selection.`);
    }
    if (sample.frame !== frameRelativePath(sample.id)) {
      throw new Error(`${sample.id} frame path is not bound to its sealed id.`);
    }
    if (sample.width !== FRAME_WIDTH || sample.height !== FRAME_HEIGHT) {
      throw new Error(`${sample.id} manifest dimensions are not ${FRAME_WIDTH}x${FRAME_HEIGHT}.`);
    }
  });
}

function validateManifestContract(manifest) {
  if (
    manifest.schemaVersion !== 1
    || manifest.datasetId !== "s2-cross-source-holdout-v1"
    || manifest.status !== "sealed-unreviewed"
    || manifest.useForTuning !== false
  ) {
    throw new Error("Holdout manifest must remain the sealed, untuned v1 dataset.");
  }
  if (
    manifest.extraction?.script !== "scripts/extract-s2-holdout.mjs"
    || manifest.extraction?.width !== FRAME_WIDTH
    || manifest.extraction?.height !== FRAME_HEIGHT
    || manifest.extraction?.format !== "image/jpeg"
    || manifest.extraction?.jpegQuality !== JPEG_QUALITY
  ) {
    throw new Error("Holdout extraction contract changed.");
  }

  validateSetContract(
    "primaryCrossSource",
    manifest.sets?.primaryCrossSource,
    PRIMARY,
    "primary",
    "cross-source",
  );
  validateSetContract(
    "supplementalSameSource",
    manifest.sets?.supplementalSameSource,
    SUPPLEMENTAL,
    "supplemental",
    "same-source-correlated",
  );

  if (manifest.sets.primaryCrossSource.samples.some((sample) => sample.sourceId === "charge")) {
    throw new Error("Primary holdout samples must remain cross-source from CHARGE.");
  }
  if (manifest.sets.supplementalSameSource.samples.some((sample) => sample.sourceId !== "charge")) {
    throw new Error("Supplemental holdout samples must remain CHARGE-correlated diagnostics.");
  }

  const expectedSourceIds = new Set([...PRIMARY, ...SUPPLEMENTAL].map((sample) => sample.sourceId));
  if (!Array.isArray(manifest.sources) || manifest.sources.length !== expectedSourceIds.size) {
    throw new Error("Holdout source inventory is incomplete or contains extras.");
  }
  const seenSourceIds = new Set();
  for (const source of manifest.sources) {
    const expectedSource = SOURCES[source.id];
    if (
      !expectedSourceIds.has(source.id)
      || seenSourceIds.has(source.id)
      || !expectedSource
      || source.asset !== expectedSource.asset
      || source.sha256 !== EXPECTED_SOURCE_SHA256[source.id]
      || source.width !== FRAME_WIDTH
      || source.height !== FRAME_HEIGHT
    ) {
      throw new Error(`Invalid sealed source record ${source.id ?? "unknown"}.`);
    }
    seenSourceIds.add(source.id);
  }
}

function assertContractRejectsTampering(manifest) {
  const mutations = [
    (copy) => { copy.sets.primaryCrossSource.count = 3; },
    (copy) => { copy.sets.primaryCrossSource.samples.push(structuredClone(copy.sets.primaryCrossSource.samples[0])); },
    (copy) => { copy.sets.primaryCrossSource.role = "supplemental"; },
    (copy) => { copy.sets.primaryCrossSource.samples[0].frame = "/evaluation/s2/holdout/wrong.jpg"; },
    (copy) => { copy.sets.primaryCrossSource.samples[0].sourceId = "charge"; },
    (copy) => { copy.sets.supplementalSameSource.samples[0].sourceId = "coast"; },
  ];

  for (const mutate of mutations) {
    const copy = structuredClone(manifest);
    mutate(copy);
    let rejected = false;
    try {
      validateManifestContract(copy);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("Holdout contract self-test accepted tampered metadata.");
  }
}

async function validateManifestAndFrames(manifest) {
  validateManifestContract(manifest);

  for (const source of manifest.sources) {
    const digest = await sha256File(join(REPO_ROOT, source.asset));
    if (digest !== source.sha256) throw new Error(`Source SHA-256 mismatch for ${source.asset}.`);
  }

  const seenIds = new Set();
  const seenFrameHashes = new Set();
  for (const sample of allManifestSamples(manifest)) {
    if (sample.status !== "sealed-unreviewed" || sample.useForTuning !== false || sample.groundTruth !== null) {
      throw new Error(`${sample.id} contains a label or is not sealed.`);
    }
    if (seenIds.has(sample.id)) throw new Error(`Duplicate sample id ${sample.id}.`);
    seenIds.add(sample.id);

    const bytes = await readFile(frameDiskPath(sample.id));
    const digest = sha256(bytes);
    if (digest !== sample.frameSha256) throw new Error(`Frame SHA-256 mismatch for ${sample.id}.`);
    const dimensions = jpegDimensions(bytes);
    if (dimensions.width !== FRAME_WIDTH || dimensions.height !== FRAME_HEIGHT) {
      throw new Error(`Unexpected dimensions for ${sample.id}: ${dimensions.width}x${dimensions.height}.`);
    }
    if (seenFrameHashes.has(digest)) throw new Error(`Duplicate frame bytes detected for ${sample.id}.`);
    seenFrameHashes.add(digest);
  }
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function verifyOnly() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  assertContractRejectsTampering(manifest);
  await validateManifestAndFrames(manifest);
  console.log(`Verified ${allManifestSamples(manifest).length} sealed holdout frames, split contracts, tamper rejection, source/frame hashes, and 1280x720 dimensions.`);
}

async function extract() {
  const { server, origin } = await createMediaServer();
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-gpu", "--disable-accelerated-video-decode"],
  });

  try {
    const page = await browser.newPage({ viewport: { width: FRAME_WIDTH, height: FRAME_HEIGHT } });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    const captures = new Map();
    for (const sample of [...PRIMARY, ...SUPPLEMENTAL]) {
      const capture = await captureFrame(page, origin, sample);
      const dimensions = jpegDimensions(capture.bytes);
      if (dimensions.width !== FRAME_WIDTH || dimensions.height !== FRAME_HEIGHT) {
        throw new Error(`Chromium produced ${dimensions.width}x${dimensions.height} for ${sample.id}.`);
      }
      captures.set(sample.id, capture);
      console.log(`${sample.id}: ${sha256(capture.bytes)}`);
    }

    const manifest = await buildManifest(captures, browser.version());
    const manifestAlreadyExists = await pathExists(MANIFEST_PATH);
    if (manifestAlreadyExists) {
      const sealedManifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
      await validateManifestAndFrames(sealedManifest);
      for (const sample of allManifestSamples(sealedManifest)) {
        const regeneratedSha = sha256(captures.get(sample.id).bytes);
        if (regeneratedSha !== sample.frameSha256) {
          throw new Error(`Determinism check failed for ${sample.id}: regenerated ${regeneratedSha}, sealed ${sample.frameSha256}.`);
        }
      }
      console.log("Determinism check passed: regenerated frame bytes match all sealed frame hashes. No files changed.");
      return;
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(dirname(MANIFEST_PATH), { recursive: true });
    for (const sample of [...PRIMARY, ...SUPPLEMENTAL]) {
      const outputPath = frameDiskPath(sample.id);
      const extractedBytes = captures.get(sample.id).bytes;
      if (await pathExists(outputPath)) {
        const existingBytes = await readFile(outputPath);
        if (sha256(existingBytes) !== sha256(extractedBytes)) {
          throw new Error(`Existing unsealed frame differs from regenerated bytes for ${sample.id}.`);
        }
      } else {
        await writeFile(outputPath, extractedBytes, { flag: "wx" });
      }
    }
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
    await validateManifestAndFrames(manifest);
    console.log(`Created and verified ${PRIMARY.length} primary plus ${SUPPLEMENTAL.length} supplemental sealed holdout frames.`);
  } finally {
    await browser.close();
    await new Promise((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise()));
  }
}

if (process.argv.includes("--verify-only")) {
  await verifyOnly();
} else {
  await extract();
}
