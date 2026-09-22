-- 홈 히어로 — 2026-09
--
-- '홈 영상' 표(home_videos)를 '홈 히어로' 장 목록으로 넓힌다. 표를 새로 만들지 않고 열만 더하므로
-- 지금까지 올린 영상은 그대로 '영상' 장이 된다.
--
-- 1) kind        : 장의 종류 — 'video'(영상) · 'work'(공개 작품 한 점) · 'image'(따로 올린 이미지)
-- 2) image_file  : 'image' 장의 원본('sb:경로', artwork-masters 버킷). 발행 때 홈페이지용 사진을 만든다
--    work_id      : (이미 있음) 'work' 장이면 그 작품, 'video'·'image' 장이면 크레딧·'작품 보기'가 가리킬 작품(선택)
--
-- 기본 이미지(지금 얼빵해달 화면)는 표에 행으로 두지 않고 site_settings 'hero_default' {"enabled": true|false}로
-- 켜고 끈다(works_page_2026-09.sql이 만든 표). 공개된 장이 하나도 없으면 설정과 관계없이 기본 이미지가 나온다.
--
-- 다시 돌려도 안전하고, 돌릴 때마다 실제 표가 이 파일과 같아진다(README 규칙).
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run.

alter table home_videos add column if not exists kind       text not null default 'video';
alter table home_videos add column if not exists image_file text;

alter table home_videos drop constraint if exists home_videos_kind_check;
alter table home_videos add  constraint home_videos_kind_check
  check (kind in ('video', 'work', 'image'));

-- API가 들고 있는 스키마 목록 새로 읽기
notify pgrst, 'reload schema';

-- 확인: kind · image_file 두 줄이 보이면 된 것
select column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'home_videos'
   and column_name in ('kind', 'image_file')
 order by column_name;
