"""منهجي | الحلقة الثانية — flat 2D story scenes.

Draws the story (father in the living room, the grocery, walking home
whistling, the surprise) as flat 2D animation and writes frames plus
meta.json in the same format as the 3D renderer, so compose3d.py can add
the overlays, the sound and the lesson.

Usage: python3 render2d.py <out_dir> [--only t1,t2,...]
"""
import json
import math
import os
import sys
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motion"))
import render as R  # noqa: E402

W, H, FPS = R.W, R.H, R.FPS
SS = 2  # supersampling for smooth edges

SHOTS = [(0.0, 2.2, "intro"), (2.2, 7.0, "father"), (7.0, 10.8, "shop"), (10.8, 15.2, "walk"), (15.2, 18.6, "surprise")]
END = 18.6

SKIN = (201, 141, 95)
SKIN_D = (176, 112, 68)
HAIR = (29, 23, 20)
THOBE = (246, 244, 239)
THOBE_L = (214, 208, 198)
OUT = (60, 44, 36)
BEARD = (35, 26, 21)
RED = (200, 32, 44)
SANDAL = (110, 70, 40)

clamp, prog, ease_out, back_out = R.clamp, R.prog, R.ease_out, R.back_out


def ease_in_out(x):
    return x * x * (3 - 2 * x)


def lerp(a, b, k):
    return a + (b - a) * k


# ----------------------------------------------------------------- drawing helpers
class Pen:
    """Draws in 1x units onto a supersampled RGBA sprite; origin at (ox, oy)."""

    def __init__(self, w, h, ox, oy, scale=1.0):
        self.k = SS * scale
        self.im = Image.new("RGBA", (int(w * self.k), int(h * self.k)), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
        self.ox, self.oy = ox, oy

    def p(self, x, y):
        return ((x + self.ox) * self.k, (y + self.oy) * self.k)

    def box(self, x0, y0, x1, y1):
        a, b = self.p(x0, y0), self.p(x1, y1)
        return (min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1]))

    def ellipse(self, cx, cy, rx, ry, fill, outline=None, width=0):
        self.d.ellipse(self.box(cx - rx, cy - ry, cx + rx, cy + ry), fill=fill, outline=outline, width=int(width * self.k))

    def circle(self, cx, cy, r, fill, outline=None, width=0):
        self.ellipse(cx, cy, r, r, fill, outline, width)

    def rrect(self, x0, y0, x1, y1, r, fill, outline=None, width=0):
        self.d.rounded_rectangle(self.box(x0, y0, x1, y1), radius=r * self.k, fill=fill, outline=outline, width=int(width * self.k))

    def poly(self, pts, fill, outline=None, width=0):
        self.d.polygon([self.p(*q) for q in pts], fill=fill, outline=outline, width=int(width * self.k))

    def line(self, pts, fill, width, round_caps=True):
        P = [self.p(*q) for q in pts]
        w = width * self.k
        self.d.line(P, fill=fill, width=int(w), joint="curve")
        if round_caps:
            for x, y in (P[0], P[-1]):
                self.d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=fill)

    def arc(self, cx, cy, rx, ry, a0, a1, fill, width):
        self.d.arc(self.box(cx - rx, cy - ry, cx + rx, cy + ry), a0, a1, fill=fill, width=int(width * self.k))

    def done(self):
        return self.im.resize((self.im.width // SS, self.im.height // SS), Image.LANCZOS)


def limb(pen, sx, sy, a1, a2, l1, l2, color, outline, width, hand=SKIN, hand_r=34):
    """Two-segment arm; angles in radians measured from straight down, positive towards +x."""
    ex, ey = sx + l1 * math.sin(a1), sy + l1 * math.cos(a1)
    hx, hy = ex + l2 * math.sin(a1 + a2), ey + l2 * math.cos(a1 + a2)
    pen.line([(sx, sy), (ex, ey), (hx, hy)], outline, width + 8)
    pen.line([(sx, sy), (ex, ey), (hx, hy)], color, width)
    pen.circle(hx, hy, hand_r, hand, OUT, 4)
    return hx, hy


# ----------------------------------------------------------------- characters
def face(pen, cx, cy, r, talk=0.0, whistle=0.0, shock=0.0, smile=0.4, blink=0.0, look=(0, 0)):
    es = 1 + 0.45 * shock
    for sx in (-1, 1):
        ex, ey = cx + sx * r * 0.36, cy - r * 0.05
        ry = r * 0.17 * es * (1 - 0.92 * blink)
        pen.ellipse(ex, ey, r * 0.15 * es, ry, (255, 255, 255), OUT, 4)
        if blink < 0.5:
            pr = r * 0.085 * (1 - 0.25 * shock)
            px, py = ex + look[0] * r * 0.04, ey + look[1] * r * 0.04 + r * 0.02
            pen.circle(px, py, pr, (20, 18, 18))
            pen.circle(px + pr * 0.35, py - pr * 0.4, pr * 0.32, (255, 255, 255))
        by = ey - r * (0.27 + 0.12 * shock)
        tilt = (-0.04 - 0.08 * shock) * sx
        pen.line([(ex - r * 0.14, by + r * tilt * 1.2), (ex + r * 0.14, by - r * tilt * 1.2)], HAIR, r * 0.065)
    pen.ellipse(cx, cy + r * 0.2, r * 0.11, r * 0.085, SKIN_D)
    for sx in (-1, 1):
        pen.ellipse(cx + sx * r * 0.55, cy + r * 0.28, r * 0.13, r * 0.08, (230, 120, 110, 90))
    my = cy + r * 0.48
    open_ = max(talk, shock)
    if whistle > 0.5:
        pen.circle(cx + r * 0.04, my - r * 0.02, r * 0.075, (90, 30, 26), OUT, 4)
    elif open_ > 0.05:
        pen.ellipse(cx, my, r * (0.15 + 0.04 * shock), r * (0.05 + 0.16 * open_), (90, 30, 26), OUT, 4)
        pen.ellipse(cx, my + r * 0.06 * open_, r * 0.09, r * 0.05 * open_, (200, 80, 80))
    else:
        pen.arc(cx, my - r * 0.1, r * 0.2, r * (0.08 + 0.1 * smile), 20, 160, (90, 30, 26), r * 0.05)


def curls(pen, cx, cy, r, back=False):
    rnd = np.random.default_rng(3)
    pts = []
    for i in range(26):
        a = math.pi * (1.12 + 0.76 * i / 25) if not back else math.pi * (0.95 + 1.1 * i / 25)
        rr = r * (0.98 + 0.08 * rnd.random())
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a) * (1.02 if back else 0.95) - (0 if back else r * 0.08), r * (0.2 + 0.07 * rnd.random())))
    for x, y, s in pts:
        pen.circle(x, y, s + 3, OUT)
    if back:
        pen.ellipse(cx, cy - r * 0.38, r * 0.98, r * 0.95, HAIR)
    else:
        pen.ellipse(cx, cy - r * 0.72, r * 0.9, r * 0.42, HAIR)
    for x, y, s in pts:
        pen.circle(x, y, s, HAIR)
    if back:
        pen.ellipse(cx, cy + r * 0.05, r * 0.95, r * 0.8, HAIR)
    for i in range(7):  # highlights
        a = math.pi * (1.25 + 0.5 * i / 6)
        pen.arc(cx + r * 0.7 * math.cos(a), cy + r * 0.75 * math.sin(a) - r * 0.1, r * 0.1, r * 0.08, 200, 320, (80, 66, 60), r * 0.025)


def boy_sprite(pose):
    """pose: dict with view ('front'|'back'), walk phase, arm angles, face params, bread (hand index or None)."""
    pen = Pen(700, 1100, 350, 1060)
    view = pose.get("view", "front")
    ph = pose.get("walk", None)
    bob = 0
    lift = [0, 0]
    sway = 0
    if ph is not None:
        s = math.sin(ph)
        bob = -14 * abs(math.cos(ph))
        lift = [max(0, math.cos(ph)) * 22, max(0, -math.cos(ph)) * 22]
        sway = 0.05 * s
    hop = pose.get("hop", 0)
    oy = bob - hop
    # feet
    for i, sx in enumerate((-1, 1)):
        pen.ellipse(sx * 52, -16 - lift[i], 48, 20, SANDAL, OUT, 4)
    # thobe
    body = [(-118, -560 + oy), (118, -560 + oy), (150, -40 + oy * 0.3), (-150, -40 + oy * 0.3)]
    pen.poly(body, THOBE, OUT, 5)
    pen.rrect(-120, -600 + oy, 120, -380 + oy, 80, THOBE, OUT, 5)
    pen.poly([(-114, -470 + oy), (114, -470 + oy), (146, -45 + oy * 0.3), (-146, -45 + oy * 0.3)], THOBE)
    pen.line([(-60, -150 + oy), (-75, -50 + oy * 0.3)], THOBE_L, 4)
    pen.line([(60, -150 + oy), (75, -50 + oy * 0.3)], THOBE_L, 4)
    if view == "front":
        pen.line([(0, -575 + oy), (0, -440 + oy)], THOBE_L, 4)
        for by in (-540, -490):
            pen.circle(0, by + oy, 7, (225, 222, 215), OUT, 2)
    # arms
    arms = pose.get("arms", ((0.12, 0.05), (-0.12, -0.05)))
    hands = []
    for i, sx in enumerate((-1, 1)):
        a1, a2 = arms[i]
        a1s = sx * a1 + sway
        hx, hy = limb(pen, sx * 112, -545 + oy, a1s, sx * a2, 175, 165, THOBE, OUT, 62)
        hands.append((hx, hy))
    # bread in hand
    b = pose.get("bread")
    if b is not None:
        hx, hy = hands[b]
        pen.ellipse(hx, hy + 55, 72, 70, (184, 122, 54), OUT, 4)
        pen.ellipse(hx, hy + 52, 62, 60, (224, 173, 102))
        for dx, dy in ((-20, -10), (15, 15), (25, -20), (-10, 25), (0, 0)):
            pen.circle(hx + dx, hy + 52 + dy, 7, (176, 108, 44))
    # neck + head
    pen.rrect(-34, -640 + oy, 34, -570 + oy, 14, SKIN_D)
    hc = (0, -790 + oy)
    r = 175
    pen.circle(hc[0] - r * 0.97, hc[1] + 10, 36, SKIN, OUT, 4)
    pen.circle(hc[0] + r * 0.97, hc[1] + 10, 36, SKIN, OUT, 4)
    pen.circle(*hc, r, SKIN, OUT, 5)
    if view == "front":
        face(pen, hc[0], hc[1], r, **pose.get("face", {}))
        curls(pen, hc[0], hc[1], r)
    else:
        curls(pen, hc[0], hc[1], r, back=True)
    # hand over the forehead is drawn last so it overlaps the face
    if pose.get("facepalm"):
        k = pose["facepalm"]
        sx_, sy_ = -112, -545 + oy
        hx = lerp(hands[0][0], hc[0] - 40, k)
        hy = lerp(hands[0][1], hc[1] - 95, k)
        ex = lerp(sx_ - 60, sx_ - 90, k)
        ey = lerp(sy_ + 170, hy + 120, k)
        pen.line([(sx_, sy_), (ex, ey), (hx, hy)], OUT, 70)
        pen.line([(sx_, sy_), (ex, ey), (hx, hy)], THOBE, 62)
        pen.ellipse(hx, hy, 44, 36, SKIN, OUT, 4)
    im = pen.done()
    return im, {"head": (hc[0] + 350, hc[1] - r + 1060), "mouth": (hc[0] + 350, hc[1] + r * 0.48 + 1060),
                "face": (hc[0] + 350, hc[1] + 1060)}


@lru_cache(maxsize=None)
def shemagh_pattern(w, h):
    im = Image.new("RGB", (w, h), (248, 244, 238))
    d = ImageDraw.Draw(im)
    s = 18 * SS
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2 == 0:
                d.ellipse((x + s * 0.18, y + s * 0.18, x + s * 0.82, y + s * 0.82), fill=RED)
    return im


def father_sprite(talk=0.0, gesture=0.0, blink=0.0, nod=0.0):
    pen = Pen(760, 1340, 380, 1000)
    # legs + lap (seated) — origin at the seat
    for sx in (-1, 1):
        pen.rrect(sx * 85 - 58, 60, sx * 85 + 58, 250, 40, THOBE, OUT, 5)
        pen.ellipse(sx * 85, 258, 64, 24, SANDAL, OUT, 4)
    pen.rrect(-200, -40, 200, 130, 80, THOBE, OUT, 5)
    pen.line([(0, 0), (0, 110)], THOBE_L, 4)
    # torso
    pen.rrect(-150, -470, 150, 20, 90, THOBE, OUT, 5)
    pen.line([(0, -440), (0, -280)], THOBE_L, 4)
    for by in (-410, -350):
        pen.circle(0, by, 8, (225, 222, 215), OUT, 2)
    # left arm resting, right arm gesturing
    limb(pen, -140, -420, 0.25, -0.5, 190, 170, THOBE, OUT, 70)
    g = gesture
    limb(pen, 140, -420, lerp(-0.15, 0.55, g), lerp(0.5, 1.9, g), 190, 175, THOBE, OUT, 70)
    # head with shemagh
    hc = (0, -660 + nod * 8)
    r = 175
    # shemagh drape behind the head (pattern through a mask)
    mask = Image.new("L", pen.im.size, 0)
    md = ImageDraw.Draw(mask)
    drape = [(hc[0] - r * 1.1, hc[1] - r * 0.3), (hc[0] + r * 1.1, hc[1] - r * 0.3),
             (hc[0] + r * 1.12, hc[1] + r * 1.1), (hc[0] + r * 0.75, hc[1] + r * 1.35),
             (hc[0] - r * 0.75, hc[1] + r * 1.35), (hc[0] - r * 1.12, hc[1] + r * 1.1)]
    md.polygon([pen.p(*q) for q in drape], fill=255)
    md.ellipse(pen.box(hc[0] - r * 1.18, hc[1] - r * 1.22, hc[0] + r * 1.18, hc[1] + r * 0.6), fill=255)
    pen.d.polygon([pen.p(*q) for q in drape], outline=OUT, width=int(5 * pen.k))
    pat = shemagh_pattern(*pen.im.size).convert("RGBA")
    pen.im.paste(pat, (0, 0), mask)
    pen.d.ellipse(pen.box(hc[0] - r * 1.18, hc[1] - r * 1.22, hc[0] + r * 1.18, hc[1] + r * 0.6), outline=OUT, width=int(5 * pen.k))
    # face
    pen.ellipse(hc[0], hc[1] + 20, r * 0.86, r * 0.98, SKIN, OUT, 5)
    face(pen, hc[0], hc[1] + 10, r * 0.95, talk=talk, smile=0.9, blink=blink)
    # beard + moustache (mouth stays visible)
    pen.d.chord(pen.box(hc[0] - r * 0.86, hc[1] - r * 0.3, hc[0] + r * 0.86, hc[1] + r * 1.12), 15, 165, fill=BEARD)
    my = hc[1] + 10 + r * 0.95 * 0.48
    pen.ellipse(hc[0], my + 6, r * 0.2, r * (0.07 + 0.15 * talk), (90, 30, 26))
    pen.rrect(hc[0] - r * 0.3, my - r * 0.16, hc[0] + r * 0.3, my - r * 0.05, 18, BEARD)
    # agal
    for dy in (0, 32):
        pen.ellipse(hc[0], hc[1] - r * 0.92 + dy, r * 0.95, r * 0.16, None, (18, 18, 18), 20)
    im = pen.done()
    return im, {"head": (hc[0] + 380, hc[1] - r * 1.22 + 1000)}


# ----------------------------------------------------------------- backgrounds
def grad(w, h, top, bot):
    y = np.linspace(0, 1, h)[:, None, None]
    a = np.array(top, float)[None, None, :] * (1 - y) + np.array(bot, float)[None, None, :] * y
    return Image.fromarray(np.repeat(a, w, 1).astype(np.uint8), "RGB").convert("RGBA")


@lru_cache(maxsize=None)
def bg_room():
    pen = Pen(W, H, 0, 0)
    pen.im.paste(grad(pen.im.width, pen.im.height, (238, 224, 200), (226, 208, 180)))
    pen.rrect(-10, 1180, W + 10, 1210, 0, (190, 160, 120))
    # floor
    pen.poly([(0, 1210), (W, 1210), (W, H), (0, H)], (196, 150, 104))
    for i, y in enumerate((1290, 1400, 1540, 1720)):
        pen.line([(0, y), (W, y)], (170, 124, 82), 4, False)
    # window with evening sky
    pen.rrect(640, 330, 990, 820, 20, (122, 85, 55))
    sky = grad(int(310 * SS), int(450 * SS), (255, 170, 110), (255, 214, 150))
    pen.im.paste(sky, (int(660 * SS), int(350 * SS)))
    pen.circle(880, 700, 60, (255, 236, 180))
    pen.line([(815, 350), (815, 800)], (122, 85, 55), 16, False)
    pen.line([(660, 575), (970, 575)], (122, 85, 55), 16, False)
    # wall frame
    pen.rrect(110, 380, 430, 640, 14, (196, 150, 70), OUT, 4)
    pen.rrect(135, 405, 405, 615, 8, (34, 92, 104))
    pen.arc(270, 520, 90, 50, 200, 340, (240, 210, 140), 12)
    pen.circle(270, 520, 14, (240, 210, 140))
    # lamp glow
    glow = Image.new("RGBA", pen.im.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(pen.box(-150, 300, 400, 900), fill=(255, 200, 120, 90))
    pen.im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(60 * SS)))
    pen.line([(110, 640), (110, 1420)], (40, 40, 40), 10)
    pen.poly([(40, 560), (180, 560), (210, 680), (10, 680)], (255, 236, 200), OUT, 4)
    # majlis sofa
    pen.rrect(60, 880, 1020, 1250, 50, (47, 111, 115), OUT, 5)
    pen.rrect(40, 1130, 1040, 1400, 50, (56, 128, 132), OUT, 5)
    for x in (40, 960):
        pen.rrect(x, 1000, x + 80, 1400, 36, (47, 111, 115), OUT, 5)
    pen.rrect(140, 960, 330, 1150, 40, (217, 164, 65), OUT, 4)
    pen.rrect(750, 960, 940, 1150, 40, (142, 31, 42), OUT, 4)
    # rug
    pen.poly([(140, 1560), (940, 1560), (1060, 1900), (20, 1900)], (142, 31, 42), OUT, 4)
    pen.poly([(190, 1590), (890, 1590), (990, 1870), (90, 1870)], None, (232, 194, 122), 10)
    pen.poly([(540, 1630), (680, 1730), (540, 1830), (400, 1730)], (232, 194, 122))
    pen.poly([(540, 1680), (610, 1730), (540, 1780), (470, 1730)], (31, 59, 90))
    # coffee table with dallah
    pen.rrect(760, 1450, 1060, 1490, 12, (107, 74, 47), OUT, 4)
    for x in (780, 1030):
        pen.rrect(x, 1490, x + 16, 1620, 6, (107, 74, 47))
    pen.poly([(860, 1450), (920, 1450), (905, 1380), (890, 1340), (875, 1380)], (212, 164, 55), OUT, 4)
    pen.line([(905, 1400), (950, 1360)], (212, 164, 55), 10)
    pen.circle(890, 1335, 12, (212, 164, 55), OUT, 3)
    for x in (975, 1015):
        pen.poly([(x - 16, 1450), (x + 16, 1450), (x + 12, 1425), (x - 12, 1425)], (246, 241, 232), OUT, 3)
    return pen.done()


@lru_cache(maxsize=None)
def bg_shop():
    pen = Pen(W, H, 0, 0)
    pen.im.paste(grad(pen.im.width, pen.im.height, (196, 230, 222), (176, 214, 206)))
    pen.poly([(0, 1300), (W, 1300), (W, H), (0, H)], (232, 236, 240))
    for y in range(1300, H, 120):
        pen.line([(0, y), (W, y)], (205, 212, 218), 4, False)
    for x in range(0, W + 1, 180):
        pen.line([(x, 1300), (x + (x - 540) * 0.5, H)], (205, 212, 218), 4, False)
    # sign
    pen.rrect(190, 120, 890, 290, 26, (15, 95, 115), OUT, 5)
    sign = pen.done()
    t = R.text("بقالة الحي", 96, R.YELLOW, "900")
    sign.alpha_composite(t, (540 - t.width // 2, 205 - t.height // 2))
    pen = Pen(W, H, 0, 0)
    pen.im.paste(sign.resize(pen.im.size, Image.LANCZOS))
    # shelves with products
    cols = [(230, 57, 70), (244, 162, 97), (42, 157, 143), (69, 123, 157), (255, 209, 102), (142, 202, 230), (239, 71, 111), (6, 214, 160)]
    rnd = np.random.default_rng(11)
    for x0 in (30, 600):
        pen.rrect(x0, 360, x0 + 450, 1300, 16, (242, 242, 242), OUT, 4)
        for r in range(4):
            y = 560 + r * 230
            pen.rrect(x0 + 10, y, x0 + 440, y + 18, 4, (200, 200, 200))
            x = x0 + 22
            while x < x0 + 420:
                w = 40 + rnd.random() * 34
                h = 70 + rnd.random() * 90
                c = cols[int(rnd.random() * len(cols))]
                if rnd.random() < 0.3:
                    pen.rrect(x, y - h, x + w, y, w / 2.5, c, OUT, 3)
                else:
                    pen.rrect(x, y - h, x + w, y, 6, c, OUT, 3)
                    pen.rrect(x + 6, y - h * 0.65, x + w - 6, y - h * 0.4, 3, (255, 255, 255, 170))
                x += w + 10
    # bread counter
    pen.rrect(90, 1180, 990, 1600, 24, (168, 119, 77), OUT, 5)
    pen.rrect(70, 1150, 1010, 1200, 14, (217, 180, 138), OUT, 4)
    for lab, x, c in (("عيش", 330, (27, 127, 74)), ("صامولي", 750, (192, 57, 43))):
        pen.rrect(x - 130, 1300, x + 130, 1390, 14, (255, 255, 255), OUT, 3)
    shop = pen.done()
    for lab, x, c in (("عيش", 330, (27, 127, 74)), ("صامولي", 750, (192, 57, 43))):
        t = R.text(lab, 54, c, "900")
        shop.alpha_composite(t, (x - t.width // 2, 1345 - t.height // 2))
    return shop


def bread_stack(n):
    pen = Pen(300, 260, 150, 250)
    for i in range(n):
        y = -i * 22
        pen.ellipse(0, y - 16, 120, 18, (190, 128, 60), OUT, 3)
        pen.ellipse(0, y - 19, 104, 12, (232, 186, 118))
    for dx, dy in ((-50, -4), (10, 2), (55, -6), (-15, -8)):
        pen.circle(dx, -(n - 1) * 22 - 19 + dy, 5, (176, 108, 44))
    return pen.done()


@lru_cache(maxsize=None)
def samoli_pile():
    pen = Pen(360, 260, 180, 250)
    for i, (x, y) in enumerate(((-80, -30), (80, -30), (0, -30), (-40, -100), (40, -100), (0, -165))):
        pen.rrect(x - 85, y - 34, x + 85, y + 34, 34, (233, 162, 74), OUT, 4)
        for k in range(3):
            pen.line([(x - 45 + k * 40, y + 14), (x - 25 + k * 40, y - 16)], (184, 112, 42), 7)
    return pen.done()


@lru_cache(maxsize=None)
def bg_street():
    w, h = int(W * 1.3), int(H * 1.3)
    pen = Pen(w, h, 0, 0)
    pen.im.paste(grad(pen.im.width, pen.im.height, (120, 196, 238), (200, 232, 245)))
    vx, vy = w / 2, h * 0.47
    # ground
    pen.poly([(0, vy), (w, vy), (w, h), (0, h)], (216, 195, 160))
    pen.poly([(vx - 20, vy), (vx + 20, vy), (w * 0.72, h), (w * 0.28, h)], (88, 94, 104))
    for i in range(9):  # dashed centre line
        a, b = (i / 9) ** 1.8, ((i + 0.5) / 9) ** 1.8
        pen.poly([(vx - 2 - 10 * a, vy + (h - vy) * a), (vx + 2 + 10 * a, vy + (h - vy) * a),
                  (vx + 2 + 10 * b, vy + (h - vy) * b), (vx - 2 - 10 * b, vy + (h - vy) * b)], (245, 245, 245))
    # villa facades on both sides (one-point perspective)
    cols = [(232, 213, 181), (240, 226, 200), (220, 195, 160), (234, 219, 192)]
    for side in (-1, 1):
        for i in range(6):
            a, b = (i / 6) ** 1.6, ((i + 1) / 6) ** 1.6
            x_a = vx + side * (60 + (w * 0.5 - 60) * a)
            x_b = vx + side * (60 + (w * 0.5 - 60) * b)
            top_a = vy - (40 + 900 * a)
            top_b = vy - (40 + 900 * b)
            bot_a = vy + (h - vy) * 0.42 * a
            bot_b = vy + (h - vy) * 0.42 * b
            c = cols[i % 4]
            pen.poly([(x_a, top_a), (x_b, top_b), (x_b, bot_b), (x_a, bot_a)], c, OUT, 3)
            mx, mt, mb = (x_a + x_b) / 2, (top_a + top_b) / 2, (bot_a + bot_b) / 2
            hh = mb - mt
            ww = abs(x_b - x_a)
            pen.poly([(mx - ww * 0.18, mt + hh * 0.25), (mx + ww * 0.18, mt + hh * 0.25 - side * 0),
                      (mx + ww * 0.18, mt + hh * 0.5), (mx - ww * 0.18, mt + hh * 0.5)], (95, 143, 166), OUT, 2)
            pen.poly([(x_a, top_a), (x_b, top_b), (x_b, top_b + 14 * b + 4), (x_a, top_a + 14 * a + 4)], (255, 255, 255))
    # palms
    for side in (-1, 1):
        for i, a in enumerate((0.25, 0.5, 0.85)):
            x = vx + side * (90 + (w * 0.5 - 140) * a)
            base = vy + (h - vy) * 0.45 * a
            hgt = 300 + 1100 * a
            tw = 8 + 22 * a
            pen.poly([(x - tw, base), (x + tw, base), (x + tw * 0.6, base - hgt), (x - tw * 0.6, base - hgt)], (138, 106, 69), OUT, 3)
            for k in range(8):
                ang = math.pi * (0.1 + 0.8 * k / 7)
                L = 90 + 260 * a
                ex, ey = x + L * math.cos(ang) * 1.3 * (-1 if k % 2 else 1), base - hgt + L * 0.25 * math.sin(ang * 2) + 20
                pen.line([(x, base - hgt), ((x + ex) / 2, base - hgt - L * 0.25), (ex, ey)], (61, 139, 61), 14 + 26 * a)
            pen.circle(x, base - hgt, 14 + 20 * a, (90, 70, 40))
    return pen.done()


@lru_cache(maxsize=None)
def speedlines():
    im = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = W * SS / 2, H * SS * 0.42
    rnd = np.random.default_rng(9)
    for i in range(70):
        a = i / 70 * 2 * math.pi + rnd.random() * 0.05
        r0 = (420 + rnd.random() * 220) * SS
        r1 = 2400 * SS
        wdt = 0.012 + rnd.random() * 0.018
        pts = [(cx + r0 * math.cos(a), cy + r0 * math.sin(a)), (cx + r1 * math.cos(a - wdt), cy + r1 * math.sin(a - wdt)),
               (cx + r1 * math.cos(a + wdt), cy + r1 * math.sin(a + wdt))]
        d.polygon(pts, fill=(255, 255, 255, 200) if i % 3 else (255, 204, 0, 220))
    return im.resize((W, H), Image.LANCZOS)


# ----------------------------------------------------------------- camera
def camera(img, zoom, cx, cy):
    """Crop around (cx, cy) by `zoom` and scale to the output size; returns frame and a point mapper."""
    w, h = W / zoom, H / zoom
    x0 = clamp(cx - w / 2, 0, img.width - w)
    y0 = clamp(cy - h / 2, 0, img.height - h)
    out = img.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((W, H), Image.BILINEAR)
    return out, (lambda p: [(p[0] - x0) * zoom, (p[1] - y0) * zoom])


def paste(cv, sprite, x, y, scale=1.0):
    """Paste a sprite whose anchor (feet / seat) is at the bottom-centre-ish origin used by the Pen."""
    if scale != 1.0:
        sprite = sprite.resize((int(sprite.width * scale), int(sprite.height * scale)), Image.LANCZOS)
    cv.alpha_composite(sprite, (int(x), int(y)))


# ----------------------------------------------------------------- shots
def frame(t):
    meta = {}
    name = next(n for a, b, n in SHOTS if a <= t < b) if t < END else "surprise"
    a = next(a for a, b, n in SHOTS if n == name)
    lt = t - a
    if name in ("intro", "father"):
        cv = bg_room().copy()
        talking = name == "father" and 0.6 < lt < 2.8
        talk = max(0.0, 0.5 + 0.5 * math.sin(lt * 22) * math.sin(lt * 7.3)) if talking else 0.0
        gest = ease_out(prog(lt, 0.5, 0.4)) * (1 - ease_out(prog(lt, 2.9, 0.5))) if name == "father" else 0
        blink = 1.0 if (t % 2.9) < 0.1 else 0.0
        fs, finfo = father_sprite(talk=talk, gesture=gest, blink=blink, nod=math.sin(lt * 5) if talking else 0)
        sc = 0.8
        fx, fy = 540 - 380 * sc, 1450 - 1000 * sc
        paste(cv, fs, fx, fy, sc)
        dad_head = (fx + finfo["head"][0] * sc, fy + finfo["head"][1] * sc)
        # the son, seen from behind in the foreground
        nod = 0.25 * max(0, math.sin((lt - 3.2) * 9)) if name == "father" and 3.2 < lt < 4.0 else 0
        bs, _ = boy_sprite({"view": "back", "hop": -nod * 30})
        bsc = 0.85
        paste(cv, bs, 140 - 350 * bsc, 2010 - 1060 * bsc, bsc)
        if name == "intro":
            out, mp = camera(cv, lerp(1.0, 1.05, lt / 2.2), 540, 960)
        else:
            k = ease_in_out(prog(lt, 0, 4.8))
            z = lerp(1.0, 1.1, k)
            out, mp = camera(cv, z, 540, dad_head[1] + (960 - 760) / z)
            meta["dadHead"] = mp(dad_head)
    elif name == "shop":
        cv = bg_shop().copy()
        grabbed = lt > 1.15
        paste(cv, bread_stack(4 if grabbed else 5), 330 - 150, 1150 - 250)
        paste(cv, samoli_pile(), 750 - 180, 1150 - 250)
        turn = lt > 2.25
        walk_out = prog(lt, 2.6, 1.2)
        if not turn:
            reach = ease_out(prog(lt, 0.6, 0.45)) * (1 - ease_out(prog(lt, 1.6, 0.5)))
            pose = {"view": "back", "arms": ((0.12 + 2.2 * reach, 0.05 - 0.3 * reach), (0.12, 0.05))}
        else:
            pose = {"view": "front", "bread": 1, "face": {"smile": 1.0, "blink": 1.0 if (lt % 2.3) < 0.1 else 0.0},
                    "arms": ((0.12, 0.05), (0.18, -0.55))}
            if walk_out > 0:
                pose["walk"] = lt * 9
        bs, binfo = boy_sprite(pose)
        bsc = lerp(1.05, 1.3, walk_out)
        bx = lerp(520, 600, walk_out) - 350 * bsc
        by = lerp(1820, 1960, walk_out) - 1060 * bsc
        paste(cv, bs, bx, by, bsc)
        out, mp = camera(cv, lerp(1.05, 1.0, ease_in_out(prog(lt, 0, 3.8))), 540, 960)
        meta["boyHead"] = mp((bx + binfo["head"][0] * bsc, by + binfo["head"][1] * bsc))
    else:
        st = bg_street()
        tStop = SHOTS[4][0] - SHOTS[3][0]
        walking = name == "walk"
        wt = lt if walking else tStop
        z = lerp(1.0, 1.18, wt / tStop)
        base, _ = camera(st, z, st.width / 2, st.height * 0.47 + 260)
        cv = base.copy()
        if not walking:
            sp = speedlines()
            kk = ease_out(prog(lt, 0.0, 0.2))
            cv.alpha_composite(Image.new("RGBA", (W, H), (255, 204, 0, int(70 * kk))))
            spa = sp.copy()
            spa.putalpha(spa.getchannel("A").point(lambda v: int(v * kk)))
            cv.alpha_composite(spa)
        if walking:
            pose = {"view": "front", "walk": lt * 8.5, "bread": 1, "arms": ((0.12, 0.05), (0.18, -0.55)),
                    "face": {"whistle": 1.0, "blink": 1.0 if (lt % 2.5) < 0.1 else 0.0, "look": (0.5, -0.3)}}
        else:
            shock = ease_out(prog(lt, 0.05, 0.2))
            pose = {"view": "front", "bread": 1, "hop": 60 * math.sin(clamp(lt / 0.28) * math.pi),
                    "face": {"shock": shock, "smile": 0.0},
                    "facepalm": ease_out(prog(lt, 0.35, 0.35)),
                    "arms": ((0.12, 0.05), (0.18, -0.55))}
        bs, binfo = boy_sprite(pose)
        bsc = 1.25
        bx, by = 540 - 350 * bsc, 1880 - 1060 * bsc + (8 * math.sin(lt * 17) if walking else 0)
        paste(cv, bs, bx, by, bsc)
        head = (bx + binfo["head"][0] * bsc, by + binfo["head"][1] * bsc)
        mouth = (bx + binfo["mouth"][0] * bsc, by + binfo["mouth"][1] * bsc)
        fc = (bx + binfo["face"][0] * bsc, by + binfo["face"][1] * bsc)
        if walking:
            out, mp = cv, (lambda p: list(p))
            meta["mouth"] = mp(mouth)
            meta["whistle"] = True
        else:
            zm = ease_out(prog(lt, 0.0, 0.22))
            shake = 10 * math.sin(lt * 60) * (1 - prog(lt, 0, 0.4))
            out, mp = camera(cv, lerp(1.0, 1.32, zm), fc[0] + shake, lerp(960, fc[1] + 380, zm))
            meta["boyHead"] = mp(head)
            meta["surprise"] = True
    return out.convert("RGB"), meta


def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    if "--only" in sys.argv:
        times = [float(x) for x in sys.argv[sys.argv.index("--only") + 1].split(",")]
    else:
        times = [i / FPS for i in range(int(round(END * FPS)))]
    metas = []
    for i, t in enumerate(times):
        img, m = frame(t)
        name = f"t_{t:g}.jpg" if "--only" in sys.argv else f"f_{i:05d}.jpg"
        img.save(os.path.join(out, name), quality=94)
        metas.append({"t": t, **m})
        if i % 60 == 0:
            print("frame", i, len(times), flush=True)
    json.dump(metas, open(os.path.join(out, "meta.json"), "w"))


if __name__ == "__main__":
    main()
