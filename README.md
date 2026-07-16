# 🦦 신해달 작가 작품 아카이브

엑셀 파일 하나로 관리하던 작품 아카이브를 **어디서든 조회·입력·수정·다운로드**할 수 있는 시스템으로 만든 프로젝트입니다.

## 구성

| 역할 | 위치 |
|---|---|
| 데이터 원본(DB) | [구글 시트 「신해달 작품 아카이브 DB」](https://docs.google.com/spreadsheets/d/14gYnblfAlLo-IPYMEvBj7eBHj4hFgf4AI6qqXME7NeU/edit) |
| 파일 보관 | [구글 드라이브 「신해달 작품 아카이브」 폴더](https://drive.google.com/drive/folders/1HFZIzNCmnM9LSbxlrFVdgepyPSQhdDh4) |
| 관리 사이트 | 이 저장소 → GitHub Pages (`index.html`) |
| 사이트 ↔ 시트 연결 | Google Apps Script (`apps-script/Code.gs`) |

- 사이트는 시트 연동 전에도 저장소에 포함된 스냅샷(`data.json`)과 이미지(`images/`, `thumbs/`)로 **조회는 바로 가능**합니다.
- 시트 연동 후에는 사이트에서 등록·수정한 내용이 곧바로 구글 시트에 기록됩니다.
- 데이터 수정은 구글 시트에서 직접 해도 됩니다. 사이트는 항상 시트의 최신 내용을 보여줍니다.

## 최초 설정 (한 번만)

### 1. Apps Script 배포 — 사이트에서 입력/수정을 쓰려면 필수
1. https://script.google.com → **새 프로젝트**
2. `apps-script/Code.gs` 내용 전체를 붙여넣기 (기본 코드는 지우기)
3. 코드 상단 `TOKEN = 'haedal-2026'` 을 나만 아는 비밀번호로 변경
4. **배포 → 새 배포 → 웹 앱** / 실행 계정: **나** / 액세스 권한: **모든 사용자** → 배포
5. 권한 승인 후 **웹 앱 URL**(`…/exec`) 복사
6. 아카이브 사이트 **[설정]** 탭에 URL과 비밀번호 입력 → "연결 성공" 확인

> 액세스 권한을 "모든 사용자"로 해도, URL과 비밀번호를 아는 사람만 수정할 수 있습니다. 조회 API가 부담스러우면 URL 자체를 비공개로 관리하세요.

### 2. GitHub Pages 배포
1. https://github.com/new 에서 저장소 생성 (예: `haedal-archive`, Public)
2. 이 폴더에서:
   ```bash
   git remote add origin https://github.com/<아이디>/haedal-archive.git
   git push -u origin main
   ```
3. 저장소 **Settings → Pages → Source: Deploy from a branch → main / (root)** 저장
4. 1~2분 후 `https://<아이디>.github.io/haedal-archive/` 접속

### 3. (선택) 드라이브에 이미지 백업
추출된 `images/` 폴더의 사진들을 드라이브의 [images 폴더](https://drive.google.com/drive/folders/14kxWRLJvprm9bJBzlm9Oa1Vmie6XhtnH)에 드래그해서 올려두면 원본 백업이 됩니다.

### 4. (선택) 엑셀 자동 백업
Apps Script 편집기 왼쪽 시계 아이콘(트리거) → 함수 `backupXlsx` → 시간 기반 → 매일 → 저장.
매일 드라이브 폴더에 날짜별 xlsx 사본이 쌓입니다.

## 일상 사용법

- **조회/검색**: 사이트 접속 → 갤러리/표 탭, 검색창·연도·판매상태 필터
- **작품 등록**: [＋ 작품 등록] — 작품번호는 자동 제안됨
- **수정**: 작품 클릭 → [✏️ 수정]
- **엑셀 다운로드**: [⬇ 엑셀 다운로드] — 현재 데이터를 원본과 같은 열 구성의 xlsx로 저장
- **새 작품 이미지**:
  - 사진을 저장소 `images/` 폴더에 `작품번호.png`로 넣고 커밋하거나,
  - 드라이브에 사진을 올리고 "링크 복사"한 주소를 이미지 칸에 붙여넣기 (자동 인식)

## 폴더 구조

```
index.html          관리 사이트 (GitHub Pages)
data.json           데이터 스냅샷 (시트 미연동 시 폴백)
images/             작품 원본 이미지 (작품번호.png)
thumbs/             갤러리용 경량 썸네일 (자동 생성)
apps-script/Code.gs 구글 시트 API 코드
신해달_작품아카이브_데이터.xlsx  최초 이관 시점의 데이터 사본
```
