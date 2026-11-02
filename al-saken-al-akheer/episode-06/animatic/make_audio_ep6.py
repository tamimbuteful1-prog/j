"""Episode 06 mix: narration (original timing, untouched) + spatial father voices + sound design.

Usage: python3 make_audio_ep4.py vo_timed.wav timeline.js out.wav
- Narrator is never pitch-shifted, re-voiced or time-stretched.
- Quoted lines are *placed* only (same narrator voice, no pitch change):
    dad through the phone (3–4 shouting, 18–21), the presence behind his ear (27–28),
    dad in the room (46–50, 54–59, 63–66, 70–72): small-room tone,
    "Nawaf" behind the apartment door (80–81): muffled through wood + hallway
- Final: -14 LUFS integrated, true peak under -1 dBTP.
"""
import json, os, re, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000
vo_path, tl_path, out_path = sys.argv[1:4]
SEG = json.loads(re.search(r"SEG=(\[.*?\]);", open(tl_path).read(), re.S).group(1))
A = lambda i: SEG[i]["a"]
B = lambda i: SEG[i]["b"]
VO_END = B(129)
ASK_END = VO_END + 5.0
DUR = ASK_END + 5.2
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(6)
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
room = reverb_ir(.45, 9, 5000); hallv = reverb_ir(1.0, 5, 3000); big = reverb_ir(2.0, 2.6, 3500)


def grab(a, b, keep=False):
    s = voice[idx(a - .03): idx(b + .2)].copy()
    if not keep: voice[idx(a - .03): idx(b + .2)] = 0
    return s


def in_room(i0, i1, gain=1.0, pan=0.0):
    s = grab(A(i0), B(i1)); wet = conv(s, room); out = np.zeros(len(wet)); out[: len(s)] += s * .85; out += wet * .25
    place(out, A(i0) - .03, gain, pan)


def through_door(i0, i1, gain=1.0, keep=False, pan=.35):
    s = grab(A(i0), B(i1), keep); d = filt(s, lo=160, hi=1300) * 1.6
    wet = conv(d, hallv); out = np.zeros(len(wet)); out[: len(d)] += d; out += wet * .5
    place(out, A(i0) - .03, gain, pan)


def vhs(i0, i1, gain=1.0):
    s = grab(A(i0), B(i1)); n = len(s); tt = np.arange(n) / SR
    wob = (1 + .004 * np.sin(2 * np.pi * .8 * tt))
    idxs = np.clip(np.cumsum(wob) - 1, 0, n - 1).astype(int); s = s[idxs]
    v = filt(s, lo=250, hi=3000); v = np.tanh(v * 2.2) / 2.2 + filt(noise(n), lo=2000) * .01
    place(v, A(i0) - .03, gain, .1)


def tv(i0, i1, gain=1.0):
    s = grab(A(i0), B(i1)); v = filt(s, lo=300, hi=3800) * 1.5; v = np.tanh(v * 1.6) / 1.6
    place(conv(v, room)[: len(v) + idx(.3)] * .6 + np.pad(v, (0, idx(.3)))[: len(v) + idx(.3)] * .7, A(i0) - .03, gain, -.15)


through_door(4, 4, 1.35)
through_door(9, 10, 1.0, keep=True)           # the double says it at the same moment, behind the door
for i0, i1 in ((6, 6), (25, 25), (74, 75)): in_room(i0, i1, 1.0, -.1)     # father
for i0, i1 in ((37, 38), (47, 49), (53, 53), (57, 57), (88, 89), (94, 95), (101, 102)): in_room(i0, i1, 1.0, .1)  # guard
for i0, i1 in ((63, 63), (64, 64), (66, 66)): vhs(i0, i1, 1.2)            # the old recording
tv(118, 119, 1.25)                                                        # the double, from the monitor speaker
place(voice, 0, 1.0)

# ------------------------------------------------------------ locations
def gate(spans, fade=.3):
    g = np.zeros(N)
    for a, b in spans: g[idx(a):idx(b)] = 1
    k = max(1, idx(fade)); return np.convolve(g, np.ones(k) / k, mode="same")


g_home = gate([(0, A(26))]); g_hall = gate([(A(26), A(33)), (A(122), A(126))]); g_room = gate([(A(33), A(122)), (A(126), ASK_END)])
g_fire = gate([(A(58), A(67))], .2); g_lift = gate([(A(76), A(86))], .2); g_live = gate([(A(103), A(120))], .2)
home = np.convolve(noise(N), np.ones(300) / 300, mode="same"); home /= np.abs(home).max()
place((home * .035 + (np.sin(2 * np.pi * 50 * t) * .4 + np.sin(2 * np.pi * 100 * t) * .2) * .006) * g_home, 0)
place(filt(noise(N), hi=450) * .06 * g_hall, 0)
crt = np.sin(2 * np.pi * 15734 * t) * .5 + filt(noise(N), lo=3000) * .3
hum = np.sin(2 * np.pi * 60 * t) * .5 + np.sin(2 * np.pi * 120 * t) * .3 + np.sin(2 * np.pi * 180 * t) * .15
place((crt * .004 + hum * .012 + home * .03) * g_room, 0, 1.0, -.1)
# recordings: tape hiss + their own worlds
hiss = filt(noise(N), lo=3000); hiss /= np.abs(hiss).max()
place(hiss * .02 * (g_fire + g_lift + g_live), 0, 1.0, .1)
fire = filt(noise(N), hi=300) * .3 + filt(noise(N) * (rng.random(N) > .998), lo=800, hi=5000) * .8
place(filt(fire, hi=3000) * .25 * g_fire, 0, 1.0, .1)
sir = filt(np.sin(2 * np.pi * np.cumsum(700 + 250 * np.sin(2 * np.pi * .5 * t)) / SR), hi=1500)
place(sir * .015 * g_fire, 0, 1.0, .4)

# ------------------------------------------------------------ score
pad = (np.sin(2 * np.pi * 55 * t) + .6 * np.sin(2 * np.pi * 55.3 * t) + .35 * np.sin(2 * np.pi * 82.4 * t) + .15 * np.sin(2 * np.pi * 130.8 * t)) * (.6 + .4 * np.sin(2 * np.pi * .05 * t))
auto = curve([(0, .5), (A(9) - .05, .5), (A(9), 0), (A(11) + .5, 0), (A(12), .5), (A(16) - .1, 0), (A(19), 0), (A(20), .6), (A(26), .7), (A(33), .4),
              (A(47), .6), (A(49), .8), (B(49) + .1, 0), (A(52), 0), (A(52) + .5, .4), (A(58), .5), (A(66), .9), (B(66) + .1, 0), (A(68), 0), (A(68) + .5, .4),
              (A(76), .5), (A(79), .7), (A(80), 0), (A(86), 0), (A(86) + .5, .4), (A(94), .6), (B(95), .8), (A(96), .4), (A(103), .5), (A(110), .9),
              (A(111) - .05, 0), (A(112), 0), (A(112) + .5, .5), (A(118), .7), (A(118) + .05, 0), (A(126), 0), (A(126) + 1.0, .45), (ASK_END - .3, .45), (ASK_END, 0), (DUR, 0)])
place(pad * auto * .05 * (1 - .4 * speaking), 0)


def mbox(freq, dur=3.0):
    n = idx(dur); tt = np.arange(n) / SR
    ph = 2 * np.pi * freq * np.cumsum(1 + .004 * np.sin(2 * np.pi * .45 * tt)) / SR
    return (np.sin(ph) + .35 * np.sin(2 * ph) * np.exp(-tt * 3) + .15 * np.sin(3.98 * ph) * np.exp(-tt * 6)) * np.exp(-tt * 1.6) * env(n, .002, .2)


endfade = curve([(0, 1), (ASK_END - .3, 1), (ASK_END, 0), (DUR, 0)])
mus = np.zeros(N)
for start in (A(126) + .6, A(39) + .3, A(86) + .6):
    for off, m in ((0, 76), (.9, 72), (1.8, 69), (2.7, 68), (4.5, 69), (5.4, 72), (6.3, 71)):
        s = mbox(440 * 2 ** ((m - 69) / 12)); a = idx(start + off)
        if a < N: mus[a:a + len(s)] += s[: max(0, min(len(s), N - a))]
mus = conv(mus, reverb_ir(2.6, 2.4, 3500))[:N]; mus /= np.abs(mus).max() + 1e-9
place(mus * .045 * endfade * (1 - .45 * speaking), 0)

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


def knock():
    n = idx(.45); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 78 * tt) * np.exp(-tt * 22) + .6 * np.sin(2 * np.pi * 160 * tt) * np.exp(-tt * 35)
    s = filt(body + np.convolve(noise(n), np.ones(5) / 5, mode="same") * np.exp(-tt * 300) * .5, hi=2200); d = idx(.034); s[d:] += .3 * s[:-d]
    return s


def creak(d=1.2, f0=260):
    n = idx(d); tt = np.arange(n) / SR
    return filt(np.sign(np.sin(2 * np.pi * np.cumsum(f0 + 90 * np.sin(2 * np.pi * 1.1 * tt)) / SR)) * (np.sin(2 * np.pi * 21 * tt) > .2), lo=200, hi=2000) * np.sin(np.linspace(0, np.pi, n)) * .3


def mech(d=.6, f=40):
    n = idx(d); tt = np.arange(n) / SR
    return filt(noise(n), lo=200, hi=2500) * np.exp(-tt * 8) * .5 + np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) * .5


# the double's line in sync with Nawaf: a beat of silence after
place(thud(34, 2.2), A(11), .35)
# father's step back
place(creak(.6, 200), A(12) + .2, .06, -.1)
# trembling hand: breath
place(breath(.9, 1400, .45), A(14) + .2, 1.0)
# three knocks (series signature) — strong
for x in (A(16) - .02, A(17) - .02, A(18) - .02):
    place(knock(), x, 2.2, .25)
# the door opens by itself: long creak
place(creak(1.6, 230), A(20) + .1, .12, .3)
# Nawaf steps back fast
place(step(), A(21) + .1, .2, -.2)
# father runs + slams it + locks
for k, x in enumerate(np.arange(A(22), A(22) + 1.0, .25)): place(step(True), x, .25, .1)
place(thud(65, .7), A(22) + 1.1, .7, .2); place(tick(900, .05), A(23) + .3, .35, .2)
# hallway walking (two people, fast)
for k, x in enumerate(np.arange(A(26), A(31), .4)): place(conv(step(), hallv[: idx(.8)])[: idx(.9)], x, .12, (-1) ** k * .1)
for k, x in enumerate(np.arange(A(26) + .18, A(31), .4)): place(conv(step(), hallv[: idx(.8)])[: idx(.9)], x, .09, (-1) ** k * .1)
# pounding on the guard's door
for x in (.1, .4, .7): place(thud(90, .35) + knock()[: idx(.35)] * .5, A(32) + x, .5, .1)
# door opens (metal), keys jingle
place(creak(1.0, 320), A(33) + .05, .1)
for x in np.arange(A(33) + .3, A(33) + 1.2, .11): place(tick(3000 + rng.uniform(-400, 400), .05), x, .05, .2)
# tape off the shelf, cassette into the VCR, motor + click + play
place(filt(noise(idx(.4)), lo=800, hi=5000) * env(idx(.4), .02, .2), A(54) + .2, .08)
place(mech(.5, 60), A(55) + .6, .5); place(tick(700, .08), A(55) + .95, .5)
n = idx(2.4); place(filt(np.sin(2 * np.pi * 52 * np.arange(n) / SR) + noise(n) * .3, lo=40, hi=800) * env(n, .2, .4), A(55) + 1.0, .1)
place(tick(1200, .05), A(58) - .1, .3)
# VHS head switching noise bursts in the recordings
for x in np.arange(A(58), A(67), 2.7): place(filt(noise(idx(.08)), lo=1500) * .5, x + rng.uniform(0, 1), .06, .1)
# elevator ding inside the recording, doors, a child crying (very faint, filtered)
place(filt(np.sin(2 * np.pi * 932 * np.arange(idx(1)) / SR) * np.exp(-np.arange(idx(1)) / SR * 4), lo=300, hi=3000), A(77) - .5, .05, .1)
n = idx(2.6); tt = np.arange(n) / SR
cry = filt(np.sin(2 * np.pi * np.cumsum(420 + 80 * np.sin(2 * np.pi * 2.2 * tt)) / SR) * (np.sin(2 * np.pi * 1.6 * tt) > -.2) * np.sin(np.linspace(0, np.pi, n)), lo=300, hi=2500)
place(cry, A(83) + .1, .03, .1)
# silence after the twins' stare, then the stop button
place(thud(30, 2.6), A(85), .4)
place(tick(800, .08), A(86) + 1.0, .5); place(mech(.4, 50), A(86) + 1.05, .3)
# guard walks to the monitors
for k, x in enumerate(np.arange(A(99), A(99) + 1.6, .5)): place(step(), x, .12, (-1) ** k * .1)
# live feed: heartbeat when it's him
for x in (A(110), A(110) + .55, A(110) + 1.2): place(thud(52, .35), x, .35)
place(thud(34, 2.4), A(111) - .02, .45)
# everyone turns: clothes rustle
place(filt(noise(idx(.5)), lo=600, hi=4000) * env(idx(.5), .05, .3), A(120) + .3, .08)
# the final three knocks on the guard's door — strongest of the episode
for x in (A(123) - .02, A(124) - .02, A(125) - .02):
    place(knock(), x, 2.6, -.1)
place(breath(1.2, 1300, .45), A(126) + .3, 1.0)

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
