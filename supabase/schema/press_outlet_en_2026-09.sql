-- press.outlet_en — 기사 매체명(영문) — 2026-09
--
-- 홈페이지 영문 화면에서 매체명이 한글로만 나오던 것을 영문으로 보여 주기 위한 열.
-- 비워 두면 영문 화면에서도 한글 매체명(outlet_ko)이 대신 나온다.
-- 아카이브 기사 수정 화면의 '매체명 (영문)' 칸은 이 열이 생겨야 열린다.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.

alter table press add column if not exists outlet_en text;

-- API가 들고 있는 스키마 목록 새로 읽기
notify pgrst, 'reload schema';

-- 확인: outlet_en 한 줄이 보이면 된 것
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'press' and column_name = 'outlet_en';
