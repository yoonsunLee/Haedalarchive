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

    // ── 방문 통계(stats/) ──
    // 카페24 나의서비스관리 → 데이터베이스(MariaDB)에서 만든 값. 채팅·저장소에 적지 말 것
    'STATS_DB_HOST' => 'localhost',
    'STATS_DB_NAME' => '',
    'STATS_DB_USER' => '',
    'STATS_DB_PASS' => '',
    // 통계 조회·국가 DB 갱신을 허락할 아카이브 주소와 로그인 이메일(쉼표로 여럿)
    'ADMIN_ORIGINS' => 'https://yoonsunlee.github.io',
    'STATS_ADMIN_EMAILS' => '',
    // 아카이브 로그인 확인용(공개돼도 되는 값 — admin.html의 SB_URL·SB_KEY와 같음)
    'SUPABASE_URL' => '',
    'SUPABASE_ANON_KEY' => '',
];
