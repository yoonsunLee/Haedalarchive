-- 전시별 배치 아카이브(전시 시뮬레이터) — 2026-11
--
-- 참가한 전시마다 시뮬레이터에서 꾸민 벽·작품 배치를 저장해 둔다. 어드민 「전시 시뮬레이터」의
-- 「전시 불러오기」/「이 전시 배치 저장」이 쓴다. 나중에 홈페이지에 전시 구성을 보여 줄 때 이 표를 읽는다.
--   state  : 시뮬레이터 프로젝트 상태 그대로(벽·작품 위치·장애물 등). 사진(data URL)은 빼고 저장한다
--   images : 사진 출처 {사진id: {"work":"작품 uuid"} | {"file":"sb:layouts/…jpg"}}
--            작품 사진은 작품 자료에서 다시 불러오고, 벽 사진처럼 따로 넣은 사진만 저장소에 올린다
--
-- 다시 돌려도 안전하다. Supabase 콘솔 → SQL Editor 에 통째로 붙여넣고 Run.

create table if not exists exhibition_layouts (
  exhibition_id text primary key          -- exhibitions.id(어드민이 쓰는 전시 고유값)를 글자로
);
alter table exhibition_layouts add column if not exists state     jsonb;
alter table exhibition_layouts add column if not exists images    jsonb not null default '{}'::jsonb;
alter table exhibition_layouts add column if not exists saved_at  timestamptz not null default now();
alter table exhibition_layouts add column if not exists saved_by  text;


alter table exhibition_layouts enable row level security;
-- 표 권한(2026-11-21): 이 프로젝트는 새 표에 로그인 사용자 권한이 저절로 붙지 않아 'permission denied for table' 이 났다
grant select, insert, update, delete on exhibition_layouts to authenticated;
drop policy if exists "authenticated full access on exhibition_layouts" on exhibition_layouts;
create policy "authenticated full access on exhibition_layouts"
  on exhibition_layouts for all to authenticated using (true) with check (true);
do $$ begin
  if exists (select 1 from pg_proc where proname = 'has_2fa') then
    execute 'drop policy if exists require_2fa on public.exhibition_layouts';
    execute 'create policy require_2fa on public.exhibition_layouts as restrictive to authenticated using (public.has_2fa()) with check (public.has_2fa())';
  end if;
end $$;

select column_name, data_type from information_schema.columns where table_name = 'exhibition_layouts' order by ordinal_position;
