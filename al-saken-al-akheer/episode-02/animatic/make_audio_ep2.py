"""Episode 02 mix: paced narration + soft creepy music-box lullaby + sound design.

Usage: python3 make_audio_ep2.py vo_paced.wav timeline.js out.wav
- Narration timing comes from timeline.js (written by retime_vo.py).
- The narrator is never pitch-shifted. Only the double's quoted lines get
  placement treatment: segs 59–60 through the phone speaker, 61–62 dry & close
  "behind" the listener.
- Final: -14 LUFS integrated, true peak under -1 dBTP.
"""
import json, os, re, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000
vo_path, tl_path, out_path = sys.argv[1:4]
src = open(tl_path).read()
SEG = json.loads(re.search(r"SEG=(\[.*?\]);", src, re.S).group(1))
A = lambda i: SEG[i]["a"]
B = lambda i: SEG[i]["b"]
END_CUT = B(62) + 1.15
DUR = END_CUT + 6.2
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(2)
L = np.zeros(N)
R = np.zeros(N)
tmp = tempfile.mkdtemp()


def idx(s):
    return int(round(s * SR))


def place(sig, at, gain=1.0, pan=0.0):
    a = idx(at)
    b = min(N, a + len(sig))
    if b <= a:
        return
    th = (pan + 1) * np.pi / 4
    L[a:b] += sig[: b - a] * gain * np.cos(th) * 1.414
    R[a:b] += sig[: b - a] * gain * np.sin(th) * 1.414


def env(n, att, rel):
    e = np.ones(n)
    na, nr = int(att * SR), int(rel * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, fc):
    """one-pole low-pass via FFT-free recursion using scipy-less trick (vectorised by blocks)"""
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def lp_fast(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def hp_fast(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def conv(x, ir):
    n = len(x) + len(ir) - 1
    m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:n]


def curve(points):
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)


def ff(path, af=None):
    out = os.path.join(tmp, "x.raw")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", path]
    if af:
        cmd += ["-af", af]
    subprocess.run(cmd + ["-ac", "1", "-ar", str(SR), "-f", "f32le", out], check=True)
    return np.fromfile(out, np.float32).astype(float)


# ------------------------------------------------------------ narration
vo = ff(vo_path)
voice = np.zeros(N)
voice[: min(N, len(vo))] = vo[:N]
voice_env = np.convolve(np.abs(voice), np.ones(idx(0.25)) / idx(0.25), mode="same")
speaking = np.clip(voice_env / (voice_env.max() * 0.15), 0, 1)

# the double's lines
def grab(a, b):
    s = voice[idx(a - 0.03): idx(b + 0.25)].copy()
    voice[idx(a - 0.03): idx(b + 0.25)] = 0
    return s


phone_line = grab(A(59), B(60))
behind_line = grab(A(61), B(62))
# through the phone speaker: band-limited, a little boxy
pl = hp_fast(lp_fast(phone_line, 3800), 320) * 1.6
pl = np.tanh(pl * 1.5) / 1.5
place(pl, A(59) - 0.03, 1.3, 0.12)
# "behind you": dry, close, slightly darker, tiny room
ir = rng.standard_normal(idx(0.18)) * np.exp(-np.arange(idx(0.18)) / SR * 30)
ir[0] = 1
bl = conv(lp_fast(behind_line, 6500), ir * 0.25)[: len(behind_line) + idx(0.2)]
place(bl, A(61) - 0.03, 1.0, 0.0)

place(voice, 0, 1.0, 0.0)

# ------------------------------------------------------------ music: soft creepy music box
BPM = 66
beat = 60 / BPM


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def mbox(freq, dur=3.0):
    n = idx(dur)
    tt = np.arange(n) / SR
    wob = 1 + 0.004 * np.sin(2 * np.pi * 0.45 * tt + rng.uniform(0, 6))  # tape wobble
    ph = 2 * np.pi * freq * np.cumsum(wob) / SR
    s = (np.sin(ph) + 0.35 * np.sin(2 * ph) * np.exp(-tt * 3) + 0.18 * np.sin(3.98 * ph) * np.exp(-tt * 6)
         + 0.08 * np.sin(6.1 * ph) * np.exp(-tt * 9))
    return s * np.exp(-tt * 1.6) * env(n, 0.002, 0.2)


MEL = [[76, 72, 69], [71, 72, 71], [68, 64, None], [69, None, None],
       [72, 76, 79], [77, 76, 74], [72, 71, 69], [71, None, None],
       [76, 77, 76], [74, 72, 71], [72, 69, 65], [64, None, None],
       [69, 72, 76], [75, 76, 71], [69, 68, 69], [None, None, None]]
BASS = [57, 57, 52, 57, 60, 62, 57, 52, 57, 62, 53, 52, 57, 52, 57, 57]
music = np.zeros(N)
bar = 3 * beat
loop = 16 * bar
start = 0.4
k = 0
while start + k * loop < DUR:
    base = start + k * loop
    for b in range(16):
        tb = base + b * bar
        if BASS[b]:
            sig = mbox(mtof(BASS[b]), 4.0) * 0.5
            a = idx(tb)
            music[a:a + len(sig)] += sig[: max(0, min(len(sig), N - a))]
        for j, m in enumerate(MEL[b]):
            if m is None:
                continue
            sig = mbox(mtof(m) * (1 + rng.normal(0, 0.0015)), 3.0) * 0.55
            a = idx(tb + j * beat + rng.uniform(-0.012, 0.012))
            if a < N:
                music[a:a + len(sig)] += sig[: max(0, min(len(sig), N - a))]
    k += 1
# reverb
irn = idx(2.6)
ir = rng.standard_normal(irn) * np.exp(-np.arange(irn) / SR * 2.4)
ir = lp_fast(ir, 3500)
wet = conv(music, ir)[:N]
wet /= np.abs(wet).max() + 1e-9
music /= np.abs(music).max() + 1e-9
music = music * 0.45 + wet * 0.8
# low pad
pad = (np.sin(2 * np.pi * mtof(45) * t) + 0.6 * np.sin(2 * np.pi * mtof(45) * 1.003 * t)
       + 0.35 * np.sin(2 * np.pi * mtof(52) * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t))
music += pad * 0.12

# music automation: low, ducks under the voice, and drops out for the scary beats
mus = curve([
    (0, 0), (0.4, .9), (A(12) - .1, .9), (A(12), 0), (A(16), 0), (A(16) + 1.0, .7),
    (A(21) - .05, .7), (A(21), 0), (A(23), 0), (A(23) + 1.5, .7),
    (A(30) - .1, .6), (A(30) + .2, 0), (A(33), 0), (A(33) + 1.0, .6),
    (A(38) - .05, .6), (A(38), 0), (A(40) + .2, 0), (A(40) + 1.2, .6),
    (A(42) - .05, .6), (A(42), 0), (A(47), 0), (A(47) + 1.0, .7),
    (A(54) - .05, .7), (A(54), 0), (A(56), 0), (A(56) + .8, .6),
    (A(61) - .1, .6), (A(61) + .1, 0), (DUR, 0)])
duck = 1 - 0.45 * speaking
place(music * mus * duck * 0.075, 0, 1.0)

# low suspense drone (separate from the lullaby)
drone = (np.sin(2 * np.pi * 41.2 * t) + 0.6 * np.sin(2 * np.pi * 41.5 * t) + 0.2 * np.sin(2 * np.pi * 82.4 * t))
place(drone * curve([(0, .3), (A(16), .3), (A(19), .6), (A(21), 1), (A(21) + .05, 0), (A(29), 0), (A(29) + 1, .4),
                     (A(41), .4), (A(42), .8), (A(45) + .5, .8), (A(46), .2), (A(57), .6), (A(61), 1), (END_CUT, 1),
                     (END_CUT + .02, 0), (DUR, 0)]) * 0.05, 0, 1.0)

# ------------------------------------------------------------ beds
inside = curve([(0, 1), (END_CUT, 1), (END_CUT + .01, 0), (DUR, 0)])
rt = np.convolve(rng.standard_normal(N), np.ones(300) / 300, mode="same")
rt /= np.abs(rt).max()
hum = 0.5 * np.sin(2 * np.pi * 60 * t) + 0.25 * np.sin(2 * np.pi * 120 * t) + 0.1 * np.sin(2 * np.pi * 180 * t)
place((rt * 0.045 + hum * 0.009) * inside, 0, 1.0)

# CCTV hiss whenever a feed is on screen (full or in the phone)
feed_on = [(A(4) + 2.9, A(5)), (A(7), A(8)), (A(9), A(12)), (A(14), A(16) + 0.01), (A(16), A(21)), (A(21), A(24)),
           (A(25), A(26)), (A(28), A(38)), (A(48), A(54)), (A(56), A(61))]
hiss = hp_fast(rng.standard_normal(N), 2500)
hiss /= np.abs(hiss).max()
g = np.zeros(N)
for a, b in feed_on:
    g[idx(a):idx(b)] = 1
g = np.convolve(g, np.ones(idx(0.05)) / idx(0.05), mode="same")
place(hiss * g * 0.018, 0, 1.0)


# ------------------------------------------------------------ SFX
def click(f=2500, d=0.03, g=1.0):
    n = idx(d)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + rng.standard_normal(n) * 0.4) * np.exp(-tt * 180) * g


def screw(d):
    n = idx(d)
    s = rng.standard_normal(n) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * np.arange(n) / SR)))
    return lp_fast(hp_fast(s, 1200), 5000) * env(n, 0.02, 0.05)


# camera install: screw ratchets, clicks, power-on chirp
ia = A(1) + 0.9
place(screw(0.9), ia + 0.4, 0.06, -0.2)
place(screw(0.8), ia + 2.2, 0.06, -0.2)
place(screw(0.7), ia + 4.6, 0.05, -0.2)
for c in (ia + 1.5, ia + 3.3, ia + 5.6):
    place(click(1800, 0.04), c, 0.25, -0.1)


def chirp(f0=1800, f1=2600, d=0.12):
    n = idx(d)
    tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.005, 0.03)


place(chirp(), B(3) - 0.5, 0.05, 0.1)
place(chirp(2200, 2200, 0.08), B(3) - 0.3, 0.05, 0.1)
# lens transition whoosh
n = idx(0.6)
place(lp_fast(rng.standard_normal(n), 1800) * np.linspace(0, 1, n) ** 2, A(4) + 2.3, 0.12)
# feed connects
for at in (A(4) + 2.9, A(9), A(16), A(48) + 0.45):
    place(chirp(1200, 1600, 0.05), at, 0.04, 0.1)


def buzz(d):
    n = idx(d)
    tt = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * 160 * tt)) * 0.5 + rng.standard_normal(n) * 0.25
    return lp_fast(s, 800) * env(n, 0.01, 0.03)


def ding():
    n = idx(0.7)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1318 * tt) * np.exp(-tt * 9) + 0.4 * np.sin(2 * np.pi * 1976 * tt) * np.exp(-tt * 12)) * env(n, .003, .1)


for at in (A(15) - 0.05, A(42) - 0.1):
    place(buzz(0.35), at, 0.4, 0.12)
    place(buzz(0.35), at + 0.45, 0.4, 0.12)
    place(ding(), at, 0.05, 0.12)

# riser into the face reveal, then a low hit (no scream)
n = idx(A(21) - A(19))
tt = np.arange(n) / SR
place((np.sin(2 * np.pi * np.cumsum(70 + 220 * (tt / tt[-1]) ** 2) / SR) * (tt / tt[-1]) ** 2
       + lp_fast(rng.standard_normal(n), 1500) * (tt / tt[-1]) ** 3 * 0.4), A(19), 0.07)


def low_hit(d=2.6, f=38):
    n = idx(d)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt * (1 - 0.15 * tt / d)) * np.exp(-tt * 1.6)
            + lp_fast(rng.standard_normal(n), 120) * np.exp(-tt * 3) * 0.5)


place(low_hit(), A(22) - 0.02, 0.55)
place(low_hit(2.0, 44), A(55), 0.35)

# signal cut: digital crackle then dead silence
n = idx(0.35)
crk = rng.standard_normal(n) * (rng.random(n) > 0.85) * np.linspace(1, 0.2, n)
place(hp_fast(crk, 1500), A(38) - 0.05, 0.22)
place(click(900, 0.05), A(38) + 0.28, 0.4)
sil = np.ones(N)
sil[idx(A(38) + 0.3): idx(A(39))] = 0.15
L *= sil
R *= sil

# whip turn
n = idx(0.45)
place(lp_fast(rng.standard_normal(n), 2500) * np.sin(np.linspace(0, np.pi, n)) ** 2, A(45) - 0.05, 0.25, -0.5)


def breath(d, fc, g):
    n = idx(d)
    s = lp_fast(rng.standard_normal(n), fc)
    return s * np.sin(np.linspace(0, np.pi, n)) ** 2 * g


# Nawaf's own breathing at the black screen and after the empty room
place(breath(0.9, 1500, 0.45), B(39) + 0.1, 1.0)
place(breath(1.0, 1500, 0.4), B(46) + 0.15, 1.0)
# THE breath behind him at the end — close, dark, moving behind the head
for k_, (at, p0, p1) in enumerate(((B(62) - 0.2, -0.6, -0.1), (B(62) + 0.9, 0.1, 0.5))):
    n = idx(1.3)
    br = breath(1.3, 700, 0.9)
    a = idx(at)
    pan = np.linspace(p0, p1, n)
    th = (pan + 1) * np.pi / 4
    m = min(n, N - a)
    L[a:a + m] += br[:m] * np.cos(th[:m]) * 1.414
    R[a:a + m] += br[:m] * np.sin(th[:m]) * 1.414

# total silence after the cut to black
c = idx(END_CUT)
L[c:] = 0
R[c:] = 0

st = np.column_stack([L, R])
st /= np.abs(st).max() + 1e-9
st *= 0.8
raw = os.path.join(tmp, "mix.wav")
with wave.open(raw, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
p = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                    "-f", "null", "-"], capture_output=True, text=True)
m = json.loads(re.findall(r"\{[^{}]+\}", p.stderr)[-1])
af = ("loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:"
      f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", str(SR), out_path], check=True)
print("written", out_path, f"{DUR:.2f}s")
