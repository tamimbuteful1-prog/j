"""منهجي | الحلقة الثانية — fast 2D reel with an upbeat track.

Timeline: filmed intro clip -> 2D story (sped up) -> motion-graphics lesson (sped up),
with one energetic beat running under the story and the lesson.

Usage: python3 compose2d.py <frames_dir> <intro_clip.mp4> <out.mp4> [--mg-speed 2.4]
The story speed comes from the frames' meta.json (render2d.py --speed).
"""
import argparse
import json
import math
import os
import subprocess
import sys
import wave

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "motion"))
sys.path.insert(0, os.path.join(HERE, "..", "motion3d"))
import render as R  # noqa: E402
import compose3d as C  # noqa: E402

W, H, FPS, SR = R.W, R.H, R.FPS, R.SR
SKIP = C.SHOTS["father"][0]  # the filmed clip replaces the story's intro card


# ----------------------------------------------------------------- music
def edm(dur, bpm=128):
    """Upbeat four-on-the-floor track: kick, clap, hats, pumping bass, bright pluck arpeggio."""
    n = int(dur * SR)
    out = np.zeros(n)
    beat = 60 / bpm
    rng = np.random.default_rng(7)
    chords = [(220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (261.6, 329.6, 392.0), (196.0, 246.9, 293.7)]  # Am F C G
    roots = [55.0, 43.65, 65.41, 49.0]

    def add(x, at, gain):
        i = int(at * SR)
        j = min(n, i + len(x))
        if j > i:
            out[i:j] += gain * x[:j - i]

    tk = np.arange(int(0.3 * SR)) / SR
    kick = np.sin(2 * np.pi * np.cumsum(50 + 130 * np.exp(-tk * 35)) / SR) * np.exp(-tk / 0.16)
    kick += 0.3 * rng.standard_normal(len(tk)) * np.exp(-tk / 0.004)
    tc = np.arange(int(0.2 * SR)) / SR
    noise = rng.standard_normal(len(tc))
    hp = noise - np.convolve(noise, np.ones(6) / 6, mode="same")
    clap = hp * (np.exp(-tc / 0.08) + 0.6 * np.exp(-np.maximum(0, tc - 0.012) / 0.05) * (tc > 0.012))
    th = np.arange(int(0.06 * SR)) / SR
    hn = rng.standard_normal(len(th))
    hat = (hn - np.convolve(hn, np.ones(3) / 3, mode="same")) * np.exp(-th / 0.018)
    ohat = (hn - np.convolve(hn, np.ones(3) / 3, mode="same")) * np.exp(-th / 0.045)

    nbeats = int(dur / beat) + 1
    for b in range(nbeats):
        t0 = b * beat
        add(kick, t0, 0.9)
        if b % 2 == 1:
            add(clap, t0, 0.35)
        add(ohat, t0 + beat / 2, 0.22)
        for q in (0.25, 0.75):
            add(hat, t0 + beat * q, 0.1)
    # bass (offbeat 8ths) and pluck arpeggio (16ths)
    tb = np.arange(int(beat / 2 * SR)) / SR
    tp = np.arange(int(0.18 * SR)) / SR
    arp = [0, 1, 2, 1, 2, 0, 1, 2]
    for s16 in range(nbeats * 4):
        t0 = s16 * beat / 4
        bar = int(t0 / (beat * 4)) % 4
        if s16 % 2 == 1:
            f = roots[bar] * 2
            saw = sum(np.sin(2 * np.pi * f * k * tb) / k for k in range(1, 7))
            add(saw * np.exp(-tb / 0.12) * np.minimum(1, tb / 0.004), t0, 0.16)
        f = chords[bar][arp[s16 % 8]] * 2
        sq = np.tanh(3 * np.sin(2 * np.pi * f * tp)) + 0.4 * np.sin(2 * np.pi * 2 * f * tp)
        add(sq * np.exp(-tp / 0.06), t0, 0.05)
    # sidechain pump on everything but the kick is approximated by a global pump
    t = np.arange(n) / SR
    pump = 1 - 0.35 * np.exp(-(t % beat) / 0.09)
    out *= pump
    return out / max(1e-6, np.abs(out).max())


def fast_whistle(dur, k):
    """The story's whistle melody, played k times faster."""
    w = C.whistle(dur * k)
    idx = np.clip((np.arange(int(dur * SR)) * k).astype(int), 0, len(w) - 1)
    return w[idx]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frames_dir")
    ap.add_argument("intro")
    ap.add_argument("out")
    ap.add_argument("--mg-speed", type=float, default=2.4)
    a = ap.parse_args()
    meta = json.load(open(os.path.join(a.frames_dir, "meta.json")))
    k, frames = meta["speed"], meta["frames"]
    m = a.mg_speed

    intro_dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                               "-of", "csv=p=0", a.intro]))
    story = [(i, f) for i, f in enumerate(frames) if f["t"] >= SKIP]
    t_story = intro_dur
    t_mg = t_story + len(story) / FPS
    mg_len = (R.END - R.S2) / m
    total = t_mg + mg_len

    def story_at(st):
        return t_story + (st - SKIP) / k

    tmp_v = a.out + ".video.mp4"
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "medium",
                            "-pix_fmt", "yuv420p", tmp_v], stdin=subprocess.PIPE)
    for buf in C.clip_frames(a.intro):
        enc.stdin.write(buf)
    for i, f in story:
        cv = Image.open(os.path.join(a.frames_dir, f"f_{i:05d}.jpg")).convert("RGBA")
        C.overlay(cv, f["t"], f)
        enc.stdin.write(cv.convert("RGB").tobytes())
    for i in range(int(mg_len * FPS)):
        enc.stdin.write(R.frame(R.S2 + i * m / FPS).tobytes())
    enc.stdin.close()
    enc.wait()

    # ---------------- audio
    n = int(total * SR)
    mix = np.zeros(n)

    def put(x, at, gain=1.0):
        i = int(at * SR)
        j = min(n, i + len(x))
        if j > i:
            mix[i:j] += gain * x[:j - i]

    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", a.intro, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"])
    put(np.frombuffer(raw, np.int16).astype(float) / 32768, 0, 1.6)

    music = edm(total - t_story)
    env = np.ones(len(music))
    w0, w1 = story_at(C.SHOTS["walk"][0]) - t_story, story_at(C.SHOTS["walk"][1]) - t_story
    env[int(w0 * SR):int(w1 * SR)] = 0.55  # let the whistle through
    p0 = story_at(C.SHOTS["surprise"][0]) - t_story
    drop = np.linspace(0, 1, int(0.5 * SR))
    env[int(p0 * SR):int(p0 * SR) + len(drop)] *= drop  # comedic drop at the surprise
    fo = int(1.2 * SR)
    env[-fo:] *= np.linspace(1, 0, fo)
    put(music * env, t_story, 0.5)

    f0, s0 = C.SHOTS["father"][0], C.SHOTS["shop"][0]
    put(R.synth("whoosh"), t_story - 0.15)
    for st in (f0 + 0.6, f0 + 1.3, f0 + 1.6):
        put(R.synth("pop"), story_at(st))
    put(R.synth("whoosh"), story_at(s0) - 0.1)
    put(R.synth("ding"), story_at(s0 + 1.2))
    for j in range(4):
        put(C.step(), story_at(s0 + 2.65 + j * 0.37), 0.8)
    wa, wb = C.SHOTS["walk"]
    put(fast_whistle(w1 - w0, k), story_at(wa), 1.1)
    st = wa
    while st < wb:
        put(C.step(), story_at(st), 0.8)
        st += math.pi / 8.5
    ps = C.SHOTS["surprise"][0]
    put(C.scratch(), story_at(ps))
    put(R.synth("thud"), story_at(ps + 0.05))
    put(R.synth("pop"), story_at(ps + 1.1))
    put(R.synth("buzz"), story_at(ps + 1.4))
    put(R.synth("whoosh"), t_mg - 0.2)
    for t, kind in R.SFX:
        if t >= R.S2:
            put(R.synth(kind), t_mg + (t - R.S2) / m, 0.8)

    mix /= max(1.0, np.abs(mix).max() / 0.95)
    wav = a.out + ".audio.wav"
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.stack([mix, mix], 1) * 32767).astype(np.int16).tobytes())
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", tmp_v, "-i", wav, "-map", "0:v", "-map", "1:a",
                           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", a.out])
    os.remove(tmp_v)
    os.remove(wav)
    print("done", a.out, f"{total:.1f}s")


if __name__ == "__main__":
    main()
