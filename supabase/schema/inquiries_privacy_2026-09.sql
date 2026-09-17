-- 개인정보 처리방침(2026-09-17 시행)에 맞춘 문의함 보완. Supabase SQL Editor에서 한 번 실행하세요.
-- inquiries_schema.sql을 먼저 실행해 둔 상태를 전제로 한다. 여러 번 실행해도 결과가 같도록 썼다.
--
-- 1) 동의 기록: 수집·이용 동의, 국외 이전 동의, 동의한 고지문 버전 (동의 시각 = created_at)
-- 2) 처리 완료 시각(closed_at): 보관기간 '처리 완료 후 1년'의 기준
-- 3) 지정 관리자 + 2단계 인증: 문의함은 inquiry_admins에 등록된 계정이 2단계 인증(aal2)으로 로그인했을 때만 접근
-- 4) 접속 기록(inquiry_access_log): 목록·상세 열람, 상태 변경, 삭제, 관리자 지정·해제, 월간 점검을 1년 이상 보관
--    (「개인정보의 안전성 확보조치 기준」 접속기록 보관·점검, 권한 부여 기록 보관)

-- ---------- 1) 동의 기록 · 2) 처리 완료 시각 ----------
alter table inquiries add column if not exists consent_collect  boolean not null default false;
alter table inquiries add column if not exists consent_transfer boolean not null default false;
alter table inquiries add column if not exists notice_version   text;
alter table inquiries add column if not exists closed_at        timestamptz;

-- 상태가 '새 문의'에서 다른 상태(답장함·보관)로 처음 바뀌는 순간을 처리 완료로 기록한다.
-- 다시 '새 문의'로 되돌리면 비운다(다시 처리하면 그때부터 1년).
create or replace function inquiries_set_closed_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'new' then
    new.closed_at = null;
  elsif old.status = 'new' and new.closed_at is null then
    new.closed_at = now();
  end if;
  return new;
end;
$$;
drop trigger if exists trg_inquiries_closed_at on inquiries;
create trigger trg_inquiries_closed_at
  before update on inquiries
  for each row execute function inquiries_set_closed_at();

-- 처리방침 시행 전에 이미 답장함·보관 상태였던 문의는 처리 완료 시각을 알 수 없으므로,
-- 이 SQL을 실행한 시점을 처리 완료로 보고 그때부터 1년을 센다(기존 문의를 일괄 삭제하지 않기 위한 처리).
update inquiries set closed_at = now() where status <> 'new' and closed_at is null;

-- ---------- 3) 지정 관리자 ----------
create table if not exists inquiry_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  granted_at timestamptz not null default now()
);
alter table inquiry_admins enable row level security;
drop policy if exists inquiry_admins_self on inquiry_admins;
create policy inquiry_admins_self on inquiry_admins for select to authenticated using (user_id = auth.uid());
grant select on inquiry_admins to authenticated;
revoke all on inquiry_admins from anon;

-- 문의함 접근 조건: 지정 관리자 + 이번 로그인에서 2단계 인증 완료
create or replace function is_inquiry_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from inquiry_admins where user_id = auth.uid())
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;
revoke all on function is_inquiry_admin() from public, anon;
grant execute on function is_inquiry_admin() to authenticated;

drop policy if exists inquiries_admin_select on inquiries;
drop policy if exists inquiries_admin_update on inquiries;
drop policy if exists inquiries_admin_delete on inquiries;
create policy inquiries_admin_select on inquiries for select to authenticated using (is_inquiry_admin());
create policy inquiries_admin_update on inquiries for update to authenticated using (is_inquiry_admin()) with check (is_inquiry_admin());
create policy inquiries_admin_delete on inquiries for delete to authenticated using (is_inquiry_admin());

-- ---------- 4) 접속 기록 ----------
create table if not exists inquiry_access_log (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  user_id    uuid,
  email      text,
  action     text not null check (action in ('list','view','update','delete','grant','revoke','review')),
  inquiry_id uuid,
  detail     text
);
create index if not exists inquiry_access_log_at_idx on inquiry_access_log (at desc);
alter table inquiry_access_log enable row level security;
drop policy if exists inquiry_access_log_select on inquiry_access_log;
create policy inquiry_access_log_select on inquiry_access_log for select to authenticated using (is_inquiry_admin());
grant select on inquiry_access_log to authenticated;
revoke all on inquiry_access_log from anon;
-- 기록은 아래 함수·트리거로만 쌓인다(화면에서 직접 쓰거나 지울 수 없음 → 기록 위조 방지).
-- id 순번 사용 권한도 주지 않는다.

-- 화면에서 부르는 열람·점검 기록 (목록 보기, 상세 보기, 월간 점검 완료)
create or replace function log_inquiry_access(p_action text, p_inquiry uuid default null, p_detail text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_inquiry_admin() then
    raise exception 'not allowed';
  end if;
  if p_action not in ('list','view','review') then
    raise exception 'bad action';
  end if;
  insert into inquiry_access_log (user_id, email, action, inquiry_id, detail)
  values (auth.uid(), auth.jwt() ->> 'email', p_action, p_inquiry, left(p_detail, 200));
end;
$$;
revoke all on function log_inquiry_access(text, uuid, text) from public, anon;
grant execute on function log_inquiry_access(text, uuid, text) to authenticated;

-- 상태 변경·삭제는 자동 기록. 접수 함수(service_role)가 메일 발송 여부를 고치는 것은 사람의 접속이 아니므로 제외.
create or replace function inquiries_log_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  insert into inquiry_access_log (user_id, email, action, inquiry_id, detail)
  values (
    auth.uid(), auth.jwt() ->> 'email', lower(tg_op), coalesce(new.id, old.id),
    case when tg_op = 'UPDATE' and new.status is distinct from old.status then old.status || ' → ' || new.status end
  );
  return coalesce(new, old);
end;
$$;
drop trigger if exists trg_inquiries_log_change on inquiries;
create trigger trg_inquiries_log_change
  after update or delete on inquiries
  for each row execute function inquiries_log_change();

-- 관리자 지정·해제 기록 (3년 이상 보관 대상)
create or replace function inquiry_admins_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into inquiry_access_log (user_id, email, action, detail)
  values (
    coalesce(new.user_id, old.user_id), coalesce(new.email, old.email),
    case when tg_op = 'INSERT' then 'grant' else 'revoke' end,
    '문의함 관리자 ' || case when tg_op = 'INSERT' then '지정' else '해제' end
  );
  return coalesce(new, old);
end;
$$;
drop trigger if exists trg_inquiry_admins_log on inquiry_admins;
create trigger trg_inquiry_admins_log
  after insert or delete on inquiry_admins
  for each row execute function inquiry_admins_log();

-- ---------- 관리자 지정 ----------
-- 회원가입이 꺼져 있어 지금 로그인 계정은 운영자가 만든 계정뿐이다. 그 계정을 모두 문의함 관리자로 지정한다.
-- 실행 뒤 결과 표에 나오는 이메일이 실제 관리자 두 분인지 꼭 확인하세요. 아니면 해당 줄을 delete로 해제합니다.
insert into inquiry_admins (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

select email, granted_at from inquiry_admins order by granted_at;

-- 관리자 해제 예시 (필요할 때만)
-- delete from inquiry_admins where email = '해제할@이메일';
