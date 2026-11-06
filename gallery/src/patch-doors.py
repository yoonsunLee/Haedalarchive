doors_js = r"""
/* ───────── 중정 쪽 간유리 자동문: 밖에서는 방 안이 보이지 않고, 다가가면 양쪽으로 열린다 ───────── */
{
  const frost = new THREE.MeshStandardMaterial({ color: 0xeef1ee, roughness: .4, metalness: 0, transparent: true, opacity: .72, depthWrite: false, side: THREE.DoubleSide });
  const autoDoors = [];
  // axis 'x': z = fixed 위의 문(가로), 'z': x = fixed 위의 문(세로). a0..a1 문 폭, h 문 높이
  function autoDoor(axis, fixed, a0, a1, h, mat = frost) {
    const half = (a1 - a0) / 2, mid = (a0 + a1) / 2, leaves = [];
    for (const s of [-1, 1]) {
      const leaf = new THREE.Group();
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(half, h), mat); pane.position.y = h / 2; leaf.add(pane);
      for (const [w, hh, x, y] of [[half, .05, 0, h - .025], [half, .05, 0, .025], [.05, h, -half / 2 + .025, h / 2], [.05, h, half / 2 - .025, h / 2]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, .05), M.brass); b.position.set(x, y, 0); leaf.add(b);
      }
      if (axis === 'z') leaf.rotation.y = Math.PI / 2;
      scene.add(leaf); if (mat.transparent) blockers.push(pane);
      leaves.push({ leaf, s });
    }
    const d = { axis, fixed, mid, half, leaves, open: 0 };
    autoDoors.push(d); return d;
  }
  autoDoor('x', -9.4, -3, 3, 3.1);            // ③ 일월오봉단관: 처마 밑까지만
  // ① 작품관(문턱⑤ 끝): 어두운 전실 쪽에서는 한낮을 등진 간유리가 빛나 보이게 조금 스스로 빛난다
  const frostGlow = frost.clone(); frostGlow.opacity = .9; frostGlow.emissive = new THREE.Color(0xfff4e2); frostGlow.emissiveIntensity = .6;
  autoDoor('z', -10.4, -8.9, -4.9, 3.1, frostGlow);
  animators.push((t, dt, me) => { const inside = me.x < -10.45; frostGlow.emissiveIntensity = inside ? .6 : 0; frostGlow.opacity = inside ? .9 : .72; });   // 중정 쪽에서는 다른 문과 똑같이
  autoDoor('z', 10.4, -6, -3, 3.1);           // ② IP관 들어가는 곳(다른 관과 같은 간유리 미닫이, 안은 그려지는 전실)
  autoDoor('z', 10.4, 4.2, 6.8, 3.1);         // ② IP관 나가는 곳
  autoDoor('x', 9.4, 7, 9.6, 3.0);            // 출구 라운지
  animators.push((t, dt, me) => {
    for (const d of autoDoors) {
      const cx = d.axis === 'x' ? d.mid : d.fixed, cz = d.axis === 'x' ? d.fixed : d.mid;
      const want = Math.hypot(me.x - cx, me.z - cz) < 3.2 ? 1 : 0;
      d.open += (want - d.open) * Math.min(1, dt * (reduceMotion ? 30 : 5));
      for (const { leaf, s } of d.leaves) {
        const off = s * (d.half / 2 + d.open * d.half * .92);
        if (d.axis === 'x') leaf.position.set(d.mid + off, 0, d.fixed + .2 * (d.fixed > 0 ? -1 : 1) * 0); else leaf.position.set(d.fixed, 0, d.mid + off);
      }
    }
  });
}
"""
marker = "/* ───────── 나: 솜털 얼빵해달"
assert marker in s
s = s.replace(marker, doors_js + "\n" + marker, 1)
