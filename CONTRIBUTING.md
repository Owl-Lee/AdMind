# Contributing

[English](#contributing) · [中文](#参与贡献)

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

---

# 参与贡献

感谢你帮助改进 AdMind。

## 创建 Issue 之前

- 确认问题仍存在于最新 `main` 或当前线上部署。
- 先搜索已有 Issue，避免重复。
- 从截图和日志中移除 API Key、私有视频地址、账户信息和本地路径。
- 只使用自己拥有或获准分享的媒体；复现步骤不应要求向 Issue 上传受版权保护的视频。

Bug 报告应包含浏览器与操作系统、受影响场景（S1/S2/S3）、所选策略与素材、精确复现步骤、预期行为和实际行为。

## 本地开发

先阅读[开发说明](docs/DEVELOPMENT.md)，再运行：

```bash
pnpm install
pnpm check
```

修改决策规则、证据标准化、播放器状态或暂停位置时，请保持现有检查通过并增加聚焦的覆盖。

## Pull Request

- 修改应聚焦，并说明解决的用户或工程问题。
- 保持概率性证据与确定性政策之间的边界。
- 不允许出价或模型分数绕过受保护场景硬规则。
- 没有校准数据时，不把证据分数描述为校准概率。
- 不提交服务商密钥、`.env.local`、私有分析输入、下载视频或无授权广告素材。
- 公开接口变化时同步更新 README、架构或行为文档。
- 视觉修改提供前后证据，规则修改提供测试。

## 提交与评审

- 使用简短、祈使语气的提交标题。
- 在可行时把纯格式修改与行为修改分开。
- 请求评审前解决 lint、typecheck、单元测试和渲染结果失败。
- 明确说明迁移、依赖变化、外部 API 成本和素材授权影响。

## 贡献授权

提交贡献即表示你有权提供相关内容。除非仓库所有者之后发布明确的项目 License，否则不会授予 GitHub 服务条款之外的额外许可。
