import type { Metadata } from "next";
import { createS1Request, decide } from "@admind/decision-engine";
import { AdMindDemo } from "./components/AdMindDemo";

export const metadata: Metadata = {
  title: "Decision Console · AdMind",
  other: { "codex-preview": "development" },
};

export default function Home() {
  const request = createS1Request("admind");
  return (
    <AdMindDemo
      scenario={request.scenario}
      baseline={decide(createS1Request("baseline"))}
      admind={decide(request)}
    />
  );
}
