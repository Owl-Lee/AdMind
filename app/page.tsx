import type { Metadata } from "next";
import { VideoAnalysisSchema } from "@admind/contracts";
import { createS1RequestFromAnalysis, createS2Request, createS3Request, decide } from "@admind/decision-engine";
import { ShowcaseDemo } from "./components/ShowcaseDemo";
import chargeAnalysis from "../analysis/charge-twelvelabs-live.json";

export const metadata: Metadata = {
  title: "AdMind — 广告必须出现，也不必毁掉剧情",
};

export default function Home() {
  const analysis = VideoAnalysisSchema.parse(chargeAnalysis);
  const s1 = createS1RequestFromAnalysis(analysis, "admind");
  const s2 = createS2Request("admind");
  const s3 = createS3Request("admind");
  return (
    <ShowcaseDemo
      scenarios={[
        { scenario: s1.scenario, baseline: decide(createS1RequestFromAnalysis(analysis, "baseline")), admind: decide(s1) },
        { scenario: s2.scenario, baseline: decide(createS2Request("baseline")), admind: decide(s2) },
        { scenario: s3.scenario, baseline: decide(createS3Request("baseline")), admind: decide(s3) },
      ]}
    />
  );
}
