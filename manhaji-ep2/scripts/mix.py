"""Builds the full soundtrack for منهجي EP2 (العبارات الشرطية).

1. Edits the narration: keeps only timeline.json "segments" of the original
   recording (silences / breath / false start removed, words untouched,
   no speed change) with short crossfades at every cut.
2. Cleans and levels the narration and the intro clip's own audio.
3. Synthesises an original music bed (120 BPM) that follows the story
   (tape-stop on «بس لحظة!», tension bed during the accident, resolve at the end)
   and a small set of original SFX, placed on the cue times.
4. Ducks the music under speech and masters to -14 LUFS.

Usage: python3 -I scripts/mix.py   (run from the project root)
Outputs: public/audio/mix.wav  (+ stems in build/)
"""
import json, os, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
BUILD = os.path.join(ROOT, "build")
os.makedirs(BUILD, exist_ok=True)
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
RNG = np.random.default_rng(7)


# ---------------------------------------------------------------- helpers
def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def read_wav(path):
    w = wave.open(path)
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if w.getnchannels() == 2:
        x = x.reshape(-1, 2).mean(1)
    return x


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    w = wave.open(path, "wb")
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())
    w.close()


def decode(src, dst, filters="anull"):
    ff("-i", src, "-vn", "-af", filters, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", dst)
    return read_wav(dst)


def out_time(t):
    """original-voice seconds -> output seconds"""
    pos = TL["voiceStart"]
    for a, b in TL["segments"]:
        if t <= b:
            return pos + max(0.0, t - a)
        pos += b - a
    return pos


def cue(name):
    return out_time(TL["cues"][name])


TOTAL = TL["voiceStart"] + sum(b - a for a, b in TL["segments"]) + TL["tail"]
N = int(TOTAL * SR) + SR


def place(buf, x, t, gain=1.0):
    i = int(round(t * SR))
    if i < 0:
        x = x[-i:]; i = 0
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[: j - i] * gain


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def fft_filter(x, lo=None, hi=None):
    """zero-phase brickwall-ish band filter with soft edges (FFT)"""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, n)


def sweep_filter(x, f0, f1, q=1.2, hop=512):
    """band-pass whose centre glides f0->f1 (overlap-add STFT)"""
    win = np.hanning(hop * 2)
    out = np.zeros(len(x) + hop * 2)
    nfr = max(1, (len(x) - hop * 2) // hop + 1)
    f = np.fft.rfftfreq(hop * 2, 1 / SR)
    for k in range(nfr):
        seg = x[k * hop: k * hop + hop * 2]
        if len(seg) < hop * 2:
            seg = np.pad(seg, (0, hop * 2 - len(seg)))
        c = f0 * (f1 / f0) ** (k / max(1, nfr - 1))
        g = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / c) / q) ** 2)
        out[k * hop: k * hop + hop * 2] += np.fft.irfft(np.fft.rfft(seg * win) * g, hop * 2)
    return out[: len(x)]


def noise(n):
    return RNG.standard_normal(n).astype(np.float64)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- SFX
def sfx_whoosh(dur=0.45, f0=300, f1=4000, peak=0.6):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    e = np.sin(np.pi * t ** peak) ** 2
    return sweep_filter(noise(n), f0, f1, q=0.9) * e * 0.9


def sfx_swish(dur=0.22):
    return sfx_whoosh(dur, 1200, 6000, 0.45) * 0.7


def sfx_pop(f=520):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-t / 0.012))) / SR
    return np.sin(ph) * env_exp(n, 0.03) * 0.8


def sfx_click():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 3200 * t) * 0.5 + fft_filter(noise(n), 2000, 9000) * 0.25) * env_exp(n, 0.004)


def sfx_tick():
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1900 * t) + 0.5 * np.sin(2 * np.pi * 4100 * t)) * env_exp(n, 0.008) * 0.45


def sfx_ding(f=1318.5):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    parts = [(1, 1, 0.9), (2.0, 0.35, 0.5), (2.76, 0.2, 0.35), (4.07, 0.1, 0.2)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in parts)
    return x * np.minimum(1, t / 0.002) * 0.35


def sfx_impact(dur=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t / 0.05)) / SR) * env_exp(n, 0.28)
    crack = fft_filter(noise(n), 80, 2500) * env_exp(n, 0.05) * 0.5
    return np.tanh((body + crack) * 1.4) * 0.8


def sfx_riser(dur=0.9):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = sweep_filter(noise(n), 400, 7000, q=0.7) * t ** 2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * t ** 2) / SR) * t ** 3 * 0.25
    return (nz * 0.8 + tone)


def sfx_freeze():
    """'time stop' zap: falling tone + reversed shimmer"""
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    zap = np.sin(2 * np.pi * np.cumsum(1400 * np.exp(-t / 0.12) + 60) / SR) * env_exp(n, 0.2) * 0.45
    shimmer = fft_filter(noise(n), 4000, 12000) * env_exp(n, 0.08) * 0.25
    return zap + shimmer


def sfx_check():
    a = np.zeros(int(0.35 * SR))
    for k, f in enumerate([1046.5, 1568.0]):
        n = int(0.25 * SR); t = np.arange(n) / SR
        tone = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env_exp(n, 0.07)
        a[int(k * 0.07 * SR): int(k * 0.07 * SR) + n] += tone * 0.3
    return a


def sfx_thud():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t / 0.03)) / SR) * env_exp(n, 0.12)
    x += fft_filter(noise(n), 200, 3000) * env_exp(n, 0.03) * 0.6
    return x * 0.7


def sfx_hazard(count=4, gap=0.42):
    out = np.zeros(int((count * gap + 0.2) * SR))
    for k in range(count):
        n = int(0.11 * SR); t = np.arange(n) / SR
        b = np.sign(np.sin(2 * np.pi * 880 * t)) * 0.12 * env_exp(n, 0.05)
        out[int(k * gap * SR): int(k * gap * SR) + n] += fft_filter(b, 300, 5000)
    return out


def sfx_glitch(dur=0.35):
    n = int(dur * SR)
    x = np.zeros(n)
    k = 0
    while k < n:
        L = int(RNG.uniform(0.012, 0.04) * SR)
        f = RNG.choice([220, 440, 660, 1320, 1760])
        t = np.arange(min(L, n - k)) / SR
        x[k:k + len(t)] = np.sign(np.sin(2 * np.pi * f * t)) * RNG.uniform(0.05, 0.16)
        k += L + int(RNG.uniform(0, 0.02) * SR)
    return fft_filter(x, 150, 7000)


def sfx_stamp():
    return sfx_thud() * 0.8 + np.pad(sfx_swish(0.12), (0, int(0.48 * SR))) * 0.6


def sfx_shimmer(dur=1.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k, m in enumerate([84, 88, 91, 96, 100]):
        s = int(k * 0.06 * SR)
        tt = t[: n - s]
        x[s:] += np.sin(2 * np.pi * midi(m) * tt) * np.exp(-tt / 0.35) * 0.12
    return x


# ---------------------------------------------------------------- music
BPM = 120
BEAT = 60 / BPM


def kick():
    n = int(0.4 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-t / 0.035)) / SR) * env_exp(n, 0.16)
    return np.tanh(x * 1.6) * 0.9


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    return fft_filter(noise(n), 7000, None) * env_exp(n, 0.06 if open_ else 0.014) * 0.22


def clap():
    n = int(0.25 * SR)
    e = np.zeros(n)
    for d in (0, 0.009, 0.018):
        e[int(d * SR):] += env_exp(n - int(d * SR), 0.05 if d else 0.01)
    return fft_filter(noise(n), 900, 5000) * e * 0.18


_ks_cache = {}


def pluck(m, dur=0.5):
    key = (m, dur)
    if key not in _ks_cache:
        f = midi(m)
        n = int(dur * SR)
        P = int(SR / f)
        buf = RNG.uniform(-1, 1, P)
        out = np.zeros(n)
        for i in range(n):
            out[i] = buf[i % P]
            buf[i % P] = 0.5 * (buf[i % P] + buf[(i + 1) % P]) * 0.996
        _ks_cache[key] = fft_filter(out, 120, 5000) * env_exp(n, dur / 3) * 0.5
    return _ks_cache[key]


def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    s = 2 * ((t * f) % 1) - 1
    if detune:
        s = 0.5 * s + 0.5 * (2 * ((t * f * (1 + detune)) % 1) - 1)
    return s


def bass_note(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    x = np.sin(2 * np.pi * f * t) * 0.8 + fft_filter(saw(f, n), None, 400) * 0.35
    a = np.minimum(1, t / 0.005) * np.minimum(1, (dur - t) / 0.02)
    return np.tanh(x * 1.2) * a * 0.5


def pad_chord(ms, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(saw(midi(m), n, 0.006) for m in ms)
    x = fft_filter(x, 150, 1400)
    a = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return x * a * 0.05


# A minor: Am - F - C - G   (root midi of bass, chord tones for arp/pad)
PROG = [(45, [69, 72, 76, 81]), (41, [65, 69, 72, 77]), (48, [67, 72, 76, 79]), (43, [67, 71, 74, 79])]
TENSE = [(45, [69, 72, 75]), (46, [70, 73, 76])]  # Am - Bbdim-ish, uneasy


def groove(t0, t1, buf, energy=1.0, drums=True, arp=True, bassline=True, pad=True, prog=PROG, sidechain_buf=None):
    """lay a section of the music bed from t0..t1 (output seconds)"""
    bar = BEAT * 4
    b = 0
    t = t0
    while t < t1 - 1e-6:
        root, ch = prog[b % len(prog)]
        if pad:
            place(buf, pad_chord(ch[:3], min(bar, t1 - t) + 0.3), t, energy)
        for s in range(16):
            ts = t + s * BEAT / 4
            if ts >= t1:
                break
            if drums:
                if s % 4 == 0:
                    place(buf, kick(), ts, 0.9 * energy)
                    if sidechain_buf is not None:
                        place(sidechain_buf, np.ones(1), ts)
                if s % 4 == 2:
                    place(buf, hat(), ts, energy)
                if s % 8 == 4:
                    place(buf, clap(), ts, energy)
                if s in (7, 15):
                    place(buf, hat(True), ts, 0.6 * energy)
            if bassline and s % 2 == 0 and s % 4 != 0:
                place(buf, bass_note(root - 12 + (12 if s == 10 else 0), BEAT / 2 * 0.9), ts, 0.9 * energy)
            if arp and s % 2 == 0:
                place(buf, pluck(ch[(s // 2) % len(ch)] + (12 if (s // 2) % 4 == 3 else 0), 0.45), ts, 0.55 * energy)
        t += bar
        b += 1


def tape_stop(x, dur):
    """slow playback to 0 over `dur` seconds (pitch falls)"""
    n = int(dur * SR)
    speed = np.linspace(1, 0, n) ** 1.3
    pos = np.cumsum(speed)
    pos = pos[pos < len(x) - 1]
    i = pos.astype(int)
    fr = pos - i
    y = x[i] * (1 - fr) + x[i + 1] * fr
    return y * np.linspace(1, 0.2, len(y))


def sfx_bell(f=880.0, dur=2.2, strikes=6, rate=0.11):
    """electric school-bell: fast hammer strikes on a bright inharmonic bell"""
    n = int(dur * SR)
    out = np.zeros(n)
    t = np.arange(int(1.2 * SR)) / SR
    partials = [(1, 1, 0.9), (2.32, 0.5, 0.5), (4.25, 0.3, 0.3), (6.63, 0.15, 0.2)]
    hit = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in partials)
    hit *= np.minimum(1, t / 0.002)
    for k in range(strikes):
        i = int(k * rate * SR)
        L = min(len(hit), n - i)
        out[i:i + L] += hit[:L] * (0.9 if k % 2 == 0 else 0.7)
    return np.tanh(out * 0.6) * 0.5


def sfx_zap(dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    buzz = np.sign(np.sin(2 * np.pi * (220 + 900 * t / dur) * t)) * 0.12
    return fft_filter(buzz + noise(n) * 0.05, 300, 6000) * np.exp(-t / (dur / 2.5))


def build_music():
    """cinematic bed: soft pulse that grows section by section"""
    mus = np.zeros(N)
    pumps = np.zeros(N)
    c = cue
    t0 = TL["voiceStart"] - 0.4
    # intro section: pad + light pulse (curiosity)
    groove(t0, c("ifRang") - 0.2, mus, energy=0.55, drums=False, arp=True, bassline=True, pad=True)
    # question: tension bed
    groove(c("ifRang") - 0.2, c("no"), mus, energy=0.6, drums=False, arp=False, bassline=False, pad=True, prog=TENSE)
    # «لا» -> silence beat, riser into the title
    groove(c("lesson"), c("swapAsk"), mus, energy=0.85, drums=True, arp=True, sidechain_buf=pumps)
    groove(c("swapAsk"), c("bothAsk"), mus, energy=0.95, drums=True, arp=True, sidechain_buf=pumps)
    groove(c("bothAsk"), c("summary"), mus, energy=1.0, drums=True, arp=True, sidechain_buf=pumps)
    groove(c("summary"), TOTAL - 0.6, mus, energy=0.9, drums=True, arp=True, sidechain_buf=pumps)
    place(mus, pad_chord([57, 64, 69, 72, 76], 2.2) * 3, TOTAL - 2.0, 1.0)
    fade = np.ones(N)
    fe = int((TOTAL - 0.2) * SR)
    fs = int((TOTAL - 1.4) * SR)
    fade[fs:fe] = np.linspace(1, 0, fe - fs)
    fade[fe:] = 0
    fade[: int(t0 * SR)] = 0
    pump = np.ones(N)
    for i in np.nonzero(pumps)[0]:
        seg = pump[i:i + int(0.22 * SR)]
        seg *= 1 - 0.35 * np.exp(-np.arange(len(seg)) / (0.06 * SR))
    return mus * fade * pump


def build_voice():
    src = os.path.join(ROOT, "public", "media", "voice_source.mp4")
    raw = decode(src, os.path.join(BUILD, "voice_raw.wav"),
                 "highpass=f=80,afftdn=nr=12:nf=-50:tn=1,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=4000:t=q:w=1.2:g=2")
    XF = int(0.012 * SR)
    v = np.zeros(N)
    pos = TL["voiceStart"]
    for a, b in TL["segments"]:
        seg = raw[int(a * SR): int(b * SR)].astype(np.float64).copy()
        r = np.linspace(0, 1, XF)
        seg[:XF] *= r
        seg[-XF:] *= r[::-1]
        place(v, seg, pos)
        pos += b - a
    return v


def build_intro_audio():
    src = os.path.join(ROOT, "public", "media", "hook_source.mp4")
    x = decode(src, os.path.join(BUILD, "hook_raw.wav"), "highpass=f=80,afftdn=nr=10:nf=-48:tn=1,equalizer=f=4000:t=q:w=1.2:g=1.5")
    out = np.zeros(N)
    x = x.astype(np.float64)
    f = int(0.06 * SR)
    x[-f:] *= np.linspace(1, 0, f)
    place(out, x, 0.0)
    return out


def rms_db(x):
    x = x[np.abs(x) > 1e-4]
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def level_speech(x, target_db=-20.0):
    g = 10 ** ((target_db - rms_db(x)) / 20)
    x = x * g
    w = int(0.01 * SR)
    p = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same") + 1e-12)
    db = 20 * np.log10(p)
    thr, ratio = target_db + 4, 3.0
    red = np.where(db > thr, (db - thr) * (1 - 1 / ratio), 0)
    red = np.convolve(red, np.ones(w * 3) / (w * 3), "same")
    return x * 10 ** (-red / 20)


def speech_envelope(x):
    w = int(0.05 * SR)
    p = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same"))
    active = (p > 10 ** (-42 / 20)).astype(float)
    k = int(0.15 * SR)
    active = np.convolve(active, np.ones(k), "same") > 0
    sm = int(0.08 * SR)
    return np.convolve(active.astype(float), np.ones(sm) / sm, "same")


def build_sfx():
    s = np.zeros(N)
    c = cue
    H = TL["hook"]
    # hook
    place(s, sfx_bell(dur=1.2, strikes=5), 0.0, 0.35)
    place(s, sfx_click(), H["button"] + 0.05, 0.6)
    place(s, sfx_impact(0.8), H["why"], 0.45)
    place(s, sfx_freeze(), H["transition"], 0.6)
    place(s, sfx_whoosh(0.8, 300, 6000, 0.7), H["transition"] + 0.2, 0.6)
    # bell world
    place(s, sfx_pop(560), c("smartBell"), 0.45)
    place(s, sfx_click(), c("press"), 0.9)
    place(s, sfx_zap(), c("press") + 0.05, 0.5)
    place(s, sfx_bell(), c("rings") - 0.15, 0.55)
    place(s, sfx_whoosh(0.5, 400, 3000), c("but") - 0.1, 0.35)
    for k in range(4):
        place(s, sfx_tick(), c("time") - 0.8 + k * 0.27, 0.55)
    place(s, sfx_bell(dur=1.6, strikes=5), c("time") + 0.4, 0.45)
    # question / «لا»
    place(s, sfx_whoosh(0.6, 3000, 300), c("ifRang") - 0.1, 0.35)
    place(s, sfx_pop(420), c("btnQ"), 0.5)
    place(s, sfx_impact(1.1), c("no"), 0.75)
    place(s, sfx_stamp(), c("no") + 0.02, 0.5)
    place(s, sfx_riser(1.0), c("title") - 1.0, 0.45)
    place(s, sfx_impact(1.0), c("title"), 0.55)
    place(s, sfx_shimmer(1.2), c("title") + 0.05, 0.45)
    # statement building
    place(s, sfx_whoosh(0.4, 500, 4000), c("stmtIf") - 0.15, 0.4)
    place(s, sfx_pop(620), c("stmtPress"), 0.45)
    place(s, sfx_whoosh(0.4, 500, 4000), c("stmtThen") - 0.15, 0.4)
    place(s, sfx_pop(760), c("stmtRing"), 0.45)
    place(s, sfx_thud(), c("condWord"), 0.45)
    place(s, sfx_click(), c("hyp"), 0.7)
    place(s, sfx_click(), c("concl"), 0.7)
    # converse
    place(s, sfx_whoosh(0.8, 300, 3000, 0.5), c("swap") - 0.1, 0.5)
    place(s, sfx_impact(0.7), c("converse"), 0.45)
    place(s, sfx_stamp(), c("negBoth"), 0.5)
    place(s, sfx_stamp(), c("negBoth") + 0.18, 0.4)
    place(s, sfx_impact(0.7), c("inverse"), 0.45)
    place(s, sfx_whoosh(0.8, 300, 3000, 0.5), c("swapNeg") - 0.1, 0.5)
    place(s, sfx_stamp(), c("sameTime"), 0.5)
    place(s, sfx_riser(0.9), c("contra") - 0.9, 0.4)
    place(s, sfx_impact(1.0), c("contra"), 0.6)
    # summary
    place(s, sfx_whoosh(0.6, 300, 5000), c("summary") - 0.2, 0.45)
    for k in range(4):
        place(s, sfx_pop(500 + 90 * k), c("summary") + 0.25 + k * 0.18, 0.35)
    place(s, sfx_impact(1.0), c("lessonEnd"), 0.5)
    place(s, sfx_shimmer(1.4), c("lessonEnd") + 0.05, 0.5)
    place(s, sfx_click(), c("subject"), 0.6)
    place(s, sfx_click(), c("grade"), 0.6)
    place(s, sfx_bell(dur=1.4, strikes=3, rate=0.16), c("salam") + 0.25, 0.25)
    return s


def main():
    print(f"total {TOTAL:.2f}s")
    voice = level_speech(build_voice(), -19)
    intro = level_speech(build_intro_audio(), -19)
    speech = voice + intro
    music = build_music()
    sfx = build_sfx()
    env = speech_envelope(speech)
    music_gain = 10 ** (-26 / 20) / (10 ** (rms_db(music) / 20))
    duck = 1 - 0.55 * env
    mix = speech + music * music_gain * duck + sfx * 0.32
    mix = mix[: int(TOTAL * SR)]
    pre = os.path.join(BUILD, "mix_pre.wav")
    write_wav(pre, mix / max(1.0, np.abs(mix).max() * 1.05))
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rfind("{"): r.stderr.rfind("}") + 1])
    ff("-i", pre, "-af",
       f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
       f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true",
       "-ar", str(SR), os.path.join(ROOT, "public", "audio", "mix.wav"))
    print("measured", m["input_i"], "-> -14 LUFS")


if __name__ == "__main__":
    main()
