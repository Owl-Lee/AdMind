import { FileState, GoogleGenAI, createPartFromUri, createUserContent } from "@google/genai";
import { ANALYSIS_PROMPT } from "../prompt";
import { parseJsonPayload } from "../normalize";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function analyzeWithGemini(input: {
  apiKey: string;
  filePath: string;
  model?: string;
}) {
  const model = input.model ?? "gemini-2.5-flash-lite";
  const client = new GoogleGenAI({ apiKey: input.apiKey });
  let uploaded = await client.files.upload({
    file: input.filePath,
    config: { mimeType: "video/mp4" },
  });

  if (!uploaded.name) throw new Error("Gemini upload did not return a file name.");
  const uploadedName = uploaded.name;

  try {
    while (uploaded.state === FileState.PROCESSING) {
      await wait(2_000);
      uploaded = await client.files.get({ name: uploadedName });
    }
    if (uploaded.state !== FileState.ACTIVE || !uploaded.uri || !uploaded.mimeType) {
      throw new Error(`Gemini could not process the video (${uploaded.state ?? "unknown state"}).`);
    }

    const response = await client.models.generateContent({
      model,
      contents: createUserContent([
        createPartFromUri(uploaded.uri, uploaded.mimeType),
        ANALYSIS_PROMPT,
      ]),
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    if (!response.text) throw new Error("Gemini returned an empty analysis.");
    return { model, payload: parseJsonPayload(response.text) };
  } finally {
    await client.files.delete({ name: uploadedName }).catch(() => undefined);
  }
}
