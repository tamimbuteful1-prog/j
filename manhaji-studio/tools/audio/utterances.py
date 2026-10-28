import sys, subprocess, re, numpy as np, json
from faster_whisper import WhisperModel
model_dir, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout, dtype=np.float32)
H=160; n=len(x)//H; r=20*np.log10(np.sqrt((x[:n*H].reshape(n,H)**2).mean(1))+1e-9)
thr = np.percentile(r, 20) + 12
sp = r > thr
# merge: gaps < 0.45 s are inside an utterance; drop blips < 0.15 s
segs=[]; i=0
while i<n:
    if sp[i]:
        j=i
        while j<n and sp[j]: j+=1
        segs.append([i,j]); i=j
    else: i+=1
merged=[]
for a,b in segs:
    if merged and a-merged[-1][1] < 45: merged[-1][1]=b
    else: merged.append([a,b])
merged=[s for s in merged if s[1]-s[0] >= 15]
m = WhisperModel(model_dir, device="cpu", compute_type="int8")
res=[]
for a,b in merged:
    A=max(0,a*H-3200); B=min(len(x),b*H+3200)
    segs,_ = m.transcribe(x[A:B], language="ar", word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    words=[]; txt=''
    for s in segs:
        txt+=s.text
        for w in s.words or []: words.append({'w':w.word.strip(),'s':round(A/16000+w.start,2),'e':round(A/16000+w.end,2),'p':round(w.probability,2)})
    res.append({'start':round(a/100,2),'end':round(b/100,2),'text':txt.strip(),'words':words})
    print(f"{a/100:7.2f}-{b/100:7.2f} | {txt.strip()}")
json.dump(res, open(out,'w'), ensure_ascii=False, indent=1)
