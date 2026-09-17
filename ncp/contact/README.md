# 문의 접수 액션 (네이버 클라우드 Cloud Functions)

홈페이지 Contact 폼을 **국내에서만** 처리하기 위한 접수 코드입니다. 문의를 저장하지 않고 작가 메일함으로만 보냅니다.

- `index.js` — 액션 본문 (외부 라이브러리 없음, 콘솔에 그대로 붙여넣기 가능)
- `test.js` — 메일 API를 가짜로 대체한 로컬 점검. `node test.js`

## 왜 바꾸나

| | 전 (2026-09) | 후 |
|---|---|---|
| 접수·저장 | Supabase(서울 저장, 미국 법인) | 네이버 클라우드 Cloud Functions, **저장 안 함** |
| 알림 메일 | Resend (미국) | Cloud Outbound Mailer (한국) |
| 스팸 방지 | Cloudflare Turnstile (미국) | 서버 검증 여러 겹 |
| 수신함 | contact@ → Cloudflare 전달 → 네이버 | 작가 네이버 주소 직접 |

→ 문의 폼의 **국외 이전 동의를 받지 않아도 되는 구조**가 됩니다(수집·이용 동의만 유지).
남는 국외 요소는 홈페이지 호스팅(GitHub Pages)의 접속 기록뿐이며, 이는 문의 내용과 분리해 처리방침에 고지합니다.

## 준비 (콘솔에서)

1. **Cloud Outbound Mailer** 신청 → 발신 도메인 인증
   - 발신 주소는 우리 도메인이어야 합니다 (예: `noreply@shinhaedal.com`). 받는 주소는 필요 없습니다.
   - 콘솔이 알려주는 SPF·DKIM 레코드를 Cloudflare DNS에 추가
2. **Cloud Functions** 액션 생성 (한국 리전, Node.js) → `index.js` 붙여넣기, 진입점 `main`
3. **API Gateway** 연동 → 외부 호출 주소 발급
   - 스테이지에 **사용량 제한(초당·일일 호출 수)** 을 반드시 설정하세요. 전체 상한은 여기서 겁니다.
   - 메서드는 `GET`, `POST`, `OPTIONS` 모두 열어야 합니다.
4. **액세스 키** 발급 (마이페이지 → 인증키 관리). 시크릿 키는 콘솔·액션 파라미터에만 두고 채팅·저장소에 붙여넣지 마세요.

## 액션 기본 파라미터

| 이름 | 값 |
|---|---|
| `NCP_ACCESS_KEY` | 액세스 키 ID |
| `NCP_SECRET_KEY` | 시크릿 키 |
| `MAIL_FROM` | 인증 마친 발신 주소 (예: `noreply@shinhaedal.com`) |
| `MAIL_FROM_NAME` | 선택, 기본 `SHIN HAEDAL` |
| `MAIL_TO` | 작가가 받을 주소 |
| `FORM_SECRET` | 32자 이상 임의 문자열 (제출 토큰 서명용) |
| `ALLOWED_ORIGINS` | `https://shinhaedal.com,https://www.shinhaedal.com` |
| `SITE_BASE` | `https://shinhaedal.com` |

## 스팸 방지 구성

| 겹 | 막는 것 | 한계 |
|---|---|---|
| 허니팟(숨은 칸) | 폼을 그대로 채우는 단순 봇 | 사람이 우회하면 무력 |
| 제출 토큰(GET `?op=token`) | 폼을 열지 않고 바로 POST하는 봇. 발급받은 접속과 IP가 다르면 거부 | 브라우저를 흉내내면 우회 가능 |
| 같은 내용 연속 차단 | 같은 문의 반복 발송 | 내용을 조금씩 바꾸면 우회 |
| IP별 10분 3건 | 한 곳에서 몰아 보내기 | **컨테이너가 살아 있는 동안만** 유효 |
| 길이·형식 검증 | 비정상적으로 큰 요청, 잘못된 입력 | — |
| API Gateway 사용량 제한 | 전체 호출·메일 발송량 폭주 | 콘솔에서 직접 설정해야 함 |

CAPTCHA와 같은 수준의 차단은 아닙니다. 실제 스팸이 들어오기 시작하면 그때 강화합니다
(예: Object Storage에 짧게 보관하는 카운터로 IP 제한을 여러 실행에 걸쳐 적용).

## 전환 순서

1. 위 준비 → 액션 배포 → 폼을 새 주소로 바꾼 시험용 페이지에서 접수·수신 확인
2. 처리방침 **변경 예고** 게시 (시행 7일 전 — 현행 처리방침 14항의 약속)
3. 시행일에 사이트 폼 전환 + 처리방침 개정판 적용
4. 전환 확인 후 정리: Supabase `contact` 함수·`inquiries` 관련 표, Resend 도메인·API 키,
   Turnstile 위젯, Cloudflare Email Routing(contact@) 과 관련 DNS 레코드
