# supabase/schema

Supabase 콘솔 → **SQL Editor**에 붙여넣고 Run 하는 파일들.

## 규칙

**이 폴더의 파일은 몇 번을 다시 돌려도 안전해야 하고, 돌리고 나면 실제 표가 파일과 같아야 한다.**

`create table if not exists` 하나로 끝내면 안 된다. 표가 이미 있으면 **통째로 건너뛰기 때문에**,
나중에 파일에 열을 더해도 실제 표에는 영영 생기지 않는다. 그러고는 몇 달 뒤
엉뚱한 오류로 튀어나온다. 2026-09-19 하루에만 두 번 이렇게 당했다.

- `home_videos`에 `video_master`가 없어서 영상 등록이 통째로 막혔다
  (`Could not find the 'video_master' column of 'home_videos' in the schema cache`)
- `activity_log` 표가 옛 설계의 흔적으로 이미 있어서 새 열이 하나도 안 생겼다
  (`ERROR: 42703: column "at" does not exist`)

그래서 이렇게 적는다.

```sql
create table if not exists 표이름 (
  id uuid primary key default gen_random_uuid()   -- 열쇠만
);

alter table 표이름 add column if not exists 열이름 타입 ...;   -- 열은 하나씩
```

제약에는 `if not exists`가 없으므로 `drop constraint if exists` 다음에 `add constraint`로 건다.
마지막에는 `notify pgrst, 'reload schema';`와 열 목록을 보여 주는 `select`를 둬서,
돌린 사람이 결과를 눈으로 확인할 수 있게 한다.

## 지금 쓰는 것

| 파일 | 무엇 |
| --- | --- |
| `home_videos_schema.sql` | 홈 첫 화면 영상 |
| `activity_log_2026-09.sql` | 작업 기록 — 표와 트리거 |
| `press_outlet_en_2026-09.sql` | 기사 영문 매체명 열(outlet_en) 추가 |
| `works_page_2026-09.sql` | Works 구성 — 작품 목록 순서·연작 안 순서 열, 연작(series)·사이트 설정(site_settings) 표 |
| `home_hero_2026-09.sql` | 홈 히어로 — home_videos에 장 종류(kind: 영상·작품·이미지)·올린 이미지(image_file) 열 |

## `retired/`

한 번 쓰고 끝난 수리용 SQL과, 더 이상 존재하지 않는 표의 정의가 들어 있다.
**돌리지 말 것.** 특히 `inquiries_*`는 개인정보를 담던 표라 일부러 없앤 것이라,
다시 돌리면 없애기로 한 표가 되살아난다. 기록으로만 남겨 둔다.

## 아직 파일이 없는 표

`works` · `editions` · `exhibitions` · `exhibition_works` · `press` ·
`work_photos` · `work_media_links` 는 정의 파일이 없다. 콘솔에서 직접 만든 표들이라
지금 모양을 글로 옮겨 둔 곳이 없다. 언젠가 옮겨 적어 두면 좋다.
