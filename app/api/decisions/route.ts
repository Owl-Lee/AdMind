import { DecisionRequestSchema } from "@admind/contracts";
import { createS1Request, decide } from "@admind/decision-engine";

export async function GET() {
  return Response.json({
    scenario: createS1Request("admind").scenario,
    baseline: decide(createS1Request("baseline")),
    admind: decide(createS1Request("admind")),
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
