import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { buildAnalysis } from "./normalize";
import { buildAnalysisPrompt } from "./prompt";
import { analyzeWithGemini } from "./providers/gemini";
import { analyzeWithTwelveLabs } from "./providers/twelvelabs";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function loadLocalEnvironment() {
  for (const candidate of [".env.local", ".env"]) {
    const path = resolve(candidate);
    if (!existsSync(path)) continue;
    for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) {
      const match = line.replace(/^\uFEFF/, "").match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
    break;
  }
}

async function main() {
  await loadLocalEnvironment();
  const provider = argument("provider");
  const file = argument("file");
  const duration = Number(argument("duration"));
  const nominalOpportunitySec = Number(argument("nominal") ?? 45);
  const maxDeferralSec = Number(argument("max-deferral") ?? 40);
  const output = resolve(argument("output") ?? `analysis/${provider ?? "unknown"}-analysis.json`);
  const rawOutputArgument = argument("raw-output");

  if ((provider !== "gemini" && provider !== "twelvelabs") || !file || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(nominalOpportunitySec) || !Number.isFinite(maxDeferralSec)) {
    throw new Error("Usage: pnpm analyze:video --provider <gemini|twelvelabs> --file <video.mp4> --duration <seconds> [--nominal <seconds>] [--max-deferral <seconds>] [--output <file.json>] [--raw-output <file.json>]");
  }

  const filePath = resolve(file);
  const sha256 = createHash("sha256").update(await readFile(filePath)).digest("hex");
  if (provider === "gemini" && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  if (provider === "twelvelabs" && !process.env.TWELVELABS_API_KEY) throw new Error("TWELVELABS_API_KEY is missing.");
  const prompt = buildAnalysisPrompt({ durationSec: duration, nominalOpportunitySec, maxDeferralSec });
  const result = provider === "gemini"
    ? await analyzeWithGemini({
        apiKey: process.env.GEMINI_API_KEY ?? "",
        filePath,
        prompt,
      })
    : await analyzeWithTwelveLabs({
        apiKey: process.env.TWELVELABS_API_KEY ?? "",
        filePath,
        prompt,
      });

  const analysis = buildAnalysis({
    provider,
    model: result.model,
    fileName: basename(filePath),
    durationSec: duration,
    sha256,
    payload: result.payload,
  });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(analysis, null, 2)}\n`, "utf8");
  if (rawOutputArgument) {
    const rawOutput = resolve(rawOutputArgument);
    await mkdir(dirname(rawOutput), { recursive: true });
    await writeFile(rawOutput, `${result.rawText.trim()}\n`, "utf8");
  }
  process.stdout.write(`Saved ${provider} analysis to ${output}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
