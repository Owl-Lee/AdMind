# Changelog

Notable project changes are recorded here.

## Unreleased

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
