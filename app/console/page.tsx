import type { Metadata } from "next";
import { createS1Request, decide } from "@admind/decision-engine";
import { AdMindDemo } from "../components/AdMindDemo";

export const metadata: Metadata = {
  title: "决策后台 — AdMind",
};

export default function DecisionConsole() {
  const request = createS1Request("admind");
  return (
    <AdMindDemo
      scenario={request.scenario}
      baseline={decide(createS1Request("baseline"))}
      admind={decide(request)}
    />
  );
}
