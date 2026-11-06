
/* ───────── 하늘과 빛 ───────── */
{
  const skyTex = canvasTex(1024, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fb2cf'); gr.addColorStop(.45, '#c4d6e2'); gr.addColorStop(.62, '#e8edef'); gr.addColorStop(1, '#d9d6cf');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 40; i++) { const x = r() * w, y = h * (.08 + r() * .4), rr = 40 + r() * 120, c = g.createRadialGradient(x, y, 0, x, y, rr); c.addColorStop(0, 'rgba(255,255,255,.55)'); c.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = c; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  });
  skyTex.wrapS = THREE.RepeatWrapping;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, toneMapped: false }));
  scene.add(sky);
}
scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x6d6458, 1.25));
const sun = new THREE.DirectionalLight(0xfff0da, 1.1); sun.position.set(14, 30, 22); scene.add(sun);

/* ───────── 바닥 ───────── */
const floors = [], blockers = [], colliders = [];
const solid = (x0, x1, z0, z1) => colliders.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
function ground(x0, x1, z0, z1, y, mat, tile = 2.4, click = true) {
  const w = x1 - x0, d = z1 - z0, geo = new THREE.PlaneGeometry(w, d);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * w) / tile, (-z1 + uv.getY(i) * d) / tile);   // 무늬를 세상 좌표에 맞춘다: 이어 붙인 바닥끼리 타일 줄이 맞는다(작가님)
  const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  scene.add(m); if (click) floors.push(m); return m;
}
function ceiling(x0, x1, z0, z1, y, mat, tile = 1.8) { const m = ground(x0, x1, z0, z1, y, mat, tile, false); m.rotation.x = Math.PI / 2; blockers.push(m); return m; }

/* 평면 (북쪽이 -z, 입구가 +z)
   ③ 오봉단관 x -10.4..10.4, z -27..-9.4  · ① 작품관 x -21..-10.4, z -20..9.4  · ② IP관 x 10.4..21, z -20..9.4
   ⓪ 작가소개 x -21..-6, z 9.4..19.4 · 로비 x -6..6 · 출구 라운지 x 6..21 · 툇마루 x ±10.4, z ±9.4 · 중정 x ±8, z ±7 */
// 층고: 오봉단관 12 · 작품관·IP관 8 · 로비 8.6 · 작가소개·라운지 6 (벽 높이, 천장은 0.4~0.6 m 아래)
const HO = 12, HW = 8, HL = 8.6, HS = 6;
const ROOMS = {
  obong: { x0: -10.4, x1: 10.4, z0: -27, z1: -9.4, ceil: HO - .4, wall: HO },
  works: { x0: -21, x1: -10.4, z0: -20, z1: 9.4, ceil: HW - .6, wall: HW },
  ip: { x0: 10.4, x1: 21, z0: -20, z1: 9.4, ceil: HW - .6, wall: HW },
  artist: { x0: -21, x1: -6, z0: 9.4, z1: 19.4, ceil: HS - .5, wall: HS },
  lobby: { x0: -6, x1: 6, z0: 9.4, z1: 19.4, ceil: HL - .5, wall: HL },
  lounge: { x0: 6, x1: 21, z0: 9.4, z1: 19.4, ceil: HS - .5, wall: HS },
};
const RING = 3.4;   // 툇마루 반자 높이

ground(-24, 24, 19.4, 36, 0, M.stone, 2.4);                                   // 앞 광장
ground(-23, -21, -20, 19.4, 0, M.stone, 2.4, false); ground(21, 23, -20, 19.4, 0, M.stone, 2.4, false);
ground(-10.4, 10.4, -9.4, 9.4, .015, M.maru, 1.2);                            // 툇마루
ground(-8, 8, -7, 7, .03, M.bakseok, 3);                                      // 중정 가장자리 박석
ground(-6.6, 6.6, -5.6, 5.6, .04, M.gravel, 1.6);                             // 가운데 마사토
ground(-24, 24, -34, 19.4, -.02, new THREE.MeshStandardMaterial({ color: 0x232b22, roughness: 1 }), 4, false); // 뒤뜰 흙
ground(ROOMS.obong.x0, ROOMS.obong.x1, ROOMS.obong.z0, ROOMS.obong.z1, .02, M.dark, 2.4);
ground(ROOMS.works.x0, ROOMS.works.x1, ROOMS.works.z0, ROOMS.works.z1, .02, M.stone, 2.4);
ground(ROOMS.ip.x0, ROOMS.ip.x1, ROOMS.ip.z0, ROOMS.ip.z1, .02, new THREE.MeshStandardMaterial({ color: 0x2a3566, roughness: .9 }), 2.4);
ground(ROOMS.artist.x0, ROOMS.artist.x1, ROOMS.artist.z0, ROOMS.artist.z1, .02, M.stone, 2.4);
ground(ROOMS.lobby.x0, ROOMS.lobby.x1, ROOMS.lobby.z0, ROOMS.lobby.z1, .02, M.stone, 2.4);
ground(ROOMS.lounge.x0, ROOMS.lounge.x1, ROOMS.lounge.z0, ROOMS.lounge.z1, .02, M.stone, 2.4);
// 디딤돌: 로비 문 → 오봉단 대문 축, 작품관 ↔ IP관 가로길
{
  const st = new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: .85 });
  const r = rng(5);
  // 크기와 줄을 고르게(작가님: 삐뚤빼뚤 놓지 말 것)
  for (let z = 6.2; z > -6.6; z -= 1.15) boxMM(-.6, .6, .03, .09, z - .4, z + .4, st);
  for (const x of [-6.9, -5.6, -4.3, -3.0, -1.7, 1.7, 3.0, 4.3, 5.6, 6.9]) boxMM(x - .45, x + .45, .03, .09, -5.0, -4.0, st);
  // 축선에 깔린 가는 빛줄
  const glow = new THREE.MeshBasicMaterial({ color: 0xfff1d0 });
  boxMM(-.03, .03, .03, .05, -6.9, 6.9, glow);
}

/* ───────── 벽 ───────── */
// 벽 한 줄: 선을 따라 두께 .3, 높이 구간마다 양쪽 면 재질이 다르다(A: 선의 왼쪽/위쪽 −쪽, B: +쪽). 문은 [시작, 끝, 높이]
const WT = .3;
function wallLine(axis, fixed, a0, a1, parts, doors = []) {
  // axis 'x': z = fixed, a = x / axis 'z': x = fixed, a = z
  const cuts = [a0, a1]; for (const [d0, d1] of doors) cuts.push(d0, d1);
  const pts = [...new Set(cuts)].sort((p, q) => p - q);
  for (let i = 0; i < pts.length - 1; i++) {
    const s0 = pts[i], s1 = pts[i + 1], mid = (s0 + s1) / 2;
    const door = doors.find(d => mid > d[0] && mid < d[1]);
    for (const [y0, y1, mA, mB] of parts) {
      const yy0 = door ? Math.max(y0, door[2]) : y0; if (yy0 >= y1) continue;
      // 면 순서: +x, -x, +y, -y, +z, -z
      const mats = axis === 'x' ? [mA, mA, M.facade, mA, mB, mA] : [mB, mA, M.facade, mA, mA, mA];
      const geo = axis === 'x' ? new THREE.BoxGeometry(s1 - s0, y1 - yy0, WT) : new THREE.BoxGeometry(WT, y1 - yy0, s1 - s0);
      if (axis === 'x') scaleBoxUV(geo, s1 - s0, y1 - yy0, WT, 2.4, 2.4); else scaleBoxUV(geo, WT, y1 - yy0, s1 - s0, 2.4, 2.4);
      const m = new THREE.Mesh(geo, mats);
      if (axis === 'x') m.position.set(mid, (yy0 + y1) / 2, fixed); else m.position.set(fixed, (yy0 + y1) / 2, mid);
      scene.add(m); blockers.push(m);
    }
    if (!door) { if (axis === 'x') solid(s0, s1, fixed - WT / 2, fixed + WT / 2); else solid(fixed - WT / 2, fixed + WT / 2, s0, s1); }
  }
}
const F = M.facade, C = M.changho, O = M.earth, G = M.white, P = M.navy, A = M.plaster, L = M.plaster, U = std({ color: 0xf5f8fb, roughness: .9 });   // U: 해달 라운지 안쪽 흰 벽
// 오봉단관
wallLine('x', -27, -10.4, 10.4, [[0, HO, F, O]]);
wallLine('z', -10.4, -27, -20, [[0, HO, F, O]]);
wallLine('z', -10.4, -20, -9.4, [[0, HW, G, O], [HW, HO, F, O]]);
wallLine('z', 10.4, -27, -20, [[0, HO, O, F]]);
wallLine('z', 10.4, -20, -9.4, [[0, HW, O, P], [HW, HO, O, F]]);
wallLine('x', -9.4, -10.4, 10.4, [[0, RING, O, C], [RING, HO, O, F]], [[-3, 3, 3.1]]);   // 문은 처마 밑까지만, 그 위는 벽
// 작품관
wallLine('x', -20, -21, -10.4, [[0, HW, F, G]]);
wallLine('z', -21, -20, 9.4, [[0, HW, F, G]]);
wallLine('z', -10.4, -9.4, 9.4, [[0, RING, G, C], [RING, HW, G, F]], [[-8.9, -4.9, 3.1]]);   // 작품관 문: 문턱⑤가 룸1 북쪽으로 지나가게 북쪽으로 옮겼다
// IP관
wallLine('x', -20, 10.4, 21, [[0, HW, F, P]]);
wallLine('z', 21, -20, 9.4, [[0, HW, P, F]]);
wallLine('z', 10.4, -9.4, 9.4, [[0, RING, C, P], [RING, HW, F, P]], [[-6, -3, 3.1], [4.2, 6.8, 3.1]]);
// 남쪽 줄(z = 9.4)
wallLine('x', 9.4, -21, -10.4, [[0, HS, G, A], [HS, HW, G, F]], [[-18.5, -16, 3.1]]);
wallLine('x', 9.4, -10.4, -6, [[0, RING, C, A], [RING, HS, F, A]]);   // 작가소개는 중정으로 문을 내지 않는다
wallLine('x', 9.4, 6, 10.4, [[0, RING, C, U], [RING, HS, F, U]], [[7, 9.6, 3.0]]);
wallLine('x', 9.4, 10.4, 21, [[0, HS, P, U], [HS, HW, P, F]]);
// 로비 북쪽은 아래가 중정으로 열리고, 툇마루 반자(3.4 m) 위로는 천장까지 통유리. 가장자리와 유리 살은 가는 놋쇠
{
  const g0 = RING + .315 + .45, g1 = ROOMS.lobby.ceil;   // 처마 위 나무 띠 위에서 시작
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(12, g1 - g0), M.glass); gl.position.set(0, (g0 + g1) / 2, 9.4); scene.add(gl);
  for (const x of [-4, -2, 0, 2, 4]) boxMM(x - .025, x + .025, g0, g1, 9.37, 9.43, M.brass);
  boxMM(-6, 6, g0 - .03, g0 + .03, 9.37, 9.43, M.brass);
}
boxMM(-6, 6, ROOMS.lobby.ceil - .06, ROOMS.lobby.ceil, 9.32, 9.48, M.brass);
for (const x of [-5.95, 5.95]) boxMM(x - .05, x + .05, 0, ROOMS.lobby.ceil, 9.32, 9.48, M.brass);
// 바깥 남쪽(z = 19.4)
wallLine('x', 19.4, -21, -6, [[0, HS, A, F]]);
wallLine('x', 19.4, -6, 6, [[0, HL, L, F]], [[-1.6, 1.6, 3.2]]);
wallLine('x', 19.4, 6, 21, [[0, HS, U, F]]);   // 라운지는 로비를 거쳐 나간다(바깥벽은 디스플레이)
wallLine('z', -21, 9.4, 19.4, [[0, HS, F, A]]);
wallLine('z', 21, 9.4, 19.4, [[0, HS, U, F]]);
wallLine('z', -6, 9.4, 19.4, [[0, HS, A, L], [HS, HL, F, L]], [[10.2, 12.6, 3.0]]);
wallLine('z', 6, 9.4, 19.4, [[0, HS, L, U], [HS, HL, L, F]], [[10.2, 12.6, 3.0]]);
// 뒤뜰은 들어갈 수 없다
solid(-24, -10.4, -34, -20); solid(10.4, 24, -34, -20); solid(-24, 24, -34, -27);

/* ───────── 천장 ───────── */
ceiling(-21, -6, 9.4, 19.4, ROOMS.artist.ceil, M.hanjiCeil, 1.8);
ceiling(-6, 6, 9.4, 19.4, ROOMS.lobby.ceil, M.hanjiCeil, 1.8);
// 해달 라운지 천장: 스포츠센터처럼 흰 60 cm 텍스판에 한 칸 건너 하나씩 조명판
ceiling(6, 21, 9.4, 19.4, ROOMS.lounge.ceil, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#cfd7de'; g.fillRect(0, 0, w, h); const n = 4, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = i % 2 === 0 && j % 2 === 0 ? '#ffffff' : '#e6ebef'; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); } }) }), 2.4);
ceiling(-21, -10.4, -20, 9.4, ROOMS.works.ceil, M.hanjiCeil, 1.8);
for (let z = -18.5; z < 9; z += 2.6) boxMM(-21, -10.4, ROOMS.works.ceil - .28, ROOMS.works.ceil, z - .14, z + .14, M.wood);   // 밝은 나무 보
ceiling(10.4, 21, -20, 9.4, ROOMS.ip.ceil, M.stars, 30);
ceiling(-10.4, 10.4, -27, -9.4, ROOMS.obong.ceil, M.obongCeil, 12);
// 툇마루 반자: 여덟모로 하늘을 오려 낸다
{
  const s = new THREE.Shape(); s.moveTo(-10.4, -9.4); s.lineTo(10.4, -9.4); s.lineTo(10.4, 9.4); s.lineTo(-10.4, 9.4); s.closePath();
  const oct = [[-4.5, -6], [4.5, -6], [7, -3.5], [7, 3.5], [4.5, 6], [-4.5, 6], [-7, 3.5], [-7, -3.5]];
  const hole = new THREE.Path(); oct.forEach(([x, z], i) => i ? hole.lineTo(x, z) : hole.moveTo(x, z)); hole.closePath(); s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: .315, bevelEnabled: false });   // 윗면을 1.5 cm 올려 같은 높이의 다른 면과 겹쳐 지글거리지 않게(작가님 지적)
  const m = new THREE.Mesh(geo, M.soffit); m.rotation.x = Math.PI / 2; m.position.y = RING + .315; scene.add(m); blockers.push(m);
  // 반자 아래 서까래 결
  for (let i = -10; i <= 10; i += .55) { const zs = 6.3 + Math.max(0, Math.abs(i) - 4.5); if (zs > 9.2) continue; boxMM(i - .05, i + .05, RING - .1, RING, -9.25, -zs, M.wood); boxMM(i - .05, i + .05, RING - .1, RING, zs, 9.25, M.wood); }   // 구멍 밖 반자에만
  // 구멍 가장자리: 가는 놋쇠 띠
  for (let k = 0; k < oct.length; k++) {
    const [x0, z0] = oct[k], [x1, z1] = oct[(k + 1) % oct.length], len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
    const band = new THREE.Mesh(new THREE.BoxGeometry(len, .05, .05), M.brass); band.position.set((x0 + x1) / 2, RING - .02, (z0 + z1) / 2); band.rotation.y = -ang; scene.add(band);
  }
}
// 처마 위 나무 띠(작가님: 통유리는 처마 위에서 시작, 그 아래는 나무로). 반자 윗면에서 45 cm, 중정 네 벽 안쪽에 둘러 유리 밑동과 겹친 면을 가린다
{ const y0 = RING - .02, y1 = RING + .315 + .45, t = .06;
  boxMM(-10.4, 10.4, y0, y1, -9.4, -9.4 + t, M.soffit); boxMM(-10.4, 10.4, y0, y1, 9.4 - t, 9.4, M.soffit);
  boxMM(-10.4, -10.4 + t, y0, y1, -9.4, 9.4, M.soffit); boxMM(10.4 - t, 10.4, y0, y1, -9.4, 9.4, M.soffit); }
// 툇마루 기둥은 두지 않는다: 반자가 놋쇠 띠를 두른 채 떠 있다(작가님 결정, 비교 샘플에서 '모두 빼기')

/* ───────── 지붕: 처마 끝이 들린 진주빛 곡면 ───────── */
function roof({ w, d, cx, cz, h0, lift, ridge, thick = .22, alongZ = false }) {
  const nu = 48, nv = 24, pos = [], idx = [];
  const P = (u, v) => {
    const au = Math.abs(u), av = Math.abs(v);
    const a = u * w / 2 * (1 + .05 * av * av), b = v * d / 2 * (1 + .07 * au * au);
    const y = h0 + ridge * (1 - av * av) + lift * Math.pow(au, 3) * (.3 + .7 * av * av) + lift * .5 * Math.pow(av, 4) * (.25 + .75 * au * au);
    return alongZ ? [cx + b, y, cz + a] : [cx + a, y, cz + b];
  };
  for (const off of [0, -thick]) for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const [x, y, z] = P(i / nu * 2 - 1, j / nv * 2 - 1); pos.push(x, y + off, z); }
  const N = (nu + 1) * (nv + 1), id = (i, j, l) => l * N + j * (nu + 1) + i;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    idx.push(id(i, j, 0), id(i, j + 1, 0), id(i + 1, j, 0), id(i + 1, j, 0), id(i, j + 1, 0), id(i + 1, j + 1, 0));
    idx.push(id(i, j, 1), id(i + 1, j, 1), id(i, j + 1, 1), id(i + 1, j, 1), id(i + 1, j + 1, 1), id(i, j + 1, 1));
  }
  const ring = [];
  for (let i = 0; i < nu; i++) ring.push([i, 0]); for (let j = 0; j < nv; j++) ring.push([nu, j]);
  for (let i = nu; i > 0; i--) ring.push([i, nv]); for (let j = nv; j > 0; j--) ring.push([0, j]);
  for (let k = 0; k < ring.length; k++) { const [i, j] = ring[k], [i2, j2] = ring[(k + 1) % ring.length]; idx.push(id(i, j, 0), id(i2, j2, 0), id(i, j, 1), id(i2, j2, 0), id(i2, j2, 1), id(i, j, 1)); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M.pearl); scene.add(m); return m;
}
// 띠창: 몸체와 지붕 사이 어두운 유리 띠
function band(x0, x1, z0, z1, y) { boxMM(x0 + .1, x1 - .1, y, y + .4, z0 + .1, z1 - .1, M.darkGlass); }
for (const [k, R] of Object.entries(ROOMS)) band(R.x0, R.x1, R.z0, R.z1, R.wall);
roof({ w: 23.6, d: 20.4, cx: 0, cz: -18.2, h0: HO + .45, lift: 2.2, ridge: 1.9 });
roof({ w: 32.2, d: 10.4, cx: -15.9, cz: -5.3, h0: HW + .45, lift: 1.5, ridge: 1.1, alongZ: true });
roof({ w: 32.2, d: 10.4, cx: 15.9, cz: -5.3, h0: HW + .45, lift: 1.5, ridge: 1.1, alongZ: true });
// 작가소개·라운지 지붕: 바깥 끝은 그대로, 안쪽 끝은 로비 벽 모서리(x ±6)에서 멈춰 로비 앞으로 겹쳐 나오지 않게
// 북쪽 처마도 작품관·IP관 벽선(z 9.4)에서 멈춰 옆 채 벽을 뚫고 들어가지 않게(남쪽 처마 끝은 그대로)
roof({ w: 15.7, d: 10.9, cx: -14.35, cz: 15.32, h0: HS + .45, lift: 1.0, ridge: .75 });
roof({ w: 15.7, d: 10.9, cx: 14.35, cz: 15.32, h0: HS + .45, lift: 1.0, ridge: .75 });
roof({ w: 14.4, d: 12.6, cx: 0, cz: 14.4, h0: HL + .45, lift: 1.2, ridge: 1.1 });
boxMM(-24, 24, -.02, .06, 19.4, 20.2, M.blackStone);   // 기단
