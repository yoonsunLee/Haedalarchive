-- 홈페이지 문의 폼 저장 테이블. Supabase SQL Editor에서 한 번 실행하세요.
--
-- 흐름: 홈페이지 Contact 폼 → Edge Function `contact`(service_role 키로 기록) → 이 테이블
--      → admin.html "문의함" 탭에서 확인·상태 변경
-- 방문자(anon)는 이 테이블에 직접 읽기·쓰기 권한이 없다. 기록은 서버 함수만 한다.
-- 개인정보(이름·이메일·문의 내용)가 들어가므로, 응대가 끝난 문의는 보관(archived) 후
-- 폼에 안내한 보관 기간(1년)이 지나면 삭제한다.

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('Artwork','Exhibition','Collaboration','Licensing','Other')),
  work_no text,                        -- 작품 문의일 때만 (예: HD-2026-011)
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  lang text not null default 'ko' check (lang in ('ko','en')),
  status text not null default 'new' check (status in ('new','replied','archived')),
  admin_note text,
  mail_sent boolean not null default false,  -- 작가 메일 발송 성공 여부(실패해도 문의는 저장됨)
  ip_hash text,                        -- 도배 방지용. 원래 IP는 저장하지 않고 해시만 남긴다
  version int not null default 1
);

create index if not exists inquiries_created_idx on inquiries (created_at desc);
create index if not exists inquiries_ip_recent_idx on inquiries (ip_hash, created_at desc);

-- admin.html의 낙관적 동시성 체크(.eq('version', ...))용 — 다른 테이블과 같은 관례
create or replace function inquiries_bump_version()
returns trigger language plpgsql as $$
begin
  new.version = coalesce(old.version, 1) + 1;
  return new;
end;
$$;
drop trigger if exists trg_inquiries_bump_version on inquiries;
create trigger trg_inquiries_bump_version
  before update on inquiries
  for each row execute function inquiries_bump_version();

alter table inquiries enable row level security;

-- 로그인한 사용자(=작가 본인)만 조회·상태 변경·삭제. 새 문의 기록은 service_role(서버 함수)만.
-- 개인정보라 삭제는 숨김 처리(deleted_at)가 아니라 실제 삭제로 한다.
drop policy if exists inquiries_admin_select on inquiries;
drop policy if exists inquiries_admin_update on inquiries;
drop policy if exists inquiries_admin_delete on inquiries;
create policy inquiries_admin_select on inquiries for select to authenticated using (true);
create policy inquiries_admin_update on inquiries for update to authenticated using (true) with check (true);
create policy inquiries_admin_delete on inquiries for delete to authenticated using (true);

-- SQL Editor로 만든 테이블은 기본 권한이 자동으로 안 붙는다(home_videos 때 겪은 문제).
grant select, update, delete on inquiries to authenticated;
revoke all on inquiries from anon;
