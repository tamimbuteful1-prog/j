"""منهجي | الحلقة الثانية: المنطق — motion graphics reel renderer.

Renders the full episode as a vertical 1080x1920 reel: the filmed hook
followed by animated scenes for the story, the director, the lesson and the
outro, with generated sound effects and a soft music bed.

Usage: python3 render.py <hook_clip.mp4> <out.mp4>
"""
import math
import os
import subprocess
import sys
import wave
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
W, H, FPS = 1080, 1920, 30
SR = 48000

FONTS = {
    "500": os.path.join(ASSETS, "Cairo500.ttf"),
    "700": os.path.join(ASSETS, "Cairo700.ttf"),
    "900": os.path.join(ASSETS, "CairoBlack.ttf"),
    "sym": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
}

# Palette
NAVY = (9, 22, 38)
TEAL = (18, 92, 112)
WHITE = (255, 255, 255)
YELLOW = (255, 204, 0)
GREEN = (34, 197, 94)
RED = (239, 68, 68)
MUTED = (160, 190, 205)
CARD = (255, 255, 255, 22)
CARD_LINE = (120, 200, 220, 90)


# ----------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, start, dur):
    return clamp((t - start) / dur)


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    return 3 * x * x - 2 * x * x * x


def back_out(x):
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def pop(t, start, dur=0.35):
    """Scale for a pop-in: 0 -> overshoot -> 1."""
    p = prog(t, start, dur)
    return back_out(p) if p > 0 else 0.0


def fade(t, start, dur=0.3):
    return ease_out(prog(t, start, dur))


def window(t, start, end, fin=0.3, fout=0.3):
    """Alpha that fades in at start and out before end."""
    return min(fade(t, start, fin), 1 - ease_out(prog(t, end - fout, fout)))


# ----------------------------------------------------------------- sprites
@lru_cache(maxsize=None)
def font(weight, size):
    return ImageFont.truetype(FONTS[weight], size)


@lru_cache(maxsize=None)
def text(s, size, color=WHITE, weight="900", stroke=0, stroke_color=(0, 0, 0)):
    f = font(weight, size)
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    rtl = weight != "sym"
    kw = {"direction": "rtl"} if rtl else {}
    l, t_, r, b = d.textbbox((0, 0), s, font=f, stroke_width=stroke, **kw)
    pad = 8 + stroke
    w = int(d.textlength(s, font=f, **kw)) + 2 * pad + 2 * stroke
    h = int(size * 1.9) + 2 * pad
    im = Image.new("RGBA", (max(w, r - l + 2 * pad), h), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad - min(l, 0), pad + int(size * 0.05)), s, font=f,
                            fill=color, stroke_width=stroke, stroke_fill=stroke_color, **kw)
    bbox = im.getbbox()
    if not bbox:
        return im
    # keep a consistent line box vertically, trim horizontally
    return im.crop((max(bbox[0] - 4, 0), 0, min(bbox[2] + 4, im.width), h))


@lru_cache(maxsize=None)
def rich(parts, size, weight="900", stroke=0):
    """parts: tuple of (string, color) in reading (right-to-left) order."""
    imgs = [text(s, size, c, weight, stroke) for s, c in parts]
    gap = int(size * 0.28)
    w = sum(i.width for i in imgs) + gap * (len(imgs) - 1)
    h = max(i.height for i in imgs)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    x = w
    for im in imgs:
        x -= im.width
        out.alpha_composite(im, (x, 0))
        x -= gap
    return out


def ss(w, h):
    """Supersampled RGBA canvas for smooth shapes."""
    im = Image.new("RGBA", (w * 2, h * 2), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def down(im):
    return im.resize((im.width // 2, im.height // 2), Image.LANCZOS)


@lru_cache(maxsize=None)
def card(w, h, fill=CARD, line=CARD_LINE, radius=36, width=3):
    im, d = ss(w, h)
    d.rounded_rectangle((2, 2, 2 * w - 3, 2 * h - 3), radius=radius * 2, fill=fill,
                        outline=line, width=width * 2)
    return down(im)


@lru_cache(maxsize=None)
def bubble(w, h, tail="up", fill=(255, 255, 255, 245)):
    th = 40
    im, d = ss(w, h + th)
    y0 = th * 2 if tail == "up" else 0
    d.rounded_rectangle((0, y0, 2 * w - 1, y0 + 2 * h - 1), radius=80, fill=fill)
    cx = w
    if tail == "up":
        d.polygon([(cx - 50, y0 + 4), (cx + 50, y0 + 4), (cx, 0)], fill=fill)
    else:
        yb = 2 * h
        d.polygon([(cx - 50, yb - 4), (cx + 50, yb - 4), (cx, yb + 2 * th)], fill=fill)
    return down(im)


@lru_cache(maxsize=None)
def badge(ok, size, ring=True):
    im, d = ss(size, size)
    s = 2 * size
    col = GREEN if ok else RED
    d.ellipse((0, 0, s - 1, s - 1), fill=col + (255,))
    if ring:
        d.ellipse((6, 6, s - 7, s - 7), outline=(255, 255, 255, 70), width=int(s * 0.03))
    lw = max(int(s * 0.11), 3)
    if ok:
        pts = [(s * 0.27, s * 0.53), (s * 0.43, s * 0.68), (s * 0.73, s * 0.34)]
        d.line(pts, fill=WHITE, width=lw, joint="curve")
        for p in (pts[0], pts[-1]):
            d.ellipse((p[0] - lw / 2, p[1] - lw / 2, p[0] + lw / 2, p[1] + lw / 2), fill=WHITE)
    else:
        a, b = s * 0.32, s * 0.68
        for p, q in (((a, a), (b, b)), ((a, b), (b, a))):
            d.line([p, q], fill=WHITE, width=lw)
            for e in (p, q):
                d.ellipse((e[0] - lw / 2, e[1] - lw / 2, e[0] + lw / 2, e[1] + lw / 2), fill=WHITE)
    return down(im)


@lru_cache(maxsize=None)
def pill(label, ok, size=56):
    t = text(label, size, WHITE, "900")
    b = badge(ok, int(size * 1.15), ring=False)
    w = t.width + b.width + 70
    h = int(size * 1.75)
    im, d = ss(w, h)
    col = GREEN if ok else RED
    d.rounded_rectangle((0, 0, 2 * w - 1, 2 * h - 1), radius=h, fill=col + (60,), outline=col + (255,), width=6)
    im = down(im)
    im.alpha_composite(b, (w - b.width - 22, (h - b.height) // 2))
    im.alpha_composite(t, (24, (h - t.height) // 2))
    return im


@lru_cache(maxsize=None)
def bread(size):
    """Round flatbread (عيش)."""
    im, d = ss(size, size)
    s = 2 * size
    d.ellipse((s * 0.06, s * 0.14, s * 0.94, s * 0.92), fill=(120, 72, 28, 120))  # shadow
    d.ellipse((s * 0.04, s * 0.06, s * 0.96, s * 0.86), fill=(196, 134, 62))
    d.ellipse((s * 0.09, s * 0.10, s * 0.91, s * 0.81), fill=(232, 182, 108))
    d.ellipse((s * 0.2, s * 0.18, s * 0.8, s * 0.7), fill=(240, 200, 135))
    rng = np.random.default_rng(3)
    for _ in range(16):
        x, y = rng.uniform(0.2, 0.8) * s, rng.uniform(0.18, 0.7) * s
        r = rng.uniform(0.015, 0.04) * s
        d.ellipse((x - r * 1.4, y - r, x + r * 1.4, y + r), fill=(176, 108, 44, 200))
    return down(im)


@lru_cache(maxsize=None)
def samoli(size):
    """Long golden roll (صامولي)."""
    w, h = size, int(size * 0.62)
    im, d = ss(w, h)
    W2, H2 = 2 * w, 2 * h
    d.rounded_rectangle((W2 * 0.04, H2 * 0.3, W2 * 0.98, H2 * 0.98), radius=H2 * 0.34, fill=(120, 72, 28, 110))
    d.rounded_rectangle((W2 * 0.02, H2 * 0.12, W2 * 0.96, H2 * 0.88), radius=H2 * 0.38, fill=(198, 128, 48))
    d.rounded_rectangle((W2 * 0.05, H2 * 0.14, W2 * 0.93, H2 * 0.7), radius=H2 * 0.3, fill=(236, 172, 82))
    d.rounded_rectangle((W2 * 0.12, H2 * 0.2, W2 * 0.86, H2 * 0.36), radius=H2 * 0.1, fill=(250, 214, 140, 160))
    for i in range(4):
        x = W2 * (0.22 + i * 0.18)
        d.line([(x - W2 * 0.05, H2 * 0.62), (x + W2 * 0.05, H2 * 0.24)], fill=(170, 100, 34), width=int(H2 * 0.06))
    return down(im)


@lru_cache(maxsize=None)
def father(size):
    """Simple avatar of the father in ghutra and agal."""
    im, d = ss(size, size)
    s = 2 * size
    d.ellipse((0, 0, s - 1, s - 1), fill=(24, 110, 136))
    d.ellipse((6, 6, s - 7, s - 7), outline=(255, 255, 255, 90), width=8)
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, s - 1, s - 1), fill=255)
    fig = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    f = ImageDraw.Draw(fig)
    f.ellipse((s * 0.14, s * 0.72, s * 0.86, s * 1.3), fill=(245, 245, 245))          # thobe
    f.polygon([(s * 0.26, s * 0.3), (s * 0.74, s * 0.3), (s * 0.86, s * 0.85), (s * 0.14, s * 0.85)],
              fill=(250, 250, 250))                                                     # ghutra drape
    f.ellipse((s * 0.34, s * 0.3, s * 0.66, s * 0.68), fill=(198, 142, 94))             # face
    f.rounded_rectangle((s * 0.4, s * 0.52, s * 0.6, s * 0.57), radius=s * 0.02, fill=(40, 28, 22))  # moustache
    f.ellipse((s * 0.41, s * 0.41, s * 0.45, s * 0.45), fill=(40, 28, 22))
    f.ellipse((s * 0.55, s * 0.41, s * 0.59, s * 0.45), fill=(40, 28, 22))
    f.pieslice((s * 0.24, s * 0.14, s * 0.76, s * 0.62), 180, 360, fill=(255, 255, 255))  # ghutra top
    f.rectangle((s * 0.24, s * 0.37, s * 0.34, s * 0.62), fill=(255, 255, 255))
    f.rectangle((s * 0.66, s * 0.37, s * 0.76, s * 0.62), fill=(255, 255, 255))
    f.ellipse((s * 0.27, s * 0.2, s * 0.73, s * 0.34), outline=(20, 20, 20), width=int(s * 0.035))  # agal
    im.paste(fig, (0, 0), Image.composite(fig.getchannel("A"), Image.new("L", (s, s), 0), mask))
    return down(im)


@lru_cache(maxsize=None)
def tamim(size):
    face = Image.open(os.path.join(ASSETS, "tamim_face.png")).convert("RGBA").resize((size * 2, size * 2), Image.LANCZOS)
    im, d = ss(size, size)
    mask = Image.new("L", (size * 2, size * 2), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255)
    im.paste(face, (0, 0), mask)
    d.ellipse((2, 2, size * 2 - 3, size * 2 - 3), outline=YELLOW, width=12)
    return down(im)


@lru_cache(maxsize=None)
def shop(size):
    w, h = size, int(size * 0.9)
    im, d = ss(w, h)
    W2, H2 = 2 * w, 2 * h
    d.rounded_rectangle((W2 * 0.08, H2 * 0.3, W2 * 0.92, H2 * 0.98), radius=20, fill=(236, 240, 244))
    stripes = 6
    for i in range(stripes):
        x0 = W2 * 0.04 + i * (W2 * 0.92 / stripes)
        x1 = x0 + W2 * 0.92 / stripes
        col = (230, 72, 72) if i % 2 == 0 else (255, 255, 255)
        d.rectangle((x0, H2 * 0.14, x1, H2 * 0.34), fill=col)
        d.pieslice((x0, H2 * 0.24, x1, H2 * 0.44), 0, 180, fill=col)
    d.rounded_rectangle((W2 * 0.02, H2 * 0.04, W2 * 0.98, H2 * 0.16), radius=16, fill=(24, 110, 136))
    d.rounded_rectangle((W2 * 0.58, H2 * 0.52, W2 * 0.84, H2 * 0.98), radius=10, fill=(24, 110, 136))
    d.rounded_rectangle((W2 * 0.16, H2 * 0.52, W2 * 0.5, H2 * 0.76), radius=10, fill=(140, 200, 220))
    im = down(im)
    t = text("بقالة", int(size * 0.1), WHITE, "900")
    im.alpha_composite(t, ((w - t.width) // 2, int(h * 0.1 - t.height / 2)))
    return im


@lru_cache(maxsize=None)
def clapper(size):
    w, h = size, int(size * 0.85)
    im, d = ss(w, h)
    W2, H2 = 2 * w, 2 * h
    d.rounded_rectangle((W2 * 0.06, H2 * 0.32, W2 * 0.94, H2 * 0.96), radius=24, fill=(30, 34, 40))
    d.line([(W2 * 0.14, H2 * 0.55), (W2 * 0.86, H2 * 0.55)], fill=(255, 255, 255, 90), width=6)
    d.line([(W2 * 0.14, H2 * 0.75), (W2 * 0.86, H2 * 0.75)], fill=(255, 255, 255, 90), width=6)
    bar = Image.new("RGBA", (int(W2 * 0.9), int(H2 * 0.16)), (0, 0, 0, 0))
    b = ImageDraw.Draw(bar)
    b.rounded_rectangle((0, 0, bar.width - 1, bar.height - 1), radius=12, fill=(30, 34, 40))
    for i in range(7):
        x = i * bar.width / 6
        b.polygon([(x, 0), (x + bar.width / 12, 0), (x + bar.width / 24, bar.height), (x - bar.width / 24, bar.height)],
                  fill=(255, 255, 255))
    bar = bar.rotate(10, resample=Image.BICUBIC, expand=True)
    im.alpha_composite(bar, (int(W2 * 0.04), int(H2 * 0.05)))
    return down(im)


@lru_cache(maxsize=None)
def op_circle(s, size, color=YELLOW):
    im, d = ss(size, size)
    d.ellipse((0, 0, 2 * size - 1, 2 * size - 1), fill=color)
    d.ellipse((10, 10, 2 * size - 11, 2 * size - 11), outline=(255, 255, 255, 120), width=8)
    im = down(im)
    t = text(s, int(size * 0.55), NAVY, "900")
    im.alpha_composite(t, ((size - t.width) // 2, (size - t.height) // 2 + int(size * 0.02)))
    return im


@lru_cache(maxsize=None)
def stamp(s, size):
    t = text(s, size, RED, "900")
    w, h = t.width + 80, t.height + 10
    im, d = ss(w, h)
    d.rounded_rectangle((4, 4, 2 * w - 5, 2 * h - 5), radius=30, outline=RED, width=14, fill=(239, 68, 68, 40))
    im = down(im)
    im.alpha_composite(t, (40, 5))
    return im.rotate(-7, resample=Image.BICUBIC, expand=True)


@lru_cache(maxsize=None)
def glow(w, h, color, radius=40):
    im = Image.new("RGBA", (w + radius * 4, h + radius * 4), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((radius * 2, radius * 2, radius * 2 + w, radius * 2 + h),
                                         radius=h // 2, fill=color + (150,))
    return im.filter(ImageFilter.GaussianBlur(radius))


# ----------------------------------------------------------------- compositing
def place(cv, im, cx, cy, scale=1.0, alpha=1.0, rot=0.0):
    if alpha <= 0.01 or scale <= 0.01:
        return
    if abs(scale - 1) > 0.005:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BILINEAR)
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 0.999:
        a = im.getchannel("A").point(lambda v: int(v * alpha))
        im = im.copy()
        im.putalpha(a)
    cv.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def make_background():
    y = np.linspace(0, 1, H + 120)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    top, bot = np.array(NAVY, float), np.array((10, 48, 66), float)
    g = top + (bot - top) * y[..., None]
    r = np.sqrt((x - 0.5) ** 2 * 1.4 + (y - 0.45) ** 2)
    g = g + (np.array(TEAL, float) * 0.55) * np.clip(1 - r * 1.8, 0, 1)[..., None] ** 2
    img = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    d = ImageDraw.Draw(img)
    for gx in range(0, W, 60):
        d.line([(gx, 0), (gx, H + 120)], fill=(255, 255, 255, 10))
    for gy in range(0, H + 120, 60):
        d.line([(0, gy), (W, gy)], fill=(255, 255, 255, 10))
    over = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(over).rectangle((0, 0, W, H + 120), outline=(0, 0, 0, 0))
    vign = Image.fromarray((np.clip(r * 1.25 - 0.35, 0, 1) * 150).astype(np.uint8), "L")
    dark = Image.new("RGBA", img.size, (0, 0, 0, 255))
    dark.putalpha(vign)
    img.alpha_composite(dark)
    return img


BG = None
SYMBOLS = ["∧", "∨", "¬", "→", "↔", "T", "F", "∧", "∨", "p", "q"]
FLOATERS = [(np.random.default_rng(i).uniform(60, W - 60), np.random.default_rng(i + 50).uniform(200, H - 200),
             SYMBOLS[i % len(SYMBOLS)], 60 + (i * 37) % 70, i * 0.7) for i in range(14)]


def background(t):
    global BG
    if BG is None:
        BG = make_background()
    off = int((t * 14) % 60)
    cv = BG.crop((0, off, W, off + H)).copy()
    for x, y, s, size, ph in FLOATERS:
        im = text(s, size, (150, 220, 235, 255), "sym")
        place(cv, im, x + 20 * math.sin(t * 0.3 + ph), y - (t * 12 + ph * 40) % 260 + 130, alpha=0.07)
    return cv


# ----------------------------------------------------------------- scenes
SFX = []  # (time, kind) in MG-local seconds, filled while defining scenes


def sfx(t, kind):
    SFX.append((t, kind))


def chip(cv, label, t, start, A, y=300, icon=None):
    s = pop(t, start, 0.4)
    t_ = text(label, 54, NAVY, "900")
    w, h = t_.width + 80, 96
    c = card(w, h, fill=YELLOW + (255,), line=(255, 255, 255, 0), radius=48)
    c = c.copy()
    c.alpha_composite(t_, (40, (h - t_.height) // 2))
    place(cv, c, W / 2, y, s, A)


def header(cv, t, A):
    t_ = rich((("منهجي", YELLOW), ("|", MUTED), ("الحلقة الثانية: المنطق", WHITE)), 38, "700")
    place(cv, t_, W / 2, 170, 1, A * 0.9)


# Scene boundaries (MG-local seconds)
S1, S2, S3, S4, S5, S6, S7, END = 0, 10.5, 19.0, 22.0, 31.5, 44.0, 56.5, 62.0


def scene_story(cv, t, A):
    chip(cv, "القصة", t, 0.0, A)
    # part A: the request
    a = A * (1 - ease_out(prog(t, 4.0, 0.35)))
    if a > 0:
        place(cv, father(250), W / 2, 560, pop(t, 0.3), a)
        place(cv, text("أبوي", 46, MUTED, "700"), W / 2, 720, 1, a * fade(t, 0.5))
        bs = pop(t, 0.9, 0.4)
        b = bubble(820, 170).copy()
        msg = rich((("جيب عيش", NAVY), ("و", (214, 140, 0)), ("صامولي", NAVY)), 80)
        b.alpha_composite(msg, ((b.width - msg.width) // 2, 40 + (170 - msg.height) // 2))
        place(cv, b, W / 2, 880, bs, a)
        for i, (im, lab, x, st) in enumerate(((bread(250), "عيش", 760, 2.0), (samoli(300), "صامولي", 320, 2.4))):
            y = 1180 + 10 * math.sin((t - st) * 3)
            place(cv, im, x, y, pop(t, st), a)
            place(cv, text(lab, 56, WHITE, "900"), x, 1350, pop(t, st + 0.1), a)
    # part B: at the store
    if t >= 4.0:
        b = A * fade(t, 4.2)
        place(cv, shop(300), W / 2, 560 + 40 * (1 - ease_out(prog(t, 4.2, 0.5))), 1, b)
        place(cv, text("رحت البقالة…", 70, WHITE, "900"), W / 2, 780, 1, A * fade(t, 4.6))
        # two cards: bread (right) / samoli (left)
        for x, st, ok, im, lab in ((770, 5.4, True, bread(200), "جبت العيش"),
                                   (310, 6.6, False, samoli(240), "نسيت الصامولي!")):
            s = pop(t, st - 0.4)
            c = card(420, 380).copy()
            place(cv, c, x, 1080, s, A)
            ia = A if ok or t < st else A * 0.35
            place(cv, im, x, 1040 + (0 if ok or t < st else 6 * math.sin(t * 40) * (1 - prog(t, st, 0.4))), s, ia)
            place(cv, badge(ok, 110), x + 150, 930, pop(t, st), A)
            place(cv, text(lab, 46, GREEN if ok else RED, "900"), x, 1205, 1, A * fade(t, st))
        st = 8.0
        ss_ = 1 + 1.4 * (1 - ease_out(prog(t, st, 0.25)))
        place(cv, stamp("ما نفذت الطلب كامل!", 72), W / 2, 1420, ss_ if t >= st else 0, A * fade(t, st, 0.12))


sfx(0.0, "pop"); sfx(0.3, "pop"); sfx(0.9, "pop"); sfx(2.0, "pop"); sfx(2.4, "pop")
sfx(4.1, "whoosh"); sfx(5.0, "pop"); sfx(5.4, "ding"); sfx(6.6, "buzz"); sfx(8.05, "thud")


def scene_director(cv, t, A):
    chip(cv, "المخرج", t, 0.0, A)
    place(cv, clapper(190), W / 2, 480, pop(t, 0.2), A, rot=8 * math.sin(min(t, 1.2) * 12) * (1 - prog(t, 0.2, 1.0)))
    place(cv, text("طيب لو أبوك قال:", 60, MUTED, "700"), W / 2, 660, 1, A * fade(t, 0.7))
    b = bubble(860, 170).copy()
    msg = rich((("جيب عيش", NAVY), ("أو", (214, 140, 0)), ("صامولي؟", NAVY)), 80)
    b.alpha_composite(msg, ((b.width - msg.width) // 2, 40 + (170 - msg.height) // 2))
    place(cv, b, W / 2, 800, pop(t, 1.2, 0.4), A)
    place(cv, tamim(190), W / 2, 1030, pop(t, 3.2), A)
    b2 = bubble(900, 150, tail="up", fill=(255, 204, 0, 255)).copy()
    m2 = rich((("هنا يكفي أجيب", NAVY), ("واحد", (180, 30, 30)), ("منهم!", NAVY)), 66)
    b2.alpha_composite(m2, ((b2.width - m2.width) // 2, 40 + (150 - m2.height) // 2))
    place(cv, b2, W / 2, 1225, pop(t, 3.6, 0.4), A)
    for x, st, im in ((680, 5.2, bread(150)), (400, 5.5, samoli(180))):
        place(cv, im, x, 1420, pop(t, st), A if x == 680 else A * 0.45)
    place(cv, text("أو", 54, YELLOW, "900"), 540, 1420, pop(t, 5.35), A)
    place(cv, badge(True, 80), 760, 1360, pop(t, 6.1), A)
    place(cv, pill("الطلب منفّذ", True, 46), W / 2, 1555, pop(t, 6.4), A)


sfx(S2 + 0.0, "whoosh"); sfx(S2 + 0.2, "pop"); sfx(S2 + 1.2, "pop"); sfx(S2 + 3.2, "pop")
sfx(S2 + 3.6, "pop"); sfx(S2 + 5.2, "pop"); sfx(S2 + 5.5, "pop"); sfx(S2 + 6.1, "ding")


def scene_title(cv, t, A):
    place(cv, text("وهنا يجي", 84, MUTED, "700"), W / 2, 790, 1, A * fade(t, 0.1))
    s = pop(t, 0.4, 0.45)
    t_ = rich((("درس", WHITE), ("المنطق!", YELLOW)), 150)
    place(cv, glow(t_.width - 60, 60, (255, 204, 0)), W / 2, 990, s, A * 0.35)
    place(cv, t_, W / 2, 960, s, A)
    for i, (op, col) in enumerate((("و", YELLOW), ("أو", (120, 200, 220)))):
        place(cv, op_circle(op, 160, col), W / 2 + (0.5 - i) * 240, 1230, pop(t, 1.0 + i * 0.2), A)


sfx(S3 + 0.0, "whoosh"); sfx(S3 + 0.4, "ding"); sfx(S3 + 1.0, "pop"); sfx(S3 + 1.2, "pop")


def scene_statements(cv, t, A):
    chip(cv, "العبارات", t, 0.0, A)
    place(cv, text("عندنا عبارتان:", 80, WHITE, "900"), W / 2, 470, 1, A * fade(t, 0.3))
    for i, (lab, im, ok, st) in enumerate((("جبت العيش", bread(120), True, 0.9),
                                            ("جبت الصامولي", samoli(140), False, 2.6))):
        y = 680 + i * 250
        dx = 300 * (1 - ease_out(prog(t, st, 0.45)))
        a = A * fade(t, st, 0.35)
        place(cv, card(920, 200), W / 2 + dx, y, 1, a)
        place(cv, im, 900 + dx, y, 1, a)
        lt = text(lab, 66, WHITE, "900")
        place(cv, lt, 810 - lt.width / 2 + dx, y, 1, a)
        place(cv, pill("صحيحة" if ok else "خاطئة", ok, 50), 225, y, pop(t, st + 1.0), A)
    # the judgement is called the truth value
    p = fade(t, 4.8)
    if p > 0:
        d = ImageDraw.Draw(cv)
        col = (255, 204, 0, int(255 * p * A))
        d.line([(110, 600), (70, 600), (70, 1010), (110, 1010)], fill=col, width=6)
        d.line([(70, 805), (40, 805)], fill=col, width=6)
    place(cv, text("الحكم بصح أو خطأ نسميه", 62, MUTED, "700"), W / 2, 1180, 1, A * fade(t, 5.2))
    s = pop(t, 5.9, 0.45)
    q = text("قيمة الصواب", 130, YELLOW, "900")
    place(cv, glow(q.width - 40, 70, (255, 204, 0)), W / 2, 1360, s, A * 0.3)
    place(cv, q, W / 2, 1335, s, A)


sfx(S4 + 0.0, "whoosh"); sfx(S4 + 0.9, "whoosh"); sfx(S4 + 1.9, "ding"); sfx(S4 + 2.6, "whoosh")
sfx(S4 + 3.6, "buzz"); sfx(S4 + 5.9, "ding")


def truth_table(cv, t, A, start, op, results, highlight=1, y0=1050):
    """RTL truth table: [العيش] [الصامولي] [result]."""
    rows = [(True, True), (True, False), (False, True), (False, False)]
    xs = (850, 600, 290)  # column centers right -> left
    rh = 112
    a = A * fade(t, start)
    place(cv, card(920, rh * 5 + 30, fill=(255, 255, 255, 14)), W / 2, y0 + rh * 2.5, 1, a)
    heads = (text("العيش", 48, WHITE, "900"), text("الصامولي", 48, WHITE, "900"),
             rich((("العيش", WHITE), (op, YELLOW), ("الصامولي", WHITE)), 32, "900"))
    for x, hd in zip(xs, heads):
        place(cv, hd, x, y0 + rh * 0.5, 1, a)
    if a > 0:
        d = ImageDraw.Draw(cv)
        d.line([(110, y0 + rh), (970, y0 + rh)], fill=(255, 255, 255, int(70 * a)), width=3)
        d.line([(440, y0 + 10), (440, y0 + rh * 5)], fill=(255, 255, 255, int(70 * a)), width=3)
    for i, (p, q) in enumerate(rows):
        y = y0 + rh * (i + 1.5)
        st = start + 0.5 + i * 0.45
        if i == highlight:
            hp = prog(t, start + 4.6, 0.3)
            if hp > 0:
                pulse = 0.75 + 0.25 * math.sin((t - start) * 7)
                place(cv, card(900, rh - 8, fill=(255, 204, 0, int(40 * hp)), line=(255, 204, 0, int(255 * hp * pulse)),
                               radius=28, width=5), W / 2, y, 1, A)
                tag = card(150, 64, fill=YELLOW + (255,), line=(0, 0, 0, 0), radius=32).copy()
                tt = text("حالتي", 38, NAVY, "900")
                tag.alpha_composite(tt, ((150 - tt.width) // 2, (64 - tt.height) // 2))
                place(cv, tag, 985, y - 50, pop(t, start + 4.7), A, rot=-8)
        place(cv, badge(p, 76), xs[0], y, pop(t, st), A)
        place(cv, badge(q, 76), xs[1], y, pop(t, st + 0.1), A)
        place(cv, badge(results[i], 84), xs[2], y, pop(t, start + 2.6 + i * 0.4), A)


def scene_connective(cv, t, A, op, name, rule_lines, results, sfx_base=None):
    place(cv, op_circle(op, 170), W / 2, 420, pop(t, 0.1, 0.45), A)
    place(cv, text(name, 96, WHITE, "900"), W / 2, 590, 1, A * fade(t, 0.5))
    sent = card(860, 120).copy()
    m = rich((("جبت العيش", WHITE), (op, YELLOW), ("الصامولي", WHITE)), 60)
    sent.alpha_composite(m, ((860 - m.width) // 2, (120 - m.height) // 2))
    place(cv, sent, W / 2, 730, pop(t, 1.0, 0.35), A)
    for i, ln in enumerate(rule_lines):
        place(cv, rich(ln, 50, "700"), W / 2, 850 + i * 72, 1, A * fade(t, 2.0 + i * 0.6))
    truth_table(cv, t, A, 3.3, op, results, y0=1000 + 36 * (len(rule_lines) - 1))


def scene_and(cv, t, A):
    chip(cv, "الدرس", t, 0.0, A, y=270)
    scene_connective(cv, t, A, "و", "عبارة وصل",
                     [(("لازم العبارتان تكونان", WHITE), ("صحيحتين", GREEN))],
                     (True, False, False, False))


def scene_or(cv, t, A):
    chip(cv, "الدرس", t, 0.0, A, y=270)
    scene_connective(cv, t, A, "أو", "عبارة فصل",
                     [(("يكفي", WHITE), ("واحدة على الأقل", YELLOW), ("تكون صحيحة", GREEN)),
                      (("أو حتى", WHITE), ("الاثنتان معًا", YELLOW))],
                     (True, True, True, False))


for base in (S5, S6):
    sfx(base + 0.0, "whoosh"); sfx(base + 0.1, "pop"); sfx(base + 1.0, "pop")
    for i in range(4):
        sfx(base + 3.8 + i * 0.45, "tick")
    for i in range(4):
        sfx(base + 5.9 + i * 0.4, "ding" if (base == S6 and i < 3) or (base == S5 and i == 0) else "buzz")
    sfx(base + 7.9, "pop")


def scene_outro(cv, t, A):
    place(cv, text("وهذا درس", 80, MUTED, "700"), W / 2, 620, 1, A * fade(t, 0.1))
    s = pop(t, 0.4, 0.45)
    place(cv, text("المنطق", 170, YELLOW, "900"), W / 2, 790, s, A)
    place(cv, text("من مادة الرياضيات", 70, WHITE, "900"), W / 2, 990, 1, A * fade(t, 1.1))
    place(cv, text("للصف الأول الثانوي", 70, WHITE, "900"), W / 2, 1090, 1, A * fade(t, 1.5))
    logo = card(420, 150, fill=YELLOW + (255,), line=(0, 0, 0, 0), radius=75).copy()
    lt = text("منهجي", 92, NAVY, "900")
    logo.alpha_composite(lt, ((420 - lt.width) // 2, (150 - lt.height) // 2))
    place(cv, logo, W / 2, 1320, pop(t, 2.2, 0.45), A)
    place(cv, text("الحلقة الثانية", 46, MUTED, "700"), W / 2, 1450, 1, A * fade(t, 2.6))


sfx(S7 + 0.0, "whoosh"); sfx(S7 + 0.4, "ding"); sfx(S7 + 2.2, "pop")

SCENES = [(S1, S2, scene_story), (S2, S3, scene_director), (S3, S4, scene_title), (S4, S5, scene_statements),
          (S5, S6, scene_and), (S6, S7, scene_or), (S7, END, scene_outro)]


def frame(t):
    cv = background(t)
    header(cv, t, fade(t, 0.0, 0.4))
    for a, b, fn in SCENES:
        if a - 0.01 <= t < b:
            lt = t - a
            A = 1 - ease_out(prog(t, b - 0.35, 0.35)) if fn is not scene_outro else 1.0
            fn(cv, lt, A)
    if t > END - 0.6:  # fade to black at the very end
        k = prog(t, END - 0.6, 0.6)
        cv.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * k))))
    return cv.convert("RGB")


# ----------------------------------------------------------------- audio
def env(n, a=0.005, r=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def synth(kind):
    rng = np.random.default_rng(len(kind))
    if kind == "pop":
        n = int(0.12 * SR); t = np.arange(n) / SR
        f = 900 * np.exp(-t * 18) + 300
        return 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.04)
    if kind == "tick":
        n = int(0.06 * SR); t = np.arange(n) / SR
        return 0.25 * np.sin(2 * np.pi * 1800 * t) * env(n, 0.001, 0.015)
    if kind == "ding":
        n = int(0.7 * SR); t = np.arange(n) / SR
        s = np.sin(2 * np.pi * 1318.5 * t) + 0.5 * np.sin(2 * np.pi * 1975.5 * t) + 0.25 * np.sin(2 * np.pi * 2637 * t)
        return 0.22 * s * env(n, 0.003, 0.25)
    if kind == "buzz":
        n = int(0.32 * SR); t = np.arange(n) / SR
        s = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.6 + np.sign(np.sin(2 * np.pi * 156 * t)) * 0.4
        lp = np.convolve(s, np.ones(12) / 12, mode="same")
        return 0.16 * lp * np.minimum(1, t / 0.01) * np.clip((0.32 - t) / 0.05, 0, 1)
    if kind == "whoosh":
        n = int(0.45 * SR); t = np.arange(n) / SR
        noise = rng.standard_normal(n)
        out = np.zeros(n); y = 0.0
        cut = 0.02 + 0.25 * np.sin(np.pi * t / t[-1]) ** 2
        for i in range(n):
            y += cut[i] * (noise[i] - y); out[i] = y
        return 0.5 * out * np.sin(np.pi * t / t[-1]) ** 2
    if kind == "thud":
        n = int(0.4 * SR); t = np.arange(n) / SR
        f = 120 * np.exp(-t * 10) + 45
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.12)
        hit = rng.standard_normal(n) * env(n, 0.001, 0.015)
        return 0.6 * body + 0.15 * hit
    raise ValueError(kind)


def music(dur):
    """Soft, light pad + pluck loop at 100 bpm."""
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    beat = 60 / 100
    chords = [(261.6, 329.6, 392.0), (220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7)]
    bar = beat * 4
    for k in range(int(dur / bar) + 1):
        ch = chords[k % 4]
        s0 = int(k * bar * SR); s1 = min(n, int((k + 1) * bar * SR))
        if s0 >= n:
            break
        tt = np.arange(s1 - s0) / SR
        pad = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt) for f in ch)
        e = np.minimum(1, tt / 0.4) * np.minimum(1, (bar - tt) / 0.4)
        out[s0:s1] += 0.03 * pad * e
        for b in range(8):  # eighth-note plucks
            p0 = s0 + int(b * beat / 2 * SR)
            if p0 >= n:
                break
            m = min(int(0.3 * SR), n - p0)
            tp = np.arange(m) / SR
            f = ch[(b * 2) % 3] * 2
            out[p0:p0 + m] += 0.045 * np.sin(2 * np.pi * f * tp) * np.exp(-tp / 0.08)
        for b in range(4):  # soft kick
            p0 = s0 + int(b * beat * SR)
            if p0 >= n:
                break
            m = min(int(0.2 * SR), n - p0)
            tp = np.arange(m) / SR
            out[p0:p0 + m] += 0.12 * np.sin(2 * np.pi * np.cumsum(90 * np.exp(-tp * 25) + 50) / SR) * np.exp(-tp / 0.08)
    return out


def build_audio(hook_wav, mg_offset, total, path):
    n = int(total * SR)
    mix = np.zeros(n)
    m = music(total - mg_offset)
    fi = int(0.6 * SR)
    m[:fi] *= np.linspace(0, 1, fi)
    fo = int(1.5 * SR)
    m[-fo:] *= np.linspace(1, 0, fo)
    s0 = int(mg_offset * SR)
    mix[s0:s0 + len(m)] += m[:n - s0]
    cache = {}
    for t, kind in SFX:
        snd = cache.setdefault(kind, synth(kind))
        i = int((mg_offset + t) * SR)
        j = min(n, i + len(snd))
        mix[i:j] += snd[:j - i]
    with wave.open(hook_wav) as w:
        raw = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    mix[:len(raw)] += raw[:n]
    mix /= max(1.0, np.abs(mix).max() / 0.95)
    st = np.stack([mix, mix], 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())


# ----------------------------------------------------------------- main
def main():
    hook, out = sys.argv[1], sys.argv[2]
    work = os.path.join(os.path.dirname(os.path.abspath(out)), ".work")
    os.makedirs(work, exist_ok=True)
    hook_dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                              "-of", "csv=p=0", hook]))
    xf = 0.3
    mg_offset = hook_dur - xf
    total = mg_offset + END

    mg = os.path.join(work, "mg.mp4")
    if "--preview" in sys.argv:
        for ts in sys.argv[sys.argv.index("--preview") + 1:]:
            frame(float(ts)).save(os.path.join(work, f"preview_{ts}.png"))
        return
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "medium",
                            "-pix_fmt", "yuv420p", mg], stdin=subprocess.PIPE)
    nframes = int(END * FPS)
    for i in range(nframes):
        enc.stdin.write(frame(i / FPS).tobytes())
        if i % 150 == 0:
            print(f"frame {i}/{nframes}", flush=True)
    enc.stdin.close()
    enc.wait()

    hook_wav = os.path.join(work, "hook.wav")
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", hook, "-ac", "1", "-ar", str(SR), hook_wav])
    audio = os.path.join(work, "audio.wav")
    build_audio(hook_wav, mg_offset, total, audio)

    subprocess.check_call([
        "ffmpeg", "-v", "error", "-y", "-i", hook, "-i", mg, "-i", audio, "-filter_complex",
        f"[0:v]fps={FPS},settb=1/{FPS},scale={W}:{H},setsar=1,format=yuv420p[a];[1:v]fps={FPS},settb=1/{FPS},setsar=1,format=yuv420p[b];"
        f"[a][b]xfade=transition=slideup:duration={xf}:offset={mg_offset:.3f}[v]",
        "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out])
    print("done", out)


if __name__ == "__main__":
    main()
