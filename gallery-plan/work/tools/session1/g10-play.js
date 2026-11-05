
/* ───────── 나: 솜털 얼빵해달 (털 인형 네 방향, 3인칭) ───────── */
const AV_H = 1.35;
const avTex = { front: tex('img/pl-front.webp'), three: tex('img/pl-three.webp'), side: tex('img/pl-side.webp'), back: tex('img/pl-back.webp') };
const avAspect = { front: 450 / 580, three: 437 / 583, side: 408 / 581, back: 448 / 585 };
const avMat = new THREE.MeshBasicMaterial({ map: avTex.back, alphaTest: .45, side: THREE.DoubleSide, toneMapped: false });
const avatar = new THREE.Group(); scene.add(avatar);
const avBody = new THREE.Group(); avatar.add(avBody);
const avMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), avMat); avMesh.position.y = AV_H / 2; avBody.add(avMesh);
{
  const sh = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .7), new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .06; avatar.add(shadow);
}
const me = { x: 0, z: 31, face: 0, moving: 0, walkT: 0 };
let avView = '';
// 그림은 모두 오른쪽을 본다. 왼쪽을 볼 때는 뒤집는다
function setAvView(v, flip) { const key = v + (flip ? '-' : ''); if (key === avView) return; avView = key; avMat.map = avTex[v]; avMat.needsUpdate = true; avMesh.scale.set(AV_H * avAspect[v] * (flip ? -1 : 1), AV_H, 1); }
setAvView('back');

/* ───────── 걷기 ───────── */
const RAD = .32, BOUND = { x0: -22.5, x1: 22.5, z0: -27, z1: 35 };
function blocked(x, z) {
  if (x < BOUND.x0 || x > BOUND.x1 || z < BOUND.z0 || z > BOUND.z1) return true;
  for (const c of colliders) if (x > c[0] - RAD && x < c[1] + RAD && z > c[2] - RAD && z < c[3] + RAD) return true;
  return false;
}
function tryMove(dx, dz) { let moved = false; if (!blocked(me.x + dx, me.z)) { me.x += dx; moved = true; } if (!blocked(me.x, me.z + dz)) { me.z += dz; moved = true; } return moved; }

const view = { yaw: 0, pitch: -.2, dist: 3.6 };
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const PLACES = {
  outside: { pos: [0, 31], yaw: 0 }, lobby: { pos: [0, 17.2], yaw: 0 }, artist: { pos: [-12.8, 14.2], yaw: Math.PI / 2 }, works: { pos: [-15.7, 6.8], yaw: 0 },
  court: { pos: [0, 6.6], yaw: 0 }, ip: { pos: [11.4, -4.5], yaw: -Math.PI / 2 }, obong: { pos: [0, -13.5], yaw: 0 }, lounge: { pos: [12.6, 13.8], yaw: -Math.PI / 2 },
};
let walkTo = null, focus = null;   // focus: 작품을 보는 동안 카메라가 따로 선다
const fadeEl = document.getElementById('fade');
function jump(pos, yaw, then) {
  walkTo = null; focus = null;
  if (reduceMotion) { me.x = pos[0]; me.z = pos[1]; me.face = view.yaw = yaw; then && then(); return; }
  fadeEl.classList.add('on');
  setTimeout(() => { me.x = pos[0]; me.z = pos[1]; me.face = yaw; view.yaw = yaw; view.pitch = -.1; snapCam = true; then && then(); fadeEl.classList.remove('on'); }, 240);
}
function goFocus(f) {
  // 작품 앞으로 가서 옆으로 비켜 서고, 카메라는 작품을 정면으로 본다
  const [px, pz] = f.pos, [lx, ly, lz] = f.look, dx = lx - px, dz = lz - pz, d = Math.hypot(dx, dz) || 1;
  const side = [dz / d, -dx / d];
  const standX = px + side[0] * .75 + dx / d * .35, standZ = pz + side[1] * .75 + dz / d * .35;
  const camPos = new THREE.Vector3(px - dx / d * .6, Math.max(1.5, ly + .1), pz - dz / d * .6);
  const far = Math.hypot(me.x - standX, me.z - standZ) > 9;
  const start = () => { walkTo = { x: standX, z: standZ, stuck: 0, faceTo: Math.atan2(-dx, -dz) }; focus = { pos: camPos, look: new THREE.Vector3(lx, ly, lz) }; };
  if (far) jump([standX, standZ], Math.atan2(-dx, -dz), start); else start();
}

const keys = new Set();
addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeCard(); closeList(); return; }
  if (e.target.closest && e.target.closest('input,textarea')) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'q', 'e'].includes(k)) {
    if (!document.getElementById('intro').classList.contains('gone')) return;
    keys.add(k); walkTo = null; focus = null; hideHint();
    if (k.startsWith('arrow')) e.preventDefault();
  }
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const pad = document.getElementById('pad'), knob = pad.querySelector('i');
const padVec = { x: 0, y: 0 }; let padId = null;
function padMove(e) {
  const r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), max = r.width / 2 - 10;
  if (m > max) { dx *= max / m; dy *= max / m; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`; padVec.x = dx / max; padVec.y = dy / max;
}
pad.addEventListener('pointerdown', e => { padId = e.pointerId; pad.setPointerCapture(e.pointerId); padMove(e); walkTo = null; focus = null; hideHint(); });
pad.addEventListener('pointermove', e => { if (e.pointerId === padId) padMove(e); });
const padEnd = e => { if (e.pointerId !== padId) return; padId = null; padVec.x = padVec.y = 0; knob.style.transform = ''; };
pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);

/* ───────── 둘러보기와 누르기 ───────── */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const tip = document.getElementById('tip');
let drag = null;
function hitAt(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects([...pickables, ...floors, ...blockers], false);
  return hits[0] || null;
}
canvas.addEventListener('pointerdown', e => { if (drag) return; drag = { id: e.pointerId, lx: e.clientX, ly: e.clientY, moved: 0, t: performance.now() }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (drag && e.pointerId === drag.id) {
    const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 4) {
      canvas.classList.add('dragging'); focus = null;
      const k = coarse ? .0055 : .0042;
      view.yaw += dx * k; view.pitch = Math.max(-1.0, Math.min(1.05, view.pitch + dy * k));
      tip.hidden = true; hideHint();
    }
    return;
  }
  if (e.pointerType !== 'mouse') return;
  const h = hitAt(e.clientX, e.clientY), info = h && h.object.userData.info;
  canvas.classList.toggle('pointing', !!info || (h && floors.includes(h.object)));
  if (info) { tip.hidden = false; tip.textContent = info.title; tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; } else tip.hidden = true;
});
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const wasClick = drag.moved < 8 && performance.now() - drag.t < 500;
  drag = null; canvas.classList.remove('dragging');
  if (!wasClick || e.type === 'pointercancel') return;
  const h = hitAt(e.clientX, e.clientY); if (!h) return;
  const info = h.object.userData.info;
  if (info) { openCard(info); return; }
  if (floors.includes(h.object)) { walkTo = { x: h.point.x, z: h.point.z, stuck: 0 }; focus = null; hideHint(); }
}
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', () => { tip.hidden = true; });

/* ───────── 자세히 보기: 오른쪽 카드 ───────── */
const $ = id => document.getElementById(id);
const card = $('card'); let cardOpen = false;
function openCard(info, skipGo) {
  $('cardKicker').textContent = info.kind || '';
  $('cardTitle').textContent = info.title;
  $('cardMeta').textContent = info.meta || ''; $('cardMeta').hidden = !info.meta;
  $('cardBody').textContent = info.body || ''; $('cardBody').hidden = !info.body;
  $('cardFig').hidden = !info.img; if (info.img) { $('cardImg').src = info.img; $('cardImg').alt = info.title; }
  $('cardEx').hidden = !(info.ex && info.ex.length); $('cardExTitle').textContent = info.exTitle || '전시 이력';
  $('cardExList').replaceChildren(...(info.ex || []).map(x => Object.assign(document.createElement('li'), { textContent: x })));
  const links = $('cardLinks'); links.textContent = '';
  for (const [href, label, ghost] of info.links || []) { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = label + ' ↗'; if (ghost) a.className = 'ghost'; links.append(a); }
  card.scrollTop = 0; card.classList.remove('closed'); cardOpen = true; tip.hidden = true;
  if (info.focus && !skipGo) goFocus(info.focus);
  if (info.id && WORK_IDS.has(info.id)) { seenWorks.add(info.id); }
}
function closeCard() { if (!cardOpen) return; card.classList.add('closed'); cardOpen = false; focus = null; }
$('cardClose').addEventListener('click', closeCard);
const WORK_IDS = new Set(workPlaced.map(p => p.w.id)), seenWorks = new Set();

// 작품 목록
const list = $('list'), grid = $('grid');
for (const { w, info } of workPlaced) {
  const b = document.createElement('button');
  b.innerHTML = `<img alt="" loading="lazy"><span class="where"></span><b></b><small></small>`;
  b.querySelector('img').src = workImg(w); b.querySelector('.where').textContent = '작품 전시관 · ' + info.where;
  b.querySelector('b').textContent = w.title; b.querySelector('small').textContent = `${w.year} · ${w.size} cm`;
  b.addEventListener('click', () => { closeList(); openCard(info); });
  grid.append(b);
}
function openList() { list.hidden = false; $('listClose').focus(); }
function closeList() { list.hidden = true; }
$('openList').addEventListener('click', openList); $('listClose').addEventListener('click', closeList);
list.addEventListener('click', e => { if (e.target === list) closeList(); });

// 위쪽 이동 단추
const navBtns = [...document.querySelectorAll('[data-go]')];
navBtns.forEach(b => b.addEventListener('click', () => { closeCard(); const p = PLACES[b.dataset.go]; jump(p.pos, p.yaw); hideHint(); }));
function zoneOf(x, z) {
  const inR = (R) => x > R.x0 && x < R.x1 && z > R.z0 && z < R.z1;
  for (const k of ['obong', 'works', 'ip', 'artist', 'lobby', 'lounge']) if (inR(ROOMS[k])) return k;
  if (Math.abs(x) < 10.4 && Math.abs(z) < 9.4) return 'court';
  return 'outside';
}

/* ───────── 조개 도장과 멤버십 카드 ───────── */
const shellsEl = $('shells'), myCardBtn = $('myCard');
const stamps = new Set(store.get('stamps', []).filter(k => STAMPS.some(s => s[0] === k)));
const shellImgs = STAMPS.map(([k, label]) => { const im = document.createElement('img'); im.src = 'img/shell-stamp.webp'; im.alt = `${label} 도장`; im.title = label; im.classList.toggle('got', stamps.has(k)); shellsEl.insertBefore(im, myCardBtn); return im; });
const toast = $('toast'); let toastTimer = 0;
function showToast(t, s) { $('toastT').textContent = t; $('toastS').textContent = s; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200); }
function award(k) {
  if (stamps.has(k)) return;
  stamps.add(k); store.set('stamps', [...stamps]);
  const i = STAMPS.findIndex(s => s[0] === k), im = shellImgs[i];
  im.classList.add('got', 'pop'); setTimeout(() => im.classList.remove('pop'), 600);
  const left = STAMPS.filter(s => !stamps.has(s[0])).map(s => s[1]);
  showToast(`조개 도장 ${stamps.size}/5 · ${STAMPS[i][1]}`, left.length ? `남은 곳: ${left.join(', ')}` : '다 모았어요! 출구 라운지 회원 발급 창구로 가 보세요.');
}
let member = store.get('member', null);
myCardBtn.hidden = !member;
const modal = $('memberModal'), flip = $('flip');
function renderCard() {
  $('cardName').textContent = member.name; $('cardNo').textContent = 'No.' + String(member.no).padStart(4, '0'); $('cardDate').textContent = member.date;
  $('cardStamps').replaceChildren(...STAMPS.map(([k, label], i) => { const s = document.createElement('span'); const im = document.createElement('img'); im.src = 'img/shell-stamp.webp'; im.alt = label; im.style.setProperty('--r', `${[-8, 5, -3, 7, -6][i]}deg`); s.append(im); return s; }));
}
function openMember(issueNow) {
  modal.hidden = false;
  if (member) {
    $('mmTitle').textContent = '현대사회스포츠센터 멤버십 카드'; $('mmLead').textContent = '사랑, 응원 그리고 위로를 담아 드려요. 카드를 누르면 뒤집혀요.';
    $('issueForm').hidden = true; flip.hidden = false; $('mmFlip').hidden = false; renderCard();
    if (issueNow) setTimeout(() => flip.classList.add('back'), 900);
  } else {
    $('mmTitle').textContent = '현대사회스포츠센터 회원이 되었어요'; $('mmLead').textContent = '다섯 곳을 모두 둘러본 해달에게 드리는 멤버십 카드예요. 카드에 새길 이름을 적어 주세요.';
    $('issueForm').hidden = false; flip.hidden = true; $('mmFlip').hidden = true; setTimeout(() => $('nick').focus(), 50);
  }
}
$('nick').setAttribute('aria-label', '카드에 새길 이름');
$('issueForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('nick').value.trim() || 'SEA OTTER';
  const d = TODAY.replace(/-/g, '.');
  member = { name, no: 1 + Math.floor(Math.random() * 9999), date: d }; store.set('member', member);
  myCardBtn.hidden = false; flip.classList.remove('back'); openMember(true);
});
flip.addEventListener('click', () => flip.classList.toggle('back'));
$('mmFlip').addEventListener('click', () => flip.classList.toggle('back'));
$('mmClose').addEventListener('click', () => { modal.hidden = true; });
myCardBtn.addEventListener('click', () => openMember(false));
let deskShown = false;
function checkStamps() {
  // 바닥 조개 표시를 밟으면 도장
  for (const [k, m] of Object.entries(stampMarks)) if (Math.hypot(me.x - m.x, me.z - m.z) < .75) award(k);
  const atDesk = zoneOf(me.x, me.z) === 'lounge' && Math.hypot(me.x - deskSpot.x, me.z - deskSpot.z) < 2.6;
  if (atDesk && !deskShown) {
    deskShown = true;
    if (stamps.size === STAMPS.length && !member) openMember(false);
    else if (!member) showToast(`조개 도장 ${stamps.size}/5`, '남은 곳: ' + STAMPS.filter(s => !stamps.has(s[0])).map(s => s[1]).join(', '));
    else showToast('반가워요, ' + member.name, '위쪽 「내 카드」에서 멤버십 카드를 다시 볼 수 있어요.');
  }
  if (!atDesk) deskShown = false;
}

// 중정 등신대 앞: 기념 사진
const act = $('act'); let actFn = null;
function setAct(label, fn) { if (label) { act.textContent = label; act.hidden = false; actFn = fn; } else { act.hidden = true; actFn = null; } }
act.addEventListener('click', () => actFn && actFn());
function takePhoto() {
  photoCam = true; renderFrame();
  const url = canvas.toDataURL('image/jpeg', .92); photoCam = false;
  $('photoImg').src = url; $('photoModal').hidden = false;
}
$('photoClose').addEventListener('click', () => { $('photoModal').hidden = true; });

// 안내 문구
const hint = $('hint'); let hintHidden = false;
function hideHint() { if (hintHidden) return; hintHidden = true; setTimeout(() => hint.classList.add('gone'), 2500); }
if (coarse) hint.textContent = '한 손가락으로 끌어 둘러보기 · 왼쪽 패드로 걷기 · 바닥을 누르면 그곳으로';
$('introKeys').innerHTML = coarse
  ? '<li>끌어서 둘러보기</li><li>왼쪽 아래 패드로 걷기</li><li>바닥을 누르면 그곳까지 걸어가기</li><li>작품을 누르면 자세히</li>'
  : '<li>마우스로 끌어 둘러보기</li><li>WASD · 방향키로 걷기, Shift로 빠르게</li><li>바닥을 누르면 그곳까지 걸어가기</li><li>작품을 누르면 자세히</li>';
const intro = $('intro');
$('enter').disabled = false;
$('enter').addEventListener('click', () => { intro.classList.add('gone'); playVideo(); walkTo = { x: 0, z: 22.5, stuck: 0 }; });

/* ───────── 매 장면 ───────── */
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
const clock = new THREE.Clock();
let lastZone = '', snapCam = true, photoCam = false;
const camTarget = new THREE.Vector3(), camWant = new THREE.Vector3(), camLook = new THREE.Vector3(), tmpV = new THREE.Vector3();
const camRay = new THREE.Raycaster(), tmpO = new THREE.Vector3();
function placeCamera(dt) {
  if (photoCam) {   // 등신대와 내 해달을 함께 담는 자리
    const mx = (me.x + standeeSpot.x) / 2, mz = (me.z + standeeSpot.z) / 2;
    camera.position.set(mx - 1.2, 1.5, mz + 4.2); camera.lookAt(mx, .95, mz); return;
  }
  if (focus) {
    camWant.copy(focus.pos); camLook.lerp(focus.look, Math.min(1, dt * 4));
    camera.position.lerp(camWant, Math.min(1, dt * 3)); camera.lookAt(camLook); return;
  }
  camTarget.set(me.x, 1.15, me.z);
  const cp = Math.cos(view.pitch), dir = tmpV.set(-Math.sin(view.yaw) * cp, Math.sin(view.pitch), -Math.cos(view.yaw) * cp);
  // 카메라가 벽을 넘지 않게: 가운데와 둘레 네 방향으로 벽을 살펴 가장 가까운 벽 앞에서 멈춘다
  let dist = view.dist;
  const back = dir.clone().negate(), side = new THREE.Vector3(Math.cos(view.yaw), 0, -Math.sin(view.yaw)), up = new THREE.Vector3(0, 1, 0);
  for (const [sx, sy] of [[0, 0], [.35, 0], [-.35, 0], [0, .3], [0, -.3]]) {
    camRay.set(tmpO.copy(camTarget).addScaledVector(side, sx).addScaledVector(up, sy), back); camRay.far = view.dist + .5;
    const hit = camRay.intersectObjects(blockers, false)[0];
    if (hit) dist = Math.min(dist, hit.distance - .45);
  }
  dist = Math.max(.35, dist);
  camWant.copy(camTarget).addScaledVector(dir, -dist); camWant.y = Math.max(.35, camWant.y);
  // 벽 쪽으로 당겨질 때는 곧바로, 멀어질 때만 부드럽게 따라간다
  const curD = camera.position.distanceTo(camTarget);
  if (snapCam || dist < curD - .02) { camera.position.copy(camWant); snapCam = false; } else camera.position.lerp(camWant, Math.min(1, dt * 10));
  camLook.copy(camTarget).addScaledVector(dir, 2);
  camera.lookAt(camLook);
}
function renderFrame() {
  // 내 해달은 늘 카메라를 본다(종이인형). 보이는 면은 해달이 향한 쪽과 카메라 방향으로 고른다
  avatar.position.set(me.x, 0, me.z);
  const camYaw = Math.atan2(camera.position.x - me.x, camera.position.z - me.z);
  avBody.rotation.y = camYaw;
  const rel = wrapA(me.face - (camYaw + Math.PI));
  const ar = Math.abs(rel); setAvView(ar < .42 ? 'front' : ar < 1.15 ? 'three' : ar < 2.3 ? 'side' : 'back', rel < 0);
  renderer.render(scene, camera);
}
function frame() {
  const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime;
  let f = 0, s = 0, turn = 0;
  if (keys.has('w') || keys.has('arrowup')) f += 1;
  if (keys.has('s') || keys.has('arrowdown')) f -= 1;
  if (keys.has('a')) s -= 1;
  if (keys.has('d')) s += 1;
  if (keys.has('arrowleft') || keys.has('q')) turn += 1;
  if (keys.has('arrowright') || keys.has('e')) turn -= 1;
  f -= padVec.y; s += padVec.x;
  view.yaw += turn * 1.8 * dt;
  const speed = (keys.has('shift') ? 4.6 : 2.6) * dt;
  let moving = false;
  if (f || s) {
    const m = Math.max(1, Math.hypot(f, s)); f /= m; s /= m;
    const sy = Math.sin(view.yaw), cy = Math.cos(view.yaw), dx = (-sy * f + cy * s), dz = (-cy * f - sy * s);
    tryMove(dx * speed, dz * speed); me.face = Math.atan2(-dx, -dz); moving = true;
  } else if (walkTo) {
    const dx = walkTo.x - me.x, dz = walkTo.z - me.z, d = Math.hypot(dx, dz);
    if (d < .1) { if (walkTo.faceTo != null) me.face = walkTo.faceTo; walkTo = null; }
    else {
      const st = Math.min(d, speed * 1.1); me.face = Math.atan2(-dx, -dz); moving = true;
      if (!focus) { const dy = wrapA(me.face - view.yaw); if (d > 1.2) view.yaw += dy * Math.min(1, dt * 1.6); }
      if (!tryMove(dx / d * st, dz / d * st)) { if (++walkTo.stuck > 8) walkTo = null; }
    }
  }
  // 걸음: 통통 튀고 살짝 눌렸다 펴진다
  me.moving += ((moving ? 1 : 0) - me.moving) * Math.min(1, dt * 8);
  if (moving) me.walkT += dt * (keys.has('shift') ? 13 : 9);
  const bob = reduceMotion ? 0 : Math.abs(Math.sin(me.walkT)) * .07 * me.moving;
  avBody.position.y = bob;
  avMesh.rotation.z = reduceMotion ? 0 : Math.sin(me.walkT) * .06 * me.moving;

  placeCamera(dt);
  stepPages(dt, me);
  for (const a of animators) a(time, dt, me);
  if (!reduceMotion && banner.mesh) {
    const pos = banner.mesh.geometry.attributes.position, b0 = banner.base;
    for (let i = 0; i < pos.count; i++) { const y = b0[i * 3 + 1], drop = (banner.h / 2 - y) / banner.h; pos.setZ(i, Math.sin(y * 1.6 + time * 1.4) * .05 * drop + Math.sin(time * .7) * .03 * drop); }
    pos.needsUpdate = true;
  }
  for (const [k, m] of Object.entries(stampMarks)) { const got = stamps.has(k); m.ring.visible = !got; m.ring.scale.setScalar(1 + Math.sin(time * 2.4) * .08); m.shell.userData.mesh.material.color.setScalar(got ? .55 : 1); }
  checkStamps();
  const z = zoneOf(me.x, me.z);
  if (z !== lastZone) { lastZone = z; navBtns.forEach(b => b.classList.toggle('on', b.dataset.go === z)); }
  const nearStandee = Math.hypot(me.x - standeeSpot.x, me.z - standeeSpot.z) < 2.4;
  if (nearStandee && !actFn) setAct('얼빵해달과 사진 찍기', takePhoto); else if (!nearStandee && actFn) setAct(null);
  renderFrame();
  requestAnimationFrame(frame);
}
me.face = view.yaw = 0;
requestAnimationFrame(frame);
</script>
