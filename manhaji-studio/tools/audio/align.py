import sys, subprocess, json, numpy as np
# find where each [start,end] segment of SRC appears in DST (log-RMS envelope cross-correlation)
src, dst, plan = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
lo, hi = float(sys.argv[4]), float(sys.argv[5])
def env(f, a=None, b=None):
    args=['ffmpeg','-v','error']
    if a is not None: args+=['-ss',str(a),'-to',str(b)]
    x=np.frombuffer(subprocess.run(args+['-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,dtype=np.float32)
    H=160;n=len(x)//H; return np.log10(np.sqrt((x[:n*H].reshape(n,H)**2).mean(1))+1e-4)
D=env(dst, lo, hi); out={}
for lid, parts in plan.items():
    res=[]
    for a,b in parts:
        e=env(src,a,b); e=(e-e.mean())/(e.std()+1e-9); L=len(e)
        best=(-9,0)
        for k in range(0, len(D)-L):
            w=D[k:k+L]; s=np.dot(e,(w-w.mean())/(w.std()+1e-9))/L
            if s>best[0]: best=(s,k)
        st=lo+best[1]/100; res.append([round(st,2), round(st+(b-a),2), round(best[0],2)])
    out[lid]=res; print(lid, res)
json.dump({k:[[float(a),float(b),float(c)] for a,b,c in v] for k,v in out.items()}, open(sys.argv[6],"w"))
