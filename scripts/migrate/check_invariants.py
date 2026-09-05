# -*- coding: utf-8 -*-
"""불변식 검사 — 각 단계 착수 전/후에 무조건 돌린다.

이 파일이 있는 이유: 2026-09-05 세션에서
  · 매핑 문서에 적어둔 image 컬럼을 실제로는 만들지 않아 시트 필드가 소실될 뻔했고
  · "판매 상태는 한 곳에서만 계산한다"는 원칙을 주석으로만 두어 화면 코드가 이를 어겼다.
원칙을 글로 적는 것과 지켜지는 것은 다르다. 그래서 검사 코드로 옮긴다.

  python3 check_invariants.py
"""
import json, os, re, sys, urllib.request

ENV_PATH = r"C:\Users\yoons\.haedal-secrets.env"
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

env = {}
with open(ENV_PATH, encoding="utf-8-sig") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
URL, KEY = env["SUPABASE_URL"], env["SUPABASE_SERVICE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Accept": "application/json"}


def sb(path):
    req = urllib.request.Request(URL + "/rest/v1/" + path, headers=H)
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode())


FAILS = []
def check(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + (("  :: " + str(detail)) if (not ok and detail) else ""))
    if not ok:
        FAILS.append(name)


print("[1] 시트의 모든 필드가 DB에 자리를 갖고 있는가")
# 시트 컬럼 → 목적지. 여기 빠진 게 있으면 이관에서 값이 사라진다.
SHEET_TO_DB = {
    "no": "works.work_no", "image": "works.image_file", "title": "works.title_ko",
    "caption": "works.caption_ko", "material": "works.material_ko", "size": "works.size_text",
    "year": "works.year", "price": "works.list_price_krw", "note": "works.internal_note",
    "qty": "works.edition_size", "title_en": "works.title_en", "caption_en": "works.caption_en",
    "material_en": "works.material_en", "audio_master": "works.audio_master",
    "transcript_ko": "works.transcript_ko", "transcript_en": "works.transcript_en",
    "sold": "editions.status", "discount": "editions.discount_rate",
    "actual_price": "editions.actual_price_krw", "payment": "editions.payment_method",
    "sale_date": "editions.sale_date", "delivery_date": "editions.delivery_date",
    "channel": "editions.sales_channel", "owner": "editions.collector_name",
    "sold_qty": "editions(유도)", "exhibitions": "exhibition_works(정규화)",
}
wcols = set(sb("works?select=*&limit=1")[0].keys())
ecols = set(sb("editions?select=*&limit=1")[0].keys())
for sheet_f, dest in SHEET_TO_DB.items():
    if "(" in dest:
        continue
    table, col = dest.split(".")
    have = (col in wcols) if table == "works" else (col in ecols)
    check("시트 '%s' → %s" % (sheet_f, dest), have, "컬럼 없음")

print("\n[2] 판매 상태를 두 곳에서 계산하지 않는가")
# 화면 코드가 effective_status를 쓰지 않고 자체 판정하면 반드시 어긋난다(실제로 그랬다).
admin = open(os.path.join(REPO, "admin.html"), encoding="utf-8").read()
check("admin.html이 works_status 뷰를 읽는다", "works_status" in admin)
check("admin.html이 effective_status를 사용한다", "effective_status" in admin)
# 뷰를 안 쓰고 자체적으로 sold 전량 판정하던 옛 코드가 남아있지 않은지
check("자체 판정 코드(allSold) 잔존 없음", "allSold" not in admin, "flattenWork가 다시 계산 중")

print("\n[3] 공개 대상이 현재 사이트와 일치하는가")
pub = sb("works?select=work_no&publish_web=eq.true")
check("공개 작품 15건", len(pub) == 15, len(pub))
er = sb("works?select=work_no,publish_web&kind=eq.event_reward")
check("이벤트 리워드는 비공개", all(not w["publish_web"] for w in er), er)

print("\n[4] 관계 무결성")
works = sb("works?select=id,work_no,edition_size")
eds = sb("editions?select=work_id,edition_number,status")
by_work = {}
for e in eds:
    by_work.setdefault(e["work_id"], []).append(e)
bad = [w["work_no"] for w in works if len(by_work.get(w["id"], [])) != w["edition_size"]]
check("작품별 에디션 수 = edition_size", not bad, bad)
check("에디션 없는 작품 없음", all(by_work.get(w["id"]) for w in works),
      [w["work_no"] for w in works if not by_work.get(w["id"])])

print("\n[5] 비공개 정보가 공개 경로로 새지 않는가")
# anon(공개) 키로는 아무것도 못 읽어야 한다.
anon_key = re.search(r"const SB_KEY = '([^']+)'", admin)
leaked = []
if anon_key:
    AH = {"apikey": anon_key.group(1), "Authorization": "Bearer " + anon_key.group(1)}
    for t in ("works", "editions", "press", "works_status"):
        try:
            req = urllib.request.Request(URL + "/rest/v1/%s?select=*&limit=1" % t, headers=AH)
            urllib.request.urlopen(req, timeout=20)
            leaked.append(t)
        except urllib.error.HTTPError:
            pass
check("비로그인으로 읽히는 테이블 없음", not leaked, leaked)

print("\n" + ("=" * 50))
if FAILS:
    print("실패 %d건: %s" % (len(FAILS), ", ".join(FAILS)))
    sys.exit(1)
print("불변식 전부 통과")
