import sys, subprocess, re, json, os
# Shorten pauses longer than MAXP to MAXP and speed speech up by TEMPO (pitch kept).
# Writes <out> and <out>.map.json: [[old_t, new_t], ...] breakpoints (piecewise linear).
src, out = sys.argv[1], sys.argv[2]
MAXP = float(os.environ.get('MAXP', '0.22')); TEMPO = float(os.environ.get('TEMPO', '1.1'))
dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src],capture_output=True,text=True).stdout)
log = subprocess.run(['ffmpeg','-nostdin','-hide_banner','-i',src,'-af','silencedetect=noise=-40dB:d=%f' % MAXP,'-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]; en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
keep=[]; cur=0.0
for a,b in zip(st,en):
    if a <= 0.02 or b >= dur-0.02: continue        # leave the clip edges alone
    mid_a = a + MAXP/2; mid_b = b - MAXP/2
    if mid_b > mid_a + 0.01:
        keep.append((cur, mid_a)); cur = mid_b
keep.append((cur, dur))
fl=[]; lab=[]; bp=[]; t_new=0.0
for i,(a,b) in enumerate(keep):
    d=b-a
    fl.append(f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st={max(0,d-0.006):.4f}:d=0.006[p{i}]"); lab.append(f"[p{i}]")
    bp.append([round(a,4), round(t_new/TEMPO,4)]); t_new += d
    bp.append([round(b,4), round(t_new/TEMPO,4)])
fl.append(''.join(lab)+f"concat=n={len(lab)}:v=0:a=1,atempo={TEMPO}[o]")
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',src,'-filter_complex',';'.join(fl),'-map','[o]','-ar','48000','-ac','1','-c:a','pcm_s24le',out],check=True)
json.dump(bp, open(out+'.map.json','w'))
nd=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out],capture_output=True,text=True).stdout)
print(f"{os.path.basename(src)}: {dur:.2f}s → {nd:.2f}s  ({len(keep)-1} pauses shortened)")
