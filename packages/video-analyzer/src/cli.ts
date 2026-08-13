import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { buildAnalysis } from "./normalize";
import { analyzeWithGemini } from "./providers/gemini";
import { analyzeWithTwelveLabs } from "./providers/twelvelabs";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const provider = argument("provider");
  const file = argument("file");
  const duration = Number(argument("duration"));
  const output = resolve(argument("output") ?? `analysis/${provider ?? "unknown"}-analysis.json`);

  if ((provider !== "gemini" && provider !== "twelvelabs") || !file || !Number.isFinite(duration) || duration <= 0) {
    throw new Error("Usage: pnpm analyze:video --provider <gemini|twelvelabs> --file <video.mp4> --duration <seconds> [--output <file.json>]");
  }

  const filePath = resolve(file);
  const sha256 = createHash("sha256").update(await readFile(filePath)).digest("hex");
  if (provider === "gemini" && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  if (provider === "twelvelabs" && !process.env.TWELVELABS_API_KEY) throw new Error("TWELVELABS_API_KEY is missing.");
  const result = provider === "gemini"
    ? await analyzeWithGemini({
        apiKey: process.env.GEMINI_API_KEY ?? "",
        filePath,
      })
    : await analyzeWithTwelveLabs({
        apiKey: process.env.TWELVELABS_API_KEY ?? "",
        filePath,
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
  process.stdout.write(`Saved ${provider} analysis to ${output}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
