"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DecisionResponse, Scenario, Strategy } from "@admind/contracts";
import { ChevronIcon, PlayIcon, SparkIcon } from "./icons";
import { AdCreative } from "./AdCreative";

export type ScenarioDemo = {
  scenario: Scenario;
  baseline: DecisionResponse;
  admind: DecisionResponse;
};

type ShowcaseDemoProps = {
  scenarios: ScenarioDemo[];
};

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ShowcaseDemo({ scenarios }: ShowcaseDemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggeredRef = useRef<Record<Strategy, boolean>>({ baseline: false, admind: false });
  const resumeAfterAdRef = useRef(false);
  const [strategy, setStrategy] = useState<Strategy>("baseline");
  const [activeScenarioId, setActiveScenarioId] = useState(scenarios[0].scenario.id);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [adRemaining, setAdRemaining] = useState<number | null>(null);

  const activeDemo = scenarios.find((item) => item.scenario.id === activeScenarioId) ?? scenarios[0];
  const { scenario, baseline, admind } = activeDemo;
  const isPauseScenario = scenario.id === "S2";
  const decision = strategy === "baseline" ? baseline : admind;
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

  const switchStrategy = (nextStrategy: Strategy) => {
    const video = videoRef.current;
    video?.pause();
    if (video) video.currentTime = 0;
    triggeredRef.current[nextStrategy] = false;
    resumeAfterAdRef.current = false;
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
    setStrategy("baseline");
    setAdRemaining(null);
    setTime(0);
  };

  const jumpToDecision = () => {
    const video = videoRef.current;
    if (!video || !selected) return;
    triggeredRef.current[strategy] = false;
    setAdRemaining(null);
    if (isPauseScenario) {
      video.currentTime = selected.timeSec;
      video.pause();
      setTime(selected.timeSec);
      triggeredRef.current[strategy] = true;
      setAdRemaining(selected.durationSec);
      return;
    }
    video.currentTime = Math.max(0, selected.timeSec - 2.5);
    void video.play();
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

  return (
    <div className="showcase-page">
      <header className="showcase-nav">
        <a className="showcase-brand" href="#top" aria-label="AdMind 首页">
          <span className="showcase-brand-mark"><SparkIcon /></span>
          <strong>AdMind</strong>
        </a>
        <nav aria-label="主页导航">
          <a href="#demo">体验演示</a>
          <Link href="/console">决策后台</Link>
        </nav>
      </header>

      <main id="top">
        <section className="showcase-hero">
          <p className="showcase-kicker">AI AD DECISION ENGINE</p>
          <h1>广告必须出现，<br />也不必毁掉剧情。</h1>
          <p className="showcase-lead">AdMind 理解内容与用户动作，在商业约束下决定广告何时出现、以什么形式出现，以及何时不该出现。</p>
          <div className="showcase-actions">
            <a className="showcase-primary" href="#demo">开始体验</a>
            <Link className="showcase-secondary" href="/console">查看决策后台 <ChevronIcon /></Link>
          </div>
        </section>

        <section className="showcase-demo" id="demo">
          <div className="showcase-scenario-tabs" role="tablist" aria-label="选择产品能力场景">
            {scenarios.map((item, index) => (
              <button
                aria-selected={item.scenario.id === activeScenarioId}
                className={item.scenario.id === activeScenarioId ? "active" : ""}
                key={item.scenario.id}
                onClick={() => switchScenario(item.scenario.id)}
                role="tab"
              >
                <span>0{index + 1}</span>
                <strong>{item.scenario.id === "S1" ? "高潮插播" : "暂停查看"}</strong>
                <small>{item.scenario.id === "S1" ? "什么时候投" : "用什么形式投"}</small>
              </button>
            ))}
          </div>
          <div className="showcase-section-heading">
            <div>
              <p>{isPauseScenario ? "同一次暂停，同一则相关广告" : "同一条视频，同一则广告"}</p>
              <h2>{isPauseScenario ? "保留用户的查看任务。" : "只改变投放决策。"}</h2>
            </div>
            <div className="showcase-toggle" role="group" aria-label="选择投放策略">
              <button aria-pressed={strategy === "baseline"} className={strategy === "baseline" ? "active" : ""} onClick={() => switchStrategy("baseline")}>传统投放</button>
              <button aria-pressed={strategy === "admind"} className={strategy === "admind" ? "active" : ""} onClick={() => switchStrategy("admind")}><SparkIcon />AdMind</button>
            </div>
          </div>

          <article className="showcase-player-card">
            <div className="showcase-player-meta">
              <div>
                <span className={strategy === "baseline" ? "showcase-state baseline" : "showcase-state smart"} />
                <strong>{isPauseScenario
                  ? strategy === "baseline" ? "传统暂停广告：立即全屏覆盖" : "AdMind：识别查看意图，保留画面"
                  : strategy === "baseline" ? "传统投放：固定时间触发" : "AdMind：等待自然转场"}</strong>
              </div>
              <button onClick={jumpToDecision}>{isPauseScenario ? "模拟暂停" : "跳到"} {formatTime(selected?.timeSec ?? 0)}</button>
            </div>

            <div className="video-stage showcase-video-stage">
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

              <div className="video-topline showcase-video-topline">
                <span>{isPauseScenario ? "用户正在查看画面细节" : "CHARGE · Blender Studio"}</span>
                <span>{isPauseScenario ? "00:27 查看型暂停" : strategy === "baseline" ? "00:45 固定投放" : "01:22 安全转场"}</span>
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

            <div className="showcase-decision-line">
              <span>{isPauseScenario ? "暂停意图" : strategy === "baseline" ? "固定点" : "安全转场"}</span>
              <strong>{formatTime(selected?.timeSec ?? 0)}</strong>
              <i />
              <p>{isPauseScenario
                ? strategy === "baseline" ? "覆盖暂停画面，用户无法继续查看细节。" : "相关性不能越过控制权；卡片可关闭，播放控件保持可用。"
                : strategy === "baseline" ? "剧情仍在高潮，但规则按时触发广告。" : "动作结束后再展示，保量目标保持不变。"}</p>
            </div>
          </article>
        </section>

        <section className="showcase-results" aria-label="策略结果">
          {isPauseScenario ? (
            <>
              <article><strong>0.91</strong><span>查看型暂停识别置信度</span></article>
              <article><strong>全屏 → 卡片</strong><span>相关广告不再覆盖暂停画面</span></article>
              <article><strong>100%</strong><span>播放、关闭与进度控制保持可用</span></article>
            </>
          ) : (
            <>
              <article><strong>00:45 → 01:22</strong><span>延迟 37 秒，避开高潮并等待自然停顿</span></article>
              <article><strong>15 → 6 秒</strong><span>缩短单次广告时长</span></article>
              <article><strong>全屏 → 卡片</strong><span>保留画面与播放上下文</span></article>
            </>
          )}
        </section>

        <section className="showcase-console-cta">
          <div>
            <p>想看它为什么这样决定？</p>
            <h2>完整机制放在后台，而不是挡在体验之前。</h2>
          </div>
          <Link href="/console">进入决策后台 <ChevronIcon /></Link>
        </section>
      </main>

      <footer className="showcase-footer">
        <strong>AdMind</strong>
        <p>《CHARGE》© Blender Foundation / Blender Studio，CC BY 4.0。游戏广告画面仅用于非商业产品研究演示；NovaGear 为虚构演示品牌，不代表任何平台或广告主合作。</p>
      </footer>
    </div>
  );
}
