---
name: feedback-no-cropped-illustrations
description: "Don't cut up the artist's illustrations as textures; new art is made from them as reference (the user generates it with GPT from asset prompts)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: a4788514-f157-4c7b-a85f-d1c7c0da3bbd
  modified: 2026-11-06T00:45:16.836Z
---

Don't crop or tile pieces of 신해달's illustrations (story-collect, story-deliver, etc.) to build gallery surfaces, props or backdrops. The user said the cut-up result looked low quality. Treat her work as a style reference, and make new art in that style.

**Why:** cropped patches mirrored and seamed badly, read as flat cardboard, and broke her drawings apart (2026-11-06, IP관 beach).

**How to apply:**
- There's no image model here. When new art is needed, write an asset list with GPT prompts: file names, sizes, transparency, tileability, and reference paths in this repo. The user's GPT can see the same folder. Example: gallery-plan/ip-assets.md.
- New art goes in gallery/ip/new/<scene>/.
- Until it arrives, keep placeholders and say so.
- Code may still draw sky, light, water depth and motion.

Related: [[ip-hall-reference-klockk]], [[feedback-board-carryover-items]].
