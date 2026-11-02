import numpy as np, wave
SR=44100; DUR=68.0; N=int(SR*DUR)
rng=np.random.default_rng(7)
mus=np.zeros((N,2)); sfx=np.zeros((N,2))
def add(buf,sig,t,gain=1.0,pan=0.0):
    i=int(t*SR); j=min(N,i+len(sig))
    if i>=N or j<=i: return
    s=sig[:j-i]*gain
    l=np.sqrt((1-pan)/2); r=np.sqrt((1+pan)/2)
    buf[i:j,0]+=s*l*1.41; buf[i:j,1]+=s*r*1.41
def env(n,a=0.005,d=0.2,curve=6):
    t=np.arange(n)/SR; e=np.exp(-t/d*curve/6)
    at=int(a*SR);
    if at>0: e[:at]*=np.linspace(0,1,at)
    return e
def tone(f,dur,kind='saw'):
    t=np.arange(int(dur*SR))/SR; ph=(f*t)%1
    if kind=='saw': return 2*ph-1
    if kind=='sq': return np.sign(np.sin(2*np.pi*f*t))
    if kind=='tri': return 2*np.abs(2*ph-1)-1
    return np.sin(2*np.pi*f*t)
def lp(x,k=0.15):
    y=np.zeros_like(x); a=0
    for i in range(0,len(x)):
        a+=k*(x[i]-a); y[i]=a
    return y
def lpf(x,cut):
    # one-pole via FFT-free vectorized approx: use scipy-less biquad by cumulative filter
    k=1-np.exp(-2*np.pi*cut/SR)
    from itertools import accumulate
    return np.fromiter(accumulate(x, lambda a,b: a+k*(b-a)), float, len(x))
def kick():
    n=int(.35*SR); t=np.arange(n)/SR
    f=50+120*np.exp(-t*35); ph=np.cumsum(f)/SR
    return np.sin(2*np.pi*ph)*np.exp(-t*9)
def clap():
    n=int(.25*SR); x=rng.standard_normal(n)
    e=np.exp(-np.arange(n)/SR*22)
    x=x-lpf(x,900); return x*e*.6
def hat(o=False):
    n=int((.18 if o else .05)*SR); x=rng.standard_normal(n)
    x=x-lpf(x,6000); return x*np.exp(-np.arange(n)/SR*(14 if o else 70))*.35
BPM=120; beat=60/BPM
roots={'Am':45,'F':41,'C':48,'G':43}
chords={'Am':[57,60,64],'F':[53,57,60],'C':[55,60,64],'G':[55,59,62]}
prog=['Am','F','C','G']
m2f=lambda m:440*2**((m-69)/12)
def section(t):
    if t<4.2: return 'intro'
    if 63<=t<65.6: return 'break'
    if t>=65.6: return 'out'
    return 'main'
# build per beat
nb=int(DUR/beat)
for b in range(nb):
    t=b*beat; sec=section(t); bar=b//4; ch=prog[bar%4]
    if sec in('main',) or (sec=='intro' and b%2==0 and t>1.0) or (sec=='out' and t<67):
        add(mus,kick(),t,.9)
    if sec=='main' and b%2==1: add(mus,clap(),t,.55)
    if sec=='main':
        for k in range(2): add(mus,hat(),t+k*beat/2,.5 if k else .3,pan=.3)
        if b%4==3: add(mus,hat(True),t+beat/2,.35,-.3)
    # bass 8ths
    if sec in('main','out'):
        for k in range(2):
            f=m2f(roots[ch]-12+ (12 if k else 0))
            s=tone(f,beat/2*0.9,'saw'); s=lpf(s,700)*env(len(s),.003,.25)
            add(mus,s,t+k*beat/2,.45)
    # pluck arp 16ths
    if sec=='main' and t>=9.5:
        notes=chords[ch]+[chords[ch][0]+12]
        for k in range(4):
            f=m2f(notes[(b*4+k)%4]+12); s=tone(f,.18,'sq'); s=lpf(s,2500)*env(len(s),.002,.12)
            add(mus,s,t+k*beat/4,.10,pan=(-.4 if k%2 else .4))
# pads per bar
for bar in range(int(DUR/(4*beat))+1):
    t=bar*4*beat; ch=prog[bar%4]; d=4*beat
    s=np.zeros(int(d*SR))
    for n in chords[ch]:
        for det in(-0.08,0.08): s+=tone(m2f(n)*(1+det/100),d,'saw')
    s=lpf(s,1200 if section(t)!='intro' else 700)
    e=np.minimum(1,np.minimum(np.arange(len(s))/(SR*.3),(len(s)-np.arange(len(s)))/(SR*.3)))
    g=.05 if section(t)=='main' else .08
    add(mus,s*e,t,g)
# riser into drop and into ending
def riser(dur):
    n=int(dur*SR); x=rng.standard_normal(n); x=x-lpf(x,1500)
    return x*np.linspace(0,1,n)**2*.5
add(mus,riser(1.2),3.0,.5); add(mus,riser(1.0),64.6,.5)
# --- SFX ---
def pop(f=600):
    n=int(.12*SR); t=np.arange(n)/SR; fr=f*(1+3*np.exp(-t*40)); return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*30)
def whoosh(d=.45):
    n=int(d*SR); x=rng.standard_normal(n); x=lpf(x,2500)-lpf(x,300)
    e=np.sin(np.linspace(0,np.pi,n))**2; return x*e*1.4
def impact():
    k=kick()*1.2; n=int(.6*SR); x=rng.standard_normal(n); x=lpf(x,1800)*np.exp(-np.arange(n)/SR*6)*.5
    out=np.zeros(n); out[:len(k)]+=k; return out+x
def click():
    n=int(.03*SR); return rng.standard_normal(n)*np.exp(-np.arange(n)/SR*200)*.8
def ding(f=1320):
    n=int(.5*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*2.01*t))*np.exp(-t*7)*.4
def inflate(d=.32):
    n=int(d*SR); t=np.arange(n)/SR; f=220+500*t/d; x=np.sin(2*np.pi*np.cumsum(f)/SR)*.4+lpf(rng.standard_normal(n),3000)*.4
    return x*np.sin(np.linspace(0,np.pi,n))
CUTS=[4.2,9.5,14.5,21.5,28.5,32.5,42,45.5,50,56.5,59.5,63]
for c in CUTS: add(sfx,whoosh(),c-.3,.55)
for t in [2.35,13.0,19.3,46.1,53.8,65.6]: add(sfx,impact(),t,.8)
pops=[.25,.65,7.4,9.6,10.2,11.4,14.7,15.0,20.1,21.6,22.1,23.0,28.6,29.0,30.6,32.6,32.9,34.0,40.5,42.1,43.6,44.1,45.6,50.1,50.4,51.0,51.6,52.6,54.5,54.9,55.4,56.6,57.3,57.7,59.6,59.9,60.2,61.3,62.2,63.1,63.7,65.2,66.3]
for i,t in enumerate(pops): add(sfx,pop(500+(i%5)*90),t,.35,pan=(-.3 if i%2 else .3))
for i in range(7): add(sfx,pop(700+i*60),15.4+i*.45+.45,.28)
for i in range(8): add(sfx,ding(1200+(i%3)*200),9.7+i*.15,.22,pan=(i%2-.5))
for i in range(3): add(sfx,pop(420),24.3+i,.35); add(sfx,click(),24.65+i,.9)
add(sfx,whoosh(.3),27.3,.5)
for h in [35.0,35.9,36.8,37.6,39.2]: add(sfx,inflate(),h-.05,.5)
for k in range(14): add(sfx,click(),38.4+k*.05,.35)
for i in range(4): add(sfx,pop(900),29.6+i*.55,.25)
for i in range(3): add(sfx,ding(1500),47.4+i*.5,.25)
# ducking: music dips at "سلاحك مو كلاشنكوف"
tt=np.arange(N)/SR
duck=np.ones(N); m=(tt>63.0)&(tt<65.5); duck[m]=0.35
duck=lpf(duck,3)
mus*=duck[:,None]
fade=np.ones(N); fade[tt>66.4]=np.clip(1-(tt[tt>66.4]-66.4)/1.6,0,1); fade[tt<0.05]=0
mix=mus*0.9+sfx*0.8
mix*=fade[:,None]
mix/=np.max(np.abs(mix))*1.05
with wave.open('audio_raw.wav','w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok')
