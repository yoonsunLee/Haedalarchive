-- admin.html의 "도슨트" 섹션(홈페이지 음성 해설 노출 on/off)이 쓰는 docent_enabled 컬럼이
-- 실제로는 works 테이블에 없었던 것으로 확인됨(마이그레이션 파일 누락, 수동 추가도 안 된 상태).
-- Supabase SQL Editor에서 한 번 실행하면 된다. 이미 있으면 no-op.

alter table works add column if not exists docent_enabled boolean not null default false;
