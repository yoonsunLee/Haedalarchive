<?php
/*
 * 홈페이지 문의 폼 접수 — 국내 웹호스팅용 (PHP)
 *
 * 흐름: Contact 폼 → (이 파일) 입력값 검사 + 스팸 방지 → 네이버 클라우드 메일 API로 작가 메일 발송
 *       문의 내용을 저장하지 않는다. 국외로 나가는 경로가 없다.
 *
 * 두 가지 요청을 받는다.
 *   GET  ?op=token  → 제출 토큰 발급 {t, n, s}
 *   POST            → 문의 접수(토큰 확인 후 메일 발송)
 *
 * 설정은 같은 폴더의 config.php 에서 읽는다(저장소에 올리지 않는다).
 */

$CFG = require __DIR__ . '/config.php';

const LIMITS = ['name' => 100, 'email' => 200, 'subject' => 200, 'message' => 5000];
const TYPES = [
    'Artwork' => '작품문의',  // 사이트 선택지와 같게(2026-09-22). 전송 값 Artwork는 그대로
    'Exhibition' => '전시',
    'Collaboration' => '협업',
    'Licensing' => '라이선싱',
    'Other' => '기타',
];
const TOKEN_MAX_AGE = 7200;   // 폼을 오래 열어두는 경우까지 감안해 2시간
const RATE_WINDOW = 600;      // 10분
const RATE_MAX = 3;
const MAIL_HOST = 'https://mail.apigw.ntruss.com';
const MAIL_PATH = '/api/v1/mails';

/* ---------- 응답 ---------- */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_map('trim', explode(',', $CFG['ALLOWED_ORIGINS']));

function respond(int $status, array $body): void
{
    global $origin, $allowed;
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: ' . (in_array($origin, $allowed, true) ? $origin : $allowed[0]));
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 3600');
    header('Cache-Control: no-store');
    if ($status !== 204) echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') respond(204, []);
if (!in_array($origin, $allowed, true)) respond(403, ['ok' => false, 'code' => 'origin']);

/* ---------- 제출 토큰 ----------
   폼을 연 브라우저에만 발급하고, 발급받은 접속과 같은 곳에서만 쓸 수 있다.
   비밀값은 서버에만 있으므로 토큰을 위조할 수 없다. */
function client_ip(): string
{
    // X-Forwarded-For는 요청자가 마음대로 넣을 수 있으므로 기본은 실제 접속 주소를 쓴다.
    // 앞단에 프록시가 있는 구성(접속 주소가 사설/예약 대역)일 때만 헤더를 참고한다.
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    $isPublic = $remote !== '' && filter_var(
        $remote, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    );
    if (!$isPublic) {
        $fwd = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($fwd !== '') return trim(explode(',', $fwd)[0]);
    }
    return $remote;
}

function ip_hash(string $secret): string
{
    return hash('sha256', $secret . ':' . client_ip());
}

function sign_token(string $secret, string $t, string $n, string $ipHash): string
{
    return rtrim(strtr(base64_encode(hash_hmac('sha256', "$t.$n.$ipHash", $secret, true)), '+/', '-_'), '=');
}

$ipHash = ip_hash($CFG['FORM_SECRET']);

if ($method === 'GET') {
    if (($_GET['op'] ?? '') !== 'token') respond(404, ['ok' => false, 'code' => 'not_found']);
    $t = sprintf('%.0f', microtime(true) * 1000);
    $n = rtrim(strtr(base64_encode(random_bytes(9)), '+/', '-_'), '=');
    respond(200, ['t' => $t, 'n' => $n, 's' => sign_token($CFG['FORM_SECRET'], $t, $n, $ipHash)]);
}
if ($method !== 'POST') respond(405, ['ok' => false, 'code' => 'method']);

/* ---------- 입력값 ---------- */
$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '', true);
if (!is_array($body)) respond(400, ['ok' => false, 'code' => 'invalid']);

$str = function (string $k) use ($body): string {
    return trim((string) ($body[$k] ?? ''));
};

// 사람 눈에는 안 보이는 칸이 채워져 있으면 봇. 봇에게는 성공한 것처럼 답해 재시도를 막는다.
if ($str('website') !== '') respond(200, ['ok' => true]);

$f = [
    'type' => $str('type'),
    'work_no' => $str('work_no'),
    'name' => $str('name'),
    'email' => $str('email'),
    'subject' => $str('subject'),
    'message' => $str('message'),
    'lang' => $str('lang') === 'en' ? 'en' : 'ko',
];
$noticeVersion = $str('notice_version');

$invalid =
    !array_key_exists($f['type'], TYPES) ||
    $f['name'] === '' || mb_strlen($f['name']) > LIMITS['name'] ||
    $f['email'] === '' || mb_strlen($f['email']) > LIMITS['email'] || !filter_var($f['email'], FILTER_VALIDATE_EMAIL) ||
    $f['subject'] === '' || mb_strlen($f['subject']) > LIMITS['subject'] ||
    $f['message'] === '' || mb_strlen($f['message']) > LIMITS['message'] ||
    ($f['work_no'] !== '' && !preg_match('/^[A-Z]{2}-\d{4}-\d{3}$/', $f['work_no'])) ||
    ($body['consent_collect'] ?? null) !== true ||
    !preg_match('/^[\w.-]{1,40}$/', $noticeVersion);
if ($invalid) respond(400, ['ok' => false, 'code' => 'invalid']);

$t = $str('token_t');
$n = $str('token_n');
$s = $str('token_s');
$tokenOk = $t !== '' && $n !== '' && $s !== ''
    && hash_equals(sign_token($CFG['FORM_SECRET'], $t, $n, $ipHash), $s)
    && (microtime(true) * 1000 - (float) $t) < TOKEN_MAX_AGE * 1000;
if (!$tokenOk) respond(400, ['ok' => false, 'code' => 'expired']);

/* ---------- 같은 곳에서 반복 접수 / 같은 내용 재전송 제한 ----------
   개인정보는 남기지 않는다. 되돌릴 수 없는 해시값과 시각만 잠시 보관하고 지운다. */
$dir = __DIR__ . '/_rate';
if (!is_dir($dir)) @mkdir($dir, 0700, true);
$file = $dir . '/' . substr($ipHash, 0, 32) . '.json';
$now = time();
$rows = [];
if (is_file($file)) {
    $rows = json_decode((string) file_get_contents($file), true) ?: [];
    $rows = array_values(array_filter($rows, function ($r) use ($now) { return $now - (isset($r['at']) ? $r['at'] : 0) < RATE_WINDOW; }));
}
$dup = hash('sha256', $f['email'] . '|' . $f['subject'] . '|' . $f['message']);
if (count($rows) >= RATE_MAX) respond(429, ['ok' => false, 'code' => 'rate']);
foreach ($rows as $r) {
    if (($r['dup'] ?? '') === $dup) respond(429, ['ok' => false, 'code' => 'duplicate']);
}
// 일단 '시도'로만 적는다. 중복 표시는 메일이 실제로 나간 뒤에 붙인다
// (발송이 실패했는데 중복으로 막혀 다시 못 보내는 일이 없도록).
$rows[] = ['at' => $now, 'dup' => null];
@file_put_contents($file, json_encode($rows), LOCK_EX);

/** 메일이 나간 뒤에만 중복 기록을 확정하고 접수 완료로 답한다 */
function finish_ok(string $file, array $rows, string $dup): void
{
    $rows[count($rows) - 1]['dup'] = $dup;
    @file_put_contents($file, json_encode($rows), LOCK_EX);
    respond(200, ['ok' => true]);
}

// 만료된 기록 청소 — 요청이 올 때마다 확인한다(처리방침 4항)
foreach (glob($dir . '/*.json') ?: [] as $old) {
    if ($now - (int) filemtime($old) > RATE_WINDOW) @unlink($old);
}

/* ---------- 메일 본문 ---------- */
function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$replyHref = 'mailto:' . rawurlencode($f['email']) . '?subject=' . rawurlencode('Re: ' . $f['subject']);
$workLine = $f['work_no'] === '' ? '' :
    '<p style="margin:0 0 6px"><b>작품</b> ' . esc($f['work_no']) .
    ' — <a href="' . esc($CFG['SITE_BASE']) . '/works/w/' . rawurlencode($f['work_no']) . '/">작품 페이지 열기</a></p>';

$html = '<div style="font-family:system-ui,\'Apple SD Gothic Neo\',sans-serif;font-size:15px;line-height:1.7;color:#15171c">'
    . '<p style="margin:0 0 4px;color:#6b7280;font-size:13px">홈페이지 문의 · ' . esc(TYPES[$f['type']]) . '</p>'
    . '<h2 style="margin:0 0 14px;font-size:18px">' . esc($f['subject']) . '</h2>'
    . '<p style="margin:0 0 6px"><b>보낸 사람</b> ' . esc($f['name']) . '</p>'
    . '<p style="margin:0 0 6px"><b>회신 주소</b> <a href="' . esc($replyHref) . '">' . esc($f['email']) . '</a></p>'
    . $workLine
    . '<p style="margin:0 0 6px"><b>작성 언어</b> ' . ($f['lang'] === 'en' ? '영문' : '국문') . '</p>'
    . '<p style="margin:0 0 6px"><b>동의</b> 개인정보 수집·이용 동의 (고지문 ' . esc($noticeVersion) . ')</p>'
    . '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">'
    . '<div style="white-space:pre-wrap">' . esc($f['message']) . '</div>'
    . '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">'
    . '<p style="margin:0 0 4px"><a href="' . esc($replyHref) . '" style="font-weight:600">이 문의에 답장하기 →</a></p>'
    . '<p style="margin:0;color:#6b7280;font-size:13px">개인정보 처리방침에 따라 회신이 끝나고 1년이 지나면 이 메일을 지워 주세요.</p>'
    . '</div>';

/* ---------- 발송 ----------
   MAIL_MODE 로 방식을 고른다.
     'php' — 호스팅 서버가 직접 보낸다(추가 업체 없음, 기본값)
     'ncp' — 네이버 클라우드 메일 API (SENS 마이그레이션이 끝나면 쓸 수 있다) */
$mode = isset($CFG['MAIL_MODE']) && $CFG['MAIL_MODE'] !== '' ? $CFG['MAIL_MODE'] : 'php';

if ($mode === 'php') {
    $fromAddr = isset($CFG['MAIL_FROM_HOST']) && $CFG['MAIL_FROM_HOST'] !== ''
        ? $CFG['MAIL_FROM_HOST']
        : 'noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        'From: =?UTF-8?B?' . base64_encode($CFG['MAIL_FROM_NAME']) . '?= <' . $fromAddr . '>',
        // 작가가 알림 메일에서 바로 답장하면 문의하신 분께 간다
        'Reply-To: ' . $f['email'],
        'X-Mailer: shinhaedal-contact',
    ];
    $sent = mail(
        $CFG['MAIL_TO'],
        '=?UTF-8?B?' . base64_encode('[' . TYPES[$f['type']] . '] ' . $f['subject']) . '?=',
        chunk_split(base64_encode($html)),
        implode("
", $headers)
    );
    if (!$sent) {
        error_log('contact: 메일 발송 실패 (php mail)');
        respond(502, ['ok' => false, 'code' => 'mail']);
    }
    finish_ok($file, $rows, $dup);
}

/* ---------- 네이버 클라우드 메일 API ---------- */
$ts = sprintf('%.0f', microtime(true) * 1000);
$sig = base64_encode(hash_hmac('sha256', "POST " . MAIL_PATH . "\n" . $ts . "\n" . $CFG['NCP_ACCESS_KEY'], $CFG['NCP_SECRET_KEY'], true));
$payload = json_encode([
    'senderAddress' => $CFG['MAIL_FROM'],
    'senderName' => $CFG['MAIL_FROM_NAME'],
    'title' => '[' . TYPES[$f['type']] . '] ' . $f['subject'],
    'body' => $html,
    'recipients' => [['address' => $CFG['MAIL_TO'], 'type' => 'R']],
    'individual' => true,
    'advertising' => false,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init(MAIL_HOST . MAIL_PATH);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json; charset=utf-8',
        'x-ncp-apigw-timestamp: ' . $ts,
        'x-ncp-iam-access-key: ' . $CFG['NCP_ACCESS_KEY'],
        'x-ncp-apigw-signature-v2: ' . $sig,
    ],
]);
curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if ($status < 200 || $status >= 300) {
    // 오류 기록에 문의 내용·연락처를 남기지 않는다
    error_log('contact: 메일 발송 실패 ' . $status);
    respond(502, ['ok' => false, 'code' => 'mail']);
}
finish_ok($file, $rows, $dup);
