"""숲속 오봉 능선 갤러리 외관 시안을 짓고 한낮 빛으로 렌더한다.

blender -b --python build_exterior.py -- <출력 png> [samples] [가로] [세로]

배치는 컨셉 보드 01 평면(1 px = 0.1 m)을 그대로 옮겼다. x는 동쪽, y는 북쪽, z가 위.
지붕은 검은 옻칠, 용마루와 내림마루는 자개빛. 벽은 흰 회벽에 짙은 나무 기둥.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "exterior.png")
SAMPLES = int(argv[1]) if len(argv) > 1 else 96
RES = (int(argv[2]) if len(argv) > 2 else 1920, int(argv[3]) if len(argv) > 3 else 1080)
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection


def P(px, py):
    """보드 평면 픽셀 좌표를 미터로."""
    return (px - 500) * 0.1, -(py - 330) * 0.1


# ───────── 재질 ─────────
def principled(name, rgb, rough=0.8, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    for k, v in kw.items():
        if k in b.inputs:
            b.inputs[k].default_value = v
    return m


lacquer = principled("lacquer", (0.004, 0.003, 0.004), 0.5, **{"Coat Weight": 0.22, "Coat Roughness": 0.22, "Specular IOR Level": 0.15})
nacre = principled("nacre", (0.86, 0.9, 0.94), 0.12, **{"Metallic": 0.35, "Thin Film Thickness": 480.0, "Thin Film IOR": 1.45,
                                                        "Coat Weight": 0.6, "Coat Roughness": 0.05})
plaster = principled("plaster", (0.82, 0.8, 0.76), 0.92)
timber = principled("timber", (0.07, 0.045, 0.03), 0.6)
stone = principled("stone", (0.42, 0.41, 0.39), 0.85)
gravel = principled("gravel", (0.5, 0.47, 0.42), 0.95)


def ground_mat():
    m = bpy.data.materials.new("forest_floor")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.95
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.08
    noise.inputs["Detail"].default_value = 8
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.09, 0.13, 0.05, 1)
    ramp.color_ramp.elements[1].color = (0.2, 0.22, 0.1, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    return m


def leaf_mat(name, c0, c1):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.7
    if "Subsurface Weight" in b.inputs:
        b.inputs["Subsurface Weight"].default_value = 0.15
    info = nt.nodes.new("ShaderNodeObjectInfo")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*c0, 1)
    ramp.color_ramp.elements[1].color = (*c1, 1)
    nt.links.new(info.outputs["Random"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    return m


pine_leaf = leaf_mat("pine_leaf", (0.03, 0.07, 0.03), (0.06, 0.12, 0.04))
oak_leaf = leaf_mat("oak_leaf", (0.06, 0.14, 0.03), (0.14, 0.22, 0.05))
bark = principled("bark", (0.16, 0.08, 0.05), 0.9)
bark_gray = principled("bark_gray", (0.17, 0.15, 0.13), 0.9)


def obj(name, me, mat=None, parent_col=col):
    ob = bpy.data.objects.new(name, me)
    parent_col.objects.link(ob)
    if mat:
        me.materials.append(mat)
    return ob


def box(name, x0, x1, y0, y1, z0, z1, mat, parent_col=col):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector(((x0 + x1) / 2 + v.co.x * (x1 - x0), (y0 + y1) / 2 + v.co.y * (y1 - y0), (z0 + z1) / 2 + v.co.z * (z1 - z0)))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return obj(name, me, mat, parent_col)


def rod(name, a, b, r, mat):
    """두 점 사이 둥근 막대(용마루 선)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=r, depth=d.length, location=(a + b) / 2)
    ob = bpy.context.active_object
    ob.name = name
    ob.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    ob.data.materials.append(mat)
    return ob


# ───────── 건물: 벽, 기둥, 팔작 느낌의 우진각 지붕 ─────────
def hall(name, x0, x1, y0, y1, wall_h, rise, over=1.4, ridge_extra=0.0):
    box(name + "_wall", x0, x1, y0, y1, 0.45, wall_h, plaster)
    box(name + "_base", x0 - 0.4, x1 + 0.4, y0 - 0.4, y1 + 0.4, 0, 0.45, stone)
    # 기둥: 모서리와 4 m마다
    for xs in (x0, x1):
        n = max(1, round((y1 - y0) / 4))
        for i in range(n + 1):
            y = y0 + (y1 - y0) * i / n
            box(name + "_post", xs - 0.18, xs + 0.18, y - 0.18, y + 0.18, 0.45, wall_h, timber)
    for ys in (y0, y1):
        n = max(1, round((x1 - x0) / 4))
        for i in range(1, n):
            x = x0 + (x1 - x0) * i / n
            box(name + "_post", x - 0.18, x + 0.18, ys - 0.18, ys + 0.18, 0.45, wall_h, timber)
    box(name + "_beam", x0 - 0.2, x1 + 0.2, y0 - 0.2, y1 + 0.2, wall_h - 0.35, wall_h + 0.05, timber)
    return curved_roof(name, x0 - over, x1 + over, y0 - over, y1 + over, wall_h + 0.05, rise, ridge_extra=ridge_extra)


def tube(name, pts, r, mat):
    """점들을 잇는 둥근 선(자개 마루)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (*q, 1)
    ob = bpy.data.objects.new(name, cu)
    col.objects.link(ob)
    cu.materials.append(mat)
    return ob


def curved_roof(name, ex0, ex1, ey0, ey1, zb, rise, ridge_extra=0.0, NU=28, NV=14):
    """한옥 지붕처럼: 물매는 위가 가파르고 처마로 갈수록 눕고(오목), 처마 귀는 들리며(앙곡) 바깥으로 내민다(안허리곡).
    ridge_extra를 주면 용마루가 길어져 팔작지붕처럼 박공 쪽이 가팔라진다."""
    w, d = ex1 - ex0, ey1 - ey0
    cx, cy = (ex0 + ex1) / 2, (ey0 + ey1) / 2
    short = min(w, d)
    lift, out = min(0.065 * short, 1.25), min(0.045 * short, 0.85)     # 귀 들림과 귀 내밈(작은 지붕은 과하지 않게)
    zt = zb + rise
    if w >= d:
        h = min((w - d) / 2 + d * ridge_extra, w / 2 - 0.5)
        r0, r1 = Vector((cx - h, cy, zt)), Vector((cx + h, cy, zt))
    else:
        h = min((d - w) / 2 + w * ridge_extra, d / 2 - 0.5)
        r0, r1 = Vector((cx, cy - h, zt)), Vector((cx, cy + h, zt))
    c = [Vector((ex0, ey0, zb)), Vector((ex1, ey0, zb)), Vector((ex1, ey1, zb)), Vector((ex0, ey1, zb))]
    center = Vector((cx, cy, zb))

    def shape(p_lin, u, v):
        """평면 위치는 직선으로 잡고, 높이와 귀를 휘게 한다."""
        k = abs(2 * u - 1) ** 2 * (1 - v) ** 2          # 처마 귀에 가까울수록 1
        p = p_lin.copy()
        p.z = zb + rise * (v ** 1.45) + lift * k
        o = Vector((p.x - cx, p.y - cy, 0))
        if o.length > 1e-6:
            p += o.normalized() * out * k
        return p

    def patch(bm, e0, e1, t0, t1):
        rows = []
        for j in range(NV + 1):
            v = j / NV
            row = []
            for i in range(NU + 1):
                u = i / NU
                e, t = e0.lerp(e1, u), t0.lerp(t1, u)
                row.append(bm.verts.new(shape(e.lerp(t, v), u, v)))
            rows.append(row)
        for j in range(NV):
            for i in range(NU):
                bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))

    bm = bmesh.new()
    if w >= d:
        patch(bm, c[0], c[1], r0, r1)
        patch(bm, c[2], c[3], r1, r0)
        patch(bm, c[3], c[0], r0, r0)
        patch(bm, c[1], c[2], r1, r1)
        hips = [(c[0], r0, 0), (c[1], r1, 1), (c[2], r1, 0), (c[3], r0, 1)]
    else:
        patch(bm, c[1], c[2], r0, r1)
        patch(bm, c[3], c[0], r1, r0)
        patch(bm, c[0], c[1], r0, r0)
        patch(bm, c[2], c[3], r1, r1)
        hips = [(c[0], r0, 1), (c[1], r0, 0), (c[2], r1, 1), (c[3], r1, 0)]
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if sum(f.normal.z for f in bm.faces) < 0:
        for f in bm.faces:
            f.normal_flip()
    me = bpy.data.meshes.new(name + "_roof")
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    roof = obj(name + "_roof", me, lacquer)
    sol = roof.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.3
    sol.offset = -1
    # 자개빛 마루: 용마루는 양 끝이 살짝 치켜 오르고, 내림마루는 지붕 곡선을 따라 귀까지 내려온다
    rd = (r1 - r0).normalized() if (r1 - r0).length > 1e-6 else Vector((1, 0, 0))
    ridge = [r0 - rd * 0.7 + Vector((0, 0, 0.28)), r0 - rd * 0.3 + Vector((0, 0, 0.07)), r0, r1, r1 + rd * 0.3 + Vector((0, 0, 0.07)), r1 + rd * 0.7 + Vector((0, 0, 0.28))]
    tube(name + "_ridge", [p + Vector((0, 0, 0.12)) for p in ridge], 0.2, nacre)
    for corner, top, u in hips:
        pts = [shape(corner.lerp(top, j / 20), u, j / 20) + Vector((0, 0, 0.08)) for j in range(21)]
        tube(name + "_hip", pts, 0.13, nacre)
    return roof


def rect(px0, px1, py0, py1):
    x0, y1 = P(px0, py0)
    x1, y0 = P(px1, py1)
    return x0, x1, y0, y1


# 앞줄은 낮게, 뒷줄은 높고 넓게, 일월오봉단관이 주봉
B = {}
B["obong"] = rect(390, 610, 40, 180)
for side, (a, b) in {"works": (110, 390), "ip": (610, 890)}.items():
    B[side + "_back"] = rect(a, b, 190, 300)
    B[side + "_front"] = rect(a, b, 300, 410)
B["lobby"] = rect(430, 570, 420, 530)
B["artist"] = rect(300, 420, 420, 530)
B["lounge"] = rect(580, 700, 420, 530)
hall("Obong", *B["obong"], wall_h=9.0, rise=7.5, over=2.4, ridge_extra=0.22)   # 주봉은 팔작처럼 용마루를 길게
hall("WorksBack", *B["works_back"], wall_h=6.8, rise=5.2, over=1.8)
hall("IPBack", *B["ip_back"], wall_h=6.8, rise=5.2, over=1.8)
hall("WorksFront", *B["works_front"], wall_h=5.0, rise=3.4, over=1.4)
hall("IPFront", *B["ip_front"], wall_h=5.0, rise=3.4, over=1.4)
for k in ("lobby", "artist", "lounge"):
    hall(k.title(), *B[k], wall_h=4.4, rise=2.6, over=1.3)

# 로비 정면 입구: 어두운 문간과 나무 문틀
lx0, lx1, ly0, ly1 = B["lobby"]
dark = principled("doorway", (0.02, 0.018, 0.016), 0.9)
box("LobbyDoor", -2.2, 2.2, ly0 - 0.06, ly0 + 0.3, 0.45, 3.4, dark)
box("LobbyDoorFrame", -2.5, 2.5, ly0 - 0.12, ly0 + 0.05, 3.4, 3.7, timber)

# 중정: 박석 마당
cx0, cx1, cy0, cy1 = rect(410, 590, 200, 400)
box("Court", cx0, cx1, cy0, cy1, 0, 0.08, stone)

# 들어오는 길: 남쪽 숲에서 로비까지 살짝 굽은 흙길
bm = bmesh.new()
prev = None
for i in range(41):
    t = i / 40
    y = -20 - t * 120
    x = math.sin(t * 2.4) * 7 * t
    a, b2 = bm.verts.new((x - 2.6, y, 0.03)), bm.verts.new((x + 2.6, y, 0.03))
    if prev:
        bm.faces.new((prev[0], prev[1], b2, a))
    prev = (a, b2)
me = bpy.data.meshes.new("Path")
bm.to_mesh(me)
bm.free()
obj("Path", me, gravel)
path_pts = [(math.sin((i / 40) * 2.4) * 7 * (i / 40), -20 - (i / 40) * 120) for i in range(41)]

# ───────── 땅 ─────────
bpy.ops.mesh.primitive_plane_add(size=900, location=(0, 0, 0))
g = bpy.context.active_object
g.name = "Ground"
g.data.materials.append(ground_mat())

# ───────── 나무: 소나무와 참나무 원형을 만들고 숲에 흩는다 ─────────
proto = bpy.data.collections.new("TreeProtos")
scene.collection.children.link(proto)
proto.hide_render = False
tex = bpy.data.textures.new("leafnoise", "CLOUDS")
tex.noise_scale = 0.35
tex.noise_depth = 4
tex2 = bpy.data.textures.new("leafbig", "CLOUDS")
tex2.noise_scale = 1.4


def blob(name, loc, rad, mat, pcol, squash=1.0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=rad, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale.z = squash
    for t, s in ((tex2, 0.35), (tex, 0.22)):
        dm = ob.modifiers.new("leafy", "DISPLACE")
        dm.texture = t
        dm.strength = rad * s
        dm.texture_coords = "GLOBAL"
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(mat)
    for c in ob.users_collection:
        c.objects.unlink(ob)
    pcol.objects.link(ob)
    return ob


def trunk(name, h, r0, r1, mat, pcol, lean=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=r0, radius2=r1, depth=h, location=(lean * 0.5, 0, h / 2))
    ob = bpy.context.active_object
    ob.name = name
    ob.rotation_euler.y = lean * 0.04
    ob.data.materials.append(mat)
    for c in ob.users_collection:
        c.objects.unlink(ob)
    pcol.objects.link(ob)
    return ob


protos = []
for k in range(3):   # 키 큰 소나무: 붉은 줄기, 위쪽에만 납작한 잎 덩어리
    c = bpy.data.collections.new(f"pine{k}")
    proto.children.link(c)
    h = 19 + k * 2.5
    trunk(f"pine{k}_trunk", h, 0.32, 0.16, bark, c, lean=k - 1)
    for j in range(9 + k * 2):
        a = j * 2.4 + k
        rr = 1.2 + (j % 4) * 0.55
        blob(f"pine{k}_leaf", (math.cos(a) * rr * 1.3 + (k - 1) * 0.5, math.sin(a) * rr * 1.3, h - 4.5 + (j % 4) * 1.3), 2.6 - (j % 3) * 0.5, pine_leaf, c, 0.6)
    protos.append((c, 0.55))
for k in range(2):   # 참나무: 둥글고 밝은 잎
    c = bpy.data.collections.new(f"oak{k}")
    proto.children.link(c)
    h = 9 + k * 2
    trunk(f"oak{k}_trunk", h, 0.4, 0.22, bark_gray, c)
    for j in range(11):
        a = j * 1.9 + k
        rr = 2.4 if j else 3.4
        blob(f"oak{k}_leaf", (math.cos(a) * 2.9 * (j > 0), math.sin(a) * 2.9 * (j > 0), h - 1 + (j % 4) * 1.1), rr, oak_leaf, c, 0.85)
    protos.append((c, 0.45))
shrub = bpy.data.collections.new("shrub")
proto.children.link(shrub)
for j in range(4):
    a = j * 1.7
    blob("shrub_leaf", (math.cos(a) * 0.9 * (j > 0), math.sin(a) * 0.9 * (j > 0), 0.7), 1.1 if j else 1.4, oak_leaf, shrub, 0.7)
# 원형 자체는 장면에서 빼고, 숲의 인스턴스로만 보이게 한다
bpy.context.view_layer.layer_collection.children["TreeProtos"].exclude = True


def blocked(x, y):
    """갤러리 마당과 들어오는 길은 비워 둔다."""
    if -46 < x < 46 and -27 < y < 35:
        return True
    if -58 < x < 58 and -62 < y < -27:   # 남쪽 앞마당: 건물이 가리지 않게 넓게 비운다
        return True
    for px, py in path_pts:
        if (x - px) ** 2 + (y - py) ** 2 < 7.5 ** 2:
            return True
    return False


forest = bpy.data.collections.new("Forest")
scene.collection.children.link(forest)
placed = 0
tries = 0
while placed < 2600 and tries < 40000:
    tries += 1
    rr = 40 + random.random() ** 0.8 * 240
    a = random.random() * math.tau
    x, y = math.cos(a) * rr * 1.15, math.sin(a) * rr
    if blocked(x, y):
        continue
    # 마당 가장자리 숲은 성글게, 멀수록 빽빽하게
    edge = min(abs(abs(x) - 46), abs(y - 35), abs(y + 27))
    if edge < 12 and random.random() < 0.45:
        continue
    c, w = random.choices(protos, weights=[p[1] for p in protos])[0]
    e = bpy.data.objects.new("tree", None)
    e.instance_type = "COLLECTION"
    e.instance_collection = c
    e.location = (x, y, 0)
    e.rotation_euler.z = random.random() * math.tau
    s = 0.8 + random.random() * 0.45
    e.scale = (s, s, s * (0.9 + random.random() * 0.25))
    forest.objects.link(e)
    placed += 1
print("trees", placed)
# 숲 바닥의 키 작은 덤불: 마당 둘레와 나무 사이를 메운다
bushes = 0
while bushes < 1400:
    rr = 30 + random.random() * 200
    a = random.random() * math.tau
    x, y = math.cos(a) * rr * 1.15, math.sin(a) * rr
    on_path = any((x - px) ** 2 + (y - py) ** 2 < 5.0 ** 2 for px, py in path_pts)
    if on_path or (-46 < x < 46 and -27 < y < 35) or (blocked(x, y) and random.random() > 0.12):
        continue
    e = bpy.data.objects.new("bush", None)
    e.instance_type = "COLLECTION"
    e.instance_collection = shrub
    e.location = (x, y, 0)
    e.rotation_euler.z = random.random() * math.tau
    s = 0.6 + random.random() * 0.9
    e.scale = (s, s, s)
    forest.objects.link(e)
    bushes += 1

# ───────── 빛: 한낮의 해와 맑은 하늘 ─────────
world = bpy.data.worlds.new("Sky")
world.use_nodes = True
nt = world.node_tree
sky = nt.nodes.new("ShaderNodeTexSky")
kinds = [i.identifier for i in sky.bl_rna.properties["sky_type"].enum_items]
for k in ("MULTIPLE_SCATTERING", "NISHITA", "SINGLE_SCATTERING", "HOSEK_WILKIE"):
    if k in kinds:
        sky.sky_type = k
        break
for attr, val in (("sun_disc", False), ("sun_elevation", math.radians(62)), ("sun_rotation", math.radians(200)), ("air_density", 1.0), ("dust_density", 1.2)):
    if hasattr(sky, attr):
        setattr(sky, attr, val)
bg = nt.nodes["Background"]
bg.inputs["Strength"].default_value = 0.22
nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
scene.world = world

sun_d = bpy.data.lights.new("Sun", "SUN")
sun_d.energy = 4.2
sun_d.angle = math.radians(1.2)
sun_d.color = (1.0, 0.97, 0.92)
sun = bpy.data.objects.new("Sun", sun_d)
col.objects.link(sun)
sun.rotation_euler = (math.radians(28), 0, math.radians(200))

# ───────── 카메라: 남쪽 숲 위에서 비스듬히 ─────────
cam_d = bpy.data.cameras.new("Cam")
cam_d.lens = 32
cam = bpy.data.objects.new("Cam", cam_d)
col.objects.link(cam)
VIEW = argv[4] if len(argv) > 4 else "wide"
if VIEW == "close":   # 남동쪽 마당에서 올려다본 처마 곡선
    cam_d.lens = 30
    cam.location = (30, -40, 9)
    target = Vector((-6, 8, 9))
else:
    cam.location = (-6, -104, 46)
    target = Vector((0, 4, 3))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = cam

# ───────── 렌더 ─────────
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
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast" if "AgX - Medium High Contrast" in [i.identifier for i in scene.view_settings.bl_rna.properties["look"].enum_items] else "None"
scene.view_settings.exposure = -0.7
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + ".blend")
print("DONE", OUT)
