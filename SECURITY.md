# Security policy

[English](#security-policy) · [中文](#安全政策)

## Supported version

Security fixes are applied to the latest `main` branch and current hosted prototype. No long-term support release exists yet.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose provider credentials, execute untrusted code, access data outside the AdMind page, disclose private media or bypass policy enforcement.

Use GitHub private vulnerability reporting when it is available for this repository. Include:

- affected commit or deployment;
- reproduction steps;
- expected and observed security boundary;
- potential impact; and
- suggested mitigation, if known.

Never include a real API key, access token, private video, user identifier or proprietary campaign data in the report.

Ordinary UI defects, model-quality limitations and incorrect demo decisions can use a regular bug report after sensitive information is removed.

## Security model

- Provider keys are used only by local/server-side analysis commands and are excluded from source control.
- The hosted product uses cached analysis; visitors do not supply provider credentials.
- S2 frame analysis runs locally in the browser and is bounded to the current video element.
- Runtime contracts validate analysis and decision payloads before execution.
- Deterministic hard rules execute before utility ranking.
- The demo does not inspect other applications, browser history, microphone, camera or arbitrary local files.

## Deployment guidance

- Configure runtime secrets through the hosting platform, never through committed files.
- Publish only from a reviewed commit that passed the repository quality gates.
- Treat model files, videos, analysis JSON and creative artwork as supply-chain inputs with separate provenance requirements.
- Rotate a provider key immediately if it appears in logs, issues, commits or build artifacts.

## Audited dependency patches

The repository carries a reviewed `pnpm` patch for `image-size@2.0.2`, an indirect
build-time dependency of Vinext. The patch rejects zero-length ICNS, JXL and HEIF
records that would otherwise leave parser offsets unchanged. Regression coverage
is included in `tests/dependency-patches.test.mjs`. `pnpm audit --prod` reports no
known production vulnerabilities, while the full registry audit still reports
the two upstream `image-size <= 2.0.2` advisories because registry scanners match
the package version rather than the repository's backported patch. The dependency
is used at build time. The patch can be removed after Vinext adopts
`image-size >= 2.0.3`.

---

# 安全政策

## 支持版本

安全修复应用于最新 `main` 和当前线上原型。项目暂时没有长期支持版本。

## 报告安全漏洞

如果漏洞可能暴露服务商凭证、执行不可信代码、访问 AdMind 页面之外的数据、泄露私有媒体或绕过政策执行，请不要创建公开 Issue。

请使用仓库已启用的 GitHub 私密漏洞报告，并包含：受影响提交或部署、复现步骤、预期与实际安全边界、潜在影响，以及可能的修复建议。绝不要在报告中放入真实 API Key、Token、私有视频、用户标识或专有广告数据。

普通界面缺陷、模型质量限制和错误 Demo 决策可以在移除敏感信息后使用普通 Bug Issue。

## 安全模型

- 服务商密钥只用于本地或服务端分析命令，并被排除在源码之外。
- 线上产品使用缓存分析，访客不提供服务商凭证。
- S2 画面分析在浏览器本地运行，范围限于当前视频元素。
- 运行时契约会在执行前校验分析和决定 Payload。
- 确定性硬规则先于效用排序执行。
- Demo 不检查其他应用、浏览历史、麦克风、摄像头或任意本地文件。

## 部署指导

- 使用托管平台配置运行时密钥，绝不提交到文件。
- 只从已经评审并通过质量门的提交发布。
- 把模型、视频、分析 JSON 和广告图视为需要独立来源记录的供应链输入。
- 如果服务商密钥出现在日志、Issue、提交或构建产物中，立即轮换。

## 已审计依赖补丁

仓库为 Vinext 的间接构建依赖 `image-size@2.0.2` 保留了经过审查的 `pnpm` 补丁。它会拒绝零长度 ICNS、JXL 和 HEIF 记录，避免解析偏移停滞。`tests/dependency-patches.test.mjs` 提供回归覆盖。`pnpm audit --prod` 未报告已知生产依赖漏洞；完整 registry 审计仍会报告 `image-size <= 2.0.2` 的两项上游高危公告，因为 registry 扫描器按包版本判断，无法识别仓库回移补丁。该依赖只在构建阶段使用。Vinext 采用 `image-size >= 2.0.3` 后即可移除补丁。
