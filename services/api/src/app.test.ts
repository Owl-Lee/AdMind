import { afterEach, describe, expect, it } from "vitest";
import { buildApi } from "./app";
import { createS1Request } from "@admind/decision-engine";

const apps: ReturnType<typeof buildApi>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("decision API", () => {
  it("returns the complete S1 comparison", async () => {
    const app = buildApi();
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/v1/scenarios/S1" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.scenario.id).toBe("S1");
    expect(body.baseline.selected.timeSec).toBe(45);
    expect(body.admind.selected.timeSec).toBe(82);
  });

  it("validates posted decision contracts", async () => {
    const app = buildApi();
    apps.push(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/decisions",
      payload: { strategy: "admind" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("INVALID_DECISION_REQUEST");
  });

  it("executes a valid decision request", async () => {
    const app = buildApi();
    apps.push(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/decisions",
      payload: createS1Request("admind"),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().selected.creativeId).toBe("creative-6s-muted");
  });
});
