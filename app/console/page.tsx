import type { Metadata } from "next";
import { VideoAnalysisSchema } from "@admind/contracts";
import { aggregateAnalyses } from "@admind/video-analyzer";
import { createS1RequestFromAnalysis, decide } from "@admind/decision-engine";
import { DecisionConsole as DecisionConsoleView } from "../components/DecisionConsole";
import chargeRun1 from "../../analysis/runs/charge-twelvelabs-01.json";
import chargeRun2 from "../../analysis/runs/charge-twelvelabs-02.json";

export const metadata: Metadata = {
  title: "决策后台 — AdMind",
};

export default function DecisionConsole() {
  const analyses = [VideoAnalysisSchema.parse(chargeRun1), VideoAnalysisSchema.parse(chargeRun2)];
  const analysis = analyses[1];
  const consensus = aggregateAnalyses({ analyses, nominalOpportunitySec: 45, maxDeferralSec: 40 });
  const s1 = createS1RequestFromAnalysis(analysis, "admind", consensus);
  return (
    <DecisionConsoleView
      analysisRuns={analyses}
      consensus={consensus}
      decision={decide(s1)}
      request={s1}
    />
  );
}
