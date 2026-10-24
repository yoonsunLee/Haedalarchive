# CLAUDE.md — 신해달 어드민 (Haedalarchive)

이 파일은 Claude가 이 저장소에서 작업할 때 먼저 읽는 안내다. 구성은 README.md, 카페24 쪽은 hosting/README.md 를 함께 읽는다.

## 무엇인가
- `admin.html` 한 파일 = "신해달 어드민"(GitHub Pages). 작품·전시·기사·홈 히어로·홈 운영·방문통계를 관리한다.
  데이터 원본은 Supabase(Postgres + Storage), 로그인해야 읽고 쓴다(RLS, 2단계 인증).
- "🚀 홈페이지에 반영" → Supabase Edge Function(`supabase/functions/publish`) → 공개 홈페이지 저장소
  `yoonsunLee/shinhaedal` 의 발행 워크플로가 data/*.json·이미지를 굽는다. 어드민에서 고쳐도 반영 버튼(또는 매일 자동 발행) 전에는 사이트에 안 나간다.
- `hosting/` = 카페24(국내 웹호스팅)에 올리는 PHP. **저장소에 올려도 자동 배포되지 않는다** — 사용자가 FTP 로 직접 올린다.
  - `contact.php`: Contact 폼 접수 → 작가 메일 발송(저장 안 함). `config.php` 는 저장소에 없다(`config.sample.php` 참고).
  - `stats/collect.php`·`report.php`·`lib.php`·`geoip.php`·`schema.sql`: 방문 통계 수집·조회.
  - hosting 파일을 고쳤으면 **사용자에게 "어느 파일을 어디에 다시 올려야 하는지"를 꼭 따로 알려 준다.**

## 누구와 일하나 / 일하는 규칙
- 신해달 작가(나전칠기, 법학 배경)를 돕는 사용자가 한국어로 요청한다. **답은 한국어, 쉬운 말로.**
- **PR은 Claude가 직접 만들고 직접 합친다**(squash).
- 화면 모양을 바꾸는 일은 시안(캡처)을 먼저 보여 주고 고르면 반영. 버그·문구는 바로 고치고 확인 후 합친다.
- 어드민 화면 이름은 "신해달 어드민". 왼쪽 메뉴 순서: 메인 / 홈 운영 / Works 운영 / 작품 관리 / 전시 관리 / 기사 등록 / 방문통계 / 수수료계산 / 작업기록 / 운영메모.

## 홈페이지와 맞춰야 하는 것
- **방문통계 라벨**: 홈페이지 `assets/stats.js` 의 클릭 이름(RULES)·구역(ZONES)이 늘면 `admin.html` 의 `ST_BTN`·`ST_ZONE`·페이지 이름(`stPage`)에 한국어 라벨을 더한다.
  새 페이지가 생기면 `hosting/stats/collect.php` 의 받을 페이지 목록에도 더한다(→ 사용자가 카페24에 다시 올려야 함).
- 홈 첫 화면 규칙(Recent works / Upcoming exhibition / Now on view, 전시별 예고 기간, Recent 점수 2~6, 작품 순서)은
  홈페이지 index.html 의 판정과 같아야 한다. 한쪽을 고치면 다른 쪽도 확인한다.
- 미리보기(👁)는 홈페이지를 iframe(`?pv=1`)으로 띄우고 `assets/preview.js` 가 반영 전 데이터로 바꿔 끼운다.

## 확인하는 법
- admin.html 은 로그인이 필요해 실제 데이터로 열 수 없다. 바꾼 JS 는 `<script>` 를 뽑아 `node --check` 로 문법 확인,
  표시 로직은 함수만 떼어 가짜 데이터로 돌려 본다.
- PHP 는 `php -l` 이 있으면 문법 확인. 없으면 변경을 최소로 하고 diff 를 꼼꼼히 다시 읽는다.
