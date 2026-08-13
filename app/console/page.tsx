import type { Metadata } from "next";
import { VideoAnalysisSchema } from "@admind/contracts";
import { createS1Request, createS2Request, createS3Request, decide } from "@admind/decision-engine";
import { AdMindDemo } from "../components/AdMindDemo";
import chargeAnalysis from "../../analysis/charge-curated.json";

export const metadata: Metadata = {
  title: "决策后台 — AdMind",
};

export default function DecisionConsole() {
  const s1 = createS1Request("admind");
  const s2 = createS2Request("admind");
  const s3 = createS3Request("admind");
  return (
    <AdMindDemo
      analysis={VideoAnalysisSchema.parse(chargeAnalysis)}
      scenarios={[
        { scenario: s1.scenario, baseline: decide(createS1Request("baseline")), admind: decide(s1) },
        { scenario: s2.scenario, baseline: decide(createS2Request("baseline")), admind: decide(s2) },
        { scenario: s3.scenario, baseline: decide(createS3Request("baseline")), admind: decide(s3) },
      ]}
    />
  );
}
