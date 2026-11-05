
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
  // 입구: 그림책 표지가 문처럼 열린다
  const coverTex = canvasTex(1200, 1320, (g, W, H) => {
    g.fillStyle = '#1d2a5c'; g.fillRect(0, 0, W, H);
    const r = rng(4); speckle(g, W, H, 9000, 2, ['#23336e', '#17224c'], .5, r);
    g.strokeStyle = '#c9a86a'; g.lineWidth = 10; g.strokeRect(40, 40, W - 80, H - 80);
    g.fillStyle = '#c9a86a'; g.textAlign = 'center'; g.font = `500 40px ${FONT_M}`; g.fillText('AN ORIGINAL CHARACTER BY SHIN HAEDAL', W / 2, 160);
    g.font = `700 92px ${FONT_D}`; g.fillText('SPACED-OUT', W / 2, 300); g.fillText('SEA OTTER', W / 2, 410);
    g.fillStyle = '#efe9df'; g.font = `400 150px ${FONT_K}`; g.fillText('얼빵해달', W / 2, 1150);
  });
  coverTex.wrapS = coverTex.wrapT = THREE.ClampToEdgeWrapping;
  const halves = [];
  // 문짝 바깥면: 홈페이지 IP 소개 바탕(자개 해달과 얼빵해달이 겹겹이) 그림을 두 문에 이어서
  const face = new Image(); face.src = 'ip/ip-door.webp'; face.onload = () => {
    const g = coverTex.image.getContext('2d'), W = 1200, H = 1320, s = Math.max(W / face.width, H / face.height), w = face.width * s, h = face.height * s;
    g.drawImage(face, (W - w) / 2, (H - h) / 2, w, h); halves.forEach(t => t.needsUpdate = true);
  };
  const endTex = canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#efe4c8'; g.fillRect(0, 0, W, H); g.fillStyle = '#d8c59c'; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { g.beginPath(); g.arc(i * 52 + (j % 2) * 26, j * 52, 9, 0, 7); g.fill(); } }, [3, 6]);
  // 문 한 장이 위로 스르륵 올라가며 열린다(홈페이지 IP 소개처럼)
  halves.push(coverTex);
  const doorMats = [new THREE.MeshStandardMaterial({ map: endTex, roughness: .9 }), new THREE.MeshBasicMaterial({ map: coverTex, toneMapped: false }), M.paper, M.paper, M.paper, M.paper];
  const door = new THREE.Mesh(new THREE.BoxGeometry(.06, 3.3, 3.0), doorMats); door.position.set(IPR.x0 + .22, 1.65, -4.5); scene.add(door);
  let open = 0;
  animators.push((t, dt, me) => {
    const want = (Math.hypot(me.x - IPR.x0, me.z + 4.5) < 5 || (me.x > IPR.x0 && me.z < 9.4)) ? 1 : 0;
    open += (want - open) * Math.min(1, dt * (reduceMotion ? 30 : 2.4));
    const e = open * open * (3 - 2 * open);
    door.position.y = 1.65 + e * 3.4;
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
