# -*- coding: utf-8 -*-
"""변환 규칙 검증. 실제 시트에서 발견된 이상 케이스를 그대로 재현한다.

개인정보(소장자 실명·실거래가)는 픽스처에 넣지 않는다 — 형태만 같으면 검증에 충분하다.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from transform import (
    split_bilingual, split_title, parse_date, parse_money, parse_rate,
    parse_size, parse_sale_status, parse_exhibition_type, work_kind,
    should_publish, series_key, transform_all, fix_typos,
)

P = F = 0
def ck(name, cond, extra=''):
    global P, F
    if cond: P += 1; print('  ok  ' + name)
    else:    F += 1; print('  FAIL ' + name + (' :: ' + str(extra) if extra else ''))

print('[언어 분리] 실제 구분자가 제각각인 케이스')
# HD-2026-006: 빈 줄로 구분
ko, en = split_bilingual('목심저피나전칠기(천연자개, 옻칠, 삼베 등)\n\nNajeonchilgi (Mother-of-pearl, Lacquer, Hemp cloth, etc.)')
ck('빈 줄 구분 - 한글', ko == '목심저피나전칠기(천연자개, 옻칠, 삼베 등)', ko)
ck('빈 줄 구분 - 영문', en == 'Najeonchilgi (Mother-of-pearl, Lacquer, Hemp cloth, etc.)', en)
# HD-2026-008: 줄바꿈 하나로 구분
ko, en = split_bilingual('목심저피나전칠기(천연자개, 옻칠, 삼베 등)\nNajeonchilgi (Mother-of-pearl, Lacquer, Hemp cloth, etc.)')
ck('줄바꿈 하나 구분', ko.startswith('목심저피') and en.startswith('Najeonchilgi'), (ko, en))
# HD-2026-004: 한글 속 영어 괄호를 영문으로 오판하면 안 됨
ko, en = split_bilingual('해(Sun)와 달(Moon)을 나란히 읽으면 \'해달\'이 된다.')
ck('한글 속 영어 괄호는 한국어로 유지', en == '' and 'Sun' in ko, (ko, en))
# 순수 한글 (대다수 작품)
ko, en = split_bilingual('블루북은 미국 로스쿨생의 악몽이자 필수도서다.')
ck('순수 한글은 en 비어있음', en == '', en)

print('\n[제목] 전용 컬럼 우선 + 레거시 폴백')
ck('레거시 한글\\n영문', split_title('한글제목\nEnglish Title') == ('한글제목', 'English Title'))
ck('전용 컬럼 우선', split_title('한글제목\n구영문', 'New English') == ('한글제목', 'New English'))
ck('영문 없음', split_title('한글만') == ('한글만', ''))

print('\n[오타 수정]')
ck('Editon -> Edition', fix_typos('조개배달부 얼빵해달 2026 Limited Editon') == '조개배달부 얼빵해달 2026 Limited Edition')

print('\n[날짜] 두 형식 혼재')
ck("'2026-03-21'", parse_date('2026-03-21') == '2026-03-21')
ck("'2026.05.17'", parse_date('2026.05.17') == '2026-05-17')
ck("빈칸 -> None", parse_date('') is None)
ck("'-' -> None", parse_date('-') is None)
ck('잘못된 월 -> None', parse_date('2026-13-01') is None)

print('\n[금액] 텍스트가 든 칸 처리')
ck('숫자', parse_money('650000') == (650000, None))
ck('콤마 포함', parse_money('1,000,000') == (1000000, None))
ck("'Artist Archive' -> None + 원문 보존", parse_money('Artist Archive') == (None, 'Artist Archive'))
ck("'-' -> None", parse_money('-') == (None, None))
ck('0원', parse_money('0') == (0, None))

print('\n[할인률]')
ck('0.1', parse_rate('0.1') == 0.1)
ck('0.2', parse_rate('0.2') == 0.2)
ck('0', parse_rate('0') == 0.0)
ck("'-' -> None", parse_rate('-') is None)
ck("'20%' -> 0.2", parse_rate('20%') == 0.2)

print('\n[크기] 원문 보존 + 수치 추출')
ck('2D', parse_size('27.3 × 27.3') == ('27.3 × 27.3', 27.3, 27.3, None))
ck('3D', parse_size('10 × 9 × 6') == ('10 × 9 × 6', 10.0, 9.0, 6.0))
t, w, h, d = parse_size('A1 (59.4 × 84.1)')
ck('규격지 표기 - 원문 보존', t == 'A1 (59.4 × 84.1)', t)
ck('규격지 표기 - 괄호에서 수치 추출', (w, h, d) == (59.4, 84.1, None), (w, h, d))

print('\n[판매 상태]')
ck("'●' -> sold", parse_sale_status('●') == 'sold')
ck("'NFS' -> nfs", parse_sale_status('NFS') == 'nfs')
ck('빈칸 -> available', parse_sale_status('') == 'available')
ck("'등록 예정' -> planned", parse_sale_status('등록 예정') == 'planned')

print('\n[전시 유형]')
ck('개인전', parse_exhibition_type('개인전') == 'solo')
ck('아트페어', parse_exhibition_type('아트페어') == 'art_fair')

print('\n[분류 · 공개 정책]')
ck('ER- -> event_reward', work_kind('ER-2026-001') == 'event_reward')
ck('수지 -> art_toy', work_kind('HD-2026-012', '굴패각 친환경 수지, 옻칠, 천연자개') == 'art_toy')
ck('일반 작품', work_kind('HD-2026-001', '목심저피나전칠기') == 'artwork')
ck('ER은 비공개', should_publish('ER-2026-001') is False)
ck('HD는 공개', should_publish('HD-2026-001') is True)
ck('시리즈 지정', series_key('HD-2026-004') == 'territory' and series_key('HD-2026-009') == 'territory')

print('\n[에디션 접기] 아트토이 3행 -> 1작품 3에디션')
rows = [
  {'no':'HD-2026-001','title':'작품1\nWork One','material':'목심저피나전칠기','size':'45 × 45',
   'year':'2026','price':'Artist Archive','sold':'NFS','note':''},
  {'no':'HD-2026-012','title':'조개배달부 얼빵해달 2026 Limited Editon\nShell Delivery Spaced-out Sea Otter',
   'material':'굴패각 친환경 수지, 옻칠, 천연자개','size':'10 × 9 × 6','year':'2026',
   'price':'169000','sold':'●','owner':'구매자A','sale_date':'2026-07-30','delivery_date':'2026-08-20','note':'메모'},
  {'no':'HD-2026-013','title':'조개배달부 얼빵해달 2026 Limited Editon\nShell Delivery Spaced-out Sea Otter',
   'material':'굴패각 친환경 수지, 옻칠, 천연자개','size':'10 × 9 × 6','year':'2026',
   'price':'240000','sold':'●','owner':'구매자B','sale_date':'2026-08-18'},
  {'no':'HD-2026-014','title':'조개배달부 얼빵해달 2026 Limited Editon\nShell Delivery Spaced-out Sea Otter',
   'material':'굴패각 친환경 수지, 옻칠, 천연자개','size':'10 × 9 × 6','year':'2026',
   'price':'240000','sold':''},
  {'no':'ER-2026-001','title':'배달 확인 중\nChecking Delivery','material':'칠판자석액자','size':'30 × 20',
   'year':'2026','price':'0','sold':'●'},
]
works, editions = transform_all(rows)
wno = [w['work_no'] for w in works]
ck('작품 3건으로 접힘 (5행 -> 3작품)', wno == ['HD-2026-001','HD-2026-012','ER-2026-001'], wno)
toy = [w for w in works if w['work_no']=='HD-2026-012'][0]
ck('edition_size = 3', toy['edition_size'] == 3, toy['edition_size'])
ck('제목 오타 수정됨', 'Limited Edition' in toy['title_ko'], toy['title_ko'])
ck('통합 이력이 내부메모에 남음', '에디션 통합' in (toy['internal_note'] or ''), toy['internal_note'])
toy_eds = [e for e in editions if e['work_no']=='HD-2026-012']
ck('에디션 3점 생성', len(toy_eds) == 3, len(toy_eds))
ck('에디션 번호 1,2,3', [e['edition_number'] for e in toy_eds] == [1,2,3])
ck('1번 판매완료', toy_eds[0]['status']=='sold' and toy_eds[0]['list_price_krw']==169000)
ck('3번 판매가능', toy_eds[2]['status']=='available')
ck('소장자는 에디션에 있음', toy_eds[0]['collector_name']=='구매자A')

er = [w for w in works if w['work_no']=='ER-2026-001'][0]
ck('ER 비공개', er['publish_web'] is False)
ck('ER 분류', er['kind'] == 'event_reward')

w1 = [w for w in works if w['work_no']=='HD-2026-001'][0]
ck('가격칸 텍스트 -> list_price None', w1['list_price_krw'] is None)
ck('가격칸 원문이 내부메모로 보존', 'Artist Archive' in (w1['internal_note'] or ''), w1['internal_note'])
ck('유일작도 에디션 1행', len([e for e in editions if e['work_no']=='HD-2026-001']) == 1)
ck('총 에디션 = 5 (1+3+1)', len(editions) == 5, len(editions))

print(f'\n== pass: {P}, fail: {F} ==')
sys.exit(1 if F else 0)
