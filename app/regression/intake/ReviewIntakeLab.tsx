"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { ChangeEvent } from "react";
import candidateJson from "../../../evaluation/s2/candidates/v0.4.0.json";
import manifestJson from "../../../evaluation/s2/manifest.json";
import sourceReviewJson from "../../../evaluation/s2/reviews/2026-08-22-product-owner.json";
import type { ProtectionCalibrationSeed, S2ReviewExport } from "../../lib/pause-review";
import type { RegressionManifest } from "../../lib/pause-regression";
import {
  S2_CALIBRATION_DRAFTS,
  S2_PLACEMENT_RESOLUTION,
  S2_SOURCE_REVIEW,
} from "../../lib/s2-calibration-seed";
import {
  intakeS2ReviewedCalibration,
  type ReviewedRegressionComparison,
  type S2ReviewIntakeResult,
} from "../../lib/s2-review-intake";
import styles from "./ReviewIntakeLab.module.css";

const manifest = manifestJson as RegressionManifest;
const sourceReview = sourceReviewJson as S2ReviewExport;
const rawPredictionReport: unknown = candidateJson;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const calibrationSeed: ProtectionCalibrationSeed = {
  suggestions: S2_CALIBRATION_DRAFTS.map((draft) => ({
    sampleId: draft.sampleId,
    replacementProtectionTargets: draft.replacementProtectionTargets,
  })),
  placementResolutions: S2_PLACEMENT_RESOLUTION,
};

type Locale = "en" | "zh";
type ReadFailure = "too-large" | "invalid-json" | "read-error";
type IntakeUiState =
  | { kind: "idle" }
  | { kind: "reading"; fileName: string }
  | { kind: "read-failure"; fileName: string; failure: ReadFailure }
  | { kind: "result"; fileName: string; result: S2ReviewIntakeResult };

type MetricKey = keyof ReviewedRegressionComparison["delta"];
type MetricFormat = "count" | "percent" | "milliseconds";
type MetricDefinition = {
  key: MetricKey;
  format: MetricFormat;
  label: Record<Locale, string>;
};

const METRIC_GROUPS: Array<{
  title: Record<Locale, string>;
  metrics: MetricDefinition[];
}> = [
  {
    title: { en: "Evaluation scope", zh: "评估范围" },
    metrics: [
      { key: "sampleCount", format: "count", label: { en: "All samples", zh: "全部样本" } },
      { key: "blockingSampleCount", format: "count", label: { en: "Blocking labels", zh: "阻断标签" } },
      { key: "diagnosticSampleCount", format: "count", label: { en: "Diagnostic only", zh: "仅诊断样本" } },
      { key: "availableSampleCount", format: "count", label: { en: "Available predictions", zh: "可用预测" } },
      { key: "availableBlockingSampleCount", format: "count", label: { en: "Available blocking labels", zh: "可用阻断标签" } },
      { key: "unavailableCount", format: "count", label: { en: "Unavailable predictions", zh: "不可用预测" } },
    ],
  },
  {
    title: { en: "Placement decisions", zh: "广告位决策" },
    metrics: [
      { key: "safePlacementHits", format: "count", label: { en: "Accepted placements", zh: "可接受广告位" } },
      { key: "safePlacementHitRate", format: "percent", label: { en: "Accepted placement rate", zh: "广告位命中率" } },
      { key: "unsafePlacementCount", format: "count", label: { en: "Unsafe placements", zh: "不安全广告位" } },
      { key: "unsafePlacementRate", format: "percent", label: { en: "Unsafe placement rate", zh: "不安全广告位占比" } },
      { key: "overDeferralCount", format: "count", label: { en: "Over-deferrals", zh: "过度顺延" } },
      { key: "overDeferralRate", format: "percent", label: { en: "Over-deferral rate", zh: "过度顺延占比" } },
    ],
  },
  {
    title: { en: "Protected-target agreement", zh: "保护目标一致性" },
    metrics: [
      { key: "targetTruePositive", format: "count", label: { en: "Target true positives", zh: "目标真阳性" } },
      { key: "targetFalsePositive", format: "count", label: { en: "Target false positives", zh: "目标假阳性" } },
      { key: "targetFalseNegative", format: "count", label: { en: "Target false negatives", zh: "目标假阴性" } },
      { key: "targetPrecision", format: "percent", label: { en: "Target precision", zh: "目标精确率" } },
      { key: "targetRecall", format: "percent", label: { en: "Target recall", zh: "目标召回率" } },
      { key: "targetF1", format: "percent", label: { en: "Target F1", zh: "目标 F1" } },
    ],
  },
  {
    title: { en: "Saved-run timing", zh: "已保存运行耗时" },
    metrics: [
      { key: "inferenceP50Ms", format: "milliseconds", label: { en: "Inference P50", zh: "推理 P50" } },
      { key: "inferenceP95Ms", format: "milliseconds", label: { en: "Inference P95", zh: "推理 P95" } },
    ],
  },
];

const PENDING_LABELS: Record<string, Record<Locale, string>> = {
  "source-review-missing": { en: "Source review is missing", zh: "缺少第一轮复核文件" },
  "source-review-sha256-missing": { en: "Source review SHA-256 is missing", zh: "缺少第一轮复核 SHA-256" },
  "calibration-seed-missing": { en: "Trusted calibration seed is missing", zh: "缺少可信校准种子" },
  "calibration-artifact-missing": { en: "Schema-v2 calibration file is missing", zh: "缺少 schema-v2 校准文件" },
  "calibration-artifact-sha256-missing": { en: "Calibration file SHA-256 is missing", zh: "缺少校准文件 SHA-256" },
  "source-review-incomplete": { en: "Source review is incomplete", zh: "第一轮复核尚未完成" },
  "calibration-artifact-incomplete": { en: "Calibration still has unconfirmed items", zh: "校准文件仍有未确认项目" },
  "raw-predictions-missing": { en: "Saved raw predictions are missing", zh: "缺少已保存的原始预测" },
};

function normalizeDelta(value: number) {
  return Math.abs(value) < 1e-12 ? 0 : value;
}

function formatMetric(value: number, format: MetricFormat, locale: Locale) {
  if (format === "percent") return `${(value * 100).toFixed(1)}%`;
  if (format === "milliseconds") return `${value.toFixed(1)} ms`;
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", { maximumFractionDigits: 2 }).format(value);
}

function formatMetricDelta(value: number, format: MetricFormat, locale: Locale) {
  const normalized = normalizeDelta(value);
  const sign = normalized > 0 ? "+" : "";
  if (format === "percent") return `${sign}${(normalized * 100).toFixed(1)} pp`;
  if (format === "milliseconds") return `${sign}${normalized.toFixed(1)} ms`;
  return `${sign}${new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", { maximumFractionDigits: 2 }).format(normalized)}`;
}

function downloadJson(value: unknown, fileName: string) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.download = fileName;
  anchor.href = url;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function ReviewIntakeLab() {
  const [locale, setLocale] = useState<Locale>("en");
  const [state, setState] = useState<IntakeUiState>({ kind: "idle" });
  const [downloaded, setDownloaded] = useState<"preview" | "rescore" | null>(null);
  const inputId = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setLocale(window.localStorage.getItem("admind-locale") === "zh" ? "zh" : "en");
      } catch {
        // English remains the deterministic default when storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = locale === "zh" ? "AdMind · S2 人工标签接收" : "AdMind · S2 Reviewed Label Intake";
    try {
      window.localStorage.setItem("admind-locale", locale);
    } catch {
      // Language switching still works for this browser session.
    }
  }, [locale]);

  const copy = locale === "en" ? {
    eyebrow: "STAGE 1B · REVIEWED LABEL INTAKE",
    title: "Validate first. Merge nothing automatically.",
    intro: "Select the schema-v2 JSON exported from the calibration workspace. AdMind validates its source binding, review signatures, eight target corrections, and three placement resolutions before building an in-memory preview.",
    localOnly: "Local browser processing",
    noUpload: "The selected file never leaves this page.",
    noOverwrite: "Preview only",
    immutable: "The tracked manifest is never overwritten.",
    noInference: "Label-only rescore",
    reused: "Saved v0.4 raw predictions are reused; the detector is not run again.",
    regression: "Regression lab",
    calibration: "Calibration workspace",
    home: "Main site",
    choose: "Choose schema-v2 JSON",
    chooseHelp: "Maximum 2 MB · JSON only · processed locally",
    emptyFile: "No file selected",
    replace: "Choose another file",
    status: "Intake status",
    pending: "Pending",
    pendingBody: "Select the final schema-v2 export to begin strict local validation. No review decision has been assumed.",
    reading: "Reading locally…",
    invalid: "Rejected",
    invalidBody: "The file did not satisfy the complete, source-bound schema-v2 contract. Nothing was merged or rescored.",
    partial: "Still pending",
    partialBody: "The file is structurally valid, but required human confirmations are still missing.",
    ready: "Validated preview ready",
    readyBody: "The complete artifact passed strict validation. The results below exist only in memory until you download them.",
    technicalIssues: "Exact validator output",
    pendingItems: "Pending requirements",
    pendingSamples: "Unconfirmed sample IDs",
    tooLarge: "The selected file is larger than the 2 MB local safety limit.",
    invalidJson: "The selected file is not valid JSON.",
    readError: "The browser could not read or evaluate this file.",
    previewTitle: "Reviewed-manifest preview",
    previewIntro: "This preview applies only confirmed product-review decisions. Seven samples outside the review queue remain diagnostic and are not promoted to human truth.",
    baseDataset: "Tracked dataset",
    previewDataset: "Preview dataset",
    reviewed: "Human-reviewed labels",
    remaining: "Still unreviewed",
    targetChanges: "Target replacements",
    placementChanges: "Placement resolutions",
    sourceHash: "Bound source SHA-256",
    calibrationHash: "Calibration file SHA-256",
    generated: "Calibration generated",
    reviewedIds: "Reviewed sample IDs",
    pendingIds: "Still-unreviewed sample IDs",
    downloadPreview: "Download preview JSON",
    downloadRescore: "Download rescore JSON",
    downloadedPreview: "Preview JSON downloaded locally.",
    downloadedRescore: "Rescore JSON downloaded locally.",
    rescoreTitle: "Before / after label rescore",
    rescoreIntro: "Both columns score the same saved v0.4 raw predictions. Differences come from the reviewed label set, target boxes, and acceptable placements—not from a newer detector run.",
    before: "Before",
    after: "After",
    delta: "Delta",
    scopeTitle: "Scoring scope changed",
    scopeBody: "A positive delta is not automatically an improvement, and a negative delta is not automatically a regression. The blocking label population changed after human review.",
    addedBlocking: "Added to blocking scope",
    removedBlocking: "Removed from blocking scope",
    rawSource: "Raw prediction source",
    runner: "Saved runner",
    failuresTitle: "Failure-set delta",
    resolvedFailures: "Resolved under reviewed labels",
    introducedFailures: "Introduced under reviewed labels",
    none: "None",
    expected: "Expected",
    actual: "Actual",
    privacyFooter: "No network request, upload, training job, commit, or manifest write is triggered by this page.",
  } : {
    eyebrow: "阶段 1B · 人工标签接收",
    title: "先严格验证，不自动合并任何内容。",
    intro: "请选择校准工作区导出的 schema-v2 JSON。AdMind 会先验证来源绑定、复核签名、8 项目标框修正与 3 项广告位裁决，再在内存中生成预览。",
    localOnly: "仅在浏览器本地处理",
    noUpload: "所选文件不会离开当前页面。",
    noOverwrite: "仅生成预览",
    immutable: "不会覆盖仓库中受追踪的 manifest。",
    noInference: "仅按新标签重评分",
    reused: "复用已保存的 v0.4 原始预测，不会重新运行检测器。",
    regression: "回归实验室",
    calibration: "校准工作区",
    home: "返回主站",
    choose: "选择 schema-v2 JSON",
    chooseHelp: "最大 2 MB · 仅限 JSON · 全程本地处理",
    emptyFile: "尚未选择文件",
    replace: "重新选择文件",
    status: "接收状态",
    pending: "等待文件",
    pendingBody: "请选择最终 schema-v2 导出文件以开始严格本地验证。当前没有推定任何人工结论。",
    reading: "正在本地读取……",
    invalid: "已拒绝",
    invalidBody: "该文件未通过完整且绑定来源的 schema-v2 合同。没有合并，也没有重评分。",
    partial: "仍待完成",
    partialBody: "文件结构有效，但仍缺少必要的人工确认。",
    ready: "验证通过，预览已就绪",
    readyBody: "完整文件已通过严格验证。下方结果只存在于内存中，除非你主动下载。",
    technicalIssues: "验证器原始输出",
    pendingItems: "待完成要求",
    pendingSamples: "未确认样本 ID",
    tooLarge: "所选文件超过 2 MB 的本地安全限制。",
    invalidJson: "所选文件不是有效 JSON。",
    readError: "浏览器无法读取或评估该文件。",
    previewTitle: "人工复核 manifest 预览",
    previewIntro: "此预览只应用已经确认的产品复核结论。复核队列以外的 7 个样本仍为诊断样本，不会被冒充为人工真值。",
    baseDataset: "受追踪数据集",
    previewDataset: "预览数据集",
    reviewed: "已人工复核标签",
    remaining: "仍未人工复核",
    targetChanges: "目标框替换",
    placementChanges: "广告位裁决",
    sourceHash: "绑定来源 SHA-256",
    calibrationHash: "校准文件 SHA-256",
    generated: "校准生成时间",
    reviewedIds: "已复核样本 ID",
    pendingIds: "仍未复核样本 ID",
    downloadPreview: "下载预览 JSON",
    downloadRescore: "下载重评分 JSON",
    downloadedPreview: "预览 JSON 已下载到本地。",
    downloadedRescore: "重评分 JSON 已下载到本地。",
    rescoreTitle: "标签重评分前后对比",
    rescoreIntro: "前后两列使用完全相同的 v0.4 已保存原始预测。差异来自人工复核后的标签范围、保护框和可接受广告位，而不是重新运行了检测器。",
    before: "调整前",
    after: "调整后",
    delta: "变化量",
    scopeTitle: "评分范围发生了变化",
    scopeBody: "正数不一定代表改进，负数也不一定代表回归；人工复核后，用于阻断发布的标签样本集合发生了变化。",
    addedBlocking: "加入阻断范围",
    removedBlocking: "移出阻断范围",
    rawSource: "原始预测来源",
    runner: "已保存运行器",
    failuresTitle: "失败项变化",
    resolvedFailures: "按复核标签已消除",
    introducedFailures: "按复核标签新增",
    none: "无",
    expected: "预期",
    actual: "实际",
    privacyFooter: "本页面不会触发网络请求、文件上传、模型训练、Git 提交或 manifest 写入。",
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setDownloaded(null);
    if (!file) {
      setState({ kind: "idle" });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setState({ kind: "read-failure", fileName: file.name, failure: "too-large" });
      return;
    }
    setState({ kind: "reading", fileName: file.name });
    try {
      const bytes = await file.arrayBuffer();
      const artifactSha256 = await sha256Hex(bytes);
      const artifact: unknown = JSON.parse(new TextDecoder().decode(bytes));
      const result = intakeS2ReviewedCalibration({
        manifest,
        sourceReview,
        sourceReviewSha256: S2_SOURCE_REVIEW.sha256,
        calibrationSeed,
        calibrationArtifact: artifact,
        calibrationArtifactSha256: artifactSha256,
        rawPredictionReport,
        generatedAt: new Date().toISOString(),
      });
      setState({ kind: "result", fileName: file.name, result });
    } catch (error) {
      setState({
        kind: "read-failure",
        fileName: file.name,
        failure: error instanceof SyntaxError ? "invalid-json" : "read-error",
      });
    }
  };

  const result = state.kind === "result" ? state.result : null;
  const readyResult = result?.status === "ready" && result.stage === "rescoring" ? result : null;
  const fileName = state.kind === "idle" ? null : state.fileName;

  const statusContent = (() => {
    if (state.kind === "idle") return { tone: "pending", title: copy.pending, body: copy.pendingBody };
    if (state.kind === "reading") return { tone: "pending", title: copy.reading, body: fileName ?? "" };
    if (state.kind === "read-failure") {
      const body = state.failure === "too-large" ? copy.tooLarge : state.failure === "invalid-json" ? copy.invalidJson : copy.readError;
      return { tone: "invalid", title: copy.invalid, body };
    }
    if (state.result.status === "invalid") return { tone: "invalid", title: copy.invalid, body: copy.invalidBody };
    if (state.result.status === "pending") return { tone: "pending", title: copy.partial, body: copy.partialBody };
    return { tone: "ready", title: copy.ready, body: copy.readyBody };
  })();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">AdMind</Link>
        <nav>
          <Link href="/regression">{copy.regression}</Link>
          <Link href="/regression/calibrate">{copy.calibration}</Link>
          <Link href="/">{copy.home}</Link>
        </nav>
        <div className={styles.locale} role="group" aria-label="Language / 语言">
          <button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
          <button aria-pressed={locale === "zh"} onClick={() => setLocale("zh")}>中</button>
        </div>
      </header>

      <section className={styles.hero}>
        <p>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{copy.intro}</span>
      </section>

      <section className={styles.safetyGrid} aria-label={locale === "zh" ? "安全边界" : "Safety boundaries"}>
        <article><b>01</b><div><strong>{copy.localOnly}</strong><span>{copy.noUpload}</span></div></article>
        <article><b>02</b><div><strong>{copy.noOverwrite}</strong><span>{copy.immutable}</span></div></article>
        <article><b>03</b><div><strong>{copy.noInference}</strong><span>{copy.reused}</span></div></article>
      </section>

      <section className={styles.intakePanel}>
        <div className={styles.filePicker}>
          <div>
            <strong>{fileName ?? copy.emptyFile}</strong>
            <span>{copy.chooseHelp}</span>
          </div>
          <label htmlFor={inputId}>{fileName ? copy.replace : copy.choose}</label>
          <input
            accept=".json,application/json"
            id={inputId}
            onChange={(event) => void handleFile(event)}
            type="file"
          />
        </div>
        <div
          aria-live="polite"
          className={`${styles.statusCard} ${statusContent.tone === "ready" ? styles.statusReady : statusContent.tone === "invalid" ? styles.statusInvalid : styles.statusPending}`}
        >
          <small>{copy.status}</small>
          <strong>{statusContent.title}</strong>
          <p>{statusContent.body}</p>
          {result?.status === "pending" ? (
            <div className={styles.issueBlock}>
              <b>{copy.pendingItems}</b>
              <ul>{result.pending.map((item) => <li key={item}>{PENDING_LABELS[item]?.[locale] ?? item}</li>)}</ul>
              {result.stage === "review-intake" && result.pendingSampleIds.length > 0
                ? <p><b>{copy.pendingSamples}:</b> {result.pendingSampleIds.join(", ")}</p>
                : null}
            </div>
          ) : null}
          {result?.status === "invalid" ? (
            <details className={styles.issueBlock} open>
              <summary>{copy.technicalIssues}</summary>
              <ul>{result.issues.map((issue, index) => <li key={`${issue}-${index}`}><code>{issue}</code></li>)}</ul>
            </details>
          ) : null}
        </div>
      </section>

      {readyResult ? (
        <>
          <section className={styles.previewSection}>
            <div className={styles.sectionHeading}>
              <div><p>{copy.previewTitle}</p><span>{copy.previewIntro}</span></div>
              <div className={styles.downloadRow}>
                <button onClick={() => {
                  downloadJson(readyResult.preview, `${readyResult.preview.manifest.datasetId}.json`);
                  setDownloaded("preview");
                }}>{copy.downloadPreview}</button>
                <button onClick={() => {
                  downloadJson(readyResult.comparison, `${readyResult.preview.manifest.datasetId}-rescore.json`);
                  setDownloaded("rescore");
                }}>{copy.downloadRescore}</button>
              </div>
            </div>
            {downloaded ? <output className={styles.downloadNotice}>{downloaded === "preview" ? copy.downloadedPreview : copy.downloadedRescore}</output> : null}
            <div className={styles.previewGrid}>
              <PreviewFact label={copy.baseDataset} value={readyResult.preview.baseManifest.datasetId} />
              <PreviewFact label={copy.previewDataset} value={readyResult.preview.manifest.datasetId} />
              <PreviewFact label={copy.reviewed} value={`${readyResult.preview.humanReviewedSampleIds.length}/${readyResult.preview.manifest.samples.length}`} />
              <PreviewFact label={copy.remaining} value={`${readyResult.preview.pendingHumanReviewSampleIds.length}/${readyResult.preview.manifest.samples.length}`} />
              <PreviewFact label={copy.targetChanges} value={String(readyResult.preview.appliedTargetSampleIds.length)} />
              <PreviewFact label={copy.placementChanges} value={String(readyResult.preview.appliedPlacementSampleIds.length)} />
              <PreviewFact label={copy.sourceHash} value={readyResult.preview.sourceReview.sha256} wide />
              <PreviewFact label={copy.generated} value={new Date(readyResult.preview.calibrationArtifact.generatedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")} />
              <PreviewFact label={copy.calibrationHash} value={readyResult.preview.calibrationArtifact.sha256} />
            </div>
            <div className={styles.idLists}>
              <div><b>{copy.reviewedIds}</b><span>{readyResult.preview.humanReviewedSampleIds.join(" · ")}</span></div>
              <div><b>{copy.pendingIds}</b><span>{readyResult.preview.pendingHumanReviewSampleIds.join(" · ")}</span></div>
            </div>
          </section>

          <section className={styles.rescoreSection}>
            <div className={styles.sectionHeading}>
              <div><p>{copy.rescoreTitle}</p><span>{copy.rescoreIntro}</span></div>
            </div>
            <aside className={styles.scopeNotice}>
              <strong>{copy.scopeTitle}</strong>
              <p>{copy.scopeBody}</p>
              <div>
                <span><b>{copy.addedBlocking}:</b> {readyResult.comparison.scoringScope.addedBlockingSampleIds.join(" · ") || copy.none}</span>
                <span><b>{copy.removedBlocking}:</b> {readyResult.comparison.scoringScope.removedBlockingSampleIds.join(" · ") || copy.none}</span>
              </div>
            </aside>
            <div className={styles.sourceRow}>
              <span><b>{copy.rawSource}:</b> {readyResult.comparison.rawPredictionSource.datasetId} · {readyResult.comparison.rawPredictionSource.generatedAt}</span>
              <span><b>{copy.runner}:</b> {readyResult.comparison.rawPredictionSource.runner.appVersion} · {readyResult.comparison.rawPredictionSource.runner.gitCommit} · {readyResult.comparison.rawPredictionSource.runner.platform}</span>
            </div>
            {METRIC_GROUPS.map((group) => (
              <section className={styles.metricGroup} key={group.title.en}>
                <h2>{group.title[locale]}</h2>
                <div className={styles.metricGrid}>
                  {group.metrics.map((metric) => {
                    const values = readyResult.comparison.delta[metric.key];
                    return (
                      <article className={styles.metricCard} key={metric.key}>
                        <strong>{metric.label[locale]}</strong>
                        <dl>
                          <div><dt>{copy.before}</dt><dd>{formatMetric(values.before, metric.format, locale)}</dd></div>
                          <div><dt>{copy.after}</dt><dd>{formatMetric(values.after, metric.format, locale)}</dd></div>
                          <div><dt>{copy.delta}</dt><dd>{formatMetricDelta(values.delta, metric.format, locale)}</dd></div>
                        </dl>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </section>

          <section className={styles.failuresSection}>
            <div className={styles.sectionHeading}><div><p>{copy.failuresTitle}</p></div></div>
            <div className={styles.failureColumns}>
              <FailureList
                actualLabel={copy.actual}
                emptyLabel={copy.none}
                expectedLabel={copy.expected}
                failures={readyResult.comparison.resolvedFailures}
                title={copy.resolvedFailures}
              />
              <FailureList
                actualLabel={copy.actual}
                emptyLabel={copy.none}
                expectedLabel={copy.expected}
                failures={readyResult.comparison.introducedFailures}
                title={copy.introducedFailures}
              />
            </div>
          </section>
        </>
      ) : null}

      <footer className={styles.footer}>{copy.privacyFooter}</footer>
    </main>
  );
}

function PreviewFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? styles.previewFactWide : undefined}><span>{label}</span><strong>{value}</strong></div>;
}

function FailureList({
  actualLabel,
  emptyLabel,
  expectedLabel,
  failures,
  title,
}: {
  actualLabel: string;
  emptyLabel: string;
  expectedLabel: string;
  failures: ReviewedRegressionComparison["resolvedFailures"];
  title: string;
}) {
  return (
    <article>
      <h2>{title} <small>{failures.length}</small></h2>
      {failures.length === 0 ? <p>{emptyLabel}</p> : (
        <ul>
          {failures.map((failure, index) => (
            <li key={`${failure.sampleId}-${failure.kind}-${index}`}>
              <div><strong>{failure.sampleId}</strong><code>{failure.kind}</code></div>
              <span><b>{expectedLabel}:</b> {failure.expected}</span>
              <span><b>{actualLabel}:</b> {failure.actual}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
