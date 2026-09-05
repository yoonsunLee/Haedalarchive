-- =====================================================================
-- 해달아카이브 목표 스키마 (Supabase / PostgreSQL)
-- Step 1-B, 2026-09-05
--
-- 범위: 6개 핵심 테이블 + soft delete + activity log.
-- collectors / locations / work_movements 는 이번 범위에서 제외한다
-- (요청된 적 없는 기능이고, Postgres에서는 나중에 추가하는 비용이 낮다).
--
-- editions는 애초 제외했다가 2026-09-05 작가 결정으로 포함했다:
-- HD-2026-012/013/014는 별개 작품 3점이 아니라 "한 작품의 에디션 3점"이다.
-- 이에 따라 판매/소장 정보는 works가 아니라 editions가 보유한다.
-- 유일작(에디션 아님)도 예외 없이 edition 1/1 행을 갖는다 —
-- 특수 케이스를 추가하는 대신 없애는 쪽이 코드 경로가 하나로 유지된다.
--
-- 설계 원칙
--   1. 위치가 아니라 이름으로 매핑한다 (현행 시트 버그 계열의 근본 원인 제거).
--   2. 한 필드에 두 언어를 넣지 않는다.
--   3. 코드에 박혀 있던 공개/시리즈 정책을 데이터로 옮긴다.
--   4. 일반 삭제는 soft delete. 이력이 참조하는 작품은 사라지지 않는다.
--   5. 원본 문자열을 잃지 않는다 (size 등은 원문 보존 + 파생 수치 병행).
-- =====================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ── 열거형 ────────────────────────────────────────────────────────────
-- 현행 '판매여부' 한 컬럼이 ●/NFS/빈칸/- 네 가지 의미를 겸하던 것을 분리한다.
create type sale_status  as enum ('available','reserved','sold','nfs');
create type work_status  as enum ('planned','completed','archived');
create type work_kind    as enum ('artwork','art_toy','event_reward');
create type exhibition_type as enum ('solo','group','curated','art_fair','special','popup');
create type press_type   as enum ('feature','interview','review','mention');
create type press_link   as enum ('exhibition','brand_shop');

-- ── 작품 ──────────────────────────────────────────────────────────────
create table works (
  id              uuid primary key default gen_random_uuid(),
  work_no         text not null unique,          -- HD-2026-001 (사람이 쓰는 공개 ID)
  kind            work_kind not null default 'artwork',

  -- 언어별 분리 저장. 절대 한 컬럼에 합치지 않는다.
  title_ko        text not null,
  title_en        text,
  caption_ko      text,
  caption_en      text,
  material_ko     text,
  material_en     text,

  year            int check (year between 1900 and 2200),

  -- 크기: 원문(A1 (59.4 × 84.1) 같은 비정형 포함)을 그대로 보존하고,
  -- 파싱 가능한 경우에만 수치 컬럼을 채운다. 정렬/필터는 수치 컬럼으로.
  size_text       text,
  width_cm        numeric(7,1),
  height_cm       numeric(7,1),
  depth_cm        numeric(7,1),

  work_state      work_status not null default 'completed',

  -- 정가(기준 호가). 개별 에디션이 다른 값에 팔릴 수 있으므로 실제 거래액은 editions에 둔다.
  list_price_krw   bigint check (list_price_krw >= 0),
  -- 에디션 총 수. 유일작은 1.
  edition_size     int not null default 1 check (edition_size > 0),

  -- 공개 정책을 코드가 아니라 데이터로 (publish.py의 ER- 접두사/ID 하드코딩 대체)
  publish_web     boolean not null default false,
  display_order   int,
  -- 시리즈 묶기를 제목 패턴 추론이 아니라 명시적 값으로 (works/index.html의 heuristic 대체)
  series_key      text,

  internal_note   text,                            -- 현행 '비고'

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  version         bigint not null default 1        -- 낙관적 동시성
);

create index works_publish_idx  on works (publish_web) where deleted_at is null;
create index works_series_idx   on works (series_key)  where series_key is not null;
create index works_year_idx     on works (year desc, work_no desc);

-- ── 에디션 (개별 실물 1점) ────────────────────────────────────────────
-- 유일작도 1/1 행을 하나 갖는다. 판매·소장 정보는 전부 여기에 있고 전부 비공개다.
create table editions (
  id              uuid primary key default gen_random_uuid(),
  work_id         uuid not null references works(id) on delete restrict,
  edition_number  int not null check (edition_number > 0),   -- 3점 중 1번이면 1

  status          sale_status not null default 'available',

  list_price_krw   bigint check (list_price_krw >= 0),       -- 이 점의 실제 호가(비면 works 값)
  actual_price_krw bigint check (actual_price_krw >= 0),
  discount_rate    numeric(4,3) check (discount_rate between 0 and 1),
  payment_method   text,
  sales_channel    text,
  collector_name   text,                                     -- 비공개
  sale_date        date,
  delivery_date    date,
  coa_no           text,
  internal_note    text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  version         bigint not null default 1,

  unique (work_id, edition_number)
);

create index editions_work_idx   on editions (work_id);
create index editions_status_idx on editions (status) where deleted_at is null;

-- 작품 단위 판매 상태는 저장하지 않고 에디션에서 유도한다(진실이 한 곳에만 있도록).
create view works_status as
select
  w.id,
  w.work_no,
  w.edition_size,
  count(e.id) filter (where e.deleted_at is null)                        as edition_rows,
  count(e.id) filter (where e.deleted_at is null and e.status = 'sold')  as sold_count,
  case
    when count(e.id) filter (where e.deleted_at is null and e.status <> 'sold') = 0
         and count(e.id) filter (where e.deleted_at is null) > 0 then 'sold'
    when bool_or(e.status = 'available') then 'available'
    when bool_or(e.status = 'reserved')  then 'reserved'
    else 'nfs'
  end as effective_status
from works w
left join editions e on e.work_id = w.id
where w.deleted_at is null
group by w.id, w.work_no, w.edition_size;

-- ── 전시 ──────────────────────────────────────────────────────────────
create table exhibitions (
  id              uuid primary key default gen_random_uuid(),
  exhibition_no   text not null unique,           -- EX-2026-01
  title_ko        text not null,
  title_en        text,
  venue_ko        text,
  venue_en        text,
  type            exhibition_type not null,
  start_date      date,
  end_date        date,
  docent_url      text,
  note_public_ko  text,
  note_public_en  text,
  publish_web     boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  version         bigint not null default 1,

  constraint end_after_start check (end_date is null or start_date is null or end_date >= start_date)
);

-- ── 전시 ↔ 작품 (단일 진실) ───────────────────────────────────────────
-- 현행 work_nos 쉼표 문자열 + 작품별 '출품 기간' 자유텍스트를 대체한다.
-- 실측 대조 결과 전시시트가 자유텍스트의 상위집합이라 이관 시 이력 손실 없음(01-inventory.md §3).
create table exhibition_works (
  exhibition_id   uuid not null references exhibitions(id) on delete cascade,
  work_id         uuid not null references works(id)       on delete restrict,
  display_order   int,
  -- 현행 '비고'에 섞여 있던 "CODE NAME BLUE용 캡션" 같은 전시별 대체 문구를 여기로.
  caption_ko_override text,
  caption_en_override text,
  note_internal   text,
  primary key (exhibition_id, work_id)
);

create index exhibition_works_work_idx on exhibition_works (work_id);

-- ── 언론 ──────────────────────────────────────────────────────────────
create table press (
  id              uuid primary key default gen_random_uuid(),
  press_no        text not null unique,           -- PR-2026-001
  type            press_type not null default 'mention',
  outlet_ko       text not null,
  outlet_en       text,
  published_date  date,
  title_ko        text not null,
  title_en        text,
  quote_ko        text,
  quote_en        text,
  url             text,
  -- 이미지: 언론사 CDN 직링크에만 의존하면 기사가 내려갈 때 깨진다.
  -- 원본 주소는 출처 기록용으로 남기고, 실제 표시는 자체 보관 사본으로 한다.
  image_source_url text,                          -- 최초 출처 (기록/추적용)
  image_file       text,                          -- 자체 보관 사본 (drive:FILEID)
  image_archived_at timestamptz,
  byline          text,                           -- 현행 note (기자명). 공개 여부는 발행 whitelist에서 결정
  -- 기사 제목 문자열로 전시를 추론하던 것(press/index.html)을 명시적 관계로 대체
  linked_exhibition_id uuid references exhibitions(id) on delete set null,
  link_type       press_link,
  note_internal   text,
  publish_web     boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  version         bigint not null default 1,

  constraint url_is_http check (url is null or url ~* '^https?://')
);

-- ── 용어집 ────────────────────────────────────────────────────────────
-- 홈페이지·포트폴리오·캡션·COA·해외 공모에서 재사용할 공식 표기.
create table terminology (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,                      -- technique / material / exhibition_type / brand
  term_ko     text not null,
  term_en     text not null,
  short_en    text,
  usage_note  text,
  locked      boolean not null default false,     -- 확정 표기(임의 변경 금지)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (category, term_ko)
);

-- ── 활동 로그 ─────────────────────────────────────────────────────────
create table activity_log (
  id          bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor       text,                               -- auth.uid() 또는 'system'
  entity      text not null,                      -- works / exhibitions / press / ...
  entity_id   uuid,
  entity_no   text,                               -- 사람이 읽는 ID (HD-2026-001)
  action      text not null,                      -- create / update / delete / restore / publish / publish_failed
  changes     jsonb                               -- {field: [before, after]} — 비밀정보는 담지 않는다
);

create index activity_log_time_idx   on activity_log (occurred_at desc);
create index activity_log_entity_idx on activity_log (entity, entity_id);

-- ── updated_at / version 자동 갱신 ────────────────────────────────────
create or replace function touch_row() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.version    := old.version + 1;
  return new;
end $$;

create trigger works_touch       before update on works       for each row execute function touch_row();
create trigger editions_touch    before update on editions    for each row execute function touch_row();
create trigger exhibitions_touch before update on exhibitions for each row execute function touch_row();
create trigger press_touch       before update on press       for each row execute function touch_row();

-- =====================================================================
-- RLS — 기본 방침: 익명은 아무것도 읽지 못한다.
-- 공식 홈페이지는 DB를 직접 조회하지 않고 발행된 정적 JSON만 읽으므로
-- 공개 읽기 정책 자체가 필요 없다.
-- =====================================================================
alter table works            enable row level security;
alter table editions         enable row level security;
alter table exhibitions      enable row level security;
alter table exhibition_works enable row level security;
alter table press            enable row level security;
alter table terminology      enable row level security;
alter table activity_log     enable row level security;

-- 로그인한 관리자(=작가 본인)만 전체 접근.
create policy works_admin       on works            for all to authenticated using (true) with check (true);
create policy editions_admin    on editions         for all to authenticated using (true) with check (true);
create policy exhibitions_admin on exhibitions      for all to authenticated using (true) with check (true);
create policy ex_works_admin    on exhibition_works for all to authenticated using (true) with check (true);
create policy press_admin       on press            for all to authenticated using (true) with check (true);
create policy terminology_admin on terminology      for all to authenticated using (true) with check (true);

-- 활동 로그는 열람만. 수정/삭제 정책을 만들지 않음으로써 변조를 막는다.
create policy activity_read     on activity_log     for select to authenticated using (true);
create policy activity_insert   on activity_log     for insert to authenticated with check (true);

-- 발행 파이프라인(GitHub Actions)은 service_role 키로 접속하며 RLS를 우회한다.
-- 그 키는 서버(Actions secret)에만 두고 브라우저에는 절대 넣지 않는다.
