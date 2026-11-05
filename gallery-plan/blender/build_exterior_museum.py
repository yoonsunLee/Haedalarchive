"""숲속의 미니멀 미술관: 회색 대리석 덩어리와 경사진 돌판 지붕이 일월오봉도의 겹겹 봉우리를 그린다.

blender -b --python build_exterior_museum.py -- <출력 png> [samples] [가로] [세로] [front|wide]

build_exterior_forest.py에서 갈라졌다. 둘레(무이림 같은 단, 대리석 광장, 길, 등받이 없는 나무 벤치,
볼라드, 유럽 숲, 빛, 카메라)는 그대로이고 건물만 바꿨다. 해달 작가의 느낌은 한 꼬집:
남쪽 박공의 지붕 끝선을 따라 흐르는 가는 자개 선 하나뿐이다."""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "exterior-toy.png")
SAMPLES = int(argv[1]) if len(argv) > 1 else 96
RES = (int(argv[2]) if len(argv) > 2 else 1920, int(argv[3]) if len(argv) > 3 else 1080)
VIEW = argv[4] if len(argv) > 4 else "wide"
random.seed(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection


def P(px, py):
    return (px - 500) * 0.1, -(py - 330) * 0.1


def principled(name, rgb, rough=0.6, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    for k, v in kw.items():
        if k in b.inputs:
            b.inputs[k].default_value = v
    return m


# 색: 검정 지붕은 숯빛으로 살짝 풀고, 나머지는 크림·파스텔
lacquer = principled("lacquer", (0.035, 0.032, 0.04), 0.55, **{"Coat Weight": 0.12, "Coat Roughness": 0.35, "Specular IOR Level": 0.25})
nacre = principled("nacre", (0.96, 0.94, 0.97), 0.2, **{"Thin Film Thickness": 420.0, "Thin Film IOR": 1.45, "Coat Weight": 0.5, "Coat Roughness": 0.1})
plaster = principled("plaster", (0.95, 0.91, 0.84), 0.85)
timber = principled("timber", (0.36, 0.21, 0.13), 0.7)
plinth = principled("plinth", (0.8, 0.76, 0.7), 0.85)
glass = principled("window", (0.04, 0.055, 0.07), 0.04, **{"Specular IOR Level": 0.9, "Coat Weight": 0.6, "Coat Roughness": 0.02})
cobalt = principled("cobalt", (0.05, 0.16, 0.62), 0.3, **{"Coat Weight": 0.5})


def mosaic_mat():
    """검은 옻칠 바탕에 자개 조각: 조각마다 무지갯빛이 조금씩 다르다."""
    m = bpy.data.materials.new("nacre_mosaic")
    m.use_nodes = True
    nt = m.node_tree
    out = nt.nodes["Material Output"]
    nt.nodes.remove(nt.nodes["Principled BSDF"])
    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 5.5
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    cut = nt.nodes.new("ShaderNodeMath")
    cut.operation = "LESS_THAN"
    cut.inputs[1].default_value = 0.36
    nt.links.new(vor.outputs["Distance"], cut.inputs[0])
    black = nt.nodes.new("ShaderNodeBsdfPrincipled")
    black.inputs["Base Color"].default_value = (0.006, 0.005, 0.007, 1)
    black.inputs["Roughness"].default_value = 0.25
    black.inputs["Coat Weight"].default_value = 0.6
    pearl = nt.nodes.new("ShaderNodeBsdfPrincipled")
    pearl.inputs["Base Color"].default_value = (0.92, 0.94, 0.97, 1)
    pearl.inputs["Roughness"].default_value = 0.12
    pearl.inputs["Metallic"].default_value = 0.35
    film = nt.nodes.new("ShaderNodeMapRange")
    film.inputs["To Min"].default_value = 260
    film.inputs["To Max"].default_value = 760
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(vor.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs[0], film.inputs["Value"])
    nt.links.new(film.outputs["Result"], pearl.inputs["Thin Film Thickness"])
    pearl.inputs["Thin Film IOR"].default_value = 1.45
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(cut.outputs[0], mix.inputs["Fac"])
    nt.links.new(black.outputs["BSDF"], mix.inputs[1])
    nt.links.new(pearl.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


mosaic = mosaic_mat()
sun_red = principled("sun_red", (0.82, 0.12, 0.08), 0.2, **{"Coat Weight": 0.8})
fur = principled("fur", (0.88, 0.92, 0.98), 0.65, **{"Sheen Weight": 0.8, "Subsurface Weight": 0.1})
otter_blue = principled("otter_blue", (0.06, 0.2, 0.7), 0.3, **{"Coat Weight": 0.5})
cheek = principled("cheek", (0.98, 0.66, 0.7), 0.6)
water_m = principled("pool_water", (0.015, 0.04, 0.07), 0.02, **{"Specular IOR Level": 0.8, "Coat Weight": 1.0, "Coat Roughness": 0.0})
steel = principled("steel", (0.025, 0.025, 0.027), 0.35, **{"Metallic": 0.8})
door = principled("door", (0.5, 0.3, 0.18), 0.6)
grass = principled("grass", (0.36, 0.56, 0.27), 0.95)
path_m = principled("path", (0.93, 0.86, 0.72), 0.9)
court_m = principled("court", (0.88, 0.84, 0.77), 0.9)
trunk_m = principled("trunk", (0.42, 0.26, 0.17), 0.8)
GREENS = [(0.24, 0.47, 0.22), (0.33, 0.56, 0.25), (0.44, 0.64, 0.3), (0.2, 0.4, 0.24), (0.52, 0.68, 0.34)]
leaf_ms = [principled(f"leaf{i}", c, 0.75) for i, c in enumerate(GREENS)]


def link(ob):
    col.objects.link(ob)
    return ob


def soft_box(name, x0, x1, y0, y1, z0, z1, mat, bevel=0.25):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector(((x0 + x1) / 2 + v.co.x * (x1 - x0), (y0 + y1) / 2 + v.co.y * (y1 - y0), (z0 + z1) / 2 + v.co.z * (z1 - z0)))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob = link(bpy.data.objects.new(name, me))
    if bevel:
        bv = ob.modifiers.new("soft", "BEVEL")
        bv.width = min(bevel, (x1 - x0) * 0.45, (y1 - y0) * 0.45, (z1 - z0) * 0.45)
        bv.segments = 5
        bv.limit_method = "NONE"
    for p in me.polygons:
        p.use_smooth = True
    return ob


def cyl(name, x, y, z0, z1, r, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=r, depth=z1 - z0, location=(x, y, (z0 + z1) / 2))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(mat)
    bv = ob.modifiers.new("soft", "BEVEL")
    bv.width = r * 0.4
    bv.segments = 4
    bpy.ops.object.shade_smooth()
    return ob


def tube(name, pts, r, mat):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 4
    cu.use_fill_caps = True
    sp = cu.splines.new("NURBS")
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (*q, 1)
    sp.use_endpoint_u = True
    sp.order_u = 3
    cu.materials.append(mat)
    return link(bpy.data.objects.new(name, cu))


def rect(px0, px1, py0, py1):
    x0, y1 = P(px0, py0)
    x1, y0 = P(px1, py1)
    return x0, x1, y0, y1


# 무이림처럼 언덕을 단으로 나눈다: 로비 줄(0) → 앞줄 방과 중정(1) → 뒷줄 방(2) → 일월오봉단관(3)
EDGES = (-8.6, 3.0, 14.6)
LEVELS = (0.0, 1.8, 3.6, 5.6)


def level(y):
    for e, z in zip(EDGES, LEVELS):
        if y < e:
            return z
    return LEVELS[-1]


def lifted(z, fn, *a, **k):
    """fn이 새로 만든 물체를 모두 z만큼 올린다."""
    before = set(bpy.data.objects)
    fn(*a, **k)
    for o in bpy.data.objects:
        if o not in before:
            o.location.z += z


def ground_z(y):
    t = max(0.0, min(1.0, (y - 40) / 90))   # 광장 뒤(북쪽)부터 언덕이 오른다
    return 7.0 * t * t * (3 - 2 * t)


B = {"obong": rect(390, 610, 40, 180)}
for side, (a, b) in {"works": (110, 390), "ip": (610, 890)}.items():
    B[side + "_back"] = rect(a, b, 190, 300)
    B[side + "_front"] = rect(a, b, 300, 410)
B["lobby"], B["artist"], B["lounge"] = rect(430, 570, 420, 530), rect(300, 420, 420, 530), rect(580, 700, 420, 530)
# 대리석 광장: 흰 바탕에 회색 결, 1.6 × 0.8 m 판석 줄눈
def marble_mat():
    m = bpy.data.materials.new("marble")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.2
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 0.025
    wave.inputs["Distortion"].default_value = 11
    wave.inputs["Detail"].default_value = 6
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.8, 0.8, 0.8, 1)
    ramp.color_ramp.elements[1].position = 0.07
    ramp.color_ramp.elements[1].color = (0.93, 0.92, 0.9, 1)
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.inputs["Brick Width"].default_value = 1.6
    brick.inputs["Row Height"].default_value = 0.8
    brick.inputs["Mortar Size"].default_value = 0.012
    brick.inputs["Mortar"].default_value = (0.6, 0.6, 0.6, 1)
    brick.offset = 0.5
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], brick.inputs["Vector"])
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], brick.inputs["Color1"])
    nt.links.new(ramp.outputs["Color"], brick.inputs["Color2"])
    nt.links.new(brick.outputs["Color"], b.inputs["Base Color"])
    return m


marble = marble_mat()
PLAZA = (-56, 56, -46, 44)
granite = principled("granite", (0.4, 0.39, 0.37), 0.8)
ys = (PLAZA[2],) + EDGES + (PLAZA[3],)
for i, z in enumerate(LEVELS):
    y0, y1 = ys[i], ys[i + 1]
    if z > 0:
        soft_box(f"Terrace{i}", PLAZA[0], PLAZA[1], y0, y1, -0.5, z - 0.15, granite, 0.04)
    soft_box(f"Deck{i}", PLAZA[0], PLAZA[1], y0, y1, max(z - 0.15, 0), z + 0.15 if z == 0 else z, marble, 0.04)


def stair(xc, wdt, y_edge, z0, z1):
    """y_edge 남쪽에 놓여 위 단으로 오르는 대리석 계단."""
    n = max(2, round((z1 - z0) / 0.18))
    h, dp = (z1 - z0) / n, 0.34
    for i in range(n):
        ya = y_edge - (n - i) * dp
        soft_box("step", xc - wdt / 2, xc + wdt / 2, ya, y_edge, max(z0 - 0.2, -0.2), z0 + (i + 1) * h, marble, 0.02)


for i, e in enumerate(EDGES):
    for xc in (-47, 47):
        stair(xc, 6.0, e, LEVELS[i] + (0.15 if i == 0 else 0), LEVELS[i + 1])
stair(0, 18.0, EDGES[1], LEVELS[1], LEVELS[2])     # 중정 안에서 뒷단으로


# ───────── 건물: 회색 대리석 덩어리, 박공면이 남쪽을 향해 저마다 봉우리가 된다 ─────────
def stone_mat(name, base, vein, pw, ph, rough=0.38):
    """판석 줄눈이 있는 돌: base 바탕에 vein 결, pw × ph m 판."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 0.04
    wave.inputs["Distortion"].default_value = 8
    wave.inputs["Detail"].default_value = 5
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*vein, 1)
    ramp.color_ramp.elements[1].position = 0.22
    ramp.color_ramp.elements[1].color = (*base, 1)
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.inputs["Brick Width"].default_value = pw
    brick.inputs["Row Height"].default_value = ph
    brick.inputs["Mortar Size"].default_value = 0.008
    brick.inputs["Mortar"].default_value = (*(c * 0.7 for c in base), 1)
    brick.offset = 0.0
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], brick.inputs["Vector"])
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], brick.inputs["Color1"])
    nt.links.new(ramp.outputs["Color"], brick.inputs["Color2"])
    nt.links.new(brick.outputs["Color"], b.inputs["Base Color"])
    return m


gray = stone_mat("gray_marble", (0.66, 0.65, 0.63), (0.47, 0.47, 0.46), 3.0, 1.5, 0.24)
roof_stone = stone_mat("roof_stone", (0.36, 0.36, 0.37), (0.28, 0.28, 0.29), 2.4, 1.2, 0.32)


def line(name, pts, r, mat):
    """꺾인 곳이 둥글어지지 않는 곧은 선."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 2
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p_, q in zip(sp.points, pts):
        p_.co = (*q, 1)
    cu.materials.append(mat)
    return link(bpy.data.objects.new(name, cu))


def mesh_from(name, quads, mat, solid=0.0, bevel=0.03):
    bm = bmesh.new()
    for q in quads:
        bm.faces.new([bm.verts.new(v) for v in q])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob = link(bpy.data.objects.new(name, me))
    if solid:
        sl = ob.modifiers.new("t", "SOLIDIFY")
        sl.thickness = solid
        sl.offset = 1
    if bevel:
        bv = ob.modifiers.new("crisp", "BEVEL")
        bv.width = bevel
        bv.segments = 2
    return ob


def gable_volume(name, x0, x1, y0, y1, wall_h, apex, ow=0.4, oe=0.4, o=0.4, slit=True):
    """박공면이 남북을 향하는 오각 기둥 몸에, 얇게 내민 경사 돌판 지붕 둘."""
    xc = (x0 + x1) / 2
    prof = [(x0, 0.0), (x1, 0.0), (x1, wall_h), (xc, apex), (x0, wall_h)]
    sv = [(x, y0, z) for x, z in prof]
    nv = [(x, y1, z) for x, z in prof]
    quads = [sv[::-1], nv] + [(sv[i], sv[(i + 1) % 5], nv[(i + 1) % 5], nv[i]) for i in range(5)]
    mesh_from(name, quads, gray, bevel=0.02)
    soft_box(name + "_base", x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, 0, 0.45, granite, 0.02)
    slope = (apex - wall_h) / (xc - x0)
    tops = []
    for xe, over in ((x0 - ow, ow), (x1 + oe, oe)):
        ze = wall_h - over * slope
        mesh_from(name + "_roof", [((xe, y0 - o, ze), (xc, y0 - o, apex), (xc, y1 + o, apex), (xe, y1 + o, ze))], roof_stone, solid=0.32, bevel=0.015)
        tops.append((xe, ze))
    # 한 꼬집의 해달: 남쪽 박공 지붕 끝선을 따라 가는 자개 선 하나
    lift = 0.32 * math.sqrt(1 + slope * slope)
    (xa, za), (xb, zb_) = tops
    line(name + "_nacre", [(xa, y0 - o - 0.03, za + lift), (xc, y0 - o - 0.03, apex + lift), (xb, y0 - o - 0.03, zb_ + lift)], 0.11, nacre)
    if slit:   # 남쪽 박공에 세로 틈창 하나
        soft_box(name + "_slit", xc - 0.32, xc + 0.32, y0 - 0.06, y0 + 0.02, 1.2, wall_h * 0.92, glass, 0.0)


def flat_volume(name, x0, x1, y0, y1, h, entrance=0.0):
    soft_box(name, x0, x1, y0, y1, 0, h, gray, 0.02)
    soft_box(name + "_cap", x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, h, h + 0.38, roof_stone, 0.015)
    if entrance:   # 로비: 정면 가운데를 깊은 유리로
        cx = (x0 + x1) / 2
        soft_box(name + "_door", cx - entrance / 2, cx + entrance / 2, y0 - 0.06, y0 + 0.02, 0.2, h - 0.7, glass, 0.0)
        for i in range(5):
            x = cx - entrance / 2 + entrance * i / 4
            soft_box(name + "_mull", x - 0.04, x + 0.04, y0 - 0.1, y0 - 0.05, 0.2, h - 0.7, steel, 0.0)
    else:   # 가로로 긴 틈창
        soft_box(name + "_band", x0 + 1.5, x1 - 1.5, y0 - 0.06, y0 + 0.02, h * 0.55, h * 0.55 + 0.55, glass, 0.0)


# 높이: 바깥에서 안쪽으로, 앞줄에서 뒷줄로 높아져 가운데 일월오봉단관으로 모인다
VOL = [   # 평면 px, 벽 높이, 꼭대기 높이, 이웃과 맞닿는 쪽(w/e)
    ((250, 390, 190, 300), 6.5, 14.5, "w"), ((110, 250, 190, 300), 6.5, 12.3, "e"),   # 작품관 뒷줄: N차적 · 우주조약
    ((250, 390, 300, 410), 5.0, 9.0, "w"), ((110, 250, 300, 410), 5.0, 10.2, "e"),    # 작품관 앞줄: 법과 권리 · POV
    ((610, 750, 190, 300), 6.5, 14.5, "e"), ((750, 890, 190, 300), 6.5, 12.3, "w"),   # IP 뒷줄: 해변 · 숲길
    ((610, 750, 300, 410), 5.0, 9.0, "e"), ((750, 890, 300, 410), 5.0, 10.2, "w"),    # IP 앞줄: 수영장 · 작업실
]
for k, ((a, b, c, d), wh, ap, shared) in enumerate(VOL):
    x0, x1, y0, y1 = rect(a, b, c, d)
    lifted(level((y0 + y1) / 2), gable_volume, f"Room{k}", x0, x1, y0, y1, wh, ap,
           ow=0.0 if shared == "w" else 0.45, oe=0.0 if shared == "e" else 0.45)


def obong_volume():
    x0, x1, y0, y1 = B["obong"]
    soft_box("ObongPlinth", x0 - 3.0, x1 + 3.0, y0 - 2.6, y1 + 1.6, 0, 0.9, marble, 0.03)
    stair(0, 8.0, y0 - 2.6, 0.0, 0.9)
    lifted(0.9, gable_volume, "Obong", x0, x1, y0, y1, 9.0, 19.5, ow=0.6, oe=0.6, o=0.6)


lifted(LEVELS[3], obong_volume)
flat_volume("Lobby", *B["lobby"], 4.8, entrance=8.0)
flat_volume("Artist", *B["artist"], 4.2)
flat_volume("Lounge", *B["lounge"], 4.2)

court_m = marble


def path_at(t):
    return math.sin(t * 2.2) * 6 * t, -20 - t * 120


path_pts = [path_at(i / 60) for i in range(61)]


def slab(x, y, ang, w, l, mat, z=0.06, h=0.12):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z), rotation=(0, 0, ang))
    o = bpy.context.active_object
    o.scale = (w, l, h)
    o.data.materials.append(mat)
    bv = o.modifiers.new("soft", "BEVEL"); bv.width = 0.03; bv.segments = 2
    return o


# 숲을 지나오는 길: 같은 대리석의 긴 판석을 띄엄띄엄
t = (abs(PLAZA[2]) - 20) / 120
while t <= 1.0:
    x, y = path_at(t)
    x2, y2 = path_at(t + 0.004)
    ang = math.atan2(x2 - x, -(y2 - y))
    slab(x, y, -ang, 4.6, 1.0, marble)
    t += 1.3 / 120

# 등받이 없는 나무 벤치: 두툼한 상판에 판재 다리 둘
wood = principled("bench_wood", (0.46, 0.29, 0.16), 0.55)


def bench(x, y, along_x=True, L=2.6):
    w, d = (L, 0.55) if along_x else (0.55, L)
    z = level(y)
    soft_box("bench_top", x - w / 2, x + w / 2, y - d / 2, y + d / 2, z + 0.52, z + 0.64, wood, 0.05)
    for k in (-1, 1):
        if along_x:
            soft_box("bench_leg", x + k * (L / 2 - 0.25) - 0.05, x + k * (L / 2 - 0.25) + 0.05, y - 0.24, y + 0.24, z + 0.15, z + 0.52, wood, 0.02)
        else:
            soft_box("bench_leg", x - 0.24, x + 0.24, y + k * (L / 2 - 0.25) - 0.05, y + k * (L / 2 - 0.25) + 0.05, z + 0.15, z + 0.52, wood, 0.02)


for x, y, ax in [(-30, -31, True), (-17, -36, True), (17, -36, True), (30, -31, True), (-43, -39, True), (43, -39, True),
                 (-50, -4, False), (-50, 9, False), (50, -4, False), (50, 9, False),
                 (-4, 0, True), (4, 0, True), (0, 8, True), (-22, 38, True), (22, 38, True)]:
    bench(x, y, ax)

# 낮은 볼라드 조명: 길 양옆과 광장 둘레
glow_m = bpy.data.materials.new("glow")
glow_m.use_nodes = True
gb = glow_m.node_tree.nodes["Principled BSDF"]
gb.inputs["Base Color"].default_value = (1.0, 0.9, 0.7, 1)
gb.inputs["Emission Color"].default_value = (1.0, 0.88, 0.66, 1)
gb.inputs["Emission Strength"].default_value = 3.0


def bollard(x, y):
    cyl("bollard", x, y, 0.1, 0.9, 0.11, steel)
    cyl("bollard_light", x, y, 0.72, 0.84, 0.115, glow_m)


for i in range(14):
    x, y = path_at(0.24 + i * 0.055)
    bollard(x - 3.4, y)
    bollard(x + 3.4, y)
for x in (-54, -36, -18, 18, 36, 54):
    bollard(x, -44.5)

# 숲 바닥: 이끼 낀 어두운 초록
bpy.ops.mesh.primitive_grid_add(x_subdivisions=180, y_subdivisions=180, size=900)
for vtx in bpy.context.active_object.data.vertices:
    vtx.co.z = ground_z(vtx.co.y) - 0.05
moss = bpy.data.materials.new("moss")
moss.use_nodes = True
mnt = moss.node_tree
noise = mnt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 0.03
noise.inputs["Detail"].default_value = 4
ramp = mnt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (0.08, 0.14, 0.06, 1)
ramp.color_ramp.elements[1].color = (0.18, 0.25, 0.1, 1)
mnt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
mnt.links.new(ramp.outputs["Color"], mnt.nodes["Principled BSDF"].inputs["Base Color"])
mnt.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.95
bpy.context.active_object.data.materials.append(moss)

# ───────── 나무: 키 큰 전나무와 너도밤나무, 매끈하고 둥근 모양은 그대로 ─────────
proto = bpy.data.collections.new("TreeProtos")
scene.collection.children.link(proto)
protos = []
fir_ms = [principled(f"fir{i}", c, 0.8) for i, c in enumerate([(0.05, 0.14, 0.08), (0.07, 0.17, 0.1), (0.09, 0.2, 0.11)])]
beech_ms = [principled(f"beech{i}", c, 0.75) for i, c in enumerate([(0.2, 0.36, 0.13), (0.28, 0.44, 0.17), (0.36, 0.5, 0.2)])]
bark_gray = principled("bark_gray", (0.42, 0.4, 0.37), 0.8)


def to(c, ob):
    for u in ob.users_collection:
        u.objects.unlink(ob)
    c.objects.link(ob)


for k, fm in enumerate(fir_ms):   # 전나무: 가늘고 길게 다섯 겹
    c = bpy.data.collections.new(f"fir{k}")
    proto.children.link(c)
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=0.35, depth=3.0, location=(0, 0, 1.5))
    t = bpy.context.active_object; t.data.materials.append(trunk_m); bpy.ops.object.shade_smooth(); to(c, t)
    h = 0.0
    for j in range(5):
        rr = 3.1 - j * 0.52 + k * 0.15
        bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=rr, radius2=0.2, depth=rr * 1.6, location=(0, 0, 4.0 + j * 2.9))
        cn = bpy.context.active_object
        cn.data.materials.append(fm)
        bv = cn.modifiers.new("soft", "BEVEL"); bv.width = 0.4; bv.segments = 4
        bpy.ops.object.shade_smooth()
        to(c, cn)
    protos.append((c, 0.6))
for k, bm_ in enumerate(beech_ms):   # 너도밤나무: 곧은 회색 줄기 위 둥근 잎 세 덩이
    c = bpy.data.collections.new(f"beech{k}")
    proto.children.link(c)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.42, depth=9.0, location=(0, 0, 4.5))
    t = bpy.context.active_object; t.data.materials.append(bark_gray); bpy.ops.object.shade_smooth(); to(c, t)
    for (dx, dy, dz, rr) in ((0, 0, 11.5, 3.8), (1.9, 0.6, 9.8, 2.9), (-1.6, -0.9, 10.2, 3.0)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=18, radius=rr + k * 0.2, location=(dx, dy, dz))
        sp_ = bpy.context.active_object; sp_.scale.z = 0.85; sp_.data.materials.append(bm_); bpy.ops.object.shade_smooth(); to(c, sp_)
    protos.append((c, 0.4))
bpy.context.view_layer.layer_collection.children["TreeProtos"].exclude = True


def blocked(x, y):
    if PLAZA[0] - 5 < x < PLAZA[1] + 5 and PLAZA[2] - 5 < y < PLAZA[3] + 5:
        return True
    return any((x - px) ** 2 + (y - py) ** 2 < (6.5 if py > -60 else 22.0) ** 2 for px, py in path_pts)   # 길 끝 쪽은 넓게 열어 정면이 보이게


forest = bpy.data.collections.new("Forest")
scene.collection.children.link(forest)
placed = tries = 0
spots = []
while placed < 1900 and tries < 60000:
    tries += 1
    rr = 44 + random.random() ** 0.85 * 220
    a = random.random() * math.tau
    x, y = math.cos(a) * rr * 1.15, math.sin(a) * rr
    if blocked(x, y) or any((x - sx) ** 2 + (y - sy) ** 2 < 4.4 ** 2 for sx, sy in spots[-60:]):
        continue
    e = bpy.data.objects.new("tree", None)
    e.instance_type = "COLLECTION"
    e.instance_collection = random.choices([p[0] for p in protos], weights=[p[1] for p in protos])[0]
    e.location = (x, y, ground_z(y) - 0.2)
    e.rotation_euler.z = random.random() * math.tau
    s = 1.35 + random.random() * 0.6   # 유럽 숲처럼 건물보다 높이 솟는다
    e.scale = (s, s, s * (1.0 + random.random() * 0.2))
    forest.objects.link(e)
    spots.append((x, y))
    placed += 1
print("trees", placed)

# ───────── 빛: 부드러운 해와 파스텔 하늘 ─────────
world = bpy.data.worlds.new("Sky")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.6, 0.74, 0.92, 1)
bg.inputs["Strength"].default_value = 0.9
# 카메라에 보이는 하늘만 더 밝고 맑은 파랑으로
wnt = world.node_tree
seen = wnt.nodes.new("ShaderNodeBackground")
seen.inputs["Color"].default_value = (0.55, 0.72, 0.95, 1)
seen.inputs["Strength"].default_value = 2.1
lp = wnt.nodes.new("ShaderNodeLightPath")
mix = wnt.nodes.new("ShaderNodeMixShader")
wnt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
wnt.links.new(bg.outputs["Background"], mix.inputs[1])
wnt.links.new(seen.outputs["Background"], mix.inputs[2])
wnt.links.new(mix.outputs["Shader"], wnt.nodes["World Output"].inputs["Surface"])
scene.world = world
sd = bpy.data.lights.new("Sun", "SUN")
sd.energy = 3.0
sd.angle = math.radians(5)
sd.color = (1.0, 0.95, 0.88)
sun = link(bpy.data.objects.new("Sun", sd))
sun.rotation_euler = (math.radians(38), 0, math.radians(205))

# 멀수록 옅어지는 숲 안개
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 35))
haze = bpy.context.active_object
haze.scale = (700, 700, 70)
hm = bpy.data.materials.new("haze")
hm.use_nodes = True
hn = hm.node_tree
hn.nodes.remove(hn.nodes["Principled BSDF"])
vol = hn.nodes.new("ShaderNodeVolumePrincipled")
vol.inputs["Density"].default_value = 0.0016
vol.inputs["Color"].default_value = (0.82, 0.88, 0.96, 1)
hn.links.new(vol.outputs["Volume"], hn.nodes["Material Output"].inputs["Volume"])
haze.data.materials.append(hm)

# ───────── 카메라: 높은 데서 내려다보는 미니어처 ─────────
cd = bpy.data.cameras.new("Cam")
cam = link(bpy.data.objects.new("Cam", cd))
if VIEW == "front":   # 남쪽 길에서 눈높이로: 겹겹 능선이 읽히는지 보는 시점
    cd.lens = 28
    cam.location = (0, -84, 5.5)
    target = Vector((0, 4, 13))
elif VIEW == "close":
    cd.lens = 40
    cam.location = (36, -50, 16)
    target = Vector((-4, 6, 7))
else:
    cd.lens = 55
    cam.location = (-10, -150, 105)
    target = Vector((0, 2, 2))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
cd.dof.use_dof = True
cd.dof.focus_distance = (target - cam.location).length
cd.dof.aperture_fstop = {"wide": 0.012, "close": 0.5}.get(VIEW, 8.0)   # 미니어처처럼 앞뒤가 흐려진다
scene.camera = cam

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
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = RES
# 장난감 같은 또렷한 색: 색을 눌러 주는 AgX 대신 Standard에 노출을 낮춘다
scene.view_settings.view_transform = "Standard"
scene.view_settings.exposure = -0.9
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + ".blend")
print("DONE", OUT)
