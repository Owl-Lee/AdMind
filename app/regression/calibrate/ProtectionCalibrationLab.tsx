"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import manifestJson from "../../../evaluation/s2/manifest.json";
import sourceReviewJson from "../../../evaluation/s2/reviews/2026-08-22-product-owner.json";
import { choosePauseAdPlacement, type NormalizedRect } from "../../lib/pause-decision";
import type { RegressionManifest, RegressionTarget } from "../../lib/pause-regression";
import {
  addReplacementProtectionTarget,
  buildProtectionCalibrationExport,
  canConfirmPlacementResolution,
  canConfirmProtectionCalibration,
  confirmPlacementResolution,
  confirmProtectionCalibration,
  createProtectionCalibrationWorkspace,
  deleteReplacementProtectionTarget,
  moveReviewTargetRect,
  protectionCalibrationStorageKey,
  restoreProtectionCalibrationWorkspace,
  revokePlacementResolution,
  revokeProtectionCalibration,
  setPlacementResolution,
  setPlacementResolutionNote,
  setProtectionCalibrationNote,
  updateReplacementProtectionTarget,
  type PlacementResolutionItem,
  type ProtectionCalibrationSeed,
  type ProtectionCalibrationWorkspace,
  type ReviewPlacement,
  type S2ReviewExport,
} from "../../lib/pause-review";
import {
  S2_CALIBRATION_DRAFTS,
  S2_PLACEMENT_RESOLUTION,
  S2_SOURCE_REVIEW,
} from "../../lib/s2-calibration-seed";
import {
  calibrationWorkspaceExportSignature,
  isCalibrationWorkspaceExportCurrent,
} from "./calibration-export-state";
import styles from "./ProtectionCalibrationLab.module.css";

const manifest = manifestJson as RegressionManifest;
const sourceReview = sourceReviewJson as S2ReviewExport;
const APP_VERSION = "0.4.1";
const calibrationSeed: ProtectionCalibrationSeed = {
  suggestions: S2_CALIBRATION_DRAFTS.map((draft) => ({
    sampleId: draft.sampleId,
    replacementProtectionTargets: draft.replacementProtectionTargets,
  })),
  placementResolutions: S2_PLACEMENT_RESOLUTION,
};
const sampleById = new Map(manifest.samples.map((sample) => [sample.id, sample]));

function initialWorkspace() {
  let workspace = createProtectionCalibrationWorkspace(manifest, sourceReview, calibrationSeed);
  for (const draft of S2_CALIBRATION_DRAFTS) {
    workspace = setProtectionCalibrationNote(
      workspace,
      draft.sampleId,
      `EN: ${draft.rationale}\nZH: ${draft.rationaleZh}`,
    );
  }
  const resolutionNotes: Record<string, string> = {
    "charge-005": "EN: Resolve from the written first-pass note: both upper corners are acceptable.\nZH: 按第一轮文字备注裁决：左右上角都可使用。",
    "charge-008": "EN: No protected target for the isolated effect; both card corners are acceptable, without introducing a full-screen format.\nZH: 纯特效不设保护目标；当前卡片合同下左右上角都可，不新增全屏广告形式。",
    "charge-009": "EN: Both upper corners are safe; top-left is preferred.\nZH: 左右上角都属于安全集合，左上角是首选位置。",
  };
  for (const [sampleId, note] of Object.entries(resolutionNotes)) {
    workspace = setPlacementResolutionNote(workspace, sampleId, note);
  }
  return workspace;
}

function percent(value: number) {
  return Math.round(value * 1000) / 10;
}

type DragState = {
  mode: "move" | "resize";
  sampleId: string;
  targetId: string;
  startClientX: number;
  startClientY: number;
  startRect: NormalizedRect;
  frameRect: DOMRect;
};

export function ProtectionCalibrationLab() {
  const [locale, setLocale] = useState<"en" | "zh">("en");
  const [workspace, setWorkspace] = useState<ProtectionCalibrationWorkspace>(() => initialWorkspace());
  const [ready, setReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [checkedTargetFingerprints, setCheckedTargetFingerprints] = useState<Record<string, string>>({});
  const [exportedWorkspaceSignature, setExportedWorkspaceSignature] = useState<string | null>(null);
  const dragState = useRef<DragState | null>(null);

  const currentDraft = S2_CALIBRATION_DRAFTS[currentIndex];
  const currentSample = sampleById.get(currentDraft.sampleId)!;
  const currentItem = workspace.items[currentDraft.sampleId];
  const selectedTarget = currentItem.replacementProtectionTargets.find((target) => target.id === selectedTargetId)
    ?? currentItem.replacementProtectionTargets[0]
    ?? null;
  const confirmedTargetCount = Object.values(workspace.items).filter((item) => item.confirmedAt).length;
  const confirmedPlacementCount = Object.values(workspace.placementResolutions).filter((item) => item.confirmedAt).length;
  const complete = confirmedTargetCount === S2_CALIBRATION_DRAFTS.length
    && confirmedPlacementCount === Object.keys(workspace.placementResolutions).length;
  const workspaceSignature = calibrationWorkspaceExportSignature(workspace);
  const downloaded = isCalibrationWorkspaceExportCurrent(workspace, exportedWorkspaceSignature);
  const currentTargetFingerprint = JSON.stringify(currentItem.replacementProtectionTargets);
  const boundaryChecked = checkedTargetFingerprints[currentDraft.sampleId] === currentTargetFingerprint;
  const proposedAssessments = choosePauseAdPlacement(
    currentItem.replacementProtectionTargets.map((target) => target.rect),
  ).assessments.filter((assessment) => currentDraft.acceptablePlacements.includes(
    assessment.placement as "top-left" | "top-right",
  ));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLocale(window.localStorage.getItem("admind-locale") === "zh" ? "zh" : "en");
      try {
        const saved = window.localStorage.getItem(protectionCalibrationStorageKey(manifest));
        setWorkspace(saved
          ? restoreProtectionCalibrationWorkspace(manifest, sourceReview, JSON.parse(saved), calibrationSeed)
          : initialWorkspace());
      } catch {
        setWorkspace(initialWorkspace());
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(protectionCalibrationStorageKey(manifest), JSON.stringify(workspace));
    } catch {
      // Editing remains available when browser privacy settings disable persistence.
    }
  }, [ready, workspace]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = locale === "zh" ? "AdMind · S2 保护框校准" : "AdMind · S2 Protection Calibration";
    try {
      window.localStorage.setItem("admind-locale", locale);
    } catch {
      // Language switching remains available for this session.
    }
  }, [locale]);

  const copy = locale === "en" ? {
    eyebrow: "STAGE 1B · PRODUCT LABEL CALIBRATION",
    title: "Turn review notes into exact boxes.",
    intro: "The first review identified eight incorrect green drafts. Adjust the suggested replacements here, then export normalized coordinates for an auditable reviewed manifest.",
    source: "Tracked evidence: first-pass priority queue 13/13 · 7 other frames remain unreviewed",
    warning: "These green boxes are second-draft suggestions—not MediaPipe output and not final human truth until you confirm them.",
    back: "Back to regression lab",
    home: "Main site",
    boxProgress: `Boxes ${confirmedTargetCount}/8`,
    placementProgress: `Placement decisions ${confirmedPlacementCount}/3`,
    previous: "Previous",
    next: "Next",
    original: "Original agent draft",
    replacement: "Editable replacement",
    placement: "Proposed ad area",
    dragHelp: "Drag a green box to move it. Drag its lower-right handle to resize. Percentage fields provide precise keyboard control.",
    ruleRisk: "Composite rule risk",
    riskClear: "within the current composite rule threshold",
    riskHigh: "above the current rule threshold—check geometry and risk drivers",
    noTarget: "No protected target. This is valid for a pure-effect negative sample.",
    targets: "Protected targets",
    addPerson: "+ Person",
    addFace: "+ Face",
    addCharacter: "+ Character",
    delete: "Delete selected",
    reset: "Reset suggestion",
    coordinates: "Selected box coordinates (%)",
    note: "Bilingual calibration record",
    acknowledge: "I checked the highlighted boundary, proposed card geometry, and composite rule risk.",
    confirm: "Confirm this replacement",
    undo: "Undo confirmation",
    confirmed: "Confirmed locally",
    incomplete: "A changed target set, a note, and the boundary check are required.",
    rationale: "Why this draft changed",
    boundary: "Please check this boundary",
    resolutions: "Resolve three placement-note conflicts",
    resolutionIntro: "The first export's buttons and written notes disagreed on these samples. Confirm the structured interpretation below.",
    both: "Both upper corners",
    leftOnly: "Top-left only",
    rightOnly: "Top-right only",
    defer: "Defer",
    preferred: "Preferred corner",
    noPreference: "No preference",
    left: "Top left",
    right: "Top right",
    resolutionNote: "Resolution note",
    confirmResolution: "Confirm placement",
    export: complete ? "Export complete reviewed coordinates" : "Export partial calibration JSON",
    downloaded: "Downloaded locally. Nothing was uploaded or trained.",
    exportHelp: "The export references the immutable first-pass review SHA-256 and does not modify the manifest automatically.",
  } : {
    eyebrow: "阶段 1B · 产品标签校准",
    title: "把复核备注变成精确保护框。",
    intro: "第一轮复核发现 8 张绿色初标不准确。请在这里调整二次建议框，再导出带标准化坐标的可审计人工标签。",
    source: "已追踪证据：第一轮优先队列 13/13 · 另外 7 张仍未人工复核",
    warning: "这里的绿色框是二次建议稿，不是 MediaPipe 输出；只有你确认后，才会成为待接收的人工标签。",
    back: "返回回归实验室",
    home: "返回主站",
    boxProgress: `保护框 ${confirmedTargetCount}/8`,
    placementProgress: `位置裁决 ${confirmedPlacementCount}/3`,
    previous: "上一张",
    next: "下一张",
    original: "原始代理初标",
    replacement: "可编辑二次建议框",
    placement: "待确认广告区域",
    dragHelp: "拖动绿色框可移动；拖动右下角手柄可缩放。下方百分比输入框可精确调整，也支持键盘操作。",
    ruleRisk: "规则综合风险",
    riskClear: "在当前综合规则阈值内",
    riskHigh: "超过当前规则阈值，请检查几何关系与风险来源",
    noTarget: "当前没有保护目标。对于纯特效负样本，这是有效答案。",
    targets: "保护目标",
    addPerson: "+ 添加人物",
    addFace: "+ 添加脸部",
    addCharacter: "+ 添加角色",
    delete: "删除选中框",
    reset: "恢复二次建议",
    coordinates: "选中框坐标（%）",
    note: "双语校准记录",
    acknowledge: "我已检查上方提示的边界、建议广告位几何关系与规则综合风险。",
    confirm: "确认这一版保护框",
    undo: "撤销确认",
    confirmed: "已在本地确认",
    incomplete: "必须修改目标集合、填写说明并勾选边界确认后才能提交。",
    rationale: "为什么这样修改",
    boundary: "请重点确认这个边界",
    resolutions: "裁决 3 个位置备注冲突",
    resolutionIntro: "第一轮导出的按钮选择与文字备注在这 3 张上不一致，请确认下面的结构化解释。",
    both: "左右上都可",
    leftOnly: "仅左上",
    rightOnly: "仅右上",
    defer: "顺延",
    preferred: "首选位置",
    noPreference: "无首选",
    left: "左上",
    right: "右上",
    resolutionNote: "裁决说明",
    confirmResolution: "确认位置裁决",
    export: complete ? "导出完整人工坐标" : "导出部分校准 JSON",
    downloaded: "已下载到本地，没有上传，也没有训练模型。",
    exportHelp: "导出会引用不可变的第一轮复核 SHA-256，不会自动修改 manifest。",
  };

  const selectedStyle = selectedTarget ? {
    left: `${selectedTarget.rect.x * 100}%`,
    top: `${selectedTarget.rect.y * 100}%`,
    width: `${selectedTarget.rect.width * 100}%`,
    height: `${selectedTarget.rect.height * 100}%`,
  } : undefined;

  const updateTarget = (targetId: string, rect: NormalizedRect) => {
    setWorkspace((current) => updateReplacementProtectionTarget(current, currentDraft.sampleId, targetId, rect));
  };

  const updateTargetCoordinate = (
    target: RegressionTarget,
    key: keyof NormalizedRect,
    value: number,
  ) => {
    const normalizedValue = value / 100;
    const rect = key === "x"
      ? moveReviewTargetRect(target.rect, normalizedValue - target.rect.x, 0)
      : key === "y"
        ? moveReviewTargetRect(target.rect, 0, normalizedValue - target.rect.y)
        : { ...target.rect, [key]: normalizedValue };
    updateTarget(target.id, rect);
  };

  const beginPointer = (
    event: ReactPointerEvent<HTMLElement>,
    mode: DragState["mode"],
    target: RegressionTarget,
  ) => {
    if (currentItem.confirmedAt) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const frame = event.currentTarget.closest(`.${styles.frame}`);
    if (!(frame instanceof HTMLElement)) return;
    setSelectedTargetId(target.id);
    dragState.current = {
      mode,
      sampleId: currentDraft.sampleId,
      targetId: target.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRect: { ...target.rect },
      frameRect: frame.getBoundingClientRect(),
    };
  };

  const movePointer = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragState.current;
    if (!drag) return;
    event.preventDefault();
    const deltaX = (event.clientX - drag.startClientX) / drag.frameRect.width;
    const deltaY = (event.clientY - drag.startClientY) / drag.frameRect.height;
    const rect = drag.mode === "move"
      ? moveReviewTargetRect(drag.startRect, deltaX, deltaY)
      : { ...drag.startRect, width: drag.startRect.width + deltaX, height: drag.startRect.height + deltaY };
    setWorkspace((current) => updateReplacementProtectionTarget(current, drag.sampleId, drag.targetId, rect));
  };

  const finishPointer = () => {
    dragState.current = null;
  };

  const addTarget = (kind: string) => {
    setWorkspace((current) => {
      const result = addReplacementProtectionTarget(current, currentDraft.sampleId, {
        kind,
        required: true,
        rect: { x: 0.4, y: 0.25, width: 0.2, height: 0.4 },
      });
      setSelectedTargetId(result.targetId);
      return result.workspace;
    });
  };

  const resetCurrent = () => {
    const fresh = initialWorkspace().items[currentDraft.sampleId];
    setWorkspace((current) => ({ ...current, items: { ...current.items, [currentDraft.sampleId]: fresh } }));
    setSelectedTargetId(fresh.replacementProtectionTargets[0]?.id ?? null);
  };

  const confirmCurrent = () => {
    setWorkspace((current) => confirmProtectionCalibration(current, currentDraft.sampleId, new Date().toISOString()));
    if (currentIndex < S2_CALIBRATION_DRAFTS.length - 1) setCurrentIndex((index) => index + 1);
  };

  const exportCalibration = () => {
    const generatedAt = new Date().toISOString();
    const artifact = buildProtectionCalibrationExport(manifest, sourceReview, workspace, {
      appVersion: APP_VERSION,
      gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? "working-tree",
      generatedAt,
      seed: calibrationSeed,
      sourceReviewSha256: S2_SOURCE_REVIEW.sha256,
    });
    const blob = new Blob([`${JSON.stringify(artifact, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = `${manifest.datasetId}-product-review-v2-${generatedAt.slice(0, 10)}.json`;
    anchor.href = url;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportedWorkspaceSignature(workspaceSignature);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">AdMind</Link>
        <nav>
          <Link href="/regression">{copy.back}</Link>
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
        <strong>{copy.warning}</strong>
        <div className={styles.evidenceStrip}>
          <span>{copy.source}</span>
          <b>{copy.boxProgress}</b>
          <b>{copy.placementProgress}</b>
        </div>
      </section>

      <nav className={styles.sampleRail} aria-label={locale === "zh" ? "校准样本" : "Calibration samples"}>
        {S2_CALIBRATION_DRAFTS.map((draft, index) => (
          <button
            aria-current={index === currentIndex ? "step" : undefined}
            className={workspace.items[draft.sampleId].confirmedAt ? styles.done : ""}
            key={draft.sampleId}
            onClick={() => setCurrentIndex(index)}
          >
            <small>{String(index + 1).padStart(2, "0")}</small>
            <span>{draft.sampleId.replace("charge-", "")}</span>
          </button>
        ))}
      </nav>

      <section className={styles.workspace}>
        <div className={styles.stageColumn}>
          <div className={styles.frame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={`${currentDraft.sampleId} at ${currentSample.timeSec}s`} src={currentSample.frame} />
            {currentItem.originalProtectionTargets.map((target) => (
              <i
                aria-hidden="true"
                className={styles.originalBox}
                key={`original-${target.id}`}
                style={{
                  left: `${target.rect.x * 100}%`,
                  top: `${target.rect.y * 100}%`,
                  width: `${target.rect.width * 100}%`,
                  height: `${target.rect.height * 100}%`,
                }}
              />
            ))}
            {currentItem.replacementProtectionTargets.map((target) => (
              <button
                aria-label={`${copy.replacement}: ${target.kind}`}
                aria-pressed={selectedTarget?.id === target.id}
                className={styles.editableBox}
                disabled={Boolean(currentItem.confirmedAt)}
                key={target.id}
                onClick={() => setSelectedTargetId(target.id)}
                onPointerCancel={finishPointer}
                onPointerDown={(event) => beginPointer(event, "move", target)}
                onPointerMove={movePointer}
                onPointerUp={finishPointer}
                style={{
                  left: `${target.rect.x * 100}%`,
                  top: `${target.rect.y * 100}%`,
                  width: `${target.rect.width * 100}%`,
                  height: `${target.rect.height * 100}%`,
                }}
                type="button"
              >
                <span>{target.kind}</span>
                <i
                  aria-hidden="true"
                  className={styles.resizeHandle}
                  onPointerCancel={finishPointer}
                  onPointerDown={(event) => beginPointer(event, "resize", target)}
                  onPointerMove={movePointer}
                  onPointerUp={finishPointer}
                />
              </button>
            ))}
            {currentDraft.acceptablePlacements.map((placement) => {
              const footprint = manifest.annotationPolicy.renderedCreativeFootprint;
              const x = placement === "top-left" ? 0.025 : 1 - 0.025 - footprint.width;
              const assessment = proposedAssessments.find((item) => item.placement === placement);
              return (
                <i
                  aria-hidden="true"
                  className={`${styles.placementBox} ${assessment && assessment.risk > 0.4 ? styles.placementConflict : ""}`}
                  key={placement}
                  style={{ left: `${x * 100}%`, top: "5.5%", width: `${footprint.width * 100}%`, height: `${footprint.height * 100}%` }}
                />
              );
            })}
            {!currentItem.replacementProtectionTargets.length ? <div className={styles.noTarget}>{copy.noTarget}</div> : null}
          </div>
          <div className={styles.legend}>
            <span><i className={styles.legendOriginal} />{copy.original}</span>
            <span><i className={styles.legendReplacement} />{copy.replacement}</span>
            <span><i className={styles.legendPlacement} />{copy.placement}</span>
          </div>
          <div className={styles.geometryRisks}>
            {proposedAssessments.map((assessment) => (
              <span className={assessment.risk > 0.4 ? styles.riskHigh : ""} key={assessment.placement}>
                <b>{assessment.placement === "top-left" ? copy.left : copy.right}</b>
                {copy.ruleRisk} {Math.round(assessment.risk * 100)}% · {assessment.risk > 0.4 ? copy.riskHigh : copy.riskClear}
              </span>
            ))}
          </div>
          <p className={styles.dragHelp}>{copy.dragHelp}</p>
        </div>

        <aside className={styles.editor}>
          <div className={styles.sampleHeading}>
            <div><p>{String(currentIndex + 1).padStart(2, "0")} / 08</p><h2>{currentDraft.sampleId}</h2></div>
            <span>{currentSample.timeSec.toFixed(1)}s</span>
          </div>
          <section className={styles.explanation}>
            <div><b>{copy.rationale}</b><p>{locale === "zh" ? currentDraft.rationaleZh : currentDraft.rationale}</p></div>
            <div><b>{copy.boundary}</b><p>{locale === "zh" ? currentDraft.boundaryZh : currentDraft.boundary}</p></div>
          </section>

          <section className={styles.targetControls}>
            <h3>{copy.targets}</h3>
            <div className={styles.targetTabs}>
              {currentItem.replacementProtectionTargets.map((target, index) => (
                <button aria-pressed={selectedTarget?.id === target.id} key={target.id} onClick={() => setSelectedTargetId(target.id)}>
                  {index + 1} · {target.kind}
                </button>
              ))}
            </div>
            <div className={styles.addRow}>
              <button disabled={Boolean(currentItem.confirmedAt)} onClick={() => addTarget("person")}>{copy.addPerson}</button>
              <button disabled={Boolean(currentItem.confirmedAt)} onClick={() => addTarget("face")}>{copy.addFace}</button>
              <button disabled={Boolean(currentItem.confirmedAt)} onClick={() => addTarget("robot-character")}>{copy.addCharacter}</button>
            </div>
            {selectedTarget && selectedStyle ? (
              <>
                <fieldset className={styles.coordinates} disabled={Boolean(currentItem.confirmedAt)}>
                  <legend>{copy.coordinates}</legend>
                  {(["x", "y", "width", "height"] as const).map((key) => (
                    <label key={key}>
                      <span>{key.toUpperCase()}</span>
                      <input
                        max="100"
                        min={key === "width" || key === "height" ? "2" : "0"}
                        onChange={(event) => updateTargetCoordinate(selectedTarget, key, Number(event.target.value))}
                        step="0.1"
                        type="number"
                        value={percent(selectedTarget.rect[key])}
                      />
                    </label>
                  ))}
                </fieldset>
                <button
                  className={styles.deleteButton}
                  disabled={Boolean(currentItem.confirmedAt)}
                  onClick={() => {
                    setWorkspace((current) => deleteReplacementProtectionTarget(current, currentDraft.sampleId, selectedTarget.id));
                    setSelectedTargetId(null);
                  }}
                >
                  {copy.delete}
                </button>
              </>
            ) : null}
            <button className={styles.resetButton} disabled={Boolean(currentItem.confirmedAt)} onClick={resetCurrent}>{copy.reset}</button>
          </section>

          <label className={styles.note}>
            <span>{copy.note}</span>
            <textarea
              disabled={Boolean(currentItem.confirmedAt)}
              maxLength={500}
              onChange={(event) => setWorkspace((current) => setProtectionCalibrationNote(current, currentDraft.sampleId, event.target.value))}
              rows={3}
              value={currentItem.note}
            />
          </label>
          <label className={styles.boundaryCheck}>
            <input
              checked={Boolean(currentItem.confirmedAt) || boundaryChecked}
              disabled={Boolean(currentItem.confirmedAt)}
              onChange={(event) => setCheckedTargetFingerprints((current) => ({
                ...current,
                [currentDraft.sampleId]: event.target.checked ? currentTargetFingerprint : "",
              }))}
              type="checkbox"
            />
            <span>{copy.acknowledge}</span>
          </label>
          <div className={styles.confirmRow}>
            {currentItem.confirmedAt ? (
              <button onClick={() => setWorkspace((current) => revokeProtectionCalibration(current, currentDraft.sampleId))}>{copy.undo}</button>
            ) : (
              <button disabled={!canConfirmProtectionCalibration(currentItem) || !boundaryChecked} onClick={confirmCurrent}>{copy.confirm}</button>
            )}
            <small>{currentItem.confirmedAt ? copy.confirmed : !canConfirmProtectionCalibration(currentItem) || !boundaryChecked ? copy.incomplete : ""}</small>
          </div>
          <div className={styles.stepButtons}>
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>{copy.previous}</button>
            <button disabled={currentIndex === S2_CALIBRATION_DRAFTS.length - 1} onClick={() => setCurrentIndex((index) => index + 1)}>{copy.next}</button>
          </div>
        </aside>
      </section>

      <section className={styles.resolutions}>
        <header><p>{copy.resolutions}</p><span>{copy.resolutionIntro}</span></header>
        <div>
          {Object.values(workspace.placementResolutions).map((item) => (
            <PlacementResolutionCard
              copy={copy}
              item={item}
              key={item.sampleId}
              locale={locale}
              onChange={(next) => setWorkspace(next)}
              workspace={workspace}
            />
          ))}
        </div>
      </section>

      <section className={styles.exportPanel}>
        <div><strong>{copy.export}</strong><span>{copy.exportHelp}</span></div>
        <button disabled={confirmedTargetCount + confirmedPlacementCount === 0} onClick={exportCalibration}>{copy.export}</button>
        {downloaded ? <output>{copy.downloaded}</output> : null}
      </section>
    </main>
  );
}

function PlacementResolutionCard({
  copy,
  item,
  locale,
  onChange,
  workspace,
}: {
  copy: Record<string, string>;
  item: PlacementResolutionItem;
  locale: "en" | "zh";
  onChange: (workspace: ProtectionCalibrationWorkspace) => void;
  workspace: ProtectionCalibrationWorkspace;
}) {
  const confirmed = Boolean(item.confirmedAt);
  const setPreset = (placements: ReviewPlacement[]) => {
    onChange(setPlacementResolution(workspace, item.sampleId, placements.length ? "show-card" : "defer", placements));
  };
  const currentPreset = item.action === "defer" ? "defer" : item.acceptablePlacements.length === 2
    ? "both"
    : item.acceptablePlacements[0] ?? "defer";
  return (
    <article className={confirmed ? styles.resolutionConfirmed : ""}>
      <div className={styles.resolutionTitle}><strong>{item.sampleId}</strong><span>{confirmed ? (locale === "zh" ? "已确认" : "Confirmed") : (locale === "zh" ? "待确认" : "Pending")}</span></div>
      <div className={styles.presetRow} role="group">
        <button aria-pressed={currentPreset === "both"} disabled={confirmed} onClick={() => setPreset(["top-left", "top-right"])}>{copy.both}</button>
        <button aria-pressed={currentPreset === "top-left"} disabled={confirmed} onClick={() => setPreset(["top-left"])}>{copy.leftOnly}</button>
        <button aria-pressed={currentPreset === "top-right"} disabled={confirmed} onClick={() => setPreset(["top-right"])}>{copy.rightOnly}</button>
        <button aria-pressed={currentPreset === "defer"} disabled={confirmed} onClick={() => setPreset([])}>{copy.defer}</button>
      </div>
      {item.acceptablePlacements.length > 1 ? (
        <label className={styles.preference}>
          <span>{copy.preferred}</span>
          <select
            disabled={confirmed}
            onChange={(event) => onChange(setPlacementResolution(
              workspace,
              item.sampleId,
              item.action,
              item.acceptablePlacements,
              event.target.value === "top-left" || event.target.value === "top-right" ? event.target.value : null,
            ))}
            value={item.preferredPlacement ?? ""}
          >
            <option value="">{copy.noPreference}</option>
            <option value="top-left">{copy.left}</option>
            <option value="top-right">{copy.right}</option>
          </select>
        </label>
      ) : null}
      <label className={styles.resolutionNote}>
        <span>{copy.resolutionNote}</span>
        <textarea
          disabled={confirmed}
          maxLength={500}
          onChange={(event) => onChange(setPlacementResolutionNote(workspace, item.sampleId, event.target.value))}
          rows={3}
          value={item.note}
        />
      </label>
      {confirmed ? (
        <button className={styles.resolutionConfirm} onClick={() => onChange(revokePlacementResolution(workspace, item.sampleId))}>{copy.undo}</button>
      ) : (
        <button
          className={styles.resolutionConfirm}
          disabled={!canConfirmPlacementResolution(item)}
          onClick={() => onChange(confirmPlacementResolution(workspace, item.sampleId, new Date().toISOString()))}
        >
          {copy.confirmResolution}
        </button>
      )}
    </article>
  );
}
