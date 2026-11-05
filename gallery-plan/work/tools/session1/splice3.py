import os, sys
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
s = open(p, encoding='utf8').read()
new = open(os.path.join(here, 'building.js'), encoding='utf8').read()
a = s.index("/* ───────── 바깥 재질: 자개를 흩뿌린 옻칠, 물결 띠 ───────── */"); b = s.index("/* ───────── 앞마당: 건물이 비치는 연못")
s = s[:a] + new + s[b:]
rep = [
 ("ground(44, 26, 0, 19, .01, M.stone, 1.2);\nground(6, 9, 0, 3.5 + 32.5, .008, M.stone, 1.2);", "ground(76, 36, 0, 24, .01, M.stone, 1.2);"),
 ("const R = .3, BOUND = { x0: -26, x1: 26, z0: -20, z1: 34 };", "const R = .3, BOUND = { x0: -38, x1: 38, z0: -20, z1: 41 };"),
 ("camera.position.set(0, EYE, 28);", "camera.position.set(0, EYE, 38);"),
 ("outside: { pos: [0, 26], look: [0, 6.2, 8] },", "outside: { pos: [0, 37], look: [0, 5.2, 8] },"),
 ("{ const s = lookAtYawPitch([0, 28], [0, 6.4, 8]); view.yaw = s.yaw; view.pitch = s.pitch; }", "{ const s = lookAtYawPitch([0, 38], [0, 5.4, 8]); view.yaw = s.yaw; view.pitch = s.pitch; }"),
 ("밖은 자개를 박은 검은 옻칠 상자 위로 일월오봉 병풍이 서 있고, 조개 모양 입구로 들어서면", "밖은 검은 옻칠 몸체 위로 처마 끝이 들린 진주빛 지붕 다섯 장이 봉우리처럼 겹쳐 있고, 조개 껍질 아치를 지나 들어서면"),
]
for x, y in rep:
    assert x in s, x[:60]
    s = s.replace(x, y)
for gone in ['T.waves', 'nacreScreen', 'waveBand', 'sunM']:
    assert gone not in s, gone
open(p, 'w', encoding='utf8').write(s)
print('ok')
