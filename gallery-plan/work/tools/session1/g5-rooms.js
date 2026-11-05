
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
function stampMark(key, x, z) {
  const g = new THREE.Group();
  const ring = panel(1.2, 1.2, (c, W, H) => { c.clearRect(0, 0, W, H); const gr = c.createRadialGradient(W / 2, H / 2, W * .18, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,240,200,.55)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }, { transparent: true, ppm: 200 });
  ring.material.depthWrite = false; ring.rotation.x = -Math.PI / 2; g.add(ring);
  const shell = cutout('img/shell-stamp.webp', .62); shell.rotation.x = -Math.PI / 2; shell.position.set(0, .004, .31); g.add(shell);
  g.position.set(x, .045, z); scene.add(g);
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
    for (const e of later.slice(0, 5)) {
      font(g, H * .058, 700, FONT_B); g.fillText(e.title, 0, y + H * .02);
      font(g, H * .034, 400, FONT_B, INK2); g.fillText(`${dfmt(e)}  ·  ${venue(e)}`, 0, y + H * .075);
      y += H * .14;
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
    const s = H * .78 / 46.4, ox = W * .5, oz = H * .2 + 27 * s;
    const R = (x0, z0, x1, z1, n, label, bold) => {
      g.strokeStyle = INK; g.lineWidth = bold ? 5 : 3; g.strokeRect(ox + x0 * s, oz + z0 * s, (x1 - x0) * s, (z1 - z0) * s);
      g.textAlign = 'center'; const cx = ox + (x0 + x1) / 2 * s, cz = oz + (z0 + z1) / 2 * s;
      if (n) { font(g, H * .03, 700, FONT_M, ACCENT); g.fillText(n, cx, cz - H * .018); }
      font(g, H * .036, 700, FONT_B); g.fillText(label, cx, cz + H * .026); g.textAlign = 'left';
    };
    R(-10.4, -27, 10.4, -9.4, '03', '일월오봉단관'); R(-21, -20, -10.4, 9.4, '01', '작품 전시관'); R(10.4, -20, 21, 9.4, '02', 'IP관');
    g.setLineDash([10, 8]); R(-8, -7, 8, 7, '', '중정'); g.setLineDash([]);
    R(-21, 9.4, -6, 19.4, '00', '작가소개'); R(-6, 9.4, 6, 19.4, '', '로비 · 현 위치', true); R(6, 9.4, 21, 19.4, '', '출구 라운지');
    g.fillStyle = '#b5432f'; g.beginPath(); g.arc(ox, oz + 16.6 * s, H * .012, 0, 7); g.fill();
    // 오른쪽: 순서와 도장
    const tx = W * .02;
    font(g, H * .036, 700, FONT_B); textBlock(g, ['관람 순서'], tx, H * .3, 0);
    font(g, H * .034, 400, FONT_B, INK2);
    textBlock(g, ['로비', '→ 00 작가소개', '→ 01 작품 전시관', '→ 중정', '→ 02 IP관', '→ 03 일월오봉단관', '→ 출구 라운지'], tx, H * .37, H * .05);
    font(g, H * .036, 700, FONT_B); g.fillText('조개 도장', tx, H * .76);
    font(g, H * .03, 400, FONT_B, INK2); textBlock(g, ['방마다 바닥의 조개 표시를', '밟으면 도장을 찍을 수 있습니다.', '다섯 개를 모으면 라운지에서', '멤버십 카드를 받을 수 있습니다.'], tx, H * .82, H * .045);
  });
  place(guide, ex, 2.25, 15.9, -1, 0);
  doorSign('출구 라운지', 'EXIT LOUNGE', ex, 3.45, 11.4, -1, 0, 2.2);
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
  // 안내 데스크
  boxMM(2.4, 4.8, 0, 1.0, 12.6, 13.3, M.white, [2.4, 2.4]); boxMM(2.35, 4.85, 1.0, 1.05, 12.55, 13.35, M.wood); solid(2.35, 4.85, 12.55, 13.35);
  const desk = letters(1.6, .24, (g, W, H) => { g.textAlign = 'center'; font(g, H * .5, 700, FONT_M, INK2); g.fillText('INFORMATION', W / 2, H * .7); }); place(desk, 3.6, .7, 13.32, 0, 1);
}

/* ───────── ⓪ 작가소개 ───────── */
{
  const AR = ROOMS.artist, wx = AR.x0 + .16;
  // 서쪽 벽: 작가 사진과 소개
  const frame = new THREE.Group();
  const photo = cutout('ip/artist-profile-1.webp', 2.4, { alpha: false }); frame.add(photo);
  place(frame, wx, .7, 16.6, 1, 0);
  const intro = letters(4.4, 2.9, (g, W, H) => {
    font(g, H * .045, 700, FONT_M, ACCENT); g.fillText('SHIN HAEDAL · 나전칠기 아티스트', 0, H * .06);
    font(g, H * .16, 400, FONT_K); g.fillText('신해달', 0, H * .24);
    font(g, H * .085, 400, FONT_K); textBlock(g, wrapText(g, ABOUT.head, W), 0, H * .4, H * .1);
    font(g, H * .05, 700, FONT_B); textBlock(g, wrapText(g, ABOUT.lead, W * .95), 0, H * .55, H * .07);
    font(g, H * .035, 400, FONT_B, '#3b342d'); textBlock(g, wrapText(g, ABOUT.intro.join(' '), W * .9), 0, H * .7, H * .062);
  });
  place(intro, wx, 1.95, 12.9, 1, 0);
  pickable(frame, { kind: 'About', title: '신해달 · 나전칠기 아티스트', body: [ABOUT.head + ' ' + ABOUT.lead, ...ABOUT.intro].join('\n\n'), img: 'ip/artist-profile-1.webp', links: [[SITE + '/about/', 'About 페이지']], focus: focusFrom(wx, 1.9, 14.6, 1, 0, 3.8) });
  // 북쪽 벽: Artist Note
  const nz = AR.z0 + .16;
  const note = letters(9.0, 3.1, (g, W, H) => {
    font(g, H * .04, 700, FONT_M, ACCENT); g.fillText('ARTIST NOTE', 0, H * .05);
    font(g, H * .088, 400, FONT_K); textBlock(g, ['쉽게 들어와서 오래 머무는 작업.', '순서가 다를 뿐, 깊이는 같습니다.'], 0, H * .17, H * .1);
    font(g, H * .027, 400, FONT_B, '#3b342d');
    // 세 단으로 나눠 여유 있게
    const cols = [[0, 1, 2], [3, 4, 5], [6, 7, 8]], cw = W * .29;
    cols.forEach((idx, c) => { let y = H * .4; idx.forEach(i => { if (ABOUT.note[i]) y = textBlock(g, wrapText(g, ABOUT.note[i], cw), c * W * .355, y, H * .05) + H * .035; }); });
  });
  place(note, -11.0, 1.95, nz, 0, 1);
  pickable(note, { kind: 'Artist Note', title: ABOUT.noteHead, body: ABOUT.note.join('\n\n'), img: 'ip/artist-profile-2-bg.webp', links: [[SITE + '/about/', 'About 페이지']], focus: focusFrom(-11.0, 1.9, nz, 0, 1, 4.6) });
  doorSign('① 작품 전시관', 'NEXT · WORKS', -17.25, 3.45, nz, 0, 1, 2.6);
  // 남쪽 벽: CV
  const sz = AR.z1 - .16;
  const byType = (t) => EXHIBITIONS.filter(e => e.type === t).sort((a, b) => b.start_date.localeCompare(a.start_date));
  const exLine = e => `${e.start_date.slice(0, 7).replace('-', '.')}  ${e.title}${TODAY < e.start_date ? ' (예정)' : ''}`;
  const cvWall = letters(13.4, 2.9, (g, W, H) => {
    font(g, H * .04, 700, FONT_M, ACCENT); g.fillText('CURRICULUM VITAE', 0, H * .05);
    font(g, H * .1, 400, FONT_K); g.fillText('CV', 0, H * .17);
    let x = 0;
    const col = (title, rows, w) => {
      font(g, H * .032, 700, FONT_M); g.fillText(title, x, H * .28);
      font(g, H * .03, 400, FONT_B, '#3b342d'); let y = H * .34;
      for (const r of rows) { for (const l of wrapText(g, r, w * .95)) { g.fillText(l, x, y); y += H * .045; } y += H * .008; }
      x += w;
    };
    const cw = W * .155;
    col('EDUCATION', CV[0][1].map(([d, t]) => `${d}  ${t}`), cw);
    col('CERTIFICATIONS', CV[1][1].map(([d, t]) => `${d}  ${t}`), cw);
    col('BRAND & ACTIVITIES', CV[2][1].map(([d, t]) => `${d}  ${t}`), cw);
    col('SOLO EXHIBITION', byType('개인전').map(exLine), cw * .85);
    const groups = byType('단체전').map(exLine), half = Math.ceil(groups.length / 2);
    col('GROUP EXHIBITIONS', groups.slice(0, half), cw * .95);
    col(' ', groups.slice(half), cw * .95);
    col('ART FAIRS', byType('아트페어').concat(byType('팝업')).map(exLine), cw);
  }, 300);
  place(cvWall, -13.5, 2.0, sz, 0, -1);
  pickable(cvWall, { kind: 'CV', title: '신해달 CV', body: CV.map(([s, r]) => s + '\n' + r.map(([d, t]) => `${d}  ${t}`).join('\n')).join('\n\n'),
    ex: EXHIBITIONS.slice().sort((a, b) => b.start_date.localeCompare(a.start_date)).map(e => `${e.start_date.replace(/-/g, '.')} – ${e.end_date.slice(5).replace('-', '.')} ${e.title}, ${e.venue}${TODAY < e.start_date ? ' (예정)' : ''}`), exTitle: 'EXHIBITIONS & PROJECTS',
    links: [[SITE + '/cv/', 'CV 페이지']], focus: focusFrom(-13.5, 1.9, sz, 0, -1, 4.4) });
  // 동쪽 벽: 언론 보도
  const ewx = AR.x1 - .16;
  const ph = letters(2.6, .5, (g, W, H) => { font(g, H * .2, 700, FONT_M, ACCENT); g.fillText('PRESS', 0, H * .26); font(g, H * .44, 400, FONT_K); g.fillText('언론 보도', 0, H * .82); });
  place(ph, ewx, 3.2, 17.4, -1, 0);
  PRESS.forEach(([outlet, date, title, url], i) => {
    const col = i % 3, row = Math.floor(i / 3), z = 18.3 - col * 2.0, y = 2.3 - row * 1.05;
    const p = letters(1.85, .9, (g, W, H) => {
      font(g, H * .1, 400, FONT_M, INK2); g.fillText(`${date.replace(/-/g, '.')} · ${outlet}`, 0, H * .14);
      font(g, H * .13, 700, FONT_B); textBlock(g, wrapText(g, title, W * .96).slice(0, 3), 0, H * .34, H * .16);
      font(g, H * .09, 700, FONT_M, ACCENT); g.fillText('READ ↗', 0, H * .9);
    });
    place(p, ewx, y, z, -1, 0);
    pickable(p, { kind: 'Press · ' + outlet, title, meta: date.replace(/-/g, '.'), body: '저의 작업이 다른 시선으로 읽히고 소개된 기록입니다.', links: [[url, '기사 원문 보기'], [SITE + '/press/', 'Press 페이지', true]], focus: focusFrom(ewx, y, z, -1, 0, 2.6) });
  });
  stampMark('artist', -13.5, 15.4);
}
