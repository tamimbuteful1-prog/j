"""منهجي | الحلقة الثانية — realistic version of the reel.

Timeline:
  intro card "قد صار لك هذا الموقف؟"  ->  father in the living room (AI clip)
  ->  walking back whistling, then the "I forgot!" moment (AI clip)
  ->  Tamim's filmed hook  ->  the motion-graphics lesson (director scene onward).

Usage:
  python3 assemble_realistic.py --father father.mp4 --walk walk.mp4 --hook reel_hook_9x16.mp4 \
      --out out.mp4 [--line-at 0.9] [--surprise-at 2.2]
"""
import argparse
import os
import subprocess
import wave

import numpy as np
from PIL import Image, ImageFilter

import render as R

W, H, FPS, SR = R.W, R.H, R.FPS, R.SR
INTRO = 2.0


def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", path]))


def frames(path):
    """Yield the clip as 1080x1920 RGB frames at FPS (cover-cropped)."""
    vf = f"fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}"
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    size = W * H * 3
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield Image.frombytes("RGB", (W, H), buf)
    p.wait()


def audio(path):
    try:
        raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                                       "-f", "s16le", "-"])
    except subprocess.CalledProcessError:
        return np.zeros(0)
    return np.frombuffer(raw, np.int16).astype(float) / 32768


def caption(cv, parts, t, start, y=1380, size=92, end=None):
    if t < start or (end is not None and t >= end):
        return
    im = R.rich(parts, size, "900", stroke=9)
    R.place(cv, im, W / 2, y, R.pop(t, start, 0.3), 1.0)


def tag(cv, label, t, start=0.0, y=300):
    R.chip(cv, label, t, start, 1.0, y=y)


def punch(img, t, start, amount=0.12):
    """Quick zoom punch-in at the surprise moment."""
    if t < start:
        return img
    k = 1 + amount * R.ease_out(R.prog(t, start, 0.25))
    w, h = int(W / k), int(H / k)
    x, y = (W - w) // 2, int((H - h) * 0.4)
    return img.crop((x, y, x + w, y + h)).resize((W, H), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--father", required=True)
    ap.add_argument("--walk", required=True)
    ap.add_argument("--hook", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--line-at", type=float, default=0.9, help="when the father starts the line (s into clip)")
    ap.add_argument("--surprise-at", type=float, default=2.2, help="when he stops and remembers (s into clip)")
    a = ap.parse_args()

    d_father, d_walk, d_hook = duration(a.father), duration(a.walk), duration(a.hook)
    t_father = INTRO
    t_walk = t_father + d_father
    t_hook = t_walk + d_walk
    t_mg = t_hook + d_hook
    mg_len = R.END - R.S2
    total = t_mg + mg_len

    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "medium",
                            "-pix_fmt", "yuv420p", a.out + ".video.mp4"], stdin=subprocess.PIPE)

    def emit(img):
        enc.stdin.write(img.convert("RGB").tobytes())

    # 1) intro over a blurred, darkened first frame of the father clip
    first = next(frames(a.father))
    base = first.filter(ImageFilter.GaussianBlur(18))
    base = Image.blend(base, Image.new("RGB", (W, H), R.NAVY), 0.55).convert("RGBA")
    for i in range(int(INTRO * FPS)):
        t = i / FPS
        cv = base.copy()
        R.place(cv, R.text("قد صار لك", 110, R.WHITE, "900", stroke=6), W / 2, 820, R.pop(t, 0.1, 0.4), 1)
        q = R.rich((("هذا", R.WHITE), ("الموقف؟", R.YELLOW)), 150, "900", stroke=8)
        R.place(cv, q, W / 2, 1010, R.pop(t, 0.45, 0.45), 1)
        if t > INTRO - 0.25:
            cv.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(200 * R.prog(t, INTRO - 0.25, 0.25)))))
        emit(cv)

    # 2) father
    for i, fr in enumerate(frames(a.father)):
        t = i / FPS
        cv = fr.convert("RGBA")
        tag(cv, "أبوي", t, 0.0)
        caption(cv, (("جيب عيش", R.WHITE), ("و", R.YELLOW), ("صامولي", R.WHITE)), t, a.line_at)
        emit(cv)

    # 3) walking back whistling -> the surprise
    for i, fr in enumerate(frames(a.walk)):
        t = i / FPS
        cv = punch(fr, t, a.surprise_at).convert("RGBA")
        if t < a.surprise_at:
            tag(cv, "راجع من البقالة…", t, 0.0)
            caption(cv, (("♪", R.YELLOW), ("جبت العيش", R.WHITE), ("♪", R.YELLOW)), t, 0.3)
        else:
            caption(cv, (("لحظة!", R.YELLOW),), t, a.surprise_at, y=520, size=110)
            caption(cv, (("جبت العيش…", R.WHITE),), t, a.surprise_at + 0.2, y=1300, size=88)
            caption(cv, (("ما جبت", R.RED), ("الصامولي!", R.WHITE)), t, a.surprise_at + 0.8, y=1430, size=100)
        emit(cv)

    # 4) Tamim's filmed hook (already captioned)
    for fr in frames(a.hook):
        emit(fr)

    # 5) motion graphics from the director scene onward
    for i in range(int(mg_len * FPS)):
        emit(R.frame(R.S2 + i / FPS))
    enc.stdin.close()
    enc.wait()

    # audio: clip sound + hook voice + music bed and sfx under the lesson
    n = int(total * SR)
    mix = np.zeros(n)

    def put(x, at, gain=1.0):
        i = int(at * SR)
        j = min(n, i + len(x))
        if j > i:
            mix[i:j] += gain * x[:j - i]

    put(R.synth("whoosh"), 0.0)
    put(R.synth("pop"), 0.1)
    put(R.synth("pop"), 0.45)
    put(R.synth("whoosh"), INTRO - 0.3)
    put(audio(a.father), t_father)
    put(audio(a.walk), t_walk)
    put(R.synth("thud"), t_walk + a.surprise_at)
    put(R.synth("buzz"), t_walk + a.surprise_at + 0.8)
    put(audio(a.hook), t_hook)
    m = R.music(mg_len)
    fi, fo = int(0.6 * SR), int(1.5 * SR)
    m[:fi] *= np.linspace(0, 1, fi)
    m[-fo:] *= np.linspace(1, 0, fo)
    put(m, t_mg)
    for t, kind in R.SFX:
        if t >= R.S2:
            put(R.synth(kind), t_mg + t - R.S2)
    mix /= max(1.0, np.abs(mix).max() / 0.95)
    wav = a.out + ".audio.wav"
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.stack([mix, mix], 1) * 32767).astype(np.int16).tobytes())

    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", a.out + ".video.mp4", "-i", wav, "-map", "0:v",
                           "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                           "-shortest", a.out])
    os.remove(a.out + ".video.mp4")
    os.remove(wav)
    print("done", a.out, f"{total:.1f}s")


if __name__ == "__main__":
    main()
