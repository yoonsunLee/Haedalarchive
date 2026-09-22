<?php
/*
 * 방문 통계 수집 — 홈페이지(assets/stats.js)가 보내는 짧은 신호를 받아 '날짜 × 항목별 합계'에 1씩 더한다.
 *
 * 저장하지 않는 것: IP 원문, 방문자·기기 식별값, 전체 주소, 검색어. IP는 국가를 알아내는 데만 쓰고 바로 버린다.
 * 세지 않는 것: 브라우저의 추적 거부 신호(GPC·Do Not Track), 검색 로봇·자동화 브라우저, 우리 홈페이지가 아닌 곳에서 온 요청.
 *
 * 요청: POST, 본문은 JSON 문자열(text/plain — sendBeacon)
 *   {"v":1, "l":"ko", "s":"ig_bio", "d":"m", "e":[["pv","/works/"], ["click","hero_work","HD-2026-004",1], ...]}
 *   l 언어(ko·en) · s 들어온 곳(방문 시작 때 정함) · d 기기(m 폰 · t 태블릿 · d 컴퓨터) · e 이벤트(최대 40개)
 */
require __DIR__ . '/lib.php';

const MAX_BODY = 8192;
const MAX_EVENTS = 40;
const RATE_WINDOW = 600;   // 10분
const RATE_MAX = 300;      // 한 곳에서 10분에 300번 넘게 보내면 그 뒤는 버린다
const DWELL_CAP = 1800;    // 머문 시간은 한 번에 30분까지만 더한다

$siteOrigins = list_cfg('ALLOWED_ORIGINS', 'https://shinhaedal.com,https://www.shinhaedal.com');
function done(int $status = 204): void
{
    global $siteOrigins;
    respond_json($status, [], $siteOrigins, 'POST, OPTIONS');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') done();
if ($method !== 'POST') done(405);

/* 우리 홈페이지에서 온 요청만 */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$fromSite = in_array($origin, $siteOrigins, true);
if (!$fromSite && $origin === '' && $referer !== '') {
    foreach ($siteOrigins as $o) if (strpos($referer, $o . '/') === 0) { $fromSite = true; break; }
}
if (!$fromSite) done(403);

/* 추적 거부 신호 · 로봇 */
if (($_SERVER['HTTP_SEC_GPC'] ?? '') === '1' || ($_SERVER['HTTP_DNT'] ?? '') === '1') done();
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|monitor|python|curl|wget|java\/|httpclient|axios|go-http/i', $ua)) done();

/* 본문 */
$raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
if ($raw === false || strlen($raw) > MAX_BODY) done(413);
$p = json_decode($raw, true);
if (!is_array($p) || (int)($p['v'] ?? 0) !== 1 || !isset($p['e']) || !is_array($p['e'])) done(400);

$lang = in_array($p['l'] ?? '', ['ko', 'en'], true) ? $p['l'] : '';
$src = (isset($p['s']) && preg_match('/^[a-z0-9_:.-]{1,24}$/', $p['s'])) ? $p['s'] : 'direct';
$dev = in_array($p['d'] ?? '', ['m', 't', 'd'], true) ? $p['d'] : '';
if ($dev === '') $dev = preg_match('/iPad|Tablet/i', $ua) ? 't' : (preg_match('/Mobi|iPhone|Android/i', $ua) ? 'm' : 'd');

try {
    $db = db();
    $now = time();

    /* 과도한 요청 막기 — IP는 그날만 쓰는 비밀값과 섞어 되돌릴 수 없는 16바이트로만 */
    $ip = client_ip();
    $h = substr(hash('sha256', cfg('FORM_SECRET', 'stats') . ':' . date('Y-m-d') . ':' . $ip, true), 0, 16);
    if (mt_rand(1, 50) === 1) $db->prepare('DELETE FROM stat_rate WHERE t < ?')->execute([$now - 2 * RATE_WINDOW]);
    $st = $db->prepare('INSERT INTO stat_rate (h, t, n) VALUES (?, ?, 1)
                        ON DUPLICATE KEY UPDATE n = IF(t < ?, 1, n + 1), t = IF(t < ?, VALUES(t), t)');
    $st->execute([$h, $now, $now - RATE_WINDOW, $now - RATE_WINDOW]);
    $cnt = $db->prepare('SELECT n FROM stat_rate WHERE h = ?');
    $cnt->execute([$h]);
    if ((int)$cnt->fetchColumn() > RATE_MAX) done(429);

    /* 국가 — 내려받아 둔 DB-IP Lite 대역표에서 찾고, IP는 여기서 버린다 */
    $cc = '--';
    $bin = ip16($ip);
    if ($bin !== null) {
        $q = $db->prepare('SELECT ip_to, cc FROM ip_country WHERE ip_from <= ? ORDER BY ip_from DESC LIMIT 1');
        $q->execute([$bin]);
        $row = $q->fetch(PDO::FETCH_NUM);
        if ($row && strcmp($row[0], $bin) >= 0 && preg_match('/^[A-Z]{2}$/', $row[1])) $cc = $row[1];
    }
    unset($ip, $bin);

    /* 이벤트 → 합계에 더하기 */
    $day = date('Y-m-d');
    $add = $db->prepare('INSERT INTO stat_counts (day, metric, k1, k2, cc, src, dev, lang, n, total)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE n = n + VALUES(n), total = total + VALUES(total)');
    $key = function ($v) {
        $v = (string)$v;
        return preg_match('/^[A-Za-z0-9_\-.\/:]{0,64}$/', $v) ? $v : null;
    };
    $page = function ($v) {
        $v = (string)$v;
        if (preg_match('#^/(works/w/[A-Za-z0-9-]{1,24}/|works/|about/|ip/|press/|contact/|privacy/history/|privacy/|copyright/|404/)?$#', $v)) return $v;
        return '/other/';
    };
    $bucket = function ($sec) {
        return $sec < 10 ? '0-10' : ($sec < 30 ? '10-30' : ($sec < 60 ? '30-60' : ($sec < 180 ? '60-180' : '180+')));
    };

    $db->beginTransaction();
    $n = 0;
    foreach ($p['e'] as $e) {
        if (++$n > MAX_EVENTS || !is_array($e) || !isset($e[0])) break;
        $type = (string)$e[0];
        $k1 = $e[1] ?? '';
        $k2 = $e[2] ?? '';
        $x = $e[3] ?? 0;
        switch ($type) {
            case 'pv': case 'visit': case 'visitor':
                $add->execute([$day, $type, $page($k1), '', $cc, $src, $dev, $lang, 1, 0]);
                break;
            case 'scroll':
                if (in_array((string)$k2, ['25', '50', '75', '100'], true))
                    $add->execute([$day, 'scroll', $page($k1), (string)$k2, $cc, $src, $dev, $lang, 1, 0]);
                break;
            case 'dwell':
                $sec = max(0, min(DWELL_CAP, (int)$x));
                $add->execute([$day, 'dwell', $page($k1), $bucket($sec), $cc, $src, $dev, $lang, 1, $sec]);
                break;
            case 'click': case 'reach': case 'wview':
                $a = $key($k1); $b = $key($k2);
                if ($a === null || $b === null || $a === '') break;
                $add->execute([$day, $type, $a, $b, $cc, $src, $dev, $lang, 1, 0]);
                if ($type === 'click' && (int)$x === 1)   // 이번 방문에서 이 버튼을 처음 누름
                    $add->execute([$day, 'clickv', $a, $b, $cc, $src, $dev, $lang, 1, 0]);
                break;
            case 'zdwell': case 'wdwell':
                $a = $key($k1); $b = $key($k2);
                if ($a === null || $b === null || $a === '') break;
                $sec = max(0, min(DWELL_CAP, (int)$x));
                if ($sec > 0) $add->execute([$day, $type, $a, $b, $cc, $src, $dev, $lang, 1, $sec]);
                break;
        }
    }
    $db->commit();
} catch (Throwable $err) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('stats collect: ' . $err->getMessage());
    done(500);
}
done();
