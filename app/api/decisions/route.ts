import { DecisionRequestSchema, VideoAnalysisSchema } from "@admind/contracts";
import { createS1RequestFromAnalysis, createS2Request, createS3Request, decide } from "@admind/decision-engine";
import chargeAnalysis from "../../../analysis/charge-twelvelabs-live.json";

export async function GET() {
  const analysis = VideoAnalysisSchema.parse(chargeAnalysis);
  const s1 = createS1RequestFromAnalysis(analysis, "admind");
  const s2 = createS2Request("admind");
  const s3 = createS3Request("admind");
  return Response.json({
    scenarios: [
      { scenario: s1.scenario, baseline: decide(createS1RequestFromAnalysis(analysis, "baseline")), admind: decide(s1) },
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
