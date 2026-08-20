"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { AnalysisConsensus, DecisionResponse, Scenario, Strategy, VideoAnalysis } from "@admind/contracts";
import { ChevronIcon, PlayIcon, ShieldIcon, SparkIcon, VolumeIcon } from "./icons";
import { AdCreative } from "./AdCreative";
import { detectFacesInPausedFrame, type FaceDetectionEvidence } from "../lib/face-detector";
import { choosePauseAdPlacement, type PlacementDecision } from "../lib/pause-decision";
import { observeUiLocalization, type UiLocale } from "../lib/ui-localization";

export type DemoMedia = {
  id: string;
  label: string;
  category: string;
  src: string;
  sourceLabel: string;
  modelFinding: string;
  analysis?: VideoAnalysis;
  captionsSrc?: string;
  quality?: string;
};

export type ScenarioDemoVariant = {
  scenario: Scenario;
  baseline: DecisionResponse;
  admind: DecisionResponse;
  media: DemoMedia;
};

export type ScenarioDemo = ScenarioDemoVariant & {
  alternatives?: ScenarioDemoVariant[];
};

type ShowcaseDemoProps = {
  scenarios: ScenarioDemo[];
  analysisRuns: VideoAnalysis[];
  consensus: AnalysisConsensus;
};

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function asPercent(value = 0) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function asTenPoint(value = 0) {
  return (Math.max(0, Math.min(1, value)) * 10).toFixed(1);
}

function asEvidenceScore(value = 0) {
  return Math.max(0, Math.min(1, value)).toFixed(2);
}

const ANALYSIS_LABELS: Record<string, string> = {
  "Stealing the Core": "核心能量被盗",
  "Robot Fight": "机器人战斗",
  "Violent Confrontation": "激烈对抗",
  "Fight Climax": "战斗高潮",
  "Fight Ends": "战斗结束",
  "Mid-Fight": "战斗进行中",
  "Post-Fight Recovery": "战斗后恢复",
  "FEMA officials briefing": "FEMA 官员简报",
  "Damage statistics and drone footage": "灾情数据与航拍画面",
  "Isolated mountain community": "受灾山区社区",
  "Survivor testimony and destruction": "幸存者讲述与灾后破坏",
  "Reporter sign-off": "记者结语",
  "Final sign-off": "最终结语",
  "Introduction and Setup": "开场铺垫",
  "Mine Cart Climax": "矿车追逐高潮",
  "Freefall and Impact": "坠落与撞击",
  "Resolution and Reveal": "危机解除与揭示",
  "Nominal Opportunity": "原定广告候选点",
  "Nominal opportunity": "原定广告候选点",
  "Post-Climax Recovery": "高潮后恢复",
  "名义机会点": "原定广告候选点",
};

function localizeAnalysisLabel(label: string) {
  const evidenceLabel = label.split(" · ").at(-1) ?? label;
  return ANALYSIS_LABELS[evidenceLabel] ?? evidenceLabel;
}

function formatPlacement(value: PlacementDecision["placement"]) {
  return value
    .replace("top-", "顶部")
    .replace("bottom-", "底部")
    .replace("left", "左侧")
    .replace("right", "右侧")
    .replace("none", "无安全位置");
}

function HeroDecisionPreview({ demo }: { demo: ScenarioDemo }) {
  const planned = demo.admind.selected;
  const plannedTime = planned?.timeSec ?? demo.scenario.safeOpportunitySec;
  const outcome = demo.admind.outcome === "blocked" ? "本段不投放" : `计划 ${formatTime(plannedTime)}`;

  return (
    <aside className="hero-decision-preview" aria-label="AdMind 实时决策快照">
      <div className="hero-preview-windowbar">
        <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        <b>ADMIND · LIVE DECISION</b>
      </div>
      <div className="hero-preview-stage">
        <video aria-hidden="true" autoPlay loop muted playsInline preload="metadata" src={demo.media.src} tabIndex={-1} />
        <span className="hero-preview-signal"><i /> 内容信号已更新</span>
        <span className="hero-preview-plan">{formatTime(plannedTime)}<small>安全窗口</small></span>
      </div>
      <div className="hero-preview-evidence">
        <div><span>模型观察</span><strong>{demo.media.modelFinding}</strong></div>
        <div className="hero-preview-rule"><span>规则决定</span><strong>{outcome}</strong></div>
      </div>
      <span className="hero-preview-chip">证据评分 <b>{asEvidenceScore(demo.media.analysis?.segments[0]?.confidence ?? 0)}</b></span>
    </aside>
  );
}

function DecisionMethod({ analysisRuns, consensus }: { analysisRuns: VideoAnalysis[]; consensus: AnalysisConsensus }) {
  const latestRun = analysisRuns.at(-1) ?? analysisRuns[0];
  const climax = latestRun.candidateBreaks.find((candidate) => Math.abs(candidate.timeSec - 45) <= 1);
  const recovery = latestRun.candidateBreaks.find((candidate) => Math.abs(candidate.timeSec - 85) <= 2);

  return (
    <section className="method-page" id="decision">
      <header className="method-hero">
        <p>ADMIND 如何工作</p>
        <h1>一段视频，如何变成<br />一次投放决定？</h1>
        <span>现成的视频理解 API 负责看懂内容；AdMind 负责把内容信号、播放器事件与商业边界组合成可执行方案。</span>
      </header>

      <section className="method-flow" aria-label="AdMind 系统流程">
        <article>
          <b>01</b><small>输入</small>
          <strong>长视频与广告任务</strong>
          <p>视频文件、广告时长、最晚投放时间和展示形式。</p>
        </article>
        <i>→</i>
        <article className="api">
          <b>02</b><small>视频理解 API</small>
          <strong>看懂场景与节奏</strong>
          <p>识别动作、情绪、人物状态、镜头变化和自然转场。</p>
        </article>
        <i>→</i>
        <article className="engine">
          <b>03</b><small>AdMind 决策层</small>
          <strong>组合信号，逐项筛选</strong>
          <p>先守住体验与伦理边界，再在可用窗口中完成商业目标。</p>
        </article>
        <i>→</i>
        <article className="output">
          <b>04</b><small>输出</small>
          <strong>一份可执行计划</strong>
          <p>什么时候出现、用什么形式、持续多久，或者本次不投放。</p>
        </article>
      </section>

      <section className="method-signals">
        <div className="method-section-heading">
          <p>三层决策信号</p>
          <h2>系统同时看三类信息。</h2>
          <span>不是让一个模型包办所有决定，而是把不同来源的信号放进同一套决策流程。</span>
        </div>
        <div className="method-signal-grid">
          <article>
            <span>内容信号</span><strong>视频里正在发生什么</strong>
            <p>由 TwelveLabs 分析剧情张力、动作、情绪、人物状态和转场位置。</p>
            <div><i />高潮识别<i />情绪变化<i />镜头边界</div>
          </article>
          <article>
            <span>交互信号</span><strong>用户正在怎样观看</strong>
            <p>只读取当前播放器中的暂停、拖动、恢复播放和页面可见性。</p>
            <div><i />稳定暂停<i />进度拖动<i />页面状态</div>
          </article>
          <article>
            <span>约束信号</span><strong>哪些边界不能越过</strong>
            <p>伦理保护优先；随后再检查广告时长、最晚时间和商业任务。</p>
            <div><i />伦理保护<i />完整播放<i />合同时间</div>
          </article>
        </div>
      </section>

      <section className="method-example">
        <div className="method-example-copy">
          <p>真实 API 案例</p>
          <h2>同一段 CHARGE，<br />两次分析得到一致判断。</h2>
          <span>系统没有因为“到了固定时间”就插广告，而是先确认当时处于战斗高潮，再寻找剧情恢复后的窗口。</span>
          <div className="method-example-facts">
            <div><b>{analysisRuns.length} 次</b><span>独立 API 分析</span></div>
            <div><b>{Math.round(consensus.nominal.agreement * 100)}%</b><span>高潮判断一致</span></div>
            <div><b>01:25</b><span>剧情恢复窗口</span></div>
          </div>
        </div>
        <div className="method-timeline-card">
          <div className="method-timeline-head"><span>内容张力时间线</span><b>真实 API 结果</b></div>
          <div className="method-timeline">
            <span className="calm">铺垫</span><span className="rise">张力上升</span><span className="climax">战斗高潮</span><span className="recover">恢复</span>
            <i className="mark-climax"><b>00:45</b><small>不宜打断</small></i>
            <i className="mark-recover"><b>01:25</b><small>可以考虑</small></i>
          </div>
          <div className="method-api-reading">
            <p><span>00:45</span><strong>{climax?.label ?? "战斗高潮"}</strong><b>继续等待</b></p>
            <p><span>01:25</span><strong>{recovery?.label ?? "战斗结束，情绪恢复"}</strong><b>进入计划</b></p>
          </div>
        </div>
      </section>

      <section className="method-stack">
        <div className="method-section-heading">
          <p>技术栈</p>
          <h2>目前这套原型用了什么？</h2>
        </div>
        <div>
          <article><span>前端体验</span><strong>React + TypeScript</strong><p>负责视频播放、方案切换和交互事件采集。</p></article>
          <article><span>视频理解</span><strong>TwelveLabs API</strong><p>上传视频并返回按时间组织的内容理解结果。</p></article>
          <article><span>决策引擎</span><strong>TypeScript 规则层</strong><p>把 AI 结果转换成候选窗口，再按边界逐项筛选。</p></article>
          <article><span>验证方式</span><strong>重复分析 + 自动测试</strong><p>比较多次 API 结果，并检查最终计划是否完整可执行。</p></article>
        </div>
      </section>
    </section>
  );
}

function ScenarioDecisionEvidence({
  decision,
  isProtectedScenario,
  media,
  scenario,
  time,
}: {
  decision: DecisionResponse;
  isProtectedScenario: boolean;
  media: DemoMedia;
  scenario: Scenario;
  time: number;
}) {
  const nearestSignal = scenario.sceneSignals
    .slice()
    .sort((left, right) => Math.abs(left.timeSec - time) - Math.abs(right.timeSec - time))[0];
  const currentSegment = media.analysis?.segments.find((segment) => segment.startSec <= time && time < segment.endSec)
    ?? media.analysis?.segments.find((segment) => segment.endSec === time)
    ?? media.analysis?.segments.at(-1);
  const tensionScore = currentSegment?.narrativeIntensity ?? nearestSignal?.tension ?? 0;
  const interruptionRiskScore = currentSegment?.interruptionRisk ?? nearestSignal?.tension ?? 0;
  const confidenceScore = currentSegment?.confidence ?? nearestSignal?.modelConfidence ?? 0;
  const tension = asPercent(tensionScore);
  const confidence = asPercent(confidenceScore);
  const agreement = asPercent(nearestSignal?.modelAgreement ?? 1);
  const plannedTime = decision.selected?.timeSec ?? scenario.safeOpportunitySec;
  const reachedNominal = time >= scenario.nominalOpportunitySec - 0.25;
  const reachedPlan = decision.outcome === "scheduled" && time >= plannedTime - 0.25;
  const phase = isProtectedScenario
    ? "伦理保护中"
    : reachedPlan
      ? "低打断窗口"
      : reachedNominal
        ? "继续等待"
        : "持续观察";
  const finalTitle = isProtectedScenario
    ? "硬规则拦截：本片不投放"
    : decision.outcome === "blocked"
      ? "窗口内不强行插播"
      : reachedPlan
        ? `执行 ${formatTime(plannedTime)} · ${decision.selected?.format === "muted_card" ? "静音卡片" : "完整广告"}`
        : reachedNominal
          ? `拒绝原定点，等待 ${formatTime(plannedTime)}`
          : "尚未进入商业投放窗口";

  return (
    <section className={`pause-evidence scenario-evidence ${isProtectedScenario ? "protected" : "content"}`} aria-live="polite">
      <div className="pause-evidence-heading">
        <div>
          <span>{isProtectedScenario ? "实时伦理信号" : "实时内容信号"}</span>
          <strong>{isProtectedScenario ? "这一刻，为什么不能插播？" : "这一刻，适合打断吗？"}</strong>
        </div>
        <b className={`pause-phase ${isProtectedScenario ? "protected" : reachedPlan ? "delivered" : "analyzing"}`}>{phase}</b>
      </div>
      <div className="pause-signal-grid">
        <article><span>当前播放位置</span><strong>{formatTime(time)}</strong><small>原定广告点 {formatTime(scenario.nominalOpportunitySec)}</small></article>
        <article><span>当前分析片段</span><strong>{localizeAnalysisLabel(currentSegment?.label ?? nearestSignal?.label ?? "等待内容信号")}</strong><small>{currentSegment ? `${formatTime(currentSegment.startSec)}–${formatTime(currentSegment.endSec)}` : `证据时间 ${formatTime(nearestSignal?.timeSec ?? 0)}`}</small></article>
        <article><span>{isProtectedScenario ? "伦理上下文" : "片段张力评分"}</span><strong>{isProtectedScenario ? nearestSignal?.protectedContext ? "受保护" : "待确认" : `${asTenPoint(tensionScore)} / 10`}</strong><small>{isProtectedScenario ? `${media.category} · 内容风险 ${asTenPoint(interruptionRiskScore)} / 10` : `片段级评分，不是逐帧测量`}</small></article>
        <article><span>分析可信度</span><strong>{asEvidenceScore(confidenceScore)}</strong><small>模型证据评分，非统计学置信区间</small></article>
      </div>
      <div className="pause-placement-result">
        <div>
          <span>当前决策</span>
          <strong>{finalTitle}</strong>
          <p>{isProtectedScenario
            ? "视频理解负责识别救援、医疗或灾后语境；伦理硬规则负责最终阻止投放，竞价不能覆盖这条边界。"
            : "模型先判断原定点的内容张力，再在合同允许的延后范围中寻找恢复、转场或片尾窗口。"}</p>
        </div>
        <div className="pause-risk-bars">
          <p><span>{isProtectedScenario ? "内容风险" : "当前张力"}</span><i><b style={{ width: `${tension}%` }} /></i><strong>{tension}%</strong></p>
          <p><span>{isProtectedScenario ? "伦理优先级" : "模型置信"}</span><i><b style={{ width: `${isProtectedScenario ? 100 : confidence}%` }} /></i><strong>{isProtectedScenario ? 100 : confidence}%</strong></p>
        </div>
      </div>
      <p className="scenario-evidence-foot">{isProtectedScenario
        ? `${media.category}已由素材来源与视频分析共同确认；伦理规则在整段内容中保持优先，不在片内补量。`
        : `${media.modelFinding} · 多次分析一致度 ${agreement}%，已拒绝 ${decision.rejectedCount} 个不合格候选。`}</p>
    </section>
  );
}

function ScenarioExperience({ demo, first }: { demo: ScenarioDemo; first: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggeredRef = useRef<Record<Strategy, boolean>>({ baseline: false, admind: false });
  const resumeAfterAdRef = useRef(false);
  const seekingRef = useRef(false);
  const scrubbingRef = useRef(false);
  const pauseObservationRef = useRef(0);
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const [strategy, setStrategy] = useState<Strategy>("baseline");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [adRemaining, setAdRemaining] = useState<number | null>(null);
  const [pausePending, setPausePending] = useState(false);
  const [pauseStartedAt, setPauseStartedAt] = useState<number | null>(null);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [pageFocused, setPageFocused] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [seekCount, setSeekCount] = useState(0);
  const [pausePhase, setPausePhase] = useState<"idle" | "observing" | "analyzing" | "delivered" | "deferred">("idle");
  const [deferredReason, setDeferredReason] = useState("");
  const [faceEvidence, setFaceEvidence] = useState<FaceDetectionEvidence | null>(null);
  const [placementDecision, setPlacementDecision] = useState<PlacementDecision>(() => choosePauseAdPlacement([]));
  const [variantIndex, setVariantIndex] = useState(0);
  const [silentPlayback] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("silent") === "1",
  );
  const [mediaReady, setMediaReady] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [adResult, setAdResult] = useState<"idle" | "shown" | "completed" | "skipped">("idle");

  const variants: ScenarioDemoVariant[] = [demo, ...(demo.alternatives ?? [])];
  const activeDemo = variants[variantIndex] ?? variants[0];
  const { scenario, baseline, admind, media } = activeDemo;
  const isPauseScenario = scenario.id === "S2";
  const isProtectedScenario = scenario.id === "S3";
  const decision = strategy === "baseline" ? baseline : admind;
  const selected = decision.selected;
  const adActive = adRemaining !== null;
  const decisionTime = selected?.timeSec ?? scenario.nominalOpportunitySec;
  const blockedNoticeActive = strategy === "admind"
    && decision.outcome === "blocked"
    && time >= scenario.nominalOpportunitySec - 0.5;

  const stopPauseObservation = (reason?: string) => {
    pauseObservationRef.current += 1;
    setPausePending(false);
    setPauseStartedAt(null);
    setPauseSeconds(0);
    setAdRemaining(null);
    setFaceEvidence(null);
    setPlacementDecision(choosePauseAdPlacement([]));
    setAdResult("idle");
    if (reason) {
      setPausePhase("deferred");
      setDeferredReason(reason);
    } else {
      setPausePhase("idle");
      setDeferredReason("");
    }
  };

  const startPauseObservation = () => {
    pauseObservationRef.current += 1;
    setPausePending(true);
    setPauseStartedAt(performance.now());
    setPauseSeconds(0);
    setPausePhase("observing");
    setAdResult("idle");
    setDeferredReason("");
    setFaceEvidence(null);
    setPlacementDecision(choosePauseAdPlacement([]));
  };

  const resetPlayback = () => {
    const video = videoRef.current;
    video?.pause();
    if (video) video.currentTime = 0;
    triggeredRef.current = { baseline: false, admind: false };
    resumeAfterAdRef.current = false;
    setAdRemaining(null);
    setPausePending(false);
    setPauseStartedAt(null);
    setPauseSeconds(0);
    setPausePhase("idle");
    setAdResult("idle");
    setSeeking(false);
    setSeekCount(0);
    setDeferredReason("");
    setFaceEvidence(null);
    setPlacementDecision(choosePauseAdPlacement([]));
    setPlaying(false);
    setTime(0);
    setVolumeOpen(false);
    seekingRef.current = false;
    scrubbingRef.current = false;
  };

  const switchVariant = (nextIndex: number) => {
    resetPlayback();
    setMediaReady(false);
    setVariantIndex(nextIndex);
  };

  useEffect(() => {
    if (adRemaining === null) return;
    if (isPauseScenario && strategy === "admind") return;
    const timer = window.setTimeout(() => {
      if (adRemaining > 1) {
        setAdRemaining(adRemaining - 1);
        return;
      }
      setAdRemaining(null);
      if (selected?.format === "fullscreen" && resumeAfterAdRef.current) {
        void videoRef.current?.play();
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [adRemaining, isPauseScenario, selected?.format, strategy]);

  useEffect(() => {
    if (!isPauseScenario || !pausePending || strategy !== "admind" || !selected) return;
    const observationId = pauseObservationRef.current;
    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video?.paused || document.visibilityState !== "visible" || !document.hasFocus() || seekingRef.current) {
        stopPauseObservation("暂停未稳定，广告任务已进入待交付队列。");
        return;
      }
      setPausePhase("analyzing");
      void detectFacesInPausedFrame(video).then((evidence) => {
        if (pauseObservationRef.current !== observationId || !video.paused) return;
        const nextPlacement = choosePauseAdPlacement([...evidence.faces, ...evidence.subjects]);
        setFaceEvidence(evidence);
        setPlacementDecision(nextPlacement);
        setPausePending(false);
        if (nextPlacement.placement === "none") {
          setPauseStartedAt(null);
          setPausePhase("deferred");
          setDeferredReason("当前画面没有安全位置，广告任务已顺延。");
          return;
        }
        triggeredRef.current[strategy] = true;
        setAdRemaining(selected.durationSec);
        setPausePhase("delivered");
        setAdResult("shown");
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isPauseScenario, pausePending, selected, strategy]);

  useEffect(() => {
    if (!isPauseScenario) return;
    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      setPageVisible(visible);
      if (!visible && pausePending) stopPauseObservation("页面已隐藏，本次广告取消并顺延。");
    };
    const handleFocus = () => setPageFocused(true);
    const handleBlur = () => {
      setPageFocused(false);
      if (pausePending) stopPauseObservation("窗口失去焦点，本次广告暂停并顺延。");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isPauseScenario, pausePending]);

  useEffect(() => {
    if (!isPauseScenario || pauseStartedAt === null) return;
    const update = () => setPauseSeconds((performance.now() - pauseStartedAt) / 1000);
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [isPauseScenario, pauseStartedAt]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = silentPlayback || volume === 0;
  }, [media.id, silentPlayback, volume]);

  useEffect(() => {
    if (!volumeOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !volumeControlRef.current?.contains(target)) setVolumeOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVolumeOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [volumeOpen]);

  const updateVolume = (nextVolume: number) => {
    const boundedVolume = Math.max(0, Math.min(1, nextVolume));
    setVolume(boundedVolume);
  };

  const finishDeliveredAd = (result: "completed" | "skipped") => {
    setAdRemaining(null);
    setPausePending(false);
    setPauseStartedAt(null);
    setPausePhase("delivered");
    setDeferredReason("");
    setAdResult(result);
  };

  const dismissAd = () => {
    if (isPauseScenario && strategy === "admind" && pausePhase === "delivered") {
      finishDeliveredAd("skipped");
      return;
    }
    setAdRemaining(null);
    if (selected?.format === "fullscreen" && resumeAfterAdRef.current) {
      resumeAfterAdRef.current = false;
      void videoRef.current?.play();
    }
  };

  const switchStrategy = (nextStrategy: Strategy) => {
    resetPlayback();
    setStrategy(nextStrategy);
  };

  const jumpToDecision = () => {
    const video = videoRef.current;
    if (!video || !mediaReady) return;
    triggeredRef.current[strategy] = false;
    stopPauseObservation();

    const run = () => {
      if (isPauseScenario && selected) {
        if (strategy === "admind") {
          video.addEventListener("seeked", startPauseObservation, { once: true });
        }
        video.currentTime = selected.timeSec;
        setTime(selected.timeSec);
        video.pause();
        if (strategy === "baseline") {
          triggeredRef.current[strategy] = true;
          setAdRemaining(selected.durationSec);
        }
        return;
      }

      const previewTime = Math.max(0, decisionTime - 2.5);
      video.currentTime = previewTime;
      setTime(previewTime);
      void video.play();
    };

    if (video.readyState >= 1) {
      run();
      return;
    }

    video.addEventListener("loadedmetadata", run, { once: true });
    video.load();
    if (!isPauseScenario) void video.play();
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || !mediaReady || (adActive && selected?.format === "fullscreen")) return;
    if (video.paused) {
      if (isPauseScenario && adActive && pausePhase === "delivered") finishDeliveredAd("completed");
      else if (isPauseScenario && pausePending) stopPauseObservation("暂停时间不足，广告任务已顺延到下一次稳定机会。");
      else stopPauseObservation();
      void video.play();
    }
    else video.pause();
  };

  const seek = (nextTime: number) => {
    const video = videoRef.current;
    if (!video || !mediaReady) return;
    const knownDuration = Number.isFinite(video.duration) ? video.duration : scenario.durationSec;
    const boundedTime = Math.min(Math.max(0, nextTime), knownDuration);
    video.currentTime = boundedTime;
    setTime(boundedTime);
    if (isPauseScenario && pausePending) {
      stopPauseObservation("用户拖动了进度，本次广告取消并顺延。");
    } else if (isPauseScenario && adActive && pausePhase === "delivered") {
      finishDeliveredAd("completed");
    } else {
      setAdRemaining(null);
      setPausePending(false);
    }
    triggeredRef.current[strategy] = false;
  };

  const syncPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    setTime(current);
    if (scrubbingRef.current || seekingRef.current || isPauseScenario || !selected || triggeredRef.current[strategy] || current < selected.timeSec) return;

    triggeredRef.current[strategy] = true;
    setAdRemaining(selected.durationSec);
    if (selected.format === "fullscreen") {
      resumeAfterAdRef.current = !video.paused;
      video.pause();
    }
  };

  const handlePause = () => {
    setPlaying(false);
    const video = videoRef.current;
    if (!isPauseScenario || !video || video.currentTime < 1 || !selected || seekingRef.current) return;
    if (strategy === "baseline") {
      triggeredRef.current[strategy] = true;
      setAdRemaining(selected.durationSec);
    } else {
      startPauseObservation();
    }
  };

  const handlePlay = () => {
    setPlaying(true);
    if (isPauseScenario && pausePending) stopPauseObservation("暂停时间不足，广告任务已顺延到下一次稳定机会。");
    else if (isPauseScenario && adActive && pausePhase === "delivered") finishDeliveredAd("completed");
  };

  const beginScrub = () => {
    if (scrubbingRef.current) return;
    scrubbingRef.current = true;
    if (isPauseScenario) setSeekCount((count) => count + 1);
  };

  const finishScrub = () => {
    scrubbingRef.current = false;
    syncPlayback();
  };

  const placementClass = placementDecision.placement === "none" ? "" : `placement-${placementDecision.placement}`;
  const showPauseEvidence = isPauseScenario && strategy === "admind";
  const showAdMindEvidence = strategy === "admind";
  const pauseAdFullscreen = isPauseScenario && strategy === "admind" && pauseSeconds >= 8;
  const fullscreenAd = selected?.format === "fullscreen" || pauseAdFullscreen;
  const volumeLevel = volume === 0 ? "muted" : volume < 0.45 ? "low" : "high";
  const riskRows = placementDecision.assessments.length > 1
    ? [placementDecision.assessments[0], placementDecision.assessments.at(-1)!]
    : placementDecision.assessments;

  return (
    <section className={first ? "showcase-demo" : "showcase-demo showcase-demo-following"} id={`scenario-${scenario.id.toLowerCase()}`}>
      <div className="showcase-section-heading">
        <div>
          <h2>{isPauseScenario ? "保留用户的查看任务。" : isProtectedScenario ? "有些边界，价格不能越过。" : "只改变投放决策。"}</h2>
          <p className="showcase-scene-summary">{isPauseScenario
            ? "暂停后，系统判断是否展示广告，并避开用户正在查看的主体内容。"
            : isProtectedScenario
                ? "救援、医疗与灾后内容始终优先保护，系统不插入广告。"
              : "比较固定插播与 AdMind 的低打断投放。"}</p>
        </div>
      </div>

      {variants.length > 1 ? (
        <div className={`showcase-material-switcher ${isPauseScenario ? "pause-material-switcher" : ""}`} role="group" aria-label="切换分析素材">
          {variants.map((variant, index) => (
            <button
              aria-label={variant.media.category}
              aria-pressed={variantIndex === index}
              className={variantIndex === index ? "active" : ""}
              key={variant.media.id}
              onClick={() => switchVariant(index)}
            >
              <span>{variant.media.category}</span>
            </button>
          ))}
        </div>
      ) : null}

      <article className={`showcase-player-card ${showAdMindEvidence ? "signal-player-card signal-detail-open pause-detail-open" : ""}`}>
        <div className="showcase-player-meta">
          <div className="showcase-status-copy">
            <span className={strategy === "baseline" ? "showcase-state baseline" : "showcase-state smart"} />
            <div>
              <strong>{isPauseScenario
                ? strategy === "baseline" ? "传统暂停广告：立即全屏覆盖" : "AdMind：判断交互状态，保留画面"
                : strategy === "baseline"
                  ? "传统投放：固定时间触发"
                  : decision.outcome === "blocked"
                    ? isProtectedScenario ? "AdMind：伦理规则阻止投放" : "AdMind：窗口内不投放"
                    : selected?.format === "muted_card" ? "AdMind：延后并降低遮挡" : "AdMind：等待自然转场"}</strong>
              <small>{isPauseScenario && strategy === "admind" && pausePhase === "observing"
                ? "正在确认稳定暂停；恢复播放、拖动或离开页面都会取消…"
                : isPauseScenario && strategy === "admind" && pausePhase === "analyzing"
                  ? "正在用本地 MediaPipe 分析当前暂停帧…"
                  : isPauseScenario && strategy === "admind" && pausePhase === "deferred"
                    ? deferredReason
                : isProtectedScenario && strategy === "baseline"
                  ? `${formatTime(scenario.nominalOpportunitySec)} 到点即播，不读取伦理信号`
                  : media.modelFinding}</small>
            </div>
          </div>
          <div className="showcase-player-actions">
            {isPauseScenario ? (
              <span className="pause-interaction-hint">点击画面暂停，体验实时判断</span>
            ) : (
              <button disabled={!mediaReady} onClick={jumpToDecision}>{mediaReady
                ? isProtectedScenario
                    ? "查看规则触发点"
                    : "查看广告投放点"
                : "正在加载视频…"}</button>
            )}
            <div className="showcase-toggle player-strategy-toggle" role="group" aria-label={`${isPauseScenario ? "暂停状态" : isProtectedScenario ? "敏感场景" : "高潮插播"}投放策略`}>
              <button aria-pressed={strategy === "baseline"} className={strategy === "baseline" ? "active" : ""} onClick={() => switchStrategy("baseline")}>传统投放</button>
              <button aria-pressed={strategy === "admind"} className={strategy === "admind" ? "active" : ""} onClick={() => switchStrategy("admind")}><SparkIcon />AdMind</button>
            </div>
          </div>
        </div>

        <div className="video-stage showcase-video-stage">
          <video
            className="content-video"
            onEnded={() => setPlaying(false)}
            onClick={togglePlayback}
            key={media.id}
            onCanPlay={() => setMediaReady(true)}
            onError={() => setMediaReady(false)}
            onLoadedMetadata={() => setMediaReady(true)}
            onPause={handlePause}
            onPlay={handlePlay}
            onSeeking={() => {
              seekingRef.current = true;
              setSeeking(true);
              if (isPauseScenario && pausePending) stopPauseObservation("用户正在拖动进度，广告任务已顺延。");
            }}
            onSeeked={() => {
              seekingRef.current = false;
              setSeeking(false);
              if (!scrubbingRef.current) syncPlayback();
            }}
            onTimeUpdate={syncPlayback}
            muted={silentPlayback || volume === 0}
            playsInline
            preload="metadata"
            ref={videoRef}
            src={media.src}
          >
            <track default kind="captions" label="字幕" src={media.captionsSrc ?? "/empty.vtt"} srcLang={media.captionsSrc ? "zh" : "zxx"} />
          </video>

          <div className="video-topline showcase-video-topline">
            <span>{isPauseScenario
              ? "暂停 · 拖动 · 页面可见性"
              : strategy === "baseline"
                ? `${formatTime(scenario.nominalOpportunitySec)} 固定投放`
                : decision.outcome === "blocked"
                  ? isProtectedScenario ? "受保护内容中禁止投放" : "未找到安全窗口"
                  : `${formatTime(selected?.timeSec ?? scenario.safeOpportunitySec)} AI 计划`}</span>
          </div>

          {isPauseScenario && strategy === "admind" && faceEvidence?.status === "ready" && pauseSeconds < 3.3 ? faceEvidence.faces.map((face, index) => (
            <span
              aria-hidden="true"
              className="pause-face-box"
              key={`${face.x}-${face.y}-${index}`}
              style={{
                left: `${face.x * 100}%`,
                top: `${face.y * 100}%`,
                width: `${face.width * 100}%`,
                height: `${face.height * 100}%`,
              }}
            />
          )) : null}

          {isPauseScenario && strategy === "admind" && faceEvidence?.status === "ready" && pauseSeconds < 3.3 ? faceEvidence.subjects.map((subject, index) => (
            <span
              aria-hidden="true"
              className="pause-subject-box"
              data-label={subject.label}
              key={`${subject.x}-${subject.y}-${index}`}
              style={{
                left: `${subject.x * 100}%`,
                top: `${subject.y * 100}%`,
                width: `${subject.width * 100}%`,
                height: `${subject.height * 100}%`,
              }}
            />
          )) : null}

          {isPauseScenario && strategy === "admind" && adActive && placementDecision.placement !== "none" ? (
            <span
              aria-hidden="true"
              className={`pause-placement-outline ${placementClass}`}
            />
          ) : null}

          {adActive && selected ? (
            <div className={`${fullscreenAd ? "ad-overlay fullscreen real-ad" : "ad-overlay card real-ad-card"} ${isPauseScenario && strategy === "admind" && !pauseAdFullscreen ? placementClass : ""} ${pauseAdFullscreen ? "pause-fullscreen" : ""}`}>
              <AdCreative
                fullscreen={fullscreenAd}
                onDismiss={dismissAd}
                remaining={adRemaining}
                scenarioId={scenario.id}
              />
            </div>
          ) : null}

          {blockedNoticeActive ? (
            <div className="showcase-protection-note"><ShieldIcon /><div>
              <strong>{isProtectedScenario ? "广告已阻止" : "本段不投放"}</strong>
              <span>{isProtectedScenario
                ? `${media.category}处于受保护区间；高价保量活动不得越过伦理边界。`
                : "允许的延后范围内没有低打断窗口；系统记录交付缺口。"}</span>
            </div></div>
          ) : null}

          <div className="video-controls showcase-controls">
            <button aria-label={playing ? "暂停" : "播放"} onClick={togglePlayback}>
              {playing ? <span className="pause-icon">Ⅱ</span> : <PlayIcon />}
            </button>
            <span>{formatTime(time)}</span>
            <input
              className="video-progress"
              aria-label="视频进度"
              disabled={!mediaReady}
              max={scenario.durationSec}
              min={0}
              onInput={(event) => seek(Number(event.currentTarget.value))}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) beginScrub();
              }}
              onKeyUp={finishScrub}
              onPointerCancel={finishScrub}
              onPointerDown={beginScrub}
              onPointerUp={finishScrub}
              step="0.1"
              type="range"
              value={time}
            />
            <div className={`volume-control ${volumeOpen ? "open" : ""}`} ref={volumeControlRef}>
              <button
                aria-expanded={volumeOpen}
                aria-label={volumeOpen ? "收起音量调节" : "打开音量调节"}
                className="volume-toggle"
                onClick={() => setVolumeOpen((open) => !open)}
                type="button"
              >
                <VolumeIcon level={volumeLevel} />
              </button>
              <div className="volume-popover" hidden={!volumeOpen}>
                <input
                  aria-label={`视频音量 ${Math.round(volume * 100)}%`}
                  className="volume-slider"
                  max="1"
                  min="0"
                  onInput={(event) => updateVolume(Number(event.currentTarget.value))}
                  step="0.01"
                  style={{ "--volume-level": `${volume * 100}%` } as CSSProperties}
                  type="range"
                  value={volume}
                />
              </div>
            </div>
            <span>{formatTime(scenario.durationSec)}</span>
            <span className="showcase-quality">{media.quality ?? "720p"}</span>
          </div>
        </div>

        {showPauseEvidence ? (
          <section className="pause-evidence" aria-live="polite">
            <div className="pause-evidence-heading">
              <div>
                <span>实时播放器信号</span>
                <strong>这一次暂停，系统实际看到了什么？</strong>
              </div>
              <b className={`pause-phase ${pausePhase}`}>{pausePhase === "observing" ? "确认暂停"
                  : pausePhase === "analyzing" ? "分析画面"
                    : pausePhase === "delivered" ? adResult === "skipped" ? "广告已关闭" : "已安全展示"
                      : pausePhase === "deferred" ? "已顺延"
                        : "等待暂停"}</b>
            </div>
            <div className="pause-signal-grid">
              <article><span>暂停时长</span><strong>{pauseStartedAt === null ? "—" : `${pauseSeconds.toFixed(1)} 秒`}</strong><small>{pauseSeconds >= 1.5 ? "已达到稳定阈值" : "1.5 秒后才进入视觉判断"}</small></article>
              <article><span>播放器动作</span><strong>{seeking ? "正在拖动" : playing ? "播放中" : "已暂停"}</strong><small>本次会话已拖动 {seekCount} 次</small></article>
              <article><span>页面状态</span><strong>{pageVisible ? pageFocused ? "可见且有焦点" : "可见但失焦" : "页面已隐藏"}</strong><small>hidden 取消；visible + blur 暂缓</small></article>
              <article><span>当前帧视觉</span><strong>{faceEvidence?.status === "ready" ? `${faceEvidence.faces.length + faceEvidence.subjects.length} 个避让目标` : faceEvidence?.status === "unavailable" ? "模型回退" : "尚未分析"}</strong><small>{faceEvidence?.status === "ready" ? `人脸 ${faceEvidence.faces.length} · 主体 ${faceEvidence.subjects.length} · ${faceEvidence.inferenceMs} ms` : "只在稳定暂停后运行一次"}</small></article>
            </div>
            <div className="pause-placement-result">
              <div>
                <span>最终决定</span>
                <strong>{pausePhase === "deferred" ? "这次不投，进入待交付队列"
                    : pausePhase === "delivered" ? adResult === "skipped" ? "广告已展示，现已关闭"
                      : adResult === "completed" ? "广告已展示，任务已完成"
                        : `${pauseAdFullscreen ? "全屏广告" : `${formatPlacement(placementDecision.placement)} · 静音小卡片`}`
                      : "等待有效暂停信号"}</strong>
                <p>{pausePhase === "deferred" ? deferredReason
                  : adResult === "skipped" ? "本次已经产生展示记录；用户主动关闭后，不再进入待交付队列。"
                    : adResult === "completed" ? "本次广告任务已经完成，不会因截图、失焦或继续播放而重新顺延。"
                      : pauseAdFullscreen ? "稳定暂停已超过 8 秒：完成一次完整曝光；恢复播放会立即关闭广告。" : placementDecision.reason}</p>
              </div>
              <div className="pause-risk-bars">
                {riskRows.map((assessment, index) => (
                  <p key={assessment.placement}>
                    <span>{index === 0 ? "推荐位置" : "风险最高"}：{formatPlacement(assessment.placement)}</span>
                    <i><b style={{ width: `${Math.round(assessment.risk * 100)}%` }} /></i>
                    <strong>{Math.round(assessment.risk * 100)}%</strong>
                  </p>
                ))}
              </div>
            </div>
          </section>
        ) : showAdMindEvidence ? (
          <ScenarioDecisionEvidence
            decision={decision}
            isProtectedScenario={isProtectedScenario}
            media={media}
            scenario={scenario}
            time={time}
          />
        ) : isPauseScenario ? (
          <div className="pause-compact-note">
            <strong>{strategy === "baseline" ? "传统模式：不参与判断" : "基础暂停素材：保留播放器画面"}</strong>
            <span>{strategy === "baseline" ? "一旦暂停便直接全屏展示广告，不读取拖动、页面状态或画面主体。" : "切换到“复杂角色画面”可查看完整的实时信号与避让过程。"}</span>
          </div>
        ) : null}

        {showPauseEvidence && pausePhase === "deferred" ? (
          <div className="pause-queue-note">
            <strong>广告任务已顺延</strong>
            <span>等待下一次稳定暂停；仍无安全位置，再交给 S1 的低打断窗口。S3 保护场景绝不补量。</span>
          </div>
        ) : null}

      </article>
    </section>
  );
}

const storyStepCopy = [
  {
    eyebrow: "01 · 剧情高点",
    title: "避开剧情高点。",
    description: "广告延后到低打断窗口。",
    nav: "剧情高点",
  },
  {
    eyebrow: "02 · 用户暂停",
    title: "暂停，也要保护画面。",
    description: "系统判断停留、焦点与主体位置。",
    nav: "用户暂停",
  },
  {
    eyebrow: "03 · 伦理边界",
    title: "敏感内容，不插广告。",
    description: "伦理规则直接覆盖商业投放。",
    nav: "伦理边界",
  },
];

function NarrativeJourney({ scenarios }: { scenarios: ScenarioDemo[] }) {
  const [activeId, setActiveId] = useState(scenarios[0]?.scenario.id ?? "");

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".attio-story-chapter[data-scenario-id]"));
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (mostVisible) {
        const scenarioId = (mostVisible.target as HTMLElement).dataset.scenarioId;
        if (scenarioId) setActiveId(scenarioId);
      }
    }, { rootMargin: "-24% 0px -46%", threshold: [0.1, 0.35, 0.65] });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [scenarios]);

  const goToScenario = (id: string) => {
    document.getElementById(`story-${id.toLowerCase()}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="attio-story" id="demo" aria-label="AdMind 产品演示">
      <div className="attio-story-layout">
        <nav className="attio-story-nav" aria-label="AdMind 三段决策旅程">
          <div className="attio-story-progress" aria-hidden="true"><i style={{ height: `${Math.max(34, (scenarios.findIndex((demo) => demo.scenario.id === activeId) + 1) * 33)}%` }} /></div>
          {scenarios.map((demo, index) => {
            const copy = storyStepCopy[index] ?? storyStepCopy.at(-1)!;
            const active = demo.scenario.id === activeId;
            return (
              <button aria-current={active ? "location" : undefined} className={active ? "active" : ""} key={demo.scenario.id} onClick={() => goToScenario(demo.scenario.id)}>
                <b>0{index + 1}</b>
                <span>{copy.nav}</span>
                <small>{active ? "正在演示" : "跳转查看"}</small>
              </button>
            );
          })}
        </nav>
        <div className="attio-story-stage">
          {scenarios.map((demo, index) => {
            const copy = storyStepCopy[index] ?? storyStepCopy.at(-1)!;
            return (
              <div className="attio-story-chapter" data-scenario-id={demo.scenario.id} id={`story-${demo.scenario.id.toLowerCase()}`} key={demo.scenario.id}>
                <div className="attio-story-copy">
                  <p>{copy.eyebrow}</p>
                  <h3>{copy.title}</h3>
                  <span>{copy.description}</span>
                </div>
                <ScenarioExperience demo={demo} first={index === 0} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ShowcaseDemo({ scenarios, analysisRuns, consensus }: ShowcaseDemoProps) {
  const [view, setView] = useState<"demo" | "decision">("demo");
  const [locale, setLocale] = useState<UiLocale>(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem("admind-locale") === "zh" ? "zh" : "en";
  });
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    document.title = locale === "en"
      ? "AdMind — Explainable AI decisions for less disruptive video ads"
      : "AdMind — 广告必须出现，也不必毁掉剧情";
    window.localStorage.setItem("admind-locale", locale);
    return observeUiLocalization(pageRef.current, locale);
  }, [locale]);

  useEffect(() => {
    const syncView = () => setView(window.location.hash === "#decision" ? "decision" : "demo");
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);

  const switchView = (nextView: "demo" | "decision") => {
    document.querySelectorAll("video").forEach((video) => video.pause());
    setView(nextView);
    window.history.replaceState(null, "", nextView === "demo" ? "#demo" : "#decision");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="showcase-page" data-locale={locale} ref={pageRef}>
      <header className="showcase-nav">
        <button className="showcase-brand" onClick={() => switchView("demo")} aria-label="AdMind 首页">
          <span className="showcase-brand-mark"><SparkIcon /></span>
          <strong>AdMind</strong>
        </button>
        <div className="showcase-nav-actions">
          <nav aria-label="页面切换">
            <button aria-current={view === "demo" ? "page" : undefined} className={view === "demo" ? "active" : ""} onClick={() => switchView("demo")}>体验演示</button>
            <button aria-current={view === "decision" ? "page" : undefined} className={view === "decision" ? "active" : ""} onClick={() => switchView("decision")}>决策方式</button>
          </nav>
          <div className="language-toggle" aria-label="Language / 语言" role="group">
            <button aria-pressed={locale === "en"} className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button>
            <button aria-pressed={locale === "zh"} className={locale === "zh" ? "active" : ""} onClick={() => setLocale("zh")}>中</button>
          </div>
        </div>
      </header>

      <main id="top">
        <div hidden={view !== "demo"}>
            <section className="showcase-hero">
              <div className="showcase-hero-grid">
                <div className="showcase-hero-copy">
                  <p className="showcase-kicker"><i /> AI 广告决策引擎</p>
                  <h1>广告必须出现，<br />也不必<span>毁掉剧情。</span></h1>
                  <p className="showcase-lead">AdMind 理解内容与用户动作，在商业约束下决定广告何时出现、以什么形式出现，以及何时不该出现。</p>
                  <div className="showcase-actions">
                    <a className="showcase-primary" href={scenarios[0] ? `#story-${scenarios[0].scenario.id.toLowerCase()}` : "#demo"}>开始体验 <ChevronIcon /></a>
                    <button className="showcase-secondary" onClick={() => switchView("decision")}>查看决策方式 <ChevronIcon /></button>
                  </div>
                  <div className="showcase-hero-facts" aria-label="AdMind 三类决策能力">
                    <div><b>S1</b><span>避开剧情高点</span></div>
                    <div><b>S2</b><span>保护暂停时刻</span></div>
                    <div><b>S3</b><span>伦理优先拦截</span></div>
                  </div>
                </div>
                <HeroDecisionPreview demo={scenarios[0]} />
              </div>
              <div className="hero-bubble-cluster" aria-hidden="true">
                <span /><span /><span /><span />
              </div>
            </section>

            <NarrativeJourney scenarios={scenarios} />
        </div>
        <div hidden={view !== "decision"}>
          <DecisionMethod analysisRuns={analysisRuns} consensus={consensus} />
        </div>
      </main>

      <footer className="showcase-footer">
        <strong>AdMind</strong>
        <p>视频素材：《CHARGE》《Coffee Run》© Blender Foundation / Blender Studio（CC BY 4.0）；《Caminandes: Llamigos》© Blender（CC BY 3.0）；美国政府视觉素材为 Public Domain，其出现不构成对 AdMind 的认可。广告画面为项目自有演示素材。</p>
      </footer>
    </div>
  );
}
