  // 문 위 현판: 판과 테두리 없이 문틀 위 벽에 얇은 낱글자. 한글 이름 + 아래 작은 영문 한 줄.
  // 관람 순서상 다음에 갈 문의 현판만 은은하게 밝아진다(작품관 → IP 체험관 → 일월오봉단관 → 해달 라운지)
  const HY_INK = '#8a6a3a', HY_LIT = '#ffe6b0';
  const hyeon = (key, ko, en, x, z, nx, nz, w = 2.6) => {
    const draw = (color, glow) => (g, W, H) => {
      g.textAlign = 'center';
      if (glow) { g.shadowColor = 'rgba(255,214,150,.9)'; g.shadowBlur = H * .25; }
      font(g, H * .5, 300, FONT_D, color); g.fillText(ko, W / 2, H * .56);
      font(g, H * .17, 400, FONT_M, color); g.fillText(en, W / 2, H * .9);
    };
    const ink = letters(w, .3, draw(HY_INK, false), 600); place(ink, x, 3.245, z, nx, nz);
    const lit = letters(w, .3, draw(HY_LIT, true), 600); place(lit, x + nx * .004, 3.245, z + nz * .004, nx, nz);
    lit.material.opacity = 0; lit.material.blending = THREE.AdditiveBlending;
    // 글자 뒤 벽에 번지는 옅은 빛
    const halo = panel(w * 1.25, .7, (g, W, H) => { g.clearRect(0, 0, W, H); const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,226,170,.55)'); gr.addColorStop(1, 'rgba(255,226,170,0)'); g.fillStyle = gr; g.save(); g.scale(1, H / W); g.fillRect(0, 0, W, W); g.restore(); }, { transparent: true, ppm: 120 });
    halo.material.depthWrite = false; halo.material.opacity = 0; halo.material.blending = THREE.AdditiveBlending; place(halo, x + nx * .002, 3.2, z + nz * .002, nx, nz);
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
    const px = 1.35, pz = 6.4;
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

  // 곡선 화단의 소나무와 배롱나무, 하늘이 비치는 검은 돌 수반
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
  {
    // 배롱나무: 매끈하고 밝은 여러 갈래 줄기, 둥근 수관에 분홍 꽃
    const [x, z] = [4.7, -1.9]; planter(x, z, 1.35, 1.15);
    const bark = std({ color: 0xb8a48f, roughness: .55 }), leaf = std({ color: 0x5c6b3a, roughness: .9, flatShading: true }), bloom = std({ color: 0xd9739a, roughness: .8, flatShading: true });
    for (const [dx, dz] of [[-.25, .1], [.2, -.15], [.05, .3]]) {
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x, .3, z), new THREE.Vector3(x + dx * .6, 1.4, z + dz * .6), new THREE.Vector3(x + dx * 1.6, 2.4, z + dz * 1.6)]);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, .06, 6), bark));
    }
    const r = rng(23);
    for (let i = 0; i < 9; i++) {
      const a = r() * 6.28, d = r() * .8, sw = .5 + r() * .35;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), i % 3 === 0 ? leaf : bloom); m.scale.set(sw, sw * .7, sw); m.position.set(x + Math.cos(a) * d, 2.5 + r() * .7, z + Math.sin(a) * d); scene.add(m);
    }
  }
  {
    // 검은 돌 수반: 낮고 넓은 원형, 물낯이 하늘을 비춘다
    const [x, z] = [-4.6, 3.4];
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.0, .92, .42, 48), M.blackStone); bowl.position.set(x, .21, z); scene.add(bowl);
    const water = new THREE.Mesh(new THREE.CircleGeometry(.9, 48), new THREE.MeshPhysicalMaterial({ color: 0x0a0c10, roughness: .02, metalness: .1, clearcoat: 1, envMapIntensity: 2.2 }));
    water.rotation.x = -Math.PI / 2; water.position.set(x, .405, z); scene.add(water);
    solid(x - .95, x + .95, z - .95, z + .95);
  }
  // 쉬는 자리: 나무 아래 등받이 없는 나무 벤치 둘과 툇마루 가장자리. 다가가면 '앉아서 쉬기'
  const bench = (x, z, rotY) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, .08, .45), M.wood); top.position.y = .42; g.add(top);
    for (const sx of [-.7, .7]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.08, .38, .38), M.steel); leg.position.set(sx, .19, 0); g.add(leg); }
  };
  bench(-4.5, .55, 0); bench(5.0, -.05, 0);
  SEATS.push({ x: -4.5, z: .55, yaw: 0, label: '벤치에 앉아 쉬기' }, { x: 5.0, z: -.05, yaw: 0, label: '벤치에 앉아 쉬기' },
    { x: -8.6, z: 2.4, yaw: -Math.PI / 2, label: '툇마루에 앉아 쉬기' }, { x: 8.6, z: 2.4, yaw: Math.PI / 2, label: '툇마루에 앉아 쉬기' },
    { x: -5.5, z: -7.6, yaw: Math.PI, label: '툇마루에 앉아 쉬기' }, { x: 5.5, z: -7.6, yaw: Math.PI, label: '툇마루에 앉아 쉬기' });
