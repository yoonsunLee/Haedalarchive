-- 갤러리 방명록 — 카페24 MariaDB(방문 통계와 같은 DB)
-- 따로 실행할 필요 없다: gb.php · admin.php가 처음 불릴 때 이 파일을 그대로 실행해 표를 만든다(CREATE TABLE IF NOT EXISTS).
--
-- 개인정보를 받지 않는다(작가님 결정 2026-11-27): 아이디는 서버가 주는 랜덤 아이디(고칠 수 없음), 글, 남긴 시각만 둔다.
-- IP·기기 정보·쿠키는 저장하지 않는다. 남긴 글은 작가(관리 화면)와 쓴 사람(자기 브라우저에 남긴 사본)만 본다.

-- 1) 랜덤 아이디 — 겹치지 않게 여기서 한 번만 준다. k: 그 아이디로 글을 쓸 때 맞춰 보는 비밀값의 해시(원래 값은 쓴 사람 브라우저에만)
CREATE TABLE IF NOT EXISTS gb_ids (
  gid     VARCHAR(40)  NOT NULL PRIMARY KEY,
  k       BINARY(32)   NOT NULL,
  created DATETIME     NOT NULL,
  last_at DATETIME     NULL,
  day     DATE         NULL,
  day_n   INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) 방명록 글. beta: 숨은 시험 주소로 남긴 글(열기 전에 관리 화면에서 한 번에 지운다)
CREATE TABLE IF NOT EXISTS gb_entries (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  gid     VARCHAR(40)  NOT NULL,
  body    TEXT         NOT NULL,
  created DATETIME     NOT NULL,
  beta    TINYINT(1)   NOT NULL DEFAULT 0,
  KEY (created)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) 하루 합계(도배 막기용 상한). 날짜 × 종류(id 아이디 발급 · post 글)마다 수만
CREATE TABLE IF NOT EXISTS gb_daily (
  day  DATE        NOT NULL,
  kind VARCHAR(8)  CHARACTER SET ascii NOT NULL,
  n    INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind)
) ENGINE=InnoDB;
