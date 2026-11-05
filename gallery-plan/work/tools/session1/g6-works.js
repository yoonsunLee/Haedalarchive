
/* ───────── ① 작품 전시관: 자료를 받아 저절로 건다 ───────── */
// 묶음 = 연작(series_key가 같은 작품들) 또는 단독 작품. 묶음은 가장 새 작품 번호 순, 첫 묶음이 '신작'
// 걸 자리 = 입구에서 걷는 차례대로 서쪽 벽 → 북쪽 벽 → 동쪽 벽. 모자라면 방 가운데 가벽을 세운다
const parseSize = s => { const m = String(s).match(/([\d.]+)\s*×\s*([\d.]+)/); return m ? [parseFloat(m[1]), parseFloat(m[2])] : [30, 30]; };
const hangable = WORKS_INDEX.filter(w => w.id !== TOY_ID);
// 연작 안 순서: 아카이브에 series_order가 비어 있을 때 쓰는 작가 지정 순서
const ORDER_FALLBACK = { 'HD-2026-002': 1, 'HD-2026-011': 2, 'HD-2025-004': 3 };
const FIRST_WORK = 'HD-2026-001';
const units = (() => {
  const by = new Map();
  for (const w of hangable) { const k = w.series_key || '#' + w.id; if (!by.has(k)) by.set(k, []); by.get(k).push(w); }
  const out = [...by.entries()].map(([k, ws]) => {
    ws.sort((a, b) => (a.series_order ?? ORDER_FALLBACK[a.id] ?? 99) - (b.series_order ?? ORDER_FALLBACK[b.id] ?? 99) || a.id.localeCompare(b.id));
    return { key: k, series: !k.startsWith('#'), works: ws, newest: ws.reduce((m, w) => w.id > m ? w.id : m, '') };
  });
  out.sort((a, b) => b.newest.localeCompare(a.newest));
  // 작가 지정: 들어오자마자 처음 보이는 자리는 「이 세계의 얼빵해달, 저작인접권자가 되었다!」
  const fi = out.findIndex(u => u.works.some(w => w.id === FIRST_WORK));
  if (fi > 0) out.unshift(...out.splice(fi, 1));
  return out;
})();
const SERIES_NAME = { 'n-th-derivative': 'N차적 저작물', territory: '우주조약', pov: 'POV' };
for (const s of SERIES) if (s.name) SERIES_NAME[s.key] = s.name;
// 윗면 맞춤: 모든 작품의 윗면을 POV : 업무 중(53 cm)의 윗면 높이에 건다. 그 작품의 가운데가 눈높이 1.65 m
const TOP = 1.65 + .53 * SCALE / 2;
const GAP_IN = 1.45, GAP_UNIT = 2.6, CAP_W = 1.0;   // 작품 사이에 오른쪽 아래 캡션이 들어갈 자리
for (const u of units) {
  u.sizes = u.works.map(w => parseSize(w.size).map(v => v / 100 * SCALE));
  u.width = u.sizes.reduce((s, [w]) => s + w, 0) + (u.works.length - 1) * GAP_IN + CAP_W;
}
const WR = ROOMS.works, IN = .17;
// 벽면: 시작점, 진행 방향, 안쪽 방향, 길이
// 입구 가벽: 작가소개에서 들어서면 정면 가운데. 첫 묶음(FIRST_WORK) 하나만 걸린다
const ENTRY = { x0: (WR.x0 + WR.x1) / 2 - 1.6, x1: (WR.x0 + WR.x1) / 2 + 1.6, z0: 2.65, z1: 2.95 };
boxMM(ENTRY.x0, ENTRY.x1, 0, 3.0, ENTRY.z0, ENTRY.z1, M.white, [2.4, 2.4]); solid(ENTRY.x0, ENTRY.x1, ENTRY.z0, ENTRY.z1);
const slots = [
  { name: '입구 가벽', o: [ENTRY.x0, ENTRY.z1 + IN], d: [1, 0], n: [0, 1], len: ENTRY.x1 - ENTRY.x0 },
  { name: '서쪽 벽', o: [WR.x0 + IN, 8.2], d: [0, -1], n: [1, 0], len: 27.6 },
  { name: '북쪽 벽', o: [WR.x0 + .9, WR.z0 + IN], d: [1, 0], n: [0, 1], len: 4.6 },
  { name: '동쪽 벽', o: [WR.x1 - IN, -15.2], d: [0, 1], n: [-1, 0], len: 8.2 },
  { name: '동쪽 벽', o: [WR.x1 - IN, -1.6], d: [0, 1], n: [-1, 0], len: 9.6 },
];
const extra = [   // 가벽: 필요할 때만
  { name: '가벽', o: [-15.55, -12], d: [0, 1], n: [1, 0], len: 14, wall: [-15.85, -15.55, -12.3, 2.3] },
  { name: '가벽', o: [-16.15, 2], d: [0, -1], n: [-1, 0], len: 14, wall: null },
];
const workFocus = new Map(), workPlaced = [];
{
  // 1) 묶음을 벽면에 나눠 담기
  const fill = slots.map(s => ({ s, items: [], used: 0 }));
  let si = 0;
  for (const u of units) {
    while (true) {
      if (si >= fill.length) { const e = extra.shift(); if (!e) break; fill.push({ s: e, items: [], used: 0 }); if (e.wall) { boxMM(e.wall[0], e.wall[1], 0, 3.6, e.wall[2], e.wall[3], M.white, [2.4, 2.4]); solid(e.wall[0], e.wall[1], e.wall[2], e.wall[3]); } }
      const f = fill[si], need = (f.items.length ? GAP_UNIT : 0) + u.width;
      if (f.used + need <= f.s.len - .6 || (!f.items.length && u.width <= f.s.len)) { f.items.push(u); f.used += need; break; }
      si++;
    }
  }
  // 2) 벽면마다 남는 길이를 묶음 사이에 고르게 나눈다(너무 벌어지지 않게)
  // 캡션: 작품 오른쪽 아래, 벽에 바로 쓴 글자
  // 캡션: 작품 오른쪽, 마지막 줄이 작품 아랫면에 닿도록 아래에서부터 쌓는다
  const CAP_H = .62;
  const caption = (w) => letters(CAP_W - .08, CAP_H, (g, W, H) => {
    const D = DETAIL[w.id] || {}, rows = [];
    const add = (text, size, weight, fam, color, max = 2) => { font(g, H * size, weight, fam, color); for (const l of wrapText(g, text, W).slice(0, max)) rows.push([l, size, weight, fam, color]); };
    add(w.title, .13, 700, FONT_B, INK);
    add(w.title_en || D.en || '', .072, 400, FONT_M, INK2);
    add((D.medium || '').split(' · ')[0], .078, 400, FONT_B, '#3b342d');
    add(`${w.size} cm · ${w.year}`, .078, 400, FONT_B, '#3b342d', 1);
    let y = H - H * .03;
    for (let i = rows.length - 1; i >= 0; i--) { const [l, size, weight, fam, color] = rows[i]; font(g, H * size, weight, fam, color); g.fillText(l, 0, y); y -= H * size * 1.32; if (i === 2 || i === 1) y -= H * .01; }
  }, 520);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0f0c0b, roughness: .4 });
  for (const f of fill) {
    if (!f.items.length) continue;
    const slack = f.s.len - f.used, gapAdd = Math.min(1.2, slack / (f.items.length + 1));
    let a = (slack - gapAdd * (f.items.length - 1)) / 2;
    for (const [ui, u] of f.items.entries()) {
      if (ui) a += GAP_UNIT + gapAdd;
      if (u.series) {   // 연작 이름
        const nm = SERIES_NAME[u.key] || u.key;
        const lab = letters(3.0, .5, (g, W, H) => { font(g, H * .17, 700, FONT_M, ACCENT); g.fillText('SERIES', 0, H * .22); font(g, H * .5, 400, FONT_K); g.fillText(nm, 0, H * .86); });
        const p = [f.s.o[0] + f.s.d[0] * (a + 1.5), f.s.o[1] + f.s.d[1] * (a + 1.5)]; place(lab, p[0] + f.s.n[0] * .02, 3.35, p[1] + f.s.n[1] * .02, ...f.s.n);
      }
      u.works.forEach((w, k) => {
        if (k) a += GAP_IN;
        const [ww, hh] = u.sizes[k], c = a + ww / 2, cy = 1.55;
        const x = f.s.o[0] + f.s.d[0] * c, z = f.s.o[1] + f.s.d[1] * c, [nx, nz] = f.s.n;
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, .045), edgeMat); body.position.z = .0225; g.add(body);
        const t = tex(workImg(w)); const face = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), new THREE.MeshBasicMaterial({ map: t, color: 0xf2f2f2 })); face.position.z = .046; g.add(face);
        place(g, x, cy, z, nx, nz);
        const lb = caption(w), cc = ww / 2 + .12 + (CAP_W - .08) / 2; place(lb, x + f.s.d[0] * cc + nx * .01, cy - hh / 2 + CAP_H / 2, z + f.s.d[1] * cc + nz * .01, nx, nz);
        const D = DETAIL[w.id] || {};
        const info = { kind: D.en || w.title_en || w.id, title: w.title, meta: D.medium || `${w.year} · ${w.size} cm`, body: (D.body || []).join('\n\n'), ex: D.ex, img: workImg(w), id: w.id,
          links: [[`${SITE}/works/w/${w.id}/`, '작품 페이지'], [`${SITE}/contact/`, '작품 문의', true]], where: f.s.name, focus: focusFrom(x, cy, z, nx, nz, Math.max(2.4, hh * 1.6)) };
        pickable(g, info); pickable(lb, info);
        workFocus.set(w.id, info); workPlaced.push({ w, info });
        a += ww;
      });
      a += CAP_W;
    }
  }
}
// 도장 자리: 북동쪽 모서리 바닥의 조개 표시
const stampSpot = { x: -12.8, z: -17.6 };
stampMark('works', stampSpot.x, stampSpot.z);
doorSign('중정 · ② IP관 ↑', 'COURTYARD · NEXT', WR.x1 - .16, 3.6, -4.5, -1, 0, 3.0);
doorSign('← ⓪ 작가소개', 'ABOUT THE ARTIST', -17.25, 3.5, WR.z1 - .16, 0, -1, 2.6);
