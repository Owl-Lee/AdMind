import { DecisionRequestSchema, VideoAnalysisSchema } from "@admind/contracts";
import { aggregateAnalyses } from "@admind/video-analyzer";
import { createS1RequestFromAnalysis, createS2Request, createS3Request, decide } from "@admind/decision-engine";
import chargeRun1 from "../../../analysis/runs/charge-twelvelabs-01.json";
import chargeRun2 from "../../../analysis/runs/charge-twelvelabs-02.json";

export async function GET() {
  const analyses = [VideoAnalysisSchema.parse(chargeRun1), VideoAnalysisSchema.parse(chargeRun2)];
  const analysis = analyses[1];
  const consensus = aggregateAnalyses({ analyses, nominalOpportunitySec: 45, maxDeferralSec: 40 });
  const s1 = createS1RequestFromAnalysis(analysis, "admind", consensus);
  const s2 = createS2Request("admind");
  const s3 = createS3Request("admind");
  return Response.json({
    scenarios: [
      { scenario: s1.scenario, baseline: decide(createS1RequestFromAnalysis(analysis, "baseline", consensus)), admind: decide(s1) },
      { scenario: s2.scenario, baseline: decide(createS2Request("baseline")), admind: decide(s2) },
      { scenario: s3.scenario, baseline: decide(createS3Request("baseline")), admind: decide(s3) },
    ],
  });
}

export async function POST(request: Request) {
  const parsed = DecisionRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { code: "INVALID_DECISION_REQUEST", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  return Response.json(decide(parsed.data));
}
