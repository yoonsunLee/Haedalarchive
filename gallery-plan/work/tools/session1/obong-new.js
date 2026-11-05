  // 정면 벽 전체: 가로로 긴 일월오봉도. 남는 양옆은 거울처럼 이어 그린다
  const wallW = OB.x1 - OB.x0 - .3, wallH = 10.8;
  const t = canvasTex(2400, Math.round(2400 * wallH / wallW), () => {});
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const img = new Image(); img.src = 'img/ilwol-wide.webp';
  const PW = wallH * 1644 / 957;   // 그림 한 장의 너비(m)
  img.onload = () => {
    const c = t.image, g = c.getContext('2d'), H = c.height, w = img.width * H / img.height, x0 = (c.width - w) / 2;
    g.fillStyle = '#050404'; g.fillRect(0, 0, c.width, H);
    g.drawImage(img, x0, 0, w, H);
    if (x0 > 0) {
      g.save(); g.translate(x0, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, w, H); g.restore();
      g.save(); g.translate(x0 + w * 2, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, w, H); g.restore();
    }
    t.needsUpdate = true;
  };
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(wallW, wallH), new THREE.MeshBasicMaterial({ map: t, color: 0xdedede, toneMapped: false })); wall.position.set(0, .1 + wallH / 2, OB.z0 + .17); scene.add(wall);
  pickable(wall, { kind: 'IRWOROBONGDAN', title: '일월오봉단', body: '일월오봉단은 조선 왕실과 깊이 연결된 전통 회화인 일월오봉도에서 영감을 받은 신해달 작가의 오리지널 캐릭터 그룹이에요. 해와 달, 다섯 봉우리, 소나무와 물이 그 세계의 출발점이에요.\n\n캐릭터와 이야기는 학·토끼·호랑이·사슴 등 한국의 전통적인 소재에서 출발했어요. 각자의 역할에는 신해달 작가가 존중하고 동경하는 직업과 삶의 방식을 담았어요.', img: 'ip/friends.webp', links: [[SITE + '/ip/#friends', '홈페이지에서 보기']], focus: { pos: [0, ROPE_Z + 1.6], look: [0, 3.6, OB.z0] } });
  // 두 단 단상: 뒷단 1.8 m, 앞단 0.85 m
  const BH = 1.8, FH = .85, backZ0 = OB.z0 + .7, backZ1 = backZ0 + 1.4, frontZ1 = backZ1 + 1.5;
  boxMM(-8.2, 8.2, 0, BH, backZ0, backZ1, M.lacquer); boxMM(-9.2, 9.2, 0, FH, backZ1, frontZ1, M.lacquer);
  boxMM(-8.2, 8.2, BH - .02, BH + .01, backZ1 - .02, backZ1 + .01, M.brass); boxMM(-9.2, 9.2, FH - .02, FH + .01, frontZ1 - .02, frontZ1 + .01, M.brass);
  solid(-9.2, 9.2, backZ0, frontZ1);
  // 자리: 뒷줄은 그림 속 달(왼쪽)과 해(오른쪽) 아래, 앞줄은 소나무·가운데 봉우리·소나무 앞
  const T0 = 2.4, moonX = (.295 - .5) * PW, sunX = (.735 - .5) * PW;
  const spots = { rabbit: [moonX, BH, backZ0 + .7], crane: [sunX, BH, backZ0 + .7], deer: [-6.4, FH, backZ1 + .75], tiger: [0, FH, backZ1 + .75], otter: [6.4, FH, backZ1 + .75] };
  for (const f of FRIENDS) {
    const [x, y, z] = spots[f.c], h = T0 * f.s * f.k;
    const fig = cutout(`img/${f.c}-cutout.webp`, h); place(fig, x, y - T0 * f.s * f.g, z, 0, 1);
    // 명판: 단 앞면에 바로 쓴 밝은 글자
    const back = y > 1, ph = back ? BH - FH - .12 : FH - .12;
    const plaque = letters(2.2, ph, (g, W, H) => {
      g.textAlign = 'center';
      font(g, H * .15, 700, FONT_M, '#a9d6ce'); g.fillText(f.en, W / 2, H * .2);
      font(g, H * .27, 700, FONT_B, '#f4f1ea'); g.fillText(f.name, W / 2, H * .5);
      font(g, H * .15, 400, FONT_B, '#d6dedf'); g.fillText(f.role, W / 2, H * .72);
      font(g, H * .13, 400, FONT_M, '#c0ccce'); g.fillText(`아이템: ${f.item}`, W / 2, H * .92);
    }, 420);
    place(plaque, x, back ? FH + ph / 2 + .06 : ph / 2 + .06, (back ? backZ1 : frontZ1) + .012, 0, 1);
    const info = { kind: f.en, title: f.name, meta: `${f.role} · 아이템: ${f.item}`, body: '일월오봉단의 한 사람이에요.', img: `img/${f.c}-cutout.webp`, links: [[SITE + '/ip/#friends', '일월오봉단 소개']], focus: { pos: [x * .6, ROPE_Z + 1.4], look: [x, y + 1.1, z] } };
    pickable(fig, info); pickable(plaque, info);
  }
  // 차단봉 줄: 검은 봉에 가는 줄, 명판을 가리지 않게 낮게
  const black = new THREE.MeshStandardMaterial({ color: 0x0e0d0d, roughness: .35, metalness: .5 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x141212, roughness: .7 });
  const posts = []; for (let x = -9.6; x <= 9.61; x += 2.4) posts.push(x);
  for (const x of posts) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .8, 12), black); p.position.set(x, .4, ROPE_Z); scene.add(p); const b = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .03, 20), black); b.position.set(x, .015, ROPE_Z); scene.add(b); const k = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), black); k.position.set(x, .81, ROPE_Z); scene.add(k); }
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i], b = posts[i + 1], pts = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector3(a + (b - a) * t, .76 - Math.sin(t * Math.PI) * .12, ROPE_Z)); }
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .009, 6), ropeMat));
  }
  solid(OB.x0, OB.x1, ROPE_Z - .25, ROPE_Z + .1); solid(OB.x0, OB.x1, OB.z0, ROPE_Z);
  // 그림 아래로 번지는 빛
  const glow = panel(20, 6, (g, W, H) => { const gr = g.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * .55); gr.addColorStop(0, 'rgba(255,214,150,.2)'); gr.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }, { transparent: true, ppm: 40 });
  glow.material.depthWrite = false; glow.rotation.x = -Math.PI / 2; glow.position.set(0, .03, OB.z0 + 3.4); scene.add(glow);
  // 깊이 있는 밤하늘: 천장 아래 한 겹 더, 드문드문 큰 별이 떠 있다
  const stars2 = panel(20.4, 17.2, (g, W, H) => { g.clearRect(0, 0, W, H); const r = rng(77); for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H, s = 1.2 + r() * 1.6, gr = g.createRadialGradient(x, y, 0, x, y, s * 3); gr.addColorStop(0, `rgba(222,190,130,${.35 + r() * .35})`); gr.addColorStop(1, 'rgba(222,190,130,0)'); g.fillStyle = gr; g.fillRect(x - s * 3, y - s * 3, s * 6, s * 6); } }, { transparent: true, ppm: 60 });
  stars2.material.depthWrite = false; stars2.material.side = THREE.DoubleSide; stars2.rotation.x = Math.PI / 2; stars2.position.set(0, OB.ceil - .9, (OB.z0 + OB.z1) / 2); scene.add(stars2);
  stampMark('obong', 0, -19.9);
  doorSign('중정 · 출구 라운지 →', 'COURTYARD · EXIT', 0, 7.0, OB.z1 - .16, 0, -1, 3.4);
  // 들어서는 곳 안내: 다른 방처럼 벽에 바로 쓴 글자(어두운 흙벽이라 밝은 글자)
  const intro = letters(3.6, 2.3, (g, W, H) => {
    font(g, H * .045, 700, FONT_M, '#a9d6ce'); g.fillText('IRWOROBONGDAN', 0, H * .06);
    font(g, H * .14, 400, FONT_K, '#f4f1ea'); g.fillText('혼자가 아니에요.', 0, H * .24);
    font(g, H * .06, 400, FONT_B, '#ddd6cc');
    const y = textBlock(g, wrapText(g, '일월오봉단은 조선 왕실과 깊이 연결된 전통 회화인 일월오봉도에서 영감을 받은 신해달 작가의 오리지널 캐릭터 그룹이에요. 해와 달, 다섯 봉우리, 소나무와 물이 그 세계의 출발점이에요.', W * .95), 0, H * .4, H * .085);
    textBlock(g, wrapText(g, '캐릭터와 이야기는 학·토끼·호랑이·사슴 등 한국의 전통적인 소재에서 출발했어요. 각자의 역할에는 신해달 작가가 존중하고 동경하는 직업과 삶의 방식을 담았어요.', W * .95), 0, y + H * .04, H * .085);
  });
  place(intro, OB.x0 + .16, 1.9, -12.8, 1, 0);
}
