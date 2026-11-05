"""숲속 오봉 능선 갤러리, 장난감 디오라마 버전.

blender -b --python build_exterior_toy.py -- <출력 png> [samples] [가로] [세로] [wide|close]

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
glass = principled("window", (0.13, 0.18, 0.26), 0.3)
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


def curved_roof(name, ex0, ex1, ey0, ey1, zb, rise, ridge_extra=0.0, peak=0.0, apex=0.5, NU=32, NV=14):
    """두툼하고 둥근 장난감 지붕. 오목한 물매와 살짝 들린 귀는 남기되 단순하게.
    peak를 주면 용마루가 수평으로 가지 않고 apex(0~1, 용마루 위 자리)에서 봉우리처럼 솟는다."""
    w, d = ex1 - ex0, ey1 - ey0
    cx, cy = (ex0 + ex1) / 2, (ey0 + ey1) / 2
    short = min(w, d)
    lift, out = min(0.085 * short, 1.5), min(0.035 * short, 0.55)
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
        p.z = zb + (rise + bump(s)) * (v ** 1.25) + lift * k
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
    sol.thickness = 0.85
    sol.offset = -1
    bv = roof.modifiers.new("soft", "BEVEL")
    bv.width = 0.32
    bv.segments = 5
    bv.limit_method = "ANGLE"
    bv.angle_limit = math.radians(40)
    # 크림 장식처럼 굵은 자개 마루
    rd = (r1 - r0).normalized() if (r1 - r0).length > 1e-6 else Vector((1, 0, 0))
    up = Vector((0, 0, 0.32))
    ridge = [r0.lerp(r1, s / 16) + Vector((0, 0, bump(s / 16))) + up for s in range(17)]
    tube(name + "_ridge", [ridge[0] - rd * 0.6 + Vector((0, 0, 0.35))] + ridge + [ridge[-1] + rd * 0.6 + Vector((0, 0, 0.35))], 0.42, nacre)
    for corner, top, u, s in hips:
        pts = [shape(corner.lerp(top, j / 10), u, j / 10, s) + Vector((0, 0, 0.22)) for j in range(11)]
        tube(name + "_hip", pts, 0.27, nacre)
        # 처마 끝 동그란 막새
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.42, location=pts[0])
        ob = bpy.context.active_object
        ob.data.materials.append(nacre)
        bpy.ops.object.shade_smooth()


def hall(name, x0, x1, y0, y1, wall_h, rise, over=1.6, ridge_extra=0.0, door_south=False, peak=0.0, apex=0.5):
    soft_box(name + "_base", x0 - 0.5, x1 + 0.5, y0 - 0.5, y1 + 0.5, 0, 0.6, plinth, 0.25)
    soft_box(name + "_wall", x0, x1, y0, y1, 0.5, wall_h, plaster, 0.45)
    for x in (x0, x1):
        for y in (y0, y1):
            cyl(name + "_post", x, y, 0.5, wall_h + 0.1, 0.42, timber)
    # 남쪽 면에 동그란 창: 크림 테두리 안에 남색 유리
    n = max(1, int((x1 - x0) // 4.2))
    for i in range(n):
        x = x0 + (x1 - x0) * (i + 0.5) / n
        if door_south and abs(x - (x0 + x1) / 2) < 2.6:
            continue
        zc = wall_h * 0.5 + 0.2
        for rr, dy, m in ((0.95, 0.16, timber), (0.75, 0.24, glass)):
            bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=rr, depth=0.2, location=(x, y0 - dy + 0.1, zc), rotation=(math.pi / 2, 0, 0))
            o = bpy.context.active_object
            o.data.materials.append(m)
            bv = o.modifiers.new("soft", "BEVEL"); bv.width = 0.07; bv.segments = 3
            bpy.ops.object.shade_smooth()
    if door_south:
        cx = (x0 + x1) / 2
        soft_box(name + "_door", cx - 1.6, cx + 1.6, y0 - 0.15, y0 + 0.1, 0.55, 3.4, door, 0.5)
    curved_roof(name, x0 - over, x1 + over, y0 - over, y1 + over, wall_h - 0.1, rise, ridge_extra, peak, apex)


def rect(px0, px1, py0, py1):
    x0, y1 = P(px0, py0)
    x1, y0 = P(px1, py1)
    return x0, x1, y0, y1


B = {"obong": rect(390, 610, 40, 180)}
for side, (a, b) in {"works": (110, 390), "ip": (610, 890)}.items():
    B[side + "_back"] = rect(a, b, 190, 300)
    B[side + "_front"] = rect(a, b, 300, 410)
B["lobby"], B["artist"], B["lounge"] = rect(430, 570, 420, 530), rect(300, 420, 420, 530), rect(580, 700, 420, 530)
# 일월오봉도의 다섯 봉우리: 남쪽에서 보면 왼쪽부터 낮은 봉 · 중간 봉 · 주봉 · 중간 봉 · 낮은 봉
# 뒷줄 봉우리 꼭대기는 주봉 쪽에, 앞줄 봉우리 꼭대기는 바깥 끝에 두어 앞산이 뒷산을 반쯤 가린다
hall("Obong", *B["obong"], wall_h=8.0, rise=17.5, over=2.6, ridge_extra=-0.22)          # 주봉: 거의 뾰족한 봉우리
hall("WorksBack", *B["works_back"], wall_h=6.0, rise=4.2, over=2.0, peak=7.0, apex=0.78)
hall("IPBack", *B["ip_back"], wall_h=6.0, rise=4.2, over=2.0, peak=7.0, apex=0.22)
hall("WorksFront", *B["works_front"], wall_h=4.6, rise=2.8, over=1.7, peak=4.6, apex=0.16)
hall("IPFront", *B["ip_front"], wall_h=4.6, rise=2.8, over=1.7, peak=4.6, apex=0.84)
# 로비 줄은 봉우리 앞에 깔린 낮은 산자락
hall("Lobby", *B["lobby"], wall_h=4.0, rise=1.7, over=1.5, door_south=True)
hall("Artist", *B["artist"], wall_h=3.8, rise=1.5, over=1.4)
hall("Lounge", *B["lounge"], wall_h=3.8, rise=1.5, over=1.4)
cx0, cx1, cy0, cy1 = rect(410, 590, 200, 400)
soft_box("Court", cx0, cx1, cy0, cy1, 0, 0.12, court_m, 0.08)

# 길: 숲에서 로비까지 동글동글한 크림색 디딤돌, 양옆에 작은 덤불
def path_at(t):
    return math.sin(t * 2.2) * 6 * t, -20 - t * 120


path_pts = [path_at(i / 60) for i in range(61)]
stone_proto = None
k = 0
t = 0.0
while t <= 1.0:
    x, y = path_at(t)
    off = 0.7 if k % 2 else -0.7
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=1.0 + random.random() * 0.25, depth=0.22, location=(x + off, y, 0.08))
    o = bpy.context.active_object
    o.scale.y = 0.8
    o.rotation_euler.z = random.random() * math.pi
    o.data.materials.append(path_m)
    bv = o.modifiers.new("soft", "BEVEL"); bv.width = 0.1; bv.segments = 4
    bpy.ops.object.shade_smooth()
    t += 1.9 / 120
    k += 1

# 잔디: 부드러운 얼룩
bpy.ops.mesh.primitive_plane_add(size=900)
gm = grass
gnt = gm.node_tree
noise = gnt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 0.015
noise.inputs["Detail"].default_value = 2
ramp = gnt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (0.3, 0.52, 0.24, 1)
ramp.color_ramp.elements[1].color = (0.44, 0.63, 0.3, 1)
gnt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
gnt.links.new(ramp.outputs["Color"], gnt.nodes["Principled BSDF"].inputs["Base Color"])
bpy.context.active_object.data.materials.append(gm)

# 로비 앞 통통한 석등 한 쌍
lantern_m = principled("lantern", (0.9, 0.87, 0.8), 0.8)
glow_m = bpy.data.materials.new("glow")
glow_m.use_nodes = True
gb = glow_m.node_tree.nodes["Principled BSDF"]
gb.inputs["Base Color"].default_value = (1.0, 0.85, 0.5, 1)
gb.inputs["Emission Color"].default_value = (1.0, 0.8, 0.45, 1)
gb.inputs["Emission Strength"].default_value = 2.0
lx0, lx1, ly0, ly1 = B["lobby"]
for sx in (-4.6, 4.6):
    yb = ly0 - 3.2
    cyl("lan_post", sx, yb, 0.0, 1.3, 0.38, lantern_m)
    soft_box("lan_box", sx - 0.6, sx + 0.6, yb - 0.6, yb + 0.6, 1.3, 2.3, lantern_m, 0.25)
    soft_box("lan_light", sx - 0.42, sx + 0.42, yb - 0.63, yb + 0.63, 1.5, 2.1, glow_m, 0.12)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.95, location=(sx, yb, 2.55))
    cap = bpy.context.active_object; cap.scale.z = 0.45; cap.data.materials.append(lantern_m); bpy.ops.object.shade_smooth()
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.28, location=(sx, yb, 3.05))
    bpy.context.active_object.data.materials.append(lantern_m); bpy.ops.object.shade_smooth()

# 꽃: 마당과 길 가장자리에 분홍·노랑·흰 점
flower_ms = [principled("fl_pink", (0.96, 0.55, 0.7), 0.6), principled("fl_yellow", (0.98, 0.83, 0.3), 0.6), principled("fl_white", (0.97, 0.96, 0.93), 0.6)]
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=0.28)
fl_proto = bpy.context.active_object
bpy.ops.object.shade_smooth()
fl_proto.location = (0, 0, -50)
fl_proto.data.materials.append(flower_ms[0])
clumps = []
for c in range(46):
    if c % 2:
        x, y = path_at(random.uniform(0.05, 0.6))
        x += random.choice((-1, 1)) * (6 + random.random() * 5)
    else:
        x, y = random.uniform(-55, 55), random.uniform(-62, -30)
    clumps.append((x, y))
for i in range(46 * 8):
    cx_, cy_ = clumps[i // 8]
    a, r = random.random() * math.tau, random.random() ** 0.5 * 1.6
    x, y = cx_ + math.cos(a) * r, cy_ + math.sin(a) * r
    f = fl_proto.copy()
    col.objects.link(f)
    f.location = (x, y, 0.22)
    f.material_slots[0].link = "OBJECT"
    f.material_slots[0].material = flower_ms[(i // 8) % 3]
    f.scale = (1, 1, 0.7)
# 길가의 작은 동그라미 덤불
for i in range(40):
    x, y = path_at(0.03 + i / 42)
    s = 1 if i % 2 else -1
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.9 + random.random() * 0.5, location=(x + s * (4.6 + random.random() * 1.0), y, 0.6))
    b = bpy.context.active_object
    b.scale.z = 0.75
    b.data.materials.append(random.choice(leaf_ms))
    bpy.ops.object.shade_smooth()

# ───────── 나무: 매끈한 동그라미 나무와 둥근 원뿔 나무 ─────────
proto = bpy.data.collections.new("TreeProtos")
scene.collection.children.link(proto)
protos = []


def to(c, ob):
    for u in ob.users_collection:
        u.objects.unlink(ob)
    c.objects.link(ob)


for k, lm in enumerate(leaf_ms):
    # 동그라미 나무
    c = bpy.data.collections.new(f"round{k}")
    proto.children.link(c)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.45, depth=4.0, location=(0, 0, 2.0))
    t = bpy.context.active_object; t.data.materials.append(trunk_m); bpy.ops.object.shade_smooth(); to(c, t)
    r = 3.4 + k * 0.25
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=r, location=(0, 0, 4.0 + r * 0.85))
    s = bpy.context.active_object; s.scale.z = 0.92; s.data.materials.append(lm); bpy.ops.object.shade_smooth(); to(c, s)
    protos.append(c)
    # 둥근 원뿔 나무: 세 겹
    c = bpy.data.collections.new(f"cone{k}")
    proto.children.link(c)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.4, depth=3.0, location=(0, 0, 1.5))
    t = bpy.context.active_object; t.data.materials.append(trunk_m); bpy.ops.object.shade_smooth(); to(c, t)
    for j, (rr, zz) in enumerate(((3.4, 4.2), (2.7, 6.8), (1.9, 9.2))):
        bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=rr, radius2=0.25, depth=rr * 1.25, location=(0, 0, zz))
        cn = bpy.context.active_object
        cn.data.materials.append(lm)
        bv = cn.modifiers.new("soft", "BEVEL"); bv.width = 0.5; bv.segments = 5
        bpy.ops.object.shade_smooth()
        to(c, cn)
    protos.append(c)
bpy.context.view_layer.layer_collection.children["TreeProtos"].exclude = True


def blocked(x, y):
    if -48 < x < 48 and -28 < y < 36:
        return True
    if -60 < x < 60 and -64 < y < -28:
        return True
    return any((x - px) ** 2 + (y - py) ** 2 < 8 ** 2 for px, py in path_pts)


forest = bpy.data.collections.new("Forest")
scene.collection.children.link(forest)
placed = tries = 0
spots = []
while placed < 1300 and tries < 40000:
    tries += 1
    rr = 44 + random.random() ** 0.85 * 220
    a = random.random() * math.tau
    x, y = math.cos(a) * rr * 1.15, math.sin(a) * rr
    if blocked(x, y) or any((x - sx) ** 2 + (y - sy) ** 2 < 5.2 ** 2 for sx, sy in spots[-60:]):
        continue
    e = bpy.data.objects.new("tree", None)
    e.instance_type = "COLLECTION"
    e.instance_collection = random.choice(protos)
    e.location = (x, y, 0)
    e.rotation_euler.z = random.random() * math.tau
    s = 0.85 + random.random() * 0.35
    e.scale = (s, s, s)
    forest.objects.link(e)
    spots.append((x, y))
    placed += 1
print("trees", placed)

# ───────── 빛: 부드러운 해와 파스텔 하늘 ─────────
world = bpy.data.worlds.new("Sky")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.52, 0.74, 1.0, 1)
bg.inputs["Strength"].default_value = 0.9
# 카메라에 보이는 하늘만 더 밝고 맑은 파랑으로
wnt = world.node_tree
seen = wnt.nodes.new("ShaderNodeBackground")
seen.inputs["Color"].default_value = (0.42, 0.68, 1.0, 1)
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
sd.angle = math.radians(9)
sd.color = (1.0, 0.95, 0.88)
sun = link(bpy.data.objects.new("Sun", sd))
sun.rotation_euler = (math.radians(38), 0, math.radians(205))

# ───────── 카메라: 높은 데서 내려다보는 미니어처 ─────────
cd = bpy.data.cameras.new("Cam")
cam = link(bpy.data.objects.new("Cam", cd))
if VIEW == "front":   # 남쪽 길에서 눈높이로: 겹겹 능선이 읽히는지 보는 시점
    cd.lens = 28
    cam.location = (0, -78, 3.5)
    target = Vector((0, 0, 9))
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
