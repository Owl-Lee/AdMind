import { DecisionRequestSchema } from "@admind/contracts";
import { createS1Request, createS2Request, decide } from "@admind/decision-engine";

export async function GET() {
  const s1 = createS1Request("admind");
  const s2 = createS2Request("admind");
  return Response.json({
    scenarios: [
      { scenario: s1.scenario, baseline: decide(createS1Request("baseline")), admind: decide(s1) },
      { scenario: s2.scenario, baseline: decide(createS2Request("baseline")), admind: decide(s2) },
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
