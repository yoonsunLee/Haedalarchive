"""build_exterior_toy.py에서 유럽 숲속 · 대리석 광장 버전을 만든다."""
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf8").read()


def cut(text, a, b, new):
    i = text.index(a)
    j = text.index(b, i)
    return text[:i] + new + text[j:]


s = s.replace('''"""숲속 오봉 능선 갤러리, 장난감 디오라마 버전.

blender -b --python build_exterior_toy.py -- <출력 png> [samples] [가로] [세로] [wide|close]''', '''"""유럽 어느 숲속에 있는 듯한 오봉 능선 갤러리: 건물은 한국적, 둘레는 현대적인 대리석 광장.

blender -b --python build_exterior_forest.py -- <출력 png> [samples] [가로] [세로] [front|wide|close]

build_exterior_toy.py에서 갈라져 나왔다. 다섯 봉우리 지붕과 둥근 몸체는 그대로,
잔디 대신 대리석 광장과 등받이 없는 나무 벤치, 큰 유리창과 낮은 볼라드 조명, 전나무·너도밤나무 숲과 옅은 안개.''')

# 창: 동그란 창 대신 큰 유리. 로비는 앞면 전체를 유리로
s = cut(s, "    # 남쪽 면에 동그란 창", "    curved_roof(name,", '''    # 남쪽 면: 가는 검은 틀의 큰 유리창. 로비는 앞면 전체가 유리
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
''')

s = s.replace('glass = principled("window", (0.13, 0.18, 0.26), 0.3)',
              'glass = principled("window", (0.04, 0.055, 0.07), 0.04, **{"Specular IOR Level": 0.9, "Coat Weight": 0.6, "Coat Roughness": 0.02})\n'
              'steel = principled("steel", (0.025, 0.025, 0.027), 0.35, **{"Metallic": 0.8})')

# 광장·길·벤치·볼라드
s = cut(s, "# 길: 숲에서 로비까지", "# ───────── 나무:", '''# 대리석 광장: 흰 바탕에 회색 결, 1.6 × 0.8 m 판석 줄눈
def marble_mat():
    m = bpy.data.materials.new("marble")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.2
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 0.05
    wave.inputs["Distortion"].default_value = 11
    wave.inputs["Detail"].default_value = 6
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.66, 0.66, 0.67, 1)
    ramp.color_ramp.elements[1].position = 0.18
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
soft_box("Plaza", PLAZA[0], PLAZA[1], PLAZA[2], PLAZA[3], 0, 0.15, marble, 0.05)
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
    soft_box("bench_top", x - w / 2, x + w / 2, y - d / 2, y + d / 2, 0.52, 0.64, wood, 0.05)
    for k in (-1, 1):
        if along_x:
            soft_box("bench_leg", x + k * (L / 2 - 0.25) - 0.05, x + k * (L / 2 - 0.25) + 0.05, y - 0.24, y + 0.24, 0.15, 0.52, wood, 0.02)
        else:
            soft_box("bench_leg", x - 0.24, x + 0.24, y + k * (L / 2 - 0.25) - 0.05, y + k * (L / 2 - 0.25) + 0.05, 0.15, 0.52, wood, 0.02)


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
bpy.ops.mesh.primitive_plane_add(size=900)
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

''')

# 숲: 전나무와 너도밤나무
s = cut(s, "# ───────── 나무:", 'bpy.context.view_layer.layer_collection.children["TreeProtos"].exclude = True', '''# ───────── 나무: 키 큰 전나무와 너도밤나무, 매끈하고 둥근 모양은 그대로 ─────────
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
''')

# 숲 배치: 광장을 비우고, 원형 무게를 반영
s = s.replace('''    if -48 < x < 48 and -28 < y < 36:
        return True
    if -60 < x < 60 and -64 < y < -28:
        return True''', '''    if PLAZA[0] - 5 < x < PLAZA[1] + 5 and PLAZA[2] - 5 < y < PLAZA[3] + 5:
        return True''')
s = s.replace("e.instance_collection = random.choice(protos)", "e.instance_collection = random.choices([p[0] for p in protos], weights=[p[1] for p in protos])[0]")
s = s.replace("while placed < 1300 and tries < 40000:", "while placed < 1900 and tries < 60000:")
s = s.replace("(x - sx) ** 2 + (y - sy) ** 2 < 5.2 ** 2", "(x - sx) ** 2 + (y - sy) ** 2 < 4.4 ** 2")

# 빛: 유럽 숲의 맑고 서늘한 한낮, 옅은 안개
s = s.replace('bg.inputs["Color"].default_value = (0.52, 0.74, 1.0, 1)', 'bg.inputs["Color"].default_value = (0.6, 0.74, 0.92, 1)')
s = s.replace('seen.inputs["Color"].default_value = (0.42, 0.68, 1.0, 1)', 'seen.inputs["Color"].default_value = (0.55, 0.72, 0.95, 1)')
s = s.replace('sd.angle = math.radians(9)', 'sd.angle = math.radians(5)')
s = s.replace('# ───────── 카메라:', '''# 멀수록 옅어지는 숲 안개
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

# ───────── 카메라:''', 1)
open(dst, "w", encoding="utf8").write(s)
print("ok")
