  // 함께 쓰는 낮은 디딤단 하나(높이 15 cm, 검은 옻칠). 두 단 단상과 차단봉 줄은 없다. 그림과의 거리는 디딤단이 지킨다
  const SH = .15, stepZ0 = OB.z0 + .45, stepZ1 = OB.z0 + 2.15;
  boxMM(-5.4, 5.4, 0, SH, stepZ0, stepZ1, M.lacquer);
  boxMM(-5.4, 5.4, SH - .012, SH + .004, stepZ1 - .03, stepZ1 + .004, M.brass);   // 앞 모서리 놋쇠 띠
  solid(OB.x0, OB.x1, OB.z0, OB_STOP - .35);
  // 그림 빛은 디딤단 윗면까지만 닿고 모서리에서 멎는다
  const pool = panel(10.8, stepZ1 - stepZ0, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,226,180,.16)'); gr.addColorStop(1, 'rgba(255,226,180,.07)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }, { transparent: true, ppm: 30 });
  pool.material.depthWrite = false; pool.rotation.x = -Math.PI / 2; pool.position.set(0, SH + .003, (stepZ0 + stepZ1) / 2); scene.add(pool);
  // 다섯은 같은 높이 곧은 한 줄, 각자 그림 속 자기 상징 아래(가운데에서 ±1.7 m, ±3.4 m)
  const T0 = 2.2, charZ = OB.z0 + 1.15, SYM = { SUN: '해', MOON: '달', MOUNTAIN: '산', PINE: '소나무', SEA: '바다' };
  const xs = { deer: -3.4, rabbit: -1.7, tiger: 0, crane: 1.7, otter: 3.4 };
  for (const f of FRIENDS) {
    const x = xs[f.c], h = T0 * f.s * f.k;
    const fig = cutout(`img/${f.c}-cutout.webp`, h); place(fig, x, SH - T0 * f.s * f.g, charZ, 0, 1);
    // 크고 부드러운 빛이라 그림 위에 짧고 흐린 그림자
    const sh = panel(1.6, h * .7, (g, W, H) => { g.clearRect(0, 0, W, H); g.save(); g.scale(1, H / W); const gr = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); gr.addColorStop(0, 'rgba(0,0,0,.32)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); g.restore(); }, { transparent: true, ppm: 60 });
    sh.material.depthWrite = false; sh.position.set(x, SH + h * .3, OB.z0 + .19); scene.add(sh);
    // 명판: 발 앞 디딤단 윗면에 놋쇠 글자로 눕혀서. 작게 영문 / 크게 역할과 이름 / 작게 상징
    const PW_ = 1.6, PH_ = .5;
    const plaque = letters(PW_, PH_, (g, W, H) => {
      g.textAlign = 'center';
      font(g, H * .15, 700, FONT_M, '#c9a86a'); g.fillText(f.en, W / 2, H * .2);
      font(g, H * .3, 700, FONT_B, '#d8b878'); g.fillText(`${f.role} ${f.name}`, W / 2, H * .6, W * .98);
      font(g, H * .17, 500, FONT_B, '#c9a86a'); g.fillText(SYM[f.en] || '', W / 2, H * .9);
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
  const bounce = new THREE.PointLight(0xffd9a8, 0, 16, 1.6); bounce.position.set(0, 4.5, OB.z0 + 2.5); scene.add(bounce);
  // 들어서면 눈이 적응하듯 몇 초에 걸쳐 밝아지고, 다가갈수록 방이 조금 더 깨어난다(움직임 줄이기면 바로 다 밝게)
  let adapt = 1, wasIn = false;
  animators.push((t, dt, me) => {
    const inside = me.x > OB.x0 && me.x < OB.x1 && me.z > OB.z0 && me.z < OB.z1;
    if (inside && !wasIn && !reduceMotion) adapt = .55;
    wasIn = inside;
    adapt += (1 - adapt) * Math.min(1, dt * .7);
    const near = Math.min(1, Math.max(0, (12 - (me.z - OB.z0)) / 9));
    paintWall.material.color.setScalar(.87 * adapt * (.95 + .05 * near));
    bounce.intensity = (inside ? 5 : 2.5) * adapt * (.85 + .15 * near);
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
