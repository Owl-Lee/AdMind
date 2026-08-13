import cors from "@fastify/cors";
import Fastify from "fastify";
import { DecisionRequestSchema } from "@admind/contracts";
import { createS1Request, createS2Request, decide } from "@admind/decision-engine";

export function buildApi() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: process.env.ADMIND_WEB_ORIGIN ?? "http://localhost:3000",
  });

  app.get("/health", async () => ({ status: "ok", service: "admind-api" }));

  app.get("/v1/scenarios/S1", async () => ({
    scenario: createS1Request("admind").scenario,
    baseline: decide(createS1Request("baseline")),
    admind: decide(createS1Request("admind")),
  }));

  app.get("/v1/scenarios/S2", async () => ({
    scenario: createS2Request("admind").scenario,
    baseline: decide(createS2Request("baseline")),
    admind: decide(createS2Request("admind")),
  }));

  app.post("/v1/decisions", async (request, reply) => {
    const parsed = DecisionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_DECISION_REQUEST",
        issues: parsed.error.issues,
      });
    }
    return decide(parsed.data);
  });

  return app;
}
