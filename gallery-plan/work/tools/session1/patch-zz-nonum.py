import re as _re
# 전시실 번호는 쓰지 않는다: 이름만
s = _re.sub(r"[⓪①②③] ", "", s)
for n in ['00', '01', '02', '03']:
    s = s.replace(f"'→ {n} ", "'→ ").replace(f", '{n}', '", ", '', '")
