---
name: feedback-remote-no-localhost
description: User often works over Remote Control and cannot open localhost links; show screenshot sheets instead
metadata:
  node_type: memory
  type: feedback
  originSessionId: a4788514-f157-4c7b-a85f-d1c7c0da3bbd
  modified: 2026-11-05T23:02:22.690Z
---

Don't hand the user localhost preview links (e.g. http://localhost:8791/?at=…) as the way to see the gallery; they said they can't open them remotely and don't need them.

**Why:** they follow the work from another device over Remote Control (2026-11-06).

**How to apply:** show every change as a headless-Chrome screenshot sheet sent with SendUserFile; only mention a local link if they ask for it. Related: [[feedback-one-space-at-a-time]].
