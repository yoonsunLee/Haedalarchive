/* ───────── 바깥 재질: 옻칠한 검은 판과 진주빛 지붕 ───────── */
// 나전칠기를 그대로 그리지 않고 재료로 옮긴다: 깊은 옻칠의 검정 위에 자개의 진주빛이 떠 있다
T.facade = canvasTex(1024, 1024, (g, w, h) => {      // 2.4 m × 2.4 m, 0.6 m 폭 판 네 장
  const r = rng(41); g.fillStyle = '#16110f'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) {
    const x0 = i * w / 4, gr = g.createLinearGradient(x0, 0, x0 + w / 4, 0);
    const l = 9 + r() * 3; gr.addColorStop(0, `hsl(15 18% ${l}%)`); gr.addColorStop(.5, `hsl(15 16% ${l + 2}%)`); gr.addColorStop(1, `hsl(15 18% ${l}%)`);
    g.fillStyle = gr; g.fillRect(x0, 0, w / 4, h);
    g.fillStyle = '#050303'; g.fillRect(x0, 0, 3, h); g.fillStyle = 'rgba(255,240,230,.05)'; g.fillRect(x0 + 3, 0, 1, h);
  }
  for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(60,35,25,${.03 + r() * .05})`; g.fillRect(r() * w, 0, 1 + r() * 6, h); }
});
M.facade = new THREE.MeshPhysicalMaterial({ map: T.facade, roughness: .32, clearcoat: 1, clearcoatRoughness: .08 });
M.pearl = new THREE.MeshPhysicalMaterial({ color: 0xf2f0ea, roughness: .38, metalness: .08, clearcoat: .6, clearcoatRoughness: .25, iridescence: .3, iridescenceIOR: 1.35, envMapIntensity: .9 });
M.darkGlass = new THREE.MeshPhysicalMaterial({ color: 0x1b2328, roughness: .06, metalness: .4, clearcoat: 1, transparent: true, opacity: .9 });
M.blackStone = new THREE.MeshStandardMaterial({ color: 0x1d1b1a, roughness: .6 });

/* ───────── 건물 ───────── */
const colliders = [];
const solid = (x0, x1, z0, z1) => colliders.push([x0, x1, z0, z1]);
const t = .4, X = ROOM.x, Z = ROOM.z, H = ROOM.outer, DOOR = 1.5, DOOR_H = 2.8;
boxMM(-X - t, X + t, 0, H, -Z - t, -Z, M.facade, [2.4, 2.4]); solid(-X - t, X + t, -Z - t, -Z);
boxMM(-X - t, -X, 0, H, -Z, Z, M.facade, [2.4, 2.4]); solid(-X - t, -X, -Z, Z);
boxMM(X, X + t, 0, H, -Z, Z, M.facade, [2.4, 2.4]); solid(X, X + t, -Z, Z);
boxMM(-X - t, -DOOR, 0, H, Z, Z + t, M.facade, [2.4, 2.4]); solid(-X - t, -DOOR, Z, Z + t);
boxMM(DOOR, X + t, 0, H, Z, Z + t, M.facade, [2.4, 2.4]); solid(DOOR, X + t, Z, Z + t);
boxMM(-DOOR, DOOR, DOOR_H, H, Z, Z + t, M.facade, [2.4, 2.4]);
boxMM(-X - .6, X + .6, 0, .08, -Z - .6, Z + .6, M.blackStone);
boxMM(-X - t + .15, X + t - .15, H, H + .45, -Z - t + .15, Z + t - .15, M.darkGlass);   // 지붕 아래 띠창: 지붕이 떠 보이게

// 처마 끝이 들린 얇은 지붕 한 장. 한옥 처마의 앙곡(모서리가 들림)과 안허리(가운데가 안으로 듦)를 곡면으로 옮겼다
function roof({ w, d, cx, cz, h0, lift, ridge, thick = .24 }) {
  const nu = 56, nv = 28, pos = [], idx = [];
  const P = (u, v) => {
    const au = Math.abs(u), av = Math.abs(v);
    const x = cx + u * w / 2 * (1 + .05 * av * av - .02 * (1 - av));
    const z = cz + v * d / 2 * (1 + .07 * au * au);
    const y = h0 + ridge * (1 - av * av) + lift * Math.pow(au, 3) * (.3 + .7 * av * av) + lift * .5 * Math.pow(av, 4) * (.25 + .75 * au * au);
    return [x, y, z];
  };
  for (const off of [0, -thick]) for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const [x, y, z] = P(i / nu * 2 - 1, j / nv * 2 - 1); pos.push(x, y + off, z); }
  const N = (nu + 1) * (nv + 1), id = (i, j, layer) => layer * N + j * (nu + 1) + i;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = id(i, j, 0), b = id(i + 1, j, 0), c = id(i, j + 1, 0), e = id(i + 1, j + 1, 0);
    idx.push(a, c, b, b, c, e);
    const a2 = id(i, j, 1), b2 = id(i + 1, j, 1), c2 = id(i, j + 1, 1), e2 = id(i + 1, j + 1, 1);
    idx.push(a2, b2, c2, b2, e2, c2);
  }
  const ring = [];
  for (let i = 0; i < nu; i++) ring.push([i, 0]); for (let j = 0; j < nv; j++) ring.push([nu, j]);
  for (let i = nu; i > 0; i--) ring.push([i, nv]); for (let j = nv; j > 0; j--) ring.push([0, j]);
  for (let k = 0; k < ring.length; k++) {
    const [i, j] = ring[k], [i2, j2] = ring[(k + 1) % ring.length];
    const a = id(i, j, 0), b = id(i2, j2, 0), a2 = id(i, j, 1), b2 = id(i2, j2, 1);
    idx.push(a, b, a2, b, b2, a2);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M.pearl); scene.add(m); return m;
}
// 다섯 장: 가운데가 가장 높고 바깥으로 갈수록 낮아진다. 멀리서 보면 다섯 봉우리로 읽힌다
roof({ w: 33.5, d: 22, cx: 0, cz: 0, h0: H + .55, lift: 2.4, ridge: 1.1 });
for (const s of [-1, 1]) {
  roof({ w: 10.5, d: 16, cx: s * 20.6, cz: .5, h0: 5.0, lift: 1.7, ridge: .7, thick: .2 });
  roof({ w: 7.5, d: 11.5, cx: s * 27.6, cz: 1.5, h0: 3.6, lift: 1.2, ridge: .45, thick: .18 });
  // 날개 아래 검은 유리 파빌리온
  for (const [cx, w, d, cz, hh] of [[s * 20.6, 8.6, 12, .5, 4.6], [s * 27.6, 5.6, 8, 1.5, 3.3]]) {
    boxMM(cx - w / 2, cx + w / 2, 0, hh, cz - d / 2, cz + d / 2, M.darkGlass); solid(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2);
    for (let k = 0; k <= Math.round(w / 1.4); k++) { const x = cx - w / 2 + k * w / Math.round(w / 1.4); boxMM(x - .03, x + .03, 0, hh, cz + d / 2 - .02, cz + d / 2 + .04, M.steel); }
    boxMM(cx - w / 2 - .3, cx + w / 2 + .3, 0, .08, cz - d / 2 - .3, cz + d / 2 + .3, M.blackStone);
  }
  // 본관과 날개를 잇는 낮은 회랑 지붕
  roof({ w: 4.2, d: 6, cx: s * 16.3, cz: 3.5, h0: 3.3, lift: .3, ridge: .15, thick: .16 });
  for (const zz of [1, 6]) boxMM(s * 17.6 - .05, s * 17.6 + .05, 0, 3.3, zz - .05, zz + .05, M.steel);
}
// 입구: 문 앞으로 펼쳐지는 얇은 조개 껍질 아치. 앞쪽 입술이 더 높이 벌어진다
{
  const nu = 60, nv = 20, pos = [], idx = [], z0 = Z + t + .15;
  const P = (u, v) => {
    const x = 4.3 * u * (1 + .22 * v);
    const y = (1 - u * u) * (4.6 + 1.6 * v * v) * (1 + .035 * Math.abs(Math.sin(u * Math.PI * 6.5)) * v);
    const z = z0 + v * 3.6 * (1 - .35 * u * u);
    return [x, y, z];
  };
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...P(i / nu * 2 - 1, j / nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xf4efe9, roughness: .3, metalness: .05, clearcoat: .8, iridescence: .5, iridescenceIOR: 1.35, side: THREE.DoubleSide })));
  for (let k = 1; k < 13; k++) {   // 부채살처럼 퍼지는 골
    const u = k / 13 * 2 - 1, pts = [];
    for (let j = 0; j <= 16; j++) { const [x, y, z] = P(u, j / 16); pts.push(new THREE.Vector3(x, y + .03, z)); }
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .03, 6), M.pearl));
  }
  for (const s of [-1, 1]) solid(s * 4.6 - .35, s * 4.6 + .35, z0 - .2, z0 + 3.8);
}
// 놋쇠 문틀, 열어 둔 유리문
boxMM(-DOOR, -DOOR + .07, 0, DOOR_H, Z - .02, Z + t + .02, M.brass);
boxMM(DOOR - .07, DOOR, 0, DOOR_H, Z - .02, Z + t + .02, M.brass);
boxMM(-DOOR, DOOR, DOOR_H - .07, DOOR_H, Z - .02, Z + t + .02, M.brass);
for (const s of [-1, 1]) {
  boxMM(0, 1.38, .02, DOOR_H - .08, 0, .02, M.glass).position.set(s * (DOOR + .62), (DOOR_H - .06) / 2, Z + t + .05);
  boxMM(0, 1.38, 0, .05, 0, .04, M.brass).position.set(s * (DOOR + .62), .03, Z + t + .05);
}

