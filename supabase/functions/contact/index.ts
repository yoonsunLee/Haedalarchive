// 홈페이지 문의 폼 접수
//
// 흐름: Contact 폼 → (이 함수) 봇 확인(Cloudflare Turnstile) → 입력값 검사 → 같은 곳에서 연속 접수 제한
//      → inquiries 테이블에 저장 → Resend로 작가에게 메일 발송(답장 주소 = 문의자 이메일)
// 메일 발송이 실패해도 문의는 저장되고 방문자에게는 접수 완료로 안내한다(관리자 '문의함'에서 확인 가능).
//
// 공개 폼에서 부르는 함수라 로그인 확인이 없다. 배포할 때 "Verify JWT"(JWT 검증)를 꺼야 한다.
//
// 필요한 비밀값 (Edge Functions → Secrets):
//   RESEND_API_KEY    — Resend API 키
//   TURNSTILE_SECRET  — Cloudflare Turnstile 위젯의 Secret Key
// 선택 비밀값:
//   MAIL_TO     — 받는 주소 (기본: haedarney@naver.com)
//   MAIL_FROM   — 보내는 주소. 도메인 인증 전에는 기본값(onboarding@resend.dev)을 쓰며,
//                 이 경우 Resend 계정 이메일로만 발송된다. 도메인 인증 후 예: "SHIN HAEDAL <contact@shinhaedal.com>"
//   SITE_BASE   — 메일 속 작품 링크의 기준 주소 (기본: https://yoonsunlee.github.io/shinhaedal, 도메인 연결 후 https://shinhaedal.com)
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 자동으로 주입된다)

// shinhaedal.com이 메인, shinhaedal.art는 .com으로 넘기는 보조 도메인
const ALLOWED_ORIGINS = [
  "https://yoonsunlee.github.io",
  "https://shinhaedal.com",
  "https://www.shinhaedal.com",
  "https://shinhaedal.art",
  "https://www.shinhaedal.art",
  "http://localhost:8792",
];
const TYPES: Record<string, string> = {
  Artwork: "작품 소장",
  Exhibition: "전시",
  Collaboration: "협업",
  Licensing: "라이선싱",
  Other: "기타",
};
const LIMITS = { name: 100, email: 200, subject: 200, message: 5000 };
const RATE_WINDOW_MIN = 10;
const RATE_MAX = 3;

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token: string, ip: string, secret: string) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  return Boolean(data && data.success);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { ok: false, code: "method" }, 405);

  const origin = req.headers.get("Origin") ?? "";
  if (!ALLOWED_ORIGINS.includes(origin)) return json(req, { ok: false, code: "origin" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET");
  if (!supabaseUrl || !serviceKey || !resendKey || !turnstileSecret) {
    console.error("contact: 비밀값 누락", { resend: !!resendKey, turnstile: !!turnstileSecret });
    return json(req, { ok: false, code: "config" }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { ok: false, code: "invalid" }, 400);
  }
  const str = (k: string) => String(body[k] ?? "").trim();

  // 사람 눈에는 안 보이는 칸이 채워져 있으면 봇. 봇에게는 성공한 것처럼 답해 재시도를 막는다.
  if (str("website")) return json(req, { ok: true });

  const type = str("type");
  const workNo = str("work_no");
  const name = str("name");
  const email = str("email");
  const subject = str("subject");
  const message = str("message");
  const lang = str("lang") === "en" ? "en" : "ko";

  const invalid =
    !(type in TYPES) ||
    !name || name.length > LIMITS.name ||
    !email || email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !subject || subject.length > LIMITS.subject ||
    !message || message.length > LIMITS.message ||
    (workNo !== "" && !/^[A-Z]{2}-\d{4}-\d{3}$/.test(workNo)) ||
    body.consent !== true;
  if (invalid) return json(req, { ok: false, code: "invalid" }, 400);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (!(await verifyTurnstile(str("turnstile_token"), ip, turnstileSecret))) {
    return json(req, { ok: false, code: "captcha" }, 400);
  }

  const rest = `${supabaseUrl}/rest/v1/inquiries`;
  const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  const ipHash = ip ? await sha256(`${serviceKey.slice(-16)}:${ip}`) : null;

  if (ipHash) {
    const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
    const recent = await fetch(`${rest}?select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(since)}`, {
      headers: dbHeaders,
    });
    if (recent.ok && (await recent.json()).length >= RATE_MAX) {
      return json(req, { ok: false, code: "rate" }, 429);
    }
  }

  const insert = await fetch(rest, {
    method: "POST",
    headers: { ...dbHeaders, Prefer: "return=representation" },
    body: JSON.stringify({ type, work_no: workNo || null, name, email, subject, message, lang, ip_hash: ipHash }),
  });
  if (!insert.ok) {
    console.error("contact: 저장 실패", insert.status, await insert.text());
    return json(req, { ok: false, code: "save" }, 500);
  }
  const [row] = await insert.json();

  const siteBase = Deno.env.get("SITE_BASE") ?? "https://yoonsunlee.github.io/shinhaedal";
  const workUrl = workNo ? `${siteBase}/works/w/${workNo}/` : "";
  const typeKo = TYPES[type];
  const lines = [
    `유형: ${typeKo}`,
    ...(workNo ? [`작품: ${workNo} — ${workUrl}`] : []),
    `이름/소속: ${name}`,
    `이메일: ${email}`,
    `언어: ${lang === "en" ? "영문 페이지에서 작성" : "국문 페이지에서 작성"}`,
    "",
    message,
    "",
    "—",
    "이 메일에 답장하면 문의하신 분의 이메일로 바로 보내집니다.",
    "아카이브 관리 화면의 '문의함'에서도 확인할 수 있습니다.",
  ];

  const html = `<div style="font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:14px;line-height:1.7;color:#222">
<table style="border-collapse:collapse;margin-bottom:16px">
<tr><td style="color:#888;padding:2px 12px 2px 0">유형</td><td>${escapeHtml(typeKo)}</td></tr>
${workNo ? `<tr><td style="color:#888;padding:2px 12px 2px 0">작품</td><td><a href="${escapeHtml(workUrl)}">${escapeHtml(workNo)}</a></td></tr>` : ""}
<tr><td style="color:#888;padding:2px 12px 2px 0">이름/소속</td><td>${escapeHtml(name)}</td></tr>
<tr><td style="color:#888;padding:2px 12px 2px 0">이메일</td><td>${escapeHtml(email)}</td></tr>
</table>
<div style="white-space:pre-wrap;border-top:1px solid #eee;padding-top:14px">${escapeHtml(message)}</div>
<p style="color:#999;font-size:12px;margin-top:24px">이 메일에 답장하면 문의하신 분께 바로 보내집니다. 아카이브 관리 화면의 '문의함'에서도 확인할 수 있습니다.</p>
</div>`;

  try {
    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("MAIL_FROM") ?? "SHIN HAEDAL 홈페이지 <onboarding@resend.dev>",
        to: [Deno.env.get("MAIL_TO") ?? "haedarney@naver.com"],
        reply_to: email,
        subject: `[홈페이지 문의 · ${typeKo}] ${subject}`,
        text: lines.join("\n"),
        html,
      }),
    });
    if (mail.ok) {
      await fetch(`${rest}?id=eq.${row.id}`, {
        method: "PATCH",
        headers: dbHeaders,
        body: JSON.stringify({ mail_sent: true }),
      });
    } else {
      console.error("contact: 메일 발송 실패", mail.status, await mail.text());
    }
  } catch (e) {
    console.error("contact: 메일 발송 오류", e);
  }

  return json(req, { ok: true });
});
