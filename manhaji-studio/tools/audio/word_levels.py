import sys, glob, os, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[1], device="cpu", compute_type="int8")
rows = []
for f in sorted(glob.glob(os.path.join(sys.argv[2], "*.wav"))):
    x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout, dtype=np.float32)
    segs, _ = m.transcribe(x, language="ar", word_timestamps=True, beam_size=5)
    for s in segs:
        for w in s.words or []:
            a, b = int(w.start*16000), int(w.end*16000)
            seg = x[a:b]
            if len(seg) < 1600: continue
            fr = seg[:len(seg)//320*320].reshape(-1,320)
            r = 20*np.log10(np.sqrt((fr**2).mean(1))+1e-9)
            rows.append((os.path.basename(f), w.word.strip(), w.start, float(np.percentile(r, 90))))
lv = np.array([r[3] for r in rows]); med = np.median(lv)
print(f"words {len(rows)}  median {med:.1f} dB  p5 {np.percentile(lv,5)-med:+.1f}  p95 {np.percentile(lv,95)-med:+.1f}")
for f, w, t, v in rows:
    if abs(v - med) > 4.5: print(f"  {f} @{t:5.2f} «{w}» {v-med:+.1f} dB")
