-- exhibitions.affiliation — 전시 소속·계약 메모(비공개) — 2026-09
--
-- 아트페어 등에 어느 갤러리 소속으로 참가하는지, 개인 참가인지, 계약 조건 한 줄을 적어 두는 열.
-- 관리 화면에서만 보이고 홈페이지로 나가지 않는다 — 발행 스크립트(publish_sb.py)가 공개할 필드를
-- 하나씩 명시해서 뽑기 때문에 이 열은 원래부터 공개 대상이 아니다.
-- 계약서 파일은 올리지 않는다: 계약서에는 상대방의 이름·연락처·계좌가 들어 있어 개인정보이고,
-- 처리방침에 '작품 매매 계약의 개인정보는 국외로 이전하지 않는다'고 밝혀 두었는데
-- 이 저장소의 저장 위치가 국내라고 확인된 것이 아니기 때문이다. 원본은 따로 보관하고 요약만 남긴다.
-- 아카이브 전시 수정 화면의 '소속 · 계약' 칸은 이 열이 생겨야 열린다.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.

alter table exhibitions add column if not exists affiliation text;

-- API가 들고 있는 스키마 목록 새로 읽기
notify pgrst, 'reload schema';

-- 확인: affiliation 한 줄이 보이면 된 것
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'exhibitions' and column_name = 'affiliation';
