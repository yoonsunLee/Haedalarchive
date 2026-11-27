<?php
/*
 * 갤러리 방명록 — 관람객 쪽(shinhaedal.com/gallery/에서만).
 *
 * POST, 본문 JSON(text/plain도 받음)
 *   {"a":"state", "beta":""}                        → {"ok":true, "state":"open|beta|closed"}
 *   {"a":"id", "beta":""}                           → {"ok":true, "id":"무주의바다 0427", "key":"…"}   랜덤 아이디(겹치지 않음, 고칠 수 없음)
 *   {"a":"post", "id":"…", "key":"…", "body":"…", "beta":""} → {"ok":true, "at":"2026-11-30 14:02"}
 *
 * 저장하지 않는 것: IP, 기기 정보, 쿠키. 도배는 아이디별 간격·하루 수와 전체 하루 상한으로만 막는다.
 */
require __DIR__ . '/gblib.php';

$origins = gb_origins();
function out(int $status, array $body = [])
{
    global $origins;
    respond_json($status, $body, $origins, 'POST, OPTIONS');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') out(204);
if ($method !== 'POST') out(405, ['ok' => false]);

/* 우리 홈페이지에서 온 요청만 */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array($origin, $origins, true)) out(403, ['ok' => false, 'code' => 'origin']);

$raw = file_get_contents('php://input', false, null, 0, 8193);
if ($raw === false || strlen($raw) > 8192) out(413, ['ok' => false]);
$p = json_decode($raw, true);
if (!is_array($p)) out(400, ['ok' => false]);
$a = (string)($p['a'] ?? '');
$state = gb_state((string)($p['beta'] ?? ''));
if ($a === 'state') out(200, ['ok' => true, 'state' => $state]);
if ($state === 'closed') out(403, ['ok' => false, 'code' => 'closed']);

try {
    $db = db();
    gb_schema($db);
    $now = date('Y-m-d H:i:s');

    if ($a === 'id') {
        if (!gb_daily($db, 'id', GB_DAY_IDS)) out(429, ['ok' => false, 'code' => 'busy']);
        $key = bin2hex(random_bytes(24));
        $ins = $db->prepare('INSERT IGNORE INTO gb_ids (gid, k, created) VALUES (?, ?, ?)');
        for ($i = 0; $i < 30; $i++) {
            $gid = GB_WORDS[random_int(0, count(GB_WORDS) - 1)] . ' ' . str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            $ins->execute([$gid, hash('sha256', $key, true), $now]);
            if ($ins->rowCount() === 1) out(200, ['ok' => true, 'id' => $gid, 'key' => $key]);
        }
        out(503, ['ok' => false, 'code' => 'full']);
    }

    if ($a === 'post') {
        $gid = (string)($p['id'] ?? '');
        $key = (string)($p['key'] ?? '');
        $body = trim(str_replace(["\r\n", "\r"], "\n", (string)($p['body'] ?? '')));
        $body = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', '', $body);   // 줄바꿈 말고 보이지 않는 글자는 뺀다
        $len = mb_strlen((string)$body, 'UTF-8');
        if ($body === null || $len === 0) out(400, ['ok' => false, 'code' => 'empty']);
        if ($len > GB_MAX_CHARS) out(400, ['ok' => false, 'code' => 'long']);
        if (!preg_match('/^[0-9a-f]{48}$/', $key)) out(403, ['ok' => false, 'code' => 'key']);

        $q = $db->prepare('SELECT k, last_at, day, day_n FROM gb_ids WHERE gid = ?');
        $q->execute([$gid]);
        $row = $q->fetch(PDO::FETCH_ASSOC);
        if (!$row || !hash_equals($row['k'], hash('sha256', $key, true))) out(403, ['ok' => false, 'code' => 'key']);
        if ($row['last_at'] && time() - strtotime($row['last_at']) < GB_GAP_SEC) out(429, ['ok' => false, 'code' => 'wait']);
        $today = date('Y-m-d');
        $dayN = $row['day'] === $today ? (int)$row['day_n'] : 0;
        if ($dayN >= GB_PER_ID_DAY) out(429, ['ok' => false, 'code' => 'day']);
        if (!gb_daily($db, 'post', GB_DAY_POSTS)) out(429, ['ok' => false, 'code' => 'busy']);

        $db->prepare('INSERT INTO gb_entries (gid, body, created, beta) VALUES (?, ?, ?, ?)')->execute([$gid, $body, $now, $state === 'beta' ? 1 : 0]);
        $db->prepare('UPDATE gb_ids SET last_at = ?, day = ?, day_n = ? WHERE gid = ?')->execute([$now, $today, $dayN + 1, $gid]);
        out(200, ['ok' => true, 'at' => substr($now, 0, 16)]);
    }
    out(400, ['ok' => false]);
} catch (Throwable $err) {
    error_log('guestbook: ' . $err->getMessage());   // 글 내용은 남기지 않는다
    out(500, ['ok' => false]);
}
