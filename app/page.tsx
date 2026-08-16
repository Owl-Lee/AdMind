import type { Metadata } from "next";
import { VideoAnalysisSchema } from "@admind/contracts";
import { aggregateAnalyses } from "@admind/video-analyzer";
import { createS1RequestFromAnalysis, createS2Request, createS3RequestFromAnalysis, decide } from "@admind/decision-engine";
import { ShowcaseDemo } from "./components/ShowcaseDemo";
import chargeRun1 from "../analysis/runs/charge-twelvelabs-01.json";
import chargeRun2 from "../analysis/runs/charge-twelvelabs-02.json";
import coffeeRun from "../analysis/runs/coffee-run-twelvelabs.json";
import llamigosRun from "../analysis/runs/llamigos-twelvelabs.json";
import coastGuardRun from "../analysis/runs/coast-guard-twelvelabs.json";
import usnsMedicalRun from "../analysis/runs/usns-medical-twelvelabs.json";
import femaRecoveryRun from "../analysis/runs/fema-recovery-twelvelabs.json";

export const metadata: Metadata = {
  title: "AdMind — 广告必须出现，也不必毁掉剧情",
};

export default function Home() {
  const analyses = [VideoAnalysisSchema.parse(chargeRun1), VideoAnalysisSchema.parse(chargeRun2)];
  const analysis = analyses[1];
  const coffeeAnalysis = VideoAnalysisSchema.parse(coffeeRun);
  const llamigosAnalysis = VideoAnalysisSchema.parse(llamigosRun);
  const coastGuardAnalysis = VideoAnalysisSchema.parse(coastGuardRun);
  const usnsMedicalAnalysis = VideoAnalysisSchema.parse(usnsMedicalRun);
  const femaRecoveryAnalysis = VideoAnalysisSchema.parse(femaRecoveryRun);
  const consensus = aggregateAnalyses({ analyses, nominalOpportunitySec: 45, maxDeferralSec: 40 });
  const s1 = createS1RequestFromAnalysis(analysis, "admind", consensus);
  const coffeeS1 = createS1RequestFromAnalysis(coffeeAnalysis, "admind");
  const llamigosS1 = createS1RequestFromAnalysis(llamigosAnalysis, "admind");
  const s2 = createS2Request("admind");
  const coastGuardContext = {
    title: "真实海上救援 × 高价保量广告",
    episodeTitle: "美国海岸警卫队飓风救援实拍（Public Domain）",
    policyReason: "已核验真实救援",
    nominalOpportunitySec: 5,
  };
  const usnsMedicalContext = {
    title: "医疗后送任务 × 高价保量广告",
    episodeTitle: "USNS Comfort 医疗后送实拍（Public Domain）",
    policyReason: "来源标注为医疗后送任务",
    nominalOpportunitySec: 10,
  };
  const femaRecoveryContext = {
    title: "飓风灾后纪实 × 高价保量广告",
    episodeTitle: "FEMA Hurricane Maria 灾后纪实（Public Domain）",
    policyReason: "模型识别为灾难与创伤语境",
    nominalOpportunitySec: 15,
  };
  const s3 = createS3RequestFromAnalysis(coastGuardAnalysis, coastGuardContext, "admind");
  const usnsS3 = createS3RequestFromAnalysis(usnsMedicalAnalysis, usnsMedicalContext, "admind");
  const femaS3 = createS3RequestFromAnalysis(femaRecoveryAnalysis, femaRecoveryContext, "admind");
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
            category: "简单角色画面",
            src: "/media/admind-charge-demo-720p.mp4",
            captionsSrc: "/charge-demo-zh.vtt",
            sourceLabel: "CHARGE · Blender Studio",
            modelFinding: "只读取暂停、拖动与页面可见性，不推断用户脑内意图",
          },
          alternatives: [
            {
              scenario: s2.scenario,
              baseline: decide(createS2Request("baseline")),
              admind: decide(createS2Request("admind")),
              media: {
                id: "sprite-fright-pause",
                label: "Sprite Fright",
                category: "复杂角色画面",
                src: "/media/sprite-fright-pause-demo-540p.mp4",
                quality: "540p",
                sourceLabel: "Sprite Fright · Blender Studio",
                modelFinding: "暂停后才读取当前画面；本地 MediaPipe 实时寻找可避让区域，未识别到人脸时仍会避开字幕与控制条。",
              },
            },
          ],
        },
        {
          scenario: s3.scenario,
          baseline: decide(createS3RequestFromAnalysis(coastGuardAnalysis, coastGuardContext, "baseline")),
          admind: decide(s3),
          media: {
            id: "coast-guard",
            label: "Hurricane Helene Rescue",
            category: "海上救援",
            src: "/media/coast-guard-rescue-720p.mp4",
            sourceLabel: "U.S. Coast Guard · Public Domain",
            modelFinding: "00:05 识别为高紧张度真实救援；整段没有内部安全窗口，本次不投放",
          },
          alternatives: [
            {
              scenario: usnsS3.scenario,
              baseline: decide(createS3RequestFromAnalysis(usnsMedicalAnalysis, usnsMedicalContext, "baseline")),
              admind: decide(usnsS3),
              media: {
                id: "usns-medical",
                label: "USNS Comfort Medical Evacuation",
                category: "医疗转运",
                src: "/media/usns-medical-evacuation-720p.mp4",
                sourceLabel: "U.S. Navy · Public Domain",
                modelFinding: "来源已核验为医疗后送；API 识别出 00:26–00:38 的连续高风险任务阶段，本次不投放",
              },
            },
            {
              scenario: femaS3.scenario,
              baseline: decide(createS3RequestFromAnalysis(femaRecoveryAnalysis, femaRecoveryContext, "baseline")),
              admind: decide(femaS3),
              media: {
                id: "fema-recovery",
                label: "FEMA Hurricane Maria Recovery",
                category: "灾后现场",
                src: "/media/fema-hurricane-recovery-720p.mp4",
                sourceLabel: "FEMA · Public Domain",
                modelFinding: "00:15 建议延后；00:46–01:09 为幸存者证词与灾后破坏，整段维持伦理保护",
              },
            },
          ],
        },
      ]}
    />
  );
}
