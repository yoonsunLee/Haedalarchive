// 홈페이지 발행 트리거
//
// 관리자 화면의 "홈페이지에 반영" 버튼이 이 함수를 부른다.
// GitHub 토큰은 브라우저에 둘 수 없으므로 여기(서버)에 두고, 이 함수만 GitHub을 호출한다.
//
// 인증: Supabase가 JWT를 먼저 검증한다(verify_jwt 기본값 true).
//       즉 로그인하지 않은 요청은 이 코드에 도달하지도 못한다.
//
// 필요한 비밀값 (Edge Functions → Secrets):
//   GITHUB_PAT  — yoonsunLee/shinhaedal 에 Contents 읽기/쓰기 권한이 있는 fine-grained 토큰

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "POST만 허용됩니다" }, 405);

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
      // 토큰 값이 응답에 섞여 나갈 일은 없지만, 원문을 그대로 흘리지 않고 요약만 돌려준다.
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
