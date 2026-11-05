zoom_js = r"""
/* ───────── 확대·축소: 휠, 두 손가락, +/- 키 ───────── */
const ZMIN = 1.2, ZMAX = 9;
const zoomBy = f => { view.dist = Math.min(ZMAX, Math.max(ZMIN, view.dist * f)); focus = null; };
canvas.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(e.deltaY * .0012)); hideHint(); }, { passive: false });
addEventListener('keydown', e => { if (e.target.closest && e.target.closest('input,textarea')) return; if (e.key === '+' || e.key === '=') zoomBy(.88); if (e.key === '-' || e.key === '_') zoomBy(1.14); });
let pinch = 0;
canvas.addEventListener('touchmove', e => {
  if (e.touches.length !== 2) { pinch = 0; return; }
  const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  if (pinch) zoomBy(pinch / d); pinch = d; drag = null; canvas.classList.remove('dragging');
}, { passive: true });
canvas.addEventListener('touchend', () => { pinch = 0; });
"""
m = "/* ───────── 자세히 보기: 오른쪽 카드 ───────── */"
assert m in s
s = s.replace(m, zoom_js + "\n" + m, 1)
s = s.replace("드래그로 둘러보기 · WASD·방향키로 걷기 · 바닥을 누르면 그곳으로 · 작품을 누르면 자세히", "드래그로 둘러보기 · 휠로 확대·축소 · WASD·방향키로 걷기 · 바닥을 누르면 그곳으로")
