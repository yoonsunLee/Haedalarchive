
/* ───────── 중정: 얼빵해달 등신대, 이정표, 현판 ───────── */
const standeeSpot = { x: 3.4, z: 1.6 };
const HYEON = [], SEATS = [], VISITED = new Set();   // 현판 빛, 앉는 자리, 다녀간 곳(다음 문 현판을 고른다)
{
  const st = cutout('img/standee.webp', 1.75); place(st, standeeSpot.x, .04, standeeSpot.z, -.55, .83);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.42, .46, .05, 32), M.lacquer); base.position.set(standeeSpot.x, .065, standeeSpot.z); scene.add(base);
  solid(standeeSpot.x - .35, standeeSpot.x + .35, standeeSpot.z - .2, standeeSpot.z + .2);
  // 발자국 표시: 여기 서서 사진 찍기
  const mark = panel(1.1, 1.1, (g, W, H) => {
    g.clearRect(0, 0, W, H); g.strokeStyle = 'rgba(43,78,201,.9)'; g.lineWidth = W * .02; g.setLineDash([W * .04, W * .03]); g.beginPath(); g.arc(W / 2, H / 2, W * .44, 0, 7); g.stroke();
    g.setLineDash([]); g.fillStyle = '#2b4ec9'; g.font = `700 ${W * .1}px ${FONT_B}`; g.textAlign = 'center'; g.fillText('사진 찍는 자리', W / 2, H * .55);
  }, { transparent: true, ppm: 300 });
  mark.rotation.x = -Math.PI / 2; mark.position.set(standeeSpot.x - .95, .05, standeeSpot.z + .9); scene.add(mark);
  stampMark('court', -2.6, 1.8);
  // 문 위 현판: 판과 테두리 없이 문틀 위 벽에 얇은 낱글자. 한글 이름 + 아래 작은 영문 한 줄.
  // 관람 순서상 다음에 갈 문의 현판만 은은하게 밝아진다(작품관 → IP 체험관 → 일월오봉단관 → 해달 라운지)
  const HY_INK = '#6b5230', HY_LIT = '#c98a2e';   // 평소 짙은 청동색, 다음 문은 따뜻한 호박빛
  const hyeon = (key, ko, en, x, z, nx, nz, w = 2.6) => {
    const draw = (color, glow) => (g, W, H) => {
      g.textAlign = 'center';
      if (glow) { g.shadowColor = 'rgba(240,170,70,.9)'; g.shadowBlur = H * .3; }
      font(g, H * .5, 400, FONT_D, color); g.fillText(ko, W / 2, H * .56);
      font(g, H * .17, 400, FONT_M, color); g.fillText(en, W / 2, H * .9);
    };
    const ink = letters(w, .3, draw(HY_INK, false), 600); place(ink, x, 3.245, z, nx, nz);
    const lit = letters(w, .3, draw(HY_LIT, true), 600); place(lit, x + nx * .004, 3.245, z + nz * .004, nx, nz);
    lit.material.opacity = 0;
    // 글자 뒤 벽에 번지는 옅은 빛
    const halo = panel(w * 1.25, .7, (g, W, H) => { g.clearRect(0, 0, W, H); const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(250,180,80,.4)'); gr.addColorStop(1, 'rgba(250,180,80,0)'); g.fillStyle = gr; g.save(); g.scale(1, H / W); g.fillRect(0, 0, W, W); g.restore(); }, { transparent: true, ppm: 120 });
    halo.material.depthWrite = false; halo.material.opacity = 0; place(halo, x + nx * .002, 3.2, z + nz * .002, nx, nz);
    HYEON.push({ key, lit, halo, on: 0 });
  };
  hyeon('works', '작품관', 'WORKS', -10.22, -4.5, 1, 0);
  hyeon('ip', 'IP 체험관', 'IP EXPERIENCE', 10.22, -4.5, -1, 0);
  hyeon('ipExit', 'IP 체험관 나가는 곳', 'IP EXPERIENCE · EXIT', 10.22, 5.5, -1, 0, 3.0);
  hyeon('obong', '일월오봉단관', 'IRWOROBONGDAN', 0, -9.22, 0, 1, 3.0);
  hyeon('lounge', '해달 라운지', 'HAEDAL LOUNGE', 8.3, 9.22, 0, -1);
  // 로비 쪽은 바닥부터 통째로 열려 있으니 툇마루 반자 밑에 가는 나무 인방을 걸고 거기에 쓴다
  boxMM(-6, 6, 3.08, 3.4, 9.32, 9.5, M.soffit);
  hyeon('lobby', '로비', 'LOBBY', 0, 9.3, 0, -1);
  animators.push((t, dt) => {
    const next = !VISITED.has('works') ? 'works' : !VISITED.has('ip') ? 'ip' : !VISITED.has('obong') ? 'obong' : 'lounge';
    for (const h of HYEON) {
      h.on += ((h.key === next ? 1 : 0) - h.on) * Math.min(1, dt * 1.5);
      const breathe = reduceMotion ? 1 : .8 + .2 * Math.sin(t * 1.3);
      h.lit.material.opacity = h.on * breathe; h.halo.material.opacity = h.on * .7 * breathe;
    }
  });

  // 이정표: 로비에서 들어서는 축선 앞, 검은 금속 기둥에 다섯 방향 날개
  {
    const px = -1.5, pz = 6.1;   // 축선 바로 옆이라 로비에서 오봉단관을 보는 눈길은 막지 않는다
    boxMM(px - .05, px + .05, 0, 2.35, pz - .05, pz + .05, M.steel); solid(px - .1, px + .1, pz - .1, pz + .1);
    const dirs = [['일월오봉단관', 0, -9.4], ['작품관', -10.4, -4.5], ['IP 체험관', 10.4, -4.5], ['해달 라운지', 8.3, 9.4], ['로비', 0, 9.4]];
    dirs.forEach(([name, tx, tz], i) => {
      const y = 2.15 - i * .24, th = Math.atan2(-(tz - pz), tx - px), L = .78;
      const arm = new THREE.Group(); arm.position.set(px, y, pz); arm.rotation.y = th; scene.add(arm);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(L, .17, .025), M.steel); blade.position.x = L / 2 + .04; arm.add(blade);
      for (const side of [1, -1]) {
        const t = letters(L - .06, .15, (g, W, H) => {
          g.textAlign = side > 0 ? 'left' : 'right'; font(g, H * .56, 500, FONT_B, '#e8d9b8');
          g.fillText(side > 0 ? `${name} →` : `← ${name}`, side > 0 ? W * .04 : W * .96, H * .72);
        }, 520);
        t.position.set(L / 2 + .04, 0, side * .0135); if (side < 0) t.rotation.y = Math.PI; arm.add(t);
      }
    });
  }

  // 곡선 화단의 소나무
  const planter = (x, z, rx, rz) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .38, 48, 1, true), M.blackStone); ring.scale.set(rx, 1, rz); ring.position.set(x, .19, z); scene.add(ring);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 8, 48), M.blackStone); lip.rotation.x = Math.PI / 2; lip.scale.set(rx, rz, 1); lip.position.set(x, .38, z); scene.add(lip);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(1, 48), std({ color: 0x3f4a2c, roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.scale.set(rx, rz, 1); soil.position.set(x, .33, z); scene.add(soil);
    solid(x - rx * .8, x + rx * .8, z - rz * .8, z + rz * .8);
  };
  {
    // 소나무: 비스듬히 휜 붉은 줄기 위에 납작한 솔잎 덩이 여럿
    const [x, z] = [-4.5, -1.6]; planter(x, z, 1.7, 1.25);
    const bark = std({ color: 0x6b4a36, roughness: .9 }), needle = std({ color: 0x2f4a2a, roughness: .95, flatShading: true });
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, .3, z), new THREE.Vector3(x + .35, 1.6, z + .1), new THREE.Vector3(x + .15, 2.8, z - .2), new THREE.Vector3(x + .6, 3.6, z - .1)]);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .13, 8), bark));
    const r = rng(17);
    for (const [ox, oy, oz, sw] of [[.6, 3.7, -.1, 1.5], [-.5, 3.0, .2, 1.2], [.9, 2.7, .3, 1.0], [.1, 4.1, -.3, 1.0], [-.2, 2.3, -.5, .8]]) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), needle); c.scale.set(sw, sw * .32, sw * .8); c.position.set(x + ox, oy, z + oz); c.rotation.y = r() * 3; scene.add(c);
    }
  }
  // 쉬는 자리: 등받이 없는 나무 벤치 둘과 툇마루 가장자리. 다가가면 '앉아서 쉬기'
  const bench = (x, z, rotY) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, .08, .45), M.wood); top.position.y = .42; g.add(top);
    for (const sx of [-.7, .7]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.08, .38, .38), M.steel); leg.position.set(sx, .19, 0); g.add(leg); }
  };
  bench(-4.3, .9, Math.PI / 2); bench(6.0, -.4, Math.PI / 2);   // 마당 가운데를 바라보게 세로로. 오른쪽은 등신대 사진 자리(2.4 m)를 피해서
  SEATS.push({ x: -4.3, z: .9, yaw: -Math.PI / 2, label: '벤치에 앉아 쉬기' }, { x: 6.0, z: -.4, yaw: Math.PI / 2, label: '벤치에 앉아 쉬기' },
    { x: -8.6, z: 2.4, yaw: -Math.PI / 2, label: '툇마루에 앉아 쉬기' }, { x: 8.6, z: 2.4, yaw: Math.PI / 2, label: '툇마루에 앉아 쉬기' },
    { x: -5.5, z: -7.6, yaw: Math.PI, label: '툇마루에 앉아 쉬기' }, { x: 5.5, z: -7.6, yaw: Math.PI, label: '툇마루에 앉아 쉬기' });
}

/* ───────── ③ 일월오봉단관 ───────── */
const OB = ROOMS.obong, OB_STOP = OB.z0 + 2.15 + .6;   // 발자국이 멈추는 곳: 디딤단 앞 60 cm
{
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
      // 원본 그림 구간이 가장 밝고, 이어 그린 양옆은 바깥으로 갈수록 살짝 낮아져 이음매가 숨는다
      for (const [a, b] of [[x0, 0], [x0 + w, c.width]]) { const gr = g.createLinearGradient(a, 0, b, 0); gr.addColorStop(0, 'rgba(5,4,4,0)'); gr.addColorStop(1, 'rgba(5,4,4,.32)'); g.fillStyle = gr; g.fillRect(Math.min(a, b), 0, Math.abs(b - a), H); }
    }
    t.needsUpdate = true;
  };
  const paintWall = new THREE.Mesh(new THREE.PlaneGeometry(wallW, wallH), new THREE.MeshBasicMaterial({ map: t, color: 0xdedede, toneMapped: false })); paintWall.position.set(0, .1 + wallH / 2, OB.z0 + .17); scene.add(paintWall);
  pickable(paintWall, { kind: 'IRWOROBONGDAN', title: '일월오봉단', body: '일월오봉단은 조선 왕실과 깊이 연결된 전통 회화인 일월오봉도에서 영감을 받은 신해달 작가의 오리지널 캐릭터 그룹이에요. 해와 달, 다섯 봉우리, 소나무와 물이 그 세계의 출발점이에요.\n\n캐릭터와 이야기는 학·토끼·호랑이·사슴 등 한국의 전통적인 소재에서 출발했어요. 각자의 역할에는 신해달 작가가 존중하고 동경하는 직업과 삶의 방식을 담았어요.', img: 'ip/friends.webp', links: [[SITE + '/ip/#friends', '홈페이지에서 보기']], focus: { pos: [0, OB_STOP + 1.6], look: [0, 3.6, OB.z0] } });
  // 함께 쓰는 낮은 디딤단 하나(높이 15 cm, 검은 옻칠). 두 단 단상과 차단봉 줄은 없다. 그림과의 거리는 디딤단이 지킨다
  const SH = .15, stepZ0 = OB.z0 + .45, stepZ1 = OB.z0 + 2.15;
  boxMM(-5.4, 5.4, 0, SH, stepZ0, stepZ1, M.lacquer);
  boxMM(-5.4, 5.4, SH - .012, SH + .004, stepZ1 - .03, stepZ1 + .004, M.brass);   // 앞 모서리 놋쇠 띠
  solid(OB.x0, OB.x1, OB.z0, OB_STOP - .35);
  // 그림 빛은 디딤단 윗면까지만 닿고 모서리에서 멎는다
  const pool = panel(10.8, stepZ1 - stepZ0, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,226,180,.16)'); gr.addColorStop(1, 'rgba(255,226,180,.07)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }, { transparent: true, ppm: 30 });
  pool.material.depthWrite = false; pool.rotation.x = -Math.PI / 2; pool.position.set(0, SH + .003, (stepZ0 + stepZ1) / 2); scene.add(pool);
  // 다섯은 같은 높이 곧은 한 줄, 각자 그림 속 자기 상징 아래(가운데에서 ±1.7 m, ±3.4 m)
  const T0 = 1.9, charZ = OB.z0 + 1.15, SYM = { SUN: '해', MOON: '달', MOUNTAIN: '산', PINE: '소나무', SEA: '바다' };
  const xs = { deer: -3.4, rabbit: -1.7, tiger: 0, crane: 1.7, otter: 3.4 };
  for (const f of FRIENDS) {
    const x = xs[f.c], h = T0 * f.s * f.k;
    const fig = cutout(`img/${f.c}-cutout.webp`, h); place(fig, x, SH - T0 * f.s * f.g, charZ, 0, 1);
    // 크고 부드러운 빛이라 그림 위에 짧고 흐린 그림자
    const sh = panel(1.6, h * .7, (g, W, H) => { g.clearRect(0, 0, W, H); g.save(); g.scale(1, H / W); const gr = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); gr.addColorStop(0, 'rgba(0,0,0,.32)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); g.restore(); }, { transparent: true, ppm: 60 });
    sh.material.depthWrite = false; sh.position.set(x, SH + h * .3, OB.z0 + .19); scene.add(sh);
    // 명판: 발 앞 디딤단 윗면에 놋쇠 글자로 눕혀서. 작게 영문 / 크게 역할과 이름 / 작게 상징
    const PW_ = 1.62, PH_ = .56;
    const plaque = letters(PW_, PH_, (g, W, H) => {
      g.textAlign = 'center';
      font(g, H * .17, 700, FONT_M, '#c9a86a'); g.fillText(f.en, W / 2, H * .2);
      font(g, H * .27, 700, FONT_B, '#d8b878'); g.fillText(`${f.role} ${f.name}`, W / 2, H * .58, W * .98);
      font(g, H * .19, 500, FONT_B, '#c9a86a'); g.fillText(SYM[f.en] || '', W / 2, H * .9);
    }, 420);
    plaque.rotation.x = -Math.PI / 2; plaque.position.set(x, SH + .005, stepZ1 - .33); scene.add(plaque);
    // 누르면 뜨는 창: 지금 있는 정보만(영문, 이름, 역할, 아이템). 설명 문장은 넣지 않는다
    const info = { kind: f.en, title: f.name, meta: `${f.role} · 아이템: ${f.item}`, img: `img/${f.c}-cutout.webp`, links: [[SITE + '/ip/#friends', '홈페이지에서 보기']], focus: { pos: [x * .6, OB_STOP + .6], look: [x, SH + h * .5, charZ] } };
    pickable(fig, info); pickable(plaque, info);
  }
  // 천장: 별 없이 높고 어두운 나무 천장과 서까래. 그림 벽에서 튀어 오른 따뜻한 빛이 서까래 아랫면을 엷게 비춘다
  const rafter = std({ color: 0x5a3b26, roughness: .85 });
  for (let x = -9.9; x <= 9.91; x += .9) boxMM(x - .07, x + .07, OB.ceil - .24, OB.ceil, OB.z0 + 1.2, OB.z1, rafter);
  // 그림 벽 바로 앞 천장의 틈 천창: 한낮 확산광이 그림을 위에서 고르게 쓸어내린다
  boxMM(-10.2, 10.2, OB.ceil - .02, OB.ceil, OB.z0 + .2, OB.z0 + 1.1, new THREE.MeshBasicMaterial({ color: 0xfff6e8 }));
  const bounce = new THREE.PointLight(0xffd9a8, 0, 16, 1.6); bounce.position.set(0, 8.5, OB.z0 + 2.2); scene.add(bounce);
  // 들어서면 눈이 적응하듯 몇 초에 걸쳐 밝아지고, 다가갈수록 방이 조금 더 깨어난다(움직임 줄이기면 바로 다 밝게)
  let adapt = 1, wasIn = false;
  animators.push((t, dt, me) => {
    const inside = me.x > OB.x0 && me.x < OB.x1 && me.z > OB.z0 && me.z < OB.z1;
    if (inside && !wasIn && !reduceMotion) adapt = .55;
    wasIn = inside;
    adapt += (1 - adapt) * Math.min(1, dt * .7);
    const near = Math.min(1, Math.max(0, (12 - (me.z - OB.z0)) / 9));
    paintWall.material.color.setScalar(.87 * adapt * (.95 + .05 * near));
    bounce.intensity = (inside ? 14 : 6) * adapt * (.85 + .15 * near);
    // 디딤단 너머를 눌러도 발자국은 단 앞에서 멈추고 그림 쪽을 바라본다
    if (walkTo && walkTo.x > OB.x0 && walkTo.x < OB.x1 && walkTo.z < OB_STOP && walkTo.z > OB.z0 - 1) { walkTo.z = OB_STOP; walkTo.faceTo = 0; }
  });
  stampMark('obong', 0, -19.9);
  doorSign('중정 · 출구 라운지 →', 'COURTYARD · EXIT', 0, 7.0, OB.z1 - .16, 0, -1, 3.4);
  // 입구 왼쪽 벽 소개글: 홈페이지 IP 페이지 글 그대로. 벽에는 영문·제목·첫 문단만, 둘째 문단은 누르면 뜨는 창에
  const P1 = '일월오봉단은 조선 왕실과 깊이 연결된 전통 회화인 일월오봉도에서 영감을 받은 신해달 작가의 오리지널 캐릭터 그룹이에요. 해와 달, 다섯 봉우리, 소나무와 물이 그 세계의 출발점이에요.';
  const P2 = '캐릭터와 이야기는 학·토끼·호랑이·사슴 등 한국의 전통적인 소재에서 출발했어요. 각자의 역할에는 신해달 작가가 존중하고 동경하는 직업과 삶의 방식을 담았어요.';
  const IW = 2.7, IH = 2.2;
  const intro = letters(IW, IH, (g, W, H) => {
    const cm = c => H * c / 100 / IH;
    font(g, cm(7), 700, FONT_M, '#b08a4a'); g.fillText('IRWOROBONGDAN', 0, cm(8));
    font(g, cm(31), 400, FONT_K, '#f4f1ea'); g.fillText('혼자가 아니에요.', 0, cm(46));
    font(g, cm(15), 400, FONT_B, '#ddd6cc'); textBlock(g, wrapText(g, P1, W), 0, cm(84), cm(24));
  });
  place(intro, OB.x0 + .16, 1.75, -12.9, 1, 0);
  pickable(intro, { kind: 'IRWOROBONGDAN', title: '혼자가 아니에요.', body: P1 + '\n\n' + P2, img: 'ip/friends.webp', links: [[SITE + '/ip/#friends', '홈페이지에서 보기']], focus: focusFrom(OB.x0 + .16, 1.75, -12.9, 1, 0, 3.4) });
}
