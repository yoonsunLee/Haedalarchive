/* NCP 접수 액션 로컬 점검 — 메일 API는 가짜로 대체해 실제 발송 없이 동작만 확인한다 */
const https = require('https');
const { EventEmitter } = require('events');

let lastMail = null;
let mailStatus = 201;
https.request = function (opts, cb) {
  const res = new EventEmitter();
  res.statusCode = mailStatus;
  const req = new EventEmitter();
  let body = '';
  req.write = function (d) { body += d; };
  req.end = function () {
    lastMail = { opts: opts, body: JSON.parse(body) };
    setImmediate(function () { cb(res); res.emit('data', '{"requestId":"test"}'); res.emit('end'); });
  };
  return req;
};

const action = require('./index.js');

const CFG = {
  NCP_ACCESS_KEY: 'AK', NCP_SECRET_KEY: 'SK',
  MAIL_FROM: 'noreply@shinhaedal.com', MAIL_TO: 'artist@example.com',
  FORM_SECRET: 'test-secret-0123456789abcdef0123456789',
  ALLOWED_ORIGINS: 'https://shinhaedal.com,https://www.shinhaedal.com'
};
const ORIGIN = 'https://shinhaedal.com';
const IP = '203.0.113.9';

function call(method, extra) {
  const p = Object.assign({}, CFG, {
    __ow_method: method,
    __ow_headers: { origin: (extra && extra.origin !== undefined) ? extra.origin : ORIGIN, 'x-forwarded-for': (extra && extra.ip) || IP },
    __ow_query: (extra && extra.query) || '',
    __ow_body: (extra && extra.body) ? JSON.stringify(extra.body) : ''
  });
  return Promise.resolve(action.main(p));
}

const VALID = {
  type: 'Artwork', work_no: 'HD-2026-001', name: '홍길동', email: 'guest@example.com',
  subject: '작품 문의', message: '안녕하세요, 작품에 대해 문의드립니다.', lang: 'ko',
  consent_collect: true, notice_version: '2026-09-18', website: ''
};

let pass = 0, fail = 0;
function check(name, cond, got) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + ' → ' + JSON.stringify(got)); }
}

(async function () {
  // 1) 토큰 발급
  const tok = await call('get', { query: 'op=token' });
  check('토큰 발급 200', tok.statusCode === 200 && tok.body.s, tok);
  const T = { token_t: tok.body.t, token_n: tok.body.n, token_s: tok.body.s };

  // 2) CORS
  const pre = await call('options', {});
  check('preflight 204', pre.statusCode === 204, pre);
  const bad = await call('get', { query: 'op=token', origin: 'https://evil.example' });
  check('다른 출처 차단', bad.statusCode === 403, bad);

  // 3) 정상 접수
  const ok = await call('post', { body: Object.assign({}, VALID, T) });
  check('정상 접수 200', ok.statusCode === 200 && ok.body.ok === true, ok);
  check('메일 수신자', lastMail && lastMail.body.recipients[0].address === 'artist@example.com', lastMail && lastMail.body.recipients);
  check('메일 제목', lastMail && lastMail.body.title === '[작품 소장] 작품 문의', lastMail && lastMail.body.title);
  check('본문에 회신 주소', lastMail && lastMail.body.body.indexOf('guest@example.com') !== -1, null);
  check('본문에 작품 링크', lastMail && lastMail.body.body.indexOf('/works/w/HD-2026-001/') !== -1, null);
  check('서명 헤더', lastMail && !!lastMail.opts.headers['x-ncp-apigw-signature-v2'], null);

  // 4) 같은 내용 재전송 차단
  const dup = await call('post', { body: Object.assign({}, VALID, T) });
  check('중복 차단 429', dup.statusCode === 429 && dup.body.code === 'duplicate', dup);

  // 5) 횟수 제한 (같은 IP 10분 3건)
  const t2 = await call('get', { query: 'op=token' });
  const T2 = { token_t: t2.body.t, token_n: t2.body.n, token_s: t2.body.s };
  const r2 = await call('post', { body: Object.assign({}, VALID, T2, { subject: '두 번째' }) });
  const r3 = await call('post', { body: Object.assign({}, VALID, T2, { subject: '세 번째' }) });
  check('2·3번째 접수 성공', r2.statusCode === 200 && r3.statusCode === 200, [r2.statusCode, r3.statusCode]);
  const r4 = await call('post', { body: Object.assign({}, VALID, T2, { subject: '네 번째' }) });
  check('4번째 횟수 제한', r4.statusCode === 429 && r4.body.code === 'rate', r4);

  // 6) 토큰 위조·만료
  const other = await call('post', { ip: '198.51.100.5', body: Object.assign({}, VALID, T2, { subject: '다른 IP' }) });
  check('다른 IP의 토큰 거부', other.statusCode === 400 && other.body.code === 'expired', other);
  const old = await call('post', { ip: '198.51.100.7', body: Object.assign({}, VALID, { subject: '토큰 없음' }) });
  check('토큰 없이 거부', old.statusCode === 400 && old.body.code === 'expired', old);

  // 7) 입력 검증
  const cases = [
    ['동의 없음', { consent_collect: false }],
    ['이메일 형식', { email: 'not-an-email' }],
    ['유형 오류', { type: 'Hack' }],
    ['작품번호 형식', { work_no: 'DROP TABLE' }],
    ['본문 초과', { message: 'x'.repeat(5001) }],
    ['고지문 버전 없음', { notice_version: '' }]
  ];
  for (const [name, patch] of cases) {
    const t = await call('get', { ip: '192.0.2.' + Math.floor(Math.random() * 200), query: 'op=token' });
    const res = await call('post', { ip: '192.0.2.50', body: Object.assign({}, VALID, { token_t: t.body.t, token_n: t.body.n, token_s: t.body.s }, patch) });
    check('거부: ' + name, res.statusCode === 400 && res.body.code === 'invalid', res);
  }

  // 8) 허니팟
  const hp = await call('post', { ip: '192.0.2.77', body: Object.assign({}, VALID, { website: 'http://spam' }) });
  check('허니팟은 성공처럼 응답', hp.statusCode === 200 && hp.body.ok === true, hp);

  // 9) 메일 실패 처리
  mailStatus = 500;
  const t9 = await call('get', { ip: '192.0.2.99', query: 'op=token' });
  const f9 = await call('post', { ip: '192.0.2.99', body: Object.assign({}, VALID, { token_t: t9.body.t, token_n: t9.body.n, token_s: t9.body.s, subject: '실패 확인' }) });
  check('발송 실패 502', f9.statusCode === 502 && f9.body.code === 'mail', f9);

  console.log('\n통과 ' + pass + ' / 실패 ' + fail);
  process.exit(fail ? 1 : 0);
})();
