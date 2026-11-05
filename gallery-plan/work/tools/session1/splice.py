import os, sys
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
s = open(p, encoding='utf8').read()
new = open(os.path.join(here, 'exterior.js'), encoding='utf8').read()
a = s.index("// 수반: 낮은 콘크리트 테두리"); b = s.index("/* ───────── 안: 한옥 천장")
s = s[:a] + new + "\n" + s[b:]
rep = [
 ("import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';",
  "import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';\nimport { Reflector } from 'three/addons/objects/Reflector.js';"),
 ("// 수반과 의자도 막는다\nsolid(5, 14.5, 11.6, 14.8); solid(-14.5, -10.5, 13, 13.6); solid(-8.5, -4.5, 16.5, 17.1);\n", ""),
 ("if (o.isMesh && o.material === M.concrete) blockers.push(o);",
  "if (o.isMesh && (o.material === M.concrete || o.material === M.facade)) blockers.push(o);"),
 ("outside: { pos: [0, 24], look: [0, 3, 8] },", "outside: { pos: [0, 26], look: [0, 6.2, 8] },"),
 ("camera.position.set(0, EYE, 27);", "camera.position.set(0, EYE, 28);"),
 ("{ const s = lookAtYawPitch([0, 27], [0, 3.2, 8]); view.yaw = s.yaw; view.pitch = s.pitch; }",
  "{ const s = lookAtYawPitch([0, 28], [0, 6.4, 8]); view.yaw = s.yaw; view.pitch = s.pitch; }"),
 ("밖은 하얀 콘크리트 상자, 안에 들어서면 서까래가 드러난 한옥 천장이 펼쳐져요.",
  "밖은 자개를 박은 검은 옻칠 상자 위로 일월오봉 병풍이 서 있고, 조개 모양 입구로 들어서면 서까래가 드러난 한옥 천장이 펼쳐져요."),
 ("  if (!reduceMotion) for (const k of keyrings)",
  "  if (!reduceMotion) {\n    const pos = banner.mesh.geometry.attributes.position, b0 = banner.base;\n    for (let i = 0; i < pos.count; i++) { const y = b0[i * 3 + 1], drop = (banner.h / 2 - y) / banner.h; pos.setZ(i, Math.sin(y * 1.6 + time * 1.4) * .05 * drop + Math.sin(time * .7) * .03 * drop); }\n    pos.needsUpdate = true; banner.mesh.geometry.computeVertexNormals();\n  }\n  if (!reduceMotion) for (const k of keyrings)"),
 ("WORKS.forEach(hangWork);", "WORKS.forEach(hangWork);\npickable(banner.mesh, banner.info);"),
]
for x, y in rep:
    assert x in s, x[:60]
    s = s.replace(x, y)
assert s.count("const colliders = [];") == 1
open(p, 'w', encoding='utf8').write(s)
print('ok')
