# IP 체험관 미니게임 참고 자료

2026-11-05에 찾아 둔 목록이에요. 갤러리는 지금 three.js를 그대로 쓰고 있어서(React 없이), 그 위에 바로 얹을 수 있는 것을 먼저 골랐어요. 라이선스와 최근 관리 여부는 쓰기 전에 저장소에서 한 번 더 확인해요.

## 장면별로 쓸 만한 것

| 장면 | 하고 싶은 것 | 참고 |
|---|---|---|
| 해변 | 얕은 물에 들어가면 첨벙, 조개 세 개 줍기 | 물보라: three.quarks · 소리: ZzFX · 파도 배경음: Tone.js |
| 숲길 | 나무 미로를 벽에 막히며 걷기 | 벽 충돌: three-mesh-bvh `characterMovement` 예제 |
| 작업실 | 빈자리를 누르면 조개가 날아가 붙기 | 날아가는 움직임: GSAP 또는 tween.js · 붙는 소리: ZzFX |
| 수영장 | 물결, 바닥 물빛 무늬, 부표 | 물: evanw/webgl-water와 three.js 판들 |

## 물과 물빛 (수영장 · 해변)

- **Evan Wallace, WebGL Water** — 수영장 물의 고전 데모예요. 반사·굴절, 물결 높이 시뮬레이션, 바닥 물빛 무늬(코스틱)가 다 들어 있어요. MIT.
  [github.com/evanw/webgl-water](https://github.com/evanw/webgl-water) · 원리 글: [Rendering Realtime Caustics in WebGL](https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c)
- **jeantimex/threejs-water** — 위 데모를 three.js로 옮기고, 수영장 모양을 바꾸거나 glTF 모델을 넣을 수 있게 늘린 판이에요.
  [github.com/jeantimex/threejs-water](https://github.com/jeantimex/threejs-water/wiki)
- **martinRenou/threejs-water · threejs-caustics** — three.js 판 물과, 수영장 안 아무 물체에나 물빛을 드리우는 데모예요.
  [threejs-water](https://awesome.ecosyste.ms/projects/martinrenou.github.io%2Fthreejs-water%2F) · [3D water caustics 글타래](https://discourse.threejs.org/t/3d-water-caustics-rendering/18232)

지금 수영장 시안은 바닥 물빛을 간단한 수식으로 흉내 내고 있어요. 위 방식으로 바꾸면 부표와 사람 그림자 둘레로 진짜처럼 물빛이 휘어요.

## 소리 (녹음 없이 브라우저에서 만들기)

- **ZzFX** — 500바이트도 안 되는 효과음 생성기예요. 첨벙, 조개 줍기, 딸깍 같은 짧은 소리를 숫자 몇 개로 만들어요. 소리를 고르는 웹 도구도 있어요. MIT.
  [github.com/KilledByAPixel/ZzFX](https://github.com/KilledByAPixel/ZzFX)
- **Tone.js** — 파도, 숲 바람, 실내수영장 울림 같은 깔리는 소리를 노이즈·필터·반복으로 짜기 좋아요. 사용자가 한 번 누른 뒤에 시작해야 해요. MIT.
  [github.com/Tonejs/Tone.js](https://github.com/Tonejs/Tone.js) · [tonejs.github.io](https://tonejs.github.io)
- 만든 소리가 부족하면: **Kenney 오디오 팩**(CC0, 출처 표기 없이 사용 가능) — [kenney.nl](https://kenney.nl) · 관련 정리: [Game Asset Licenses Explained](https://cinevva-site.pages.dev/guides/game-asset-licenses)

## 움직임과 충돌

- **three-mesh-bvh** — 캡슐 모양 몸으로 벽에 부딪히며 걷는 예제(`characterMovement`)가 있어요. 숲길 미로와 "카메라가 벽을 뚫지 않게"에 바로 쓸 수 있어요. 물리 엔진이 필요 없어요.
  [데모](https://gkjohnson.github.io/three-mesh-bvh/example/bundle/characterMovement.html) · [예제 설명](https://deepwiki.com/gkjohnson/three-mesh-bvh/5-example-applications) · [쓰는 법 글](https://dev.to/bandinopla/collision-detection-in-threejs-made-easy-using-bvh-41g5)
- **pmndrs/ecctrl** — 잘 만든 캐릭터 조종기지만 React Three Fiber 전용이에요. 지금 구조에는 바로 못 써서 동작 방식만 참고해요.
  [npm: ecctrl](https://www.npmjs.com/package/ecctrl)

## 효과

- **three.quarks** — three.js용 파티클 엔진이에요. 해변 물보라, 조개를 주울 때 반짝임, 작업실에서 조개가 붙을 때 빛 가루에 쓸 수 있어요. 눈으로 보며 만드는 편집기도 있어요.
  [github.com/Alchemist0823/three.quarks](https://github.com/Alchemist0823/three.quarks/) · [문서](https://docs.quarks.art/docs)

## 3D 소품

- **Quaternius** — 자연·소품 3D 모델 팩, CC0, glTF로 받을 수 있어요. 숲길 소품(새 둥지, 벤치)이나 해변 소품 밑그림으로 쓸 만해요.
  [소개 글](https://gamefromscratch.com/quaternius-free-3d-assets/)
- CC0 자료 모음: [awesome-cc0](https://www.github.com/madjin/awesome-cc0)
- 캐릭터(얼빵해달, 수영장 사람들)를 입체로: 지난번에 찾아 둔 **Meshy / Tripo** 이미지→3D (유료, 작가님 이미지를 올리기 전 약관 확인).

## MCP와 작업 도구

- **Blender 공식 MCP** — 이미 연결해 뒀어요. 해변, 숲길, 작업실 공간을 짓고 빛을 구워 넣는 데 써요.
- **Three.js DevTools MCP** (제3자) — 돌아가는 three.js 장면을 AI가 들여다보고 재질·조명을 바로 고치는 도구예요. 실제로 쓰기 전 저장소 확인 필요.
  [getdrio 소개](https://www.getdrio.com/mcp/io-github-dmitriygolub-threejs-devtools)
- **threejs-game-director** (제3자 Claude Code 스킬) — three.js 게임 만드는 순서를 잡아 주는 스킬이에요. 참고용.
  [claudemarketplaces](https://claudemarketplaces.com/skills/majidmanzarpour/threejs-game-skills/threejs-game-director)
- 그 밖의 three.js MCP들(champierre/threejs-mcp, aidenlab/hellomcp)은 물체 몇 개를 움직이는 시연 수준이라 이 작업에는 맞지 않아요.
  [champierre/threejs-mcp](https://lobehub.com/it/mcp/champierre-threejs-mcp) · [aidenlab/hellomcp](https://lobehub.com/ko/mcp/aidenlab-hellomcp)
