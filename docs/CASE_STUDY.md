# AdMind case study

## The short version

AdMind is an explainable decision layer for long-form video advertising. It combines offline video understanding, live player state, browser-side computer vision and deterministic policy rules to decide **when**, **how**, **where** or **whether** an ad should appear.

The project is a working product prototype, not a claim that advertising can be optimized by one model score. AI produces bounded evidence; testable rules retain final authority.

## Problem

Fixed-time ad breaks ignore what the viewer is watching. A break can land during a climax, a pause ad can cover the subject the viewer stopped to inspect, and a commercially valuable slot can still be inappropriate in rescue or medical content.

The product question was therefore larger than “which ad should win?”:

1. Is this moment eligible for an ad?
2. If it is, which format and position cause the least disruption?
3. If it is not, can delivery be deferred without hiding the trade-off?

## What I built

- A React and TypeScript product experience with real video playback, seeking, pause, focus and page-visibility state.
- A typed decision engine that ranks candidates only after hard eligibility and ethical rules pass.
- A provider boundary that normalizes time-coded TwelveLabs video analysis into schema-validated evidence.
- Browser-side MediaPipe face and subject detection for paused-frame placement.
- A four-region risk scorer that protects subjects, subtitles and controls and can reject every position.
- Three end-to-end scenarios: climax avoidance, pause protection and ethical blocking.
- Cached analysis, 26 automated unit/API tests, rendered-output checks, CI and a production deployment path.

## Key engineering decisions

### AI supplies evidence; rules make the decision

Provider output is useful but variable. AdMind converts it into a typed internal contract and keeps policy decisions deterministic. This makes a result inspectable, repeatable and testable.

### Real interaction state matters

S2 does not claim to read intent. It observes only the current page and player: pause, play, seeking, focus and visibility. An observation token invalidates stale asynchronous inference when the viewer resumes or moves elsewhere.

### Safe placement can return “none”

The placement scorer compares candidate regions against detected faces and subjects plus reserved subtitle and control areas. If every region is risky, it defers the ad instead of forcing a cosmetic answer.

### Ethical boundaries outrank delivery pressure

Rescue and medical evidence can trigger a hard block. A high bid cannot override it; the system records the delivery gap for later handling.

## Evidence and honest limits

- The demonstration uses cached analyses for a small, fixed media set; it is not a broad benchmark.
- Model confidence is evidence quality, not a calibrated probability of business success.
- Pause thresholds and placement weights are product hypotheses awaiting a fixed regression set.
- Delivery deferral is session-scoped; production campaign orchestration and durable audit storage are future work.
- No production revenue, uplift or retention claim is made.

## Stack

React 19 · TypeScript · vinext / Vite · Zod · Fastify · MediaPipe Tasks Vision · TwelveLabs · Vitest · GitHub Actions

## 60-second interview explanation

> AdMind is a policy-first ad decision layer for long-form video. I used a video-understanding API to produce time-coded semantic evidence, then normalized that output behind Zod contracts. A deterministic TypeScript engine combines it with player events, campaign constraints and ethical rules. For pause ads, MediaPipe runs locally on the current frame and a spatial scorer selects the safest region—or rejects all of them. The important design choice is that the model never gets final authority: every allow, defer, downgrade or block remains explainable and testable.

## Next milestone

Build and label a fixed S2 paused-frame regression set, report placement and rejection accuracy, then tune thresholds against that complete set rather than individual screenshots.
