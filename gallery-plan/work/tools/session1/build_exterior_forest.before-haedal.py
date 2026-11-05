"""유럽 어느 숲속에 있는 듯한 오봉 능선 갤러리: 건물은 한국적, 둘레는 현대적인 대리석 광장.

blender -b --python build_exterior_forest.py -- <출력 png> [samples] [가로] [세로] [front|wide|close]

build_exterior_toy.py에서 갈라져 나왔다. 다섯 봉우리 지붕과 둥근 몸체는 그대로,
잔디 대신 대리석 광장과 등받이 없는 나무 벤치, 큰 유리창과 낮은 볼라드 조명, 전나무·너도밤나무 숲과 옅은 안개.

build_exterior.py와 같은 배치(보드 01 평면, 1 px = 0.1 m)를 쓰되, 귀엽게:
두툼하고 모서리가 둥근 지붕, 크림 장식처럼 굵은 자개 마루, 모서리 기둥만 남긴 둥근 몸체,
매끈한 동그라미·원뿔 나무, 부드러운 빛, 앞뒤가 흐려지는 미니어처 카메라.
"""
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


def curved_roof(name, ex0, ex1, ey0, ey1, zb, rise, ridge_extra=0.0, peak=0.0, apex=0.5, NU=32, NV=14, gable=True):
    """두툼하고 둥근 장난감 지붕. 오목한 물매와 살짝 들린 귀는 남기되 단순하게.
    peak를 주면 용마루가 수평으로 가지 않고 apex(0~1, 용마루 위 자리)에서 봉우리처럼 솟는다."""
    w, d = ex1 - ex0, ey1 - ey0
    cx, cy = (ex0 + ex1) / 2, (ey0 + ey1) / 2
    short = min(w, d)
    lift, out = min(0.06 * short, 1.0), min(0.03 * short, 0.45)
    zt = zb + rise
    if w >= d:
        h = max(0.3, min((w - d) / 2 + d * ridge_extra, w / 2 - 0.5))
        r0, r1 = Vector((cx - h, cy, zt)), Vector((cx + h, cy, zt))
    else:
        h = max(0.3, min((d - w) / 2 + w * ridge_extra, d / 2 - 0.5))
        r0, r1 = Vector((cx, cy - h, zt)), Vector((cx, cy + h, zt))
    c = [Vector((ex0, ey0, zb)), Vector((ex1, ey0, zb)), Vector((ex1, ey1, zb)), Vector((ex0, ey1, zb))]

    def bump(s):
        """용마루 자리 s에서 더 솟는 높이: 꼭대기에서 가장 높고 양쪽으로 둥글게 내려간다."""
        if not peak:
            return 0.0
        far = max(apex, 1 - apex)
        t = min(1.0, abs(s - apex) / far)
        return peak * (1 - t * t) ** 1.3

    def shape(p_lin, u, v, s):
        k = abs(2 * u - 1) ** 2.4 * (1 - v) ** 2
        p = p_lin.copy()
        p.z = zb + (rise + bump(s)) * (v ** 1.5) + lift * k
        o = Vector((p.x - cx, p.y - cy, 0))
        if o.length > 1e-6:
            p += o.normalized() * out * k
        return p

    def patch(bm, e0, e1, t0, t1, s_of):
        rows = []
        for j in range(NV + 1):
            v = j / NV
            rows.append([bm.verts.new(shape(e0.lerp(e1, i / NU).lerp(t0.lerp(t1, i / NU), v), i / NU, v, s_of(i / NU))) for i in range(NU + 1)])
        for j in range(NV):
            for i in range(NU):
                bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))

    fwd, back, at0, at1 = (lambda u: u), (lambda u: 1 - u), (lambda u: 0.0), (lambda u: 1.0)
    bm = bmesh.new()
    if w >= d:
        patch(bm, c[0], c[1], r0, r1, fwd); patch(bm, c[2], c[3], r1, r0, back); patch(bm, c[3], c[0], r0, r0, at0); patch(bm, c[1], c[2], r1, r1, at1)
        hips = [(c[0], r0, 0, 0.0), (c[1], r1, 1, 1.0), (c[2], r1, 0, 1.0), (c[3], r0, 1, 0.0)]
    else:
        patch(bm, c[1], c[2], r0, r1, fwd); patch(bm, c[3], c[0], r1, r0, back); patch(bm, c[0], c[1], r0, r0, at0); patch(bm, c[2], c[3], r1, r1, at1)
        hips = [(c[0], r0, 1, 0.0), (c[1], r0, 0, 0.0), (c[2], r1, 1, 1.0), (c[3], r1, 0, 1.0)]
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if sum(f.normal.z for f in bm.faces) < 0:
        for f in bm.faces:
            f.normal_flip()
    me = bpy.data.meshes.new(name + "_roof")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(lacquer)
    roof = link(bpy.data.objects.new(name + "_roof", me))
    sol = roof.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.42
    sol.offset = -1
    bv = roof.modifiers.new("soft", "BEVEL")
    bv.width = 0.12
    bv.segments = 5
    bv.limit_method = "ANGLE"
    bv.angle_limit = math.radians(40)
    # 크림 장식처럼 굵은 자개 마루
    rd = (r1 - r0).normalized() if (r1 - r0).length > 1e-6 else Vector((1, 0, 0))
    up = Vector((0, 0, 0.2))
    ridge = [r0.lerp(r1, s / 16) + Vector((0, 0, bump(s / 16))) + up for s in range(17)]
    tube(name + "_ridge", ridge, 0.24, nacre)
    for corner, top, u, s in hips:
        pts = [shape(corner.lerp(top, j / 10), u, j / 10, s) + Vector((0, 0, 0.14)) for j in range(11)]
        tube(name + "_hip", pts, 0.15, nacre)
        # 처마 끝 동그란 막새
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.22, location=pts[0])
        ob = bpy.context.active_object
        ob.data.materials.append(nacre)
        bpy.ops.object.shade_smooth()
    # 합각: 용마루 양 끝 아래 세운 흰 삼각 벽과 자개빛 박공 선 (팔작지붕의 결)
    if gable and (r1 - r0).length > 1.0:
        horiz = w >= d
        half = (d if horiz else w) / 2
        end = (r0.x - ex0) if horiz else (r0.y - ey0)
        gh = rise * 0.42
        v = ((rise - gh) / rise) ** (1 / 1.5)
        hw = half * (1 - v) * 0.92
        side = Vector((0, 1, 0)) if horiz else Vector((1, 0, 0))
        for r, sg in ((r0, -1), (r1, 1)):
            c_ = r + rd * sg * end * (1 - v)
            base, top = c_ + Vector((0, 0, -gh)), c_ + Vector((0, 0, 0.05))
            a_, b_ = base - side * hw, base + side * hw
            bm2 = bmesh.new()
            bm2.faces.new([bm2.verts.new(q) for q in (a_, b_, top)])
            me2 = bpy.data.meshes.new(name + "_gable")
            bm2.to_mesh(me2)
            bm2.free()
            me2.materials.append(plaster)
            g_ob = link(bpy.data.objects.new(name + "_gable", me2))
            g_ob.modifiers.new("t", "SOLIDIFY").thickness = 0.15
            tube(name + "_bakgong", [a_ + Vector((0, 0, 0.12)), top + Vector((0, 0, 0.18)), b_ + Vector((0, 0, 0.12))], 0.15, nacre)
            tube(name + "_ridgeend", [r + up, top + Vector((0, 0, 0.18))], 0.24, nacre)


def hall(name, x0, x1, y0, y1, wall_h, rise, over=1.6, ridge_extra=0.0, door_south=False, peak=0.0, apex=0.5, roof=True):
    soft_box(name + "_base", x0 - 0.5, x1 + 0.5, y0 - 0.5, y1 + 0.5, 0, 0.6, plinth, 0.25)
    soft_box(name + "_wall", x0, x1, y0, y1, 0.5, wall_h, plaster, 0.45)
    for x in (x0, x1):
        for y in (y0, y1):
            cyl(name + "_post", x, y, 0.5, wall_h + 0.1, 0.42, timber)
    # 남쪽 면: 가는 검은 틀의 큰 유리창. 로비는 앞면 전체가 유리
    if door_south:
        gx0, gx1 = x0 + 0.7, x1 - 0.7
        soft_box(name + "_glass", gx0, gx1, y0 - 0.14, y0 + 0.05, 0.6, wall_h - 0.35, glass, 0.06)
        n = max(2, round((gx1 - gx0) / 1.6))
        for i in range(n + 1):
            x = gx0 + (gx1 - gx0) * i / n
            soft_box(name + "_mull", x - 0.045, x + 0.045, y0 - 0.2, y0 - 0.1, 0.6, wall_h - 0.35, steel, 0.0)
        soft_box(name + "_mullh", gx0, gx1, y0 - 0.2, y0 - 0.1, 2.9, 2.98, steel, 0.0)
    else:
        n = max(1, int((x1 - x0) // 3.2))
        for i in range(n):
            x = x0 + (x1 - x0) * (i + 0.5) / n
            soft_box(name + "_win", x - 1.05, x + 1.05, y0 - 0.12, y0 + 0.05, 0.95, wall_h - 0.55, glass, 0.06)
            soft_box(name + "_frame", x - 1.12, x + 1.12, y0 - 0.16, y0 - 0.1, 0.88, 0.95, steel, 0.0)
    if roof:
        curved_roof(name, x0 - over, x1 + over, y0 - over, y1 + over, wall_h - 0.1, rise, ridge_extra, peak, apex)


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
# 일월오봉도의 겹겹 산: 방마다 용마루가 짧은 한옥 지붕을 따로 얹어 저마다 봉우리가 된다.
# 바깥에서 안쪽으로, 앞줄에서 뒷줄로 갈수록 높아져 가운데 일월오봉단관(주봉)으로 모인다.
lifted(LEVELS[3], hall, "Obong", *B["obong"], wall_h=8.0, rise=10.5, over=3.0, ridge_extra=0.06)
for side in ("works", "ip"):
    lifted(LEVELS[2], hall, side.title() + "Back", *B[side + "_back"], wall_h=6.0, rise=0, roof=False)
    lifted(LEVELS[1], hall, side.title() + "Front", *B[side + "_front"], wall_h=4.6, rise=0, roof=False)
ROOMS = [   # (평면 px x0, x1, y0, y1), 벽 높이, 지붕 높이
    ((250, 390, 190, 300), 6.0, 6.6), ((110, 250, 190, 300), 6.0, 5.6),   # 작품관 뒷줄: N차적(안) · 우주조약(밖)
    ((250, 390, 300, 410), 4.6, 4.0), ((110, 250, 300, 410), 4.6, 4.6),   # 작품관 앞줄: 법과 권리(안) · POV(밖)
    ((610, 750, 190, 300), 6.0, 6.6), ((750, 890, 190, 300), 6.0, 5.6),   # IP 뒷줄: 해변(안) · 숲길(밖)
    ((610, 750, 300, 410), 4.6, 4.0), ((750, 890, 300, 410), 4.6, 4.6),   # IP 앞줄: 수영장(안) · 작업실(밖)
]
for k, ((a, b, c, d), wh, rs) in enumerate(ROOMS):
    x0, x1, y0, y1 = rect(a, b, c, d)
    o = 2.2 if wh > 5 else 1.9
    lifted(level((y0 + y1) / 2), curved_roof, f"Room{k}", x0 - o, x1 + o, y0 - o, y1 + o, wh - 0.1, rs, ridge_extra=0.04)
# 로비 줄은 봉우리 앞에 깔린 낮은 산자락
hall("Lobby", *B["lobby"], wall_h=4.0, rise=2.6, over=1.9, door_south=True)
hall("Artist", *B["artist"], wall_h=3.8, rise=2.4, over=1.8)
hall("Lounge", *B["lounge"], wall_h=3.8, rise=2.4, over=1.8)
cx0, cx1, cy0, cy1 = rect(410, 590, 200, 400)

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
gb.inputs["Emission Color"].default_value = (1.0, 0.85, 0.6, 1)
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
