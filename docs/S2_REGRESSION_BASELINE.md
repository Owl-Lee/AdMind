# S2 fixed-frame regression baseline

[English](#english) · [中文](#中文)

## English

### What this baseline means

AdMind Stage 1A replaces screenshot-by-screenshot intuition with a repeatable, project-local evaluation. The first set contains 20 fixed 1280×720 frames derived from the licensed `CHARGE` excerpt. The agent drafted every target and placement label from the written annotation rules; none of the 20 is human ground truth. Thirteen rule-clear drafts enter blocking metrics, while seven dense or compositionally ambiguous drafts remain diagnostic.

These figures describe **agreement on this exact regression set**. They are not a general computer-vision accuracy claim, a production SLA or a calibrated probability of correctness.

### v0.2.7-configuration baseline

Before any Stage 1B tuning, the v0.3.0 regression harness at commit `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` replayed the detector and scorer configuration referenced by public v0.2.7 commit `bdf66d1db7511f97feba49713f9995ea6ef13711`. This distinction matters: v0.2.7 defines the behavior under test, while the later harness supplies fixed-image input, provenance and report export. The 1280×720 JPEG input matches the current public video's decoded dimensions.

| Metric | Result | Interpretation |
| --- | ---: | --- |
| Blocking / diagnostic agent drafts | 13 / 7 | Only the rule-clear first drafts affect blocking metrics; neither group is human ground truth. |
| Model availability | 20 / 20 · **100%** | Every fixed frame completed browser inference. |
| Safe-placement agreement | 6 / 13 · **46.2%** | The chosen corner or deferral matched an accepted draft answer. Unavailable inference would count as a miss. |
| Unsafe placement | 4 / 13 · **30.8%** | A card was placed outside the accepted safe set. This is the highest-priority error. |
| Over-deferral | 3 / 13 · **23.1%** | A safe card was available but the current scorer rejected all positions. |
| Protected-target precision | 4 / 25 · **16.0%** | Many detected boxes did not match a drafted protection target at IoU ≥ 0.25. |
| Protected-target recall | 4 / 11 · **36.4%** | Seven drafted targets were missed, including salient objects and robot characters outside the detector's natural label set. |
| Target F1 | **22.2%** | Diagnostic summary for the current fixed set. |
| Inference latency | **318 ms p50 · 335 ms p95** | One Windows/Chromium run; diagnostic only and not a cross-device performance guarantee. |

Observed decision failures on the 13 rule-locked drafts:

- Unsafe placement: `charge-005` and `charge-013` selected top-left instead of the accepted top-right; `charge-008` and `charge-018` selected top-right instead of the accepted top-left.
- Over-deferral: `charge-002`, `charge-012` and `charge-016` returned `none` even though a rule-clear safe corner exists.

The low target scores are useful evidence, not a release failure. The current detector combines BlazeFace and an EfficientDet COCO allowlist. It can protect a robot after a convenient face/person false positive, while still assigning the wrong semantic class; it can also miss a canister or energy effect that a viewer clearly paused to inspect. Stage 1B must improve this behavior against the whole set instead of optimizing one screenshot.

### v0.4.0 Stage 1B candidate — pending deployment

`evaluation/s2/candidates/v0.4.0.json` was produced by runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152`. It completed all 20/20 fixed frames. This is a candidate comparison, not a replacement for the historical baseline and not a general accuracy claim.

| Metric | v0.2.7 configuration baseline | v0.4.0 candidate |
| --- | ---: | ---: |
| Safe-placement agreement | 6/13 · 46.2% | 7/13 · 53.8% |
| Unsafe placement | 4/13 · 30.8% | 3/13 · 23.1% |
| Over-deferral | 3/13 · 23.1% | 3/13 · 23.1% |
| Protected targets | TP 4 / FP 21 / FN 7 | TP 5 / FP 16 / FN 6 |
| Precision / recall / F1 | 16.0% / 36.4% / 22.2% | 23.8% / 45.5% / 31.3% |
| Inference latency | 318 / 335 ms p50/p95 | 277 / 307 ms p50/p95 |

`charge-012` is the genuine corrected decision: it no longer over-defers. Six decision failures remain: `charge-002`, `charge-005`, `charge-008`, `charge-013`, `charge-016` and `charge-018`. Before further tuning, label audit found the accepted placement drafts for `charge-002/005/008/013/018` disputable. Those five must be resolved instead of treated as settled labels; `charge-016` remains the clear unresolved over-deferral case.

The scorer and rendered card now use the same 0.30×0.30 footprint, and the S2 stage is fixed at 16:9. The v0.4.0 weak crop filter is intentionally narrow: it removes only a low-confidence crop-only `人物主体` candidate when no detected face center corroborates that box. Direct detections, strong crop detections, animals and faceless character candidates remain eligible. This avoids converting an animated character/animal heuristic into a blanket “no face means no subject” rule, but a back-facing low-confidence person can still be filtered; that case needs a holdout set.

### Evaluation layers

1. **Detector:** fixed frame → protected-target boxes. Report matches, misses and extra boxes class-agnostically at IoU ≥ 0.25.
2. **Placement policy:** drafted protection boxes → current scorer → accepted corner or deferral. A deterministic test runs every rule-locked draft through `choosePauseAdPlacement`, isolating geometry and reserved-area logic from detector quality.
3. **End to end:** model boxes → placement. Report safe-placement agreement, unsafe placement and over-deferral separately.

Multiple answers may be correct. A frame with two clear upper corners lists both; the scorer does not force an arbitrary unique corner. Frames marked `needs-user-review` are visible in the lab but excluded from blocking metrics. The 13 rule-locked answers are still agent-authored first drafts, not a claim of completed human or product-owner review.

### Reproduce and inspect

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/regression`, then select **Run fixed set**. The page loads only repository-owned or documented local assets; image inference stays in the browser. Use **Export JSON** to capture a new candidate run.

The page defaults to **Priority review**, a 13-frame queue made from the original seven subjective drafts plus `charge-002/005/008/013/016/018`. The other seven frames remain unreviewed agent-rule drafts. Green boxes are agent-drafted target references. Purple dashed boxes are current model output, hidden by default to reduce anchoring. Blue regions are the current review placement choice, prefilled from the agent draft and dashed until confirmed. The four-step flow is: (1) check every green protected target, (2) select every acceptable upper corner or defer, (3) explain the decision or adjustment, and (4) confirm and export. Choices are stored only in that browser's `localStorage`; confirmation can be undone and does not train the model automatically. **Export review JSON** downloads a separate artifact. It does not upload data, write to the repository, modify the manifest or change the tracked baseline; a maintainer must validate and commit it separately.

The deterministic offline gate is:

```bash
pnpm test:s2-regression
```

It validates manifest and prediction contracts, source/model/frame checksums, 1280×720 frame dimensions, ground-truth-box policy behavior, current-policy replay from raw detections and reproducibility of the tracked report. Ordinary CI does not rerun browser MediaPipe inference because the WASM runtime currently comes from jsDelivr; the tracked baseline keeps CI deterministic until Stage 1C vendors that runtime and adds a dedicated browser job.

### Tracked evidence

- `evaluation/s2/manifest.json` — annotation policy, rule-drafted targets and placement answers.
- `public/evaluation/s2/frames/*.jpg` — immutable 1280×720 regression frames.
- `evaluation/s2/baselines/v0.2.7.json` — runner/config provenance, model hashes, raw predictions, metrics and failures.
- `evaluation/s2/candidates/v0.4.0.json` — Stage 1B candidate provenance, raw predictions, metrics and failures.
- `/regression` — bilingual visual runner and local product-review queue. Green solid boxes are agent-drafted target references, purple dashed boxes are hidden-by-default model output, and blue areas are the current agent-prefilled review choice: dashed before confirmation and solid afterward.

### Next step

Complete the 13-frame priority queue before another tuning pass, resolving the five disputed accepted-placement drafts (`charge-002/005/008/013/018`), the clear `charge-016` over-deferral and the original seven subjective drafts. Then sample the other seven agent-rule drafts as a secondary audit. Do not merge exported review JSON into the manifest automatically: a maintainer must validate and commit the evidence deliberately. Confirmation does not train the model. The first acceptance priority remains **zero new unsafe placements**; recall improvements must not be purchased by covering protected content. Add a back-facing low-confidence-person holdout before generalizing the weak crop filter.

---

## 中文

### 这份基线代表什么

AdMind 阶段 1A 用可重复的项目内部评估，替代围绕单张截图反复凭感觉调参。第一套题库包含 20 张从已授权《CHARGE》片段派生的 1280×720 固定画面。全部保护目标与位置标签都由代理按照书面规则起草，20 张都不是人工标准答案；其中 13 张规则明确初标进入阻断指标，另外 7 张动作密集或构图存在争议的初稿保持诊断状态。

这些数字只表示**当前模型在这一组固定回归样本上的一致率**，不代表计算机视觉的通用准确率、生产 SLA 或经过校准的正确概率。

### v0.2.7 配置参考基线

在进行任何阶段 1B 调参前，v0.3.0 回归运行器于提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 上，重放公开 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711` 所对应的检测与位置配置。这里必须区分：v0.2.7 是被测行为参考，v0.3.0 运行器负责固定图片输入、来源记录和报告导出。1280×720 JPEG 与当前公开站视频解码尺寸一致。

| 指标 | 结果 | 含义 |
| --- | ---: | --- |
| 阻断 / 诊断代理初标 | 13 / 7 | 只有规则明确初稿进入阻断指标；两组都不是人工标准答案。 |
| 模型可用性 | 20 / 20 · **100%** | 所有固定帧均完成浏览器推理。 |
| 安全位置一致率 | 6 / 13 · **46.2%** | 选择的角落或顺延结果属于接受的初稿答案；模型不可用也会计为未命中。 |
| 危险位置误投 | 4 / 13 · **30.8%** | 卡片落在未接受的位置；这是最高优先级错误。 |
| 过度顺延 | 3 / 13 · **23.1%** | 存在安全卡片位置，但当前评分器拒绝了全部位置。 |
| 保护目标精确率 | 4 / 25 · **16.0%** | 在 IoU ≥ 0.25 下，不少检测框没有匹配初稿保护目标。 |
| 保护目标召回率 | 4 / 11 · **36.4%** | 漏掉 7 个保护目标，包括当前类别表天然不擅长的重要物体和机器人角色。 |
| 目标 F1 | **22.2%** | 当前固定集上的诊断汇总值。 |
| 推理耗时 | **P50 318 ms · P95 335 ms** | 单次 Windows/Chromium 运行，仅供诊断，不代表跨设备性能保证。 |

13 张规则锁定初标中的决策失败包括：

- 危险误投：`charge-005`、`charge-013` 应使用右上角，系统却选择左上角；`charge-008`、`charge-018` 应使用左上角，系统却选择右上角。
- 过度顺延：`charge-002`、`charge-012`、`charge-016` 明确存在安全角落，系统却返回 `none`。

较低的目标指标是有价值的证据，不是发布失败。当前检测器组合 BlazeFace 与 EfficientDet 的 COCO 类别白名单：它可能因为把机器人误识别人脸或人物而碰巧避开角色，但语义类别仍然错误；它也可能漏掉用户明显会暂停查看的罐体或能量效果。阶段 1B 必须根据整套样本改进，而不是只把某一张截图调对。

### v0.4.0 阶段 1B 候选结果 — 待部署

`evaluation/s2/candidates/v0.4.0.json` 由运行器/配置提交 `e0a033194ea04a9c926a822e4330355f41ddd152` 生成，20/20 张固定帧全部完成推理。它是候选对比，不替代历史基线，也不代表通用准确率。

| 指标 | v0.2.7 配置参考基线 | v0.4.0 候选 |
| --- | ---: | ---: |
| 安全位置一致率 | 6/13 · 46.2% | 7/13 · 53.8% |
| 危险位置误投 | 4/13 · 30.8% | 3/13 · 23.1% |
| 过度顺延 | 3/13 · 23.1% | 3/13 · 23.1% |
| 保护目标 | TP 4 / FP 21 / FN 7 | TP 5 / FP 16 / FN 6 |
| 精确率 / 召回率 / F1 | 16.0% / 36.4% / 22.2% | 23.8% / 45.5% / 31.3% |
| 推理耗时 | P50/P95 318/335 ms | P50/P95 277/307 ms |

`charge-012` 是得到真实修复的决策：系统不再对它过度顺延。仍有 `charge-002`、`charge-005`、`charge-008`、`charge-013`、`charge-016`、`charge-018` 六个决策失败。继续调参前的标签审计发现，`charge-002/005/008/013/018` 五张的可接受位置初标存在争议，不能再把它们当作已经定论的标签盲调；`charge-016` 仍是明确未解决的过度顺延案例。

评分器与线上卡片现在使用同一个 `0.30 × 0.30` footprint，S2 舞台固定为 16:9。v0.4.0 的弱裁剪过滤刻意保持窄范围：只有低置信、仅来自裁剪、且框内没有检测脸部中心佐证的 `人物主体` 候选会被移除。直接检测、强裁剪、动物与无脸角色候选仍然保留。这避免把动画角色/动物启发式扩张成“没有脸就没有主体”的通用规则，但背面低置信人物仍可能被过滤，必须通过留出集验证。

### 三层评估

1. **检测器层：** 固定帧 → 保护目标框。以 IoU ≥ 0.25 统计匹配、漏检和多余框，第一版按“是否需要保护”做类别无关评估。
2. **位置规则层：** 初稿保护框 → 当前评分器 → 可接受角落或顺延。确定性测试会把全部规则锁定初标送入 `choosePauseAdPlacement`，从而把几何与播放器保留区同检测器质量分开验证。
3. **端到端层：** 模型检测框 → 最终位置，分别报告安全位置一致率、危险误投和过度顺延。

一张画面可以有多个正确答案。如果左右两个上角都安全，标注会同时接受两个位置，不强迫系统迎合某个任意角落。标记为 `needs-user-review` 的样本会在实验页面展示，但不会进入阻断指标。13 张规则锁定答案仍然是代理起草的第一版，不代表产品负责人已经完成逐张人工审核。

### 运行与查看

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3000/regression`，点击 **Run fixed set / 运行固定集**。页面只加载仓库内自有或已经记录来源的本地素材，画面推理仍在浏览器中完成。点击 **Export JSON / 导出 JSON** 可以保存新的候选结果。

页面默认进入 **Priority review / 优先复核**，共 13 张：原有 7 张主观初标加 `charge-002/005/008/013/016/018`；另外 7 张仍是未人工审核的代理规则初标。绿色框是代理保护目标参考；紫色虚线框是当前模型输出，为减少锚定默认隐藏；蓝色区域是当前复核位置选择，由代理初标预填，确认前为虚线，确认后为实线。四步流程为：(1) 检查全部绿色保护目标；(2) 选择所有可接受上角，或选择顺延；(3) 说明决定或调整；(4) 确认并导出。选择只保存在当前浏览器 `localStorage`，可以撤销；确认本身不会自动训练模型。**Export review JSON / 导出审核 JSON** 只下载独立文件，不会上传、写入仓库、直接修改 manifest 或改变已保存基线；必须由维护者另行校验并提交。

离线确定性质量门为：

```bash
pnpm test:s2-regression
```

它会验证清单与预测合同、源视频/模型/帧校验和、1280×720 图片尺寸、标准框驱动的当前位置规则、原始检测框经过当前规则后的重放结果，以及保存报告能否完整重算。普通 CI 暂时不会重新运行浏览器 MediaPipe，因为 WASM 运行时目前来自 jsDelivr；在阶段 1C 把 WASM 固定到本地并增加独立浏览器任务之前，提交的基线用于保持 CI 稳定。

### 已保存证据

- `evaluation/s2/manifest.json`：标注规则、规则起草的保护目标与位置初标。
- `public/evaluation/s2/frames/*.jpg`：不可变的 1280×720 固定回归帧。
- `evaluation/s2/baselines/v0.2.7.json`：运行器与配置来源、模型哈希、原始预测、指标和失败案例。
- `evaluation/s2/candidates/v0.4.0.json`：阶段 1B 候选的来源、原始预测、指标和失败案例。
- `/regression`：双语可视化运行器与本地产品复核队列；绿色实线框是代理保护目标参考，紫色虚线框是默认隐藏的模型输出，蓝色区域是代理预填的当前复核选择，确认前为虚线、确认后为实线。

### 下一步

下一轮调参前先完成 13 张优先队列：解决 `charge-002/005/008/013/018` 五张可接受位置争议、明确的 `charge-016` 过度顺延，以及原有 7 张主观初标；随后再抽查另外 7 张代理规则初标。导出的审核 JSON 不能自动合并进 manifest，必须由维护者校验并提交；确认不会自动训练模型。第一验收优先级仍是**不得新增危险位置误投**，不能用遮挡受保护内容的代价换取表面召回率。泛化弱裁剪过滤前，还要增加背面低置信人物留出集。
