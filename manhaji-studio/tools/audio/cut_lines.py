import sys, subprocess, json, numpy as np
src, outdir, plan_json = sys.argv[1], sys.argv[2], sys.argv[3]
CUTS = json.loads(open(plan_json).read())
x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar','48000','-f','f32le','-'],capture_output=True,check=True).stdout, dtype=np.float32)
SR=48000; H=int(0.01*SR)
n=len(x)//H; rms=20*np.log10(np.sqrt((x[:n*H].reshape(n,H)**2).mean(1))+1e-9)
sm=np.convolve(rms, np.ones(3)/3, mode='same')
def refine(t, lo=None, hi=None, w=0.25):
    a=max(0,int((t-w)*100)); b=min(n-1,int((t+w)*100))
    if lo is not None: a=max(a,int(lo*100))
    if hi is not None: b=min(b,int(hi*100))
    k=a+int(np.argmin(sm[a:b+1])); return k/100, sm[k]
edges=sorted({round(t,2) for v in CUTS.values() for p in v for t in p})
ref={}
for t in edges: ref[t]=refine(t)
for lid, parts in CUTS.items():
    segs=[]
    for a,b in parts:
        ra,ea=ref[round(a,2)]; rb,eb=ref[round(b,2)]
        segs.append((ra,rb,ea,eb))
    fl=[];lab=[]
    for i,(a,b,ea,eb) in enumerate(segs):
        d=b-a
        fl.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={d-0.025:.3f}:d=0.025[p{i}]")
        lab.append(f"[p{i}]")
        if i<len(segs)-1:
            fl.append(f"anullsrc=r=48000:cl=mono,atrim=0:0.3[g{i}]"); lab.append(f"[g{i}]")
    fl.append(''.join(lab)+f"concat=n={len(lab)}:v=0:a=1[o]")
    subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',src,'-filter_complex',';'.join(fl),'-map','[o]','-ar','48000','-ac','1','-c:a','pcm_s24le',f'{outdir}/{lid}.wav'],check=True)
    print(lid, ' '.join(f"{a:.2f}-{b:.2f}(edge {ea:.0f}/{eb:.0f}dB)" for a,b,ea,eb in segs))
