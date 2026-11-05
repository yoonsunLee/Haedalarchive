# 신해달 3D 갤러리 작업 인계 (2026-11-05)

다른 Claude 계정으로 같은 컴퓨터에서 이어 작업할 때 이 문서부터 읽는다. 작업 방식 규칙은 저장소 맨 위 `CLAUDE.md`에 있다.

## 1. 무엇을 하고 있나

- **대상:** 나전칠기 작가 신해달(IP 캐릭터 얼빵해달)의 three.js 가상 갤러리. 결과물은 `gallery/index.html` 한 장이다.
- **방식:** 컨셉 보드(`gallery-plan/concept.html`)에서 작가님이 공간마다 하나씩 정한 내용을 실제 갤러리에 한 공간씩 반영한다.
- **기준:** 바탕은 버전 31 갤러리다. 외관 모양은 바꾸지 않고 다듬는다.

## 2. 공간별 진행 상황

정한 순서는 외관 → 로비·작가소개 → 작품관(+다섯 문턱) → 중정 → 일월오봉단관 → 해달 라운지 → IP 체험관 → 빛 굽기(맨 끝)이다. 작품관은 작가님이 건너뛰고 중정으로 가자고 해서 뒤로 미뤘다.

| 공간 | 상태 | 반영한 것 |
|---|---|---|
| 외관 | 확정 | 현무암 큰 판(1200×600, #3b3c3e~#5e5f61) 벽. 입구 양옆 처마 밑에 같은 신해달 개인전 세로 현수막 두 장(검정 바탕, 개막 전 UPCOMING · D-n, 개막 후 NOW ON VIEW). 라운지 바깥 디스플레이 확대(높이 4.9 m). 작가소개·라운지 지붕은 안쪽 끝을 로비 벽 모서리(x ±6)에서, 북쪽 처마를 벽선(z 9.4)에서 멈춤 |
| 로비 | 확정 | 인포메이션 테이블 없음. 서쪽: 개인전 포스터 + 예정 전시(전시 사이 넉넉히, 최대 4건, '홈에 안 내보냄' 전시도 넣음). 동쪽 관람 안내도: 작품관·IP관은 나누지 않고 이름만, 순서 "로비 → 작가소개 → 작품관 → 중정 → IP관 → 일월오봉단관 → 해달 라운지", 조개 도장 "숨어있는 조개 표시를 찾아보세요. / 해달 라운지에서 멤버십 카드를 받을 수 있습니다." 중정 쪽 면은 툇마루 반자(3.4 m) 위로 통유리 + 놋쇠 살 |
| 작가소개 | 확정 | 서쪽: 사진 + About 원래 글 전부. 북쪽: ARTIST NOTE / 제목 세 줄 같은 크기(작품관 문과 디스플레이 사이 가운데) + 검은 디스플레이(5.6×3.3 m)에 본문이 단락씩 올라와 잠깐 멈춤(강조 줄은 더 오래, 움직임 줄이기면 멈춤). 남쪽: CV 세 단(학력·자격·브랜드와 활동), 전시 이력은 누르면 뜨는 창. 언론 보도는 뺌. 조개 표시 70% 크기로 About 앞 |
| 중정 | 반영, 작가님 확인 대기 | 판 없는 낱글자 현판 여섯(작품관, IP 체험관, IP 체험관 나가는 곳, 일월오봉단관, 해달 라운지, 로비 — 로비 쪽은 나무 인방 위). 다음에 갈 문 현판만 호박빛으로 은은하게. 이정표(축선 왼쪽 옆, 다섯 방향). 곡선 화단 소나무 하나. 나무 벤치 둘 + 툇마루 앉는 자리 넷('앉아서 쉬기'). 폴라로이드 기념 사진(신해달 갤러리 · 날짜 + 조개 도장). **뺀 것:** 배롱나무, 검은 수반, 유리 난간(작가님이 정한 적 없는 옮겨 온 줄이었다) |
| 일월오봉단관 | 반영, 작가님 확인 대기 | 차단봉·두 단 단상 없음. 15 cm 디딤단 하나에 다섯이 한 줄(사슴 −3.4, 토끼 −1.7, 백호 0, 학 +1.7, 해달 +3.4). 명판은 발 앞 디딤단 윗면에 놋쇠 글자로 눕혀 세 줄(SUN / 경비원 학두루미 / 해). 누르면 뜨는 창엔 영문·이름·역할·아이템만. 틈 천창, 별 없는 서까래 천장, 그림 위 짧은 그림자, 들어서면 눈 적응. 입구 왼쪽 벽 소개글(홈페이지 IP 페이지 글, 첫 문단만) |
| 작품관 + 다섯 문턱 | 아직 | 컨셉 보드 04·다섯 문턱 그대로 만들 차례. 첫 작품은 반드시 HD-2026-001 |
| 해달 라운지 | 아직 | 다음 차례(작가님이 "넘어가자" 하면). 컨셉 보드 08 |
| IP 체험관 | 아직 | 컨셉 보드 06. 미니게임 넷 |
| 빛 굽기 | 아직 | 모양이 다 정해진 뒤 Blender로 한 번 |

지금 기다리는 것: 작가님이 일월오봉단관을 확인하고 "넘어가자"고 하면 해달 라운지를 시작한다.

## 3. 파일 지도

- `gallery/index.html` — 갤러리 결과물. 직접 고치지 않는다.
- `gallery/src/` — 원본 조각(g1-head.html, g2-core.js … g10-play.js, index-v5.html, patch-*.py). `python gallery/src/build.py`로 이어 붙여 `gallery/index.html`을 만든다.
  - g3-base.js: 자료(ABOUT, CV, FRIENDS), 재질(T.facade 현무암 등)
  - g4-arch.js: 평면, 벽, 지붕, 로비 통유리
  - g5-rooms.js: 로비, 작가소개
  - g6-works.js: 작품관
  - g7-court-obong.js: 중정, 일월오봉단관
  - g8-ip.js: IP관
  - g9-lounge-out.js: 라운지, 바깥(현수막, 디스플레이)
  - g10-play.js: 걷기, 카메라, 사진, 앉기, 도장
- `gallery/data/` — 홈페이지가 발행하는 공개 자료(exhibitions.json 등).
- `gallery-plan/concept.html` — 컨셉 보드 원본. 결정이 바뀔 때마다 여기를 고친다.
- `gallery-plan/img/` — 보드 그림과 작업 중 비교 시트.
- `gallery-plan/blender/` — Blender 스크립트(render_current_gallery.py, bake_gallery.py, lightmaps.py, build_pool.py …)와 .blend.
- `gallery-plan/work/tools/` — 임시 폴더에서 옮겨 온 보조 스크립트.
  - `shot.py`: 헤드리스 Chrome으로 갤러리 화면 찍기
  - `lm_convert.py`: 굽기 결과를 lightmap webp로 바꾸기
  - `session1/`, `session2/`: 그때그때 쓴 스크립트 전부
- `gallery-plan/work/blender-data/` — Blender로 다시 렌더할 때 쓰는 갤러리 장면 `gallery-gltf/gallery.glb`(125 MB), Blender MCP 설치 파일. git에는 올리지 않는다.
- `gallery-plan/work/renders/` — 외관 색·재료 샘플 렌더. git에는 올리지 않는다.
- `gallery-plan/work/handoff/memory/` — Claude 메모 복사본.
- `gallery-plan/work/handoff/transcript/` — 이번 대화 기록 전체(jsonl, 192 MB). 지난 결정의 정확한 문장이 필요하면 여기서 찾는다.

## 4. 빌드하고 화면 보기

```bash
python gallery/src/build.py
```
- `ok 15xxxx 2`가 나오면 된 것이다. `skip: const avMat …` 한 줄은 예전부터 나오는 것이라 괜찮다.
- **미리보기 서버:** `.claude/launch.json`의 `gallery`(python http.server, 포트 8791, gallery 폴더). 데스크톱 앱 브라우저 창이 숨겨져 있으면 그림이 안 그려진다.
- **화면 찍기:** 헤드리스 Chrome으로 찍는다(Playwright 설치되어 있음).
```bash
python gallery-plan/work/tools/shot.py "http://localhost:8791/" out.png "click:중정,w:1500,dragx:-420"
```
  - 동작은 쉼표로 잇는다. `click:메뉴이름`, `w:밀리초`(앞으로 걷기, s·a·d·ArrowLeft도 됨), `dragx:픽셀`(좌우로 돌기), `drag:픽셀`(위아래 보기).
  - 찍은 것 여러 장은 PIL로 한 장 시트로 묶어 `gallery-plan/img/`에 두고 보여 드린다.
- **날짜 미리 보기:** 주소 끝에 `?today=2026-11-25`를 붙이면 그날 기준으로 현수막·로비가 바뀐다.
- **검사:** `<script type="module">` 내용을 뽑아 `node --check`로 문법을 확인한다. JS 문자열 안의 작은따옴표는 `\'`로 써야 한다(이것 때문에 한 번 화면이 안 떴다).

## 5. Blender 설정

- **Blender:** 5.2.3 LTS, `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. GPU는 RTX 4060 Ti(OptiX).
- **Blender MCP:** 공식 Blender Lab MCP v1.0.3.
  - 서버: `C:\Users\yoons\.blender-mcp\venv\Scripts\blender-mcp.exe`(Python 3.14 venv).
  - 등록: `~/.claude.json`의 이 프로젝트 local 범위와 저장소의 `.mcp.json`(project 범위, 새 계정에서 처음 열 때 승인)에 들어 있다.
  - 설치 파일 사본: `gallery-plan/work/blender-data/blender-mcp-dl/`.
  - 다리(bridge)는 온라인 모드에서만 켜진다. `blender.exe --online-mode`로 열면 localhost:9876에서 기다린다. 헤드리스로는 `blender.exe -b --online-mode --command blender_mcp`.
- **갤러리 다시 렌더(외관 샘플 등):**
```bash
blender -b --python gallery-plan/blender/render_current_gallery.py -- gallery-plan/work/blender-data/gallery-gltf/gallery.glb out-{v}.png 64 1280 720 "far,mid,near"
```
  - 시점: aerial, court, obong, front, far, mid, near. 쉼표로 여러 개를 주면 장면을 한 번만 불러 차례로 찍는다.
  - 환경 변수: `SUN="고도,방위"`(예: 40,35 = 앞마당 쪽 비스듬한 해), `FACADE="어두운hex,밝은hex"`(나무결 투명칠), `STONE=concrete|granite|basalt|earth`.
  - 한 장에 약 6초, 세 시점 30초쯤.
- **빛 굽기:** `gallery-plan/blender/bake_gallery.py` → `gallery-plan/work/tools/lm_convert.py`.
  - 굽는 UV 맵을 물체의 활성(active, active_render) UV로 해야 한다.
  - smart_project는 물체마다 따로 돌린다.
  - gallery.glb는 지금 갤러리를 three.js에서 glTF로 뽑은 것이라, 모양을 바꾼 뒤 다시 구우려면 새로 뽑아야 한다(빛 굽기는 맨 끝 차례).

## 6. 컨셉 보드 아티팩트

- **지금 보드:** https://claude.ai/artifact/3Kvy3nfuWa5MgBhjFs6Ziw (이전 계정 소유). 새 계정에서는 고칠 수 없다.
- **새 계정에서 다시 게시:** 원본 `gallery-plan/concept.html` 맨 앞에 `<!DOCTYPE html>` 한 줄을 붙인 사본을 index.html로, `gallery-plan/img/`의 그림들을 `img/…`로 함께 게시한다. 새 주소가 생긴다.
- **결정이 바뀔 때마다:** 보드의 해당 공간 설명과 '11 확정한 것' 항목을 함께 고친다.

## 7. Claude 메모

- **위치:** `C:\Users\yoons\.claude\projects\C--Users-yoons-Desktop-Claude-code-haedal-archive\memory\`. 같은 Windows 사용자면 계정이 바뀌어도 그대로 읽힌다.
- **사본:** `gallery-plan/work/handoff/memory/`. 원본이 안 보이면 이 사본을 그 자리에 다시 복사한다.
- **들어 있는 것:**
  - 작품관 첫 작품 HD-2026-001
  - 관람객은 보이지 않고 발자국만
  - 버전 31을 바탕으로
  - Blender MCP 설정과 3D 파이프라인
  - 지적이 정리된 점은 반복하지 않기
  - 한 공간씩
  - 옮겨 온 보드 줄은 묻고 만들기
