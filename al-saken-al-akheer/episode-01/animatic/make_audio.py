"""Synthesize the sound bed for the episode 01 animatic (no narration).

Usage: python3 make_audio.py out.wav
Timings follow the shot table in ../README.md.
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 93.0
N = int(SR * DUR)
rng = np.random.default_rng(317)
t = np.arange(N) / SR
mix = np.zeros(N)


def idx(s):
    return int(s * SR)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def env(n, attack, release):
    e = np.ones(n)
    na, nr = int(attack * SR), int(release * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def add(sig, at, gain=1.0):
    a = idx(at)
    b = min(N, a + len(sig))
    mix[a:b] += sig[: b - a] * gain


def gate(start, end, fade=0.4):
    """Volume curve that is 1 inside [start,end] with fades."""
    g = np.zeros(N)
    a, b = idx(start), idx(end)
    g[a:b] = 1
    nf = idx(fade)
    g[a:a + nf] = np.linspace(0, 1, nf)
    g[b - nf:b] = np.linspace(1, 0, nf)
    return g


# --- room tone: low filtered noise + 60Hz mains hum (never cut until black) ---
noise = rng.standard_normal(N)
room = np.convolve(noise, np.ones(400) / 400, mode="same")
room = room / np.abs(room).max()
hum = 0.5 * np.sin(2 * np.pi * 60 * t) + 0.25 * np.sin(2 * np.pi * 120 * t) + 0.08 * np.sin(2 * np.pi * 180 * t)
bed = (room * 0.06 + hum * 0.012) * gate(0, 87.0, 0.3)
mix += bed

# --- drone: detuned low sines with slow LFO ---
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)
drone = (np.sin(2 * np.pi * 55 * t) + 0.7 * np.sin(2 * np.pi * 55.4 * t)
         + 0.35 * np.sin(2 * np.pi * 82.4 * t) + 0.15 * np.sin(2 * np.pi * 164.8 * t)) * lfo
dg = (gate(9.0, 12.0, 0.6) * 0.25
      + gate(24.0, 48.0, 1.0) * np.clip((t - 24) / 24, 0.15, 1.0)
      + gate(57.0, 67.0, 0.8) * 0.35)
mix += drone * dg * 0.05


# --- knock: wooden thump ---
def knock(gain=1.0, close=False):
    n = idx(0.35)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (95 if not close else 120) * tt) * np.exp(-tt * 28)
    body += 0.5 * np.sin(2 * np.pi * 210 * tt) * np.exp(-tt * 45)
    click = rng.standard_normal(n) * np.exp(-tt * (260 if close else 380))
    click = np.convolve(click, np.ones(6) / 6, mode="same")
    s = body * 0.9 + click * (0.6 if close else 0.35)
    if not close:  # muffled behind the door, small corridor slap
        s = lowpass(s, 1800)
        s[idx(0.03):] += 0.25 * s[: len(s) - idx(0.03)]
    return s * gain


for k in (12.3, 13.3, 14.3):
    add(knock(), k, 0.85)
add(knock(close=True), 85.95, 1.0)  # the single knock from INSIDE the room


# --- phone vibration ---
def buzz(d):
    n = idx(d)
    tt = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * 165 * tt)) * 0.5 + rng.standard_normal(n) * 0.2
    return lowpass(s, 900) * env(n, 0.01, 0.03)


add(buzz(0.8), 20.4, 0.35)
add(buzz(0.8), 21.6, 0.35)


# --- notification ding ---
def ding(pitch=1.0):
    n = idx(0.6)
    tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 1318 * pitch * tt) * np.exp(-tt * 9)
         + 0.5 * np.sin(2 * np.pi * 1975 * pitch * tt) * np.exp(-tt * 12))
    s[idx(0.11):] += (np.sin(2 * np.pi * 1760 * pitch * tt) * np.exp(-tt * 9))[: n - idx(0.11)]
    return s * env(n, 0.003, 0.1)


add(ding(), 24.4, 0.10)
add(ding(), 57.8, 0.12)
add(ding(), 63.4, 0.12)


# --- outgoing ring tone (two rings) ---
def ring(d=1.2):
    n = idx(d)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 425 * tt)
    return lowpass(s, 2500) * env(n, 0.02, 0.05)


add(ring(), 36.8, 0.07)
add(ring(), 38.8, 0.07)

# --- hospital monitor beeps in the call background (filtered, faint) ---
for b in np.arange(40.4, 48.0, 1.1):
    n = idx(0.12)
    tt = np.arange(n) / SR
    add(np.sin(2 * np.pi * 1000 * tt) * env(n, 0.005, 0.03), b, 0.018)

# --- hard silence beat at the sync moment: duck everything briefly ---
duck = np.ones(N)
a, b = idx(52.4), idx(53.0)
duck[a:b] = 0.25
mix *= duck


# --- call end tone ---
def tone(f, d):
    n = idx(d)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * env(n, 0.005, 0.02)


add(tone(620, 0.12), 54.5, 0.08)
add(tone(480, 0.16), 54.66, 0.08)


# --- breaths (filtered noise swells) ---
def breath(d, cutoff, gain):
    n = idx(d)
    s = lowpass(rng.standard_normal(n), cutoff)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return s * e * gain


add(breath(0.9, 1400, 0.5), 54.9)
add(breath(1.1, 1400, 0.45), 55.9)
# the OTHER breath: further, slower, darker
for b in (74.0, 76.8, 79.6, 82.4):
    add(breath(1.6, 600, 0.22), b)

# --- after 86.95: total silence ---
mix[idx(87.05):] = 0
mix[idx(85.95):idx(87.05)] *= np.r_[np.ones(idx(0.9)), np.linspace(1, 0, idx(87.05) - idx(85.95) - idx(0.9))]

peak = np.abs(mix).max()
mix = mix / peak * 0.85
pcm = (mix * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()
with wave.open(sys.argv[1] if len(sys.argv) > 1 else "episode-01.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("ok", DUR, "s")
