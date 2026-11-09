"""Composite the storyboard into a 1080x1920 vertical MP4 (phone frame, captions, taps, zooms)."""
import json, math, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

P, OUTFILE = sys.argv[1], sys.argv[2]
D = f'out/{P}'
FPS = 30
W, H = 1080, 1920
board = json.load(open(f'{D}/board.json'))

# phone geometry
S = 1.55
SW, SH = round(390 * S), round(844 * S)          # web content 605x1308
STATUS, URLB = round(30 * S), round(40 * S)
BEZ = 16
PW, PH = SW + 2 * BEZ, STATUS + URLB + SH + 2 * BEZ
PX, PY = (W - PW) // 2, 380
CX0, CY0 = PX + BEZ, PY + BEZ + STATUS + URLB    # content origin
SRC_W, SRC_H = 1170, 2532                         # DPR 3 screenshots

inter = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
f_url = ImageFont.truetype(inter, 25)
f_status = ImageFont.truetype(inter, 24)

def bg():
    g = Image.new('RGB', (W, H), '#f3eee5')
    d = ImageDraw.Draw(g)
    for y in range(H):
        t = y / H
        c = tuple(int(a + (b - a) * t) for a, b in zip((250, 247, 241), (233, 224, 207)))
        d.line([(0, y), (W, y)], fill=c)
    # soft shadow for the phone
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((PX + 10, PY + 30, PX + PW - 10, PY + PH + 20), 70, fill=120)
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    g.paste(Image.new('RGB', (W, H), (120, 100, 80)), (0, 0), sh)
    d = ImageDraw.Draw(g)
    d.rounded_rectangle((PX, PY, PX + PW, PY + PH), 66, fill='#15120f')
    return g
BG = bg()
MASK = Image.new('L', (SW, STATUS + URLB + SH), 0)
ImageDraw.Draw(MASK).rounded_rectangle((0, 0, SW, STATUS + URLB + SH), 52, fill=255)

def chrome(url):
    im = Image.new('RGB', (SW, STATUS + URLB), '#f7f7f7')
    d = ImageDraw.Draw(im)
    d.text((40, STATUS // 2 + 2), '9:41', font=f_status, fill='#111', anchor='lm')
    # battery + signal (generic)
    bx = SW - 70
    d.rounded_rectangle((bx, 16, bx + 38, 34), 5, outline='#111', width=2)
    d.rectangle((bx + 4, 20, bx + 30, 30), fill='#111')
    for i in range(4):
        d.rectangle((bx - 60 + i * 9, 32 - i * 5, bx - 54 + i * 9, 34), fill='#111')
    d.rounded_rectangle((18, STATUS + 6, SW - 18, STATUS + URLB - 8), 22, fill='#e9e9eb')
    while d.textlength(url, font=f_url) > SW - 120 and len(url) > 10:
        url = url[:-2].rstrip('/') + '…' if not url.endswith('…') else url[:-2] + '…'
    tw = d.textlength(url, font=f_url)
    tx = max(60, (SW - tw) / 2 + 12)
    # lock icon
    lx = tx - 26; ly = STATUS + URLB // 2 - 1
    d.rounded_rectangle((lx, ly - 4, lx + 15, ly + 10), 3, fill='#555')
    d.arc((lx + 2, ly - 14, lx + 13, ly + 2), 180, 360, fill='#555', width=3)
    d.text((tx, ly + 3), url, font=f_url, fill='#222', anchor='lm')
    return im

src_cache, cap_cache, chrome_cache = {}, {}, {}
def src(p):
    if p not in src_cache:
        if len(src_cache) > 12: src_cache.clear()
        src_cache[p] = Image.open(f'{D}/{p}').convert('RGB')
    return src_cache[p]
def cap(p):
    if p not in cap_cache: cap_cache[p] = Image.open(f'{D}/{p}').convert('RGBA')
    return cap_cache[p]
def chrome_img(u):
    if u not in chrome_cache: chrome_cache[u] = chrome(u)
    return chrome_cache[u]

view_cache = {}
def view(imgp, zx, zy, zs):
    """Return SWxSH content for zoom centred on css (zx,zy) at scale zs, plus the crop box."""
    cw, ch = SRC_W / zs, SRC_H / zs
    x0 = min(max(zx * 3 - cw / 2, 0), SRC_W - cw)
    y0 = min(max(zy * 3 - ch / 2, 0), SRC_H - ch)
    key = (imgp, round(x0), round(y0), round(zs, 3))
    if key not in view_cache:
        if len(view_cache) > 40: view_cache.clear()
        im = src(imgp).resize((SW, SH), Image.LANCZOS if abs(zs - 1) < 1e-3 else Image.BILINEAR,
                              box=(x0, y0, x0 + cw, y0 + ch))
        view_cache[key] = im
    return view_cache[key], (x0, y0, cw, ch)

def ease(t): return 1 - (1 - t) ** 3

ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
                       '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', OUTFILE], stdin=subprocess.PIPE)
def emit(im, n=1):
    b = im.tobytes()
    for _ in range(n): ff.stdin.write(b)

# progress bar
def progress(d, step, frac=1.0):
    n = 10; gap = 10; x0, x1, y = 120, W - 120, 1878
    seg = (x1 - x0 - gap * (n - 1)) / n
    for i in range(n):
        # RTL: step 1 on the right
        xr = x1 - i * (seg + gap); xl = xr - seg
        col = '#e45c28' if i + 1 < step else ('#e45c28' if i + 1 == step else '#d9cfbf')
        d.rounded_rectangle((xl, y, xr, y + 10), 5, fill='#d9cfbf')
        if i + 1 < step: d.rounded_rectangle((xl, y, xr, y + 10), 5, fill='#e45c28')
        elif i + 1 == step: d.rounded_rectangle((xr - seg * frac, y, xr, y + 10), 5, fill='#e45c28')

# --- title card
title = Image.open(f'{D}/title.png').convert('RGB')
emit(title, int(3.2 * FPS))

prev_frame = None
cur = [195.0, 422.0, 1.0]   # current zoom (css cx, cy, scale)
prev_cap = None; cap_t = 99
prev_scene = None
step_frames = {}
for f in board: step_frames[f['caption']['step']] = step_frames.get(f['caption']['step'], 0) + max(1, round(f['dur'] * FPS))
step_done = {}

first = True
for idx, f in enumerate(board):
    nf = max(1, round(f['dur'] * FPS))
    scene = (f['mode'], f['url'].split('/')[0])
    xfade = 10 if (prev_frame is not None and scene != prev_scene) else 0
    if first: xfade = 12
    prev_scene = scene
    z = f['zoom']
    if z and (f['mode'] == 'doc' or 'Continue' in f['caption']['title']):
        z = {'x': 195.0, 'y': z['y'], 's': 1.15 if f['mode'] == 'doc' else 1.3}
    tgt = (z['x'], z['y'], z['s']) if z else (195.0, 422.0, 1.0)
    if f['kind'] != 'still' or scene != (prev_scene if False else scene) and False: pass
    for k in range(nf):
        # smooth zoom follow
        a = 0.16
        for j in range(3): cur[j] += (tgt[j] - cur[j]) * a
        if f['kind'] != 'still' and not f['zoom']: cur[:] = [195.0, 422.0, 1.0]
        if xfade and k == 0 and not f['zoom']: cur[:] = list(tgt)
        content, (x0, y0, cw, ch) = view(f['img'], cur[0], cur[1], cur[2])
        fr = BG.copy()
        screen = Image.new('RGB', (SW, STATUS + URLB + SH))
        screen.paste(chrome_img(f['url'] or 'tamimimpact.com'), (0, 0))
        screen.paste(content, (0, STATUS + URLB))
        # tap marker
        if f['tap']:
            tx = (f['tap'][0] * 3 - x0) / cw * SW
            ty = (f['tap'][1] * 3 - y0) / ch * SH + STATUS + URLB
            t = k / FPS; T = nf / FPS
            ov = Image.new('RGBA', screen.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
            appear = min(1, t / 0.25)
            press = max(0.0, (t - (T - 0.5)) / 0.5)
            r = 34 * (1 - 0.2 * math.sin(min(press, 1) * math.pi))
            od.ellipse((tx - r, ty - r, tx + r, ty + r), fill=(28, 26, 23, int(95 * appear)), outline=(255, 255, 255, int(220 * appear)), width=4)
            if press > 0:
                R = 34 + 60 * ease(press)
                od.ellipse((tx - R, ty - R, tx + R, ty + R), outline=(228, 92, 40, int(255 * (1 - press))), width=7)
            screen = Image.alpha_composite(screen.convert('RGBA'), ov).convert('RGB')
        fr.paste(screen, (CX0, PY + BEZ), MASK)
        # caption with fade-in when it changes
        if f['cap'] != prev_cap:
            prev_cap_img = prev_cap; prev_cap = f['cap']; cap_t = 0
        ci = cap(f['cap'])
        if cap_t < 8:
            al = ease(cap_t / 8)
            c2 = ci.copy(); c2.putalpha(c2.getchannel('A').point(lambda v: int(v * al)))
            fr.paste(c2, (0, int(8 * (1 - al))), c2)
        else:
            fr.paste(ci, (0, 0), ci)
        cap_t += 1
        st = f['caption']['step']
        step_done[st] = step_done.get(st, 0) + 1
        progress(ImageDraw.Draw(fr), st, step_done[st] / step_frames[st])
        if xfade and k < xfade and prev_frame is not None:
            fr = Image.blend(prev_frame, fr, ease((k + 1) / (xfade + 1)))
        if k == nf - 1 or True:
            last = fr
        emit(fr)
    prev_frame = last
    first = False

end = Image.open(f'{D}/end.png').convert('RGB')
for k in range(12): emit(Image.blend(prev_frame, end, ease((k + 1) / 13)))
emit(end, int(4.0 * FPS))
ff.stdin.close(); ff.wait()
print('done', OUTFILE)
