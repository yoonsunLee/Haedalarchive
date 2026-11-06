const ABOUT = {
  head: '독해하고, 해석하고, 번역하는 것.',
  lead: '저는 법을 읽고 의미를 찾아, 그것을 나전칠기의 언어로 옮깁니다.',
  intro: ['오랫동안 법을 공부하고 가르치며 텍스트의 의미를 읽고 해석해왔습니다.', '우연히 마주한 옻칠의 느리고 정직한 공정에 마음을 빼앗겼고, 텍스트 속에 살던 시간은 버려지는 대신 손의 시간과 하나로 이어졌습니다.', '예전에는 법을 논문과 강의로 설명했다면, 지금은 옻칠과 자개로 이야기합니다.'],
  noteHead: '쉽게 들어와서 오래 머무는 작업. 순서가 다를 뿐, 깊이는 같습니다.',
  // 홈페이지 About의 Artist Note 그대로. '>' 로 시작하면 새 단락 묶음(앞을 더 띄움), '!' 로 시작하면 강조 줄
  note: ['제 작업은 법과 사회의 규범 안에서 살아가는 개인에 대한 이야기입니다.', '저에게 법은 차갑고 어려운 규칙에 머무는 것이 아니라, 결국 사람을 위해 사람들이 만든 규칙입니다. 그리고 그 안을 살아가는 개인은 저마다 다른 모습과 빛깔을 지닙니다.', '>그래서 작업은 이미지보다 먼저 법학적 개념과 텍스트에서 시작합니다.', '개념을 고르고, 제목과 서사를 먼저 씁니다. 그 이야기를 하나의 장면으로 구상한 뒤, 나전칠기의 시각언어로 번역합니다.', '!법학적 개념 → 제목과 서사 → 시각화.', '논문을 쓰던 사고의 구조가 자연스럽게 작업의 구조로 이어진 셈입니다.', '>천연자개는 같은 조각도 빛과 바라보는 각도에 따라 다른 색을 보여줍니다. 작게 자르고 쪼개어도 고유의 영롱한 빛은 사라지지 않습니다.', '저는 그 모습에서 사회의 규범 안에서도 저마다의 빛깔로 살아가는 개인을 떠올립니다.', '옻칠은 여러 번 칠하고 말리고 갈아내며 깊이를 만듭니다. 옻칠의 깊이는 자개의 빛을 돋보이게 하고, 자개의 영롱함은 다시 옻칠의 깊이를 드러냅니다.', '>그리고 그 이야기에는 현대인의 일상과 저의 페르소나인 \'얼빵해달\'이 함께 살아갑니다. 어렵게 느껴질 수 있는 법도 얼빵해달의 이야기를 통하면 조금 더 친근하고 다정하게 다가갈 수 있다고 생각합니다.', '처음부터 어렵게 이해할 필요는 없습니다.', '얼빵해달이 귀여워서, 자개가 반짝여서 작품 앞에 멈춰 서도 좋습니다.', '그 다음 제목을 읽고, 그 안에 법과 전통의 이야기가 있다는 것을 발견하고, 조금 더 오래 바라보게 되기를 바랍니다.', '!그리고 작품을 떠날 때에는 사회 속의 자기 자신을 한 번쯤 다정하게 바라볼 수 있었으면 합니다.'],
};
const CV = [
  ['EDUCATION', [['2014.02', '중앙대학교 일반대학원 법학과 박사수료'], ['2012.02', '중앙대학교 일반대학원 법학과 석사'], ['2009.02', '단국대학교 법학과 학사']]],
  ['CERTIFICATIONS', [['2024.09', '국가유산수리장인전문교육(칠공) 수료'], ['2022.05', '국가유산수리기능자(칠공) 취득']]],
  ['BRAND & ACTIVITIES', [['2025.09', '소담상회 인사점 입점'], ['2025.09', '한글복합문화공간 \'한글상점\' 입점'], ['2022.04', '아이디어스 해달자개 브랜드 입점']]],
];
const PRESS = [
  ['이슈메이커', '2026-06-01', '차가운 법 조문을 영롱한 자개로 번역하는 다정한 예술가', 'https://www.issuemaker.kr/news/articleView.html?idxno=51514'],
  ['아트코리아방송', '2026-07-16', '여름, 빛을 켜다 – 당신의 하루를 밝히는 특별한 전시', 'https://www.artkoreatv.com/news/articleView.html?idxno=103511'],
  ['데일리아트', '2026-05-13', '라트, \'재료의 언어\' 통해 신진 작가들의 물성과 감각 탐구 조명', 'https://www.d-art.co.kr/news/articleView.html?idxno=5575'],
  ['코리안투데이', '2026-04-30', '나전칠기 신해달 작가, 법학적 사유를 자개의 빛으로 시각화하다', 'https://m.thekorean.today/49646'],
  ['코리안투데이', '2026-04-01', '까루젤 드 루브르 아트쇼핑에서 한국 현대미술의 정수를 선보이는 갤러리미쉘', 'https://thekorean.today/48869'],
  ['브랜딧매거진', '2025-07-14', '전통과 현대의 멋스러운 조화, 나전칠기 브랜드 \'해달자개\'', 'https://www.branditmag.co.kr/news/articleView.html?idxno=415'],
];
// 홈페이지 MEET THE FIVE와 같은 크기 규칙: 그림 높이 = T·s·k, 아래로 T·s·g 만큼 내린다
const FRIENDS = [
  { c: 'crane', name: '학두루미', en: 'SUN', role: '경비원', item: 'ㅎ', k: 1.1656, g: .0359, s: 1 },
  { c: 'rabbit', name: '정월토끼', en: 'MOON', role: '신분을 숨긴 공주', item: '달맞이꽃', k: 1.4076, g: .0461, s: 1 },
  { c: 'tiger', name: '선한백호', en: 'MOUNTAIN', role: '산지기', item: '곶감', k: 1.2589, g: .0898, s: 1.15 },
  { c: 'deer', name: '솔직사슴', en: 'PINE', role: '나무꾼', item: '솔방울', k: 1.3070, g: .0268, s: 1 },
  { c: 'otter', name: '얼빵해달', en: 'SEA', role: '조개배달부', item: '자개', k: 1.0560, g: .0285, s: 1 },
];
const STAMPS = [['court', '중정'], ['artist', '작가소개'], ['works', '작품 전시관'], ['ip', 'IP관'], ['obong', '일월오봉단관']];

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const store = { get(k, d) { try { const v = localStorage.getItem('haedal-gallery:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('haedal-gallery:' + k, JSON.stringify(v)); } catch {} } };

/* ───────── 렌더러 ───────── */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, powerPreference: 'high-performance' });   // stencil: 우주조약 방의 창 너머 우주
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(coarse ? 66 : 58, innerWidth / innerHeight, 0.05, 400);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);
const loadPct = document.getElementById('loadPct');
manager.onProgress = (_, done, total) => { loadPct.textContent = `불러오는 중 ${Math.round(done / total * 100)}%`; };
manager.onLoad = () => { loadPct.textContent = '준비됨'; };

/* ───────── 도움 함수 ───────── */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = maxAniso;
  return t;
}
function speckle(g, w, h, n, r, colors, alpha, rnd) {
  for (let i = 0; i < n; i++) { g.globalAlpha = alpha * (0.4 + rnd() * 0.6); g.fillStyle = colors[(rnd() * colors.length) | 0]; const s = r * (0.3 + rnd()); g.fillRect(rnd() * w, rnd() * h, s, s); }
  g.globalAlpha = 1;
}
function scaleBoxUV(geo, w, h, d, tu, tv) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tu, uv.getY(k) * dims[f][1] / tv); }
}
function boxMM(x0, x1, y0, y1, z0, z1, mat, tile, parent = scene) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const geo = new THREE.BoxGeometry(w, h, d);
  if (tile) scaleBoxUV(geo, w, h, d, tile[0], tile[1]);
  const m = new THREE.Mesh(geo, mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  parent.add(m); return m;
}
function tex(path) { const t = loader.load(path); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; }
// 그림 한 장: 높이를 정하면 너비는 그림 비율대로. 아래 가운데가 원점
function cutout(path, height, { basic = true, alpha = true, tint = 1, side = THREE.DoubleSide } = {}) {
  const g = new THREE.Group();
  const t = loader.load(path, tt => { const a = tt.image.width / tt.image.height; m.scale.x = height * a; g.userData.width = height * a; g.userData.onSize && g.userData.onSize(height * a); });
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  const mat = basic ? new THREE.MeshBasicMaterial({ map: t, side, color: new THREE.Color(tint, tint, tint) }) : new THREE.MeshStandardMaterial({ map: t, side, roughness: .8 });
  if (alpha) { mat.alphaTest = .35; mat.transparent = false; }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.scale.set(height, height, 1); m.position.y = height / 2;
  g.add(m); g.userData.mesh = m; return g;
}
function wrapText(g, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const tryLine = line ? line + ' ' + word : word;
      if (g.measureText(tryLine).width <= maxW) { line = tryLine; continue; }
      if (line) out.push(line);
      if (g.measureText(word).width <= maxW) { line = word; continue; }
      line = '';
      for (const ch of word) { if (g.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch; }
    }
    out.push(line);
  }
  return out;
}
// 홈페이지와 같은 글꼴: 본문 Noto Sans KR, 표지·제목 Black Han Sans, 작은 라벨 Space Mono
const FONT_D = '"Noto Sans KR", "Malgun Gothic", sans-serif', FONT_B = '"Noto Sans KR", "Malgun Gothic", sans-serif', FONT_M = '"Space Mono", "Noto Sans KR", monospace', FONT_K = '"Black Han Sans", "Noto Sans KR", sans-serif';
// 글자판: 1 m 당 px 밀도로 캔버스를 만들고 draw(g, W, H)로 그린 뒤 평면으로
// 한글 글꼴은 글자 묶음별로 나눠 받는다. 처음 그릴 때 아직 안 온 글자는 다른 글꼴로 그려지므로, 글꼴이 더 오면 다시 그린다
const REDRAW = [];
let redrawTimer = 0;
document.fonts.addEventListener('loadingdone', () => { clearTimeout(redrawTimer); redrawTimer = setTimeout(() => { for (const r of REDRAW) { const g = r.t.image.getContext('2d'); g.clearRect(0, 0, r.W, r.H); r.draw(g, r.W, r.H); r.t.needsUpdate = true; } }, 250); });
function panel(wm, hm, draw, { ppm = 260, basic = true, transparent = false } = {}) {
  const W = Math.round(wm * ppm), H = Math.round(hm * ppm);
  const t = canvasTex(W, H, (g) => draw(g, W, H));
  REDRAW.push({ t, W, H, draw });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const mat = basic ? new THREE.MeshBasicMaterial({ map: t, transparent, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: t, roughness: .85, transparent });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wm, hm), mat);
  return m;
}
function textBlock(g, lines, x, y, lh) { lines.forEach((l, i) => g.fillText(l, x, y + i * lh)); return y + lines.length * lh; }

/* ───────── 재질 무늬 ───────── */
const T = {};
// 바깥벽: 현무암 잔다듬 큰 판 1200 × 600 mm 통줄눈. 2.4 m 안에 가로 2장 × 세로 4장, 판마다 먹회색이 조금씩 다르고 작은 기공이 흩어진다
// 같은 무늬로 색(T.facade)과 요철(T.facadeBump)을 함께 그린다: 줄눈과 기공은 오목하게
const BASALT = { cols: 2, rows: 4, seed: 41 };
function basalt(g, w, h, bump) {
  const r = rng(BASALT.seed), pw = w / BASALT.cols, ph = h / BASALT.rows;
  g.fillStyle = bump ? '#202020' : '#303134'; g.fillRect(0, 0, w, h);   // 줄눈
  for (let j = 0; j < BASALT.rows; j++) for (let i = 0; i < BASALT.cols; i++) {
    const l = 27 + r() * 2.5;   // #3b3c3e ~ #5e5f61 사이, 판끼리는 아주 조금만 다르게
    g.fillStyle = bump ? '#d0d0d0' : `hsl(220 3% ${l}%)`; g.fillRect(i * pw + 1, j * ph + 1, pw - 1.5, ph - 1.5);
  }
  // 잔다듬 결과 기공: 1 ~ 6 mm, 1 m² 에 200개쯤
  speckle(g, w, h, 9000, 2, bump ? ['#b8b8b8', '#e4e4e4'] : ['#3a3b3d', '#55565a', '#4a4b4e'], .5, r);
  for (let k = 0; k < 1150; k++) { g.fillStyle = bump ? '#303030' : 'rgba(18,18,20,.75)'; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * r() * 2, 0, 7); g.fill(); }
}
T.facade = canvasTex(1024, 1024, (g, w, h) => basalt(g, w, h, false));
T.facadeBump = canvasTex(1024, 1024, (g, w, h) => basalt(g, w, h, true), [1, 1], false);
T.plaster = canvasTex(512, 512, (g, w, h) => { const r = rng(3); g.fillStyle = '#ece8e1'; g.fillRect(0, 0, w, h); speckle(g, w, h, 5000, 2, ['#d9d3c9', '#f6f3ee', '#e0dbd2'], .35, r); });
T.white = canvasTex(512, 512, (g, w, h) => { const r = rng(5); g.fillStyle = '#f3f1ed'; g.fillRect(0, 0, w, h); speckle(g, w, h, 3000, 2, ['#e6e3dd', '#faf9f7'], .3, r); });
T.stone = canvasTex(1024, 1024, (g, w, h) => {      // 2.4 m 안에 60 cm 회색 석재 4×4장
  const r = rng(9), n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const l = 52 + r() * 8; g.fillStyle = `hsl(30 4% ${l}%)`; g.fillRect(i * s, j * s, s, s);
    speckle(g, s, s, 0, 1, [], 0, r);
    for (let k = 0; k < 900; k++) { g.globalAlpha = .18; g.fillStyle = r() > .5 ? '#6d6862' : '#a29d96'; g.fillRect(i * s + r() * s, j * s + r() * s, 2, 2); }
    g.globalAlpha = 1; g.strokeStyle = 'rgba(40,36,32,.55)'; g.lineWidth = 3; g.strokeRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
  }
});
T.maru = canvasTex(512, 1024, (g, w, h) => {        // 툇마루: 1.2 m 폭 널 다섯 장
  const r = rng(12), n = 5, s = w / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = `hsl(28 ${30 + r() * 8}% ${40 + r() * 6}%)`; g.fillRect(i * s, 0, s, h);
    for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(60,35,18,${.06 + r() * .1})`; g.lineWidth = 1 + r() * 2; const x = i * s + r() * s; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, h * .3, x - 6, h * .6, x + 3, h); g.stroke(); }
    g.fillStyle = 'rgba(30,18,10,.6)'; g.fillRect(i * s, 0, 2, h);
  }
});
T.gravel = canvasTex(512, 512, (g, w, h) => { const r = rng(21); g.fillStyle = '#cfc6b4'; g.fillRect(0, 0, w, h); speckle(g, w, h, 16000, 3, ['#b8ae9b', '#e3dccd', '#a69c89', '#d9d1c0', '#8f8676'], .7, r); });
T.bakseok = canvasTex(1024, 1024, (g, w, h) => {   // 박석: 크기가 제각각인 화강석
  const r = rng(33); g.fillStyle = '#5b5750'; g.fillRect(0, 0, w, h);
  let y = 0;
  while (y < h) { const rh = 90 + r() * 90; let x = -r() * 120; while (x < w) { const rw = 120 + r() * 160, l = 62 + r() * 10; g.fillStyle = `hsl(35 ${5 + r() * 5}% ${l}%)`; g.beginPath(); g.roundRect(x + 4, y + 4, rw - 8, rh - 8, 10); g.fill(); x += rw; } y += rh; }
  speckle(g, w, h, 12000, 2, ['#8a857c', '#c9c3b8'], .3, r);
});
T.changho = canvasTex(512, 512, (g, w, h) => {      // 창호: 한지 위 짙은 나무 살, 1.2 m
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h);
  const r = rng(4); speckle(g, w, h, 1500, 3, ['#e2d6bd', '#f7f0e0'], .5, r);
  g.fillStyle = '#3a2618';   // 살은 가로 하나만, 테두리는 가늘게
  g.fillRect(0, h * .62 - 3, w, 6);
  g.fillRect(0, 0, w, 9); g.fillRect(0, h - 9, w, 9); g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h);
});
T.earth = canvasTex(512, 512, (g, w, h) => { const r = rng(55); g.fillStyle = '#0a0909'; g.fillRect(0, 0, w, h); speckle(g, w, h, 6000, 2, ['#121010', '#060505', '#161313'], .5, r); });   // 오봉단관: 무광 검정 벽
T.navy = canvasTex(512, 512, (g, w, h) => { const r = rng(66); g.fillStyle = '#18234a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 7000, 2, ['#1f2c5a', '#121a3a', '#26346a'], .4, r); });
T.paper = canvasTex(512, 512, (g, w, h) => { const r = rng(77); g.fillStyle = '#f6eedb'; g.fillRect(0, 0, w, h); speckle(g, w, h, 6000, 2, ['#ece2c9', '#fbf6ea', '#e6dbc0'], .45, r); });
T.dark = canvasTex(512, 512, (g, w, h) => { const r = rng(88); g.fillStyle = '#1b1715'; g.fillRect(0, 0, w, h); speckle(g, w, h, 6000, 2, ['#24201d', '#141110'], .5, r); });
T.hanjiCeil = canvasTex(512, 512, (g, w, h) => {   // 한지 광천장: 빛나는 한지 판과 가는 놋쇠 줄눈, 1.8 m
  g.fillStyle = '#fff6e6'; g.fillRect(0, 0, w, h);
  const r = rng(8); speckle(g, w, h, 2500, 4, ['#f4e7cf', '#fffaf0'], .5, r);
  g.fillStyle = '#9c7a45'; g.fillRect(0, 0, w, 6); g.fillRect(0, 0, 6, h); g.fillRect(w / 2 - 2, 0, 4, h); g.fillRect(0, h / 2 - 2, w, 4);
});
T.stars = canvasTex(2048, 1024, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0d1433'); gr.addColorStop(1, '#1b2a5c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(99);
  for (let i = 0; i < 1400; i++) { g.globalAlpha = .3 + r() * .7; g.fillStyle = r() > .85 ? '#ffe9b0' : '#ffffff'; const s = r() > .97 ? 3 : 1.4; g.beginPath(); g.arc(r() * w, r() * h, s, 0, 7); g.fill(); }
  g.globalAlpha = 1;
});
T.obongCeil = canvasTex(512, 512, (g, w, h) => { const r = rng(111); g.fillStyle = '#1a130e'; g.fillRect(0, 0, w, h); speckle(g, w, h, 4000, 3, ['#221811', '#140f0b'], .5, r); });   // 오봉단관: 별 없이 높고 어두운 나무 천장
T.wood = canvasTex(256, 512, (g, w, h) => { const r = rng(13); g.fillStyle = '#c9a77c'; g.fillRect(0, 0, w, h); for (let k = 0; k < 60; k++) { g.strokeStyle = `rgba(110,72,38,${.08 + r() * .12})`; g.lineWidth = 1 + r() * 2; const x = r() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8, h * .3, x - 8, h * .7, x, h); g.stroke(); } });

/* ───────── 재질 ───────── */
const std = (o) => new THREE.MeshStandardMaterial(o);
const M = {
  facade: std({ map: T.facade, bumpMap: T.facadeBump, bumpScale: 1.5, roughness: .82, envMapIntensity: .3 }),   // 현무암: 광 없이 돌의 결만
  pearl: new THREE.MeshPhysicalMaterial({ color: 0xf2f0ea, roughness: .38, metalness: .08, clearcoat: .6, clearcoatRoughness: .25, iridescence: .3, iridescenceIOR: 1.35, envMapIntensity: .9, side: THREE.DoubleSide }),
  darkGlass: new THREE.MeshPhysicalMaterial({ color: 0x1b2328, roughness: .06, metalness: .4, clearcoat: 1 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe3e6, roughness: .04, metalness: 0, transparent: true, opacity: .16, depthWrite: false }),
  blackStone: std({ color: 0x1d1b1a, roughness: .6 }),
  brass: std({ color: 0xb08a4a, roughness: .35, metalness: .9 }),
  steel: std({ color: 0x15151a, roughness: .4, metalness: .6 }),
  lacquer: new THREE.MeshPhysicalMaterial({ color: 0x14100e, roughness: .25, clearcoat: 1, clearcoatRoughness: .1 }),
  plaster: std({ map: T.plaster, roughness: .95 }),
  white: std({ map: T.white, roughness: .95 }),
  stone: std({ map: T.stone, roughness: .7 }),
  maru: std({ map: T.maru, roughness: .6 }),
  gravel: std({ map: T.gravel, roughness: 1 }),
  bakseok: std({ map: T.bakseok, roughness: .9 }),
  changho: std({ map: T.changho, roughness: .9, emissive: 0x2a2010, emissiveIntensity: .25 }),
  earth: std({ map: T.earth, roughness: 1, envMapIntensity: .2 }),
  navy: std({ map: T.navy, roughness: 1 }),
  paper: std({ map: T.paper, roughness: .95 }),
  dark: std({ map: T.dark, roughness: .7 }),
  wood: std({ map: T.wood, roughness: .7 }),
  hanjiCeil: new THREE.MeshBasicMaterial({ map: T.hanjiCeil, color: 0xfff3dd, side: THREE.DoubleSide }),
  stars: new THREE.MeshBasicMaterial({ map: T.stars, side: THREE.DoubleSide }),
  obongCeil: std({ map: T.obongCeil, roughness: .9, side: THREE.DoubleSide }),
  soffit: std({ color: 0x3a2618, roughness: .7, side: THREE.DoubleSide }),
};
