
/* ───────── 해달 라운지: 현대사회스포츠센터 로비처럼 ───────── */
// 하늘색·흰색, 타일 바닥과 허리 높이 타일 띠, 안내데스크 + 멤버십 키오스크, 이름 이야기, 아트토이 진열장 둘, 아침 수영반 시간표, 기다리는 의자, 브랜드샵 배너
const LG = ROOMS.lounge, deskSpot = { x: 17.2, z: 11.2 };   // 키오스크 앞
const LB = '#2b4ec9', LB2 = '#20307a', LSKY = '#cfe3f6';   // 카드 앞면과 같은 파랑, 짙은 파랑, 하늘색
function redrawPanel(m) { const r = REDRAW.find(o => o.t === m.material.map); if (r) { r.draw(r.t.image.getContext('2d'), r.W, r.H); r.t.needsUpdate = true; } }
{
  const WF = .16;   // 벽 안쪽 면까지
  // 바닥: 흰 타일(30 cm), 줄눈은 연한 회청색
  const floorT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#c9d3dc'; g.fillRect(0, 0, w, h); const n = 8, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#f3f6f9' : '#eef2f6'; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); } });
  ground(LG.x0, LG.x1, LG.z0, LG.z1, .026, std({ map: floorT, roughness: .32 }), 2.4);
  // 벽 아래 1.2 m: 하늘색 작은 타일(10 cm) 띠, 위에 파란 줄 하나
  const tileT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e9f1f8'; g.fillRect(0, 0, w, h); const n = 8, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i * 7 + j * 3) % 5 ? '#bcd8f1' : '#b2d1ee'; g.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3); } });
  const tileM = (w, h = 1.2) => { const t = tileT.clone(); t.needsUpdate = true; t.repeat.set(w / .8, h / .8); return std({ map: t, roughness: .35 }); };
  const band = (w, x, z, nx, nz) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.2), tileM(w)); place(m, x, .6, z, nx, nz);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, .05), new THREE.MeshBasicMaterial({ color: LB })); place(line, x + nx * .002, 1.225, z + nz * .002, nx, nz);
  };
  band(LG.x1 - 9.6, (9.6 + LG.x1) / 2, LG.z0 + WF, 0, 1); band(1, 6.5, LG.z0 + WF, 0, 1);    // 북쪽(중정 문 7~9.6 m 빼고)
  band(LG.x1 - LG.x0, (LG.x0 + LG.x1) / 2, LG.z1 - WF, 0, -1);                               // 남쪽
  band(LG.z1 - LG.z0, LG.x1 - WF, (LG.z0 + LG.z1) / 2, -1, 0);                               // 동쪽
  band(LG.z1 - 12.6, LG.x0 + WF, (12.6 + LG.z1) / 2, 1, 0); band(.8, LG.x0 + WF, 9.8, 1, 0);   // 서쪽(로비 문 10.2~12.6 m 빼고)
  // 한낮처럼 고르게 밝은 실내: 천장 조명판 아래로 퍼지는 흰 빛
  for (const x of [10, 16]) { const l = new THREE.PointLight(0xffffff, 9, 14, 1.2); l.position.set(x, 4.6, 14.4); scene.add(l); }

  // 안내데스크: 동쪽 벽 앞 흰 카운터, 앞면 하늘색 타일과 파란 줄. 뒤 벽에 센터 이름
  const white = std({ color: 0xf7f9fb, roughness: .4 });
  boxMM(18.7, 19.5, 0, 1.0, 12.4, 16.4, white); boxMM(18.6, 19.6, 1.0, 1.06, 12.3, 16.5, std({ color: 0xffffff, roughness: .25 })); solid(18.6, 19.6, 12.3, 16.5);
  const deskFront = new THREE.Mesh(new THREE.PlaneGeometry(4.0, .9), tileM(4.0, .9)); place(deskFront, 18.69, .5, 14.4, -1, 0);
  const deskLine = new THREE.Mesh(new THREE.PlaneGeometry(4.0, .06), new THREE.MeshBasicMaterial({ color: LB })); place(deskLine, 18.685, .97, 14.4, -1, 0);
  const deskSign = letters(2.4, .32, (g, W, H) => { g.textAlign = 'center'; font(g, H * .55, 700, FONT_B, LB2); g.fillText('멤버십카드 발급', W / 2, H * .72, W * .98); });
  place(deskSign, 18.68, .55, 14.4, -1, 0);
  const centerSign = letters(5.2, 1.0, (g, W, H) => {
    g.textAlign = 'center';
    font(g, H * .16, 700, FONT_M, LB); g.fillText('HYUNDAI SOCIAL SPORTS CENTER', W / 2, H * .2);
    font(g, H * .5, 400, FONT_K, LB2); g.fillText('현대사회스포츠센터', W / 2, H * .78);
  });
  place(centerSign, LG.x1 - WF - .01, 2.9, 14.4, -1, 0);
  const centerInfo = { kind: 'HYUNDAI SOCIAL SPORTS CENTER', title: '현대사회스포츠센터', body: '두 발로 하는 배달은 너무 느렸어요. 조금이라도 더 빨리 조개를 전하고 싶었던 얼빵해달은 수영을 배우기로 결심했어요. 그렇게 현대사회스포츠센터 아침 수영반에 등록했어요.\n\n해달도 배워야 수영을 한다.\n처음부터 능숙한 존재는 없습니다. 누구에게나 서툰 시작이 있고, 시작하기에 늦은 때도 없습니다. 누군가의 미숙함을 너그럽게 보길 바라는 마음을 담았습니다.', img: 'ip/swim-cover.webp', links: [[SITE + '/ip/#swimming', '홈페이지에서 보기']], focus: focusFrom(LG.x1 - WF, 2.2, 14.4, -1, 0, 5) };
  pickable(centerSign, centerInfo);

  // 멤버십 키오스크: 데스크 북쪽 끝, 중정 문에서 들어오면 바로 보인다. 누르면 이름을 적고 카드를 받는다
  const kx = 18.15, kz = 11.2;
  boxMM(kx - .22, kx + .22, 0, .08, kz - .32, kz + .32, std({ color: 0xdfe6ee, roughness: .5 }));
  boxMM(kx - .12, kx + .12, .08, 1.62, kz - .3, kz + .3, white);
  solid(kx - .3, kx + .3, kz - .4, kz + .4);
  const cardImg = new Image(); cardImg.src = 'img/card-front.webp';
  const screen = panel(.52, .92, (g, W, H) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = LB; g.fillRect(0, 0, W, H * .12);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = `700 ${H * .045}px ${FONT_M}`; g.fillText('MEMBERSHIP', W / 2, H * .08);
    if (cardImg.complete && cardImg.naturalWidth) g.drawImage(cardImg, W * .06, H * .16, W * .88, W * .88);
    g.fillStyle = LB2; g.font = `700 ${H * .07}px ${FONT_B}`; g.fillText('멤버십 카드 발급', W / 2, H * .74);
    g.fillStyle = '#4a5878'; g.font = `500 ${H * .036}px ${FONT_B}`; g.fillText('화면을 누르고 이름을 적어 주세요', W / 2, H * .82);
    g.fillStyle = LB; g.beginPath(); g.roundRect(W * .2, H * .87, W * .6, H * .08, H * .04); g.fill();
    g.fillStyle = '#ffffff'; g.font = `700 ${H * .04}px ${FONT_B}`; g.fillText('시작하기', W / 2, H * .925);
  }, { ppm: 900 });
  cardImg.onload = () => redrawPanel(screen);
  place(screen, kx - .125, 1.1, kz, -1, 0);
  pickable(screen, { kind: 'MEMBERSHIP', title: '멤버십 카드 발급', act: () => openMember(false) });

  // 이름 이야기: 남쪽 벽. 홈페이지 IP 페이지 글을 전부 벽에(누르면 뜨는 창과 같은 글)
  const N0 = '\'Spaced-out Sea Otter\'는 이름뿐 아니라, 캐릭터의 성격까지 담아낸 번역이에요.';
  const N1 = '\'얼빵\'을 소리 그대로 Eolbbang이라 쓰는 대신, 조금 얼빠져 있고 어딘가 엇박자지만 그래서 사랑스러운 느낌을 \'Spaced-out\'으로 옮겼어요.';
  const N2 = '\'해달\'은 동물 해달이면서, 해(☀︎)와 달(☾︎)로도 읽혀요. 하나의 이름 안에 동물과 하늘, 두 겹의 의미가 함께 들어 있어요.';
  const NW = 6.4, NH = 3.3, nx0 = 6.9;
  const nameWall = letters(NW, NH, (g, W, H) => {
    const cm = c => H * c / 100 / NH, col = W * .52;
    font(g, cm(9), 700, FONT_M, LB); g.fillText('A LITTLE MORE ABOUT ME', 0, cm(10));
    font(g, cm(38), 400, FONT_K, LB2); g.fillText('이름에도 의미가 있어요.', 0, cm(56));
    font(g, cm(15), 500, FONT_B, '#3d4a66'); textBlock(g, wrapText(g, N0, W), 0, cm(92), cm(24));
    for (const [i, big, txt] of [[0, '얼빵 → SPACED-OUT', N1], [1, '해달 → SUN + MOON', N2]]) {
      const x = i * col;
      font(g, cm(30), 700, FONT_D, LB); g.fillText(big, x, cm(168));
      font(g, cm(14), 500, FONT_B, '#3d4a66'); textBlock(g, wrapText(g, txt, col - cm(30)), x, cm(206), cm(22));
    }
  });
  place(nameWall, nx0 + NW / 2, 1.55 + NH / 2, LG.z1 - WF - .01, 0, -1);
  pickable(nameWall, { kind: 'A LITTLE MORE ABOUT ME', title: '이름에도 의미가 있어요.', body: N0 + '\n\n얼빵 → SPACED-OUT\n' + N1 + '\n\n해달 → SUN + MOON\n' + N2, img: 'ip/name_haedal.webp', links: [[SITE + '/ip/#identity', '홈페이지에서 보기']], focus: focusFrom(nx0 + NW / 2, 2.8, LG.z1 - WF, 0, -1, 5.2) });

  // 아트토이 진열장: 흰 좌대 위 유리장 둘, 둘 다 조개배달부 얼빵해달. 새 아트토이가 생기면 TOYS에 더하면 그 장부터 바뀐다
  const D = DETAIL[TOY_ID];
  const TOYS = [{ img: 'img/toy-cutout.webp', name: '조개배달부 얼빵해달', sub: '2026 Limited Edition · 10 × 9 × 6 cm', info: { kind: D.en, title: '조개배달부 얼빵해달 2026 Limited Edition', meta: D.medium, body: D.body.join('\n\n') + '\n\n시그니처 조개는 자석으로 떼고 붙일 수 있어요.', ex: D.ex, img: `img/${TOY_ID}.webp`, links: [[`${SITE}/works/w/${TOY_ID}/`, '작품 페이지'], [SITE + '/ip/#toy', '아트토이 이야기', true]] } }];
  const nCase = Math.max(2, TOYS.length), cz = 17.9;
  for (let i = 0; i < nCase; i++) {
    const cx = 15.2 + i * 1.9, toy = TOYS[i] || TOYS[0];
    boxMM(cx - .38, cx + .38, 0, 1.0, cz - .38, cz + .38, white); solid(cx - .45, cx + .45, cz - .45, cz + .45);
    boxMM(cx - .36, cx + .36, 1.0, 1.02, cz - .36, cz + .36, std({ color: 0xe3eaf1, roughness: .4 }));
    const glass = new THREE.Mesh(new THREE.BoxGeometry(.72, .62, .72), M.glass); glass.position.set(cx, 1.33, cz); scene.add(glass);
    boxMM(cx - .37, cx + .37, 1.64, 1.66, cz - .37, cz + .37, white);
    for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) boxMM(cx + ex * .36 - .008, cx + ex * .36 + .008, 1.02, 1.64, cz + ez * .36 - .008, cz + ez * .36 + .008, white);   // 유리장 모서리
    const label = letters(.7, .2, (g, W, H) => {
      g.textAlign = 'center';
      if (toy) { font(g, H * .3, 700, FONT_B, LB2); g.fillText(toy.name, W / 2, H * .42, W * .98); font(g, H * .18, 500, FONT_B, '#4a5878'); g.fillText(toy.sub, W / 2, H * .82, W * .98); }
      else { font(g, H * .34, 700, FONT_M, LB); g.fillText('UPCOMING', W / 2, H * .62); }
    }, 900);
    place(label, cx, .78, cz - .385, 0, -1);   // 관람객이 오는 북쪽을 본다
    if (toy) {
      const fig = cutout(toy.img, .3); place(fig, cx, 1.03, cz, 0, -1);
      const info = { ...toy.info, focus: { pos: [cx, cz - 2.1], look: [cx, 1.2, cz] } };
      pickable(fig, info); pickable(label, info); pickable(glass, info);
    }
  }

  // 아침 수영반 시간표: 북쪽 벽(실제 스포츠센터 강습 시간표 형식)
  const shell = new Image(); shell.src = 'img/shell-stamp.webp';
  const TT = [['06:00 – 06:50', '초급반', '중급반'], ['07:00 – 07:50', '중급반', '초급반'], ['08:00 – 08:50', '고급반', '고급반'], ['09:00 – 09:50', '연수반', '자유수영']];
  const tt = panel(3.2, 2.3, (g, W, H) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = LB; g.fillRect(0, 0, W, H * .2);
    g.fillStyle = '#ffffff'; g.font = `700 ${H * .045}px ${FONT_M}`; g.fillText('MORNING SWIMMING · TIMETABLE', W * .05, H * .07);
    g.font = `400 ${H * .085}px ${FONT_K}`; g.fillText('아침 수영반 강습 시간표', W * .05, H * .165);
    const x0 = W * .05, cw = [W * .34, W * .28, W * .28], rh = H * .1, y0 = H * .25, cx = i => x0 + cw.slice(0, i).reduce((a, b) => a + b, 0) + W * .02;
    g.fillStyle = LSKY; g.fillRect(x0, y0, W * .9, rh);
    g.fillStyle = LB2; g.font = `700 ${H * .045}px ${FONT_B}`;
    ['시간', '월 · 수 · 금', '화 · 목'].forEach((t, i) => g.fillText(t, cx(i), y0 + rh * .66));
    TT.forEach((row, r) => {
      const y = y0 + rh * (r + 1);
      g.fillStyle = r % 2 ? '#f2f7fc' : '#ffffff'; g.fillRect(x0, y, W * .9, rh);
      g.fillStyle = '#2d3a58'; g.font = `500 ${H * .045}px ${FONT_B}`;
      row.forEach((t, i) => g.fillText(t, cx(i), y + rh * .66));
    });
    // 작은 농담: 월·수·금 6시 초급반에만 조개 표시
    if (shell.complete && shell.naturalWidth) { const s = rh * .7; g.drawImage(shell, cx(1) + W * .13, y0 + rh * 1.15, s * shell.naturalWidth / shell.naturalHeight, s); }
    g.strokeStyle = '#c9d8e8'; g.lineWidth = 2; g.strokeRect(x0, y0, W * .9, rh * 5);
    g.fillStyle = '#4a5878'; g.font = `500 ${H * .036}px ${FONT_B}`;
    g.fillText('강습 50분 · 수모와 수경을 꼭 써 주세요 · 강습 10분 전부터 입장', x0, H * .87);
    g.fillText('조개 표시: 얼빵해달 수강 중 — 해달도 배워야 수영을 한다.', x0, H * .935);
  }, { ppm: 420 });
  shell.onload = () => redrawPanel(tt);
  place(tt, 12.6, 2.1, LG.z0 + WF + .01, 0, 1);

  // 해달자개 브랜드샵 배너: 서쪽 벽, 두 줄의자 사이 위. 바탕은 벽과 같은 흰색
  const logo = new Image(); logo.src = 'img/haedal-jagae-logo.webp';
  const shop = panel(2.6, 1.7, (g, W, H) => {
    g.fillStyle = '#f5f8fb'; g.fillRect(0, 0, W, H);
    if (logo.complete && logo.naturalWidth) { const lh = H * .62; g.drawImage(logo, W * .04, H * .08, lh * logo.naturalWidth / logo.naturalHeight, lh); }
    g.fillStyle = LB2; g.font = `700 ${H * .085}px ${FONT_B}`; g.fillText('해달자개 브랜드샵', W * .04, H * .8);
    g.fillStyle = '#4a5878'; g.font = `500 ${H * .05}px ${FONT_B}`; g.fillText('한글자음·알파벳 자개키링과 나전칠기 굿즈', W * .04, H * .88);
    g.fillStyle = LB; g.beginPath(); g.roundRect(W * .62, H * .5, W * .34, H * .12, H * .06); g.fill();
    g.fillStyle = '#ffffff'; g.font = `700 ${H * .05}px ${FONT_B}`; g.fillText('아이디어스에서 보기 ↗', W * .645, H * .575);
  }, { ppm: 360, basic: false });   // 벽처럼 빛을 받아 벽과 같은 색으로 보인다
  logo.onload = () => redrawPanel(shop);
  place(shop, LG.x0 + WF + .01, 2.3, 16.0, 1, 0);
  pickable(shop, { kind: 'Brand Shop', title: '해달자개 브랜드샵', body: '한글자음 자개키링과 알파벳 자개키링, 나전칠기 굿즈는 아이디어스 해달자개 브랜드샵에서 만날 수 있어요.', img: 'img/haedal-jagae-logo.webp', links: [[SHOP_URL, '브랜드샵 바로가기']] });

  // 기다리는 의자: 서쪽 벽을 따라 스포츠센터 로비의 줄의자 둘(하늘색·흰색 번갈아), 앉아서 쉴 수 있다
  const steel = std({ color: 0xb9c2cc, roughness: .35, metalness: .7 }), seatA = std({ color: 0x8fbfe8, roughness: .45 }), seatB = std({ color: 0xf4f7fa, roughness: .45 });
  for (const zc of [14.4, 17.6]) {
    const sx = 6.75, n = 4, sw = .52, half = n * sw / 2;
    boxMM(sx - .03, sx + .03, .34, .4, zc - half, zc + half, steel);
    for (const dz of [-1, 1]) { const lz = zc + dz * (half - .15); boxMM(sx - .25, sx + .25, 0, .04, lz - .04, lz + .04, steel); boxMM(sx - .03, sx + .03, .04, .34, lz - .03, lz + .03, steel); }
    for (let i = 0; i < n; i++) {
      const z = zc - half + sw * (i + .5), mat = i % 2 ? seatB : seatA;
      boxMM(sx - .2, sx + .24, .4, .45, z - .23, z + .23, mat);
      const back = boxMM(sx - .24, sx - .2, .45, .86, z - .23, z + .23, mat); back.rotation.z = -.12;
    }
    solid(sx - .3, sx + .3, zc - half, zc + half);
    SEATS.push({ x: 7.35, z: zc, yaw: -Math.PI / 2, label: '의자에 앉아 쉬기' });
  }
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
    for (const yy of [TOP + .03]) { /* 아래 막대는 뺌(작가님: 바람에 나부끼는데 막대만 가만히 있어 어색) */ const bar = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, W_ + .12, 10), M.steel); bar.rotation.z = Math.PI / 2; bar.position.set(x, yy, 19.9); scene.add(bar); }
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
  // 이름 간판(작가님 시안 2차): 「신해달 갤러리」 한 줄은 Pretendard ExtraBold(800), 기본 글자 폭, 자간 살짝. 아래 영문은 왼쪽 맞춤·한글 높이의 1/5(Pretendard Medium)
  //   채도 낮은 샴페인 브론즈 입체 글자: 앞면 은은한 반광, 옆면 한 톤 어둡게, 모서리는 아주 얕게. 글자 모양 그림을 얇게 여러 장 겹쳐 옆면 두께를 만든다.
  //   Pretendard는 간판 글자만 남긴 작은 글꼴 조각(SIL OFL)을 여기에 넣어 둔다(구글 폰트에 없어서)
  {
    const PF = 'PretendardSign', FONT_EB = 'data:font/woff2;base64,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', FONT_MD = 'data:font/woff2;base64,d09GMgABAAAAAARsAA0AAAAAB/QAAAQbAAFPGgAAAAAAAAAAAAAAAAAAAAAAAAAAGhYbggIcKgZgAGwKhVyESQE2AiQDNAscAAQgBYI6ByAbXgYIHoNteyk95SRF7UzstpjHz4fes95MJt12kvKkLIEDhSW+zioPxL17f4cRbxuLNwW2wOZ5YBO7yNMAy/PZ/wCrFScupz8rXBSuDVyAAb9Ia0zqz9OlBRjRmrT2+ToPqPPMcm0Yu8ghvAQEIAMAgCIoGUEAnA0vtBOXkgPdovuoIdBhAPwbFfPeI4ZADZ6O0VgIvJEC1KhJGGAOtkFDBeZLvhpMYJlPO1t78xMvy6TvBvPK4pvNj2pZv/arSTUOXhMIQNDkDhcwjIhRsZivRSopiwgxilHCTijacSA2d4CLWbqDfJWAWGBPABvTAvRmI130IVUEgGIAQk2MHudm4xoU7bPN/02A8ZP3dTdkNXEfAIUMoAAB0Hh+yvTpTAHAxEBAKSLFSpQiTbb2f1BGixEPZX0Dc63rrrrikovOORkR3KIFAC0BOsANgFQBAACra6KRLNHk3iXHJI1sIzOVbNC4cmmiNJ530BWM7cI7SRO1C2tLMa2khuctLBdmlnGunmiELtTbZQzvIr7g1StMKyyUFhYX58tE30ZZxldXRqaX10+vLczlEyWmF6XxXNQxrsVKblL3UFryCVyNDhgvaaSJ+oWFhZj2Kqc/H8BlxgcuLCbTi3IMwwRzcwtjJTK+ys4VFeVJo6qyknl1wnSs9ObC8fj6SwOlcazzBDtl9r7/yu59r2dO9gnfaqxvYX/+aopVEK8Nr7wO7Yipqd0VF3C4TLr65btJIJ/zb347QNPdt+jKsTPTLk27cO7KKkTfu19btmTirSlDvx74sC93p0wfebhjtwNkRK8zQbtOrdeZVhy96XhqV0Zd3e4Mu1MXN2LcpaT5wrru8BWjno2qgJgmj3s2zjJMaspnvF5yZQCyGnjg2mAlWwHjI5W20dmU1PqHbFfN8GGP5q6a/XK6R3jCb1tLnYNVxbvqTctnTJ22Yv5Gk4zAx+Ltw6bkz/SL6xbWaXX34a0W2h5x+HS5Y5iwvfpp0N7t7/vMuaqaUaEZfnzsnI7LgrIGIFbertssy4Ou4/s2nzDn8pu+y5fX95l+ho4sgvG5b+xSw/ilv5X6YQEVAcrNYQAAEADptSxc4vm1qz7km1pQAwBqB3dZYhYOb/9b/rffLfUCABZoa5XHn/+bgKYpJv15tQS5pAfmgHXkK+IEdskcrGIbsEq8hF7JMayiNB9MMZ1LA+83Yq91SEJggwC0pkFy4vlf2pYK0AugwgAWOhCQWAMgBPI4hJUQDqXThSMIMKiR1eWIWtp1iIqVK4g21DDjjdBfX/2MotgfU7x4/MLeFMn6G0SRYLzRhujL1QD9DZFhhN5G6W2IXroboRdFqt566W+0wbL01tdog3Q3gic33jwEChYtR65swb3Ju4J5SsQYqb+hDYqttg+PIMAyyzYCAA==';
    const SX = -15.1, SY = 2.75, SZ = 19.57, SW = 6.4, SH = 1.6, PPM = 260, DEP = .06, NL = 12;
    const W = Math.round(SW * PPM), H = Math.round(SH * PPM);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return [c, t]; };
    const [cF, tF] = mk(), [cS, tS] = mk();
    const KO = '신해달 갤러리', EN = 'SHIN HAEDAL GALLERY';
    const KF = (px) => `800 ${px}px "${PF}", "Noto Sans KR", sans-serif`, EF = (px) => `500 ${px}px "${PF}", "Noto Sans KR", sans-serif`;
    const layout = (g) => {
      const kh = .86 * PPM; g.font = KF(kh); g.letterSpacing = `${kh * .03}px`;
      const kw = g.measureText(KO).width, x0 = (W - kw) / 2, ky = H * .66;
      let eh = kh * .2; g.font = EF(eh); g.letterSpacing = `${eh * .22}px`;
      const ew = g.measureText(EN).width; if (ew > kw * .78) eh *= kw * .78 / ew;   /* 영문 줄은 한글보다 짧게 */
      return { kh, kw, x0, ky, eh, ey: ky + kh * .12 + eh * 1.25 };
    };
    const paint = (g, front) => {
      g.clearRect(0, 0, W, H); const L = layout(g);
      const lines = [[KF(L.kh), L.kh * .03, KO, L.ky], [EF(L.eh), L.eh * .22, EN, L.ey]];
      for (const [f, sp, t, y] of lines) {
        g.font = f; g.letterSpacing = `${sp}px`;
        if (!front) { g.fillStyle = '#66594a'; g.fillText(t, L.x0, y); continue; }   /* 옆면: 한 톤 어두운 브론즈 */
        const gr = g.createLinearGradient(0, y - L.kh, 0, y + L.kh * .1); gr.addColorStop(0, '#dcd1be'); gr.addColorStop(.5, '#c3b398'); gr.addColorStop(1, '#a29278');   /* 채도 낮은 샴페인 브론즈, 은은한 반광 */
        g.fillStyle = 'rgba(250,243,228,.6)'; g.fillText(t, L.x0 - 1, y - 1);   /* 아주 얕게 깎은 위 모서리 */
        g.fillStyle = gr; g.fillText(t, L.x0, y);
      }
    };
    const draw = () => { paint(cF.getContext('2d'), true); paint(cS.getContext('2d'), false); tF.needsUpdate = tS.needsUpdate = true; };
    draw();
    Promise.all([new FontFace(PF, `url(${FONT_EB})`, { weight: '800' }), new FontFace(PF, `url(${FONT_MD})`, { weight: '500' })].map(f => f.load().then(ff => (document.fonts.add(ff), ff)))).then(draw).catch(() => {});
    const geo = new THREE.PlaneGeometry(SW, SH);
    for (let i = 0; i < NL; i++) {   // 뒤에서부터 옆면 겹, 맨 앞이 앞면
      const front = i === NL - 1, m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: front ? tF : tS, transparent: true, alphaTest: .45, toneMapped: false, color: front ? 0xffffff : new THREE.Color(1, 1, 1).multiplyScalar(.85 + .15 * i / NL) }));
      place(m, SX, SY, SZ + .004 + DEP * i / (NL - 1), 0, 1);
    }
    // 처마 아래에서 내려오는 3000K 부드러운 빛: 간판 전체를 덮는 넓은 띠로, 위가 조금 밝고 가장자리는 아주 길게 풀린다
    const glowT = canvasTex(512, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      /* 빛 윗끝은 벽 맨 위(처마 밑, 6 m)에 붙는다: 처마 바로 밑이 가장 밝고 아래로 갈수록 풀린다(중간에서 잘린 선이 없게) */
      const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(255,214,160,.46)'); v.addColorStop(.05, 'rgba(255,212,158,.58)'); v.addColorStop(.4, 'rgba(255,208,150,.44)'); v.addColorStop(.65, 'rgba(255,206,148,.3)'); v.addColorStop(.85, 'rgba(255,202,144,.12)'); v.addColorStop(1, 'rgba(255,200,140,0)');
      g.fillStyle = v; g.fillRect(0, 0, w, h);
      const mc = document.createElement('canvas'); mc.width = w; mc.height = h; const mg = mc.getContext('2d');
      for (let y = 0; y < h; y++) {   /* 옆 가장자리: 위는 좁게, 아래로 갈수록 넓게 퍼지며 길게 풀린다 */
        const t = y / (h - 1), a = .1 - .07 * t, b = a + .2;
        const hz = mg.createLinearGradient(0, 0, w, 0); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(a, 'rgba(0,0,0,0)'); hz.addColorStop(b, 'rgba(0,0,0,1)'); hz.addColorStop(1 - b, 'rgba(0,0,0,1)'); hz.addColorStop(1 - a, 'rgba(0,0,0,0)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
        mg.fillStyle = hz; mg.fillRect(0, y, w, 1);
      }
      g.globalCompositeOperation = 'destination-in'; g.drawImage(mc, 0, 0);
    });
    const GT = 5.97, GB = 1.3;   /* 벽 맨 위(처마 밑) ~ 간판 아래 */
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(SW * 1.8, GT - GB), new THREE.MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .45, toneMapped: false }));
    place(glow, SX, (GT + GB) / 2, SZ + .002, 0, 1);
  }
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
  scene.add(trunks, cones); OUTDOOR.push(trunks, cones);
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
  bush.count = bi; scene.add(bush); OUTDOOR.push(bush);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a867d, roughness: .9, flatShading: true });
  for (const [x, z, w] of [[-29, 30, 2.2], [30, -12, 1.6], [-30, -28, 1.8], [28, 40, 2.6]]) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(w, 0), rockMat); rk.position.set(x, w * .35, z); rk.scale.y = .6; rk.rotation.y = x; scene.add(rk); }
}
