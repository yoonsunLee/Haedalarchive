import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
s = open(p, encoding='utf8').read()
D = json.load(open(os.path.join(here, 'works.json'), encoding='utf8'))
detail = {k: {'en': v['en'], 'medium': v['medium'], 'body': v['body'], 'ex': v['ex']} for k, v in D.items()}

def sub(a, b, count=1):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b, count)

# 1) 작품 배치: 정면 벽 가운데에 개인전 출품작 다섯 점
a = s.index('const WORKS = ['); b = s.index('const WALL_NAME')
s = s[:a] + """// 작품 정보(재료·설명·전시 이력)는 shinhaedal.com 작품 페이지에서 옮겨 왔다
const DETAIL = """ + json.dumps(detail, ensure_ascii=False) + """;
const SOLO = { title: '나전칠기로 ART하는 法', en: 'LAWQUER, LAWfully ARTful, LAWQUER = LAW + LACQUER', dates: '2026.11.23 – 11.29', venue: '갤러리 비브, 서울',
  works: ['HD-2026-001', 'HD-2026-011', 'HD-2026-009', 'HD-2026-008', 'HD-2025-002'], map: 'https://naver.me/5LQ10ta4', poster: 'img/poster-EX-2026-01.webp' };
const WORKS = [
  // 정면 벽: 가운데 다섯 점이 개인전 〈나전칠기로 ART하는 法〉 출품작
  { id: 'HD-2026-003', t: 'POV : 업무 중', y: 2026, w: 53, h: 53, wall: 'n', u: -12.2 },
  { id: 'HD-2025-002', t: '안녕! 권리소진의 원칙', y: 2025, w: 27.3, h: 27.3, wall: 'n', u: -8.4 },
  { id: 'HD-2026-011', t: 'N차적 저작물B', y: 2026, w: 27.3, h: 27.3, wall: 'n', u: -4.4 },
  { id: 'HD-2026-001', t: '이 세계의 얼빵해달, 저작인접권자가 되었다!', y: 2026, w: 45, h: 45, wall: 'n', u: 0 },
  { id: 'HD-2026-009', t: '무주의 바다', y: 2026, w: 38, h: 38, wall: 'n', u: 4.4 },
  { id: 'HD-2026-008', t: '더 블루북', y: 2026, w: 59.4, h: 84.1, size: 'A1 (59.4 × 84.1) cm', wall: 'n', u: 8.6 },
  { id: 'HD-2026-004', t: '우주조약', y: 2026, w: 37.9, h: 37.9, wall: 'n', u: 12.2 },
  // 왼쪽 벽: N차적 저작물 시리즈와 POV 출근·퇴근
  { id: 'HD-2026-002', t: 'N차적 저작물A', y: 2026, w: 27.3, h: 27.3, wall: 'w', u: -6 },
  { id: 'HD-2025-004', t: 'nn차적 저작물a', y: 2025, w: 15, h: 15, wall: 'w', u: -3 },
  { id: 'HD-2026-006', t: 'POV : 출근', y: 2026, w: 20, h: 20, wall: 'w', u: 3 },
  { id: 'HD-2026-007', t: 'POV : 퇴근', y: 2026, w: 20, h: 20, wall: 'w', u: 6 },
  // 입구 옆 벽
  { id: 'HD-2026-010', t: 'POV : 유급휴일', y: 2026, w: 27, h: 27, wall: 's', u: -12 },
  { id: 'HD-2026-005', t: '헌법 제10조 행복추구권*', y: 2026, w: 31.8, h: 31.8, wall: 's', u: -8.5 },
  { id: 'HD-2025-001', t: '권리누적: 이차원에서 삼차원으로', y: 2025, w: 15, h: 15, wall: 's', u: -5 },
];
""" + s[b:]

# 2) 아트토이: 작품 페이지 문구와 재료
sub("""  meta: '2026 · 10 × 9 × 6 cm · 천연자개 · 옻칠 · 굴패각 친환경 수지',
  body: '수영을 못 하는 해달이 해변을 걸으며 주운 조개를 작가에게 배달해요. 시그니처 조개는 자석으로 떼고 붙일 수 있어요. 가운데 단 위에는 잘 보이도록 크게 세웠고, 옆 유리장 안이 실제 크기예요.',""",
"""  kicker: DETAIL['HD-2026-012'].en, meta: DETAIL['HD-2026-012'].medium, ex: DETAIL['HD-2026-012'].ex,
  body: DETAIL['HD-2026-012'].body.join('\\n\\n') + '\\n\\n시그니처 조개는 자석으로 떼고 붙일 수 있어요. 가운데 단 위에는 잘 보이도록 크게 세웠고, 옆 유리장 안이 실제 크기예요.',""")
sub("const TOY = {\n  kind: '아트토이',", "const TOY = {\n  kind: 'HD-2026-012',")

# 3) 작품 정보창: 재료, 설명, 전시 이력
sub("""  const info = { kind: '나전칠기', kicker: `${wk.id} · ${WALL_NAME[wk.wall]}`, title: wk.t, meta: `${wk.y} · ${size}`,
    body: '전시장에서는 잘 보이도록 실제 크기의 두 배로 걸었어요.', img: `img/${wk.id}.webp`,
    links: [[`${SITE}/works/w/${wk.id}/`, '작품 페이지']] };""",
"""  const d = DETAIL[wk.id], solo = SOLO.works.includes(wk.id);
  const info = { kind: wk.id, kicker: (solo ? `개인전 〈${SOLO.title}〉 출품작 · ` : '') + d.en, title: wk.t, meta: d.medium,
    body: d.body.join('\\n\\n') + '\\n\\n(전시장에서는 잘 보이도록 실제 크기의 두 배로 걸었어요.)', ex: d.ex, img: `img/${wk.id}.webp`,
    links: [[`${SITE}/works/w/${wk.id}/`, '작품 페이지']] };""")
sub("const lab = new THREE.Mesh(new THREE.PlaneGeometry(.32, .17), new THREE.MeshStandardMaterial({ map: labelTex({ kicker: wk.id, title: wk.t, meta: `${wk.y} · ${size}` }), roughness: .9 }));",
    "const lab = new THREE.Mesh(new THREE.PlaneGeometry(.32, .17), new THREE.MeshStandardMaterial({ map: labelTex({ kicker: SOLO.works.includes(wk.id) ? `${wk.id} · 개인전 출품작` : wk.id, title: wk.t, meta: `${wk.y} · ${size}` }), roughness: .9 }));")
sub("""  <p class="body" id="sheetBody"></p>""", """  <p class="body" id="sheetBody"></p>
  <div class="ex" id="sheetEx" hidden><h3>전시 이력</h3><ul id="sheetExList"></ul></div>""")
sub(".sheet .body { margin: 0; max-width: 60ch; }", """.sheet .body { margin: 0; max-width: 60ch; white-space: pre-line; }
.sheet .ex h3 { margin: 0 0 6px; font-size: 11px; letter-spacing: .18em; color: var(--muted); font-weight: 500; }
.sheet .ex ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; color: #cfc7bb; font-variant-numeric: tabular-nums; }""")
sub("""  $('sheetImg').src = info.img; $('sheetImg').alt = info.title;""", """  $('sheetImg').src = info.img; $('sheetImg').alt = info.title;
  $('sheetEx').hidden = !(info.ex && info.ex.length);
  $('sheetExList').replaceChildren(...(info.ex || []).map(x => Object.assign(document.createElement('li'), { textContent: x })));""")

# 4) 정면 벽 위 개인전 제목
sub("WORKS.forEach(hangWork);", """WORKS.forEach(hangWork);
{
  const tex = canvasTex(2400, 260, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'center';
    g.fillStyle = '#857c70'; g.font = `500 40px ${FONT_B}`; g.letterSpacing = '12px'; g.fillText(`신해달 개인전 · ${SOLO.dates} · 갤러리 비브`, w / 2, 62);
    g.letterSpacing = '0px'; g.fillStyle = '#1d1815'; g.font = `700 110px ${FONT_D}`; g.fillText(SOLO.title, w / 2, 190);
    g.fillStyle = '#9b9286'; g.font = `400 34px ${FONT_B}`; g.letterSpacing = '10px'; g.fillText('LAWQUER = LAW + LACQUER', w / 2, 248);
  });
  const t2 = new THREE.Mesh(new THREE.PlaneGeometry(7.4, .8), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  onWall(t2, 'n', 0, 2.72, .016);
}""")

# 5) 작가 소개 벽: About 페이지 문장
a = s.index("    g.fillStyle = '#7d7569'; g.font = `500 30px ${FONT_B}`; g.letterSpacing = '8px'; g.fillText('SHIN HAEDAL · 나전칠기 아티스트', 0, 60);")
b = s.index("  const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.25)")
s = s[:a] + """    g.fillStyle = '#7d7569'; g.font = `500 30px ${FONT_B}`; g.letterSpacing = '8px'; g.fillText('SHIN HAEDAL · 나전칠기 아티스트', 0, 60);
    g.letterSpacing = '0px'; g.fillStyle = '#1d1815'; g.font = `700 150px ${FONT_D}`; g.fillText('신해달', 0, 230);
    g.font = `400 50px ${FONT_D}`; g.fillStyle = '#2e2823';
    ['독해하고, 해석하고, 번역하는 것.', '저는 법을 읽고 의미를 찾아,', '그것을 나전칠기의 언어로 옮깁니다.'].forEach((l, i) => g.fillText(l, 0, 340 + i * 66));
    g.font = `400 34px ${FONT_B}`; g.fillStyle = '#5b544c';
    ['쉽게 들어와서 오래 머무는 작업.', '순서가 다를 뿐, 깊이는 같습니다.'].forEach((l, i) => g.fillText(l, 0, 590 + i * 52));
    g.fillStyle = '#9b9286'; g.font = `400 28px ${FONT_B}`; g.fillText('국가유산수리기능자(칠공) · 중앙대학교 일반대학원 법학과 박사수료', 0, 760);
  });
""" + s[b:]
sub("const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.25)", "const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.5)")
sub("const tex = canvasTex(1400, 900, (g, w, h) => {\n    g.clearRect(0, 0, w, h);\n    g.fillStyle = '#7d7569'", "const tex = canvasTex(1400, 1000, (g, w, h) => {\n    g.clearRect(0, 0, w, h);\n    g.fillStyle = '#7d7569'")
sub("""  pickable(logo, { kind: 'IP',""", """  pickable(plate, { kind: 'ABOUT', kicker: 'SHIN HAEDAL · 나전칠기 아티스트', title: '독해하고, 해석하고, 번역하는 것.', meta: '저는 법을 읽고 의미를 찾아, 그것을 나전칠기의 언어로 옮깁니다.',
    body: '오랫동안 법을 공부하고 가르치며 텍스트의 의미를 읽고 해석해왔습니다. 우연히 마주한 옻칠의 느리고 정직한 공정에 마음을 빼앗겼고, 텍스트 속에 살던 시간은 버려지는 대신 손의 시간과 하나로 이어졌습니다.\\n\\n법학적 개념 → 제목과 서사 → 시각화.\\n\\n처음부터 어렵게 이해할 필요는 없습니다. 얼빵해달이 귀여워서, 자개가 반짝여서 작품 앞에 멈춰 서도 좋습니다.',
    img: 'img/hero_logo.webp', links: [[SITE + '/about/', '작가 소개'], [SITE + '/cv/', 'CV', true]], focus: { pos: [10.5, -4.2], look: [X, 1.8, -4.2] } });
  pickable(logo, { kind: 'IP',""")

# 6) 샵: 해달자개 브랜드
sub("g2.fillText('SHOP', 4, 56);", "g2.fillText('해달자개 SHOP', 4, 56);")
sub("    body: '검은 옻칠 바탕에 자개 조각으로 자음을 놓았어요. 실제 상품 구성과 가격은 브랜드샵에서 확인해 주세요.',",
    "    body: '해달자개의 한글 자음 키링이에요. 전시장에서는 검은 옻칠 바탕에 자개 조각으로 자음을 놓은 모양으로 보여 드려요. 실제 상품 구성과 가격은 브랜드샵에서 확인해 주세요.',")
sub("""  const shopInfo = { kind: '키링 샵', kicker: 'BRAND SHOP', title: '신해달 브랜드샵', meta: '아이디어스 작가 페이지',
    body: '전시장에서 본 키링과 굿즈는 작가의 온라인 브랜드샵에서 만날 수 있어요.',""",
"""  const shopInfo = { kind: '키링 샵', kicker: 'BRAND SHOP', title: '해달자개', meta: '2022 아이디어스 입점 · 2025 한글상점 · 소담상회 인사점 입점',
    body: '해달이 조개를 주워 와 자개 작품을 만든다는 이야기에서 이름을 붙인 나전칠기 브랜드예요. 전시장에서 본 키링과 굿즈는 아이디어스 브랜드샵에서 만날 수 있어요.',""")
sub("g.fillStyle = '#e8e1d5'; g.font = `400 70px ${FONT_D}`; g.fillText('브랜드샵', 40, 110);", "g.fillStyle = '#e8e1d5'; g.font = `400 70px ${FONT_D}`; g.fillText('해달자개', 40, 110);")

# 7) 현수막: 실제 개인전 포스터
a = s.index("  const paint = img => {"); b = s.index("  const geo = new THREE.PlaneGeometry(banner.w, banner.h, 1, 28);")
s = s[:a] + """  const paint = img => {
    const W = c.width, Hh = c.height;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh);
    if (img) g.drawImage(img, 0, 0, W, W * 1350 / 1080);
    const nac = g.createLinearGradient(80, 0, W - 80, 0);
    ['#f4c6d6', '#d9d2f7', '#bfe6e4', '#f1e6c4'].forEach((col, i) => nac.addColorStop(i / 3, col));
    g.textAlign = 'center';
    g.fillStyle = nac; g.fillRect(W / 2 - 70, 1580, 140, 5);
    g.fillStyle = '#ffffff'; g.font = `700 150px ${FONT_B}`; g.letterSpacing = '6px'; g.fillText('LAWQUER', W / 2, 1780);
    g.fillStyle = nac; g.font = `500 56px ${FONT_B}`; g.letterSpacing = '10px'; g.fillText('LAW + LACQUER', W / 2, 1870);
    g.fillStyle = '#efe9df'; g.font = `500 50px ${FONT_B}`; g.letterSpacing = '2px'; g.fillText('갤러리 비브 · 서울', W / 2, 2040);
    g.fillStyle = '#9c968c'; g.font = `400 36px ${FONT_B}`; g.fillText('shinhaedal.com', W / 2, 2190);
    g.textAlign = 'left'; g.letterSpacing = '0px';
    tex.needsUpdate = true;
  };
  paint(null);
  const info = { kind: '개인전', kicker: `신해달 개인전 · ${SOLO.en}`, title: SOLO.title, meta: `${SOLO.dates} · ${SOLO.venue}`,
    body: '법학적 개념에서 출발해 제목과 서사를 쓰고, 그것을 나전칠기의 시각언어로 옮긴 작업들을 보여 주는 개인전이에요. 이 전시장 정면 벽 가운데 다섯 점이 출품작이에요.',
    ex: SOLO.works.map(id => `${id}  ${WORKS.find(w => w.id === id).t}`),
    img: SOLO.poster, links: [[SOLO.map, '갤러리 비브 지도'], [SITE + '/cv/', 'CV', true]], focus: { pos: [-8.2, 18.5], look: [-8.2, 4.3, Z] } };
  const img = new Image(); img.onload = () => paint(img); img.src = SOLO.poster;
""" + s[b:]

# 8) 처음 화면 문구
sub("벽에는 나전칠기 작품 14점, 가운데에는 얼빵해달 아트토이, 오른쪽 안쪽 샵에는 한글 자음 키링이 걸려 있어요.",
    "정면 벽에는 개인전 〈나전칠기로 ART하는 法〉 출품작을 포함한 나전칠기 작품 14점, 가운데에는 얼빵해달 아트토이, 오른쪽 안쪽 해달자개 샵에는 한글 자음 키링이 걸려 있어요.")
open(p, 'w', encoding='utf8').write(s)
print('ok')
