-- 관리자 UI(haedal-archive)가 Supabase에 직접 CRUD 하기 위한 권한 설정 (2026-09-06)
-- anon 키는 공개 저장소(GitHub Pages)에 노출되므로, "로그인만 하면 통과"가 아니라
-- 지정된 관리자 계정(uid)일 때만 통과하도록 좁혀서 제3자 자가입/도용을 방어한다.
--
-- 실행 전제조건: Supabase Dashboard에서
--   1) Authentication > Providers > Email > "Allow new users to sign up" 끔
--   2) Authentication > Users > Add user 로 관리자 계정 생성
--   3) select id, email from auth.users; 로 uid 확인 후 아래 <ADMIN_UID_1>/<ADMIN_UID_2>를 치환
--
-- uid 값 자체는 이 레포(공개 저장소)에는 남기지 않는다. 실제 실행본은 Supabase SQL Editor에서만 관리.

-- 1) Postgres 권한(GRANT) — RLS와 별개로 필요
grant select, insert, update, delete on public.works            to authenticated;
grant select, insert, update, delete on public.editions         to authenticated;
grant select, insert, update, delete on public.exhibitions      to authenticated;
grant select, insert, update, delete on public.exhibition_works to authenticated;
grant select, insert, update, delete on public.press            to authenticated;
grant select, insert, update, delete on public.terminology      to authenticated;

-- 2) RLS 정책 — 지정된 관리자 계정만 전체 CRUD 허용
create policy "admin full access" on public.works
  for all to authenticated
  using (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'))
  with check (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'));

create policy "admin full access" on public.editions
  for all to authenticated
  using (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'))
  with check (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'));

create policy "admin full access" on public.exhibitions
  for all to authenticated
  using (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'))
  with check (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'));

create policy "admin full access" on public.exhibition_works
  for all to authenticated
  using (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'))
  with check (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'));

create policy "admin full access" on public.press
  for all to authenticated
  using (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'))
  with check (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'));

create policy "admin full access" on public.terminology
  for all to authenticated
  using (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'))
  with check (auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'));

-- 3) Storage — artwork-masters 버킷에 이미지 업로드/조회/교체/삭제 (다음 라운드에서 실사용)
create policy "admin storage all" on storage.objects
  for all to authenticated
  using (bucket_id = 'artwork-masters' and auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'))
  with check (bucket_id = 'artwork-masters' and auth.uid() in ('<ADMIN_UID_1>','<ADMIN_UID_2>'));
