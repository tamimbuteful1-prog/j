"""Shared mixing helpers for episodes 8+ (narration optional).

If the narration file is 'none', the mix is built with silent narration so the
episode can be previewed; run again with the real ElevenLabs file and every quoted
line is placed in its space automatically (phone speaker, behind a door, below
the stairs, in the room)."""
import json, os, re, subprocess, tempfile, wave
import numpy as np
SR = 48000


class Mix:
    def __init__(self, tl_path, vo_path, tail=9.4, seed=8):
        self.SEG = json.loads(re.search(r"SEG=(\[.*?\]);", open(tl_path).read(), re.S).group(1))
        self.VO_END = self.SEG[-1]["b"]; self.ASK_END = self.VO_END + 5.0; self.DUR = self.ASK_END + 4.4
        self.N = int(self.DUR * SR); self.t = np.arange(self.N) / SR
        self.L = np.zeros(self.N); self.R = np.zeros(self.N); self.rng = np.random.default_rng(seed); self.tmp = tempfile.mkdtemp()
        self.voice = np.zeros(self.N)
        if vo_path and vo_path != 'none':
            raw = os.path.join(self.tmp, "v.raw")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", vo_path, "-ac", "1", "-ar", str(SR), "-f", "f32le", raw], check=True)
            v = np.fromfile(raw, np.float32).astype(float); self.voice[: min(self.N, len(v))] = v[: self.N]
        env = np.convolve(np.abs(self.voice), np.ones(self.i(.25)) / self.i(.25), mode="same")
        self.speaking = np.clip(env / (env.max() * .15 + 1e-9), 0, 1)

    A = lambda self, i: self.SEG[i]["a"]
    B = lambda self, i: self.SEG[i]["b"]
    i = lambda self, s: int(round(s * SR))
    noise = lambda self, n: self.rng.standard_normal(n)

    def place(self, sig, at, gain=1.0, pan=0.0):
        a = self.i(at); b = min(self.N, a + len(sig))
        if b <= a or a < 0: return
        th = (pan + 1) * np.pi / 4
        self.L[a:b] += sig[: b - a] * gain * np.cos(th) * 1.414; self.R[a:b] += sig[: b - a] * gain * np.sin(th) * 1.414

    def env(self, n, att, rel):
        e = np.ones(n); na, nr = int(att * SR), int(rel * SR)
        if na: e[:na] = np.linspace(0, 1, na)
        if nr: e[-nr:] *= np.linspace(1, 0, nr)
        return e

    def filt(self, x, lo=None, hi=None):
        X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
        if hi: X *= 1 / np.sqrt(1 + (f / hi) ** 4)
        if lo: X *= 1 - 1 / np.sqrt(1 + (f / lo) ** 4)
        return np.fft.irfft(X, len(x))

    def conv(self, x, ir):
        n = len(x) + len(ir) - 1; m = 1 << (n - 1).bit_length()
        return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:n]

    def ir(self, sec, decay, hi=4000):
        n = self.i(sec); r = self.rng.standard_normal(n) * np.exp(-np.arange(n) / SR * decay); r = self.filt(r, hi=hi)
        return r / np.sqrt(np.sum(r ** 2))

    def curve(self, pts):
        ts, vs = zip(*pts); return np.interp(self.t, ts, vs)

    def gate(self, spans, fade=.3):
        g = np.zeros(self.N)
        for a, b in spans: g[self.i(a):self.i(b)] = 1
        k = max(1, self.i(fade)); return np.convolve(g, np.ones(k) / k, mode="same")

    # -------- quoted lines (only if a narration exists)
    def grab(self, i0, i1, keep=False):
        a, b = self.i(self.A(i0) - .03), self.i(self.B(i1) + .2); s = self.voice[a:b].copy()
        if not keep: self.voice[a:b] = 0
        return s

    def q_room(self, i0, i1, gain=1.0, pan=0.0):
        s = self.grab(i0, i1); w = self.conv(s, self.ir(.45, 9, 5000)); o = np.zeros(len(w)); o[: len(s)] += s * .85; o += w * .25; self.place(o, self.A(i0) - .03, gain, pan)

    def q_door(self, i0, i1, gain=1.3, pan=.35):
        s = self.grab(i0, i1); d = self.filt(s, lo=160, hi=1300) * 1.6; w = self.conv(d, self.ir(1.0, 5, 3000)); o = np.zeros(len(w)); o[: len(d)] += d; o += w * .5; self.place(o, self.A(i0) - .03, gain, pan)

    def q_phone(self, i0, i1, gain=1.3, pan=.15):
        s = self.grab(i0, i1); p = self.filt(s, lo=380, hi=3600) * 1.7; p = np.tanh(p * 1.6) / 1.6; self.place(p, self.A(i0) - .03, gain, pan)

    def q_below(self, i0, i1, gain=1.25, pan=.25):
        s = self.grab(i0, i1); d = self.filt(s, lo=150, hi=2600); w = self.conv(d, self.ir(2.2, 2.4, 3000)); o = np.zeros(len(w)); o[: len(d)] += d * .55; o += w * .8; self.place(o, self.A(i0) - .03, gain, pan)

    def q_memory(self, i0, i1, gain=1.0):
        s = self.grab(i0, i1); d = self.filt(s, lo=300, hi=3000); w = self.conv(d, self.ir(1.6, 3, 2500)); o = np.zeros(len(w)); o[: len(d)] += d * .6; o += w * .7; self.place(o, self.A(i0) - .03, gain, -.2)

    # -------- sounds
    def knock(self):
        n = self.i(.45); tt = np.arange(n) / SR
        body = np.sin(2 * np.pi * 78 * tt) * np.exp(-tt * 22) + .6 * np.sin(2 * np.pi * 160 * tt) * np.exp(-tt * 35)
        s = self.filt(body + np.convolve(self.noise(n), np.ones(5) / 5, mode="same") * np.exp(-tt * 300) * .5, hi=2200); d = self.i(.034); s[d:] += .3 * s[:-d]; return s

    def thud(self, f=60, d=.5):
        n = self.i(d); tt = np.arange(n) / SR
        return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) + self.filt(self.noise(n), hi=400) * np.exp(-tt * 14) * .6

    def tick(self, f=1500, d=.03):
        n = self.i(d); tt = np.arange(n) / SR; return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 200)

    def step(self, heavy=False):
        n = self.i(.35); tt = np.arange(n) / SR
        s = np.sin(2 * np.pi * (70 if heavy else 110) * tt) * np.exp(-tt * (18 if heavy else 30))
        return s + self.filt(self.noise(n), lo=200, hi=2500 if heavy else 4000) * np.exp(-tt * (40 if heavy else 60)) * .6

    def breath(self, d, fc, g):
        n = self.i(d); return self.filt(self.noise(n), hi=fc) * np.sin(np.linspace(0, np.pi, n)) ** 2 * g

    def buzz(self, d=.35):
        n = self.i(d); tt = np.arange(n) / SR
        return self.filt(np.sign(np.sin(2 * np.pi * 160 * tt)) * .5 + self.noise(n) * .25, hi=800) * self.env(n, .01, .03)

    def ding(self):
        n = self.i(.7); tt = np.arange(n) / SR
        return (np.sin(2 * np.pi * 1318 * tt) * np.exp(-tt * 9) + .4 * np.sin(2 * np.pi * 1976 * tt) * np.exp(-tt * 12)) * self.env(n, .003, .1)

    def cry(self, d=3.0):
        n = self.i(d); tt = np.arange(n) / SR
        sob = (np.sin(2 * np.pi * 1.4 * tt) > -.3).astype(float); sob = np.convolve(sob, np.ones(self.i(.08)) / self.i(.08), mode="same")
        v = np.sin(2 * np.pi * np.cumsum(430 + 70 * np.sin(2 * np.pi * 2.3 * tt) + 40 * self.rng.standard_normal(n) * .02) / SR)
        v = v + .4 * np.sin(2 * np.pi * np.cumsum(860 + 140 * np.sin(2 * np.pi * 2.3 * tt)) / SR) + self.noise(n) * .25
        return self.filt(v * sob, lo=250, hi=2200) * np.sin(np.linspace(0, np.pi, n)) ** .5

    def laugh(self, d=1.6):
        n = self.i(d); tt = np.arange(n) / SR
        bursts = (np.sin(2 * np.pi * 5.5 * tt) > .2).astype(float) * np.exp(-tt * 1.2)
        v = np.sin(2 * np.pi * np.cumsum(380 - 60 * tt) / SR) + self.noise(n) * .5
        return self.filt(v * bursts, lo=250, hi=2400)

    def mbox(self, freq, dur=3.0):
        n = self.i(dur); tt = np.arange(n) / SR
        ph = 2 * np.pi * freq * np.cumsum(1 + .004 * np.sin(2 * np.pi * .45 * tt)) / SR
        return (np.sin(ph) + .35 * np.sin(2 * ph) * np.exp(-tt * 3) + .15 * np.sin(3.98 * ph) * np.exp(-tt * 6)) * np.exp(-tt * 1.6) * self.env(n, .002, .2)

    def score(self, auto_pts, motif_starts=()):
        t = self.t
        pad = (np.sin(2 * np.pi * 55 * t) + .6 * np.sin(2 * np.pi * 55.3 * t) + .35 * np.sin(2 * np.pi * 82.4 * t) + .15 * np.sin(2 * np.pi * 130.8 * t)) * (.6 + .4 * np.sin(2 * np.pi * .05 * t))
        self.place(pad * self.curve(auto_pts) * .05 * (1 - .4 * self.speaking), 0)
        mus = np.zeros(self.N)
        for st in motif_starts:
            for off, m in ((0, 76), (.9, 72), (1.8, 69), (2.7, 68), (4.5, 69), (5.4, 72), (6.3, 71)):
                s = self.mbox(440 * 2 ** ((m - 69) / 12)); a = self.i(st + off)
                if a < self.N: mus[a:a + len(s)] += s[: max(0, min(len(s), self.N - a))]
        if np.abs(mus).max() > 0:
            mus = self.conv(mus, self.ir(2.6, 2.4, 3500))[: self.N]; mus /= np.abs(mus).max() + 1e-9
            self.place(mus * .045 * self.curve([(0, 1), (self.ASK_END - .3, 1), (self.ASK_END, 0), (self.DUR, 0)]) * (1 - .45 * self.speaking), 0)

    def finish(self, out_path):
        self.place(self.voice, 0, 1.0)
        self.L[self.i(self.ASK_END):] = 0; self.R[self.i(self.ASK_END):] = 0
        st = np.column_stack([self.L, self.R]); st /= np.abs(st).max() + 1e-9; st *= .8
        raw = os.path.join(self.tmp, "mix.wav")
        with wave.open(raw, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
        p = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
        m = json.loads(re.findall(r"\{[^{}]+\}", p.stderr)[-1])
        af = ("loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:"
              f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", str(SR), out_path], check=True)
        print("written", out_path, f"{self.DUR:.2f}s")
