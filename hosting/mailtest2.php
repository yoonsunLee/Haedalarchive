<?php
/*
 * 메일 발송 방식 찾기 — 프로젝트를 지정하는 방법이 무엇인지 여러 형태로 시험해 본다.
 * 한 번 쓰고 반드시 지운다. 비밀값은 출력하지 않는다.
 *
 * config.php 에 아래 두 줄을 추가하고 올린 뒤 이 파일을 브라우저로 연다.
 *   'MAIL_PROJECT_KEY' => '콘솔 Mail → Domain Management → [Project Key 확인] 에서 복사',
 *   'MAIL_SERVICE_ID'  => 'ncp:mail:kr:145804961024289:shinhaedal',
 */
header('Content-Type: text/plain; charset=utf-8');

$CFG = require __DIR__ . '/config.php';
$projectKey = isset($CFG['MAIL_PROJECT_KEY']) ? (string) $CFG['MAIL_PROJECT_KEY'] : '';
$serviceId = isset($CFG['MAIL_SERVICE_ID']) ? (string) $CFG['MAIL_SERVICE_ID'] : '';

echo 'MAIL_PROJECT_KEY: ' . ($projectKey === '' ? '(없음)' : substr($projectKey, 0, 4) . '… (' . strlen($projectKey) . '자)') . "\n";
echo 'MAIL_SERVICE_ID : ' . ($serviceId === '' ? '(없음)' : $serviceId) . "\n\n";

function call(string $label, string $path, array $extraHeaders, array $extraBody, array $CFG): void
{
    $ts = sprintf('%.0f', microtime(true) * 1000);
    $sig = base64_encode(hash_hmac('sha256', "POST " . $path . "\n" . $ts . "\n" . $CFG['NCP_ACCESS_KEY'], $CFG['NCP_SECRET_KEY'], true));
    $body = array_merge([
        'senderAddress' => $CFG['MAIL_FROM'],
        'senderName' => $CFG['MAIL_FROM_NAME'],
        'title' => '[진단] 발송 시험',
        'body' => '<p>발송 경로 진단용 메일입니다.</p>',
        'recipients' => [['address' => $CFG['MAIL_TO'], 'type' => 'R']],
        'individual' => true,
        'advertising' => false,
    ], $extraBody);

    $headers = array_merge([
        'Content-Type: application/json; charset=utf-8',
        'x-ncp-apigw-timestamp: ' . $ts,
        'x-ncp-iam-access-key: ' . $CFG['NCP_ACCESS_KEY'],
        'x-ncp-apigw-signature-v2: ' . $sig,
    ], $extraHeaders);

    $ch = curl_init('https://mail.apigw.ntruss.com' . $path);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    echo str_pad($label, 34) . ' → ' . $code . ' ' . substr((string) $res, 0, 200) . "\n";
}

$pk = $projectKey;
$sid = $serviceId;

call('① 그대로', '/api/v1/mails', [], [], $CFG);
if ($pk !== '') {
    call('② 헤더 x-ncp-mail-project-key', '/api/v1/mails', ['x-ncp-mail-project-key: ' . $pk], [], $CFG);
    call('③ 본문 projectKey', '/api/v1/mails', [], ['projectKey' => $pk], $CFG);
    call('④ 경로 /projects/{key}/mails', '/api/v1/projects/' . rawurlencode($pk) . '/mails', [], [], $CFG);
}
if ($sid !== '') {
    call('⑤ 헤더 x-ncp-mail-service-id', '/api/v1/mails', ['x-ncp-mail-service-id: ' . $sid], [], $CFG);
    call('⑥ 본문 serviceId', '/api/v1/mails', [], ['serviceId' => $sid], $CFG);
}

echo "\n2xx(200·201)가 나온 줄이 정답입니다. 성공한 줄이 있으면 그 방식으로 접수 코드를 맞춥니다.\n";
