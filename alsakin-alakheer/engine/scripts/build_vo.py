import json, re, subprocess, os
S='/tmp/claude-0/-home-user-j/dd7140c6-8991-582d-bffa-d17172fdbc15/scratchpad/sak'
OUT='/home/user/j/alsakin-alakheer/engine'
u=json.load(open(f'{S}/utt.json')); ws=[w for x in u for w in x['words']]
# (speaker, exact script text, ASR token count, scene)
L=[
('N','أمي كانت تكلمني من وراء باب غرفتي…',7,1),('N','وفي نفس الوقت، كانت تكلمني بالجوال من المستشفى.',8,1),
('N','خلوني أقول لكم وش صار.',5,2),('N','أول ليلة لنا في العمارة الجديدة…',6,2),
('N','صحيت الساعة ثلاث وسبع عشرة دقيقة الفجر.',7,3),('N','على ثلاث دقات على باب غرفتي.',6,3),('K','طق… طق… طق…',3,3),
('N','سمعت صوت أمي تقول:',4,4),('MD','نواف… افتح الباب.',3,4),('N','كنت بقوم أفتح…',3,4),('N','لكن فجأة، جوالي اهتز.',4,4),
('N','رسالة من أمي تقول:',4,5),('MSG','أنا وأبوك في المستشفى، بنرجع الصباح، لا تنسى تقفل الباب.',10,5),('N','هنا تجمدت مكاني.',3,5),
('N','رجع الصوت من وراء الباب:',5,6),('MD','نواف… افتح، أدري إنك صاحي.',5,6),
('N','مسكت جوالي واتصلت على أمي.',5,7),('N','ردت.',1,7),('N','قلت لها:',2,7),('NW','يمه… أنتِ بالبيت؟',3,7),('N','قالت:',1,7),('MP','لا يا وليدي، وش فيك؟',4,7),
('N','وفي نفس اللحظة…',3,7),('N','سمعت صوتها من وراء الباب يقول نفس الجملة!',8,7),('MB','لا يا وليدي، وش فيك؟',4,7),('N','نفس الصوت…',2,7),('N','بنفس التوقيت.',2,7),
('N','قفلت الجوال من الخوف.',4,8),
('N','بعدها بثواني وصلتني رسالة من رقم مجهول.',7,9),('N','مكتوب فيها:',2,9),('MSG','لا تفتح الباب… هو للحين ما يعرف شكلك.',8,9),
('N','وبعدها رسالة ثانية:',3,10),('MSG','ولا تطالع تحت الباب.',4,10),('N','لكن المشكلة…',2,10),('N','إني كنت أطالع أصلًا.',4,10),
('N','وشفت ظل شخص واقف عند الباب.',6,11),('N','لكن فيه شيء ما استوعبته إلا بعد ثواني.',8,11),('N','الظل ما كان جاي من تحت الباب إلى غرفتي…',9,11),('N','الظل كان يبدأ من داخل الغرفة، ومتجه للباب.',8,11),
('N','يعني الشخص اللي كان يطرق…',5,12),('N','كان واقف داخل غرفتي!',4,13),
]
assert sum(x[2] for x in L)==len(ws), (sum(x[2] for x in L), len(ws))
# speech onsets from silence ends
log=subprocess.run(['ffmpeg','-nostdin','-hide_banner','-i',f'{S}/vo.mp3','-af','silencedetect=noise=-42dB:d=0.12','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]; en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
sil=list(zip(st,en)); dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'{S}/vo.mp3'],capture_output=True,text=True).stdout)
i=0; segs=[]
for k,(sp,txt,n,sc) in enumerate(L):
    a=ws[i]['s']; b=ws[i+n-1]['e']
    for s0,e0 in sil:                       # onset = end of the pause just before the first word
        if s0-0.15 <= a <= e0+0.05: a=max(a,e0); break
    for s0,e0 in sil:                       # end = start of the pause after the last word
        if s0 >= b-0.35 and s0 <= b+0.5: b=s0; break
    segs.append([sp,txt,sc,round(a,3),round(b,3),[(round(w['s'],3),round(w['e'],3)) for w in ws[i:i+n]]]); i+=n
# cut points between lines (midpoint of the gap), and extra silences (seconds) inserted AFTER a line index
GAPS={1:0.5, 6:0.4, 13:0.6, 27:1.8, 34:0.7, 39:0.9}
cuts=[0.0]+[round((segs[k][4]+segs[k+1][3])/2,3) for k in range(len(segs)-1)]+[dur]
# render each line's audio (mother lines processed), then concatenate with gaps
os.makedirs(f'{S}/parts',exist_ok=True)
PITCH=1.12
def proc(sp):
    up=f"asetrate=44100*{PITCH},aresample=44100,atempo={1/PITCH:.5f}"
    if sp=='MD': return f"{up},lowpass=f=1300,highpass=f=120,aecho=0.8:0.6:28|47:0.35|0.22,volume=0.9"
    if sp=='MP': return f"{up},highpass=f=320,lowpass=f=3300,acompressor=threshold=-24dB:ratio=6,volume=1.6,aeval='tanh(1.6*val(0))/1.2'"
    return None
parts=[]; t=0.0; out=[]
for k,(sp,txt,sc,a,b,wt) in enumerate(segs):
    c0,c1=cuts[k],cuts[k+1]
    f=f'{S}/parts/{k:02d}.wav'
    if sp=='MB':   # phone + door at once, slightly apart in space
        up=f"asetrate=44100*{PITCH},aresample=44100,atempo={1/PITCH:.5f}"
        fc=(f"[0:a]atrim={c0}:{c1},asetpts=PTS-STARTPTS,{up},asplit=2[x][y];"
            f"[x]highpass=f=320,lowpass=f=3300,acompressor=threshold=-24dB:ratio=6,volume=1.4,pan=stereo|c0=0.55*c0|c1=0.95*c0[p];"
            f"[y]lowpass=f=1300,highpass=f=120,aecho=0.8:0.6:28|47:0.35|0.22,pan=stereo|c0=0.85*c0|c1=0.6*c0[d];[p][d]amix=inputs=2:normalize=0[o]")
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f'{S}/vo.mp3','-filter_complex',fc,'-map','[o]','-ar','44100','-ac','2',f],check=True)
    else:
        af=f"atrim={c0}:{c1},asetpts=PTS-STARTPTS"+(','+proc(sp) if proc(sp) else '')+",pan=stereo|c0=c0|c1=c0"
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f'{S}/vo.mp3','-af',af,'-ar','44100','-ac','2',f],check=True)
    d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
    off=t-c0
    out.append({'id':f'L{k+1:02d}','speaker':sp,'text':txt,'scene':sc,'start':round(a+off,3),'end':round(b+off,3),'words':[[round(x+off,3),round(y+off,3)] for x,y in wt]})
    parts.append(f); t+=d
    if k in GAPS:
        g=f'{S}/parts/{k:02d}_gap.wav'
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-f','lavfi','-i',f'anullsrc=r=44100:cl=stereo','-t',str(GAPS[k]),g],check=True)
        parts.append(g); t+=GAPS[k]
open(f'{S}/parts/list.txt','w').write(''.join(f"file '{p}'\n" for p in parts))
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-f','concat','-safe','0','-i',f'{S}/parts/list.txt','-af','loudnorm=I=-18:TP=-2:LRA=11:linear=true','-ar','48000',f'{OUT}/public/vo/E01.wav'],check=True)
json.dump({'voDuration':round(t,3),'lines':out},open(f'{OUT}/src/lines.json','w'),ensure_ascii=False,indent=1)
print('vo', round(t,2), 's ·', len(out), 'lines')
for o in out: print(o['id'],o['speaker'],o['scene'],o['start'],o['end'],o['text'][:30])
