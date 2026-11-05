s = open('g7-court-obong.js', encoding='utf8').read()
a = s.index("  // 정면 벽 전체")
s = s[:a] + open('obong-new.js', encoding='utf8').read()
open('g7-court-obong.js', 'w', encoding='utf8').write(s)

b = open('g3-base.js', encoding='utf8').read()
a = b.index("T.obongCeil = canvasTex"); e = b.index("});", a) + 3
b = b[:a] + """T.obongCeil = canvasTex(2048, 2048, (g, w, h) => {  // 사유의 방처럼 아주 어두운 천장에 박힌 작고 흐린 금빛
  g.fillStyle = '#040304'; g.fillRect(0, 0, w, h); const r = rng(111);
  for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h, s = .5 + r() * r() * 2.2, a = .12 + r() * r() * .55; g.globalAlpha = a; g.fillStyle = r() > .3 ? '#b99560' : '#d8c29a'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  g.globalAlpha = 1;
});""" + b[e:]
open('g3-base.js', 'w', encoding='utf8').write(b)

g = open('g4-arch.js', encoding='utf8').read()
for x, y in [("roof({ w: 32.2, d: 13.4, cx: -15.7, cz: -5.3,", "roof({ w: 32.2, d: 10.4, cx: -15.9, cz: -5.3,"), ("roof({ w: 32.2, d: 13.4, cx: 15.7, cz: -5.3,", "roof({ w: 32.2, d: 10.4, cx: 15.9, cz: -5.3,")]:
    assert x in g; g = g.replace(x, y)
open('g4-arch.js', 'w', encoding='utf8').write(g)
print('ok')
