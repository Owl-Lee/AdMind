"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DecisionResponse, Scenario, Strategy } from "@admind/contracts";
import {
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  PlayIcon,
  ShieldIcon,
  SparkIcon,
} from "./icons";

type DemoProps = {
  scenario: Scenario;
  baseline: DecisionResponse;
  admind: DecisionResponse;
};

const scoreLabels = {
  commercialValue: "商业价值",
  completionLikelihood: "完成概率",
  relevance: "内容相关性",
  contextSafety: "情境安全",
  interactionSafety: "交互安全",
  disruptionPenalty: "打断惩罚",
};

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function AdMindDemo({ scenario, baseline, admind }: DemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggeredRef = useRef<Record<Strategy, boolean>>({ baseline: false, admind: false });
  const resumeAfterAdRef = useRef(false);
  const [strategy, setStrategy] = useState<Strategy>("admind");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [adRemaining, setAdRemaining] = useState<number | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"explain" | "audit">("explain");
  const decision = strategy === "admind" ? admind : baseline;
  const selected = decision.selected;
  const adActive = adRemaining !== null;

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

  const safeDelta = useMemo(
    () => (admind.selected ? admind.selected.timeSec - scenario.nominalOpportunitySec : 0),
    [admind.selected, scenario.nominalOpportunitySec],
  );

  const jumpToDecision = () => {
    const video = videoRef.current;
    if (!video) return;
    triggeredRef.current[strategy] = false;
    setAdRemaining(null);
    video.currentTime = Math.max(0, (selected?.timeSec ?? 0) - 2.5);
    void video.play();
  };

  const switchStrategy = (nextStrategy: Strategy) => {
    const video = videoRef.current;
    video?.pause();
    if (video) video.currentTime = 0;
    triggeredRef.current[nextStrategy] = false;
    setStrategy(nextStrategy);
    setAdRemaining(null);
    setTime(0);
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || (adActive && selected?.format === "fullscreen")) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  const seek = (nextTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = nextTime;
    setTime(nextTime);
    setAdRemaining(null);
    triggeredRef.current[strategy] = nextTime > (selected?.timeSec ?? scenario.durationSec);
  };

  const syncPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    setTime(current);
    if (!selected || triggeredRef.current[strategy] || current < selected.timeSec) return;

    triggeredRef.current[strategy] = true;
    setAdRemaining(selected.durationSec);
    if (selected.format === "fullscreen") {
      resumeAfterAdRef.current = !video.paused;
      video.pause();
    }
  };

  const nominalLeft = `${(scenario.nominalOpportunitySec / scenario.durationSec) * 100}%`;
  const safeLeft = `${(scenario.safeOpportunitySec / scenario.durationSec) * 100}%`;

  return (
    <div className="app-shell console-shell">
      <main className="main" id="top">
        <header className="topbar console-topbar">
          <Link className="console-brand" href="/" aria-label="返回 AdMind 体验首页">
            <span className="brand-mark"><SparkIcon /></span>
            <strong>AdMind</strong>
          </Link>
          <div>
            <p className="eyebrow">DECISION CONSOLE</p>
            <h1>决策后台</h1>
          </div>
          <Link className="console-back" href="/">返回体验演示</Link>
        </header>

        <section className="content">
          <div className="intro-row">
            <div>
              <div className="title-line">
                <span className="scenario-id">S1</span>
                <h2>{scenario.title}</h2>
                <span className="live-badge"><span />实时模拟</span>
              </div>
              <p>真实开放电影 × 真实广告截图：比较固定插播与情境感知编排，商业约束保持不变。</p>
            </div>
          </div>

          <section className="metric-strip" aria-label="本次会话指标">
            <article><span>商业约束</span><strong>保量活动</strong><small><CheckIcon />资格已校验</small></article>
            <article><span>原定广告点</span><strong>{formatTime(scenario.nominalOpportunitySec)}</strong><small>处于内容高潮</small></article>
            <article><span>安全转场</span><strong>{formatTime(scenario.safeOpportunitySec)}</strong><small className="positive">+{safeDelta} 秒可恢复</small></article>
            <article><span>用户研究倾向</span><strong>8 / 9</strong><small>更偏好集中看完 <i>小样本</i></small></article>
          </section>

          <div className="strategy-bar">
            <div className="strategy-copy">
              <span className={strategy === "admind" ? "strategy-orb smart" : "strategy-orb"}>
                {strategy === "admind" ? <SparkIcon /> : <ClockIcon />}
              </span>
              <div>
                <strong>{strategy === "admind" ? "AdMind 情境策略" : "Baseline 固定策略"}</strong>
                <small>{strategy === "admind" ? "硬约束优先 · 完整计划排序 · 可审计" : "固定时点 · 主素材优先 · 不理解剧情"}</small>
              </div>
            </div>
            <div className="segmented" role="group" aria-label="决策策略">
              <button aria-pressed={strategy === "baseline"} className={strategy === "baseline" ? "active" : ""} onClick={() => switchStrategy("baseline")}>Baseline</button>
              <button aria-pressed={strategy === "admind"} className={strategy === "admind" ? "active" : ""} onClick={() => switchStrategy("admind")}><SparkIcon />AdMind</button>
            </div>
          </div>

          <div className="workspace-grid">
            <section className="player-panel" aria-label="策略演示播放器">
              <div className="video-stage">
                <video
                  className="content-video"
                  onEnded={() => setPlaying(false)}
                  onPause={() => setPlaying(false)}
                  onPlay={() => setPlaying(true)}
                  onTimeUpdate={syncPlayback}
                  playsInline
                  preload="metadata"
                  ref={videoRef}
                  src="/admind-charge-demo-720p.mp4"
                >
                  <track default kind="captions" label="中文" src="/charge-demo-zh.vtt" srcLang="zh" />
                </video>
                <div className="video-topline">
                  <span>CHARGE · Blender Studio · CC BY 4.0</span>
                  <span>机器人战斗 · 真实片段</span>
                </div>

                {adActive && selected ? (
                  <div className={selected.format === "fullscreen" ? "ad-overlay fullscreen real-ad" : "ad-overlay card real-ad-card"}>
                    <Image
                      alt="视频平台中出现的游戏广告实测截图"
                      fill
                      priority
                      sizes={selected.format === "fullscreen" ? "(max-width: 900px) 100vw, 65vw" : "270px"}
                      src="/game-ad-clean.png"
                    />
                    {selected.format === "fullscreen" ? (
                      <>
                        <div className="ad-badge real-countdown">广告 · {adRemaining}s</div>
                      </>
                    ) : (
                      <>
                        <span className="native-ad-label">广告 · {adRemaining}s</span>
                        <span className="native-muted">静音</span>
                      </>
                    )}
                  </div>
                ) : null}

                <div className="video-controls">
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
                  <button className="quality-button">720p</button>
                </div>
              </div>

              <div className="timeline-card">
                <div className="panel-heading">
                  <div><span className="section-kicker">SESSION TIMELINE</span><h3>内容情境与投放窗口</h3></div>
                  <button className="text-button" onClick={jumpToDecision}>跳到决策点 <ChevronIcon /></button>
                </div>
                <div className="timeline" aria-label="视频时间轴">
                  <div className="timeline-rail">
                    <span className="segment calm" style={{ width: "13.4%" }} />
                    <span className="segment rising" style={{ left: "13.4%", width: "13.4%" }} />
                    <span className="segment climax" style={{ left: "26.8%", width: "48.1%" }} />
                    <span className="segment recovery" style={{ left: "74.9%", width: "25.1%" }} />
                    <span className="marker nominal" style={{ left: nominalLeft }}><i />{formatTime(scenario.nominalOpportunitySec)}</span>
                    <span className="marker safe" style={{ left: safeLeft }}><i />{formatTime(scenario.safeOpportunitySec)}</span>
                    <span className="playhead" style={{ left: `${(time / scenario.durationSec) * 100}%` }} />
                  </div>
                  <div className="timeline-labels">
                    <span>盗取能源</span><span>警报升高</span><span className="danger-label">机器人战斗</span><span className="safe-label">反击与离场</span>
                  </div>
                </div>
                <div className="timeline-legend">
                  <span><i className="legend-dot danger" />固定广告点</span>
                  <span><i className="legend-dot safe" />AdMind 推荐点</span>
                  <span><i className="legend-line" />当前播放位置</span>
                </div>
              </div>
            </section>

            <aside className="inspector" aria-label="决策检查器">
              <div className="inspector-header">
                <div><span className="section-kicker">DECISION INSPECTOR</span><h3>为什么这样投？</h3></div>
                <span className={strategy === "admind" ? "decision-state success" : "decision-state warning"}>
                  {strategy === "admind" ? "已优化" : "高打断"}
                </span>
              </div>
              <div className="inspector-tabs" role="tablist">
                <button role="tab" aria-selected={inspectorTab === "explain"} className={inspectorTab === "explain" ? "active" : ""} onClick={() => setInspectorTab("explain")}>决策解释</button>
                <button role="tab" aria-selected={inspectorTab === "audit"} className={inspectorTab === "audit" ? "active" : ""} onClick={() => setInspectorTab("audit")}>审计轨迹</button>
              </div>

              {inspectorTab === "explain" && selected ? (
                <div className="inspector-content">
                  <div className="decision-summary">
                    <span className="summary-icon">{strategy === "admind" ? <SparkIcon /> : <ClockIcon />}</span>
                    <div><small>最终执行计划</small><strong>{formatTime(selected.timeSec)} · {selected.durationSec} 秒{selected.muted ? "静音" : "全屏"}素材</strong></div>
                  </div>
                  <p className="summary-text">{decision.summary}</p>
                  <dl className="facts">
                    <div><dt>活动</dt><dd>{selected.campaignName}<span>保量</span></dd></div>
                    <div><dt>素材</dt><dd>{selected.creativeName}</dd></div>
                    <div><dt>版位</dt><dd>{selected.format === "fullscreen" ? "全屏插播" : "静音转场卡片"}</dd></div>
                    <div><dt>总效用分</dt><dd className="score">{selected.score.toFixed(3)}</dd></div>
                  </dl>
                  <div className="score-list">
                    {Object.entries(selected.scoreBreakdown).map(([key, value]) => {
                      const penalty = key === "disruptionPenalty";
                      return (
                        <div className="score-row" key={key}>
                          <div><span>{scoreLabels[key as keyof typeof scoreLabels]}</span><b>{value.toFixed(2)}</b></div>
                          <div className="score-track"><i className={penalty ? "penalty" : ""} style={{ width: `${value * 100}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                  {strategy === "admind" ? (
                    <div className="constraint-note"><ShieldIcon /><p><strong>硬约束未被效用分覆盖</strong><span>未审核素材已拒绝；保量合同得到履行。</span></p></div>
                  ) : (
                    <div className="constraint-note baseline-note"><ClockIcon /><p><strong>未读取场景张力</strong><span>命中固定广告点后立即投放。</span></p></div>
                  )}
                </div>
              ) : (
                <ol className="audit-list">
                  {decision.audit.map((step, index) => (
                    <li className={step.status} key={`${step.code}-${index}`}>
                      <span className="audit-index">{step.status === "pass" ? <CheckIcon /> : index + 1}</span>
                      <div><small>{step.stage.replace("_", " ")} · {step.code}</small><p>{step.message}</p></div>
                    </li>
                  ))}
                </ol>
              )}
            </aside>
          </div>

          <section className="comparison" id="roadmap">
            <div className="panel-heading">
              <div><span className="section-kicker">OUTCOME COMPARISON</span><h3>相同商业目标，不同用户代价</h3></div>
              <span className="research-chip">定性访谈 n=9 · 仅作方向性证据</span>
            </div>
            <div className="comparison-grid">
              <article className="comparison-card baseline-card">
                <header><span><ClockIcon /></span><div><small>BASELINE</small><strong>固定点即时插播</strong></div></header>
                <div className="comparison-plan"><b>{formatTime(scenario.nominalOpportunitySec)}</b><span>15 秒真实页游截图 · 全屏</span></div>
                <ul><li>履行保量合同</li><li className="negative">中断机器人战斗</li><li className="negative">遮挡内容并迫使等待</li></ul>
              </article>
              <div className="versus"><span>VS</span><i /></div>
              <article className="comparison-card smart-card">
                <header><span><SparkIcon /></span><div><small>ADMIND</small><strong>安全转场编排</strong></div></header>
                <div className="comparison-plan"><b>{formatTime(scenario.safeOpportunitySec)}</b><span>同素材 · 6 秒静音卡片</span></div>
                <ul><li>同样履行保量合同</li><li>避开内容高潮</li><li>保留播放控件与上下文</li></ul>
              </article>
              <article className="impact-card">
                <span>预期影响（待 A/B 验证）</span>
                <div><strong>-60%</strong><small>单次广告时长</small></div>
                <div><strong>+{Math.round(safeDelta)}s</strong><small>推迟至恢复窗口</small></div>
                <p>这些是产品假设，不伪装成线上实验结论。</p>
              </article>
            </div>
            <p className="asset-disclosure">内容素材：《CHARGE》© Blender Foundation / Blender Studio，CC BY 4.0。广告画面来自用户实测截图，仅用于非商业产品研究演示，不代表平台或广告主合作。</p>
          </section>
        </section>
      </main>
    </div>
  );
}
