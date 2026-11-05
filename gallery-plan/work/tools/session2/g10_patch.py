p = 'g10-play.js'; s = open(p, encoding='utf8').read()
reps = [
# 사진: 폴라로이드처럼 아래 여백에 '신해달 갤러리 · 날짜'와 조개 도장
("""function takePhoto() {
  photoCam = true; renderFrame();
  const url = canvas.toDataURL('image/jpeg', .92); photoCam = false;
  $('photoImg').src = url; $('photoModal').hidden = false;
}""",
"""const photoStamp = new Image(); photoStamp.src = 'img/shell-stamp.webp';
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
function standUp() { seated = null; seatGo = null; }"""),
("  camTarget.set(me.x, 1.15, me.z);", "  camTarget.set(me.x, 1.15 - seatDrop, me.z);"),
("""  const z = zoneOf(me.x, me.z);
  if (z !== lastZone) { lastZone = z; navBtns.forEach(b => b.classList.toggle('on', b.dataset.go === z)); }
  const nearStandee = Math.hypot(me.x - standeeSpot.x, me.z - standeeSpot.z) < 2.4;
  if (nearStandee && !actFn) setAct('얼빵해달과 사진 찍기', takePhoto); else if (!nearStandee && actFn) setAct(null);""",
"""  const z = zoneOf(me.x, me.z);
  if (z !== lastZone) {
    lastZone = z; navBtns.forEach(b => b.classList.toggle('on', b.dataset.go === z));
    if (!VISITED.has(z)) { VISITED.add(z); store.set('visited', [...VISITED]); }
  }
  // 앉기: 도착하면 앉고, 스스로 움직이면 일어선다
  if (seatGo && !walkTo) { if (Math.hypot(me.x - seatGo.x, me.z - seatGo.z) < .3) { seated = seatGo; view.yaw = seated.yaw; view.pitch = -.04; } seatGo = null; }
  if (seated && moving && !walkTo) standUp();
  seatDrop += ((seated ? .45 : 0) - seatDrop) * Math.min(1, dt * 3);
  // 누를 거리: 등신대 앞 사진 > 쉬는 자리
  const nearStandee = Math.hypot(me.x - standeeSpot.x, me.z - standeeSpot.z) < 2.4;
  const seat = !nearStandee && SEATS.find(st => Math.hypot(me.x - st.x, me.z - st.z) < 1.4);
  const want = nearStandee ? ['얼빵해달과 사진 찍기', takePhoto] : seated ? ['일어나기', standUp] : seat ? [seat.label, () => sitAt(seat)] : null;
  if (!want) { if (actFn) setAct(null); } else if (act.textContent !== want[0] || !actFn) setAct(...want);"""),
]
for a, b in reps:
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
# 눈높이 1.6 은 build.py 가 바꿔 넣는다: 새 줄에 맞춘다
p = 'build.py'; s = open(p, encoding='utf8').read()
a = '("camTarget.set(me.x, 1.15, me.z);","camTarget.set(me.x, 1.6, me.z);"),'
assert s.count(a) == 1
s = s.replace(a, '("camTarget.set(me.x, 1.15 - seatDrop, me.z);","camTarget.set(me.x, 1.6 - seatDrop, me.z);"),')
open(p, 'w', encoding='utf8').write(s)
# 다녀간 곳은 새로 고쳐도 남는다
p = 'g10-play.js'; s = open(p, encoding='utf8').read()
a = "const stamps = new Set(store.get('stamps', []).filter(k => STAMPS.some(s => s[0] === k)));"
assert s.count(a) == 1
s = s.replace(a, a + "\nfor (const k of store.get('visited', [])) VISITED.add(k);")
open(p, 'w', encoding='utf8').write(s)
print('ok')
