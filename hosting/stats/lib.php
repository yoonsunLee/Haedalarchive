<?php
/*
 * 방문 통계 공통 — collect.php · report.php · geoip.php 가 함께 쓴다.
 * 설정은 한 단계 위 폴더의 config.php(문의 접수와 같은 파일)에서 읽는다. 저장소에 올리지 않는다.
 *
 * PHP 7.1 이상, PDO(MySQL) 필요.
 */

date_default_timezone_set('Asia/Seoul');   // 날짜는 한국 시간 기준
$CFG = require dirname(__DIR__) . '/config.php';

function cfg($k, $default = '')
{
    global $CFG;
    return isset($CFG[$k]) && $CFG[$k] !== '' ? $CFG[$k] : $default;
}

function db()
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $dsn = 'mysql:host=' . cfg('STATS_DB_HOST', 'localhost') . ';dbname=' . cfg('STATS_DB_NAME') . ';charset=utf8mb4';
    if (cfg('STATS_DB_PORT')) $dsn .= ';port=' . cfg('STATS_DB_PORT');
    $pdo = new PDO($dsn, cfg('STATS_DB_USER'), cfg('STATS_DB_PASS'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

/* 통계 표가 없으면 만든다 — 같은 폴더의 schema.sql을 그대로 실행(CREATE TABLE IF NOT EXISTS라 몇 번 돌려도 안전).
   카페24는 phpMyAdmin(MySQL 웹어드민)을 닫아서, 관리 화면이 통계를 처음 열 때 여기서 만든다. */
function ensure_schema(PDO $db): void
{
    static $done = false;
    if ($done) return;
    $sql = preg_replace('/^\s*--.*$/m', '', (string)file_get_contents(__DIR__ . '/schema.sql'));
    foreach (explode(';', $sql) as $stmt) {
        if (trim($stmt) !== '') $db->exec($stmt);
    }
    $done = true;
}

/* JSON 응답. $origins: 허용할 Origin 목록(CORS) */
function respond_json(int $status, $body, array $origins, string $methods = 'GET, POST, OPTIONS'): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    if ($origin !== '' && in_array($origin, $origins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: ' . $methods);
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-SH-Auth');
    header('Access-Control-Max-Age: 3600');
    header('Cache-Control: no-store');
    if ($status !== 204) echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function list_cfg($k, $default)
{
    return array_values(array_filter(array_map('trim', explode(',', cfg($k, $default)))));
}

/* 실제 접속 주소. 앞단 프록시가 있는 구성(접속 주소가 사설·예약 대역)일 때만 X-Forwarded-For를 본다 */
function client_ip(): string
{
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    $isPublic = $remote !== '' && filter_var($remote, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    if (!$isPublic) {
        $fwd = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($fwd !== '') {
            $first = trim(explode(',', $fwd)[0]);
            if (filter_var($first, FILTER_VALIDATE_IP)) return $first;
        }
    }
    return $remote;
}

/* IP → 16바이트(IPv4는 ::ffff:a.b.c.d 형식). 잘못된 값이면 null */
function ip16(string $ip)
{
    $bin = @inet_pton($ip);
    if ($bin === false) return null;
    if (strlen($bin) === 4) return str_repeat("\0", 10) . "\xff\xff" . $bin;
    return strlen($bin) === 16 ? $bin : null;
}

/* ---------- 관리 화면(아카이브) 로그인 확인 ----------
   아카이브가 보낸 Supabase 로그인 토큰을 Supabase에 물어 확인한다.
   2단계 인증까지 마친 토큰(aal2)이고, 허용된 이메일일 때만 통과. */
function require_admin(array $origins): string
{
    // 카페24처럼 PHP를 CGI로 돌리는 호스팅은 Authorization 머리를 PHP에 넘기지 않는다 —
    // 아카이브는 같은 토큰을 X-SH-Auth 머리에도 실어 보낸다
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($auth === '' && function_exists('getallheaders')) {
        foreach ((array)getallheaders() as $k => $v) if (strcasecmp($k, 'Authorization') === 0) $auth = (string)$v;
    }
    if ($auth === '') $auth = $_SERVER['HTTP_X_SH_AUTH'] ?? '';
    if (!preg_match('/^Bearer\s+([A-Za-z0-9._-]+)$/', $auth, $m)) respond_json(401, ['ok' => false, 'code' => 'auth'], $origins);
    $token = $m[1];
    $parts = explode('.', $token);
    $claims = count($parts) === 3 ? json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true) : null;
    if (!is_array($claims) || ($claims['aal'] ?? '') !== 'aal2' || (int)($claims['exp'] ?? 0) < time()) {
        respond_json(401, ['ok' => false, 'code' => 'aal2'], $origins);
    }
    $ch = curl_init(rtrim(cfg('SUPABASE_URL'), '/') . '/auth/v1/user');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['apikey: ' . cfg('SUPABASE_ANON_KEY'), 'Authorization: Bearer ' . $token],
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_errno($ch);
    curl_close($ch);
    // 설치 중 원인이 보이게: Supabase 확인 자체가 안 된 것(verify)과 이메일이 목록에 없는 것(forbidden)을 나눈다
    if ($code !== 200) {
        respond_json(403, ['ok' => false, 'code' => 'verify',
                           'message' => 'HTTP ' . $code . ($cerr ? ' · curl ' . $cerr : '')], $origins);
    }
    $user = json_decode((string)$res, true);
    $email = strtolower((string)($user['email'] ?? ''));
    $allowed = array_map('strtolower', list_cfg('STATS_ADMIN_EMAILS', ''));
    if ($email === '' || !in_array($email, $allowed, true)) {
        // Supabase가 확인해 준 본인 이메일만 돌려준다(목록 내용은 알려 주지 않음)
        respond_json(403, ['ok' => false, 'code' => 'forbidden', 'message' => $email, 'listed' => count($allowed)], $origins);
    }
    return $email;
}
