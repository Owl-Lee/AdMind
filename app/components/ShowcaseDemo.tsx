"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DecisionResponse, Scenario, Strategy } from "@admind/contracts";
import { ChevronIcon, PlayIcon, SparkIcon } from "./icons";

type ShowcaseDemoProps = {
  scenario: Scenario;
  baseline: DecisionResponse;
  admind: DecisionResponse;
};

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ShowcaseDemo({ scenario, baseline, admind }: ShowcaseDemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggeredRef = useRef<Record<Strategy, boolean>>({ baseline: false, admind: false });
  const resumeAfterAdRef = useRef(false);
  const [strategy, setStrategy] = useState<Strategy>("baseline");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [adRemaining, setAdRemaining] = useState<number | null>(null);

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

  const jumpToDecision = () => {
    const video = videoRef.current;
    if (!video || !selected) return;
    triggeredRef.current[strategy] = false;
    setAdRemaining(null);
    video.currentTime = Math.max(0, selected.timeSec - 2.5);
    void video.play();
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
          <p className="showcase-lead">AdMind 在满足商业投放要求的同时，避开内容高潮，选择更合适的时机与形式。</p>
          <div className="showcase-actions">
            <a className="showcase-primary" href="#demo">开始体验</a>
            <Link className="showcase-secondary" href="/console">查看决策后台 <ChevronIcon /></Link>
          </div>
        </section>

        <section className="showcase-demo" id="demo">
          <div className="showcase-section-heading">
            <div>
              <p>同一条视频，同一则广告</p>
              <h2>只改变投放决策。</h2>
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
                <strong>{strategy === "baseline" ? "传统投放：固定时间触发" : "AdMind：等待自然转场"}</strong>
              </div>
              <button onClick={jumpToDecision}>跳到 {formatTime(selected?.timeSec ?? 0)}</button>
            </div>

            <div className="video-stage showcase-video-stage">
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

              <div className="video-topline showcase-video-topline">
                <span>CHARGE · Blender Studio</span>
                <span>{strategy === "baseline" ? "00:45 固定投放" : "01:22 安全转场"}</span>
              </div>

              {adActive && selected ? (
                <div className={selected.format === "fullscreen" ? "ad-overlay fullscreen real-ad" : "ad-overlay card real-ad-card"}>
                  <Image
                    alt="视频平台中出现的游戏广告实测截图"
                    fill
                    priority
                    sizes={selected.format === "fullscreen" ? "(max-width: 900px) 100vw, 1000px" : "270px"}
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
              <span>{strategy === "baseline" ? "固定点" : "安全转场"}</span>
              <strong>{formatTime(selected?.timeSec ?? 0)}</strong>
              <i />
              <p>{strategy === "baseline" ? "剧情仍在高潮，但规则按时触发广告。" : "动作结束后再展示，保量目标保持不变。"}</p>
            </div>
          </article>
        </section>

        <section className="showcase-results" aria-label="策略结果">
          <article><strong>00:45 → 01:22</strong><span>延迟 37 秒，避开高潮并等待自然停顿</span></article>
          <article><strong>15 → 6 秒</strong><span>缩短单次广告时长</span></article>
          <article><strong>全屏 → 卡片</strong><span>保留画面与播放上下文</span></article>
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
        <p>《CHARGE》© Blender Foundation / Blender Studio，CC BY 4.0。广告截图仅用于非商业产品研究演示，不代表任何平台或广告主合作。</p>
      </footer>
    </div>
  );
}
