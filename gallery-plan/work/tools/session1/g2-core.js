
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
} }
</script>
<script type="module">
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// 캔버스에 글자를 그리기 전에 글꼴부터 받는다(늦어도 2.5초 뒤엔 그대로 진행)
await Promise.race([
  Promise.all(['300 40px "Noto Sans KR"', '400 40px "Noto Sans KR"', '500 40px "Noto Sans KR"', '700 40px "Noto Sans KR"', '900 40px "Noto Sans KR"', '400 40px "Black Han Sans"', '400 40px "Space Mono"', '700 40px "Space Mono"'].map(f => document.fonts.load(f, '가ㄱSH@&#'))),
  new Promise(r => setTimeout(r, 2500)),
]).catch(() => {});

/* ───────── 자료 ───────── */
// 홈페이지가 발행하는 공개 자료(data/*.json)를 그대로 읽는다. shinhaedal.com/gallery/ 에 올리면 '../data/'로 바꾸면 된다
const DATA = 'data/';
const getJSON = (f, fb) => fetch(DATA + f).then(r => r.ok ? r.json() : fb).catch(() => fb);
const [WORKS_INDEX, EXHIBITIONS, SERIES] = await Promise.all([getJSON('works-index.json', []), getJSON('exhibitions.json', []), getJSON('series.json', [])]);
const SITE = 'https://shinhaedal.com';
const SHOP_URL = 'https://www.idus.com/v2/artist/b987fcad-fa10-4f28-a90d-8553dbaab0ad/product';
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);   // 한국 날짜
const SCALE = 2.2;            // 작품을 화면에서 보기 좋게 실제 크기의 2.2배로 건다
const LOCAL_IMG = new Set(['HD-2025-001', 'HD-2025-002', 'HD-2025-004', 'HD-2026-001', 'HD-2026-002', 'HD-2026-003', 'HD-2026-004', 'HD-2026-005', 'HD-2026-006', 'HD-2026-007', 'HD-2026-008', 'HD-2026-009', 'HD-2026-010', 'HD-2026-011', 'HD-2026-012']);
const workImg = w => LOCAL_IMG.has(w.id) ? `img/${w.id}.webp` : `${SITE}/${w.thumb}`;
const TOY_ID = 'HD-2026-012';
