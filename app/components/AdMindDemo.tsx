"use client";

import { useEffect, useMemo, useState } from "react";
import type { DecisionResponse, Scenario, Strategy } from "@admind/contracts";
import {
  BellIcon,
  ChartIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  GridIcon,
  LibraryIcon,
  PlayIcon,
  RouteIcon,
  SearchIcon,
  ShieldIcon,
  SlidersIcon,
  SparkIcon,
} from "./icons";

type DemoProps = {
  scenario: Scenario;
  baseline: DecisionResponse;
  admind: DecisionResponse;
};

const navItems = [
  { label: "决策工作台", icon: GridIcon, active: true },
  { label: "会话规划", icon: RouteIcon },
  { label: "政策中心", icon: ShieldIcon },
  { label: "效果分析", icon: ChartIcon },
  { label: "素材库", icon: LibraryIcon },
  { label: "系统设置", icon: SlidersIcon },
];

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
  const [strategy, setStrategy] = useState<Strategy>("admind");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(39);
  const [inspectorTab, setInspectorTab] = useState<"explain" | "audit">("explain");
  const decision = strategy === "admind" ? admind : baseline;
  const selected = decision.selected;
  const adActive = Boolean(
    selected && time >= selected.timeSec && time < selected.timeSec + selected.durationSec,
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTime((current) => {
        if (current >= scenario.durationSec) {
          setPlaying(false);
          return scenario.durationSec;
        }
        return Math.min(current + 0.25, scenario.durationSec);
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, scenario.durationSec]);

  const safeDelta = useMemo(
    () => (admind.selected ? admind.selected.timeSec - scenario.nominalOpportunitySec : 0),
    [admind.selected, scenario.nominalOpportunitySec],
  );

  const jumpToDecision = () => {
    setTime(Math.max(0, (selected?.timeSec ?? 0) - 1.5));
    setPlaying(true);
  };

  const switchStrategy = (nextStrategy: Strategy) => {
    setStrategy(nextStrategy);
    setPlaying(false);
    setTime(39);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="AdMind 首页">
          <span className="brand-mark"><SparkIcon /></span>
          <span><strong>AdMind</strong><small>广告决策智能体</small></span>
        </a>

        <nav className="side-nav" aria-label="主导航">
          <p className="nav-label">工作空间</p>
          {navItems.slice(0, 4).map(({ label, icon: NavIcon, active }) => (
            <a className={active ? "nav-item active" : "nav-item"} href={active ? "#top" : "#roadmap"} key={label}>
              <NavIcon />
              <span>{label}</span>
              {!active && label !== "效果分析" ? <small>待开放</small> : null}
            </a>
          ))}
          <p className="nav-label nav-label-spaced">管理</p>
          {navItems.slice(4).map(({ label, icon: NavIcon }) => (
            <a className="nav-item" href="#roadmap" key={label}>
              <NavIcon /><span>{label}</span><small>待开放</small>
            </a>
          ))}
        </nav>

        <div className="sidebar-status">
          <span className="status-light" />
          <div><strong>决策服务正常</strong><small>规则版本 policy-1.0</small></div>
        </div>
        <div className="profile">
          <span className="avatar">PM</span>
          <div><strong>Product demo</strong><small>本地演示环境</small></div>
          <ChevronIcon />
        </div>
      </aside>

      <main className="main" id="top">
        <header className="topbar">
          <div>
            <p className="eyebrow">Decision workspace / S1</p>
            <h1>广告决策工作台</h1>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <SearchIcon />
              <span className="sr-only">搜索</span>
              <input aria-label="搜索决策或场景" placeholder="搜索决策、活动或场景" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="通知"><BellIcon /><span className="notification-dot" /></button>
            <button className="outline-button" onClick={() => setInspectorTab("audit")}>查看审计日志</button>
          </div>
        </header>

        <section className="content">
          <div className="intro-row">
            <div>
              <div className="title-line">
                <span className="scenario-id">S1</span>
                <h2>{scenario.title}</h2>
                <span className="live-badge"><span />实时模拟</span>
              </div>
              <p>在履行保量合同的前提下，比较固定广告点与情境感知编排。所有品牌与节目内容均为原创演示。</p>
            </div>
            <div className="scenario-switcher" aria-label="场景切换">
              <button className="selected">S1 高潮打断</button>
              <button disabled title="下一迭代实现">S2 暂停卡片</button>
              <button disabled title="下一迭代实现">S3 保护场景</button>
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
                <div className="scene-art" aria-hidden="true">
                  <span className="moon" /><span className="tower one" /><span className="tower two" />
                  <span className="road" /><span className="runner" /><span className="light-beam" />
                </div>
                <div className="video-topline">
                  <span>原创演示片段</span>
                  <span>悬疑 · 高潮段落</span>
                </div>
                <div className="subtitle">“别停，出口就在前面。”</div>

                {adActive && selected ? (
                  <div className={selected.format === "fullscreen" ? "ad-overlay fullscreen" : "ad-overlay card"}>
                    <div className="ad-badge">广告 · {Math.max(0, Math.ceil(selected.timeSec + selected.durationSec - time))}s</div>
                    <div className="fictional-logo"><span>极昼</span>边境</div>
                    <p>{selected.format === "fullscreen" ? "踏入未知战场，今晚集结" : "短版静音素材 · 不遮挡核心叙事"}</p>
                    <button>了解活动</button>
                    {selected.muted ? <small>静音播放</small> : null}
                  </div>
                ) : null}

                <div className="video-controls">
                  <button aria-label={playing ? "暂停" : "播放"} onClick={() => setPlaying((value) => !value)}>
                    {playing ? <span className="pause-icon">Ⅱ</span> : <PlayIcon />}
                  </button>
                  <span>{formatTime(time)}</span>
                  <input
                    aria-label="视频进度"
                    max={scenario.durationSec}
                    min={0}
                    onChange={(event) => setTime(Number(event.target.value))}
                    step="0.1"
                    type="range"
                    value={time}
                  />
                  <span>{formatTime(scenario.durationSec)}</span>
                  <button className="quality-button">1080p</button>
                </div>
              </div>

              <div className="timeline-card">
                <div className="panel-heading">
                  <div><span className="section-kicker">SESSION TIMELINE</span><h3>内容情境与投放窗口</h3></div>
                  <button className="text-button" onClick={jumpToDecision}>跳到决策点 <ChevronIcon /></button>
                </div>
                <div className="timeline" aria-label="视频时间轴">
                  <div className="timeline-rail">
                    <span className="segment calm" style={{ width: "38%" }} />
                    <span className="segment rising" style={{ left: "38%", width: "12%" }} />
                    <span className="segment climax" style={{ left: "50%", width: "11%" }} />
                    <span className="segment recovery" style={{ left: "61%", width: "39%" }} />
                    <span className="marker nominal" style={{ left: "50%" }}><i />00:45</span>
                    <span className="marker safe" style={{ left: "61.1%" }}><i />00:55</span>
                    <span className="playhead" style={{ left: `${(time / scenario.durationSec) * 100}%` }} />
                  </div>
                  <div className="timeline-labels">
                    <span>铺垫</span><span>张力上升</span><span className="danger-label">追逐高潮</span><span className="safe-label">安全转场</span>
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
                <div className="comparison-plan"><b>00:45</b><span>15 秒全屏有声素材</span></div>
                <ul><li>履行保量合同</li><li className="negative">中断追逐高潮</li><li className="negative">高误触与退出风险</li></ul>
              </article>
              <div className="versus"><span>VS</span><i /></div>
              <article className="comparison-card smart-card">
                <header><span><SparkIcon /></span><div><small>ADMIND</small><strong>安全转场编排</strong></div></header>
                <div className="comparison-plan"><b>00:55</b><span>6 秒静音转场素材</span></div>
                <ul><li>同样履行保量合同</li><li>避开内容高潮</li><li>保留播放控件与上下文</li></ul>
              </article>
              <article className="impact-card">
                <span>预期影响（待 A/B 验证）</span>
                <div><strong>-60%</strong><small>单次广告时长</small></div>
                <div><strong>+10s</strong><small>推迟至恢复窗口</small></div>
                <p>这些是产品假设，不伪装成线上实验结论。</p>
              </article>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
