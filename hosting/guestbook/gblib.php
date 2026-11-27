<?php
/*
 * 갤러리 방명록 공통 — gb.php(관람객) · admin.php(관리 화면)가 함께 쓴다.
 * DB·설정·로그인 확인은 방문 통계(../stats/lib.php)와 같은 것을 쓴다(config.php도 같은 파일).
 *
 * 설정(config.php, 없으면 아래 기본값):
 *   GB_OPEN  '2026-11-30 00:00:00'  남기기 시작(한국 시간)
 *   GB_CLOSE '2026-12-06 23:59:59'  남기기 끝
 *   GB_BETA_KEY  숨은 시험 주소의 열쇠(?gb=열쇠). 비워 두면 시험 주소가 없다
 */
require dirname(__DIR__) . '/stats/lib.php';

const GB_MAX_CHARS = 500;
const GB_GAP_SEC = 20;        // 같은 아이디로 다음 글까지
const GB_PER_ID_DAY = 10;     // 같은 아이디로 하루에
const GB_DAY_POSTS = 3000;    // 전체 하루 글 상한
const GB_DAY_IDS = 5000;      // 전체 하루 아이디 발급 상한

/* 랜덤 아이디 낱말 — 작품 제목에서 뽑음(작가님 확인 2026-11-27). 뒤에 숫자 네 자리 */
const GB_WORDS = ['얼빵해달', '조개배달부', '일월오봉단', '저작인접권자', '주권', '소급효', '권리소진', '권리누적', '도달주의',
    '내용증명', '효력발생', '초상권', '퍼블리시티권', '행복추구권', '기대권', '우주조약', '무주의바다', '대기권', '더블루북',
    '출근', '퇴근', '업무중', 'N차적저작물'];

function gb_origins(): array { return list_cfg('ALLOWED_ORIGINS', 'https://shinhaedal.com,https://www.shinhaedal.com'); }

function gb_schema(PDO $db): void
{
    $sql = preg_replace('/^\s*--.*$/m', '', (string)file_get_contents(__DIR__ . '/schema.sql'));
    foreach (explode(';', $sql) as $stmt) if (trim($stmt) !== '') $db->exec($stmt);
}

/* 지금 남길 수 있나: 기간 안이거나, 맞는 시험 열쇠를 가져왔을 때. 돌려주는 값: 'open' · 'beta' · 'closed' */
function gb_state(string $beta): string
{
    $now = date('Y-m-d H:i:s');
    if ($now >= cfg('GB_OPEN', '2026-11-30 00:00:00') && $now <= cfg('GB_CLOSE', '2026-12-06 23:59:59')) return 'open';
    $key = (string)cfg('GB_BETA_KEY', '');
    if ($key !== '' && $beta !== '' && hash_equals($key, $beta)) return 'beta';
    return 'closed';
}

/* 하루 합계 +1 하고 상한을 넘었으면 false */
function gb_daily(PDO $db, string $kind, int $max): bool
{
    $day = date('Y-m-d');
    $db->prepare('INSERT INTO gb_daily (day, kind, n) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE n = n + 1')->execute([$day, $kind]);
    $q = $db->prepare('SELECT n FROM gb_daily WHERE day = ? AND kind = ?');
    $q->execute([$day, $kind]);
    return (int)$q->fetchColumn() <= $max;
}
