import { createReadStream } from "node:fs";
import { basename } from "node:path";
import { TwelveLabs } from "twelvelabs-js";
import { ANALYSIS_PROMPT } from "../prompt";
import { parseJsonPayload } from "../normalize";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function analyzeWithTwelveLabs(input: {
  apiKey: string;
  filePath: string;
  model?: "pegasus1.2" | "pegasus1.5";
}) {
  const model = input.model ?? "pegasus1.5";
  const client = new TwelveLabs({ apiKey: input.apiKey });
  const asset = await client.assets.create({
    method: "direct",
    file: createReadStream(input.filePath),
    filename: basename(input.filePath),
  });
  if (!asset.id) throw new Error("TwelveLabs upload did not return an asset id.");

  let current = await client.assets.retrieve(asset.id);
  while (current.status === "processing") {
    await wait(2_000);
    current = await client.assets.retrieve(asset.id);
  }
  if (current.status !== "ready") {
    throw new Error(`TwelveLabs could not process the video (${current.status ?? "unknown state"}).`);
  }

  const response = await client.analyze({
    modelName: model,
    video: { type: "asset_id", assetId: asset.id },
    prompt: ANALYSIS_PROMPT,
    temperature: 0.1,
    maxTokens: 4_096,
  });
  if (!response.data) throw new Error("TwelveLabs returned an empty analysis.");
  return { model, payload: parseJsonPayload(response.data) };
}
