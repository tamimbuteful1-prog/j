"""منهجي | الحلقة الثانية — 3D version of the reel.

Takes the rendered 3D frames (scene.html via render3d.js), adds the Arabic
overlays and sound, then appends Tamim's filmed hook and the motion-graphics
lesson (director scene onward).

Usage: python3 compose3d.py <frames_dir> <out.mp4> [--hook clip.mp4] [--mg-speed 1.8]
"""
import argparse
import json
import math
import os
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motion"))
import render as R  # noqa: E402

W, H, FPS, SR = R.W, R.H, R.FPS, R.SR
SHOTS = {"intro": (0.0, 2.2), "father": (2.2, 7.0), "shop": (7.0, 10.8), "walk": (10.8, 15.2), "surprise": (15.2, 18.6)}
END3D = 18.6


def shot_of(t):
    for name, (a, b) in SHOTS.items():
        if a <= t < b:
            return name, t - a
    return "surprise", t - SHOTS["surprise"][0]


def chip(cv, label, lt, y=300):
    R.chip(cv, label, lt, 0.1, 1.0, y=y)


def caption(cv, parts, lt, start, y, size=92):
    if lt >= start:
        R.place(cv, R.rich(parts, size, "900", stroke=9), W / 2, y, R.pop(lt, start, 0.3), 1.0)


def speech(text_parts, icons=False):
    msg = R.rich(text_parts, 82)
    w = max(msg.width + 120, 640)
    h = 300 if icons else 170
    b = R.bubble(w, h, tail="down").copy()
    b.alpha_composite(msg, ((w - msg.width) // 2, 18 if icons else (h - msg.height) // 2))
    return b


def thought_samoli():
    im = Image.new("RGBA", (360, 300), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((10, 10, 350, 230), fill=(255, 255, 255, 240))
    d.ellipse((60, 238, 100, 270), fill=(255, 255, 255, 240))
    d.ellipse((30, 272, 52, 292), fill=(255, 255, 255, 240))
    s = R.samoli(220)
    im.alpha_composite(s, ((360 - s.width) // 2, 120 - s.height // 2))
    return im


NOTE_GLYPHS = ["♪", "♫", "♪", "♬"]


def overlay(cv, t, meta):
    name, lt = shot_of(t)
    if name == "intro":
        cv.alpha_composite(Image.new("RGBA", (W, H), (9, 22, 38, 120)))
        R.place(cv, R.text("قد صار لك", 112, R.WHITE, "900", stroke=7), W / 2, 820, R.pop(lt, 0.15, 0.4), 1)
        q = R.rich((("هذا", R.WHITE), ("الموقف؟", R.YELLOW)), 156, "900", stroke=9)
        R.place(cv, q, W / 2, 1010, R.pop(lt, 0.5, 0.45), 1)
        if lt > 1.95:
            cv.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(220 * R.prog(lt, 1.95, 0.25)))))
    elif name == "father":
        if lt < 0.2:
            cv.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(220 * (1 - lt / 0.2)))))
        chip(cv, "أبوي في الصالة", lt)
        b = speech((("جيب عيش", R.NAVY), ("و", (214, 140, 0)), ("صامولي", R.NAVY)), icons=True)
        hx, hy = meta.get("dadHead", [W / 2, 700])
        cy = max(400 + b.height / 2, hy - b.height / 2 - 30)
        s = R.pop(lt, 0.6, 0.4)
        if s > 0:
            bb = b.copy()
            for x, st, im in ((bb.width * 0.68, 1.3, R.bread(120)), (bb.width * 0.32, 1.6, R.samoli(150))):
                k = R.pop(lt, st)
                if k > 0:
                    ic = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))))
                    bb.alpha_composite(ic, (int(x - ic.width / 2), int(205 - ic.height / 2)))
            R.place(cv, bb, W / 2, cy, s, 1)
    elif name == "shop":
        chip(cv, "في البقالة", lt)
        if lt >= 1.2:
            R.place(cv, R.pill("أخذت العيش", True, 52), W / 2, 1500, R.pop(lt, 1.2), 1)
    elif name == "walk":
        chip(cv, "راجع البيت…", lt)
        mx, my = meta.get("mouth", [W / 2, 700])
        for i in range(8):
            born = i * 0.5
            age = lt - born
            if 0 <= age < 1.8:
                k = age / 1.8
                x = mx + 60 + 160 * k + 25 * math.sin(age * 6 + i)
                y = my - 40 - 320 * k
                col = R.YELLOW if i % 2 else R.WHITE
                g = R.text(NOTE_GLYPHS[i % 4], 80, col + (255,), "sym", stroke=4)
                R.place(cv, g, x, y, 0.7 + 0.5 * R.ease_out(min(1, age / 0.3)), 1 - max(0, (k - 0.7) / 0.3), rot=15 * math.sin(age * 4))
    else:  # surprise
        hx, hy = meta.get("boyHead", [W / 2, 500])
        if lt < 0.12:
            cv.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(160 * (1 - lt / 0.12)))))
        ex = R.text("!", 260, R.YELLOW, "900", stroke=10)
        R.place(cv, ex, min(W - 130, hx + 250), hy - 20, R.pop(lt, 0.05, 0.3), 1, rot=-12 + 6 * math.sin(lt * 25) * (1 - R.prog(lt, 0, 0.6)))
        if lt >= 1.1:
            R.place(cv, thought_samoli(), 250, 420, R.pop(lt, 1.1, 0.4), 1)
            R.place(cv, R.badge(False, 110), 370, 360, R.pop(lt, 1.6), 1)
        caption(cv, (("جبت العيش…",  R.WHITE),), lt, 0.5, 1330, 96)
        caption(cv, (("ما جبت", R.RED), ("الصامولي!", R.WHITE)), lt, 1.4, 1470, 106)
        if lt > END3D - SHOTS["surprise"][0] - 0.2:
            cv.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(230 * R.prog(lt, 3.2, 0.2)))))


# ----------------------------------------------------------------- audio
def whistle(dur):
    notes = [(784, .3), (880, .3), (988, .45), (784, .3), (659, .3), (784, .3), (880, .6),
             (988, .3), (1047, .3), (988, .3), (880, .3), (784, .6), (0, .2)]
    n = int(dur * SR)
    f = np.zeros(n)
    amp = np.zeros(n)
    i = 0
    k = 0
    while i < n:
        hz, d = notes[k % len(notes)]
        j = min(n, i + int(d * SR))
        f[i:j] = hz if hz else (f[i - 1] if i else 784)
        a = np.ones(j - i) * (1.0 if hz else 0.0)
        r = min(len(a), int(0.03 * SR))
        if r:
            a[:r] *= np.linspace(0.3, 1, r)
            a[-r:] *= np.linspace(1, 0.3, r)
        amp[i:j] = a
        i = j
        k += 1
    sm = np.ones(int(0.025 * SR)) / int(0.025 * SR)  # portamento
    f = np.convolve(f, sm, mode="same")
    amp = np.convolve(amp, sm, mode="same")
    t = np.arange(n) / SR
    f = f * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    breath = np.random.default_rng(1).standard_normal(n) * 0.04
    return 0.2 * (tone + breath) * amp


def step():
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    noise = np.random.default_rng(2).standard_normal(n)
    lp = np.convolve(noise, np.ones(30) / 30, mode="same")
    return 0.5 * lp * np.exp(-t / 0.015) + 0.15 * np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.02)


def scratch():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 1400 * np.exp(-t * 7) + 150
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 28 * t)))
    noise = np.random.default_rng(4).standard_normal(n) * 0.3
    return 0.25 * (s + noise) * np.minimum(1, t / 0.005) * np.exp(-t / 0.18)


def build_audio(total, t_hook, hook_audio, t_mg, mg_len, path, mg_speed=1.0):
    n = int(total * SR)
    mix = np.zeros(n)

    def put(x, at, gain=1.0):
        i = int(at * SR)
        j = min(n, i + len(x))
        if j > i:
            mix[i:j] += gain * x[:j - i]

    # playful bed under the story, ducked while whistling, cut at the surprise
    bed = R.music(SHOTS["surprise"][0])
    a, b = int(SHOTS["walk"][0] * SR), int(SHOTS["walk"][1] * SR)
    bed[a:b] *= 0.35
    bed[-int(0.15 * SR):] *= np.linspace(1, 0, int(0.15 * SR))
    put(bed, 0, 0.8)
    put(R.synth("whoosh"), 0.0)
    put(R.synth("pop"), 0.15)
    put(R.synth("pop"), 0.5)
    put(R.synth("whoosh"), 1.95)
    f0 = SHOTS["father"][0]
    put(R.synth("pop"), f0 + 0.6)
    put(R.synth("pop"), f0 + 1.3)
    put(R.synth("pop"), f0 + 1.6)
    s0 = SHOTS["shop"][0]
    put(R.synth("whoosh"), s0 - 0.15)
    put(R.synth("ding"), s0 + 1.2)
    for k in range(4):
        put(step(), s0 + 2.65 + k * 0.37, 0.8)
    w0, w1 = SHOTS["walk"]
    put(whistle(w1 - w0), w0)
    st = w0
    while st < w1:
        put(step(), st, 0.8)
        st += math.pi / 8.5
    p0 = SHOTS["surprise"][0]
    put(scratch(), p0)
    put(R.synth("thud"), p0 + 0.05)
    put(R.synth("pop"), p0 + 1.1)
    put(R.synth("buzz"), p0 + 1.4)
    put(R.synth("whoosh"), END3D - 0.25)
    put(hook_audio, t_hook)
    m = R.music(mg_len)
    fi, fo = int(0.6 * SR), int(1.5 * SR)
    m[:fi] *= np.linspace(0, 1, fi)
    m[-fo:] *= np.linspace(1, 0, fo)
    put(m, t_mg)
    for t, kind in R.SFX:
        if t >= R.S2:
            put(R.synth(kind), t_mg + (t - R.S2) / mg_speed)
    mix /= max(1.0, np.abs(mix).max() / 0.95)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.stack([mix, mix], 1) * 32767).astype(np.int16).tobytes())


def clip_frames(path):
    vf = f"fps={FPS},scale={W}:{H}"
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         stdout=subprocess.PIPE)
    size = W * H * 3
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield buf
    p.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frames_dir")
    ap.add_argument("out")
    ap.add_argument("--hook", help="filmed hook clip to play between the story and the lesson")
    ap.add_argument("--mg-speed", type=float, default=1.0, help="speed-up factor for the motion-graphics lesson")
    a = ap.parse_args()
    frames_dir, hook, out, speed = a.frames_dir, a.hook, a.out, a.mg_speed
    meta = json.load(open(os.path.join(frames_dir, "meta.json")))
    hook_dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                              "-of", "csv=p=0", hook])) if hook else 0.0
    t_hook = END3D
    t_mg = t_hook + hook_dur
    mg_len = (R.END - R.S2) / speed
    total = t_mg + mg_len

    tmp_v = out + ".video.mp4"
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "medium",
                            "-pix_fmt", "yuv420p", tmp_v], stdin=subprocess.PIPE)
    for i, m in enumerate(meta):
        cv = Image.open(os.path.join(frames_dir, f"f_{i:05d}.jpg")).convert("RGBA")
        overlay(cv, m["t"], m)
        enc.stdin.write(cv.convert("RGB").tobytes())
        if i % 90 == 0:
            print("3d", i, len(meta), flush=True)
    if hook:
        for buf in clip_frames(hook):
            enc.stdin.write(buf)
    for i in range(int(mg_len * FPS)):
        enc.stdin.write(R.frame(R.S2 + i * speed / FPS).tobytes())
    enc.stdin.close()
    enc.wait()

    hook_audio = np.zeros(0)
    if hook:
        raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", hook, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"])
        hook_audio = np.frombuffer(raw, np.int16).astype(float) / 32768
    wav = out + ".audio.wav"
    build_audio(total, t_hook, hook_audio, t_mg, mg_len, wav, speed)
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", tmp_v, "-i", wav, "-map", "0:v", "-map", "1:a",
                           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out])
    os.remove(tmp_v)
    os.remove(wav)
    print("done", out, f"{total:.1f}s")


if __name__ == "__main__":
    main()
