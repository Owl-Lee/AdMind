"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisConsensus, DecisionResponse, Scenario, Strategy, VideoAnalysis } from "@admind/contracts";
import { ChevronIcon, PlayIcon, ShieldIcon, SparkIcon } from "./icons";
import { AdCreative } from "./AdCreative";

export type DemoMedia = {
  id: string;
  label: string;
  category: string;
  src: string;
  sourceLabel: string;
  modelFinding: string;
  captionsSrc?: string;
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

const seekableMediaCache = new Map<string, Promise<string>>();

function loadSeekableMedia(src: string) {
  const cached = seekableMediaCache.get(src);
  if (cached) return cached;

  const request = fetch(src, { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) throw new Error(`视频加载失败：${response.status}`);
      return response.blob();
    })
    .then((blob) => URL.createObjectURL(blob))
    .catch((error) => {
      seekableMediaCache.delete(src);
      throw error;
    });

  seekableMediaCache.set(src, request);
  return request;
}

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
  const scrubbingRef = useRef(false);
  const [strategy, setStrategy] = useState<Strategy>("baseline");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [adRemaining, setAdRemaining] = useState<number | null>(null);
  const [pausePending, setPausePending] = useState(false);
  const [variantIndex, setVariantIndex] = useState(0);
  const [preparedMedia, setPreparedMedia] = useState<{ id: string; url: string } | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaLoadFailed, setMediaLoadFailed] = useState(false);
  const [silentPlayback, setSilentPlayback] = useState(false);

  const variants: ScenarioDemoVariant[] = [demo, ...(demo.alternatives ?? [])];
  const activeDemo = variants[variantIndex] ?? variants[0];
  const { scenario, baseline, admind, media } = activeDemo;
  const playbackSrc = preparedMedia?.id === media.id ? preparedMedia.url : null;
  const interactionReady = mediaReady && playbackSrc !== null;
  const isPauseScenario = scenario.id === "S2";
  const isProtectedScenario = scenario.id === "S3";
  const decision = strategy === "baseline" ? baseline : admind;
  const selected = decision.selected;
  const adActive = adRemaining !== null;
  const decisionTime = selected?.timeSec ?? scenario.nominalOpportunitySec;
  const blockedNoticeActive = strategy === "admind"
    && decision.outcome === "blocked"
    && time >= scenario.nominalOpportunitySec - 0.5;

  const resetPlayback = () => {
    const video = videoRef.current;
    video?.pause();
    if (video) video.currentTime = 0;
    triggeredRef.current = { baseline: false, admind: false };
    resumeAfterAdRef.current = false;
    setAdRemaining(null);
    setPausePending(false);
    setPlaying(false);
    setTime(0);
  };

  const switchVariant = (nextIndex: number) => {
    resetPlayback();
    setVariantIndex(nextIndex);
  };

  useEffect(() => {
    setSilentPlayback(new URLSearchParams(window.location.search).get("silent") === "1");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;
    video?.pause();
    setPlaying(false);
    setTime(0);
    setAdRemaining(null);
    setMediaReady(false);
    setMediaLoadFailed(false);
    setPreparedMedia(null);

    void loadSeekableMedia(media.src)
      .then((url) => {
        if (!cancelled) setPreparedMedia({ id: media.id, url });
      })
      .catch(() => {
        if (!cancelled) setMediaLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [media.src]);

  useEffect(() => {
    if (playbackSrc) videoRef.current?.load();
  }, [playbackSrc]);

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
    resetPlayback();
    setStrategy(nextStrategy);
  };

  const jumpToDecision = () => {
    const video = videoRef.current;
    if (!video || !interactionReady) return;
    triggeredRef.current[strategy] = false;
    setAdRemaining(null);

    const run = () => {
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
    if (!video || !interactionReady || (adActive && selected?.format === "fullscreen")) return;
    setPausePending(false);
    if (adActive) setAdRemaining(null);
    if (video.paused) void video.play();
    else video.pause();
  };

  const seek = (nextTime: number) => {
    const video = videoRef.current;
    if (!video || !interactionReady) return;
    const knownDuration = Number.isFinite(video.duration) ? video.duration : scenario.durationSec;
    const boundedTime = Math.min(Math.max(0, nextTime), knownDuration);
    video.currentTime = boundedTime;
    setTime(boundedTime);
    setAdRemaining(null);
    setPausePending(false);
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
                ? "同一条高价保量活动命中真实海上救援场景。伦理与品牌安全规则先于排序执行；没有合规窗口时，系统宁可记录交付缺口，也不强行插播。"
              : "同一条视频，同一则保量广告。系统理解内容张力，寻找符合合同约束的低打断窗口。"}</p>
        </div>
        <div className="showcase-toggle" role="group" aria-label={`${isPauseScenario ? "暂停状态" : isProtectedScenario ? "敏感场景" : "高潮插播"}投放策略`}>
          <button aria-pressed={strategy === "baseline"} className={strategy === "baseline" ? "active" : ""} onClick={() => switchStrategy("baseline")}>传统投放</button>
          <button aria-pressed={strategy === "admind"} className={strategy === "admind" ? "active" : ""} onClick={() => switchStrategy("admind")}><SparkIcon />AdMind</button>
        </div>
      </div>

      {variants.length > 1 ? (
        <div className="showcase-material-switcher" role="group" aria-label="切换分析素材">
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

      <article className="showcase-player-card">
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
              <small>{isPauseScenario && strategy === "admind" && pausePending ? "正在确认稳定暂停…" : media.modelFinding}</small>
            </div>
          </div>
          <button disabled={!interactionReady} onClick={jumpToDecision}>
            {mediaLoadFailed ? "视频加载失败" : interactionReady ? (isPauseScenario ? "模拟暂停" : "查看广告投放点") : "正在准备视频…"}
          </button>
        </div>

        <div className="video-stage showcase-video-stage">
          <video
            className="content-video"
            onEnded={() => setPlaying(false)}
            onClick={togglePlayback}
            onLoadedMetadata={() => {
              if (playbackSrc) {
                setTime(0);
                setMediaReady(true);
              }
            }}
            onPause={handlePause}
            onPlay={() => setPlaying(true)}
            onSeeking={() => {
              seekingRef.current = true;
              setPausePending(false);
              if (isPauseScenario) setAdRemaining(null);
            }}
            onSeeked={() => {
              seekingRef.current = false;
              if (!scrubbingRef.current) syncPlayback();
            }}
            onTimeUpdate={syncPlayback}
            muted={silentPlayback}
            playsInline
            preload="metadata"
            ref={videoRef}
            src={playbackSrc ?? undefined}
          >
            {media.captionsSrc ? <track default kind="captions" label="中文" src={media.captionsSrc} srcLang="zh" /> : null}
          </video>

          {!interactionReady ? (
            <div className="showcase-media-loading" role="status">
              <span />
              <strong>{mediaLoadFailed ? "视频加载失败，请刷新后重试" : "正在准备可拖动视频…"}</strong>
            </div>
          ) : null}

          <div className="video-topline showcase-video-topline">
            <span>{isPauseScenario
              ? "暂停 · 拖动 · 页面可见性"
              : strategy === "baseline"
                ? `${formatTime(scenario.nominalOpportunitySec)} 固定投放`
                : decision.outcome === "blocked"
                  ? isProtectedScenario ? "救援结束前禁止投放" : "未找到安全窗口"
                  : `${formatTime(selected?.timeSec ?? scenario.safeOpportunitySec)} AI 计划`}</span>
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

          {blockedNoticeActive ? (
            <div className="showcase-protection-note"><ShieldIcon /><div>
              <strong>{isProtectedScenario ? "广告已阻止" : "本段不投放"}</strong>
              <span>{isProtectedScenario
                ? "真实救援仍在进行；高价保量活动不得越过伦理边界。"
                : "允许的延后范围内没有低打断窗口；系统记录交付缺口。"}</span>
            </div></div>
          ) : null}

          <div className="video-controls showcase-controls">
            <button aria-label={playing ? "暂停" : "播放"} onClick={togglePlayback}>
              {playing ? <span className="pause-icon">Ⅱ</span> : <PlayIcon />}
            </button>
            <span>{formatTime(time)}</span>
            <input
              aria-label="视频进度"
              disabled={!interactionReady}
              max={scenario.durationSec}
              min={0}
              onInput={(event) => seek(Number(event.currentTarget.value))}
              onKeyUp={() => syncPlayback()}
              onPointerCancel={() => { scrubbingRef.current = false; }}
              onPointerDown={() => { scrubbingRef.current = true; }}
              onPointerUp={() => {
                scrubbingRef.current = false;
                syncPlayback();
              }}
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
        <p>视频素材：《CHARGE》《Coffee Run》© Blender Foundation / Blender Studio（CC BY 4.0）；《Caminandes: Llamigos》© Blender（CC BY 3.0）；美国海岸警卫队救援视频为 Public Domain。游戏广告画面仅用于非商业产品研究演示。</p>
      </footer>
    </div>
  );
}
