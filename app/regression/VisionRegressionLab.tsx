"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import manifestJson from "../../evaluation/s2/manifest.json";
import { detectFacesInRegressionFrame, PAUSE_VISION_CONFIG } from "../lib/face-detector";
import { choosePauseAdPlacementForEvidence } from "../lib/pause-decision";
import {
  scoreVisionRegression,
  type RegressionManifest,
  type RegressionPrediction,
  type RegressionReport,
} from "../lib/pause-regression";
import {
  buildReviewExport,
  canConfirmReview,
  chooseReviewAction,
  confirmReview,
  createReviewWorkspace,
  restoreReviewWorkspace,
  reviewExportFilename,
  reviewableSamples,
  reviewStorageKey,
  revokeReview,
  toggleReviewPlacement,
  type ReviewWorkspaceItem,
} from "../lib/pause-review";
import styles from "./VisionRegressionLab.module.css";

const manifest = manifestJson as RegressionManifest;
const APP_VERSION = "0.4.0";
const priorityReviewSamples = reviewableSamples(manifest);
type SampleFilter = "all" | "needs-review" | "unsafe";

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
  const [sampleFilter, setSampleFilter] = useState<SampleFilter>("needs-review");
  const [showModelOutput, setShowModelOutput] = useState(false);
  const [reviewWorkspace, setReviewWorkspace] = useState(() => createReviewWorkspace(manifest));
  const [reviewReady, setReviewReady] = useState(false);
  const [reviewDownloaded, setReviewDownloaded] = useState(false);

  const predictionById = useMemo(
    () => new Map(report?.predictions.map((prediction) => [prediction.sampleId, prediction]) ?? []),
    [report],
  );

  const unsafeSampleIds = useMemo(
    () => new Set(report?.failures.filter((failure) => failure.kind === "unsafe-placement").map((failure) => failure.sampleId) ?? []),
    [report],
  );

  const confirmedReviewCount = useMemo(
    () => Object.values(reviewWorkspace.items).filter((item) => item.confirmedAt !== null).length,
    [reviewWorkspace],
  );

  const visibleSamples = useMemo(() => {
    if (sampleFilter === "needs-review") return priorityReviewSamples;
    if (sampleFilter === "unsafe") return manifest.samples.filter((sample) => unsafeSampleIds.has(sample.id));
    return manifest.samples;
  }, [sampleFilter, unsafeSampleIds]);

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
        const decision = choosePauseAdPlacementForEvidence(evidence.status, targets, evidence.message);
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
          appVersion: APP_VERSION,
          gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? "working-tree",
          platform: navigator.userAgent,
        },
        configurationReference: {
          appVersion: APP_VERSION,
          gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? "working-tree",
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
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(reviewStorageKey(manifest));
        setReviewWorkspace(restoreReviewWorkspace(manifest, saved ? JSON.parse(saved) : null));
      } catch {
        setReviewWorkspace(createReviewWorkspace(manifest));
      }
      setReviewReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!reviewReady) return;
    try {
      window.localStorage.setItem(reviewStorageKey(manifest), JSON.stringify(reviewWorkspace));
    } catch {
      // The lab remains usable when browser privacy settings disable local storage.
    }
  }, [reviewReady, reviewWorkspace]);

  useEffect(() => {
    if (!localeReady) return;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = locale === "zh" ? "AdMind · S2 视觉回归实验室" : "AdMind · S2 Vision Regression Lab";
    try {
      window.localStorage.setItem("admind-locale", locale);
    } catch {
      // Language switching still works for this session without local storage.
    }
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

  const updateReviewItem = (
    sampleId: string,
    update: (item: ReviewWorkspaceItem) => ReviewWorkspaceItem,
  ) => {
    setReviewDownloaded(false);
    setReviewWorkspace((current) => {
      const item = current.items[sampleId];
      if (!item) return current;
      return { ...current, items: { ...current.items, [sampleId]: update(item) } };
    });
  };

  const exportReview = () => {
    if (confirmedReviewCount === 0) return;
    const generatedAt = new Date().toISOString();
    const review = buildReviewExport(manifest, reviewWorkspace, {
      generatedAt,
      appVersion: APP_VERSION,
      gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? "working-tree",
    });
    const blob = new Blob([`${JSON.stringify(review, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = reviewExportFilename(manifest, generatedAt);
    anchor.href = url;
    anchor.click();
    URL.revokeObjectURL(url);
    setReviewDownloaded(true);
  };

  const copy = locale === "en"
    ? {
        kicker: "STAGE 1B · REVIEW & CALIBRATION",
        title: "S2 Vision Regression Lab",
        intro: "Replay the same 20 paused frames, compare local MediaPipe output with rule-based draft labels, and separate unsafe placement from conservative deferral.",
        caveat: "This is regression-set agreement, not a claim of general model accuracy.",
        run: running ? `Running ${progress}/${manifest.samples.length}` : report ? "Run again" : "Run fixed set",
        exportReport: "Export run JSON",
        confirmed: "blocking agent drafts",
        diagnostic: "diagnostic drafts",
        result: "Model result",
        agentDraft: "Agent draft",
        ruleDraft: "Agent rule draft",
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
        reviewTitle: "Product review queue",
        reviewProgress: `${confirmedReviewCount}/${priorityReviewSamples.length} priority samples confirmed locally`,
        reviewScope: "13 priority samples = 7 original subjective drafts + 6 rule drafts flagged during visual audit.",
        localOnly: "Review choices are saved only in this browser. Nothing is uploaded or written to the repository.",
        baselineNotice: "All green regions and all blocking labels are agent-authored drafts, not human ground truth. Exported review JSON must be validated and committed separately before it can affect the manifest or baseline.",
        exportReview: `${confirmedReviewCount === priorityReviewSamples.length ? "Export complete" : "Export partial"} review JSON (${confirmedReviewCount}/${priorityReviewSamples.length})`,
        downloaded: "Downloaded locally. Nothing was uploaded.",
        currentRun: report ? "Current browser candidate run · not saved as the accepted baseline" : "Run the fixed set to create a browser-local candidate result",
        filterLabel: "Filter samples",
        filterAll: `All ${manifest.samples.length}`,
        filterReview: `Priority review ${priorityReviewSamples.length}`,
        filterUnsafe: report ? `Unsafe placement ${unsafeSampleIds.size}` : "Unsafe placement · run first",
        legendTitle: "Overlay legend",
        legendDraft: "Agent-drafted target reference",
        legendModel: "Current model output",
        legendChoice: "Review choice · prefilled from the agent draft until confirmed",
        showModel: "Show model boxes",
        hideModel: "Hide model boxes",
        modelHidden: "hidden",
        anchoringNote: "Review green targets and blue placement choices first. Reveal purple model boxes afterward to avoid anchoring your answer to the model.",
        guideTitle: "How to confirm a frame",
        guideSteps: [
          "Check whether green regions cover every face, hand, key object, and narrative subject that the ad must not cover.",
          "Select every safe upper corner. If neither corner is safe, choose defer.",
          "If a green region needs adjustment, describe the direction or missing subject in the note.",
          "Confirm, export JSON, then let the maintainer validate and commit it before recalculating the baseline.",
        ],
        trainingNote: "Confirmation does not train the model by itself. It creates trustworthy labels used to diagnose misses, false positives, and unsafe placements, then verify general rule changes against regression and holdout sets.",
        targetStep: "1 · Check the green agent-draft target",
        targetCorrect: "Target is correct",
        targetAdjust: "Target needs adjustment",
        placementStep: "2 · Choose every acceptable outcome",
        allowTopLeft: "Allow top left",
        allowTopRight: "Allow top right",
        noteStep: "3 · Add a review note",
        notePlaceholder: "Briefly explain the decision or required target adjustment.",
        confirmReview: "Confirm decision",
        revokeReview: "Undo confirmation",
        confirmedLocally: "Confirmed locally · pending export",
        awaitingReview: "Priority product review",
        agentRuleOnly: "Agent rule draft · not human-reviewed",
        incompleteReview: "Complete all three steps to confirm.",
        noSamples: "No samples match this filter.",
      }
    : {
        kicker: "阶段 1B · 人工复核与校准",
        title: "S2 视觉回归实验室",
        intro: "重复运行同一组 20 张暂停画面，将本地 MediaPipe 输出与按产品规则起草的初标对比，并区分不安全投放和保守顺延。",
        caveat: "这里报告的是固定回归集一致率，不代表模型的通用准确率。",
        run: running ? `运行中 ${progress}/${manifest.samples.length}` : report ? "重新运行" : "运行固定集",
        exportReport: "导出运行 JSON",
        confirmed: "阻断统计初标",
        diagnostic: "诊断初标",
        result: "模型结果",
        agentDraft: "代理初标",
        ruleDraft: "代理规则初标",
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
        reviewTitle: "产品负责人复核队列",
        reviewProgress: `优先样本已在本地确认 ${confirmedReviewCount}/${priorityReviewSamples.length}`,
        reviewScope: "13 张优先样本 = 原有 7 张主观初标 + 视觉审计新发现的 6 张争议规则初标。",
        localOnly: "审核选择只保存在当前浏览器，不会上传，也不会写入仓库。",
        baselineNotice: "全部绿色区域和阻断标签都是代理起草的初标，不是人工标准答案。导出的审核 JSON 必须另行校验并提交，之后才可能影响 manifest 或基线。",
        exportReview: `${confirmedReviewCount === priorityReviewSamples.length ? "导出完整" : "导出部分"}审核 JSON（${confirmedReviewCount}/${priorityReviewSamples.length}）`,
        downloaded: "已下载到本地，没有上传任何内容。",
        currentRun: report ? "当前浏览器候选运行 · 尚未写入已接受基线" : "运行固定集后，会生成仅存在当前浏览器的候选结果",
        filterLabel: "筛选样本",
        filterAll: `全部 ${manifest.samples.length}`,
        filterReview: `优先复核 ${priorityReviewSamples.length}`,
        filterUnsafe: report ? `危险误投 ${unsafeSampleIds.size}` : "危险误投 · 请先运行",
        legendTitle: "框线图例",
        legendDraft: "代理起草的保护目标参考",
        legendModel: "当前模型输出",
        legendChoice: "当前复核选择 · 确认前由代理初标预填",
        showModel: "显示模型框",
        hideModel: "隐藏模型框",
        modelHidden: "已隐藏",
        anchoringNote: "请先盲审绿色保护框和蓝色位置选择，之后再显示紫色模型框，避免模型结果锚定你的判断。",
        guideTitle: "人工确认怎么做",
        guideSteps: [
          "检查绿色区域是否覆盖所有不应被广告遮挡的脸、手、关键物体和叙事主体。",
          "勾选所有安全的上方角落；两个角落都不安全就选择顺延。",
          "如果绿色框需要调整，在备注里写清方向或遗漏的主体。",
          "确认并导出 JSON；维护者校验并提交后，才会重新计算正式基线。",
        ],
        trainingNote: "确认本身不会自动训练模型；它先建立可信标签，再用来定位漏检、误检和危险误投，并通过回归集与留出集验证通用规则改进。",
        targetStep: "1 · 检查绿色代理初标保护框",
        targetCorrect: "保护框正确",
        targetAdjust: "保护框需要调整",
        placementStep: "2 · 选择全部可接受结果",
        allowTopLeft: "允许左上",
        allowTopRight: "允许右上",
        noteStep: "3 · 填写复核备注",
        notePlaceholder: "简要说明决定，或描述保护框需要如何调整。",
        confirmReview: "确认决定",
        revokeReview: "撤销确认",
        confirmedLocally: "已在本地确认 · 等待导出",
        awaitingReview: "优先等待产品负责人复核",
        agentRuleOnly: "代理规则初标 · 尚未人工审核",
        incompleteReview: "完成三个步骤后才能确认。",
        noSamples: "没有符合当前筛选条件的样本。",
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
          <button disabled={!report || running} onClick={exportReport}>{copy.exportReport}</button>
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
      <p className={styles.runStatus}>{copy.currentRun}</p>

      <section className={styles.reviewPanel} aria-labelledby="review-heading">
        <div>
          <p>{copy.reviewProgress}</p>
          <h2 id="review-heading">{copy.reviewTitle}</h2>
          <span>{copy.reviewScope}</span>
          <span>{copy.localOnly}</span>
          <small>{copy.baselineNotice}</small>
        </div>
        <div className={styles.reviewExport}>
          <button disabled={confirmedReviewCount === 0} onClick={exportReview}>{copy.exportReview}</button>
          {reviewDownloaded ? <output aria-live="polite">{copy.downloaded}</output> : null}
        </div>
      </section>

      <section className={styles.reviewGuide} aria-labelledby="review-guide-heading">
        <div>
          <h2 id="review-guide-heading">{copy.guideTitle}</h2>
          <ol>{copy.guideSteps.map((step) => <li key={step}>{step}</li>)}</ol>
        </div>
        <p>{copy.trainingNote}</p>
      </section>

      <section className={styles.inspectionTools}>
        <div className={styles.legend} aria-label={copy.legendTitle}>
          <strong>{copy.legendTitle}</strong>
          <span><i className={styles.legendDraft} />{copy.legendDraft}</span>
          <span><i className={styles.legendModel} />{copy.legendModel}</span>
          <span><i className={styles.legendChoice} />{copy.legendChoice}</span>
          <small>{copy.anchoringNote}</small>
        </div>
        <button
          aria-pressed={showModelOutput}
          className={styles.modelToggle}
          disabled={!report}
          onClick={() => setShowModelOutput((visible) => !visible)}
        >
          {showModelOutput ? copy.hideModel : copy.showModel}
        </button>
      </section>

      <nav className={styles.filters} aria-label={copy.filterLabel}>
        <button aria-pressed={sampleFilter === "all"} onClick={() => setSampleFilter("all")}>{copy.filterAll}</button>
        <button aria-pressed={sampleFilter === "needs-review"} onClick={() => setSampleFilter("needs-review")}>{copy.filterReview}</button>
        <button
          aria-pressed={sampleFilter === "unsafe"}
          disabled={!report}
          onClick={() => setSampleFilter("unsafe")}
        >
          {copy.filterUnsafe}
        </button>
      </nav>

      <section className={styles.grid}>
        {visibleSamples.map((sample) => {
          const prediction = predictionById.get(sample.id);
          const failed = report?.failures.some((failure) => failure.sampleId === sample.id);
          const reviewItem = reviewWorkspace.items[sample.id];
          const reviewConfirmed = reviewItem?.confirmedAt !== null;
          return (
            <article
              className={`${styles.card} ${failed ? styles.failed : ""} ${reviewConfirmed ? styles.reviewedCard : ""}`}
              key={sample.id}
            >
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
                {showModelOutput ? prediction?.targets.map((target, index) => (
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
                )) : null}
                {reviewItem?.action === "show-card" ? reviewItem.acceptablePlacements.map((placement) => {
                  const footprint = manifest.annotationPolicy.renderedCreativeFootprint;
                  const x = placement === "top-left" ? 0.025 : 1 - 0.025 - footprint.width;
                  return (
                    <i
                      aria-hidden="true"
                      className={styles.reviewPlacement}
                      key={placement}
                      style={{
                        left: `${x * 100}%`,
                        top: "5.5%",
                        width: `${footprint.width * 100}%`,
                        height: `${footprint.height * 100}%`,
                      }}
                    />
                  );
                }) : null}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>
                  <strong>{sample.id}</strong>
                  <span>{sample.timeSec.toFixed(1)}{locale === "zh" ? " 秒" : "s"}</span>
                </div>
                <p>{locale === "en" ? sample.note : sample.noteZh}</p>
                <dl>
                  <div>
                    <dt>{reviewItem ? copy.agentDraft : copy.ruleDraft}</dt>
                    <dd>{sample.expectedAction === "defer" ? copy.defer : sample.acceptablePlacements.map(formatPlacement).join(" / ")}</dd>
                  </div>
                  <div>
                    <dt>{copy.result}</dt>
                    <dd>{showModelOutput ? (prediction ? `${formatPlacement(prediction.placement)} · ${prediction.targets.length} ${copy.targets}` : "—") : copy.modelHidden}</dd>
                  </div>
                </dl>
                <span className={reviewItem ? (reviewConfirmed ? styles.reviewed : styles.review) : styles.confirmed}>
                  {reviewItem ? (reviewConfirmed ? copy.confirmedLocally : copy.awaitingReview) : copy.agentRuleOnly}
                </span>

                {reviewItem ? (
                  <section className={styles.reviewForm} aria-label={`${sample.id} ${copy.reviewTitle}`}>
                    <fieldset disabled={reviewConfirmed}>
                      <legend>{copy.targetStep}</legend>
                      <div className={styles.reviewChoices}>
                        <button
                          aria-pressed={reviewItem.targetAssessment === "correct"}
                          onClick={() => updateReviewItem(sample.id, (item) => ({ ...item, targetAssessment: "correct", confirmedAt: null }))}
                          type="button"
                        >
                          {copy.targetCorrect}
                        </button>
                        <button
                          aria-pressed={reviewItem.targetAssessment === "needs-adjustment"}
                          onClick={() => updateReviewItem(sample.id, (item) => ({ ...item, targetAssessment: "needs-adjustment", confirmedAt: null }))}
                          type="button"
                        >
                          {copy.targetAdjust}
                        </button>
                      </div>
                    </fieldset>

                    <fieldset disabled={reviewConfirmed}>
                      <legend>{copy.placementStep}</legend>
                      <div className={styles.reviewChoices}>
                        <button
                          aria-pressed={reviewItem.action === "show-card" && reviewItem.acceptablePlacements.includes("top-left")}
                          onClick={() => updateReviewItem(sample.id, (item) => toggleReviewPlacement(item, "top-left"))}
                          type="button"
                        >
                          {copy.allowTopLeft}
                        </button>
                        <button
                          aria-pressed={reviewItem.action === "show-card" && reviewItem.acceptablePlacements.includes("top-right")}
                          onClick={() => updateReviewItem(sample.id, (item) => toggleReviewPlacement(item, "top-right"))}
                          type="button"
                        >
                          {copy.allowTopRight}
                        </button>
                        <button
                          aria-pressed={reviewItem.action === "defer"}
                          onClick={() => updateReviewItem(sample.id, (item) => chooseReviewAction(item, "defer"))}
                          type="button"
                        >
                          {copy.defer}
                        </button>
                      </div>
                    </fieldset>

                    <label className={styles.reviewNote}>
                      <span>{copy.noteStep}</span>
                      <textarea
                        disabled={reviewConfirmed}
                        maxLength={500}
                        onChange={(event) => updateReviewItem(sample.id, (item) => ({ ...item, note: event.target.value, confirmedAt: null }))}
                        placeholder={copy.notePlaceholder}
                        rows={3}
                        value={reviewItem.note}
                      />
                    </label>

                    <div className={styles.reviewActions}>
                      {reviewConfirmed ? (
                        <button onClick={() => updateReviewItem(sample.id, revokeReview)} type="button">{copy.revokeReview}</button>
                      ) : (
                        <button
                          disabled={!canConfirmReview(reviewItem)}
                          onClick={() => updateReviewItem(sample.id, (item) => confirmReview(item, new Date().toISOString()))}
                          type="button"
                        >
                          {copy.confirmReview}
                        </button>
                      )}
                      {!reviewConfirmed && !canConfirmReview(reviewItem) ? <small>{copy.incompleteReview}</small> : null}
                    </div>
                  </section>
                ) : null}
              </div>
            </article>
          );
        })}
        {visibleSamples.length === 0 ? <p className={styles.empty}>{copy.noSamples}</p> : null}
      </section>
      {report ? <output data-regression-report hidden>{JSON.stringify(report)}</output> : null}
    </main>
  );
}
