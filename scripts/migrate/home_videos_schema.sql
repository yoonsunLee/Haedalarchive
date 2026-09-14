-- 홈 영상 히어로 기능(Phase 2) 테이블. Supabase SQL Editor에서 직접 실행하세요.
-- works 테이블의 RLS/컬럼 관례(soft delete + version 낙관적 동시성)를 그대로 따랐습니다.
-- 만약 실제 works 테이블의 RLS 정책 이름/조건이 아래와 다르면, 그쪽 관례에 맞춰 조정해주세요
-- (제가 Supabase 콘솔에 직접 접근할 수 없어서 admin.html의 사용 패턴만 보고 작성했습니다).

create table if not exists home_videos (
  id uuid primary key default gen_random_uuid(),
  name text,                         -- 관리용 메모, 홈페이지에는 노출 안 됨
  video_master text,                 -- 'sb:경로' 형식의 Storage 참조 (artwork-masters 버킷)
  work_id uuid references works(id) on delete set null,
  bg_color text not null default '#000000',
  ui_theme text not null default 'dark' check (ui_theme in ('light','dark')),
  sort_order int not null default 0,
  is_public boolean not null default false,
  mobile_image_fallback boolean not null default false,
  version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- update할 때마다 버전을 올려서, admin.html의 낙관적 동시성 체크
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

alter table home_videos enable row level security;

-- 로그인한 사용자(=작가 본인)만 전체 CRUD 가능. publish_sb.py는 service_role 키로
-- RLS를 우회해서 읽으므로 별도 정책이 필요 없다.
create policy "authenticated full access on home_videos"
  on home_videos
  for all
  to authenticated
  using (true)
  with check (true);
