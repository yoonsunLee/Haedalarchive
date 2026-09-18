-- home_videos — 홈 첫 화면 영상
--
-- 다시 돌려도 안전하고, 돌릴 때마다 실제 표가 이 파일과 같아진다.
--
-- 예전에는 create table if not exists 하나로 끝냈는데, 그러면 표가 이미 있을 때
-- 통째로 건너뛴다. 나중에 파일에 열을 하나 더해도 실제 표에는 영영 안 생기고,
-- 몇 달 뒤에 엉뚱한 오류로 튀어나온다. 실제로 video_master가 그렇게 빠져서
-- "Could not find the 'video_master' column of 'home_videos' in the schema cache"로
-- 영상 등록이 통째로 막혔다(2026-09-19). 그래서 표는 최소로 만들고 열·제약은
-- 하나씩 있으면 두고 없으면 만드는 식으로 적는다.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run.

-- ---------- 1) 표 ----------
create table if not exists home_videos (
  id uuid primary key default gen_random_uuid()
);

-- ---------- 2) 열 ----------
alter table home_videos add column if not exists name                  text;    -- 관리용 메모, 홈페이지에는 안 나옴
alter table home_videos add column if not exists video_master          text;    -- 'sb:경로' (artwork-masters 버킷)
alter table home_videos add column if not exists work_id               uuid;    -- 영상 위 '작품 보기' 배지가 가리킬 작품
alter table home_videos add column if not exists bg_color              text    not null default '#000000';
alter table home_videos add column if not exists ui_theme              text    not null default 'dark';
alter table home_videos add column if not exists sort_order            int     not null default 0;
alter table home_videos add column if not exists is_public             boolean not null default false;
alter table home_videos add column if not exists mobile_image_fallback boolean not null default false;
alter table home_videos add column if not exists version               int     not null default 1;
alter table home_videos add column if not exists deleted_at            timestamptz;
alter table home_videos add column if not exists created_at            timestamptz not null default now();

-- ---------- 3) 제약 ----------
-- add constraint에는 if not exists가 없다. 지웠다 다시 거는 것이 가장 확실하다.
alter table home_videos drop constraint if exists home_videos_ui_theme_check;
alter table home_videos add  constraint home_videos_ui_theme_check
  check (ui_theme in ('light', 'dark'));

alter table home_videos drop constraint if exists home_videos_work_id_fkey;
alter table home_videos add  constraint home_videos_work_id_fkey
  foreign key (work_id) references works(id) on delete set null;

-- ---------- 4) 버전 올리기 ----------
-- update할 때마다 version을 올려서, admin.html의 동시 수정 방지
-- (.eq('version', cur._version))가 동작하게 한다.
create or replace function home_videos_bump_version()
returns trigger language plpgsql as $$
begin
  new.version = coalesce(old.version, 1) + 1;
  return new;
end;
$$;
drop trigger if exists trg_home_videos_bump_version on home_videos;
create trigger trg_home_videos_bump_version
  before update on home_videos
  for each row execute function home_videos_bump_version();

-- ---------- 5) 권한 ----------
-- 로그인한 사용자(=작가 본인)만 전체 CRUD. publish_sb.py는 service_role 키로
-- RLS를 우회해서 읽으므로 별도 정책이 필요 없다.
alter table home_videos enable row level security;
drop policy if exists "authenticated full access on home_videos" on home_videos;
create policy "authenticated full access on home_videos"
  on home_videos for all to authenticated
  using (true) with check (true);

-- RLS 정책과 별개로 표 자체의 기본 권한도 있어야 한다. SQL Editor로 표를 만들면
-- (Table Editor UI와 달리) 이게 자동으로 안 붙어서, 처음에 이 줄을 빼먹었다가
-- "permission denied for table home_videos"로 로그인해도 조회가 안 됐다(2026-09-16).
grant select, insert, update, delete on home_videos to authenticated;
revoke all on home_videos from anon;

-- ---------- 6) API가 들고 있는 스키마 목록 새로 읽기 ----------
notify pgrst, 'reload schema';

-- ---------- 7) 확인 ----------
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'home_videos'
 order by ordinal_position;
