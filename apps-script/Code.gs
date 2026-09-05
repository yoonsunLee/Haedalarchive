/**
 * 신해달 작품 아카이브 — 구글 시트 API (Google Apps Script) v3
 *
 * v2 변경점 (2026-08):
 *  1) 조회(GET) 공개/관리자 분리 — 토큰 없이 조회하면 공개 필드만 반환
 *     (실거래가·소장자·결제방식 등 민감정보는 토큰 있어야만 반환)
 *  2) 전시(exhibitions) 시트 추가 — 조회: GET ?sheet=exhibitions / 관리: POST ex_add·ex_update·ex_delete
 *     (홈페이지 동기화 로봇은 토큰 없이 공개 필드만 읽어감)
 *
 * v3 변경점:
 *  3) Press(기사) 시트 추가 — 조회: GET ?sheet=press / 관리: POST press_add·press_update·press_delete
 *     (exhibitions와 동일한 패턴. 민감정보가 없어 토큰 없이도 전체 필드 공개)
 */
const SHEET_ID = '14gYnblfAlLo-IPYMEvBj7eBHj4hFgf4AI6qqXME7NeU'; // 신해달 작품 아카이브 DB
const BACKUP_FOLDER_ID = '1HFZIzNCmnM9LSbxlrFVdgepyPSQhdDh4';    // 드라이브 '신해달 작품 아카이브' 폴더
const IMAGES_FOLDER_ID = '14kxWRLJvprm9bJBzlm9Oa1Vmie6XhtnH';    // 드라이브 images 폴더
const TOKEN = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');

// audio_master/transcript_ko/transcript_en은 시트에 U~W열로 컬럼을 추가한 뒤에만 실제로 채워짐
// title_en/caption_en/material_en은 X~Z열 (없어도 읽기/쓰기 자체는 안전 — 빈 값으로 처리됨)
const KEYS = ['no','image','title','caption','material','size','year','price','sold',
  'discount','actual_price','payment','sale_date','delivery_date','channel','owner',
  'exhibitions','note','qty','sold_qty','audio_master','transcript_ko','transcript_en',
  'title_en','caption_en','material_en'];

// 토큰 없이 조회할 때(=홈페이지·외부) 공개되는 필드. 판매가격(price)은 비공개 방침.
const PUBLIC_KEYS = ['no','image','title','caption','material','size','year','exhibitions',
  'title_en','caption_en','material_en'];

// 전시 시트 (없으면 자동 생성) — title_en/venue_en은 J~K열
const EX_SHEET = 'exhibitions';
const EX_KEYS = ['id','title','venue','start_date','end_date','work_nos','docent_url','type','note_public',
  'title_en','venue_en'];

// Press(기사) 시트 (없으면 자동 생성) — title_en/quote_en은 I~J열
const PRESS_SHEET = 'Press';
const PRESS_KEYS = ['no','outlet','date','title','url','quote','image','note','title_en','quote_en'];

function sheet_() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  ensureColumns_(sh, KEYS);
  return sh;
}

function exSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(EX_SHEET);
  if (!sh) { sh = ss.insertSheet(EX_SHEET); sh.appendRow(EX_KEYS); }
  ensureColumns_(sh, EX_KEYS);
  return sh;
}

function pressSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(PRESS_SHEET);
  if (!sh) { sh = ss.insertSheet(PRESS_SHEET); sh.appendRow(PRESS_KEYS); }
  ensureColumns_(sh, PRESS_KEYS);
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 공용: 시트 → 행 객체 배열 (날짜 포맷 및 빈행 스킵, withRow=true면 _row 포함) */
function readRows_(sh, keys, dateFmt, withRow) {
  const values = sh.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i].join('') === '') continue;
    const r = {};
    keys.forEach(function(k, j) {
      let v = values[i][j];
      if (v instanceof Date) v = Utilities.formatDate(v, 'Asia/Seoul', dateFmt);
      r[k] = v === null || v === undefined ? '' : v;
    });
    if (withRow) r._row = i + 1;
    rows.push(r);
  }
  return rows;
}

// 자동 생성되는 컬럼의 표시 이름. 여기 없는 키는 키 이름을 그대로 헤더로 쓴다.
const COLUMN_LABELS = {
  audio_master: '오디오 원본', transcript_ko: '대본(한글)', transcript_en: '대본(영문)',
  title_en: '작품명(영문)', caption_en: '캡션(영문)', material_en: '재료(영문)',
  venue_en: '장소(영문)', quote_en: '인용(영문)'
};

/**
 * 공용: 시트 컬럼 수가 KEYS보다 모자라면 자동으로 늘리고 비어있는 헤더만 채운다.
 *
 * 이 매핑은 헤더 이름이 아니라 '위치'로 동작하기 때문에, 사람이 시트에서 컬럼을 직접
 * 추가하다가 순서를 틀리거나 중간에 끼워넣으면 기존 데이터가 통째로 밀려 어긋난다.
 * 그래서 컬럼 생성은 사람이 아니라 이 함수가 담당한다.
 * 이미 값이 있는 헤더는 절대 덮어쓰지 않는다(기존 한글 헤더 보존).
 */
function ensureColumns_(sh, keys) {
  const need = keys.length;
  const maxCols = sh.getMaxColumns();
  if (maxCols < need) sh.insertColumnsAfter(maxCols, need - maxCols);
  const header = sh.getRange(1, 1, 1, need).getValues()[0];
  let changed = false;
  for (let j = 0; j < need; j++) {
    if (String(header[j] === null || header[j] === undefined ? '' : header[j]).trim() === '') {
      header[j] = COLUMN_LABELS[keys[j]] || keys[j];
      changed = true;
    }
  }
  if (changed) sh.getRange(1, 1, 1, need).setValues([header]);
}

/**
 * 공용: 기존 행 값을 보존하며 보내온 필드만 갱신한다.
 *
 * 이 함수가 없으면(=예전처럼 행 전체를 통째로 setValues 하면) 화면이 모르는 컬럼이
 * 전부 ''로 지워진다. 실제로 관리자 화면의 KEYS는 sold_qty까지인데 백엔드 KEYS에는
 * audio_master, transcript_ko, transcript_en, title_en, caption_en, material_en이
 * 더 있어서, 작품을 한 번 수정하면 그 컬럼들이 조용히 날아가는 사고가 났다.
 *
 * 규칙: req.row에 키가 아예 없으면(undefined) = 화면이 그 필드를 모르는 것 → 기존값 유지.
 *       빈 문자열('')이 왔으면 = 사용자가 의도적으로 지운 것 → 그대로 반영.
 */
function mergeRow_(sh, rowIndex, keys, incoming) {
  const existing = sh.getRange(rowIndex, 1, 1, keys.length).getValues()[0];
  return keys.map(function(k, j) {
    if (incoming[k] === undefined) return existing[j] === undefined ? '' : existing[j];
    return incoming[k];
  });
}

/** 공용: id/no가 첫 컬럼인 시트에서 행 위치 찾기 (없으면 -1) */
function findByFirstCol_(sh, val) {
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++)
    if (String(values[i][0]).trim() === String(val).trim()) return i + 1;
  return -1;
}

/**
 * 조회
 *  GET ?sheet=exhibitions               → 전시 목록 (전 필드 공개 설계)
 *  GET ?sheet=press                     → Press(기사) 목록 (전 필드 공개 설계)
 *  GET ?action=list                     → 공개 필드만 (홈페이지 동기화용)
 *  GET ?action=list&token=***           → 전체 필드 + _row (아카이브 관리 화면용)
 */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.sheet === 'exhibitions') {
      return json_({ ok: true, rows: readRows_(exSheet_(), EX_KEYS, 'yyyy-MM-dd', false) });
    }
    if (p.sheet === 'press') {
      return json_({ ok: true, rows: readRows_(pressSheet_(), PRESS_KEYS, 'yyyy-MM-dd', true) });
    }
    const admin = p.token === TOKEN;
    if (admin) {
      return json_({ ok: true, rows: readRows_(sheet_(), KEYS, 'yyyy.MM.dd', true) });
    }
    const pub = readRows_(sheet_(), KEYS, 'yyyy.MM.dd', false).map(function(r) {
      const o = {};
      PUBLIC_KEYS.forEach(function(k) { o[k] = r[k]; });
      return o;
    });
    return json_({ ok: true, public: true, rows: pub });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** 입력/수정: POST {action:'add'|'update'|'delete'|'ex_add'|'ex_update'|'ex_delete'|'press_add'|'press_update'|'press_delete'|..., token, row:{...}} */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.token !== TOKEN) return json_({ ok: false, error: '비밀번호가 일치하지 않습니다' });
    if (String(req.data || '').length > 44000000) return json_({ ok: false, error: '파일이 너무 큽니다 (30MB 이하만 가능)' });
    lock.waitLock(20000);

    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    const findRow = function(no) {
      for (let i = 1; i < values.length; i++)
        if (String(values[i][0]).trim() === String(no).trim()) return i + 1;
      return -1;
    };

    if (req.action === 'add') {
      const no = String(req.row.no || '').trim();
      if (no && findRow(no) !== -1) return json_({ ok: false, error: '이미 존재하는 작품번호입니다: ' + no });
      sh.appendRow(KEYS.map(function(k){ return req.row[k] === undefined ? '' : req.row[k]; }));
    } else if (req.action === 'update') {
      const no = String(req.row.no || '').trim();
      // 위치 정보(_row)를 항상 우선 사용한다. 번호로 먼저 찾으면 사용자가 작품번호를
      // 다른 작품이 이미 쓰는 번호로 바꿔 저장할 때 엉뚱한 행을 덮어쓰는 사고로 이어질 수 있다.
      let r = -1;
      let viaRow = false;
      if (req.row._row) {
        const idx = parseInt(req.row._row, 10);
        if (idx >= 2 && idx <= values.length) { r = idx; viaRow = true; }
      }
      if (r === -1 && no) r = findRow(no);
      if (r === -1) return json_({ ok: false, error: '수정할 행을 찾을 수 없습니다: ' + (no || '(번호 없음)') });
      // 안전장치: 위치로 찾은 경우 원래 제목과 대조 (행 밀림으로 인한 오수정 방지)
      if (viaRow && req.row._expect !== undefined) {
        const t = String(values[r - 1][2]).split('\n')[0].trim();
        if (t !== String(req.row._expect).trim()) return json_({ ok: false, error: '화면 정보가 최신이 아닙니다. 새로고침(↻) 후 다시 시도하세요.' });
      }
      if (no) {
        const dup = findRow(no);
        if (dup !== -1 && dup !== r) return json_({ ok: false, error: '이미 존재하는 작품번호입니다: ' + no });
      }
      sh.getRange(r, 1, 1, KEYS.length).setValues([mergeRow_(sh, r, KEYS, req.row)]);
    } else if (req.action === 'delete') {
      const no = String(req.no || '').trim();
      let r = no ? findRow(no) : -1;
      if (r === -1 && req._row) {
        const idx = parseInt(req._row, 10);
        if (idx >= 2 && idx <= values.length) r = idx;
      }
      if (r === -1) return json_({ ok: false, error: '삭제할 행을 찾을 수 없습니다: ' + (no || '(번호 없음)') });
      if (req.expect !== undefined) {
        const t = String(values[r - 1][2]).split('\n')[0].trim();
        if (t !== String(req.expect).trim()) return json_({ ok: false, error: '화면 정보가 최신이 아닙니다. 새로고침(↻) 후 다시 시도하세요.' });
      }
      sh.deleteRow(r);
    } else if (req.action === 'ex_add') {
      const sh2 = exSheet_();
      const row = req.row || {};
      let id = String(row.id || '').trim();
      if (!id) {
        id = 'EX-' + new Date().getFullYear() + '-' + ('0' + Math.max(1, sh2.getLastRow())).slice(-2);
      }
      if (findByFirstCol_(sh2, id) !== -1) return json_({ ok: false, error: '이미 존재하는 전시 ID입니다: ' + id });
      row.id = id;
      sh2.appendRow(EX_KEYS.map(function(k){ return row[k] === undefined ? '' : row[k]; }));
      return json_({ ok: true, id: id });
    } else if (req.action === 'ex_update') {
      const sh2 = exSheet_();
      const id = String((req.row && req.row.id) || '').trim();
      const r = findByFirstCol_(sh2, id);
      if (r === -1) return json_({ ok: false, error: '수정할 전시를 찾을 수 없습니다: ' + id });
      sh2.getRange(r, 1, 1, EX_KEYS.length).setValues([mergeRow_(sh2, r, EX_KEYS, req.row)]);
    } else if (req.action === 'ex_delete') {
      const sh2 = exSheet_();
      const id = String(req.id || '').trim();
      const r = findByFirstCol_(sh2, id);
      if (r === -1) return json_({ ok: false, error: '삭제할 전시를 찾을 수 없습니다: ' + id });
      sh2.deleteRow(r);
    } else if (req.action === 'press_add') {
      const sh2 = pressSheet_();
      const row = req.row || {};
      let no = String(row.no || '').trim();
      if (!no) {
        no = 'PR-' + new Date().getFullYear() + '-' + ('00' + Math.max(1, sh2.getLastRow())).slice(-3);
      }
      if (findByFirstCol_(sh2, no) !== -1) return json_({ ok: false, error: '이미 존재하는 번호입니다: ' + no });
      row.no = no;
      sh2.appendRow(PRESS_KEYS.map(function(k){ return row[k] === undefined ? '' : row[k]; }));
      return json_({ ok: true, no: no });
    } else if (req.action === 'press_update') {
      const sh2 = pressSheet_();
      const no = String((req.row && req.row.no) || '').trim();
      const r = findByFirstCol_(sh2, no);
      if (r === -1) return json_({ ok: false, error: '수정할 기사를 찾을 수 없습니다: ' + no });
      sh2.getRange(r, 1, 1, PRESS_KEYS.length).setValues([mergeRow_(sh2, r, PRESS_KEYS, req.row)]);
    } else if (req.action === 'press_delete') {
      const sh2 = pressSheet_();
      const no = String(req.no || '').trim();
      const r = findByFirstCol_(sh2, no);
      if (r === -1) return json_({ ok: false, error: '삭제할 기사를 찾을 수 없습니다: ' + no });
      sh2.deleteRow(r);
    } else if (req.action === 'link_image') {
      const no = String(req.no || '').trim();
      const r = findRow(no);
      if (r === -1) return json_({ ok: false, error: '작품번호를 찾을 수 없습니다: ' + no });
      const file = DriveApp.getFileById(String(req.fileId));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      sh.getRange(r, 2).setValue('drive:' + file.getId());
      return json_({ ok: true, id: file.getId() });
    } else if (req.action === 'upload_image') {
      const bytes = Utilities.base64Decode(req.data);
      const blob = Utilities.newBlob(bytes, req.mimeType || 'image/jpeg', req.filename || ('artwork_' + Date.now() + '.jpg'));
      const file = DriveApp.getFolderById(IMAGES_FOLDER_ID).createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return json_({ ok: true, id: file.getId() });
    } else if (req.action === 'publish') {
      // 홈페이지 발행 트리거 — GitHub repository_dispatch로 shinhaedal 저장소의
      // publish.yml(작품 발행 파이프라인)을 즉시 실행시킨다.
      const ghToken = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');
      if (!ghToken) return json_({ ok: false, error: 'GITHUB_PAT가 스크립트 속성에 설정되지 않았습니다' });
      const resp = UrlFetchApp.fetch('https://api.github.com/repos/yoonsunLee/shinhaedal/dispatches', {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + ghToken, Accept: 'application/vnd.github+json' },
        payload: JSON.stringify({ event_type: 'archive-publish' }),
        muteHttpExceptions: true
      });
      const code = resp.getResponseCode();
      if (code !== 204) return json_({ ok: false, error: 'GitHub 요청 실패 (' + code + '): ' + resp.getContentText() });
      return json_({ ok: true });
    } else {
      return json_({ ok: false, error: '알 수 없는 action: ' + req.action });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

/**
 * (선택) 엑셀 자동 백업 — 트리거로 매일 실행 등록 가능
 */
function backupXlsx() {
  const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=xlsx';
  const blob = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  }).getBlob();
  const date = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  blob.setName('백업_신해달작품아카이브_' + date + '.xlsx');
  DriveApp.getFolderById(BACKUP_FOLDER_ID).createFile(blob);
}
