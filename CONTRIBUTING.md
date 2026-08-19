# Contributing

Thanks for helping improve AdMind.

## Before opening an issue

- Confirm that the problem still occurs on the latest `main` branch or current hosted deployment.
- Search existing issues before creating a duplicate.
- Remove API keys, private video URLs, account details and local filesystem paths from screenshots or logs.
- Use only media that you own or are allowed to share. A reproduction should not require uploading copyrighted video to the issue.

For bugs, include the browser and operating system, the affected scenario (S1, S2 or S3), the selected strategy and media sample, exact reproduction steps, expected behavior and actual behavior.

## Local development

Read [Development](docs/DEVELOPMENT.md), then run:

```bash
pnpm install
pnpm check
```

Keep the existing checks passing and add focused coverage when changing decision rules, evidence normalization, player state or pause placement.

## Pull requests

- Keep the change focused and explain the user or engineering problem it solves.
- Preserve the boundary between probabilistic evidence and deterministic policy.
- Never allow bid value or model confidence to bypass a protected-context hard rule.
- Do not describe an evidence score as calibrated probability unless calibration data exists.
- Do not commit provider keys, `.env.local`, private analysis inputs, downloaded media or unlicensed creative.
- Update README, architecture or behavioral documentation when the public contract changes.
- Include before/after evidence for visual changes and tests for rule changes.

## Commit and review expectations

- Use short, imperative commit subjects.
- Keep formatting-only changes separate from behavior changes when practical.
- Resolve lint, typecheck, unit-test and rendered-output failures before requesting review.
- Call out migrations, dependency changes, external API costs and asset-license implications explicitly.

## Licensing of contributions

By submitting a contribution, you confirm that you have the right to provide it. No license is granted beyond GitHub's Terms of Service unless the repository owner later publishes an explicit project license.
