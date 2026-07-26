/**
 * 신해달 작품 아카이브 — 구글 시트 API (Google Apps Script)
 *
 * 배포 방법 (약 3분):
 *  1. https://script.google.com → [새 프로젝트]
 *  2. 이 파일 내용을 전부 붙여넣기 (기존 코드는 삭제)
 *  3. 아래 TOKEN 값을 원하는 비밀번호로 변경
 *  4. 우측 상단 [배포] → [새 배포] → 유형: 웹 앱
 *     - 실행 계정: 나
 *     - 액세스 권한: 모든 사용자
 *  5. [배포] 클릭 → 권한 승인 → 웹 앱 URL(…/exec) 복사
 *  6. 아카이브 사이트의 [설정] 탭에 URL과 비밀번호 입력
 */

const SHEET_ID = '14gYnblfAlLo-IPYMEvBj7eBHj4hFgf4AI6qqXME7NeU'; // 신해달 작품 아카이브 DB
const BACKUP_FOLDER_ID = '1HFZIzNCmnM9LSbxlrFVdgepyPSQhdDh4';   // 드라이브 '신해달 작품 아카이브' 폴더
const IMAGES_FOLDER_ID = '14kxWRLJvprm9bJBzlm9Oa1Vmie6XhtnH';   // 드라이브 images 폴더
const PORTFOLIO_FOLDER_ID = '12W3G1HMwhbpcHS8uNijNutN3TdEeLJqq'; // 드라이브 portfolio 폴더
const TOKEN = 'haedal-2026'; // ★ 반드시 나만 아는 값으로 변경하세요 ★

const KEYS = ['no','image','title','caption','material','size','year','price','sold','discount','actual_price','payment','sale_date','delivery_date','channel','owner','exhibitions','note','qty','sold_qty'];

function sheet_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 최신 포트폴리오 정보 */
function portfolioInfo_() {
  const files = DriveApp.getFolderById(PORTFOLIO_FOLDER_ID).getFilesByType(MimeType.PDF);
  let latest = null;
  while (files.hasNext()) {
    const f = files.next();
    if (!latest || f.getLastUpdated() > latest.getLastUpdated()) latest = f;
  }
  if (!latest) return { ok: true, exists: false };
  return {
    ok: true, exists: true, id: latest.getId(), name: latest.getName(),
    size: Math.round(latest.getSize() / 1048576 * 10) / 10,
    updated: Utilities.formatDate(latest.getLastUpdated(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm')
  };
}

/** 조회: GET ?action=list | ?action=portfolio */
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action === 'portfolio') return json_(portfolioInfo_());
    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i].join('') === '') continue; // 완전히 빈 행만 제외 (번호 없는 등록 예정 작품은 포함)
      const r = {};
      KEYS.forEach((k, j) => {
        let v = values[i][j];
        if (v instanceof Date) v = Utilities.formatDate(v, 'Asia/Seoul', 'yyyy.MM.dd');
        r[k] = v === null || v === undefined ? '' : v;
      });
      r._row = i + 1; // 번호 없는 행을 수정할 때 위치 식별용
      rows.push(r);
    }
    return json_({ ok: true, rows: rows });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** 입력/수정: POST {action:'add'|'update'|'delete', token, row:{...}} */
function doPost(e) {
  const lock = LockService.getScriptLock(); // 동시 쓰기 직렬화 (행 밀림 경합 원천 차단)
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.token !== TOKEN) return json_({ ok: false, error: '비밀번호가 일치하지 않습니다' });
    if (String(req.data || '').length > 44000000) return json_({ ok: false, error: '파일이 너무 큽니다 (30MB 이하만 가능)' });
    lock.waitLock(20000);

    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    const findRow = no => {
      for (let i = 1; i < values.length; i++)
        if (String(values[i][0]).trim() === String(no).trim()) return i + 1; // 1-based
      return -1;
    };

    if (req.action === 'add') {
      const no = String(req.row.no || '').trim();
      if (no && findRow(no) !== -1) return json_({ ok: false, error: '이미 존재하는 작품번호입니다: ' + no });
      sh.appendRow(KEYS.map(k => req.row[k] === undefined ? '' : req.row[k]));
    } else if (req.action === 'update') {
      const no = String(req.row.no || '').trim();
      // 위치 정보(_row)를 항상 우선 사용한다. 번호로 먼저 찾으면 사용자가 작품번호를
      // "다른 작품이 이미 쓰는 번호"로 바꿔 저장할 때 엉뚱한(그 다른) 행을 찾아 덮어쓰는
      // 사고로 이어질 수 있어, 위치 기반 조회 후 아래에서 번호 중복만 별도로 막는다.
      let r = -1;
      let viaRow = false;
      if (req.row._row) {
        const idx = parseInt(req.row._row, 10);
        if (idx >= 2 && idx <= values.length) { r = idx; viaRow = true; }
      }
      if (r === -1 && no) r = findRow(no); // 위치 정보가 없는 예외적인 경우의 폴백
      if (r === -1) return json_({ ok: false, error: '수정할 행을 찾을 수 없습니다: ' + (no || '(번호 없음)') });
      // 안전장치: 위치로 찾은 경우 원래 제목과 대조 (행 밀림으로 인한 오수정 방지)
      if (viaRow && req.row._expect !== undefined) {
        const t = String(values[r - 1][2]).split('\n')[0].trim();
        if (t !== String(req.row._expect).trim()) return json_({ ok: false, error: '화면 정보가 최신이 아닙니다. 새로고침(↻) 후 다시 시도하세요.' });
      }
      if (no) { // 번호 중복 방지: 다른 행이 이미 같은 번호를 쓰고 있으면 거부
        const dup = findRow(no);
        if (dup !== -1 && dup !== r) return json_({ ok: false, error: '이미 존재하는 작품번호입니다: ' + no });
      }
      sh.getRange(r, 1, 1, KEYS.length).setValues([KEYS.map(k => req.row[k] === undefined ? '' : req.row[k])]);
    } else if (req.action === 'delete') {
      const no = String(req.no || '').trim();
      let r = no ? findRow(no) : -1;
      if (r === -1 && req._row) { // 번호 없는 등록 예정 작품은 행 위치로 삭제
        const idx = parseInt(req._row, 10);
        if (idx >= 2 && idx <= values.length) r = idx;
      }
      if (r === -1) return json_({ ok: false, error: '삭제할 행을 찾을 수 없습니다: ' + (no || '(번호 없음)') });
      // 안전장치: 행 위치가 밀렸을 때 엉뚱한 작품이 지워지지 않도록 제목 대조
      if (req.expect !== undefined) {
        const t = String(values[r - 1][2]).split('\n')[0].trim();
        if (t !== String(req.expect).trim()) return json_({ ok: false, error: '화면 정보가 최신이 아닙니다. 새로고침(↻) 후 다시 시도하세요.' });
      }
      sh.deleteRow(r);
    } else if (req.action === 'upload_portfolio') {
      // 포트폴리오 PDF를 드라이브 portfolio 폴더에 저장 (버전이 쌓이고 사이트는 최신 파일 제공)
      const bytes = Utilities.base64Decode(req.data);
      const blob = Utilities.newBlob(bytes, 'application/pdf', req.filename || ('portfolio_' + Date.now() + '.pdf'));
      const file = DriveApp.getFolderById(PORTFOLIO_FOLDER_ID).createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return json_(portfolioInfo_());
    } else if (req.action === 'link_image') {
      // 드라이브에 직접 올린 사진을 작품에 연결 (표시용 링크 공유 설정 + 시트 이미지 칸 갱신)
      const no = String(req.no || '').trim();
      const r = findRow(no);
      if (r === -1) return json_({ ok: false, error: '작품번호를 찾을 수 없습니다: ' + no });
      const file = DriveApp.getFileById(String(req.fileId));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      sh.getRange(r, 2).setValue('drive:' + file.getId());
      return json_({ ok: true, id: file.getId() });
    } else if (req.action === 'upload_image') {
      // 사이트에서 보낸 사진을 드라이브 images 폴더에 저장하고, 표시용 링크 공유를 설정
      const bytes = Utilities.base64Decode(req.data);
      const blob = Utilities.newBlob(bytes, req.mimeType || 'image/jpeg', req.filename || ('artwork_' + Date.now() + '.jpg'));
      const file = DriveApp.getFolderById(IMAGES_FOLDER_ID).createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return json_({ ok: true, id: file.getId() });
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
 * (선택) 엑셀 자동 백업 — 실행하면 드라이브 폴더에 xlsx 사본 저장.
 * 시계 아이콘(트리거) → backupXlsx → 시간 기반 → 매일 로 등록하면 매일 자동 백업됩니다.
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
