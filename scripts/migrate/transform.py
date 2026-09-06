# -*- coding: utf-8 -*-
"""
시트 행 → 목표 스키마(PostgreSQL) 변환 규칙.

순수 함수만 둔다(입출력 없음). 그래야 자격증명 없이도 실데이터 형태로 검증할 수 있고,
적재 단계에서 문제가 생겨도 변환 로직을 의심하지 않아도 된다.

매핑 근거: docs/migration/03-mapping-and-rollback.md
"""
import re

HANGUL = re.compile(r'[가-힣ㄱ-ㅎㅏ-ㅣ]')
LATIN = re.compile(r'[A-Za-z]')
NULLISH = {'', '-', '–', '—', 'N/A', 'n/a'}


def _blank(v):
    return str(v if v is not None else '').strip() in NULLISH


# ── 언어 분리 ─────────────────────────────────────────────────────────
def split_bilingual(text):
    """한/영이 한 칸에 섞여 저장된 값을 (ko, en)으로 나눈다.

    구분자가 일정하지 않다(006은 빈 줄, 008은 줄바꿈 하나). 그래서 줄로 쪼갠 뒤
    '한글이 하나라도 있으면 한국어 블록'으로 판정한다.
    '해(Sun)와 달(Moon)'처럼 한글 안에 영어가 섞인 경우를 영어로 오판하지 않기 위함이다.
    """
    raw = str(text if text is not None else '').replace('\r\n', '\n').replace('\r', '\n')
    if not raw.strip():
        return '', ''
    ko_parts, en_parts = [], []
    for block in raw.split('\n'):
        b = block.strip()
        if not b:
            continue
        if HANGUL.search(b):
            ko_parts.append(b)
        elif LATIN.search(b):
            en_parts.append(b)
        else:
            # 숫자·기호만 있는 줄은 한국어 쪽에 붙여 원문을 잃지 않는다
            ko_parts.append(b)
    return '\n'.join(ko_parts).strip(), '\n'.join(en_parts).strip()


def split_title(title, title_en_col=''):
    """제목은 전용 title_en 컬럼이 있으면 그쪽을 우선하고, 없으면 레거시 '한글\\n영문'을 분리."""
    if str(title_en_col or '').strip():
        ko = str(title or '').split('\n')[0].strip()
        return ko, str(title_en_col).strip()
    return split_bilingual(title)


# ── 날짜 ──────────────────────────────────────────────────────────────
def parse_date(v):
    """'2026-03-21'과 '2026.05.17' 두 형식이 섞여 있다. 둘 다 ISO로 정규화."""
    s = str(v if v is not None else '').strip()
    if s in NULLISH:
        return None
    m = re.match(r'^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$', s)
    if not m:
        return None
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if not (1 <= mo <= 12 and 1 <= d <= 31):
        return None
    return f"{y:04d}-{mo:02d}-{d:02d}"


# ── 금액 · 비율 ───────────────────────────────────────────────────────
def parse_money(v):
    """숫자만 취한다. 'Artist Archive'(HD-2026-001)처럼 텍스트가 든 칸은 None + 사유 반환."""
    s = str(v if v is not None else '').strip().replace(',', '')
    if s in NULLISH:
        return None, None
    if re.fullmatch(r'\d+', s):
        return int(s), None
    return None, s          # 두 번째 값 = internal_note로 옮길 원문


def parse_rate(v):
    """할인률. '0.1'/'0.2'/'0'/'-'/'20%' 모두 0~1 사이 값으로."""
    s = str(v if v is not None else '').strip()
    if s in NULLISH:
        return None
    pct = s.endswith('%')
    s = s.rstrip('%').strip()
    try:
        n = float(s)
    except ValueError:
        return None
    if pct or n > 1:
        n = n / 100.0
    return round(n, 3) if 0 <= n <= 1 else None


# ── 크기 ──────────────────────────────────────────────────────────────
DIM_SEP = re.compile(r'\s*[×xX*]\s*')


def parse_size(v):
    """원문은 무조건 보존하고, 뽑을 수 있으면 수치도 채운다.

    '27.3 × 27.3'      -> (원문, 27.3, 27.3, None)
    '10 × 9 × 6'       -> (원문, 10, 9, 6)
    'A1 (59.4 × 84.1)' -> (원문, 59.4, 84.1, None)   괄호 안에서 추출
    """
    s = str(v if v is not None else '').strip()
    if not s:
        return '', None, None, None
    target = s
    paren = re.search(r'\(([^)]*)\)', s)
    if paren and DIM_SEP.search(paren.group(1)):
        target = paren.group(1)
    nums = []
    for part in DIM_SEP.split(target.strip()):
        part = part.strip()
        if re.fullmatch(r'\d+(?:\.\d+)?', part):
            nums.append(float(part))
        else:
            nums = []
            break
    if len(nums) == 2:
        return s, nums[0], nums[1], None
    if len(nums) == 3:
        return s, nums[0], nums[1], nums[2]
    return s, None, None, None


# ── 상태 ──────────────────────────────────────────────────────────────
def parse_sale_status(sold):
    """'판매여부' 한 칸이 겸하던 네 가지 의미를 분리한다."""
    s = str(sold if sold is not None else '').strip()
    if s == '●':
        return 'sold'
    if s.upper() == 'NFS':
        return 'nfs'
    if s == '등록 예정':
        return 'planned'          # 호출측에서 work_state로 처리
    return 'available'


EXHIBITION_TYPE = {
    '개인전': 'solo', '단체전': 'group', '기획전': 'curated',
    '아트페어': 'art_fair', '특별전': 'special', '팝업': 'popup',
}


def parse_exhibition_type(v):
    return EXHIBITION_TYPE.get(str(v or '').strip(), 'group')


# ── 작품 분류 · 공개 정책 ─────────────────────────────────────────────
def work_kind(work_no, material=''):
    no = str(work_no or '').strip().upper()
    if no.startswith('ER-'):
        return 'event_reward'
    if '수지' in str(material or ''):     # 굴패각 친환경 수지 = 아트토이
        return 'art_toy'
    return 'artwork'


def should_publish(work_no):
    """publish.py에 하드코딩돼 있던 공개 정책을 데이터로 옮긴 것.

    ER-(이벤트 리워드)은 작가 결정으로 영구 비공개(2026-09-05).
    아트토이 013/014는 별도 작품이 아니라 012의 에디션으로 접히므로 여기 목록에 없다.
    """
    return not str(work_no or '').strip().upper().startswith('ER-')


# 제목 패턴 추론(works/index.html의 heuristic)을 대체하는 명시적 지정
SERIES_KEYS = {
    'HD-2026-002': 'n-th-derivative', 'HD-2026-011': 'n-th-derivative',
    'HD-2025-004': 'n-th-derivative',
    'HD-2026-003': 'pov', 'HD-2026-006': 'pov', 'HD-2026-007': 'pov',
    'HD-2026-010': 'pov',
    'HD-2026-004': 'territory', 'HD-2026-009': 'territory',
}


def series_key(work_no):
    return SERIES_KEYS.get(str(work_no or '').strip())


# ── 에디션 접기 ───────────────────────────────────────────────────────
# 작가 결정(2026-09-05): 같은 작품의 실물 3점이므로 1 work + 3 editions로 접는다.
EDITION_GROUPS = {
    'HD-2026-012': ['HD-2026-012', 'HD-2026-013', 'HD-2026-014'],
}
TYPO_FIXES = {'Limited Editon': 'Limited Edition'}


def fix_typos(text):
    s = str(text if text is not None else '')
    for wrong, right in TYPO_FIXES.items():
        s = s.replace(wrong, right)
    return s


def build_edition(row, number):
    """작품 행 하나 → 에디션 1점. 판매·소장 정보는 전부 여기로 온다."""
    status = parse_sale_status(row.get('sold'))
    if status == 'planned':
        status = 'available'
    list_price, _ = parse_money(row.get('price'))
    actual, _ = parse_money(row.get('actual_price'))
    return {
        'edition_number': number,
        'status': status,
        'list_price_krw': list_price,
        'actual_price_krw': actual,
        'discount_rate': parse_rate(row.get('discount')),
        'payment_method': None if _blank(row.get('payment')) else str(row['payment']).strip(),
        'sales_channel': None if _blank(row.get('channel')) else str(row['channel']).strip(),
        'collector_name': None if _blank(row.get('owner')) else str(row['owner']).strip(),
        'sale_date': parse_date(row.get('sale_date')),
        'delivery_date': parse_date(row.get('delivery_date')),
    }


def transform_work(row):
    """작품 행 하나 → works 레코드(에디션 제외)."""
    no = str(row.get('no', '')).strip()
    title_ko, title_en = split_title(fix_typos(row.get('title')), fix_typos(row.get('title_en', '')))
    cap_ko, cap_en = split_bilingual(row.get('caption'))
    mat_ko, mat_en = split_bilingual(row.get('material'))
    # 전용 영문 컬럼이 채워져 있으면 그쪽이 정본
    cap_en = str(row.get('caption_en') or '').strip() or cap_en
    mat_en = str(row.get('material_en') or '').strip() or mat_en

    size_text, w, h, d = parse_size(row.get('size'))
    list_price, price_note = parse_money(row.get('price'))

    notes = []
    if not _blank(row.get('note')):
        notes.append(str(row['note']).strip())
    if price_note:
        # 'Artist Archive'처럼 가격 칸에 들어있던 설명을 잃지 않는다
        notes.append(f"[판매가격 칸 원문] {price_note}")

    year = str(row.get('year', '')).strip()
    return {
        'work_no': no,
        'kind': work_kind(no, row.get('material')),
        'title_ko': title_ko,
        'title_en': title_en or None,
        'caption_ko': cap_ko or None,
        'caption_en': cap_en or None,
        'material_ko': mat_ko or None,
        'material_en': mat_en or None,
        'year': int(year) if year.isdigit() else None,
        'size_text': size_text or None,
        'width_cm': w, 'height_cm': h, 'depth_cm': d,
        'work_state': 'planned' if parse_sale_status(row.get('sold')) == 'planned' else 'completed',
        'list_price_krw': list_price,
        'edition_size': 1,
        'publish_web': should_publish(no),
        'series_key': series_key(no),
        'internal_note': '\n'.join(notes) or None,
    }


def transform_all(rows):
    """전체 변환. 에디션 접기까지 수행해 (works, editions) 반환."""
    by_no = {str(r.get('no', '')).strip(): r for r in rows}
    folded = {m for members in EDITION_GROUPS.values() for m in members}

    works, editions = [], []
    for row in rows:
        no = str(row.get('no', '')).strip()
        if not no or (no in folded and no not in EDITION_GROUPS):
            continue                      # 에디션으로 흡수되는 행은 건너뛴다

        w = transform_work(row)
        if no in EDITION_GROUPS:
            members = [m for m in EDITION_GROUPS[no] if m in by_no]
            w['edition_size'] = len(members)
            absorbed = [m for m in members if m != no]
            if absorbed:
                note = f"[에디션 통합] 시트의 {', '.join(absorbed)} 행이 이 작품의 에디션으로 합쳐짐"
                w['internal_note'] = (w['internal_note'] + '\n' + note) if w['internal_note'] else note
            for i, m in enumerate(members, start=1):
                e = build_edition(by_no[m], i)
                e['work_no'] = no
                editions.append(e)
        else:
            e = build_edition(row, 1)
            e['work_no'] = no
            editions.append(e)
        works.append(w)
    return works, editions
