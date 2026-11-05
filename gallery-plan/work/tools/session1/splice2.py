import os, sys
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
s = open(p, encoding='utf8').read()
new = open(os.path.join(here, 'keyrings.js'), encoding='utf8').read()
a = s.index("/* ───────── 키링 샵 ───────── */"); b = s.index("/* ───────── 걷기 ───────── */")
s = s[:a] + new + "\n" + s[b:]
rep = [
 ("family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR", "family=Black+Han+Sans&family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR"),
 ("'700 40px \"IBM Plex Sans KR\"'].map(f => document.fonts.load(f, '가ㄱSH'))", "'700 40px \"IBM Plex Sans KR\"', '400 40px \"Black Han Sans\"'].map(f => document.fonts.load(f, '가ㄱSH@&#'))"),
 ("오른쪽 안쪽 해달자개 샵에는 한글 자음 키링이 걸려 있어요.", "오른쪽 안쪽 해달자개 샵에는 한글자음·알파벳 자개키링이 걸려 있어요."),
]
for x, y in rep:
    assert x in s, x[:60]
    s = s.replace(x, y)
open(p, 'w', encoding='utf8').write(s)
print('ok')
