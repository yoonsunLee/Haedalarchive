# 🦦 신해달 작가 작품 아카이브

엑셀 파일 하나로 관리하던 작품 아카이브를 **어디서든 조회·입력·수정·다운로드**할 수 있는 시스템으로 만든 프로젝트입니다.

## 구성

| 역할 | 위치 |
|---|---|
| 데이터 원본(DB) | [구글 시트 「신해달 작품 아카이브 DB」](https://docs.google.com/spreadsheets/d/14gYnblfAlLo-IPYMEvBj7eBHj4hFgf4AI6qqXME7NeU/edit) |
| 파일 보관 | [구글 드라이브 「신해달 작품 아카이브」 폴더](https://drive.google.com/drive/folders/1HFZIzNCmnM9LSbxlrFVdgepyPSQhdDh4) |
| 관리 사이트 | 이 저장소 → GitHub Pages (`index.html`) |
| 사이트 ↔ 시트 연결 | Google Apps Script (`apps-script/Code.gs`) |

- 데이터는 항상 구글 시트에서 실시간으로 읽어옵니다 (저장소에는 개인정보가 포함된 데이터를 두지 않습니다).
- 사이트에서 등록·수정한 내용은 곧바로 구글 시트에 기록됩니다.
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

- **조회/검색**: 사이트 접속 → 갤러리/표 탭, 검색창·연도·판매상태 필터, 정렬(기본: 판매가능→NFS→판매완료→등록예정)
- **통계 박스**: 전체작품/판매가능/판매완료 클릭 시 해당 작품만 필터. 누적판매액은 클릭할 때만 금액 표시
- **작품 등록**: [＋ 작품 등록] — 작품번호는 `HD-연도-순번`으로 자동 채번(연도 입력 시 재계산)
- **수정**: 작품 클릭 → [✏️ 수정]. 재료·크기·결제방식은 기존 값에서 선택 가능, 날짜는 캘린더 선택
- **전시 이력**: 날짜+전시명으로 새 전시 추가하거나, 기존 전시 이력에서 골라 추가
- **이미지**: 등록/수정 팝업에서 사진 선택 → 자동 압축 후 구글드라이브 images 폴더에 저장·연결
- **엑셀 다운로드**: [⬇ 엑셀 다운로드] — 현재 데이터를 원본과 같은 열 구성의 xlsx로 저장

## 폴더 구조

```
index.html          관리 사이트 (GitHub Pages)
images/             작품 원본 이미지 (작품번호.png)
thumbs/             갤러리용 경량 썸네일 (자동 생성)
apps-script/Code.gs 구글 시트 API 코드
```
