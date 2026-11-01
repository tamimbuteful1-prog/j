"""Episode 05 mix: narration (original timing, untouched) + spatial father voices + sound design.

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
VO_END = B(88)
ASK_END = VO_END + 5.0
DUR = ASK_END + 5.2
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(5)
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
room = reverb_ir(.45, 9, 5000)
hallv = reverb_ir(1.0, 5, 3000)


def grab(a, b):
    s = voice[idx(a - .03): idx(b + .2)].copy(); voice[idx(a - .03): idx(b + .2)] = 0; return s


def phone(i0, i1, gain=1.0, shout=False):
    s = grab(A(i0), B(i1)); k = 2.2 if shout else 1.4
    p = np.tanh(filt(s, lo=340, hi=3400) * (2.2 if shout else 1.7) * k) / k
    place(p, A(i0) - .03, gain, .55)


def behind(i0, i1, gain=1.0):
    s = grab(A(i0), B(i1)); w = filt(s, lo=120, hi=7000) * .9
    n = len(w); pan = np.linspace(-.85, -.35, n); th = (pan + 1) * np.pi / 4
    a = idx(A(i0) - .03); m = min(n, N - a)
    L[a:a + m] += w[:m] * np.cos(th[:m]) * 1.414 * gain; R[a:a + m] += w[:m] * np.sin(th[:m]) * 1.414 * gain


def in_room(i0, i1, gain=1.0, pan=-.12):
    s = grab(A(i0), B(i1)); wet = conv(s, room)
    out = np.zeros(len(wet)); out[: len(s)] += s * .85; out += wet * .25
    place(out, A(i0) - .03, gain, pan)


def through_door(i0, i1, gain=1.0):
    s = grab(A(i0), B(i1)); d = filt(s, lo=160, hi=1300) * 1.6
    wet = conv(d, hallv); out = np.zeros(len(wet)); out[: len(d)] += d; out += wet * .5
    place(out, A(i0) - .03, gain, .3)


phone(3, 4, 1.1, shout=True)
phone(18, 21, 1.0)
behind(27, 28, 1.25)
for i0, i1 in ((46, 50), (54, 59), (63, 66), (70, 72)):
    in_room(i0, i1, 1.0)
through_door(80, 81, 1.35)
place(voice, 0, 1.0)

# ------------------------------------------------------------ locations
def gate(spans, fade=.3):
    g = np.zeros(N)
    for a, b in spans: g[idx(a):idx(b)] = 1
    k = max(1, idx(fade)); return np.convolve(g, np.ones(k) / k, mode="same")


g_zero = gate([(0, A(34))]); g_stair = gate([(A(34), A(35))], .1); g_hall = gate([(A(35), A(36))], .1)
g_home = gate([(A(36), A(48)), (A(51), A(54)), (A(67), ASK_END)]); g_fire = gate([(A(48), A(51))], .5)
g_fbhall = gate([(A(54), A(67))], .5)
air = filt(noise(N), hi=220); air /= np.abs(air).max()
place(air * .18 * g_zero, 0, 1.0, -.1); place(filt(noise(N), lo=40, hi=90) * .22 * g_zero, 0)
buzz120 = np.sign(np.sin(2 * np.pi * 120 * t)) * .3 + np.sin(2 * np.pi * 240 * t) * .2
fl = np.abs(np.sin(t * 37 * 2.3) * np.sin(t * 11.3 + 2.3) * np.sin(t * 3.1))
place(filt(buzz120, hi=3000) * (.007 + .012 * (fl > .55)) * g_zero, 0, 1.0, .1)
place(filt(noise(N), lo=60, hi=400) * .12 * g_stair, 0)
place(filt(noise(N), hi=500) * .05 * g_hall, 0)
home = np.convolve(noise(N), np.ones(300) / 300, mode="same"); home /= np.abs(home).max()
fridge = np.sin(2 * np.pi * 50 * t) * .4 + np.sin(2 * np.pi * 100 * t) * .2
place((home * .035 + fridge * .006) * g_home, 0)
# flashback: distant fire crackle + far siren
crk = noise(N) * (rng.random(N) > .9985); crk = filt(conv(crk, np.exp(-np.arange(idx(.02)) / SR * 300))[:N], lo=800, hi=6000)
place(crk * .5 * g_fire + filt(noise(N), hi=300) * .2 * g_fire, 0)
sir_f = 700 + 250 * np.sin(2 * np.pi * .5 * t)
place(filt(np.sin(2 * np.pi * np.cumsum(sir_f) / SR), hi=1500) * .02 * g_fire, 0, 1.0, .5)
cab = filt(noise(N), lo=80, hi=600); cab /= np.abs(cab).max()
place(cab * .05 * gate([(A(56), A(67))]), 0)

# ------------------------------------------------------------ score
pad = (np.sin(2 * np.pi * 55 * t) + .6 * np.sin(2 * np.pi * 55.3 * t) + .35 * np.sin(2 * np.pi * 82.4 * t)
       + .15 * np.sin(2 * np.pi * 130.8 * t)) * (.6 + .4 * np.sin(2 * np.pi * .05 * t))
auto = curve([(0, .5), (A(5), .6), (A(12), .7), (A(15) - .05, 0), (A(16) + .5, 0), (A(17), .5), (A(25), .6), (A(28), .9), (B(28), 1),
              (A(29), .4), (A(32), .5), (A(34), .8), (A(36), .3), (A(44), .3), (A(46) - .05, 0), (A(48), 0), (A(48) + .4, .5),
              (A(50), .7), (A(51), .2), (A(54), .4), (A(58), .7), (A(63) - .05, .25), (A(67), .35), (A(72), .5),
              (A(73), .6), (A(74), .6), (A(75) - .1, 0), (A(84), 0), (A(84) + .3, .5), (A(85), 0), (A(85) + 1.0, .45),
              (ASK_END - .3, .45), (ASK_END, 0), (DUR, 0)])
place(pad * auto * .05 * (1 - .4 * speaking), 0)


def mbox(freq, dur=3.0):
    n = idx(dur); tt = np.arange(n) / SR
    ph = 2 * np.pi * freq * np.cumsum(1 + .004 * np.sin(2 * np.pi * .45 * tt)) / SR
    return (np.sin(ph) + .35 * np.sin(2 * ph) * np.exp(-tt * 3) + .15 * np.sin(3.98 * ph) * np.exp(-tt * 6)) * np.exp(-tt * 1.6) * env(n, .002, .2)


endfade = curve([(0, 1), (ASK_END - .3, 1), (ASK_END, 0), (DUR, 0)])
mus = np.zeros(N)
for start in (A(85) + .6, A(63) + .3):
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


def knock(close=False):  # the series' knock (episode 1)
    n = idx(.45); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 78 * tt) * np.exp(-tt * 22) + .6 * np.sin(2 * np.pi * 160 * tt) * np.exp(-tt * 35)
    click = np.convolve(noise(n), np.ones(5) / 5, mode="same") * np.exp(-tt * 300)
    s = body + click * .5
    s = filt(s, hi=2200); d = idx(.034); s[d:] += .3 * s[:-d]
    return s


def door_slide(d=1.0):
    n = idx(d); tt = np.arange(n) / SR
    return filt(noise(n), lo=150, hi=900) * np.sin(np.linspace(0, np.pi, n)) * .6 + np.sin(2 * np.pi * 52 * tt) * .2 * np.sin(np.linspace(0, np.pi, n))


# hand squeeze + his held breath
place(filt(noise(idx(.4)), lo=600, hi=4000) * env(idx(.4), .05, .25), A(6) + .3, .05, -.3)
for x in (A(7), A(7) + 1.1):
    place(breath(.8, 900, .5), x, 1.0, -.5)  # the breath behind him
# front camera opening (shutter-ish UI click)
place(tick(2200, .03), A(10) + .1, .15, .2)
# no one there: sub
place(thud(32, 2.6), A(15) - .02, .45)
# slow footsteps with the hand on his shoulder
for k, s_ in enumerate((A(23) - .15, A(24) - .15)):
    place(conv(step(), big[: idx(1.2)])[: idx(1.4)], s_, .12, (-1) ** k * .08)
# "seven years ago": low frequency
place(thud(30, 3.0), B(28) - .9, .5)
# heartbeat at "قلبي وقف"
for x in (A(29) + .1, A(29) + .6):
    place(thud(52, .35), x, .35)
# emergency door: push bar clunk + heavy metal door, hand vanishes (whoosh)
place(thud(80, .4) + filt(noise(idx(.4)), lo=1000, hi=5000) * np.exp(-np.arange(idx(.4)) / SR * 30) * .4, A(32) + .6, .4)
n = idx(1.4); tt = np.arange(n) / SR
place(filt(np.sign(np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(2 * np.pi * .7 * tt)) / SR)) * (np.sin(2 * np.pi * 17 * tt) > 0), lo=150, hi=1500) * np.sin(np.linspace(0, np.pi, n)) * .3, A(32) + .7, .06)
n = idx(.6); place(filt(noise(n), lo=300, hi=3000) * np.sin(np.linspace(0, np.pi, n)) ** 2, A(33) + .1, .08, -.4)
# running up the stairs (reverb)
for k, s_ in enumerate(np.arange(A(34), A(35), .22)):
    place(conv(step(), reverb_ir(1.4, 4, 3000))[: idx(1.2)], s_, .14, (-1) ** k * .1)
place(breath(.6, 1800, .5), A(34) + .4, 1.0); place(breath(.6, 1800, .5), A(34) + 1.4, 1.0)
# fist on the door
for x in (.1, .38, .66, .94):
    place(thud(95, .35) + knock()[: idx(.35)] * .5, A(35) + x, .45, .1)
# door opens, pulled inside, slammed, two locks, chain
place(filt(noise(idx(.8)), lo=200, hi=1200) * np.sin(np.linspace(0, np.pi, idx(.8))), A(36) + .05, .1)
place(thud(65, .7) + knock()[: idx(.7)] * .4 if False else thud(65, .7), A(36) + 1.0, .7)
for x in (A(36) + 2.15, A(36) + 2.45, A(36) + 2.75, A(36) + 3.05):
    place(tick(900, .05) + tick(1800, .02)[: idx(.05)] * 0 if False else tick(900, .05), x, .35, .3)
n = idx(.4); place(filt(noise(n), lo=2000, hi=8000) * (np.sin(2 * np.pi * 30 * np.arange(n) / SR) > 0) * np.exp(-np.arange(n) / SR * 6), A(36) + 3.4, .08, .3)
# he catches his breath
for x in (A(37) - .4, B(38) + .1):
    place(breath(.8, 1600, .45), x, 1.0)
# dad sits: chair creak
n = idx(.9); tt = np.arange(n) / SR
place(filt(np.sign(np.sin(2 * np.pi * np.cumsum(260 + 90 * np.sin(2 * np.pi * 1.3 * tt)) / SR)) * (np.sin(2 * np.pi * 21 * tt) > .2), lo=200, hi=2000) * np.sin(np.linspace(0, np.pi, n)) * .3, A(39) + .5, .06, -.3)
# flashback whoosh in/out
for x in (A(48) - .3, A(51) - .2, A(54) - .2, A(67) - .2):
    n = idx(.6); place(filt(noise(n), lo=400, hi=3000) * np.linspace(0, 1, n) ** 2, x, .06)
# the clock racing (four hours)
for x in np.arange(A(54), A(55), .09):
    place(tick(2600, .015), x, .06, -.2)
# elevator: wrong arrival chime, doors
n = idx(1.2); tt = np.arange(n) / SR
place((np.sin(2 * np.pi * 932 * tt) * np.exp(-tt * 4) + .5 * np.sin(2 * np.pi * 940 * tt) * np.exp(-tt * 4)) * env(n, .003, .1), A(57) - .2, .06)
place(door_slide(1.6), A(57) + .1, .12)
# the second one appears: very low tone; when both look up at once: silence beat
place(thud(34, 3.0), A(59) + .2, .35)
place(thud(28, 2.0), A(64) + .02, .3)
# the three knocks (series' signature) — strong & clear, VO says "طق" with them
for x in (A(75) - .02, A(76) - .02, A(77) - .02):
    place(knock(), x, 2.2, .25)
# dad steps back: floorboard
n = idx(.7); tt = np.arange(n) / SR
place(filt(np.sign(np.sin(2 * np.pi * np.cumsum(200 + 50 * tt) / SR)) * (np.sin(2 * np.pi * 15 * tt) > .3), lo=150, hi=1500) * np.sin(np.linspace(0, np.pi, n)) * .3, A(84) + .4, .07, -.2)
place(breath(1.0, 1500, .4), B(84) + .1, 1.0)

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
