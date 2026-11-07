# مؤثرات الحلقة التعريفية الأولى (54 ث) — نفس مكتبة الأصوات، مرتّبة على مشاهد الحلقة. يولّد audio_ep1.wav
import numpy as np, wave, re
src=open('audio.py',encoding='utf-8').read(); src=src[:src.index('# ---- خط زمني ----')]
src=src.replace('SR=48000; DUR=60.0','SR=48000; DUR=54.0'); exec(src)
# خريطة المشاهد (نفس ep1.js): مشهد، [(زمن الإخراج، زمن المشهد)...]
EP=[('geo',[(0,0),(6.2,6.2)]),('s2',[(6.2,8.4),(9.4,12.4)]),('s3',[(9.4,18.06),(13.0,19.66)]),('s3',[(13.0,20.06),(16.4,22.0)]),
    ('s5',[(16.4,31.0),(20.0,34.6)]),('s4',[(20.0,22.0),(25.8,28.9)]),('s5',[(25.8,34.6),(29.6,37.4)]),
    ('s7',[(29.6,0),(32.6,2.6)]),('s7',[(32.6,6.4),(38.0,9.45)]),('s7',[(38.0,2.6),(42.6,6.4)]),('s7',[(42.6,6.4),(44.4,7.2)]),
    ('s6',[(44.4,40.0),(45.4,41.6),(54,45.0)])]
def outs(sc,t):
    r=[]
    for s,k in EP:
        if s!=sc: continue
        for (T0,t0),(T1,t1) in zip(k,k[1:]):
            if t0<=t<t1: r.append(T0+(t-t0)*(T1-T0)/(t1-t0))
    return r
def ev(sc,t,sig,g=1.0,pan=0.0):
    for o in outs(sc,t): add(o,sig,g,pan,raw=True)
def bed(a,b,sig_fn,g):
    d=b-a; s=sig_fn(d); n=len(s); e=np.minimum(1,np.arange(n)/(SR*.3))*np.minimum(1,(n-np.arange(n))/(SR*.3)); add(a,s*e,g,raw=True)
# ---- جوّ عام خافت ----
add(0,lpf(noise(DUR),220)*.22,.6,raw=True)
# ---- ١) الحدود الجغرافية (0–6.2) ----
wind=lpf(noise(6.4),600)*(0.6+0.4*np.sin(2*np.pi*.35*T(6.4)))**2; add(0,wind*np.minimum(1,T(6.4)/1.2),.5,-.2,raw=True)
add(0,tone(62,6.2)*.12*np.minimum(1,T(6.2)/1.5),1,raw=True)                     # طنين بعيد
add(.4,lpf(noise(5.0),300)*np.sin(np.pi*T(5.0)/5)**2*.6,.35,.4,raw=True)      # محرّك الكشّاف
for tt in (1.1,1.9): add(tt,metal(1.2)*.5,.18,-.3,raw=True)                       # صرير السلك
add(2.5,riser(1.4,120,900),.28,raw=True); add(2.5,bpf(noise(1.4),2500,9000)*np.linspace(0,1,int(1.4*SR))**2,.18,raw=True)
add(3.85,boom(2.2,80,32),.85,raw=True); add(3.86,chime([110,165,220,330],3.0),.22,raw=True)   # الخط يصير رقميًا
bed(3.9,6.2,lambda d:drone(d,55,.3),.45)
add(5.95,whoosh(.5,300,6000,rev=True),.4,raw=True)
# ---- ٢) الحملات تنتشر (s2) ----
ev('s2',8.75,boom(2.0,120,45),.7); ev('s2',8.75,bpf(noise(.5),800,8000)*env(int(.5*SR),.001,.12,5),.5)
add(6.3,riser(3.1,60,700),.3,raw=True)
t=8.9;k=0
while t<12.4:
    f=[880,988,1175,1319,1568,1760][k%6]*(1+.5*hsh(k)); ev('s2',t,ping(f,.25),.07+.08*((t-8.9)/3.5),(hsh(k+3)-.5)*1.6); t+=max(.03,.32*np.exp(-(t-8.9)*.7)); k+=1
for g0,d,i in [(10.5,.15,.6),(12.0,.13,.8)]: ev('s2',g0,glitchs(d,int(g0*10)),.35*i+.1)
# ---- ٣) تستهدفك أنت (s3 الاستفزاز ثم الوعي) ----
bed(9.4,13.0,lambda d:drone(d,41,1.2)*np.linspace(.3,1.2,int(d*SR)),.8)
t=18.06;k=0
while t<19.66: ev('s3',t,ping(600+700*hsh(k+40),.15),.07+.1*(t-18)/1.6,(hsh(k)-.5)*1.8); t+=max(.02,.22*np.exp(-(t-18)*1.6)); k+=1
for g0,d,i in [(18.6,.06,.4),(19.2,.08,.6)]: ev('s3',g0,glitchs(d,int(g0*10)),.35*i+.1)
add(12.95,whoosh(.4,300,6000),.5,raw=True)
ev('s3',20.15,ping(784,.4),.1,.2); ev('s3',20.4,whoosh(.6,1500,9000),.25,.4)
ev('s3',21.0,chime([523.25,659.25,783.99,1046.5],2.2),.28); ev('s3',21.27,ping(1568,.6)+ping(2093,.6),.08,-.2); ev('s3',21.45,whoosh(.6,200,5000,rev=True),.6)
# ---- ٤) المبادرة: الجندي على الحدود (s5) ----
pad=lambda d:sum(np.sin(2*np.pi*f*T(d)+np.sin(2*np.pi*.2*T(d))*2)*.12 for f in (110,164.8,220,329.6,440))
bed(16.4,20.0,lambda d:lpf(pad(d),1400),.55); bed(25.8,29.6,lambda d:lpf(pad(d),1400),.5)
add(16.45,boom(2.4,70,30),.7,raw=True); add(16.5,chime([146.8,220,293.7,440],3.0),.22,raw=True)
for a,b in ((16.6,20.0),(25.8,29.6)):
    x=a
    while x<b-.3: add(x,heartbeat(),.5,raw=True); x+=.85
HITS=[(33+k*.24+.08*np.sin(k*12.9),k%5==3,k) for k in range(14)]
for th,ps,k in HITS:
    pan=(hsh(k*3.7)-.5)*1.4
    if ps: ev('s5',th,chime([1046.5,1568],.9),.12,pan)
    else: ev('s5',th,crackle(.35,120)+bpf(noise(.35),500,5000)*env(int(.35*SR),.001,.08,6),.35,pan); ev('s5',th,boom(.6,110,60),.25,pan)
ev('s5',36.4,boom(3.2,60,30),1.0); ev('s5',36.4,whoosh(1.5,100,9000),.6); ev('s5',36.42,chime([220,330,440,660],3.0),.25)
# ---- ٥) كشف الأساليب: لوحة الأدلة واليد (s4) ----
bed(20.0,25.8,lambda d:drone(d,36.7,.6),.85); bed(20.0,25.8,lambda d:crackle(d,25),.06)
ev('s4',23.4,click(1.2,1800),.8); ev('s4',23.45,bpf(noise(2.4),3000,9000)*.05,1)
ev('s4',26.0,boom(1.6,150,50),.5); ev('s4',26.0,whoosh(.9,1000,9000),.6); ev('s4',26.0,chime([370,392,554],2.0),.18)
add(23.2,riser(2.2,45,260),.35,raw=True)
ev('s4',28.5,boom(3.0,70,28),1.0); ev('s4',28.5,lpf(noise(2.5),120)*env(int(2.5*SR),.01,1.2,3),.9); ev('s4',28.52,tone(lambda t:180+40*np.sin(t*30),1.0)*env(int(SR),.005,.4,4),.15)
# ---- ٦) منصة معيار والشهادة (s7) ----
hum=(tone(50,14.8)*.6+tone(100,14.8)*.3)*.05; add(29.6,hum,1,raw=True)
for tp in (.75,7.55): ev('s7',tp,click(.7,2600)+click(.35,900),.55,.1); ev('s7',tp+.01,ping(1975,.18),.04,.1)
for a,b in ((1.0,2.4),(6.4,7.3)):
    d=b-a; ev('s7',a+.001,bpf(noise(d*1.4),900,5000)*np.sin(np.pi*T(d*1.4)/(d*1.4))**2,.12,.2)
for k in range(17): ev('s7',7.8+k*.085+.02*hsh(k),click(.35,3500+800*hsh(k+3)),.35,.15)
ev('s7',2.6,whoosh(1.0,250,3500),.35,-.4); ev('s7',3.5,riser(1.0,120,500),.12); ev('s7',4.4,chime([392,493.9,587.3,784],2.4),.22); ev('s7',5.45,whoosh(1.0,250,3500),.35,.4)
add(29.6,whoosh(.5,200,6000),.35,raw=True); add(43.9,whoosh(.5,200,6000,rev=True),.45,raw=True)
# ---- ٧) الخاتمة: الدرع وصورة صاحب المبادرة (s6) ----
ev('s6',40.1,bpf(noise(.6),2000,7000)*np.linspace(.2,1,int(.6*SR))**2*.4,.3)
ev('s6',41.2,boom(3.5,55,26),1.0); ev('s6',41.2,chime([146.8,220,293.7,440,587.3],3.5),.3)
ev('s6',41.62,chime([293.7,440,587.3,880],2.5),.2); ev('s6',42.2,whoosh(.8,2000,10000),.25)
ev('s6',44.3,click(1.4,2200)+click(.7,700),.9,.2); ev('s6',44.3,lpf(noise(.3),2000)*env(int(.3*SR),.001,.04,6),.2)
bed(45.4,53.5,lambda d:lpf(pad(d),1200)*.8,.35)
# ---- صدى + إتقان مع هامش للتعليق الصوتي ----
def reverb(x,dec=2.2,mix=.25):
    n=int(dec*SR); ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*6.9/dec); ir=lpf(ir,4000); ir/=np.sqrt((ir**2).sum())
    M=len(x)+n; F=1<<int(np.ceil(np.log2(M))); y=np.fft.irfft(np.fft.rfft(x,F)*np.fft.rfft(ir,F),F)[:len(x)]; return x*(1-mix)+y*mix*1.4
L=reverb(L);R=reverb(R);L=hpf(L,25);R=hpf(R,25)
pk=max(np.abs(L).max(),np.abs(R).max()); L/=pk;R/=pk
soft=lambda x:np.tanh(x*1.6)/np.tanh(1.6); L=soft(L)*.7;R=soft(R)*.7      # أهدأ قليلًا لترك مساحة للصوت
fade=np.minimum(1,(N-np.arange(N))/(SR*.6)); L*=fade;R*=fade
pcm=(np.stack([L,R],1)*32767).astype(np.int16)
with wave.open('audio_ep1.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok',pcm.shape)
