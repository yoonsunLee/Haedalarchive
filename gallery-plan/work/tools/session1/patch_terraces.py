"""build_exterior_forest.py: 무이림처럼 단을 나눈 언덕과 팔작 결의 지붕."""
import sys

p = sys.argv[1]
s = open(p, encoding="utf8").read()


def rep(a, b, n=1):
    global s
    assert s.count(a) >= 1, a[:70]
    s = s.replace(a, b) if n == 0 else s.replace(a, b, n)


# ───── 지붕: 물매를 눕히고 처마를 깊게, 두께와 자개 선은 가늘게, 박공(합각)을 세운다 ─────
rep("def curved_roof(name, ex0, ex1, ey0, ey1, zb, rise, ridge_extra=0.0, peak=0.0, apex=0.5, NU=32, NV=14):",
    "def curved_roof(name, ex0, ex1, ey0, ey1, zb, rise, ridge_extra=0.0, peak=0.0, apex=0.5, NU=32, NV=14, gable=True):")
rep("lift, out = min(0.085 * short, 1.5), min(0.035 * short, 0.55)", "lift, out = min(0.06 * short, 1.0), min(0.03 * short, 0.45)")
rep("p.z = zb + (rise + bump(s)) * (v ** 1.25) + lift * k", "p.z = zb + (rise + bump(s)) * (v ** 1.5) + lift * k")
rep("    sol.thickness = 0.85\n", "    sol.thickness = 0.42\n")
rep("    bv.width = 0.32\n", "    bv.width = 0.12\n")
rep("    up = Vector((0, 0, 0.32))", "    up = Vector((0, 0, 0.2))")
rep('tube(name + "_ridge", [ridge[0] - rd * 0.6 + Vector((0, 0, 0.35))] + ridge + [ridge[-1] + rd * 0.6 + Vector((0, 0, 0.35))], 0.42, nacre)',
    'tube(name + "_ridge", ridge, 0.24, nacre)')
rep('        pts = [shape(corner.lerp(top, j / 10), u, j / 10, s) + Vector((0, 0, 0.22)) for j in range(11)]\n        tube(name + "_hip", pts, 0.27, nacre)',
    '        pts = [shape(corner.lerp(top, j / 10), u, j / 10, s) + Vector((0, 0, 0.14)) for j in range(11)]\n        tube(name + "_hip", pts, 0.15, nacre)')
rep("bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.42, location=pts[0])",
    "bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.22, location=pts[0])")
rep('''        ob.data.materials.append(nacre)
        bpy.ops.object.shade_smooth()


def hall(''', '''        ob.data.materials.append(nacre)
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


def hall(''')

# ───── 단: 남쪽 로비 줄에서 북쪽 일월오봉단관까지 네 단 ─────
rep('''B = {"obong": rect(390, 610, 40, 180)}''', '''# 무이림처럼 언덕을 단으로 나눈다: 로비 줄(0) → 앞줄 방과 중정(1) → 뒷줄 방(2) → 일월오봉단관(3)
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
    t = max(0.0, min(1.0, (y + 30) / 100))
    return 6.0 * t * t * (3 - 2 * t)


B = {"obong": rect(390, 610, 40, 180)}''')
rep('hall("Obong", *B["obong"], wall_h=8.0, rise=15.0, over=2.8, ridge_extra=-0.12)',
    'lifted(LEVELS[3], hall, "Obong", *B["obong"], wall_h=8.0, rise=10.5, over=3.0, ridge_extra=0.06)')
rep('''    hall(side.title() + "Back", *B[side + "_back"], wall_h=6.0, rise=0, roof=False)
    hall(side.title() + "Front", *B[side + "_front"], wall_h=4.6, rise=0, roof=False)''',
    '''    lifted(LEVELS[2], hall, side.title() + "Back", *B[side + "_back"], wall_h=6.0, rise=0, roof=False)
    lifted(LEVELS[1], hall, side.title() + "Front", *B[side + "_front"], wall_h=4.6, rise=0, roof=False)''')
rep('''    ((250, 390, 190, 300), 6.0, 9.0), ((110, 250, 190, 300), 6.0, 7.2),   # 작품관 뒷줄: N차적(안) · 우주조약(밖)
    ((250, 390, 300, 410), 4.6, 4.8), ((110, 250, 300, 410), 4.6, 5.8),   # 작품관 앞줄: 법과 권리(안) · POV(밖)
    ((610, 750, 190, 300), 6.0, 9.0), ((750, 890, 190, 300), 6.0, 7.2),   # IP 뒷줄: 해변(안) · 숲길(밖)
    ((610, 750, 300, 410), 4.6, 4.8), ((750, 890, 300, 410), 4.6, 5.8),   # IP 앞줄: 수영장(안) · 작업실(밖)''',
    '''    ((250, 390, 190, 300), 6.0, 6.6), ((110, 250, 190, 300), 6.0, 5.6),   # 작품관 뒷줄: N차적(안) · 우주조약(밖)
    ((250, 390, 300, 410), 4.6, 4.0), ((110, 250, 300, 410), 4.6, 4.6),   # 작품관 앞줄: 법과 권리(안) · POV(밖)
    ((610, 750, 190, 300), 6.0, 6.6), ((750, 890, 190, 300), 6.0, 5.6),   # IP 뒷줄: 해변(안) · 숲길(밖)
    ((610, 750, 300, 410), 4.6, 4.0), ((750, 890, 300, 410), 4.6, 4.6),   # IP 앞줄: 수영장(안) · 작업실(밖)''')
rep('''    o = 1.8 if wh > 5 else 1.5
    curved_roof(f"Room{k}", x0 - o, x1 + o, y0 - o, y1 + o, wh - 0.1, rs, ridge_extra=-0.1)''',
    '''    o = 2.2 if wh > 5 else 1.9
    lifted(level((y0 + y1) / 2), curved_roof, f"Room{k}", x0 - o, x1 + o, y0 - o, y1 + o, wh - 0.1, rs, ridge_extra=0.04)''')
rep('hall("Lobby", *B["lobby"], wall_h=4.0, rise=1.7, over=1.5, door_south=True)', 'hall("Lobby", *B["lobby"], wall_h=4.0, rise=2.6, over=1.9, door_south=True)')
rep('hall("Artist", *B["artist"], wall_h=3.8, rise=1.5, over=1.4)', 'hall("Artist", *B["artist"], wall_h=3.8, rise=2.4, over=1.8)')
rep('hall("Lounge", *B["lounge"], wall_h=3.8, rise=1.5, over=1.4)', 'hall("Lounge", *B["lounge"], wall_h=3.8, rise=2.4, over=1.8)')
rep('soft_box("Court", cx0, cx1, cy0, cy1, 0, 0.12, court_m, 0.08)\n', '')

# 대리석 광장을 단으로: 돌 옹벽 위에 대리석 판
rep('soft_box("Plaza", PLAZA[0], PLAZA[1], PLAZA[2], PLAZA[3], 0, 0.15, marble, 0.05)', '''granite = principled("granite", (0.4, 0.39, 0.37), 0.8)
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
stair(0, 18.0, EDGES[1], LEVELS[1], LEVELS[2])     # 중정 안에서 뒷단으로''')

# 벤치와 볼라드를 단 높이에
rep('''    soft_box("bench_top", x - w / 2, x + w / 2, y - d / 2, y + d / 2, 0.52, 0.64, wood, 0.05)''',
    '''    z = level(y)
    soft_box("bench_top", x - w / 2, x + w / 2, y - d / 2, y + d / 2, z + 0.52, z + 0.64, wood, 0.05)''')
rep('''            soft_box("bench_leg", x + k * (L / 2 - 0.25) - 0.05, x + k * (L / 2 - 0.25) + 0.05, y - 0.24, y + 0.24, 0.15, 0.52, wood, 0.02)''',
    '''            soft_box("bench_leg", x + k * (L / 2 - 0.25) - 0.05, x + k * (L / 2 - 0.25) + 0.05, y - 0.24, y + 0.24, z + 0.15, z + 0.52, wood, 0.02)''')
rep('''            soft_box("bench_leg", x - 0.24, x + 0.24, y + k * (L / 2 - 0.25) - 0.05, y + k * (L / 2 - 0.25) + 0.05, 0.15, 0.52, wood, 0.02)''',
    '''            soft_box("bench_leg", x - 0.24, x + 0.24, y + k * (L / 2 - 0.25) - 0.05, y + k * (L / 2 - 0.25) + 0.05, z + 0.15, z + 0.52, wood, 0.02)''')

# 숲 바닥이 북쪽으로 완만하게 오른다
rep('''bpy.ops.mesh.primitive_plane_add(size=900)
moss = bpy.data.materials.new("moss")''', '''bpy.ops.mesh.primitive_grid_add(x_subdivisions=180, y_subdivisions=180, size=900)
for vtx in bpy.context.active_object.data.vertices:
    vtx.co.z = ground_z(vtx.co.y) - 0.05
moss = bpy.data.materials.new("moss")''')
rep("    e.location = (x, y, 0)\n    e.rotation_euler.z = random.random() * math.tau\n    s = 1.35",
    "    e.location = (x, y, ground_z(y) - 0.2)\n    e.rotation_euler.z = random.random() * math.tau\n    s = 1.35")

# 정면 카메라: 단 위로 솟은 지붕이 보이게 조금 높이
rep("    cam.location = (0, -82, 4.5)\n    target = Vector((0, 0, 12))", "    cam.location = (0, -84, 5.5)\n    target = Vector((0, 4, 13))")
open(p, "w", encoding="utf8").write(s)
print("patched")
