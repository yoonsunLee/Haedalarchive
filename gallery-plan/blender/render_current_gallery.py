"""지금 갤러리(three.js에서 glTF로 뽑은 장면)를 Blender Cycles로 다시 렌더한다.

blender -b --python render_current_gallery.py -- <gallery.glb> <출력 png> [samples] [가로] [세로] [시점]
시점: probe(크기만 출력) | aerial | court | obong | front | far | mid | near
환경 변수 FACADE="어두운색,밝은색"(16진수)을 주면 바깥 옻칠 벽을 그 두 색의 나무결 투명칠로 바꿔 렌더한다(외관 색 샘플용)
환경 변수 SUN="고도,방위"(도)로 해 방향을 바꾼다
"""
import math
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT = argv[0], argv[1]
SAMPLES = int(argv[2]) if len(argv) > 2 else 64
RES = (int(argv[3]) if len(argv) > 3 else 1280, int(argv[4]) if len(argv) > 4 else 720)
VIEW = argv[5] if len(argv) > 5 else "aerial"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=GLB)
# three.js 조명은 버리고 Blender의 해와 하늘로 다시 비춘다
for o in list(scene.objects):
    if o.type == "LIGHT" or o.type == "CAMERA":
        bpy.data.objects.remove(o)

# three.js의 하늘 구(장면 전체를 감싸는 큰 공)는 햇빛을 막으니 뺀다
for o in list(scene.objects):
    if o.type == "MESH" and min(o.dimensions) > 100:
        print("REMOVE", o.name, tuple(round(v) for v in o.dimensions))
        bpy.data.objects.remove(o)

# 나무 잎: three.js에서는 그루마다 색(instanceColor)을 줬는데 glTF로 오며 빠져 하얘졌다.
# 가장 많이 쓰인 흰 재질을 갤러리의 초록 다섯 가지로 되돌린다
import collections
uses = collections.Counter(m.name for o in scene.objects if o.type == "MESH" for m in o.data.materials if m)
GREENS = [(0x1f, 0x3a, 0x24), (0x24, 0x42, 0x2a), (0x2b, 0x4a, 0x2c), (0x1b, 0x33, 0x20), (0x31, 0x53, 0x2f)]
for name, _ in uses.most_common(3):
    m = bpy.data.materials[name]
    b = m.node_tree.nodes.get("Principled BSDF")
    if b and min(b.inputs["Base Color"].default_value[:3]) > 0.95 and not b.inputs["Base Color"].is_linked:
        nt_ = m.node_tree
        info = nt_.nodes.new("ShaderNodeObjectInfo")
        ramp = nt_.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        els = ramp.color_ramp.elements
        for i, (r_, g_, b_) in enumerate(GREENS):
            el = els[i] if i < len(els) else els.new(i / len(GREENS))
            el.position = i / len(GREENS)
            el.color = ((r_ / 255) ** 2.2, (g_ / 255) ** 2.2, (b_ / 255) ** 2.2, 1)
        nt_.links.new(info.outputs["Random"], ramp.inputs["Fac"])
        nt_.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        print("GREENED", name)
        break

mn, mx = Vector((1e9,) * 3), Vector((-1e9,) * 3)
for o in scene.objects:
    if o.type != "MESH" or max(o.dimensions) > 150:
        continue
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        mn = Vector(map(min, mn, w))
        mx = Vector(map(max, mx, w))
print("BBOX", tuple(round(v, 1) for v in mn), tuple(round(v, 1) for v in mx), "objects", len(scene.objects))
if VIEW == "probe":
    sys.exit(0)

import os  # noqa: E402
if os.environ.get("FACADE"):
    # 바깥 옻칠 벽(무늬 이미지 + 투명 코팅을 쓴 재질)을 나무결이 비치는 투명칠로 바꾼다
    def lin(h):
        return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)) + (1,)
    dark, light = os.environ["FACADE"].split(",")
    for m in bpy.data.materials:
        b = m.node_tree.nodes.get("Principled BSDF") if m.node_tree else None
        if not b or not b.inputs["Base Color"].is_linked:
            continue
        n = b.inputs["Base Color"].links[0].from_node
        cw = b.inputs.get("Coat Weight")
        if n.type != "TEX_IMAGE" or not cw or cw.default_value < .9:
            continue
        nt_ = m.node_tree
        tc = nt_.nodes.new("ShaderNodeTexCoord")
        mp = nt_.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (14, 14, .35)   # 세로로 긴 결: 가로로는 촘촘, 위아래로는 길게
        nt_.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        wave = nt_.nodes.new("ShaderNodeTexNoise")
        wave.inputs["Detail"].default_value = 6
        wave.inputs["Roughness"].default_value = .55
        nt_.links.new(mp.outputs["Vector"], wave.inputs["Vector"])
        ramp = nt_.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = lin(dark)
        ramp.color_ramp.elements[1].color = lin(light)
        nt_.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
        nt_.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = .32
        print("FACADE", m.name, dark, light)

STONES = {   # 종류: (어두운색, 밝은색, 거칠기)
    "concrete": ("6e6a63", "9d978c", .85),   # 송판 노출 콘크리트, 가로 송판 15cm
    "granite": ("8c877f", "bab4a8", .75),    # 화강석 버너구이 판 900×450, 막힌줄눈
    "basalt": ("3b3c3e", "5e5f61", .8),      # 현무암 잔다듬 판 600×300, 통줄눈
    "earth": ("8a6e55", "a88b6e", .9),       # 판축 흙다짐, 5~15cm 층
}
if os.environ.get("STONE"):
    # 바깥 옻칠 벽을 돌·콘크리트·흙으로 바꾼다. 벽은 축에 나란하니 가로는 x+y, 세로는 z로 편다
    kind = os.environ["STONE"]
    dark, light, rough = STONES[kind]
    def lin(h):
        return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)) + (1,)
    for m in bpy.data.materials:
        b = m.node_tree.nodes.get("Principled BSDF") if m.node_tree else None
        if not b or not b.inputs["Base Color"].is_linked:
            continue
        n0 = b.inputs["Base Color"].links[0].from_node
        cw = b.inputs.get("Coat Weight")
        if n0.type != "TEX_IMAGE" or not cw or cw.default_value < .9:
            continue
        nt_ = m.node_tree
        N, L = nt_.nodes.new, nt_.links.new

        def math_(op, a, v=None):
            nd = N("ShaderNodeMath"); nd.operation = op
            if isinstance(a, float): nd.inputs[0].default_value = a
            else: L(a, nd.inputs[0])
            if v is not None:
                if isinstance(v, float): nd.inputs[1].default_value = v
                else: L(v, nd.inputs[1])
            return nd.outputs[0]

        def noise(vec, scale, detail=4, rough_=.5):
            nd = N("ShaderNodeTexNoise")
            nd.inputs["Scale"].default_value = scale
            nd.inputs["Detail"].default_value = detail
            nd.inputs["Roughness"].default_value = rough_
            L(vec, nd.inputs["Vector"])
            return nd.outputs["Fac"]

        def rnd(v):   # 정수 칸마다 0~1 난수
            nd = N("ShaderNodeTexWhiteNoise"); nd.noise_dimensions = "1D"
            L(v, nd.inputs["W"])
            return nd.outputs["Value"]

        def vec2(u_, v_, sx=1., sy=1.):
            c = N("ShaderNodeCombineXYZ")
            L(math_("MULTIPLY", u_, sx), c.inputs[0]); L(math_("MULTIPLY", v_, sy), c.inputs[1])
            return c.outputs[0]

        def brick(vec, w, h, mortar, offset):
            nd = N("ShaderNodeTexBrick")
            nd.offset = offset
            nd.inputs["Scale"].default_value = 1
            nd.inputs["Brick Width"].default_value = w
            nd.inputs["Row Height"].default_value = h
            nd.inputs["Mortar Size"].default_value = mortar
            nd.inputs["Mortar Smooth"].default_value = .3
            nd.inputs["Color1"].default_value = (1, 1, 1, 1)
            nd.inputs["Color2"].default_value = (0, 0, 0, 1)
            nd.inputs["Bias"].default_value = 0
            L(vec, nd.inputs["Vector"])
            return nd.outputs["Color"], nd.outputs["Fac"]   # Color: 판마다 다른 명도, Fac: 줄눈이면 1

        tc = N("ShaderNodeTexCoord")
        sep = N("ShaderNodeSeparateXYZ"); L(tc.outputs["Object"], sep.inputs[0])
        u = math_("ADD", sep.outputs[0], sep.outputs[1]); v = sep.outputs[2]
        blot = noise(tc.outputs["Object"], .35, 3)   # 1~3m 큰 얼룩: 휴대폰에서도 남는 변화
        if kind == "concrete":
            board = math_("FLOOR", math_("DIVIDE", v, .15))
            grain = noise(vec2(u, v, 1.5, 30.), 4., 8, .6)
            fac = math_("ADD", math_("ADD", math_("MULTIPLY", rnd(board), .15), math_("MULTIPLY", grain, .4)), .1)
            _, joint = brick(vec2(u, v), 1.8, .9, .006, .0)
            height = grain
        elif kind == "earth":
            wob = math_("ADD", v, math_("MULTIPLY", noise(vec2(u, v, .6, .6), 1.5, 2), .08))
            layer = math_("FLOOR", math_("DIVIDE", wob, .09))
            grain = noise(tc.outputs["Object"], 25., 6, .6)
            fac = math_("ADD", math_("MULTIPLY", rnd(layer), .55), math_("MULTIPLY", grain, .25))
            joint = None
            height = math_("ADD", grain, math_("MULTIPLY", rnd(layer), .5))
        else:
            w, h, off = (.9, .45, .5) if kind == "granite" else (.6, .3, .0)
            col, joint = brick(vec2(u, v), w, h, .005 if kind == "granite" else .004, off)
            vor = N("ShaderNodeTexVoronoi"); vor.inputs["Scale"].default_value = 300 if kind == "granite" else 220
            L(tc.outputs["Object"], vor.inputs["Vector"])
            dots = math_("LESS_THAN", vor.outputs["Distance"], .12 if kind == "granite" else .08)
            panel = N("ShaderNodeRGBToBW"); L(col, panel.inputs[0])
            fac = math_("SUBTRACT", math_("ADD", math_("MULTIPLY", panel.outputs[0], .3),
                                         math_("MULTIPLY", noise(tc.outputs["Object"], 150., 2), .4)),
                        math_("MULTIPLY", dots, .35))
            height = math_("SUBTRACT", 1., dots)
        fac = math_("ADD", fac, math_("MULTIPLY", math_("SUBTRACT", blot, .5), .5))
        if joint is not None:
            fac = math_("SUBTRACT", fac, math_("MULTIPLY", joint, .6))
            height = math_("SUBTRACT", height, math_("MULTIPLY", joint, 2.))
        ramp = N("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = .15; ramp.color_ramp.elements[0].color = lin(dark)
        ramp.color_ramp.elements[1].position = .85; ramp.color_ramp.elements[1].color = lin(light)
        L(fac, ramp.inputs["Fac"])
        L(ramp.outputs["Color"], b.inputs["Base Color"])
        bump = N("ShaderNodeBump"); bump.inputs["Strength"].default_value = .25
        bump.inputs["Distance"].default_value = .005
        L(height, bump.inputs["Height"]); L(bump.outputs["Normal"], b.inputs["Normal"])
        b.inputs["Roughness"].default_value = rough
        cw.default_value = 0
        print("STONE", m.name, kind)

world = bpy.data.worlds.new("Sky")
world.use_nodes = True
nt = world.node_tree
bg = nt.nodes["Background"]
bg.inputs["Color"].default_value = (0.6, 0.74, 0.92, 1)
bg.inputs["Strength"].default_value = 1.0
scene.world = world
sd = bpy.data.lights.new("Sun", "SUN")
sd.energy = 3.2
sd.angle = math.radians(4)
sd.color = (1.0, 0.95, 0.88)
sun = bpy.data.objects.new("Sun", sd)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(38), 0, math.radians(205))
if os.environ.get("SUN"):   # SUN="고도,방위"(도). 방위 0이면 해가 남쪽(앞마당 쪽)에서 비춘다
    el, az = map(float, os.environ["SUN"].split(","))
    sun.rotation_euler = (math.radians(90 - el), 0, math.radians(az))

VIEWS = {   # Blender 좌표(z 위). glTF의 three.js z는 Blender에서 -y가 된다
    "aerial": ((-10, -95, 70), (0, -5, 0), 40),
    "court": ((0, 8, 2.2), (0, -12, 4.5), 22),   # 중정에서 남쪽 로비를 바라본다
    "obong": ((0, 2, 2.0), (0, 22, 4), 22),
    "front": ((0, -42, 2.4), (0, -19, 4.5), 26),   # 앞마당에서 로비 입구를 정면으로
    # 걸어 들어가는 눈높이(1.6m)에서 벽까지 약 30m, 10m, 2m
    "far": ((0, -50, 1.6), (0, -19, 4.2), 26),
    "mid": ((-3, -30, 1.6), (-2, -19, 3.2), 24),
    "near": ((-8, -22, 1.6), (-10, -19, 2.2), 28),
}
cd = bpy.data.cameras.new("Cam")
cam = bpy.data.objects.new("Cam", cd)
scene.collection.objects.link(cam)
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
scene.view_settings.view_transform = "AgX"
scene.render.image_settings.file_format = "PNG"
# 시점을 쉼표로 여러 개 주면 장면을 한 번만 불러 차례로 찍는다. 출력 경로의 {v}가 시점 이름으로 바뀐다
for v in VIEW.split(","):
    loc, tgt, lens = VIEWS[v]
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = OUT.replace("{v}", v)
    bpy.ops.render.render(write_still=True)
    print("DONE", scene.render.filepath)
