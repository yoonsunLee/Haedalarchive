# retired — 돌리지 마세요

한 번 쓰고 끝난 수리용 SQL과, 더 이상 존재하지 않는 표의 정의입니다.
기록으로만 남겨 둡니다.

| 파일 | 무엇 | 왜 여기 있나 |
| --- | --- | --- |
| `inquiries_schema.sql` | 문의 접수 표 | 문의를 메일로만 받기로 하면서 표를 없앴다 |
| `inquiries_privacy_2026-09.sql` | 문의 표의 개인정보 조치 | 위와 같음 |
| `inquiries_retire_2026-09.sql` | 문의 표를 없애는 SQL | 2026-09에 실행 완료 |
| `home_videos_repair_2026-09.sql` | 빠진 열 채우기 | `home_videos_schema.sql`이 이제 같은 일을 한다 |
| `activity_log_cleanup_2026-09.sql` | 옛 설계의 흔적 열 지우기 | 2026-09-19에 실행 완료 |

`inquiries_*`는 특히 조심해야 합니다. 개인정보를 담던 표라 **일부러 없앤 것**이고,
다시 돌리면 없애기로 한 표가 되살아납니다.
