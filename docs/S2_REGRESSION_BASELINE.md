# S2 fixed-frame regression baseline

[English](#english) · [中文](#中文)

## English

### What this baseline means

AdMind Stage 1A replaces screenshot-by-screenshot intuition with a repeatable, project-local evaluation. The first set contains 20 fixed 1280×720 frames derived from the licensed `CHARGE` excerpt. The agent drafted every label from the written annotation rules. Thirteen rule-clear drafts are locked into regression metrics; seven dense or compositionally ambiguous drafts remain diagnostic until the product owner reviews them.

These figures describe **agreement on this exact regression set**. They are not a general computer-vision accuracy claim, a production SLA or a calibrated probability of correctness.

### v0.2.7-configuration baseline

Before any Stage 1B tuning, the v0.3.0 regression harness at commit `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` replayed the detector and scorer configuration referenced by public v0.2.7 commit `bdf66d1db7511f97feba49713f9995ea6ef13711`. This distinction matters: v0.2.7 defines the behavior under test, while the later harness supplies fixed-image input, provenance and report export. The 1280×720 JPEG input matches the current public video's decoded dimensions.

| Metric | Result | Interpretation |
| --- | ---: | --- |
| Rule-locked / pending-review samples | 13 / 7 | Only the rule-clear first drafts affect blocking metrics. |
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

For product review, select **Needs review** to isolate the seven diagnostic drafts. Each card records three independent decisions: whether the green agent-drafted protection target is correct or needs adjustment, whether a muted card may use the upper-left and/or upper-right position or must be deferred, and a required review note. Review choices are stored only in that browser's `localStorage`. **Export review JSON** downloads a separate review artifact; it does not upload data, write to the repository, modify the manifest or change the tracked baseline. A confirmation can be undone before exporting. Purple dashed model boxes are hidden by default to reduce anchoring and can be revealed after a run.

The deterministic offline gate is:

```bash
pnpm test:s2-regression
```

It validates manifest and prediction contracts, source/model/frame checksums, 1280×720 frame dimensions, ground-truth-box policy behavior, current-policy replay from raw detections and reproducibility of the tracked report. Ordinary CI does not rerun browser MediaPipe inference because the WASM runtime currently comes from jsDelivr; the tracked baseline keeps CI deterministic until Stage 1C vendors that runtime and adds a dedicated browser job.

### Tracked evidence

- `evaluation/s2/manifest.json` — annotation policy, rule-drafted targets and placement answers.
- `public/evaluation/s2/frames/*.jpg` — immutable 1280×720 regression frames.
- `evaluation/s2/baselines/v0.2.7.json` — runner/config provenance, model hashes, raw predictions, metrics and failures.
- `/regression` — bilingual visual runner and local product-review queue. Green solid boxes are agent-drafted target references, purple dashed boxes are current model output and blue areas preview the reviewer's selected rendered-ad footprint.

### Next step

The manifest deliberately records a geometry mismatch that Stage 1B must resolve: the scorer evaluates a 0.30×0.24 candidate while the rendered creative reserves approximately 0.30×0.30. Stage 1B should then tune thresholds, duplicate suppression, box sizing and placement geometry against the rule-locked set. The first acceptance priority is **zero new unsafe placements**; recall improvements must not be purchased by covering protected content. The product owner can review the seven ambiguous drafts without blocking this pre-tuning baseline.

---

## 中文

### 这份基线代表什么

AdMind 阶段 1A 用可重复的项目内部评估，替代围绕单张截图反复凭感觉调参。第一套题库包含 20 张从已授权《CHARGE》片段派生的 1280×720 固定画面。全部答案由代理按照书面规则起草；其中 13 张规则明确的初标锁入回归指标，另外 7 张动作密集或构图存在争议的初稿先作为诊断样本，等待产品负责人复核。

这些数字只表示**当前模型在这一组固定回归样本上的一致率**，不代表计算机视觉的通用准确率、生产 SLA 或经过校准的正确概率。

### v0.2.7 配置参考基线

在进行任何阶段 1B 调参前，v0.3.0 回归运行器于提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` 上，重放公开 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711` 所对应的检测与位置配置。这里必须区分：v0.2.7 是被测行为参考，v0.3.0 运行器负责固定图片输入、来源记录和报告导出。1280×720 JPEG 与当前公开站视频解码尺寸一致。

| 指标 | 结果 | 含义 |
| --- | ---: | --- |
| 规则锁定初标 / 待复核样本 | 13 / 7 | 只有规则明确的初稿进入阻断指标。 |
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

产品负责人可选择 **Needs review / 待复核**，只查看 7 张诊断初稿。每张卡片分三步记录：绿色代理初标保护框正确或需要调整；静音卡片允许位于左上、右上、两个位置都可以，或必须顺延；以及必填的复核备注。选择只保存在当前浏览器的 `localStorage`。点击 **Export review JSON / 导出审核 JSON** 只会下载一份独立审核文件，不会上传数据、写入仓库、直接修改 manifest 或改变已保存基线；导出前也可以撤销确认。为减少模型结果对人工判断的锚定，紫色虚线模型框默认隐藏，运行后可手动显示。

离线确定性质量门为：

```bash
pnpm test:s2-regression
```

它会验证清单与预测合同、源视频/模型/帧校验和、1280×720 图片尺寸、标准框驱动的当前位置规则、原始检测框经过当前规则后的重放结果，以及保存报告能否完整重算。普通 CI 暂时不会重新运行浏览器 MediaPipe，因为 WASM 运行时目前来自 jsDelivr；在阶段 1C 把 WASM 固定到本地并增加独立浏览器任务之前，提交的基线用于保持 CI 稳定。

### 已保存证据

- `evaluation/s2/manifest.json`：标注规则、规则起草的保护目标与位置初标。
- `public/evaluation/s2/frames/*.jpg`：不可变的 1280×720 固定回归帧。
- `evaluation/s2/baselines/v0.2.7.json`：运行器与配置来源、模型哈希、原始预测、指标和失败案例。
- `/regression`：双语可视化运行器与本地产品复核队列；绿色实线框是代理起草的保护目标参考，紫色虚线框是当前模型输出，蓝色区域预览审核者选择的实际广告占位。

### 下一步

清单刻意记录了阶段 1B 必须解决的一处几何偏差：评分器当前按 0.30×0.24 计算候选区域，而实际渲染广告约占 0.30×0.30。阶段 1B 随后应根据规则锁定初标调整阈值、重复框合并、框尺寸和广告占位几何。第一验收优先级是**不得新增危险位置误投**；不能用遮挡受保护内容的代价换取表面召回率。7 张争议初稿可由产品负责人后续复核，不阻塞这份调参前基线。
