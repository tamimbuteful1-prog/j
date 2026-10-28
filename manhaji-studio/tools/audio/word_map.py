import sys, subprocess, json, difflib, re, numpy as np
from faster_whisper import WhisperModel
# Build a time map old_clip → new_clip from matching ASR words. usage: word_map.py model old.wav new.wav out.json
m = WhisperModel(sys.argv[1], device='cpu', compute_type='int8')
def words(f):
    x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,dtype=np.float32)
    segs,_=m.transcribe(x,language='ar',beam_size=5,word_timestamps=True,condition_on_previous_text=False)
    return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words], len(x)/16000
def norm(w):
    w=re.sub(r'[^\w]','',w); w=re.sub('[أإآ]','ا',w).replace('ة','ه').replace('ى','ي')
    return w.lower()
ow, od = words(sys.argv[2]); nw, nd = words(sys.argv[3])
sm=difflib.SequenceMatcher(a=[norm(w[0]) for w in ow], b=[norm(w[0]) for w in nw], autojunk=False)
bp=[[0.0,0.0]]
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        o=ow[blk.a+k]; n=nw[blk.b+k]
        if o[1] > bp[-1][0] + 0.05 and n[1] > bp[-1][1] + 0.05: bp.append([round(o[1],3), round(n[1],3)])
last_o=max(w[2] for w in ow); last_n=max(w[2] for w in nw)
bp.append([round(max(last_o,bp[-1][0]+0.05),3), round(max(last_n,bp[-1][1]+0.05),3)])
json.dump(bp, open(sys.argv[4],'w'))
print(sys.argv[3].split('/')[-1], f"old {od:.2f}s new {nd:.2f}s matched {len(bp)-2}/{len(ow)} words")
