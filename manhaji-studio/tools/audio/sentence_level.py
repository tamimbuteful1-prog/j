import sys, subprocess, re, os
# Equalise each phrase (split at pauses ≥ 0.2 s) of a voice clip to the same loudness.
# Gains change only inside pauses, so there is no audible jump.
TARGET = -16.0
def lufs(f, a=None, b=None):
    args = ['ffmpeg','-nostdin','-hide_banner']
    if a is not None: args += ['-ss', str(a), '-to', str(b)]
    log = subprocess.run(args+['-i',f,'-af','ebur128','-f','null','-'],capture_output=True,text=True).stderr
    m = re.findall(r'^\s+I:\s+(-?[\d.]+) LUFS', log, re.M)
    return float(m[-1]) if m else None
for f in sys.argv[2:]:
    out = os.path.join(sys.argv[1], os.path.basename(f))
    dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
    log = subprocess.run(['ffmpeg','-nostdin','-hide_banner','-i',f,'-af','silencedetect=noise=-42dB:d=0.2','-f','null','-'],capture_output=True,text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    cuts = [ (s+e)/2 for s, e in zip(st, en) if s > 0.05 and e < dur-0.05 ]
    bounds = [0.0] + cuts + [dur]
    expr, report = [], []
    for a, b in zip(bounds, bounds[1:]):
        I = lufs(f, a, b) if b - a >= 0.45 else None
        g = 0.0 if I is None or I < -40 else max(-4, min(4, TARGET - I))
        if abs(g) < 1.0: g = 0.0
        expr.append((a, b, g)); report.append(f"{a:.2f}-{b:.2f}:{'' if I is None else round(I,1)}→{g:+.1f}")
    vol = '+'.join(f"between(t,{a:.3f},{b:.3f})*{10**(g/20):.4f}" for a, b, g in expr) if expr else '1'
    subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f,'-af',f"volume='{vol}':eval=frame,alimiter=limit=0.84:attack=3:release=50:level=disabled",'-ar','48000','-ac','1','-c:a','pcm_s24le',out],check=True)
    print(os.path.basename(f), ' '.join(report), '| out', lufs(out))
