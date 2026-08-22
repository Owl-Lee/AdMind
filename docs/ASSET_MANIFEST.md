# Asset manifest

This file records the provenance and release basis for binary assets distributed with AdMind. It is part of the public-release checklist: a new media or model file must be added here before it is committed.

## Project-owned creative

| Local file | Owner / source | Release basis | Notes |
| --- | --- | --- | --- |
| `public/game-ad-clean.png` | AdMind project owner | Project-owned portfolio asset | The owner confirmed on 2026-08-19 that this image may remain in the public project. It is used as the fictional ad creative. SHA-256: `473ff1ee2a2eae70fe6ee06c7e615b7fb0f565ae5acabaef2e8b0947fb9d29ca`. |
| `docs/images/admind-showcase.png` | AdMind project | Project screenshot | Captured from the AdMind interface; contains only assets already listed in this manifest. |
| `public/og.png` | AdMind project | Project social-preview artwork | Created for the AdMind repository and deployment. |

## Blender open movies

| Local file | Original work | Author / source | License | Local modification |
| --- | --- | --- | --- | --- |
| `public/admind-charge-demo-720p.mp4` | [CHARGE](https://studio.blender.org/projects/charge/) | Blender Foundation / Blender Studio | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Excerpted and encoded at 720p for the interactive demonstration. SHA-256: `060b30c3b09c9734ac7806d940dcde7cc853e4bc73fd63a0eb9f6acb3300debe`. |
| `public/coffee-run-emotion-720p.mp4` | [Coffee Run](https://studio.blender.org/projects/coffee-run/) | Blender Foundation / Blender Studio | [CC BY 4.0](https://studio.blender.org/projects/coffee-run/pages/licensing/) | Excerpted and encoded at 720p. SHA-256: `dea550b93142a72d108b5696c90b8840eb6e6ba00f3becc2a7ff5a0ca42aee36`. |
| `public/llamigos-chase-720p.mp4` | [Caminandes: Llamigos](https://studio.blender.org/projects/caminandes-3/) | Blender Foundation | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Excerpted and encoded at 720p. SHA-256: `4feb570456e8afc77af20a73f65b07733d32cdc1a8e3e2f366289c9154452831`. |

Attribution: `(CC) Blender Foundation | studio.blender.org`. Blender names and logos are not used to imply endorsement.

### Derived S2 regression frames

`public/evaluation/s2/frames/*.jpg` contains 20 fixed 1280×720 still frames extracted from `public/admind-charge-demo-720p.mp4` for the Stage 1A paused-frame regression set. They remain derivative works of `CHARGE` under CC BY 4.0 and retain the attribution above. Exact timestamps and individual SHA-256 values are recorded in `evaluation/s2/manifest.json`; the rule-drafting contact sheet is `evaluation/s2/contact-sheet.jpg` (SHA-256: `439e116628aae6c637943ad4aed18e9dc5e2b3866eb0fa340c7b99ad984fd138`). The project agent drafted every protection target and acceptable placement from explicit rules: 13 rule-clear samples are marked `rule-confirmed`, while seven subjective samples remain `needs-user-review` until the product owner reviews them. The stills are evaluation evidence, not new project-owned artwork.

## U.S. government visual information

| Local file | Original work | Agency / author | Status | Local modification |
| --- | --- | --- | --- | --- |
| `public/coast-guard-rescue-720p.mp4` | [Coast Guard rescues man and dog during Hurricane Helene](https://www.dvidshub.net/video/938165/coast-guard-rescues-man-and-dog-during-hurricane-helene), VIRIN `240927-G-GO107-1224` | U.S. Coast Guard PADET Jacksonville; video by Petty Officer 2nd Class Hudson, edited by Lt. Cmdr. Kellerman | The source page marks the work Public Domain | Encoded at 720p for the demonstration. SHA-256: `015e5fcf3f9906260d11f8e3c78db4ec3c8bfe936deda9646b286fc91908e512`. |
| `public/usns-medical-evacuation-720p.mp4` | [USNS Comfort Sailors conduct medical evacuation with the Sea Knights](https://www.dvidshub.net/video/556228/usns-comfort-sailors-conduct-medical-evacuation-with-sea-nights), VIRIN `171004-N-ZN152-0098` | U.S. Navy; video by CPO Ernest Scott | The source page marks the work Public Domain | Encoded at 720p for the demonstration. SHA-256: `ed0634d484009894a4a744b36439f61059d586f5af60be343159c5020cb9c6c7`. |

Required non-endorsement notice: **The appearance of U.S. Department of War (DoW) visual information does not imply or constitute DoW endorsement.** DVIDS also notes that publicity, privacy, trademark and third-party rights may still apply. AdMind uses the clips for product research and portfolio explanation, not as an endorsement, advertisement for a government component, or statement by the people depicted.

## Browser-side model assets

| Local file | Upstream URL | Upstream project | License / notice | SHA-256 |
| --- | --- | --- | --- | --- |
| `public/models/blaze_face_full_range.tflite` | [MediaPipe BlazeFace full range](https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_full_range/float16/1/blaze_face_full_range.tflite) | Google MediaPipe | [Apache License 2.0](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE) and upstream model terms | `3698b18f063835bc609069ef052228fbe86d9c9a6dc8dcb7c7c2d69aed2b181b` |
| `public/models/efficientdet_lite0.tflite` | [MediaPipe EfficientDet-Lite0 int8](https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/1/efficientdet_lite0.tflite) | Google MediaPipe | [Apache License 2.0](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE) and upstream model terms | `0720bf247bd76e6594ea28fa9c6f7c5242be774818997dbbeffc4da460c723bb` |

## Intentionally excluded

- The previous raw game-ad screenshot is not used or distributed in the public release.
- The earlier FEMA news excerpt is excluded because its exact source and downstream rights were not documented to the same standard as the DVIDS assets.
- The optional Sprite Fright pause-demo excerpt used in the private hosted build is not distributed in Git.

## Adding an asset

Before committing a binary asset, record its original title, author, canonical source URL, license or public-domain basis, modifications, filename and SHA-256. Do not rely on “found online,” fair-use assumptions, or a platform label without preserving the source page.
