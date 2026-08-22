import { createReadStream } from "node:fs";
import { basename } from "node:path";
import { TwelveLabs } from "twelvelabs-js";
import { ANALYSIS_PROMPT } from "../prompt";
import { parseJsonPayload } from "../normalize";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const DEFAULT_PROCESSING_TIMEOUT_MS = 10 * 60_000;
const PROCESSING_POLL_INTERVAL_MS = 2_000;

export async function analyzeWithTwelveLabs(input: {
  apiKey: string;
  filePath: string;
  model?: "pegasus1.2" | "pegasus1.5";
  prompt?: string;
  processingTimeoutMs?: number;
}) {
  const model = input.model ?? "pegasus1.5";
  const processingTimeoutMs = input.processingTimeoutMs ?? DEFAULT_PROCESSING_TIMEOUT_MS;
  if (!Number.isFinite(processingTimeoutMs) || processingTimeoutMs <= 0) {
    throw new Error("TwelveLabs processing timeout must be a positive number of milliseconds.");
  }
  const client = new TwelveLabs({ apiKey: input.apiKey });
  const asset = await client.assets.create({
    method: "direct",
    file: createReadStream(input.filePath),
    filename: basename(input.filePath),
  });
  if (!asset.id) throw new Error("TwelveLabs upload did not return an asset id.");
  const assetId = asset.id;

  try {
    const processingDeadline = Date.now() + processingTimeoutMs;
    let current = await client.assets.retrieve(assetId);
    while (current.status === "processing") {
      const remainingMs = processingDeadline - Date.now();
      if (remainingMs <= 0) {
        throw new Error(`TwelveLabs processing timed out after ${processingTimeoutMs} ms.`);
      }
      await wait(Math.min(PROCESSING_POLL_INTERVAL_MS, remainingMs));
      current = await client.assets.retrieve(assetId);
    }
    if (current.status !== "ready") {
      throw new Error(`TwelveLabs could not process the video (${current.status ?? "unknown state"}).`);
    }

    const response = await client.analyze({
      modelName: model,
      video: { type: "asset_id", assetId },
      prompt: input.prompt ?? ANALYSIS_PROMPT,
      temperature: 0.1,
      maxTokens: 4_096,
    });
    if (!response.data) throw new Error("TwelveLabs returned an empty analysis.");
    return { model, payload: parseJsonPayload(response.data), rawText: response.data };
  } finally {
    try {
      await client.assets.delete(assetId);
    } catch (cleanupError) {
      console.warn(
        "TwelveLabs temporary asset cleanup failed. Remove the retained asset manually from the provider account.",
        cleanupError instanceof Error ? cleanupError.message : cleanupError,
      );
    }
  }
}
