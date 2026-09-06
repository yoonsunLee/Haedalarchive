# -*- coding: utf-8 -*-
"""실제 DB 왕복 시험.

로직 테스트(test_save_logic.js)는 '우리 코드가 의도대로 호출하는가'를 본다.
이건 '데이터베이스가 그 호출을 실제로 받아주는가'를 본다 — 제약조건, enum,
트리거(version 자동증가), 외래키가 진짜로 동작하는지는 붙여봐야 안다.

명확히 표시된 테스트 행 하나만 쓰고 끝나면 지운다.
"""
import json, sys, urllib.request, urllib.error

TEST_NO = "ZZTEST-9999-999"

env = {}
with open(r"C:\Users\yoons\.haedal-secrets.env", encoding="utf-8-sig") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
URL, KEY = env["SUPABASE_URL"], env["SUPABASE_SERVICE_KEY"]


def req(method, path, body=None, prefer=None):
    h = {"apikey": KEY, "Authorization": "Bearer " + KEY,
         "Content-Type": "application/json", "Accept": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    r = urllib.request.Request(URL + "/rest/v1/" + path, method=method, headers=h,
                               data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw.strip() else [])
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]


P = F = 0
def ck(name, ok, detail=""):
    global P, F
    print(("  ok   " if ok else "  FAIL ") + name + (("  :: " + str(detail)) if (not ok and detail != "") else ""))
    if ok: P += 1
    else:  F += 1


work_id = None
try:
    print("[준비] 잔여 테스트 행 정리")
    # PostgREST는 SQL 서브쿼리를 받지 않는다. id를 먼저 찾아서 지운다.
    _, leftovers = req("GET", "works?work_no=like.ZZTEST*&select=id")
    for row in (leftovers if isinstance(leftovers, list) else []):
        req("DELETE", "editions?work_id=eq." + row["id"])
        req("DELETE", "works?id=eq." + row["id"])

    print("\n[1] 작품 등록 — 실제 컬럼/제약을 통과하는가")
    code, res = req("POST", "works", {
        "work_no": TEST_NO, "title_ko": "테스트 작품", "title_en": "Test Work",
        "caption_ko": "설명", "material_ko": "목심나전칠기",
        "year": 2026, "size_text": "30 × 30", "width_cm": 30, "height_cm": 30,
        "list_price_krw": 500000, "edition_size": 1, "publish_web": False,
        "image_file": "drive:TESTID", "work_state": "completed"
    }, prefer="return=representation")
    ck("works INSERT", code in (200, 201), "%s %s" % (code, res))
    if code not in (200, 201):
        raise SystemExit("등록 실패로 중단")
    work_id = res[0]["id"]
    ck("version 초기값 1", res[0]["version"] == 1, res[0]["version"])

    print("\n[2] 에디션 등록 — 외래키 연결")
    code, ed = req("POST", "editions", {
        "work_id": work_id, "edition_number": 1, "status": "available",
        "list_price_krw": 500000
    }, prefer="return=representation")
    ck("editions INSERT", code in (200, 201), "%s %s" % (code, ed))
    ed_id = ed[0]["id"] if code in (200, 201) else None

    print("\n[3] works_status 뷰가 새 작품을 반영하는가")
    code, st = req("GET", "works_status?work_no=eq." + TEST_NO)
    ck("뷰에 나타남", code == 200 and len(st) == 1, st)
    if st:
        ck("판매가능으로 판정", st[0]["effective_status"] == "available", st[0])

    print("\n[4] 수정 + version 자동 증가 (트리거)")
    code, up = req("PATCH", "works?id=eq.%s&version=eq.1" % work_id,
                   {"internal_note": "수정됨"}, prefer="return=representation")
    ck("조건부 UPDATE 반영", code in (200, 204) and up and up[0]["internal_note"] == "수정됨", up)
    ck("version 2로 증가", up and up[0]["version"] == 2, up[0]["version"] if up else None)

    print("\n[5] 낡은 version으로 수정 시도 — 막혀야 한다")
    code, stale = req("PATCH", "works?id=eq.%s&version=eq.1" % work_id,
                      {"internal_note": "덮어쓰기 시도"}, prefer="return=representation")
    ck("0행 반영(충돌 감지)", stale == [], stale)
    code, cur = req("GET", "works?id=eq.%s&select=internal_note" % work_id)
    ck("값이 안 바뀜", cur[0]["internal_note"] == "수정됨", cur)

    print("\n[6] 제약조건이 실제로 동작하는가")
    code, dup = req("POST", "works", {"work_no": TEST_NO, "title_ko": "중복"})
    ck("작품번호 중복 거부", code >= 400, code)
    code, neg = req("POST", "works", {"work_no": TEST_NO + "-B", "title_ko": "음수",
                                      "list_price_krw": -1})
    ck("음수 가격 거부", code >= 400, code)
    code, bad = req("POST", "editions", {"work_id": work_id, "edition_number": 1,
                                         "status": "존재하지않는상태"})
    ck("잘못된 상태값 거부", code >= 400, code)
    code, dupe = req("POST", "editions", {"work_id": work_id, "edition_number": 1,
                                          "status": "available"})
    ck("같은 에디션 번호 중복 거부", code >= 400, code)

    print("\n[7] 소프트 삭제")
    code, sd = req("PATCH", "works?id=eq.%s" % work_id,
                   {"deleted_at": "2026-09-05T12:00:00Z"}, prefer="return=representation")
    ck("deleted_at 설정됨", code in (200, 204) and sd and sd[0]["deleted_at"], sd)
    code, alive = req("GET", "works?work_no=eq.%s&deleted_at=is.null&select=id" % TEST_NO)
    ck("살아있는 목록에서 빠짐", alive == [], alive)
    code, row = req("GET", "works?work_no=eq.%s&select=id" % TEST_NO)
    ck("행 자체는 남아있음(복구 가능)", len(row) == 1, row)

finally:
    print("\n[정리] 테스트 행 삭제")
    if work_id:
        c1, _ = req("DELETE", "editions?work_id=eq." + work_id)
        c2, _ = req("DELETE", "works?id=eq." + work_id)
        print("   editions %s / works %s" % (c1, c2))
    req("DELETE", "works?work_no=eq." + TEST_NO + "-B")
    code, left = req("GET", "works?work_no=like.ZZTEST*&select=work_no")
    print("   잔여 테스트 행:", left)

print("\n== pass: %d, fail: %d ==" % (P, F))
sys.exit(1 if F else 0)
