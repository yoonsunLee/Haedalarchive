<?php
/*
 * 메일 발송 진단용 — 한 번 쓰고 반드시 지운다.
 * 브라우저에서 https://shinhaedalapi.mycafe24.com/mailtest.php 를 열면
 * 네이버 클라우드 메일 API가 돌려준 상태 코드와 메시지를 그대로 보여준다.
 * 비밀값은 출력하지 않는다(길이와 앞 4글자만).
 */
header('Content-Type: text/plain; charset=utf-8');

$CFG = require __DIR__ . '/config.php';

echo "== 설정 확인 ==\n";
foreach (['NCP_ACCESS_KEY', 'NCP_SECRET_KEY', 'MAIL_FROM', 'MAIL_FROM_NAME', 'MAIL_TO', 'FORM_SECRET'] as $k) {
    $v = isset($CFG[$k]) ? (string) $CFG[$k] : '';
    $shown = in_array($k, ['MAIL_FROM', 'MAIL_FROM_NAME'], true) ? $v : (substr($v, 0, 4) . '… (' . strlen($v) . '자)');
    echo str_pad($k, 16) . ': ' . ($v === '' ? '!! 비어 있음' : $shown) . "\n";
}
echo "PHP " . PHP_VERSION . ' / curl ' . (function_exists('curl_init') ? '있음' : '!! 없음')
    . ' / mbstring ' . (function_exists('mb_strlen') ? '있음' : '!! 없음') . "\n\n";

$path = '/api/v1/mails';
$ts = sprintf('%.0f', microtime(true) * 1000);
$sig = base64_encode(hash_hmac('sha256', "POST " . $path . "\n" . $ts . "\n" . $CFG['NCP_ACCESS_KEY'], $CFG['NCP_SECRET_KEY'], true));

$payload = json_encode([
    'senderAddress' => $CFG['MAIL_FROM'],
    'senderName' => $CFG['MAIL_FROM_NAME'],
    'title' => '[진단] 발송 시험',
    'body' => '<p>발송 경로 진단용 메일입니다.</p>',
    'recipients' => [['address' => $CFG['MAIL_TO'], 'type' => 'R']],
    'individual' => true,
    'advertising' => false,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://mail.apigw.ntruss.com' . $path);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json; charset=utf-8',
        'x-ncp-apigw-timestamp: ' . $ts,
        'x-ncp-iam-access-key: ' . $CFG['NCP_ACCESS_KEY'],
        'x-ncp-apigw-signature-v2: ' . $sig,
    ],
]);
$res = curl_exec($ch);
echo "== 메일 API 응답 ==\n";
echo '상태 코드: ' . (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE) . "\n";
if ($res === false) echo 'curl 오류: ' . curl_error($ch) . "\n";
echo "본문: " . (string) $res . "\n";
curl_close($ch);
