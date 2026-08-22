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

### v0.4.0 Stage 1B public historical candidate

`evaluation/s2/candidates/v0.4.0.json` was produced by runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152`. It completed all 20/20 fixed frames. This is a candidate comparison, not a replacement for the historical baseline and not a general accuracy claim.

| Metric | v0.2.7 configuration baseline | v0.4.0 candidate |
| --- | ---: | ---: |
| Safe-placement agreement | 6/13 · 46.2% | 7/13 · 53.8% |
| Unsafe placement | 4/13 · 30.8% | 3/13 · 23.1% |
| Over-deferral | 3/13 · 23.1% | 3/13 · 23.1% |
| Protected targets | TP 4 / FP 21 / FN 7 | TP 5 / FP 16 / FN 6 |
| Precision / recall / F1 | 16.0% / 36.4% / 22.2% | 23.8% / 45.5% / 31.3% |
| Inference latency | 318 / 335 ms p50/p95 | 277 / 307 ms p50/p95 |

`charge-012` is the genuine corrected decision: it no longer over-defers. The historical v0.4.0 failure list remains `charge-002`, `charge-005`, `charge-008`, `charge-013`, `charge-016` and `charge-018`. Subsequent first-pass review confirmed `charge-002`'s target and placement; current safety-gate diagnostics are `charge-005/008/013/016/018`, whose label/box adjustments must be resolved before tuning.

The scorer and rendered card now use the same 0.30×0.30 footprint, and the S2 stage is fixed at 16:9. The v0.4.0 weak crop filter is intentionally narrow: it removes only a low-confidence crop-only `人物主体` candidate when no detected face center corroborates that box. Direct detections, strong crop detections, animals and faceless character candidates remain eligible. This avoids converting an animated character/animal heuristic into a blanket “no face means no subject” rule. A sealed holdout now contains back-facing/faceless-person and non-human strata, but it has no labels and cannot validate generalization yet.

### v0.4.1 annotation-calibration status

v0.4.1 adds `/regression/calibrate`; it does not add a detector run or new model metrics. The byte-identical schema-v1 first-pass export is preserved at `evaluation/s2/reviews/2026-08-22-product-owner.json` with SHA-256 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`. It records 13/13 priority opinions: five AI-assisted project-agent protection drafts were accepted, eight require exact replacement coordinates, and seven other frames remain unreviewed. This is not a completed 20-frame human-ground-truth set.

The calibration page contains only the eight adjustment cases. It supports normalized drag/resize, exact percentage input, person/face/character target add and delete, reset, undo, and separate resolution of three placement conflicts. Each proposed upper-corner card shows the scorer's composite rule-risk percentage, which combines overlap and proximity rather than representing overlap alone, and warns above the 40% threshold. Confirmation requires an explicit check of the highlighted boundary and composite geometry risk; editing target geometry invalidates that acknowledgement. Completion requires 8/8 target decisions and 3/3 placement resolutions.

A schema-v2 download binds the exact v1 SHA-256 and stays in browser `localStorage` until export; it is not uploaded, does not train a model and does not update the manifest automatically. Validation must receive the immutable source review, its SHA-256 and the trusted calibration seed. The expected eight target IDs are derived from the source adjustment records, and placement resolution is locked to seed-defined `charge-005/008/009`; export-declared IDs are never the authority. A maintainer must validate the result, create a separately versioned reviewed manifest and then re-score saved predictions before publishing reviewed-label metrics.

### Public v0.5.0 evidence intake and browser reproducibility

`/regression/intake` is a bilingual, browser-local intake for the future schema-v2 file. It reuses the immutable v1 review, its SHA-256, the trusted calibration seed and the saved v0.4.0 raw prediction report. Incomplete or untrusted input is rejected. A complete 8/8-coordinate plus 3/3-placement export produces only an in-memory reviewed-manifest preview and separate downloadable preview/rescore JSON. The selected file is not uploaded, the tracked manifest is not overwritten, and no model is trained. Before/after metrics come from re-scoring the same saved predictions under changed labels; this is not a new detector run. The other seven frames remain diagnostic and unreviewed.

The release also self-hosts the six MediaPipe Tasks Vision 1.0.1 runtime files under `/mediapipe/wasm`, records their SHA-256 values and advances runtime provenance to `s2-vision-v5`. A dedicated Playwright Chromium CI job builds the exact revision and performs fresh inference on all 20 frames. It rejects jsDelivr requests, critical local-asset failures and unavailable frames. `charge-005/008/013/016/018` are a temporary diagnostic exception until schema-v2 intake resolves their first-pass label/box adjustments; `charge-002` was confirmed correct and remains in the stable gate. Every other stable-label sample is also prohibited from becoming newly unsafe. The job uploads the JSON report and a full-page screenshot. A pause-session token separately prevents a late MediaPipe promise from delivering after resume, seek, hidden/blur, reset or cleanup.

Release commit `3025d0ab4fdea704e77d01bfd122ec54e8853d40` is on public `main`. Actions run `32555440933` passed both `quality` and `s2-browser-regression`; Sites v67 is deployed, and hosted Playwright passed 3/3 suites covering fresh 20-frame local MediaPipe inference, bilingual 360/430/768/1440 responsive behavior and complete schema-v2 upload/hash validation. This completes Stage 1C browser reproducibility. It creates no v5 model metric; the v0.4.0/v4 result above remains the historical comparison. Strict branch protection requires both checks, while administrator enforcement remains disabled.

The new sealed holdout contains six immutable 1280×720 JPEGs: four cross-source primary samples and two same-source `CHARGE` supplemental diagnostics. Every item is `sealed-unreviewed`, `useForTuning = false` and `groundTruth = null`; sampling categories are not labels. Same-host extraction with the pinned Chromium/source bytes was byte-identical in two runs. This is evaluation infrastructure, not a metric or truth set. Model outcomes must remain unopened until the candidate is frozen, and the two supplemental frames cannot be presented as independent generalization evidence.

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

Open `http://localhost:3000/regression`, then select **Run fixed set**. The page loads only repository-owned or documented local assets; image inference stays in the browser. Use **Export JSON** to capture a new candidate run. Open `http://localhost:3000/regression/calibrate` for the eight-item exact-coordinate second review, and `/regression/intake` to validate a complete schema-v2 export and preview its label-only re-score.

The page defaults to **Priority review**, a 13-frame queue made from the original seven subjective drafts plus `charge-002/005/008/013/016/018`. The other seven frames remain unreviewed agent-rule drafts. Green boxes are agent-drafted target references. Purple dashed boxes are current model output, hidden by default to reduce anchoring. Blue regions are the current review placement choice, prefilled from the agent draft and dashed until confirmed. The four-step flow is: (1) check every green protected target, (2) select every acceptable upper corner or defer, (3) explain the decision or adjustment, and (4) confirm and export. Choices are stored only in that browser's `localStorage`; confirmation can be undone and does not train the model automatically. **Export review JSON** downloads a separate artifact. It does not upload data, write to the repository, modify the manifest or change the tracked baseline; a maintainer must validate and commit it separately.

The deterministic offline gate is:

```bash
pnpm test:s2-regression
```

It validates manifest and prediction contracts, source/model/frame checksums, 1280×720 frame dimensions, ground-truth-box policy behavior, current-policy replay from raw detections and reproducibility of the tracked report. `pnpm test:s2-holdout` separately verifies the sealed holdout hashes, dimensions, split counts and no-label/no-tuning invariants.

Public v0.5.0 replaces that old network boundary. The ordinary quality job still performs deterministic saved-prediction replay; the independent fresh-browser gate is:

```bash
pnpm exec playwright install chromium
pnpm build
pnpm test:s2-browser
```

It runs pinned Chromium against the production server, loads the six local runtime files and writes `artifacts/s2-browser-regression/current.json` plus `regression-lab.png`. Actions run `32555440933` and the post-deployment 3/3 hosted suites are the release evidence that closes the Stage 1C engineering gate.

### Tracked evidence

- `evaluation/s2/manifest.json` — annotation policy, rule-drafted targets and placement answers.
- `public/evaluation/s2/frames/*.jpg` — immutable 1280×720 regression frames.
- `evaluation/s2/baselines/v0.2.7.json` — runner/config provenance, model hashes, raw predictions, metrics and failures.
- `evaluation/s2/candidates/v0.4.0.json` — Stage 1B candidate provenance, raw predictions, metrics and failures.
- `evaluation/s2/reviews/2026-08-22-product-owner.json` — immutable schema-v1 first-pass evidence and its SHA-256-bound identity.
- `evaluation/s2/holdout/manifest.json` and `public/evaluation/s2/holdout/*.jpg` — six sealed, unlabeled, tuning-prohibited holdout frames with a four-primary/two-supplemental split.
- `/regression` — bilingual visual runner and first-pass review history. Green solid boxes are AI-assisted project-agent drafts, purple dashed boxes are hidden-by-default browser-local MediaPipe output, and blue areas are review choices. TwelveLabs generates neither box type.
- `/regression/calibrate` — bilingual local second-review tool for eight replacement-coordinate decisions and three placement conflicts; it exports separate schema-v2 evidence.
- `/regression/intake` — bilingual local schema-v2 validator, reviewed-manifest preview and saved-prediction label-only re-score; it does not upload or overwrite tracked data.
- `public/mediapipe/wasm/*` — six checksum-recorded MediaPipe Tasks Vision 1.0.1 runtime files used by `s2-vision-v5`.
- `tests/s2-browser-regression.spec.ts` — dedicated fresh Chromium gate and JSON/screenshot evidence writer.

### Next step

Finish the eight replacement-coordinate decisions and three placement resolutions, validate the schema-v2 evidence through `/regression/intake`, and deliberately create a separately versioned reviewed manifest. The intake preview/rescore is evidence, not an automatic repository merge. Review the remaining seven frames in a later pass instead of claiming 20-frame completion. Keep the released v5 CI and hosted-browser gates green, but do not infer a new model metric from their success. Until v2 resolves the five disputed drafts, keep them diagnostic and forbid newly unsafe outcomes on all other stable-label samples; recall improvements must not be purchased by covering protected content. Keep the six holdout frames sealed with `groundTruth = null` and `useForTuning = false` until a model candidate is frozen and a separate product-review artifact is created.

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

### v0.4.0 阶段 1B 公开候选结果

`evaluation/s2/candidates/v0.4.0.json` 由运行器/配置提交 `e0a033194ea04a9c926a822e4330355f41ddd152` 生成，20/20 张固定帧全部完成推理。它是候选对比，不替代历史基线，也不代表通用准确率。

| 指标 | v0.2.7 配置参考基线 | v0.4.0 候选 |
| --- | ---: | ---: |
| 安全位置一致率 | 6/13 · 46.2% | 7/13 · 53.8% |
| 危险位置误投 | 4/13 · 30.8% | 3/13 · 23.1% |
| 过度顺延 | 3/13 · 23.1% | 3/13 · 23.1% |
| 保护目标 | TP 4 / FP 21 / FN 7 | TP 5 / FP 16 / FN 6 |
| 精确率 / 召回率 / F1 | 16.0% / 36.4% / 22.2% | 23.8% / 45.5% / 31.3% |
| 推理耗时 | P50/P95 318/335 ms | P50/P95 277/307 ms |

`charge-012` 是得到真实修复的决策。历史 v0.4.0 失败列表仍为 `charge-002`、`charge-005`、`charge-008`、`charge-013`、`charge-016`、`charge-018`。后续第一轮复核确认 `charge-002` 的目标与位置正确；当前安全门诊断例外为 `charge-005/008/013/016/018`，其标签/保护框调整解决前不得据此调参。

评分器与线上卡片现在使用同一个 `0.30 × 0.30` footprint，S2 舞台固定为 16:9。v0.4.0 的弱裁剪过滤刻意保持窄范围：只有低置信、仅来自裁剪、且框内没有检测脸部中心佐证的 `人物主体` 候选会被移除。直接检测、强裁剪、动物与无脸角色候选仍然保留。这避免把动画角色/动物启发式扩张成“没有脸就没有主体”的通用规则。当前密封留出集包含背面/无脸人物与非人物分层，但尚无标签，不能据此证明泛化。

### v0.4.1 标注校准状态

v0.4.1 新增 `/regression/calibrate`，没有新增检测器运行或模型指标。逐字节一致的 schema v1 第一轮导出保存在 `evaluation/s2/reviews/2026-08-22-product-owner.json`，SHA-256 为 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`。它记录 13/13 张优先样本意见：5 张 AI 辅助的项目代理保护框初标被接受，8 张需要精确替换坐标，另外 7 张仍未产品审核。因此这不是 20 张全量人工真值集。

校框页只包含 8 张待调整样本，支持归一化拖动/缩放、精确百分比输入、新增或删除人物/人脸/角色目标、重置、撤销，并单独裁决 3 处位置冲突。每个待确认上角广告位会显示评分器的规则综合风险百分比；该分数同时考虑重叠与邻近度，不是纯重叠比例，超过 40% 阈值时明确警告。确认前必须勾选已检查重点边界与规则综合风险；只要保护框几何再次变化，该勾选就会失效。只有完成 8/8 张目标决定和 3/3 处位置裁决才算完整。

schema v2 下载会绑定准确的 v1 SHA-256，并在导出前只保存在浏览器 `localStorage`；它不会上传、不会训练模型，也不会自动更新 manifest。校验必须同时取得不可变源复核、其 SHA-256 和可信 calibration seed。预期 8 张目标 ID 从源复核的调整记录推导，位置裁决严格锁定为 seed 定义的 `charge-005/008/009`；导出自报 ID 不具权威性。维护者必须校验结果，建立单独版本化的复核 manifest，再用已保存预测重新评分，之后才能发布基于复核标签的指标。

### 公开 v0.5.0 证据接收与浏览器可复现性

`/regression/intake` 是面向未来 schema v2 文件的双语浏览器本地接收页。它复用不可变 v1 复核、其 SHA-256、可信 calibration seed 和 v0.4.0 已保存原始预测报告；不完整或不可信输入会被拒绝。完整 8/8 坐标 + 3/3 位置导出只会生成内存中的复核 manifest 预览，并可分别下载预览/重评分 JSON。所选文件不会上传，受追踪 manifest 不会被覆盖，模型也不会被训练。前后指标来自同一份已保存预测在标签变化后的重评分，不是新的检测器运行。另外 7 张仍保持诊断和未产品审核状态。

同一发布版本把 MediaPipe Tasks Vision 1.0.1 的 6 个 runtime 文件固定到 `/mediapipe/wasm`，记录 SHA-256，并把 runtime 来源推进为 `s2-vision-v5`。独立 Playwright Chromium CI 会按准确提交构建，对 20 张执行新鲜推理；它拒绝 jsDelivr 请求、关键本地资源失败和不可用帧。`charge-005/008/013/016/018` 在 schema v2 解决第一轮标签/保护框调整前暂作诊断例外；`charge-002` 已确认正确并继续进入稳定门，其余稳定标签样本同样不得新增危险误投。任务上传 JSON 报告与整页截图。另有 pause session token 阻止迟到 MediaPipe Promise 在恢复、拖动、隐藏/失焦、重置或清理后继续投放。

发布提交 `3025d0ab4fdea704e77d01bfd122ec54e8853d40` 已进入公开 `main`。Actions 运行 `32555440933` 的 `quality` 与 `s2-browser-regression` 双绿；Sites v67 已部署，线上 Playwright 3/3 通过，覆盖 20 张本地 MediaPipe 新鲜推理、360/430/768/1440 双语响应式以及完整 schema v2 上传/哈希校验。阶段 1C 浏览器可复现性工程因此完成，但没有产生 v5 模型指标；上方 v0.4.0/v4 结果继续作为历史对比。分支保护以 strict 模式要求两项检查，管理员强制执行仍关闭。

新密封 holdout 包含 6 张不可变 1280×720 JPEG：4 张跨来源主要样本、2 张同源 `CHARGE` 补充诊断。全部保持 `sealed-unreviewed`、`useForTuning = false`、`groundTruth = null`；抽样类别不是标签。同一主机、固定 Chromium/源字节两次抽帧逐字节一致。这是评估基础设施，不是指标或真值集；候选冻结前不得打开模型结果，2 张补充帧也不能包装成独立泛化证据。

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

打开 `http://localhost:3000/regression`，点击 **Run fixed set / 运行固定集**。页面只加载仓库内自有或已经记录来源的本地素材，画面推理仍在浏览器中完成。点击 **Export JSON / 导出 JSON** 可以保存新的候选结果。打开 `http://localhost:3000/regression/calibrate` 可进行 8 张精确坐标二审；打开 `/regression/intake` 可校验完整 schema v2 导出并预览标签重评分。

页面默认进入 **Priority review / 优先复核**，共 13 张：原有 7 张主观初标加 `charge-002/005/008/013/016/018`；另外 7 张仍是未人工审核的代理规则初标。绿色框是代理保护目标参考；紫色虚线框是当前模型输出，为减少锚定默认隐藏；蓝色区域是当前复核位置选择，由代理初标预填，确认前为虚线，确认后为实线。四步流程为：(1) 检查全部绿色保护目标；(2) 选择所有可接受上角，或选择顺延；(3) 说明决定或调整；(4) 确认并导出。选择只保存在当前浏览器 `localStorage`，可以撤销；确认本身不会自动训练模型。**Export review JSON / 导出审核 JSON** 只下载独立文件，不会上传、写入仓库、直接修改 manifest 或改变已保存基线；必须由维护者另行校验并提交。

离线确定性质量门为：

```bash
pnpm test:s2-regression
```

它会验证清单与预测合同、源视频/模型/帧校验和、1280×720 图片尺寸、标准框驱动的当前位置规则、原始检测框经过当前规则后的重放结果，以及保存报告能否完整重算。公开 v0.5.0 已经结束旧的 jsDelivr 网络边界：普通质量任务继续确定性重放已保存预测，独立新鲜浏览器门为：

```bash
pnpm exec playwright install chromium
pnpm build
pnpm test:s2-browser
```

它会在生产服务器上使用固定 Chromium、加载 6 个本地 runtime 文件，并写出 `artifacts/s2-browser-regression/current.json` 和 `regression-lab.png`。Actions 运行 `32555440933` 与部署后线上 3/3 套件已成为关闭阶段 1C 工程门的发布证据。

### 已保存证据

- `evaluation/s2/manifest.json`：标注规则、规则起草的保护目标与位置初标。
- `public/evaluation/s2/frames/*.jpg`：不可变的 1280×720 固定回归帧。
- `evaluation/s2/baselines/v0.2.7.json`：运行器与配置来源、模型哈希、原始预测、指标和失败案例。
- `evaluation/s2/candidates/v0.4.0.json`：阶段 1B 候选的来源、原始预测、指标和失败案例。
- `evaluation/s2/reviews/2026-08-22-product-owner.json`：不可变 schema v1 第一轮证据及其 SHA-256 身份。
- `evaluation/s2/holdout/manifest.json` 与 `public/evaluation/s2/holdout/*.jpg`：6 张密封、无标签、禁止调参的留出帧，采用 4 张主要 / 2 张补充分组。
- `/regression`：双语可视化运行器与第一轮复核历史；绿色实线框是 AI 辅助的项目代理初标，紫色虚线框是默认隐藏的浏览器本地 MediaPipe 输出，蓝色区域是复核选择。TwelveLabs 不生成这两类框。
- `/regression/calibrate`：针对 8 张替换坐标与 3 处位置冲突的双语本地二审工具，导出独立 schema v2 证据。
- `/regression/intake`：双语本地 schema v2 校验、复核 manifest 预览与已保存预测标签重评分；不会上传或覆盖受追踪数据。
- `public/mediapipe/wasm/*`：`s2-vision-v5` 使用的 6 个带校验值 MediaPipe Tasks Vision 1.0.1 runtime 文件。
- `tests/s2-browser-regression.spec.ts`：独立新鲜 Chromium 门与 JSON/截图证据写出器。

### 下一步

先完成 8 张替换坐标和 3 处位置裁决，通过 `/regression/intake` 校验 schema v2 证据，并有意建立单独版本化的复核 manifest；接收页预览/重评分只是证据，不会自动合并仓库。另外 7 张必须在后续单独复核，不能宣称 20 张已经完成。继续维持已发布 v5 CI 与线上浏览器门双绿，但不能根据工程门通过推导新模型指标。v2 解决 5 张争议初标前，让它们保持诊断，并禁止其余稳定标签样本新增危险误投；不能用遮挡受保护内容的代价换取表面召回率。6 张 holdout 必须继续保持 `groundTruth = null`、`useForTuning = false`，直到模型候选冻结并建立单独产品复核文件。
