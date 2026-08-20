# Changelog

[English](#changelog) · [中文（最新版本）](#022--2026-08-20)

Notable project changes are recorded here.

## Unreleased

## 0.2.2 · 2026-08-20

- Restored the saved language only after client hydration, preventing React hydration mismatches for returning visitors who previously selected Chinese.
- Kept English as the server-rendered public default while preserving each visitor's explicit language choice after the page becomes interactive.
- 中文：语言偏好改为在客户端 hydration 完成后恢复，修复曾选择中文的访客再次打开页面时可能出现的 React hydration 不一致警告。
- 中文：服务端公开默认语言仍为英文；页面进入可交互状态后，继续尊重访客上次主动选择的语言。

## 0.2.1 · 2026-08-20

- Localized the final two consensus evidence labels on the Decision logic page, removing `Mid-Fight` and `Post-Fight Recovery` from Chinese mode while preserving their English translations.
- 中文：补齐“决策方式”页面最后两个共识证据标签的本地化；中文模式显示“战斗进行中 / 战斗后恢复”，英文模式继续显示对应英文。

## 0.2.0 · 2026-08-20

### Public experience

- Added complete English and Chinese interface modes with English as the public default.
- Kept the active language, document language and English/Chinese caption track synchronized across repeated switches.
- Completed responsive layout coverage for desktop, tablet, narrow-window and phone widths without forced scroll snapping.
- Stacked player status, jump actions and strategy controls before they can collapse into clipped or vertical text.
- Preserved full-width video controls and scenario navigation at widths down to 360 CSS pixels.

### Interaction reliability

- Kept one accessible volume icon with a vertical volume slider and dynamic high, low and muted states.
- Closed the volume panel on playback, outside interaction or Escape while keeping dynamic labels localized.
- Added a visible skip action for delivered full-screen ads and kept displayed/closed ads separate from deferred tasks.
- Completed a browser acceptance pass for scenario navigation, material and strategy switches, ad dismissal, language changes and responsive layout.

### Documentation and release

- Kept the English and Chinese README sections feature-complete and aligned with the public deployment.
- Updated the engineering handoff and roadmap to reflect the public bilingual site and current quality gates.
- Verified anonymous HTTP access to both the hosted demo and public GitHub repository.

### 0.2.0 中文说明

#### 公开体验

- 完成英文与中文两套完整界面，并将英文设为公开页面默认语言。
- 连续切换语言时，界面、HTML 文档语言与中英文字幕轨道始终同步。
- 完成桌面、平板、窄窗口和手机宽度的响应式布局，不使用强制滚动吸附。
- 在标题可能被压成竖排或控件可能被切边之前，主动把播放器状态、跳转按钮和策略开关改成纵向完整布局。
- 在最低 360 CSS 像素宽度下仍保留完整的视频控制栏与场景导航。

#### 交互可靠性

- 只保留一个具有无障碍名称的音量图标，并提供竖向音量条和高、低、静音三种动态图标状态。
- 播放、点击外部或按 Escape 都会关闭音量浮层，动态辅助文本也会跟随语言变化。
- 已展示的全屏广告提供明确的跳过入口，并将“已展示后关闭”与“尚未展示而顺延”分开记录。
- 完成场景导航、素材/策略切换、广告关闭、语言切换和多尺寸布局的浏览器验收。

#### 文档与发布

- README 的英文与中文部分保持完整对等，并与公开部署一致。
- 更新工程交接和路线图，记录双语公开站点与当前质量门。
- 使用未登录 HTTP 访问验证线上演示和公开 GitHub 仓库均可直接打开。

## 0.1.0 · 2026-08-19

### Documentation

- Rebuilt the repository landing page around the current S1/S2/S3 experience.
- Added current architecture, development, roadmap, contribution and security documentation.
- Added GitHub issue and pull-request templates.
- Added a real screenshot from the running product experience.
- Added an interview-ready case study and a checksum-backed asset manifest.
- Prepared a clean public repository with contribution, security and community files.

### Maintenance

- Removed two unused destructuring bindings so the existing CI lint gate passes cleanly.
- Updated rendered-output assertions to match the current four-part product narrative.
- Removed unverified and unused release assets from the public snapshot.
- Added a public release tag and GitHub Release.
- Updated the React, Vite and CI action toolchain to current patched releases.
- Added a reviewed regression-tested patch for an unpublished `image-size` parser fix.

## Private beta · 2026-08-16

### Product experience

- Reorganized the site into a continuous home, S1, S2 and S3 narrative.
- Introduced the current light, rounded and purple visual system.
- Replaced forced scroll snapping with normal browser scrolling.
- Added larger, clearer scenario typography and simplified product copy.

### Player and advertising behavior

- Added one compact volume control with high, low and muted states.
- Added dismissible and skippable ad behavior.
- Corrected S2 drag counting to represent one user gesture rather than repeated browser events.
- Distinguished ad opportunities that were never shown from ads that were shown, completed or skipped.
- Prevented screenshot-induced focus changes from incorrectly reverting a delivered ad to deferred state.

### Decision evidence

- Added three S1 semantic examples and three S3 protected-context examples.
- Added live S2 paused-frame detection and four-corner placement scoring.
- Clarified that evidence scores are model support signals, not statistical confidence intervals.
- Added delivery-deferral language for content with no acceptable in-window break.

## Earlier prototype milestones

- Introduced shared Zod contracts, deterministic policy filters and plan ranking.
- Added TwelveLabs provider integration, cached analysis and repeated-run consensus.
- Added the co-located web API and standalone Fastify adapter.
- Added unit, integration and rendered-output verification.
