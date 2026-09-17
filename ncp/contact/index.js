'use strict';
/*
 * 홈페이지 문의 폼 접수 — 네이버 클라우드 Cloud Functions 액션 (웹 액션)
 *
 * 흐름: Contact 폼 → (이 액션) 입력값 검사 + 스팸 방지 → Cloud Outbound Mailer로 작가 메일 발송
 *       문의 내용을 저장하지 않는다(메일함이 곧 보관함). 처리 경로 전체가 국내다.
 *
 * 두 가지 요청을 받는다.
 *   GET  ?op=token  → 제출 토큰 발급 {t, n, s}
 *   POST            → 문의 접수(토큰 확인 후 메일 발송)
 *
 * 액션 기본 파라미터(또는 환경변수)로 넣을 값:
 *   NCP_ACCESS_KEY, NCP_SECRET_KEY  — 메일 API 호출용 (콘솔에서만 입력, 채팅·저장소에 두지 말 것)
 *   MAIL_FROM        — 발신 주소. 발신 도메인 인증을 마친 주소여야 한다 (예: noreply@shinhaedal.com)
 *   MAIL_FROM_NAME   — 발신 이름 (기본: SHIN HAEDAL)
 *   MAIL_TO          — 작가가 받을 주소
 *   FORM_SECRET      — 제출 토큰 서명용 임의 문자열(32자 이상)
 *   ALLOWED_ORIGINS  — 쉼표로 구분 (기본: https://shinhaedal.com,https://www.shinhaedal.com)
 *   SITE_BASE        — 메일 속 작품 링크 기준 주소 (기본: https://shinhaedal.com)
 *
 * 스팸 방지는 여러 겹으로 나눠 둔다. 어느 하나가 CAPTCHA를 대신하지는 못한다.
 *   ① 사람 눈에 안 보이는 칸(허니팟)  ② 폼을 실제로 연 사람만 받는 단기 제출 토큰(접속 IP에 묶임)
 *   ③ 같은 내용 연속 제출 차단        ④ 입력 길이·형식 검증
 *   ⑤ 같은 IP 연속 접수 제한(컨테이너가 살아 있는 동안만 — 아래 주석 참고)
 *   ⑥ API Gateway의 사용량 제한(초당·일일 호출 수) ← 전체 상한은 여기서 건다
 */

const crypto = require('crypto');
const https = require('https');

const MAIL_HOST = 'mail.apigw.ntruss.com';
const MAIL_PATH = '/api/v1/mails';
const LIMITS = { name: 100, email: 200, subject: 200, message: 5000 };
const TYPES = {
  Artwork: '작품 소장',
  Exhibition: '전시',
  Collaboration: '협업',
  Licensing: '라이선싱',
  Other: '기타'
};
const TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 폼을 오래 열어두는 경우까지 감안해 2시간
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;

/* 같은 컨테이너가 재사용되는 동안에만 유효한 보조 장치다.
   함수가 새로 뜨면 비어 있으므로, 실제 상한은 API Gateway 사용량 제한으로 건다. */
const recent = new Map();

function cfg(params, key, dflt) {
  const v = params[key] !== undefined && params[key] !== '' ? params[key] : process.env[key];
  return v === undefined || v === '' ? dflt : v;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function reply(origin, allowed, statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': allowed.indexOf(origin) !== -1 ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600',
      'Cache-Control': 'no-store'
    },
    body: body
  };
}

/* 제출 토큰: 폼을 연 브라우저에만 발급하고, 발급받은 접속과 같은 곳에서만 쓸 수 있다.
   비밀값은 서버에만 있으므로 토큰을 위조할 수 없다. */
function signToken(secret, t, n, ipHash) {
  return crypto.createHmac('sha256', secret).update(t + '.' + n + '.' + ipHash).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function clientIp(headers) {
  const fwd = headers['x-forwarded-for'] || headers['X-Forwarded-For'] || '';
  return String(fwd).split(',')[0].trim();
}

function sendMail(accessKey, secretKey, payload) {
  const ts = String(Date.now());
  const sig = crypto.createHmac('sha256', secretKey)
    .update('POST ' + MAIL_PATH + '\n' + ts + '\n' + accessKey)
    .digest('base64');
  const data = Buffer.from(JSON.stringify(payload), 'utf8');
  const opts = {
    host: MAIL_HOST,
    path: MAIL_PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': data.length,
      'x-ncp-apigw-timestamp': ts,
      'x-ncp-iam-access-key': accessKey,
      'x-ncp-apigw-signature-v2': sig
    }
  };
  return new Promise(function (resolve) {
    const req = https.request(opts, function (res) {
      let raw = '';
      res.on('data', function (c) { raw += c; });
      res.on('end', function () { resolve({ status: res.statusCode, body: raw }); });
    });
    req.on('error', function (e) { resolve({ status: 0, body: e.name }); });
    req.write(data);
    req.end();
  });
}

function mailBody(f, siteBase) {
  const workLine = f.workNo
    ? '<p style="margin:0 0 6px"><b>작품</b> ' + esc(f.workNo) +
      ' — <a href="' + esc(siteBase) + '/works/w/' + encodeURIComponent(f.workNo) + '/">작품 페이지 열기</a></p>'
    : '';
  const replyHref = 'mailto:' + encodeURIComponent(f.email) +
    '?subject=' + encodeURIComponent('Re: ' + f.subject);
  return '' +
    '<div style="font-family:system-ui,\'Apple SD Gothic Neo\',sans-serif;font-size:15px;line-height:1.7;color:#15171c">' +
    '<p style="margin:0 0 4px;color:#6b7280;font-size:13px">홈페이지 문의 · ' + esc(TYPES[f.type] || f.type) + '</p>' +
    '<h2 style="margin:0 0 14px;font-size:18px">' + esc(f.subject) + '</h2>' +
    '<p style="margin:0 0 6px"><b>보낸 사람</b> ' + esc(f.name) + '</p>' +
    '<p style="margin:0 0 6px"><b>회신 주소</b> <a href="' + esc(replyHref) + '">' + esc(f.email) + '</a></p>' +
    workLine +
    '<p style="margin:0 0 6px"><b>작성 언어</b> ' + (f.lang === 'en' ? '영문' : '국문') + '</p>' +
    '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">' +
    '<div style="white-space:pre-wrap">' + esc(f.message) + '</div>' +
    '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">' +
    '<p style="margin:0 0 4px"><a href="' + esc(replyHref) + '" style="font-weight:600">이 문의에 답장하기 →</a></p>' +
    '<p style="margin:0;color:#6b7280;font-size:13px">개인정보 처리방침에 따라 회신이 끝나고 1년이 지나면 이 메일을 지워 주세요.</p>' +
    '</div>';
}

function readBody(params) {
  const raw = params.__ow_body;
  if (raw === undefined || raw === null || raw === '') {
    return params; // 원문 사용이 꺼진 경우: 본문 값들이 파라미터에 합쳐져 있다
  }
  try { return JSON.parse(raw); } catch (e) {}
  try { return JSON.parse(Buffer.from(String(raw), 'base64').toString('utf8')); } catch (e) {}
  return null;
}

function main(params) {
  const allowed = String(cfg(params, 'ALLOWED_ORIGINS', 'https://shinhaedal.com,https://www.shinhaedal.com'))
    .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  const headers = params.__ow_headers || {};
  const origin = headers.origin || headers.Origin || '';
  const method = String(params.__ow_method || 'post').toLowerCase();
  const secret = cfg(params, 'FORM_SECRET', '');
  const ipHash = sha256((secret || 'x') + ':' + clientIp(headers));

  if (method === 'options') return reply(origin, allowed, 204, '');
  if (allowed.indexOf(origin) === -1) return reply(origin, allowed, 403, { ok: false, code: 'origin' });

  const query = params.__ow_query || '';
  if (method === 'get') {
    if (String(query).indexOf('op=token') === -1) return reply(origin, allowed, 404, { ok: false, code: 'not_found' });
    const t = Date.now();
    const n = crypto.randomBytes(9).toString('base64').replace(/[^\w]/g, '');
    return reply(origin, allowed, 200, { t: t, n: n, s: signToken(secret, t, n, ipHash) });
  }
  if (method !== 'post') return reply(origin, allowed, 405, { ok: false, code: 'method' });

  /* 'HTTP 원문 사용'을 켜면 본문이 __ow_body로(그대로 또는 base64로) 오고,
     끄면 JSON 본문의 값들이 파라미터에 바로 합쳐져 들어온다. 둘 다 받아 준다. */
  const body = readBody(params);
  if (!body) return reply(origin, allowed, 400, { ok: false, code: 'invalid' });

  const str = function (k) { return String(body[k] === undefined || body[k] === null ? '' : body[k]).trim(); };

  // 사람 눈에는 안 보이는 칸이 채워져 있으면 봇. 봇에게는 성공한 것처럼 답해 재시도를 막는다.
  if (str('website')) return reply(origin, allowed, 200, { ok: true });

  const f = {
    type: str('type'),
    workNo: str('work_no'),
    name: str('name'),
    email: str('email'),
    subject: str('subject'),
    message: str('message'),
    lang: str('lang') === 'en' ? 'en' : 'ko'
  };
  const noticeVersion = str('notice_version');

  const invalid =
    !(f.type in TYPES) ||
    !f.name || f.name.length > LIMITS.name ||
    !f.email || f.email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ||
    !f.subject || f.subject.length > LIMITS.subject ||
    !f.message || f.message.length > LIMITS.message ||
    (f.workNo !== '' && !/^[A-Z]{2}-\d{4}-\d{3}$/.test(f.workNo)) ||
    body.consent_collect !== true ||
    !/^[\w.-]{1,40}$/.test(noticeVersion);
  if (invalid) return reply(origin, allowed, 400, { ok: false, code: 'invalid' });

  // 제출 토큰: 폼을 연 사람의 요청인지 확인한다(직접 POST를 쏘는 봇 차단)
  const t = Number(str('token_t'));
  const n = str('token_n');
  const s = str('token_s');
  const tokenOk = t && n && s && s === signToken(secret, t, n, ipHash) && (Date.now() - t) < TOKEN_MAX_AGE_MS;
  if (!tokenOk) return reply(origin, allowed, 400, { ok: false, code: 'expired' });

  // 같은 곳에서 짧은 시간에 반복 접수 / 같은 내용 연속 접수 제한
  const now = Date.now();
  const bucket = (recent.get(ipHash) || []).filter(function (r) { return now - r.at < RATE_WINDOW_MS; });
  const dup = sha256(f.email + '|' + f.subject + '|' + f.message);
  if (bucket.length >= RATE_MAX) return reply(origin, allowed, 429, { ok: false, code: 'rate' });
  if (bucket.some(function (r) { return r.dup === dup; })) return reply(origin, allowed, 429, { ok: false, code: 'duplicate' });
  bucket.push({ at: now, dup: dup });
  recent.set(ipHash, bucket);
  if (recent.size > 500) recent.clear(); // 메모리가 무한정 늘지 않게

  const accessKey = cfg(params, 'NCP_ACCESS_KEY', '');
  const secretKey = cfg(params, 'NCP_SECRET_KEY', '');
  const mailTo = cfg(params, 'MAIL_TO', '');
  const mailFrom = cfg(params, 'MAIL_FROM', '');
  if (!accessKey || !secretKey || !mailTo || !mailFrom || !secret) {
    console.error('contact: 설정값 누락');
    return reply(origin, allowed, 500, { ok: false, code: 'config' });
  }

  return sendMail(accessKey, secretKey, {
    senderAddress: mailFrom,
    senderName: cfg(params, 'MAIL_FROM_NAME', 'SHIN HAEDAL'),
    title: '[' + (TYPES[f.type] || f.type) + '] ' + f.subject,
    body: mailBody(f, cfg(params, 'SITE_BASE', 'https://shinhaedal.com')),
    recipients: [{ address: mailTo, type: 'R' }],
    individual: true,
    advertising: false
  }).then(function (res) {
    if (res.status < 200 || res.status >= 300) {
      // 문의 내용은 남기지 않는다(오류 기록에 개인정보가 들어가지 않도록)
      console.error('contact: 메일 발송 실패', res.status);
      return reply(origin, allowed, 502, { ok: false, code: 'mail' });
    }
    return reply(origin, allowed, 200, { ok: true });
  });
}

exports.main = main;
