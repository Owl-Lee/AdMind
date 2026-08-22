# AdMind Phase 1 acceptance tests v1

[English](#english) · [中文](#中文)

## English

- **Purpose:** a shared definition of done for product, design, engineering and QA.
- **Rule:** a vertical slice is complete only when every P0 condition passes; a page loading is not functional completion.

### 1. Test layers

| Layer | Goal | Recommended implementation |
|---|---|---|
| Domain unit | Formulas, frequency caps, candidate generation and reason codes | TypeScript unit tests |
| Policy unit | Hard rules can never be overridden by ranking weights | Table-driven tests |
| API contract | Schema, errors, versions and event semantics | Integration tests |
| Deterministic fixture | Replay the expected decisions for all three scenarios | Snapshots + explicit assertions |
| Browser E2E | Playback, ads, dismissal, recovery and comparison | Playwright |
| Accessibility | Keyboard, focus, labels, contrast and target size | axe + manual checks |

### 2. P0 scenario acceptance

#### AT-S1-01 Do not interrupt the climax immediately

- **Given** S1 creates a mid-roll opportunity at 45 seconds, scene intensity is 0.94, natural-transition score is 0.05 and C1 delivery urgency is 0.92
- **When** AdMind handles the opportunity
- **Then** it must not choose C1's 15-second full-screen version at 45 seconds
- **And** it keeps that plan, with its component scores, as an unselected eligible alternative
- **And** the final decision contains `HIGH_INTERRUPTION_NOW`
- **And** the selected plan remains within the allowed delay window.

#### AT-S1-02 Keep the guaranteed campaign feasible

- **Given** C1 still satisfies audience, frequency, placement and contract constraints
- **When** a natural transition exists at 82 seconds, still inside the 40-second maximum delay
- **Then** C1 remains the selected campaign
- **And** the selected creative is its approved six-second version
- **And** action is `DEFER`
- **And** reasons contain `COMMERCIAL_DELIVERY_URGENT` and `SAFE_TRANSITION_PREFERRED`.

#### AT-S1-03 Do not fabricate personalization

- **Given** only T0 content context is available and its gaming relevance is weak
- **When** the system explains the S1 decision
- **Then** the explanation includes commercial-delivery evidence
- **And** makes no personal claim such as “you like games” or “selected for you”
- **And** displays evidence tier `T0_CONTEXTUAL`.

#### AT-S1-04 Do not deliver beyond the delay window

- **Given** the only safe transition occurs after `latestAtMs`
- **When** delivery plans are generated
- **Then** that plan is rejected with `OUTSIDE_DELIVERY_WINDOW`
- **And** the system selects another eligible plan or returns `NO_ELIGIBLE_PLAN`
- **And** creates a shortfall-risk warning for the guaranteed campaign.

#### AT-S2-01 Preserve the frame during an inspection pause

- **Given** S2 pauses at 27 seconds, classified as `INSPECTION` with 0.91 confidence
- **When** AdMind handles the pause-ad opportunity
- **Then** it does not select the frame-covering ten-second full-screen creative
- **And** selects an approved, dismissible low-obstruction card
- **And** keeps the original frame and playback controls visible.

#### AT-S2-02 Do not cover critical regions

- **Given** the upper-left, center and lower-left are critical content/control regions and the upper-right is safe
- **When** the card renders
- **Then** its bounds remain fully inside the allowed region
- **And** its close control is visible and focusable
- **And** an implicit full-card navigation target does not cover the close control.

#### AT-S2-03 Defer when no safe region exists

- **Given** every allowed region conflicts with captions or controls
- **When** AdMind generates candidates
- **Then** the card plan is rejected with `NO_SAFE_RENDER_REGION`
- **And** the system tries the 35-second chapter boundary
- **And** does not silently fall back to a pause takeover.

#### AT-S2-04 Preserve position after dismissal

- **Given** the viewer pauses at 27 seconds and dismisses the card
- **When** playback resumes
- **Then** content resumes at 27 seconds within the documented player tolerance
- **And** emits `creative.dismissed` and `content.resumed`
- **And** does not open a new page.

#### AT-S2-05 Recompute the historical fixed-set baseline

- **Given** `evaluation/s2/manifest.json`, the 20 fixed 1280×720 frames and saved raw predictions
- **When** `pnpm test:s2-regression` runs
- **Then** every frame SHA-256 matches the manifest
- **And** the annotation contract has no duplicate ID, out-of-bounds rectangle or show/defer contradiction
- **And** all 20 target and placement labels are identified as agent-authored drafts rather than human ground truth
- **And** 13 agent-drafted `rule-confirmed` labels enter blocking metrics while seven agent drafts remain diagnostic
- **And** the historical result recomputes exactly to 6/13 (46.2%) safe placement, 4/13 (30.8%) unsafe placement, 3/13 (23.1%) over-deferral, 4/25 (16.0%) precision, 4/11 (36.4%) recall, 22.2% F1, 318 ms p50 and 335 ms p95
- **And** provenance states that v0.3.0 harness commit `e3ceabe1eb401b89e9ff4307d093824b9e2b35da` ran configuration behavior referenced from v0.2.7 commit `bdf66d1db7511f97feba49713f9995ea6ef13711`; the old commit did not run the new harness.

#### AT-S2-06 Unsafe placement must not increase silently

- **Given** the 13 blocking agent drafts, seven diagnostic agent drafts and historical fixed-set result, with no claim that any is human ground truth
- **When** detection thresholds, deduplication, target classes or creative geometry change
- **Then** the same-set before/after comparison is produced
- **And** `charge-005/008/013/016/018` remain diagnostic until schema-v2 intake resolves their first-pass label/box adjustments; `charge-002` is confirmed and stays in the stable gate; outside that temporary exception set, no stable-label sample becomes newly unsafe
- **And** pending-review samples stay outside the blocking denominator until confirmed
- **And** fixed-set figures are described as project-local agreement, never general model accuracy.

#### AT-S2-07 Recompute the v0.4.0 candidate

- **Given** `evaluation/s2/candidates/v0.4.0.json` from the final `s2-vision-v4` browser run at runner/config commit `e0a033194ea04a9c926a822e4330355f41ddd152`, generated at `2026-08-22T03:42:41.155Z`
- **When** the deterministic regression gate validates it
- **Then** model availability is 20/20
- **And** blocking results are 7/13 (53.8%) safe placement, 3/13 (23.1%) unsafe placement and 3/13 (23.1%) over-deferral
- **And** targets are TP 5 / FP 16 / FN 6, with 23.8% precision, 45.5% recall and 31.3% F1
- **And** target P/R/F1 is explicitly described as exploratory, class-agnostic raw-box matching at IoU ≥ 0.25, not calibrated semantic detector accuracy
- **And** latency is 277 ms p50 / 307 ms p95
- **And** `charge-012` is no longer a decision failure
- **And** remaining over-deferrals are exactly `charge-002/008/016` and remaining unsafe placements are exactly `charge-005/013/018`
- **And** the historical failure list remains traceable, while current tuning treats `charge-005/008/013/016/018` as unresolved diagnostics and keeps confirmed `charge-002` in the stable gate.

#### AT-S2-08 Priority review remains local, explicit and independent

- **Given** a 13-frame priority queue made from the original seven `needs-user-review` drafts plus `charge-002/005/008/013/016/018`, while the other seven frames remain unreviewed agent-rule drafts
- **When** the product owner opens `/regression`
- **Then** Priority review is the default filter, alongside All and Unsafe placement
- **And** the legend clearly distinguishes green agent-drafted targets, purple dashed model output and blue agent-prefilled placement choices
- **And** model boxes are hidden by default
- **And** a blue choice remains dashed until the frame is confirmed
- **And** the four steps verify protection targets, select every acceptable upper-left/upper-right outcome or defer, record a note, then confirm and export
- **And** confirmation can be undone
- **And** answers persist only in browser `localStorage`
- **And** confirmation does not train the model automatically
- **And** export creates a separate review JSON that is not uploaded and does not modify the manifest or tracked results
- **And** a maintainer must validate and commit exported JSON before it can affect labels or metrics.

#### AT-S2-09 Scoring and rendering use the same footprint

- **Given** S2 renders on a 16:9 stage
- **When** the placement scorer evaluates a candidate and the muted card is displayed
- **Then** both use a normalized 0.30×0.30 footprint
- **And** no legacy 0.30×0.24 geometry remains in the current policy.

#### AT-S2-10 Weak crop suppression stays narrow

- **Given** crop-only visual-subject candidates
- **When** weak candidate filtering runs
- **Then** only a low-confidence `人物主体` candidate without a corroborating face center is removed
- **And** direct detections, strong crop detections, animal candidates and faceless character candidates remain
- **And** a back-facing low-confidence-person holdout is required before claiming the heuristic generalizes.

#### AT-S2-11 Detector availability fails closed

- **Given** S2 requires both the face and object detector
- **When** either detector fails to initialize or run
- **Then** the whole frame is reported unavailable
- **And** no ad placement is emitted from partial detector evidence
- **And** an unavailable blocking frame counts as a miss in regression metrics.

#### AT-S2-12 v0.4.1 calibrates only the eight requested protection boxes

- **Given** the immutable schema-v1 first-pass artifact records 13/13 priority opinions, five accepted protection drafts, eight adjustment requests and seven other unreviewed frames
- **When** the product owner opens `/regression/calibrate`
- **Then** exactly the eight adjustment cases enter the coordinate queue; the five accepted and seven unreviewed frames are not silently relabelled
- **And** a reviewer can move and resize normalized boxes, enter exact percentage values, add or delete person/face/character targets and reset the current suggestion
- **And** `charge-008` may validly contain no protected target as the pure-effect negative-control draft
- **And** every proposed upper-corner card shows its composite rule-risk percentage, explicitly combining overlap and proximity rather than presenting an overlap percentage, and warns when risk exceeds the current 40% threshold
- **And** confirmation is disabled until the reviewer acknowledges the highlighted boundary and composite geometry risk; changing any target geometry invalidates that acknowledgement
- **And** export remains incomplete until all 8/8 target decisions and all 3/3 placement conflicts are resolved.

#### AT-S2-13 Preserve review provenance and metric boundaries

- **Given** the archived v1 review SHA-256 is `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`
- **When** a schema-v2 calibration is exported
- **Then** it references that exact immutable artifact and contains bounded normalized replacement rectangles
- **And** drafts and undo state persist only in browser `localStorage`
- **And** the page does not upload the export, train a model or modify `evaluation/s2/manifest.json`
- **And** green is described as an AI-assisted project-agent draft, purple as browser-local MediaPipe output and neither as TwelveLabs output
- **And** schema-v2 validation requires the trusted calibration seed, derives the eight target IDs from the immutable source review, and requires exactly `charge-005/008/009` for placement resolution rather than trusting export-declared IDs
- **And** v0.4.0 metrics remain unchanged until a maintainer validates v2, creates a separately versioned reviewed manifest and re-scores saved predictions.
- **And** v0.4.1 is recorded as a calibration-tool release with no new detector run or model metric.

#### AT-S2-14 Schema-v2 intake remains local, preview-only and label-only

- **Given** `/regression/intake` has the immutable schema-v1 source review, its SHA-256, the trusted calibration seed and the saved v0.4.0 raw predictions
- **When** a user selects a schema-v2 JSON
- **Then** the browser records the exact selected-file SHA-256 in the preview evidence
- **Then** incomplete, tampered, stale or source-mismatched artifacts are rejected before preview or scoring
- **And** a ready result requires all eight replacement-coordinate decisions and exactly `charge-005/008/009` placement resolutions
- **And** the page creates only an in-memory reviewed-manifest preview, leaving the seven other frames diagnostic
- **And** before/after values re-score the same saved raw predictions and are explicitly described as a label-only comparison rather than fresh inference
- **And** the selected file is not uploaded and the page cannot train a model, commit a file or overwrite `evaluation/s2/manifest.json`
- **And** preview/rescore downloads remain separate evidence that a maintainer must validate and deliberately commit.

#### AT-S2-15 Fresh v5 browser inference is local and safety-gated

- **Given** the exact revision is built with MediaPipe Tasks Vision 1.0.1 and `s2-vision-v5`
- **When** the dedicated Playwright Chromium job autoruns `/regression` over the 20 fixed frames
- **Then** MediaPipe loads its six checksum-recorded JS/WASM assets from `/mediapipe/wasm`, and no request targets jsDelivr
- **And** critical WASM, model or frame request failure fails the job
- **And** all 20 frames are available, both detector requirements remain fail-closed, and the report carries v5/local-runtime provenance
- **And** `charge-005/008/013/016/018` are temporary diagnostic exceptions pending schema-v2 label/box resolution; `charge-002` is confirmed and remains in the stable gate; every other stable-label sample is also prohibited from becoming newly unsafe
- **And** the CI job uploads the fresh JSON report and full-page screenshot, retaining a trace on failure
- **And** the historical v0.4.0/v4 metrics stay unchanged; v5 is not called complete until the first CI and hosted fresh runs pass.

#### AT-S2-16 Late pause inference cannot deliver stale UI or ads

- **Given** a MediaPipe promise is running for one active pause-session token
- **When** playback resumes, seeking begins, the page becomes hidden or unfocused, the player resets, the ad completes, the component unmounts, or a newer pause session begins
- **Then** the previous token is invalidated
- **And** the late promise cannot update detection evidence, choose a placement or display an ad
- **And** a token can complete at most once and only while it is the active session.

#### AT-S2-17 The holdout remains sealed, unlabeled and unavailable for tuning

- **Given** `evaluation/s2/holdout/manifest.json` contains six 1280×720 frames
- **Then** four cross-source samples are primary and two same-source `CHARGE` samples are supplemental correlated diagnostics
- **And** every sample remains `sealed-unreviewed`, `useForTuning = false` and `groundTruth = null`
- **And** sampling categories are not presented as product labels or human truth
- **And** model outcomes are not inspected, thresholds/rules are not selected, and training does not use these frames before the candidate is frozen
- **And** the two same-source samples are never reported as independent generalization evidence
- **And** same-host extraction with the pinned Chromium/source bytes is byte-identical, while `--verify-only` checks hashes, dimensions, split counts and no-label/no-tuning invariants without overwriting the seal.

#### AT-S3-01 Commercial weight cannot cross an ethical hard rule

- **Given** S3 is manually confirmed as `PROTECTED_HEALTH_TASK` and C1 urgency and commercial value both equal 1.00
- **When** every positive ranking weight is raised to its allowed maximum
- **Then** full-screen, overlay, autoplay-audio and navigation plans remain rejected with `PROTECTED_CONTEXT`
- **And** the critical flow returns `NO_ELIGIBLE_PLAN`.

#### AT-S3-02 Do not target from sensitive context

- **Given** a campaign tries to infer personal need from health content
- **When** policy checks run
- **Then** it is rejected with `SENSITIVE_TARGETING_PROHIBITED`
- **And** the evidence does not enter `contextualUtility`
- **And** the audit keeps the rejection reason without storing a real diagnosis.

#### AT-S3-03 No plan must alert and must not count an impression

- **Given** no eligible form exists
- **When** the engine returns `NO_ELIGIBLE_PLAN`
- **Then** it records `delivery.skipped` or `delivery.deferred`
- **And** creates `DELIVERY_SHORTFALL_RISK`
- **And** does not record `impression.viewable`
- **And** leaves contract-delivery counts unchanged.

#### AT-R1-01 Cross-format brand hard cap

- **Given** the brand has already generated two viewable impressions through a pre-roll and a mid-roll card and its hard cap is two
- **When** a later opportunity considers any creative or format from that brand
- **Then** all such plans are rejected with `BRAND_FREQUENCY_CAP_REACHED`
- **And** changing creative ID cannot bypass the brand cap.

#### AT-R2-01 Seeking removes or prevents disruptive ads

- **Given** the viewer presses and starts dragging the progress bar before an S2 card becomes visible
- **When** interaction state becomes `SEEKING`
- **Then** the card is removed without `impression.viewable`
- **And** no new full-screen ad starts
- **And** the opportunity is recomputed from the new position after seeking ends.

#### AT-R2-02 Comments become an essential region

- **Given** the viewer has opened and is reading a comments/danmaku layer
- **When** a candidate card overlaps it
- **Then** the plan is rejected with `ESSENTIAL_CONTROL_BLOCKED` or `NO_SAFE_RENDER_REGION`
- **And** the system moves to a non-overlapping region or defers.

#### AT-R2-03 Back navigation cannot be hijacked

- **Given** the viewer invokes the app back/home action
- **When** interaction state becomes `NAVIGATING_AWAY`
- **Then** no new ad starts
- **And** the back action is not recorded as an ad click
- **And** a card below its viewability threshold is removed.

#### AT-R2-04 Ad navigation requires explicit intent

- **Given** an ad has an explicit CTA whose hit area does not overlap close, progress or player controls
- **When** a landing page opens
- **Then** the same delivery has an earlier valid `ad.navigation_intent_recorded`
- **And** the source element is the CTA
- **And** opening without intent emits `ad.unintended_navigation_detected` and fails the test.

#### AT-R2-05 Restore task state after returning

- **Given** the viewer follows an explicit CTA to an ad landing page
- **When** the viewer returns to the player
- **Then** the original content ID, time within tolerance, and play/pause state are restored
- **And** recoverable comments/danmaku state is restored
- **And** the viewable impression is not counted again.

#### AT-R3-01 Consolidated preference obeys the hard limit

- **Given** the viewer selects `CONSOLIDATED` and known ad debt exceeds `maxPodMs`
- **When** a session plan is generated
- **Then** no single pod exceeds the limit
- **And** overflow moves to a second safe window or `remainingAdDebt`
- **And** the UI explains why full consolidation was impossible.

#### AT-R3-02 Distributed planning keeps safe intervals

- **Given** the viewer selects `DISTRIBUTED_SAFE_WINDOWS`
- **When** a session plan is generated
- **Then** pods occupy safe windows
- **And** adjacent pods keep the minimum content interval
- **And** none is scheduled inside climax or protected windows.

#### AT-R3-03 Preference cannot override contract or policy

- **Given** consolidated or distributed preference conflicts with creative placement, competitive separation, frequency or protected-context rules
- **When** the planner applies preference
- **Then** hard constraints win
- **And** a reason is recorded when `preferenceApplied` differs from the request
- **And** unallocated debt is not hidden as satisfied.

#### AT-R3-04 Seeking past a pod triggers versioned replanning

- **Given** active plan revision 1 schedules a pod at 240 seconds
- **When** the viewer seeks to 300 seconds
- **Then** revision 1 becomes `SUPERSEDED`
- **And** revision 2 is generated or `INFEASIBLE` is returned
- **And** real-time decisions for revision 1 return `STALE_SESSION_PLAN`.

#### AT-R3-05 Reservation is not an impression

- **Given** a campaign is reserved for a future pod
- **When** the pod has not executed or the real-time layer rejects it
- **Then** requested/delivered/viewable counts do not increase
- **And** debt decreases only after the defined real event occurs.

### 3. P0 decision and data acceptance

#### AT-D-01 Deterministic replay

Replay the same normalized request and scenario/policy/ranking/analysis versions 100 times. Action, chosen plan, ordering, component scores and reason codes must match exactly; only trace IDs and write timestamps may differ.

#### AT-D-02 Input order does not change the result

Submitting the same candidate set in different array orders must produce the same normalized winner and ordering.

#### AT-D-03 Stable tie-breaking

When primary scores differ by less than 0.02, resolve by timing feasibility, time, stable format priority and ID. Database return order must not affect the result.

#### AT-D-04 Scores are independently checkable

Given the API's ten-part `scoreBreakdown`, a test can recompute the total using current versioned weights within the documented rounding tolerance.

#### AT-D-05 Hard rules run before ranking

A violating plan cannot enter eligible alternatives. It either receives no total score or is explicitly marked unranked even when its commercial score would be highest.

#### AT-D-06 Unapproved creative cannot become a fallback

If only a 15-second version is approved and a six-second version is `PENDING`, the system cannot select or synthesize the six-second version and returns `CREATIVE_NOT_APPROVED`.

#### AT-D-07 The complete demo runs without AI keys

With every AI-provider environment variable empty, precomputed analyses complete all three scenarios, the analysis source remains visible and no credential error blocks the primary flow.

#### AT-D-08 Conservative low-confidence fallback

When AI scene-analysis confidence is 0.42 without human confirmation, the system cannot use “low intensity” to allow a strong interruption; it uses precomputed data or `LOW_CONFIDENCE_CONSERVATIVE_FALLBACK`.

#### AT-D-09 Withdrawn consent removes personal evidence

When T2/T3 evidence consent is `WITHDRAWN`, that evidence does not enter relevance scoring; dependent candidates are rejected with `CONSENT_REQUIRED`, while non-personalized T0 mode still runs.

#### AT-D-10 Expired evidence cannot be used

When `expiresAt` precedes the fixture clock, evidence is marked `EVIDENCE_EXPIRED` and does not affect scores.

### 4. P0 event and metric acceptance

#### AT-E-01 Rendered is not viewable

If an ad is mounted but less than 50% visible or visible for less than two continuous seconds, record only `creative.rendered`; do not record `impression.viewable` or increase viewable frequency.

#### AT-E-02 Viewability increments frequency once

After one delivery crosses the two-second threshold, it emits one `impression.viewable` and increments brand/campaign/creative counts once, regardless of later samples.

#### AT-E-03 Background time does not count

If an ad renders for one second, the page backgrounds for five seconds and returns for one second, background time is excluded and the two discontinuous seconds do not satisfy the rule.

#### AT-E-04 Metric provenance labels

Contract, interruption cost, observed clicks and user feedback are labelled `simulated`, `modelled`, `observed-in-demo` and `user-test`; they are never merged into an unsourced “AI effectiveness score.”

#### AT-E-05 Contract progress derives from events

Rebuilding projections from the event ledger reproduces the UI campaign progress; deleting or changing a cached projection cannot change event facts.

### 5. P0 API acceptance

#### AT-A-01 Invalid input returns a structured error

For `scene.intensity = 1.4`, POST `/api/decisions` returns 4xx, `INVALID_DECISION_REQUEST` and the field path, without emitting `decision.made`.

#### AT-A-02 Decision detail includes the complete audit

Decision detail returns the chosen plan, eligible alternatives, rejected plans, reason codes, scores, evidence, versions and metric provenance.

#### AT-A-03 Duplicate delivery events are idempotent

Submitting the same event ID twice does not duplicate the event or counters and returns a consistent accepted status.

#### AT-A-04 Reset restores scenario initial state

After reset, a new session uses the initial fixture; old events remain auditable or are isolated as documented, and the new decision matches the initial snapshot.

#### AT-A-05 A stale session plan cannot execute

If a request's plan revision is not active, the API returns `STALE_SESSION_PLAN` and emits no `decision.made` or display event.

### 6. P0 browser and accessibility acceptance

#### AT-UI-01 Strategy comparison uses identical input

Baseline and AdMind show the same scenario version, campaigns and initial session state; running one strategy first cannot contaminate the other's counters.

#### AT-UI-02 Keyboard completes the core flow

Keyboard alone can choose scenarios, play/pause, switch strategy, dismiss ads, open the decision inspector, inspect alternatives and return to the player; focus order follows visual order.

#### AT-UI-03 Ad identity and controls are clear

Every ad format has a perceivable “Ad” label; close controls have accessible names and visible focus, and state is not communicated by color alone.

#### AT-UI-04 Do not reproduce the dangerous tiny close button

S3 may illustrate the risky tiny-close pattern in a non-interactive replay, but every interactive demo ad uses a compliant size and hit target.

#### AT-UI-05 Content recovery is verifiable

S1 resumes at the expected boundary after an ad; S2 keeps the original paused position after card dismissal. Browser tests permit a small media-time tolerance but cannot skip complete dialogue or key action.

#### AT-UI-06 Error and fallback states

Missing video, unavailable analysis or a failed decision API produces a specific error/conservative fallback, not endless loading or an unaudited ad.

#### AT-UI-07 Session plan and preference are visible

The player shows planned pods, expected total ad time, requested/applied consolidation preference, remaining debt and plan revision; all values are marked simulated.

#### AT-UI-08 Control hit areas do not overlap

Across supported viewports, CTA, close, progress, play, back and comments/danmaku hit areas do not overlap; browser tests confirm close, seek and back never open the landing page.

#### AT-UI-09 Decision evidence links to the lab

The main site's Decision view exposes a working `/regression` link in English and Chinese. It does not imply that agent drafts are human labels or that a local confirmation trains the model.

### 7. P1 portfolio-complete acceptance

After P0 passes:

- operators can create campaigns and multiple creative versions;
- invalid contract/format combinations are rejected before save;
- contract forecasts come from explainable simulated inventory;
- operators can adjust soft weights within safe bounds but cannot disable hard rules;
- scene metadata can be manually corrected into a new version;
- experiments can batch-compare at least two policy versions;
- metric formulas are tested and exportable as CSV/JSON;
- replaying new policy against old scenarios detects regressions automatically; and
- optional AI upload failure still falls back to precomputed scenarios.

### 8. Phase 1 Go / No-Go checklist

#### Go

- [ ] AT-S1, AT-S2, AT-S3, AT-R1, AT-R2 and AT-R3 all pass;
- [ ] deterministic decisions and hard-rule tests all pass;
- [ ] the 20 S2 1280×720 frames, hashes, historical baseline and v0.4.0 candidate recompute offline;
- [ ] all 20 labels remain identified as agent-authored rather than human ground truth;
- [ ] the 13 priority-review frames and other seven unreviewed agent-rule drafts remain distinguishable; `charge-005/008/013/016/018` stay diagnostic until v2 intake, `charge-002` stays stable, and no other stable-label sample becomes newly unsafe;
- [ ] the immutable 13/13 first-pass artifact remains byte-identical; `/regression/calibrate` covers only eight requested coordinate adjustments and three placement conflicts;
- [ ] schema-v2 export binds the v1 SHA-256, remains local and cannot train a model or update the manifest automatically;
- [ ] `/regression/intake` rejects incomplete or untrusted schema-v2 input, produces preview/rescore evidence without writing the tracked manifest, and clearly labels the comparison as saved-prediction label-only re-scoring;
- [ ] the dedicated Chromium job loads six local MediaPipe assets without jsDelivr, completes 20/20 frames, applies the explicit five-sample diagnostic exception, forbids newly unsafe stable-label samples and uploads JSON/screenshot evidence;
- [ ] the six-frame holdout preserves its 4 cross-source / 2 same-source split, byte hashes, `sealed-unreviewed`, `groundTruth = null` and `useForTuning = false` invariants;
- [ ] resume, seek, hidden/blur, reset and a newer pause invalidate prior session tokens so stale promises cannot deliver;
- [ ] the first v5 CI and hosted fresh runs pass before Stage 1C or any v5 model result is declared complete;
- [ ] unresolved `charge-005/008/013/016/018` labels/boxes are not used as blind tuning targets, while confirmed `charge-002` remains in the stable gate;
- [ ] scorer/rendered geometry is 0.30×0.30 on the 16:9 S2 stage, and weak crop suppression passes its narrow-boundary tests;
- [ ] S1 has an end-to-end browser recording/test;
- [ ] the project runs without AI keys;
- [ ] event and frequency semantics pass;
- [ ] core keyboard paths pass;
- [ ] the public-asset license manifest is complete; and
- [ ] every effectiveness/commercial metric displays provenance.

#### No-Go

Do not call the phase complete if any condition holds:

- commercial weight crosses a protected-context rule or hard frequency cap;
- a decision cannot be replayed or its reasons disagree with its outcome;
- rendered-but-not-viewable media counts as delivered;
- the demo requires a paid AI key;
- real platform private data, unauthorized video or unverified internal mechanisms are used;
- simulated results are presented as real uplift; or
- the primary flow is only static UI without a decision-to-event/metric loop.

---

## 中文

**用途：** 产品、设计、开发和测试共同使用的完成定义
**规则：** 只有通过 P0 条件才算完成纵向闭环；页面能打开不等于功能完成。

---

## 1. 测试层级

| 层级 | 目标 | 推荐实现 |
|---|---|---|
| Domain unit | 公式、频控、候选生成、理由码 | TypeScript unit tests |
| Policy unit | 硬规则永不被排序权重覆盖 | table-driven tests |
| API contract | Schema、错误、版本和事件语义 | integration tests |
| Deterministic fixture | 三场景的预期决定可重放 | snapshot + explicit assertions |
| Browser E2E | 播放、广告、关闭、恢复和对比 | Playwright |
| Accessibility | 键盘、焦点、标签、对比度、点击区域 | axe + manual checks |

## 2. P0 场景验收

### AT-S1-01 高潮处不立即打断

**Given** S1 在 45 秒产生中插机会，当前场景强度 0.94、自然转场 0.05，C1 履约紧急度 0.92
**When** AdMind 处理该机会
**Then** 不能在 45 秒选择 C1 的 15 秒全屏版本
**And** 该方案作为未入选的合格备选保留分项分数
**And** 最终决定包含 `HIGH_INTERRUPTION_NOW`
**And** 入选方案位于允许延迟范围内。

### AT-S1-02 保持保证量活动可行

**Given** C1 仍满足受众、频控、版位和合同条件
**When** 82 秒存在自然转场，且仍位于 40 秒最大延迟窗口内
**Then** 入选活动仍为 C1
**And** 入选素材是已审批 6 秒版本
**And** action 为 `DEFER`
**And** 理由包含 `COMMERCIAL_DELIVERY_URGENT` 与 `SAFE_TRANSITION_PREFERRED`。

### AT-S1-03 不伪造个性化

**Given** 当前只有 T0 内容上下文且与游戏语义关系弱
**When** 系统解释 S1 决定
**Then** 解释包含商业履约依据
**And** 不出现“你喜欢游戏/为你精准推荐”等个人断言
**And** 显示证据等级为 `T0_CONTEXTUAL`。

### AT-S1-04 超出延迟窗口不可投

**Given** 唯一安全转场晚于 `latestAtMs`
**When** 生成投放方案
**Then** 该方案以 `OUTSIDE_DELIVERY_WINDOW` 淘汰
**And** 系统选择其他合格方案或返回 `NO_ELIGIBLE_PLAN`
**And** 保证量活动产生短缺风险提醒。

### AT-S2-01 查看型暂停保留画面

**Given** S2 在 27 秒暂停，分类为 `INSPECTION` 且置信度 0.91
**When** AdMind 处理暂停广告机会
**Then** 不选择覆盖画面的 10 秒全屏版本
**And** 选择已审批、可关闭的低遮挡卡片
**And** 原视频帧和播放控件仍可见。

### AT-S2-02 卡片不遮挡关键区域

**Given** 左上、中央和左下为关键内容/控件区域，右上为安全区域
**When** 卡片渲染
**Then** 卡片边界完全位于允许区域
**And** 关闭控件可见、可聚焦
**And** 不使用整卡隐式跳转覆盖关闭控件。

### AT-S2-03 没有安全区域时延后

**Given** 所有允许区域均与字幕或控件冲突
**When** AdMind 生成候选
**Then** 卡片方案以 `NO_SAFE_RENDER_REGION` 淘汰
**And** 系统尝试 35 秒章节边界
**And** 不自动退回暂停霸屏。

### AT-S2-04 关闭后位置保持

**Given** 观众在 27 秒暂停并关闭卡片
**When** 观众继续播放
**Then** 内容从 27 秒（允许播放器误差范围内）恢复
**And** 产生 `creative.dismissed` 与 `content.resumed` 事件
**And** 不打开新页面。

### AT-S2-05 历史固定回归基线可重算

**Given** `evaluation/s2/manifest.json`、20 张 1280×720 固定帧和已保存的原始预测

**When** 执行 `pnpm test:s2-regression`

**Then** 每张帧文件的 SHA-256 与清单一致

**And** 标注合同不存在重复 ID、越界矩形或展示/顺延矛盾

**And** 20 张保护目标与位置标签全部明确标为代理初标，不是人工标准答案

**And** 13 张 `rule-confirmed` 代理初标进入阻断指标，7 张代理初标保持诊断状态

**And** 原始预测重算出的全部指标与失败案例和已提交基线完全一致：安全位置一致率 `6/13 = 46.2%`，危险误投 `4/13 = 30.8%`，过度顺延 `3/13 = 23.1%`，保护目标精确率 `4/25 = 16.0%`，召回率 `4/11 = 36.4%`，F1 `22.2%`，P50 `318 ms`，P95 `335 ms`

**And** provenance 明确记录：运行者是 v0.3.0 harness 提交 `e3ceabe1eb401b89e9ff4307d093824b9e2b35da`，检测配置行为参考 v0.2.7 提交 `bdf66d1db7511f97feba49713f9995ea6ef13711`，不得声称旧提交直接运行了新 harness。

### AT-S2-06 危险误投不得静默增加

**Given** 阶段 1A 的 13 张阻断代理初标、7 张诊断代理初标和调参前固定集基线，并且没有任何一张被称为人工标准答案

**When** 检测阈值、去重、目标类别或广告占位几何发生变化

**Then** 必须输出修改前后的同集对比

**And** `charge-005/008/013/016/018` 在 schema v2 解决第一轮标签/保护框调整前保持诊断；`charge-002` 已确认并留在稳定门；除这组临时例外外，稳定标签样本不得新增危险误投

**And** 待产品复核的样本只能作为诊断，确认前不得加入阻断分母

**And** 固定集数字必须标为项目内部一致率，不得表述为通用模型准确率。

### AT-S2-07 v0.4.0 候选可重算

**Given** 最终 `s2-vision-v4` 浏览器复跑在运行器/配置提交 `e0a033194ea04a9c926a822e4330355f41ddd152` 上生成的 `evaluation/s2/candidates/v0.4.0.json`，生成时间为 `2026-08-22T03:42:41.155Z`

**When** 确定性回归质量门校验候选结果

**Then** 模型可用性为 20/20

**And** 阻断集结果为安全位置一致率 `7/13 = 53.8%`、危险误投 `3/13 = 23.1%`、过度顺延 `3/13 = 23.1%`

**And** 保护目标为 TP 5 / FP 16 / FN 6，精确率 `23.8%`、召回率 `45.5%`、F1 `31.3%`

**And** 目标 P/R/F1 明确标为 IoU ≥ 0.25 的类别无关原始框探索性匹配，而不是经过校准的语义检测准确率

**And** 推理耗时为 P50 `277 ms` / P95 `307 ms`

**And** `charge-012` 不再属于决策失败

**And** 剩余过度顺延恰好是 `charge-002/008/016`，剩余危险误投恰好是 `charge-005/013/018`

**And** 历史失败列表继续可追溯；当前调参将 `charge-005/008/013/016/018` 作为未解决诊断，并让已确认的 `charge-002` 留在稳定门。

### AT-S2-08 优先复核保持本地、明确且独立

**Given** 由原有 7 张 `needs-user-review` 加 `charge-002/005/008/013/016/018` 组成的 13 张优先队列，另外 7 张仍是未人工审核的代理规则初标

**When** 产品负责人打开 `/regression`

**Then** 默认进入“优先复核”，并同时提供“全部”和“危险误投”筛选

**And** 图例清楚区分绿色代理保护目标、紫色虚线模型输出与蓝色代理预填位置选择

**And** 模型框默认隐藏

**And** 蓝色选择在确认前保持虚线

**And** 四步流程依次检查保护目标、选择全部可接受左上/右上或顺延、填写备注、确认并导出

**And** 已确认结果可以撤销

**And** 答案只保存在浏览器 `localStorage`

**And** 确认不会自动训练模型

**And** 导出生成独立 review JSON，不上传，也不修改 manifest 或已保存结果

**And** 导出 JSON 必须由维护者校验并提交，之后才可能影响标签或指标。

### AT-S2-09 评分与渲染使用同一占位

**Given** S2 在 16:9 舞台中渲染

**When** 位置评分器评估候选且静音卡片实际展示

**Then** 两者都使用标准化 `0.30 × 0.30` footprint

**And** 当前策略不再包含旧的 `0.30 × 0.24` 几何。

### AT-S2-10 弱裁剪抑制保持窄边界

**Given** 仅来自裁剪的视觉主体候选

**When** 执行弱候选过滤

**Then** 只有无脸部中心佐证的低置信 `人物主体` 被移除

**And** 直接检测、强裁剪、动物与无脸角色候选继续保留

**And** 在宣称该启发式规则能够泛化前，必须建立背面低置信人物留出集。

### AT-S2-11 检测器不可用时采用 fail-closed

**Given** S2 同时需要人脸与主体检测器

**When** 任一检测器初始化或运行失败

**Then** 整帧标记为不可用

**And** 不得使用部分检测证据输出广告位置

**And** 不可用的阻断样本在回归指标中计为失败。

### AT-S2-12 v0.4.1 只校准八张被要求调整的保护框

**Given** 不可变 schema v1 第一轮原件记录 13/13 张优先样本意见、5 张保护框接受、8 张要求调整，另有 7 张仍未产品审核

**When** 产品负责人打开 `/regression/calibrate`

**Then** 坐标队列只包含 8 张待调整样本；5 张已接受和 7 张未审核样本不会被静默改标

**And** 复核者可以移动和缩放归一化矩形、输入精确百分比、新增或删除人物/人脸/角色目标，并重置当前建议

**And** `charge-008` 作为纯特效负对照初稿，可以合法地没有保护目标

**And** 每个待确认上角广告位显示规则综合风险百分比，明确同时考虑重叠与邻近度而非纯重叠比例；风险超过当前 40% 阈值时必须警告

**And** 复核者勾选“已检查重点边界和规则综合风险”前不得确认；任何保护框几何变化都必须使该勾选失效

**And** 只有完成 8/8 张目标决定和 3/3 处位置冲突裁决，导出才算完整。

### AT-S2-13 保留复核来源与指标边界

**Given** 归档 v1 复核的 SHA-256 为 `a4dff4b18bb18497909d21ea70d75f1be438021072fc5da9c6b896aeff1d7256`

**When** 导出 schema v2 校准结果

**Then** 它引用该准确的不可变原件，并包含范围合法的归一化替换矩形

**And** 草稿与撤销状态只保存在浏览器 `localStorage`

**And** 页面不会上传导出、训练模型或修改 `evaluation/s2/manifest.json`

**And** 绿色明确表示 AI 辅助的项目代理初标，紫色表示浏览器本地 MediaPipe 输出，两者都不表示 TwelveLabs 输出

**And** schema v2 校验必须传入可信 calibration seed，从不可变源复核推导 8 张目标 ID，并严格要求 `charge-005/008/009` 三处位置裁决，不能信任导出自报 ID

**And** 在维护者校验 v2、建立单独版本化的复核 manifest，并用已保存预测重新评分前，v0.4.0 指标保持不变。

**And** v0.4.1 只记录为校框工具版本，没有新的检测器运行或模型指标。

### AT-S2-14 schema v2 接收保持本地、仅预览、仅标签重评分

**Given** `/regression/intake` 已取得不可变 schema v1 源复核、其 SHA-256、可信 calibration seed 与 v0.4.0 已保存原始预测

**When** 用户选择一份 schema v2 JSON

**Then** 浏览器把所选原件的准确 SHA-256 写入预览证据

**Then** 不完整、被篡改、过期或来源不匹配的文件会在预览和评分前被拒绝

**And** 只有完成 8 张替换坐标决定和准确的 `charge-005/008/009` 三处位置裁决，结果才可进入 ready

**And** 页面只在内存中生成复核 manifest 预览，另外 7 张继续保持诊断状态

**And** 前后数值重评分同一份已保存原始预测，明确标为标签变化比较而不是新推理

**And** 所选文件不会上传；页面不能训练模型、提交文件或覆盖 `evaluation/s2/manifest.json`

**And** 下载的预览/重评分 JSON 继续作为独立证据，必须由维护者另行校验并有意提交。

### AT-S2-15 v5 新鲜浏览器推理必须本地化并通过安全门

**Given** 准确提交已使用 MediaPipe Tasks Vision 1.0.1 与 `s2-vision-v5` 完成构建

**When** 独立 Playwright Chromium 任务在 `/regression` 自动运行 20 张固定帧

**Then** MediaPipe 从 `/mediapipe/wasm` 加载 6 个带校验值的 JS/WASM 文件，不得请求 jsDelivr

**And** 任一关键 WASM、模型或固定帧请求失败都会使任务失败

**And** 20 张必须全部可用，双检测器继续 fail-closed，报告记录 v5/本地 runtime 来源

**And** `charge-005/008/013/016/018` 在 schema v2 完成标签/保护框裁决前暂作诊断例外；`charge-002` 已确认并继续进入稳定门；除此之外，稳定标签样本不得新增危险误投

**And** CI 上传新鲜 JSON 报告和整页截图，失败时保留 trace

**And** 历史 v0.4.0/v4 指标保持不变；首次 CI 和线上新鲜运行通过前不得把 v5 标为完成。

### AT-S2-16 迟到的暂停推理不得投放旧界面或广告

**Given** 一个 MediaPipe Promise 正在为当前暂停会话 token 运行

**When** 恢复播放、开始拖动、页面隐藏或失焦、播放器重置、广告完成、组件卸载，或新的暂停会话开始

**Then** 之前的 token 必须失效

**And** 迟到 Promise 不得更新检测证据、选择位置或显示广告

**And** 一个 token 最多完成一次，并且只有当前活动 token 可以完成。

### AT-S2-17 holdout 必须保持密封、无标签且不可用于调参

**Given** `evaluation/s2/holdout/manifest.json` 包含 6 张 1280×720 图片

**Then** 4 张跨来源样本属于主要留出集，2 张同源 `CHARGE` 样本属于相关性补充诊断

**And** 每张都保持 `sealed-unreviewed`、`useForTuning = false`、`groundTruth = null`

**And** 抽样类别不得表述为产品标签或人工真值

**And** 候选冻结前不得查看模型结果、据此选择阈值/规则或用于训练

**And** 2 张同源样本不得包装成独立泛化证据

**And** 在同一主机、固定 Chromium/源字节下重复抽帧必须逐字节一致；`--verify-only` 检查哈希、尺寸、分组和“无标签、不可调参”约束，不得覆盖密封内容。

### AT-S3-01 商业权重不能突破敏感规则

**Given** S3 场景为人工确认的 `PROTECTED_HEALTH_TASK`，C1 履约紧急度和商业价值均设为 1.00
**When** 任意正向排序权重提高到允许上限
**Then** 全屏、覆盖、自动音频和跳转方案仍全部以 `PROTECTED_CONTEXT` 淘汰
**And** 当前关键流程返回 `NO_ELIGIBLE_PLAN`。

### AT-S3-02 禁止利用敏感语境定向

**Given** 候选活动试图使用健康内容推断个人需求
**When** 进行政策检查
**Then** 以 `SENSITIVE_TARGETING_PROHIBITED` 淘汰
**And** 该证据不进入 `contextualUtility`
**And** 决策审计保留淘汰原因但不存储真实病情。

### AT-S3-03 无方案必须报警且不计曝光

**Given** 当前没有合格形式
**When** 返回 `NO_ELIGIBLE_PLAN`
**Then** 写入 `delivery.skipped` 或 `delivery.deferred`
**And** 产生 `DELIVERY_SHORTFALL_RISK`
**And** 不写入 `impression.viewable`
**And** 合同交付计数保持不变。

### AT-R1-01 跨形式品牌硬频控

**Given** 同一会话中某品牌已通过片头和中插低遮挡卡产生 2 次可视曝光，品牌硬上限为 2
**When** 后续机会考虑该品牌任意素材和形式
**Then** 所有该品牌方案以 `BRAND_FREQUENCY_CAP_REACHED` 淘汰
**And** 更换素材 ID 不得绕过品牌上限。

### AT-R2-01 主动拖动时不启动或保留干扰广告

**Given** S2 卡片可见前，用户按下并开始拖动进度条
**When** interaction state 变为 `SEEKING`
**Then** 卡片撤下且不产生 `impression.viewable`
**And** 不启动新的全屏广告
**And** 拖动结束后基于新播放位置重新计算机会。

### AT-R2-02 弹幕/评论区域成为必要区域

**Given** 用户打开并正在阅读弹幕/评论层
**When** 候选卡片与该区域重叠
**Then** 该方案以 `ESSENTIAL_CONTROL_BLOCKED` 或 `NO_SAFE_RENDER_REGION` 淘汰
**And** 系统移到不重叠区域或延后。

### AT-R2-03 返回操作不能被广告劫持

**Given** 用户触发应用返回/主页面操作
**When** 交互状态变为 `NAVIGATING_AWAY`
**Then** 系统不启动新广告
**And** 返回操作不记录为广告点击
**And** 未达可视阈值的卡片撤下。

### AT-R2-04 广告跳转必须有明确意图

**Given** 广告有一个明确 CTA，关闭控件、进度条和播放器区域与 CTA 热区不重叠
**When** 打开落地页
**Then** 同一 delivery 必须存在更早且有效的 `ad.navigation_intent_recorded`
**And** source element 是 CTA
**And** 没有意图记录的打开产生 `ad.unintended_navigation_detected` 并使测试失败。

### AT-R2-05 返回后恢复任务状态

**Given** 用户从明确 CTA 进入广告落地页
**When** 返回播放器
**Then** 恢复原 content ID、允许误差内的时间位置和播放/暂停状态
**And** 恢复可恢复的弹幕/评论状态
**And** 不重复计可视曝光。

### AT-R3-01 集中偏好受硬上限约束

**Given** 用户选择 `CONSOLIDATED` 且已知广告债务超过 `maxPodMs`
**When** 生成会话计划
**Then** 单广告段不超过上限
**And** 超出部分进入第二安全窗口或 `remainingAdDebt`
**And** UI 显示无法完全集中的原因。

### AT-R3-02 分散计划保持安全间隔

**Given** 用户选择 `DISTRIBUTED_SAFE_WINDOWS`
**When** 生成会话计划
**Then** 广告段位于安全窗口
**And** 相邻广告段满足最小内容间隔
**And** 不安排在高潮/受保护窗口。

### AT-R3-03 偏好不能突破合同与政策

**Given** 集中或分散偏好与素材版位、竞争品牌分隔、频控或受保护规则冲突
**When** 规划器应用偏好
**Then** 硬约束优先
**And** `preferenceApplied` 与请求不一致时记录理由
**And** 不把无法安全分配的债务隐藏为已满足。

### AT-R3-04 快进越过广告段触发版本化重规划

**Given** active plan revision 1 在 240 秒有计划广告段
**When** 用户快进到 300 秒
**Then** revision 1 标记 `SUPERSEDED`
**And** 生成 revision 2 或返回 `INFEASIBLE`
**And** 旧 revision 的实时决定返回 `STALE_SESSION_PLAN`。

### AT-R3-05 计划预留不等于曝光

**Given** 活动被预留到未来广告段
**When** 广告段尚未执行或实时层否决该方案
**Then** 不增加 requested/delivered/viewable 计数
**And** 债务只在满足定义的真实事件后扣减。

## 3. P0 决策与数据验收

### AT-D-01 确定性重放

相同规范化请求、场景/政策/排序/分析版本连续重放 100 次，action、chosen plan、排序、分项分数和理由码完全相同；仅请求追踪 ID 和写入时间可以不同。

### AT-D-02 输入顺序不影响结果

同一候选集合以不同数组顺序提交，规范化后必须得到同一入选方案与排序。

### AT-D-03 稳定平局处理

两方案主分数相差小于 0.02 时，按 timing feasibility、时间、形式稳定优先级和 ID 顺序决胜；结果不得依赖数据库返回顺序。

### AT-D-04 分数可核对

API 返回十项 `scoreBreakdown` 后，测试可使用当前版本权重独立重算总分，舍入误差不超过既定容差。

### AT-D-05 硬规则在排序之前

违规方案即使商业分最高也不计算总分或明确标为未排序，且不能进入合格 alternatives。

### AT-D-06 未审批素材不可作为替代版本

若活动只有 15 秒版本已审批、6 秒版本为 `PENDING`，系统不得选择或自动生成 6 秒版本，且返回 `CREATIVE_NOT_APPROVED`。

### AT-D-07 无 AI 密钥可完整运行

所有 AI provider 环境变量为空时，Demo 使用预计算分析完成三个场景并显示分析来源，不出现阻塞主流程的凭据错误。

### AT-D-08 低置信度保守回退

AI 场景分析置信度 0.42 且没有人工确认时，系统不得以“低强度”判断放行强打断；使用预计算数据或 `LOW_CONFIDENCE_CONSERVATIVE_FALLBACK`。

### AT-D-09 撤回同意后移除个人证据

T2/T3 证据的 consent 为 `WITHDRAWN` 时，证据不进入相关性计算；依赖该证据的候选以 `CONSENT_REQUIRED` 淘汰，T0 非个性化模式仍可运行。

### AT-D-10 过期证据不可使用

`expiresAt` 早于 fixture 时钟时，证据标记 `EVIDENCE_EXPIRED` 且不影响分数。

## 4. P0 事件与指标验收

### AT-E-01 渲染不等于可视

广告组件已挂载但小于 50% 可见或不足连续 2 秒时，只记录 `creative.rendered`，不记录 `impression.viewable`，不增加可视曝光频次。

### AT-E-02 可视后频次只增加一次

同一 delivery 跨过 2 秒阈值后，无论继续展示或收到多少可见性采样，只产生一次 `impression.viewable`，品牌/活动/素材计数各增加一次。

### AT-E-03 页面后台不累计可视时间

广告渲染 1 秒后页面进入后台 5 秒，再回到前台 1 秒，后台时间不计入，两段非连续 1 秒不能满足连续 2 秒规则。

### AT-E-04 指标来源标签

会话结果中的合同、打断成本、真实点击和用户反馈分别显示 `simulated`、`modelled`、`observed-in-demo`、`user-test`，不得合并为无来源的“AI 效果分”。

### AT-E-05 合同进度来自事件

从事件账本重新构建投影后，活动进度与页面一致；删除或改变缓存投影不能改变事件事实。

## 5. P0 API 验收

### AT-A-01 非法输入返回结构化错误

`scene.intensity = 1.4` 时，POST `/api/decisions` 返回 4xx、`INVALID_DECISION_REQUEST` 和字段路径，且不产生 `decision.made`。

### AT-A-02 决策返回完整审计信息

Decision detail 返回 chosen plan、合格备选、淘汰方案、理由码、分数、证据、版本和指标来源。

### AT-A-03 重复交付事件幂等

客户端重复提交相同 event ID 时，不重复写事件或增加计数，并返回一致的已接收状态。

### AT-A-04 Reset 恢复场景初始状态

场景 reset 后，新会话使用初始 fixture，旧事件保留审计或按文档隔离，新会话决定与初始快照一致。

### AT-A-05 旧会话计划不能执行

决策请求携带的 plan revision 不是 active revision 时，API 返回 `STALE_SESSION_PLAN`，不生成 `decision.made` 或展示事件。

## 6. P0 浏览器与可访问性验收

### AT-UI-01 策略切换使用相同输入

Baseline 与 AdMind 显示相同场景版本、活动集合和会话初始状态；先运行哪一种策略都不能污染另一种策略的计数。

### AT-UI-02 键盘可完成核心流程

仅用键盘可选择场景、播放/暂停、切换策略、关闭广告、打开决策检查器、查看替代方案并返回播放器，焦点顺序与视觉位置一致。

### AT-UI-03 广告身份和控制清晰

所有广告形式都有可感知的“广告”标识；关闭控件有可访问名称和可见焦点，不使用仅靠颜色区分的状态。

### AT-UI-04 不复刻危险小叉

S3 的问题重放可以用示意框说明小关闭按钮的风险，但所有可交互 Demo 广告必须采用合格尺寸和命中区域。

### AT-UI-05 内容恢复可验证

S1 完成广告后在预期边界恢复；S2 关闭暂停卡后保持原暂停位置。浏览器测试允许小范围媒体计时误差，但不能跳过完整对白或关键画面。

### AT-UI-06 错误和回退状态

视频资产缺失、分析不可用或决定 API 失败时，UI 显示具体错误/保守回退，不无限 loading，也不静默展示未经审计的广告。

### AT-UI-07 整场计划与偏好可见

播放器展示计划广告段、预计总广告时长、集中/分散请求与实际应用、剩余债务和计划 revision；所有值标为模拟。

### AT-UI-08 控件热区不重叠

在支持的 viewport 中，广告 CTA、关闭控件、进度条、播放、返回和弹幕/评论控制的交互边界不重叠；浏览器测试验证关闭、拖动和返回均不会打开落地页。

### AT-UI-09 决策证据链接实验室

主站 Decision / 决策方式页面在中英文模式下都提供可用的 `/regression` 入口；入口不能暗示代理初标已经人工确认，也不能暗示本地确认会训练模型。

## 7. P1（完整作品集）验收

P1 在 P0 通过后实施：

- 运营人员可创建活动和多个素材版本；
- 非法合同/形式组合在保存前被验证；
- 可视化合同预测来自可解释的模拟库存；
- 操作员可调整安全范围内的软权重，不能关闭硬规则；
- 场景元数据可人工修正并产生新版本；
- 实验可批量比较至少两个策略版本；
- 指标公式有测试并可导出 CSV/JSON；
- 新策略对旧场景重放时能自动发现政策回归；
- 可选 AI 上传失败时仍可回到预计算场景。

## 8. Phase 1 Go / No-Go 清单

### Go

- [ ] AT-S1、AT-S2、AT-S3、AT-R1、AT-R2 和 AT-R3 全部通过；
- [ ] 决策确定性与硬规则测试全部通过；
- [ ] S2 的 20 张 1280×720 固定帧清单、图片哈希、历史基线与 v0.4.0 候选可以离线重算；
- [ ] 20 张标签全部继续明确为代理初标，而不是人工标准答案；
- [ ] 13 张优先复核样本与另外 7 张未人工审核代理规则初标可明确区分；`charge-005/008/013/016/018` 在 v2 接收前保持诊断，`charge-002` 保持稳定，其余稳定标签样本不得新增危险误投；
- [ ] 不可变的 13/13 张第一轮原件保持逐字节一致；`/regression/calibrate` 只覆盖 8 张坐标调整与 3 处位置冲突；
- [ ] schema v2 导出绑定 v1 SHA-256，只保存在本地，不能自动训练模型或更新 manifest；
- [ ] `/regression/intake` 会拒绝不完整或不可信的 schema v2 输入，在不写入受追踪 manifest 的前提下生成预览/重评分证据，并明确说明这是对已保存预测的标签重评分；
- [ ] 独立 Chromium 任务从本地加载 6 个 MediaPipe runtime 文件且不请求 jsDelivr，完成 20/20 张、应用明确的 5 张诊断例外、阻止稳定标签新增危险误投，并上传 JSON/截图证据；
- [ ] 6 张 holdout 保持 4 张跨来源 / 2 张同源分组、字节哈希、`sealed-unreviewed`、`groundTruth = null` 与 `useForTuning = false` 约束；
- [ ] 恢复、拖动、隐藏/失焦、重置和新暂停会使旧 token 失效，迟到 Promise 不得继续投放；
- [ ] 首次 v5 CI 与线上新鲜运行通过后，才能宣布阶段 1C 或任何 v5 模型结果完成；
- [ ] 未解决的 `charge-005/008/013/016/018` 标签/保护框没有被当作盲调目标，已确认的 `charge-002` 继续进入稳定门；
- [ ] 评分器/渲染几何在 16:9 S2 舞台上统一为 `0.30 × 0.30`，弱裁剪抑制通过窄边界测试；
- [ ] S1 具备端到端浏览器录像/测试；
- [ ] 无 AI 密钥可运行；
- [ ] 事件与频控语义通过；
- [ ] 核心键盘路径通过；
- [ ] 公开资产许可清单完整；
- [ ] 所有效果/商业指标显示来源。

### No-Go

出现任一情况不得对外称为完成：

- 商业权重能突破受保护场景或硬频控；
- 决策无法重放或理由与结果对不上；
- 素材虽渲染但未可视仍被计为交付；
- Demo 强依赖付费 AI 密钥；
- 使用真实平台隐私数据、未授权视频或未经证明的内部机制；
- 将模拟结果表述为真实提升；
- 主要流程只有静态页面，没有从决定到事件/指标的闭环。
