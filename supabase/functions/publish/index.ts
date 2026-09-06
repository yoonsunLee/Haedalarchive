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

/** 요청자가 실제 로그인한 사용자인지 Supabase에 물어본다. */
async function isLoggedIn(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return false;

  // anon 키로는 아무 데이터도 못 읽지만, 토큰이 유효한지 확인하는 데는 쓸 수 있다.
  if (token === anon) return false; // 로그인 없이 anon 키만 들고 온 경우

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const user = await res.json();
    return Boolean(user && user.id);
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "POST만 허용됩니다" }, 405);

  if (!(await isLoggedIn(req))) {
    return json({ ok: false, error: "로그인이 필요합니다" }, 401);
  }

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
