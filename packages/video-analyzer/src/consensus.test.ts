import { describe, expect, it } from "vitest";
import { VideoAnalysisSchema } from "@admind/contracts";
import chargeRun1 from "../../../analysis/runs/charge-twelvelabs-01.json";
import chargeRun2 from "../../../analysis/runs/charge-twelvelabs-02.json";
import { aggregateAnalyses } from "./consensus";

describe("video analysis consensus", () => {
  it("requires repeated runs to agree before promoting provider evidence", () => {
    const analyses = [VideoAnalysisSchema.parse(chargeRun1), VideoAnalysisSchema.parse(chargeRun2)];
    const consensus = aggregateAnalyses({ analyses, nominalOpportunitySec: 45, maxDeferralSec: 40 });

    expect(consensus).toMatchObject({
      runCount: 2,
      status: "stable",
      nominal: { timeSec: 45, recommendation: "block", agreement: 1 },
      fallback: { timeSec: 85, recommendation: "delay", agreement: 1 },
    });
    expect(consensus.nominal.confidenceMin).toBe(0.95);
    expect(consensus.nominal.confidenceMax).toBe(0.95);
  });

  it("returns uncertain when repeated runs disagree", () => {
    const first = VideoAnalysisSchema.parse(chargeRun1);
    const second = VideoAnalysisSchema.parse({
      ...chargeRun2,
      candidateBreaks: chargeRun2.candidateBreaks.map((item) =>
        item.timeSec === 45 ? { ...item, recommendation: "allow" } : item),
    });
    const consensus = aggregateAnalyses({ analyses: [first, second], nominalOpportunitySec: 45, maxDeferralSec: 40 });

    expect(consensus.status).toBe("uncertain");
    expect(consensus.nominal.recommendation).toBe("uncertain");
  });
});
