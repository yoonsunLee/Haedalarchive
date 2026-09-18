-- home_videos 열 맞추기 — 2026-09
--
-- 증상: 영상을 저장하면
--   "Could not find the 'video_master' column of 'home_videos' in the schema cache"
--
-- 원인은 둘 중 하나다.
--   (가) 표에 실제로 그 열이 없다. 처음 만든 표가 지금 정의보다 예전 것이면,
--        home_videos_schema.sql을 다시 돌려도 `create table if not exists`라서
--        아무 일도 일어나지 않는다. 빠진 열은 끝내 안 생긴다.
--   (나) 열은 있는데 PostgREST(= Supabase API)가 들고 있는 스키마 목록이 낡았다.
--
-- 아래는 둘 다 해결한다. `add column if not exists`라서 이미 있는 열은 건드리지 않고,
-- 마지막에 스키마 목록을 새로 읽으라고 알린다. 여러 번 실행해도 안전하다.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run.

-- ---------- 1) 관리 화면이 저장할 때 보내는 열들 ----------
alter table home_videos add column if not exists name                  text;
alter table home_videos add column if not exists video_master          text;
alter table home_videos add column if not exists work_id               uuid references works(id) on delete set null;
alter table home_videos add column if not exists bg_color              text    not null default '#000000';
alter table home_videos add column if not exists ui_theme              text    not null default 'dark';
alter table home_videos add column if not exists sort_order            int     not null default 0;
alter table home_videos add column if not exists is_public             boolean not null default false;
alter table home_videos add column if not exists mobile_image_fallback boolean not null default false;

-- ---------- 2) 관례상 늘 있는 열들(소프트 삭제·동시 수정 방지) ----------
alter table home_videos add column if not exists version    int         not null default 1;
alter table home_videos add column if not exists deleted_at timestamptz;
alter table home_videos add column if not exists created_at timestamptz not null default now();

-- ---------- 3) 권한 (SQL Editor로 만든 표는 이게 빠져 있을 수 있다) ----------
grant select, insert, update, delete on home_videos to authenticated;

-- ---------- 4) API가 들고 있는 스키마 목록 새로 읽기 ----------
notify pgrst, 'reload schema';

-- ---------- 5) 확인 ----------
-- 아래 목록에 video_master가 보이면 된 것이다.
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'home_videos'
 order by ordinal_position;
