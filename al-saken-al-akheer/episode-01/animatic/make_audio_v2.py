"""Mix the ElevenLabs narration with the episode 01 sound design.

Usage: python3 make_audio_v2.py narration.mp3 out.wav

- Narration is the lead element; music/SFX sit underneath it.
- Mother's quoted lines are re-voiced from the narration take: pitched up,
  then either muffled "behind the door" or band-limited "through the phone"
  (panned right). At the sync moment both versions play from the SAME audio.
- Final loudness is normalised separately with ffmpeg loudnorm (-14 LUFS, -1 dBTP).
"""
import os, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000
DUR = 92.5
N = int(SR * DUR)
rng = np.random.default_rng(317)
t = np.arange(N) / SR
L = np.zeros(N)
R = np.zeros(N)
tmp = tempfile.mkdtemp()


def idx(s):
    return int(round(s * SR))


def ff_to_array(src, af=None, start=None, end=None):
    out = os.path.join(tmp, "x.raw")
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    if start is not None:
        cmd += ["-ss", f"{start}", "-to", f"{end}"]
    cmd += ["-i", src]
    if af:
        cmd += ["-af", af]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", out]
    subprocess.run(cmd, check=True)
    return np.fromfile(out, np.float32).astype(float)


def place(sig, at, gain=1.0, pan=0.0):
    """pan -1 = left, +1 = right (constant power)."""
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


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    from itertools import accumulate  # noqa: F401  (kept simple: IIR loop below)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def curve(points):
    """piecewise-linear automation from [(time, value), ...]"""
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)


# ---------------------------------------------------------------- narration
src = sys.argv[1]
vo = ff_to_array(src)
vo = vo / (np.abs(vo).max() + 1e-9) * 0.9
voice = np.zeros(N)
voice[: min(N, len(vo))] = vo[:N]

MOM_DOOR_1 = (19.40, 20.86)
MOM_DOOR_2 = (34.72, 37.15)
MOM_PHONE = (43.81, 45.36)
MOM_SYNC = (49.90, 51.54)

PITCH = "rubberband=pitch=1.2:formant=shifted"
DOOR = f"{PITCH},highpass=f=170,lowpass=f=1400,aecho=0.8:0.55:28|61:0.32|0.18,volume=1.5"
DOOR_UNCANNY = "rubberband=pitch=0.8,highpass=f=120,lowpass=f=900,volume=0.5"
PHONE = f"{PITCH},highpass=f=380,lowpass=f=3300,volume=3,alimiter=limit=0.6"


def cut_dry(a, b, fade=0.02):
    g = np.ones(N)
    ia, ib, nf = idx(a), idx(b), idx(fade)
    g[ia:ib] = 0
    g[ia - nf:ia] = np.linspace(1, 0, nf)
    g[ib:ib + nf] = np.linspace(0, 1, nf)
    voice[:] *= g


def mom(seg, kind, extra_uncanny=False, pan=0.0, gain=1.0):
    a, b = seg
    af = DOOR if kind == "door" else PHONE
    s = ff_to_array(src, af, a, b + 0.35)
    s *= env(len(s), 0.01, 0.05)
    place(s, a, gain, pan)
    if extra_uncanny:
        u = ff_to_array(src, DOOR_UNCANNY, a, b + 0.35)
        place(u * env(len(u), 0.02, 0.1), a + 0.012, gain * 0.55, -0.1)


for seg in (MOM_DOOR_1, MOM_DOOR_2, MOM_PHONE, MOM_SYNC):
    cut_dry(*seg)

mom(MOM_DOOR_1, "door", gain=1.6)
mom(MOM_DOOR_2, "door", extra_uncanny=True, gain=1.5)
mom(MOM_PHONE, "phone", pan=0.45, gain=0.8)
# the impossible coincidence: same audio, two sources, frame-identical
mom(MOM_SYNC, "phone", pan=0.5, gain=0.75)
mom(MOM_SYNC, "door", extra_uncanny=True, pan=-0.05, gain=1.4)

place(voice, 0, 1.0, 0.0)

# ---------------------------------------------------------------- beds
inside = curve([(0, 1), (6.2, 1), (6.6, 0), (9.8, 0), (10.3, 1), (86.55, 1), (86.62, 0), (DUR, 0)])
roomtone = np.convolve(rng.standard_normal(N), np.ones(300) / 300, mode="same")
roomtone /= np.abs(roomtone).max()
hum = 0.5 * np.sin(2 * np.pi * 60 * t) + 0.25 * np.sin(2 * np.pi * 120 * t) + 0.1 * np.sin(2 * np.pi * 180 * t)
bed = (roomtone * 0.05 + hum * 0.010) * inside
place(bed, 0, 1.0)

# exterior: distant city + wind
outside = curve([(0, 0), (6.2, 0), (6.7, 1), (9.7, 1), (10.3, 0), (DUR, 0)])
wind = lowpass(rng.standard_normal(N), 350) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t))
place(wind * outside * 0.35, 0, 1.0)
car = lowpass(rng.standard_normal(idx(3.0)), 500) * np.sin(np.linspace(0, np.pi, idx(3.0))) ** 2
place(car * 0.25, 6.8, 1.0, -0.6)

# drone (music) with automation — cut to silence at key beats
lfo = 0.65 + 0.35 * np.sin(2 * np.pi * 0.07 * t)
drone = (np.sin(2 * np.pi * 49 * t) + 0.7 * np.sin(2 * np.pi * 49.35 * t)
         + 0.3 * np.sin(2 * np.pi * 73.4 * t) + 0.18 * np.sin(2 * np.pi * 146.8 * t)
         + 0.08 * np.sin(2 * np.pi * 207.7 * t)) * lfo
dr = curve([(0, .35), (6.2, .35), (6.8, 0), (10.3, 0), (11, .25), (15.5, .25), (15.7, 0), (18.5, 0),
            (23.6, .25), (32.4, .6), (32.6, 0), (37.4, 0), (38.5, .35), (45.6, .45),
            (49.85, 0), (56.2, 0), (56.5, .5), (65.5, .7), (65.6, 0), (70.1, 0), (70.3, .15),
            (80.5, .75), (80.6, 0), (DUR, 0)])
place(drone * dr * 0.07, 0, 1.0)

# low cinematic rumble under the shadow reveal
rum = lowpass(rng.standard_normal(N), 70)
rum /= np.abs(rum).max()
place(rum * curve([(0, 0), (70.2, 0), (78, .8), (80.6, 1), (80.65, 0), (DUR, 0)]) * 0.35, 0, 1.0)

# riser into the sync moment (45.7 → 49.9, then hard cut)
n = idx(4.15)
tt = np.arange(n) / SR
f = 180 + 900 * (tt / tt[-1]) ** 2
riser = np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / tt[-1]) ** 2
riser += lowpass(rng.standard_normal(n), 2500) * (tt / tt[-1]) ** 3 * 0.6
place(riser * 0.10, 45.72, 1.0)

# second, very quiet riser into the realization
n = idx(2.4)
tt = np.arange(n) / SR
place(np.sin(2 * np.pi * np.cumsum(90 + 300 * (tt / tt[-1]) ** 2) / SR) * (tt / tt[-1]) ** 2 * 0.06, 78.2, 1.0)


# ---------------------------------------------------------------- SFX
def knock(close=False):
    n = idx(0.45)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 78 * tt) * np.exp(-tt * 22) + 0.6 * np.sin(2 * np.pi * 160 * tt) * np.exp(-tt * 35)
    click = np.convolve(rng.standard_normal(n), np.ones(5) / 5, mode="same") * np.exp(-tt * 300)
    s = body + click * 0.5
    if not close:
        s = lowpass(s, 1600)
        d = idx(0.034)
        s[d:] += 0.3 * s[:-d]
    return s


for k in (15.70, 16.37, 17.05):  # land just under the spoken "طق"
    place(knock(), k, 0.95)
place(knock(), 32.62, 0.28)  # the faint one after the message


def buzz(d):
    n = idx(d)
    tt = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * 160 * tt)) * 0.5 + rng.standard_normal(n) * 0.25
    return lowpass(s, 800) * env(n, 0.01, 0.03)


for at in (23.62, 24.15, 56.25, 56.75, 64.0):
    place(buzz(0.38), at, 0.45, 0.15)


def ding():
    n = idx(0.7)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 1318 * tt) * np.exp(-tt * 9) + 0.4 * np.sin(2 * np.pi * 1976 * tt) * np.exp(-tt * 12)
    return s * env(n, 0.003, 0.1)


place(ding(), 26.40, 0.06, 0.15)
place(ding(), 60.78, 0.07, 0.15)
place(ding(), 65.56, 0.07, 0.15)


def ring(d=0.9):
    n = idx(d)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 425 * tt)) * env(n, 0.02, 0.05)


place(ring(), 38.2, 0.05, 0.45)
place(lowpass(rng.standard_normal(idx(0.05)), 3000), 39.50, 0.25, 0.45)  # pickup click
# hospital monitor faint behind mom's phone voice
for b in np.arange(43.0, 45.6, 0.95):
    n = idx(0.11)
    place(np.sin(2 * np.pi * 1000 * np.arange(n) / SR) * env(n, 0.005, 0.03), b, 0.012, 0.5)
# hang up
n = idx(0.12)
place(np.sin(2 * np.pi * 620 * np.arange(n) / SR) * env(n, .005, .02), 54.40, 0.05, 0.4)


def breath(d, fc, g):
    n = idx(d)
    s = lowpass(rng.standard_normal(n), fc)
    return s * np.sin(np.linspace(0, np.pi, n)) ** 2 * g


# Nawaf's breathing after he hangs up (the 2 seconds where nothing happens)
place(breath(0.8, 1500, 0.5), 54.95, 1.0, -0.05)
place(breath(1.0, 1400, 0.45), 55.85, 1.0, -0.05)
# the shadow "breathing" — darker, slower, drifting
for b, p in ((72.6, -0.5), (75.4, -0.2), (78.2, 0.1)):
    place(breath(1.6, 550, 0.18), b, 1.0, p)
# the breath right behind his head at the end — moves from left to right
n = idx(1.15)
br = breath(1.15, 900, 0.8)
a = idx(85.30)
pan = np.linspace(-0.7, 0.4, n)
th = (pan + 1) * np.pi / 4
L[a:a + n] += br * np.cos(th) * 1.414
R[a:a + n] += br * np.sin(th) * 1.414

# ---------------------------------------------------------------- hard silence after the cut
cut = idx(86.62)
L[cut:] *= 0
R[cut:] *= 0

stereo = np.column_stack([L, R])
stereo /= np.abs(stereo).max() + 1e-9
stereo *= 0.8
raw = os.path.join(tmp, "mix.wav")
with wave.open(raw, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())

# two-pass loudnorm → -14 LUFS integrated, -1 dBTP
import json, re
p = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af",
                    "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True)
m = json.loads(re.findall(r"\{[^{}]+\}", p.stderr)[-1])
af = ("loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:"
      f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", str(SR), sys.argv[2]], check=True)
print("written", sys.argv[2])
