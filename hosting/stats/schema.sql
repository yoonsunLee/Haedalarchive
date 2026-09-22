-- 방문 통계 — 카페24 MariaDB (phpMyAdmin → SQL 탭에 붙여넣고 실행)
--
-- 날짜 × 항목별 '합계 숫자'만 저장한다. 방문자별 기록·IP 원문·식별자는 어디에도 남기지 않는다.
-- 다시 돌려도 안전하다(있는 표는 그대로 둔다).

-- 1) 합계 — (날짜, 항목, 대상, 국가, 들어온 곳, 기기, 언어)마다 한 줄
--    metric: pv 페이지뷰 · visit 방문 · visitor 방문자 · click 클릭 · clickv 누른 방문 · scroll 스크롤 깊이 도달
--            dwell 머문 시간(구간별 수 + 초 합) · reach 구역 도달 · zdwell 구역별 머문 시간 · wview 작품 열람 · wdwell 작품별 머문 시간
--    k1 · k2: 페이지 주소, 버튼 이름, 작품번호, 구간 등(영문·숫자만)
CREATE TABLE IF NOT EXISTS stat_counts (
  day    DATE                         NOT NULL,
  metric VARCHAR(12)  CHARACTER SET ascii NOT NULL,
  k1     VARCHAR(64)  CHARACTER SET ascii NOT NULL DEFAULT '',
  k2     VARCHAR(64)  CHARACTER SET ascii NOT NULL DEFAULT '',
  cc     CHAR(2)      CHARACTER SET ascii NOT NULL DEFAULT '--',
  src    VARCHAR(24)  CHARACTER SET ascii NOT NULL DEFAULT '',
  dev    CHAR(1)      CHARACTER SET ascii NOT NULL DEFAULT '',
  lang   CHAR(2)      CHARACTER SET ascii NOT NULL DEFAULT '',
  n      INT UNSIGNED    NOT NULL DEFAULT 0,
  total  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric, k1, k2, cc, src, dev, lang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) 국가 판별용 IP 대역(DB-IP Lite, CC BY 4.0) — IPv4도 IPv6 형식(::ffff:a.b.c.d)의 16바이트로 넣는다
CREATE TABLE IF NOT EXISTS ip_country (
  ip_from VARBINARY(16) NOT NULL,
  ip_to   VARBINARY(16) NOT NULL,
  cc      CHAR(2) CHARACTER SET ascii NOT NULL,
  PRIMARY KEY (ip_from)
) ENGINE=InnoDB;

-- 3) 과도한 요청 막기 — IP를 그날만 쓰는 비밀값과 섞어 되돌릴 수 없게 바꾼 값(16바이트)과 10분 창의 요청 수.
--    20분이 지난 줄은 수집할 때마다 지운다
CREATE TABLE IF NOT EXISTS stat_rate (
  h   BINARY(16)   NOT NULL,
  t   INT UNSIGNED NOT NULL,
  n   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (h),
  KEY (t)
) ENGINE=InnoDB;

-- 4) 설정·상태(국가 DB 판 등)
CREATE TABLE IF NOT EXISTS stat_meta (
  k VARCHAR(32) CHARACTER SET ascii NOT NULL PRIMARY KEY,
  v VARCHAR(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
