import type { Metadata } from "next";
import { VideoAnalysisSchema } from "@admind/contracts";
import { aggregateAnalyses } from "@admind/video-analyzer";
import { createS1RequestFromAnalysis, createS2Request, createS3Request, decide } from "@admind/decision-engine";
import { ShowcaseDemo } from "./components/ShowcaseDemo";
import chargeRun1 from "../analysis/runs/charge-twelvelabs-01.json";
import chargeRun2 from "../analysis/runs/charge-twelvelabs-02.json";
import coffeeRun from "../analysis/runs/coffee-run-twelvelabs.json";
import llamigosRun from "../analysis/runs/llamigos-twelvelabs.json";

export const metadata: Metadata = {
  title: "AdMind — 广告必须出现，也不必毁掉剧情",
};

export default function Home() {
  const analyses = [VideoAnalysisSchema.parse(chargeRun1), VideoAnalysisSchema.parse(chargeRun2)];
  const analysis = analyses[1];
  const coffeeAnalysis = VideoAnalysisSchema.parse(coffeeRun);
  const llamigosAnalysis = VideoAnalysisSchema.parse(llamigosRun);
  const consensus = aggregateAnalyses({ analyses, nominalOpportunitySec: 45, maxDeferralSec: 40 });
  const s1 = createS1RequestFromAnalysis(analysis, "admind", consensus);
  const coffeeS1 = createS1RequestFromAnalysis(coffeeAnalysis, "admind");
  const llamigosS1 = createS1RequestFromAnalysis(llamigosAnalysis, "admind");
  const s2 = createS2Request("admind");
  const s3 = createS3Request("admind");
  return (
    <ShowcaseDemo
      analysisRuns={analyses}
      consensus={consensus}
      scenarios={[
        {
          scenario: s1.scenario,
          baseline: decide(createS1RequestFromAnalysis(analysis, "baseline", consensus)),
          admind: decide(s1),
          media: {
            id: "charge",
            label: "CHARGE",
            category: "动作冲突",
            src: "/media/admind-charge-demo-720p.mp4",
            captionsSrc: "/charge-demo-zh.vtt",
            sourceLabel: "CHARGE · Blender Studio",
            modelFinding: "00:45 战斗高潮；01:25 仍需等待并改用低遮挡形式",
          },
          alternatives: [
            {
              scenario: coffeeS1.scenario,
              baseline: decide(createS1RequestFromAnalysis(coffeeAnalysis, "baseline")),
              admind: decide(coffeeS1),
              media: {
                id: "coffee-run",
                label: "Coffee Run",
                category: "情绪连续",
                src: "/media/coffee-run-emotion-720p.mp4",
                sourceLabel: "Coffee Run · Blender Studio",
                modelFinding: "求婚、医院与悲伤记忆连续出现；窗口内没有安全插播点",
              },
            },
            {
              scenario: llamigosS1.scenario,
              baseline: decide(createS1RequestFromAnalysis(llamigosAnalysis, "baseline")),
              admind: decide(llamigosS1),
              media: {
                id: "llamigos",
                label: "Llamigos",
                category: "追逐高潮",
                src: "/media/llamigos-chase-720p.mp4",
                sourceLabel: "Caminandes: Llamigos · Blender",
                modelFinding: "00:20 矿车高潮；00:51 危险已过但仍处于恢复段",
              },
            },
          ],
        },
        {
          scenario: s2.scenario,
          baseline: decide(createS2Request("baseline")),
          admind: decide(s2),
          media: {
            id: "charge-pause",
            label: "CHARGE",
            category: "暂停查看",
            src: "/media/admind-charge-demo-720p.mp4",
            captionsSrc: "/charge-demo-zh.vtt",
            sourceLabel: "CHARGE · Blender Studio",
            modelFinding: "只读取暂停、拖动与页面可见性，不推断用户脑内意图",
          },
        },
        {
          scenario: s3.scenario,
          baseline: decide(createS3Request("baseline")),
          admind: decide(s3),
          media: {
            id: "coast-guard",
            label: "Hurricane Helene Rescue",
            category: "伦理保护",
            src: "/media/coast-guard-rescue-720p.mp4",
            sourceLabel: "U.S. Coast Guard · Public Domain",
            modelFinding: "00:00–00:40 为连续真实救援；只有行动完成后才允许投放",
          },
        },
      ]}
    />
  );
}
