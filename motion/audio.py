# تصميم صوتي مُولَّد بالكامل (بلا موسيقى جاهزة) — 48kHz ستيريو
import numpy as np, wave
SR=48000; DUR=58.0;
SEG=[(0,6,0,7),(6,14,7,15),(14,22,15,25),(22,31,25,35),(31,40,35,52),(40,45,52,58)]
def M(t):
    for a,b,c,d in SEG:
        if t<b: return c+(t-a)*(d-c)/(b-a)
    return 58.0
N=int(SR*DUR)
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(5)
def hsh(n): x=np.sin(n*127.1+311.7)*43758.5453; return x-np.floor(x)
def env(n,a,d,curve=4):
    t=np.arange(n)/SR; e=np.minimum(1,t/max(a,1e-4))*np.exp(-curve*np.maximum(0,t-a)/max(d,1e-4)); return e
def lp(x,c):  # مرشح تمرير منخفض أحادي القطب
    a=np.exp(-2*np.pi*c/SR); y=np.empty_like(x); s=0.0
    for i in range(len(x)): s=(1-a)*x[i]+a*s; y[i]=s
    return y
def lpf(x,c):  # سريع عبر FFT
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X*=1/np.sqrt(1+(f/c)**4); return np.fft.irfft(X,len(x))
def hpf(x,c):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X*=1/np.sqrt(1+(c/np.maximum(f,1))**4); return np.fft.irfft(X,len(x))
def bpf(x,lo,hi): return hpf(lpf(x,hi),lo)
def add(t,sig,g=1.0,pan=0.0,raw=False):
    i=int((t if raw else M(t))*SR); 
    if i>=N: return
    s=sig[:N-i]*g; L[i:i+len(s)]+=s*np.sqrt((1-pan)/2); R[i:i+len(s)]+=s*np.sqrt((1+pan)/2)
def noise(d): return rng.standard_normal(int(d*SR))
def tone(f,d,ph=0):
    t=np.arange(int(d*SR))/SR
    if callable(f): return np.sin(2*np.pi*np.cumsum(f(t))/SR+ph)
    return np.sin(2*np.pi*f*t+ph)
def T(d): return np.arange(int(d*SR))/SR

# ---- أجزاء صوتية ----
def click(g=1,b=3000): n=noise(.06); return bpf(n,b*.5,b*2)*env(len(n),.0005,.012,6)*g
def boom(d=2.5,f0=70,f1=32):
    t=T(d); f=f0*np.exp(-t*2)+f1; s=tone(lambda tt:f0*np.exp(-tt*2)+f1,d)*env(len(t),.004,d*.5,3)
    s+=lpf(noise(d),400)*env(len(t),.002,.3,5)*1.5; return s
def whoosh(d,lo=200,hi=3000,rev=False):
    n=noise(d); t=T(d); 
    out=np.zeros_like(n); seg=int(SR*.02)
    # فلتر متحرك تقريبي: مزج نطاقين
    a=lpf(n,lo); b=bpf(n,lo,hi); k=(t/d)**2
    out=a*(1-k)+b*k; e=np.sin(np.pi*np.clip(t/d,0,1))**2 if not rev else (t/d)**3
    return out*e
def riser(d,f0=80,f1=600):
    t=T(d); k=t/d; s=np.zeros_like(t)
    for det in (0,.7,-.5): s+=tone(lambda tt:f0*(f1/f0)**(tt/d)*(1+det*.01),d)
    s+= bpf(noise(d),300,6000)*k**2*.6
    return s*k**2.2
def ping(f,d=.35): t=T(d); return (tone(f,d)+.4*tone(f*2.01,d)+.2*tone(f*3.03,d))*env(len(t),.002,d*.4,5)
def buzz(d=.35):
    t=T(d); s=np.sign(np.sin(2*np.pi*150*t))*.5+np.sin(2*np.pi*300*t)*.3; s=lpf(s,900); return s*(np.sin(np.pi*t/d)**.3)
def metal(d=1.8):
    t=T(d); s=np.zeros_like(t)
    for f,a in [(220,1),(347,.7),(512,.6),(781,.5),(1130,.4),(1690,.3),(2410,.2)]: s+=a*np.sin(2*np.pi*f*t)*np.exp(-t*(2+f/600))
    c=click(2,1200); s=s*.35; s[:len(c)]+=c; return s
def glitchs(d,seed):
    r=np.random.default_rng(seed); n=r.standard_normal(int(d*SR)); step=r.integers(20,200)
    s=np.repeat(n[::step],step)[:len(n)]; s=np.round(s*3)/3; s+=np.sign(np.sin(2*np.pi*r.uniform(200,1600)*T(d)))*.4
    return s*.5*np.sin(np.pi*np.linspace(0,1,len(s)))**.2
def chime(fs,d=1.6,g=1):
    s=np.zeros(int(d*SR))
    for i,f in enumerate(fs): t=T(d); s+=(tone(f,d)+.25*tone(f*2,d))*env(len(t),.004,d*.6,3)*(1-.15*i)
    return s*g
def heartbeat():
    d=.5; t=T(d); s=tone(lambda tt:55*np.exp(-tt*6)+38,d)*env(len(t),.003,.12,4)
    s2=np.concatenate([np.zeros(int(.17*SR)),s[:-int(.17*SR)]*.7]); return lpf(s+s2,180)*2
def drone(d,f,detune=.4):
    t=T(d); s=np.zeros_like(t)
    for k,a in [(1,1),(1.5,.4),(2,.5),(3,.2)]:
        for dd in (-detune,detune): s+=a*np.sign(np.sin(2*np.pi*(f*k+dd)*t))*.15
    return lpf(s,500)
def snap(): t=T(.8); s=bpf(noise(.8),2000,9000)*env(len(t),.0005,.02,6)*2+tone(lambda tt:900*np.exp(-tt*5)+200,.8)*env(len(t),.001,.3,4)*.5; return s
def crackle(d,dens=60):
    s=np.zeros(int(d*SR))
    for k in range(int(d*dens)):
        i=rng.integers(0,len(s)-300); s[i:i+200]+=rng.standard_normal(200)*np.exp(-np.arange(200)/30)*rng.uniform(.2,1)
    return s

# ---- خط زمني ----
# جوّ الغرفة
room=lpf(noise(DUR),220)*.25; hum=(tone(50,DUR)*.6+tone(100,DUR)*.3+tone(150,DUR)*.12)*.06
tt=np.arange(N)/SR
lampA=np.clip((tt-M(1.33))*20,0,1)*(tt<7)+((tt>=25)&(tt<35))*1.0+((tt>=52)&(tt<M(44.3)))*1.0
add(0,room*(1-.6*((tt>7)&(tt<15))) ,.7)
add(0,hum*lampA,1)

# ١: الغرفة
for tc,g in [(1.0,1),(1.06,.5),(1.12,.8),(1.19,.4),(1.33,1)]: add(tc,click(g,2500)+click(g*.5,800),.9,.2)
add(1.33,lpf(noise(.5),3000)*env(int(.5*SR),.001,.08,6),.15,.2)  # طنين تشغيل
add(1.8,lpf(noise(2.6),700)*np.sin(np.pi*T(2.6)/2.6)**2,.35,-.3) # سيارة مارة
add(2.0,tone(lambda t:90-20*t/2.4,2.6)*np.sin(np.pi*T(2.6)/2.6)**2*.15,1,-.3)
for b in (3.2,3.9,4.6,5.3): add(b,buzz(),.45,0); 
for b in (3.22,3.92,4.62,5.32): add(b,ping(1318,.5)+ping(1760,.5)*.5,.12,.1)
add(4.0,whoosh(2.0,150,4000,rev=True),.55)
add(5.95,boom(1.5,90,40),.5); add(5.97,bpf(noise(.4),1500,9000)*env(int(.4*SR),.001,.1,5),.4)

# ٢: الانتشار
for k in range(14): add(6.05+k*.09,click(.25,4000),.5,(hsh(k)-.5)*.6)  # تمرير
add(7.25,chime([311,330,466],1.6),.25)  # لسعة تنافر
add(7.25,lpf(noise(1.2),200)*env(int(1.2*SR),.01,.6,3),.4)
add(8.75,boom(2.0,120,45),.7); add(8.75,bpf(noise(.5),800,8000)*env(int(.5*SR),.001,.12,5),.5)
add(8.6,riser(5.3,60,700),.32)
t=8.9; k=0
while t<13.5:
    f=[880,988,1175,1319,1568,1760][k%6]*(1+.5*hsh(k)); add(t,ping(f,.25),.07+.08*((t-8.9)/4.6),(hsh(k+3)-.5)*1.6)
    t+=max(.025,.32*np.exp(-(t-8.9)*.7)); k+=1
for g0,d,i in [(10.5,.15,.6),(12.0,.13,.8),(13.55,.38,1)]: add(g0,glitchs(d,int(g0*10)),.35*i+.1)
add(11.5,drone(2.4,55),.6)

# ٣: ردود الفعل
add(14.0,lpf(noise(10),300)*.3,.5)
for w in (15.7,17.7,19.7): add(w,whoosh(.6,300,6000),.7,.3)
add(14.4,ping(523,.4)+ping(659,.4),.15,.1)
add(14.4,bpf(noise(.15),400,3000)*env(int(.15*SR),.002,.05,5),.3,.2)  # فقاعة
add(15.0,tone(lambda t:220*np.exp(-t*3),.6)*env(int(.6*SR),.003,.25,4),.3)  # إطفاء/صمت
add(15.05,lpf(noise(.8),500)*env(int(.8*SR),.01,.2,4),.25)
add(16.3,whoosh(.6,800,7000),.2,-.2)
add(17.0,chime([233,247],1.0),.25)
add(17.05,metal(2.2),.7); add(17.05,boom(1.6,60,35),.6)
add(18.0,drone(2.0,41,1.2)*np.linspace(.2,1.3,int(2*SR)),.9)
t=18.05;k=0
while t<19.9: add(t,ping(600+700*hsh(k+40),.15)*np.sign(1),.07+.1*(t-18)/2,(hsh(k)-.5)*1.8); t+=max(.018,.25*np.exp(-(t-18)*1.6)); k+=1
for g0,d,i in [(18.6,.06,.4),(19.2,.08,.6),(19.75,.2,.9)]: add(g0,glitchs(d,int(g0*10)),.35*i+.1)
add(20.15,ping(784,.4),.1,.2)
add(20.4,whoosh(.6,1500,9000),.25,.4)  # عدسة
add(21.0,chime([523.25,659.25,783.99,1046.5],2.2),.28)  # تحقق
add(21.27,ping(1568,.6)+ping(2093,.6),.08,-.2)  # مصدر
add(21.45,whoosh(.6,200,5000,rev=True),.6)

# ٤: لوحة الأدلة
add(22.0,drone(10.0,36.7,.6)*np.minimum(1,T(10)/1.5)*np.minimum(1,(10-T(10))/.5),.9)
add(22.0,crackle(10,25),.06)
add(23.4,click(1.2,1800),.8); add(23.42,tone(60,2.6)*.2*np.minimum(1,T(2.6)*10),.4)
add(23.45,bpf(noise(2.6),3000,9000)*.05,1)  # أزيز الكشاف
add(26.0,boom(1.6,150,50),.5); add(26.0,whoosh(.9,1000,9000),.6); add(26.0,chime([370,392,554],2.0),.18)
add(26.1,riser(2.7,45,260),.35)
add(28.5,boom(3.0,70,28),1.0); add(28.5,lpf(noise(2.5),120)*env(int(2.5*SR),.01,1.2,3),.9); add(28.5,glitchs(.12,285),.4)
add(28.52,tone(lambda t:180+40*np.sin(t*30),1.0)*env(int(SR),.005,.4,4),.15)  # شدّ الخيوط
add(30.45,glitchs(.12,304),.35)
add(30.55,snap(),.6,-.3); add(30.56,snap(),.5,.3); add(30.55,boom(1.2,200,60),.4)

# ٥: الحدود
pad=np.zeros(int(17.4*SR)); tp=T(17.4)
for f in (110,164.8,220,329.6,440): pad+=np.sin(2*np.pi*f*tp+np.sin(2*np.pi*.2*tp)*2)*.12
pad=lpf(pad,1400)*np.minimum(1,tp/1.0)*np.minimum(1,(17.4-tp)/.4); add(30.6,pad,.55)
k=0;b=M(31.2)
while b<M(39.6): add(b,heartbeat(),.55,raw=True); b+=.85
HITS=[(33+k*.24+.08*np.sin(k*12.9),k%5==3,k) for k in range(14)]+[(37.7+(k-14)*.45,True,k) for k in range(14,18)]
for th,ps,k in HITS:
    pan=(hsh(k*3.7)-.5)*1.4
    add(th-1.0,whoosh(1.0,300,4000,rev=True),.12,pan)
    if ps: add(th,chime([1046.5,1568],.9),.12,pan); add(th,bpf(noise(.3),2000,8000)*env(int(.3*SR),.005,.1,5),.08,pan)
    else: add(th,crackle(.35,120)+bpf(noise(.35),500,5000)*env(int(.35*SR),.001,.08,6),.35,pan); add(th,boom(.6,110,60),.25,pan)
add(36.4,boom(3.2,60,30),1.0); add(36.4,whoosh(1.5,100,9000),.6); add(36.42,chime([220,330,440,660],3.0),.25)
add(38.0,riser(3.6,200,1600),.18)

# ٦: الشعار
add(39.4,whoosh(.8,500,9000,rev=True),.5)
add(40.1,bpf(noise(1.2),2000,7000)*np.linspace(.2,1,int(1.2*SR))**2*.4,.3)   # رسم الخط
add(41.2,boom(3.5,55,26),1.0); add(41.2,chime([146.8,220,293.7,440,587.3],3.5),.3)
add(41.45,ping(1760,.8),.06); add(41.7,ping(2349,.9),.05)
add(42.2,whoosh(.8,2000,10000),.25,.0)
add(44.3,click(1.4,2200)+click(.7,700),.9,.2)  # إطفاء المصباح
add(44.3,lpf(noise(.3),2000)*env(int(.3*SR),.001,.04,6),.2)

# ---- صدى + إتقان ----
def reverb(x,dec=2.2,mix=.25):
    n=int(dec*SR); ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*6.9/dec); ir=lpf(ir,4000); ir/=np.sqrt((ir**2).sum())
    M=len(x)+n; F=1<<int(np.ceil(np.log2(M))); y=np.fft.irfft(np.fft.rfft(x,F)*np.fft.rfft(ir,F),F)[:len(x)]; return x*(1-mix)+y*mix*1.4
L=reverb(L);R=reverb(R)
L=hpf(L,25);R=hpf(R,25)
pk=max(np.abs(L).max(),np.abs(R).max()); L/=pk;R/=pk
def soft(x): return np.tanh(x*1.6)/np.tanh(1.6)
L=soft(L)*.89;R=soft(R)*.89
fade=np.minimum(1,(N-np.arange(N))/(SR*.4)); L*=fade;R*=fade
st=np.stack([L,R],1); pcm=(st*32767).astype(np.int16)
with wave.open('audio.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', pcm.shape)
