import sys, glob, os, subprocess, re, difflib, numpy as np
from faster_whisper import WhisperModel
# Restart/repeat detector: split each clip into phrases at pauses, transcribe every phrase on its
# own (so the decoder cannot merge a restart into the next phrase), then flag
#  • a phrase whose words reappear at the start of the next phrase (restart / retake left in)
#  • a repeated 1–4 word n-gram anywhere in the clip
m = WhisperModel(sys.argv[1], device='cpu', compute_type='int8')
def norm(w): return re.sub('[أإآ]','ا',re.sub(r'[^\w]','',w)).replace('ة','ه').replace('ى','ي')
SR=16000
for f in sorted(glob.glob(os.path.join(sys.argv[2], '*.wav'))):
    x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout, dtype=np.float32)
    H=160; n=len(x)//H; r=20*np.log10(np.sqrt((x[:n*H].reshape(n,H)**2).mean(1))+1e-9)
    thr=max(np.percentile(r,15)+10, -45); sp=r>thr
    # phrases separated by ≥0.15 s below threshold
    ph=[]; i=0
    while i<n:
        if sp[i]:
            j=i
            while j<n and (sp[j] or (j+15<n and sp[j:j+15].any())): j+=1
            if j-i>=12: ph.append((i,j))
            i=j
        else: i+=1
    texts=[]
    for a,b in ph:
        seg=x[max(0,a*H-1600):min(len(x),b*H+1600)]
        s,_=m.transcribe(seg,language='ar',beam_size=5,condition_on_previous_text=False)
        t=[norm(w) for w in ' '.join(q.text for q in s).split() if norm(w)]
        texts.append((a/100,t))
    flags=[]
    for (ta,a),(tb,b) in zip(texts,texts[1:]):
        if a and b:
            k=min(len(a),len(b),3)
            if k and difflib.SequenceMatcher(a=a[:k],b=b[:k]).ratio()>=0.66: flags.append(f"restart @{ta:.1f}s «{' '.join(a)}» → «{' '.join(b)}»")
    toks=[w for _,t in texts for w in t]
    for nn in (1,2,3):
        for i in range(len(toks)-2*nn+1):
            if toks[i:i+nn]==toks[i+nn:i+2*nn] and (nn>1 or len(toks[i])>2): flags.append(f"«{' '.join(toks[i:i+nn])}» x2")
    print(os.path.basename(f), f"{len(x)/SR:.2f}s {len(texts)} phrases |", '; '.join(dict.fromkeys(flags)) or 'ok')
    for ta,t in texts: print(f"     {ta:5.2f}  {' '.join(t)}")
