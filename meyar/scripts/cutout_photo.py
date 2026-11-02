"""Remove a solid black background from a portrait and save it for the site.

Usage (run from the meyar/ folder):
    pip install pillow
    python3 -I scripts/cutout_photo.py path/to/photo.jpg

Writes public/media/tamim.webp (transparent background, max 1000px tall).

Only the dark area CONNECTED TO THE IMAGE EDGES is removed (flood fill), so dark
hair or clothing inside the silhouette is kept. Check the result visually; for a
photo with soft hair edges a dedicated matting tool gives a cleaner edge.
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

THRESHOLD = 38  # max channel value treated as "background black"
OUT = Path(__file__).resolve().parent.parent / 'public' / 'media' / 'tamim.webp'


def main(src: str) -> None:
    im = Image.open(src).convert('RGB')
    if im.height > 1000:
        im = im.resize((round(im.width * 1000 / im.height), 1000), Image.LANCZOS)
    w, h = im.size
    px = im.load()
    bg = bytearray(w * h)  # 1 = background
    q = deque()
    for x in range(w):
        q.extend(((x, 0), (x, h - 1)))
    for y in range(h):
        q.extend(((0, y), (w - 1, y)))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if bg[i] or max(px[x, y]) > THRESHOLD:
            continue
        bg[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    alpha = Image.frombytes('L', (w, h), bytes(0 if b else 255 for b in bg))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))  # soften the edge
    out = im.convert('RGBA')
    out.putalpha(alpha)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, 'WEBP', quality=88)
    print(f'wrote {OUT} ({w}x{h})')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
