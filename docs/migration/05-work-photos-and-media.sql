-- 작품 상세 화면용 추가 사진(여러 장) + 영상/인스타그램 링크(여러 개) 지원.
-- 대표 이미지(works.image_file)는 그대로 두고, 이 둘은 별도 자식 테이블로 분리한다
-- (사진·영상 모두 순서가 있는 목록이라 exhibition_works와 같은 1:N 패턴을 따른다).
-- Supabase SQL Editor에서 한 번 실행하면 된다. 이미 적용돼 있으면 no-op.

create table if not exists work_photos (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references works(id) on delete cascade,
  image_file  text not null,              -- 'sb:path' (artwork-masters 버킷, 원본 보관)
  sort_order  int not null default 0,
  caption_ko  text,
  caption_en  text,
  alt_text    text,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists work_photos_work_id_idx on work_photos(work_id);

create table if not exists work_media_links (
  id                uuid primary key default gen_random_uuid(),
  work_id           uuid not null references works(id) on delete cascade,
  platform          text not null check (platform in ('youtube','instagram_reel','instagram_photo')),
  url               text not null,
  thumb_file        text,                 -- 'sb:path', 선택 업로드(직접 올린 썸네일)
  title_ko          text,
  title_en          text,
  duration_seconds  int check (duration_seconds is null or duration_seconds > 0),
  is_public         boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists work_media_links_work_id_idx on work_media_links(work_id);
