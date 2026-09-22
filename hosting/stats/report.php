<?php
/*
 * 방문 통계 조회 — 아카이브(관리 화면)만. 2단계 인증을 마친 로그인 토큰이 있어야 한다.
 *
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD   (최대 400일)
 * 응답:
 *   daily: [[날짜, 항목(pv·visit·visitor), 국가, 들어온 곳, 기기, 언어, 수], ...]   — 추이 그래프·걸러 보기용
 *   agg:   [[항목, k1, k2, 국가, 들어온 곳, 기기, 언어, 수, 합(초)], ...]         — 기간 합계(표들)
 *   geoip: 국가 DB 판(YYYY-MM)
 */
require __DIR__ . '/lib.php';

$adminOrigins = list_cfg('ADMIN_ORIGINS', 'https://yoonsunlee.github.io');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') respond_json(204, [], $adminOrigins, 'GET, OPTIONS');
if ($method !== 'GET') respond_json(405, ['ok' => false], $adminOrigins, 'GET, OPTIONS');
require_admin($adminOrigins);

$from = $_GET['from'] ?? '';
$to = $_GET['to'] ?? '';
$ok = function ($d) { return preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) && strtotime($d) !== false; };
if (!$ok($from) || !$ok($to) || $from > $to) respond_json(400, ['ok' => false, 'code' => 'range'], $adminOrigins, 'GET, OPTIONS');
if ((strtotime($to) - strtotime($from)) / 86400 > 400) respond_json(400, ['ok' => false, 'code' => 'too_long'], $adminOrigins, 'GET, OPTIONS');

try {
    $db = db();
    ensure_schema($db);   // 처음 열 때 표 만들기(카페24엔 phpMyAdmin이 없다)
    $q = $db->prepare("SELECT day, metric, cc, src, dev, lang, SUM(n) FROM stat_counts
                       WHERE day BETWEEN ? AND ? AND metric IN ('pv','visit','visitor')
                       GROUP BY day, metric, cc, src, dev, lang ORDER BY day");
    $q->execute([$from, $to]);
    $daily = [];
    while ($r = $q->fetch(PDO::FETCH_NUM)) { $r[6] = (int)$r[6]; $daily[] = $r; }

    $q = $db->prepare('SELECT metric, k1, k2, cc, src, dev, lang, SUM(n), SUM(total) FROM stat_counts
                       WHERE day BETWEEN ? AND ? GROUP BY metric, k1, k2, cc, src, dev, lang');
    $q->execute([$from, $to]);
    $agg = [];
    while ($r = $q->fetch(PDO::FETCH_NUM)) { $r[7] = (int)$r[7]; $r[8] = (int)$r[8]; $agg[] = $r; }

    $g = $db->query("SELECT v FROM stat_meta WHERE k = 'geoip_version'")->fetchColumn();
    respond_json(200, ['ok' => true, 'from' => $from, 'to' => $to, 'today' => date('Y-m-d'),
                       'daily' => $daily, 'agg' => $agg, 'geoip' => $g ?: ''], $adminOrigins, 'GET, OPTIONS');
} catch (Throwable $err) {
    error_log('stats report: ' . $err->getMessage());
    // 로그인·2단계 인증·허용 이메일을 통과한 관리자에게만 가는 응답 — 설치 중 원인을 바로 보이게 DB 오류 문구를 싣는다
    respond_json(500, ['ok' => false, 'code' => 'db', 'message' => $err->getMessage()], $adminOrigins, 'GET, OPTIONS');
}
