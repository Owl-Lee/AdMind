"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import manifestJson from "../../evaluation/s2/manifest.json";
import { detectFacesInRegressionFrame, PAUSE_VISION_CONFIG } from "../lib/face-detector";
import { choosePauseAdPlacement } from "../lib/pause-decision";
import {
  scoreVisionRegression,
  type RegressionManifest,
  type RegressionPrediction,
  type RegressionReport,
} from "../lib/pause-regression";
import styles from "./VisionRegressionLab.module.css";

const manifest = manifestJson as RegressionManifest;

declare global {
  interface Window {
    __ADMIND_VISION_REGRESSION__?: RegressionReport;
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  });
}

function asPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function VisionRegressionLab() {
  const [locale, setLocale] = useState<"en" | "zh">("en");
  const [localeReady, setLocaleReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<RegressionReport | null>(null);

  const predictionById = useMemo(
    () => new Map(report?.predictions.map((prediction) => [prediction.sampleId, prediction]) ?? []),
    [report],
  );

  const runRegression = async () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    const predictions: RegressionPrediction[] = [];

    for (const [index, sample] of manifest.samples.entries()) {
      try {
        const image = await loadImage(sample.frame);
        const evidence = await detectFacesInRegressionFrame(image);
        const targets = evidence.status === "ready"
          ? [
              ...evidence.faces.map((face) => ({
                ...face,
                kind: "face" as const,
                label: "face",
              })),
              ...evidence.subjects.map((subject) => ({
                ...subject,
                kind: "subject" as const,
              })),
            ]
          : [];
        const decision = choosePauseAdPlacement(targets);
        predictions.push({
          sampleId: sample.id,
          status: evidence.status,
          placement: evidence.status === "ready" ? decision.placement : "none",
          targets,
          assessments: decision.assessments,
          inferenceMs: evidence.inferenceMs,
          message: evidence.message,
        });
      } catch (error) {
        predictions.push({
          sampleId: sample.id,
          status: "unavailable",
          placement: "none",
          targets: [],
          assessments: [],
          inferenceMs: 0,
          message: error instanceof Error ? error.message : "Unknown frame-loading error",
        });
      }
      setProgress(index + 1);
    }

    const nextReport = scoreVisionRegression(manifest, predictions, {
      provenance: {
        runner: {
          appVersion: "0.3.0",
          gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? "working-tree",
          platform: navigator.userAgent,
        },
        configurationReference: {
          appVersion: "0.2.7",
          gitCommit: "bdf66d1db7511f97feba49713f9995ea6ef13711",
        },
        input: {
          kind: "fixed-jpeg",
          width: manifest.source.width,
          height: manifest.source.height,
        },
        vision: PAUSE_VISION_CONFIG,
      },
    });
    window.__ADMIND_VISION_REGRESSION__ = nextReport;
    setReport(nextReport);
    setRunning(false);
  };

  useEffect(() => {
    const timer = new URLSearchParams(window.location.search).get("autorun") === "1"
      ? window.setTimeout(() => void runRegression(), 0)
      : undefined;
    // The query-string trigger is intentionally evaluated once on page load.
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLocale(window.localStorage.getItem("admind-locale") === "zh" ? "zh" : "en");
      setLocaleReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!localeReady) return;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = locale === "zh" ? "AdMind · S2 视觉回归实验室" : "AdMind · S2 Vision Regression Lab";
    window.localStorage.setItem("admind-locale", locale);
  }, [locale, localeReady]);

  const exportReport = () => {
    if (!report) return;
    const blob = new Blob([`${JSON.stringify(report, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = `${manifest.datasetId}-report.json`;
    anchor.href = url;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copy = locale === "en"
    ? {
        kicker: "STAGE 1A · FIXED-FRAME EVALUATION",
        title: "S2 Vision Regression Lab",
        intro: "Replay the same 20 paused frames, compare local MediaPipe output with rule-based draft labels, and separate unsafe placement from conservative deferral.",
        caveat: "This is regression-set agreement, not a claim of general model accuracy.",
        run: running ? `Running ${progress}/${manifest.samples.length}` : report ? "Run again" : "Run fixed set",
        export: "Export JSON",
        confirmed: "Rule-locked draft",
        diagnostic: "Needs review",
        result: "Current result",
        expected: "Expected",
        fixedSamples: "Fixed samples",
        safeAgreement: "Safe-placement agreement",
        unsafePlacement: "Unsafe placement",
        targetRecall: "Target recall",
        targetPrecision: "Target precision",
        inferenceLatency: "Inference latency",
        modelAvailability: "Model availability",
        available: "available",
        unavailable: "unavailable",
        frames: "frame(s)",
        targets: "target(s)",
        defer: "defer",
        matched: "TP",
        missed: "FN",
        falsePositive: "FP",
      }
    : {
        kicker: "阶段 1A · 固定帧评估",
        title: "S2 视觉回归实验室",
        intro: "重复运行同一组 20 张暂停画面，将本地 MediaPipe 输出与按产品规则起草的初标对比，并区分不安全投放和保守顺延。",
        caveat: "这里报告的是固定回归集一致率，不代表模型的通用准确率。",
        run: running ? `运行中 ${progress}/${manifest.samples.length}` : report ? "重新运行" : "运行固定集",
        export: "导出 JSON",
        confirmed: "规则明确初标",
        diagnostic: "待确认",
        result: "当前结果",
        expected: "标准答案",
        fixedSamples: "固定样本",
        safeAgreement: "安全位置一致率",
        unsafePlacement: "危险位置误投",
        targetRecall: "保护目标召回率",
        targetPrecision: "保护目标精确率",
        inferenceLatency: "推理耗时",
        modelAvailability: "模型可用性",
        available: "可用",
        unavailable: "不可用",
        frames: "张",
        targets: "个目标",
        defer: "顺延",
        matched: "命中",
        missed: "漏检",
        falsePositive: "误检",
      };

  const formatPlacement = (placement: string) => {
    if (locale === "en") return placement;
    return ({
      none: "不展示",
      "top-left": "左上",
      "top-right": "右上",
      "bottom-left": "左下",
      "bottom-right": "右下",
    } as Record<string, string>)[placement] ?? placement;
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">AdMind</Link>
        <div className={styles.locale} role="group" aria-label="Language / 语言">
          <button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
          <button aria-pressed={locale === "zh"} onClick={() => setLocale("zh")}>中</button>
        </div>
      </header>

      <section className={styles.hero}>
        <p>{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <span>{copy.intro}</span>
        <strong>{copy.caveat}</strong>
        <div className={styles.actions}>
          <button disabled={running} onClick={() => void runRegression()}>{copy.run}</button>
          <button disabled={!report || running} onClick={exportReport}>{copy.export}</button>
        </div>
        <div className={styles.progress} aria-label={copy.run}>
          <i style={{ width: `${(progress / manifest.samples.length) * 100}%` }} />
        </div>
      </section>

      <section className={styles.metrics} aria-live="polite">
        <article><span>{copy.fixedSamples}</span><strong>{manifest.samples.length}</strong><small>{report ? `${report.metrics.blockingSampleCount} ${copy.confirmed} · ${report.metrics.diagnosticSampleCount} ${copy.diagnostic}` : "—"}</small></article>
        <article><span>{copy.modelAvailability}</span><strong>{report ? `${report.metrics.availableSampleCount}/${report.metrics.sampleCount}` : "—"}</strong><small>{report ? `${report.metrics.availableSampleCount} ${copy.available} · ${report.metrics.unavailableCount} ${copy.unavailable}` : "—"}</small></article>
        <article><span>{copy.safeAgreement}</span><strong>{report ? asPercent(report.metrics.safePlacementHitRate) : "—"}</strong><small>{report ? `${report.metrics.safePlacementHits}/${report.metrics.blockingSampleCount}` : "—"}</small></article>
        <article><span>{copy.unsafePlacement}</span><strong>{report ? asPercent(report.metrics.unsafePlacementRate) : "—"}</strong><small>{report ? `${report.metrics.unsafePlacementCount} ${copy.frames}` : "—"}</small></article>
        <article><span>{copy.targetRecall}</span><strong>{report ? asPercent(report.metrics.targetRecall) : "—"}</strong><small>{report ? `${report.metrics.targetTruePositive} ${copy.matched} · ${report.metrics.targetFalseNegative} ${copy.missed}` : "—"}</small></article>
        <article><span>{copy.targetPrecision}</span><strong>{report ? asPercent(report.metrics.targetPrecision) : "—"}</strong><small>{report ? `${report.metrics.targetFalsePositive} ${copy.falsePositive}` : "—"}</small></article>
        <article><span>{copy.inferenceLatency}</span><strong>{report ? `${report.metrics.inferenceP50Ms} ms` : "—"}</strong><small>{report ? `p95 ${report.metrics.inferenceP95Ms} ms` : "—"}</small></article>
      </section>

      <section className={styles.grid}>
        {manifest.samples.map((sample) => {
          const prediction = predictionById.get(sample.id);
          const failed = report?.failures.some((failure) => failure.sampleId === sample.id);
          return (
            <article className={`${styles.card} ${failed ? styles.failed : ""}`} key={sample.id}>
              <div className={styles.frame}>
                {/* A native image is required because MediaPipe consumes the decoded element directly. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={locale === "zh" ? `${sample.id}，${sample.timeSec} 秒` : `${sample.id} at ${sample.timeSec}s`} src={sample.frame} />
                {sample.protectionTargets.map((target) => (
                  <i
                    aria-hidden="true"
                    className={styles.groundTruth}
                    key={target.id}
                    style={{
                      left: `${target.rect.x * 100}%`,
                      top: `${target.rect.y * 100}%`,
                      width: `${target.rect.width * 100}%`,
                      height: `${target.rect.height * 100}%`,
                    }}
                  />
                ))}
                {prediction?.targets.map((target, index) => (
                  <i
                    aria-hidden="true"
                    className={styles.prediction}
                    key={`${target.source}-${index}`}
                    style={{
                      left: `${target.x * 100}%`,
                      top: `${target.y * 100}%`,
                      width: `${target.width * 100}%`,
                      height: `${target.height * 100}%`,
                    }}
                  />
                ))}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}><strong>{sample.id}</strong><span>{sample.timeSec.toFixed(1)}s</span></div>
                <p>{locale === "en" ? sample.note : sample.noteZh}</p>
                <dl>
                  <div><dt>{copy.expected}</dt><dd>{sample.expectedAction === "defer" ? copy.defer : sample.acceptablePlacements.map(formatPlacement).join(" / ")}</dd></div>
                  <div><dt>{copy.result}</dt><dd>{prediction ? `${formatPlacement(prediction.placement)} · ${prediction.targets.length} ${copy.targets}` : "—"}</dd></div>
                </dl>
                <span className={sample.reviewStatus === "rule-confirmed" ? styles.confirmed : styles.review}>
                  {sample.reviewStatus === "rule-confirmed" ? copy.confirmed : copy.diagnostic}
                </span>
              </div>
            </article>
          );
        })}
      </section>
      {report ? <output data-regression-report hidden>{JSON.stringify(report)}</output> : null}
    </main>
  );
}
