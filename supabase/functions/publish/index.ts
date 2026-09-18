// 홈페이지 발행 트리거
//
// 관리자 화면의 "홈페이지에 반영" 버튼이 이 함수를 부른다.
// GitHub 토큰은 브라우저에 둘 수 없으므로 여기(서버)에 두고, 이 함수만 GitHub을 호출한다.
//
// 인증: 플랫폼의 JWT 검증 설정에 기대지 않고 이 코드가 직접 확인한다.
//       배포 방식에 따라 검증이 꺼져 있을 수 있는데, 그러면 주소를 아는 사람이
//       발행을 반복 실행시킬 수 있다(GitHub Actions 사용량 낭비).
//
// 필요한 비밀값 (Edge Functions → Secrets):
//   GITHUB_PAT — yoonsunLee/shinhaedal 에 Contents 읽기/쓰기 권한이 있는 fine-grained 토큰
// 선택 비밀값:
//   PUBLISH_ALLOWED_EMAILS — 발행할 수 있는 계정 이메일. 쉼표로 구분.
//                            비워 두면 2단계 인증을 마친 로그인 사용자면 누구나 발행할 수 있다.
//   (SUPABASE_URL / SUPABASE_ANON_KEY 는 자동으로 주입된다)

const GITHUB_REPO = "yoonsunLee/shinhaedal";
const EVENT_TYPE = "archive-publish";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** 토큰 안의 내용을 읽는다(서명이 맞는지는 아래에서 Supabase에 물어 확인한다). */
function claimsOf(token: string): Record<string, unknown> | null {
  try {
    const body = token.split(".")[1];
    return JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/**
 * 발행을 요청할 자격이 있는지 확인한다.
 *   ① 유효한 로그인 토큰  ② 2단계 인증을 마친 세션  ③ (설정했다면) 허용된 계정
 */
async function checkCaller(req: Request): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const deny = { ok: false as const, status: 401, error: "로그인이 필요합니다" };

  if (!token || !url || !anon) return deny;
  if (token === anon) return deny; // 로그인 없이 anon 키만 들고 온 경우

  let user: { id?: string; email?: string };
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return deny;
    user = await res.json();
  } catch {
    return deny;
  }
  if (!user || !user.id) return deny;

  // 관리 화면과 같은 기준: 2단계 인증을 마친 세션만 발행할 수 있다.
  const claims = claimsOf(token);
  if (!claims || claims.aal !== "aal2") {
    return { ok: false, status: 403, error: "2단계 인증 후에 발행할 수 있습니다. 로그아웃했다가 다시 로그인해 주세요." };
  }

  const allowed = (Deno.env.get("PUBLISH_ALLOWED_EMAILS") ?? "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes((user.email ?? "").toLowerCase())) {
    return { ok: false, status: 403, error: "이 계정은 발행 권한이 없습니다." };
  }
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "POST만 허용됩니다" }, 405);

  const caller = await checkCaller(req);
  if (!caller.ok) return json({ ok: false, error: caller.error }, caller.status);

  const pat = Deno.env.get("GITHUB_PAT");
  if (!pat) {
    return json({ ok: false, error: "GITHUB_PAT가 설정되지 않았습니다 (Edge Functions → Secrets)" }, 500);
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "haedal-archive",
      },
      body: JSON.stringify({ event_type: EVENT_TYPE }),
    });

    // GitHub은 성공 시 204 No Content를 준다.
    if (res.status !== 204) {
      const text = await res.text();
      const hint = res.status === 401 || res.status === 403
        ? "GitHub 토큰이 만료됐거나 권한이 부족합니다 (Contents 쓰기 권한 필요)"
        : res.status === 404
        ? "저장소를 찾을 수 없습니다. 토큰이 이 저장소에 접근 가능한지 확인하세요"
        : text.slice(0, 200);
      return json({ ok: false, error: `GitHub 요청 실패 (${res.status}): ${hint}` }, 502);
    }

    return json({ ok: true, message: "발행을 요청했습니다. 1~2분 뒤 홈페이지에 반영됩니다." });
  } catch (e) {
    return json({ ok: false, error: `호출 실패: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }
});
