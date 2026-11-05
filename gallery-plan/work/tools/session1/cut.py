import sys
from collections import deque
from PIL import Image

IMG = r'C:/Users/yoons/AppData/Local/Temp/claude/C--Users-yoons-Desktop-Claude-code-haedal-archive/b688017f-e730-4bff-8015-a1a7f89e2b1f/images/'
OUT = r'C:/Users/yoons/Desktop/Claude code/haedal-archive/gallery/img/'

def bgfill(im, thr=238):
    """가장자리에서 시작해 거의 흰 픽셀을 투명하게"""
    im = im.convert('RGBA'); w, h = im.size; px = im.load()
    seen = bytearray(w * h); q = deque()
    for x in range(w): q.append((x, 0)); q.append((x, h - 1))
    for y in range(h): q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]: continue
        seen[y * w + x] = 1
        r, g, b, a = px[x, y]
        if a < 20 or (r > thr and g > thr and b > thr):
            px[x, y] = (255, 255, 255, 0)
            q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im

def trim(im, pad=4):
    bb = im.getchannel('A').point(lambda v: 255 if v > 30 else 0).getbbox()
    x0, y0, x1, y1 = bb
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))

# 턴어라운드: 앞, 왼옆, 뒤, 오른옆
sheet = Image.open(IMG + '14.png').convert('RGBA')
for name, (x0, x1) in {'av-front': (40, 258), 'av-side': (258, 445), 'av-back': (449, 660), 'av-side2': (655, 834)}.items():
    c = trim(bgfill(sheet.crop((x0, 30, x1, 330))))
    c = c.resize((c.width * 2, c.height * 2), Image.LANCZOS)
    c.save(OUT + name + '.webp', quality=90); print(name, c.size)

# 등신대(정면), 조개 도장
st = Image.open(IMG + '28.webp').convert('RGBA')
print('standee corner', st.getpixel((5, 5)))
st = trim(bgfill(st)); st.thumbnail((1100, 1100)); st.save(OUT + 'standee.webp', quality=88); print('standee', st.size)
sh = Image.open(IMG + '27.webp').convert('RGBA')
print('shell corner', sh.getpixel((5, 5)))
sh = trim(bgfill(sh)); sh.thumbnail((512, 512)); sh.save(OUT + 'shell-stamp.webp', quality=90); print('shell', sh.size)
