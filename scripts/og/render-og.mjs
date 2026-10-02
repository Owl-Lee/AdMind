#!/usr/bin/env node
// Renders scripts/og/og-card.html to public/og.png (1536 × 1024).
//
//   node scripts/og/render-og.mjs [--time 86] [--out public/og.png]
//
// Headless Playwright Chromium decodes the real CHARGE frame from
// public/admind-charge-demo-720p.mp4, then sharp re-encodes the screenshot with
// maximum PNG compression so the social card stays under 400 KB. sharp is not a direct
// dependency; it is resolved through the Cloudflare toolchain (miniflare) that
// already installs it.
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const WIDTH = 1536;
const HEIGHT = 1024;
const MAX_BYTES = 400 * 1024;
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    const pluginDir = realpathSync(resolve(root, "node_modules/@cloudflare/vite-plugin"));
    const fromPlugin = createRequire(resolve(pluginDir, "package.json"));
    const fromMiniflare = createRequire(fromPlugin.resolve("miniflare"));
    return (await import(pathToFileURL(fromMiniflare.resolve("sharp")).href)).default;
  }
}

const seconds = Number(argument("time", "86"));
const out = resolve(root, argument("out", "public/og.png"));
const pageUrl = `${pathToFileURL(resolve(here, "og-card.html")).href}?t=${seconds}`;

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  await page.goto(pageUrl, { waitUntil: "load" });
  await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 60_000 });
  const state = await page.evaluate(() => ({
    ready: document.body.dataset.ready,
    currentTime: document.querySelector("video")?.currentTime,
  }));
  if (state.ready !== "1") throw new Error(`The video frame could not be decoded (${state.ready}).`);
  const raw = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });

  const sharp = await loadSharp();
  // Prefer a lossless truecolour PNG (the video frame posterizes under a
  // 256-colour palette); fall back to a dithered palette only if it would
  // exceed the 400 KB social-card budget.
  let png = await sharp(raw).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  if (png.length > MAX_BYTES) {
    png = await sharp(raw).png({ palette: true, colours: 256, dither: 0.6, effort: 10, compressionLevel: 9 }).toBuffer();
  }
  const meta = await sharp(png).metadata();
  if (meta.width !== WIDTH || meta.height !== HEIGHT) throw new Error(`Unexpected size ${meta.width}×${meta.height}`);
  await writeFile(out, png);

  const sha256 = createHash("sha256").update(await readFile(out)).digest("hex");
  console.log(JSON.stringify({
    out,
    frameSeconds: state.currentTime,
    width: meta.width,
    height: meta.height,
    bytes: png.length,
    sha256,
  }, null, 2));
} finally {
  await browser.close();
}
