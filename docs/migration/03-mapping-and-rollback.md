# Step 1-C. 마이그레이션 매핑 · 순서 · 롤백

## 1. 컬럼 매핑 (시트 → PostgreSQL)

### 작품 시트 → `works`

| 시트 컬럼 | → | 목표 컬럼 | 변환 규칙 |
|---|---|---|---|
| Artwork No. | → | `work_no` | 그대로. `ER-` 접두사는 `kind='event_reward'` |
| 이미지 | → | (별도) | `drive:FILEID` 유지. Drive 계속 사용하므로 문자열 그대로 보관 |
| 작품명 | → | `title_ko` + `title_en` | `\n` 분리. `title_en` 컬럼에 값이 있으면 그쪽 우선 |
| 캡션 | → | `caption_ko` (+`caption_en`) | 006·007은 한/영 수동 분리 필요 |
| 재료 | → | `material_ko` (+`material_en`) | 006·007·008은 한/영 수동 분리 필요 |
| 크기 (cm) | → | `size_text` + `width_cm`/`height_cm`/`depth_cm` | 원문 보존. `W × H`, `W × H × D` 파싱. `A1 (59.4 × 84.1)`는 원문만 보존하고 수치는 괄호 안에서 추출 |
| 연도 | → | `year` | int |
| 판매가격 | → | `list_price_krw` | 숫자만. **`Artist Archive`(HD-2026-001)는 NULL + `internal_note`로 이관** |
| 판매여부 | → | `sale_status` | `●`→`sold`, `NFS`→`nfs`, 빈칸→`available`, `등록 예정`→`work_state='planned'` |
| 할인률 | → | `discount_rate` | `-`/빈칸→NULL, `0.1`→0.100 |
| 실거래가 | → | `actual_price_krw` | `-`/빈칸→NULL |
| 결제방식 | → | `payment_method` | `-`→NULL |
| 판매일자 | → | `sale_date` | **`.`/`-` 두 형식 정규화** |
| 작품인도일 | → | `delivery_date` | 동일 |
| 판매경로 | → | `sales_channel` | |
| 소장자 | → | `collector_name` | **비공개** |
| 출품 기간 | → | `exhibition_works` | 자유텍스트 폐기. 전시시트가 상위집합임을 확인했으므로(01-inventory §3) 관계로만 관리 |
| 비고 | → | `internal_note` (+ `exhibition_works.caption_*_override`) | "CODE NAME BLUE용 캡션"은 오버라이드로 분리 |
| 수량 | → | `edition_size` | |
| 판매개수 | → | `edition_sold` | |
| 오디오 원본 | → | (별도) | Drive ID |
| 대본(한글/영문) | → | `transcript_ko`/`transcript_en` | ※ 현행 유지. 오디오 착수 시점에 테이블 추가 검토 |
| 작품명/캡션/재료(영문) | → | `title_en`/`caption_en`/`material_en` | |
| — | → | `publish_web` | **신규**: `ER-` 아님 AND `HD-2026-013/014` 아님 → true (publish.py 하드코딩 대체) |
| — | → | `series_key` | **신규**: `N차적 저작물`, `POV`, `우주조약/무주의 바다` 그룹 (프론트 heuristic 대체) |

### `exhibitions` → `exhibitions`
`id→exhibition_no`, `title→title_ko`, `venue→venue_ko`, `type` 한국어→enum
(`개인전`→`solo`, `단체전`→`group`, `아트페어`→`art_fair`), 나머지 동명 이관.
`work_nos` 쉼표 문자열 → `exhibition_works` 행으로 전개(46건).

### `Press` → `press`
`no→press_no`, `outlet→outlet_ko`, `date→published_date`, `title→title_ko`,
`quote→quote_ko`, `image→image_url`, `note→byline`.
`linked_exhibition_id`/`link_type`은 현재 프론트가 제목 문자열로 추론하던 것을 이관 시 1회 수동 확정.

## 2. 이관 순서 (FK 의존성)

```
1. terminology      (독립)
2. exhibitions      (독립)
3. works            (독립)
4. exhibition_works (2·3 필요)
5. press            (2 필요 — linked_exhibition_id)
```

## 3. 대조(parity) 검증 — 컷오버 전 반드시 통과

| # | 검증 | 통과 기준 |
|--:|---|---|
| 1 | 행 수 | works 18, exhibitions 14, press 6, exhibition_works 46 |
| 2 | ID 집합 | 시트의 work_no/exhibition_no/press_no 집합과 완전 일치 |
| 3 | 필드 값 | 텍스트 필드 정규화 후 문자열 비교 100% 일치 |
| 4 | 금액 합계 | `SUM(list_price)`, `SUM(actual_price)`가 시트 합계와 일치 |
| 5 | 전시 관계 | `work_nos` 전개 결과와 `exhibition_works` 완전 일치 |
| 6 | 발행 산출물 | Supabase 기반 `publish.py` 출력이 현재 `data/*.json`과 **바이트 단위로 동일**(신규 `_en` 필드 제외) |
| 7 | 비공개 필드 | 발행 산출물에 `collector_name`/`actual_price`/`internal_note` 등이 **0건** |

6번이 가장 강력한 검증이다 — 홈페이지가 읽는 실제 산출물이 같으면 사용자 눈에 보이는 것이 바뀌지 않았다는 뜻이다.

## 4. 롤백 계획

이 마이그레이션의 안전성은 **공식 홈페이지가 아카이브를 직접 호출하지 않는다**는 사실에서 나온다.
홈페이지는 GitHub Pages의 정적 JSON만 읽으므로, 아카이브가 어떤 상태든 홈페이지는 마지막 정상본으로 계속 서비스된다.

| 단계 | 롤백 방법 | 홈페이지 영향 |
|---|---|---|
| 스키마 구축 | Supabase 프로젝트만 삭제 | 없음 |
| 데이터 복사 | 시트가 원본 그대로 살아있음 | 없음 |
| 관리자 UI 전환 | `index.html`을 이전 커밋으로 revert | 없음 |
| `publish.py` 전환 | `publish.py`를 이전 커밋으로 revert (Apps Script 배포는 그대로 유지) | 없음 |
| 컷오버 후 문제 발견 | 시트를 다시 쓰기 가능으로 전환 + 위 revert | 없음 |

**원칙**: 컷오버 후에도 최소 1개월간 구글 시트를 **삭제하지 않고 읽기 전용으로 보존**한다.
Apps Script 배포도 남겨둔다(URL을 지우면 되돌릴 수 없다).

### 착수 전 백업 (필수)
1. 시트 → `.xlsx` 수동 내보내기 1부 (`backupXlsx()`가 이미 있음)
2. 이 시점의 `data/*.json` 스냅샷 태그 (`git tag pre-supabase`)
3. Drive `이미지` 폴더 파일 목록 + ID 인벤토리 저장

## 5. 다음 단계에서 사용자가 해야 할 일

1. **Supabase 프로젝트 생성** (작가님 계정)
2. 생성 후 알려주실 값: 프로젝트 URL, `anon` 키 — **`service_role` 키는 대화창에 붙여넣지 마시고** GitHub Secrets에 직접 등록
3. 아카이브 `ADMIN_TOKEN` — 데이터 복사 1회에만 필요

## 6. 미해결 (01-inventory §6과 동일)

- `Limited Editon` 오타 수정 여부
- 012/013/014를 3행 유지할지 1작품 3에디션으로 볼지
- Press 이미지 외부 CDN 핫링크 자체 보관 여부
- `ER-2026-001` 영구 비공개 여부
