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

function DecisionMethod({ analysisRuns, consensus }: { analysisRuns: VideoAnalysis[]; consensus: AnalysisConsensus }) {
  const latestRun = analysisRuns.at(-1) ?? analysisRuns[0];
  const climax = latestRun.candidateBreaks.find((candidate) => Math.abs(candidate.timeSec - 45) <= 1);
  const recovery = latestRun.candidateBreaks.find((candidate) => Math.abs(candidate.timeSec - 85) <= 2);

  return (
    <section className="method-page" id="decision">
      <header className="method-hero">
        <p>HOW ADMIND WORKS</p>
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
          <p>THREE SIGNAL LAYERS</p>
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
          <p>REAL API EXAMPLE</p>
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

      <section className="method-responsibility">
        <div>
          <p>AI 负责</p>
          <h2>看懂视频，给出候选时间。</h2>
          <span>它返回场景说明、时间段和判断置信度，但不直接决定广告一定要播。</span>
        </div>
        <i>＋</i>
        <div>
          <p>AdMind 负责</p>
          <h2>守住边界，产出最终计划。</h2>
          <span>它结合播放器事件、伦理规则、广告时长与商业约束，给出可解释的最终决定。</span>
        </div>
      </section>

      <section className="method-stack">
        <div className="method-section-heading">
          <p>TECH STACK</p>
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

function ScenarioExperience({ demo, first }: { demo: ScenarioDemo; first: boolean }) {
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
    </section>
  );
}

export function ShowcaseDemo({ scenarios, analysisRuns, consensus }: ShowcaseDemoProps) {
  const [view, setView] = useState<"demo" | "decision">("demo");

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
    <div className="showcase-page">
      <header className="showcase-nav">
        <button className="showcase-brand" onClick={() => switchView("demo")} aria-label="AdMind 首页">
          <span className="showcase-brand-mark"><SparkIcon /></span>
          <strong>AdMind</strong>
        </button>
        <nav aria-label="页面切换">
          <button aria-current={view === "demo" ? "page" : undefined} className={view === "demo" ? "active" : ""} onClick={() => switchView("demo")}>体验演示</button>
          <button aria-current={view === "decision" ? "page" : undefined} className={view === "decision" ? "active" : ""} onClick={() => switchView("decision")}>决策方式</button>
        </nav>
      </header>

      <main id="top">
        <div hidden={view !== "demo"}>
            <section className="showcase-hero">
              <p className="showcase-kicker">AI AD DECISION ENGINE</p>
              <h1>广告必须出现，<br />也不必毁掉剧情。</h1>
              <p className="showcase-lead">AdMind 理解内容与用户动作，在商业约束下决定广告何时出现、以什么形式出现，以及何时不该出现。</p>
              <div className="showcase-actions">
                <a className="showcase-primary" href="#demo">开始体验</a>
                <button className="showcase-secondary" onClick={() => switchView("decision")}>查看决策方式 <ChevronIcon /></button>
              </div>
            </section>

            <div className="showcase-sequence" id="demo">
              {scenarios.map((demo, index) => <ScenarioExperience demo={demo} first={index === 0} key={demo.scenario.id} />)}
            </div>
        </div>
        <div hidden={view !== "decision"}>
          <DecisionMethod analysisRuns={analysisRuns} consensus={consensus} />
        </div>
      </main>

      <footer className="showcase-footer">
        <strong>AdMind</strong>
        <p>《CHARGE》© Blender Foundation / Blender Studio，CC BY 4.0。游戏广告画面仅用于非商业产品研究演示，不代表任何平台或广告主合作。</p>
      </footer>
    </div>
  );
}
