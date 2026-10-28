import sys, subprocess, re, numpy as np
# short-term (3 s) loudness of the mix every 0.1 s inside [a, b]; report spread and 1-second jumps
f, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
log = subprocess.run(['ffmpeg','-nostdin','-hide_banner','-i',f,'-af','ebur128','-f','null','-'],capture_output=True,text=True).stderr
rows = re.findall(r't:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+)\s+S:\s*(-?[\d.]+)', log)
t = np.array([float(r[0]) for r in rows]); S = np.array([float(r[2]) for r in rows]); M = np.array([float(r[1]) for r in rows])
k = (t >= a + 3) & (t <= b)
s = S[k]; tt = t[k]
print(f"short-term in narration: min {s.min():.1f} p5 {np.percentile(s,5):.1f} median {np.median(s):.1f} p95 {np.percentile(s,95):.1f} max {s.max():.1f}")
jumps = [(tt[i], s[i+10]-s[i]) for i in range(len(s)-10) if abs(s[i+10]-s[i]) > 3]
print("1-s jumps > 3 LU:", len(jumps), [f"{x:.1f}s:{d:+.1f}" for x, d in jumps[:15]])
