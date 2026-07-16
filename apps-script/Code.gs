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
const TOKEN = 'haedal-2026'; // ★ 반드시 나만 아는 값으로 변경하세요 ★

const KEYS = ['no','image','title','caption','material','size','year','price','sold','discount','actual_price','payment','sale_date','delivery_date','channel','owner','exhibitions','note'];

function sheet_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 조회: GET ?action=list */
function doGet(e) {
  try {
    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      if (!values[i][0]) continue;
      const r = {};
      KEYS.forEach((k, j) => {
        let v = values[i][j];
        if (v instanceof Date) v = Utilities.formatDate(v, 'Asia/Seoul', 'yyyy.MM.dd');
        r[k] = v === null || v === undefined ? '' : v;
      });
      rows.push(r);
    }
    return json_({ ok: true, rows: rows });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** 입력/수정: POST {action:'add'|'update'|'delete', token, row:{...}} */
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.token !== TOKEN) return json_({ ok: false, error: '비밀번호가 일치하지 않습니다' });

    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    const findRow = no => {
      for (let i = 1; i < values.length; i++)
        if (String(values[i][0]).trim() === String(no).trim()) return i + 1; // 1-based
      return -1;
    };

    if (req.action === 'add') {
      if (findRow(req.row.no) !== -1) return json_({ ok: false, error: '이미 존재하는 작품번호입니다: ' + req.row.no });
      sh.appendRow(KEYS.map(k => req.row[k] === undefined ? '' : req.row[k]));
    } else if (req.action === 'update') {
      const r = findRow(req.row.no);
      if (r === -1) return json_({ ok: false, error: '작품번호를 찾을 수 없습니다: ' + req.row.no });
      sh.getRange(r, 1, 1, KEYS.length).setValues([KEYS.map(k => req.row[k] === undefined ? '' : req.row[k])]);
    } else if (req.action === 'delete') {
      const r = findRow(req.no);
      if (r === -1) return json_({ ok: false, error: '작품번호를 찾을 수 없습니다: ' + req.no });
      sh.deleteRow(r);
    } else {
      return json_({ ok: false, error: '알 수 없는 action: ' + req.action });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
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
