-- activity_log 옛 열 정리 — 2026-09
--
-- activity_log 표가 이미 있었다. 쓰는 코드가 어디에도 없는(아카이브·홈페이지 저장소
-- 모두 검색) 옛 설계의 흔적이다:
--     occurred_at · entity · entity_id · entity_no · changes
--
-- 이게 두 가지 문제를 만든다.
--  1) 처음에 SQL이 "column \"at\" does not exist"로 막힌 진짜 원인이 이것이다.
--     create table if not exists가 이미 있는 표를 보고 통째로 건너뛰는 바람에
--     새 열이 하나도 안 생긴 채로 인덱스를 만들려 했다.
--  2) 옛 열에 NOT NULL이 걸려 있으면, 트리거가 기록을 넣을 때 그 열을 채우지
--     않으므로 INSERT가 실패한다. 저장은 되는데 기록만 조용히 안 남는다.
--
-- 아래는 표가 비어 있으면 옛 열을 지우고, 이미 쌓인 행이 있으면 지우지 않고
-- NOT NULL만 풀어 준다. 어느 쪽이든 기록이 정상으로 남게 된다.
--
-- Supabase 콘솔 → SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.

do $$
declare
  legacy text[] := array['occurred_at', 'entity', 'entity_id', 'entity_no', 'changes'];
  c      text;
  cnt    bigint;
  hit    int := 0;
begin
  execute 'select count(*) from activity_log' into cnt;

  foreach c in array legacy loop
    if exists (select 1 from information_schema.columns
                where table_schema = 'public'
                  and table_name   = 'activity_log'
                  and column_name  = c) then
      hit := hit + 1;
      if cnt = 0 then
        execute format('alter table activity_log drop column %I', c);
      else
        execute format('alter table activity_log alter column %I drop not null', c);
      end if;
    end if;
  end loop;

  if hit = 0 then
    raise notice '정리할 옛 열이 없습니다 — 이미 깨끗합니다.';
  elsif cnt = 0 then
    raise notice '표가 비어 있어 쓰이지 않던 옛 열 %개를 지웠습니다.', hit;
  else
    raise notice '기존 기록 %건이 있어 옛 열 %개는 두고 NOT NULL만 풀었습니다.', cnt, hit;
  end if;
end $$;

notify pgrst, 'reload schema';

-- ---------- 확인 ----------
-- id · logged_at · actor · table_name · row_id · action · label · old_row · new_row
-- 아홉 개만 남아 있으면 깨끗하게 정리된 것이다.
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'activity_log'
 order by ordinal_position;
