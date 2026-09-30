-- 자료를 읽고 고치려면 2단계 인증까지 마치게 한다 — 2026-09
--
-- 지금은 비밀번호만 맞으면(aal1) 표를 읽고 고칠 수 있다. 2단계 인증은 admin.html 의
-- 자바스크립트가 막는 것이라, 공격자가 그 화면을 안 쓰고 API 로 바로 붙으면 소용이 없다.
-- 비밀번호가 새는 경우(피싱·재사용·유출) 소장자 이름과 실거래가까지 읽힌다.
-- 「홈페이지에 반영」은 이미 aal2 를 요구하므로 홈페이지를 건드리지는 못한다.
--
-- 이 파일은 **기존 정책을 하나도 건드리지 않는다.** 표마다 '제한 정책'을 하나씩 더 얹을 뿐이다.
-- 제한 정책은 기존 정책과 AND 로 묶이므로, 원래 되던 일에 "2단계 인증까지 마쳤을 것"이
-- 조건으로 하나 붙는 셈이다. 지우면 그대로 원래대로 돌아간다(맨 아래 되돌리기 참고).
--
-- service_role(발행 스크립트 publish_sb.py, Edge Function)은 RLS 자체를 건너뛰므로 영향이 없다.
-- 홈페이지 방문자(anon)는 지금도 아무것도 못 읽으니 역시 영향이 없다.
--
-- Supabase 콘솔 → SQL Editor 에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.
--
-- ※ 돌린 뒤에는 관리 화면에서 한 번 로그아웃하고 다시 로그인해야 한다.
--    지금 열려 있는 창은 2단계 인증 전 상태(aal1)일 수 있어 자료가 안 보일 수 있다.
--    안 보이면 당황하지 말고 로그아웃 → 다시 로그인(인증 앱 숫자까지) 하면 된다.


-- ① 지금 걸려 있는 정책 확인 (바꾸기 전 모습을 남겨 둔다)
select tablename, policyname, permissive, roles, cmd
  from pg_policies
 where schemaname = 'public'
 order by tablename, policyname;


-- ② 2단계 인증을 마쳤는지 보는 조건
--    Supabase 가 발급한 토큰의 aal 값이 'aal2' 여야 한다(인증 앱 숫자까지 넣은 상태).
create or replace function public.has_2fa()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

grant execute on function public.has_2fa() to authenticated;


-- ③ 표마다 제한 정책을 하나씩 얹는다.
--    as restrictive = 기존 정책과 AND 로 묶인다(기존 정책을 대체하지 않는다).
--    to authenticated = 로그인한 사람에게만 건다. service_role·anon 은 그대로.
drop policy if exists require_2fa on public.works;
create policy require_2fa on public.works as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.editions;
create policy require_2fa on public.editions as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.exhibitions;
create policy require_2fa on public.exhibitions as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.exhibition_works;
create policy require_2fa on public.exhibition_works as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.press;
create policy require_2fa on public.press as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.home_videos;
create policy require_2fa on public.home_videos as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.site_settings;
create policy require_2fa on public.site_settings as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.work_photos;
create policy require_2fa on public.work_photos as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.work_media_links;
create policy require_2fa on public.work_media_links as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.series;
create policy require_2fa on public.series as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

drop policy if exists require_2fa on public.activity_log;
create policy require_2fa on public.activity_log as restrictive to authenticated
  using (public.has_2fa()) with check (public.has_2fa());

-- works_status 는 뷰라 정책을 걸 수 없다. 기반 표(works·editions)를 따라가므로 함께 보호된다.


-- ④ 제대로 얹혔는지 확인 — 표 11개가 restrictive=false 로 나와야 한다
--    (pg_policies 는 제한 정책을 permissive='RESTRICTIVE' 로 적는다)
select tablename, policyname, permissive
  from pg_policies
 where schemaname = 'public' and policyname = 'require_2fa'
 order by tablename;


-- ─────────────────────────────────────────────────────────────
-- 되돌리기 — 관리 화면에 못 들어가게 되면 아래만 통째로 돌리면 원래대로 온다
-- ─────────────────────────────────────────────────────────────
-- drop policy if exists require_2fa on public.works;
-- drop policy if exists require_2fa on public.editions;
-- drop policy if exists require_2fa on public.exhibitions;
-- drop policy if exists require_2fa on public.exhibition_works;
-- drop policy if exists require_2fa on public.press;
-- drop policy if exists require_2fa on public.home_videos;
-- drop policy if exists require_2fa on public.site_settings;
-- drop policy if exists require_2fa on public.work_photos;
-- drop policy if exists require_2fa on public.work_media_links;
-- drop policy if exists require_2fa on public.series;
-- drop policy if exists require_2fa on public.activity_log;
-- drop function if exists public.has_2fa();
