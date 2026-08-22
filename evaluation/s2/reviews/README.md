# S2 product-review evidence

[English](#english) · [中文](#中文)

## English

### Purpose and status

This directory preserves product-review exports separately from the active S2 evaluation manifest. A review export is evidence supplied by the product owner; it is not an instruction to overwrite labels, a model-training input or a new benchmark by itself.

The first archived export is:

| Field | Value |
| --- | --- |
| File | `2026-08-22-product-owner.json` |
| Dataset | `s2-charge-fixed-v1` · manifest schema 2 |
| Exported at | `2026-08-22T04:10:38.781Z` |
| SHA-256 | `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256` |
| Archived bytes | 16,710 |

The archived file is byte-for-byte identical to the downloaded export. Its dataset ID, manifest version/date, source-asset hash, 13 frame hashes and 13 agent-draft signatures match the current `s2-charge-fixed-v1` manifest. The export itself records `generatedBy.gitCommit` as `working-tree` and `reviewer.identityVerified` as `false`; the archive preserves those fields exactly rather than upgrading their certainty.

### What the overlays mean

- **Green boxes** are AI-assisted drafts prepared by the project agent from the written protection rules. They are proposed reference annotations, not MediaPipe detections and not human ground truth.
- **Purple dashed boxes** are live output from the browser-local MediaPipe pipeline: BlazeFace plus EfficientDet. They are hidden by default during review to reduce anchoring.
- **Blue regions** are the current placement choices in the product-review workflow.
- TwelveLabs supplies time-coded semantic evidence for the offline video-analysis path. It does **not** produce the S2 green reference boxes or purple browser-detection boxes.

### What was reviewed

The product owner completed all **13 priority-review items**, not all 20 frames. The remaining seven frames—`charge-001/004/006/007/012/017/020`—still have agent-drafted labels and have not received this product-owner review.

Within the 13 completed records:

- five protection-box drafts were marked correct: `charge-002/003/009/010/014`;
- eight were marked as needing adjustment: `charge-005/008/011/013/015/016/018/019`;
- six structured placement answers differ from the agent draft: `charge-009/011/013/015/016/018`.

Three records need explicit adjudication before a manifest update:

- `charge-005`: the structured answer keeps only top-right, while the note says both upper corners are usable;
- `charge-008`: the structured answer keeps top-left, while the note says the drafted protected effect may be covered and also discusses full-screen delivery, which is outside this card-placement contract;
- `charge-009`: the structured answer selects only top-left, while the note says top-right may also be acceptable.

The export records whether a protection draft is correct or needs adjustment, but it intentionally contains **no replacement rectangle coordinates**. Therefore the eight requested box adjustments cannot be reconstructed reliably from this file alone.

### Intake rule

`2026-08-22-product-owner.json` is immutable source evidence and must not directly replace `evaluation/s2/manifest.json`. A maintainer must first:

1. preserve and validate the original export and its SHA-256;
2. resolve the three placement ambiguities with the product owner;
3. draft normalized replacement rectangles for the eight `needs-adjustment` samples and obtain confirmation;
4. create a separately versioned reviewed manifest with explicit provenance;
5. re-score saved raw predictions against that reviewed manifest and clearly distinguish a label-only rescore from a new browser inference run; and
6. update tests and the complete English/Chinese result documentation together.

Until those steps finish, the v0.3.0 historical baseline and public v0.4.0 candidate continue to use the tracked agent-draft manifest and retain their published metrics. Importing this review does not upload data, edit the manifest, change model weights or train the model.

---

## 中文

### 用途与当前状态

本目录把产品复核导出与当前 S2 评估 manifest 分开保存。复核导出是产品负责人提供的证据；它本身不是覆盖标签的指令，不是模型训练输入，也不能单独成为新的基准。

首份归档文件为：

| 字段 | 值 |
| --- | --- |
| 文件 | `2026-08-22-product-owner.json` |
| 数据集 | `s2-charge-fixed-v1` · manifest schema 2 |
| 导出时间 | `2026-08-22T04:10:38.781Z` |
| SHA-256 | `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256` |
| 归档字节数 | 16,710 |

归档文件与下载原件逐字节一致。它记录的数据集 ID、manifest 版本/日期、源素材哈希、13 张帧哈希和 13 个代理初标签名，都与当前 `s2-charge-fixed-v1` manifest 对得上。导出本身把 `generatedBy.gitCommit` 记录为 `working-tree`，把 `reviewer.identityVerified` 记录为 `false`；归档会原样保留这些字段，不会擅自提高其可信等级。

### 画面框分别代表什么

- **绿色框**是项目代理按照书面保护规则生成的 AI 辅助初标。它是候选参考标注，不是 MediaPipe 检测结果，也不是人工标准答案。
- **紫色虚线框**是浏览器本地 MediaPipe 链路的实时输出，由 BlazeFace 与 EfficientDet 组成。复核时默认隐藏，以减少模型输出对人工判断的锚定。
- **蓝色区域**是产品复核流程中的当前位置选择。
- TwelveLabs 为离线视频分析链路提供带时间码的语义证据；它**不会**生成 S2 的绿色参考框或紫色浏览器检测框。

### 这次实际复核了什么

产品负责人已经完成全部 **13 张优先复核项**，但不是 20 张全量复核。剩余 7 张 `charge-001/004/006/007/012/017/020` 仍只有代理初标，没有完成这次产品负责人复核。

13 条已完成记录中：

- 5 张保护框初标被确认正确：`charge-002/003/009/010/014`；
- 8 张被标记为需要调整：`charge-005/008/011/013/015/016/018/019`；
- 6 张的结构化位置答案与代理初标不同：`charge-009/011/013/015/016/018`。

以下 3 张在修改 manifest 前仍需明确裁决：

- `charge-005`：结构化答案只保留右上角，但备注写明两个上角都可用；
- `charge-008`：结构化答案保留左上角，但备注认为被初标保护的特效可以遮挡，并讨论了全屏广告；全屏形式不属于当前卡片位置合同；
- `charge-009`：结构化答案只选择左上角，但备注认为右上角也可能可接受。

导出只记录保护框“正确”或“需要调整”，有意**不包含替换后的矩形坐标**。因此，不能仅凭这份文件可靠重建 8 张需要调整的保护框。

### 接收规则

`2026-08-22-product-owner.json` 是不可变的原始证据，不能直接覆盖 `evaluation/s2/manifest.json`。维护者必须先完成：

1. 保存并校验原始导出及其 SHA-256；
2. 与产品负责人解决 3 张位置答案歧义；
3. 为 8 张 `needs-adjustment` 样本起草标准化替换矩形并获得确认；
4. 新建带明确来源记录、单独版本化的人工复核 manifest；
5. 使用已保存的原始预测对新 manifest 重新评分，并明确区分“只改标签后的重算”和“重新执行浏览器推理”；
6. 同步更新测试以及完整的英文/中文结果文档。

在上述步骤完成前，v0.3.0 历史基线与公开 v0.4.0 候选继续使用仓库内现有的代理初标 manifest，并保留已经发布的指标。接收这份复核文件不会上传数据、修改 manifest、改变模型权重或自动训练模型。
