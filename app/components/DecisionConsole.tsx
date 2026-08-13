import Link from "next/link";
import type {
  AnalysisConsensus,
  DecisionRequest,
  DecisionResponse,
  VideoAnalysis,
} from "@admind/contracts";
import { CheckIcon, ShieldIcon, SparkIcon } from "./icons";

type DecisionConsoleProps = {
  analysisRuns: VideoAnalysis[];
  consensus: AnalysisConsensus;
  request: DecisionRequest;
  decision: DecisionResponse;
};

const riskLabels: Record<string, string> = {
  physical_conflict: "肢体冲突",
  injury_or_medical_urgency: "受伤 / 医疗紧急",
  suspense_or_reveal: "悬念 / 揭晓",
  horror_or_shock: "恐怖 / 惊吓",
};

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function average(values: Array<number | null>) {
  const measured = values.filter((value): value is number => value !== null);
  return measured.length ? measured.reduce((sum, value) => sum + value, 0) / measured.length : 0;
}

export function DecisionConsole({ analysisRuns, consensus, request, decision }: DecisionConsoleProps) {
  const primary = analysisRuns.at(-1) ?? analysisRuns[0];
  const finalPlan = decision.selected;
  const nominalTime = request.scenario.nominalOpportunitySec;
  const fallbackTime = consensus.fallback?.timeSec ?? request.scenario.safeOpportunitySec;
  const focusSegments = analysisRuns
    .map((run) => run.segments.find((segment) => segment.startSec <= nominalTime && nominalTime < segment.endSec))
    .filter((segment): segment is NonNullable<typeof segment> => Boolean(segment));
  const riskCategories = [...new Set(focusSegments.flatMap((segment) => segment.interruptionRiskCategories))];
  const signalScores = [
    { label: "情绪强度", value: average(focusSegments.map((segment) => segment.emotionalIntensity)) },
    { label: "叙事关键度", value: average(focusSegments.map((segment) => segment.narrativeCriticality)) },
    { label: "打断风险", value: average(focusSegments.map((segment) => segment.interruptionRisk)) },
  ];
  const campaign = request.campaigns[0];
  const creativeById = new Map(campaign.creatives.map((creative) => [creative.id, creative]));
  const keyCandidates = [
    { creativeId: "creative-15s-fullscreen", timeSec: nominalTime, source: "AI 共识 + 硬规则" },
    { creativeId: "creative-15s-fullscreen", timeSec: fallbackTime, source: "降级规则 + 完整性" },
    { creativeId: "creative-6s-muted", timeSec: fallbackTime, source: "完整计划校验" },
    { creativeId: "creative-4s-end-card", timeSec: fallbackTime, source: "确定性排序" },
  ].map((candidate) => {
    const creative = creativeById.get(candidate.creativeId);
    const id = creative ? `${campaign.id}:${creative.id}:${candidate.timeSec}` : "";
    const selected = id === finalPlan?.id;
    const audit = decision.audit.filter((step) => step.candidateId === id);
    const reasons = audit
      .filter((step) => step.stage === "hard_filter")
      .map((step) => step.message);
    return { ...candidate, creative, id, selected, reasons };
  }).filter((candidate) => candidate.creative);

  const rawEvidence = JSON.stringify({
    media: primary.media,
    runs: analysisRuns.map((run, index) => ({
      run: index + 1,
      analysisId: run.analysisId,
      generatedAt: run.generatedAt,
      candidateBreaks: run.candidateBreaks,
    })),
    consensus,
    decision: {
      decisionId: decision.decisionId,
      outcome: decision.outcome,
      selected: decision.selected,
      rejectedCount: decision.rejectedCount,
      audit: decision.audit,
    },
  }, null, 2);

  return (
    <div className="dc-shell">
      <header className="dc-nav">
        <Link className="dc-brand" href="/"><span><SparkIcon /></span>AdMind</Link>
        <div className="dc-nav-title"><small>DECISION CONSOLE</small><strong>决策后台</strong></div>
        <Link className="dc-back" href="/#demo">返回体验演示</Link>
      </header>

      <main className="dc-main">
        <section className="dc-hero">
          <div>
            <p className="dc-eyebrow">真实任务 · S1 / CHARGE</p>
            <h1>一条广告决策，<br />完整解释。</h1>
            <p className="dc-lead">后台不重复播放演示，而是回答三个问题：AI 看到了什么、规则拒绝了什么、最终计划为什么成立。</p>
          </div>
          <aside className="dc-result-card">
            <span className="dc-live"><i />决策已完成</span>
            <small>最终执行计划</small>
            <strong>{formatTime(finalPlan?.timeSec ?? fallbackTime)}</strong>
            <p>{finalPlan?.durationSec ?? 0} 秒静音片尾卡片</p>
            <div><CheckIcon />保量合同未取消，完整计划不越过片尾</div>
          </aside>
        </section>

        <section className="dc-provenance" aria-label="证据来源图例">
          <span><i className="model" />AI 观察</span>
          <span><i className="system" />系统计算</span>
          <span><i className="rule" />硬规则</span>
          <span><i className="assumption" />业务假设</span>
        </section>

        <section className="dc-pipeline" aria-labelledby="pipeline-title">
          <div className="dc-section-heading"><p>DECISION PIPELINE</p><h2 id="pipeline-title">从视频到可执行计划</h2></div>
          <div className="dc-pipeline-grid">
            <article><span>01</span><small>输入</small><strong>{formatTime(primary.media.durationSec)} 视频</strong><p>文件指纹 {primary.media.sha256?.slice(0, 12)}…</p></article>
            <b>→</b>
            <article><span>02</span><small>理解</small><strong>{analysisRuns.length} 次独立分析</strong><p>TwelveLabs · {primary.model}</p></article>
            <b>→</b>
            <article><span>03</span><small>约束</small><strong>{decision.rejectedCount} 个计划被拒绝</strong><p>审核、格式、合同窗口与片尾边界</p></article>
            <b>→</b>
            <article className="selected"><span>04</span><small>执行</small><strong>{formatTime(finalPlan?.timeSec ?? fallbackTime)} · {finalPlan?.durationSec ?? 0} 秒</strong><p>唯一通过全部硬规则的计划</p></article>
          </div>
        </section>

        <section className="dc-section" aria-labelledby="perception-title">
          <div className="dc-section-heading"><p>01 · MODEL EVIDENCE</p><h2 id="perception-title">AI 看到了什么</h2><span>真实 API 输出，经统一协议校验后缓存；访问页面不会重复扣费。</span></div>
          <div className="dc-evidence-grid">
            <div className="dc-video-card">
              <video controls playsInline preload="metadata" src="/admind-charge-demo-720p.mp4">
                <track default kind="captions" label="中文" src="/charge-demo-zh.vtt" srcLang="zh" />
              </video>
              <div className="dc-risk-line">
                <span className="calm" style={{ width: "13.4%" }}>悬念</span>
                <span className="danger" style={{ width: "81.6%" }}>战斗 / 受伤风险</span>
                <span className="recovery" style={{ width: "5%" }}>恢复</span>
                <i className="nominal" style={{ left: `${(nominalTime / primary.media.durationSec) * 100}%` }}><b>{formatTime(nominalTime)}</b></i>
                <i className="fallback" style={{ left: `${(fallbackTime / primary.media.durationSec) * 100}%` }}><b>{formatTime(fallbackTime)}</b></i>
              </div>
              <div className="dc-risk-caption"><span>原定广告点</span><span>合同内最晚候选</span></div>
            </div>

            <div className="dc-model-card">
              <div className="dc-model-header"><div><small>TWELVELABS · PEGASUS 1.5</small><strong>两次运行，共识稳定</strong></div><span>{Math.round(consensus.nominal.agreement * 100)}% 一致</span></div>
              <div className="dc-run-list">
                {analysisRuns.map((run, index) => {
                  const nominal = run.candidateBreaks.find((item) => Math.abs(item.timeSec - nominalTime) <= 1);
                  const fallback = run.candidateBreaks.find((item) => Math.abs(item.timeSec - fallbackTime) <= 1);
                  return (
                    <article key={`${run.analysisId}-${run.generatedAt}`}>
                      <span>RUN {index + 1}</span>
                      <div><strong>{formatTime(nominalTime)}</strong><p>{nominal?.label}</p></div>
                      <b className="block">{nominal?.recommendation.toUpperCase()} · {nominal?.confidence.toFixed(2)}</b>
                      <div><strong>{formatTime(fallbackTime)}</strong><p>{fallback?.label}</p></div>
                      <b className="delay">{fallback?.recommendation.toUpperCase()} · {fallback?.confidence.toFixed(2)}</b>
                    </article>
                  );
                })}
              </div>
              <div className="dc-signal-chart">
                {signalScores.map((signal) => (
                  <div key={signal.label}><span>{signal.label}</span><i><b style={{ width: `${signal.value * 100}%` }} /></i><strong>{signal.value.toFixed(2)}</strong></div>
                ))}
              </div>
              <div className="dc-risk-tags">{riskCategories.map((category) => <span key={category}>{riskLabels[category] ?? category}</span>)}</div>
            </div>
          </div>
        </section>

        <section className="dc-section" aria-labelledby="decision-title">
          <div className="dc-section-heading"><p>02 · DETERMINISTIC DECISION</p><h2 id="decision-title">我们如何得到最终结果</h2><span>AI 只提供内容证据；素材审核、合同窗口和执行边界由确定性代码负责。</span></div>
          <div className="dc-candidate-table" aria-label="关键候选计划">
            <div className="dc-table-head"><span>候选时间</span><span>广告素材</span><span>判断来源</span><span>结果与原因</span></div>
            {keyCandidates.map((candidate) => (
              <article className={candidate.selected ? "selected" : ""} key={candidate.id}>
                <strong>{formatTime(candidate.timeSec)}</strong>
                <div><b>{candidate.creative?.durationSec} 秒 · {candidate.creative?.format === "fullscreen" ? "全屏" : "静音卡片"}</b><small>{candidate.creative?.name}</small></div>
                <span className="dc-source-pill">{candidate.source}</span>
                <div className="dc-candidate-result"><b>{candidate.selected ? "采用" : "拒绝"}</b><small>{candidate.selected ? "通过全部硬规则并进入排序" : candidate.reasons.join("；")}</small></div>
              </article>
            ))}
          </div>
        </section>

        <section className="dc-final" aria-labelledby="final-title">
          <div><p>03 · FINAL PLAN</p><h2 id="final-title">不是“找到一个时间点”，而是验证一份完整计划。</h2></div>
          <div className="dc-final-plan"><strong>{formatTime(finalPlan?.timeSec ?? fallbackTime)} <i>+</i> {finalPlan?.durationSec ?? 0}s</strong><p>{decision.summary}</p></div>
          <ul>
            <li><ShieldIcon /><span><b>高风险时刻被拦截</b>两次模型运行都拒绝 00:45。</span></li>
            <li><ShieldIcon /><span><b>商业约束仍然有效</b>广告只能延后到合同允许的 01:25。</span></li>
            <li><ShieldIcon /><span><b>完整性最终兜底</b>6 秒会越过片尾，因此选择已审核的 4 秒版本。</span></li>
          </ul>
        </section>

        <section className="dc-coverage" aria-labelledby="coverage-title">
          <div className="dc-section-heading"><p>EVIDENCE COVERAGE</p><h2 id="coverage-title">三类场景，逐步扩充真实片段</h2><span>只把真正跑过 API 的素材标记为“已实测”，避免用页面包装未验证能力。</span></div>
          <div>
            <article><span>S1</span><strong>高潮插播</strong><p>战斗高潮 / 悬念建立</p><b className="done">1 段 · 已实测</b></article>
            <article><span>S2</span><strong>暂停保护</strong><p>查看细节 / 字幕 / 分享意图</p><b>下一批素材</b></article>
            <article><span>S3</span><strong>敏感保护</strong><p>受伤恢复 / 哀伤 / 亲密场景</p><b>下一批素材</b></article>
          </div>
        </section>

        <details className="dc-raw">
          <summary>查看可复现证据：任务指纹、两次模型输出与最终计划</summary>
          <pre>{rawEvidence}</pre>
        </details>

        <footer className="dc-footer"><strong>AdMind Decision Console</strong><p>模型负责理解，规则负责边界，审计负责解释。</p></footer>
      </main>
    </div>
  );
}
