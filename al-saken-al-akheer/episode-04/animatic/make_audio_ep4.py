"""Episode 04 mix: narration (original timing, untouched) + spatial father voices + sound design.

Usage: python3 make_audio_ep4.py vo_timed.wav timeline.js out.wav
- Narrator is never pitch-shifted, re-voiced or time-stretched.
- The father's quoted lines are *placed* only:
    from the apartment (6–8): distance + corridor reverb
    through the phone (54,55,64,65,71,76,77,88): call band-limit, panned right
    behind his ear (83,84): dry, very close, moving behind the head, with breath
- Final: -14 LUFS integrated, true peak under -1 dBTP.
"""
import json, os, re, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000
vo_path, tl_path, out_path = sys.argv[1:4]
SEG = json.loads(re.search(r"SEG=(\[.*?\]);", open(tl_path).read(), re.S).group(1))
A = lambda i: SEG[i]["a"]
B = lambda i: SEG[i]["b"]
VO_END = B(95)
ASK_END = VO_END + 5.0
DUR = ASK_END + 5.2
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(4)
L = np.zeros(N); R = np.zeros(N)
tmp = tempfile.mkdtemp()
idx = lambda s: int(round(s * SR))


def place(sig, at, gain=1.0, pan=0.0):
    a = idx(at); b = min(N, a + len(sig))
    if b <= a or a < 0:
        return
    th = (pan + 1) * np.pi / 4
    L[a:b] += sig[: b - a] * gain * np.cos(th) * 1.414
    R[a:b] += sig[: b - a] * gain * np.sin(th) * 1.414


def env(n, att, rel):
    e = np.ones(n); na, nr = int(att * SR), int(rel * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def filt(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    if hi: X *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo: X *= 1 - 1 / np.sqrt(1 + (f / lo) ** 4)
    return np.fft.irfft(X, len(x))


def conv(x, ir):
    n = len(x) + len(ir) - 1; m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:n]


def reverb_ir(sec, decay, hi=4000):
    n = idx(sec); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * decay)
    ir = filt(ir, hi=hi); return ir / np.sqrt(np.sum(ir ** 2))


def curve(points):
    ts, vs = zip(*points); return np.interp(t, ts, vs)


noise = lambda n: rng.standard_normal(n)


def ff(path):
    out = os.path.join(tmp, "x.raw")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", out], check=True)
    return np.fromfile(out, np.float32).astype(float)


# ------------------------------------------------------------ voices
vo = ff(vo_path); voice = np.zeros(N); voice[: min(N, len(vo))] = vo[:N]
venv = np.convolve(np.abs(voice), np.ones(idx(.25)) / idx(.25), mode="same")
speaking = np.clip(venv / (venv.max() * .15), 0, 1)
big = reverb_ir(2.4, 2.2, 3500)


def grab(a, b):
    s = voice[idx(a - .03): idx(b + .2)].copy(); voice[idx(a - .03): idx(b + .2)] = 0; return s


def apartment(i0, i1, gain=1.0):
    s = grab(A(i0), B(i1)); dry = filt(s, lo=150, hi=3500) * .5
    wet = conv(filt(s, lo=200, hi=2600), big)
    out = np.zeros(len(wet)); out[: len(dry)] += dry; out += wet * .9
    place(out, A(i0) - .03, gain, -.15)


def phone(i0, i1, gain=1.0, shout=False):
    s = grab(A(i0), B(i1)); p = filt(s, lo=340, hi=3400) * (2.2 if shout else 1.7)
    p = np.tanh(p * (2.2 if shout else 1.4)) / (2.2 if shout else 1.4)
    place(p, A(i0) - .03, gain, .55)


def behind(i0, i1, gain=1.0):
    s = grab(A(i0), B(i1))
    w = filt(s, lo=120, hi=7000) * .9  # whispered-close: dry, full, intimate
    n = len(w); pan = np.linspace(-.85, -.35, n); th = (pan + 1) * np.pi / 4
    a = idx(A(i0) - .03); m = min(n, N - a)
    L[a:a + m] += w[:m] * np.cos(th[:m]) * 1.414 * gain
    R[a:a + m] += w[:m] * np.sin(th[:m]) * 1.414 * gain


apartment(6, 8, 1.1)
for i0, i1 in ((54, 55), (64, 65), (71, 71), (76, 77)):
    phone(i0, i1, 1.0)
phone(88, 88, 1.1, shout=True)
behind(83, 84, 1.25)
place(voice, 0, 1.0)

# ------------------------------------------------------------ ambience (floor zero for the whole episode)
lights = curve([(0, 1), (A(33) - .06, 1), (A(33) - .05, 0), (A(36) + .05, 0), (A(36) + .06, 1), (DUR, 1)])
endfade = curve([(0, 1), (ASK_END - .3, 1), (ASK_END, 0), (DUR, 0)])
air = filt(noise(N), hi=220); air /= np.abs(air).max()
place(air * .18 * endfade, 0, 1.0, -.1)
place(filt(noise(N), lo=40, hi=90) * .22 * endfade, 0)
buzz120 = np.sign(np.sin(2 * np.pi * 120 * t)) * .3 + np.sin(2 * np.pi * 240 * t) * .2
fl = np.abs(np.sin(t * 37 * 2.3) * np.sin(t * 11.3 + 2.3) * np.sin(t * 3.1))
hum = filt(buzz120, hi=3000) * (.007 + .012 * (fl > .55)) + (np.sin(2 * np.pi * 60 * t) * .5 + np.sin(2 * np.pi * 120 * t) * .25) * .012
place(hum * lights * endfade, 0, 1.0, .1)
for d in np.arange(3.0, ASK_END, 4.1):
    n = idx(.25); tt = np.arange(n) / SR
    drip = np.sin(2 * np.pi * (1400 + 600 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 40)
    place(conv(drip, big[: idx(1.5)])[: idx(1.6)], d + rng.uniform(0, 1.5), .03, rng.uniform(-.7, .7))

# ------------------------------------------------------------ score (low, dark; cut on the key beats)
pad = (np.sin(2 * np.pi * 55 * t) + .6 * np.sin(2 * np.pi * 55.3 * t) + .35 * np.sin(2 * np.pi * 82.4 * t)
       + .15 * np.sin(2 * np.pi * 130.8 * t)) * (.6 + .4 * np.sin(2 * np.pi * .05 * t))
auto = curve([(0, .6), (A(5), .4), (A(12), .5), (A(19), .6), (A(20), .9), (B(20), 1), (A(21), .6), (A(24), .9), (A(25) - .05, 0),
              (A(26) + .5, 0), (A(27), .5), (A(32), .5), (A(33) - .06, 0), (A(37), 0), (A(37) + .5, .5), (A(39) - .05, 0), (A(42), 0),
              (A(42) + .5, .4), (A(48), .5), (A(52), .3), (A(59), .2), (A(62), .4), (A(67), .6), (A(69), .7), (A(75), .8),
              (A(78), .9), (A(78) + .1, 0), (A(91), 0), (A(91) + 1.2, .45), (ASK_END - .3, .45), (ASK_END, 0), (DUR, 0)])
place(pad * auto * .05 * (1 - .4 * speaking), 0)


# mystery motif under the audience question (music box, same family as episodes 2–3)
def mbox(freq, dur=3.0):
    n = idx(dur); tt = np.arange(n) / SR
    ph = 2 * np.pi * freq * np.cumsum(1 + .004 * np.sin(2 * np.pi * .45 * tt)) / SR
    return (np.sin(ph) + .35 * np.sin(2 * ph) * np.exp(-tt * 3) + .15 * np.sin(3.98 * ph) * np.exp(-tt * 6)) * np.exp(-tt * 1.6) * env(n, .002, .2)


mus = np.zeros(N)
for start in (A(91) + .6, A(12) + .5):
    for off, m in ((0, 76), (.9, 72), (1.8, 69), (2.7, 68), (4.5, 69), (5.4, 72), (6.3, 71)):
        s = mbox(440 * 2 ** ((m - 69) / 12)); a = idx(start + off)
        if a < N: mus[a:a + len(s)] += s[: max(0, min(len(s), N - a))]
mus = conv(mus, reverb_ir(2.6, 2.4, 3500))[:N]; mus /= np.abs(mus).max() + 1e-9
place(mus * .05 * endfade * (1 - .45 * speaking), 0)


# ------------------------------------------------------------ SFX
def thud(f=60, d=.5):
    n = idx(d); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) + filt(noise(n), hi=400) * np.exp(-tt * 14) * .6


def tick(f=1500, d=.03):
    n = idx(d); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 200)


def step(heavy=False):
    n = idx(.35); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * (70 if heavy else 110) * tt) * np.exp(-tt * (18 if heavy else 30))
    return s + filt(noise(n), lo=200, hi=2500 if heavy else 4000) * np.exp(-tt * (40 if heavy else 60)) * .6


def breath(d, fc, g):
    n = idx(d); return filt(noise(n), hi=fc) * np.sin(np.linspace(0, np.pi, n)) ** 2 * g


def buzz(d):
    n = idx(d); tt = np.arange(n) / SR
    return filt(np.sign(np.sin(2 * np.pi * 160 * tt)) * .5 + noise(n) * .25, hi=800) * env(n, .01, .03)


# opening: a sub swell under his face
place(thud(36, 2.4), .2, .4)
# stepping back / hesitating
place(conv(step(), big[: idx(1.5)])[: idx(1.8)], A(7) + .25, .07)
# walking toward the apartment, stopping
for k, s_ in enumerate(np.arange(A(9), A(10) + .3, .5)):
    place(conv(step(), big[: idx(1.2)])[: idx(1.4)], s_, .06, (-1) ** k * .08)
# glass wiping (squeaky fingertip on dusty glass)
n = idx(1.6); tt = np.arange(n) / SR
squeak = filt(np.sin(2 * np.pi * np.cumsum(900 + 300 * np.sin(2 * np.pi * 5 * tt)) / SR) * (np.sin(2 * np.pi * 6 * tt) > .2), lo=500, hi=4000)
place(squeak * np.sin(np.linspace(0, np.pi, n)) * .35 + filt(noise(n), lo=1500, hi=6000) * .25 * np.sin(np.linspace(0, np.pi, n)), A(14) + .4, .06)
# photo-reveal tension: soft sub hits
place(thud(40, 2.0), A(20) + 1.0, .3)
place(thud(34, 2.4), A(25) - .02, .45)
# phone camera shutter
n = idx(.12); place(filt(noise(n), lo=1500) * np.exp(-np.arange(n) / SR * 60) + tick(2000, .05)[:n] * 0 if False else filt(noise(n), lo=1500) * np.exp(-np.arange(n) / SR * 60), B(31) - .2, .25, .2)
place(tick(1800, .02), B(31) - .12, .2, .2)
# blackout: hard electrical clunk (hum already cut by `lights`), then power back with a buzz/snap
place(thud(55, .4) + filt(noise(idx(.4)), lo=800, hi=4000) * np.exp(-np.arange(idx(.4)) / SR * 30) * .4, A(33) - .05, .4)
n = idx(.5); place(filt(np.sign(np.sin(2 * np.pi * 120 * np.arange(n) / SR)), hi=4000) * np.exp(-np.arange(n) / SR * 6) * .5, A(36) + .05, .25, .1)
place(tick(700, .06), A(36) + .05, .4)
# his breath in the dark
place(breath(.9, 1500, .4), A(34) - .2, 1.0)
# the missing father: short silence + low tone (music already cut)
place(thud(30, 3.0), A(39) - .02, .5)
# incoming call: vibration + ringtone (phone speaker)
for k in range(5):
    at = A(48) + .2 + k * 1.0
    if at < A(52): place(buzz(.4), at, .35, .2)
n = idx(A(52) - A(48) - .3); tt = np.arange(n) / SR
ring = filt(np.sin(2 * np.pi * 784 * tt) * (np.sin(2 * np.pi * 2 * tt) > 0) + .5 * np.sin(2 * np.pi * 988 * tt) * (np.sin(2 * np.pi * 2 * tt + 1) > .3), lo=400, hi=3500)
place(ring * env(n, .05, .1), A(48) + .3, .035, .25)
place(tick(1200, .04), A(52) + .05, .2, .3)  # answer click
# line noise during the call (very low), and the falling object at dad's end
call_g = curve([(0, 0), (A(52), 0), (A(52) + .1, 1), (ASK_END - .3, 1), (ASK_END, 0), (DUR, 0)])
place(filt(noise(N), lo=500, hi=3000) * .004 * call_g, 0, 1.0, .55)
n = idx(.6); fall = filt(thud(90, .6)[:n] + noise(n) * np.exp(-np.arange(n) / SR * 20) * .5, lo=350, hi=3200)
place(np.tanh(fall * 2) * .5, A(69) + .55, .35, .55)
place(np.tanh(filt(breath(1.0, 3000, 1.5), lo=350, hi=3200) * 2) * .6, A(69) + 1.0, .2, .55)  # dad's anxious breath on the line
# footsteps BEHIND him: wide, close, moving from rear-left toward his back
for x, p in ((A(80) - .2, -.6), (A(81) - .2, -.35)):
    s = step(True); s = s + .35 * conv(s, reverb_ir(.8, 6))[: len(s)]
    place(s, x, .5, p)
# breath right behind his ear (before and after the whisper)
for x, p in ((A(82) - .2, -.7), (B(84) + .1, -.5)):
    n = idx(1.1); br = breath(1.1, 900, .8); a = idx(x); pan = np.linspace(p, p + .3, n); th = (pan + 1) * np.pi / 4
    L[a:a + n] += br * np.cos(th) * 1.414; R[a:a + n] += br * np.sin(th) * 1.414
# the hand on his shoulder: cloth rustle + nothing else (music already out)
n = idx(.5); place(filt(noise(n), lo=600, hi=5000) * np.sin(np.linspace(0, np.pi, n)) ** 2 * .5, A(90) + .9, .12, -.4)
for x in (A(90) + 1.6, A(90) + 2.5):
    place(breath(.7, 1600, .45), x, 1.0)

# silence after the question (title card)
L[idx(ASK_END):] = 0; R[idx(ASK_END):] = 0

st = np.column_stack([L, R]); st /= np.abs(st).max() + 1e-9; st *= .8
raw = os.path.join(tmp, "mix.wav")
with wave.open(raw, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
p = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
m = json.loads(re.findall(r"\{[^{}]+\}", p.stderr)[-1])
af = ("loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:"
      f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", str(SR), out_path], check=True)
print("written", out_path, f"{DUR:.2f}s")
