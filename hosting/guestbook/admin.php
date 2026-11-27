<?php
/*
 * 갤러리 방명록 — 관리 화면(아카이브)만. 방문 통계와 같은 로그인 확인(2단계 인증 + 허용 이메일).
 *
 * GET                       → {"ok":true, "entries":[[번호, 아이디, 글, 시각, 시험글], ...], "state":"…", "open":"…", "close":"…"}
 * POST {"a":"del","id":12}  → 한 글 지우기
 * POST {"a":"delbeta"}      → 시험 주소로 남긴 글 모두 지우기(열기 전에)
 */
require __DIR__ . '/gblib.php';

$adminOrigins = list_cfg('ADMIN_ORIGINS', 'https://yoonsunlee.github.io');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') respond_json(204, [], $adminOrigins, 'GET, POST, OPTIONS');
if ($method !== 'GET' && $method !== 'POST') respond_json(405, ['ok' => false], $adminOrigins, 'GET, POST, OPTIONS');
require_admin($adminOrigins);

try {
    $db = db();
    gb_schema($db);
    if ($method === 'POST') {
        $p = json_decode((string)file_get_contents('php://input', false, null, 0, 4096), true);
        $a = is_array($p) ? (string)($p['a'] ?? '') : '';
        if ($a === 'del') {
            $st = $db->prepare('DELETE FROM gb_entries WHERE id = ?');
            $st->execute([(int)($p['id'] ?? 0)]);
            respond_json(200, ['ok' => true, 'n' => $st->rowCount()], $adminOrigins, 'GET, POST, OPTIONS');
        }
        if ($a === 'delbeta') {
            $n = $db->exec('DELETE FROM gb_entries WHERE beta = 1');
            respond_json(200, ['ok' => true, 'n' => (int)$n], $adminOrigins, 'GET, POST, OPTIONS');
        }
        respond_json(400, ['ok' => false], $adminOrigins, 'GET, POST, OPTIONS');
    }
    $rows = [];
    foreach ($db->query('SELECT id, gid, body, created, beta FROM gb_entries ORDER BY id DESC LIMIT 5000') as $r) {
        $rows[] = [(int)$r['id'], $r['gid'], $r['body'], substr($r['created'], 0, 16), (int)$r['beta']];
    }
    respond_json(200, ['ok' => true, 'entries' => $rows, 'state' => gb_state(''),
                       'open' => cfg('GB_OPEN', '2026-11-30 00:00:00'), 'close' => cfg('GB_CLOSE', '2026-12-06 23:59:59')],
                 $adminOrigins, 'GET, POST, OPTIONS');
} catch (Throwable $err) {
    error_log('guestbook admin: ' . $err->getMessage());
    respond_json(500, ['ok' => false, 'code' => 'db', 'message' => $err->getMessage()], $adminOrigins, 'GET, POST, OPTIONS');
}
