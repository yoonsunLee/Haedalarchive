import re
old=open('index-v5.html',encoding='utf8').read().split('\n')
detail=[l for l in old if l.startswith('const DETAIL = ')][0]
s=''.join(open(f,encoding='utf8').read() for f in ['g1-head.html','g2-core.js'])+detail+'\n'+''.join(open(f,encoding='utf8').read() for f in ['g3-base.js','g4-arch.js','g5-rooms.js','g6-works.js','g7-court-obong.js','g8-ip.js','g9-lounge-out.js','g10-play.js'])
a=s.index('<section class="intro" id="intro">'); b=s.index('</section>',a)+len('</section>')
s=s[:a]+'<div class="loading glass" id="loading"><span id="loadPct">불러오는 중</span></div>'+s[b:]
st0=s.index('<style>'); st1=s.index('</style>')
css=s[st0:st1]; css=re.sub(r'\n\.intro[^\n]*','',css); css=css.replace('.card, .card.closed, .intro, .hint,','.card, .card.closed, .hint,')
s=s[:st0]+css+s[st1:]
rep=[
("html, body { height: 100%; overflow: hidden;","[hidden] { display: none !important; }\nhtml, body { height: 100%; overflow: hidden;"),
("body:has(.intro:not(.gone)) .hint { opacity: 0; }",".loading { position: fixed; z-index: 6; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 10px 18px; font-size: 13px; color: var(--muted); transition: opacity .5s; pointer-events: none; }\n.loading.done { opacity: 0; }"),
("manager.onLoad = () => { loadPct.textContent = '준비됨'; };","manager.onLoad = () => { loadPct.textContent = '준비됨'; document.getElementById('loading').classList.add('done'); };"),
("    if (!document.getElementById('intro').classList.contains('gone')) return;\n",""),
("""$('introKeys').innerHTML = coarse
  ? '<li>끌어서 둘러보기</li><li>왼쪽 아래 패드로 걷기</li><li>바닥을 누르면 그곳까지 걸어가기</li><li>작품을 누르면 자세히</li>'
  : '<li>마우스로 끌어 둘러보기</li><li>WASD · 방향키로 걷기, Shift로 빠르게</li><li>바닥을 누르면 그곳까지 걸어가기</li><li>작품을 누르면 자세히</li>';
const intro = $('intro');
$('enter').disabled = false;
$('enter').addEventListener('click', () => { intro.classList.add('gone'); playVideo(); walkTo = { x: 0, z: 22.5, stuck: 0 }; });""",
"walkTo = { x: 0, z: 26, stuck: 0 };"),
("const SCALE = 2.2;            // 작품을 화면에서 보기 좋게 실제 크기의 2.2배로 건다","const SCALE = 2.5;            // 작품을 화면에서 보기 좋게 실제 크기의 2.5배로 건다"),
("const [ww, hh] = u.sizes[k], c = a + ww / 2, cy = 1.55;","const [ww, hh] = u.sizes[k], c = a + ww / 2, cy = TOP - hh / 2;"),
("new THREE.MeshBasicMaterial({ map: t, side, color: new THREE.Color(tint, tint, tint) })","new THREE.MeshBasicMaterial({ map: t, side, color: new THREE.Color(tint, tint, tint), toneMapped: false })"),
("const avMat = new THREE.MeshBasicMaterial({ map: avTex.back, alphaTest: .4, side: THREE.DoubleSide });","const avMat = new THREE.MeshBasicMaterial({ map: avTex.back, alphaTest: .4, side: THREE.DoubleSide, toneMapped: false });"),
("new THREE.MeshBasicMaterial({ map: t, color: 0xf2f2f2 })","new THREE.MeshBasicMaterial({ map: t, color: 0xeeeeee, toneMapped: false })"),
("const view = { yaw: 0, pitch: -.2, dist: 3.6 };","const view = { yaw: 0, pitch: -.16, dist: 4.6 };"),
("camTarget.set(me.x, 1.15, me.z);","camTarget.set(me.x, 1.6, me.z);"),
]
for x,y in rep:
    if x not in s: print('skip:', x[:50]); continue
    s=s.replace(x,y)
for extra in sorted(__import__('glob').glob('patch-*.py')): exec(open(extra,encoding='utf8').read())
open(r'C:/Users/yoons/Desktop/Claude code/haedal-archive/gallery/index.html','w',encoding='utf8').write(s)
print('ok', len(s), s.count('ABOUT.intro'))
