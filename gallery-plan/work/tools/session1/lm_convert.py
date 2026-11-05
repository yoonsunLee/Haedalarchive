import sys, json, numpy as np
from PIL import Image
npy, uvj, outdir, name = sys.argv[1:5]
sig = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
a = np.load(npy).astype(np.float32)[..., :3]
# leftover noise: Gaussian inside islands only (divide by mask weight so empty black does not bleed into edges)
if sig > 0:
    r = int(sig * 3 + .5); kx = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sig * sig)); kx /= kx.sum()
    def blur(x):
        for ax in (0, 1):
            x = sum(np.roll(x, i - r, axis=ax) * kx[i] for i in range(2 * r + 1))
        return x
    m = (a.mean(-1) > 1e-4).astype(np.float32)
    w = blur(m) + 1e-6
    a = np.stack([blur(a[..., c] * m) / w for c in range(3)], -1) * m[..., None]
lum = a.mean(-1); mask = lum > 1e-4; nz = lum[mask]
p = float(np.percentile(nz, 99.5))
# lift: soft fill so shade keeps the warm V31 look (fraction of the lit level, slightly warm)
lift = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0
if lift > 0:
    a = a + mask[..., None] * lift * p * np.array([1.0, 0.96, 0.9], np.float32)
    p = p * (1 + lift)
scale = p / 0.95
x = np.clip(a / scale, 0, 1)
srgb = np.where(x <= .0031308, x * 12.92, 1.055 * np.power(x, 1/2.4) - .055)
img = (srgb[::-1] * 255 + .5).astype(np.uint8)
Image.fromarray(img).save(f"{outdir}/{name}", quality=92, method=6)
uv = json.load(open(uvj, encoding="utf8"))
json.dump({"image": name, "scale": scale, "expo": 0.34, "uv": uv}, open(f"{outdir}/lm.json", "w", encoding="utf8"))
print("shape", a.shape, "p99.5", p, "scale", scale, "coverage", (lum > 1e-4).mean())
