# -*- coding: utf-8 -*-
"""시트 → INSERT SQL 생성.

service_role 키를 주고받지 않기 위해, 적재는 Supabase SQL Editor에서 사람이 실행한다.
이 스크립트는 실행할 SQL을 만들어 줄 뿐이고 DB에 직접 접속하지 않는다.

  ADMIN_TOKEN=... ARCHIVE_API=... python3 generate_sql.py <출력경로>

주의: 출력 SQL에는 소장자 실명·실거래가가 들어간다.
공개 저장소에 커밋하지 말 것 (그래서 출력 경로를 인자로 받는다).
"""
import json, os, sys, urllib.request, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from transform import (
    transform_all, split_bilingual, parse_date, parse_exhibition_type,
    EDITION_GROUPS, fix_typos,
)

API = os.environ.get("ARCHIVE_API", "").strip()
TOKEN = os.environ.get("ADMIN_TOKEN", "").strip()
if not API or not TOKEN:
    sys.exit("ARCHIVE_API / ADMIN_TOKEN 환경변수가 필요합니다")
OUT = sys.argv[1] if len(sys.argv) > 1 else "migration.sql"


def get(qs):
    req = urllib.request.Request(API + "?" + qs, headers={"User-Agent": "haedal-migrate"})
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.loads(r.read().decode("utf-8"))
    if not d.get("ok"):
        raise SystemExit("API 오류: " + str(d.get("error")))
    return d.get("rows", [])


def lit(v):
    """SQL 리터럴. None은 NULL, 문자열은 작은따옴표 이스케이프."""
    if v is None or v == "":
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"


def insert(table, cols, rows):
    if not rows:
        return f"-- {table}: 대상 없음\n"
    out = [f"insert into {table} ({', '.join(cols)}) values"]
    vals = []
    for r in rows:
        vals.append("  (" + ", ".join(lit(r.get(c)) for c in cols) + ")")
    out.append(",\n".join(vals) + ";")
    return "\n".join(out) + "\n"


# ── 수집 ──────────────────────────────────────────────────────────────
print("아카이브에서 읽는 중…")
work_rows = get("action=list&token=" + urllib.parse.quote(TOKEN))
ex_rows = get("sheet=exhibitions")
press_rows = get("sheet=press")
print(f"  작품 {len(work_rows)} · 전시 {len(ex_rows)} · 언론 {len(press_rows)}")

works, editions = transform_all(work_rows)
print(f"  변환: 작품 {len(works)} · 에디션 {len(editions)}")

# ── 전시 ──────────────────────────────────────────────────────────────
exhibitions = []
for r in ex_rows:
    exhibitions.append({
        "exhibition_no": str(r.get("id", "")).strip(),
        "title_ko": str(r.get("title", "")).strip(),
        "title_en": str(r.get("title_en", "")).strip() or None,
        "venue_ko": str(r.get("venue", "")).strip() or None,
        "venue_en": str(r.get("venue_en", "")).strip() or None,
        "type": parse_exhibition_type(r.get("type")),
        "start_date": parse_date(r.get("start_date")),
        "end_date": parse_date(r.get("end_date")),
        "docent_url": str(r.get("docent_url", "")).strip() or None,
        "note_public_ko": str(r.get("note_public", "")).strip() or None,
    })

# ── 전시 ↔ 작품 (에디션 접기 반영) ────────────────────────────────────
absorbed = {}          # 013 -> 012 처럼 흡수된 번호 매핑
for rep, members in EDITION_GROUPS.items():
    for m in members:
        absorbed[m] = rep
valid_works = {w["work_no"] for w in works}

links, skipped = [], []
for r in ex_rows:
    ex_no = str(r.get("id", "")).strip()
    seen = set()
    for raw in str(r.get("work_nos", "")).split(","):
        wn = raw.strip()
        if not wn:
            continue
        wn = absorbed.get(wn, wn)      # 에디션으로 접힌 번호는 대표 번호로
        if wn not in valid_works:
            skipped.append((ex_no, raw.strip()))
            continue
        if wn in seen:                 # 013·014가 같은 전시에 있던 중복 제거
            continue
        seen.add(wn)
        links.append({"exhibition_no": ex_no, "work_no": wn})

# ── 언론 ──────────────────────────────────────────────────────────────
# 현재 프론트가 기사 제목 문자열로 추론하던 관계를 여기서 1회 확정한다.
PRESS_META = {
    "PR-2026-001": ("feature", None, None),
    "PR-2026-002": ("feature", None, "brand_shop"),
    "PR-2026-003": ("feature", None, None),
    "PR-2026-004": ("mention", "EX-2026-10", "exhibition"),
    "PR-2026-005": ("mention", "EX-2026-07", "exhibition"),
    "PR-2026-006": ("mention", "EX-2026-04", "exhibition"),
}
press = []
for r in press_rows:
    no = str(r.get("no", "")).strip()
    ptype, ex_link, link_type = PRESS_META.get(no, ("mention", None, None))
    t_ko, t_en_inline = split_bilingual(r.get("title"))
    press.append({
        "press_no": no,
        "type": ptype,
        "outlet_ko": str(r.get("outlet", "")).strip(),
        "published_date": parse_date(r.get("date")),
        "title_ko": t_ko,
        "title_en": str(r.get("title_en", "")).strip() or t_en_inline or None,
        "quote_ko": str(r.get("quote", "")).strip() or None,
        "quote_en": str(r.get("quote_en", "")).strip() or None,
        "url": str(r.get("url", "")).strip() or None,
        "image_source_url": str(r.get("image", "")).strip() or None,
        "byline": str(r.get("note", "")).strip() or None,
        "_ex": ex_link,
        "link_type": link_type,
    })

# ── 용어집 시드 ───────────────────────────────────────────────────────
TERMS = [
    ("technique", "나전칠기", "Traditional Korean mother-of-pearl lacquerware (najeonchilgi)", "najeonchilgi", "첫 소개", True),
    ("technique", "목심저피나전칠기", "Traditional Korean najeonchilgi on a hemp-wrapped wood core", None, "재료 표기", True),
    ("technique", "목심지태나전칠기", "Traditional Korean najeonchilgi on a hanji-wrapped wood core", None, "재료 표기", True),
    ("technique", "목심나전칠기", "Traditional Korean najeonchilgi on a wood core", None, "재료 표기", True),
    ("technique", "지태칠기", "Traditional Korean paper-body lacquerware", None, "재료 표기", True),
    ("technique", "변칠기법", "Traditional Korean decorative lacquer technique (byeonchil)", "byeonchil", "재료 표기", True),
    ("material", "천연자개", "Natural mother-of-pearl", None, "재료 표기", True),
    ("material", "옻칠", "Lacquer", None, "재료 표기", True),
    ("material", "삼베", "Hemp cloth", None, "재료 표기", True),
    ("material", "한지", "Hanji, traditional Korean paper", "hanji", "재료 표기", True),
    ("material", "목심", "Wood core", None, "재료 표기", True),
    ("brand", "신해달", "Shin Haedal", None, "작가명", True),
    ("brand", "얼빵해달", "Eolbbang Haedal", None, "IP 공식명. 의미 설명은 Spaced-out Sea Otter", True),
    ("brand", "일월오봉단", "Ilwolobongdan", None, "캐릭터 그룹명. 번역하지 않음", True),
    ("brand", "해달자개", "Haedaljagae", None, "브랜드명", True),
    ("brand", "나전칠기 작가", "Najeonchilgi Artist", None, "공식 descriptor", True),
    ("exhibition_type", "개인전", "Solo Exhibition", None, "UI", True),
    ("exhibition_type", "단체전", "Group Exhibition", None, "UI", True),
    ("exhibition_type", "아트페어", "Art Fair", None, "UI", True),
    ("exhibition_type", "기획전", "Curated Exhibition", None, "UI", True),
]
terms = [{"category": c, "term_ko": k, "term_en": e, "short_en": s, "usage_note": u, "locked": l}
         for c, k, e, s, u, l in TERMS]

# ── SQL 조립 ──────────────────────────────────────────────────────────
parts = ["-- 해달아카이브 데이터 이관 (자동 생성)",
         "-- 소장자·거래가가 포함됨. 공개 저장소에 커밋 금지.",
         "begin;", ""]

parts.append("-- 용어집")
parts.append(insert("terminology", ["category", "term_ko", "term_en", "short_en", "usage_note", "locked"], terms))

parts.append("-- 전시")
parts.append(insert("exhibitions",
    ["exhibition_no", "title_ko", "title_en", "venue_ko", "venue_en", "type",
     "start_date", "end_date", "docent_url", "note_public_ko"], exhibitions))

parts.append("-- 작품")
parts.append(insert("works",
    ["work_no", "kind", "title_ko", "title_en", "caption_ko", "caption_en",
     "material_ko", "material_en", "year", "size_text", "width_cm", "height_cm",
     "depth_cm", "work_state", "list_price_krw", "edition_size", "publish_web",
     "series_key", "internal_note"], works))

parts.append("-- 에디션 (work_no로 작품을 찾아 연결)")
for e in editions:
    cols = ["work_id", "edition_number", "status", "list_price_krw", "actual_price_krw",
            "discount_rate", "payment_method", "sales_channel", "collector_name",
            "sale_date", "delivery_date"]
    vals = [f"(select id from works where work_no = {lit(e['work_no'])})",
            lit(e["edition_number"]), lit(e["status"]), lit(e["list_price_krw"]),
            lit(e["actual_price_krw"]), lit(e["discount_rate"]), lit(e["payment_method"]),
            lit(e["sales_channel"]), lit(e["collector_name"]), lit(e["sale_date"]),
            lit(e["delivery_date"])]
    parts.append(f"insert into editions ({', '.join(cols)}) values ({', '.join(vals)});")
parts.append("")

parts.append("-- 전시 ↔ 작품")
for i, l in enumerate(links):
    parts.append(
        "insert into exhibition_works (exhibition_id, work_id, display_order) values ("
        f"(select id from exhibitions where exhibition_no = {lit(l['exhibition_no'])}), "
        f"(select id from works where work_no = {lit(l['work_no'])}), {i});")
parts.append("")

parts.append("-- 언론")
for p in press:
    cols = ["press_no", "type", "outlet_ko", "published_date", "title_ko", "title_en",
            "quote_ko", "quote_en", "url", "image_source_url", "byline", "link_type",
            "linked_exhibition_id"]
    ex_expr = (f"(select id from exhibitions where exhibition_no = {lit(p['_ex'])})"
               if p["_ex"] else "NULL")
    vals = [lit(p[c]) for c in cols[:-1]] + [ex_expr]
    parts.append(f"insert into press ({', '.join(cols)}) values ({', '.join(vals)});")
parts.append("")

parts.append("commit;")
parts.append("")
parts.append("-- 확인용")
parts.append("select 'works' t, count(*) from works union all")
parts.append("select 'editions', count(*) from editions union all")
parts.append("select 'exhibitions', count(*) from exhibitions union all")
parts.append("select 'exhibition_works', count(*) from exhibition_works union all")
parts.append("select 'press', count(*) from press union all")
parts.append("select 'terminology', count(*) from terminology;")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(parts))

print(f"\n생성: {OUT}")
print(f"  작품 {len(works)} · 에디션 {len(editions)} · 전시 {len(exhibitions)} · "
      f"전시작품 {len(links)} · 언론 {len(press)} · 용어 {len(terms)}")
if skipped:
    print(f"  건너뛴 전시-작품 참조 {len(skipped)}건: {skipped}")
