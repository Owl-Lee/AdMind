# Security policy

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
is included in `tests/dependency-patches.test.mjs`; the deployed production
dependency audit remains clean. The patch can be removed after an upstream fixed
release is published and adopted.
