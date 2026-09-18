<?php
/*
 * 발송 방법 2안 시험 — 호스팅 서버가 직접 메일을 보낸다(PHP mail).
 * 네이버 클라우드 없이도 되는지 확인용. 한 번 쓰고 지운다.
 */
header('Content-Type: text/plain; charset=utf-8');

$CFG = require __DIR__ . '/config.php';
$to = (string) $CFG['MAIL_TO'];

// 발신 주소는 이 호스팅이 가진 도메인이어야 스팸으로 덜 걸린다
$host = $_SERVER['HTTP_HOST'] ?? 'shinhaedalapi.mycafe24.com';
$from = 'noreply@' . $host;

$subject = '[진단2] 호스팅 직접 발송 시험';
$html = '<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.7">'
    . '<p>카페24 서버가 직접 보낸 진단 메일입니다.</p>'
    . '<p>이 메일이 <b>받은메일함</b>에 도착했는지, <b>스팸함</b>에 들어갔는지 알려주세요.</p>'
    . '</div>';

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    'From: ' . '=?UTF-8?B?' . base64_encode('SHIN HAEDAL') . '?= <' . $from . '>',
    'Reply-To: ' . $to,
    'X-Mailer: shinhaedal-contact',
];

$ok = mail(
    $to,
    '=?UTF-8?B?' . base64_encode($subject) . '?=',
    chunk_split(base64_encode($html)),
    implode("\r\n", $headers)
);

echo "보내는 주소: $from\n";
echo "받는 주소  : " . substr($to, 0, 4) . "… (" . strlen($to) . "자)\n";
echo "mail() 결과: " . ($ok ? '성공(서버가 접수함)' : '실패') . "\n\n";
echo "받은메일함과 스팸함을 모두 확인해 주세요.\n";
