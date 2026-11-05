"""구운 빛(lm-*.npy, 선형)을 웹용 webp로 바꾼다. 모든 판을 같은 배율로 줄여 밝기 차이를 지킨다.

python lightmaps.py <구운 폴더> <내보낼 폴더>
배율은 lightmaps.json에 적어 three.js에서 다시 곱한다.
"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
maps = {os.path.basename(p)[3:-4]: np.load(p) for p in sorted(glob.glob(os.path.join(src, "lm-*.npy")))}
peak = max(float(np.percentile(a, 99.5)) for a in maps.values())
scale = peak / 0.95   # 이 값을 곱하면 원래 빛 세기
for name, a in maps.items():
    v = np.clip(a / scale, 0, 1)
    srgb = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
    img = Image.fromarray((srgb * 255 + 0.5).astype(np.uint8)[::-1])   # Blender 픽셀은 아래에서 위로
    img.save(os.path.join(dst, f"lm-{name}.webp"), quality=92, method=6)
    print(name, img.size, os.path.getsize(os.path.join(dst, f"lm-{name}.webp")))
json.dump({"scale": scale}, open(os.path.join(dst, "lightmaps.json"), "w"))
print("scale", scale)
