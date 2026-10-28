import sys, subprocess, numpy as np, os
# per-file tonal balance of speech frames (dB relative to 300-2000 Hz) + noise floor between words
B = [(80,250),(250,600),(600,2000),(2000,5000),(5000,10000)]
for f in sys.argv[1:]:
    x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-vn','-ac','1','-ar','32000','-f','f32le','-'],capture_output=True).stdout, dtype=np.float32)
    N=1024; n=len(x)//N; fr=x[:n*N].reshape(n,N); r=20*np.log10(np.sqrt((fr**2).mean(1))+1e-9)
    sp = fr[r > np.percentile(r,60)]
    P = (np.abs(np.fft.rfft(sp*np.hanning(N),axis=1))**2).mean(0); fq=np.fft.rfftfreq(N,1/32000)
    ref = P[(fq>=600)&(fq<2000)].sum()
    bands = [10*np.log10(P[(fq>=a)&(fq<b)].sum()/ref) for a,b in B]
    floor = np.percentile(r,8); speech = np.percentile(r,90)
    print(f"{os.path.basename(f)[:26]:26s} " + ' '.join(f"{v:6.1f}" for v in bands) + f"   SNR {speech-floor:5.1f}")
