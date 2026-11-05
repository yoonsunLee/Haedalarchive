"""지금 갤러리(버전 31)의 무광 면에 햇빛·하늘빛·반사광을 구워 넣는다.

blender -b --python bake_gallery.py -- <gallery-tagged.glb> <targets.json> <출력 폴더> [크기] [samples]

브라우저에서 bake/prep.js로 고른 면(이름이 LM_로 시작)만 굽는다. 그 면들은 꼭짓점을 나누지 않은 채로 왔으니
꼭짓점 순서가 three.js와 같다. 그래서 UV를 꼭짓점 순서대로 돌려주면 페이지에서 그대로 쓸 수 있다.
결과: lm.npy(선형 빛), uv.json(이름 → 꼭짓점별 UV), bake.blend
"""
import json
import math
import re
import time

T0 = time.time()


def step(msg):
    print(f"STEP {time.time() - T0:7.1f}s {msg}", flush=True)
import os
import sys

import bpy
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
GLB, TARGETS, OUT = argv[0], argv[1], os.path.abspath(argv[2])
SIZE = int(argv[3]) if len(argv) > 3 else 4096
SAMPLES = int(argv[4]) if len(argv) > 4 else 512
os.makedirs(OUT, exist_ok=True)
want = json.load(open(TARGETS, encoding="utf8"))
base = lambda n: re.sub(r"\.\d{3}$", "", n)   # Blender가 붙이는 .001만 뗀다(이름 안의 소수점은 그대로)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=False)
for o in list(scene.objects):
    if o.type in ("LIGHT", "CAMERA") or (o.type == "MESH" and min(o.dimensions) > 100):
        bpy.data.objects.remove(o)

# three.js의 한쪽 면은 뒤에서 보면 없는 것과 같다(천장 판은 위에서 햇빛이 지나간다).
# Cycles는 면을 양쪽 다 막으니, 한쪽 면 재질은 뒷면을 투명하게 해서 같게 맞춘다
for m in bpy.data.materials:
    if not (m.use_nodes and m.use_backface_culling):
        continue
    nt = m.node_tree
    out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None)
    if not out or not out.inputs["Surface"].links:
        continue
    src = out.inputs["Surface"].links[0].from_socket
    geo, clear, mix = nt.nodes.new("ShaderNodeNewGeometry"), nt.nodes.new("ShaderNodeBsdfTransparent"), nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(geo.outputs["Backfacing"], mix.inputs["Fac"])
    nt.links.new(src, mix.inputs[1])
    nt.links.new(clear.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

step("imported")
lm = [o for o in scene.objects if o.type == "MESH" and base(o.name) in want]
bad = [o.name for o in lm if len(o.data.vertices) != want[base(o.name)]]
print("TARGETS", len(want), "FOUND", len(lm), "COUNT_MISMATCH", len(bad), bad[:5])
lm = [o for o in lm if o.name not in bad]
# 땅보다 낮은 판(바닥 밑에 깔린 것)은 보이지 않으니 굽지 않는다. 빛 지도 자리를 다 차지하지 않게
from mathutils import Vector as _V  # noqa: E402
lm = [o for o in lm if sum((o.matrix_world @ _V(c)).z for c in o.bound_box) / 8 > -0.01]
print("BAKING", len(lm))

# ───── 빛: 페이지의 해와 같은 방위(three.js (14, 30, 22))에서 한낮 높이(62°)로 올린 해 → three.js (14, 49, 22) = Blender (14, -22, 49), 맑은 하늘 ─────
world = bpy.data.worlds.new("Sky")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.62, 0.75, 0.95, 1)
bg.inputs["Strength"].default_value = 1.0
scene.world = world
sd = bpy.data.lights.new("Sun", "SUN")
sd.energy = 3.4
sd.angle = math.radians(2.0)
sd.color = (1.0, 0.95, 0.86)
sun = bpy.data.objects.new("Sun", sd)
scene.collection.objects.link(sun)
from mathutils import Vector  # noqa: E402
sun.rotation_euler = (Vector((0, 0, 0)) - Vector((14, -22, 49))).to_track_quat("-Z", "Y").to_euler()


def select_only(objs, active):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active


step("lights set")
# ───── UV: 붙어 있는 면끼리 섬을 만들려고 복제본을 이어 붙여 펼친 뒤, 원본 삼각형에 옮겨 담는다 ─────
dups = []
for o in lm:
    o.data = o.data.copy()                   # 같은 모양을 나눠 쓰던 물체도 따로따로
    o.data.uv_layers.new(name="LM")
    d = o.copy()
    d.data = o.data.copy()
    scene.collection.objects.link(d)
    dups.append(d)
step("dups made")
# 물체 하나씩 펼친다. 한꺼번에 펼치면 섬들이 모든 물체에 걸쳐 0~1 칸 전체에 흩어져, 물체마다의 칸이 텅 빈 채 커진다
for d in dups:
    d.data.uv_layers.active = d.data.uv_layers["LM"]
    select_only([d], d)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.0005)
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004, area_weight=0.0, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode="OBJECT")


step("smart project done")
# 물체마다 0~1 칸에 펼쳐졌으니, 실제 넓이에 맞춰 크기를 정해 빛 지도 한 장에 줄줄이 늘어놓는다(겹치지 않게)
def tri_area(a, b, c):
    return abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2


rects = []
for d in dups:
    me = d.data
    lay = me.uv_layers["LM"].data
    mw = d.matrix_world
    world_a = sum(((mw @ me.vertices[p.vertices[1]].co) - (mw @ me.vertices[p.vertices[0]].co)).cross(
        (mw @ me.vertices[p.vertices[-1]].co) - (mw @ me.vertices[p.vertices[0]].co)).length / 2 * (len(p.vertices) - 2) for p in me.polygons)
    uvs = [lay[i].uv.copy() for i in range(len(lay))]
    uv_a = sum(tri_area(uvs[p.loop_start], uvs[p.loop_start + 1], uvs[p.loop_start + 2]) * (p.loop_total - 2) for p in me.polygons) or 1e-6
    us, vs = [u.x for u in uvs], [u.y for u in uvs]
    rects.append({"d": d, "u0": min(us), "v0": min(vs), "w": max(us) - min(us), "h": max(vs) - min(vs), "s": math.sqrt(max(world_a, 1e-6) / uv_a)})


def shelf(k, pad=0.004):
    """높이 순으로 줄을 채운다. 다 들어가면 자리를, 넘치면 None을 돌려준다."""
    order = sorted(rects, key=lambda r: -r["h"] * r["s"])
    x = y = row = 0.0
    spots = {}
    for r in order:
        w, h = r["w"] * r["s"] * k, r["h"] * r["s"] * k
        if w > 1 - 2 * pad or h > 1 - 2 * pad:
            return None
        if x + w + pad > 1:
            x, y, row = 0.0, y + row + pad, 0.0
        if y + h + pad > 1:
            return None
        spots[id(r)] = (x + pad, y + pad)
        x += w + pad
        row = max(row, h)
    return spots


lo, hi = 0.0, 1.0
while shelf(hi):
    hi *= 2
for _ in range(30):
    mid = (lo + hi) / 2
    lo, hi = (mid, hi) if shelf(mid) else (lo, mid)
spots = shelf(lo)
for r in rects:
    ox, oy = spots[id(r)]
    sc = r["s"] * lo
    lay = r["d"].data.uv_layers["LM"].data
    for lp in lay:
        lp.uv = (ox + (lp.uv.x - r["u0"]) * sc, oy + (lp.uv.y - r["v0"]) * sc)
print("PACKED scale", round(lo, 4))

step("packed")
# 원본 삼각형마다, 그 삼각형이 놓인 복제본 삼각형을 찾아 같은 자리의 UV를 계산해 담는다.
# (모서리·꼭짓점에서 이웃 면을 잘못 집는 데이터 전송 대신, 삼각형 한가운데로 찾아서 어긋나지 않게)
from mathutils.bvhtree import BVHTree  # noqa: E402
from mathutils.geometry import barycentric_transform  # noqa: E402
for o, d in zip(lm, dups):
    dm, dmw = d.data, d.matrix_world
    dverts = [dmw @ v.co for v in dm.vertices]
    # 꼭짓점을 합치다 넓이가 0이 된 삼각형은 빼고 찾는다(그런 삼각형으로 계산하면 UV가 끝없이 커진다)
    keep = [p for p in dm.polygons if p.area > 1e-9]
    tree = BVHTree.FromPolygons(dverts, [tuple(p.vertices) for p in keep])
    dl = dm.uv_layers["LM"].data
    om, omw = o.data, o.matrix_world
    ol = om.uv_layers["LM"].data
    for p in om.polygons:
        loops = range(p.loop_start, p.loop_start + p.loop_total)
        pts = [omw @ om.vertices[om.loops[li].vertex_index].co for li in loops]
        c = sum(pts, _V()) / len(pts)
        hit = tree.find_nearest(c)
        dp = keep[hit[2]]
        tv = [dverts[i] for i in dp.vertices[:3]]
        tu = [_V((dl[li].uv.x, dl[li].uv.y, 0)) for li in range(dp.loop_start, dp.loop_start + 3)]
        for li, q in zip(loops, pts):
            r = barycentric_transform(q, tv[0], tv[1], tv[2], tu[0], tu[1], tu[2])
            u_, v_ = (r.x, r.y) if math.isfinite(r.x) and math.isfinite(r.y) else (tu[0].x, tu[0].y)
            ol[li].uv = (min(max(u_, 0.0), 1.0), min(max(v_, 0.0), 1.0))
for d in dups:
    bpy.data.objects.remove(d)
# 굽기는 이미지 노드가 아니라 물체의 '활성' UV에 그린다. 원래 무늬 UV가 활성이면 모든 면이 한 칸에 겹쳐 구워진다
for o in lm:
    o.data.uv_layers.active = o.data.uv_layers["LM"]
    o.data.uv_layers["LM"].active_render = True

step("uv mapped")
# ───── 굽기 ─────
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for dv in prefs.devices:
        dv.use = dv.type != "CPU"
    scene.cycles.device = "GPU"
except Exception as ex:   # noqa: BLE001
    print("GPU unavailable:", ex)
scene.cycles.samples = SAMPLES
scene.render.bake.margin = 6
img = bpy.data.images.new("lm_court", SIZE, SIZE, float_buffer=True)
mats = {m for o in lm for m in o.data.materials if m}
for m in mats:
    nt = m.node_tree
    n = nt.nodes.new("ShaderNodeTexImage")
    n.image = img
    uvn = nt.nodes.new("ShaderNodeUVMap")
    uvn.uv_map = "LM"
    nt.links.new(uvn.outputs["UV"], n.inputs["Vector"])
    nt.nodes.active = n
select_only(lm, lm[0])
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True)
step("baked")
px = np.empty(SIZE * SIZE * 4, dtype=np.float32)
img.pixels.foreach_get(px)
np.save(os.path.join(OUT, "lm-court.npy"), px.reshape(SIZE, SIZE, 4)[:, :, :3])

# ───── 꼭짓점별 UV 돌려주기 ─────
uv = {}
for o in lm:
    me = o.data
    arr = np.zeros((len(me.vertices), 2), dtype=np.float32)
    lay = me.uv_layers["LM"].data
    for lp in me.loops:
        arr[lp.vertex_index] = lay[lp.index].uv
    uv[base(o.name)] = [round(float(v), 5) for v in arr.reshape(-1)]
json.dump(uv, open(os.path.join(OUT, "uv.json"), "w"))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "bake.blend"))
print("DONE", len(uv))
