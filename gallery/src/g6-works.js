
/* ───────── ① 작품 전시관: 자료를 받아 저절로 건다 ───────── */
// 묶음 = 연작(series_key가 같은 작품들) 또는 단독 작품. 묶음은 가장 새 작품 번호 순, 첫 묶음이 '신작'
// 걸 자리 = 방마다 걷는 차례대로 벽면을 채운다. 모자라면 가벽을 세운다. 벽면의 d는 보는 사람의 오른쪽(캡션이 작품 오른쪽 아래에 오게)
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
// 방 나누기: 연작은 연작 방으로, 연작이 아닌 작품은 룸1 법과 권리로(gallery.json에 섹션이 생기면 그것을 따른다)
const ROOM_OF = w => ({ pov: 'pov', territory: 'territory', 'n-th-derivative': 'nth' })[w.series_key] || 'law';
const lawUnits = units.filter(u => ROOM_OF(u.works[0]) === 'law'), restUnits = units.filter(u => !['law', 'pov', 'territory'].includes(ROOM_OF(u.works[0])));

/* 안쪽 공간은 바깥 건물 크기에 매이지 않는다(작가님 결정). 방마다 INTERIORS에 넣어 두면,
   그 안에 있을 때는 방을 파고드는 바깥 건물을 숨기고, 밖(중정·바깥 등)에 있을 때는 안쪽 공간을 숨긴다 */
const INTERIORS = [];
// 이어 붙이기(작가님 결정: 가상공간이라 장면을 실제 길로 다 잇지 않는다). 장면은 떨어진 섬이고, 통로 끝 문과 다음 장면의 첫 문을 똑같이 만들어 두면
// 문을 지나는 순간 관람객(과 카메라·발자국)을 다음 섬의 같은 자리로 옮긴다. a·b: [x, z, yaw] = 문 가운데와 앞으로 지나가는 방향(yaw 0 = 북쪽), w: 문 폭
const LINKS = {}, PORTALS = [];
function linkInteriors(a, b) { (LINKS[a] = LINKS[a] || new Set()).add(b); (LINKS[b] = LINKS[b] || new Set()).add(a); }   // 이웃: 안에 있으면 이웃만 함께 보인다
function portal(a, b, w, from, to) { PORTALS.push({ a, b, w }); linkInteriors(from, to); }
function interior(name, rects, box, build, near = null, zone = 'works') {   // zone: 그 안에 있을 때의 구역(메뉴 표시)   // rects: 걸어 다니는 칸 [x0, x1, z0, z1] / box: 방 테두리 [x0, x1, z0, z1, 높이] / near: [x, z, r] 밖에서도 이 거리 안이면 보인다(중정 문 너머처럼)
  const n0 = scene.children.length, c0 = colliders.length;
  build();
  const objs = scene.children.slice(n0);
  for (const o of objs) if (o.isMesh && o.material === M.white && o.geometry.type === 'BoxGeometry') blockers.push(o);   // 카메라가 벽을 넘지 않게
  INTERIORS.push({ name, rects, box, objs, cols: colliders.slice(c0), near, zone });
}

// 걸기: 묶음을 벽면에 차례로 담고, 벽면마다 남는 길이를 묶음 사이에 고르게 나눈다
const workFocus = new Map(), workPlaced = [];
const CAP_H = .62;
const caption = (w, light) => letters(CAP_W - .08, CAP_H, (g, W, H) => {   // light: 어두운 벽용 밝은 글자   // 작품 오른쪽, 마지막 줄이 작품 아랫면에 닿도록 아래에서부터 쌓는다
  const D = DETAIL[w.id] || {}, rows = [];
  const add = (text, size, weight, fam, color, max = 2) => { font(g, H * size, weight, fam, color); for (const l of wrapText(g, text, W).slice(0, max)) rows.push([l, size, weight, fam, color]); };
  const c1 = light ? '#ece6dc' : INK, c2 = light ? '#b9b2a6' : INK2, c3 = light ? '#cfc8bc' : '#3b342d';
  add(w.title, .13, 700, FONT_B, c1);
  add(w.title_en || D.en || '', .072, 400, FONT_M, c2);
  add((D.medium || '').split(' · ')[0], .078, 400, FONT_B, c3);
  add(`${w.size} cm · ${w.year}`, .078, 400, FONT_B, c3, 1);
  let y = H - H * .03;
  for (let i = rows.length - 1; i >= 0; i--) { const [l, size, weight, fam, color] = rows[i]; font(g, H * size, weight, fam, color); g.fillText(l, 0, y); y -= H * size * 1.32; if (i === 2 || i === 1) y -= H * .01; }
}, 520);
const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0f0c0b, roughness: .4 });
// 작품 한 점: (x, cy, z)에 n 쪽을 보게 걸고, 캡션은 d(보는 사람의 오른쪽) 쪽 아래. capAt: 캡션 자리를 따로 줄 때 [x, z]
function putWork(w, ww, hh, x, cy, z, [nx, nz], [dx, dz], light, where, capAt) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, .045), edgeMat); body.position.z = .0225; g.add(body);
  const t = tex(workImg(w)); const face = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), new THREE.MeshBasicMaterial({ map: t, color: 0xf2f2f2 })); face.position.z = .046; g.add(face);
  place(g, x, cy, z, nx, nz);
  const lb = caption(w, light), cc = ww / 2 + .12 + (CAP_W - .08) / 2, [lx, lz] = capAt || [x + dx * cc + nx * .01, z + dz * cc + nz * .01];
  place(lb, lx, cy - hh / 2 + CAP_H / 2, lz, nx, nz);
  const D = DETAIL[w.id] || {};
  const info = { kind: D.en || w.title_en || w.id, title: w.title, meta: D.medium || `${w.year} · ${w.size} cm`, body: (D.body || []).join('\n\n'), ex: D.ex, img: workImg(w), id: w.id,
    links: [[`${SITE}/works/w/${w.id}/`, '작품 페이지'], [`${SITE}/contact/`, '작품 문의', true]], where, focus: focusFrom(x, cy, z, nx, nz, Math.max(2.4, hh * 1.6)) };
  pickable(g, info); pickable(lb, info);
  workFocus.set(w.id, info); workPlaced.push({ w, info });
}
function hang(list, slots, extra = []) {
  const fill = slots.map(s => ({ s, items: [], used: 0 }));
  let si = 0;
  for (const u of list) {
    while (true) {
      if (si >= fill.length) { const e = extra.shift(); if (!e) break; fill.push({ s: e, items: [], used: 0 }); if (e.wall) { boxMM(e.wall[0], e.wall[1], 0, 3.6, e.wall[2], e.wall[3], M.white, [2.4, 2.4]); solid(e.wall[0], e.wall[1], e.wall[2], e.wall[3]); } }
      const f = fill[si], need = (f.items.length ? GAP_UNIT : 0) + u.width;
      if (f.used + need <= f.s.len - .6 || (!f.items.length && u.width <= f.s.len)) { f.items.push(u); f.used += need; break; }
      si++;
    }
  }
  for (const f of fill) {
    if (!f.items.length) continue;
    const slack = f.s.len - f.used, gapAdd = Math.min(1.2, slack / (f.items.length + 1));
    let a = (slack - gapAdd * (f.items.length - 1)) / 2;
    for (const [ui, u] of (f.s.rev ? [...f.items].reverse() : f.items).entries()) {   // rev: 걷는 차례가 벽의 오른쪽에서 왼쪽일 때
      if (ui) a += GAP_UNIT + gapAdd;
      if (u.series) {   // 연작 이름
        const nm = SERIES_NAME[u.key] || u.key;
        const lab = letters(3.0, .5, (g, W, H) => { font(g, H * .17, 700, FONT_M, ACCENT); g.fillText('SERIES', 0, H * .22); font(g, H * .5, 400, FONT_K); g.fillText(nm, 0, H * .86); });
        const p = [f.s.o[0] + f.s.d[0] * (a + 1.5), f.s.o[1] + f.s.d[1] * (a + 1.5)]; place(lab, p[0] + f.s.n[0] * .02, 3.35, p[1] + f.s.n[1] * .02, ...f.s.n);
      }
      u.works.forEach((w, k) => {
        if (k) a += GAP_IN;
        const [ww, hh] = u.sizes[k], c = a + ww / 2, cy = Math.max(TOP - hh / 2, .9 + hh / 2);   // 윗면을 한 줄(TOP)에 맞춘다(작가님 규칙). 아주 큰 작품만 아랫면이 0.9 m 아래로 내려가지 않게 올린다
        const x = f.s.o[0] + f.s.d[0] * c, z = f.s.o[1] + f.s.d[1] * c;
        putWork(w, ww, hh, x, cy, z, f.s.n, f.s.d, f.s.light, f.s.name);
        a += ww;
      });
      a += CAP_W;
    }
  }
}

/* ── 룸1 법과 권리 + 문턱① ── */
// 문턱①: 작가소개 북쪽 문에서 곧게 5 m(폭 2.6, 천장 2.6). 한지 광천장이 60 cm 띠로 좁아져 따라오고, 바닥이 바뀌는 문턱에 놋쇠 띠.
//        끝의 놋쇠 문틀(2.4 × 2.4) 안에 6 m 뒤 가벽의 첫 작품만 액자처럼 들어온다. 통로 벽에는 글을 두지 않는다(작가님 결정)
// 룸1: 12 × 10 m, 천장 4.5 m. 흰 벽과 밝은 나무 바닥에 작품만. 정면 가벽에 「이 세계의 얼빵해달, 저작인접권자가 되었다!」 한 점(작가 지정),
//      나머지는 같은 눈높이로 오른쪽 벽부터 차례차례
const DOORX = -17.25, R1 = { x0: DOORX - 6, x1: DOORX + 6, z0: -5.6, z1: 4.4, h: 4.5 }, C1 = { x0: DOORX - 1.3, x1: DOORX + 1.3, z0: R1.z1, z1: 9.25, h: 2.6 };
const R1_GABLE = R1.z1 - 6;
const oakT = canvasTex(512, 512, (g, w, h) => {   // 밝은 참나무 마루(폭 18 cm 쪽널)
  const n = 8, s = w / n; let seed = 7; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  g.fillStyle = '#b9a789'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { let y = -r() * h; while (y < h) { const L = h * (.35 + r() * .45), v = Math.round(214 + r() * 16); g.fillStyle = `rgb(${v},${v - 18},${v - 42})`; g.fillRect(i * s, y, s - 1.5, L - 1.5); g.fillStyle = 'rgba(150,120,85,.08)'; for (let k = 0; k < 5; k++) g.fillRect(i * s + r() * s, y, 1, L); y += L; } }
});
interior('law', [[C1.x0, C1.x1, C1.z0 - .2, C1.z1 + .3], [R1.x0, R1.x1, R1.z0, R1.z1]], [R1.x0 - .25, R1.x1 + .25, R1.z0 - .25, C1.z1 - .05, R1.h + .3], () => {
  const W = M.white, T2 = [2.4, 2.4], floorM = std({ map: oakT, roughness: .45 });
  // 바닥과 천장
  ground(R1.x0, R1.x1, R1.z0, R1.z1, .04, floorM, 1.44); ground(C1.x0, C1.x1, C1.z0, C1.z1 + .15, .04, floorM, 1.44);
  ceiling(R1.x0, R1.x1, R1.z0, R1.z1, R1.h, M.hanjiCeil, 1.8);
  // 벽(두께 .2, 바깥쪽으로)
  const wd0 = 1.7, wd1 = 4.1;   // 서쪽 벽 남쪽 끝: 룸2로 가는 문(문턱②)
  boxMM(R1.x0 - .2, R1.x0, 0, R1.h, R1.z0 - .2, wd0, W, T2); solid(R1.x0 - .2, R1.x0, R1.z0 - .2, wd0);
  boxMM(R1.x0 - .2, R1.x0, 0, R1.h, wd1, R1.z1 + .2, W, T2); solid(R1.x0 - .2, R1.x0, wd1, R1.z1 + .2);
  boxMM(R1.x0 - .2, R1.x0, 3.0, R1.h, wd0, wd1, W, T2);
  boxMM(R1.x1, R1.x1 + .2, 0, R1.h, R1.z0 - .2, R1.z1 + .2, W, T2); solid(R1.x1, R1.x1 + .2, R1.z0 - .2, R1.z1 + .2);
  boxMM(R1.x0, R1.x1, 0, R1.h, R1.z0 - .2, R1.z0, W, T2); solid(R1.x0, R1.x1, R1.z0 - .2, R1.z0);
  const o0 = DOORX - 1.2, o1 = DOORX + 1.2;   // 놋쇠 문틀 안쪽 2.4 × 2.4
  boxMM(R1.x0, o0, 0, R1.h, R1.z1, R1.z1 + .2, W, T2); solid(R1.x0, o0, R1.z1, R1.z1 + .2);
  boxMM(o1, R1.x1, 0, R1.h, R1.z1, R1.z1 + .2, W, T2); solid(o1, R1.x1, R1.z1, R1.z1 + .2);
  boxMM(o0, o1, 2.4, R1.h, R1.z1, R1.z1 + .2, W, T2);
  for (const [a, b] of [[o0 - .06, o0], [o1, o1 + .06]]) boxMM(a, b, 0, 2.46, R1.z1 - .03, R1.z1 + .23, M.brass);
  boxMM(o0 - .06, o1 + .06, 2.4, 2.46, R1.z1 - .03, R1.z1 + .23, M.brass);
  // 통로: 흰 벽, 흰 천장 가운데 한지 광천장 60 cm 띠
  boxMM(C1.x0 - .15, C1.x0, 0, C1.h, C1.z0 + .2, C1.z1, W, T2); solid(C1.x0 - .15, C1.x0, C1.z0, C1.z1);
  boxMM(C1.x1, C1.x1 + .15, 0, C1.h, C1.z0 + .2, C1.z1, W, T2); solid(C1.x1, C1.x1 + .15, C1.z0, C1.z1);
  boxMM(C1.x0 - .15, C1.x1 + .15, C1.h, C1.h + .1, C1.z0 + .2, C1.z1, W);
  ceiling(DOORX - .3, DOORX + .3, C1.z0 + .2, C1.z1, C1.h - .005, M.hanjiCeil, .6);
  boxMM(DOORX - 1.25, DOORX + 1.25, C1.h, 3.1, 9.25, 9.55, M.plaster);   // 작가소개 문 위(문 높이 3.1과 통로 천장 2.6 사이)
  boxMM(DOORX - 1.25, DOORX + 1.25, 0, .045, 9.36, 9.44, M.brass);        // 바닥이 바뀌는 선의 놋쇠 띠
  // 정면 가벽: 문틀에서 6 m
  boxMM(DOORX - 1.6, DOORX + 1.6, 0, 3.0, R1_GABLE - .3, R1_GABLE, W, T2); solid(DOORX - 1.6, DOORX + 1.6, R1_GABLE - .3, R1_GABLE);
  // 빛: 방은 고르게 밝게, 통로는 한지 띠 아래
  for (const x of [DOORX - 3, DOORX + 3]) { const l = new THREE.PointLight(0xfff6ea, 7, 10, 1.2); l.position.set(x, R1.h - .4, R1.z0 + 5); scene.add(l); }
  const lc = new THREE.PointLight(0xfff3df, 2.2, 6, 1.4); lc.position.set(DOORX, C1.h - .3, (C1.z0 + C1.z1) / 2); scene.add(lc);
  // 걸기: 가벽 → 오른쪽(동쪽) 벽 → 왼쪽(서쪽) 벽 → 가벽 뒤 북쪽 벽
  hang(lawUnits, [
    { name: '룸1 법과 권리 · 정면 가벽', o: [DOORX - 1.6, R1_GABLE + .02], d: [1, 0], n: [0, 1], len: 3.2 },
    { name: '룸1 법과 권리 · 동쪽 벽', o: [R1.x1 - .02, R1.z0 + 1.0], d: [0, 1], n: [-1, 0], len: 8.0, rev: true },
    { name: '룸1 법과 권리 · 서쪽 벽', o: [R1.x0 + .02, 1.4], d: [0, -1], n: [1, 0], len: 6.8, rev: true },   // 남쪽 끝은 룸2로 가는 문
    { name: '룸1 법과 권리 · 북쪽 벽', o: [R1.x0 + 1.0, R1.z0 + .02], d: [1, 0], n: [0, 1], len: 10.0, rev: true },   // 가벽 뒤: 작품이 늘면 채운다
  ]);
});

/* ── 문턱② + 룸2 POV ── */
// 문턱②: 룸1 서쪽 벽 남쪽 끝 문에서 서쪽으로 가다 한 번 꺾여 북쪽으로(폭 2.6, 천장 3.0, 조명은 밝게 그대로).
//        벽의 리히텐슈타인 점이 2 mm에서 4 cm로 커지며 흰색에서 노랑으로 넘어가고, 꺾이는 벽에 굵은 윤곽선 「POV」만. 꺾인 뒤 바닥은 테라초.
//        출구는 굵은 검은 테를 두른 둥근 만화 칸. 먼 도시 소음이 낮게 깔린다(소리 단추로 끔)
// 룸2 POV: 10 × 8 m, 천장 4.5 m. 워홀 노랑 바탕에 분홍 조개만 반복한 벽지, 밝은 테라초 바닥, 공중에 떠다니는 은박 말풍선(「Silver Clouds」처럼).
//          네 점은 연작이지만 한 줄로 늘어놓지 않고 벽마다 한 점씩, 출근 → 업무 중 → 퇴근 → 유급휴일 차례로 방을 한 바퀴 돈다
const POV_ORDER = { 'HD-2026-006': 1, 'HD-2026-003': 2, 'HD-2026-007': 3, 'HD-2026-010': 4 };
const povUnits = units.filter(u => ROOM_OF(u.works[0]) === 'pov').flatMap(u => u.works.map((w, k) => ({ key: '#' + w.id, series: false, works: [w], sizes: [u.sizes[k]], width: u.sizes[k][0] + CAP_W })))
  .sort((a, b) => (POV_ORDER[a.works[0].id] ?? 9) - (POV_ORDER[b.works[0].id] ?? 9));
const OUTDOOR = [];   // 숲처럼 안쪽 공간에 있을 때 숨길 바깥 것(g9에서 넣는다)
const C2 = { x0: -30, x1: R1.x0 - .2, z0: 1.6, z1: 4.2, bx1: -27.4, h: 3.0 }, R2 = { x0: -34.2, x1: -24.2, z0: -11.5, z1: -3.5, h: 4.5 };
const R2_DOOR = { x: (C2.x0 + C2.bx1) / 2, w: 2.4, h: 2.7, r: .5, b: .14 };
const YEL = '#f6dc6e', PINK = '#f3a9c0';
// 테라초: 크림 바탕에 파랑·노랑·코랄 조각이 드문드문, 회색 잔돌
function terrazzoTex(density = 1) {
  return canvasTex(1024, 1024, (g, w, h) => {
    let seed = 11; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    g.fillStyle = '#efe9e0'; g.fillRect(0, 0, w, h);
    const chip = (col, n, s0, s1) => { g.fillStyle = col; for (let i = 0; i < n * density; i++) { const x = r() * w, y = r() * h, s = s0 + r() * (s1 - s0), k = 5 + Math.floor(r() * 3); g.beginPath(); for (let j = 0; j < k; j++) { const a = j / k * Math.PI * 2 + r() * .6, rr = s * (.6 + r() * .5); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); } };
    chip('#d6cfc4', 220, 4, 9); chip('#b9b2a8', 90, 6, 12);
    chip('#3d6ff0', 22, 16, 34); chip('#f2c230', 22, 16, 34); chip('#e7a596', 22, 16, 34);
  });
}
// 워홀 소 벽지처럼: 노랑 바탕에 분홍 조개를 반 칸씩 엇갈려 반복(한 칸에 조개 둘)
const shellPath = new Path2D('M11 4c-5 0-8 4-8 8 0 2 1 3 2 4h12c1-1 2-2 2-4 0-4-3-8-8-8z'), shellBase = new Path2D('M9 16h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z');
const papT = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = YEL; g.fillRect(0, 0, w, h); g.fillStyle = PINK;
  const k = w / 44;
  for (const [ox, oy] of [[0, 0], [22, 22], [0, 44], [44, 0], [44, 44], [22, -22], [-22, 22]]) { g.save(); g.scale(k, k); g.translate(ox, oy); g.fill(shellPath); g.fill(shellBase); g.restore(); }
});
papT.wrapS = papT.wrapT = THREE.RepeatWrapping;
const PAP = 1.0;   // 벽지 한 칸 1 m(조개 하나 폭 약 45 cm, 워홀 소 벽지처럼 크게)
const papMat = (w, h) => { const t = papT.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / PAP, h / PAP); return std({ map: t, roughness: .85, side: THREE.DoubleSide }); };
function doorShape(w, h, r) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - r); s.quadraticCurveTo(-w / 2, h, -w / 2 + r, h); s.lineTo(w / 2 - r, h); s.quadraticCurveTo(w / 2, h, w / 2, h - r); s.lineTo(w / 2, 0); s.closePath(); return s; }
interior('pov', [[C2.x0, R1.x0 + .3, C2.z0, C2.z1], [C2.x0, C2.bx1, R2.z1 - .3, C2.z1], [R2.x0, R2.x1, R2.z0, R2.z1]],
  [R2.x0 - .25, R1.x0 - .15, R2.z0 - .25, C2.z1 + .25, R2.h + .3], () => {
  const W = M.white, T2 = [2.4, 2.4], oakM = std({ map: oakT, roughness: .45 });
  const terT = terrazzoTex(1); terT.wrapS = terT.wrapT = THREE.RepeatWrapping;
  const terM = std({ map: terT, roughness: .35 });
  // ── 통로 ──
  ground(C2.bx1, R1.x0, C2.z0, C2.z1, .04, oakM, 1.44);                                     // 꺾이기 전: 룸1과 같은 마루
  ground(C2.x0, C2.bx1, R2.z1, C2.z1, .04, std({ map: terrazzoTex(.35), roughness: .35 }), 1.6);   // 꺾인 뒤: 테라초 조각이 섞이기 시작
  boxMM(C2.bx1, C2.x1, 0, C2.h, C2.z0 - .2, C2.z0, W, T2); solid(C2.bx1, C2.x1, C2.z0 - .2, C2.z0);     // 북쪽 벽(꺾이기 전)
  boxMM(C2.x0 - .2, C2.x1, 0, C2.h, C2.z1, C2.z1 + .2, W, T2); solid(C2.x0 - .2, C2.x1, C2.z1, C2.z1 + .2);   // 남쪽 벽
  boxMM(C2.x0 - .2, C2.x0, 0, C2.h, R2.z1, C2.z1, W, T2); solid(C2.x0 - .2, C2.x0, R2.z1, C2.z1);       // 서쪽 벽(꺾이는 벽)
  boxMM(C2.bx1, C2.bx1 + .2, 0, C2.h, R2.z1, C2.z0, W, T2); solid(C2.bx1, C2.bx1 + .2, R2.z1, C2.z0);    // 동쪽 벽(꺾인 뒤)
  ceiling(C2.x0, C2.x1, C2.z0, C2.z1, C2.h, M.white, 2.4); ceiling(C2.x0, C2.bx1, R2.z1, C2.z0, C2.h, M.white, 2.4);
  // 벽의 점: 걸은 거리 s(룸1 문 0 → 만화 칸 1)에 따라 2 mm → 4 cm, 흰 바탕 → 옅은 노랑
  const LA = C2.x1 - R2_DOOR.x, LB = C2.z1 - (C2.z0 + C2.z1) / 2 + ((C2.z0 + C2.z1) / 2 - R2.z1), TOT = LA + LB;
  const sAt = (x, z) => x > R2_DOOR.x ? (C2.x1 - x) / TOT : (LA + ((C2.z0 + C2.z1) / 2 - z)) / TOT;
  const lerpC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const dotWall = (x0, z0, x1, z1, nx, nz, label) => {
    const L = Math.hypot(x1 - x0, z1 - z0), H = C2.h, ppm = 220, Wc = Math.round(L * ppm), Hc = Math.round(H * ppm);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ux = nz, uz = -nx;   // 그림의 왼쪽 → 오른쪽이 가리키는 방향
    const draw = (g) => {
      const STEP = .045 * ppm;
      for (let px = 0; px < Wc; px += 6) {   // 바탕: 흰색 → 옅은 노랑
        const wx = cx + ux * (px / ppm - L / 2), wz = cz + uz * (px / ppm - L / 2), s = Math.min(1, Math.max(0, sAt(wx, wz)));
        g.fillStyle = `rgb(${lerpC([255, 255, 255], [251, 238, 192], s ** 1.6).join(',')})`; g.fillRect(px, 0, 6, Hc);
      }
      g.fillStyle = YEL;
      for (let row = 0, py = STEP / 2; py < Hc; row++, py += STEP * .87) for (let px = (row % 2) * STEP / 2; px < Wc; px += STEP) {
        const wx = cx + ux * (px / ppm - L / 2), wz = cz + uz * (px / ppm - L / 2), s = Math.min(1, Math.max(0, sAt(wx, wz)));
        const d = (.002 + .038 * s ** 1.3) * ppm; g.beginPath(); g.arc(px, py, d / 2, 0, Math.PI * 2); g.fill();
      }
      if (label) label(g, Wc, Hc, ppm);
    };
    const t = canvasTex(Wc, Hc, draw); REDRAW.push({ t, W: Wc, H: Hc, draw });   // 「POV」 글꼴이 늦게 와도 다시 그린다
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, H), std({ map: t, roughness: .85 })); place(m, cx + nx * .005, H / 2, cz + nz * .005, nx, nz);
    return m;
  };
  dotWall(C2.x1, C2.z0, C2.bx1, C2.z0, 0, 1);       // 꺾이기 전 북쪽 벽
  dotWall(C2.x0, C2.z1, C2.x1, C2.z1, 0, -1);       // 남쪽 벽
  dotWall(C2.bx1, R2.z1 + .2, C2.bx1, C2.z0, -1, 0);   // 꺾인 뒤 동쪽 벽
  // 꺾이는 벽: 서쪽 벽 전체. 걸어오는 정면(꺾이는 자리)에 굵은 윤곽선 「POV」
  dotWall(C2.x0, C2.z1, C2.x0, R2.z1 + .2, 1, 0, (g, Wc, Hc, ppm) => {
    const L = C2.z1 - (R2.z1 + .2), mid = (C2.z1 - (C2.z0 + C2.z1) / 2) / L * Wc;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${1.15 * ppm}px "Black Han Sans", "Noto Sans KR", sans-serif`;
    g.lineJoin = 'round'; g.lineWidth = .11 * ppm; g.strokeStyle = '#111'; g.strokeText('POV', mid, Hc * .46);
    g.fillStyle = '#ffffff'; g.fillText('POV', mid, Hc * .46); g.restore();
  });
  for (const [x, z] of [[(C2.bx1 + C2.x1) / 2, (C2.z0 + C2.z1) / 2], [R2_DOOR.x, (R2.z1 + C2.z0) / 2]]) { const l = new THREE.PointLight(0xfffaf0, 3.2, 7, 1.3); l.position.set(x, C2.h - .3, z); scene.add(l); }
  // ── 룸2 ──
  ground(R2.x0, R2.x1, R2.z0, R2.z1, .04, terM, 2.0);
  ceiling(R2.x0, R2.x1, R2.z0, R2.z1, R2.h, new THREE.MeshBasicMaterial({ color: 0xf6f3ee, side: THREE.DoubleSide }), 2.4);
  const Wd = R2.x1 - R2.x0, Dd = R2.z1 - R2.z0, rcx = (R2.x0 + R2.x1) / 2, rcz = (R2.z0 + R2.z1) / 2;
  boxMM(R2.x0 - .2, R2.x0, 0, R2.h, R2.z0 - .2, R2.z1 + .2, W); solid(R2.x0 - .2, R2.x0, R2.z0 - .2, R2.z1 + .2);
  boxMM(R2.x1, R2.x1 + .2, 0, R2.h, R2.z0 - .2, R2.z1 + .2, W); solid(R2.x1, R2.x1 + .2, R2.z0 - .2, R2.z1 + .2);
  boxMM(R2.x0, -34.0, 0, R2.h, R2.z0 - .2, R2.z0, W); solid(R2.x0, -34.0, R2.z0 - .2, R2.z0);   // 북쪽 벽 서쪽 끝(x -34.0 ~ -31.6): 룸3으로 가는 문(문턱③)
  boxMM(-31.6, R2.x1, 0, R2.h, R2.z0 - .2, R2.z0, W); solid(-31.6, R2.x1, R2.z0 - .2, R2.z0);
  boxMM(-34.0, -31.6, 2.7, R2.h, R2.z0 - .2, R2.z0, W);
  const dl = R2_DOOR.x - R2_DOOR.w / 2 - R2_DOOR.b, dr = R2_DOOR.x + R2_DOOR.w / 2 + R2_DOOR.b;
  boxMM(R2.x0, dl, 0, R2.h, R2.z1, R2.z1 + .2, W); solid(R2.x0, dl, R2.z1, R2.z1 + .2);
  boxMM(dr, R2.x1, 0, R2.h, R2.z1, R2.z1 + .2, W); solid(dr, R2.x1, R2.z1, R2.z1 + .2);
  boxMM(dl, dr, R2_DOOR.h + R2_DOOR.b, R2.h, R2.z1, R2.z1 + .2, W);
  boxMM(C2.x0, C2.bx1, R2_DOOR.h + R2_DOOR.b, C2.h, R2.z1, R2.z1 + .2, std({ color: 0xfbeec0, roughness: .85 }));   // 통로 쪽 칸 위
  // 벽지: 세 벽은 판, 만화 칸이 뚫린 남쪽 벽은 구멍 난 판
  for (const [w, x, z, nx, nz] of [[Dd, R2.x0 + .005, rcz, 1, 0], [Dd, R2.x1 - .005, rcz, -1, 0], [R2.x1 + 31.6, (R2.x1 - 31.6) / 2, R2.z0 + .005, 0, 1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, R2.h), papMat(w, R2.h)); place(m, x, R2.h / 2, z, nx, nz); }
  { const w = -31.6 - R2.x0, m = new THREE.Mesh(new THREE.PlaneGeometry(w, R2.h - 2.7), papMat(w, R2.h - 2.7)); place(m, (R2.x0 - 31.6) / 2, (R2.h + 2.7) / 2, R2.z0 + .005, 0, 1); }   // 문 위
  {
    const s = new THREE.Shape(); s.moveTo(-Wd / 2, 0); s.lineTo(Wd / 2, 0); s.lineTo(Wd / 2, R2.h); s.lineTo(-Wd / 2, R2.h); s.closePath();
    s.holes.push(new THREE.Path(doorShape(R2_DOOR.w + 2 * R2_DOOR.b, R2_DOOR.h + R2_DOOR.b, R2_DOOR.r + R2_DOOR.b).getPoints().map(p => new THREE.Vector2(p.x + R2_DOOR.x - rcx, p.y))));
    const t = papT.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / PAP, 1 / PAP);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s), std({ map: t, roughness: .85, side: THREE.DoubleSide })); m.position.set(rcx, 0, R2.z1 - .005); scene.add(m);
  }
  // 만화 칸: 굵은 검은 테(벽을 꿰뚫고 양쪽으로 3 cm 나온다)
  {
    const ring = doorShape(R2_DOOR.w + 2 * R2_DOOR.b, R2_DOOR.h + R2_DOOR.b, R2_DOOR.r + R2_DOOR.b);
    ring.holes.push(new THREE.Path(doorShape(R2_DOOR.w, R2_DOOR.h, R2_DOOR.r).getPoints()));
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: .26, bevelEnabled: false, curveSegments: 16 }), std({ color: 0x141414, roughness: .55 }));
    m.position.set(R2_DOOR.x, 0, R2.z1 - .03); scene.add(m);
  }
  for (const x of [rcx - 2.5, rcx + 2.5]) { const l = new THREE.PointLight(0xfff8ec, 6.5, 10, 1.2); l.position.set(x, R2.h - .4, rcz); scene.add(l); }
  // 작품: 벽마다 한 점(오른쪽 벽부터 한 바퀴). 벽면 d는 보는 사람의 오른쪽
  hang(povUnits, [
    { name: '룸2 POV · 동쪽 벽', o: [R2.x1 - .02, -8.2], d: [0, 1], n: [-1, 0], len: 3.2 },
    { name: '룸2 POV · 북쪽 벽', o: [rcx - 1.3, R2.z0 + .02], d: [1, 0], n: [0, 1], len: 3.8 },
    { name: '룸2 POV · 서쪽 벽', o: [R2.x0 + .02, -5.6], d: [0, -1], n: [1, 0], len: 3.2 },
    { name: '룸2 POV · 남쪽 벽', o: [dl - .3, R2.z1 - .02], d: [-1, 0], n: [0, -1], len: dl - .3 - (R2.x0 + .3) },
  ]);
  // 은박 말풍선: 천장 아래 떠다니다 다가가면 밀려나고, 누르면 툭 밀리며 돈다. 넷에는 작품 글의 한 문장을 그대로
  const envT = canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.38, '#d9dbdd'); gr.addColorStop(.48, '#5d6166'); gr.addColorStop(.52, '#e8c95a'); gr.addColorStop(.7, '#c9b46a'); gr.addColorStop(.85, '#8a8780'); gr.addColorStop(1, '#efe9e0');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(243,169,192,.55)'; for (let i = 0; i < 18; i++) g.fillRect((i * 29) % w, h * .5 + (i % 3) * 14, 10, 8);
    g.fillStyle = '#ffffff'; for (const x of [.2, .7]) { g.beginPath(); g.ellipse(w * x, h * .12, 40, 12, 0, 0, Math.PI * 2); g.fill(); }
  });
  envT.mapping = THREE.EquirectangularReflectionMapping;
  const silver = new THREE.MeshStandardMaterial({ color: 0xdfe4e9, metalness: 1, roughness: .14, envMap: envT, envMapIntensity: 1.15 });
  const SAY = [['HD-2026-006', '아이스아메리카노를 사느라 늦겠다.'], ['HD-2026-003', '얼빵해달의 직업은 조개배달부다.'], ['HD-2026-007', '얼른 집에 가서 각 잡고 봐야지.'], ['HD-2026-010', '달력 속 파란 날, 토요일이다.']];
  const spots = [[-31.6, -6.2], [-27.0, -9.6], [-30.4, -9.9], [-26.4, -5.6], [-32.8, -9.0], [-28.6, -7.4], [-25.6, -8.4]];
  const balloons = spots.map(([x, z], i) => {
    const g = new THREE.Group(), sc = .85 + (i % 3) * .15;
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), silver); body.scale.set(.7 * sc, .42 * sc, .24 * sc); g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.15 * sc, .42 * sc, 14), silver); tail.scale.z = .55; tail.position.set(-.3 * sc, -.44 * sc, 0); tail.rotation.z = Math.PI - .55; g.add(tail);   // 말풍선 꼬리: 아래로 비스듬히
    const say = SAY[i];
    if (say) for (const side of [1, -1]) {
      const lab = letters(1.0 * sc, .3 * sc, (c, Wc, Hc) => { c.textAlign = 'center'; font(c, Hc * .3, 900, FONT_B, '#1d1a17'); const ls = wrapText(c, say[1], Wc * .92).slice(0, 2); ls.forEach((l, k) => c.fillText(l, Wc / 2, Hc * (ls.length === 1 ? .6 : .42 + k * .36))); }, 700);
      lab.position.z = side * .265 * sc; if (side < 0) lab.rotation.y = Math.PI; g.add(lab);
    }
    const st = { x, z, y: 2.95 + (i % 4) * .22, vx: 0, vz: 0, spin: 0, ph: i * 1.7, yaw: (i * .9) % (Math.PI * 2) };
    g.position.set(x, st.y, z); scene.add(g);
    pickable(g, { title: '말풍선 밀기', act: () => { const dx = st.x - camera.position.x, dz = st.z - camera.position.z, d = Math.hypot(dx, dz) || 1; st.vx += dx / d * 1.6; st.vz += dz / d * 1.6; st.spin += (Math.random() < .5 ? -1 : 1) * 3.5; } });
    return { g, st };
  });
  animators.push((t, dt, who) => {
    if (dt > .1) dt = .1;
    const near = who.x < R2.x1 + 1 && who.x > R2.x0 - 1 && who.z < C2.z1 && who.z > R2.z0 - 1;
    for (const { g, st } of balloons) {
      if (near) {
        const dx = st.x - who.x, dz = st.z - who.z, d = Math.hypot(dx, dz);
        if (d < 1.7 && d > .01) { const f = (1.7 - d) * 2.2 * dt; st.vx += dx / d * f; st.vz += dz / d * f; if (!reduceMotion) st.spin += f * 1.5; }
      }
      st.x += st.vx * dt; st.z += st.vz * dt; st.vx *= Math.exp(-dt * .9); st.vz *= Math.exp(-dt * .9); st.spin *= Math.exp(-dt * .7);
      const m = .75;
      if (st.x < R2.x0 + m) { st.x = R2.x0 + m; st.vx = Math.abs(st.vx) * .5; } if (st.x > R2.x1 - m) { st.x = R2.x1 - m; st.vx = -Math.abs(st.vx) * .5; }
      if (st.z < R2.z0 + m) { st.z = R2.z0 + m; st.vz = Math.abs(st.vz) * .5; } if (st.z > R2.z1 - m) { st.z = R2.z1 - m; st.vz = -Math.abs(st.vz) * .5; }
      st.yaw += (st.spin + (reduceMotion ? 0 : .06)) * dt;
      g.position.set(st.x, st.y + (reduceMotion ? 0 : Math.sin(t * .55 + st.ph) * .07), st.z); g.rotation.y = st.yaw; g.rotation.z = reduceMotion ? 0 : Math.sin(t * .4 + st.ph) * .05;
    }
  });
});

/* ── 소리: 브라우저에서 직접 만든다. 위쪽 단추로 켜고 끈다(처음 누르거나 걸을 때 시작) ── */
const SOUND = { on: store.get('sound', true), ctx: null, beds: [], extra: [] };   // extra: (ctx) => 소리 하나(방마다 더한다)
{
  const bar = document.getElementById('shells'), btn = document.createElement('button');
  btn.id = 'soundBtn'; btn.type = 'button';
  const paint = () => { btn.textContent = SOUND.on ? '소리 켬' : '소리 끔'; btn.setAttribute('aria-pressed', String(SOUND.on)); };
  paint(); bar.insertBefore(btn, bar.firstChild);
  btn.addEventListener('click', () => { SOUND.on = !SOUND.on; store.set('sound', SOUND.on); paint(); startSound(); });
  const startSound = () => {
    if (SOUND.ctx) { SOUND.ctx.resume && SOUND.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = SOUND.ctx = new AC();
    // 먼 도시 소음: 갈색 소음을 낮게 거르고, 가끔 아주 먼 차 소리처럼 부풀린다
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(lp).connect(gain).connect(ctx.destination); src.start();
    SOUND.beds.push({ gain, lp, level: (x, z) => {   // 문턱② 안에서 가장 크고, 룸1·룸2 쪽으로 3 m 안에 잦아든다
      const inA = x > C2.x0 && x < C2.x1 && z > C2.z0 && z < C2.z1, inB = x > C2.x0 && x < C2.bx1 && z > R2.z1 && z < C2.z1;
      if (inA || inB) return 1;
      if (x > C3.ax0 && x < C3.ax1 && z > C3.zc1 && z < R2.z0) return .45;   // 문턱③ 첫 길에서 낮게, 꺾이면 끊긴다
      const dA = x > C2.x1 ? x - C2.x1 : 99, dB = z < R2.z1 && x > C2.x0 - 1 && x < C2.bx1 + 1 ? R2.z1 - z : 99;
      return Math.max(0, 1 - Math.min(dA, dB) / 3);
    } });
    for (const f of SOUND.extra) SOUND.beds.push(f(ctx));
  };
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { if (SOUND.on) startSound(); }, { once: false, passive: true });
  animators.push((t, dt, who) => {
    if (!SOUND.ctx) return;
    for (const b of SOUND.beds) { const want = SOUND.on ? .16 * b.level(who.x, who.z) * (b.mod ? b.mod(t) : b.swell ? .55 + .45 * Math.sin(t * .7) ** 2 : 1) : 0; b.gain.gain.value += (want - b.gain.gain.value) * Math.min(1, dt * 2); if (b.lp) b.lp.frequency.value = 380 + Math.sin(t * .23) * 60; }
  });
}

const SPACE = {};

/* ── 문턱③ + 룸3 우주조약 ── */
// 문턱③: 룸2 북쪽 벽 서쪽 끝 문에서 북 → 서 → 북, 두 번 꺾인 가장 긴 길(약 14 m, 폭 2.6, 천장 2.8). 빛이 가장 낮다.
//        벽빛은 POV 노랑에서 먹회색으로 서서히 식고, 테라초 바닥은 끝에서 젖은 돌이 된다. 글은 두지 않는다(작가님 결정).
//        마지막 꺾임을 돌면 정면에 팔각 창살 문이 검은 실루엣으로 서고, 그 너머 자개 물이 빛난다. 도시 소음이 꺾일 때 끊기고 물결 소리가 시작된다
// 룸3: 팔각 방(폭 10 m, 천장 5 m). 남쪽 면 = 팔각 창살 모양의 들어오는 문, 동쪽 면 = 룸4로 나가는 문(문턱④ 때 낸다).
//      「우주조약」 북서 면, 「무주의 바다」 남동 면에 마주 보게. 다음 작품은 남서 → 서 → 북 → 북동 면 차례.
//      벽은 짙은 먹회색 무광, 작품마다 위에서 비스듬한 빛. 바닥은 잘게 자른 자개 위 얕은 물(비치고, 걸으면 물결).
//      한가운데 네 면에 팔각 창이 난 상자가 떠 있고, 창 안으로만 깊은 우주가 보인다(홈페이지 배경과 같은 색·성운·깊이별 별, 가끔 유성)
const P3 = { x0: -34.0, x1: -31.6, h: 2.7 };   // 룸2 북쪽 벽의 나가는 문
const C3 = { w: 2.6, h: 2.8, ax0: -34.1, ax1: -31.5, z0: R2.z0, zc1: -14.2, zn: -16.8, bx0: -40.1, bx1: -37.5, zf: -19.8 };
const OC = { x: -38.8, z: -24.8, a: 5, h: 5 };   // 팔각 방 가운데, 벽까지(내접원 반지름), 높이
const OCT_SIDE = 2 * OC.a * Math.tan(Math.PI / 8);
const MUK = 0x3b3b3d;
// 룸4와 문턱④⑤ 자리(룸3 동쪽 면 문이 C4를 쓴다)
const R4 = { x0: -26.5, x1: -14.5, z0: -25, z1: -16, h: 4 };
const C4 = { x0: OC.x + OC.a - .1, z0: OC.z, x1: R4.x0 - .2, z1: -21.3, w: 2.4, h: 2.1 };
const C5 = { ax0: -17.1, ax1: R4.x1, z0: R4.z1 + .2, bz0: -9.2, bz1: R1.z0 - .2, x1: -10.6, h: 3.2 };
const CDOOR = { z0: -8.9, z1: -4.9 };   // 작품관 쪽 중정 문: 문턱⑤가 룸1 북쪽으로 지나가게 북쪽으로 옮겼다(작가님 결정). 모양·크기는 그대로
// 대각선 벽도 걸어서 통과하지 않게: 짧은 칸을 줄지어 막는다
function segSolid(x0, z0, x1, z1, step = .25) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / step)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; solid(x - .12, x + .12, z - .12, z + .12); } }
// 팔각형 꼭짓점(아래가 평평, 바닥에 닿는다): 가운데 (0, a), 내접원 a
const octPts = (a, cy = a) => Array.from({ length: 8 }, (_, i) => { const t = -Math.PI / 2 + Math.PI / 8 + i * Math.PI / 4, R = a / Math.cos(Math.PI / 8); return new THREE.Vector2(Math.cos(t) * R, cy + Math.sin(t) * R); });
interior('space', [[C3.ax0, C3.ax1, C3.zn, C3.z0 + .3], [C3.bx0, C3.ax1, C3.zn, C3.zc1], [C3.bx0, C3.bx1, C3.zf - .3, C3.zc1], [OC.x - OC.a, OC.x + OC.a, OC.z - OC.a, OC.z + OC.a]],
  [OC.x - OC.a - .3, C3.ax1 + .25, OC.z - OC.a - .3, C3.z0 - .1, OC.h + .3], () => {
  const mukM = std({ color: MUK, roughness: .95 });
  const wall = (x0, x1, y0, y1, z0, z1, mat = mukM, block = true) => { const m = boxMM(x0, x1, y0, y1, z0, z1, mat); blockers.push(m); if (block) solid(x0, x1, z0, z1); return m; };
  // ── 룸2 북쪽 벽에 문 ── (벽은 룸2에서 만들었다: 여기서는 통로만)
  // ── 통로 ──
  const L1 = (R2.z0 - (C3.zc1 + C3.zn) / 2), L2 = ((P3.x0 + P3.x1) / 2 - OC.x), L3 = ((C3.zc1 + C3.zn) / 2 - C3.zf), TOT = L1 + L2 + L3;
  const sAt = (x, z) => z > C3.zc1 && x > C3.ax0 ? (R2.z0 - z) / TOT : x > C3.bx1 ? (L1 + ((P3.x0 + P3.x1) / 2 - x)) / TOT : (L1 + L2 + ((C3.zc1 + C3.zn) / 2 - z)) / TOT;
  const warm = [233, 207, 98], cold = [59, 59, 61];
  const gradWall = (x0, z0, x1, z1, nx, nz) => {
    const L = Math.hypot(x1 - x0, z1 - z0), Wc = Math.max(8, Math.round(L * 40)), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ux = nz, uz = -nx;
    const t = canvasTex(Wc, 4, (g) => { for (let px = 0; px < Wc; px++) { const wx = cx + ux * ((px + .5) / 40 - L / 2), wz = cz + uz * ((px + .5) / 40 - L / 2), s = Math.min(1, Math.max(0, sAt(wx, wz))), k = Math.min(1, s * 1.35) ** .8; g.fillStyle = `rgb(${warm.map((v, i) => Math.round(v + (cold[i] - v) * k)).join(',')})`; g.fillRect(px, 0, 1, 4); } });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, C3.h), std({ map: t, roughness: .95 })); place(m, cx + nx * .005, C3.h / 2, cz + nz * .005, nx, nz);
  };
  wall(C3.ax1, C3.ax1 + .2, 0, C3.h, C3.zn - .2, R2.z0 - .2); gradWall(C3.ax1, R2.z0 - .2, C3.ax1, C3.zn, -1, 0);          // 첫 길 동쪽
  wall(C3.ax0 - .2, C3.ax0, 0, C3.h, C3.zc1, R2.z0 - .2); gradWall(C3.ax0, C3.zc1, C3.ax0, R2.z0 - .2, 1, 0);              // 첫 길 서쪽
  wall(C3.bx1, C3.ax1 + .2, 0, C3.h, C3.zn - .2, C3.zn); gradWall(C3.bx1, C3.zn, C3.ax1, C3.zn, 0, 1);                // 북쪽(첫 꺾임 벽)
  wall(C3.bx0, C3.ax0, 0, C3.h, C3.zc1, C3.zc1 + .2); gradWall(C3.ax0, C3.zc1, C3.bx0, C3.zc1, 0, -1);                     // 둘째 길 남쪽
  wall(C3.bx0 - .2, C3.bx0, 0, C3.h, C3.zf, C3.zc1 + .2); gradWall(C3.bx0, C3.zc1, C3.bx0, C3.zf, 1, 0);                   // 서쪽(둘째 꺾임 벽)
  wall(C3.bx1, C3.bx1 + .2, 0, C3.h, C3.zf, C3.zn); gradWall(C3.bx1, C3.zf, C3.bx1, C3.zn, -1, 0);                          // 마지막 길 동쪽
  const ceilM = std({ color: 0x2c2c2e, roughness: 1, side: THREE.DoubleSide });
  ceiling(C3.ax0, C3.ax1, C3.zn, R2.z0, C3.h, ceilM, 2.4); ceiling(C3.bx0, C3.ax0, C3.zn, C3.zc1, C3.h, ceilM, 2.4); ceiling(C3.bx0, C3.bx1, C3.zf, C3.zn, C3.h, ceilM, 2.4);
  // 바닥: 테라초 → 어두워지며 → 젖은 돌
  const terT = terrazzoTex(1), darkTer = canvasTex(1024, 1024, (g, w, h) => { g.drawImage(terT.image, 0, 0); g.fillStyle = 'rgba(40,40,44,.62)'; g.fillRect(0, 0, w, h); });
  ground(C3.ax0, C3.ax1, C3.zc1, R2.z0 - .2, .04, std({ map: terT, roughness: .35 }), 2.0);
  ground(C3.bx1, C3.ax1, C3.zn, C3.zc1, .04, std({ map: darkTer, roughness: .25 }), 2.0);
  ground(C3.bx0, C3.bx1, C3.zf, C3.zc1, .04, std({ color: 0x2a2b2e, roughness: .12, metalness: .15 }), 2.0);
  for (const [x, z, k] of [[(C3.ax0 + C3.ax1) / 2, -13.2, 1.4], [-36, (C3.zc1 + C3.zn) / 2, .7]]) { const l = new THREE.PointLight(0xffeccc, k, 5, 1.5); l.position.set(x, C3.h - .3, z); scene.add(l); }

  // ── 팔각 방 ──
  const face = (k) => { const th = k * Math.PI / 4; return { th, nx: Math.sin(th), nz: Math.cos(th), cx: OC.x + Math.sin(th) * OC.a, cz: OC.z + Math.cos(th) * OC.a }; };   // k: 0 남, 1 남동, 2 동, 3 북동, 4 북, 5 북서, 6 서, 7 남서
  const ENTRY = { a: 1.85 };   // 팔각 창살 문: 내접원 1.85(폭 3.7 m), 가운데 열린 칸 = 아랫변 폭
  const midW = 2 * ENTRY.a * Math.tan(Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const f = face(k), g = new THREE.Group();
    if (k === 0) {   // 남쪽 면: 팔각 구멍 난 벽
      const s = new THREE.Shape(); s.moveTo(-OCT_SIDE / 2 - .1, 0); s.lineTo(OCT_SIDE / 2 + .1, 0); s.lineTo(OCT_SIDE / 2 + .1, OC.h); s.lineTo(-OCT_SIDE / 2 - .1, OC.h); s.closePath();
      s.holes.push(new THREE.Path(octPts(ENTRY.a + .1)));
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: false }), mukM); m.position.z = -.0; g.add(m); blockers.push(m);
      // 검은 팔각 테
      const ring = new THREE.Shape(octPts(ENTRY.a + .1)); ring.holes.push(new THREE.Path(octPts(ENTRY.a)));
      const rm = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: .28, bevelEnabled: false }), std({ color: 0x0c0c0c, roughness: .35 })); rm.position.z = -.04; g.add(rm);
      // 양쪽 살창(아자 무늬) + 뒤의 한지. 가운데 세로 칸은 비어 있어 지나간다
      const latT = canvasTex(512, 512, (c, w, h) => {
        c.fillStyle = '#efe6d2'; c.fillRect(0, 0, w, h); c.strokeStyle = '#141210'; c.lineWidth = 10; c.lineCap = 'square';
        const n = 4, s2 = w / n;
        for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s2, 0); c.lineTo(i * s2, h); c.stroke(); c.beginPath(); c.moveTo(0, i * s2); c.lineTo(w, i * s2); c.stroke(); }
        c.lineWidth = 7;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = i * s2, y = j * s2, q = s2 * .28; c.strokeRect(x + q, y + q, s2 - 2 * q, s2 - 2 * q); c.beginPath(); c.moveTo(x + s2 / 2, y); c.lineTo(x + s2 / 2, y + q); c.moveTo(x + s2 / 2, y + s2 - q); c.lineTo(x + s2 / 2, y + s2); c.moveTo(x, y + s2 / 2); c.lineTo(x + q, y + s2 / 2); c.moveTo(x + s2 - q, y + s2 / 2); c.lineTo(x + s2, y + s2 / 2); c.stroke(); }
      });
      const SC = .9; latT.repeat.set(1 / SC, 1 / SC);
      const oct = octPts(ENTRY.a);
      for (const side of [-1, 1]) {   // 팔각형을 x = ±midW/2 바깥만 잘라 살창 한 짝
        const clip = [], cut = side * midW / 2, inside = p => side < 0 ? p.x <= cut : p.x >= cut;
        for (let i = 0; i < oct.length; i++) { const a = oct[i], b = oct[(i + 1) % oct.length]; if (inside(a)) clip.push(a); if (inside(a) !== inside(b)) { const t = (cut - a.x) / (b.x - a.x); clip.push(new THREE.Vector2(cut, a.y + (b.y - a.y) * t)); } }
        const lm = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(clip)), new THREE.MeshStandardMaterial({ map: latT, roughness: .8, emissive: 0xfff4dc, emissiveMap: latT, emissiveIntensity: .28, side: THREE.DoubleSide }));
        lm.position.z = .1; g.add(lm);
        const lf = new THREE.Mesh(new THREE.BoxGeometry(.05, ENTRY.a * 2, .1), std({ color: 0x0c0c0c, roughness: .35 })); lf.position.set(cut, ENTRY.a, .1); g.add(lf);   // 살창 짝의 안쪽 문울
      }
      // 막는 칸: 가운데 열린 칸만 지나간다
      const x0 = f.cx, z0 = f.cz;
      solid(x0 - OCT_SIDE / 2 - .2, x0 - midW / 2 + .02, z0 - .25, z0 + .05); solid(x0 + midW / 2 - .02, x0 + OCT_SIDE / 2 + .2, z0 - .25, z0 + .05);
    } else if (k === 2) {   // 동쪽 면: 문턱④로 나가는 낮은 문(폭 2.2, 높이 2.1 = 통로 천장)
      const half = OCT_SIDE / 2 + .09, dw = 1.1, dh = C4.h;
      for (const [a, b, y0, y1] of [[-half, -dw, 0, OC.h], [dw, half, 0, OC.h], [-dw, dw, dh, OC.h]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(b - a, y1 - y0, .2), mukM); m.position.set((a + b) / 2, (y0 + y1) / 2, .1); g.add(m); blockers.push(m); }
      solid(f.cx - .25, f.cx + .05, f.cz - half - .05, f.cz - dw); solid(f.cx - .25, f.cx + .05, f.cz + dw, f.cz + half + .05);
    } else {
      const m = new THREE.Mesh(new THREE.BoxGeometry(OCT_SIDE + .18, OC.h, .2), mukM); m.position.set(0, OC.h / 2, .1); g.add(m); blockers.push(m);
      const ex = Math.sin(f.th + Math.PI / 2) * OCT_SIDE / 2, ez = Math.cos(f.th + Math.PI / 2) * OCT_SIDE / 2;
      segSolid(f.cx - ex, f.cz - ez, f.cx + ex, f.cz + ez);
    }
    g.position.set(f.cx, 0, f.cz); g.rotation.y = f.th + Math.PI; scene.add(g);   // 그룹의 +z가 방 안쪽
  }
  // 바닥: 잘게 자른 자개(물빛·분홍·은빛 조각) 위에 얕은 물
  const nacreT = canvasTex(1024, 1024, (g, w, h) => {
    let seed = 23; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    g.fillStyle = '#0e1522'; g.fillRect(0, 0, w, h);
    const cols = ['#8fe0e6', '#a9c4ff', '#f2b3d9', '#c8f2dc', '#f4f6ff', '#66c2d9', '#c7a3f5', '#ffe2b8'];
    for (let i = 0; i < 1500; i++) { const x = r() * w, y = r() * h, s = 6 + r() * 15, a = r() * Math.PI; g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = .45 + r() * .5; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.moveTo(-s, -s * .4); g.lineTo(s * .7, -s * .55); g.lineTo(s, s * .35); g.lineTo(-s * .5, s * .5); g.closePath(); g.fill(); g.restore(); }
    g.globalAlpha = 1;
  });
  ground(OC.x - OC.a - .2, OC.x + OC.a + .2, OC.z - OC.a - .2, OC.z + OC.a + .2, .03, new THREE.MeshStandardMaterial({ map: nacreT, roughness: .3, metalness: .2, emissive: 0xffffff, emissiveMap: nacreT, emissiveIntensity: .42 }), 1.8);
  {   // 물: 방과 상자, 작품이 비친다. 물결은 반사를 살짝 흔든다
    const sh = Reflector.ReflectorShader;
    const shader = { name: 'WaterReflector', uniforms: { ...THREE.UniformsUtils.clone(sh.uniforms), time: { value: 0 }, alpha: { value: .55 } }, vertexShader: sh.vertexShader,
      fragmentShader: sh.fragmentShader.replace('uniform vec3 color;', 'uniform vec3 color;\nuniform float time;\nuniform float alpha;')
        .replace('vec4 base = texture2DProj( tDiffuse, vUv );', 'vec4 uv = vUv; uv.xy += vec2( sin( vUv.y / vUv.w * 80.0 + time * 1.3 ), cos( vUv.x / vUv.w * 64.0 + time * 1.1 ) ) * 0.0032 * vUv.w;\n vec4 base = texture2DProj( tDiffuse, uv );')
        .replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );', 'gl_FragColor = vec4( blendOverlay( base.rgb, color ), alpha );') };
    const water = new Reflector(new THREE.CircleGeometry(OC.a / Math.cos(Math.PI / 8), 8), { clipBias: .003, textureWidth: Math.round(innerWidth * .6), textureHeight: Math.round(innerHeight * .6), color: 0xb4bfcd, shader });
    water.material.transparent = true; water.rotation.x = -Math.PI / 2; water.rotation.z = Math.PI / 8; water.position.set(OC.x, .075, OC.z); scene.add(water);
    SPACE.water = water;
    animators.push((t) => { water.material.uniforms.time.value = reduceMotion ? 0 : t; });
  }
  ceiling(OC.x - OC.a - .2, OC.x + OC.a + .2, OC.z - OC.a - .2, OC.z + OC.a + .2, OC.h, std({ color: 0x2e2e30, roughness: 1, side: THREE.DoubleSide }), 2.4);
  { const l = new THREE.PointLight(0xdfe8ff, 3.2, 9, 1.4); l.position.set(OC.x, OC.h - .5, OC.z); scene.add(l); }
  // 작품: 북서 → 남동 → 남서 → 서 → 북 → 북동. 면마다 위에서 비스듬히 비추는 빛
  const slot = (k) => { const f = face(k), n = [-f.nx, -f.nz], d = [-f.nz, f.nx], len = OCT_SIDE - .5; return { light: true, name: '룸3 우주조약 · ' + ['남', '남동', '동', '북동', '북', '북서', '서', '남서'][k] + '쪽 면', o: [f.cx - d[0] * len / 2 + n[0] * .22, f.cz - d[1] * len / 2 + n[1] * .22], d, n, len }; };   // 벽 안쪽 면(.2) 앞
  const spaceUnits = units.filter(u => ROOM_OF(u.works[0]) === 'territory').flatMap(u => u.works.map((w, k) => ({ key: '#' + w.id, series: false, works: [w], sizes: [u.sizes[k]], width: u.sizes[k][0] + CAP_W })));
  hang(spaceUnits, [5, 1, 7, 6, 4, 3].map(slot));
  [5, 1, 7, 6, 4, 3].slice(0, spaceUnits.length).forEach(k => {
    const f = face(k), sp = new THREE.SpotLight(0xfff3e2, 26, 9, .38, .55, 1.4);
    sp.position.set(f.cx - f.nx * 2.3, 4.6, f.cz - f.nz * 2.3); sp.target.position.set(f.cx - f.nx * .2, 1.75, f.cz - f.nz * .2); scene.add(sp, sp.target);
  });
  // 가운데 떠 있는 상자: 네 면에 팔각 창(창살 없이 검은 팔각 테만). 모서리가 입구를 본다
  const B = 2.2, WA = .72, box = new THREE.Group(), boxM = std({ color: 0x242322, roughness: .4 }), frameM = std({ color: 0x050505, roughness: .3 });
  const winMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp });
  for (let k = 0; k < 4; k++) {
    const g = new THREE.Group(), s = new THREE.Shape(); s.moveTo(-B / 2, -B / 2); s.lineTo(B / 2, -B / 2); s.lineTo(B / 2, B / 2); s.lineTo(-B / 2, B / 2); s.closePath();
    s.holes.push(new THREE.Path(octPts(WA + .07, 0)));
    const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .06, bevelEnabled: false }), boxM); pm.position.z = -.06; g.add(pm); blockers.push(pm);
    const ring = new THREE.Shape(octPts(WA + .07, 0)); ring.holes.push(new THREE.Path(octPts(WA, 0)));
    const rm = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: .1, bevelEnabled: false }), frameM); rm.position.z = -.07; g.add(rm);
    const win = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(octPts(WA + .005, 0))), winMat); win.position.z = -.03; win.renderOrder = 10; g.add(win); blockers.push(win);   // 카메라가 상자 안으로 들어가지 않게
    g.rotation.y = k * Math.PI / 2; g.position.set(Math.sin(k * Math.PI / 2) * B / 2, 0, Math.cos(k * Math.PI / 2) * B / 2); box.add(g);
  }
  for (const y of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(B, .06, B), boxM); m.position.y = y * (B / 2 - .03); box.add(m); }
  box.rotation.y = Math.PI / 4; box.position.set(OC.x, 2.75, OC.z); scene.add(box);
  // 창 너머 우주: 창(스텐실 1)으로 보이는 곳에만 그린다. 홈페이지 배경과 같은 바탕색·성운, 별은 실제 깊이로 흩어져 보는 자리에 따라 다르게 움직인다
  const sten = { fog: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp, depthTest: false, depthWrite: false };
  const sky = SPACE.group = new THREE.Group(); sky.position.set(OC.x, 2.75, OC.z);
  const skyT = canvasTex(1024, 512, (g, w, h) => {
    const bg = g.createRadialGradient(w * .5, h * .45, 0, w * .5, h * .45, w * .6); bg.addColorStop(0, '#111420'); bg.addColorStop(1, '#05050a'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, rr, col, a] of [[.2, .35, .3, '27,42,74', .55], [.62, .55, .26, '232,230,224', .12], [.85, .4, .3, '27,42,74', .45], [.45, .7, .28, '17,20,32', .5], [.05, .6, .22, '232,230,224', .08]]) {
      const n = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, rr * w); n.addColorStop(0, `rgba(${col},${a})`); n.addColorStop(1, `rgba(${col},0)`); g.fillStyle = n; g.fillRect(0, 0, w, h);
    }
  });
  const skyBall = new THREE.Mesh(new THREE.SphereGeometry(150, 48, 24), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, toneMapped: false, ...sten })); skyBall.renderOrder = 11; sky.add(skyBall);
  const dotT = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  let seed = 7; const r = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const layers = [[9, 22, 260, .55], [22, 60, 900, .42], [60, 140, 2200, .5]].map(([r0, r1, n, size], li) => {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = r0 + (r1 - r0) * r(), q = Math.sqrt(1 - u * u); pos.set([Math.cos(th) * q * rr, u * rr, Math.sin(th) * q * rr], i * 3); const gold = r() < .18; col.set(gold ? [.9, .81, .6] : [1, 1, 1], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: size * (li === 2 ? 1.6 : 1), map: dotT, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false, sizeAttenuation: li < 2, ...sten });
    if (li === 2) mat.size = 2.2;
    const p = new THREE.Points(geo, mat); p.renderOrder = 12; sky.add(p); return { p, mat, base: li === 2 ? .8 : .95, ph: li * 1.7 };
  });
  // 유성: 가끔 하나
  const metT = canvasTex(256, 8, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const met = new THREE.Mesh(new THREE.PlaneGeometry(6, .05), new THREE.MeshBasicMaterial({ map: metT, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide, ...sten })); met.renderOrder = 13; met.visible = false; sky.add(met);
  let metNext = 4, metT0 = -1, metDir = new THREE.Vector3(), metFrom = new THREE.Vector3();
  scene.add(sky);
  { const ob = SPACE.water.onBeforeRender; SPACE.water.onBeforeRender = function (...a) { sky.visible = false; ob.apply(this, a); sky.visible = true; }; }   // 물에 비친 모습에는 창 너머 우주를 그리지 않는다(반사 화면에는 스텐실이 없다)
  animators.push((t, dt, who) => {
    const near = Math.hypot(who.x - OC.x, who.z - OC.z) < 9;
    if (!near) return;
    box.position.y = 2.75 + (reduceMotion ? 0 : Math.sin(t * .6) * .04);
    if (reduceMotion) return;
    skyBall.rotation.y = t * .004;
    for (const L of layers) L.mat.opacity = L.base * (.82 + .18 * Math.sin(t * 1.3 + L.ph));
    if (metT0 < 0 && t > metNext) { metT0 = t; const a = r() * Math.PI * 2, e = .15 + r() * .5; metFrom.set(Math.cos(a) * 34, 10 + e * 14, Math.sin(a) * 34); metDir.set(-Math.sin(a) + (r() - .5), -.35, Math.cos(a) + (r() - .5)).normalize(); met.visible = true; }
    if (metT0 >= 0) { const k = (t - metT0) / 1.1; if (k > 1) { met.visible = false; metT0 = -1; metNext = t + 5 + r() * 8; } else { met.position.copy(metFrom).addScaledVector(metDir, k * 30); met.lookAt(met.position.clone().add(metDir)); met.rotateY(Math.PI / 2); met.material.opacity = Math.sin(k * Math.PI); } }
  });
  // 물결: 걸을 때마다 발밑에서 동그랗게 퍼진다
  const ripM = new THREE.MeshBasicMaterial({ color: 0xdfeaff, transparent: true, opacity: 0, depthWrite: false });
  const rips = Array.from({ length: 10 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 48), ripM.clone()); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return { m, t0: -9 }; });
  let ripLast = 0, ripI = 0, lx = 0, lz = 0;
  animators.push((t, dt, who) => {
    const inRoom = Math.hypot(who.x - OC.x, who.z - OC.z) < OC.a - .2;
    if (inRoom && Math.hypot(who.x - lx, who.z - lz) > .05 && t - ripLast > .5) { const R = rips[ripI++ % rips.length]; R.t0 = t; R.m.position.set(who.x, .08, who.z); R.m.visible = true; ripLast = t; }
    lx = who.x; lz = who.z;
    for (const R of rips) { if (!R.m.visible) continue; const k = (t - R.t0) / 1.8; if (k > 1) { R.m.visible = false; continue; } const s = .15 + k * 1.1; R.m.scale.set(s, s, 1); R.m.material.opacity = (1 - k) * .35; }
  });
  // 물결 소리: 문턱③ 마지막 길부터 방 안까지
  SOUND.extra.push((ctx) => {
    const len = ctx.sampleRate * 6, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 900;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(bp).connect(gain).connect(ctx.destination); src.start();
    return { gain, lp: null, swell: true, level: (x, z) => {
      if (Math.hypot(x - OC.x, z - OC.z) < OC.a) return .9;
      if (x > C3.bx0 && x < C3.bx1 && z > C3.zf - .3 && z < C3.zn) return .6;
      if (x > C3.bx0 && x < C3.ax0 && z > C3.zn && z < C3.zc1) return .25;
      return 0;
    } };
  });
});

/* ── 문턱④ + 룸4 N차적 저작물 ── */
// 문턱④: 룸3 동쪽 면에서 룸4 서쪽 벽까지 꺾임 없는 완만한 S자 곡선(약 8 m, 폭 2.4). 천장 2.1 m로 작품관에서 가장 낮다.
//        벽빛은 그대로 어둡고 바닥이 바뀐다: 룸3의 젖은 돌에서 검은 거울로. 물 소리는 여기서 사라진다.
//        빛은 왼쪽 바닥 가장자리의 가는 안내선 하나. 벽에는 제목 대신 캡션 낱말 「해체와 재구축」만 음각으로, 비스듬한 빛에 드러난다(작가님 결정: 시리즈 소개 글은 두지 않는다)
// 룸4: 12 × 9 m, 천장 4 m. 깊은 남색 무광 벽, 검은 거울 바닥, 공중의 별먼지(다가가면 비켜 난다). 무지갯빛 없음.
//      작품은 같은 크기 벽감(실제 60 cm 네모, 깊이 25 cm, 45 cm 넘는 작품만 1.5배)에 하나씩, 북쪽 벽에 걷는 차례대로 A → B → a(사이 2.5 m).
//      빛은 벽감 윗면 안쪽에 숨겨 비스듬히. 작품 윗면은 다른 방과 같은 한 줄(TOP)
const NAVY = 0x172036;
const SPACE_MIRRORS = [];   // 물·거울 바닥: 가장 가까운 하나만 비춤을 새로 그린다(둘이 서로를 그리지 않게, 멀면 쉰다)
animators.push((t, dt, who) => { SPACE.who = who; });
function gateMirror(m, dist) {
  const ob = m.onBeforeRender;
  m.onBeforeRender = function (...a) {
    const w = SPACE.who; if (!w) return;
    let best = null, bd = 1e9; for (const q of SPACE_MIRRORS) { const d = q.dist(w.x, w.z); if (d < bd) { bd = d; best = q.m; } }
    if (best !== m || bd > 10) return;
    ob.apply(this, a);
  };
  SPACE_MIRRORS.push({ m, dist });
}
gateMirror(SPACE.water, (x, z) => Math.hypot(x - OC.x, z - OC.z) - OC.a);
const rectDist = (R, x, z) => Math.hypot(Math.max(R.x0 - x, 0, x - R.x1), Math.max(R.z0 - z, 0, z - R.z1));
// 구멍 난 곧은 벽: holes [b0, b1, y0, y1](벽을 따라 b0..b1, 높이 y0..y1). 바닥까지 닿은 구멍은 지나간다
function wallHoles(axis, t0, t1, a0, a1, h, holes, mat) {   // axis 'x': x 방향 벽(두께 z = t0..t1), 'z': z 방향 벽(두께 x = t0..t1)
  const B = (b0, b1, y0, y1) => axis === 'x' ? boxMM(b0, b1, y0, y1, t0, t1, mat) : boxMM(t0, t1, y0, y1, b0, b1, mat);
  const S = (b0, b1) => axis === 'x' ? solid(b0, b1, t0, t1) : solid(t0, t1, b0, b1);
  const ms = []; let a = a0;
  for (const [b0, b1, y0, y1] of [...holes].sort((p, q) => p[0] - q[0])) {
    if (b0 > a) { ms.push(B(a, b0, 0, h)); S(a, b0); }
    if (y0 > 0) { ms.push(B(b0, b1, 0, y0)); S(b0, b1); }
    if (y1 < h) ms.push(B(b0, b1, y1, h));
    a = b1;
  }
  if (a1 > a) { ms.push(B(a, a1, 0, h)); S(a, a1); }
  for (const m of ms) blockers.push(m);
}
// 곡선 통로 가운데 줄과 걷는 방향 왼쪽(lx, lz)
const c4pts = Array.from({ length: 49 }, (_, i) => {
  const t = i / 48, s = t * t * (3 - 2 * t), ds = 6 * t * (1 - t), tx = C4.x1 - C4.x0, tz = (C4.z1 - C4.z0) * ds, L = Math.hypot(tx, tz);
  return { t, x: C4.x0 + tx * t, z: C4.z0 + (C4.z1 - C4.z0) * s, lx: tz / L, lz: -tx / L };
});
// 곡선 따라 띠: offA == offB면 세로 벽(높이 yA..yB), 아니면 높이 yA의 가로 띠(바닥·천장). col(t): 점마다 색
function ribbon(offA, offB, yA, yB, mat, col) {
  const pos = [], idx = [], cols = [], vert = offA === offB;
  c4pts.forEach((p, i) => {
    pos.push(p.x + p.lx * offA, yA, p.z + p.lz * offA, p.x + p.lx * offB, vert ? yB : yA, p.z + p.lz * offB);
    if (col) { const c = col(p.t); cols.push(c.r, c.g, c.b, c.r, c.g, c.b); }
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  if (col) g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); scene.add(m); return m;
}
const nthWorks = restUnits.flatMap(u => u.works.map((w, k) => ({ w, size: u.sizes[k], real: parseSize(w.size) })));
interior('nth', [[C4.x0 - .1, R4.x0 + .3, -26.3, -19.9], [R4.x0, R4.x1, R4.z0, R4.z1]], [C4.x0 - .1, R4.x1 + .25, R4.z0 - 1.0, R4.z1 + .1, R4.h + .3], () => {
  const navyM = std({ color: NAVY, roughness: 1 }), wallC = std({ color: 0x1d2130, roughness: .95, side: THREE.DoubleSide });
  // ── 문턱④ ──
  const HW4 = C4.w / 2;
  for (const s of [1, -1]) {
    const m = ribbon(s * HW4, s * HW4, 0, C4.h, wallC); blockers.push(m);
    for (let i = 1; i < c4pts.length; i++) { const p = c4pts[i - 1], q = c4pts[i], o = s * (HW4 + .12); segSolid(p.x + p.lx * o, p.z + p.lz * o, q.x + q.lx * o, q.z + q.lz * o, .2); }
  }
  ribbon(-HW4 - .05, HW4 + .05, C4.h, 0, std({ color: 0x181b24, roughness: 1, side: THREE.DoubleSide }));   // 천장
  const wet = new THREE.Color(0x2a2b2e), blk = new THREE.Color(0x06070a);
  ribbon(-HW4 - .05, HW4 + .05, .035, 0, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .12, metalness: .35, side: THREE.DoubleSide }), t => wet.clone().lerp(blk, Math.min(1, t * 1.6)));   // 바닥: 젖은 돌 → 검은 거울
  // 안내선: 걷는 방향 왼쪽 바닥 가장자리의 가는 빛 하나
  ribbon(HW4 - .1, HW4 - .07, .04, 0, new THREE.MeshBasicMaterial({ color: 0xcfc4a8, side: THREE.DoubleSide }));
  for (const t of [.2, .5, .8]) { const p = c4pts[Math.round(t * 48)], l = new THREE.PointLight(0xcfc4a8, .35, 2.4, 1.6); l.position.set(p.x + p.lx * (HW4 - .2), .12, p.z + p.lz * (HW4 - .2)); scene.add(l); }
  // 음각 글자: 첫 굽이 바깥(왼쪽) 벽. 위에서 벽을 스치는 빛에만 드러난다. 글은 N차적 저작물 A·B 캡션의 낱말 그대로(작가님이 고름)
  {
    const ENG_TEXT = '해체와 재구축';
    const engH = canvasTex(1024, 192, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); font(g, h * .58, 500, FONT_B, '#000'); g.textAlign = 'center'; g.fillText(ENG_TEXT, w / 2, h * .74); });
    const engC = canvasTex(1024, 192, (g, w, h) => {
      g.fillStyle = '#1d2130'; g.fillRect(0, 0, w, h); g.textAlign = 'center';
      font(g, h * .58, 500, FONT_B, 'rgba(0,0,0,.55)'); g.fillText(ENG_TEXT, w / 2, h * .74 - 3);       // 윗 가장자리 그늘
      font(g, h * .58, 500, FONT_B, 'rgba(120,128,150,.45)'); g.fillText(ENG_TEXT, w / 2, h * .74 + 3);   // 아랫 가장자리가 빛을 받는다
      font(g, h * .58, 500, FONT_B, '#161a26'); g.fillText(ENG_TEXT, w / 2, h * .74);
    });
    const i = Math.round(.3 * 48), p = c4pts[i], q = c4pts[i + 1], tx = q.x - p.x, tz = q.z - p.z, L = Math.hypot(tx, tz);
    const wx = p.x + p.lx * (HW4 - .012), wz = p.z + p.lz * (HW4 - .012);
    const eng = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .28), new THREE.MeshStandardMaterial({ map: engC, bumpMap: engH, bumpScale: 2.5, roughness: .9 }));
    place(eng, wx, 1.55, wz, -p.lx, -p.lz);
    const sp = new THREE.SpotLight(0xe8e0d0, 5, 2.2, .7, 1, 1.2); sp.position.set(wx - p.lx * .18, C4.h - .06, wz - p.lz * .18); sp.target.position.set(wx + tx / L * 0, 1.45, wz); scene.add(sp, sp.target);
  }

  // ── 룸4 ──
  ground(R4.x0, R4.x1, R4.z0, R4.z1, .03, std({ color: 0x030406, roughness: .2, metalness: .3 }), 2.0);
  {   // 검은 거울 바닥: 벽감의 빛과 별먼지가 희미하게 비친다
    const mir = new Reflector(new THREE.PlaneGeometry(R4.x1 - R4.x0, R4.z1 - R4.z0), { clipBias: .003, textureWidth: Math.round(innerWidth * .6), textureHeight: Math.round(innerHeight * .6), color: 0x3c414c });
    mir.rotation.x = -Math.PI / 2; mir.position.set((R4.x0 + R4.x1) / 2, .045, (R4.z0 + R4.z1) / 2); scene.add(mir);
    gateMirror(mir, (x, z) => Math.min(rectDist(R4, x, z), Math.hypot(x - C4.x1, z - C4.z1) + 1));
  }
  ceiling(R4.x0, R4.x1, R4.z0, R4.z1, R4.h, std({ color: 0x0f1424, roughness: 1, side: THREE.DoubleSide }), 2.4);
  const T = .2, eIn = (C4.z1 - HW4 + .15), eOut = (C4.z1 + HW4 - .15);   // 서쪽 벽 들어오는 문(통로 폭, 높이 2.1)
  wallHoles('z', R4.x0 - T, R4.x0, R4.z0 - T, R4.z1 + T, R4.h, [[eIn - .15, eOut + .15, 0, C4.h]], navyM);
  wallHoles('z', R4.x1, R4.x1 + T, R4.z0 - T, R4.z1 + T, R4.h, [], navyM);
  // 남쪽 벽: 동쪽 끝에 문턱⑤로 나가는 문
  const xo0 = C5.ax0 + .2, xo1 = C5.ax1 - .2;
  // 벽감: 북쪽 벽(왼쪽 → 오른쪽 = 서 → 동)부터, 넘치면 남쪽 벽(서 → 동)
  const NS = .6 * SCALE, ND = .25 * SCALE, GAP = 2.5;
  const nicheS = (r) => (Math.max(r[0], r[1]) > 45 ? 1.5 : 1) * NS;
  const nCY = TOP - .273 * SCALE / 2;   // 벽감 가운데 높이: 27.3 cm 작품이 벽감 한가운데 오는 높이(작품 윗면은 언제나 TOP)
  const north = nthWorks.slice(0, 3), south = nthWorks.slice(3, 5);
  const rowX = (list) => { const ws = list.map(o => nicheS(o.real)), tot = ws.reduce((s, v) => s + v, 0) + GAP * (list.length - 1) + CAP_W + .12; let x = (R4.x0 + R4.x1) / 2 - tot / 2; return ws.map(v => { const c = x + v / 2; x += v + GAP; return c; }); };
  const nicheM = std({ color: 0x1c2640, roughness: .85 });
  const place4 = (list, zf, nz) => {   // zf: 벽 안쪽 면, nz: 방 안쪽(+1 북쪽 벽, -1 남쪽 벽)
    const xs = rowX(list), holes = [];
    list.forEach((o, i) => {
      const S = nicheS(o.real), cx = nz > 0 ? xs[i] : (R4.x0 + R4.x1) - xs[i] - 0, [ww, hh] = o.size;
      const big = S > NS, cy = Math.max(TOP - hh / 2, .9 + hh / 2), ny = big ? cy : nCY, zb = zf - nz * ND;
      holes.push([cx - S / 2, cx + S / 2, ny - S / 2, ny + S / 2]);
      // 벽감 안쪽 다섯 면
      const z0 = Math.min(zf, zb), z1 = Math.max(zf, zb), e = .04;
      boxMM(cx - S / 2 - e, cx + S / 2 + e, ny - S / 2 - e, ny + S / 2 + e, nz > 0 ? zb - e : zb, nz > 0 ? zb : zb + e, nicheM);
      boxMM(cx - S / 2 - e, cx + S / 2 + e, ny + S / 2, ny + S / 2 + e, z0, z1, nicheM); boxMM(cx - S / 2 - e, cx + S / 2 + e, ny - S / 2 - e, ny - S / 2, z0, z1, nicheM);
      boxMM(cx - S / 2 - e, cx - S / 2, ny - S / 2, ny + S / 2, z0, z1, nicheM); boxMM(cx + S / 2, cx + S / 2 + e, ny - S / 2, ny + S / 2, z0, z1, nicheM);
      // 숨긴 빛: 벽감 윗면 안쪽 앞에서 비스듬히 작품으로
      const sp = new THREE.SpotLight(0xfff0dc, 4.2, S * 1.9, .62, .95, 1.3); sp.position.set(cx, ny + S / 2 - .04, zf - nz * .07); sp.target.position.set(cx, cy - hh * .15, zb); scene.add(sp, sp.target);
      const dX = nz > 0 ? 1 : -1;
      putWork(o.w, ww, hh, cx, cy, zb + nz * .005, [0, nz], [dX, 0], true, '룸4 N차적 저작물 · ' + (nz > 0 ? '북쪽' : '남쪽') + ' 벽 벽감 ' + (i + 1),
        [cx + dX * (S / 2 + .12 + (CAP_W - .08) / 2), zf + nz * .012]);
    });
    return holes;
  };
  const nh = place4(north, R4.z0, 1);
  wallHoles('x', R4.z0 - T, R4.z0, R4.x0 - T, R4.x1 + T, R4.h, nh, navyM);
  const sh = south.length ? place4(south, R4.z1, -1) : [];
  wallHoles('x', R4.z1, R4.z1 + T, R4.x0 - T, R4.x1 + T, R4.h, [...sh, [xo0, xo1, 0, 2.6]], navyM);
  // 방은 거의 어둡게: 남색 벽이 겨우 드러날 만큼
  { const l = new THREE.PointLight(0x8a9cd0, .9, 12, 1.2); l.position.set((R4.x0 + R4.x1) / 2, R4.h - .4, (R4.z0 + R4.z1) / 2); scene.add(l); }
  // 별먼지: 작품의 반짝이는 가루처럼 아주 작게 떠다니고, 다가가면 비켜 난다
  {
    const N = 560; let seed = 41; const r = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const base = new Float32Array(N * 3), pos = new Float32Array(N * 3), off = new Float32Array(N * 3), ph = new Float32Array(N), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      base.set([R4.x0 + .3 + r() * (R4.x1 - R4.x0 - .6), .25 + r() * (R4.h - .6), R4.z0 + .3 + r() * (R4.z1 - R4.z0 - .6)], i * 3); ph[i] = r() * 6.283;
      const b = .55 + r() * .45, gold = r() < .35; col.set(gold ? [b, b * .86, b * .62] : [b * .9, b * .93, b], i * 3);
    }
    pos.set(base);
    const dustT = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: .02, map: dustT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: .9 });
    const dust = new THREE.Points(geo, mat); dust.frustumCulled = false; scene.add(dust);
    animators.push((t, dt, who) => {
      if (rectDist(R4, who.x, who.z) > 1.5) return;
      const k = Math.min(1, dt * 2.5), m = reduceMotion ? 0 : 1;
      for (let i = 0; i < N; i++) {
        const j = i * 3, p = ph[i];
        const bx = base[j] + m * Math.sin(t * .11 + p) * .18, by = base[j + 1] + m * Math.sin(t * .07 + p * 1.7) * .12, bz = base[j + 2] + m * Math.cos(t * .09 + p) * .18;
        const dx = bx - who.x, dy = by - 1.5, dz = bz - who.z, d = Math.hypot(dx, dy, dz), R = 1.3;
        const push = d < R ? (R - d) / Math.max(d, .05) * .9 : 0;
        off[j] += (dx * push - off[j]) * k; off[j + 1] += (dy * push - off[j + 1]) * k; off[j + 2] += (dz * push - off[j + 2]) * k;
        pos[j] = bx + off[j]; pos[j + 1] = by + off[j + 1]; pos[j + 2] = bz + off[j + 2];
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = .9 * (m ? .85 + .15 * Math.sin(t * 1.1) : 1);
    });
  }
});

/* ── 문턱⑤: 룸4 → 중정 ── */
// 한 번 꺾인 짧은 전실. 남쪽으로 가다 동쪽으로 꺾으면, 어둠 끝에 한낮을 등진 간유리 미닫이 두 짝만 빛난다(광원은 그것뿐).
// 문이 열리면 처마 그늘 아래로 나서고, 눈이 밝음에 적응하듯 밝기가 1~1.5초에 걸쳐 돌아온다(섬광 없음). 문을 나서면 은은한 바람 소리.
// 섹션이 아니라 마당이라 글자는 두지 않는다
interior('exit', [[C5.ax0, C5.ax1, C5.z0 - .3, C5.bz0 + .1], [C5.ax0, C5.x1 + .2, C5.bz0, C5.bz1], [R1.x1 + .2, -10.3, CDOOR.z0, CDOOR.z1]],
  [C5.ax0 - .25, C5.x1, C5.z0 - .1, CDOOR.z1 + .25, C5.h + .3], () => {
  const T = .2, dm = std({ color: 0x1a1e2a, roughness: .95 }), dmD = std({ color: 0x1a1e2a, roughness: .95, side: THREE.DoubleSide });
  const W = (x0, x1, z0, z1, h = C5.h) => { const m = boxMM(x0, x1, 0, h, z0, z1, dm); blockers.push(m); solid(x0, x1, z0, z1); };
  W(C5.ax0 - T, C5.ax0, C5.z0 - T, C5.bz1);              // 서쪽(꺾이는 벽)
  W(C5.ax1, C5.ax1 + T, C5.z0 - T, C5.bz0);              // 첫 길 동쪽
  W(C5.ax1, -10.55, C5.bz0 - T, C5.bz0);             // 둘째 길 북쪽
  W(R1.x1 + .2, -10.55, CDOOR.z1, CDOOR.z1 + T);      // 문 남쪽 옆(룸1 모서리와 중정 벽 사이)
  // 둘째 길 남쪽 = 룸1 북쪽 벽 바깥, 문 옆 = 룸1 동쪽 벽 바깥: 같은 어두운 면으로 덮는다
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(R1.x1 + .2 - C5.ax0, C5.h), dmD); place(m, (C5.ax0 + R1.x1 + .2) / 2, C5.h / 2, R1.z0 - .2 - .006, 0, -1); }
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(CDOOR.z1 - C5.bz1, C5.h), dmD); place(m, R1.x1 + .2 + .006, C5.h / 2, (C5.bz1 + CDOOR.z1) / 2, 1, 0); }
  // 중정 벽 안쪽 면(문 둘레)도 어둡게
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(CDOOR.z0 - C5.bz0, C5.h), dmD); place(m, -10.56, C5.h / 2, (C5.bz0 + CDOOR.z0) / 2, -1, 0); }
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(CDOOR.z1 - CDOOR.z0, C5.h - 3.1), dmD); place(m, -10.56, (3.1 + C5.h) / 2, (CDOOR.z0 + CDOOR.z1) / 2, -1, 0); }
  const fl = std({ color: 0x0c0d11, roughness: .6 });
  ground(C5.ax0, C5.ax1, C5.z0 - .2, C5.bz0, .03, fl, 2.0); ground(C5.ax0, -10.4, C5.bz0, C5.bz1, .03, fl, 2.0); ground(R1.x1 + .2, -10.4, C5.bz1, CDOOR.z1, .03, fl, 2.0);
  const cm = std({ color: 0x14171f, roughness: 1, side: THREE.DoubleSide });
  ceiling(C5.ax0, C5.ax1, C5.z0 - .2, C5.bz0, C5.h, cm, 2.4); ceiling(C5.ax0, -10.4, C5.bz0, C5.bz1, C5.h, cm, 2.4); ceiling(R1.x1 + .2, -10.4, C5.bz1, CDOOR.z1, C5.h, cm, 2.4);
  // 빛나는 간유리가 전실에 흘리는 빛(문 쪽에서만)
  { const l = new THREE.PointLight(0xfff3e0, 1.3, 7, 1.6); l.position.set(-11.0, 1.7, (CDOOR.z0 + CDOOR.z1) / 2); scene.add(l); }
  stampMark('works', -12.6, (C5.bz0 + C5.bz1) / 2);   // 도장 자리: 중정으로 나가기 전 마지막 바닥
}, [-10.4, (CDOOR.z0 + CDOOR.z1) / 2, 9]);

// 눈의 적응: 어두운 룸4·문턱④⑤에서는 천천히 눈이 열리고(조금 밝게), 중정에 나서면 1~1.5초에 걸쳐 제 밝기로 돌아온다
{
  let expo = 1;
  const inR = (x, z, a, b, c, d) => x > a && x < b && z > c && z < d;
  const dark = (x, z) => rectDist(R4, x, z) < .01 || inR(x, z, C4.x0, R4.x0, -26.3, -19.9) || inR(x, z, C5.ax0, C5.ax1, C5.z0 - .3, C5.bz0) || inR(x, z, C5.ax0, -10.3, C5.bz0, C5.bz1) || inR(x, z, R1.x1 + .2, -10.3, CDOOR.z0, CDOOR.z1);
  animators.push((t, dt, who) => {
    const want = dark(who.x, who.z) ? 1.3 : 1;
    if (reduceMotion) expo = want; else expo += (want - expo) * Math.min(1, dt * (want > expo ? .45 : 2.4));
    renderer.toneMappingExposure = expo;
  });
}
// 바람 소리: 작품관 문을 나서 중정 처마 밑에서, 문에서 멀어질수록 잦아든다
SOUND.extra.push((ctx) => {
  const len = ctx.sampleRate * 8, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++) { last = (last + .05 * (Math.random() * 2 - 1)) / 1.05; d[i] = last * 2.6 + (Math.random() * 2 - 1) * .05; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .5;
  const gain = ctx.createGain(); gain.gain.value = 0;
  src.connect(bp).connect(gain).connect(ctx.destination); src.start();
  const dz = (CDOOR.z0 + CDOOR.z1) / 2;
  return { gain, lp: null, mod: (t) => { bp.frequency.value = 460 + 160 * Math.sin(t * .21) * Math.sin(t * .13 + 1); return .45 + .55 * Math.abs(Math.sin(t * .17) * Math.sin(t * .29 + .6)); },
    level: (x, z) => {
      if (x > -10.4 && x < 10.4 && z > -9.4 && z < 9.4) return Math.max(0, 1 - Math.hypot(x + 10.4, z - dz) / 10) * .9;
      if (x > -11.1 && x <= -10.4 && z > CDOOR.z0 && z < CDOOR.z1) return .3;
      return 0;
    } };
});
