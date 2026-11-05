
/* ───────── 출구 라운지: 회원 발급 창구와 샵 배너 ───────── */
const LG = ROOMS.lounge, deskSpot = { x: 17.6, z: 14.4 };
{
  boxMM(18.6, 19.6, 0, 1.05, 12.6, 16.2, M.lacquer); boxMM(18.5, 19.7, 1.05, 1.1, 12.5, 16.3, M.brass); solid(18.5, 19.7, 12.5, 16.3);
  const sign = panel(3.4, 1.3, (g, W, H) => {
    g.fillStyle = '#eaf1ff'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2b4ec9'; g.lineWidth = H * .05; g.strokeRect(H * .03, H * .03, W - H * .06, H - H * .06);
    g.fillStyle = '#2b4ec9'; g.font = `700 ${H * .1}px ${FONT_B}`; g.fillText('HYUNDAI SOCIAL SPORTS CENTER', W * .06, H * .24);
    g.fillStyle = '#20307a'; g.font = `400 ${H * .25}px ${FONT_K}`; g.fillText('회원 발급 창구', W * .06, H * .56);
    g.font = `500 ${H * .085}px ${FONT_B}`; g.fillText('조개 도장 다섯 개를 모은 해달에게 멤버십 카드를 드려요.', W * .06, H * .8);
  }, { ppm: 300 });
  place(sign, LG.x1 - .17, 2.35, 14.4, -1, 0);
  const shop = panel(3.6, 1.6, (g, W, H) => {
    g.fillStyle = '#1d2a5c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c9a86a'; g.font = `500 ${H * .08}px ${FONT_M}`; g.fillText('BEFORE YOU GO', W * .05, H * .17);
    g.fillStyle = '#efe9df'; g.font = `400 ${H * .2}px ${FONT_K}`; g.fillText('해달자개 브랜드샵', W * .05, H * .42);
    g.font = `500 ${H * .085}px ${FONT_B}`; g.fillText('한글자음·알파벳 자개키링과 나전칠기 굿즈', W * .05, H * .6);
    g.fillStyle = '#efe9df'; g.beginPath(); g.roundRect(W * .05, H * .72, W * .42, H * .16, H * .08); g.fill();
    g.fillStyle = '#1d2a5c'; g.font = `700 ${H * .085}px ${FONT_B}`; g.fillText('아이디어스에서 보기 ↗', W * .08, H * .83);
  }, { ppm: 300 });
  place(shop, 18.0, 1.9, LG.z1 - .17, 0, -1);
  pickable(shop, { kind: 'Brand Shop', title: '해달자개 브랜드샵', body: '한글자음 자개키링과 알파벳 자개키링, 나전칠기 굿즈는 아이디어스 해달자개 브랜드샵에서 만날 수 있어요.', img: 'img/shell-stamp.webp', links: [[SHOP_URL, '브랜드샵 바로가기']] });
  for (const x of [9.5, 11.5]) { boxMM(x - .7, x + .7, 0, .45, 16.4, 16.9, M.lacquer); solid(x - .7, x + .7, 16.4, 16.9); }
}

/* ───────── 바깥: 광장, 개인전 현수막, 대형 디스플레이, 이름 ───────── */
const banner = { w: 2.8, h: 3.5 };   // 포스터 원본 비율 4:5
{
  const t = tex('ip/poster-EX-2026-01.webp');
  const geo = new THREE.PlaneGeometry(banner.w, banner.h, 8, 14);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: .85, side: THREE.DoubleSide }));
  mesh.position.set(-4.0, .85 + banner.h / 2, 19.68); scene.add(mesh);
  boxMM(-4 - banner.w / 2 - .1, -4 + banner.w / 2 + .1, .85 + banner.h, .9 + banner.h, 19.6, 19.7, M.brass);
  banner.mesh = mesh; banner.base = geo.attributes.position.array.slice();
  const solo = EXHIBITIONS.find(e => e.id === 'EX-2026-01');
  if (solo) pickable(mesh, { kind: solo.type + ' · ' + (solo.title_en || ''), title: solo.title, meta: `${solo.start_date.replace(/-/g, '.')} – ${solo.end_date.slice(5).replace('-', '.')} · ${solo.venue}`, img: 'ip/poster-EX-2026-01.webp',
    exTitle: '출품작', ex: solo.work_nos.split(',').map(id => (WORKS_INDEX.find(w => w.id === id) || {}).title || id), links: [[SITE + '/', '홈페이지에서 보기']], focus: { pos: [-4, 25.5], look: [-4, 2.6, 19.6] } });
  // 라운지 바깥벽: 메인 테마 영상
  // 라운지 바깥벽: 홈페이지 첫 화면을 띄운 디스플레이(4:3, 테두리만 가늘게)
  const dW = 4.8, dH = dW * HERO_H / HERO_W;
  boxMM(13.5 - dW / 2 - .06, 13.5 + dW / 2 + .06, .3 - .06, .3 + dH + .06, 19.55, 19.72, M.steel);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(dW, dH), new THREE.MeshBasicMaterial({ map: heroTex, toneMapped: false })); place(sc, 13.5, .3 + dH / 2, 19.74, 0, 1);
  pickable(sc, { kind: 'SHIN HAEDAL', title: '쉽게 들어와서 오래 머무는 작업.', body: '순서가 다를 뿐, 깊이는 같습니다.', img: 'ip/hero-bg.webp', links: [[SITE + '/', '홈페이지']] });
  // 이름: 작가소개 바깥벽에 놋쇠 글자
  const name = panel(7, 1.4, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = '#d8b878'; g.font = `500 ${H * .2}px ${FONT_M}`; g.fillText('SHIN HAEDAL GALLERY', W * .02, H * .3); g.font = `700 ${H * .46}px ${FONT_D}`; g.fillText('신해달 갤러리', W * .02, H * .85); }, { transparent: true, ppm: 200 });
  name.material.alphaTest = .3; place(name, -13.6, 2.6, 19.57, 0, 1);
  for (const x of [-12, -6.5, 9, 18]) { boxMM(x - .9, x + .9, 0, .42, 26.5, 27.0, M.blackStone); solid(x - .9, x + .9, 26.5, 27.0); }
}

/* ───────── 둘레: 키 큰 가문비나무가 빽빽한 숲 ───────── */
{
  scene.fog = new THREE.Fog(0xcfd9d3, 50, 210);
  ground(-220, 220, -220, 220, -.04, new THREE.MeshStandardMaterial({ color: 0x4f6e3a, roughness: 1 }), 8, false);
  // 건물과 숲 사이 밝은 풀밭
  const meadow = new THREE.MeshStandardMaterial({ color: 0x7fa34f, roughness: 1 });
  ground(-34, 34, -38, 46, -.03, meadow, 8, false);
  const r = rng(2026), spots = [];
  const inClear = (x, z) => x > -31 && x < 31 && z > -35 && z < 43;   // 건물 + 광장 + 풀밭
  for (let x = -150; x <= 150; x += 3.1) for (let z = -150; z <= 160; z += 3.1) {
    const px = x + (r() - .5) * 2.6, pz = z + (r() - .5) * 2.6;
    if (inClear(px, pz) || (Math.abs(px) < 6.5 && pz > 40)) continue;   // 정문에서 곧게 뻗은 숲길
    if (Math.hypot(px, pz) > 165 || r() < .12) continue;
    spots.push([px, pz]);
  }
  const greens = [0x1f3a24, 0x24422a, 0x2b4a2c, 0x1b3320, 0x31532f].map(c => new THREE.Color(c));
  const trunkGeo = new THREE.CylinderGeometry(.07, .16, 1, 6);
  const coneGeo = new THREE.ConeGeometry(1, 1, 12);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b847a, roughness: .9 }), leafMat = new THREE.MeshStandardMaterial({ roughness: .95 });
  const LAYERS = 5;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length), cones = new THREE.InstancedMesh(coneGeo, leafMat, spots.length * LAYERS);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  let ki = 0;
  spots.forEach(([x, z], i) => {
    const edge = Math.min(Math.abs(Math.abs(x) - 31), Math.abs(z < 0 ? z + 35 : z - 43));
    const h = 9 + r() * 7 + Math.min(3, edge * .04), bare = h * (.14 + r() * .08);   // 아래쪽 가지 없는 줄기
    const lean = (r() - .5) * .03;
    m4.compose(p.set(x, (bare + 1.2) / 2, z), q.setFromEuler(e.set(lean, 0, lean)), sc.set(1, bare + 1.2, 1)); trunks.setMatrixAt(i, m4);   // 줄기는 가지 아래만
    const col = greens[(r() * greens.length) | 0], w0 = 1.5 + r() * .7;
    for (let k = 0; k < LAYERS; k++) {
      const t = k / LAYERS, y0 = bare + (h - bare) * t * .82, lh = (h - bare) * (.42 - t * .1), w = w0 * (1 - t * .7) * (.92 + r() * .16);
      m4.compose(p.set(x, y0 + lh / 2, z), q.setFromEuler(e.set(0, r() * 6, 0)), sc.set(w, lh, w));
      cones.setMatrixAt(ki, m4); cones.setColorAt(ki++, col.clone().offsetHSL(0, 0, (r() - .5) * .04 + t * .02));
    }
  });
  cones.count = ki;
  scene.add(trunks, cones);
  // 정문 앞에서 숲 속으로 곧게 뻗은 길(눈으로만 본다)
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xb3a58c, roughness: 1 });
  ground(-3, 3, 36, 170, -.02, roadMat, 4, false);
  for (const sx of [-3.15, 3.15]) boxMM(sx - .12, sx + .12, -.02, .06, 36, 170, M.blackStone);
  // 숲 가장자리 덤불과 바위
  const bushGeo = new THREE.IcosahedronGeometry(1, 1), bush = new THREE.InstancedMesh(bushGeo, leafMat, 160); let bi = 0;
  for (let i = 0; i < 160; i++) {
    const side = i % 4, t = r();
    const x = side === 0 ? -31 - r() * 3 : side === 1 ? 31 + r() * 3 : -31 + t * 62, z = side === 2 ? -35 - r() * 3 : side === 3 ? 43 + r() * 3 : -35 + t * 78;
    if (side === 3 && Math.abs(x) < 7) continue;
    const w = .8 + r() * 1.3; m4.compose(p.set(x, w * .4, z), q.identity(), sc.set(w * 1.4, w * .8, w * 1.4)); bush.setMatrixAt(bi, m4); bush.setColorAt(bi++, new THREE.Color(0x3d5f30).offsetHSL(0, 0, (r() - .5) * .08));
  }
  bush.count = bi; scene.add(bush);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a867d, roughness: .9, flatShading: true });
  for (const [x, z, w] of [[-29, 30, 2.2], [30, -12, 1.6], [-30, -28, 1.8], [28, 40, 2.6]]) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(w, 0), rockMat); rk.position.set(x, w * .35, z); rk.scale.y = .6; rk.rotation.y = x; scene.add(rk); }
}
