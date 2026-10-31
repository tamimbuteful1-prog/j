"""Episode 03 mix: paced narration + location-based ambience + B-roll SFX + soft score.

Usage: python3 make_audio_ep3.py vo_paced.wav timeline.js out.wav
- Narrator is never pitch-shifted or re-voiced. Only the father's quoted lines
  (39–40, 72–73) are *placed* in the space: distance + corridor reverb, from the apartment.
- Room = muffled & quiet, elevator = mechanical hum, floor zero = big empty reverb.
- Final: -14 LUFS integrated, true peak under -1 dBTP.
"""
import json, os, re, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000
vo_path, tl_path, out_path = sys.argv[1:4]
SEG = json.loads(re.search(r"SEG=(\[.*?\]);", open(tl_path).read(), re.S).group(1))
A = lambda i: SEG[i]["a"]
B = lambda i: SEG[i]["b"]
END_CUT = B(76) + 2.6
DUR = END_CUT + 6.2
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(3)
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
    ir = filt(ir, hi=hi)
    return ir / np.sqrt(np.sum(ir ** 2))  # unit energy: reverb doesn't add loudness


def curve(points):
    ts, vs = zip(*points); return np.interp(t, ts, vs)


def gate(spans, fade=0.3):
    g = np.zeros(N)
    for a, b in spans:
        g[idx(a):idx(b)] = 1
    k = max(1, idx(fade)); return np.convolve(g, np.ones(k) / k, mode="same")


def ff(path):
    out = os.path.join(tmp, "x.raw")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", out], check=True)
    return np.fromfile(out, np.float32).astype(float)


noise = lambda n: rng.standard_normal(n)

# ------------------------------------------------------------ locations (from the visual timeline)
ROOM = [(A(5), A(9))]
ELEV = [(0, A(4) - .25), (A(11), A(29) + .5)]
HALL = [(A(9), A(11))]
ZERO = [(A(29) - .3, END_CUT)]
OUT = [(A(4) - .1, A(5))]
g_room, g_elev, g_hall, g_zero, g_out = (gate(s) for s in (ROOM, ELEV, HALL, ZERO, OUT))

# ------------------------------------------------------------ narration + the father's voice
vo = ff(vo_path); voice = np.zeros(N); voice[: min(N, len(vo))] = vo[:N]
venv = np.convolve(np.abs(voice), np.ones(idx(.25)) / idx(.25), mode="same")
speaking = np.clip(venv / (venv.max() * .15), 0, 1)


def grab(a, b):
    s = voice[idx(a - .03): idx(b + .25)].copy(); voice[idx(a - .03): idx(b + .25)] = 0; return s


big = reverb_ir(2.4, 2.2, 3500)


def father(seg_a, seg_b, gain=1.0, pan=-.15):
    s = grab(A(seg_a), B(seg_b))
    dry = filt(s, lo=140, hi=3800) * .55
    wet = conv(filt(s, lo=200, hi=2600), big)
    wet = wet / (np.abs(wet).max() + 1e-9) * np.abs(s).max() * .9
    out = np.zeros(len(wet)); out[: len(dry)] += dry; out += wet * .75
    place(out, A(seg_a) - .03, gain, pan)
    return s


nawaf_call = father(39, 40, 1.15, -.2)
father(72, 73, 1.15, -.1)
place(voice, 0, 1.0)
# faint echo of "نواف…" after the reveal, then nothing
echo_src = nawaf_call[: idx(B(39) - A(39) + .2)]
e = conv(filt(echo_src, lo=250, hi=2000), reverb_ir(3.0, 1.6, 2500))
e /= np.abs(e).max() + 1e-9
place(e * np.abs(echo_src).max() * .5, B(76) + .55, 1.0, .25)

# ------------------------------------------------------------ ambience beds
rt = np.convolve(noise(N), np.ones(300) / 300, mode="same"); rt /= np.abs(rt).max()
hum60 = .5 * np.sin(2 * np.pi * 60 * t) + .25 * np.sin(2 * np.pi * 120 * t) + .1 * np.sin(2 * np.pi * 180 * t)
place((rt * .04 + hum60 * .008) * g_room, 0)
# elevator: motor drone + cabin hum + rattle while moving
moving = gate([(0, A(3) + 1.3), (A(12) + .8, A(27) + .2)], .4)
motor = (np.sin(2 * np.pi * 47 * t) + .6 * np.sin(2 * np.pi * 94 * t + 1) + .3 * np.sin(2 * np.pi * 141 * t)) * (.8 + .2 * np.sin(2 * np.pi * 3 * t))
rattle = filt(noise(N), lo=300, hi=1800) * (np.sin(2 * np.pi * 7 * t) > .6)
cab = filt(noise(N), lo=80, hi=600)
cab /= np.abs(cab).max()
place((motor * .05 * moving + rattle * .01 * moving + cab * .05) * g_elev, 0)
# fluorescent buzz in the elevator & on floor zero (louder when it flickers)
buzz120 = np.sign(np.sin(2 * np.pi * 120 * t)) * .3 + np.sin(2 * np.pi * 240 * t) * .2
fl = np.abs(np.sin(t * 37 * 2.3) * np.sin(t * 11.3 + 2.3) * np.sin(t * 3.1))
place(filt(buzz120, hi=3000) * (.006 + .01 * (fl > .55)) * (g_elev + g_zero), 0, 1.0, .1)
# hallway: quiet air, distant AC
place(filt(noise(N), hi=500) * .05 * g_hall, 0)
# outside: wind + distant city
place(filt(noise(N), hi=350) * .25 * g_out, 0)
# floor zero: deep empty air + very low wind + far drips
air = filt(noise(N), hi=220); air /= np.abs(air).max()
place(air * .2 * g_zero, 0, 1.0, -.1)
place(filt(noise(N), lo=40, hi=90) * .25 * g_zero, 0)
for d in np.arange(A(30), END_CUT, 3.7):
    n = idx(.25); tt = np.arange(n) / SR
    drip = np.sin(2 * np.pi * (1400 + 600 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 40)
    place(conv(drip, big[: idx(1.5)])[: idx(1.6)] * .25, d + rng.uniform(0, 1.5), .03, rng.uniform(-.7, .7))

# ------------------------------------------------------------ score: very soft, low, mostly drones
pad = (np.sin(2 * np.pi * 55 * t) + .6 * np.sin(2 * np.pi * 55.3 * t) + .35 * np.sin(2 * np.pi * 82.4 * t)
       + .15 * np.sin(2 * np.pi * 130.8 * t)) * (.6 + .4 * np.sin(2 * np.pi * .05 * t))
pad_auto = curve([(0, .5), (A(2), .5), (A(4) - .3, 0), (A(5), 0), (A(5) + 1, .4), (A(13), .4), (A(17), .6), (A(22), .9),
                  (A(23) - .05, 0), (A(24) + 1, 0), (A(25), .4), (A(29), .5), (A(38), .6), (A(39) - .05, 0), (A(41), 0), (A(41) + 1, .4),
                  (A(49), .7), (A(51), 1), (A(51) + .05, 0), (A(53), 0), (A(54), .4), (A(60), .6), (B(60) - .55, .9), (B(60) - .5, 0),
                  (A(61) + .3, 0), (A(61) + .6, .7), (A(63) + .6, .7), (A(63) + .7, 0), (A(66), 0), (A(66) + .5, .3), (A(71), .6),
                  (A(74), .8), (A(75), .9), (A(76) - .05, 0), (DUR, 0)])
place(pad * pad_auto * .05 * (1 - .4 * speaking), 0)


# soft music-box motif (same instrument family as episode 2), sparse
def mbox(freq, dur=3.0):
    n = idx(dur); tt = np.arange(n) / SR
    ph = 2 * np.pi * freq * np.cumsum(1 + .004 * np.sin(2 * np.pi * .45 * tt)) / SR
    return (np.sin(ph) + .35 * np.sin(2 * ph) * np.exp(-tt * 3) + .15 * np.sin(3.98 * ph) * np.exp(-tt * 6)) * np.exp(-tt * 1.6) * env(n, .002, .2)


motif = [(0, 76), (.9, 72), (1.8, 69), (2.7, 68), (4.5, 69)]
mus = np.zeros(N)
for start in (A(5) + .5, A(41) + 1.2, A(54) + .4):
    for off, m in motif:
        s = mbox(440 * 2 ** ((m - 69) / 12)); a = idx(start + off)
        mus[a:a + len(s)] += s[: max(0, min(len(s), N - a))]
mus = conv(mus, reverb_ir(2.6, 2.4, 3500))[:N]
mus /= np.abs(mus).max() + 1e-9
place(mus * .045 * (1 - .45 * speaking), 0)

# ------------------------------------------------------------ SFX
def thud(f=60, d=.5, g=1.0):
    n = idx(d); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) + filt(noise(n), hi=400) * np.exp(-tt * 14) * .6) * g


def metal(d=.6, f=900):
    n = idx(d); tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * k * tt * (1 + .01 * k)) * np.exp(-tt * (6 + 2 * k)) / k for k in (1, 1.47, 2.09, 2.76))
    return s * env(n, .002, .05)


def ding(f=1046):
    n = idx(1.2); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 4) + .3 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 7)) * env(n, .003, .1)


def tick(f=1500):
    n = idx(.03); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 200)


def step(heavy=False):
    n = idx(.35); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * (70 if heavy else 110) * tt) * np.exp(-tt * (18 if heavy else 30))
    s += filt(noise(n), lo=200, hi=2500 if heavy else 4000) * np.exp(-tt * (40 if heavy else 60)) * .6
    return s


def breath(d, fc, g):
    n = idx(d); return filt(noise(n), hi=fc) * np.sin(np.linspace(0, np.pi, n)) ** 2 * g


def door_slide(d=1.0):
    n = idx(d); tt = np.arange(n) / SR
    return filt(noise(n), lo=150, hi=900) * np.sin(np.linspace(0, np.pi, n)) * .6 + np.sin(2 * np.pi * 52 * tt) * .2 * np.sin(np.linspace(0, np.pi, n))


def creak(d=1.4):
    n = idx(d); tt = np.arange(n) / SR
    f = 320 + 140 * np.sin(2 * np.pi * .9 * tt) + 40 * np.sin(2 * np.pi * 7 * tt)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (np.sin(2 * np.pi * 23 * tt) > 0) * .4
    return filt(s, lo=200, hi=2400) * np.sin(np.linspace(0, np.pi, n))


# hook: display ticks per number, stop clunk, black flash silence
for k in range(5):
    place(tick(1200 + k * 40), k * .55, .12)
place(tick(700), A(1) + .7, .2)
place(thud(48, .9), B(3) + .35, .7)
place(metal(.8, 300), B(3) + .38, .08, .2)
# B-roll exterior: car pass
n = idx(3); place(filt(noise(n), hi=500) * np.sin(np.linspace(0, np.pi, n)) ** 2, A(4) + .2, .25, -.6)
# getting up + running to the door
place(filt(noise(idx(.5)), hi=1200) * env(idx(.5), .05, .3), A(7) + .2, .12)  # sheets
for k, s_ in enumerate(np.arange(A(8) - .6, B(8), .32)):
    place(filt(step(), hi=2500), s_, .18, (-1) ** k * .1)
place(creak(.7), B(8) - .45, .05)
# hallway running (echoey) + call button presses
for k, s_ in enumerate(np.arange(A(9), A(10) + .9, .3)):
    place(conv(step(), reverb_ir(.6, 7))[: idx(.8)], s_, .12, (-1) ** k * .1)
for x in (.1, .55, 1.0, 1.4):
    place(tick(2200), A(10) + 1.2 + x, .25, .2)
place(ding(988), A(10) + 2.0, .05, .1)
place(door_slide(1.0), A(10) + 2.1, .12)
# inside: G button, doors close, start
place(tick(1800), A(11) + .9, .25, .3)
place(door_slide(.9), A(12), .14)
place(thud(55, .5), A(12) + .85, .35)
# each floor passing: a soft mechanical tick, synced to the spoken numbers
for i in (13, 14, 15, 16):
    place(tick(900), A(i), .1, .1)
    place(metal(.4, 220), A(i) + .02, .03)
# it doesn't stop: the motor note bends down (sense of going deeper)
n = idx(A(23) - A(17)); tt = np.arange(n) / SR
place(np.sin(2 * np.pi * np.cumsum(70 - 25 * tt / tt[-1]) / SR) * (tt / tt[-1]) * .5, A(17), .06)
# zero: sub hit + silence
place(thud(36, 2.4), A(23) - .02, .6)
# no zero button: fingertip taps
for x in np.arange(A(25), B(26), .55):
    place(tick(2600), x, .06, .25)
# arrival chime — slightly detuned, wrong
place(ding(932) * .8 + np.concatenate([np.zeros(idx(.012)), ding(940)])[: idx(1.2)] * .5, A(27) + .3, .07)
place(door_slide(1.6), A(28) + .05, .12)
# floor zero: the open door creaks
place(conv(creak(1.6), big)[: idx(3.5)] * .15, A(35) + 1.1, .25, -.2)
# stepping back
place(conv(step(), big[: idx(1.5)])[: idx(1.8)], A(36) + .3, .08)
# looking around: clothes rustle
place(filt(noise(idx(.6)), lo=800, hi=4000) * env(idx(.6), .05, .3), A(41) + .2, .03)
# photos: each spotlight a faint electric tick
for x in np.arange(A(44), A(47), 1.2):
    place(tick(600), x, .05)
# walking along the wall
for k, s_ in enumerate(np.arange(A(47), A(48) + .9, .55)):
    place(conv(step(), big[: idx(1.2)])[: idx(1.4)], s_, .05, (-1) ** k * .08)
# heartbeat at "قلبي بيوقف"
for x in (A(50), A(50) + .55, A(50) + 1.4, A(50) + 1.95):
    place(thud(52, .35), x, .35)
# photo reveal: silence then a low tone
place(thud(40, 2.0), A(52) - .02, .35)
# phone out
place(filt(noise(idx(.3)), lo=1000, hi=5000) * env(idx(.3), .02, .2), A(58) + .1, .05)
# "بكرة": low frequency hit, music already cut
place(thud(32, 2.6), B(60) - .55, .7)
# running back (echoey, faster) + doors slam
for k, s_ in enumerate(np.arange(A(61), A(63) + .55, .26)):
    place(conv(step(), big[: idx(1.2)])[: idx(1.3)], s_, .09, (-1) ** k * .1)
place(door_slide(.55), A(63), .15)
place(thud(70, .6) + metal(.6, 500)[: idx(.6)] * .3, A(63) + .55, .45)
# button won't respond; fist on the door
for x in (.1, .45, .8, 1.2, 1.6):
    place(tick(1600), A(64) + x, .2, .2)
place(thud(90, .4) + metal(.5, 420)[: idx(.4)] * .25, A(64) + 2.0, .35)
place(thud(90, .4) + metal(.5, 420)[: idx(.4)] * .25, A(64) + 2.45, .3)
# his breathing on floor zero
for x in (B(64) + .1, B(64) + 1.0, B(71) + .2):
    place(breath(.8, 1500, .4), x, 1.0)
# the footsteps from the apartment: one… two… then silence
for x in (A(67) - .25, A(68) - .25):
    place(conv(step(True), big)[: idx(3)], x, .45, -.2)
# total silence after the cut
L[idx(END_CUT):] = 0; R[idx(END_CUT):] = 0
# micro black-flash silence at the hook
L[idx(A(4) - .25):idx(A(4) - .1)] *= .1; R[idx(A(4) - .25):idx(A(4) - .1)] *= .1

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
