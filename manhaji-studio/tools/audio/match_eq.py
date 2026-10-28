import sys, subprocess, numpy as np, os, json
# Match every voice file to the group's median tonal balance (smoothed 1/3-octave, capped),
# then a gentle expander so pauses have the same quiet floor, then static -16 LUFS.
# usage: match_eq.py <outdir> <strength> <cap_db> files...   (files prefixed with '~' get half strength)
outdir, strength, cap = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
items = [(a.startswith('~'), a.lstrip('~')) for a in sys.argv[4:]]
SR=48000; N=4096
edges = 80*2**(np.arange(0, 22)/3)   # 80 Hz … ~10 kHz, 1/3-octave
edges = edges[edges < 12000]
centers = np.sqrt(edges[:-1]*edges[1:])
def profile(f):
    x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-vn','-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout, dtype=np.float32)
    n=len(x)//N; fr=x[:n*N].reshape(n,N); r=20*np.log10(np.sqrt((fr**2).mean(1))+1e-9)
    sp=fr[r>np.percentile(r,55)]
    P=(np.abs(np.fft.rfft(sp*np.hanning(N),axis=1))**2).mean(0); fq=np.fft.rfftfreq(N,1/SR)
    b=np.array([10*np.log10(P[(fq>=a)&(fq<c)].mean()+1e-20) for a,c in zip(edges[:-1],edges[1:])])
    return b - b[(centers>500)&(centers<2000)].mean()
profs = {f: profile(f) for _, f in items}
target = np.median(np.array([profs[f] for h, f in items if not h]), axis=0)
os.makedirs(outdir, exist_ok=True)
for half, f in items:
    d = target - profs[f]
    d = np.convolve(np.pad(d,1,mode='edge'), [0.25,0.5,0.25], mode='valid')   # smooth
    g = np.clip(d*strength*(0.5 if half else 1), -cap, cap)
    g[centers>4500] = np.minimum(g[centers>4500], 2.0)   # never brighten sibilants much
    g[centers<200] = np.minimum(g[centers<200], 4.0)
    ent = ';'.join(f"entry({c:.0f},{v:.2f})" for c, v in zip(centers, g))
    ent = f"entry(20,{g[0]:.2f});" + ent + f";entry(16000,{min(g[-1],0):.2f})"
    out = os.path.join(outdir, os.path.basename(f))
    is_video = f.endswith('.mp4')
    eqs = ','.join(f"equalizer=f={c:.0f}:t=o:w=0.333:g={v*0.75:.2f}" for c, v in zip(centers, g) if abs(v) > 0.3)
    af = (eqs + ',' if eqs else '') + "deesser=i=0.25:m=0.5:f=0.5,agate=threshold=0.004:ratio=1.8:range=0.3:attack=8:release=220:knee=4,alimiter=limit=0.84:level=disabled"
    tmp = out + '.tmp.wav'
    subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f,'-vn','-af',af,'-ar','48000','-ac','1','-c:a','pcm_f32le',tmp],check=True)
    j = subprocess.run(['ffmpeg','-nostdin','-hide_banner','-i',tmp,'-af','loudnorm=print_format=json','-f','null','-'],capture_output=True,text=True).stderr
    j = json.loads(j[j.rindex('{'):j.rindex('}')+1]); gain = min(-16-float(j['input_i']), -1.5-float(j['input_tp']))
    if is_video:
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f,'-i',tmp,'-map','0:v','-map','1:a','-c:v','copy','-af',f'volume={gain:.2f}dB','-ar','48000','-c:a','aac','-b:a','256k','-movflags','+faststart',out],check=True)
    else:
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',tmp,'-af',f'volume={gain:.2f}dB','-ar','48000','-ac','1','-c:a','pcm_s24le',out],check=True)
    os.remove(tmp)
    print(f"{os.path.basename(f):26s} max corr {np.abs(g).max():4.1f} dB  low {g[:4].mean():+5.1f} pres {g[(centers>2000)&(centers<5000)].mean():+5.1f} air {g[centers>5000].mean():+5.1f}")
