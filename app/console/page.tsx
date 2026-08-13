import type { Metadata } from "next";
import { createS1Request, createS2Request, decide } from "@admind/decision-engine";
import { AdMindDemo } from "../components/AdMindDemo";

export const metadata: Metadata = {
  title: "决策后台 — AdMind",
};

export default function DecisionConsole() {
  const s1 = createS1Request("admind");
  const s2 = createS2Request("admind");
  return (
    <AdMindDemo
      scenarios={[
        { scenario: s1.scenario, baseline: decide(createS1Request("baseline")), admind: decide(s1) },
        { scenario: s2.scenario, baseline: decide(createS2Request("baseline")), admind: decide(s2) },
      ]}
    />
  );
}
