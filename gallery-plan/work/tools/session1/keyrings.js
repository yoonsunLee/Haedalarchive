/* ───────── 해달자개 샵: 한글자음·알파벳 자개키링 ───────── */
// 아이디어스 상품 정보(2026.11.02 확인): 3.2 × 3.2 cm, 천연자개 / 아크릴 3mm / 와이어링(외경 5 cm)
const KEY_HANGUL = 'https://www.idus.com/v2/product/9f8d64e8-06ca-4085-83ad-9f91aaef3937';
const KEY_ALPHA = 'https://www.idus.com/v2/product/2ab9d0b2-f5c7-4626-8fb4-55b81b0b3a77';
const KEY_SPEC = '3.2 × 3.2 cm · 천연자개, 아크릴 3mm · 와이어링 외경 5 cm';
const FONT_K = '"Black Han Sans", "IBM Plex Sans KR", sans-serif';
const keyrings = [];
// 전복 자개: 파랑·초록·보라가 물결처럼 흐르는 무늬
function abalone(g, w, h, rnd) {
  g.fillStyle = '#2d3f6b'; g.fillRect(0, 0, w, h);
  const hues = [175, 195, 215, 240, 265, 290, 320, 160];
  for (let i = 0; i < 160; i++) {
    const y0 = rnd() * h * 1.2 - h * .1, amp = 8 + rnd() * 30, f = .008 + rnd() * .02, ph = rnd() * 6.28;
    g.strokeStyle = `hsla(${hues[(rnd() * hues.length) | 0]} ${55 + rnd() * 35}% ${45 + rnd() * 35}% / ${.35 + rnd() * .45})`;
    g.lineWidth = 3 + rnd() * 16; g.beginPath();
    for (let x = -10; x <= w + 10; x += 8) { const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.7 + ph) * amp * .3; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 40; i++) {   // 밝게 번쩍이는 결
    const y0 = rnd() * h, f = .01 + rnd() * .02, ph = rnd() * 6.28;
    g.strokeStyle = `rgba(255,255,255,${.12 + rnd() * .25})`; g.lineWidth = 1 + rnd() * 3; g.beginPath();
    for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * f + ph) * 14; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 18; i++) {   // 어두운 물결 줄
    const y0 = rnd() * h, f = .01 + rnd() * .02, ph = rnd() * 6.28;
    g.strokeStyle = `rgba(15,20,45,${.25 + rnd() * .3})`; g.lineWidth = 1.5 + rnd() * 4; g.beginPath();
    for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * f + ph) * 18; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
}
// 글자 모양 판: 검은 테두리 안에 전복 자개, 위쪽에 고리 구멍
function keyringCanvases(ch, seed) {
  const S = 512, glyph = (g, fill, stroke, lw) => {
    g.font = `${ch === '♥' ? 400 : 400} ${ch.length > 1 ? 300 : 360}px ${FONT_K}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = lw;
    if (stroke) { g.strokeStyle = stroke; g.strokeText(ch, S / 2, S / 2 + 30); }
    if (fill) { g.fillStyle = fill; g.fillText(ch, S / 2, S / 2 + 30); }
  };
  // 글자 위쪽 끝을 찾아 고리 탭을 붙인다
  const probe = document.createElement('canvas'); probe.width = probe.height = S; const pg = probe.getContext('2d');
  glyph(pg, '#000', '#000', 30);
  const data = pg.getImageData(0, 0, S, S).data; let top = S, tx = S / 2;
  for (let y = 0; y < S && top === S; y++) for (let x = S * .3 | 0; x < S * .7; x++) if (data[(y * S + x) * 4 + 3] > 128) { top = y; tx = x; break; }
  // 실루엣(검정)
  const sil = document.createElement('canvas'); sil.width = sil.height = S; const sg = sil.getContext('2d');
  glyph(sg, '#0c0b0b', '#0c0b0b', 30);
  sg.fillStyle = '#0c0b0b'; sg.beginPath(); sg.arc(tx, top - 4, 22, 0, 7); sg.fill();
  sg.globalCompositeOperation = 'destination-out'; sg.beginPath(); sg.arc(tx, top - 8, 9, 0, 7); sg.fill(); sg.globalCompositeOperation = 'source-over';
  // 앞면: 실루엣 위에 안쪽으로 자개
  const front = document.createElement('canvas'); front.width = front.height = S; const fg = front.getContext('2d');
  fg.drawImage(sil, 0, 0);
  const inner = document.createElement('canvas'); inner.width = inner.height = S; const ig = inner.getContext('2d');
  glyph(ig, '#fff', null, 0);
  ig.globalCompositeOperation = 'destination-out'; glyph(ig, null, '#000', 14); ig.globalCompositeOperation = 'source-in';
  const pat = document.createElement('canvas'); pat.width = pat.height = S; abalone(pat.getContext('2d'), S, S, rng(seed)); ig.drawImage(pat, 0, 0);
  fg.drawImage(inner, 0, 0);
  const sheen = fg.createLinearGradient(0, 0, S, S); sheen.addColorStop(.2, 'rgba(255,255,255,.18)'); sheen.addColorStop(.5, 'rgba(255,255,255,0)');
  fg.globalCompositeOperation = 'source-atop'; fg.fillStyle = sheen; fg.fillRect(0, 0, S, S); fg.globalCompositeOperation = 'source-over';
  return { front, sil, hole: { x: tx / S - .5, y: .5 - (top - 8) / S } };
}
const keyEdgeMat = new THREE.MeshStandardMaterial({ color: 0x0c0b0b, roughness: .5 });
function keyringMesh(ch, seed, size) {
  // size: 판 한 변 길이. 아크릴 3mm 두께는 얇은 판을 겹쳐 흉내 낸다
  const k = new THREE.Group(), { front, sil, hole } = keyringCanvases(ch, seed);
  const ft = new THREE.CanvasTexture(front); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = maxAniso;
  const st = new THREE.CanvasTexture(sil); st.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Group(), pg = new THREE.PlaneGeometry(size, size), thick = size * .094;
  const face = new THREE.MeshPhysicalMaterial({ map: ft, alphaTest: .5, roughness: .18, clearcoat: 1, clearcoatRoughness: .04, iridescence: .7, iridescenceIOR: 1.4, side: THREE.DoubleSide });
  const edge = new THREE.MeshStandardMaterial({ map: st, alphaTest: .5, roughness: .5, side: THREE.DoubleSide });
  for (let i = 0; i <= 5; i++) { const m = new THREE.Mesh(pg, i === 5 ? face : edge); m.position.z = -thick + thick * i / 5; plate.add(m); }
  // 고리 구멍이 원점에 오도록 판을 내린다
  plate.position.set(-hole.x * size, -hole.y * size - size * .07, 0); k.add(plate);
  const jump = new THREE.Mesh(new THREE.TorusGeometry(size * .07, size * .013, 8, 24), keyEdgeMat); jump.position.y = -size * .02; jump.rotation.y = Math.PI / 2; k.add(jump);
  return { group: k, img: front };
}
// 와이어링(외경 5 cm)과 거기 매단 팬던트
function wireRing(pendants, size) {
  const g = new THREE.Group(), R = size * .78;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, size * .012, 8, 64), M.steel); ring.position.y = -R; g.add(ring);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(size * .03, size * .03, size * .12, 12), M.steel); cap.rotation.z = Math.PI / 2; cap.position.set(-R * .7, -R * .3, 0); g.add(cap);
  pendants.forEach((p, i) => { p.position.set((i - (pendants.length - 1) / 2) * size * 1.02, -2 * R + size * .02, .004 * i); g.add(p); });
  return g;
}
function keyInfo(ch, name, kind, i, total, img, focus) {
  const hangul = kind === 'hangul', sym = kind === 'symbol';
  return { kind: '해달자개', kicker: hangul ? `[공모전선정] 한글자음 자개키링 · ${i + 1} / ${total}` : sym ? '특수기호 자개 팬던트' : `자개 영어 키링 · 알파벳 이니셜 · ${i + 1} / ${total}`,
    title: name ? `${ch}  ${name}` : ch, meta: KEY_SPEC,
    body: (hangul ? '해달자개의 한글자음 자개스티커에서 시작된 한글자음 자개키링이에요. 세종시문화관광재단 [2025 한글상점 상품 브랜드] 공모전에 선정됐어요.'
      : sym ? '한글 자음이나 알파벳과 함께 조합할 수 있는 자개 기호 팬던트예요. 하트, 해시, 앰퍼샌드, 골뱅이, 카피라이트 다섯 가지가 있어요. 예) ⓒ해달 = ⓒ + ㅎ + ㄷ'
      : '알파벳 이니셜로 고르는 자개 키링이에요.') +
      '\n\n가방, 파우치, 열쇠에 포인트로 걸거나, 이니셜·가족 이름·반려동물 이름을 조합해 보세요. 자개는 천연 소재라 하나하나 빛깔이 조금씩 달라요.\n\n(전시장에서는 잘 보이도록 크게 걸었어요.)',
    img, links: [[hangul || sym ? KEY_HANGUL : KEY_ALPHA, '아이디어스에서 보기'], [SHOP_URL, '해달자개 브랜드샵', true]], focus };
}
function pegBoard(wall, u, bw, bh, by, items, cols, size, title, sub) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(bw, bh, .035); scaleBoxUV(geo, bw, bh, .035, .25, .25);
  const board = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: T.peg, roughness: .7 })); board.position.set(0, by, .02); g.add(board);
  spotOn(g, bw * 1.2, bh * 1.8, by + .3);
  const rows = Math.ceil(items.length / cols), dx = (bw - .5) / (cols - 1), dy = bh / rows;
  const W = WALLS[wall];
  items.forEach((it, i) => {
    const col = i % cols, row = (i / cols) | 0, n = Math.min(cols, items.length - row * cols);
    const hx = (col - (n - 1) / 2) * dx, hy = by + bh / 2 - .12 - row * dy;
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .1), M.steel); peg.rotation.x = Math.PI / 2; peg.position.set(hx, hy, .085); g.add(peg);
    const { group, img } = keyringMesh(it.ch, 200 + i * 7 + it.ch.charCodeAt(0), size);
    const ring = wireRing([group], size); ring.position.set(hx, hy + .005, .12); g.add(ring);
    const [vx, vz] = W.at(u + (wall === 's' ? -hx : hx), 1.7), [wx, wz] = W.at(u + (wall === 's' ? -hx : hx), 0);
    pickable(ring, keyInfo(it.ch, it.name, it.kind, it.idx, it.total, img.toDataURL('image/png'), { pos: [vx, vz], look: [wx, hy - size, wz] }));
    keyrings.push({ group: ring, phase: i * .7 });
  });
  const sTex = canvasTex(1400, 240, (g2, w, h) => {
    g2.clearRect(0, 0, w, h); g2.fillStyle = '#857c70'; g2.font = `500 36px ${FONT_B}`; g2.letterSpacing = '12px'; g2.fillText(sub, 4, 56);
    g2.letterSpacing = '0px'; g2.fillStyle = '#1d1815'; g2.font = `700 84px ${FONT_D}`; g2.fillText(title, 0, 170);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.5, .6), new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false }));
  sign.position.set(-bw / 2 + 1.75, by + bh / 2 + .42, .015); g.add(sign);
  onWall(g, wall, u, 0);
}
{
  const hangul = JAMO.map(([ch, name], i) => ({ ch, name, kind: 'hangul', idx: i, total: 14 }));
  const symbols = ['♥', '#', '&', '@', 'ⓒ'].map((ch, i) => ({ ch, name: ['하트', '해시', '앰퍼샌드', '골뱅이', '카피라이트'][i], kind: 'symbol', idx: i, total: 5 }));
  // 동쪽 벽: 한글자음 열네 자 + 특수기호 다섯
  pegBoard('e', 4.3, 5.4, 2.3, 1.45, [...hangul, ...symbols], 7, .2, '한글자음 자개키링 ㄱ–ㅎ', '해달자개 · [공모전선정] 2025 한글상점');
  // 남쪽 벽 안쪽: 알파벳 이니셜 A–Z
  const alpha = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((ch, i) => ({ ch, kind: 'alpha', idx: i, total: 26 }));
  pegBoard('s', 5.0, 5.0, 2.3, 1.45, alpha, 9, .17, '자개 영어 키링 A–Z', '해달자개 · 알파벳 이니셜');
}
// 계산대와 진열대
{
  boxMM(8.6, 12.2, 0, .98, 6.5, 7.45, M.wood, [.6, .6]);
  boxMM(8.55, 12.25, .98, 1.02, 6.45, 7.5, M.lacquer);
  solid(8.55, 12.25, 6.45, 7.5);
  const cTex = canvasTex(800, 220, (g, w, h) => {
    g.fillStyle = '#120c0a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8e1d5'; g.font = `400 70px ${FONT_D}`; g.fillText('해달자개', 40, 110);
    g.fillStyle = '#a59c90'; g.font = `400 34px ${FONT_B}`; g.fillText('아이디어스 · 한글상점 · 소담상회 인사점', 40, 175);
  });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .275), new THREE.MeshBasicMaterial({ map: cTex }));
  card.position.set(10.4, .62, 6.448); card.rotation.y = Math.PI; scene.add(card);
  const shopInfo = { kind: '해달자개', kicker: 'BRAND SHOP · ⓒ해달자개 by 신해달', title: '해달자개', meta: '2022 아이디어스 입점 · 2025 한글상점 · 소담상회 인사점 입점',
    body: '해달이 조개를 주워 와 자개 작품을 만든다는 이야기에서 이름을 붙인 나전칠기 브랜드예요. 직접 그린 동화 같은 자개 도안과 귀엽고 실용적인 디자인을 선보여요.\n\n모든 작품은 주문 승인 후 제작되며, 자개는 천연 소재라 색이 조금씩 달라요.',
    img: 'img/keyring-photo.webp', links: [[SHOP_URL, '브랜드샵 열기'], ['https://www.instagram.com/haedal_space/', '인스타그램', true]], focus: { pos: [10.4, 4.6], look: [10.4, .9, 6.5] } };
  pickable(card, shopInfo);
  // 진열대: ⓒ + ㅎ + ㄷ 로 'ⓒ해달'을 단 와이어링 하나를 크게
  boxMM(9.6, 11.4, 0, .8, -.9, .2, M.wood, [.6, .6]); boxMM(9.58, 11.42, .8, .83, -.92, .22, M.lacquer); solid(9.58, 11.42, -.92, .22);
  boxMM(10.48, 10.52, .83, 2.05, -.37, -.33, M.glass);
  const parts = ['ⓒ', 'ㅎ', 'ㄷ'].map((ch, i) => keyringMesh(ch, 400 + i, .3));
  const big = wireRing(parts.map(p => p.group), .3); big.position.set(10.5, 2.05, -.32); big.rotation.y = Math.PI * .72; scene.add(big);
  pickable(big, { kind: '해달자개', kicker: '진열대 · 조합해서 다는 키링', title: 'ⓒ해달 = ⓒ + ㅎ + ㄷ', meta: KEY_SPEC,
    body: '한 와이어링에 팬던트를 두 개까지 고를 수 있고, 세 개를 달고 싶으면 키링 두 개로 나눠 주문하면 돼요. 진열대에는 작가 이름 ⓒ해달을 크게 걸어 두었어요.',
    img: 'img/keyring-photo.webp', links: [[KEY_HANGUL, '아이디어스에서 보기']], focus: { pos: [8.2, 1.4], look: [10.5, 1.5, -.32] } });
  keyrings.push({ group: big, phase: 0, spin: true });
}
