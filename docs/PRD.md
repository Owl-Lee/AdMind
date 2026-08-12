# AdMind Product Requirements Document

**Version:** 0.3  
**Status:** Phase 1 product contract approved for prototype and vertical-slice implementation  
**Product type:** AI-assisted contextual ad orchestration platform for long-form video  
**Portfolio positioning:** Flagship end-to-end commercial product project

## 1. Executive summary

AdMind is a contextual decision layer for long-form video advertising. For each eligible ad opportunity, it selects a valid combination of:

- **creative** — which approved ad asset;
- **timing** — now, at a nearby safe window, or at a delivery fallback;
- **format** — full-screen video, reduced/split view, card, overlay, or deferred slot;
- **duration/variant** — among versions already approved for the campaign.

The system must respect hard campaign and policy constraints while optimizing commercial value and viewer disruption. It does not remove advertising obligations or invent unapproved brand claims.

Commercial eligibility and experience orchestration are separate decisions. A campaign may enter the candidate pool because of a guaranteed contract, fixed-price deal, auction value, delivery pacing, or house/backfill rule. AdMind then determines whether the viewer/opportunity is eligible and which timing, format, and approved variant form the best feasible plan.

Version 0.3 adds a lightweight whole-session planning layer. It allocates known simulated ad debt across safe future windows, applies an explicit consolidated/distributed preference within hard limits, and exposes plan revisions. The real-time orchestrator still revalidates every planned reservation against actual scene, interaction, frequency, consent, and policy state before delivery.

## 2. Problem statement

Long-form video platforms depend on advertising revenue, but a technically delivered impression can still be commercially poor. An ad shown at an emotional climax, repeated across placements, covering information the viewer paused to inspect, or forcing an accidental navigation may:

- cause the viewer to close the ad or leave the content;
- damage attitudes toward the advertiser and platform;
- waste repeated impressions on the same person;
- satisfy a raw delivery count without earning useful attention.

Most viewer-facing descriptions of targeting focus on “the right ad for the right person.” AdMind's differentiator is the joint decision:

> the right approved ad, at the safest commercially valid moment, in the least disruptive eligible format.

## 3. Goals

### Product goals

- Demonstrate an end-to-end contextual ad decision, delivery, feedback, and analytics loop.
- Balance contractual delivery with viewer-experience costs using explicit, inspectable objectives.
- Detect and avoid unsafe interruption windows and protected contexts.
- Manage creative and brand fatigue across placements within a viewing session.
- Provide decision explanations and a deterministic fallback when AI confidence is low.
- Allow an evaluator to compare a baseline scheduler with AdMind under identical simulated conditions.
- Show a versioned whole-session ad plan so that locally reasonable decisions do not create repeated global interruption.
- Protect active playback tasks such as scrubbing, reading comments/danmaku, returning to another page, and preserving content state after an explicit ad visit.

### Portfolio goals

- Show product research, system design, AI integration, backend modeling, frontend interaction, analytics, testing, and documentation.
- Remain runnable in a no-key demo mode with seeded analysis and simulated campaigns.
- Avoid false claims about Tencent integration, production traffic, real revenue lift, or model accuracy.

## 4. Non-goals

- Rebuilding Tencent's production ad exchange, billing, auction, identity graph, or recommendation stack.
- Supporting every short-video, UGC, live-stream, web-page, and connected-TV platform in version 1.
- Using camera, microphone, facial expression, or biometric surveillance to infer viewer emotion.
- Using sensitive health, financial, legal, or children's data for targeting.
- Generating or editing advertiser claims without an approval workflow.
- Pretending simulated metrics are actual business outcomes.
- Splitting the project into microservices without an operational reason.
- Claiming that the Phase 1 session planner solves production-scale, cross-site inventory allocation.

## 5. Users and stakeholders

### Viewer

Wants to continue the content with minimal disruption, retain control, understand why an ad appeared, and give feedback that changes future behavior.

### Ad operations manager

Needs to configure campaigns and eligible creative variants, track delivery, inspect rejections/deferments, and intervene when business goals are at risk.

### Platform product or monetization manager

Needs to balance revenue, delivery, retention, and experience; compare policies; and audit why decisions were made.

### Advertiser or campaign analyst

Needs valid delivery, useful reach, controlled frequency, brand-safe context, and interpretable performance reporting.

### Policy and trust reviewer

Needs enforceable protected contexts, category exclusions, interaction rules, privacy limits, and an audit trail.

## 6. Core jobs to be done

- **Viewer:** “When advertising is required, help me remain oriented in the content and avoid unnecessary interruption or loss of control.”
- **Platform:** “Complete commercially valuable delivery without creating avoidable churn or mistrust.”
- **Advertiser:** “Reach eligible viewers in contexts that do not waste impressions or harm my brand.”
- **Operator:** “Show me why delivery changed and give me safe levers to resolve shortfalls.”

## 7. Product principles

1. **Hard constraints before optimization.** Contract, consent, policy, brand safety, and format eligibility are filters, not soft suggestions.
2. **Context is more than relevance.** Semantic match, task urgency, emotional intensity, sensitive context, and interruption safety are separate features.
3. **AI interprets; deterministic systems enforce.** AI may classify scenes and propose metadata; rules enforce policy and a scoring engine makes a reproducible choice.
4. **Graceful fallback beats confident guessing.** Low-confidence or unavailable AI uses precomputed metadata or conservative policies.
5. **Viewer feedback must change state.** “Not interested,” repetition complaints, and preference controls affect later eligibility or ranking.
6. **One viewer experiences one brand across formats.** Frequency and fatigue are not isolated by placement.
7. **Every metric must disclose its origin.** Simulated, observed, user-reported, and externally sourced values remain distinguishable.

## 8. Core user scenarios

### Scenario 1 — pause to inspect information

The viewer pauses on a subtitle, product detail, or important frame. A baseline scheduler immediately covers or shrinks the content. AdMind recognizes an inspection-like pause with sufficient confidence, keeps playback controls available, and uses a small eligible card or delays the impression.

### Scenario 2 — emotional climax

The content enters a high-intensity scene immediately before an eligible mid-roll. AdMind marks the current node unsafe, finds the nearest safe boundary within the campaign's allowed delay, and records the deferral reason. If no safe boundary exists before a hard deadline, the delivery fallback applies and the player resumes at a complete dialogue/shot boundary.

### Scenario 3 — relevant informational context

A viewer watches a technology review during a calm transition. An approved informational device creative has high contextual utility and an eligible card variant. AdMind selects the card while avoiding claims that relevance alone guarantees acceptance.

### Scenario 4 — repeated brand across formats

The same brand has already appeared as a pre-roll and pause card. A full-screen creative from that brand is eligible but exceeds the session fatigue threshold. AdMind selects another campaign or a different creative subject to delivery constraints, and logs the cap.

### Scenario 5 — protected context

A scenario is tagged as sensitive/high urgency. AdMind rejects full-screen, autoplay audio, deceptive close controls, and sensitive-category targeting. If an ad is allowed, it uses a neutral non-targeted placement outside the critical task flow.

### Scenario 6 — delivery shortfall

A high-priority campaign is behind its simulated obligation. The system increases priority only within policy and experience guardrails, searches upcoming safe nodes, and exposes a forecast and reason. It never silently breaks a protected-context rule.

### Scenario 7 — high-value but weakly relevant game campaign

A broad game campaign has high simulated commercial value or must-deliver urgency, but little evidence of individual relevance. A revenue-only baseline shows a full-screen creative immediately. AdMind does not pretend the ad is personally relevant: it selects the least disruptive approved variant and nearest safe window that preserve feasible delivery, then explains the commercial and experience components separately.

### Scenario 8 — commerce intent versus media-cohort evidence

A recent first-party product search is treated as stronger intent evidence than a media-level demographic hypothesis. The system displays the evidence tier, provenance, recency, and confidence. Weak cohort evidence cannot be phrased as an individual fact.

### Scenario 9 — whole-session schedule preference

The viewer requests consolidated delivery. The session planner groups compatible reservations into one safe pod up to a maximum duration and exposes any debt that must remain in a later window. A distributed policy uses the same contracts and total load across multiple safe transitions. Neither preference can bypass protected contexts, format eligibility, frequency, or brand separation.

### Scenario 10 — active control use and explicit navigation intent

While a pause card is visible, the viewer starts scrubbing, reads comments/danmaku, or navigates back. AdMind yields essential controls, withdraws or relocates the card, and never treats those actions as an ad click. A landing page opens only after an explicit CTA action and returning restores the content task state.

## 9. Functional requirements

Priority uses `P0` (vertical slice), `P1` (portfolio-complete), and `P2` (advanced).

### Viewer experience

- **P0** Play original/licensed demo video with timeline scene markers.
- **P0** Switch between baseline and AdMind scheduling for the same scenario.
- **P0** Render at least full-screen, card, and deferred outcomes.
- **P0** Preserve essential playback controls during pause advertising.
- **P0** Capture close, dismiss, resume, click, leave, and feedback events.
- **P0** Display the whole-session plan, current revision, planned pods, simulated ad debt, and requested/applied schedule preference.
- **P0** Preserve seek, playback, back, close, and active comment/danmaku controls; do not open an ad destination without a recorded explicit CTA intent.
- **P0** Restore content ID, playback position/state, and recoverable overlay state after returning from an explicit ad visit.
- **P0** Offer a consolidated-vs-distributed schedule preference within pod, contract, frequency, and safety constraints.
- **P1** Explain “Why this ad/format/time?” in plain language.
- **P1** Apply user feedback to later decisions in the same demo session.
- **P1** Resume content at an intelligible boundary after forced interruption.
- **P2** Adapt layouts for desktop, mobile, and TV interaction constraints.

### Content and scene analysis

- **P0** Ingest precomputed scene metadata for no-key demo mode.
- **P0** Represent category, transition, subtitle importance, intensity, sensitivity, occlusion zones, and ad-suitability confidence.
- **P1** Run an optional AI analysis pipeline on an uploaded/licensed clip.
- **P1** Store model, prompt/version, timestamp, confidence, and raw-to-normalized mapping.
- **P1** Permit human correction of scene labels.
- **P2** Detect dialogue/shot boundaries for post-ad resume.

### Campaign and creative management

- **P0** Seed multiple campaigns with delivery targets, priority, allowed windows, categories, and format eligibility.
- **P0** Represent campaign supply as guaranteed, auction, preferred/fixed-price, or house/backfill.
- **P0** Track delivery pacing, remaining qualifying impressions, deadline, and synthetic shortfall cost.
- **P0** Support multiple pre-approved variants per creative.
- **P0** Model campaign, brand, creative, placement, and session frequency caps.
- **P1** Create/edit campaigns through an operations console.
- **P1** Forecast delivery against remaining eligible opportunities.
- **P1** Configure category adjacency and competitor-separation rules.
- **P2** Model budgets and a simplified auction without claiming production realism.
- **P2** Compare alternative allocation policies under identical synthetic inventory forecasts.

### Policy and decision engine

- **P0** Filter candidates by active window, placement, format, delivery, category, frequency, and protected-context policy.
- **P0** Score eligible plans across commercial value, delivery urgency, expected utility, interruption cost, fatigue, and risk.
- **P0** Return a decision, alternatives, score breakdown, rejected reasons, and fallback path.
- **P0** Rank complete plans (`campaign + creative variant + viewer/opportunity + time + format`), not campaigns alone.
- **P0** Keep commercial eligibility/urgency distinct from relevance and interruption cost in explanations.
- **P0** Produce the same result for the same normalized inputs and engine version.
- **P0** Consume an active session-plan ID/revision and reject stale plan revisions.
- **P0** Treat essential-control occlusion, unintended navigation, active seeking/navigation-away conflicts, and protected task contexts as hard rules.
- **P1** Support operator-configurable weights within bounded safe ranges.
- **P1** Run shadow decisions without changing the shown experience.
- **P1** Record policy and model versions for audit.
- **P2** Calibrate ranking weights using offline experiments.

### Privacy, targeting, and evidence provenance

- **P0** Label targeting evidence as contextual (T0), measured media cohort (T1), first-party session intent (T2), or commerce intent (T3).
- **P0** Store evidence source, date, scope, confidence, consent basis, and expiration.
- **P0** Provide a non-personalized contextual mode.
- **P1** Audit synthetic outcome distribution across configured groups even when targeting inputs are neutral.
- **P1** Prevent engagement feedback from silently expanding sensitive or stereotyped audience rules.

### Analytics and experimentation

- **P0** Maintain an append-only event ledger for decisions and viewer actions.
- **P0** Separate requested, delivered, viewable, completed, clicked, dismissed, and abandoned outcomes.
- **P0** Calculate frequency and fatigue across formats.
- **P0** Compare baseline and AdMind on the same seeded scenarios.
- **P0** Record plan creation, reservation, re-planning, supersession, interaction-state, navigation-intent, and unintended-navigation events.
- **P0** Ensure planned reservations never count as requested, delivered, or viewable impressions.
- **P1** Provide an experiment configuration and results dashboard.
- **P1** Show guardrail breaches and delivery shortfall forecasts.
- **P1** Export anonymized scenario results.
- **P2** Support replay of historical decision inputs against a newer engine version.

## 10. Decision contract

Each decision request should contain normalized, inspectable data:

```json
{
  "session_id": "demo-session-01",
  "session_plan": {
    "id": "session-plan-01",
    "revision": 2,
    "requested_preference": "CONSOLIDATED",
    "applied_preference": "DISTRIBUTED_SAFE_WINDOWS"
  },
  "content_id": "licensed-tech-review",
  "scene": {
    "timestamp_ms": 91200,
    "intensity": 0.31,
    "natural_transition": 0.87,
    "subtitle_importance": 0.18,
    "sensitivity": "none",
    "analysis_confidence": 0.92
  },
  "viewer_state": {
    "pause_state": "inspection",
    "interaction_state": "INSPECTING_FRAME",
    "active_controls": ["PLAYBACK", "SEEK_BAR", "BACK"],
    "recent_brand_exposures": {"brand-a": 2},
    "personalization_allowed": true
  },
  "opportunity": {
    "placement": "pause",
    "max_delay_ms": 15000,
    "eligible_formats": ["card", "split", "fullscreen"]
  }
}
```

The response must distinguish chosen plan, rejected candidates, reasons, uncertainty, and fallback:

```json
{
  "decision_id": "dec-001",
  "action": "show",
  "creative_id": "creative-tech-card-v2",
  "format": "card",
  "scheduled_at_ms": 91200,
  "score_breakdown": {
    "commercial_value": 0.70,
    "delivery_urgency": 0.42,
    "contextual_utility": 0.86,
    "interruption_cost": 0.14,
    "fatigue_penalty": 0.08,
    "policy_risk": 0.00
  },
  "reason_codes": ["PAUSE_INSPECTION", "LOW_OCCLUSION_FORMAT"],
  "fallback": "defer_to_transition_105000",
  "engine_version": "policy-0.1/ranker-0.1"
}
```

## 11. Ranking formulation

After hard filtering, an eligible plan receives a transparent score:

```text
plan_score =
    w1 * commercial_value
  + w2 * delivery_shortfall_reduction
  + w3 * advertiser_outcome_value
  + w4 * predicted_valid_attention
  + w5 * contextual_utility
  - w6 * interruption_cost
  - w7 * interaction_interference_cost
  - w8 * brand_fatigue
  - w9 * abandonment_risk
  - w10 * privacy_and_fairness_risk
```

This formula is a product model, not a claim about Tencent's production algorithm. Initial values are scenario parameters. Later tests may vary the weights, but protected-context and contract eligibility remain outside the weighted trade-off.

## 12. Success metrics

### Primary product metric

**Low-negative-feedback viewable delivery rate**: the share of required, viewable impressions that do not immediately produce a close, leave, repetition complaint, or timing complaint in the simulated/test session.

### Commercial metrics

- delivery completion rate;
- unique reach and deduplicated frequency;
- viewable impression rate;
- creative completion rate;
- delivery shortfall forecast;
- eligible-opportunity utilization.

### Viewer metrics

- post-ad abandonment rate;
- immediate dismissal rate;
- resume success/time;
- timing, repetition, relevance, and occlusion feedback;
- accidental-navigation rate;
- interruption cost per session.
- interaction-interference cost and essential-control blocked duration;
- unintended-navigation count and state-restoration success;
- requested versus applied schedule preference and explained deviation.

### System metrics

- decision latency;
- deterministic replay agreement;
- percentage of decisions using fallback;
- policy violation count;
- analysis confidence and human-correction rate.
- session-plan deterministic replay agreement;
- re-plan count/reasons and stale-plan rejection count;
- planned-reservation versus actual-delivery reconciliation.

No improvement percentage may be presented as real-world performance unless it comes from a disclosed test with an appropriate sample.

## 13. Privacy, ethics, and safety requirements

- Do not infer sensitive health, financial, religious, legal, or sexual attributes for targeting.
- Do not use raw interview identities in the public repository.
- Provide a non-personalized mode.
- Clearly label advertising and maintain accessible close controls.
- Prohibit deceptive hitboxes, forced accidental navigation, and hidden dismiss actions.
- Require explicit CTA intent provenance before opening an ad destination, and keep ad, dismiss, seek, playback, back, and comment/danmaku hit regions non-overlapping.
- Log which first-party signals influence a decision.
- Use original, licensed, public-domain, or clearly permitted demo content.
- Keep AI-generated analysis reviewable and reversible.
- Treat protected-context rules as non-overridable by delivery urgency in the demo.
- Never describe media-level or demographic evidence as a known fact about an individual.
- Never infer parenting status, health need, financial vulnerability, or similar life circumstances from genre/platform use.

## 14. Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Project looks like a generic recommender | Center timing, format, contract, fatigue, and protected-context decisions |
| Complexity causes incomplete delivery | Build a vertical slice first; gate each phase with executable acceptance criteria |
| AI is unavailable or expensive | Seed precomputed scene analysis and make live AI optional |
| Demo metrics appear fabricated | Label simulation inputs and outputs; publish scenario definitions |
| Copyright/trademark confusion | Use original UI and licensed demo assets; state inspiration accurately |
| Sensitive-context relevance becomes exploitative | Prohibit sensitive targeting and separate utility from semantic match |
| Operator weights bypass policy | Hard-filter policy rules before ranking and constrain configurable ranges |
| Repetition is hidden across formats | Maintain brand/campaign/creative/session counters in a shared ledger |
| “High-paying ad” is stated as fact from a screenshot | Present multiple plausible supply mechanisms and label the demo model as simulated |
| Audience stereotype is mistaken for precise targeting | Require source/date/confidence and use evidence tiers with a contextual fallback |
| Revenue pressure silently overrides safety | Hard-filter protected contexts and expose unresolved delivery shortfall |

## 15. Release decision for v0.3

Product discovery and the Phase 1 product contract are complete enough to begin implementation after user confirmation. The authoritative build target consists of the product decision package, scenario pack, session-planner specification, decision-engine specification, and acceptance tests. Implementation starts with the S1 real-time vertical slice, then adds the lightweight whole-session planner and interaction regressions without expanding the MVP beyond long-form video.
