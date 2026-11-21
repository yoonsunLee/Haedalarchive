-- 공간 연출(View in a room) — 2026-11
--
-- 작품 사진을 호텔·거실·침실 같은 배경 벽에 실제 크기로 걸어 보인 합성 이미지.
-- 어드민 「작품 관리」의 「배경 관리」 창에서 배경을 올리고 기준(크기·기준선·벽 범위)을 정하면,
-- 작품 편집의 「공간 연출」 칸이 배경을 골라 이미지를 만들어 상세 사진(work_photos)으로 저장한다.
-- 홈페이지 발행은 지금처럼 work_photos 를 읽으므로 따로 바꿀 것이 없다.
--
-- 다시 돌려도 안전하다(있으면 두고 없으면 만든다). 기존 표·자료를 지우지 않는다.
-- Supabase 콘솔 → SQL Editor 에 통째로 붙여넣고 Run.

-- ---------- 1) 배경 목록 ----------
create table if not exists room_backgrounds (
  id text primary key                       -- 'bg-1731700000000' 처럼 어드민이 만든다
);
alter table room_backgrounds add column if not exists name        text;                         -- 'L3 갤러리풍 거실'
alter table room_backgrounds add column if not exists tier        text    not null default 'lux'; -- lux = 1순위 고급, apt = 2순위 아파트
alter table room_backgrounds add column if not exists image_file  text;                         -- 'sb:rooms/…jpg' (artwork-masters 버킷)
alter table room_backgrounds add column if not exists img_w       int;                          -- 배경 그림 크기(px)
alter table room_backgrounds add column if not exists img_h       int;
alter table room_backgrounds add column if not exists px_per_cm   numeric;                      -- 벽면에서 1 cm 가 몇 px 인지(가구 폭으로 잰다)
alter table room_backgrounds add column if not exists meas_px     numeric;                      -- 크기 기준: 가구 양 끝 사이 거리(px)
alter table room_backgrounds add column if not exists meas_cm     numeric;                      -- 그 가구의 실제 폭(cm). px_per_cm = meas_px / meas_cm
alter table room_backgrounds add column if not exists line_y      numeric;                      -- 기준선(가구 윗선 등)의 y(px)
alter table room_backgrounds add column if not exists line_cm     numeric;                      -- 그 기준선의 바닥에서 높이(cm)
alter table room_backgrounds add column if not exists gap_cm      numeric not null default 22;  -- 작품 아랫변을 기준선 위 몇 cm 에 둘지. 0 이면 가구 없는 빈 벽 → 작품 가운데를 바닥에서 145 cm
alter table room_backgrounds add column if not exists zone        jsonb;                        -- 작품을 걸 수 있는 빈 벽 {x,y,w,h}(px)
alter table room_backgrounds add column if not exists is_active   boolean not null default true; -- 자동 선택에 쓰기
alter table room_backgrounds add column if not exists sort_order  int     not null default 0;
alter table room_backgrounds add column if not exists updated_at  timestamptz not null default now();
alter table room_backgrounds add column if not exists created_at  timestamptz not null default now();

alter table room_backgrounds drop constraint if exists room_backgrounds_tier_check;
alter table room_backgrounds add  constraint room_backgrounds_tier_check check (tier in ('lux', 'apt'));

alter table room_backgrounds enable row level security;
-- 표 권한(2026-11-21): 이 프로젝트는 새 표에 로그인 사용자 권한이 저절로 붙지 않아 'permission denied for table' 이 났다
grant select, insert, update, delete on room_backgrounds to authenticated;
drop policy if exists "authenticated full access on room_backgrounds" on room_backgrounds;
create policy "authenticated full access on room_backgrounds"
  on room_backgrounds for all to authenticated using (true) with check (true);
-- 다른 표와 같이 2단계 인증까지 마쳐야 읽고 고친다(require_2fa_2026-09.sql 의 has_2fa 가 있으면)
do $$ begin
  if exists (select 1 from pg_proc where proname = 'has_2fa') then
    execute 'drop policy if exists require_2fa on public.room_backgrounds';
    execute 'create policy require_2fa on public.room_backgrounds as restrictive to authenticated using (public.has_2fa()) with check (public.has_2fa())';
  end if;
end $$;

-- ---------- 2) 상세 사진에 '공간 연출' 표시 ----------
-- room_bg 가 있으면 공간 연출 이미지다(상세 사진 칸에는 안 보이고 「공간 연출」 칸에서만 다룬다).
alter table work_photos add column if not exists room_bg     text;     -- room_backgrounds.id
alter table work_photos add column if not exists room_dx_cm  numeric;  -- 기본 자리에서 옮긴 거리(cm, 오른쪽 +)
alter table work_photos add column if not exists room_dy_cm  numeric;  -- (cm, 위 +)
alter table work_photos add column if not exists room_key    text;     -- 만들 때 쓴 값(작품 사진·크기·배경·위치)의 지문. 달라지면 다시 만든다

alter table work_photos drop constraint if exists work_photos_room_bg_fkey;
alter table work_photos add  constraint work_photos_room_bg_fkey
  foreign key (room_bg) references room_backgrounds(id) on delete set null;

-- ---------- 확인 ----------
select column_name from information_schema.columns
 where table_name in ('room_backgrounds', 'work_photos') and column_name like any (array['room%', 'px_per_cm', 'zone', 'tier'])
 order by table_name, column_name;
