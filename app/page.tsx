import type { Metadata } from "next";
import { VideoAnalysisSchema } from "@admind/contracts";
import { createS1Request, createS2Request, createS3Request, decide } from "@admind/decision-engine";
import { ShowcaseDemo } from "./components/ShowcaseDemo";
import chargeAnalysis from "../analysis/charge-curated.json";

export const metadata: Metadata = {
  title: "AdMind — 广告必须出现，也不必毁掉剧情",
};

export default function Home() {
  const s1 = createS1Request("admind");
  const s2 = createS2Request("admind");
  const s3 = createS3Request("admind");
  return (
    <ShowcaseDemo
      analysis={VideoAnalysisSchema.parse(chargeAnalysis)}
      scenarios={[
        { scenario: s1.scenario, baseline: decide(createS1Request("baseline")), admind: decide(s1) },
        { scenario: s2.scenario, baseline: decide(createS2Request("baseline")), admind: decide(s2) },
        { scenario: s3.scenario, baseline: decide(createS3Request("baseline")), admind: decide(s3) },
      ]}
    />
  );
}
