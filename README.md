# 🦦 신해달 작가 작품 아카이브

신해달 작가의 작품·전시·언론보도·홈 영상을 관리하는 관리자 도구입니다.

## 구성

| 역할 | 위치 |
|---|---|
| 데이터 원본(DB) | Supabase Postgres (works / exhibitions / press / work_photos / work_media_links / home_videos) |
| 파일 보관 | Supabase Storage (`artwork-masters` 버킷) |
| 관리 화면 | 이 저장소 → GitHub Pages (`admin.html`) |
| 홈페이지 발행 트리거 | Supabase Edge Function (`supabase/functions/publish/index.ts`) — admin.html의 "🚀 홈페이지에 반영" 버튼이 호출 |
| 실제 홈페이지 | 별도 저장소 [`shinhaedal`](https://github.com/yoonsunLee/shinhaedal) — GitHub Actions가 Supabase에서 데이터를 읽어 정적 JSON/이미지로 구워서 커밋 |

- admin.html은 로그인해야만 데이터를 조회·수정할 수 있습니다(RLS로 강제).
- admin.html에서 수정한 내용은 즉시 Supabase에 반영되지만, **실제 홈페이지에는 자동으로 안 나갑니다.** 반드시 "🚀 홈페이지에 반영" 버튼을 눌러야 `shinhaedal` 저장소의 발행 워크플로가 돌아갑니다(매일 자동 발행도 백업으로 돌아갑니다).
- `index.html`은 `admin.html`로 넘어가는 리다이렉트만 합니다(옛 주소로 들어와도 헤매지 않도록).

## 탭별 기능

- **Works**: 작품 등록/수정, 사진·상세사진·미디어(유튜브 등)·도슨트 오디오 업로드, 판매 상태 관리, 엑셀 다운로드
- **Exhibitions**: 전시 등록/수정, 출품작 연결, 포스터 업로드
- **Press**: 언론보도 등록/수정, 전시·브랜드샵 링크 연결
- **홈 영상**: 홈페이지 첫 화면 영상(최대 3개) 관리. 영상 파일 하나만 올리면 모바일용 사본·포스터는 반영 시 자동 생성됨
- **수수료 계산**: 작품별 판매가 대비 수수료 10~50% 구간 실수령액 계산(카드수수료·원천징수 토글 가능)
- **Settings**: 로그인 계정 확인, 연결 상태 점검

## Storage 파일 경로 규칙

`artwork-masters` 버킷 안에서 용도별로 접두 경로를 나눠 씁니다.

```
<작품번호>/<timestamp>.jpg       작품 사진
<작품번호>/docent-<timestamp>.*  도슨트 오디오
exhibitions/<전시ID>/<ts>.jpg    전시 포스터
home-videos/<timestamp>.<ext>    홈 영상 원본
```

## 스키마 변경

Supabase는 service_role 키를 이 저장소에 두지 않으므로, 테이블/정책 변경은 항상 Supabase 대시보드의 **SQL Editor에서 직접 실행**합니다. 실행한 SQL은 `supabase/schema/`에 기록해 둡니다(재실행용이 아니라 현재 스키마가 어떻게 만들어졌는지 참고용).
