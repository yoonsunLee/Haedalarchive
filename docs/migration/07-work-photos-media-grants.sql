-- 05-work-photos-and-media.sql에서 work_photos/work_media_links 테이블을 만들 때
-- RLS·권한 부여를 빠뜨려서 "permission denied for table work_photos"가 났다.
-- 기존 works 등 다른 테이블과 동일한 방식(로그인한 관리자만 전체 접근, anon은 접근 불가,
-- 발행 파이프라인이 쓰는 service_role에도 별도 GRANT 필요)으로 맞춘다.
-- Supabase SQL Editor에서 한 번 실행하면 된다. 이미 적용돼 있으면 no-op.

alter table work_photos      enable row level security;
alter table work_media_links enable row level security;

drop policy if exists work_photos_admin      on work_photos;
drop policy if exists work_media_links_admin on work_media_links;
create policy work_photos_admin      on work_photos      for all to authenticated using (true) with check (true);
create policy work_media_links_admin on work_media_links for all to authenticated using (true) with check (true);

grant select, insert, update, delete on work_photos, work_media_links to authenticated;
grant select, insert, update, delete on work_photos, work_media_links to service_role;
