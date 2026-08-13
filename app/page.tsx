import type { Metadata } from "next";
import { VideoAnalysisSchema } from "@admind/contracts";
import { aggregateAnalyses } from "@admind/video-analyzer";
import { createS1RequestFromAnalysis, createS2Request, createS3Request, decide } from "@admind/decision-engine";
import { ShowcaseDemo } from "./components/ShowcaseDemo";
import chargeRun1 from "../analysis/runs/charge-twelvelabs-01.json";
import chargeRun2 from "../analysis/runs/charge-twelvelabs-02.json";

export const metadata: Metadata = {
  title: "AdMind — 广告必须出现，也不必毁掉剧情",
};

export default function Home() {
  const analyses = [VideoAnalysisSchema.parse(chargeRun1), VideoAnalysisSchema.parse(chargeRun2)];
  const analysis = analyses[1];
  const consensus = aggregateAnalyses({ analyses, nominalOpportunitySec: 45, maxDeferralSec: 40 });
  const s1 = createS1RequestFromAnalysis(analysis, "admind", consensus);
  const s2 = createS2Request("admind");
  const s3 = createS3Request("admind");
  return (
    <ShowcaseDemo
      scenarios={[
        { scenario: s1.scenario, baseline: decide(createS1RequestFromAnalysis(analysis, "baseline", consensus)), admind: decide(s1) },
        { scenario: s2.scenario, baseline: decide(createS2Request("baseline")), admind: decide(s2) },
        { scenario: s3.scenario, baseline: decide(createS3Request("baseline")), admind: decide(s3) },
      ]}
    />
  );
}
