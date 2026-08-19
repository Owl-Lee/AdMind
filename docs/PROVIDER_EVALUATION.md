# Video provider evaluation

Evaluation date: 2026-08-13  
Shared media: `public/admind-charge-demo-720p.mp4` (89.5 seconds)  
Shared contract: `VideoAnalysis` schema v1.0  
Shared task: segment narrative intensity, motion, audio, transitions, sensitive context, and candidate ad windows without making the final commercial decision.

## Current status

| Provider | Model | Status | Result |
| --- | --- | --- | --- |
| TwelveLabs | Pegasus 1.5 | Completed | Six segments and two candidate breaks returned and validated. |
| Gemini | Gemini 3.6 Flash | Provider access blocked | The key authenticates and lists models, but generation returns HTTP 403: project denied access. No model-quality conclusion is possible yet. |

## TwelveLabs result

An initial unconstrained prompt was not stable enough for production use: separate runs suggested 01:19 and 01:29.5. The experiment was therefore corrected to include the real campaign context: nominal opportunity 00:45, maximum deferral 40 seconds, executable window 00:45–01:25.

Two repeated runs with that identical contract-aware prompt agreed on the decision-relevant output:

- 00:45 is inside the active high-intensity fight and should be blocked as an interruption candidate (`confidence: 0.95` in both runs).
- No clearly safe `allow` point exists before the delivery deadline.
- 01:25 is only a `delay` candidate: the fight has just ended, but fire, debris, and recovery remain visually intense (`confidence: 0.80–0.85`).
- AdMind therefore treats 01:25 as a least-disruptive contractual fallback, not as an objectively “safe” moment. It pairs the delay with the shorter muted card.
- Violence is detected across the fight, but the output does not establish that a character is dying. This is evidence for a policy layer, not an authoritative sensitive-scene verdict.
- The provider reported that audio/dialogue evidence was unavailable, so its audio intensity values should not be treated as measured audio features in this run.

## Supplier decision

TwelveLabs is the selected active supplier and is integrated as the cached S1 perception source. Both normalized runs and raw responses are retained for reproducibility. Gemini is deferred and is not required by the current architecture because the normalized contract keeps the perception layer replaceable.

The current contract-aware runs agree that 00:45 is `BLOCK` and 01:25 is only `DELAY`. The full-plan validator rejects the 6-second card at 01:25 because it would outlast the 89.5-second video, then selects a 4-second approved muted end-card variant that completes before the credits boundary.

API keys remain local. The deployed site reads only validated cached JSON and performs no paid inference per visitor.
