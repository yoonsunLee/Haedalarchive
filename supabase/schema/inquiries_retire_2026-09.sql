-- 문의 저장을 쓰지 않게 되어(2026-09-18 접수 경로를 국내 호스팅으로 전환) 관련 객체를 정리한다.
-- 지금은 문의가 홈페이지 폼 → 카페24 접수 → 작가 메일함으로만 가고, 데이터베이스에는 남지 않는다.
--
-- ※ 되돌릴 수 없다. 실행 전 관리 화면 문의함에서 남겨야 할 문의가 없는지 확인할 것.
--   (2026-09-18 확인: 시험 문의 2건뿐이어서 정리하기로 함)
--
-- 콘솔에서 따로 지울 것: Edge Function 'contact', Secrets(RESEND_API_KEY·TURNSTILE_SECRET)

-- ---------- 1) 마지막 확인 ----------
select count(*) as 지워질_문의수 from inquiries;

-- ---------- 2) 정리 ----------
drop trigger if exists trg_inquiries_log_change on inquiries;
drop trigger if exists trg_inquiries_closed_at  on inquiries;
drop trigger if exists trg_inquiry_admins_log   on inquiry_admins;

drop table if exists inquiry_access_log;
drop table if exists inquiry_admins;
drop table if exists inquiries;

drop function if exists inquiries_log_change();
drop function if exists inquiries_set_closed_at();
drop function if exists inquiry_admins_log();
drop function if exists log_inquiry_access(text, uuid, text);
drop function if exists is_inquiry_admin();

-- ---------- 3) 확인 ----------
-- 아무 줄도 나오지 않으면 정리 완료
select table_name from information_schema.tables
 where table_schema = 'public' and table_name like 'inquir%';
