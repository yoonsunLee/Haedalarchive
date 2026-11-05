"""실내수영장 뼈대를 짓고 빛을 구워 낸다.

blender -b --python build_pool.py -- <출력 폴더> [samples]

치수와 좌표는 pool-3d.html(three.js, y가 위)과 같다. Blender는 z가 위라 (x, y, z) -> (x, -z, y)로 옮겨 짓는다.
glTF로 내보내면 다시 y가 위로 돌아온다.
결과: pool-hall.json(데이터를 품은 glTF), pool-hall.blend, lm-<이름>.npy(구운 빛, 선형 float)
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else ".")
SAMPLES = int(argv[1]) if len(argv) > 1 else 384
os.makedirs(OUT, exist_ok=True)

# 실제 치수(m): 25m 단수로 풀, 레인 폭 2.5m, 수심 1.2m. 홀 21 × 34 m, 층고 8 m
L, W, DEPTH, DECK = 25.0, 12.5, 1.2, 0.12
RX, RZ, H = 10.5, 17.0, 8.0
COPE = 0.35
LANES = [-5, -2.5, 0, 2.5, 5]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def B(x, y, z):
    """three.js 좌표를 Blender 좌표로."""
    return Vector((x, -z, y))


MATS = {}


def mat(name, rgb):
    if name not in MATS:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        bsdf = m.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*rgb, 1)
        bsdf.inputs["Roughness"].default_value = 0.8
        MATS[name] = m
    return MATS[name]


class Part:
    """한 물체로 합쳐 구울 면들을 모은다."""

    def __init__(self, name):
        self.name, self.bm, self.mats = name, bmesh.new(), []

    def mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def quad(self, pts, want, m):
        vs = [self.bm.verts.new(B(*p)) for p in pts]
        f = self.bm.faces.new(vs)
        f.normal_update()
        if f.normal.dot(B(*want)) < 0:
            f.normal_flip()
        f.material_index = self.mi(m)
        return f

    def box(self, x0, x1, y0, y1, z0, z1, m, top=None, skip=()):
        """바깥을 향하는 상자. top을 주면 윗면만 다른 재질."""
        X, Y, Z = (x0, x1), (y0, y1), (z0, z1)
        faces = {
            "+x": ([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], (1, 0, 0)),
            "-x": ([(x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0)], (-1, 0, 0)),
            "+y": ([(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)], (0, 1, 0)),
            "-y": ([(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)], (0, -1, 0)),
            "+z": ([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], (0, 0, 1)),
            "-z": ([(x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (x1, y0, z0)], (0, 0, -1)),
        }
        for k, (pts, n) in faces.items():
            if k in skip:
                continue
            self.quad(pts, n, top if (top and k == "+y") else m)

    def build(self):
        me = bpy.data.meshes.new(self.name)
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=1e-5)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me)
        scene.collection.objects.link(ob)
        return ob


# ───────── 수조: 바닥, 안쪽 벽, 레인 표시 ─────────
pool_tile = mat("tile_pool", (0.42, 0.74, 0.86))
mark = mat("tile_mark", (0.07, 0.19, 0.48))
pool = Part("Pool")
hw, hl, top = W / 2, L / 2, -0.03
pool.quad([(-hw, -DEPTH, -hl), (hw, -DEPTH, -hl), (hw, -DEPTH, hl), (-hw, -DEPTH, hl)], (0, 1, 0), pool_tile)
pool.quad([(-hw, -DEPTH, -hl), (hw, -DEPTH, -hl), (hw, top, -hl), (-hw, top, -hl)], (0, 0, 1), pool_tile)
pool.quad([(-hw, -DEPTH, hl), (hw, -DEPTH, hl), (hw, top, hl), (-hw, top, hl)], (0, 0, -1), pool_tile)
pool.quad([(-hw, -DEPTH, -hl), (-hw, -DEPTH, hl), (-hw, top, hl), (-hw, top, -hl)], (1, 0, 0), pool_tile)
pool.quad([(hw, -DEPTH, -hl), (hw, -DEPTH, hl), (hw, top, hl), (hw, top, -hl)], (-1, 0, 0), pool_tile)
for x in LANES:
    f0 = -DEPTH + 0.004
    pool.box(x - 0.125, x + 0.125, -DEPTH, f0, -(hl - 2), hl - 2, mark, skip=("-y",))
    for s in (-1, 1):
        zc = s * (hl - 2)
        pool.box(x - 0.5, x + 0.5, -DEPTH, f0 + 0.001, zc - 0.125, zc + 0.125, mark, skip=("-y",))
        zw = s * (hl - 0.004)
        z0, z1 = sorted((zw, s * hl))
        pool.box(x - 0.125, x + 0.125, -DEPTH, -0.3, z0, z1, mark)
        pool.box(x - 0.3, x + 0.3, -0.545, -0.295, z0, z1, mark)
pool_ob = pool.build()

# ───────── 물가: 데크와 테두리 ─────────
deck_tile = mat("tile_deck", (0.84, 0.86, 0.85))
cope = mat("coping", (0.93, 0.94, 0.94))
band = mat("band", (0.9, 0.9, 0.82))
deck = Part("Deck")
ox, oz = hw + COPE, hl + COPE
for (x0, x1, z0, z1) in [(-RX, RX, -RZ, -oz), (-RX, RX, oz, RZ), (-RX, -ox, -oz, oz), (ox, RX, -oz, oz)]:
    deck.quad([(x0, DECK, z0), (x1, DECK, z0), (x1, DECK, z1), (x0, DECK, z1)], (0, 1, 0), deck_tile)
for (x0, x1, z0, z1) in [(-ox, ox, -oz, -hl), (-ox, ox, hl, oz), (-ox, -hw, -hl, hl), (hw, ox, -hl, hl)]:
    deck.box(x0, x1, top, DECK + 0.002, z0, z1, cope, top=band)
deck_ob = deck.build()

# ───────── 홀: 벽, 천장, 왼쪽 통창 ─────────
wall = mat("wall", (0.78, 0.85, 0.87))
ceil = mat("ceiling", (0.92, 0.93, 0.93))
frame = mat("frame", (0.82, 0.85, 0.86))
hall = Part("Hall")
Y1 = DECK + H
hall.quad([(-RX, DECK, -RZ), (RX, DECK, -RZ), (RX, Y1, -RZ), (-RX, Y1, -RZ)], (0, 0, 1), wall)
hall.quad([(-RX, DECK, RZ), (RX, DECK, RZ), (RX, Y1, RZ), (-RX, Y1, RZ)], (0, 0, -1), wall)
hall.quad([(RX, DECK, -RZ), (RX, DECK, RZ), (RX, Y1, RZ), (RX, Y1, -RZ)], (-1, 0, 0), wall)
hall.quad([(-RX, Y1, -RZ), (RX, Y1, -RZ), (RX, Y1, RZ), (-RX, Y1, RZ)], (0, -1, 0), ceil)
T = 0.3   # 통창 벽 두께
hall.box(-RX - T, -RX, DECK, 1.0, -RZ, RZ, frame)          # 창턱 아래 낮은 벽
hall.box(-RX - T, -RX, 6.6, Y1, -RZ, RZ, frame)            # 창 위 벽
hall.box(-RX - T, -RX + 0.02, 4.1, 4.24, -RZ, RZ, frame)   # 가로 창살
for i in range(9):
    zc = -RZ + i * (2 * RZ / 8)
    hall.box(-RX - T, -RX, 1.0, 6.6, zc - 0.18, zc + 0.18, frame)
hall_ob = hall.build()

# ───────── 소품: 출발대, 감시 의자, 벤치 ─────────
block = mat("block", (0.93, 0.93, 0.93))
wood = mat("wood", (0.62, 0.45, 0.3))
props = Part("Props")
for x in LANES:
    props.box(x - 0.275, x + 0.275, DECK, DECK + 0.5, -hl - 0.85, -hl - 0.3, block)
cx, cz = 8.4, 0.0
for dx in (-0.32, 0.32):
    for dz in (-0.32, 0.32):
        props.box(cx + dx - 0.04, cx + dx + 0.04, DECK, 1.95, cz + dz - 0.04, cz + dz + 0.04, block)
props.box(cx - 0.4, cx + 0.4, 1.95, 2.03, cz - 0.4, cz + 0.4, block)
props.box(cx - 0.4, cx + 0.4, 2.03, 2.75, cz + 0.34, cz + 0.42, block)
props.box(cx - 0.36, cx + 0.36, 1.0, 1.05, cz - 0.62, cz - 0.3, block)
for z0 in (-9.0, 3.0):
    props.box(RX - 0.7, RX - 0.1, 0.42, 0.48, z0, z0 + 5.0, wood)
    for k in range(4):
        zz = z0 + 0.2 + k * 1.53
        props.box(RX - 0.65, RX - 0.15, DECK, 0.42, zz, zz + 0.08, block)
props_ob = props.build()

PARTS = [(pool_ob, 2048), (deck_ob, 2048), (hall_ob, 1024), (props_ob, 1024)]

# ───────── UV: 0번은 1 m = 1, 타일을 반복해 붙인다 / 1번은 구운 빛 ─────────
for ob, _ in PARTS:
    me = ob.data
    me.uv_layers.new(name="Tiles")
    me.uv_layers.new(name="Lightmap")
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    me.uv_layers.active = me.uv_layers["Tiles"]
    bpy.ops.uv.cube_project(cube_size=1.0, scale_to_bounds=False, correct_aspect=False)
    me.uv_layers.active = me.uv_layers["Lightmap"]
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004, area_weight=0.0, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    me.uv_layers.active = me.uv_layers["Tiles"]
    me.uv_layers["Tiles"].active_render = True
    # 큰 면도 고르게 빛을 받도록 잘게 나누지 않는다. 굽는 해상도가 그림자 선명도를 정한다.

# ───────── 빛: 왼쪽 통창으로 드는 아침 해, 하늘빛, 천장 조명 ─────────
world = bpy.data.worlds.new("Sky")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.62, 0.8, 1.0, 1)
bg.inputs["Strength"].default_value = 1.2
scene.world = world

sun_data = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 3.2
sun_data.angle = math.radians(2.5)
sun_data.color = (1.0, 0.95, 0.86)
sun = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun)
d = B(0.82, -0.5, -0.28).normalized()   # 해가 비추는 방향: 왼쪽 위에서 오른쪽 아래로
sun.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

for i, z in enumerate((-12, -4, 4, 12)):
    ld = bpy.data.lights.new(f"Ceil{i}", "AREA")
    ld.shape = "RECTANGLE"
    ld.size, ld.size_y = 14.0, 1.2
    ld.energy = 900
    ld.color = (1.0, 0.98, 0.95)
    lo = bpy.data.objects.new(f"Ceil{i}", ld)
    lo.location = B(0, Y1 - 0.05, z)
    scene.collection.objects.link(lo)

# ───────── 굽기 ─────────
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for dv in prefs.devices:
        dv.use = dv.type != "CPU"
    scene.cycles.device = "GPU"
except Exception as ex:   # noqa: BLE001
    print("GPU unavailable, baking on CPU:", ex)
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = False
scene.render.bake.margin = 8
scene.render.bake.use_clear = True

# 굽기 전에 먼저 내보낸다(굽기용 그림 노드가 섞이지 않게)
bpy.ops.object.select_all(action="DESELECT")
for ob, _ in PARTS:
    ob.select_set(True)
# 아티팩트는 .glb를 내주지 않아서, 데이터를 품은 glTF(JSON)로 내보내고 .json 이름을 붙인다
gltf_path = os.path.join(OUT, "pool-hall.gltf")
bpy.ops.export_scene.gltf(filepath=gltf_path, export_format="GLTF_EMBEDDED", use_selection=True,
                          export_texcoords=True, export_normals=True, export_materials="EXPORT", export_yup=True,
                          export_apply=True)
os.replace(gltf_path, os.path.join(OUT, "pool-hall.json"))

for ob, size in PARTS:
    img = bpy.data.images.new(f"lm_{ob.name}", size, size, float_buffer=True)
    for m in ob.data.materials:
        nt = m.node_tree
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = img
        uvn = nt.nodes.new("ShaderNodeUVMap")
        uvn.uv_map = "Lightmap"
        nt.links.new(uvn.outputs["UV"], n.inputs["Vector"])
        nt.nodes.active = n
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    ob.data.uv_layers.active = ob.data.uv_layers["Lightmap"]
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=8, use_clear=True)
    ob.data.uv_layers.active = ob.data.uv_layers["Tiles"]
    px = np.empty(size * size * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    np.save(os.path.join(OUT, f"lm-{ob.name}.npy"), px.reshape(size, size, 4)[:, :, :3])
    print("BAKED", ob.name, size, float(np.percentile(px.reshape(-1, 4)[:, :3], 99)))

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "pool-hall.blend"))
print("DONE", OUT)
