-- exhibitions.home_lead_days · home_mode — 홈 첫 화면 전시 노출 조절 — 2026-09
--
-- 홈 첫 화면 아래 작품 구역은 Recent works → Upcoming exhibition → Now on view 로 바뀐다.
-- 지금은 모든 전시가 똑같이 "개막 30일 전"부터 예고되고, 전시가 겹치면 어느 쪽이 뜰지
-- 정해 둔 규칙이 없다(전시 ID가 빠른 쪽이 우연히 이긴다). 이 두 열이 그것을 조절한다.
--
--   home_lead_days — 이 전시를 며칠 전부터 예고할지. 비워 두면 30일(모든 전시의 기본값).
--                    예: 개인전을 45일 전부터 알리고 싶으면 45.
--   home_mode      — 'auto' 규칙대로(기본) / 'pin' 겹칠 때 이 전시를 앞세움 / 'hide' 홈
--                    첫 화면에 내보내지 않음. 'hide' 여도 전시 이력·About 에는 그대로 남는다.
--
-- 겹칠 때의 차례는 ① pin ② 개인전 > 단체전 > 아트페어 ③ 진행 중인 것 ④ 개막이 이른 것 이고,
-- 큰 카드 하나 + 나머지는 한 줄로 최대 3건까지 보여 준다(2026-09-25 운영자 결정).
-- 아카이브 전시 수정 화면의 '홈 노출' 칸은 이 열들이 생겨야 열린다.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.

alter table exhibitions add column if not exists home_lead_days integer;
alter table exhibitions add column if not exists home_mode text not null default 'auto';

-- 값이 엉뚱하게 들어가지 않도록 잠근다.
-- 먼저 지우고 다시 거는 방식이라 여러 번 실행해도 탈이 없다(add constraint 에는 if not exists 가 없다).
alter table exhibitions drop constraint if exists exhibitions_home_mode_check;
alter table exhibitions add constraint exhibitions_home_mode_check
  check (home_mode in ('auto', 'pin', 'hide'));

alter table exhibitions drop constraint if exists exhibitions_home_lead_days_check;
alter table exhibitions add constraint exhibitions_home_lead_days_check
  check (home_lead_days is null or (home_lead_days between 0 and 365));

-- API가 들고 있는 스키마 목록 새로 읽기
notify pgrst, 'reload schema';

-- 확인: home_lead_days · home_mode 두 줄이 보이면 된 것
select column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'exhibitions'
   and column_name in ('home_lead_days', 'home_mode')
 order by column_name;
