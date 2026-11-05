
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

/* ───────── 바깥: 광장, 처마 아래 세로 현수막 한 쌍, 대형 디스플레이, 이름 ───────── */
// 현수막은 로비 입구 양옆에 같은 것 두 장: 신해달 개인전 홍보(로비 서쪽 벽과 같은 전시, 개막 전 UPCOMING · D-n → 개막하면 NOW ON VIEW).
// 걸 개인전이 없으면 갤러리 이름을 세로로. 양옆 채의 지붕 밑으로 내려 걸어 처마에 닿지 않게 한다
const banners = [];
{
  const LOCAL_POSTER = new Set(['EX-2026-01']);
  const solo = EXHIBITIONS.filter(e => e.type === '개인전' && e.home_mode !== 'hide' && e.end_date >= TODAY).sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
  const dfmt = e => `${e.start_date.replace(/-/g, '.')} – ${e.end_date.slice(5).replace('-', '.')}`;
  const dday = e => Math.round((Date.parse(e.start_date) - Date.parse(TODAY)) / 864e5);
  const W_ = 2.0, H_ = 4.9, TOP = 5.9, PPM = 240;
  for (const x of [-4.2, 4.2]) {
    const ex = solo, upcoming = solo && TODAY < solo.start_date, label = upcoming ? 'UPCOMING' : 'NOW ON VIEW';
    const c = document.createElement('canvas'); c.width = W_ * PPM; c.height = H_ * PPM;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    let cur = null;
    const paint = (img = cur) => {
      cur = img;
      const g = c.getContext('2d'), W = c.width, H = c.height, pad = W * .08;
      g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, W, H);   // 개인전 포스터와 같은 검정 바탕
      g.textBaseline = 'alphabetic';
      if (!ex) {   // 걸 전시가 없을 때: 갤러리 이름만 세로로
        g.fillStyle = '#c9a86a'; g.font = `700 ${W * .065}px ${FONT_M}`; g.textAlign = 'center'; g.fillText('SHIN HAEDAL GALLERY', W / 2, H * .1);
        g.fillStyle = '#efe9df'; g.font = `400 ${W * .3}px ${FONT_K}`;
        [...'신해달갤러리'].forEach((ch, i) => g.fillText(ch, W / 2, H * .28 + i * W * .36));
        t.needsUpdate = true; return;
      }
      g.textAlign = 'left';
      g.fillStyle = '#c9a86a'; g.font = `700 ${W * .075}px ${FONT_M}`;
      g.fillText(upcoming ? `${label} · D-${dday(ex)}` : label, pad, H * .075);
      let y = H * .11;
      if (img) { const iw = W - pad * 2, ih = iw * img.height / img.width; g.drawImage(img, pad, y, iw, ih); y += ih + H * .05; }
      else y += H * .06;
      g.fillStyle = '#c9a86a'; g.font = `500 ${W * .05}px ${FONT_B}`; g.fillText(ex.type, pad, y); y += W * .1;
      g.fillStyle = '#efe9df'; g.font = `400 ${W * (img ? .095 : .13)}px ${FONT_K}`;
      for (const l of wrapText(g, ex.title, W - pad * 2)) { g.fillText(l, pad, y); y += W * (img ? .12 : .16); }
      if (ex.title_en) { g.fillStyle = '#b9b4ab'; g.font = `400 ${W * .045}px ${FONT_M}`; for (const l of wrapText(g, ex.title_en, W - pad * 2)) { g.fillText(l, pad, y); y += W * .065; } }
      y += W * .04; g.fillStyle = '#efe9df'; g.font = `500 ${W * .06}px ${FONT_B}`; g.fillText(dfmt(ex), pad, y);
      y += W * .085; g.fillText(ex.venue.split(',').slice(0, 2).join(','), pad, y);
      g.fillStyle = '#c9a86a'; g.font = `700 ${W * .045}px ${FONT_M}`; g.fillText('SHIN HAEDAL GALLERY', pad, H - pad);
      t.needsUpdate = true;
    };
    paint(null);
    if (ex && (LOCAL_POSTER.has(ex.id) || ex.poster_url)) {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => paint(img);
      img.src = LOCAL_POSTER.has(ex.id) ? `ip/poster-${ex.id}.webp` : `${SITE}/${ex.poster_url}`;
    }
    document.fonts.addEventListener('loadingdone', () => paint());   // 글꼴이 늦게 오면 다시 그린다
    const geo = new THREE.PlaneGeometry(W_, H_, 6, 24);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: .85, side: THREE.DoubleSide }));
    mesh.position.set(x, TOP - H_ / 2, 19.9); scene.add(mesh);
    // 위아래 가는 검은 봉, 위 봉은 벽에서 나온 짧은 받침 둘에 걸린다
    for (const yy of [TOP + .03, TOP - H_ - .03]) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, W_ + .12, 10), M.steel); bar.rotation.z = Math.PI / 2; bar.position.set(x, yy, 19.9); scene.add(bar); }
    for (const sx of [-1, 1]) boxMM(x + sx * (W_ / 2 - .1) - .02, x + sx * (W_ / 2 - .1) + .02, TOP + .01, TOP + .05, 19.55, 19.9, M.steel);
    banners.push({ mesh, base: geo.attributes.position.array.slice(), h: H_, phase: x });
    if (ex) pickable(mesh, { kind: (upcoming ? `UPCOMING · D-${dday(ex)}` : 'NOW ON VIEW') + ' · ' + ex.type, title: ex.title, meta: `${dfmt(ex)} · ${ex.venue}`,
      img: LOCAL_POSTER.has(ex.id) ? `ip/poster-${ex.id}.webp` : ex.poster_url ? `${SITE}/${ex.poster_url}` : undefined,
      exTitle: ex.work_nos ? '출품작' : undefined, ex: ex.work_nos ? ex.work_nos.split(',').map(id => (WORKS_INDEX.find(w => w.id === id.trim()) || {}).title || id) : undefined,
      links: [[SITE + '/', '홈페이지에서 보기']], focus: { pos: [x, 27.5], look: [x, 5.0, 19.9] } });
  }
  // 라운지 바깥벽: 홈페이지 첫 화면을 띄운 디스플레이(4:3, 테두리만 가늘게)
  const dH = 4.9, dW = dH * HERO_W / HERO_H;   // 라운지 바깥벽(높이 6 m)을 시원하게 채운다
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
