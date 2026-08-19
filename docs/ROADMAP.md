# Roadmap

AdMind is moving from a stable public portfolio prototype toward a calibrated, evidence-backed product demonstration. Roadmap items are ordered by product risk rather than visual novelty.

## Phase 0 · Stable demonstration — complete

- S1, S2 and S3 run in one continuous product experience.
- Cached semantic evidence is connected to the decision layer.
- Pause, resume, seeking, focus and visibility state are represented.
- S2 can score candidate ad positions and clean up stale UI state.
- Ethical hard rules can block commercially valuable plans.
- The project has a repeatable build, tests, CI, public source repository and hosted deployment.

## Phase 1 · Calibrate S2 — next

- Build a fixed set of 15–20 paused-frame regression samples.
- Mark protected subjects and acceptable ad regions by hand.
- Measure false negatives, false positives, position accuracy and reject accuracy.
- Tune thresholds, box deduplication, minimum size and region risk against the complete set.
- Convert the agreed behavior into regression tests.

Exit criterion: S2 results are reported from repeatable samples rather than visual intuition.

## Phase 2 · Evidence credibility

- Verify S1 and S3 segment transitions through continuous playback.
- Document the source, model, run date and limitations of each cached analysis.
- Keep model evidence separate from deterministic policy decisions in the UI and API.
- Add browser-level regression for media switching, seeking and scenario transitions.

## Phase 3 · Product completeness

- Introduce a structured Chinese/English copy dictionary and language switch.
- Improve keyboard, screen-reader and reduced-motion coverage.
- Move heavier paused-frame inference into a worker when profiling justifies it.
- Upgrade deferred delivery from session UI state to a durable task object.

## Phase 4 · Public portfolio release — complete

- Confirm the project-owned game-ad artwork for public portfolio use.
- Publish a clip-by-clip asset manifest with source URLs, authors, licenses, modifications and checksums.
- Publish the source repository with an explicit all-rights-reserved position; no open-source license is implied.
- Add release notes, a version tag and a GitHub Release.
- Run a final secret, dependency and repository-size audit.

Still open after the portfolio release:

- Choose whether the hosted demo itself should be public or invitation-only.
- Validate a clean clone on macOS and Linux in addition to CI.
- Complete a dedicated accessibility audit.

## Future production research

- Persistent decision and audit storage.
- Campaign administration and approved-creative workflows.
- Cross-page and cross-device delivery orchestration.
- Larger licensed evaluation sets and calibrated business metrics.
- A/B experimentation for interruption, completion and advertiser outcomes.

These items are research directions, not claims about the current implementation.
