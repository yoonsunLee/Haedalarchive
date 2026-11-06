
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
const inInterior = (x, z) => INTERIORS.find(I => I.rects.some(r => x > r[0] && x < r[1] && z > r[2] && z < r[3]));
function blocked(x, z) {
  if ((x < BOUND.x0 || x > BOUND.x1 || z < BOUND.z0 || z > BOUND.z1) && !inInterior(x, z)) return true;
  for (const c of colliders) if (x > c[0] - RAD && x < c[1] + RAD && z > c[2] - RAD && z < c[3] + RAD) return true;
  return false;
}
function tryMove(dx, dz) { let moved = false; if (!blocked(me.x + dx, me.z)) { me.x += dx; moved = true; } if (!blocked(me.x, me.z + dz)) { me.z += dz; moved = true; } return moved; }

const view = { yaw: 0, pitch: -.2, dist: 3.6 };
const WALK_K = 2;   // 시험용으로 걸음 2배(작가님). 완성되면 1로 되돌린다
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const PLACES = {
  outside: { pos: [0, 31], yaw: 0 }, lobby: { pos: [0, 17.2], yaw: 0 }, artist: { pos: [-12.8, 14.2], yaw: Math.PI / 2 }, works: { pos: [DOORX, R1.z0 + 4.6], yaw: 0 },   // 법과 권리: 첫 작품 정면
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
      view.yaw += dx * k; view.pitch = Math.max(-.75, Math.min(.6, view.pitch + dy * k));
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
  if (info && info.act) { info.act(); return; }
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
  // 누르면 시선은 그대로 두고 창만 띄운다(작가님: 누른 것 정면으로 데려가지 않기)
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
// 섹션 바로 가기(공식 오픈 전까지 임시, 작가님 요청): 작품관·IP관 안에 있으면 메뉴 아래에 그 관의 섹션 단추가 뜬다
const SUBNAV = {
  works: [['법과 권리', PLACES.works.pos, 0], ['POV', [-29.2, -4.6], 0], ['우주조약', [-38.8, -20.8], 0], ['N차적 저작물', [-20.5, -19.6], 0]],
  ip: [['물빛 통로', PLACES.ip.pos, -Math.PI / 2], ['해변', [17, -4.5], -1.3], ['그늘길', [23, 5.8], Math.PI], ['숲길', [23.5, 14.5], Math.PI]],
};
const subNav = document.createElement('nav'); subNav.className = 'nav glass'; subNav.setAttribute('aria-label', '섹션 바로 가기');
subNav.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,0px) + 58px);z-index:20;font-size:12px;display:none';
document.body.appendChild(subNav);
let subKey = '';
function showSubNav(zone) {
  const k = SUBNAV[zone] ? zone : ''; if (k === subKey) return; subKey = k;
  subNav.innerHTML = ''; subNav.style.display = k ? 'flex' : 'none'; if (!k) return;
  const nb = document.querySelector('.bar .nav').getBoundingClientRect(); subNav.style.left = nb.left + 'px';
  for (const [label, pos, yaw] of SUBNAV[k]) { const b = document.createElement('button'); b.textContent = label; b.addEventListener('click', () => { closeCard(); jump(pos, yaw); hideHint(); }); subNav.appendChild(b); }
}
function zoneOf(x, z) {
  const inR = (R) => x > R.x0 && x < R.x1 && z > R.z0 && z < R.z1;
  const In = inInterior(x, z); if (In) return In.zone || 'works';
  for (const k of ['obong', 'works', 'ip', 'artist', 'lobby', 'lounge']) if (inR(ROOMS[k])) return k;
  if (Math.abs(x) < 10.4 && Math.abs(z) < 9.4) return 'court';
  return 'outside';
}

/* ───────── 안쪽 공간 보이기 ───────── */
// 안쪽 공간에 있으면 그 방을 파고드는 바깥 건물(벽, 바닥 등)을 숨긴다. 작품관·작가소개 밖에서는 안쪽 공간을 숨긴다(바깥 건물 밖으로 나온 부분이 보이지 않게)
const setShown = (o, v) => { o.visible = v; o.traverse(c => c.layers.set(v ? 0 : 1)); };   // 숨긴 것은 누르기·카메라 벽 살피기에서도 빠진다
{
  const own = new Set(INTERIORS.flatMap(I => I.objs)), bb = new THREE.Box3(), size = new THREE.Vector3();
  for (const I of INTERIORS) {
    const [x0, x1, z0, z1, y1] = I.box, B = new THREE.Box3(new THREE.Vector3(x0, -.05, z0), new THREE.Vector3(x1, y1, z1));
    I.intruders = scene.children.filter(o => {
      if (own.has(o) || o.isLight || o === avatar) return false;
      bb.setFromObject(o); if (bb.isEmpty()) return false;
      return bb.intersectsBox(B);
    });
  }
  // 바깥 건물의 막는 칸은 안쪽 공간 테두리만큼 잘라 낸다
  const ownCols = new Set(INTERIORS.flatMap(I => I.cols)), cut = (c, r) => {
    if (c[1] <= r[0] || c[0] >= r[1] || c[3] <= r[2] || c[2] >= r[3]) return [c];
    const out = [], xa = Math.max(c[0], r[0]), xb = Math.min(c[1], r[1]);
    if (c[0] < r[0]) out.push([c[0], r[0], c[2], c[3]]);
    if (c[1] > r[1]) out.push([r[1], c[1], c[2], c[3]]);
    if (c[2] < r[2]) out.push([xa, xb, c[2], r[2]]);
    if (c[3] > r[3]) out.push([xa, xb, r[3], c[3]]);
    return out;
  };
  let list = colliders.filter(c => !ownCols.has(c));
  for (const I of INTERIORS) list = list.flatMap(c => cut(c, [I.box[0], I.box[1], I.box[2], I.box[3]]));
  colliders.splice(0, colliders.length, ...list, ...ownCols);
}
let interiorKey = '';
function showInteriors(inside, zone, x, z) {
  const wide = !!inside || zone === 'works' || zone === 'artist';
  const nb = inside && LINKS[inside.name];   // 이어 붙인 장면(IP관): 지금 장면과 이웃만 보인다. 섬끼리 겹쳐 있어도 된다
  const near = (I) => !!(I.near && Math.hypot(x - I.near[0], z - I.near[1]) < I.near[2]);   // 중정에서 문 너머로 보이는 전실
  const shows = INTERIORS.map(I => nb ? (I === inside || nb.has(I.name)) : wide ? (!LINKS[I.name] || near(I)) : near(I));
  const key = (inside ? 'in' : '-') + '|' + shows.join();
  if (key === interiorKey) return; interiorKey = key;
  INTERIORS.forEach((I, i) => { for (const o of I.objs) if (!o.isLight) setShown(o, shows[i]); });
  for (const I of INTERIORS) for (const o of I.intruders) setShown(o, !inside);
  for (const o of OUTDOOR) setShown(o, !inside);
}

/* ───────── 조개 도장과 멤버십 카드 ───────── */
const shellsEl = $('shells'), myCardBtn = $('myCard');
const stamps = new Set(store.get('stamps', []).filter(k => STAMPS.some(s => s[0] === k)));
for (const k of store.get('visited', [])) VISITED.add(k);
const shellImgs = STAMPS.map(([k, label]) => { const im = document.createElement('img'); im.src = 'img/shell-stamp.webp'; im.alt = `${label} 도장`; im.title = label; im.classList.toggle('got', stamps.has(k)); shellsEl.insertBefore(im, myCardBtn); return im; });
const toast = $('toast'); let toastTimer = 0;
function showToast(t, s, ms = 3200) { $('toastT').textContent = t; $('toastS').textContent = s; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), ms); }
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
  $('cardStamps').replaceChildren(...STAMPS.map(([k, label], i) => { const s = document.createElement('span'); s.title = label; if (!stamps.has(k)) return s;   // 못 받은 도장은 빈칸
    const im = document.createElement('img'); im.src = 'img/shell-stamp.webp'; im.alt = label; im.style.setProperty('--r', `${[-8, 5, -3, 7, -6][i]}deg`); s.append(im); return s; }));
}
function openMember(issueNow) {
  modal.hidden = false;
  if (member) {
    $('mmTitle').textContent = '현대사회스포츠센터 멤버십 카드'; $('mmLead').textContent = '사랑, 응원 그리고 위로를 담아 드려요. 카드를 누르면 뒤집혀요.';
    $('issueForm').hidden = true; flip.hidden = false; $('mmFlip').hidden = false; renderCard();
    if (issueNow) setTimeout(() => flip.classList.add('back'), 900);
  } else {
    $('mmTitle').textContent = '현대사회스포츠센터 회원이 되었어요'; $('mmLead').textContent = (stamps.size === STAMPS.length ? '다섯 곳을 모두 둘러본 해달에게 드리는 멤버십 카드예요.' : '못 받은 도장은 빈칸으로 남겨 둘게요.') + ' 카드에 새길 이름을 적어 주세요.';
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
  // 도장이 모자라도 카드는 주고, 작가님 글을 띄운다
  if (stamps.size < STAMPS.length) setTimeout(() => showToast('처음부터 능숙한 존재는 없습니다.', '누구에게나 서툰 시작이 있고, 시작하기에 늦은 때도 없습니다.', 7000), 1600);
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
    if (!member) openMember(false);   // 도장이 모자라도 키오스크 앞에 서면 발급 화면
    else showToast('반가워요, ' + member.name, '위쪽 「내 카드」에서 멤버십 카드를 다시 볼 수 있어요.');
  }
  if (!atDesk) deskShown = false;
}

// 중정 등신대 앞: 기념 사진
const act = $('act'); let actFn = null;
function setAct(label, fn) { if (label) { act.textContent = label; act.hidden = false; actFn = fn; } else { act.hidden = true; actFn = null; } }
act.addEventListener('click', () => actFn && actFn());
const photoStamp = new Image(); photoStamp.src = 'img/shell-stamp.webp';
function takePhoto() {
  photoCam = true; renderFrame();
  // 찍은 장면 아래에 폴라로이드 같은 여백: '신해달 갤러리 · 날짜'와 조개 도장
  const W = canvas.width, H = canvas.height, m = Math.round(W * .035), foot = Math.round(W * .13);
  const c = document.createElement('canvas'); c.width = W + m * 2; c.height = H + m + foot;
  const g = c.getContext('2d'); g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(canvas, m, m, W, H); photoCam = false;
  g.fillStyle = '#3b342d'; g.font = `500 ${foot * .26}px ${FONT_B}`; g.textBaseline = 'middle';
  g.fillText(`신해달 갤러리 · ${TODAY.replace(/-/g, '.')}`, m, H + m + foot / 2);
  if (photoStamp.complete && photoStamp.naturalWidth) { const sh = foot * .62, sw = sh * photoStamp.naturalWidth / photoStamp.naturalHeight; g.save(); g.globalAlpha = .9; g.translate(c.width - m - sw / 2, H + m + foot / 2); g.rotate(-.12); g.drawImage(photoStamp, -sw / 2, -sh / 2, sw, sh); g.restore(); }
  $('photoImg').src = c.toDataURL('image/jpeg', .92); $('photoModal').hidden = false;
}
// 중정 쉬는 자리: 다가가면 '앉아서 쉬기', 누르면 그 자리로 걸어가 눈높이를 낮추고 마당을 바라본다. 움직이면 일어선다
let seatGo = null, seated = null, seatDrop = 0;
function sitAt(st) { seatGo = st; walkTo = { x: st.x, z: st.z, stuck: 0 }; }
function standUp() { seated = null; seatGo = null; }
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

/* ───────── 이어 붙이기 ───────── */
// 문 a를 앞으로 지나면 문 b 너머 같은 자리로, 문 b를 뒤로 지나면 문 a로. 카메라와 발자국도 함께 옮겨 화면이 끊기지 않는다
const portalPrev = { x: me.x, z: me.z };
function stepPortals() {
  const px = portalPrev.x, pz = portalPrev.z; portalPrev.x = me.x; portalPrev.z = me.z;
  const loc = (P, x, z) => { const fx = -Math.sin(P[2]), fz = -Math.cos(P[2]); return [(x - P[0]) * fx + (z - P[1]) * fz, (x - P[0]) * fz - (z - P[1]) * fx]; };   // [앞, 오른쪽]
  const glob = (P, f, l) => { const fx = -Math.sin(P[2]), fz = -Math.cos(P[2]); return [P[0] + fx * f + fz * l, P[1] + fz * f - fx * l]; };
  for (const { a, b, w } of PORTALS) {
    for (const [S, D, fwd] of [[a, b, true], [b, a, false]]) {
      const [f0] = loc(S, px, pz), [f1, l1] = loc(S, me.x, me.z);
      if (Math.abs(l1) > w / 2 || !(fwd ? f0 < 0 && f1 >= 0 : f0 >= 0 && f1 < 0)) continue;
      const d = D[2] - S[2], move = (x, z) => { const [f, l] = loc(S, x, z); return glob(D, f, l); };
      [me.x, me.z] = move(me.x, me.z); me.face += d; view.yaw += d;
      for (const v of [camera.position, camLook]) { const [nx, nz] = move(v.x, v.z); v.x = nx; v.z = nz; }
      if (typeof paws !== 'undefined') for (const p of paws) { const [nx, nz] = move(p.m.position.x, p.m.position.z); p.m.position.x = nx; p.m.position.z = nz; p.m.rotation.z += d; }
      if (walkTo) { const [nx, nz] = move(walkTo.x, walkTo.z); walkTo.x = nx; walkTo.z = nz; }
      portalPrev.x = me.x; portalPrev.z = me.z; return;
    }
  }
}

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
  // 1인칭 눈높이(작가님 결정, 비슷한 걷기 게임·가상 미술관처럼): 관람객은 몸이 보이지 않으니 그 눈으로 본다. 발밑을 내려다보면 발자국이 보인다
  // 휠·두 손가락은 화각만 조금 좁혀 확대한다(멀어지지는 않는다). 앉으면 앉은 눈높이로
  const EYE = 1.55 - seatDrop * 1.1;
  const cp = Math.cos(view.pitch), dir = tmpV.set(-Math.sin(view.yaw) * cp, Math.sin(view.pitch), -Math.cos(view.yaw) * cp);
  camWant.set(me.x, EYE, me.z);
  if (snapCam) { camera.position.copy(camWant); snapCam = false; } else camera.position.lerp(camWant, Math.min(1, dt * 14));
  const fov = BASE_FOV * Math.max(.68, Math.min(1, view.dist / 3.4));
  if (Math.abs(camera.fov - fov) > .05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix(); }
  camLook.copy(camera.position).addScaledVector(dir, 2);
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
  const speed = (keys.has('shift') ? 4.6 : 2.6) * WALK_K * dt;
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

  stepPortals();
  placeCamera(dt);
  stepPages(dt, me);
  for (const a of animators) a(time, dt, me);
  if (!reduceMotion) for (const b of banners) {   // 처마 아래 현수막: 아래쪽일수록 바람에 살짝 흔들린다
    const pos = b.mesh.geometry.attributes.position, b0 = b.base, ph = b.phase;
    for (let i = 0; i < pos.count; i++) { const y = b0[i * 3 + 1], drop = (b.h / 2 - y) / b.h; pos.setZ(i, Math.sin(y * 1.2 + time * 1.3 + ph) * .05 * drop + Math.sin(time * .6 + ph) * .04 * drop); }
    pos.needsUpdate = true;
  }
  for (const [k, m] of Object.entries(stampMarks)) { const got = stamps.has(k); m.ring.visible = !got; m.ring.scale.setScalar(1 + Math.sin(time * 2.4) * .08); m.shell.userData.mesh.material.color.setScalar(got ? .55 : 1); }
  checkStamps();
  const z = zoneOf(me.x, me.z);
  showInteriors(inInterior(me.x, me.z), z, me.x, me.z);
  if (z !== lastZone) {
    lastZone = z; navBtns.forEach(b => b.classList.toggle('on', b.dataset.go === z)); showSubNav(z);
    if (!VISITED.has(z)) { VISITED.add(z); store.set('visited', [...VISITED]); }
  }
  // 앉기: 도착하면 앉고, 스스로 움직이면 일어선다
  if (seatGo && !walkTo) { if (Math.hypot(me.x - seatGo.x, me.z - seatGo.z) < .3) { seated = seatGo; view.yaw = seated.yaw; view.pitch = -.08; } seatGo = null; }
  if (seated && moving && !walkTo) standUp();
  seatDrop += ((seated ? .45 : 0) - seatDrop) * Math.min(1, dt * 3);
  // 누를 거리: 등신대 앞 사진 > 쉬는 자리
  const nearStandee = Math.hypot(me.x - standeeSpot.x, me.z - standeeSpot.z) < 2.4;
  const seat = !nearStandee && SEATS.find(st => Math.hypot(me.x - st.x, me.z - st.z) < 1.4);
  const want = nearStandee ? ['얼빵해달과 사진 찍기', takePhoto] : seated ? ['일어나기', standUp] : seat ? [seat.label, () => sitAt(seat)] : null;
  if (!want) { if (actFn) setAct(null); } else if (act.textContent !== want[0] || !actFn) setAct(...want);
  renderFrame();
  requestAnimationFrame(frame);
}
me.face = view.yaw = 0;
// 화면 확인용: 주소에 ?at=x,z,방향(라디안, 0 = 북쪽, + = 왼쪽으로 돈다)을 붙이면 그 자리에서 시작한다
{ const at = new URLSearchParams(location.search).get('at'); if (at) { const [x, z, yaw = 0] = at.split(',').map(Number); me.x = x; me.z = z; me.face = view.yaw = yaw; walkTo = null; snapCam = true; } }
// 버벅임 막기: 처음 보이는 순간 그 재질의 셰이더를 만드느라 멈추지 않게, 시작할 때 모든 안쪽 공간을 한 번 보이게 하고 미리 만들어 둔다(작가님: 문 지날 때 버벅임)
{ for (const I of INTERIORS) for (const o of I.objs) if (!o.isLight) setShown(o, true);
  try { renderer.compile(scene, camera); } catch (e) { console.warn(e); }
  interiorKey = ''; }
requestAnimationFrame(frame);
</script>
