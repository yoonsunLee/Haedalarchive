/* ───────── 바깥 재질: 자개를 흩뿌린 옻칠, 물결 띠 ───────── */
T.facade = canvasTex(1024, 1024, (g, w, h) => {      // 4 m × 4 m
  const r = rng(41); g.fillStyle = '#100b0a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${40 + r() * 20},${22 + r() * 10},${18 + r() * 8},${.08 + r() * .1})`; g.fillRect(r() * w, 0, 2 + r() * 10, h); }
  for (let i = 0; i < 520; i++) {                     // 타발법처럼 흩어진 자개 알갱이
    const cx = r() * w, cy = r() * h, rr = 1.5 + r() * 4.5, n = 3 + ((r() * 3) | 0), a0 = r() * 6.28;
    g.fillStyle = `hsla(${[330, 190, 265, 45, 160][(r() * 5) | 0]} ${30 + r() * 40}% ${70 + r() * 20}% / ${.45 + r() * .5})`;
    g.beginPath(); for (let k = 0; k < n; k++) { const a = a0 + k / n * 6.28, x = cx + Math.cos(a) * rr * (.6 + r() * .6), y = cy + Math.sin(a) * rr * (.6 + r() * .6); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.fill();
  }
});
T.waves = canvasTex(1024, 256, (g, w, h) => {        // 4 m × 1 m, 일월오봉도 아래의 물결
  g.fillStyle = '#100b0a'; g.fillRect(0, 0, w, h);
  const grad = g.createLinearGradient(0, 0, w, 0);
  ['#f4c6d6', '#bfe6e4', '#d9d2f7', '#f1e6c4', '#f4c6d6'].forEach((c, i) => grad.addColorStop(i / 4, c));
  g.strokeStyle = grad; g.lineCap = 'round';
  const R0 = 64;
  for (let row = 0; row < 4; row++) {
    const y = h - row * 44 + 18, off = row % 2 ? R0 : 0;
    for (let x = -R0 + off; x < w + R0; x += R0 * 2) {
      g.fillStyle = '#100b0a'; g.beginPath(); g.arc(x, y, R0, Math.PI, 0); g.fill();
      for (let k = 0; k < 4; k++) { g.lineWidth = k ? 2.4 : 3.2; g.globalAlpha = .95 - k * .15; g.beginPath(); g.arc(x, y, R0 - 4 - k * 14, Math.PI, 0); g.stroke(); }
      g.globalAlpha = 1;
    }
  }
});
T.nacreScreen = canvasTex(512, 512, (g, w, h) => nacre(g, w, h, rng(53), [165, 185, 200, 150, 260], 1.1));
T.shell = canvasTex(1024, 560, (g, w, h) => {
  nacre(g, w, h, rng(61), [335, 350, 10, 300, 345], 1.6);
  g.strokeStyle = 'rgba(150,60,90,.35)'; g.lineWidth = 6;
  for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2 + Math.cos(a) * w, h + Math.sin(a) * w); g.stroke(); }
});
T.shell.wrapS = T.shell.wrapT = THREE.ClampToEdgeWrapping;
M.facade = new THREE.MeshPhysicalMaterial({ map: T.facade, roughness: .42, clearcoat: 1, clearcoatRoughness: .12 });
M.waves = new THREE.MeshPhysicalMaterial({ map: T.waves, roughness: .35, clearcoat: 1, clearcoatRoughness: .1 });
M.blackStone = new THREE.MeshStandardMaterial({ color: 0x1d1b1a, roughness: .6 });

/* ───────── 건물: 검은 자개함 ───────── */
const colliders = [];
const solid = (x0, x1, z0, z1) => colliders.push([x0, x1, z0, z1]);
const t = .4, X = ROOM.x, Z = ROOM.z, H = ROOM.outer, DOOR = 1.5, DOOR_H = 2.8;
boxMM(-X - t, X + t, 0, H, -Z - t, -Z, M.facade, [4, 4]); solid(-X - t, X + t, -Z - t, -Z);
boxMM(-X - t, -X, 0, H, -Z, Z, M.facade, [4, 4]); solid(-X - t, -X, -Z, Z);
boxMM(X, X + t, 0, H, -Z, Z, M.facade, [4, 4]); solid(X, X + t, -Z, Z);
boxMM(-X - t, -DOOR, 0, H, Z, Z + t, M.facade, [4, 4]); solid(-X - t, -DOOR, Z, Z + t);
boxMM(DOOR, X + t, 0, H, Z, Z + t, M.facade, [4, 4]); solid(DOOR, X + t, Z, Z + t);
boxMM(-DOOR, DOOR, DOOR_H, H, Z, Z + t, M.facade, [4, 4]);
boxMM(-X - t, X + t, H, H + .12, -Z - t, Z + t, M.facade, [4, 4]);
boxMM(-X - .6, X + .6, 0, .08, -Z - .6, Z + .6, M.blackStone);
// 아랫단을 두르는 자개 물결 띠
function waveBand(len, x, z, rotY) {
  const geo = new THREE.PlaneGeometry(len, 1.05);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len / 4);
  const m = new THREE.Mesh(geo, M.waves); m.position.set(x, .6, z); m.rotation.y = rotY; scene.add(m);
}
waveBand(X + t - DOOR, (-X - t - DOOR) / 2, Z + t + .006, 0);
waveBand(X + t - DOOR, (X + t + DOOR) / 2, Z + t + .006, 0);
waveBand(2 * (Z + t), X + t + .006, 0, Math.PI / 2);
waveBand(2 * (Z + t), -X - t - .006, 0, -Math.PI / 2);
waveBand(2 * (X + t), 0, -Z - t - .006, Math.PI);
// 지붕 위 일월오봉 병풍: 다섯 봉우리를 자개로
{
  const s = new THREE.Shape(), W2 = X + t;
  const peaks = [[-W2, 1.2], [-11.6, 3.1], [-8.9, 1.0], [-5.9, 4.1], [-3.0, 1.3], [0, 5.2], [3.0, 1.3], [5.9, 4.1], [8.9, 1.0], [11.6, 3.1], [W2, 1.2]];
  s.moveTo(-W2, 0); s.lineTo(...peaks[0]);
  for (let i = 1; i < peaks.length; i++) {
    const [ax, ay] = peaks[i - 1], [bx, by] = peaks[i], up = by > ay;
    s.quadraticCurveTo(up ? ax + (bx - ax) * .62 : ax + (bx - ax) * .38, up ? by - (by - ay) * .08 : ay - (ay - by) * .08, bx, by);
  }
  s.lineTo(W2, 0); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: .5, bevelEnabled: false, curveSegments: 16 });
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
  const face = new THREE.MeshPhysicalMaterial({ map: T.nacreScreen, color: 0xb9ded6, roughness: .3, clearcoat: 1, iridescence: .8, iridescenceIOR: 1.5 });
  const screen = new THREE.Mesh(geo, [face, M.facade]); screen.position.set(0, H, Z + t - .5); scene.add(screen);
  // 해(오른쪽)와 달(왼쪽)
  const sunM = new THREE.MeshStandardMaterial({ color: 0xd8432a, emissive: 0xc8321c, emissiveIntensity: .9, roughness: .5 });
  const moonM = new THREE.MeshPhysicalMaterial({ map: T.nacreScreen, color: 0xf3f0ea, emissive: 0xe8e4dc, emissiveIntensity: .35, roughness: .25, iridescence: .6 });
  for (const [mx, mat] of [[9.6, sunM], [-9.6, moonM]]) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .12, 64), mat); disc.rotation.x = Math.PI / 2; disc.position.set(mx, H + 4.2, Z + t - .2); scene.add(disc);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.4), M.brass); rod.position.set(mx, H + 2.1, Z + t - .3); scene.add(rod);
  }
}
// 입구: 얼빵해달의 분홍 자개 조개
{
  const R = 2.25, s = new THREE.Shape(); s.moveTo(-R, 0);
  for (let i = 0; i <= 120; i++) { const a = Math.PI - i / 120 * Math.PI, rr = R + .1 * Math.abs(Math.sin(i / 120 * Math.PI * 14)); s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * .92); }
  s.lineTo(-R, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 3 });
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + R + .1) / (2 * R + .2), uv.getY(i) / (R + .1));
  const shellM = new THREE.MeshPhysicalMaterial({ map: T.shell, roughness: .22, clearcoat: 1, clearcoatRoughness: .05, iridescence: 1, iridescenceIOR: 1.45 });
  const shell = new THREE.Mesh(geo, [shellM, new THREE.MeshPhysicalMaterial({ color: 0xe9aebc, roughness: .3, clearcoat: 1 })]);
  shell.position.set(0, DOOR_H - .05, Z + t + .01); scene.add(shell);
}
// 놋쇠 문틀, 열어 둔 유리문
boxMM(-DOOR, -DOOR + .07, 0, DOOR_H, Z - .02, Z + t + .02, M.brass);
boxMM(DOOR - .07, DOOR, 0, DOOR_H, Z - .02, Z + t + .02, M.brass);
boxMM(-DOOR, DOOR, DOOR_H - .07, DOOR_H, Z - .02, Z + t + .02, M.brass);
for (const s of [-1, 1]) {
  boxMM(0, 1.38, .02, DOOR_H - .08, 0, .02, M.glass).position.set(s * (DOOR + .62), (DOOR_H - .06) / 2, Z + t + .05);
  boxMM(0, 1.38, 0, .05, 0, .04, M.brass).position.set(s * (DOOR + .62), .03, Z + t + .05);
}

/* ───────── 앞마당: 건물이 비치는 연못, 돌다리, 붉은 소나무 ───────── */
{
  const px0 = -13.4, px1 = 13.4, pz0 = 9.4, pz1 = 13.8, bridge = 1.8;
  const water = new Reflector(new THREE.PlaneGeometry(px1 - px0, pz1 - pz0), {
    color: 0x6f7c80, textureWidth: Math.min(1024, innerWidth), textureHeight: Math.min(1024, innerHeight), clipBias: .003 });
  water.rotation.x = -Math.PI / 2; water.position.set(0, .1, (pz0 + pz1) / 2); scene.add(water);
  for (const [a, b, c, d] of [[px0 - .3, px1 + .3, pz0 - .3, pz0], [px0 - .3, px1 + .3, pz1, pz1 + .3], [px0 - .3, px0, pz0, pz1], [px1, px1 + .3, pz0, pz1]])
    boxMM(a, b, 0, .22, c, d, M.blackStone);
  boxMM(-bridge, bridge, 0, .2, pz0 - .3, pz1 + .3, M.stone, [1.2, 1.2]);
  ground(2 * bridge, pz1 - pz0 + .6, 0, (pz0 + pz1) / 2, .201, M.stone, 1.2);
  solid(px0 - .3, -bridge, pz0 - .3, pz1 + .3); solid(bridge, px1 + .3, pz0 - .3, pz1 + .3);
}
boxMM(-12.5, -8.5, 0, .45, 17, 17.6, M.blackStone); solid(-12.5, -8.5, 17, 17.6);   // 긴 의자
boxMM(8.5, 12.5, 0, .45, 17, 17.6, M.blackStone); solid(8.5, 12.5, 17, 17.6);
// 일월오봉도 양옆을 지키는 붉은 줄기의 소나무
const barkMat = new THREE.MeshStandardMaterial({ color: 0x8c3a22, roughness: .8 });
const needleMat = new THREE.MeshStandardMaterial({ color: 0x2c4a3a, roughness: .9 });
function pine(x, z, hgt, lean, seed) {
  const r = rng(seed), pts = [];
  for (let i = 0; i <= 4; i++) { const k = i / 4; pts.push(new THREE.Vector3(x + lean * k * k * hgt * .25 + (r() - .5) * .3 * k, k * hgt, z + (r() - .5) * .4 * k)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, hgt * .028, 8), barkMat));
  for (let i = 0; i < 5; i++) {
    const p = curve.getPoint(.55 + i * .1), s = hgt * (.28 - i * .03);
    const c = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), needleMat);
    c.position.set(p.x + (r() - .5) * s, p.y + .2, p.z + (r() - .5) * s * .6); c.scale.set(s * (1.2 + r() * .5), s * .32, s * (.9 + r() * .4)); scene.add(c);
  }
  solid(x - .4, x + .4, z - .4, z + .4);
}
[[-18, 10.5, 9, .9, 1], [-20.5, 13.5, 7.5, .6, 2], [-17, 15.5, 6, 1.2, 3], [18, 10.5, 9, -.9, 4], [20.5, 13.5, 7.5, -.6, 5], [17, 15.5, 6, -1.2, 6]].forEach(a => pine(...a));

// 정면 글자(오른쪽)
{
  const tex = canvasTex(2048, 420, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#efe9df';
    g.font = `300 150px ${FONT_B}`; g.letterSpacing = '36px'; g.fillText('SHIN HAEDAL', 12, 170);
    g.letterSpacing = '10px'; g.font = `400 84px ${FONT_D}`; g.fillText('신해달 갤러리', 16, 330);
    g.font = `300 44px ${FONT_B}`; g.letterSpacing = '8px'; g.fillStyle = '#b9b0a3'; g.fillText('NAJEONCHILGI · 나전칠기', 820, 326);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.48), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  sign.position.set(8.4, 4.9, Z + t + .01); scene.add(sign);
}
// 개인전 현수막(왼쪽): 바람에 살짝 흔들리는 천
const banner = { w: 3.0, h: 5.7 };
{
  const c = document.createElement('canvas'); c.width = 1200; c.height = 2280; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
  const paint = img => {
    const W = c.width, Hh = c.height;
    g.fillStyle = '#16164a'; g.fillRect(0, 0, W, Hh);
    if (img) {
      g.drawImage(img, 0, 300, W, W);
      const fade = g.createLinearGradient(0, 300 + W * .72, 0, 300 + W);
      fade.addColorStop(0, 'rgba(22,22,74,0)'); fade.addColorStop(1, 'rgba(22,22,74,1)');
      g.fillStyle = fade; g.fillRect(0, 300 + W * .7, W, W * .32);
    }
    const nac = g.createLinearGradient(80, 0, W - 80, 0);
    ['#f4c6d6', '#d9d2f7', '#bfe6e4', '#f1e6c4'].forEach((col, i) => nac.addColorStop(i / 3, col));
    g.fillStyle = '#efe9df'; g.font = `500 46px ${FONT_B}`; g.letterSpacing = '10px'; g.fillText('신해달 개인전', 80, 128);
    g.fillStyle = '#a9a5d6'; g.font = `400 30px ${FONT_B}`; g.letterSpacing = '8px'; g.fillText('SHIN HAEDAL SOLO EXHIBITION', 80, 184);
    g.fillStyle = nac; g.fillRect(80, 222, 140, 5);
    g.letterSpacing = '0px'; g.fillStyle = '#ffffff'; g.font = `700 150px ${FONT_D}`;
    ['해달도', '배워야', '수영을 한다'].forEach((l, i) => g.fillText(l, 76, 1640 + i * 176));
    g.fillStyle = nac; g.fillRect(80, 2080, W - 160, 3);
    g.fillStyle = '#efe9df'; g.font = `500 40px ${FONT_B}`; g.fillText('2026  신해달 갤러리', 80, 2160);
    g.fillStyle = '#a9a5d6'; g.font = `400 32px ${FONT_B}`; g.fillText('나전칠기 · 아트토이 · 일월오봉단', 80, 2214);
    g.textAlign = 'right'; g.fillText('shinhaedal.com', W - 80, 2160); g.textAlign = 'left';
    tex.needsUpdate = true;
  };
  paint(null);
  const info = { kind: '현수막', kicker: 'SHIN HAEDAL SOLO EXHIBITION', title: '신해달 개인전 〈해달도 배워야 수영을 한다〉', meta: '2026 · 신해달 갤러리',
    body: '처음부터 능숙한 존재는 없어요. 누구에게나 서툰 시작이 있고, 시작하기에 늦은 때도 없어요. 수영을 못 하는 조개배달부 얼빵해달과 함께 나전칠기 작품, 아트토이, 일월오봉단 친구들을 만나 보세요.',
    img: 'img/HD-2026-005.webp', links: [[SITE + '/', '신해달 홈페이지']], focus: { pos: [-8.2, 18.5], look: [-8.2, 4.3, Z] } };
  const img = new Image(); img.onload = () => { paint(img); info.img = c.toDataURL('image/jpeg', .9); }; img.src = 'img/HD-2026-005.webp';
  const geo = new THREE.PlaneGeometry(banner.w, banner.h, 1, 28);
  const cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: .85, side: THREE.DoubleSide }));
  const bx = -8.2, by = 4.0, bz = Z + t + .32;
  cloth.position.set(bx, by, bz); scene.add(cloth);
  Object.assign(banner, { mesh: cloth, base: Float32Array.from(geo.attributes.position.array), info });
  for (const yy of [by + banner.h / 2 + .03, by - banner.h / 2 - .03]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, banner.w + .2, 12), M.steel); bar.rotation.z = Math.PI / 2; bar.position.set(bx, yy, bz); scene.add(bar);
  }
  for (const sx of [-1, 1]) {   // 지붕턱까지 이어진 줄
    const a = new THREE.Vector3(bx + sx * (banner.w / 2 + .05), by + banner.h / 2, bz), b = new THREE.Vector3(bx + sx * (banner.w / 2 + .05), H + .05, Z + t + .02);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, a.distanceTo(b)), M.steel);
    wire.position.copy(a).add(b).multiplyScalar(.5); wire.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); scene.add(wire);
  }
}
