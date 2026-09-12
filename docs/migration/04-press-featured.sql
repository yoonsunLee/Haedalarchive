-- Press 대표 기사(featured) 지원.
-- 02-target-schema.sql에 정의된 press.type(press_type enum, 'feature' 포함)을
-- 그대로 사용한다. 이미 적용되어 있다면 아무 것도 바뀌지 않는 no-op.
-- Supabase SQL Editor에서 한 번 실행하면 된다.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'press_type') then
    create type press_type as enum ('feature','interview','review','mention');
  end if;
end $$;

alter table press add column if not exists type press_type not null default 'mention';
