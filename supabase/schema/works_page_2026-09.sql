-- Works 페이지 구성 — 2026-09
--
-- 1) works.display_order  : 홈페이지 목록 순서(작은 수부터). 비우면 그 뒤에 최신순
-- 2) works.series_order   : 연작 안 순서(작은 수부터). 비우면 작품번호 순
-- 3) series               : 연작 이름(국·영)과 '두 폭 붙이기'(ㅁㅁ처럼 두 작품을 한 단위로 보여 줄지)
--                           연작 키는 작품의 series_key(아카이브 '시리즈 키' 칸)와 같은 값
-- 4) site_settings        : 사이트 설정 한 줄씩. 지금은 'works_selected'(Selected works에 넣을 작품 id 목록)
--
-- 다시 돌려도 안전하고, 돌릴 때마다 실제 표가 이 파일과 같아진다(README 규칙).
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run.

-- ---------- 1·2) 작품 순서 ----------
alter table works add column if not exists display_order int;
alter table works add column if not exists series_order  int;

-- ---------- 3) 연작 ----------
create table if not exists series (
  key text primary key
);
alter table series add column if not exists name_ko    text;
alter table series add column if not exists name_en    text;
alter table series add column if not exists joined     boolean     not null default false;
alter table series add column if not exists created_at timestamptz not null default now();
alter table series add column if not exists updated_at timestamptz not null default now();

-- ---------- 4) 사이트 설정 ----------
create table if not exists site_settings (
  key text primary key
);
alter table site_settings add column if not exists value      jsonb;
alter table site_settings add column if not exists updated_at timestamptz not null default now();

-- ---------- 권한 ----------
-- 로그인한 사용자(작가·운영자)만 읽고 쓴다. 발행(GitHub Actions)은 service_role로 읽는다.
-- SQL Editor로 만든 표는 기본 권한이 자동으로 안 붙으니 grant까지 적는다(home_videos에서 겪음).
alter table series enable row level security;
drop policy if exists "authenticated full access on series" on series;
create policy "authenticated full access on series"
  on series for all to authenticated using (true) with check (true);
grant select, insert, update, delete on series to authenticated;
grant select on series to service_role;
revoke all on series from anon;

alter table site_settings enable row level security;
drop policy if exists "authenticated full access on site_settings" on site_settings;
create policy "authenticated full access on site_settings"
  on site_settings for all to authenticated using (true) with check (true);
grant select, insert, update, delete on site_settings to authenticated;
grant select on site_settings to service_role;
revoke all on site_settings from anon;

-- ---------- 작업 기록(되살리기용) ----------
-- activity_log_2026-09.sql 의 log_activity()가 있으면 두 표에도 건다.
do $$
begin
  if exists (select 1 from pg_proc where proname = 'log_activity') then
    execute 'drop trigger if exists trg_log_series on series';
    execute 'create trigger trg_log_series after insert or update or delete on series for each row execute function log_activity()';
    execute 'drop trigger if exists trg_log_site_settings on site_settings';
    execute 'create trigger trg_log_site_settings after insert or update or delete on site_settings for each row execute function log_activity()';
  end if;
end $$;

-- ---------- API가 들고 있는 스키마 목록 새로 읽기 ----------
notify pgrst, 'reload schema';

-- ---------- 확인 ----------
-- works에 display_order·series_order, series 5개 열, site_settings 3개 열이 보이면 된 것
select table_name, column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and ((table_name = 'works' and column_name in ('display_order', 'series_order'))
        or table_name in ('series', 'site_settings'))
 order by table_name, ordinal_position;
