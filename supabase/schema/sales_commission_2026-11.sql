-- 판매 수수료·정산 — 2026-11
--
-- 갤러리·아트페어가 판매 대금을 받아 계약 비율만큼 떼고 작가에게 나눠 주는 경우를 적는 칸.
-- (예: 개인전 「나전칠기로 ART하는 法」은 갤러리비브가 입금을 받고 계약 비율대로 나눠 준다)
--
--   editions(작품 한 점의 판매 정보)
--     sale_exhibition_no — 어느 전시에서 팔렸는지(전시 ID, 예: EX-…). 비우면 전시 없이 판매
--     payee              — 대금을 받은 곳(예: 갤러리비브). 비우면 작가가 직접 받음
--     commission_rate    — 수수료율(0~1, 0.4 = 40%). 할인율과 같은 방식
--     commission_krw     — 수수료(원)
--     net_krw            — 작가 정산액(원) = 실거래가(없으면 판매가) − 수수료
--     settled_on         — 갤러리에서 작가 몫을 받은 날. 비우면 정산 전
--   exhibitions
--     commission_rate    — 이 전시의 계약 수수료율. 작품 판매 정보에서 이 전시를 고르면 들어간다
--                          (진행 중·예정 전시만. 지난 전시는 칸만 있고 비워 둬도 된다)
--
-- 모두 비공개 칸이다. 홈페이지 발행 스크립트(scripts/publish_sb.py)는 editions 를 읽지 않고,
-- exhibitions 도 필드를 하나씩 골라 내보내므로 이 칸들은 홈페이지로 나가지 않는다.
-- 어드민 작품 수정 화면의 '판매 정보'와 전시 수정 화면의 '판매 수수료율' 칸은 이 열들이 생겨야 열린다.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.

alter table editions add column if not exists sale_exhibition_no text;
alter table editions add column if not exists payee text;
alter table editions add column if not exists commission_rate numeric(4,3);
alter table editions add column if not exists commission_krw bigint;
alter table editions add column if not exists net_krw bigint;
alter table editions add column if not exists settled_on date;

alter table exhibitions add column if not exists commission_rate numeric(4,3);

-- 값이 엉뚱하게 들어가지 않도록 잠근다(먼저 지우고 다시 건다)
alter table editions drop constraint if exists editions_commission_rate_check;
alter table editions add constraint editions_commission_rate_check
  check (commission_rate is null or (commission_rate between 0 and 1));
alter table exhibitions drop constraint if exists exhibitions_commission_rate_check;
alter table exhibitions add constraint exhibitions_commission_rate_check
  check (commission_rate is null or (commission_rate between 0 and 1));

-- API가 들고 있는 스키마 목록 새로 읽기
notify pgrst, 'reload schema';

-- 확인: 7줄이 보이면 된 것
select table_name, column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and ((table_name = 'editions' and column_name in ('sale_exhibition_no','payee','commission_rate','commission_krw','net_krw','settled_on'))
     or (table_name = 'exhibitions' and column_name = 'commission_rate'))
 order by table_name, column_name;
