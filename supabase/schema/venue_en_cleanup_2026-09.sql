-- 전시 장소 영문 표기 통일 — 2026-09
--
-- 같은 장소를 서로 다르게 적어 둔 것들이 영문 홈페이지에 그대로 나가고 있었다.
--   코엑스   : COEX, Seoul, KR  /  Coex, Seoul, Korea   → COEX, Seoul, Korea
--   신라호텔 : Shilla Hotel, Seoul (나라 없음)           → Shilla Hotel, Seoul, Korea
--   나라     : ", KR" 로 끝나던 10건                     → ", Korea"
--
-- 루브르 카루젤(Paris, France)은 그대로 둔다(운영자 결정).
-- 요코하마 시민갤러리의 JPN 도 이번 정리 대상이 아니다.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.
-- 돌린 뒤 아카이브를 새로고침하고, 홈페이지에는 '🚀 홈페이지에 반영'으로 내보낸다.

-- ① 바뀌기 전 모습 확인 (먼저 여기까지만 돌려 봐도 된다)
select exhibition_no, venue_ko, venue_en as "지금"
  from exhibitions
 where venue_en like '%, KR'
    or venue_ko in ('코엑스, 서울, 대한민국', '신라호텔, 서울, 대한민국')
 order by exhibition_no;

-- ② 나라 표기를 Korea 로
update exhibitions
   set venue_en = left(venue_en, length(venue_en) - 4) || ', Korea'
 where venue_en like '%, KR';

-- ③ 코엑스를 대문자로 (Coex / COEX 가 섞여 있었다)
update exhibitions
   set venue_en = 'COEX, Seoul, Korea'
 where venue_ko = '코엑스, 서울, 대한민국';

-- ④ 신라호텔에 나라 붙이기
update exhibitions
   set venue_en = 'Shilla Hotel, Seoul, Korea'
 where venue_ko = '신라호텔, 서울, 대한민국';

-- ⑤ 결과 확인 — 장소마다 영문이 하나씩만 나와야 한다
select venue_ko, venue_en, count(*) as "전시 수"
  from exhibitions
 where deleted_at is null
 group by venue_ko, venue_en
 order by venue_ko;
