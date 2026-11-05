---
name: blender-mcp-setup
description: Official Blender Lab MCP (v1.0.3) is installed for this project; how to start Blender so the bridge runs
metadata:
  node_type: memory
  type: reference
  originSessionId: b688017f-e730-4bff-8015-a1a7f89e2b1f
  modified: 2026-11-04T14:15:34.748Z
---

Official Blender Lab MCP server v1.0.3 installed on 2026-11-04 for the haedal-archive project (local scope in ~/.claude.json, server name `blender`).

- Server: `C:\Users\yoons\.blender-mcp\venv\Scripts\blender-mcp.exe` (pip-installed from the .mcpb bundle; uv is not installed, Python 3.14 venv instead).
- Blender 5.2.3 LTS at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`; add-on `mcp` installed via `--command extension install-file`.
- The add-on bridge only auto-starts when online access is on. Blender's preference was left untouched, so launch with `blender.exe --online-mode`; bridge listens on localhost:9876.
- Headless alternative: `blender.exe -b --online-mode --command blender_mcp` (no deferred responses).
- Blender Lab warns the server runs LLM-written code without guards.

Purpose: raise 3D quality of the gallery (build/bake in Blender, export .glb for three.js). See [[gallery-3d-pipeline]].
