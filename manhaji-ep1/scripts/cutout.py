"""Cut the studio-shot cars out of their light grey background (edge-guided flood fill).

usage: python3 -I scripts/cutout.py in.png out.png [edge_threshold]
"""
import subprocess, sys
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else 1.2
w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", src],
                                capture_output=True, text=True).stdout.strip().split(","))
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
img = np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(np.float32)
lum = img.mean(2)

# gradient magnitude
gy, gx = np.gradient(lum)
grad = np.hypot(gx, gy)

bg = np.median(np.concatenate([img[:8].reshape(-1, 3), img[-8:].reshape(-1, 3), img[:, :8].reshape(-1, 3), img[:, -8:].reshape(-1, 3)]), 0)
near_bg = np.abs(img - bg).max(2) < 14
passable = (grad < thr) & near_bg


def dilate(m, r=1):
    o = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o


# edges grow a little so the fill cannot squeeze through hairline gaps
walls = dilate(~passable, 1)
fill = np.zeros_like(passable)
fill[6, 6:-6] = fill[-7, 6:-6] = fill[6:-6, 6] = fill[6:-6, -7] = True
fill &= ~walls
for _ in range(4000):
    nxt = dilate(fill, 1) & ~walls
    if (nxt == fill).all():
        break
    fill = nxt
# second pass: the soft floor shadow under the car is background too
fg0 = ~dilate(fill, 2)
ys, xs = np.nonzero(fg0)
ylow = int(ys.min() + 0.70 * (ys.max() - ys.min()))
sat = img.max(2) - img.min(2)
soft = (grad < 4.5) & (sat < 12) & (lum > 120) & (np.abs(lum - bg.mean()) < 90)
region = np.zeros_like(fill)
region[ylow:] = True
walls2 = dilate(~np.where(region, soft, passable), 1)
for _ in range(4000):
    nxt = dilate(fill, 1) & ~walls2
    if (nxt == fill).all():
        break
    fill = nxt
# the background is what the fill reached, plus the wall band touching it
bgmask = dilate(fill, 2)
fg = ~bgmask
# trim the floor shadow: in the lower part keep only the span between hard edges (tyres, bumper outlines)
ys, xs = np.nonzero(fg)
y0b, y1b = ys.min(), ys.max()
hard = fg & ((lum < 110) | (grad > 9))
for y in range(int(y0b + 0.55 * (y1b - y0b)), h):
    hx = np.nonzero(hard[y])[0]
    if len(hx) < 3:
        fg[y] = False
        continue
    fg[y, : max(0, hx.min() - 2)] = False
    fg[y, hx.max() + 3:] = False
# keep the largest blob: fill holes by flooding the background from outside only
# keep only the car itself (the blob connected to its centre)
ys, xs = np.nonzero(fg)
seed = np.zeros_like(fg)
cy, cx = int(np.median(ys)), int(np.median(xs))
seed[cy, cx] = fg[cy, cx] or True
blob = seed & fg
for _ in range(4000):
    nxt = dilate(blob, 2) & fg
    if (nxt == blob).all():
        break
    blob = nxt
fg = blob
# soft edge
a = fg.astype(np.float32)
for _ in range(2):
    a = (a + np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1)) / 5
rgba = np.dstack([img, a * 255]).clip(0, 255).astype(np.uint8)
# crop to content
ys, xs = np.nonzero(a > 0.05)
y0, y1, x0, x1 = max(0, ys.min() - 4), min(h, ys.max() + 5), max(0, xs.min() - 4), min(w, xs.max() + 5)
rgba = rgba[y0:y1, x0:x1]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{x1 - x0}x{y1 - y0}", "-i", "-", dst],
               input=rgba.tobytes(), check=True)
print(dst, x1 - x0, y1 - y0, "fg fraction", round(float(fg.mean()), 3))
