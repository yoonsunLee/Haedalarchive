"""build_exterior_forest.py에 해달 작가의 표정을 되살린다.
지붕 겹침 정리, 월대 위 중층 일월오봉단관(해와 달), 자개 모자이크 띠, 작가님 색, 연못의 얼빵해달, 조금 더 둥근 지붕."""
import sys

p = sys.argv[1]
s = open(p, encoding="utf8").read()


def rep(a, b):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b, 1)


# ───── 지붕: 조금 더 둥글고 통통하게, 이웃과 맞닿는 귀는 내림마루를 뺄 수 있게 ─────
rep("NU=32, NV=14, gable=True):", "NU=32, NV=14, gable=True, skip=()):")
rep("    sol.thickness = 0.42\n", "    sol.thickness = 0.62\n")
rep("    bv.width = 0.12\n", "    bv.width = 0.22\n")
rep('    tube(name + "_ridge", ridge, 0.24, nacre)\n    for corner, top, u, s in hips:',
    '    tube(name + "_ridge", ridge, 0.32, nacre)\n    for idx, (corner, top, u, s) in enumerate(hips):\n        if idx in skip:\n            continue')
rep('        tube(name + "_hip", pts, 0.15, nacre)', '        tube(name + "_hip", pts, 0.2, nacre)')
rep("radius=0.22, location=pts[0])", "radius=0.32, location=pts[0])")
rep('b_ + Vector((0, 0, 0.12))], 0.15, nacre)', 'b_ + Vector((0, 0, 0.12))], 0.2, nacre)')
rep('top + Vector((0, 0, 0.18))], 0.24, nacre)', 'top + Vector((0, 0, 0.18))], 0.32, nacre)')

# ───── 벽: 창 아래로 검은 옻칠에 자개 조각을 박은 띠 ─────
rep('    soft_box(name + "_wall", x0, x1, y0, y1, 0.5, wall_h, plaster, 0.45)',
    '    soft_box(name + "_wall", x0, x1, y0, y1, 0.5, wall_h, plaster, 0.45)\n'
    '    soft_box(name + "_inlay", x0 - 0.07, x1 + 0.07, y0 - 0.07, y1 + 0.07, 0.62, 1.32, mosaic, 0.05)   # 나전칠기 띠')
rep('glass, 0.06)\n            soft_box(name + "_frame", x - 1.12, x + 1.12, y0 - 0.16, y0 - 0.1, 0.88, 0.95, steel, 0.0)',
    'glass, 0.06)\n            soft_box(name + "_frame", x - 1.12, x + 1.12, y0 - 0.16, y0 - 0.1, 1.38, 1.45, steel, 0.0)')
rep('y0 - 0.12, y0 + 0.05, 0.95, wall_h - 0.55, glass, 0.06)', 'y0 - 0.12, y0 + 0.05, 1.45, wall_h - 0.55, glass, 0.06)')
# 로비 유리 틀은 작가님 그림의 파랑
rep('y0 - 0.2, y0 - 0.1, 0.6, wall_h - 0.35, steel, 0.0)', 'y0 - 0.2, y0 - 0.1, 0.6, wall_h - 0.35, cobalt, 0.0)')
rep('soft_box(name + "_mullh", gx0, gx1, y0 - 0.2, y0 - 0.1, 2.9, 2.98, steel, 0.0)', 'soft_box(name + "_mullh", gx0, gx1, y0 - 0.2, y0 - 0.1, 2.9, 2.98, cobalt, 0.0)')
rep('soft_box(name + "_glass", gx0, gx1, y0 - 0.14, y0 + 0.05, 0.6, wall_h - 0.35, glass, 0.06)',
    'soft_box(name + "_glass", gx0, gx1, y0 - 0.14, y0 + 0.05, 1.32, wall_h - 0.35, glass, 0.06)')

# 재질: 자개 모자이크, 코발트, 해와 달, 털, 물
rep('steel = principled("steel"', '''cobalt = principled("cobalt", (0.05, 0.16, 0.62), 0.3, **{"Coat Weight": 0.5})


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
steel = principled("steel"''')

# ───── 이웃 방 지붕: 맞닿는 쪽 처마는 짧게, 그쪽 내림마루는 빼서 X자로 엇갈리지 않게 ─────
rep('''    o = 2.2 if wh > 5 else 1.9
    lifted(level((y0 + y1) / 2), curved_roof, f"Room{k}", x0 - o, x1 + o, y0 - o, y1 + o, wh - 0.1, rs, ridge_extra=0.04)''',
    '''    o = 2.2 if wh > 5 else 1.9
    shared = -25.0 if x0 < 0 else 25.0
    ow = 0.3 if abs(x0 - shared) < 0.1 else (1.0 if abs(x0 - 11) < 0.1 else o)
    oe = 0.3 if abs(x1 - shared) < 0.1 else (1.0 if abs(x1 + 11) < 0.1 else o)
    skip = ({0, 3} if ow < 0.6 else set()) | ({1, 2} if oe < 0.6 else set())
    lifted(level((y0 + y1) / 2), curved_roof, f"Room{k}", x0 - ow, x1 + oe, y0 - o, y1 + o, wh - 0.1, rs, ridge_extra=0.04, skip=skip)''')
rep('''hall("Lobby", *B["lobby"], wall_h=4.0, rise=2.6, over=1.9, door_south=True)
hall("Artist", *B["artist"], wall_h=3.8, rise=2.4, over=1.8)
hall("Lounge", *B["lounge"], wall_h=3.8, rise=2.4, over=1.8)''', '''# 로비 줄 세 채도 서로 처마가 파고들지 않게: 맞닿는 쪽은 0.45 m만
hall("Lobby", *B["lobby"], wall_h=4.0, rise=0, door_south=True, roof=False)
hall("Artist", *B["artist"], wall_h=3.8, rise=0, roof=False)
hall("Lounge", *B["lounge"], wall_h=3.8, rise=0, roof=False)
for nm, key, wh, rs, ow, oe in (("Lobby", "lobby", 4.0, 2.8, 0.45, 0.45), ("Artist", "artist", 3.8, 2.5, 1.8, 0.45), ("Lounge", "lounge", 3.8, 2.5, 0.45, 1.8)):
    x0, x1, y0, y1 = B[key]
    curved_roof(nm, x0 - ow, x1 + oe, y0 - 1.9, y1 + 0.7, wh - 0.1, rs, ridge_extra=0.04)''')

# ───── 일월오봉단관: 월대 위 중층 건물로 다시 짓는다(아래에서 재질이 생긴 뒤에) ─────
rep('lifted(LEVELS[3], hall, "Obong", *B["obong"], wall_h=8.0, rise=10.5, over=3.0, ridge_extra=0.06)\n', '')
rep('stair(0, 18.0, EDGES[1], LEVELS[1], LEVELS[2])     # 중정 안에서 뒷단으로', '''stair(0, 18.0, EDGES[1], LEVELS[1], LEVELS[2])     # 중정 안에서 뒷단으로


def obong_hall():
    """주봉: 두 단 월대 위에 아래층과 위층, 지붕 두 겹(중층). 위층 앞면에 달(왼쪽)과 해(오른쪽)."""
    x0, x1, y0, y1 = B["obong"]
    soft_box("Wolde1", x0 - 4.2, x1 + 4.2, y0 - 3.8, y1 + 2.6, 0, 0.7, granite, 0.06)
    soft_box("Wolde2", x0 - 2.6, x1 + 2.6, y0 - 2.2, y1 + 1.4, 0.7, 1.4, marble, 0.05)
    stair(0, 7.0, y0 - 3.8, 0.0, 0.7)
    stair(0, 5.0, y0 - 2.2, 0.7, 1.4)
    lifted(1.4, hall, "Obong", x0, x1, y0, y1, wall_h=7.0, rise=0, door_south=True, roof=False)
    curved_roof("ObongLow", x0 - 3.2, x1 + 3.2, y0 - 3.2, y1 + 3.2, 1.4 + 6.9, 3.2, gable=False)
    ux0, ux1, uy0, uy1 = x0 + 2.6, x1 - 2.6, y0 + 2.2, y1 - 2.2
    zu0, zu1 = 1.4 + 7.0, 1.4 + 12.2
    soft_box("ObongUpper", ux0, ux1, uy0, uy1, zu0, zu1, plaster, 0.3)
    soft_box("ObongUpperInlay", ux0 - 0.07, ux1 + 0.07, uy0 - 0.07, uy1 + 0.07, zu1 - 0.9, zu1 - 0.3, mosaic, 0.05)
    for x in (ux0, ux1):
        for y in (uy0, uy1):
            cyl("ObongUpperPost", x, y, zu0, zu1, 0.4, timber)
    # 일월오봉도처럼 달은 왼쪽(서), 해는 오른쪽(동)
    for x, face in ((-4.6, nacre), (4.6, sun_red)):
        zc = 11.6
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=1.6, depth=0.12, location=(x, uy0 - 0.08, zc), rotation=(math.pi / 2, 0, 0))
        ring = bpy.context.active_object; ring.data.materials.append(mosaic)
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=1.3, depth=0.16, location=(x, uy0 - 0.14, zc), rotation=(math.pi / 2, 0, 0))
        d_ = bpy.context.active_object; d_.data.materials.append(face)
        bv_ = d_.modifiers.new("soft", "BEVEL"); bv_.width = 0.05; bv_.segments = 3
        bpy.ops.object.shade_smooth()
    curved_roof("ObongTop", ux0 - 2.9, ux1 + 2.9, uy0 - 2.9, uy1 + 2.9, zu1 - 0.1, 7.2, ridge_extra=0.06)


lifted(LEVELS[3], obong_hall)

# ───── 앞마당 연못과 얼빵해달: 배를 내밀고 조개를 안은 채 둥둥 ─────
soft_box("PoolRim", -11.6, 11.6, -41.6, -28.4, 0.1, 0.34, marble, 0.06)
soft_box("PoolWater", -11.0, 11.0, -41.0, -29.0, 0.1, 0.36, water_m, 0.02)


def blob_(loc, r, mat, sc=(1, 1, 1), seg=40):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = sc
    o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o


OX, OY = 0.0, -35.0       # 머리는 북쪽, 발은 남쪽: 고개를 들어 길 쪽(남)을 바라본다
blob_((OX, OY - 0.3, 0.55), 1.0, fur, (1.85, 3.0, 1.0))                      # 몸
blob_((OX, OY + 2.7, 1.9), 1.95, fur, (1.0, 0.95, 0.92))                     # 머리
for sx in (-1, 1):
    blob_((OX + sx * 1.4, OY + 3.0, 3.45), 0.42, fur)                        # 귀
    blob_((OX + sx * 0.72, OY + 1.0, 2.35), 0.24, otter_blue, (0.85, 0.5, 1.35))   # 눈
    blob_((OX + sx * 0.6, OY + 0.86, 2.5), 0.07, fur)                        # 눈 반짝
    blob_((OX + sx * 1.2, OY + 1.12, 1.65), 0.34, cheek, (1.0, 0.45, 0.75))  # 볼
    blob_((OX + sx * 0.85, OY - 3.0, 0.95), 0.6, fur)                        # 발
    blob_((OX + sx * 0.7, OY + 0.2, 1.45), 0.48, fur, (1.0, 1.6, 0.8))       # 조개를 안은 앞발
bpy.ops.mesh.primitive_cube_add(size=0.62, location=(OX, OY + 0.82, 1.88), rotation=(0, math.radians(45), 0))
nose = bpy.context.active_object; nose.scale = (1.0, 0.6, 0.8); nose.data.materials.append(otter_blue)
bvn = nose.modifiers.new("soft", "BEVEL"); bvn.width = 0.12; bvn.segments = 4
blob_((OX, OY - 0.3, 1.5), 0.72, nacre, (1.15, 0.9, 0.42))                   # 배 위의 자개 조개
for rr in (4.2, 5.6):
    bpy.ops.mesh.primitive_torus_add(major_radius=rr, minor_radius=0.05, location=(OX, OY, 0.37))
    rg = bpy.context.active_object; rg.scale.y = 1.25; rg.data.materials.append(plaster)''')

# 볼라드 불빛은 작가님 그림의 노랑
rep('gb.inputs["Emission Color"].default_value = (1.0, 0.85, 0.6, 1)', 'gb.inputs["Emission Color"].default_value = (1.0, 0.78, 0.18, 1)')
open(p, "w", encoding="utf8").write(s)
print("patched")
