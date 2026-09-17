<?php
/*
 * contact.php 설정 — 이 파일을 config.php 로 복사해서 값을 채운 뒤 호스팅에 올린다.
 * config.php 는 저장소에 올리지 않는다(비밀값 포함).
 */
return [
    // 네이버 클라우드 인증키 (마이페이지 → 계정관리 → 인증키 관리)
    'NCP_ACCESS_KEY' => '',
    'NCP_SECRET_KEY' => '',

    // 발신 주소 — SENS Mail에서 도메인 인증을 마친 도메인이어야 한다
    'MAIL_FROM' => 'noreply@shinhaedal.com',
    'MAIL_FROM_NAME' => 'SHIN HAEDAL',

    // 작가가 문의 알림을 받을 주소
    'MAIL_TO' => '',

    // 제출 토큰 서명용 임의 문자열 (32자 이상)
    //   python -c "import secrets; print(secrets.token_urlsafe(32))"
    'FORM_SECRET' => '',

    // 이 주소에서 온 요청만 받는다
    'ALLOWED_ORIGINS' => 'https://shinhaedal.com,https://www.shinhaedal.com',

    // 메일 본문의 작품 링크 기준 주소
    'SITE_BASE' => 'https://shinhaedal.com',
];
