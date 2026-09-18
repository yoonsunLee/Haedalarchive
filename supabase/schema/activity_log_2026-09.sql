-- 작업 기록(activity_log) — 2026-09
--
-- 관리 화면에서 무엇을 언제 누가 바꿨는지 데이터베이스가 직접 남긴다.
-- 화면에서 부르는 기록이 아니라 테이블에 걸어둔 트리거라, 관리 화면을 거치지
-- 않은 변경(SQL 편집기에서 직접 고친 것 포함)도 똑같이 남는다.
--
-- 남기는 목적은 두 가지다.
--  1) 되살리기 — 지워지거나 덮어쓴 값을 old_row(바꾸기 전 전체 내용)에서 되찾는다.
--     특히 전시를 지울 때 함께 지워지는 출품 작품 관계(exhibition_works)는
--     소프트 삭제가 아니라 진짜 삭제라, 이 기록이 유일한 복구 수단이다.
--  2) 접속기록 — 작품의 소장자(owner)처럼 개인정보에 해당하는 항목이 있으므로
--     「개인정보의 안전성 확보조치 기준」에 따라 1년 이상 보관한다. 지우지 말 것.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run 하면 된다. 여러 번 실행해도 안전하다.

-- ---------- 1) 기록 테이블 ----------
create table if not exists activity_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  actor       text,          -- 로그인한 사람의 이메일 (없으면 'system')
  table_name  text not null, -- works / editions / exhibitions / exhibition_works / press / home_videos
  row_id      text,          -- 대상 행의 id (exhibition_works처럼 id가 없으면 비어 있음)
  action      text not null, -- insert / update / soft_delete / restore / delete
  label       text,          -- 사람이 알아볼 이름 (작품명·전시명 등)
  old_row     jsonb,         -- 바꾸기 전 전체 내용 (되살릴 때 쓴다)
  new_row     jsonb          -- 바꾼 뒤 전체 내용
);

create index if not exists activity_log_at_idx  on activity_log (at desc);
create index if not exists activity_log_row_idx on activity_log (table_name, row_id, at desc);

-- 읽기는 로그인한 사람만. 쓰기는 아무도 못 한다(아래 트리거만 기록한다).
alter table activity_log enable row level security;
drop policy if exists activity_log_select on activity_log;
create policy activity_log_select on activity_log
  for select to authenticated using (true);
grant select on activity_log to authenticated;
revoke all on activity_log from anon;

-- ---------- 2) 기록하는 트리거 ----------
create or replace function log_activity() returns trigger
language plpgsql
security definer          -- 기록은 항상 남아야 하므로 RLS를 우회한다
set search_path = public
as $$
declare
  o    jsonb := case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end;
  n    jsonb := case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end;
  noise text[] := array['version', 'updated_at'];  -- 저장할 때마다 자동으로 바뀌는 값
  act  text;
  lbl  text;
begin
  if TG_OP = 'INSERT' then
    act := 'insert';
  elsif TG_OP = 'DELETE' then
    act := 'delete';
  elsif (o ? 'deleted_at') and (o->>'deleted_at') is null and (n->>'deleted_at') is not null then
    act := 'soft_delete';
  elsif (o ? 'deleted_at') and (o->>'deleted_at') is not null and (n->>'deleted_at') is null then
    act := 'restore';
  else
    act := 'update';
  end if;

  -- 실제로 바뀐 값이 없는 저장은 기록하지 않는다(목록이 지저분해진다)
  if act = 'update' and (o - noise) = (n - noise) then
    return null;
  end if;

  lbl := nullif(coalesce(
           n->>'title_ko', o->>'title_ko',   -- 작품·전시·기사
           n->>'name',     o->>'name',       -- 홈 영상
           n->>'work_no',  o->>'work_no',
           ''), '');

  -- 출품 작품 관계는 제 이름이 없으니 전시명을 빌려 쓴다
  if TG_TABLE_NAME = 'exhibition_works' then
    select e.title_ko || ' — 출품 작품' into lbl
      from exhibitions e
     where e.id = coalesce(n->>'exhibition_id', o->>'exhibition_id')::uuid;
  end if;

  insert into activity_log (actor, table_name, row_id, action, label, old_row, new_row)
  values (
    coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', 'system'),
    TG_TABLE_NAME,
    coalesce(n->>'id', o->>'id'),
    act, lbl, o, n
  );
  return null;
end $$;

-- ---------- 3) 테이블마다 걸기 ----------
drop trigger if exists trg_log_works on works;
create trigger trg_log_works after insert or update or delete on works
  for each row execute function log_activity();

drop trigger if exists trg_log_editions on editions;
create trigger trg_log_editions after insert or update or delete on editions
  for each row execute function log_activity();

drop trigger if exists trg_log_exhibitions on exhibitions;
create trigger trg_log_exhibitions after insert or update or delete on exhibitions
  for each row execute function log_activity();

drop trigger if exists trg_log_exhibition_works on exhibition_works;
create trigger trg_log_exhibition_works after insert or update or delete on exhibition_works
  for each row execute function log_activity();

drop trigger if exists trg_log_press on press;
create trigger trg_log_press after insert or update or delete on press
  for each row execute function log_activity();

drop trigger if exists trg_log_home_videos on home_videos;
create trigger trg_log_home_videos after insert or update or delete on home_videos
  for each row execute function log_activity();
