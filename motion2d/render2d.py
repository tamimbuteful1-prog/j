"""منهجي | الحلقة الثانية — flat 2D story scenes.

Modern flat style (no outlines, soft shade shapes). Draws the story — father
in the living room, the grocery, walking home whistling (side view with a
scrolling street), the surprise close-up — and writes frames plus meta.json
in the format compose3d.py expects.

Usage: python3 render2d.py <out_dir> [--speed 1.6] [--only t1,t2,...]
  --speed plays the story faster: output frame i shows story time i*speed/FPS.
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
SS = 2

SHOTS = [(0.0, 2.2, "intro"), (2.2, 7.0, "father"), (7.0, 10.8, "shop"), (10.8, 15.2, "walk"), (15.2, 18.6, "surprise")]
END = 18.6

SKIN = (222, 168, 128)
SKIN_SH = (196, 140, 102)
HAIR = (36, 28, 26)
HAIR_HI = (70, 58, 54)
THOBE = (250, 250, 248)
THOBE_SH = (220, 224, 230)
THOBE_SH2 = (200, 205, 214)
BEARD = (44, 34, 32)
MOUTH = (120, 44, 40)
SANDAL = (98, 66, 44)
SH_RED = (206, 40, 54)

clamp, prog, ease_out = R.clamp, R.prog, R.ease_out


def ease_in_out(x):
    return x * x * (3 - 2 * x)


def lerp(a, b, k):
    return a + (b - a) * k


class Pen:
    """Draw in 1x units on a supersampled RGBA sprite; (ox, oy) is where the origin sits."""

    def __init__(self, w, h, ox, oy):
        self.k = SS
        self.im = Image.new("RGBA", (int(w * SS), int(h * SS)), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
        self.ox, self.oy = ox, oy

    def p(self, x, y):
        return ((x + self.ox) * SS, (y + self.oy) * SS)

    def box(self, x0, y0, x1, y1):
        a, b = self.p(x0, y0), self.p(x1, y1)
        return (min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1]))

    def ellipse(self, cx, cy, rx, ry, fill):
        self.d.ellipse(self.box(cx - rx, cy - ry, cx + rx, cy + ry), fill=fill)

    def circle(self, cx, cy, r, fill):
        self.ellipse(cx, cy, r, r, fill)

    def ring(self, cx, cy, rx, ry, color, width):
        self.d.ellipse(self.box(cx - rx, cy - ry, cx + rx, cy + ry), outline=color, width=int(width * SS))

    def rrect(self, x0, y0, x1, y1, r, fill):
        self.d.rounded_rectangle(self.box(x0, y0, x1, y1), radius=r * SS, fill=fill)

    def poly(self, pts, fill):
        self.d.polygon([self.p(*q) for q in pts], fill=fill)

    def line(self, pts, fill, width):
        P = [self.p(*q) for q in pts]
        w = width * SS
        self.d.line(P, fill=fill, width=int(w), joint="curve")
        for x, y in P:
            self.d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=fill)

    def arc(self, cx, cy, rx, ry, a0, a1, fill, width):
        self.d.arc(self.box(cx - rx, cy - ry, cx + rx, cy + ry), a0, a1, fill=fill, width=int(width * SS))

    def chord(self, cx, cy, rx, ry, a0, a1, fill):
        self.d.chord(self.box(cx - rx, cy - ry, cx + rx, cy + ry), a0, a1, fill=fill)

    def done(self):
        return self.im.resize((self.im.width // SS, self.im.height // SS), Image.LANCZOS)


def arm(pen, sx, sy, a1, a2, color, shade=None, l1=150, l2=140, width=50, hand=SKIN):
    """Two-segment sleeve; angles from straight down, positive toward +x."""
    ex, ey = sx + l1 * math.sin(a1), sy + l1 * math.cos(a1)
    hx, hy = ex + l2 * math.sin(a1 + a2), ey + l2 * math.cos(a1 + a2)
    pen.line([(sx, sy), (ex, ey), (hx, hy)], color, width)
    if shade:
        pen.line([(ex, ey), (hx - 6 * math.cos(a1 + a2), hy)], shade, width * 0.35)
    pen.ellipse(hx + 2 * math.sin(a1 + a2), hy + 10 * math.cos(a1 + a2), 21, 24, hand)
    return hx, hy + 10 * math.cos(a1 + a2)


def bread_disc(pen, x, y, r=56):
    pen.ellipse(x, y + 4, r, r * 0.96, (196, 132, 64))
    pen.ellipse(x, y, r * 0.9, r * 0.86, (236, 190, 120))
    pen.ellipse(x - r * 0.15, y - r * 0.2, r * 0.45, r * 0.35, (246, 210, 150))
    for dx, dy in ((-0.3, -0.1), (0.25, 0.25), (0.35, -0.3), (-0.1, 0.4), (0.05, 0.0)):
        pen.circle(x + dx * r, y + dy * r, r * 0.08, (188, 120, 56))


# ----------------------------------------------------------------- hair
def curly_cap(pen, cx, cy, r, side=False):
    rnd = np.random.default_rng(5)
    if side:  # facing +x: hair covers back and top
        pen.ellipse(cx - r * 0.2, cy - r * 0.6, r * 0.85, r * 0.45, HAIR)
        pen.ellipse(cx - r * 0.62, cy - r * 0.15, r * 0.42, r * 0.55, HAIR)
        angles = np.linspace(math.pi * 0.8, math.pi * 1.88, 18)
    else:
        pen.ellipse(cx, cy - r * 0.72, r * 0.98, r * 0.32, HAIR)
        angles = np.linspace(math.pi * 1.0, math.pi * 2.0, 20)
    for a in angles:
        rr = r * (0.95 + 0.06 * rnd.random())
        x, y = cx + rr * math.cos(a), cy + rr * math.sin(a) * 0.98 - r * 0.06
        if side and math.cos(a) > 0.2 and math.sin(a) > -0.6:
            continue
        if not side and math.sin(a) > -0.15:
            continue
        pen.circle(x, y, r * (0.2 + 0.06 * rnd.random()), HAIR)
    for a in angles[2:-2:2]:
        x, y = cx + r * 0.78 * math.cos(a), cy + r * 0.8 * math.sin(a) - r * 0.1
        pen.arc(x, y, r * 0.12, r * 0.09, 200, 330, HAIR_HI, r * 0.035)
    if not side:  # fringe curls on the forehead
        for i, x in enumerate((-0.55, -0.25, 0.08, 0.4)):
            pen.circle(cx + x * r, cy - r * (0.72 - 0.04 * (i % 2)), r * 0.18, HAIR)


# ----------------------------------------------------------------- front view
def front_face(pen, cx, cy, r, shock=0.0, talk=0.0, smile=0.6, blink=0.0):
    for sx in (-1, 1):
        ex, ey = cx + sx * r * 0.36, cy - r * 0.02
        if shock > 0.3:
            er = r * (0.16 + 0.08 * shock)
            pen.circle(ex, ey, er, (255, 255, 255))
            pen.circle(ex, ey + er * 0.1, er * 0.38, (30, 24, 24))
            pen.circle(ex + er * 0.15, ey - er * 0.1, er * 0.12, (255, 255, 255))
        elif blink > 0.5:
            pen.arc(ex, ey, r * 0.1, r * 0.06, 20, 160, (40, 30, 28), r * 0.04)
        else:
            pen.ellipse(ex, ey, r * 0.075, r * 0.105, (40, 30, 28))
            pen.circle(ex + r * 0.025, ey - r * 0.04, r * 0.025, (255, 255, 255))
        by = ey - r * (0.27 + 0.1 * shock)
        pen.line([(ex - r * 0.12, by + r * 0.02 * (1 - shock)), (ex + r * 0.12, by - r * 0.02 * shock)], HAIR, r * 0.06)
    pen.ellipse(cx, cy + r * 0.2, r * 0.09, r * 0.07, SKIN_SH)
    for sx in (-1, 1):
        pen.ellipse(cx + sx * r * 0.58, cy + r * 0.27, r * 0.13, r * 0.08, (232, 150, 128))
    my = cy + r * 0.48
    open_ = max(talk, shock)
    if open_ > 0.05:
        pen.ellipse(cx, my, r * (0.14 + 0.06 * shock), r * (0.06 + 0.2 * open_), MOUTH)
        pen.ellipse(cx, my + r * 0.08 * open_, r * 0.08, r * 0.05 * open_, (214, 96, 96))
    else:
        pen.chord(cx, my - r * 0.08, r * 0.2, r * (0.06 + 0.1 * smile), 10, 170, MOUTH)


def boy_front(shock=0.0, facepalm=0.0, hop=0.0, smile=0.7, bread=True):
    pen = Pen(600, 1000, 300, 960)
    oy = -hop
    # feet + thobe
    for sx in (-1, 1):
        pen.ellipse(sx * 40, -10 + oy, 40, 16, SANDAL)
    body = [(-70, -590), (70, -590), (104, -555), (112, -470), (120, -32), (-120, -32), (-112, -470), (-104, -555)]
    pen.poly([(x, y + oy) for x, y in body], THOBE)
    pen.poly([(60, -575 + oy), (104, -555 + oy), (112, -470 + oy), (120, -32 + oy), (78, -32 + oy), (70, -470 + oy)], THOBE_SH)
    pen.line([(0, -575 + oy), (0, -420 + oy)], THOBE_SH, 3)
    for by in (-545, -500, -455):
        pen.circle(0, by + oy, 5, THOBE_SH2)
    # arms
    arm(pen, -98, -555 + oy, 0.1, 0.05, THOBE, THOBE_SH)
    hx, hy = arm(pen, 98, -555 + oy, -0.15, -0.6, THOBE, THOBE_SH)
    if bread:
        bread_disc(pen, hx - 10, hy + 30)
    # neck, collar, head
    pen.rrect(-26, -620 + oy, 26, -570 + oy, 10, SKIN_SH)
    pen.ellipse(0, -585 + oy, 40, 14, THOBE_SH)
    hc = (0, -705 + oy)
    r = 100
    for sx in (-1, 1):
        pen.ellipse(sx * r * 0.95, hc[1] + 8, 18, 24, SKIN_SH)
    pen.circle(*hc, r, SKIN)
    pen.chord(hc[0], hc[1], r, r, 20, 160, (214, 158, 118))  # jaw shade
    pen.circle(hc[0], hc[1] - 6, r * 0.97, SKIN)
    front_face(pen, hc[0], hc[1], r, shock=shock, smile=smile)
    curly_cap(pen, hc[0], hc[1], r)
    if facepalm > 0:
        k = facepalm
        hx2, hy2 = lerp(-120, hc[0] - 30, k), lerp(-300 + oy, hc[1] - 62, k)
        ex, ey = lerp(-150, -170, k), lerp(-420 + oy, hc[1] + 90, k)
        pen.line([(-98, -555 + oy), (ex, ey), (hx2, hy2 + 25)], THOBE, 50)
        pen.ellipse(hx2, hy2, 34, 24, SKIN)
        for i in range(4):
            pen.ellipse(hx2 - 22 + i * 15, hy2 - 18, 8, 12, SKIN)
    return pen.done(), {"head": (300, 960 + hc[1] - r), "face": (300, 960 + hc[1])}


# ----------------------------------------------------------------- side view (facing +x)
def boy_side(walk=None, reach=0.0, whistle=False, smile=0.6, bread=False, blink=False):
    pen = Pen(700, 1000, 330, 960)
    s = math.sin(walk) if walk is not None else 0.0
    c = math.cos(walk) if walk is not None else 1.0
    bob = -10 * abs(c) if walk is not None else 0
    oy = bob
    # feet (far foot darker)
    f1 = 46 * s
    pen.ellipse(-f1 + 10, -10 - max(0, -c) * 16 * (walk is not None), 44, 15, (78, 52, 36))
    pen.ellipse(f1 + 10, -10 - max(0, c) * 16 * (walk is not None), 44, 15, SANDAL)
    # far arm (behind body)
    arm(pen, -10, -555 + oy, -0.45 * s, -0.2, THOBE_SH, None, 140, 130, 46, SKIN_SH)
    # thobe with swinging hem
    hem = 18 * s
    body = [(-62, -590), (52, -590), (78, -545), (88 + hem, -30), (-82 + hem, -30), (-80, -470), (-78, -555)]
    pen.poly([(x, y + oy) for x, y in body], THOBE)
    pen.poly([(-80, -470 + oy), (-78, -555 + oy), (-50, -585 + oy), (-48, -470 + oy), (-40 + hem, -30 + oy), (-82 + hem, -30 + oy)], THOBE_SH)
    pen.line([(60, -560 + oy), (66, -440 + oy)], THOBE_SH, 3)
    # near arm: swings, or reaches forward
    a1 = lerp(0.45 * s, 2.15, reach)
    a2 = lerp(-0.25 - 0.1 * abs(s), -0.25, reach)
    hx, hy = arm(pen, 5, -555 + oy, a1, a2, THOBE, THOBE_SH, 150, 140, 52)
    if bread:
        bread_disc(pen, hx + 12, hy + 20, 50)
    # head
    pen.rrect(-12, -615 + oy, 36, -570 + oy, 10, SKIN_SH)
    hc = (14, -705 + oy)
    r = 100
    pen.circle(*hc, r, SKIN)
    pen.ellipse(hc[0] + r * 0.93, hc[1] + 8, 20, 18, SKIN)  # nose
    pen.ellipse(hc[0] + r * 0.88, hc[1] + 16, 10, 6, SKIN_SH)
    pen.ellipse(hc[0] - r * 0.12, hc[1] + 6, 18, 24, SKIN_SH)  # ear
    ex, ey = hc[0] + r * 0.55, hc[1] - r * 0.04
    if blink:
        pen.arc(ex, ey, 9, 6, 20, 160, (40, 30, 28), 4)
    else:
        pen.ellipse(ex, ey, 8, 11, (40, 30, 28))
        pen.circle(ex + 3, ey - 4, 3, (255, 255, 255))
    pen.line([(ex - 14, ey - 26), (ex + 10, ey - 30)], HAIR, 6)
    pen.ellipse(hc[0] + r * 0.45, hc[1] + r * 0.3, 14, 9, (232, 150, 128))
    mx, my = hc[0] + r * 0.74, hc[1] + r * 0.45
    if whistle:
        pen.circle(mx + 6, my, 11, MOUTH)
        pen.circle(mx + 6, my, 5, (60, 20, 20))
    else:
        pen.chord(mx - 4, my - 8, 20, 6 + 8 * smile, 10, 120, MOUTH)
    curly_cap(pen, hc[0], hc[1], r, side=True)
    return pen.done(), {"head": (330 + hc[0], 960 + hc[1] - r), "mouth": (330 + mx + 16, 960 + my)}


# ----------------------------------------------------------------- father (seated, front)
@lru_cache(maxsize=None)
def shemagh_tex(w, h):
    im = Image.new("RGBA", (w, h), (250, 247, 242, 255))
    d = ImageDraw.Draw(im)
    s = 14 * SS
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2 == 0:
                d.rectangle((x + s * 0.25, y + s * 0.25, x + s * 0.75, y + s * 0.75), fill=SH_RED)
    return im


def father(talk=0.0, gesture=0.0, blink=0.0, nod=0.0):
    pen = Pen(700, 1100, 350, 900)
    # legs + lap
    for sx in (-1, 1):
        pen.rrect(sx * 62 - 44, -150, sx * 62 + 44, -20, 30, THOBE_SH)
        pen.ellipse(sx * 62, -14, 48, 16, SANDAL)
    pen.rrect(-140, -270, 140, -150, 60, THOBE)
    pen.rrect(40, -262, 140, -150, 55, THOBE_SH)
    # torso
    body = [(-82, -640), (82, -640), (120, -600), (132, -500), (140, -230), (-140, -230), (-132, -500), (-120, -600)]
    pen.poly(body, THOBE)
    pen.poly([(70, -625), (120, -600), (132, -500), (140, -230), (90, -230), (82, -500)], THOBE_SH)
    pen.line([(0, -620), (0, -480)], THOBE_SH, 3)
    for by in (-590, -540):
        pen.circle(0, by, 5, THOBE_SH2)
    # arms: left rests on knee, right gestures
    arm(pen, -112, -600, 0.35, -0.75, THOBE, THOBE_SH, 160, 140, 60)
    g = gesture
    arm(pen, 112, -600, lerp(-0.2, 0.5, g), lerp(-0.7, -2.2, g), THOBE, THOBE_SH, 160, 140, 60)
    # shemagh drape (behind head)
    hc = (0, -760 + nod * 6)
    r = 110
    mask = Image.new("L", pen.im.size, 0)
    md = ImageDraw.Draw(mask)
    drape = [(hc[0] - r * 1.08, hc[1] - r * 0.2), (hc[0] + r * 1.08, hc[1] - r * 0.2), (hc[0] + r * 1.28, hc[1] + r * 1.45),
             (hc[0] + r * 0.6, hc[1] + r * 1.25), (hc[0] - r * 0.6, hc[1] + r * 1.25), (hc[0] - r * 1.28, hc[1] + r * 1.45)]
    md.polygon([pen.p(*q) for q in drape], fill=255)
    pen.im.paste(shemagh_tex(*pen.im.size), (0, 0), mask)
    # face
    pen.circle(hc[0], hc[1] + 6, r * 0.86, SKIN)
    front_face(pen, hc[0], hc[1] + 2, r * 0.9, talk=0, smile=0.8, blink=blink)
    # beard + moustache, then the mouth on top
    pen.chord(hc[0], hc[1] + 6, r * 0.86, r * 0.86, 5, 175, BEARD)
    pen.ellipse(hc[0], hc[1] + r * 0.62, r * 0.6, r * 0.32, BEARD)
    my = hc[1] + r * 0.46
    pen.ellipse(hc[0], my + 4, r * 0.17, r * (0.05 + 0.13 * talk), MOUTH)
    pen.rrect(hc[0] - r * 0.3, my - r * 0.13, hc[0] + r * 0.3, my - r * 0.02, 10, BEARD)
    pen.ellipse(hc[0], hc[1] + r * 0.2, r * 0.09, r * 0.07, SKIN_SH)
    # shemagh top framing the face
    mask = Image.new("L", pen.im.size, 0)
    md = ImageDraw.Draw(mask)
    md.chord(pen.box(hc[0] - r * 1.08, hc[1] - r * 1.15, hc[0] + r * 1.08, hc[1] + r * 0.75), 180, 360, fill=255)
    md.ellipse(pen.box(hc[0] - r * 1.08, hc[1] - r * 1.15, hc[0] + r * 1.08, hc[1] + r * 0.2), fill=255)
    md.ellipse(pen.box(hc[0] - r * 0.78, hc[1] - r * 0.62, hc[0] + r * 0.78, hc[1] + r * 1.2), fill=0)
    pen.im.paste(shemagh_tex(*pen.im.size), (0, 0), mask)
    # agal
    for dy in (0, 24):
        pen.ring(hc[0], hc[1] - r * 0.86 + dy, r * 0.92, r * 0.15, (22, 22, 22), 9)
    return pen.done(), {"head": (350, 900 + hc[1] - r * 1.15)}


# ----------------------------------------------------------------- backgrounds
def grad(w, h, top, bot):
    y = np.linspace(0, 1, h)[:, None, None]
    a = np.array(top, float)[None, None, :] * (1 - y) + np.array(bot, float)[None, None, :] * y
    return Image.fromarray(np.repeat(a, w, 1).astype(np.uint8), "RGB").convert("RGBA")


def soft_glow(size, box, color, blur):
    g = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse(box, fill=color)
    return g.filter(ImageFilter.GaussianBlur(blur))


@lru_cache(maxsize=None)
def bg_room():
    pen = Pen(W, H, 0, 0)
    pen.im.paste(grad(pen.im.width, pen.im.height, (243, 230, 210), (232, 214, 188)))
    for x in range(60, W, 240):
        pen.rrect(x, 260, x + 180, 1060, 12, (236, 222, 199))
    pen.rrect(-10, 1100, W + 10, 1140, 0, (205, 178, 140))
    pen.poly([(0, 1140), (W, 1140), (W, H), (0, H)], (200, 156, 112))
    for y in (1230, 1360, 1530, 1740):
        pen.rrect(0, y, W, y + 6, 0, (186, 142, 100))
    # window
    pen.rrect(650, 300, 960, 760, 18, (150, 108, 74))
    pen.im.paste(grad(int(270 * SS), int(420 * SS), (255, 160, 104), (255, 216, 156)), (int(670 * SS), int(320 * SS)))
    pen.circle(860, 640, 52, (255, 238, 190))
    pen.rrect(798, 320, 812, 740, 4, (150, 108, 74))
    pen.rrect(670, 524, 940, 538, 4, (150, 108, 74))
    # wall frame with simple calligraphy-like stroke
    pen.rrect(110, 380, 420, 620, 12, (190, 146, 70))
    pen.rrect(128, 398, 402, 602, 8, (30, 88, 98))
    pen.arc(265, 520, 95, 40, 200, 340, (236, 206, 140), 10)
    pen.circle(265, 495, 10, (236, 206, 140))
    # lamp
    pen.im.alpha_composite(soft_glow(pen.im.size, pen.box(-200, 350, 380, 950), (255, 196, 120, 110), 50 * SS))
    pen.rrect(102, 640, 114, 1300, 6, (60, 52, 48))
    pen.poly([(40, 560), (176, 560), (204, 670), (12, 670)], (255, 238, 205))
    pen.rrect(70, 1290, 146, 1310, 10, (60, 52, 48))
    # majlis seating
    pen.rrect(40, 860, 1040, 1150, 40, (44, 108, 114))
    pen.rrect(30, 1080, 1050, 1300, 40, (52, 124, 130))
    pen.rrect(30, 1250, 1050, 1300, 20, (40, 98, 104))
    pen.rrect(120, 900, 300, 1070, 36, (226, 170, 70))
    pen.rrect(780, 900, 960, 1070, 36, (150, 36, 48))
    # rug
    pen.poly([(130, 1500), (950, 1500), (1080, 1920), (0, 1920)], (150, 36, 48))
    pen.poly([(180, 1530), (900, 1530), (1010, 1900), (70, 1900)], (176, 58, 66))
    pen.poly([(540, 1600), (690, 1710), (540, 1820), (390, 1710)], (236, 200, 128))
    pen.poly([(540, 1650), (620, 1710), (540, 1770), (460, 1710)], (34, 64, 96))
    # coffee table + dallah
    pen.rrect(760, 1400, 1080, 1436, 10, (116, 80, 52))
    pen.rrect(780, 1436, 796, 1560, 6, (100, 68, 44))
    pen.rrect(1040, 1436, 1056, 1560, 6, (100, 68, 44))
    pen.poly([(855, 1400), (915, 1400), (902, 1330), (885, 1290), (868, 1330)], (220, 172, 60))
    pen.poly([(902, 1350), (950, 1316), (956, 1322), (908, 1362)], (220, 172, 60))
    pen.circle(885, 1286, 10, (220, 172, 60))
    for x in (980, 1020):
        pen.poly([(x - 15, 1400), (x + 15, 1400), (x + 11, 1376), (x - 11, 1376)], (250, 246, 238))
    return pen.done()


@lru_cache(maxsize=None)
def bg_shop():
    pen = Pen(W, H, 0, 0)
    pen.im.paste(grad(pen.im.width, pen.im.height, (204, 234, 226), (184, 220, 212)))
    pen.poly([(0, 1320), (W, 1320), (W, H), (0, H)], (236, 240, 243))
    for y in range(1320, H, 110):
        pen.rrect(0, y, W, y + 4, 0, (214, 220, 226))
    pen.rrect(200, 120, 880, 280, 24, (16, 96, 116))
    cols = [(232, 72, 80), (246, 168, 96), (48, 162, 146), (76, 128, 166), (252, 206, 102), (150, 204, 232), (238, 86, 120), (40, 200, 156)]
    rnd = np.random.default_rng(11)
    for x0 in (30, 560):
        pen.rrect(x0, 360, x0 + 490, 1320, 14, (245, 245, 245))
        pen.rrect(x0 + 420, 360, x0 + 490, 1320, 14, (226, 228, 232))
        for r in range(4):
            y = 580 + r * 230
            pen.rrect(x0 + 8, y, x0 + 482, y + 16, 4, (206, 208, 212))
            x = x0 + 22
            while x < x0 + 460:
                w = 38 + rnd.random() * 34
                h = 70 + rnd.random() * 90
                cc = cols[int(rnd.random() * len(cols))]
                pen.rrect(x, y - h, x + w, y, w / 2.6 if rnd.random() < 0.3 else 6, cc)
                pen.rrect(x + 5, y - h * 0.62, x + w - 5, y - h * 0.38, 3, (255, 255, 255, 160))
                pen.rrect(x + w * 0.7, y - h, x + w, y, 4, (0, 0, 0, 25))
                x += w + 10
    # bread counter (right)
    pen.rrect(560, 1180, 1060, 1640, 22, (176, 126, 82))
    pen.rrect(560, 1180, 1060, 1230, 18, (214, 176, 132))
    pen.rrect(980, 1230, 1060, 1640, 0, (156, 108, 68))
    for i in range(6):
        y = 1170 - i * 22
        pen.ellipse(700, y, 110, 18, (196, 132, 64))
        pen.ellipse(700, y - 4, 98, 12, (236, 190, 120))
    for i, (x, y) in enumerate(((870, 1150), (960, 1150), (915, 1095), (870, 1040), (960, 1040), (915, 990))):
        pen.rrect(x - 70, y - 28, x + 70, y + 28, 28, (234, 164, 76))
        pen.rrect(x - 56, y - 22, x + 50, y - 6, 10, (246, 196, 120))
        for k in range(3):
            pen.line([(x - 34 + k * 32, y + 10), (x - 18 + k * 32, y - 12)], (188, 116, 44), 6)
    for x in (690, 925):
        pen.rrect(x - 95, 1300, x + 95, 1380, 14, (255, 255, 255))
    im = pen.done()
    for txt, x, c, y, sz in (("بقالة الحي", 540, R.YELLOW, 200, 92), ("عيش", 690, (27, 127, 74), 1340, 50),
                             ("صامولي", 925, (192, 57, 43), 1340, 46)):
        t = R.text(txt, sz, c, "900")
        im.alpha_composite(t, (x - t.width // 2, y - t.height // 2))
    return im


def tile_layer(width, height, draw):
    pen = Pen(width, height, 0, 0)
    draw(pen, width, height)
    return pen.done()


@lru_cache(maxsize=None)
def street_layers():
    """Side-view street: (image, scroll factor) layers, each 2*W wide so it can wrap."""
    sky = grad(W, H, (110, 190, 236), (206, 234, 246))
    sky_pen = Pen(W, H, 0, 0)
    sky_pen.im.alpha_composite(soft_glow(sky_pen.im.size, sky_pen.box(700, 250, 1000, 550), (255, 246, 200, 230), 30))
    sky_pen.circle(850, 400, 70, (255, 248, 214))
    sky.alpha_composite(sky_pen.done())

    def far(pen, w, h):
        x = 0
        rnd = np.random.default_rng(2)
        while x < w:
            bw = 120 + rnd.random() * 160
            bh = 180 + rnd.random() * 260
            pen.rrect(x, 1040 - bh, x + bw, 1100, 6, (186, 210, 222))
            x += bw + 10
        pen.rrect(600, 640, 640, 1100, 10, (176, 202, 216))  # minaret
        pen.circle(620, 640, 34, (176, 202, 216))
        pen.rrect(1500, 700, 1540, 1100, 10, (176, 202, 216))
        pen.circle(1520, 700, 34, (176, 202, 216))

    def villas(pen, w, h):
        cols = [(236, 214, 178), (242, 226, 198), (226, 200, 162), (238, 220, 190)]
        x = 0
        i = 0
        while x < w:
            bw, bh = 420, 520 + (i % 2) * 90
            c = cols[i % 4]
            top = 1260 - bh
            pen.rrect(x, top, x + bw, 1300, 8, c)
            pen.rrect(x - 8, top - 26, x + bw + 8, top + 6, 6, (250, 244, 232))
            for wx in (x + 70, x + 250):
                pen.rrect(wx, top + 110, wx + 100, top + 250, 50, (120, 160, 182))
                pen.rrect(wx, top + 190, wx + 100, top + 250, 0, (120, 160, 182))
                pen.rrect(wx + 46, top + 110, wx + 54, top + 250, 2, (240, 236, 228))
            pen.rrect(x + bw - 40, top, x + bw, 1300, 0, (0, 0, 0, 18))
            x += bw + 60
            i += 1

    def wall(pen, w, h):
        x = 0
        i = 0
        while x < w:
            pen.rrect(x, 1180, x + 460, 1420, 6, (216, 190, 150))
            pen.rrect(x, 1170, x + 460, 1190, 4, (232, 210, 176))
            if i % 2 == 0:
                pen.rrect(x + 170, 1230, x + 290, 1420, 50, (120, 82, 52))
                pen.rrect(x + 170, 1290, x + 290, 1420, 0, (120, 82, 52))
            x += 470
            i += 1

    def palms(pen, w, h):
        for x in range(150, w, 520):
            base = 1440
            hgt = 760
            pts = [(x - 18, base), (x + 18, base), (x + 30, base - hgt), (x + 6, base - hgt)]
            pen.poly(pts, (140, 104, 66))
            for k in range(10):
                yy = base - k * hgt / 10
                pen.rrect(x - 20 + k * 1.2, yy - 6, x + 20 + k * 1.2, yy, 2, (120, 88, 56))
            cx, cy = x + 18, base - hgt
            for k in range(9):
                ang = math.pi * (0.05 + 0.9 * k / 8)
                L = 260
                ex = cx + L * math.cos(ang) * 1.15
                ey = cy - 40 + L * 0.55 * (1 - math.sin(ang)) + 30
                mid = (cx + (ex - cx) * 0.5, cy - 70 * math.sin(ang) - 10)
                pen.line([(cx, cy), mid, (ex, ey)], (58, 140, 70) if k % 2 else (72, 160, 82), 26)
            pen.circle(cx, cy, 22, (110, 80, 50))

    def ground(pen, w, h):
        pen.rrect(0, 1420, w, 1720, 0, (214, 206, 192))
        for x in range(0, w, 120):
            pen.rrect(x, 1420, x + 4, 1720, 0, (196, 188, 174))
        pen.rrect(0, 1420, w, 1440, 0, (196, 188, 174))
        pen.rrect(0, 1720, w, 1760, 0, (170, 164, 152))
        pen.rrect(0, 1760, w, H, 0, (92, 98, 108))
        for x in range(0, w, 260):
            pen.rrect(x, 1850, x + 140, 1866, 6, (240, 240, 240))

    layers = [(sky, 0.0)]
    for fn, f in ((far, 0.1), (villas, 0.35), (wall, 0.6), (palms, 0.8), (ground, 1.0)):
        layers.append((tile_layer(2 * W, H, fn), f))
    return layers


def street(offset):
    cv = street_layers()[0][0].copy()
    for im, f in street_layers()[1:]:
        x = -int(offset * f) % W
        cv.alpha_composite(im.crop((x, 0, x + W, H)))
    return cv


@lru_cache(maxsize=None)
def burst():
    pen = Pen(W, H, 0, 0)
    pen.im.paste(grad(pen.im.width, pen.im.height, (255, 214, 64), (255, 168, 40)))
    cx, cy = W / 2, H * 0.4
    for i in range(24):
        a0 = i / 24 * 2 * math.pi
        a1 = a0 + math.pi / 24
        pen.poly([(cx, cy), (cx + 3000 * math.cos(a0), cy + 3000 * math.sin(a0)),
                  (cx + 3000 * math.cos(a1), cy + 3000 * math.sin(a1))], (255, 232, 120))
    pen.im.alpha_composite(soft_glow(pen.im.size, pen.box(cx - 420, cy - 420, cx + 420, cy + 420), (255, 255, 230, 200), 60))
    return pen.done()


# ----------------------------------------------------------------- frames
def camera(img, zoom, cx, cy):
    w, h = W / zoom, H / zoom
    x0 = clamp(cx - w / 2, 0, img.width - w)
    y0 = clamp(cy - h / 2, 0, img.height - h)
    out = img.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((W, H), Image.BILINEAR)
    return out, (lambda p: [(p[0] - x0) * zoom, (p[1] - y0) * zoom])


def put(cv, sprite, ax, ay, anchor, scale=1.0, flip=False):
    """Place `sprite` so its anchor point (in sprite pixels) lands on (ax, ay)."""
    sw = sprite.width
    if flip:
        sprite = sprite.transpose(Image.FLIP_LEFT_RIGHT)
        anchor = (sw - anchor[0], anchor[1])
    if scale != 1.0:
        sprite = sprite.resize((int(sprite.width * scale), int(sprite.height * scale)), Image.LANCZOS)
    x, y = ax - anchor[0] * scale, ay - anchor[1] * scale
    cv.alpha_composite(sprite, (int(x), int(y)))
    return lambda p: (x + ((sw - p[0]) if flip else p[0]) * scale, y + p[1] * scale)


def frame(t):
    meta = {}
    name = next((n for a, b, n in SHOTS if a <= t < b), "surprise")
    a = next(a for a, b, n in SHOTS if n == name)
    lt = t - a
    if name in ("intro", "father"):
        cv = bg_room().copy()
        talking = name == "father" and 0.6 < lt < 2.8
        talk = max(0.0, 0.5 + 0.5 * math.sin(lt * 22) * math.sin(lt * 7.3)) if talking else 0.0
        gest = ease_out(prog(lt, 0.5, 0.35)) * (1 - ease_out(prog(lt, 2.9, 0.4))) if name == "father" else 0
        fs, finfo = father(talk=talk, gesture=gest, blink=1.0 if (t % 2.9) < 0.1 else 0.0,
                           nod=math.sin(lt * 5) if talking else 0)
        sc = 0.92
        mp_f = put(cv, fs, 600, 1570, (350, 900), sc)
        dad_head = mp_f(finfo["head"])
        nod = 12 * max(0, math.sin((lt - 3.2) * 9)) if name == "father" and 3.2 < lt < 4.0 else 0
        bs, _ = boy_side(smile=0.7)
        put(cv, bs, 170, 1880 + nod, (330, 960), 1.15)
        if name == "intro":
            out, mp = camera(cv, lerp(1.0, 1.04, lt / 2.2), 540, 960)
        else:
            z = lerp(1.0, 1.1, ease_in_out(prog(lt, 0, 4.8)))
            out, mp = camera(cv, z, 560, dad_head[1] + (960 - 820) / z)
            meta["dadHead"] = mp(dad_head)
    elif name == "shop":
        cv = bg_shop().copy()
        grabbed = lt > 1.15
        if grabbed:  # one flatbread fewer on the stack
            pen = Pen(260, 40, 130, 20)
            pen.ellipse(0, 0, 112, 20, (184, 220, 212))
            cv.alpha_composite(pen.done(), (700 - 130, 1170 - 5 * 22 - 24))
        turned = lt > 2.25
        walk_out = prog(lt, 2.6, 1.2)
        reach = ease_out(prog(lt, 0.55, 0.45)) * (1 - ease_out(prog(lt, 1.5, 0.45)))
        walking = walk_out > 0 or lt < 0.5
        bs, binfo = boy_side(walk=(lt * 9 if walking else None), reach=reach, bread=grabbed,
                             smile=1.0 if grabbed else 0.5, blink=(lt % 2.3) < 0.1)
        x = lerp(330, -260, walk_out) if turned else lerp(240, 330, ease_out(prog(lt, 0, 0.5)))
        mp_b = put(cv, bs, x, 1760, (330, 960), 1.25, flip=turned)
        out, mp = camera(cv, lerp(1.04, 1.0, ease_in_out(prog(lt, 0, 3.8))), 540, 960)
        meta["boyHead"] = mp(mp_b(binfo["head"]))
    elif name == "walk":
        cv = street(lt * 520)
        bs, binfo = boy_side(walk=lt * 8.5, whistle=True, bread=True, blink=(lt % 2.5) < 0.1)
        mp_b = put(cv, bs, 470, 1640 + 6 * math.sin(lt * 17), (330, 960), 1.3)
        out = cv
        meta["mouth"] = list(mp_b(binfo["mouth"]))
        meta["whistle"] = True
    else:
        cv = burst().copy()
        shock = ease_out(prog(lt, 0.05, 0.18))
        fs, finfo = boy_front(shock=shock, facepalm=ease_out(prog(lt, 0.3, 0.3)),
                              hop=40 * math.sin(clamp(lt / 0.25) * math.pi), smile=0.2)
        zm = ease_out(prog(lt, 0.0, 0.2))
        sc = lerp(1.6, 2.2, zm)
        shake = 14 * math.sin(lt * 60) * (1 - prog(lt, 0, 0.45))
        mp_b = put(cv, fs, 540 + shake, 1900 + 700 * sc - 700 * 1.6, (300, 960), sc)
        out = cv
        meta["boyHead"] = list(mp_b(finfo["head"]))
        meta["surprise"] = True
    return out.convert("RGB"), meta


def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    speed = float(sys.argv[sys.argv.index("--speed") + 1]) if "--speed" in sys.argv else 1.0
    only = "--only" in sys.argv
    if only:
        times = [float(x) for x in sys.argv[sys.argv.index("--only") + 1].split(",")]
    else:
        times = [i * speed / FPS for i in range(int(END / speed * FPS))]
    metas = []
    for i, t in enumerate(times):
        img, m = frame(t)
        img.save(os.path.join(out, f"t_{t:g}.jpg" if only else f"f_{i:05d}.jpg"), quality=94)
        metas.append({"t": t, **m})
        if i % 60 == 0:
            print("frame", i, len(times), flush=True)
    json.dump({"speed": speed, "frames": metas} if not only else metas, open(os.path.join(out, "meta.json"), "w"))


if __name__ == "__main__":
    main()
