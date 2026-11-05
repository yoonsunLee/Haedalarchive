paws_js = r"""
/* ───────── 나: 해달을 보러 온 선한백호의 발자국 ───────── */
// 걸으면 발자국이 찍히고, 두세 걸음 뒤부터 흐려지며 사라진다
avatar.visible = false;
// 얼빵해달을 보러 온 선한백호의 발바닥 무늬: 검은 큰 발바닥과 발가락 넷만
const pawTex = canvasTex(256, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h * .53, R = w * .4;
  g.fillStyle = '#111';
  // 큰 발바닥: 아래가 세 갈래로 둥근 모양
  g.beginPath(); g.moveTo(cx - w * .15, cy + h * .02);
  g.bezierCurveTo(cx - w * .16, cy - h * .12, cx + w * .16, cy - h * .12, cx + w * .15, cy + h * .02);
  g.bezierCurveTo(cx + w * .2, cy + h * .14, cx + w * .1, cy + h * .22, cx + w * .05, cy + h * .17);
  g.bezierCurveTo(cx + w * .02, cy + h * .21, cx - w * .02, cy + h * .21, cx - w * .05, cy + h * .17);
  g.bezierCurveTo(cx - w * .1, cy + h * .22, cx - w * .2, cy + h * .14, cx - w * .15, cy + h * .02); g.fill();
  for (const [x, y, r] of [[-.2, -.08, .062], [-.08, -.2, .068], [.08, -.2, .068], [.2, -.08, .062]]) { g.beginPath(); g.ellipse(cx + w * x, cy + h * y, w * r, h * r * 1.15, x * 1.2, 0, 7); g.fill(); }
});
pawTex.wrapS = pawTex.wrapT = THREE.ClampToEdgeWrapping;
const pawGeo = new THREE.PlaneGeometry(.34, .34);
const paws = [];   // 새것이 앞
const downRay = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0);
const groundY = (x, z) => { downRay.set(new THREE.Vector3(x, 3, z), DOWN); const h = downRay.intersectObjects(floors, false)[0]; return h ? h.point.y : 0; };
let strideLeft = 0, pawSide = 1;
const PAW_ALPHA = [1, .7, .38, .12];
function dropPaw() {
  const m = new THREE.Mesh(pawGeo, new THREE.MeshBasicMaterial({ map: pawTex, transparent: true, depthWrite: false, toneMapped: false }));
  const side = pawSide = -pawSide, sx = Math.cos(me.face) * .1 * side, sz = -Math.sin(me.face) * .1 * side;
  const x = me.x + sx, z = me.z + sz;
  m.rotation.x = -Math.PI / 2; m.rotation.z = me.face; m.position.set(x, groundY(x, z) + .012, z); m.renderOrder = 3;
  scene.add(m); paws.unshift({ m, born: performance.now() });
  while (paws.length > PAW_ALPHA.length) { const p = paws.pop(); scene.remove(p.m); p.m.material.dispose(); }
}
// 바닥을 누른 자리 표시: 동그라미가 퍼졌다 줄며 도착하면 사라진다
const markTex = canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.beginPath(); g.arc(w / 2, h / 2, w * .4, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w / 2, h / 2, w * .08, 0, 7); g.fill(); });
markTex.wrapS = markTex.wrapT = THREE.ClampToEdgeWrapping;
const marker = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), new THREE.MeshBasicMaterial({ map: markTex, transparent: true, depthWrite: false, toneMapped: false }));
marker.rotation.x = -Math.PI / 2; marker.visible = false; marker.renderOrder = 4; scene.add(marker);
let markT = 0;
function showMarker(x, y, z) { marker.position.set(x, y + .015, z); marker.visible = true; markT = 0; }
function stepPaws(dt, moving, speed) {
  if (moving) { strideLeft -= speed; if (strideLeft <= 0) { dropPaw(); strideLeft = .42; } } else strideLeft = Math.min(strideLeft, .05);
  const now = performance.now();
  paws.forEach((p, i) => { const still = moving ? 1 : Math.max(0, 1 - (now - p.born - 1500) / 1500); p.m.material.opacity = PAW_ALPHA[i] * Math.min(1, still + (i === 0 && !moving ? .6 : 0)); });
  if (marker.visible) {
    markT += dt; const s = markT < .25 ? .6 + markT * 1.6 : 1 + Math.sin(markT * 5) * .06;
    marker.scale.setScalar(s);
    if (walkTo) marker.material.opacity = .9;
    else { marker.material.opacity = Math.max(0, marker.material.opacity - dt * 3); if (marker.material.opacity <= 0) marker.visible = false; }
  }
}
"""
marker_ = "/* ───────── 걷기 ───────── */"
assert marker_ in s
s = s.replace(marker_, paws_js + "\n" + marker_, 1)
for a, b in [
  ("if (floors.includes(h.object)) { walkTo = { x: h.point.x, z: h.point.z, stuck: 0 }; focus = null; hideHint(); }",
   "if (floors.includes(h.object)) { walkTo = { x: h.point.x, z: h.point.z, stuck: 0 }; focus = null; hideHint(); showMarker(h.point.x, h.point.y, h.point.z); }"),
  ("  renderFrame();\n  requestAnimationFrame(frame);", "  stepPaws(dt, moving, (keys.has('shift') ? 4.6 : 2.6) * dt);\n  renderFrame();\n  requestAnimationFrame(frame);"),
  ("const view = { yaw: 0, pitch: -.16, dist: 4.6 };", "const view = { yaw: 0, pitch: -.12, dist: 3.4 };"),
]:
    assert a in s, a[:60]; s = s.replace(a, b)
