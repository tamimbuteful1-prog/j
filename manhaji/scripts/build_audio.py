"""Original sound design for the Manhaji short — everything is synthesised here, no third-party samples.

Outputs
  public/sfx/*.wav   one-shot sound effects (placed on the timeline in src/sfx.ts)
  public/music.wav   full-length original score, already ducked under the narration

Run after scripts/build_voice.py (the music reads the voice track for side-chain ducking)."""
import json, os, re
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def sweep_filter(x, f0, f1, kind='band', blocks=64, curve=2.0):
    """Block-wise filter whose centre moves from f0 to f1 (cheap 'moving resonance')."""
    out = np.zeros_like(x)
    n = len(x)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for i in range(blocks):
        p = (i / (blocks - 1)) ** curve if blocks > 1 else 0
        f = f0 * (f1 / f0) ** p
        seg = x[max(0, edges[i] - 2048):edges[i + 1]]
        if kind == 'band':
            y = bp(seg, f * 0.6, min(f * 1.6, SR / 2 - 200))
        else:
            y = lp(seg, f)
        out[edges[i]:edges[i + 1]] = y[-(edges[i + 1] - edges[i]):]
    return out


def env_ad(n, a, d, shape=4.0):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) * shape / max(d, 1e-4)))
    return e


def reverb(x, secs=1.2, wet=0.25, tone=5000):
    ir_t = t_axis(secs)
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 6.5 / secs)
    ir = lp(ir, tone)
    ir /= np.sqrt((ir ** 2).sum())
    w = fftconvolve(x, ir)
    dry = np.concatenate([x, np.zeros(len(w) - len(x))])
    return dry * (1 - wet) + w * wet


def stereo(x, width=0.25, delay_ms=11):
    d = int(SR * delay_ms / 1000)
    l = x
    r = np.concatenate([np.zeros(d), x])[:len(x)]
    m = (l + r) / 2
    s = (l - r) / 2 * width * 2
    return np.stack([m + s, m - s], 1)


def norm(x, peak=0.89):
    m = np.abs(x).max()
    return x / m * peak if m > 0 else x


def fade_tail(x, ms=20):
    n = int(SR * ms / 1000)
    x[-n:] *= np.linspace(1, 0, n)
    return x


def save(name, x, peak=0.89):
    if x.ndim == 1:
        x = stereo(x)
    x = norm(x, peak)
    x = np.stack([fade_tail(x[:, 0].copy()), fade_tail(x[:, 1].copy())], 1)
    sf.write(os.path.join(ROOT, 'public/sfx', name + '.wav'), x.astype(np.float32), SR)


# ------------------------------------------------------------------ SFX
def whoosh(d=0.9, f0=300, f1=4500, peak_at=0.6):
    t = t_axis(d)
    x = rng.standard_normal(len(t))
    x = sweep_filter(x, f0, f1, 'band', curve=1.2)
    e = np.where(t < d * peak_at, (t / (d * peak_at)) ** 2.2, np.exp(-(t - d * peak_at) * 9))
    return reverb(x * e, 0.8, 0.22)


def impact(d=1.6, f0=110, f1=38):
    t = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-t * 9)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    click = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 45)
    noise = lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 7) * 0.6
    return reverb(body * 1.1 + click * 0.5 + noise, 1.8, 0.3, 3000)


def click(f=3200):
    t = t_axis(0.09)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 400) * 0.6
    return reverb(x, 0.3, 0.15)


def pop(f0=420, f1=980):
    t = t_axis(0.16)
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 60))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32)
    return reverb(x, 0.4, 0.18)


def bell(freq=880, d=2.2, partials=((1, 1), (2.0, .5), (2.76, .35), (5.4, .2), (8.9, .08))):
    t = t_axis(d)
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * (2.2 + r * 0.9)) for r, a in partials)
    x *= np.minimum(1, t / 0.004)
    return reverb(x, 2.0, 0.3, 7000)


def zap(d=0.55):
    t = t_axis(d)
    buzz = np.sign(np.sin(2 * np.pi * 50 * t)) * 0.3 + np.sin(2 * np.pi * 100 * t) * 0.4
    crack = hp(rng.standard_normal(len(t)), 1800) * (rng.random(len(t)) < 0.02)
    crack = lp(np.convolve(crack, np.ones(30) / 6, 'same'), 9000)
    gate = (np.sin(2 * np.pi * 23 * t + 3 * np.sin(2 * np.pi * 7 * t)) > -0.2).astype(float)
    x = (bp(buzz, 80, 3000) * 0.6 + crack * 1.4) * gate * np.exp(-t * 3)
    return reverb(x, 0.6, 0.2)


def power_down(d=1.5):
    t = t_axis(d)
    f = 30 + 90 * np.exp(-t * 2.4)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    hum = lp(saw, 900) * np.exp(-t * 2.0)
    relay = click(1400)[: int(0.09 * SR)]
    x = hum * 0.7
    x[:len(relay)] += relay[:len(x)] * 1.3
    thump = impact(d, 80, 32)[:len(x)] * 0.7
    return reverb(x + thump, 1.4, 0.3, 2500)


def riser(d=1.0):
    t = t_axis(d)
    p = t / d
    noise = sweep_filter(rng.standard_normal(len(t)), 400, 9000, 'band', curve=1.5) * p ** 2
    f = 180 * (8 ** p)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 * p ** 1.5
    return reverb(noise + tone, 0.8, 0.25)


def stamp():
    t = t_axis(0.7)
    thud = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-t * 30)) / SR) * np.exp(-t * 12)
    slap = bp(rng.standard_normal(len(t)), 600, 4000) * np.exp(-t * 55)
    return reverb(thud + slap * 0.8, 0.7, 0.2)


def error_buzz():
    t = t_axis(0.38)
    x = np.sign(np.sin(2 * np.pi * 140 * t)) * (np.sin(2 * np.pi * 5.2 * t) > -0.3)
    return reverb(lp(x, 1200) * np.exp(-t * 4), 0.4, 0.2)


def draw(d=1.3):
    t = t_axis(d)
    x = sweep_filter(rng.standard_normal(len(t)), 1500, 5000, 'band', curve=1)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return reverb(x * e * 0.6, 0.6, 0.25)


def shimmer(d=1.6, base=1318.5):
    out = np.zeros(int(d * SR) + SR)
    for i, m in enumerate([1, 1.25, 1.5, 2, 2.5, 3]):
        n0 = int(i * 0.07 * SR)
        b = bell(base * m, 0.9, ((1, 1), (2.0, .3)))[: int(0.9 * SR)]
        out[n0:n0 + len(b)] += b * (0.8 - i * 0.08)
    return reverb(out[: int(d * SR)], 1.6, 0.35, 9000)


def hum_on(d=1.0):
    t = t_axis(d)
    x = sum(np.sin(2 * np.pi * 60 * k * t) / k for k in (1, 2, 3, 5))
    e = np.minimum(1, t / 0.05) * np.exp(-t * 2.5)
    flick = 1 - 0.7 * (np.sin(2 * np.pi * 31 * t) > 0.6) * (t < 0.25)
    return reverb(bp(x, 50, 2000) * e * flick, 0.6, 0.2)


def sub_drop(d=1.4):
    t = t_axis(d)
    x = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t * 1.2) + 25) / SR) * np.minimum(1, t / 0.02) * np.exp(-t * 2.2)
    return x


def build_sfx():
    os.makedirs(os.path.join(ROOT, 'public/sfx'), exist_ok=True)
    save('whoosh', whoosh())
    save('whoosh_long', whoosh(1.4, 200, 6000, 0.7))
    save('whoosh_short', whoosh(0.45, 600, 6000, 0.55))
    save('impact', impact())
    save('impact_soft', impact(1.2, 90, 40) * 0.8)
    save('click', click())
    save('click_low', click(1600))
    save('pop', pop())
    save('pop_high', pop(700, 1500))
    save('ding', bell(1046.5))
    save('ding_low', bell(659.3))
    save('zap', zap())
    save('power_down', power_down())
    save('riser', riser(1.0))
    save('stamp', stamp())
    save('error', error_buzz())
    save('draw', draw())
    save('shimmer', shimmer())
    save('hum_on', hum_on())
    save('sub_drop', sub_drop())


# ------------------------------------------------------------------ MUSIC
def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def saw(f, t, voices=5, detune=0.12):
    out = np.zeros_like(t)
    for v in range(voices):
        df = f * (1 + (v - (voices - 1) / 2) * detune / 100)
        ph = rng.random()
        out += 2 * ((df * t + ph) % 1) - 1
    return out / voices


def load_timeline():
    src = open(os.path.join(ROOT, 'src/timeline.generated.ts')).read()
    segs = json.loads(re.search(r'SEGMENTS = (\[.*?\]) as const', src, re.S).group(1))
    cues = json.loads(re.search(r'CUES = (\{.*?\}) as const', src, re.S).group(1))
    return segs, cues


def build_music(total):
    segs, cues = load_timeline()
    n = int(total * SR)
    mix = np.zeros((n, 2))
    T0, BEAT = 9.0, 0.5           # 120 BPM grid locked to the first narrated word
    bar = 4 * BEAT
    # Dm - Bb - F - C   (i - VI - III - VII), two bars each
    prog = [[50, 53, 57, 62], [46, 50, 53, 58], [53, 57, 60, 65], [48, 52, 55, 60]]

    def add(x, start, gain=1.0, pan=0.0):
        s = int(start * SR)
        if s >= n:
            return
        if x.ndim == 1:
            x = np.stack([x * (1 - pan) ** 0.5, x * (1 + pan) ** 0.5], 1) / np.sqrt(2) * 1.4
        e = min(n, s + len(x))
        mix[s:e] += x[: e - s] * gain

    def energy(t):
        # section map: (start, end, pad, arp, kick, bass, hats, brightness)
        if t < 8.9:
            return dict(pad=0, arp=0, kick=0, bass=0, hats=0, bright=900)
        if t < cues['wHere'] - 0.3:
            return dict(pad=.8, arp=.6, kick=0, bass=.35, hats=0, bright=1800)
        if t < cues['wP3'] - 0.9:
            return dict(pad=.8, arp=.7, kick=.55, bass=.6, hats=0, bright=2400)
        if t < cues['wVennStart'] - 0.5:
            return dict(pad=.85, arp=.8, kick=.7, bass=.7, hats=.5, bright=3200)
        if t < cues['wDetails'] - 0.2:
            return dict(pad=.9, arp=.9, kick=0, bass=.3, hats=0, bright=4200)
        return dict(pad=1, arp=.7, kick=.5, bass=.6, hats=.35, bright=3000)

    # -- tension drone from the blackout to the transition
    d0, d1 = 3.96, 9.1
    t = t_axis(d1 - d0)
    drone = (np.sin(2 * np.pi * midi(38) * t) + 0.5 * lp(saw(midi(38), t), 300) + 0.25 * np.sin(2 * np.pi * midi(45) * t))
    drone *= np.minimum(1, t / 1.2) * np.where(t > (d1 - d0) - 0.4, np.clip(((d1 - d0) - t) / 0.4, 0, 1), 1)
    add(drone, d0, 0.16)

    # -- harmonic bed
    b = 0
    while T0 + b * bar < total - 0.5:
        st = T0 + b * bar
        en = energy(st)
        chord = prog[(b // 2) % 4]
        if st > cues['wSalam'] - 1.0:
            chord = [50, 57, 62, 65, 69]  # resolve on Dm(add9)
        # pad (one bar, crossfaded)
        tt = t_axis(bar + 0.6)
        pad = sum(saw(midi(m), tt) for m in chord) / len(chord)
        pad = lp(pad, en['bright'] * 0.6)
        pad *= np.minimum(1, tt / 0.35) * np.where(tt > bar, np.clip((bar + 0.6 - tt) / 0.6, 0, 1), 1)
        add(stereo(pad, 0.9, 17), st, 0.22 * en['pad'])
        # bass
        if en['bass']:
            for k in range(8):
                tb = t_axis(BEAT / 2)
                f = midi(chord[0] - 12)
                note = (np.sin(2 * np.pi * f * tb) + 0.3 * lp(saw(f, tb, 1), 400)) * np.exp(-tb * 5) * np.minimum(1, tb / 0.005)
                add(note, st + k * BEAT / 2, 0.30 * en['bass'] * (1 if k % 2 == 0 else 0.6))
        # arp — plucks through chord tones, an octave up, with a dotted echo
        if en['arp']:
            pattern = [0, 2, 1, 3, 2, 1, 3, 2]
            for k, idx in enumerate(pattern):
                tp = t_axis(0.5)
                f = midi(chord[idx % len(chord)] + 12)
                pl = (np.sin(2 * np.pi * f * tp) + 0.35 * np.sin(2 * np.pi * 2 * f * tp)) * np.exp(-tp * 9) * np.minimum(1, tp / 0.003)
                pl = lp(pl, en['bright'] * 1.5)
                pan = 0.35 if k % 2 else -0.35
                add(pl, st + k * BEAT / 2, 0.10 * en['arp'], pan)
                add(pl, st + k * BEAT / 2 + 0.375, 0.035 * en['arp'], -pan)
        # kick + hats
        for k in range(4):
            bt = st + k * BEAT
            if en['kick']:
                tk = t_axis(0.35)
                kick = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-tk * 35)) / SR) * np.exp(-tk * 9)
                add(kick, bt, 0.42 * en['kick'])
            if en['hats']:
                th = t_axis(0.06)
                hat = hp(rng.standard_normal(len(th)), 7000) * np.exp(-th * 80)
                add(hat, bt + BEAT / 2, 0.10 * en['hats'], 0.3)
        b += 1

    # -- final sting under the logo
    tt = t_axis(4.0)
    sting = sum(saw(midi(m), tt, 3) for m in [38, 50, 57, 62, 65, 69]) / 6
    sting = lp(sting, 2600) * np.exp(-tt * 0.9) * np.minimum(1, tt / 0.01)
    add(stereo(sting, 1.0, 19), cues['wSalam'] - 0.05, 0.28)

    # global fade-out at the very end
    fo = int(2.2 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

    # -- side-chain ducking under the narration and under the hook's own dialogue
    duck_src = np.zeros(n)
    v, _ = sf.read(os.path.join(ROOT, 'public/voice.wav'), dtype='float32')
    v = v.mean(1) if v.ndim > 1 else v
    s = int(T0 * SR)
    duck_src[s:s + len(v)] = np.abs(v[: n - s])
    h, _ = sf.read(os.path.join(ROOT, 'public/hook_audio.wav'), dtype='float32')
    h = h.mean(1) if h.ndim > 1 else h
    duck_src[: len(h)] = np.maximum(duck_src[: len(h)], np.abs(h[:n]))
    w = int(0.03 * SR)
    rms = np.sqrt(np.convolve(duck_src ** 2, np.ones(w) / w, 'same'))
    active = np.clip((20 * np.log10(rms + 1e-9) + 45) / 15, 0, 1)
    # attack 25ms / release 350ms smoothing (sub-sampled for speed)
    hop = 240
    a_s = active[::hop]
    sm = np.zeros_like(a_s)
    att, rel = np.exp(-hop / (0.025 * SR)), np.exp(-hop / (0.35 * SR))
    for i in range(1, len(a_s)):
        c = att if a_s[i] > sm[i - 1] else rel
        sm[i] = c * sm[i - 1] + (1 - c) * a_s[i]
    sm = np.interp(np.arange(n), np.arange(len(sm)) * hop, sm)
    gain = 10 ** (-9.5 * sm / 20)
    mix *= gain[:, None]
    mix = np.tanh(mix * 1.1) / 1.1
    sf.write(os.path.join(ROOT, 'public/music.wav'), (mix / max(1, np.abs(mix).max() / 0.7)).astype(np.float32), SR)


if __name__ == '__main__':
    import sys
    total = float(sys.argv[1]) if len(sys.argv) > 1 else 75.0
    build_sfx()
    build_music(total)
    print('sfx + music written')
