"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisConsensus, DecisionResponse, Scenario, Strategy, VideoAnalysis } from "@admind/contracts";
import { ChevronIcon, PlayIcon, ShieldIcon, SparkIcon } from "./icons";
import { AdCreative } from "./AdCreative";

export type ScenarioDemo = {
  scenario: Scenario;
  baseline: DecisionResponse;
  admind: DecisionResponse;
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

function DecisionProof({
  demo,
  first,
  analysisRuns,
  consensus,
}: {
  demo: ScenarioDemo;
  first: boolean;
  analysisRuns: VideoAnalysis[];
  consensus: AnalysisConsensus;
}) {
  const { scenario, admind } = demo;
  const isPauseScenario = scenario.id === "S2";
  const isEthicsScenario = scenario.id === "S3";
  const selected = admind.selected;
  const badge = isPauseScenario ? "本页播放器事件" : isEthicsScenario ? "伦理规则样例" : "真实 API 证据";
  const observationTitle = isPauseScenario
    ? "稳定暂停持续 2 秒"
    : isEthicsScenario
      ? "角色受伤，冲突仍在继续"
      : "00:45 两次都判为 BLOCK";
  const observationBody = isPauseScenario
    ? "页面可见、没有拖动进度，也没有立即恢复播放。"
    : isEthicsScenario
      ? "当前示例命中受伤情境；后续会用纪录片与医疗场景补充真实素材。"
      : `战斗高潮 · 置信度 ${consensus.nominal.confidenceMin.toFixed(2)} · 一致度 ${Math.round(consensus.nominal.agreement * 100)}%。`;
  const ruleTitle = isPauseScenario
    ? "只读取当前播放器状态"
    : isEthicsScenario
      ? "伦理保护先于商业竞价"
      : "先避开高潮，再校验完整时长";
  const ruleBody = isPauseScenario
    ? "不读取其他应用；拖动、切到后台或恢复播放都会取消广告。"
    : isEthicsScenario
      ? "PROTECTED_CONTEXT 优先于 180 CPM，高价不能覆盖保护规则。"
      : "合同最晚只能延至 01:25；6 秒素材会超过 89.5 秒片尾。";
  const decisionTitle = isPauseScenario
    ? "右上角静音卡片"
    : isEthicsScenario
      ? "BLOCK"
      : `${formatTime(selected?.timeSec ?? scenario.safeOpportunitySec)} + ${selected?.durationSec ?? 0} 秒`;
  const decisionBody = isPauseScenario
    ? "保留画面和播放控件；用户继续播放时立即消失。"
    : isEthicsScenario
      ? "本次不投放，记录交付缺口，等待后续合规窗口补偿。"
      : "保量活动继续执行，但只使用能够在片尾前完整播完的静音版本。";

  return (
    <section className="showcase-proof" id={first ? "decision" : undefined}>
      <div className="showcase-proof-heading">
        <div><span>ADMIND DECISION</span><h3>这次决定，三步看懂。</h3></div>
        <b>{badge}</b>
      </div>
      <div className="showcase-proof-chain">
        <article className="observe"><span>01 · 系统观察</span><strong>{observationTitle}</strong><p>{observationBody}</p></article>
        <i>→</i>
        <article className="rule"><span>02 · 边界判断</span><strong>{ruleTitle}</strong><p>{ruleBody}</p></article>
        <i>→</i>
        <article className="decide"><span>03 · 最终决定</span><strong>{decisionTitle}</strong><p>{decisionBody}</p></article>
      </div>
      <details className="showcase-proof-details">
        <summary>展开技术证据</summary>
        {!isPauseScenario && !isEthicsScenario ? (
          <div className="showcase-proof-runs">
            {analysisRuns.map((run, index) => {
              const nominal = run.candidateBreaks.find((candidate) => Math.abs(candidate.timeSec - scenario.nominalOpportunitySec) <= 1);
              return <p key={`${run.generatedAt}-${index}`}><b>Run {index + 1}</b><span>{nominal?.label}</span><strong>{nominal?.recommendation.toUpperCase()} · {nominal?.confidence.toFixed(2)}</strong></p>;
            })}
            <p><b>硬规则</b><span>完整广告计划越过片尾</span><strong>CONTENT_OVERRUN</strong></p>
          </div>
        ) : isPauseScenario ? (
          <div className="showcase-proof-runs">
            <p><b>事件</b><span>pause duration ≥ 2s</span><strong>STABLE_PAUSE</strong></p>
            <p><b>事件</b><span>页面可见且未拖动</span><strong>PLAYER_VISIBLE</strong></p>
            <p><b>边界</b><span>仅使用当前播放器事件</span><strong>NO_CROSS_APP_DATA</strong></p>
          </div>
        ) : (
          <div className="showcase-proof-runs">
            <p><b>规则</b><span>受保护情境禁止商业打断</span><strong>PROTECTED_CONTEXT</strong></p>
            <p><b>排序</b><span>硬规则在商业评分之前执行</span><strong>POLICY_FIRST</strong></p>
            <p><b>结果</b><span>没有合规候选计划</span><strong>DELIVERY_SHORTFALL</strong></p>
          </div>
        )}
      </details>
    </section>
  );
}

function ScenarioExperience({ demo, first, analysisRuns, consensus }: { demo: ScenarioDemo; first: boolean; analysisRuns: VideoAnalysis[]; consensus: AnalysisConsensus }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggeredRef = useRef<Record<Strategy, boolean>>({ baseline: false, admind: false });
  const resumeAfterAdRef = useRef(false);
  const seekingRef = useRef(false);
  const [strategy, setStrategy] = useState<Strategy>("baseline");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [adRemaining, setAdRemaining] = useState<number | null>(null);
  const [pausePending, setPausePending] = useState(false);

  const { scenario, baseline, admind } = demo;
  const isPauseScenario = scenario.id === "S2";
  const isProtectedScenario = scenario.id === "S3";
  const decision = strategy === "baseline" ? baseline : admind;
  const selected = decision.selected;
  const adActive = adRemaining !== null;
  const decisionTime = selected?.timeSec ?? scenario.nominalOpportunitySec;
  const protectionActive = isProtectedScenario && strategy === "admind" && time >= scenario.nominalOpportunitySec - 2;

  useEffect(() => {
    if (adRemaining === null) return;
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
  }, [adRemaining, selected?.format]);

  useEffect(() => {
    if (!isPauseScenario || !pausePending || strategy !== "admind" || !selected) return;
    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (video?.paused && document.visibilityState === "visible" && !seekingRef.current) {
        triggeredRef.current[strategy] = true;
        setAdRemaining(selected.durationSec);
      }
      setPausePending(false);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [isPauseScenario, pausePending, selected, strategy]);

  useEffect(() => {
    if (!isPauseScenario) return;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setPausePending(false);
        setAdRemaining(null);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isPauseScenario]);

  const switchStrategy = (nextStrategy: Strategy) => {
    const video = videoRef.current;
    video?.pause();
    if (video) video.currentTime = 0;
    triggeredRef.current[nextStrategy] = false;
    resumeAfterAdRef.current = false;
    setStrategy(nextStrategy);
    setAdRemaining(null);
    setPausePending(false);
    setTime(0);
  };

  const jumpToDecision = () => {
    const video = videoRef.current;
    if (!video) return;
    triggeredRef.current[strategy] = false;
    setAdRemaining(null);
    if (isPauseScenario && selected) {
      if (strategy === "admind") {
        video.addEventListener("seeked", () => setPausePending(true), { once: true });
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
    video.currentTime = Math.max(0, decisionTime - 2.5);
    void video.play();
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || (adActive && selected?.format === "fullscreen")) return;
    setPausePending(false);
    if (adActive) setAdRemaining(null);
    if (video.paused) void video.play();
    else video.pause();
  };

  const seek = (nextTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = nextTime;
    setTime(nextTime);
    setAdRemaining(null);
    setPausePending(false);
    triggeredRef.current[strategy] = nextTime > (selected?.timeSec ?? scenario.durationSec);
  };

  const syncPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    setTime(current);
    if (isPauseScenario || !selected || triggeredRef.current[strategy] || current < selected.timeSec) return;

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
    if (!isPauseScenario || !video || video.currentTime < 1 || triggeredRef.current[strategy] || !selected) return;
    if (strategy === "baseline") {
      triggeredRef.current[strategy] = true;
      setAdRemaining(selected.durationSec);
    } else {
      setPausePending(true);
    }
  };

  return (
    <section className={first ? "showcase-demo" : "showcase-demo showcase-demo-following"} id={`scenario-${scenario.id.toLowerCase()}`}>
      <div className="showcase-section-heading">
        <div>
          <p className="showcase-scene-label">{isPauseScenario ? "暂停状态 · 任务保护" : isProtectedScenario ? "伦理场景 · 硬规则保护" : "高潮插播 · 内容连续性"}</p>
          <h2>{isPauseScenario ? "保留用户的查看任务。" : isProtectedScenario ? "有些边界，价格不能越过。" : "只改变投放决策。"}</h2>
          <p className="showcase-scene-summary">{isPauseScenario
            ? "同一次暂停，同一则保量游戏广告。系统只根据当前播放器中的暂停、拖动和页面可见性判断交互状态，再决定能否展示以及放在哪里。"
            : isProtectedScenario
                ? "同一条高价保量活动命中角色受伤场景。伦理与品牌安全规则先于排序执行；没有合规窗口时，系统宁可记录交付缺口，也不强行插播。"
              : "同一条视频，同一则保量广告。系统理解内容张力，寻找符合合同约束的低打断窗口。"}</p>
        </div>
        <div className="showcase-toggle" role="group" aria-label={`${isPauseScenario ? "暂停状态" : isProtectedScenario ? "敏感场景" : "高潮插播"}投放策略`}>
          <button aria-pressed={strategy === "baseline"} className={strategy === "baseline" ? "active" : ""} onClick={() => switchStrategy("baseline")}>传统投放</button>
          <button aria-pressed={strategy === "admind"} className={strategy === "admind" ? "active" : ""} onClick={() => switchStrategy("admind")}><SparkIcon />AdMind</button>
        </div>
      </div>

      <article className="showcase-player-card">
        <div className="showcase-player-meta">
          <div>
            <span className={strategy === "baseline" ? "showcase-state baseline" : "showcase-state smart"} />
            <strong>{isPauseScenario
              ? strategy === "baseline" ? "传统暂停广告：立即全屏覆盖" : "AdMind：判断交互状态，保留画面"
              : isProtectedScenario
                ? strategy === "baseline" ? "传统投放：高价活动立即触发" : "AdMind：硬规则阻止投放"
              : strategy === "baseline" ? "传统投放：固定时间触发" : "AdMind：等待自然转场"}</strong>
            {isPauseScenario && strategy === "admind" && pausePending ? <small>正在确认稳定暂停…</small> : null}
          </div>
          <button onClick={jumpToDecision}>{isPauseScenario ? "模拟暂停" : "跳到"} {formatTime(decisionTime)}</button>
        </div>

        <div className="video-stage showcase-video-stage">
          <video
            className="content-video"
            onEnded={() => setPlaying(false)}
            onClick={togglePlayback}
            onPause={handlePause}
            onPlay={() => setPlaying(true)}
            onSeeking={() => {
              seekingRef.current = true;
              setPausePending(false);
              if (isPauseScenario) setAdRemaining(null);
            }}
            onSeeked={() => { seekingRef.current = false; }}
            onTimeUpdate={syncPlayback}
            playsInline
            preload="metadata"
            ref={videoRef}
            src="/admind-charge-demo-720p.mp4"
          >
            <track default kind="captions" label="中文" src="/charge-demo-zh.vtt" srcLang="zh" />
          </video>

          <div className="video-topline showcase-video-topline">
            <span>{isPauseScenario ? "只使用当前播放器事件" : isProtectedScenario ? "伦理保护场景仍在进行" : "CHARGE · Blender Studio"}</span>
            <span>{isPauseScenario ? "暂停 · 拖动 · 页面可见性" : isProtectedScenario ? "00:56 角色受伤" : strategy === "baseline" ? "00:45 固定投放" : `${formatTime(scenario.safeOpportunitySec)} AI 延后建议`}</span>
          </div>

          {adActive && selected ? (
            <div className={selected.format === "fullscreen" ? "ad-overlay fullscreen real-ad" : "ad-overlay card real-ad-card"}>
              <AdCreative
                fullscreen={selected.format === "fullscreen"}
                onDismiss={() => setAdRemaining(null)}
                remaining={adRemaining}
                scenarioId={scenario.id}
              />
            </div>
          ) : null}

          {protectionActive ? (
            <div className="showcase-protection-note"><ShieldIcon /><div><strong>广告已阻止</strong><span>高价保量活动未越过受保护场景；交付缺口已记录。</span></div></div>
          ) : null}

          <div className="video-controls showcase-controls">
            <button aria-label={playing ? "暂停" : "播放"} onClick={togglePlayback}>
              {playing ? <span className="pause-icon">Ⅱ</span> : <PlayIcon />}
            </button>
            <span>{formatTime(time)}</span>
            <input
              aria-label="视频进度"
              max={scenario.durationSec}
              min={0}
              onChange={(event) => seek(Number(event.target.value))}
              step="0.1"
              type="range"
              value={time}
            />
            <span>{formatTime(scenario.durationSec)}</span>
            <span className="showcase-quality">720p</span>
          </div>
        </div>

      </article>
      <DecisionProof analysisRuns={analysisRuns} consensus={consensus} demo={demo} first={first} />
    </section>
  );
}

export function ShowcaseDemo({ scenarios, analysisRuns, consensus }: ShowcaseDemoProps) {
  return (
    <div className="showcase-page">
      <header className="showcase-nav">
        <a className="showcase-brand" href="#top" aria-label="AdMind 首页">
          <span className="showcase-brand-mark"><SparkIcon /></span>
          <strong>AdMind</strong>
        </a>
        <nav aria-label="主页导航">
          <a href="#demo">体验演示</a>
          <a href="#decision">决策方式</a>
        </nav>
      </header>

      <main id="top">
        <section className="showcase-hero">
          <p className="showcase-kicker">AI AD DECISION ENGINE</p>
          <h1>广告必须出现，<br />也不必毁掉剧情。</h1>
          <p className="showcase-lead">AdMind 理解内容与用户动作，在商业约束下决定广告何时出现、以什么形式出现，以及何时不该出现。</p>
          <div className="showcase-actions">
            <a className="showcase-primary" href="#demo">开始体验</a>
            <a className="showcase-secondary" href="#decision">查看决策方式 <ChevronIcon /></a>
          </div>
        </section>

        <div className="showcase-sequence" id="demo">
          {scenarios.map((demo, index) => <ScenarioExperience analysisRuns={analysisRuns} consensus={consensus} demo={demo} first={index === 0} key={demo.scenario.id} />)}
        </div>

        <section className="showcase-engineering-note">
          <p>页面只保留理解产品所需的证据。</p>
          <h2>原始响应、完整审计代码与测试留在项目仓库。</h2>
        </section>
      </main>

      <footer className="showcase-footer">
        <strong>AdMind</strong>
        <p>《CHARGE》© Blender Foundation / Blender Studio，CC BY 4.0。游戏广告画面仅用于非商业产品研究演示，不代表任何平台或广告主合作。</p>
      </footer>
    </div>
  );
}
