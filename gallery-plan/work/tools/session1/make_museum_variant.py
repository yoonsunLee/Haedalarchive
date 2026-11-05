"""build_exterior_forest.py에서 미니멀 미술관 버전(build_exterior_museum.py)을 만든다.
둘레(단, 대리석 광장, 길, 벤치, 볼라드, 숲, 빛, 카메라)는 그대로 두고 건물만 바꾼다."""
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf8").read()


def between(a, b, incl_b=False):
    i = s.index(a)
    j = s.index(b, i)
    return s[i:j + (len(b) if incl_b else 0)]


head = s[:s.index("def curved_roof(")]
plan = between("def rect(", "# 일월오봉도의 겹겹 산")
plaza = between("# 대리석 광장: 흰 바탕", "stair(0, 18.0, EDGES[1], LEVELS[1], LEVELS[2])     # 중정 안에서 뒷단으로", incl_b=True)
rest = s[s.index("court_m = marble"):]

head = head.replace(head[:head.index('"""', 3) + 3], '''"""숲속의 미니멀 미술관: 회색 대리석 덩어리와 경사진 돌판 지붕이 일월오봉도의 겹겹 봉우리를 그린다.

blender -b --python build_exterior_museum.py -- <출력 png> [samples] [가로] [세로] [front|wide]

build_exterior_forest.py에서 갈라졌다. 둘레(무이림 같은 단, 대리석 광장, 길, 등받이 없는 나무 벤치,
볼라드, 유럽 숲, 빛, 카메라)는 그대로이고 건물만 바꿨다. 해달 작가의 느낌은 한 꼬집:
남쪽 박공의 지붕 끝선을 따라 흐르는 가는 자개 선 하나뿐이다."""''')
rest = rest.replace('gb.inputs["Emission Color"].default_value = (1.0, 0.78, 0.18, 1)', 'gb.inputs["Emission Color"].default_value = (1.0, 0.88, 0.66, 1)')

building = '''


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
    ramp.color_ramp.elements[1].position = 0.12
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


gray = stone_mat("gray_marble", (0.52, 0.515, 0.5), (0.44, 0.44, 0.43), 3.0, 1.5)
roof_stone = stone_mat("roof_stone", (0.3, 0.3, 0.31), (0.25, 0.25, 0.26), 2.4, 1.2, 0.45)


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
    line(name + "_nacre", [(xa, y0 - o - 0.03, za + lift), (xc, y0 - o - 0.03, apex + lift), (xb, y0 - o - 0.03, zb_ + lift)], 0.07, nacre)
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

'''

out = head + plan + plaza + building + rest
open(dst, "w", encoding="utf8").write(out)
print("ok", len(out))
