
// 01 평면: 2×2 두 묶음과 한 바퀴 동선
(function () {
  const svg = document.getElementById('plan'), NS = 'http://www.w3.org/2000/svg';
  const add = (tag, a, text) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (text) e.textContent = text; svg.appendChild(e); return e; };
  add('rect', { x: 0, y: 0, width: 1000, height: 660, fill: '#191513' });
  const R = (x, y, w, h, label, fill = '#231d19', dashed, sub) => {
    add('rect', { x, y, width: w, height: h, fill: dashed ? 'none' : fill, stroke: dashed ? '#7fcdbf' : '#ece6db', 'stroke-width': dashed ? 1.2 : 1.6, 'stroke-dasharray': dashed ? '7 6' : '' });
    add('text', { x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle', fill: dashed ? '#7fcdbf' : '#ece6db', 'font-size': 14, 'font-family': 'Noto Sans KR', 'font-weight': 700 }, label);
    if (sub) add('text', { x: x + w / 2, y: y + h / 2 + 22, 'text-anchor': 'middle', fill: '#b3aa9d', 'font-size': 10, 'font-family': 'Space Mono' }, sub);
  };
  R(390, 40, 220, 140, '일월오봉단관', '#2a2320', false, '주봉');
  R(410, 200, 180, 200, '중정', '#3a3631');
  R(430, 420, 140, 110, '로비', '#231d19');
  R(300, 420, 120, 110, '작가소개');
  R(580, 420, 120, 110, '해달 라운지', '#231d19', false, '키오스크 · 아트토이');
  // 작품관 2×2: 오른쪽 아래(법과 권리)로 들어가 반시계로 돌고 오른쪽 위(N차적)에서 중정으로
  R(250, 300, 140, 110, '법과 권리', '#e9e5de'); R(110, 300, 140, 110, 'POV', '#5c4c22'); R(110, 190, 140, 110, '우주조약', '#121a3a'); R(250, 190, 140, 110, 'N차적', '#0d0b0a');
  svg.querySelectorAll('text').forEach(t => { if (t.textContent === '법과 권리') t.setAttribute('fill', '#1d1a17'); });
  R(10, 190, 100, 220, '+ 2×3', '', true);
  add('text', { x: 250, y: 176, 'text-anchor': 'middle', fill: '#c9a86a', 'font-size': 11, 'font-family': 'Space Mono' }, '작품관 2×2');
  // IP 체험관 2×2: 왼쪽 위(해변)로 들어가 시계 방향, 왼쪽 아래(수영장)에서 중정으로
  R(610, 190, 140, 110, '해변', '#4a4130'); R(750, 190, 140, 110, '숲길', '#24402a', false, '통창'); R(750, 300, 140, 110, '작업실', '#3a2c22'); R(610, 300, 140, 110, '수영장', '#1f3f6a');
  R(890, 190, 100, 220, '+ 2×3', '', true);
  add('text', { x: 750, y: 176, 'text-anchor': 'middle', fill: '#c9a86a', 'font-size': 11, 'font-family': 'Space Mono' }, 'IP 체험관 2×2');
  // 통창 표시
  add('line', { x1: 890, y1: 192, x2: 890, y2: 298, stroke: '#7fcdbf', 'stroke-width': 4 }); add('line', { x1: 752, y1: 190, x2: 888, y2: 190, stroke: '#7fcdbf', 'stroke-width': 4 });
  const arrow = (d) => add('path', { d, fill: 'none', stroke: '#d0503f', 'stroke-width': 2.6, 'stroke-dasharray': '8 6', 'stroke-linecap': 'round', 'marker-end': 'url(#ah)' });
  const defs = add('defs', {}); const mk = document.createElementNS(NS, 'marker'); mk.setAttribute('id', 'ah'); mk.setAttribute('viewBox', '0 0 10 10'); mk.setAttribute('refX', '5'); mk.setAttribute('refY', '5'); mk.setAttribute('markerWidth', '5'); mk.setAttribute('markerHeight', '5'); mk.setAttribute('orient', 'auto');
  const mp = document.createElementNS(NS, 'path'); mp.setAttribute('d', 'M0 0L10 5L0 10z'); mp.setAttribute('fill', '#d0503f'); mk.appendChild(mp); defs.appendChild(mk);
  arrow('M500 610 L500 540 L400 520 L360 470 L330 410');
  arrow('M300 360 L180 360 L180 250 L320 250 L400 270 L440 300');
  arrow('M560 300 L640 250 L820 250 L820 360 L680 360 L600 330');
  arrow('M520 300 L500 190');
  arrow('M560 180 L600 260 L640 430');
  add('text', { x: 500, y: 640, 'text-anchor': 'middle', fill: '#b3aa9d', 'font-size': 11, 'font-family': 'Space Mono' }, '입구');
})();
// 02 남쪽 겹겹 능선: 날개마다 뒷줄은 높고 넓게, 앞줄은 낮게
(function () {
  const svg = document.getElementById('ridge'), NS = 'http://www.w3.org/2000/svg';
  const add = (tag, a, text) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (text) e.textContent = text; svg.appendChild(e); return e; };
  const G = 330;
  add('rect', { x: 0, y: 0, width: 1200, height: 380, fill: '#171a1f' });
  for (let i = 0; i < 70; i++) { const x = i * 18 - 20, h = 60 + (i * 37 % 50); add('path', { d: `M${x} ${G} L${x + 9} ${G - h} L${x + 18} ${G}Z`, fill: '#1e2a22' }); }
  const roof = (cx, w, top, eave, fill, dashed, label, sub) => {
    const L = cx - w / 2, Rr = cx + w / 2;
    add('rect', { x: L + 10, y: eave, width: w - 20, height: G - eave, fill: dashed ? 'none' : '#1c1714', stroke: dashed ? '#7fcdbf' : '#3a322c', 'stroke-dasharray': dashed ? '6 5' : '', 'stroke-width': 1.2 });
    add('path', { d: `M${L - 14} ${eave - 6} Q${L + w * .3} ${eave - 2} ${cx - w * .06} ${top} L${cx + w * .06} ${top} Q${Rr - w * .3} ${eave - 2} ${Rr + 14} ${eave - 6} L${Rr + 8} ${eave + 2} Q${Rr - w * .3} ${eave + 6} ${cx} ${top + 8} Q${L + w * .3} ${eave + 6} ${L - 8} ${eave + 2}Z`,
      fill: dashed ? 'none' : fill, stroke: dashed ? '#7fcdbf' : '#b3aa9d', 'stroke-dasharray': dashed ? '6 5' : '', 'stroke-width': 1 });
    if (label) add('text', { x: cx, y: top - 12, 'text-anchor': 'middle', fill: dashed ? '#7fcdbf' : '#ece6db', 'font-size': 13, 'font-family': 'Noto Sans KR', 'font-weight': 700 }, label);
    if (sub) add('text', { x: cx, y: top - 28, 'text-anchor': 'middle', fill: '#b3aa9d', 'font-size': 10, 'font-family': 'Space Mono' }, sub);
  };
  roof(90, 120, 200, 262, '', true, '+ 산자락'); roof(1110, 120, 200, 262, '', true, '+ 산자락');
  // 뒷줄(높고 넓게) → 앞줄(낮게) 순서로 그려 겹친다
  roof(250, 260, 110, 196, '#d9d2c6', false, '', '작품관 뒷줄'); roof(950, 260, 110, 196, '#d9d2c6', false, '', 'IP 체험관 뒷줄');
  roof(600, 240, 40, 160, '#f2efe8', false, '일월오봉단관', '주봉');
  roof(250, 230, 178, 242, '#ece6db', false, '작품관'); roof(950, 230, 178, 242, '#ece6db', false, 'IP 체험관');
  roof(430, 110, 200, 256, '#e8e2d8', false, '작가소개'); roof(770, 110, 200, 256, '#e8e2d8', false, '해달 라운지');
  roof(600, 150, 222, 272, '#ddd6ca', false, '로비 · 중정');
  add('line', { x1: 0, y1: G, x2: 1200, y2: G, stroke: '#ece6db', 'stroke-width': 1.4 });
})();
// 중정: 반자 서까래와 기와 끝
(function () {
  const g = document.getElementById('raft'), t = document.getElementById('tiles'), NS = 'http://www.w3.org/2000/svg';
  for (let i = 0; i <= 40; i++) {
    for (const [y1, y2] of [[0, 9], [24, 15]]) {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', i); l.setAttribute('y1', y1); l.setAttribute('x2', 20 + (i - 20) * .45); l.setAttribute('y2', y2);
      g.appendChild(l);
    }
  }
  for (let x = 5.5; x < 35; x += .9) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', 20.6 - Math.sin((x - 5) / 30 * Math.PI) * 3.2); c.setAttribute('r', .42);
    t.appendChild(c);
  }
})();
// N차적 저작물: 공기 중에 떠다니는 별먼지. 손(마우스)이 다가가면 비켜 난다
(function () {
  const c = document.querySelector('.scene.dark canvas.dust'), g = c.getContext('2d'), scene = c.closest('.scene');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let s = 11; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  const dust = Array.from({ length: 70 }, () => ({ x: r(), y: r() * .9, z: .3 + r() * .7, vx: (r() - .5) * .004, vy: (r() - .5) * .003, ph: r() * 7, ox: 0, oy: 0 }));
  let W, H, px = -9, py = -9;
  const size = () => { W = c.width = c.clientWidth * 2; H = c.height = c.clientHeight * 2; };
  scene.addEventListener('pointermove', (e) => { const b = scene.getBoundingClientRect(); px = (e.clientX - b.left) / b.width; py = (e.clientY - b.top) / b.height; });
  scene.addEventListener('pointerleave', () => { px = py = -9; });
  const frame = (now) => {
    const t = now / 1000;
    g.clearRect(0, 0, W, H);
    for (const d of dust) {
      if (!still) { d.x = (d.x + d.vx / 60 + 1) % 1; d.y = (d.y + d.vy / 60 + 1) % 1; }
      const dx = d.x - px, dy = (d.y - py) * .62, dist = Math.hypot(dx, dy);
      const push = dist < .12 ? (.12 - dist) / .12 : 0;   // 가까이 오면 비켜 난다
      d.ox += ((dist ? dx / dist : 0) * push * .06 - d.ox) * .08; d.oy += ((dist ? dy / dist : 0) * push * .06 - d.oy) * .08;
      g.globalAlpha = (.25 + .55 * d.z) * (still ? 1 : .6 + .4 * Math.sin(t * 1.3 + d.ph));
      g.fillStyle = '#f4ead8';
      g.beginPath(); g.arc((d.x + d.ox) * W, (d.y + d.oy) * H, (.5 + d.z * 1.2) * 1.4, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    if (!still) requestAnimationFrame(frame);
  };
  size(); addEventListener('resize', size); requestAnimationFrame(frame);
})();
// 우주조약: 팔각 창 너머 우주. 홈페이지 배경(starfield.js)과 같은 바탕색·성운·깊이별 별.
// 보는 자리(마우스·손가락)가 바뀌면 가까운 별은 많이, 먼 별과 성운은 조금 움직여 창 너머가 깊어 보인다
(function () {
  const scene = document.querySelector('.scene.space');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let s = 7; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  // 창마다 따로 그린다(창마다 다른 별 자리)
  const skies = [...scene.querySelectorAll('canvas.sky')].map((c) => ({ c, g: c.getContext('2d'),
    stars: Array.from({ length: 110 }, () => { const d = r() ** 1.6; return { x: r(), y: r(), d, ph: r() * 7, sp: .6 + r() * 1.2, gold: r() < .18 }; }) }));
  let tx = 0, ty = 0, vx = 0, vy = 0;
  const size = () => { for (const k of skies) { k.W = k.c.width = k.c.clientWidth * 2; k.H = k.c.height = k.c.clientHeight * 2; } };
  const look = (e) => { const b = scene.getBoundingClientRect(); tx = ((e.clientX - b.left) / b.width - .5) * 2; ty = ((e.clientY - b.top) / b.height - .5) * 2; };
  scene.addEventListener('pointermove', look); scene.addEventListener('pointerleave', () => { tx = ty = 0; });
  const frame = (now) => {
    const t = still ? 0 : now / 1000;
    vx += (tx - vx) * .06; vy += (ty - vy) * .06;
    for (const { g, W, H, stars } of skies) {
    const bg = g.createRadialGradient(W * .5, H * .4, 0, W * .5, H * .4, Math.max(W, H) * .8);
    bg.addColorStop(0, '#111420'); bg.addColorStop(1, '#05050a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, rr, col, a, ph] of [[.2, .3, .55, '27,42,74', .1, 0], [.8, .6, .5, '232,230,224', .05, 2.1], [.5, .85, .6, '17,20,32', .1, 4.2]]) {
      const nx = (x - vx * .02) * W + Math.sin(t * .05 + ph) * W * .03, ny = (y - vy * .02) * H + Math.cos(t * .04 + ph) * H * .03;
      const n = g.createRadialGradient(nx, ny, 0, nx, ny, rr * Math.max(W, H));
      n.addColorStop(0, `rgba(${col},${a})`); n.addColorStop(1, `rgba(${col},0)`); g.fillStyle = n; g.fillRect(0, 0, W, H);
    }
    g.globalCompositeOperation = 'source-over';
    for (const st of stars) {
      const tw = still ? 1 : .55 + .45 * Math.sin(t * st.sp + st.ph);
      const px = ((st.x - vx * (.01 + st.d * .12)) % 1 + 1) % 1 * W, py = ((st.y - vy * (.01 + st.d * .09)) % 1 + 1) % 1 * H;
      g.globalAlpha = (.15 + .7 * st.d) * tw; g.fillStyle = st.gold ? '#e6cf9a' : '#ffffff';
      g.beginPath(); g.arc(px, py, (.4 + st.d * 1.8) * 1.4, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    }
    if (!still) requestAnimationFrame(frame);
  };
  size(); addEventListener('resize', size); requestAnimationFrame(frame);
})();
