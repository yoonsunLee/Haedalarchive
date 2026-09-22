<?php
/*
 * 국가 판별 데이터베이스(DB-IP IP to Country Lite, CC BY 4.0) 갱신 — 아카이브(관리 화면)에서 누른다. 월 1회 권장.
 * 외부 조회 없이 서버 안의 대역표로만 국가를 찾기 위해, 공개 파일을 내려받아 표로 옮긴다.
 *
 * POST op=status            → 지금 판, 줄 수
 * POST op=download          → 이번 달(없으면 지난달) 파일을 받아 풀고, 새 표를 비워 둔다
 * POST op=import&offset=N   → 파일의 N바이트부터 한 번에 조금씩 새 표에 넣는다(호스팅 실행 시간 제한 때문). done이면 다음 단계
 * POST op=swap              → 새 표를 실제 표로 바꾸고 내려받은 파일을 지운다
 */
require __DIR__ . '/lib.php';

$adminOrigins = list_cfg('ADMIN_ORIGINS', 'https://yoonsunlee.github.io');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') respond_json(204, [], $adminOrigins, 'POST, OPTIONS');
if ($method !== 'POST') respond_json(405, ['ok' => false], $adminOrigins, 'POST, OPTIONS');
require_admin($adminOrigins);

$DIR = __DIR__ . '/_data';
$GZ = $DIR . '/dbip.csv.gz';
$CSV = $DIR . '/dbip.csv';
$op = $_POST['op'] ?? ($_GET['op'] ?? '');
@set_time_limit(60);

function out(array $body): void
{
    global $adminOrigins;
    respond_json(200, $body + ['ok' => true], $adminOrigins, 'POST, OPTIONS');
}
function fail(string $code, string $msg = ''): void
{
    global $adminOrigins;
    respond_json(500, ['ok' => false, 'code' => $code, 'message' => $msg], $adminOrigins, 'POST, OPTIONS');
}
function meta_get(PDO $db, string $k): string
{
    $q = $db->prepare('SELECT v FROM stat_meta WHERE k = ?');
    $q->execute([$k]);
    return (string)$q->fetchColumn();
}
function meta_set(PDO $db, string $k, string $v): void
{
    $db->prepare('INSERT INTO stat_meta (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)')->execute([$k, $v]);
}

try {
    $db = db();
    ensure_schema($db);
    if ($op === 'status') {
        $rows = (int)$db->query('SELECT COUNT(*) FROM ip_country')->fetchColumn();
        out(['version' => meta_get($db, 'geoip_version'), 'rows' => $rows]);
    }

    if ($op === 'download') {
        if (!is_dir($DIR) && !mkdir($DIR, 0750, true)) fail('dir');
        $got = '';
        foreach ([date('Y-m'), date('Y-m', strtotime('first day of last month'))] as $ym) {
            $url = 'https://download.db-ip.com/free/dbip-country-lite-' . $ym . '.csv.gz';
            $fh = fopen($GZ, 'wb');
            $ch = curl_init($url);
            curl_setopt_array($ch, [CURLOPT_FILE => $fh, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 50,
                                    CURLOPT_USERAGENT => 'shinhaedal-stats/1']);
            curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            fclose($fh);
            if ($code === 200 && filesize($GZ) > 100000) { $got = $ym; break; }
        }
        if ($got === '') { @unlink($GZ); fail('download', 'DB-IP 파일을 받지 못했습니다'); }
        // 풀어 두기(다음 단계가 바이트 위치로 이어 읽을 수 있게)
        $in = gzopen($GZ, 'rb');
        $o = fopen($CSV, 'wb');
        while (!gzeof($in)) fwrite($o, gzread($in, 1 << 20));
        gzclose($in);
        fclose($o);
        @unlink($GZ);
        $db->exec('DROP TABLE IF EXISTS ip_country_new');
        $db->exec('CREATE TABLE ip_country_new LIKE ip_country');
        meta_set($db, 'geoip_pending', $got);
        out(['version' => $got, 'bytes' => filesize($CSV)]);
    }

    if ($op === 'import') {
        if (!is_file($CSV)) fail('nofile', '먼저 내려받기를 하세요');
        $offset = max(0, (int)($_POST['offset'] ?? 0));
        $size = filesize($CSV);
        $fh = fopen($CSV, 'rb');
        fseek($fh, $offset);
        $start = microtime(true);
        $batch = [];
        $rows = 0;
        $flush = function () use ($db, &$batch) {
            if (!$batch) return;
            $sql = 'INSERT IGNORE INTO ip_country_new (ip_from, ip_to, cc) VALUES ' . implode(',', array_fill(0, count($batch) / 3, '(?, ?, ?)'));
            $db->prepare($sql)->execute($batch);
            $batch = [];
        };
        while (($line = fgets($fh)) !== false) {
            $f = str_getcsv(trim($line));
            if (count($f) >= 3) {
                $a = ip16($f[0]); $b = ip16($f[1]); $c = strtoupper(trim($f[2]));
                if ($a !== null && $b !== null && preg_match('/^[A-Z]{2}$/', $c)) {
                    array_push($batch, $a, $b, $c);
                    $rows++;
                    if (count($batch) >= 1500) $flush();
                }
            }
            if (microtime(true) - $start > 15) break;   // 한 번에 15초까지만
        }
        $flush();
        $pos = ftell($fh);
        $done = feof($fh) || $pos >= $size;
        fclose($fh);
        out(['offset' => $pos, 'size' => $size, 'rows' => $rows, 'done' => $done]);
    }

    if ($op === 'swap') {
        $n = (int)$db->query('SELECT COUNT(*) FROM ip_country_new')->fetchColumn();
        if ($n < 1000) fail('small', '새 표가 너무 작습니다(' . $n . '줄) — 가져오기가 끝났는지 확인하세요');
        $db->exec('DROP TABLE IF EXISTS ip_country_old');
        $db->exec('RENAME TABLE ip_country TO ip_country_old, ip_country_new TO ip_country');
        $db->exec('DROP TABLE ip_country_old');
        $ver = meta_get($db, 'geoip_pending');
        meta_set($db, 'geoip_version', $ver);
        meta_set($db, 'geoip_pending', '');
        @unlink($CSV);
        out(['version' => $ver, 'rows' => $n]);
    }
    respond_json(400, ['ok' => false, 'code' => 'op'], $adminOrigins, 'POST, OPTIONS');
} catch (Throwable $err) {
    error_log('stats geoip: ' . $err->getMessage());
    fail('db', $err->getMessage());
}
