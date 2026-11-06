
/* ───────── ② IP관: 팝업북 속 얼빵해달 세계 ───────── */
const IPR = ROOMS.ip;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const easeBack = t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
// 글귀 카드: 그림책 종이에 쓴 글
function paperCard(w, h, draw) {
  return panel(w, h, (g, W, H) => {
    g.fillStyle = '#fbf5e6'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#d9c9a4'; g.lineWidth = H * .012; g.strokeRect(H * .03, H * .03, W - H * .06, H - H * .06);
    draw(g, W, H);
  }, { ppm: 420 });
}
const ink = (g, size, weight = 400, font = FONT_B, color = '#2b2520') => { g.fillStyle = color; g.font = `${weight} ${size}px ${font}`; };
const pages = [];
function popPage({ x, z, nx, nz, layers, info }) {
  const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = Math.atan2(nx, nz); scene.add(grp);
  const cover = boxMM(-1.7, 1.7, 0, .05, -1.25, 1.25, new THREE.MeshStandardMaterial({ color: 0x24336e, roughness: .7 }), null, grp);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.4), M.paper); sheet.rotation.x = -Math.PI / 2; sheet.position.y = .055; grp.add(sheet);
  const gutter = new THREE.Mesh(new THREE.PlaneGeometry(.04, 2.4), new THREE.MeshBasicMaterial({ color: 0xd9c9a4 })); gutter.rotation.x = -Math.PI / 2; gutter.position.y = .057; grp.add(gutter);
  const hinges = layers.map(L => {
    const h = new THREE.Group(); h.position.set(L.x || 0, .06, L.z); h.add(L.obj); grp.add(h); if (L.obj.position.x === 0 && L.ox) L.obj.position.x = L.ox;
    return { h, delay: L.delay || 0 };
  });
  const wp = new THREE.Vector3(); grp.getWorldPosition(wp);
  const pg = { grp, hinges, k: 0, x, z, update: null };
  pages.push(pg);
  // 펼친 쪽의 바닥 판은 밟지 못하게
  const c = Math.cos(grp.rotation.y), s = Math.sin(grp.rotation.y), ex = Math.abs(c) * 1.7 + Math.abs(s) * 1.25, ez = Math.abs(s) * 1.7 + Math.abs(c) * 1.25;
  solid(x - ex, x + ex, z - ez, z + ez);
  if (info) pickable(grp, info);
  return pg;
}
function stepPages(dt, me) {
  for (const p of pages) {
    const d = Math.hypot(me.x - p.x, me.z - p.z), want = smooth(7.0, 3.2, d);
    p.k += (want - p.k) * Math.min(1, dt * (want > p.k ? 1.6 : 2.4));
    for (const { h, delay } of p.hinges) {
      const kl = Math.min(1, Math.max(0, (p.k - delay) / (1 - delay)));
      const e = reduceMotion ? (kl > .5 ? 1 : 0) : easeBack(kl);
      h.rotation.x = -(1 - Math.min(1, e)) * Math.PI / 2; h.scale.y = Math.max(.02, Math.min(1.06, e));   // 접혀 있을 땐 납작하게
      h.visible = kl > .01;
    }
    p.update && p.update(p.k, dt);
  }
}
{
  // ── ① 들어가는 문턱: 그려지는 전실 ──
  // 중정 문은 다른 관과 같은 간유리 미닫이(patch-doors). 문 안 짧은 전실에서 중정의 한지가 그대로 그림책 종이가 된다(전문가 자문 후 다시 만듦).
  // 그려지는 차례: 회색 연필 밑선 → 잉크 윤곽 → 색연필 빗금 채색. 걸어 들어간 만큼 앞서 그려진다.
  // 그림은 흉내 내지 않고 작가님 그림 파일을 그대로 쓴다: 정면 한 장 = 「줍기」(story-collect) 오른쪽 위(바다·거품·모래, 해달은 들지 않게), 바닥 모래 결도 같은 그림에서. 모래에 조개는 두지 않는다(작가님 결정, A안)
  // 유일한 글(IP 페이지 첫 문장)은 남색 색연필 손글씨로 작게(작가님 결정).
  const CH = { x0: IPR.x0 + .2, x1: IPR.x0 + 4.7, z0: -6.1, z1: -2.9, h: 3.2 };
  const IP_FIRST = ['얼빵해달은 현대사회에 살고 있는 조개배달부다.', '그런데 해달이면서 수영을 못 한다.'];
  // 「물빛」 통로 첫 문장 글꼴: 홈페이지 본문 글꼴 노토 산스 가늘게(작가님 결정)
  const WALL_FONT = '"Noto Sans KR"', WALL_W = 300;
  const HAND = '"Nanum Pen Script"', NAVY_PEN = '#2d4b8e', INK_C = 'rgba(58,44,34,.92)';
  const DRAW = { p: { value: 0 } };
  const PPM = 160, L = CH.x1 - CH.x0, Hh = CH.h, Wd = CH.z1 - CH.z0;
  const imgCollect = new Image(); imgCollect.src = 'ip/story-collect.webp';
  const whenImg = (im) => new Promise(res => { if (im.complete && im.naturalWidth) res(im); else im.addEventListener('load', () => res(im), { once: true }); });
  const PAGE = [840, 0, 414, 570];   // 「줍기」에서 해달과 조개가 들지 않는 오른쪽 위(바다 → 거품 → 모래)
  const SAND = [560, 1030, 440, 220];   // 모래 결: 해달 발 아래 빈 모래
  // 종이: 따뜻한 미색 + 잔 섬유
  const paper = (g, W, H, r) => { g.fillStyle = '#f6efe2'; g.fillRect(0, 0, W, H); g.globalAlpha = .05; for (let i = 0; i < W * H / 260; i++) { g.fillStyle = r() < .5 ? '#b9a98f' : '#ffffff'; g.fillRect(r() * W, r() * H, 1 + r() * 6, 1); } g.globalAlpha = 1; };
  // 중정과 같은 한지 벽(나무 살)
  const LAT = (W, H) => { const xs = [], ys = [H * .2, H * .62, H - .5 * PPM]; for (let x = 0; x <= W + 1; x += 1.2 * PPM) xs.push(x); return { xs, ys }; };
  const hanji = (g, W, H, r) => { g.fillStyle = '#ebe4d6'; g.fillRect(0, 0, W, H); g.globalAlpha = .06; for (let i = 0; i < W * H / 300; i++) { g.fillStyle = '#9a8a70'; g.fillRect(r() * W, r() * H, 1 + r() * 5, 1); } g.globalAlpha = 1; g.fillStyle = '#8a6a48'; g.fillRect(0, H - .5 * PPM, W, .5 * PPM); g.fillStyle = '#3b2a1e'; const { xs, ys } = LAT(W, H); for (const x of xs) g.fillRect(x - 5, 0, 10, H); for (const y of ys) g.fillRect(0, y - 5, W, 10); };
  // 연필로 다시 그린 살(두 번 긋는 떨리는 선) + 면 가장자리 굵은 잉크선
  const pencilLine = (g, x0, y0, x1, y1, r, w = 3) => { for (let k = 0; k < 2; k++) { g.lineWidth = w * (k ? .6 : 1); g.beginPath(); const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 30)); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t + (r() - .5) * 2.2, y = y0 + (y1 - y0) * t + (r() - .5) * 2.2; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } };
  const latticeLines = (g, W, H, r, gap) => { g.strokeStyle = INK_C; g.lineCap = g.lineJoin = 'round'; const { xs } = LAT(W, H); for (const x of xs.slice(1, -1)) { if (gap && x > gap[0] && x < gap[1]) { pencilLine(g, x, 0, x, gap[2], r); pencilLine(g, x, gap[3], x, H, r); } else pencilLine(g, x, 0, x, H, r); } pencilLine(g, 0, H - .5 * PPM, W, H - .5 * PPM, r); g.lineWidth = 9; g.strokeRect(4, 4, W - 8, H - 8); };
  const paperWall = (g, W, H, r) => { paper(g, W, H, r); g.lineWidth = 2; for (let i = 0; i < W * .9; i++) { const x = r() * W, y = H - r() ** 1.8 * .9 * PPM; g.strokeStyle = `rgba(232,196,120,${.18 + r() * .25})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10, y - 14); g.stroke(); } };   // 아래쪽에 모래빛 색연필 빗금
  // 그림에서 잉크 선만 뽑기(어두운 화소 → 투명 바탕의 선)
  function inkOf(src, sx, sy, sw, sh, W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(src, sx, sy, sw, sh, 0, 0, W, H); const d = g.getImageData(0, 0, W, H), a = d.data; for (let i = 0; i < a.length; i += 4) { const v = (a[i] + a[i + 1] + a[i + 2]) / 3, k = Math.max(0, Math.min(1, (120 - v) / 70)); a[i] = 52; a[i + 1] = 40; a[i + 2] = 34; a[i + 3] = 255 * k; } g.putImageData(d, 0, 0); return c; }
  // 면 하나: base(실제) · paint(그림책) · line(투명 바탕 선) 세 장. 걷는 방향(x)으로 그리는 앞줄 DRAW.p 뒤만 바뀐다
  function drawnMat(w, h, base, paint, line, seed, opts = {}) {   // opts.hole [z0, z1, y0, y1]: 뚫린 자리, opts.sExpr: 그리는 앞줄 식(기본은 걷는 방향 x)
    const W = Math.round(w * PPM), H = Math.round(h * PPM);
    const mk = (f, s) => { const t = canvasTex(W, H, (g) => f(g, W, H, rng(s))); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
    const tb = mk(base, seed), tp = mk(paint, seed + 1), tl = mk(line, seed + 2);
    const m = new THREE.MeshBasicMaterial({ map: tb, side: THREE.DoubleSide, toneMapped: false });   // 작가님 그림 색 그대로
    m.customProgramCacheKey = () => 'drawn|' + (opts.hole || []).join(',') + '|' + (opts.sExpr || '');   // 면마다 셰이더가 다를 수 있다
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { pMap: { value: tp }, lMap: { value: tl }, drawP: DRAW.p, sx: { value: CH.x0 }, sL: { value: L } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nuniform sampler2D pMap;\nuniform sampler2D lMap;\nuniform float drawP;\nuniform float sx;\nuniform float sL;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          ${opts.hole ? `if (vWP.z > ${opts.hole[0].toFixed(3)} && vWP.z < ${opts.hole[1].toFixed(3)} && vWP.y > ${opts.hole[2].toFixed(3)} && vWP.y < ${opts.hole[3].toFixed(3)}) discard;` : ''}
          float s = ${opts.sExpr || '(vWP.x - sx) / sL'};
          float n = fract(sin(dot(floor(vWP.yz * 6.0 + vWP.x * 2.0), vec2(12.9898, 78.233))) * 43758.5453);
          float e = s + (n - .5) * .05;
          float hatch = fract((vWP.y * .8 + vWP.z * .6 + vWP.x * .6) * 9.0);
          float paintOn = step(e + hatch * .14, drawP - .2);
          float inkOn = step(e, drawP - .08), under = step(e, drawP);
          vec4 pc = texture2D(pMap, vMapUv);
          diffuseColor.rgb = mix(diffuseColor.rgb, pc.rgb, paintOn);
          vec4 lc = texture2D(lMap, vMapUv);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.56, .54, .52), lc.a * .55 * under * (1.0 - inkOn));
          diffuseColor.rgb = mix(diffuseColor.rgb, lc.rgb, lc.a * inkOn);`);
    };
    // 그림 파일이 늦게 오면 다시 그린다
    m.userData.redraw = () => { for (const [t, f, s] of [[tb, base, seed], [tp, paint, seed + 1], [tl, line, seed + 2]]) { const c = t.image, g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); f(g, c.width, c.height, rng(s)); t.needsUpdate = true; } };
    return m;
  }
  const mats = [];
  const PG = { h: 2.9, w: 2.9 * PAGE[2] / PAGE[3], y: .15 }, PGz = (CH.z0 + CH.z1) / 2, PAGE_OPEN = { k: 0 };   // 정면 그림책 한 장
  interior('ipEntry', [[IPR.x0 - .1, CH.x1, CH.z0, CH.z1]], [CH.x0 + .05, CH.x1 + .25, CH.z0 - .25, CH.z1 + .25, CH.h + .3], () => {
    // ① 「물빛」 통로(작가님 결정: 통로마다 감각 하나가 주인공). 하얗고 짧은 통로의 천장과 벽에 물결 빛이 일렁이고, 해변 쪽으로 갈수록 짙어진다.
    //    바닥은 해변 쪽으로 갈수록 모래빛(새로 그린 sand). 옆벽에 IP관의 유일한 글(IP 페이지 첫 문장). 끝 문은 옆으로 미끄러져 열린다
    const WL = { time: { value: 0 } }; animators.push((t) => { WL.time.value = reduceMotion ? 0 : t; });
    const sandTexWL = tex('ip/new/beach/web/sand.webp'); sandTexWL.wrapS = sandTexWL.wrapT = THREE.RepeatWrapping;
    const waterLight = ({ map = null, color = 0xf6f4ee, hole = null, sand = false, k = 1, ink = false } = {}) => {
      const m = new THREE.MeshBasicMaterial({ map, color, toneMapped: false, side: THREE.DoubleSide });
      m.customProgramCacheKey = () => 'wl|' + (hole || []).join(',') + '|' + sand + '|' + k + '|' + !!map + '|' + ink;
      m.onBeforeCompile = (sh) => {
        sh.uniforms.wlT = WL.time; sh.uniforms.sandM = { value: sandTexWL };
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
          varying vec3 vWP; uniform float wlT; uniform sampler2D sandM;
          float cau(vec2 p, float t) { vec2 q = p; float v = 0.0; for (int i = 0; i < 3; i++) { q += vec2(sin(q.y * 1.7 + t * .55), cos(q.x * 1.5 - t * .45)) * .5; v += abs(sin(q.x * 2.1) * sin(q.y * 2.3)); } v /= 3.0; return pow(1.0 - v, 5.0) * 2.2; }`)
          .replace('#include <map_fragment>', `#include <map_fragment>
          ${hole ? `if (vWP.z > ${hole[0].toFixed(3)} && vWP.z < ${hole[1].toFixed(3)} && vWP.y > ${hole[2].toFixed(3)} && vWP.y < ${hole[3].toFixed(3)}) discard;` : ''}
          float s = clamp((vWP.x - ${CH.x0.toFixed(2)}) / ${L.toFixed(2)}, 0.0, 1.0);
          ${sand ? 'diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(sandM, vWP.xz / 2.0).rgb, smoothstep(.05, .95, s));' : ''}
          vec2 p = vec2(vWP.x + vWP.z * .8, vWP.y + vWP.z * .6) * 1.5;
          float c = cau(p, wlT) * .7 + cau(p * 1.7 + 3.1, wlT * 1.3) * .3;
          ${ink ? 'c *= smoothstep(.45, .85, dot(diffuseColor.rgb, vec3(.333)));' : ''}
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.86, .95, .99), s * .7);   // 해변 쪽으로 물빛이 스며 푸르게
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.66, .88, .96), clamp(c * (.14 + .62 * s) * ${k.toFixed(2)}, 0.0, .75));   // 물결 빛(하얗게 날아가지 않게 섞는다)`);
      };
      return m;
    };
    // 옆벽(북): 첫 문장을 남색 손글씨로(작가님 결정). 바탕은 하얀 벽
    const textT = canvasTex(Math.round(L * PPM), Math.round(Hh * PPM), (g, W, H) => { g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, W, H); });
    const drawText = () => { const g = textT.image.getContext('2d'), W = textT.image.width, H = textT.image.height; g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, W, H);
      // 문장마다 한 줄에 들어오게: 긴 문장이 벽 폭(양옆 0.5 m 남김)에 맞는 크기로
      g.font = `${WALL_W} 100px ${WALL_FONT}, sans-serif`; const maxW = W - 1.0 * PPM, longest = Math.max(...IP_FIRST.map(t => g.measureText(t).width));
      const fs = Math.min(.2 * PPM, 100 * maxW / longest); g.font = `${WALL_W} ${fs}px ${WALL_FONT}, sans-serif`; g.fillStyle = NAVY_PEN; g.textBaseline = 'alphabetic';
      IP_FIRST.forEach((t, i) => g.fillText(t, .5 * PPM, H - 1.8 * PPM + i * fs * 1.6)); textT.needsUpdate = true; };
    drawText(); document.fonts && document.fonts.load(`${WALL_W} 40px ${WALL_FONT}`, IP_FIRST.join('')).then(drawText).catch(() => {});
    const mN = new THREE.Mesh(new THREE.PlaneGeometry(L, Hh), waterLight({ map: textT, color: 0xffffff, ink: true })); place(mN, CH.x0 + L / 2, Hh / 2, CH.z0, 0, 1); blockers.push(mN);
    const mS = new THREE.Mesh(new THREE.PlaneGeometry(L, Hh), waterLight()); place(mS, CH.x0 + L / 2, Hh / 2, CH.z1, 0, -1); blockers.push(mS);
    solid(CH.x0, CH.x1, CH.z0 - .2, CH.z0); solid(CH.x0, CH.x1, CH.z1, CH.z1 + .2);
    // 끝 벽: 가운데 문 자리
    const mE = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hh), waterLight({ hole: [PGz - PG.w / 2, PGz + PG.w / 2, PG.y, PG.y + PG.h], k: 1.2 })); place(mE, CH.x1, Hh / 2, PGz, -1, 0); blockers.push(mE);
    solid(CH.x1, CH.x1 + .2, CH.z0 - .2, PGz - PG.w / 2); solid(CH.x1, CH.x1 + .2, PGz + PG.w / 2, CH.z1 + .2);
    // 끝 문(안쪽 면): 한낮 바깥빛을 받아 환한 반투명 면에 물결 빛이 가장 짙게
    const wP = waterLight({ color: 0xfdfcf8, k: 1.6 });
    const pivot = new THREE.Group(); pivot.position.set(CH.x1 - .02, PG.y + PG.h / 2, PGz - PG.w / 2); scene.add(pivot);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(PG.w, PG.h), wP); pm.rotation.y = -Math.PI / 2; pm.position.set(0, 0, PG.w / 2); pivot.add(pm); blockers.push(pm);
    { const bt = canvasTex(512, 704, (g, W, H) => { g.fillStyle = '#f1d79a'; g.fillRect(0, 0, W, H); }); const bk = (f) => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = 'ip/new/beach/web/' + f; });   // 쪽의 뒷면(해변 쪽에서 보이는 면): 새 바다·거품·모래로 그린 작은 바닷가
      Promise.all([bk('sea.webp'), bk('sand.webp'), bk('foam.webp')]).then(([sea, sand, foam]) => { const g = bt.image.getContext('2d'), W = 512, H = 704; g.drawImage(sand, 0, 0, 1024, 1024, 0, H * .38, W, W); g.drawImage(sea, 0, 0, 1024, 600, 0, 0, W, H * .42); g.drawImage(foam, 0, 0, 1400, 512, -10, H * .33, W + 20, H * .14); g.strokeStyle = 'rgba(58,44,34,.85)'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6); bt.needsUpdate = true; });
      const back = new THREE.Mesh(new THREE.PlaneGeometry(PG.w, PG.h), new THREE.MeshBasicMaterial({ map: bt, toneMapped: false })); back.rotation.y = Math.PI / 2; back.position.set(.006, 0, PG.w / 2); pivot.add(back); }
    const pageCol = [CH.x1 - .05, CH.x1 + .2, PGz - PG.w / 2, PGz + PG.w / 2]; colliders.push(pageCol);
    animators.push((t, dt, me) => {
      const near = Math.hypot(me.x - CH.x1, me.z - PGz) < 2.4, past = me.x > CH.x1 - .1 && Math.hypot(me.x - CH.x1, me.z - PGz) < 3;   // 해변으로 걸어 나가면 뒤에서 닫힌다
      const want = near || past ? 1 : 0;
      PAGE_OPEN.k += (want - PAGE_OPEN.k) * Math.min(1, dt * (reduceMotion ? 30 : 2.2));
      const e = PAGE_OPEN.k * PAGE_OPEN.k * (3 - 2 * PAGE_OPEN.k); pivot.position.z = PGz - PG.w / 2 - e * (PG.w + .08);
      const i = colliders.indexOf(pageCol); if (PAGE_OPEN.k > .6 && i >= 0) colliders.splice(i, 1); else if (PAGE_OPEN.k <= .6 && i < 0) colliders.push(pageCol);
    });
    // 문 쪽 안벽(문 둘레)
    const wm = new THREE.MeshBasicMaterial({ color: 0xf2f0ea, toneMapped: false });
    for (const [a, b] of [[CH.z0, -6], [-3, CH.z1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a, Hh), wm); place(m, CH.x0 - .005, Hh / 2, (a + b) / 2, 1, 0); }
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, Hh - 3.1), wm); place(m, CH.x0 - .005, (3.1 + Hh) / 2, -4.5, 1, 0); }
    // 바닥: 하얀 바닥이 해변 쪽으로 갈수록 모래빛(새로 그린 sand)으로, 물결 빛이 옅게
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(L + .35, Wd), waterLight({ color: 0xf2efe6, sand: true, k: .6 })); fl.rotation.x = -Math.PI / 2; fl.position.set(CH.x0 + (L - .35) / 2, .035, (CH.z0 + CH.z1) / 2); scene.add(fl); floors.push(fl);
    // 천장: 물결 빛이 가장 또렷하게
    const ce = new THREE.Mesh(new THREE.PlaneGeometry(L, Wd), waterLight({ k: 1.3 })); ce.rotation.x = Math.PI / 2; ce.position.set(CH.x0 + L / 2, Hh, (CH.z0 + CH.z1) / 2); scene.add(ce); blockers.push(ce);
  }, [IPR.x0, -4.5, 9], 'ip');

  // ── ② 해변: 한낮, 조개 세 개 줍기 ──
  // 전실 정면 그림 한 장이 그림책 쪽처럼 넘어가며 열리면 16 × 12 m 해변. 모래 → 얕은 물 → 깊은 물, 끝은 수평선.
  // 색은 작가님 「줍기」에서(모래 결·바다 결은 그림을 그대로 이어 붙임), 물 표현은 행성 클라크처럼: 얕은 물 옥색 → 깊은 물 하늘색, 물 위 흰 짧은 반짝임, 물가 흰 거품 곡선과 젖은 모래 띠.
  // 조개 셋(그림 속 조개)을 밟으면 화면 위 빈 조개 칸이 하나씩 찬다(숫자 없음). 물에 들어가면 첨벙, 깊은 물로 가면 물보라와 함께 발자국이 뒤죽박죽 찍히며 얕은 물로 밀려 나온다.
  // 오래 못 찾으면 가까운 조개가 반짝이고, 더 지나면 파도가 그 조개를 발 앞으로 밀어 준다. 셋째를 주우면 1초 동안 바다를 돌아보고, 남쪽 사구 틈(숲길)으로 해 질 녘 빛이 든다(다른 해달은 두지 않는다, 작가님 결정)
  // 전문가 넷 자문·교차 검토 후(작가님 지적 '종이책 입력 → 종이책 출력' 이후): 종이 벽·잉크 테두리·모래 위 문을 뺐다. 사구도 두지 않고 평지: 바다 → 해변 → 뒤로 멀리 보이는 숲, 숲 쪽에 나가는 문(작가님 결정). 물가는 「줍기」처럼 비스듬한 한 줄, 파도가 밀려왔다 빠진다. 조개는 S자(입구 앞 → 얕은 물 → 바다를 보는 자리)
  const BE = { x0: CH.x1, x1: CH.x1 + 24, z0: -13.5, z1: 4.5 }, DR = { x: 29, z: -4.5, r: 18.3, rz: 14.5 };   // 24 × 18 m(작가님 결정: 넓게)
  const SB = { x0: 10.8, x1: 52, z0: -24, z1: 8.9, h: 26 };   // 하늘 상자: 중정 벽(x 10.4)과 라운지(z 9.4)에 닿지 않는 안쪽. 색이 높이로만 정해져 모서리가 보이지 않는다   // 하늘은 남북으로 조금 눌린 둥근 하늘(라운지 쪽 바깥 건물이 들지 않게, 뒤 숲까지 담게)
  const shoreX = (z) => 23 + (z + 13.5) * .38 + .35 * Math.sin(z * .9 + .4);   // 「줍기」처럼 비스듬한 물가(북쪽이 가깝고 남쪽이 멀다)
  const GAP = { x: 23.0 };   // 숲 쪽 나가는 문 자리(라운지 건물 동쪽 벽 x 21과 겹치지 않게 2 m 동쪽으로)
  const P2 = { x0: 22.0, x1: 24.0, z0: 5.25, z1: 12.1, h: 3.0 };   // ② 「그림자 줄」 통로: 해변 문에서 남쪽으로 곧게 7 m
  const DEEP = 3.4;   // 물가에서 이만큼 들어가면 깊은 물
  const BEACH = { got: 0, done: false };
  const SEA = [0, 0, 700, 240];   // 「줍기」 위쪽 바다 결
  const shellPicks = [[1205, 618, 44], [1047, 862, 44], [372, 998, 50]];
  const shellSpots = [[21.0, -5.5], [24.8, -11.0], [27.0, 1.0]];   // ① 입구 앞 ② 얕은 물(첨벙을 겪게, 깊은 물에서는 멀리) ③ 바다를 보며 줍는 자리
  // 조개 그림 한 장(가장자리를 부드럽게 지운 것)
  const shellCanvas = (i, s = 128) => { const c = document.createElement('canvas'); c.width = c.height = s; const q = c.getContext('2d'); if (!imgCollect.naturalWidth) return c; const [cx, cy, rr] = shellPicks[i]; q.drawImage(imgCollect, cx - rr, cy - rr, rr * 2, rr * 2, 0, 0, s, s); q.globalCompositeOperation = 'destination-in'; const gr = q.createRadialGradient(s / 2, s / 2, s * .3, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, s, s); return c; };
  // 화면 위 빈 조개 칸 셋
  const hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,0px) + 62px);left:50%;transform:translateX(-50%);display:flex;gap:10px;padding:6px 12px;border-radius:999px;background:rgba(246,239,226,.82);box-shadow:0 2px 10px rgba(60,40,20,.12);z-index:5;pointer-events:none;transition:opacity .4s';
  hud.style.opacity = '0'; hud.setAttribute('aria-label', '주운 조개'); document.body.appendChild(hud);
  const slots = [0, 1, 2].map(() => { const im = document.createElement('img'); im.alt = ''; im.style.cssText = 'width:38px;height:38px;opacity:.22;filter:grayscale(.6);transition:opacity .25s,filter .25s,transform .25s'; hud.appendChild(im); return im; });
  const SHELL_IMG = [1, 2, 3].map(n => `ip/new/beach/web/shell-${n}.webp`);   // 새로 그린 조개 셋(GPT 2차)
  slots.forEach((im, i) => { im.src = SHELL_IMG[i]; });   // 빈 칸은 흐리게, 주운 조개 그림으로 채운다
  // 짧은 효과음
  const sfx = (kind) => {
    const ctx = SOUND.ctx; if (!ctx || !SOUND.on) return;
    const t0 = ctx.currentTime, g = ctx.createGain(); g.connect(ctx.destination);
    if (kind === 'pick') { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(1320, t0); o.frequency.exponentialRampToValueAtTime(1760, t0 + .06); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.12, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + .18); o.connect(g); o.start(t0); o.stop(t0 + .2); return; }
    const len = ctx.sampleRate * (kind === 'big' ? .9 : .45), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const src = ctx.createBufferSource(); src.buffer = buf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = kind === 'big' ? 700 : 1200; bp.Q.value = .7;
    g.gain.value = kind === 'big' ? .5 : .28; src.connect(bp).connect(g); src.start(t0);
  };
  interior('ipBeach', [[CH.x1 - .3, BE.x1, BE.z0, BE.z1]], [SB.x0, SB.x1, SB.z0, SB.z1, SB.h], () => {
    // 모래: 「줍기」 모래 결을 거울로 이어 붙임(작은 자국은 지움)
    // 모래: GPT가 작가님 그림체로 새로 그린 모래 결(sand.png → web/sand.webp), 2 m마다 한 번 반복
    const sandT = tex('ip/new/beach/web/sand.webp'); sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping;
    const sandM = new THREE.MeshBasicMaterial({ map: sandT, toneMapped: false });
    ground(SB.x0, SB.x1, SB.z0, SB.z1, .03, sandM, 2.0);
    // 물: 물가 곡선에서부터 젖은 모래 → 거품 → 얕은 물(옥색) → 깊은 물(하늘색). 「줍기」 바다 결을 그대로 깔고 천천히 흐르게
    // 바다 결: 새로 그린 물결 결(sea.png → web/sea.webp), 6 m마다 한 번 반복. 깊이별 색과 흐름은 코드로
    const seaT = new THREE.TextureLoader().load('ip/new/beach/web/sea.webp'); seaT.wrapS = seaT.wrapT = THREE.RepeatWrapping; seaT.anisotropy = maxAniso;   // 셰이더에서 그대로 읽게 색공간 변환 없이
    const waterU = { time: { value: 0 }, seaT: { value: seaT } };
    const waterM = new THREE.ShaderMaterial({
      uniforms: waterU, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vWP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform float time; uniform sampler2D seaT; varying vec3 vWP;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          float z = vWP.z, x = vWP.x;
          float shore = 23.0 + (z + 13.5) * .38 + .35 * sin(z * .9 + .4);
          float d = x - shore;
          float reach = -.25 + .5 * sin(time * .9 + z * .12);            // 몇 초마다 0.5 m쯤 밀려왔다 빠지는 물 끝
          if (d < min(reach, .25) - 1.1) discard;
          vec3 wetSand = vec3(.86, .70, .43);
          if (d < reach) { float k = smoothstep(-1.35, .25, d) * .3 + smoothstep(reach - .6, reach, d) * .18; gl_FragColor = vec4(wetSand, k); return; }   // 젖은 모래: 물이 빠진 자리가 잠깐 짙게 남는다
          vec2 uv = vec2(z / 6.0 + time * .004, x / 6.0 - time * .008);
          vec3 tile = texture2D(seaT, uv).rgb;
          float dd = d - reach;
          vec3 tint = mix(vec3(1.10, 1.06, 1.0), vec3(1.0), smoothstep(.0, 2.4, dd));      // 얕은 물은 밝게
          tint = mix(tint, vec3(.80, .87, .96), smoothstep(2.4, 7.0, dd));                  // 깊을수록 짙은 하늘색
          tint = mix(tint, vec3(.68, .80, .92), smoothstep(7.0, 16.0, dd));
          vec3 c = tile * tint;
          c = mix(c, vec3(.68, .90, .88), (1.0 - smoothstep(.0, 1.8, dd)) * .3);            // 물가 가까이 옥색
          float ink = 1.0 - smoothstep(.0, .035, abs(dd - .005));
          c = mix(c, vec3(.23, .19, .16), ink * .3);                                         // 물 끝을 따라 가는 옅은 선
          vec2 cell = floor(vec2(x * 1.6, z * 3.2)); float r = h(cell), tw = .5 + .5 * sin(time * 2.0 + r * 30.0);
          vec2 fp = fract(vec2(x * 1.6, z * 3.2)) - vec2(.5, .5 + (r - .5) * .4);
          float dash = (1.0 - smoothstep(.0, .05, abs(fp.y))) * (1.0 - smoothstep(.12, .2, abs(fp.x))) * step(.84, r) * tw * smoothstep(1.0, 2.5, dd);
          c = mix(c, vec3(1.0), dash * .6);                                                 // 반짝임(물결 결에 이미 흰 줄이 있어 조금만)
          gl_FragColor = vec4(c, mix(.72, .97, smoothstep(.0, 2.5, dd)));   // 얕은 물은 살짝 비친다
        }`,
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(SB.x1 - SB.x0, SB.z1 - SB.z0), waterM); water.rotation.x = -Math.PI / 2; water.position.set((SB.x0 + SB.x1) / 2, .055, (SB.z0 + SB.z1) / 2); water.renderOrder = 2; scene.add(water); floors.push(water);
    animators.push((t) => { waterU.time.value = reduceMotion ? 0 : t; });
    // 거품 띠: 새로 그린 거품(foam.png → web/foam.webp)을 물가 곡선을 따라 휘는 띠에 붙여, 물 끝과 함께 밀려왔다 빠지게
    {
      const foamT = new THREE.TextureLoader().load('ip/new/beach/web/foam.webp'); foamT.wrapS = THREE.RepeatWrapping; foamT.wrapT = THREE.ClampToEdgeWrapping; foamT.anisotropy = maxAniso;
      const strip = (off, W, phase, op) => {
        const N = 160, za = BE.z0 - 3, zb = BE.z1 + 3, pos = [], uvs = [], idx = [];
        for (let i = 0; i <= N; i++) { const z = za + (zb - za) * i / N; for (const a of [-.5, .5]) { pos.push(a, 0, z); uvs.push(z / 8, a + .5); } if (i) { const k = (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
        const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
          uniforms: { time: waterU.time, foamT: { value: foamT } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          vertexShader: `uniform float time; varying vec2 vUv;
            void main(){ float z = position.z; float shore = 23.0 + (z + 13.5) * .38 + .35 * sin(z * .9 + .4);
              float reach = -.25 + .5 * sin(time * .9 + z * .12 + ${phase.toFixed(2)});
              vec3 w = vec3(shore + reach + ${off.toFixed(2)} + position.x * ${W.toFixed(2)}, .07, z); vUv = uv; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,
          fragmentShader: `uniform sampler2D foamT; varying vec2 vUv; void main(){ vec4 c = texture2D(foamT, vUv); if (c.a < .02) discard; gl_FragColor = vec4(c.rgb, c.a * ${op.toFixed(2)}); }`,
        }));
        m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
      };
      strip(.12, 1.0, 0, 1); strip(.9, .8, -.6, .5);   // 물 끝 거품, 그 바깥 옅은 거품 한 줄
    }
    // 하늘: 연한 하늘색. 눈높이 아래는 동·북쪽이 먼 바다, 서·남쪽은 옅은 모래 안개(멀어질수록 흐려짐). 전실 안으로는 그리지 않는다
    const skyM = new THREE.ShaderMaterial({
      side: THREE.BackSide,   // 깊이를 써서 하늘 너머 바깥 건물을 가린다
      vertexShader: 'varying vec3 vWP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `varying vec3 vWP;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          if (vWP.x < ${(CH.x1 + .25).toFixed(2)} && vWP.z > ${(CH.z0 - .2).toFixed(2)} && vWP.z < ${(CH.z1 + .2).toFixed(2)} && vWP.y < ${(CH.h + .3).toFixed(2)}) discard;
          if (vWP.x > ${(P2.x0 - .65).toFixed(2)} && vWP.x < ${(P2.x1 + .65).toFixed(2)} && vWP.z > ${(BE.z1 + .5).toFixed(2)} && vWP.y < 6.3) discard;   // ② 통로 자리는 비운다
          float y = vWP.y;
          vec3 c;
          float ang = atan(vWP.z - ${DR.z.toFixed(2)}, vWP.x - ${DR.x.toFixed(2)});   // 0 동, +남, ±π 서, -북
          float seaW = 1.0 - smoothstep(.9, 1.6, abs(ang + .35));                  // 동·북쪽만 먼 바다
          if (y < 1.6) { vec3 sea = mix(vec3(.16, .54, .78), vec3(.40, .76, .88), smoothstep(.0, 1.6, y)); vec3 land = mix(vec3(.90, .84, .70), vec3(.80, .89, .92), smoothstep(.0, 1.6, y)); c = mix(land, sea, seaW); }
          else { float e = clamp((y - 1.6) / 9.0, 0.0, 1.0); c = mix(vec3(.94, .88, .82), vec3(.80, .91, .95), smoothstep(.0, .1, e)); c = mix(c, vec3(.62, .83, .94), smoothstep(.1, 1.0, e)); }   // 수평선 위 복숭앗빛은 아주 좁게
          float a = atan(vWP.z + 4.5, vWP.x - 29.0);
          float hatch = sin(a * 900.0 + y * 40.0) * .5 + .5;   // a: 하늘 둘레 각도        // 가는 빗금
          c *= .985 + .022 * hatch;                                 // 색연필 결(아주 옅게)
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.BoxGeometry(SB.x1 - SB.x0, SB.h, SB.z1 - SB.z0), skyM); sky.position.set((SB.x0 + SB.x1) / 2, SB.h / 2 - .01, (SB.z0 + SB.z1) / 2); sky.renderOrder = -1; scene.add(sky);
    // 조개 셋: 그림 속 조개를 모래에 눕힌다. 반짝임 하나씩
    const sparkT = canvasTex(64, 64, (g, w, h) => { g.translate(w / 2, h / 2); g.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, -w * .48); g.lineTo(w * .07, 0); g.lineTo(0, w * .48); g.lineTo(-w * .07, 0); g.fill(); } });
    BEACH.shells = shellSpots.map(([x, z], i) => {
      const t = tex(SHELL_IMG[i]);   // 조개마다 다른 그림
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = i * 1.3; m.position.set(x, .045, z); m.renderOrder = 3; scene.add(m);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkT, transparent: true, depthWrite: false, toneMapped: false })); sp.scale.setScalar(.22); sp.position.set(x + .1, .3, z - .05); scene.add(sp);
      return { m, sp, t, x, z, i, got: false, k: 0 };
    });
    // 조약돌: GPT가 새로 그린 조약돌 셋(잘라 쓰던 임시 그림을 바꿈)
    {
      const pebT = [1, 2, 3].map(n => tex(`ip/new/beach/web/pebble-${n}.webp`));
      [[18.5, -9.5, .32, 0], [20.5, -1.5, .26, 1], [22.5, -12.0, .36, 2], [25.0, 3.0, .3, 0], [17.5, 1.5, .22, 2], [24.5, -4.0, .28, 1]].forEach(([x, z, s, k], i) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: pebT[k], transparent: true, depthWrite: false, toneMapped: false }));
        m.rotation.x = -Math.PI / 2; m.rotation.z = i * 1.7; m.position.set(x, .04, z); m.renderOrder = 3; scene.add(m);
      });
    }
    // 해변 뒤로 보이는 숲(작가님 결정: 평지, 바다 → 해변 → 뒤 숲). GPT가 작가님 그림체로 새로 그린 그림을 쓴다:
    //   먼 숲 띠(forest-far)와 중간 덤불 띠(forest-mid)를 해변 서·남·북 뒤로 두르고, 가장 앞줄은 둥근 입체 나무(잎 leaf · 껍질 bark 결)
    const NB = 'ip/new/beach/web/';
    const ldT = (f, rs, rt) => { const t = tex(NB + f); t.wrapS = rs ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.wrapT = rt ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; return t; };
    const farT = ldT('forest-far.webp', true, false), midT = ldT('forest-mid.webp', true, false), leafT = ldT('leaf.webp', true, true), barkT = ldT('bark.webp', true, true);
    const bushT = midT;   // 전실 덮개·문틀 안쪽도 중간 덤불 그림으로
    const hazeC = new THREE.Color(.86, .91, .92);
    const bandMat = (t, k) => new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .45, toneMapped: false, side: THREE.DoubleSide, color: new THREE.Color(1, 1, 1).lerp(hazeC, k) });
    const mats3 = [bandMat(midT, 0), bandMat(midT, .15), bandMat(farT, .1)];
    const inSky = (x, z) => x > SB.x0 + .2 && x < SB.x1 - .2 && z > SB.z0 + .2 && z < SB.z1 - .2;
    const inChamber = (x, z, hw) => x > IPR.x0 && x < CH.x1 + .3 && z + hw > CH.z0 - .3 && z - hw < CH.z1 + .3;
    let seed = 77; const r = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const EXIT = { x: GAP.x, z: BE.z1 + .6, w: 1.8, h: 2.6 };
    // 띠: 해변 가장자리에서 back만큼 뒤로 물러난 줄(북쪽 물가 → 서쪽 → 남쪽 물가)을 따라 세운 그림판. 전실 위를 지날 때는 지붕 위에서부터
    const band = (back, H, mat, tileW, phase) => {
      const zN = BE.z0 - back, zS = BE.z1 + back, xW = CH.x1 - back, pts = [];
      const xNe = shoreX(zN) + 1.0, xSe = shoreX(zS) + 1.0;
      for (let x = xNe; x > xW; x -= .5) pts.push([x, zN]);
      for (let z = zN; z < zS; z += .5) pts.push([xW, z]);
      for (let x = xW; x < xSe; x += .5) pts.push([x, zS]);
      const pos = [], uvs = [], idx = []; let len = phase;
      pts.forEach(([x, z], i) => {
        if (i) len += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
        const lift = inChamber(x, z, .1) ? CH.h + .05 : (x > P2.x0 - .6 && x < P2.x1 + .6 && z > BE.z1) ? Math.min(H, 5.0) : 0;   // ② 길 위로는 숲 띠를 걷어 낸다(먼 숲 꼭대기만 남김)
        pos.push(x, lift, z, x, H, z); uvs.push(len / tileW, lift / H, len / tileW, 1);
        if (i) { const k = (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, mat); scene.add(m); blockers.push(m); return m;
    };
    band(3.6, 6.2, mats3[2], 24, 0);     // 먼 숲
    band(1.7, 4.2, mats3[1], 16, 5.3);   // 중간 덤불
    // 가장 앞줄 입체 나무: 둥근 잎 덩어리 셋~넷 + 줄기. 빛을 계산하지 않는 재질이라 볼륨은 그려 넣은 명암(정점 색)으로
    const Lx = -.35, Ly = .8, Lz = .48;
    const shadeGeo = (g, lo = .72, hi = 1.05) => { const n = g.attributes.normal, c = new Float32Array(n.count * 3); for (let i = 0; i < n.count; i++) { const d = n.getX(i) * Lx + n.getY(i) * Ly + n.getZ(i) * Lz, k = lo + (hi - lo) * (d * .5 + .5); c.set([k, k, k * .97], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
    const leafM = new THREE.MeshBasicMaterial({ map: leafT, vertexColors: true, toneMapped: false, color: 0xd8e6c4 });
    const barkM = new THREE.MeshBasicMaterial({ map: barkT, vertexColors: true, toneMapped: false, color: 0xd9bfa0 });
    const tree = (x, z, sc) => {
      const g = new THREE.Group();
      const tg = shadeGeo(new THREE.CylinderGeometry(.11 * sc, .17 * sc, 2.0 * sc, 10, 1, true)); tg.translate(0, 1.0 * sc, 0);
      g.add(new THREE.Mesh(tg, barkM));
      const blobs = [[0, 2.55, 0, 1.15], [-.6, 2.15, .25, .85], [.62, 2.2, -.2, .9], [.1, 3.15, -.1, .8]];
      for (const [bx, by, bz, br] of blobs) {
        const rr = br * sc * (.9 + r() * .2), sg = shadeGeo(new THREE.SphereGeometry(rr, 20, 14));
        const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rr * 3.2, uv.getY(i) * rr * 1.6);   // 잎 결이 1 m 안팎으로 반복
        const m = new THREE.Mesh(sg, leafM); m.position.set(bx * sc, by * sc, bz * sc); m.scale.y = .86; g.add(m);
      }
      g.position.set(x, 0, z); g.rotation.y = r() * 6.28; scene.add(g); g.traverse(o => o.isMesh && blockers.push(o));
    };
    BEACH.T = { midT, farT, leafT, barkT, midD: ldT('forest-mid-dusk.webp', true, false), farD: ldT('forest-far-dusk.webp', true, false) };   // ② 길에서 같은 그림을 쓴다
    {
      const front = .7, zN = BE.z0 - front, zS = BE.z1 + front, xW = CH.x1 - front, spots = [];
      for (let x = shoreX(zN) - 1.2; x > xW + 1; x -= 2.7) spots.push([x, zN - r() * .6]);
      for (let z = zN + 1.2; z < zS - 1; z += 2.7) spots.push([xW - r() * .6, z]);
      for (let x = xW + 1.5; x < shoreX(zS) - 1.4; x += 2.7) spots.push([x, zS + r() * .6]);
      for (const [x, z] of spots) {
        if (Math.abs(z - PGz) < 3.6 && x < CH.x1 + 1) continue;          // 그림책 한 장 둘레는 덤불 덮개가 맡는다
        if (Math.abs(x - EXIT.x) < 2.0 && z > BE.z1) continue;          // 나가는 문 앞
        if (!inSky(x, z)) continue;
        tree(x, z, .95 + r() * .3);
      }
    }
    // 전실을 덤불로 감싼다: 그림책 한 장 양옆과 위, 전실 두 옆면. 덤불 아랫부분(빽빽한 초록)을 써서 상자가 비치지 않게
    const bushCard = (x, z, w, y0, y1, nx, nz, v0 = 0, v1 = 1, li = 0) => {
      const geo = new THREE.PlaneGeometry(w, y1 - y0); geo.translate(0, (y0 + y1) / 2, 0);
      const uvA = geo.attributes.uv, u0 = r() * 4; for (let i = 0; i < uvA.count; i++) uvA.setXY(i, u0 + uvA.getX(i) * w / 16, v0 + uvA.getY(i) * (v1 - v0));
      const m = new THREE.Mesh(geo, mats3[li === 1 ? 0 : li]); place(m, x, 0, z, nx, nz); blockers.push(m); return m;
    };
    // 들어온 문 둘레(전문가 셋 자문 후, 공 덩어리는 지움): 좋다고 하신 덤불 띠를 문 앞으로 끌어내 두 겹으로 세우고 문 모양만 뚫는다. 양옆에 나무(작가님 결정, A안)
    {
      const H = 6.5, tileW = 16 * H / 4.2, z0 = PGz - 4.2, z1 = PGz + 3.8, hz0 = PGz - PG.w / 2 - .08, hz1 = PGz + PG.w / 2 + .08, hy = PG.y + PG.h + .08;
      const holeMat = (k) => { const m = bandMat(midT, k); m.customProgramCacheKey = () => 'entryBand' + k;
        m.onBeforeCompile = (sh) => {
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <map_fragment>', `if (vWP.z > ${hz0.toFixed(3)} && vWP.z < ${hz1.toFixed(3)} && vWP.y < ${hy.toFixed(3)}) discard;\n#include <map_fragment>`);
        }; return m; };
      const wall = (x, k, u0) => { const g = new THREE.PlaneGeometry(z1 - z0, H); g.translate(0, H / 2, 0); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (z1 - z0) / tileW); const m = new THREE.Mesh(g, holeMat(k)); place(m, x, 0, (z0 + z1) / 2, 1, 0); blockers.push(m); };
      wall(CH.x1 + .14, 0, .13); wall(CH.x1 + .55, .12, .61);   // 앞판과 그 뒤 한 겹(비스듬히 봐도 얇지 않게)
      tree(CH.x1 + 1.3, z0 + .6, 1.05); tree(CH.x1 + 1.2, z1 - .5, 1.0); tree(CH.x1 + 1.5, hz0 - 1.0, .9); tree(CH.x1 + 1.5, hz1 + 1.0, .95);
      solid(CH.x1 + 1.05, CH.x1 + 1.65, hz0 - .85, hz0 - .25); solid(CH.x1 + 1.05, CH.x1 + 1.65, hz1 + .25, hz1 + .85);   // 문 양옆 나무 줄기
    }
    // 문 앞 모래의 발자국: 문에서 해변 쪽으로 몇 걸음(어디서나 같은 발자국 그대로). 발자국 그림은 걷기 쪽에서 만들어지므로 첫 장면에서 놓는다
    {
      let placed = false;
      animators.push(() => {
        if (placed || typeof pawTex === 'undefined') return; placed = true;
        [[16.0, -.12], [16.45, .12], [16.9, -.12], [17.35, .12], [17.8, -.1]].forEach(([x, dz], i) => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), new THREE.MeshBasicMaterial({ map: pawTex, transparent: true, opacity: .55 - i * .08, depthWrite: false, toneMapped: false }));
          m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.PI / 2; m.position.set(x, .042, PGz + dz); m.renderOrder = 3; scene.add(m);
        });
      });
    }
    // 나가는 문(작가님 결정, A안): 해변 시설 같은 하얀 문틀에 가는 세로 나무 살 미닫이. 살 사이로 통로가 비치고, 살 줄무늬가 안쪽 「그림자 줄」을 미리 알린다.
    // 셋을 다 주우면 다가갈 때 서쪽 덤불 뒤로 미끄러져 열린다
    {
      const { x, z, w, h } = EXIT;
      for (const s of [-1, 1]) solid(x + s * w / 2 - .12, x + s * w / 2 + .12, z - .12, z + .12);
      let leaf;
      {
        const white = new THREE.MeshBasicMaterial({ color: 0xf4f0e8, toneMapped: false }), edge = new THREE.MeshBasicMaterial({ color: 0xe2dcd2, toneMapped: false });
        for (const s of [-1, 1]) { boxMM(x + s * (w / 2 + .07) - .07, x + s * (w / 2 + .07) + .07, 0, h + .14, z - .16, z + .16, white); boxMM(x + s * (w / 2 + .005) - .005, x + s * (w / 2 + .005) + .005, 0, h, z - .16, z + .16, edge); }
        boxMM(x - w / 2 - .14, x + w / 2 + .14, h, h + .14, z - .16, z + .16, white);
        leaf = new THREE.Group(); const slatM = new THREE.MeshBasicMaterial({ color: 0xcfae86, toneMapped: false }), railM = new THREE.MeshBasicMaterial({ color: 0xb8956c, toneMapped: false });
        for (let sx = -w / 2 + .06; sx < w / 2 - .03; sx += .085) { const m = new THREE.Mesh(new THREE.BoxGeometry(.05, h - .06, .035), slatM); m.position.set(sx, (h - .06) / 2, 0); leaf.add(m); }
        for (const ry of [.25, h - .3]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w - .04, .05, .02), railM); m.position.set(0, ry, .03); leaf.add(m); }
        leaf.position.set(x, 0, z + .06); scene.add(leaf); leaf.traverse(o => o.isMesh && blockers.push(o));
      }
      // 문틀 둘레: 숲 띠를 문 앞으로 끌어와 문 모양만 비운다(들어온 문과 같은 방식)
      {   // 한 장으로 세우고 문 모양만 뚫는다. 그림 위쪽 덤불 머리가 그대로 하늘에 닿게(들어온 문 둘레와 같은 방식)
        const H = 5.0, tileW = 16 * H / 4.2, FW = 8.0, hx0 = x - w / 2 - .06, hx1 = x + w / 2 + .06, hy = h + .16;
        const fm = bandMat(midT, 0); fm.customProgramCacheKey = () => 'exitBand';
        fm.onBeforeCompile = (sh) => {
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <map_fragment>', `if (vWP.x > ${hx0.toFixed(3)} && vWP.x < ${hx1.toFixed(3)} && vWP.y < ${hy.toFixed(3)}) discard;` + `\n#include <map_fragment>`);
        };
        const g = new THREE.PlaneGeometry(FW, H); g.translate(0, H / 2, 0); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, .37 + uv.getX(i) * FW / tileW);
        const fc = new THREE.Mesh(g, fm); place(fc, x, 0, z - .04, 0, -1); blockers.push(fc);
      }
      tree(x - w / 2 - 1.5, z - .45, .95); tree(x + w / 2 + 1.5, z - .5, 1.0); tree(x - 4.1, z - .3, 1.1); tree(x + 4.1, z - .35, 1.05);   // 끝은 나무로 감춘다
      BEACH.gapFx = [];
      const glowT = canvasTex(128, 256, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H * .62, 0, W / 2, H * .62, W * .7); gr.addColorStop(0, 'rgba(255,200,120,.9)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(w - .18, h - .05), new THREE.MeshBasicMaterial({ map: glowT, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); place(glow, x, (h - .05) / 2, z + .3, 0, -1);
      const poolT = canvasTex(256, 256, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,196,120,.5)'); gr.addColorStop(1, 'rgba(255,196,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.0), new THREE.MeshBasicMaterial({ map: poolT, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(x, .05, z - 1.0); pool.renderOrder = 3; scene.add(pool);
      BEACH.gapFx = [glow, pool];
      const gateCol = [x - w / 2, x + w / 2, z - .02, z + .2]; colliders.push(gateCol);
      BEACH.gateK = 0;
      animators.push((t, dt, me) => {
        const inPath = me.x > P2.x0 - .2 && me.x < P2.x1 + .2 && me.z > z - .3 && me.z < P2.z1 + .2;
        const want = BEACH.done && (inPath || Math.hypot(me.x - x, me.z - z) < 3.0) ? 1 : 0;
        BEACH.gateK += (want - BEACH.gateK) * Math.min(1, reduceMotion ? 1 : dt * 2.4);
        leaf.position.x = x - BEACH.gateK * (w - .05);
        const i = colliders.indexOf(gateCol); if (BEACH.gateK > .6 && i >= 0) colliders.splice(i, 1); else if (BEACH.gateK <= .6 && i < 0) colliders.push(gateCol);
      });
    }
    // 보이지 않는 울타리는 숲 가장자리 바로 앞에. 그림책 한 장 자리만 지나간다
    const fw = CH.x1 + .25, fs = BE.z1 + .35, fn = BE.z0 - .35;
    solid(fw - .2, fw, fn, PGz - PG.w / 2 - .05); solid(fw - .2, fw, PGz + PG.w / 2 + .05, fs);
    solid(fw - .2, EXIT.x - EXIT.w / 2, fs, fs + .2); solid(EXIT.x + EXIT.w / 2, BE.x1 + .2, fs, fs + .2); solid(fw - .2, BE.x1 + .2, fn - .2, fn); solid(BE.x1, BE.x1 + .2, fn, fs);
  }, null, 'ip');

  // 해변의 움직임: 조개 줍기, 도와주기, 물·깊은 물, 다 주웠을 때
  let idleT = 0, pushT = -1, pushFrom = 0, pushTo = 0, wasWet = false, turnT = -1, turnFrom = 0, helpShell = null, helpT = -1;
  const inBeach = (x, z) => x > BE.x0 && x < BE.x1 && z > BE.z0 && z < BE.z1;
  animators.push((t, dt, me) => {
    const here = inBeach(me.x, me.z);
    hud.style.opacity = here || (BEACH.got > 0 && me.x > CH.x0 && me.x < BE.x1 && me.z > BE.z0 && me.z < BE.z1) ? '1' : '0';
    for (const s of BEACH.shells || []) {
      if (s.got) { if (s.k < 1) { s.k = Math.min(1, s.k + dt * 3); s.m.scale.setScalar(1 - s.k); s.m.position.y = .045 + s.k * .6; s.sp.visible = false; if (s.k >= 1) s.m.visible = false; } continue; }
      const glint = helpShell === s && helpT < 0 ? 1 : 0;
      s.sp.material.opacity = reduceMotion ? .8 : (.25 + .75 * Math.max(0, Math.sin(t * 2.3 + s.x))) * (glint ? 1 : .8); s.sp.scale.setScalar(.22 * (1 + glint * (.6 + .4 * Math.sin(t * 6))));
      if (here && Math.hypot(me.x - s.x, me.z - s.z) < .7) {
        s.got = true; BEACH.got++; idleT = 0; helpShell = null; sfx('pick');
        const im = slots[BEACH.got - 1]; im.src = SHELL_IMG[s.i]; im.style.opacity = '1'; im.style.filter = 'none'; im.style.transform = 'scale(1.25)'; setTimeout(() => { im.style.transform = ''; }, 260);
        if (BEACH.got === 3) { BEACH.done = true; turnT = 0; turnFrom = view.yaw; }
      }
    }
    // 도와주기: 9초 동안 못 주우면 가까운 조개가 반짝, 22초면 파도가 그 조개를 발 앞으로
    if (here && !BEACH.done) {
      idleT += dt;
      if (!helpShell && idleT > 9) { let best = null, bd = 1e9; for (const s of BEACH.shells) if (!s.got) { const d = Math.hypot(me.x - s.x, me.z - s.z); if (d < bd) { bd = d; best = s; } } helpShell = best; }
      if (helpShell && idleT > 22 && helpT < 0) { helpT = 0; helpShell.from = [helpShell.x, helpShell.z]; const fx = me.x - Math.sin(me.face) * 1.1, fz = me.z - Math.cos(me.face) * 1.1; helpShell.to = [Math.min(fx, shoreX(fz) - 1.3), Math.max(BE.z0 + .5, Math.min(BE.z1 - .5, fz))]; }
      if (helpT >= 0 && helpShell && !helpShell.got) { helpT = Math.min(1, helpT + dt / 1.2); const e = helpT * helpT * (3 - 2 * helpT); helpShell.x = helpShell.from[0] + (helpShell.to[0] - helpShell.from[0]) * e; helpShell.z = helpShell.from[1] + (helpShell.to[1] - helpShell.from[1]) * e; helpShell.m.position.set(helpShell.x, .045, helpShell.z); helpShell.sp.position.set(helpShell.x + .1, .3, helpShell.z - .05); if (helpT >= 1) { helpT = -1; idleT = 10; } }
    }
    // 물: 들어가면 첨벙, 깊은 물이면 물보라와 함께 밀려 나온다(발자국이 뒤죽박죽)
    if (here) {
      const d = me.x - shoreX(me.z), wet = d > -.1;
      if (wet && !wasWet) sfx('splash');
      wasWet = wet;
      if (pushT < 0 && d > DEEP) { pushT = 0; pushFrom = me.x; pushTo = shoreX(me.z) + 1.6; sfx('big'); walkTo = null; }
    }
    if (pushT >= 0) {
      pushT = Math.min(1, pushT + dt / .9); const e = 1 - Math.pow(1 - pushT, 3);
      me.x = pushFrom + (pushTo - pushFrom) * e;
      if (typeof dropPaw === 'function' && Math.floor(pushT * 6) !== Math.floor((pushT - dt / .9) * 6)) { const f = me.face; me.face = f + (Math.random() - .5) * 3; dropPaw(); me.face = f; }
      if (pushT >= 1) pushT = -1;
    }
    // 다 주웠을 때: 1초 동안 바다 쪽으로 천천히 돌아보고, 숲길 틈으로 해 질 녘 빛이 든다
    if (turnT >= 0) { turnT = Math.min(1, turnT + dt / (reduceMotion ? .01 : 1)); const e = turnT * turnT * (3 - 2 * turnT), want = -Math.PI / 2, dy = wrapA(want - turnFrom); view.yaw = turnFrom + dy * e; if (turnT >= 1) turnT = -2; }
    if (BEACH.done && BEACH.gapFx) { BEACH.gapK = Math.min(1, (BEACH.gapK || 0) + dt * (turnT === -2 ? .6 : 0)); BEACH.gapFx[0].material.opacity = (1 - (BEACH.gateK || 0)) * BEACH.gapK * (.9 + (reduceMotion ? 0 : .1 * Math.sin(t * .8))); BEACH.gapFx[1].material.opacity = BEACH.gapK * .8; }
  });
  // ── ② 「그림자 줄」 길: 해변 → 숲길 ──
  // 작가님 결정(통로마다 감각 하나): 낮게 기운 해가 만드는 그림자 줄. 전문가 셋 자문 뒤(하얀 실내 상자가 바깥 → 바깥 사이에 끼어 뜬금없음) 지붕이 트인 바깥 길로.
  // 바닥은 모래 → 나무 데크 → 흙, 해변 쪽은 한낮이고 숲 쪽으로 갈수록 해가 낮아져 줄이 길고 붉어진다. 끝은 문 없이 저녁 숲으로 열린다(숲길을 만들기 전까지는 지나가지 못함)
  // 작가님 결정(두 샘플 비교 뒤): 나무 사이 그늘길. 양옆에 줄기가 촘촘히 서고 위는 잎 지붕, 서쪽 줄기 사이로 든 볕이 길을 가로지르는 줄이 된다
  {
    const ZA = 5.2, ZB = P2.z1, LEN = ZB - ZA, XO = P2.x0 - .45;   // XO: 해를 가리는 서쪽 줄기 줄
    const CAN = 3.9;   // 잎 지붕 높이
    const TR = [];   // 서쪽 줄기 [z, 반지름]
    { let zz = ZA + .5, k = 11; const rr = () => (k = k * 16807 % 2147483647) / 2147483647; while (zz < ZB + 1.2) { TR.push(new THREE.Vector2(zz, .13 + rr() * .07)); zz += .55 + rr() * .5; } while (TR.length < 16) TR.push(new THREE.Vector2(-99, 0)); TR.length = 16; }
    const sandT2 = tex('ip/new/beach/web/sand.webp'); sandT2.wrapS = sandT2.wrapT = THREE.RepeatWrapping;
    const COMMON = `
      varying vec3 vWP; uniform vec2 tr[16]; uniform sampler2D sandM;
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      float sS(float z) { return clamp((z - ${ZA.toFixed(2)}) / ${LEN.toFixed(2)}, 0.0, 1.0); }
      vec3 sunD(float s) { return normalize(vec3(1.0, mix(-.9, -.3, s), mix(.32, .62, s))); }   // 해가 빛을 보내는 방향: 숲 쪽일수록 낮다
      float gap(float f, float sf, float soft) { return smoothstep(sf, sf + soft, f) * (1.0 - smoothstep(1.0 - soft, 1.0, f)); }
      float sunLit(vec3 P, float s) {
        vec3 D = sunD(s);
        
        float t2 = (${CAN.toFixed(2)} - P.y) / -D.y; vec3 R = P - D * t2;
        float leaf = smoothstep(.5, .72, vn(R.xz * 1.6) * .65 + vn(R.xz * 4.3) * .35);   // 잎 지붕 사이로 드는 볕
        float t1 = (P.x - ${XO.toFixed(2)}) / D.x; if (t1 <= .0) return leaf; vec3 Q = P - D * t1;
        if (Q.y > ${(CAN - .2).toFixed(2)}) return leaf;
        float b = 0.0; for (int i = 0; i < 16; i++) b = max(b, 1.0 - smoothstep(tr[i].y - .02 - .03 * t1, tr[i].y + .02 + .03 * t1, abs(Q.z - tr[i].x)));
        return (1.0 - b) * mix(1.0, leaf, .35);
      }
      vec3 ambC(float s) { return mix(vec3(.94, .93, .9), vec3(.5, .47, .6), s) * .9; }
      vec3 warmC(float s) { return mix(vec3(1.06, 1.02, .94), vec3(1.2, .76, .48), s); }`;
    const VSH = (sh) => sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvec4 wq = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwq = instanceMatrix * wq;\n#endif\nvWP = (modelMatrix * wq).xyz;');
    const p2Mat = (kind, color, extra = {}) => {
      const m = new THREE.MeshBasicMaterial(Object.assign({ color, toneMapped: false, side: THREE.DoubleSide }, extra));
      m.customProgramCacheKey = () => 'p2c|' + kind;
      m.onBeforeCompile = (sh) => {
        sh.uniforms.tr = { value: TR }; sh.uniforms.sandM = { value: sandT2 };
        sh.vertexShader = VSH(sh);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + COMMON).replace('#include <map_fragment>', `#include <map_fragment>
          float s = sS(vWP.z);
          ${kind === 'floor' ? `
          // 바닥: 모래 → 나무 데크(길 방향 판) → 흙
          vec3 sand = texture2D(sandM, vWP.xz / 2.0).rgb;
          float bi = floor(vWP.x / .145); float bf = fract(vWP.x / .145);
          vec3 deck = vec3(.74, .58, .41) * (.9 + .16 * h21(vec2(bi, floor(vWP.z / 2.4 + h21(vec2(bi, 3.0)))))) * (1.0 - .35 * (1.0 - smoothstep(.0, .06, bf)));
          vec3 soil = mix(vec3(.56, .44, .32), vec3(.44, .36, .27), vn(vWP.xz * 3.0));
          float n = vn(vWP.xz * 2.2) * .5;
          vec3 base = mix(sand, deck, smoothstep(${(ZA + .6).toFixed(2)}, ${(ZA + 1.0).toFixed(2)}, vWP.z + n * .3));
          base = mix(base, soil, smoothstep(${(ZB - 2.2).toFixed(2)}, ${(ZB - .9).toFixed(2)}, vWP.z + n));
          diffuseColor.rgb = base;` : kind === 'ground' ? `
          diffuseColor.rgb = mix(vec3(.62, .6, .44), vec3(.4, .42, .3), vn(vWP.xz * 1.3));` : ''}
          ${kind === 'nolight' ? 'diffuseColor.rgb *= ambC(s) * .92;' : 'diffuseColor.rgb *= mix(ambC(s), warmC(s), sunLit(vWP, s) * (.6 + .4 * s));'}`);
      };
      return m;
    };
    // 둘레 하늘: 해변 쪽은 한낮 하늘색, 숲 쪽으로 갈수록 노을(주황 → 분홍 → 보라). 라운지 건물(x 21)에 닿지 않게
    const PS = { x0: 21.15, x1: 31, z0: 4.7, z1: 21, h: 16 };
    const p2Sky = new THREE.ShaderMaterial({ side: THREE.BackSide,
      vertexShader: 'varying vec3 vWP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `varying vec3 vWP;
        void main(){
          if (vWP.z < ${(BE.z1 + .3).toFixed(2)}) discard;
          float k = smoothstep(6.0, 16.0, vWP.z), y = vWP.y; vec3 c;
          vec3 hz = mix(vec3(.94, .88, .82), vec3(1.0, .68, .44), k), mid = mix(vec3(.80, .91, .95), vec3(.93, .6, .58), k), top = mix(vec3(.62, .83, .94), vec3(.38, .34, .56), k);
          if (y < 1.6) c = mix(mix(vec3(.86, .84, .72), vec3(.42, .36, .42), k), hz, smoothstep(.0, 1.6, y));
          else { float e = clamp((y - 1.6) / 9.0, 0.0, 1.0); c = mix(hz, mid, smoothstep(.0, .25, e)); c = mix(c, top, smoothstep(.25, 1.0, e)); }
          gl_FragColor = vec4(c, 1.0);
        }` });
    interior('ipPath2', [[P2.x0, P2.x1, BE.z1 - .1, ZB]], [PS.x0, PS.x1, PS.z0, PS.z1, PS.h], () => {
      const sky = new THREE.Mesh(new THREE.BoxGeometry(PS.x1 - PS.x0, PS.h, PS.z1 - PS.z0), p2Sky); sky.position.set((PS.x0 + PS.x1) / 2, PS.h / 2 - .01, (PS.z0 + PS.z1) / 2); sky.renderOrder = -1; scene.add(sky);
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(PS.x1 - PS.x0, PS.z1 - 8.85), p2Mat('ground', 0xffffff)); gr.rotation.x = -Math.PI / 2; gr.position.set((PS.x0 + PS.x1) / 2, .025, (8.85 + PS.z1) / 2); scene.add(gr);
      const W = P2.x1 - P2.x0;
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(W + .6, ZB + 1.4 - 4.95), p2Mat('floor', 0xffffff)); fl.rotation.x = -Math.PI / 2; fl.position.set((P2.x0 + P2.x1) / 2, .036, (4.95 + ZB + 1.4) / 2); scene.add(fl); floors.push(fl);
      // 숲: 길 양옆과 끝에 저녁빛으로 물든 숲 띠(해변에서 쓰는 그림 그대로, 정점 색으로 숲 쪽일수록 짙고 보랏빛)
      const T = BEACH.T;
      const duskBand = (tx, ax, az, bx, bz, H, tileW, seg = 24) => {
        const g = new THREE.PlaneGeometry(1, H, seg, 1), p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3), L2 = Math.hypot(bx - ax, bz - az);
        for (let i = 0; i < p.count; i++) { const u = p.getX(i) + .5, x = ax + (bx - ax) * u, z = az + (bz - az) * u; p.setXYZ(i, x, p.getY(i) + H / 2, z); uv.setX(i, u * L2 / tileW + ax * .13); const k = Math.min(1, Math.max(0, (z - 6) / 9)); const c = new THREE.Color(1, 1, 1).lerp(new THREE.Color(.86, .8, .9), k); /* 해 질 녘 그림(GPT 2차)이라 물들임은 조금만 */ col.set([c.r, c.g, c.b], i * 3); }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: .45, vertexColors: true, toneMapped: false, side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m); blockers.push(m); return m;
      };
      duskBand(T.midD, 21.35, 5.6, 21.35, 15.5, 4.6, 16); duskBand(T.midD, 25.6, 5.6, 25.6, 15.5, 4.6, 16);
      duskBand(T.farD, 21.3, 15.8, 30.8, 15.8, 6.2, 24); duskBand(T.midD, 21.3, 14.3, 26.6, 14.3, 4.2, 16);
      duskBand(T.farD, 26.0, 6.5, 30.8, 9.5, 5.6, 24);
        // 나무 사이 그늘길: 양옆에 줄기가 촘촘히 서고 위는 잎 지붕
        const barkM = p2Mat('wood', 0xa99d90, { map: T.barkT }), leafM2 = p2Mat('nolight', 0xc8d8b4, { map: T.leafT });
        const trunks = [];
        TR.forEach((v) => { if (v.x > 0) trunks.push([XO, v.x, v.y]); });
        { let zz = ZA + .8, k = 5; const rr = () => (k = k * 16807 % 2147483647) / 2147483647; while (zz < ZB + 1) { trunks.push([P2.x1 + .4 + rr() * .3, zz, .13 + rr() * .07]); zz += .6 + rr() * .6; } }
        { let k = 21; const rr = () => (k = k * 16807 % 2147483647) / 2147483647;
          for (const [x, z, r] of trunks) {
            const H = 4.3 + rr() * .9, pr = [];   // 아래가 넓게 퍼지는 줄기 옆선
            for (let i = 0; i <= 8; i++) { const v = i / 8; pr.push(new THREE.Vector2(r * (.72 + .28 * (1 - v)) + r * .45 * Math.pow(1 - Math.min(1, v * 6), 2), v * H)); }
            const g = new THREE.LatheGeometry(pr, 12); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * H / 1.2);
            const m = new THREE.Mesh(g, barkM); m.position.set(x, 0, z); m.rotation.set((rr() - .5) * .07, rr() * 6.28, (rr() - .5) * .07); scene.add(m); blockers.push(m); solid(x - r, x + r, z - r, z + r);
          } }
        { let k = 9; const rr = () => (k = k * 16807 % 2147483647) / 2147483647; for (let z = ZA + .4; z < ZB + 1.5; z += 1.1) for (const x of [P2.x0 - .5, (P2.x0 + P2.x1) / 2, P2.x1 + .5]) { const rad = 1.0 + rr() * .5, g = new THREE.SphereGeometry(rad, 18, 12); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rad * 3.2, uv.getY(i) * rad * 1.6); const m = new THREE.Mesh(g, leafM2); m.position.set(x + (rr() - .5) * .5, CAN + .5 + rr() * .5, z + (rr() - .5) * .4); m.scale.y = .55; scene.add(m); } }
        solid(P2.x0 - .6, P2.x0 - .4, ZA, ZB); solid(P2.x1 + .35, P2.x1 + .55, ZA, ZB);
      solid(P2.x0 - .6, P2.x1 + .6, ZB - .05, ZB + .15);   // 숲길을 만들기 전까지는 여기서 멈춘다
    }, null, 'ip');
    // 소리: 해변 파도는 통로로 들어서며 멀어지고, 숲 쪽 끝으로 갈수록 풀벌레
    const inP2 = (x, z) => x > P2.x0 - .2 && x < P2.x1 + .2 && z > BE.z1 && z < P2.z1 + .2;
    SOUND.extra.push((ctx) => {
      const len = ctx.sampleRate * 6, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
      for (let i = 0; i < len; i++) { last = (last + .04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 2.4 + (Math.random() * 2 - 1) * .06; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const gain = ctx.createGain(); gain.gain.value = 0; src.connect(lp).connect(gain).connect(ctx.destination); src.start();
      return { gain, mod: (t) => { const w = .5 + .5 * Math.sin(t * .8); lp.frequency.value = 500 + 800 * w; return .35 + .65 * w * w; },
        level: (x, z) => inP2(x, z) ? .5 * Math.pow(1 - Math.min(1, (z - P2.z0) / LEN2), 2) : 0 };
    });
    const LEN2 = P2.z1 - P2.z0;
    SOUND.extra.push((ctx) => {
      const sr = ctx.sampleRate, len = sr * 4, buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
      [[4300, .93, .05], [4900, 1.31, .41], [3900, 1.71, .77]].forEach(([f, per, off]) => {
        for (let t0 = off; t0 < 3.9; t0 += per) for (let p = 0; p < 4; p++) { const st = Math.floor((t0 + p * .048) * sr), n = Math.floor(sr * .026); for (let i = 0; i < n && st + i < len; i++) d[st + i] += Math.sin(2 * Math.PI * f * i / sr) * Math.sin(Math.PI * i / n) * .22; }
      });
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const gain = ctx.createGain(); gain.gain.value = 0; src.connect(gain).connect(ctx.destination); src.start();
      return { gain, level: (x, z) => inP2(x, z) ? .08 + .55 * Math.min(1, (z - P2.z0) / LEN2) : 0 };
    });
  }
  linkInteriors('ipEntry', 'ipBeach'); linkInteriors('ipBeach', 'ipPath2');   // 실제로 걸어 이어지는 곳
  // 화면 확인용: ?portaltest=1 이면 ② 길 끝에서 멀리 떨어진 시험 섬으로 이어 붙인다(숲길을 만들면 지움)
  if (new URLSearchParams(location.search).get('portaltest')) {
    const TI = { x0: 60, x1: 72, z0: 40, z1: 54 }, bx = 66, bz = 41.0;
    interior('ipTest', [[TI.x0, TI.x1, TI.z0, TI.z1]], [TI.x0 - 1, TI.x1 + 1, TI.z0 - 1, TI.z1 + 1, 12], () => {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(TI.x1 - TI.x0, TI.z1 - TI.z0), new THREE.MeshBasicMaterial({ color: 0x8fa77a, toneMapped: false })); g.rotation.x = -Math.PI / 2; g.position.set((TI.x0 + TI.x1) / 2, .03, (TI.z0 + TI.z1) / 2); scene.add(g); floors.push(g);
      const sky = new THREE.Mesh(new THREE.BoxGeometry(TI.x1 - TI.x0 + 2, 12, TI.z1 - TI.z0 + 2), new THREE.MeshBasicMaterial({ color: 0xe7a8a0, side: THREE.BackSide, toneMapped: false })); sky.position.set((TI.x0 + TI.x1) / 2, 6, (TI.z0 + TI.z1) / 2); scene.add(sky);
      for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.25, .3, 3, 10), new THREE.MeshBasicMaterial({ color: 0x6d5040, toneMapped: false })); m.position.set(TI.x0 + 2 + (i % 3) * 4, 1.5, TI.z0 + 5 + Math.floor(i / 3) * 5); scene.add(m); }
    }, null, 'ip');
    const ZB = P2.z1, cx = (P2.x0 + P2.x1) / 2;
    portal([cx, ZB - .5, Math.PI], [bx, bz, Math.PI], 2.2, 'ipPath2', 'ipTest');
    const i = colliders.findIndex(c => Math.abs(c[2] - (ZB - .05)) < .01); if (i >= 0) colliders.splice(i, 1);
  }
  // 새소리: 숲길 틈 너머에서 작게 먼저 들리고(다음 장면 예고), 다 주우면 조금 커진다
  let birdNext = 2;
  animators.push((t, dt, me) => {
    const ctx = SOUND.ctx; if (!ctx || !SOUND.on || !inBeach(me.x, me.z) || t < birdNext) return;
    birdNext = t + 1.6 + Math.random() * 3.2;
    const d = Math.hypot(me.x - GAP.x, me.z - BE.z1), vol = (BEACH.done ? .07 : .03) * Math.max(.25, 1 - d / 16);
    const n = 2 + Math.floor(Math.random() * 3), base = 2600 + Math.random() * 1400;
    for (let k = 0; k < n; k++) { const t0 = ctx.currentTime + k * (.09 + Math.random() * .06), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(base * (1 + Math.random() * .15), t0); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * .3), t0 + .06); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + .08); o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + .1); }
  });
  // 화면 확인용: ?beach=done 이면 셋을 다 주운 모습
  if (new URLSearchParams(location.search).get('beach') === 'done') setTimeout(() => { for (const s of BEACH.shells || []) { s.got = true; s.k = 1; s.m.visible = false; s.sp.visible = false; } BEACH.got = 3; BEACH.done = true; BEACH.gapK = 1; slots.forEach(im => { im.style.opacity = '1'; im.style.filter = 'none'; }); turnT = -2; }, 500);
  whenImg(imgCollect).then(() => mats.forEach(m => m.userData.redraw()));
  document.fonts && document.fonts.load(`40px ${HAND}`, IP_FIRST.join('')).then(() => mats.forEach(m => m.userData.redraw())).catch(() => {});
  // 그리는 앞줄: 들어서면 스스로 앞서 나가고(초당 0.45), 관람객보다 0.55 앞에서 기다린다. 한 번 그린 곳은 그대로
  const DRAW_FIX = parseFloat(new URLSearchParams(location.search).get('drawp'));   // 화면 확인용: 그리는 앞줄을 이 자리에 멈춘다
  animators.push((t, dt, me) => {
    if (!isNaN(DRAW_FIX)) { DRAW.p.value = DRAW_FIX; return; }
    const s = (me.x - CH.x0) / L, inside = me.x > IPR.x0 - .2 && me.z > CH.z0 - .3 && me.z < CH.z1 + .3 && me.x < CH.x1 + 1;
    if (!inside && DRAW.p.value <= 0) return;
    const want = Math.min(1.5, Math.max(.4, s + .55));
    if (DRAW.p.value < want) DRAW.p.value = reduceMotion ? want : Math.min(want, DRAW.p.value + dt * .45);
  });
  // 파도 소리: 전실 안쪽으로 갈수록 커진다
  SOUND.extra.push((ctx) => {
    const len = ctx.sampleRate * 6, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 2.4 + (Math.random() * 2 - 1) * .08; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(lp).connect(gain).connect(ctx.destination); src.start();
    return { gain, lp: null, mod: (t) => { const w = .5 + .5 * Math.sin(t * .8); lp.frequency.value = 600 + 900 * w; return .3 + .7 * w * w; },
      level: (x, z) => { if (z < CH.z0 - .3 || z > CH.z1 + .3) return 0; if (x > CH.x0 && x < CH.x1 + .5) return .25 + .75 * Math.min(1, (x - CH.x0) / L); if (x > IPR.x0 - 3 && x <= CH.x0) return .12; return 0; } };
  });
  // 밤하늘 아래 떠다니는 종이 조개와 구름
  const floaters = [];
  for (let i = 0; i < 12; i++) {
    const r = rng(300 + i), cloud = i % 3 === 0;
    const o = cloud ? panel(1.2, .6, (g, W, H) => { g.fillStyle = '#fbf5e6'; for (const [cx, cy, rr] of [[.3, .62, .25], [.52, .45, .3], [.74, .6, .22]]) { g.beginPath(); g.arc(cx * W, cy * H, rr * H * 1.2, 0, 7); g.fill(); } }, { transparent: true, ppm: 200 }) : cutout('img/shell-stamp.webp', .32);
    if (cloud) o.material.alphaTest = .5;
    o.position.set(IPR.x0 + 1.2 + r() * 8, 3.9 + r() * 1.2, IPR.z0 + 1.5 + r() * 26); scene.add(o);
    floaters.push({ o, ph: r() * 6, sp: .3 + r() * .4, y: o.position.y });
  }
  animators.push((t) => { for (const f of floaters) { f.o.position.y = f.y + Math.sin(t * f.sp + f.ph) * .18; f.o.rotation.y = Math.sin(t * .2 + f.ph) * .6; } });
  const warm1 = new THREE.PointLight(0xffd7a0, 14, 14, 2); warm1.position.set(15.7, 4.6, -12); scene.add(warm1);
  const warm2 = new THREE.PointLight(0xffd7a0, 12, 14, 2); warm2.position.set(15.7, 4.6, -1); scene.add(warm2);

  // 1 · 해변: 저를 부르셨나요?
  {
    const back = cutout('ip/story-collect.webp', 2.1, { alpha: false });
    const face = cutout('ip/hero_face.webp', 1.55);
    const bubble = panel(1.25, .42, (g, W, H) => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(4, 4, W - 8, H * .78, H * .3); g.fill(); g.beginPath(); g.moveTo(W * .2, H * .78); g.lineTo(W * .14, H); g.lineTo(W * .32, H * .78); g.fill(); ink(g, H * .3, 700, FONT_B, '#20307a'); g.textAlign = 'center'; g.fillText('저를 부르셨나요?', W / 2, H * .5); }, { transparent: true, ppm: 420 });
    bubble.position.set(.85, 1.75, .02); face.add(bubble);
    const txt = paperCard(2.6, .62, (g, W, H) => { ink(g, H * .14, 500, FONT_M, '#8a6a3a'); g.fillText('AN ORIGINAL CHARACTER BY SHIN HAEDAL', W * .04, H * .25); ink(g, H * .17, 700, FONT_D); textBlock(g, wrapText(g, '얼빵해달은 현대사회에 살고 있는 조개배달부다. 그런데 해달이면서 수영을 못 한다.', W * .92), W * .04, H * .52, H * .22); });
    txt.position.y = .31;
    popPage({ x: 12.6, z: -8.6, nx: 1, nz: 0, layers: [{ obj: back, z: -.85, delay: 0 }, { obj: face, z: -.05, delay: .15, ox: -.55 }, { obj: txt, z: .85, delay: .35 }],
      info: { kind: 'SPACED-OUT SEA OTTER', title: '얼빵해달', meta: '조개배달부 · DELIVERS 사랑, 응원 그리고 위로', body: 'SPECIES 해달\nSIGNATURE 조개\nCREATED 2020\n\n얼빵해달은 현대사회에 살고 있는 조개배달부다. 그런데 해달이면서 수영을 못 한다.', img: 'ip/hero_face.webp', links: [[SITE + '/ip/', '얼빵해달 이야기']], focus: { pos: [15.6, -8.6], look: [12.6, 1.1, -8.6] } } });
  }
  // 2 · 조개배달부 01–04
  {
    const steps = [['story-collect', '01', '수영 대신, 두 발로.', '멍때리다 수영을 배우지 못한 얼빵해달은 해변을 걸어다니며 조개를 주워요.'], ['story-deliver', '02', '직업은 조개배달부.', '이렇게 주워온 조개를 작가님에게 가져다줘요. 그래서 조개배달부예요.'], ['story-craft', '03', '조개는 자개가 되고,', '작가님은 조개를 얇게 다듬어 옻칠 위에 한 조각씩 붙여요.'], ['story-artwork', '04', '자개는 작품이 돼요.', '얼빵해달이 배달한 조개가 반짝이는 나전칠기 작품이 됐어요.']];
    const head = paperCard(3.0, .5, (g, W, H) => { ink(g, H * .16, 500, FONT_M, '#8a6a3a'); g.fillText('01 / THE SHELL DELIVERY WORKER', W * .03, H * .32); ink(g, H * .26, 700, FONT_D); g.fillText('조개를 줍고, 작가님에게 건네요.', W * .03, H * .75); });
    head.position.y = 1.85;
    const layers = [{ obj: head, z: -1.0, delay: 0 }];
    steps.forEach(([img, no, h, p], i) => {
      const card = new THREE.Group();
      const pic = cutout(`ip/${img}.webp`, .74, { alpha: false }); pic.position.y = .5; card.add(pic);
      const cap = paperCard(.78, .46, (g, W, H) => { ink(g, H * .12, 500, FONT_M, '#8a6a3a'); g.fillText(no, W * .07, H * .2); ink(g, H * .14, 700, FONT_D); g.fillText(h, W * .07, H * .4); ink(g, H * .095); textBlock(g, wrapText(g, p, W * .86).slice(0, 4), W * .07, H * .58, H * .12); });
      cap.position.y = .24; card.add(cap);
      card.position.x = -1.2 + i * .8;
      layers.push({ obj: card, z: i % 2 ? .25 : -.2, delay: .12 + i * .1 });
    });
    const shell = cutout('img/shell-stamp.webp', .22); scene.add(shell);
    const pg = popPage({ x: 12.6, z: -13.6, nx: 1, nz: 0, layers,
      info: { kind: '01 / THE SHELL DELIVERY WORKER', title: '조개를 줍고, 작가님에게 건네요.', body: steps.map(s => `${s[1]} ${s[2]}\n${s[3]}`).join('\n\n') + '\n\n조개와 함께, 사랑·응원·위로를 배달해요.', img: 'ip/story-deliver.webp', links: [[SITE + '/ip/#story', '홈페이지에서 보기']], focus: { pos: [15.8, -13.6], look: [12.6, 1, -13.6] } } });
    pg.update = (k) => {
      shell.visible = k > .95;
      if (!shell.visible) return;
      const t = (performance.now() / 1000 * .35) % 1, seg = t * 3, i = Math.floor(seg), f = seg - i;
      const a = -1.2 + i * .8, b = a + .8, lx = a + (b - a) * f, ly = 1.25 + Math.sin(f * Math.PI) * .35;
      const v = new THREE.Vector3(lx, ly, .35); pg.grp.localToWorld(v); shell.position.copy(v); shell.rotation.y = pg.grp.rotation.y; shell.rotation.z = Math.sin(f * Math.PI * 2) * .3;
    };
  }
  // 3 · 숲길: 해달이 길을 걸어 내려온다
  {
    const S = 2.7;
    const path = cutout('ip/forest-path-1440.webp', S, { alpha: false });
    const otterL = new THREE.Group();
    const otter = cutout('ip/forest-otter.webp', .95); otterL.add(otter);
    const fluffy = cutout('ip/forest-tag-fluffy.webp', .2), grubby = cutout('ip/forest-tag-grubby.webp', .2); otterL.add(fluffy, grubby);
    const txt = paperCard(3.0, .5, (g, W, H) => { ink(g, H * .2, 600, FONT_B); textBlock(g, wrapText(g, '다른 해달들이 수영을 배울 때 멍하게 있다가 그만 수영을 배우지 못한 얼빵해달은 약속 장소까지 걸어가고 있어요.', W * .94), W * .03, H * .38, H * .27); });
    txt.position.y = .25;
    const pg = popPage({ x: 15.7, z: -18.3, nx: 0, nz: 1, layers: [{ obj: path, z: -.9, delay: 0 }, { obj: otterL, z: -.82, delay: .1 }, { obj: txt, z: .9, delay: .3 }],
      info: { kind: 'FOREST', title: '약속 장소까지 걸어가는 얼빵해달', body: '다른 해달들이 수영을 배울 때 멍하게 있다가 그만 수영을 배우지 못한 얼빵해달은 약속 장소까지 걸어가고 있어요.', img: 'ip/forest-otter.webp', links: [[SITE + '/ip/#forest', '홈페이지에서 보기']], focus: { pos: [15.7, -14.6], look: [15.7, 1.3, -18.6] } } });
    let walk = 0;
    pg.update = (k, dt) => {
      // 다가가면 길 위쪽(오른쪽 위)에서 아래쪽(왼쪽 아래)으로 걸어 내려오며 커진다
      walk = k > .9 ? Math.min(1, walk + dt / 6) : Math.max(0, walk - dt / 2);
      const u = .86 - .42 * walk, v = .58 - .5 * walk, sc = .55 + .55 * walk, step = Math.sin(performance.now() / 120) * (walk > 0 && walk < 1 ? 1 : 0);
      otter.position.set((u - .5) * S, v * S + Math.abs(step) * .03, .01); otter.scale.setScalar(sc); otter.rotation.z = step * .05;
      const show = walk > .55; fluffy.visible = grubby.visible = show;
      fluffy.position.set(otter.position.x - .35 * sc, otter.position.y + .45 * sc, .02); grubby.position.set(otter.position.x + .4 * sc, otter.position.y + .12 * sc, .02);
    };
  }
  // 4 · 아침 수영반
  {
    const back = cutout('ip/swimming-hq.webp', 2.2, { alpha: false });
    const waveCard = (col, ph) => panel(3.0, .42, (g, W, H) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 4) g.lineTo(x, H * .35 + Math.sin(x / W * Math.PI * 6 + ph) * H * .18); g.lineTo(W, H); g.fill(); }, { transparent: true, ppm: 200 });
    const w1 = waveCard('#7fb2f0', 0), w2 = waveCard('#4f86de', 1.4), w3 = waveCard('#2b4ec9', 2.6);
    [w1, w2, w3].forEach(w => { w.material.alphaTest = .5; w.position.y = .21; });
    const otter = cutout('ip/swim-otter.webp', .95);
    const card = cutout('ip/membership.webp', .75); card.rotation.z = -.15;
    const t1 = paperCard(1.6, .72, (g, W, H) => { ink(g, H * .1, 500, FONT_M, '#8a6a3a'); g.fillText('02 / MORNING SWIMMING', W * .05, H * .17); ink(g, H * .14, 700, FONT_D); g.fillText('더 빨리 조개를 배달할 수 있다면,', W * .05, H * .36); ink(g, H * .085); textBlock(g, wrapText(g, '두 발로 하는 배달은 너무 느렸어요. 조금이라도 더 빨리 조개를 전하고 싶었던 얼빵해달은 수영을 배우기로 결심했어요. 그렇게 현대사회스포츠센터 아침 수영반에 등록했어요.', W * .9), W * .05, H * .52, H * .11); });
    const t2 = paperCard(1.5, .72, (g, W, H) => { ink(g, H * .15, 700, FONT_D, '#20307a'); g.fillText('해달도 배워야 수영을 한다.', W * .05, H * .24); ink(g, H * .085); textBlock(g, wrapText(g, '처음부터 능숙한 존재는 없습니다. 누구에게나 서툰 시작이 있고, 시작하기에 늦은 때도 없습니다. 누군가의 미숙함을 너그럽게 보길 바라는 마음을 담았습니다.', W * .9), W * .05, H * .42, H * .11); });
    t1.position.set(-.82, .36, 0); t2.position.set(.82, .36, 0);
    const texts = new THREE.Group(); texts.add(t1, t2);
    const otterL = new THREE.Group(); otterL.add(otter);
    const cardL = new THREE.Group(); cardL.add(card); card.position.x = 1.05;
    const pg = popPage({ x: 18.8, z: -13.6, nx: -1, nz: 0, layers: [{ obj: back, z: -.95, delay: 0 }, { obj: w1, z: -.45, delay: .08 }, { obj: otterL, z: -.3, delay: .14 }, { obj: w2, z: -.2, delay: .18 }, { obj: cardL, z: .05, delay: .24 }, { obj: w3, z: .2, delay: .26 }, { obj: texts, z: .95, delay: .36 }],
      info: { kind: '02 / MORNING SWIMMING', title: '더 빨리 조개를 배달할 수 있다면,', body: '두 발로 하는 배달은 너무 느렸어요. 조금이라도 더 빨리 조개를 전하고 싶었던 얼빵해달은 수영을 배우기로 결심했어요. 그렇게 현대사회스포츠센터 아침 수영반에 등록했어요.\n\n해달도 배워야 수영을 한다.\n처음부터 능숙한 존재는 없습니다. 누구에게나 서툰 시작이 있고, 시작하기에 늦은 때도 없습니다. 누군가의 미숙함을 너그럽게 보길 바라는 마음을 담았습니다.', img: 'ip/swimming-hq.webp', links: [[SITE + '/ip/#pool', '홈페이지에서 보기']], focus: { pos: [15.6, -13.6], look: [18.8, 1, -13.6] } } });
    pg.update = (k) => {
      const t = performance.now() / 1000;
      otter.position.set(Math.sin(t * .7) * .5, .12 + Math.abs(Math.sin(t * 2.4)) * .1, 0); otter.rotation.z = Math.sin(t * 4.8) * .12;
      w1.position.x = Math.sin(t * .9) * .08; w2.position.x = Math.sin(t * .9 + 1) * .1; w3.position.x = Math.sin(t * .9 + 2) * .08;
    };
  }
  // 5 · 이름 이야기: 카드가 뒤집힌다
  {
    const flipCard = (front, backImg, backText) => {
      const g = new THREE.Group(), w = 1.15, h = 1.2;
      const f = panel(w, h, (c, W, H) => { c.fillStyle = '#fbf5e6'; c.fillRect(0, 0, W, H); c.strokeStyle = '#c9a86a'; c.lineWidth = 8; c.strokeRect(14, 14, W - 28, H - 28); ink(c, H * .3, 400, FONT_K, '#20307a'); c.textAlign = 'center'; c.fillText(front, W / 2, H * .6); ink(c, H * .06, 500, FONT_M, '#8a6a3a'); c.fillText('눌러 보면 뒤집혀요', W / 2, H * .85); });
      const b = panel(w, h, (c, W, H) => { c.fillStyle = '#20307a'; c.fillRect(0, 0, W, H); ink(c, H * .11, 700, FONT_M, '#efe9df'); c.textAlign = 'center'; c.fillText(backText, W / 2, H * .88); });
      const bi = cutout(backImg, .55); bi.position.set(0, .25 - h / 2 + .25, .01); b.add(bi);
      b.rotation.y = Math.PI; b.position.z = -.005;
      const spin = new THREE.Group(); spin.add(f, b); spin.position.y = h / 2 + .05; g.add(spin); g.userData.spin = spin; return g;
    };
    const c1 = flipCard('얼빵', 'img/hero_logo.webp', 'SPACED-OUT'), c2 = flipCard('해달', 'ip/name_haedal.webp', 'SUN + MOON');
    c1.position.x = -.7; c2.position.x = .7;
    const both = new THREE.Group(); both.add(c1, c2);
    const txt = paperCard(3.0, .62, (g, W, H) => { ink(g, H * .12, 500, FONT_M, '#8a6a3a'); g.fillText('03 / A LITTLE MORE ABOUT ME', W * .03, H * .22); ink(g, H * .16); textBlock(g, wrapText(g, '\'얼빵\'은 조금 얼빠져 있고 어딘가 엇박자지만 그래서 사랑스러운 느낌을 Spaced-out으로 옮겼어요. \'해달\'은 동물 해달이면서, 해(☀︎)와 달(☾︎)로도 읽혀요.', W * .94), W * .03, H * .45, H * .2); });
    txt.position.y = .31;
    const pg = popPage({ x: 18.8, z: -7.8, nx: -1, nz: 0, layers: [{ obj: both, z: -.4, delay: 0 }, { obj: txt, z: .85, delay: .3 }],
      info: { kind: '03 / A LITTLE MORE ABOUT ME', title: '이름에도 의미가 있어요.', body: '\'Spaced-out Sea Otter\'는 이름뿐 아니라, 캐릭터의 성격까지 담아낸 번역이에요.\n\n얼빵 → SPACED-OUT\n\'얼빵\'을 소리 그대로 Eolbbang이라 쓰는 대신, 조금 얼빠져 있고 어딘가 엇박자지만 그래서 사랑스러운 느낌을 \'Spaced-out\'으로 옮겼어요.\n\n해달 → SUN + MOON\n\'해달\'은 동물 해달이면서, 해(☀︎)와 달(☾︎)로도 읽혀요. 하나의 이름 안에 동물과 하늘, 두 겹의 의미가 함께 들어 있어요.', img: 'ip/name_haedal.webp', links: [[SITE + '/ip/#identity', '홈페이지에서 보기']], focus: { pos: [15.6, -7.8], look: [18.8, 1, -7.8] } } });
    pg.update = (k) => { const f = smooth(.75, 1, k); c1.userData.spin.rotation.y = f * Math.PI; c2.userData.spin.rotation.y = smooth(.85, 1, k) * Math.PI; };
  }
  // 6 · 장난감 상자: 아트토이
  {
    const box = new THREE.Group(), bw = 1.3, bd = .9, bh = .55, kraft = new THREE.MeshStandardMaterial({ color: 0xc9a77c, roughness: .9, side: THREE.DoubleSide });
    for (const [w, h, x, z, ry] of [[bw, bh, 0, -bd / 2, 0], [bw, bh, 0, bd / 2, 0], [bd, bh, -bw / 2, 0, Math.PI / 2], [bd, bh, bw / 2, 0, Math.PI / 2]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), kraft); p.position.set(x, h / 2, z); p.rotation.y = ry; box.add(p); }
    const lid = new THREE.Mesh(new THREE.PlaneGeometry(bw, .5), kraft); lid.position.set(0, bh + .22, -bd / 2 - .08); lid.rotation.x = -.35; box.add(lid);
    const toys = [1, 2, 3, 4].map((n, i) => { const t = cutout(`img/arttoy_${n}.webp`, .5, { alpha: false }); t.position.set(-.45 + i * .3, .05, -.1 + (i % 2) * .15); t.rotation.y = (i - 1.5) * .18; box.add(t); return t; });
    const toy = cutout('img/toy-cutout.webp', 1.0); toy.position.set(-1.05, 0, .05);
    const holder = new THREE.Group(); holder.add(box, toy); box.position.z = -.2;
    const txt = paperCard(3.0, .62, (g, W, H) => { ink(g, H * .12, 500, FONT_M, '#8a6a3a'); g.fillText('04 / FROM 2D TO 3D · NAJEONCHILGI ART TOY', W * .03, H * .22); ink(g, H * .2, 700, FONT_D); g.fillText('그림 밖에서 만난 얼빵해달.', W * .03, H * .5); ink(g, H * .12); g.fillText('2026 · 10 × 9 × 6 cm · 천연자개 · 옻칠 · 굴패각 친환경 수지 · 시그니처 조개는 자석으로 떼고 붙여요', W * .03, H * .78); });
    txt.position.y = .31;
    const D = DETAIL[TOY_ID];
    const pg = popPage({ x: 17.4, z: 1.2, nx: -.7, nz: .7, layers: [{ obj: holder, z: -.4, delay: 0 }, { obj: txt, z: .85, delay: .3 }],
      info: { kind: D.en, title: '조개배달부 얼빵해달 2026 Limited Edition', meta: D.medium, body: D.body.join('\n\n') + '\n\n시그니처 조개는 자석으로 떼고 붙일 수 있어요.', ex: D.ex, img: `img/${TOY_ID}.webp`, links: [[`${SITE}/works/w/${TOY_ID}/`, '작품 페이지'], [SITE + '/ip/#toy', '아트토이 이야기', true]], focus: { pos: [14.6, 3.9], look: [17.4, .8, 1.2] } } });
    pg.update = (k) => { toys.forEach((t, i) => { t.position.y = .05 + smooth(.5 + i * .1, 1, k) * (.45 + (i % 2) * .12); }); };
  }
}
const ipStampSpot = { x: 15.0, z: 3.6 };
