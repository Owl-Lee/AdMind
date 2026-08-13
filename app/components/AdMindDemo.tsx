"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Strategy, VideoAnalysis } from "@admind/contracts";
import {
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  PlayIcon,
  ShieldIcon,
  SparkIcon,
} from "./icons";
import { AdCreative } from "./AdCreative";
import type { ScenarioDemo } from "./ShowcaseDemo";

type DemoProps = {
  scenarios: ScenarioDemo[];
  analysis: VideoAnalysis;
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

export function AdMindDemo({ scenarios, analysis }: DemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggeredRef = useRef<Record<Strategy, boolean>>({ baseline: false, admind: false });
  const resumeAfterAdRef = useRef(false);
  const [strategy, setStrategy] = useState<Strategy>("admind");
  const [activeScenarioId, setActiveScenarioId] = useState(scenarios[0].scenario.id);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [adRemaining, setAdRemaining] = useState<number | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"explain" | "audit">("explain");
  const activeDemo = scenarios.find((item) => item.scenario.id === activeScenarioId) ?? scenarios[0];
  const { scenario, baseline, admind } = activeDemo;
  const isPauseScenario = scenario.id === "S2";
  const isProtectedScenario = scenario.id === "S3";
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
    if (isPauseScenario && selected) {
      video.currentTime = selected.timeSec;
      video.pause();
      setTime(selected.timeSec);
      triggeredRef.current[strategy] = true;
      setAdRemaining(selected.durationSec);
      return;
    }
    video.currentTime = Math.max(0, (selected?.timeSec ?? scenario.nominalOpportunitySec) - 2.5);
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

  const switchScenario = (nextScenarioId: string) => {
    const video = videoRef.current;
    video?.pause();
    if (video) video.currentTime = 0;
    triggeredRef.current = { baseline: false, admind: false };
    resumeAfterAdRef.current = false;
    setActiveScenarioId(nextScenarioId);
    setStrategy("admind");
    setAdRemaining(null);
    setTime(0);
    setInspectorTab("explain");
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || (adActive && selected?.format === "fullscreen")) return;
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
    triggeredRef.current[strategy] = true;
    setAdRemaining(selected.durationSec);
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
                <span className="scenario-id">{scenario.id}</span>
                <h2>{scenario.title}</h2>
                <span className="live-badge"><span />实时模拟</span>
              </div>
              <p>{isPauseScenario ? "查看型暂停 × 保量广告：比较覆盖式广告与交互保护策略。" : isProtectedScenario ? "受保护内容 × 高价保量活动：验证商业评分无法覆盖硬规则。" : "真实开放电影 × 真实广告画面：比较固定插播与情境感知编排，商业约束保持不变。"}</p>
            </div>
            <div className="scenario-switcher" role="tablist" aria-label="选择决策场景">
              {scenarios.map((item) => (
                <button className={item.scenario.id === activeScenarioId ? "selected" : ""} key={item.scenario.id} onClick={() => switchScenario(item.scenario.id)} role="tab">
                  {item.scenario.id === "S1" ? "高潮插播" : item.scenario.id === "S2" ? "暂停查看" : "敏感保护"}
                </button>
              ))}
            </div>
          </div>

          <section className="metric-strip" aria-label="本次会话指标">
            <article><span>商业约束</span><strong>{isProtectedScenario ? "高价保量" : "保量活动"}</strong><small><CheckIcon />资格已校验</small></article>
            <article><span>{isPauseScenario ? "暂停机会" : "原定广告点"}</span><strong>{formatTime(scenario.nominalOpportunitySec)}</strong><small>{isPauseScenario ? "用户主动停止播放" : isProtectedScenario ? "命中受保护内容" : "处于内容高潮"}</small></article>
            <article><span>{isPauseScenario ? "查看意图" : isProtectedScenario ? "硬规则结果" : "安全转场"}</span><strong>{isPauseScenario ? "INSPECT" : isProtectedScenario ? "BLOCK" : formatTime(scenario.safeOpportunitySec)}</strong><small className={isProtectedScenario ? "" : "positive"}>{isPauseScenario ? "查看而非离开" : isProtectedScenario ? "竞价不可覆盖" : `+${safeDelta} 秒可恢复`}</small></article>
            <article><span>{isPauseScenario ? "安全区域" : isProtectedScenario ? "交付状态" : "分析来源"}</span><strong>{isPauseScenario ? "右上" : isProtectedScenario ? "缺口记录" : "基线"}</strong><small>{isPauseScenario ? "避开主体与播放控件" : isProtectedScenario ? "等待后续补偿" : "待真实模型替换"}</small></article>
          </section>

          <div className="strategy-bar">
            <div className="strategy-copy">
              <span className={strategy === "admind" ? "strategy-orb smart" : "strategy-orb"}>
                {strategy === "admind" ? <SparkIcon /> : <ClockIcon />}
              </span>
              <div>
                <strong>{strategy === "admind" ? "AdMind 情境策略" : "Baseline 固定策略"}</strong>
                <small>{strategy === "admind" ? "硬约束优先 · 完整计划排序 · 可审计" : isPauseScenario ? "暂停即展示 · 主素材优先 · 不识别用户任务" : isProtectedScenario ? "高价优先 · 不检查敏感边界" : "固定时点 · 主素材优先 · 不理解剧情"}</small>
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
                  onPause={handlePause}
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
                  <span>{isPauseScenario ? "用户正在查看画面细节" : isProtectedScenario ? "受保护内容仍在进行" : "CHARGE · Blender Studio · CC BY 4.0"}</span>
                  <span>{isPauseScenario ? "00:27 查看型暂停" : isProtectedScenario ? "00:56 角色受伤" : "机器人战斗 · 真实片段"}</span>
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
                    <span className="segment calm" style={{ width: isPauseScenario ? "22%" : "13.4%" }} />
                    <span className="segment rising" style={{ left: isPauseScenario ? "22%" : "13.4%", width: isPauseScenario ? "18%" : "13.4%" }} />
                    <span className="segment climax" style={{ left: isPauseScenario ? "40%" : "26.8%", width: isPauseScenario ? "24%" : "48.1%" }} />
                    <span className="segment recovery" style={{ left: isPauseScenario ? "64%" : "74.9%", width: isPauseScenario ? "36%" : "25.1%" }} />
                    <span className="marker nominal" style={{ left: nominalLeft }}><i />{formatTime(scenario.nominalOpportunitySec)}</span>
                    <span className="marker safe" style={{ left: safeLeft }}><i />{formatTime(scenario.safeOpportunitySec)}</span>
                    <span className="playhead" style={{ left: `${(time / scenario.durationSec) * 100}%` }} />
                  </div>
                  <div className={isPauseScenario ? "timeline-labels pause-labels" : "timeline-labels"}>
                    <span>{isPauseScenario ? "浏览内容" : "盗取能源"}</span><span>{isPauseScenario ? "关键细节" : "警报升高"}</span><span className="danger-label">{isPauseScenario ? "查看型暂停" : isProtectedScenario ? "受伤场景" : "机器人战斗"}</span><span className="safe-label">{isPauseScenario ? "章节边界" : isProtectedScenario ? "超出交付窗口" : "反击与离场"}</span>
                  </div>
                </div>
                <div className="timeline-legend">
                  <span><i className="legend-dot danger" />{isPauseScenario ? "暂停机会" : isProtectedScenario ? "受保护广告点" : "固定广告点"}</span>
                  <span><i className="legend-dot safe" />{isPauseScenario ? "延后备选" : isProtectedScenario ? "超窗备选" : "AdMind 推荐点"}</span>
                  <span><i className="legend-line" />当前播放位置</span>
                </div>
              </div>
            </section>

            <aside className="inspector" aria-label="决策检查器">
              <div className="inspector-header">
                <div><span className="section-kicker">DECISION INSPECTOR</span><h3>为什么这样投？</h3></div>
                <span className={strategy === "admind" ? "decision-state success" : "decision-state warning"}>
                  {strategy === "admind" ? isProtectedScenario ? "已阻止" : "已优化" : "高打断"}
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
                    <div className="constraint-note"><ShieldIcon /><p><strong>硬约束未被效用分覆盖</strong><span>{isPauseScenario ? "全屏素材因交互冲突被拒绝；相关性不能覆盖用户控制权。" : isProtectedScenario ? "受保护场景和交付窗口共同拒绝了全部候选计划。" : "未审核素材已拒绝；保量合同得到履行。"}</span></p></div>
                  ) : (
                    <div className="constraint-note baseline-note"><ClockIcon /><p><strong>{isPauseScenario ? "未识别暂停意图" : isProtectedScenario ? "未检查保护规则" : "未读取场景张力"}</strong><span>{isPauseScenario ? "用户暂停后立即展示全屏主素材。" : "命中固定广告点后立即投放。"}</span></p></div>
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
                <header><span><ClockIcon /></span><div><small>BASELINE</small><strong>{isPauseScenario ? "暂停即全屏覆盖" : isProtectedScenario ? "高价活动立即插播" : "固定点即时插播"}</strong></div></header>
                <div className="comparison-plan"><b>{formatTime(scenario.nominalOpportunitySec)}</b><span>{isPauseScenario ? "10 秒真实游戏广告 · 全屏" : "15 秒真实游戏广告 · 全屏"}</span></div>
                <ul>{isPauseScenario ? <><li>广告获得完整曝光</li><li className="negative">遮挡用户正在查看的画面</li><li className="negative">阻断播放与进度控制</li></> : isProtectedScenario ? <><li>立即完成一次曝光</li><li className="negative">打断角色受伤场景</li><li className="negative">商业价值覆盖内容边界</li></> : <><li>履行保量合同</li><li className="negative">中断机器人战斗</li><li className="negative">遮挡内容并迫使等待</li></>}</ul>
              </article>
              <div className="versus"><span>VS</span><i /></div>
              <article className="comparison-card smart-card">
                <header><span>{isProtectedScenario ? <ShieldIcon /> : <SparkIcon />}</span><div><small>ADMIND</small><strong>{isPauseScenario ? "查看意图保护" : isProtectedScenario ? "硬规则阻止投放" : "安全转场编排"}</strong></div></header>
                <div className="comparison-plan"><b>{isProtectedScenario ? "BLOCK" : formatTime(isPauseScenario ? scenario.nominalOpportunitySec : scenario.safeOpportunitySec)}</b><span>{isProtectedScenario ? "无合法执行计划 · 记录交付缺口" : "同活动 · 6 秒可关闭静音卡片"}</span></div>
                <ul>{isPauseScenario ? <><li>保留用户查看任务</li><li>避开人物和播放控件</li><li>关闭与播放控制保持独立</li></> : isProtectedScenario ? <><li>受保护场景不得投放</li><li>高出价不能覆盖硬规则</li><li>缺口进入后续补偿流程</li></> : <><li>同样履行保量合同</li><li>避开内容高潮</li><li>保留播放控件与上下文</li></>}</ul>
              </article>
              <article className="impact-card">
                <span>预期影响（待 A/B 验证）</span>
                <div><strong>{isPauseScenario ? "保留" : isProtectedScenario ? "0" : "-60%"}</strong><small>{isPauseScenario ? "原暂停画面" : isProtectedScenario ? "本次强制曝光" : "单次广告时长"}</small></div>
                <div><strong>{isPauseScenario ? "0" : isProtectedScenario ? "1" : `+${Math.round(safeDelta)}s`}</strong><small>{isPauseScenario ? "自动跳转" : isProtectedScenario ? "交付缺口事件" : "推迟至恢复窗口"}</small></div>
                <p>这些是产品假设，不伪装成线上实验结论。</p>
              </article>
            </div>
            <p className="asset-disclosure">内容素材：《CHARGE》© Blender Foundation / Blender Studio，CC BY 4.0。游戏广告画面仅用于非商业产品研究演示，不代表平台或广告主合作。</p>
          </section>

          <section className="analysis-console" aria-labelledby="analysis-console-title">
            <div className="panel-heading">
              <div><span className="section-kicker">PERCEPTION CONTRACT</span><h3 id="analysis-console-title">模型可以替换，决策协议不变</h3></div>
              <span className="research-chip">Schema v{analysis.schemaVersion} · {analysis.mode === "fixture" ? "人工基线" : "真实推理"}</span>
            </div>
            <div className="analysis-pipeline">
              <article><span>输入</span><strong>MP4 + 音频</strong><p>Gemini / TwelveLabs 适配器</p></article>
              <i>→</i>
              <article><span>归一化</span><strong>{analysis.segments.length} 个内容区间</strong><p>张力、运动、声音、转场、敏感标签</p></article>
              <i>→</i>
              <article><span>确定性执行</span><strong>{analysis.candidateBreaks.length} 个候选窗口</strong><p>硬过滤 → 完整计划排序 → 审计</p></article>
            </div>
            <div className="analysis-segments">
              {analysis.segments.map((segment) => (
                <article key={segment.id}>
                  <b>{formatTime(segment.startSec)}–{formatTime(segment.endSec)}</b>
                  <strong>{segment.label}</strong>
                  <span>叙事强度 {Math.round(segment.narrativeIntensity * 100)}%</span>
                </article>
              ))}
            </div>
            <p className="analysis-disclosure"><ShieldIcon />当前结果用于验证协议与下游决策，尚未伪装成模型实测。配置 API Key 后可由本地分析命令生成同结构 JSON 并替换。</p>
          </section>
        </section>
      </main>
    </div>
  );
}
