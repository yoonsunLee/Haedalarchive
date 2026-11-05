
/* ───────── 누를 수 있는 것들 ───────── */
const pickables = [];
function pickable(obj, info) { obj.traverse(o => { if (o.isMesh) { o.userData.info = info; pickables.push(o); } }); return obj; }
// 벽 앞 물건 놓기: 벽 면(nx, nz = 방 안쪽 방향)에 붙인다
function place(obj, x, y, z, nx, nz) { obj.position.set(x, y, z); obj.rotation.y = Math.atan2(nx, nz); scene.add(obj); return obj; }
const focusFrom = (x, y, z, nx, nz, dist = 2.6) => ({ pos: [x + nx * dist, z + nz * dist], look: [x, y, z] });
const animators = [];   // 매 장면 부를 것: (t, dt, me) => {}

// 벽에 바로 쓴 글자(시트 커팅처럼): 바탕 없이 글자만
const INK = '#1d1a17', INK2 = '#6b635a', ACCENT = '#8a6a3a';
function letters(wm, hm, draw, ppm = 460) {
  const m = panel(wm, hm, (g, W, H) => { g.clearRect(0, 0, W, H); draw(g, W, H); }, { transparent: true, ppm });
  m.material.depthWrite = false; m.material.polygonOffset = true; m.material.polygonOffsetFactor = -2; m.renderOrder = 2;
  return m;
}
const font = (g, size, weight, fam, color = INK) => { g.font = `${weight} ${size}px ${fam}`; g.fillStyle = color; };
// 문 위 안내: 다음 방 이름과 화살표
function doorSign(text, sub, x, y, z, nx, nz, w = 2.4, align = 'center') {
  const s = letters(w, .42, (g, W, H) => {
    g.textAlign = align; const X = align === 'center' ? W / 2 : align === 'right' ? W : 0;
    font(g, H * .5, 400, FONT_K); g.fillText(text, X, H * .52);
    if (sub) { font(g, H * .2, 400, FONT_M, INK2); g.fillText(sub, X, H * .92); }
  });
  return place(s, x, y, z, nx, nz);
}
// 바닥 조개 도장 자리: 밟으면 도장이 찍힌다
const stampMarks = {};
function stampMark(key, x, z, size = 1) {
  const g = new THREE.Group();
  const ring = panel(1.2, 1.2, (c, W, H) => { c.clearRect(0, 0, W, H); const gr = c.createRadialGradient(W / 2, H / 2, W * .18, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,240,200,.55)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }, { transparent: true, ppm: 200 });
  ring.material.depthWrite = false; ring.rotation.x = -Math.PI / 2; g.add(ring);
  const shell = cutout('img/shell-stamp.webp', .62); shell.rotation.x = -Math.PI / 2; shell.position.set(0, .004, .31); g.add(shell);
  g.position.set(x, .045, z); g.scale.setScalar(size); scene.add(g);
  stampMarks[key] = { x, z, g, ring, shell };
}

// 홈페이지 첫 화면: 그리드 위 자개 해달. 바깥 디스플레이가 홈페이지처럼 천천히 움직이며 보여 준다
const HERO_W = 1280, HERO_H = 960;
const heroTex = canvasTex(HERO_W, HERO_H, () => {});
heroTex.wrapS = heroTex.wrapT = THREE.ClampToEdgeWrapping;
const heroOtter = new Image(); heroOtter.src = 'ip/mosaic-otter.webp';
function drawDiamond(g, x, y, r, a) {
  g.save(); g.translate(x, y); g.rotate(a);
  const faces = [['#d9d4cc', [0, -r], [r, 0], [0, 0]], ['#8a847b', [r, 0], [0, r], [0, 0]], ['#5c5750', [0, r], [-r, 0], [0, 0]], ['#b7b1a8', [-r, 0], [0, -r], [0, 0]]];
  for (const [c, p, q, o] of faces) { g.fillStyle = c; g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.lineTo(...o); g.fill(); }
  g.restore();
}
function drawHero(t) {
  const g = heroTex.image.getContext('2d'), W = HERO_W, H = HERO_H;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const cell = W / 12, off = (t * 6) % cell;
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2.2;
  for (let x = -cell + off; x < W + cell; x += cell) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = -cell + off * .5; y < H + cell; y += cell) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  if (heroOtter.complete && heroOtter.naturalWidth) {
    const s = 1 + Math.sin(t * .5) * .015, w = W * s, h = w * heroOtter.naturalHeight / heroOtter.naturalWidth;
    g.drawImage(heroOtter, (W - w) / 2, (H - h) / 2 + Math.sin(t * .8) * 8, w, h);
  }
  drawDiamond(g, W * .86, H * .17, 34, Math.sin(t * .6) * .25); drawDiamond(g, W * .15, H * .7, 28, Math.cos(t * .5) * .25);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, H * .76, W, H * .24);
  g.font = `400 ${H * .072}px ${FONT_K}`; g.fillStyle = '#e8e3dc';
  g.fillText('쉽게 들어와서 오래 머무는 작업.', W * .045, H * .86); g.fillText('순서가 다를 뿐, 깊이는 같습니다.', W * .045, H * .955);
  heroTex.needsUpdate = true;
}
let heroT = 0;
animators.push((t, dt) => { heroT += dt; if ((heroT * 30 | 0) !== ((heroT - dt) * 30 | 0)) drawHero(heroT); });

/* ───────── 로비 ───────── */
{
  const LB = ROOMS.lobby;
  // 서쪽 벽: 상설전시 · Upcoming(개막하면 Now on view) · 예정 전시
  const solo = EXHIBITIONS.find(e => e.type === '개인전' && e.end_date >= TODAY);
  const later = EXHIBITIONS.filter(e => e !== solo && e.start_date > TODAY).sort((a, b) => a.start_date.localeCompare(b.start_date));
  const dfmt = (e) => `${e.start_date.replace(/-/g, '.')} – ${e.end_date.slice(5).replace('-', '.')}`;
  const venue = e => e.venue.split(',').slice(0, 2).join(',');
  const dday = e => Math.round((Date.parse(e.start_date) - Date.parse(TODAY)) / 864e5);
  const wallX = LB.x0 + .16;
  // Upcoming → Now on view: 신해달 개인전
  if (solo) {
    const on = TODAY >= solo.start_date;
    const head = letters(2.3, .5, (g, W, H) => {
      font(g, H * .2, 700, FONT_M, on ? '#2f7d6d' : '#b5432f'); g.fillText(on ? 'NOW ON VIEW' : `UPCOMING · D-${dday(solo)}`, 0, H * .28);
      font(g, H * .44, 400, FONT_K); g.fillText('신해달 개인전', 0, H * .82);
    });
    place(head, wallX, 3.3, 17.5, 1, 0);
    const poster = cutout('ip/poster-EX-2026-01.webp', 1.95, { alpha: false });
    place(poster, wallX, .95, 18.0, 1, 0);
    const cap = letters(1.0, 1.4, (g, W, H) => {
      font(g, H * .085, 700, FONT_B); textBlock(g, wrapText(g, solo.title, W), 0, H * .1, H * .1);
      font(g, H * .05, 400, FONT_M, INK2); g.fillText(solo.title_en || '', 0, H * .3);
      font(g, H * .055, 500, FONT_B); textBlock(g, [dfmt(solo), venue(solo)], 0, H * .42, H * .075);
    });
    place(cap, wallX, 1.65, 16.55, 1, 0);
    const info = { kind: (on ? 'NOW ON VIEW' : 'UPCOMING') + ' · ' + solo.type, title: solo.title, meta: `${dfmt(solo)} · ${solo.venue}`, img: 'ip/poster-EX-2026-01.webp',
      exTitle: '출품작', ex: solo.work_nos.split(',').map(id => (WORKS_INDEX.find(w => w.id === id) || {}).title || id), links: [[SITE + '/', '홈페이지에서 보기']], focus: focusFrom(wallX, 2, 17.3, 1, 0, 3.6) };
    pickable(poster, info); pickable(cap, info);
  }
  // 예정 전시
  const up = letters(2.0, 2.6, (g, W, H) => {
    font(g, H * .045, 700, FONT_M, ACCENT); g.fillText('UPCOMING EXHIBITIONS', 0, H * .06);
    font(g, H * .11, 400, FONT_K); g.fillText('예정 전시', 0, H * .2);
    let y = H * .31;
    for (const e of later.slice(0, 4)) {   // 전시마다 한 줄 넉넉히 띄운다
      font(g, H * .058, 700, FONT_B); g.fillText(e.title, 0, y + H * .02);
      font(g, H * .034, 400, FONT_B, INK2); g.fillText(`${dfmt(e)}  ·  ${venue(e)}`, 0, y + H * .075);
      y += H * .18;
    }
  });
  place(up, wallX, 2.3, 14.15, 1, 0);
  pickable(up, { kind: 'UPCOMING EXHIBITIONS', title: '예정 전시', body: later.map(e => `${e.title}\n${dfmt(e)} · ${e.type} · ${e.venue}`).join('\n\n'), links: [[SITE + '/cv/', 'CV에서 보기']], focus: focusFrom(wallX, 2, 13.6, 1, 0, 3.4) });
  doorSign('⓪ 작가소개', 'ABOUT THE ARTIST', wallX, 3.45, 11.4, 1, 0, 2.2);
  // 동쪽 벽: 관람 안내도를 크게
  const ex = LB.x1 - .16;
  const guide = letters(5.6, 3.2, (g, W, H) => {
    font(g, H * .04, 700, FONT_M, ACCENT); g.fillText('VISITOR GUIDE', 0, H * .05);
    font(g, H * .1, 400, FONT_K); g.fillText('관람 안내', 0, H * .16);
    // 평면: 가는 선만
    const s = H * .78 / 46.4, ox = W * .6, oz = H * .2 + 27 * s;
    const R = (x0, z0, x1, z1, n, label, bold) => {
      g.strokeStyle = INK; g.lineWidth = bold ? 5 : 3; g.strokeRect(ox + x0 * s, oz + z0 * s, (x1 - x0) * s, (z1 - z0) * s);
      g.textAlign = 'center'; const cx = ox + (x0 + x1) / 2 * s, cz = oz + (z0 + z1) / 2 * s;
      if (n) { font(g, H * .03, 700, FONT_M, ACCENT); g.fillText(n, cx, cz - H * .018); }
      font(g, H * .036, 700, FONT_B); g.fillText(label, cx, cz + H * .026); g.textAlign = 'left';
    };
    R(-10.4, -27, 10.4, -9.4, '', '일월오봉단관'); R(-21, -20, -10.4, 9.4, '', '작품관'); R(10.4, -20, 21, 9.4, '', 'IP관');
    g.setLineDash([10, 8]); R(-8, -7, 8, 7, '', '중정'); g.setLineDash([]);
    R(-21, 9.4, -6, 19.4, '', '작가소개'); R(-6, 9.4, 6, 19.4, '', '로비', true); R(6, 9.4, 21, 19.4, '', '해달 라운지');
    g.fillStyle = '#b5432f'; g.beginPath(); g.arc(ox, oz + 16.6 * s, H * .012, 0, 7); g.fill();
    font(g, H * .022, 700, FONT_B, '#b5432f'); g.fillText('현 위치', ox + H * .02, oz + 16.6 * s + H * .008);
    // 왼쪽: 순서와 도장
    const tx = W * .02;
    font(g, H * .036, 700, FONT_B); textBlock(g, ['관람 순서'], tx, H * .3, 0);
    font(g, H * .032, 400, FONT_B, INK2);
    textBlock(g, ['로비', '→ 작가소개', '→ 작품관', '→ 중정', '→ IP관', '→ 일월오봉단관', '→ 해달 라운지'], tx, H * .37, H * .05);
    font(g, H * .036, 700, FONT_B); g.fillText('조개 도장', tx, H * .79);
    font(g, H * .03, 400, FONT_B, INK2); textBlock(g, ['숨어있는 조개 표시를 찾아보세요.', ...wrapText(g, '해달 라운지에서 멤버십 카드를 받을 수 있습니다.', ox - 21 * s - tx - H * .04)], tx, H * .86, H * .045);
  });
  place(guide, ex, 2.25, 15.9, -1, 0);
  doorSign('해달 라운지', 'HAEDAL LOUNGE', ex, 3.45, 11.4, -1, 0, 2.2);
  // 남쪽 벽: 갤러리 이름(나갈 때 보인다)과 해달자개 샵 배너
  const nm = letters(4.4, .7, (g, W, H) => { g.textAlign = 'center'; font(g, H * .5, 400, FONT_K); g.fillText('신해달 갤러리', W / 2, H * .6); font(g, H * .18, 700, FONT_M, INK2); g.fillText('SHIN HAEDAL GALLERY', W / 2, H * .92); });
  place(nm, 0, 4.6, LB.z1 - .16, 0, -1);
  // 해달자개 샵: 바탕 없이 벽에 로고와 글자만(들어온 쪽에서 보면 입구 왼쪽)
  const shop = letters(1.7, 2.3, (g, W, H) => {
    g.textAlign = 'center'; font(g, H * .062, 700, FONT_B, '#2b5fc9'); g.fillText('해달자개 브랜드샵', W / 2, H * .84);
    font(g, H * .036, 400, FONT_M, '#6b7fae'); g.fillText('idus · 브랜드샵 바로가기 ↗', W / 2, H * .92);
    const img = new Image(); img.src = 'img/haedal-jagae-logo.webp'; img.onload = () => { const w = W * .86, h = w * img.height / img.width; g.drawImage(img, (W - w) / 2, H * .04, w, h); shop.material.map.needsUpdate = true; };
  });
  place(shop, 3.9, 1.95, LB.z1 - .16, 0, -1);
  pickable(shop, { kind: 'Brand Shop', title: '해달자개 브랜드샵', body: '한글자음 자개키링과 알파벳 자개키링, 나전칠기 굿즈는 아이디어스 해달자개 브랜드샵에서 만날 수 있어요.', img: 'img/haedal-jagae-logo.webp', links: [[SHOP_URL, '브랜드샵 바로가기']] });
  // 인포메이션 테이블은 두지 않는다: 들어서면 정면 유리 너머 중정과 일월오봉단관까지 시야가 비어 있게
}

/* ───────── ⓪ 작가소개 ───────── */
{
  const AR = ROOMS.artist, wx = AR.x0 + .16;
  // 글씨는 일월오봉단관 소개글과 같은 기준: 벽에는 큰 제목과 요점만, 본문 15 cm 에 한 줄 17~18자. 긴 글과 목록은 눌렀을 때 뜨는 창으로
  const CM = (hm, H, cm) => H * cm / 100 / hm;   // 패널 높이 hm(m) 안에서 cm 크기 글자의 px
  // 서쪽 벽: 작가 사진과 About
  const frame = new THREE.Group();
  const photo = cutout('ip/artist-profile-1.webp', 2.4, { alpha: false }); frame.add(photo);
  place(frame, wx, .7, 16.6, 1, 0);
  const aboutInfo = { kind: 'About', title: '신해달 · 나전칠기 아티스트', body: [ABOUT.head + ' ' + ABOUT.lead, ...ABOUT.intro].join('\n\n'), img: 'ip/artist-profile-1.webp', links: [[SITE + '/about/', 'About 페이지']], focus: focusFrom(wx, 1.9, 14.6, 1, 0, 3.8) };
  // About 글은 원래 글 전부를 벽에: 이름, 한 줄 소개, 첫 문장, 세 단락
  const IH = 3.0, intro = letters(3.6, IH, (g, W, H) => {
    const cm = c => CM(IH, H, c);
    font(g, cm(7), 700, FONT_M, ACCENT); g.fillText('ABOUT', 0, cm(8));
    font(g, cm(31), 400, FONT_K); g.fillText('신해달', 0, cm(44));
    font(g, cm(7), 700, FONT_M, INK2); g.fillText('SHIN HAEDAL · 나전칠기 아티스트', 0, cm(58));
    font(g, cm(15), 400, FONT_K); let y = textBlock(g, wrapText(g, ABOUT.head, W), 0, cm(88), cm(21));
    font(g, cm(10), 700, FONT_B, '#3b342d'); y = textBlock(g, wrapText(g, ABOUT.lead, W), 0, y + cm(8), cm(16));
    font(g, cm(8.5), 400, FONT_B, '#3b342d');
    for (const t of ABOUT.intro) y = textBlock(g, wrapText(g, t, W), 0, y + cm(10), cm(14.5));
  });
  place(intro, wx, 1.95, 12.7, 1, 0);
  pickable(frame, aboutInfo); pickable(intro, aboutInfo);
  // 북쪽 벽: Artist Note. 왼쪽 벽에는 ARTIST NOTE와 같은 크기의 제목 세 줄, 오른쪽 디스플레이에는 본문이
  // 한 단락씩 올라와 잠깐 머물고 다음으로 넘어간다(강조 줄은 조금 더 오래). 움직임 줄이기면 첫 단락에 멈춘다
  const nz = AR.z0 + .16, NH = 2.6;
  const noteText = ABOUT.note.map(t => t.replace(/^[>!]/, ''));
  const noteInfo = { kind: 'Artist Note', title: ABOUT.noteHead, body: noteText.join('\n\n'), img: 'ip/artist-profile-2-bg.webp', links: [[SITE + '/about/', 'About 페이지']], focus: focusFrom(-10.9, 2.2, nz, 0, 1, 6.2) };
  // 제목 묶음은 작품관 문 오른쪽 끝(x −16)과 디스플레이 왼쪽 테(x −12.15) 사이 한가운데에 둔다
  const HEAD_L = -16, HEAD_R = -12.15, headLines = ['쉽게 들어와서', '오래 머무는 작업.', '순서가 다를 뿐, 깊이는 같습니다.'];
  const noteHead = letters(HEAD_R - HEAD_L, NH, (g, W, H) => {
    const cm = c => CM(NH, H, c);
    font(g, cm(20), 400, FONT_K); const bw = Math.max(...headLines.map(l => g.measureText(l).width)), x0 = (W - bw) / 2;
    textBlock(g, headLines, x0, cm(58), cm(32));
    font(g, cm(7), 700, FONT_M, ACCENT); g.fillText('ARTIST NOTE', x0, cm(8));
  });
  place(noteHead, (HEAD_L + HEAD_R) / 2, 2.2, nz, 0, 1);
  pickable(noteHead, noteInfo);
  {
    const DW = 5.6, DH = 3.3, PPM = 300, cx = -9.3, cy = 2.2;   // 제목 바로 옆에 크게
    boxMM(cx - DW / 2 - .05, cx + DW / 2 + .05, cy - DH / 2 - .05, cy + DH / 2 + .05, nz - .02, nz + .06, M.steel);
    const c = document.createElement('canvas'); c.width = DW * PPM; c.height = DH * PPM;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    place(scr, cx, cy, nz + .07, 0, 1); pickable(scr, noteInfo);
    const W = c.width, H = c.height, g = c.getContext('2d'), px = cm => cm / 100 * PPM, pad = px(30), lh = px(24);
    // 단락을 위에서부터 이어 붙인 긴 두루마리. 각 단락의 시작 높이를 기억해 그 자리로 올려 멈춘다
    let blocks = [], total = 0;
    const layout = () => {
      blocks = []; let y = 0;
      for (const raw of ABOUT.note) {
        const key = raw[0] === '!', start = raw[0] === '>', txt = raw.replace(/^[>!]/, '');
        g.font = `${key ? 700 : 400} ${px(15)}px ${FONT_B}`;
        if (start && blocks.length) y += px(18);
        const lines = wrapText(g, txt, W - pad * 2);
        blocks.push({ y, lines, key, hold: 2.6 + txt.length * .055 + (key ? 2 : 0) });
        y += lines.length * lh + px(14);
      }
      total = y;
    };
    const paint = (off) => {
      g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, W, H);
      g.textBaseline = 'alphabetic';
      for (const b of blocks) b.lines.forEach((l, i) => {
        const y = pad + px(15) + b.y + i * lh - off; if (y < -lh || y > H + lh) return;
        g.font = `${b.key ? 700 : 400} ${px(15)}px ${FONT_B}`; g.fillStyle = b.key ? '#c9a86a' : '#efe9df'; g.fillText(l, pad, y);
      });
      // 위아래 가장자리는 어둠 속으로 흐리게
      for (const [y0, y1] of [[0, pad * 1.3], [H, H - pad * 1.6]]) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(11,11,12,1)'); gr.addColorStop(1, 'rgba(11,11,12,0)'); g.fillStyle = gr; g.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)); }
      t.needsUpdate = true;
    };
    layout(); paint(0);
    document.fonts.addEventListener('loadingdone', () => { layout(); paint(blocks[idx] ? blocks[idx].y : 0); });
    let idx = 0, from = 0, to = 0, k = 1, wait = blocks[0].hold;
    if (!reduceMotion) animators.push((time, dt) => {
      if (k < 1) { k = Math.min(1, k + dt / 1.4); const e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; paint(from + (to - from) * e); return; }
      if ((wait -= dt) > 0) return;
      const next = (idx + 1) % blocks.length;
      from = blocks[idx].y; to = next === 0 ? 0 : blocks[next].y; idx = next; k = next === 0 ? .999 : 0; wait = blocks[idx].hold + (next === 0 ? 1.5 : 0);
      if (next === 0) paint(0);   // 끝까지 읽으면 처음으로 돌아간다
    });
  }
  doorSign('① 작품관', 'NEXT · WORKS', -17.25, 3.45, nz, 0, 1, 2.6);
  // 남쪽 벽: CV. 학력 · 자격 · 브랜드와 활동을 분류별 세 단으로. 전시 이력은 눌렀을 때 뜨는 창에
  const sz = AR.z1 - .16, CH = 2.9;
  const cvWall = letters(11.4, CH, (g, W, H) => {
    font(g, CM(CH, H, 7), 700, FONT_M, ACCENT); g.fillText('CURRICULUM VITAE', 0, CM(CH, H, 8));
    font(g, CM(CH, H, 31), 400, FONT_K); g.fillText('CV', 0, CM(CH, H, 44));
    const cw = W / 3, heads = [['학력', 'EDUCATION'], ['자격', 'CERTIFICATIONS'], ['브랜드와 활동', 'BRAND & ACTIVITIES']];
    CV.forEach(([, rows], c) => {
      const x = c * cw;
      font(g, CM(CH, H, 17), 400, FONT_K); g.fillText(heads[c][0], x, CM(CH, H, 80));
      font(g, CM(CH, H, 6), 700, FONT_M, INK2); g.fillText(heads[c][1], x, CM(CH, H, 92));
      let y = CM(CH, H, 120);
      for (const [d, t] of rows) {
        font(g, CM(CH, H, 8), 700, FONT_M, ACCENT); g.fillText(d, x, y); y += CM(CH, H, 18);
        font(g, CM(CH, H, 15), 500, FONT_B, '#3b342d'); for (const l of wrapText(g, t, cw * .9)) { g.fillText(l, x, y); y += CM(CH, H, 21); }
        y += CM(CH, H, 9);
      }
    });
  }, 300);
  place(cvWall, -13.5, 2.0, sz, 0, -1);
  pickable(cvWall, { kind: 'CV', title: '신해달 CV', body: CV.map(([s, r]) => s + '\n' + r.map(([d, t]) => `${d}  ${t}`).join('\n')).join('\n\n'),
    ex: EXHIBITIONS.slice().sort((a, b) => b.start_date.localeCompare(a.start_date)).map(e => `${e.start_date.replace(/-/g, '.')} – ${e.end_date.slice(5).replace('-', '.')} ${e.title}, ${e.venue}${TODAY < e.start_date ? ' (예정)' : ''}`), exTitle: 'EXHIBITIONS & PROJECTS',
    links: [[SITE + '/cv/', 'CV 페이지']], focus: focusFrom(-13.5, 1.9, sz, 0, -1, 4.4) });
  // 언론 보도는 작가소개에 두지 않는다(홈페이지 Press 페이지에서)
  stampMark('artist', -19.5, 14.6, .7);   // 작가 사진과 About 글 바로 앞, 조금 작게
}
