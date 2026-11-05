---
name: gallery-3d-pipeline
description: "How Blender-baked spaces get into the three.js gallery pages, and the artifact constraints that shaped it"
metadata:
  node_type: memory
  type: project
  originSessionId: b688017f-e730-4bff-8015-a1a7f89e2b1f
  modified: 2026-11-04T14:23:50.447Z
---

Blender → three.js pipeline, first used for the indoor pool on 2026-11-04 (gallery-plan/blender/build_pool.py, lightmaps.py, pool-blender.html).

- Build static structure in Blender with a bpy script, run headless (`blender -b --python ... -- <out> <samples>`); baking on the RTX 4060 Ti via OptiX takes about a minute.
- UV0 "Tiles" = cube projection at 1 m per unit (three.js repeats canvas tile textures over it); UV1 "Lightmap" = smart project, baked DIFFUSE direct+indirect with no color.
- Artifacts do not serve .glb or .bin, so export embedded glTF and name it .json; GLTFLoader loads it fine.
- three.js side: MeshBasicMaterial with lightMap (channel 1, flipY false, sRGB) and intensity = scale·π·EXPO, where scale comes from lightmaps.json. Dynamic objects keep real lights, plus a ShadowMaterial catcher for their shadows. Match the DirectionalLight direction to the baked sun.

**Why:** the user felt hand-coded three.js had hit its limits and asked for an MCP; see [[blender-mcp-setup]].
**How to apply:** reuse this for other rooms (POV, works hall) rather than inventing a new approach.
