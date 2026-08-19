# Research Synthesis

## 1. Research purpose

The research was conducted to discover concrete sources of advertising frustration and translate them into testable product requirements. It was not designed to estimate the prevalence of those views in the general population.

The evidence has four layers:

1. **Platform observation**: what advertising experiences visibly occur on Tencent Video desktop.
2. **Small-sample interviews**: how nine people describe recent frustration, acceptable ads, preferred delivery, and pause-ad interference.
3. **Informal expert consultation**: how to strengthen the project with mature advertising research and measurement practices.
4. **External research**: what peer-reviewed studies and industry organizations report about intrusiveness, congruity, repetition, viewability, and ad experience.

The external layer has now been expanded into a structured scoping review of 43 peer-reviewed publications. Review depth, method, sample, finding, limitation, DOI, and product implication are recorded row by row in `EVIDENCE_MATRIX.csv`.

## 2. Platform observation

Eleven screenshots captured multiple advertising states during one Tencent Video desktop viewing session. Observed patterns included:

- an initial long pre-roll followed by shorter ads;
- pause-triggered advertising;
- split-screen layouts in which the program was reduced while the ad occupied a major portion of the player;
- an advertising treatment built into the program presentation;
- advertising between consecutive episodes;
- a small preview or program window retained while advertising occupied the main view;
- repeated exposure to the same cleanser brand across several placements and creative layouts;
- VIP close messaging, countdowns, purchase calls to action, and small dismiss controls.

These observations do not reveal Tencent's internal targeting, auction, contract, or frequency-control logic. They only establish the visible user experience.

## 3. Interview method and limits

Nine participants answered the same six short questions about:

- their most recent frustrating advertising experience;
- why it was frustrating;
- whether content or timing was the larger problem;
- an ad they did not immediately close;
- preference for one-time or distributed viewing;
- what a pause ad interferes with.

Participants included peers and parents, providing some age and context diversity. The sample was based on convenience and personal relationships. It is suitable for qualitative problem discovery but not for demographic comparisons, percentages generalized to the market, causal claims, or statistical significance.

## 4. Interview findings

### Finding A — timing dominated the frustration narrative

All nine participants identified timing as a primary problem, even when some also disliked the content. Examples included interruption before playing music, ads inside short-video collections, interruption during an exciting scene, interruption while using a needed app function, an ad inserted while reading, a full-screen ad while anxiously viewing a medical test result, and advertising while urgently checking a route near a traffic light.

**Product implication:** relevance alone cannot be the ranking objective. The system needs a task- and context-sensitive interruption cost.

### Finding B — the user's current task changes tolerance

Entertainment, reading, medical information, navigation, and other utility tasks generated different reactions. The medical-results and urgent-route examples are particularly important: the issue was not merely a low relevance score, but an inappropriate commercial interruption during a sensitive or time-critical task. The navigation example is cross-domain evidence for the principle; it does not expand the first video MVP into a map product.

**Product implication:** define protected contexts in which full-screen, auto-play, or sensitive targeting is prohibited. AdMind's video MVP will implement this as a policy model and demonstrate at least one protected-context scenario without claiming access to medical data.

### Finding C — people did not reject every ad

Participants described tolerating or valuing ads that were useful at that moment, informative, amusing, well made, relevant to a current need, or short enough to impose little cost.

**Product implication:** estimate separate dimensions for utility, creative quality, contextual fit, and intrusion. Do not collapse them into a single semantic-similarity score.

### Finding D — most preferred consolidated interruption

Eight of the nine participants generally leaned toward watching a required ad once rather than receiving repeated interruptions. One preferred distributed viewing, and one noted that the answer depends on whether the creative can be divided coherently.

**Product implication:** test an up-front consolidated option, but preserve viewer choice and avoid assuming that fragmentation is always worse.

### Finding E — pause ads interfere with different goals

Reported interference included resuming playback, precise clicking, scrubbing, viewing a page, maintaining mood, thinking, reading on-screen comments, returning to a main page to reply to messages, and using video progress controls. Some participants reported little direct interference.

**Product implication:** pause is not a single intent. The system should treat brief pauses, information inspection, scrubbing, and longer absence differently and maintain access to essential playback controls.

### Finding F — control loss increases frustration

Examples included a tiny close button, an ad that could not be closed, accidental activation of a mini-program, automatic navigation, easy mis-taps, and full-screen coverage.

**Product implication:** AdMind needs interaction-safety rules: visible dismiss controls, no deceptive hit targets, protection against accidental navigation, and a record of unwanted interaction.

### Finding H — format-task compatibility may matter independently of targeting

The ninth participant reported that recommendation-style ads encountered while scrolling video were not usually closed immediately, despite describing strong frustration with ads that interrupt urgent map use or hijack navigation. This single report does not establish why the feed ads were tolerated. Plausible explanations include retained swipe control, compatibility with an already-scrolling task, lower occlusion, short duration, useful content, or targeting relevance.

**Product implication:** keep contextual relevance separate from interaction compatibility. A feed-like ad should not be credited to “precision targeting” without evidence, and a relevant ad should still be penalized or rejected when it blocks the current task.

### Finding G — repetition is experienced across placements

The platform observation showed the same brand appearing in several forms during a session. From the viewer's perspective, a full-screen impression, a pause treatment, and a small card still contribute to the same brand fatigue.

**Product implication:** frequency and fatigue should be calculated across creative, campaign, brand, placement, and session—not independently within each ad format.

## 5. Expert consultation

An academic psychologist with advertising-research experience advised that advertising and consumer-response research has a long professional history, and that specialist firms and scholarly research provide larger samples and more credible measurement than a personal convenience sample.

The consultation led to three methodological decisions:

- use interviews to discover local experience, not to prove population-level prevalence;
- use peer-reviewed studies and industry reports to support general mechanisms and measurement choices;
- maintain a source register and avoid importing headline statistics without checking definitions, dates, samples, and original context.

The later media-audience example added a fourth decision: treat media-level audience fit as a testable, time-stamped cohort hypothesis rather than converting genre or platform use into an assumed individual life role.

## 6. Commercial constraint clarification

Visible delivery does not reveal why an ad entered the candidate pool. A high bid, guaranteed contract, preferred deal, broad campaign eligibility, expected outcome model, house promotion, or backfill rule can produce similar viewer-facing results. AdMind therefore does not claim that the observed game ads necessarily “paid the most.”

Instead, the prototype represents common supply types and makes a sharper product claim:

> Even when a commercially urgent campaign must be delivered, the platform can still optimize the eligible viewer/opportunity, safe window, approved duration/variant, format, and frequency.

This model is supported by peer-reviewed guaranteed-allocation research and industry transaction definitions, but its parameters remain simulated and are not descriptions of Tencent's internal system.

The historical examples mentioned in the consultation are directionally sound but should be stated carefully. J. Walter Thompson established a research department in 1915; behaviorist John B. Watson joined the agency around 1920, not necessarily at the department's founding. Nielsen's former consumer-intelligence business became independent as NielsenIQ in 2021, while Nielsen focused on media measurement.

## 7. Evidence-to-requirement map

| Evidence | Product requirement | Evaluation idea |
|---|---|---|
| Timing repeatedly described as the main problem | Interruption Safety Score and safe-window detection | Compare decisions at climax vs. transition nodes |
| Medical-results interruption | Protected-context policy | Ensure full-screen creative is rejected in protected scenario |
| Useful/relevant ads sometimes accepted | Multi-dimensional creative-context scoring | Inspect relevance and intrusion separately |
| Seven participants leaned toward one-time viewing | Viewer-selectable ad schedule | Compare consolidated and distributed plans |
| Pause goals vary | Pause-intent state machine | Demonstrate short pause, inspection, and away states |
| Tiny close controls and accidental navigation | Interaction-safety policy | Automated UI checks and event logging |
| Urgent route checking near a traffic light | Time-critical task protection | Use as cross-domain evidence; test the principle through protected video-task fixtures |
| Ads obstructed comments, back navigation, and scrubbing | Interaction-state model and control-interference cost | Simulate active scrubbing/comment reading and verify pause overlays yield or withdraw |
| Recommendation ads were not immediately closed | Separate format-task compatibility from targeting relevance | Compare an interruptive overlay with an in-flow treatment without claiming causal precision |
| Same brand repeated across formats | Cross-placement frequency and fatigue model | Verify frequency cap across full-screen/card/overlay |
| Industry measurement distinguishes impressions, reach, frequency, and viewability | Delivery and analytics ledger | Track delivered, viewable, unique, and repeated exposure separately |
| Guaranteed and auction inventory can coexist | Deal types, pacing state, and shortfall forecast | Compare revenue-only and constrained allocation policies |
| Personalization can increase relevance and reactance simultaneously | Evidence tiers, consent provenance, and privacy cost | Compare contextual, cohort, and session-intent decisions |
| Delivery optimization can create demographic skew | Outcome audit and counterfactual scenario fixtures | Hold targeting constant and inspect synthetic delivery distribution |

## 8. Current product hypotheses

- **H1:** Safe timing has more influence on perceived disruption than semantic relevance alone during high-engagement scenes.
- **H2:** A less intrusive format can preserve a valid commercial impression when a full interruption is inappropriate.
- **H3:** Cross-placement frequency control reduces repetitive exposure without necessarily reducing campaign reach.
- **H4:** A protected-context policy prevents high-risk experiences that a relevance-only model might mistakenly select.
- **H5:** Explanations and viewer controls increase perceived fairness, provided they cause observable downstream changes.
- **H6:** For a must-deliver campaign, optimizing time/format/variant improves viewer guardrails relative to immediate full-screen delivery while preserving feasible commercial delivery.
- **H7:** Explicit first-party session intent outperforms weak media-cohort inference in perceived relevance without requiring hidden cross-platform profiling.
- **H8:** Separating commercial urgency from relevance produces more truthful and auditable explanations than a single opaque score.
- **H9:** Preserving task controls and avoiding unintended navigation reduces interaction harm independently of semantic relevance.
- **H10:** A viewer-selected consolidated schedule can reduce repeated interruption when contract, maximum pod length, and creative-coherence constraints remain feasible.

These are hypotheses to test in a prototype, not claims already proven by the interviews.

## 9. Research completion decision

The discovery interview phase is complete. Additional personal outreach is not required. Future research effort should be directed toward:

- prototype usability tests after there is something concrete to compare;
- controlled scenario evaluation;
- literature review tied to specific product decisions;
- transparent simulation of contract delivery and viewer outcomes.
