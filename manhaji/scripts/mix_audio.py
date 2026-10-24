"""Fast offline mix of the final soundtrack, mirroring src/audio/SoundTrack.tsx exactly
(hook sound @0, narration @VOICE_START, score x0.9, every SFX cue with its volume) -> out/audio.wav"""
import json, os, re
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, TOTAL, FPS = 48000, 75.0, 30

gen = open(os.path.join(ROOT, 'src/timeline.generated.ts')).read()
Q = json.loads(re.search(r'CUES = (\{.*?\}) as const', gen, re.S).group(1))
VS = float(re.search(r'VOICE_START = ([\d.]+)', gen).group(1))
HOOK = {'lightsOut': 95 / 24}
OUTRO = {'pullBack': Q['wDetails'] - 0.15, 'logo': Q['wSalam'] - 0.05}

src = open(os.path.join(ROOT, 'src/audio/SoundTrack.tsx')).read()
start = src.index('export const SFX')
body = src[start:src.index('];', start)]
cues = []
for expr, name, vol in re.findall(r"\[([^\[\],]+),\s*'(\w+)',\s*([\d.]+)\]", body):
    e = re.sub(r'Q\.(\w+)', lambda m: str(Q[m.group(1)]), expr)
    e = re.sub(r'HOOK\.(\w+)', lambda m: str(HOOK[m.group(1)]), e)
    e = re.sub(r'OUTRO\.(\w+)', lambda m: str(OUTRO[m.group(1)]), e)
    cues.append((eval(e), name, float(vol)))

mix = np.zeros((int(TOTAL * SR), 2), np.float32)


def place(path, t, vol, maxdur=None):
    a, sr = sf.read(path, dtype='float32', always_2d=True)
    assert sr == SR, path
    if a.shape[1] == 1:
        a = np.repeat(a, 2, 1)
    if maxdur:
        a = a[: int(maxdur * SR)]
    s = int(round(t * FPS) / FPS * SR)  # snapped to a frame, like <Sequence from>
    e = min(len(mix), s + len(a))
    mix[s:e] += a[: e - s] * vol


place(os.path.join(ROOT, 'public/hook_audio.wav'), 0, 1.0)
place(os.path.join(ROOT, 'public/voice.wav'), VS, 1.0)
place(os.path.join(ROOT, 'public/music.wav'), 0, 0.9)
for t, n, v in cues:
    place(os.path.join(ROOT, f'public/sfx/{n}.wav'), max(0.0, t), v, 4.0)

print(len(cues), 'sfx cues; peak', round(float(np.abs(mix).max()), 3))
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
sf.write(os.path.join(ROOT, 'out/audio.wav'), mix, SR, subtype='FLOAT')
