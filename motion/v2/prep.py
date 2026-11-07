# تجهيز الطبقات من الصور الإحدى عشرة: python3 -I prep.py
import json, numpy as np, cv2
from PIL import Image
F='frames/'; O='layers/'
def load(n): return np.array(Image.open(F+n).convert('RGBA'))
def save(a,n): Image.fromarray(a).save(O+n)
meta={}

# ---------- 04: إزالة نص «الحدود الرقمية» و«مبادرة معيار» مع إبقاء الخيوط فوقها ----------
b=load('04-evidence-board.png'); rgb=b[:,:,:3].astype(int)
r,g,bl=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]; lum=(r+g+bl)/3
red=(r>g+45)&(r>80)
white=(lum>205)&(np.abs(r-bl)<25)
strings=np.zeros_like(b)
labels={'hudud':(84,240,326,330),'miyar':(592,186,842,265)}
mask=np.zeros(lum.shape,np.uint8)
for k,(x0,y0,x1,y1) in labels.items():
    sub=np.zeros(lum.shape,bool); sub[y0:y1,x0:x1]=True
    mask[sub&(lum<120)&~red]=255
    sm=sub&(red|white)
    sm=cv2.dilate(sm.astype(np.uint8),np.ones((3,3),np.uint8))>0
    strings[sm]=b[sm]
mask=cv2.dilate(mask,np.ones((5,5),np.uint8))
inp=cv2.inpaint(np.ascontiguousarray(b[:,:,:3]),mask,6,cv2.INPAINT_TELEA)
rng=np.random.default_rng(2); nz=cv2.GaussianBlur(rng.normal(0,9,lum.shape),(0,0),.7)
mm=cv2.GaussianBlur(mask.astype(float)/255,(0,0),2)
inp=np.clip(inp.astype(float)+(nz*mm)[:,:,None],0,255).astype(np.uint8)
b2=b.copy(); b2[:,:,:3]=inp
save(b2,'04_board.png'); save(strings,'04_strings.png')
meta['labels']={'hudud':{'cx':206,'cy':287,'rot':-0.05,'size':48,'text':'الحدود الرقمية'},
                'miyar':{'cx':716,'cy':226,'rot':-0.025,'size':52,'text':'مبادرة معيار'}}

# ---------- 06–10: فصل الشخص عن القصاصات ومحاذاته مع 06 ----------
names=['06-unknown-source.png','07-blocked-comment.png','08-misinformation-warning.png','09-comment-surge.png','10-source-inspection.png']
ref=None; meta['people']={}
H,W=1672,941
def comps(a):
    k,lab,st,_=cv2.connectedComponentsWithStats((a[:,:,3]>30).astype(np.uint8),connectivity=8); return k,lab,st
for i,n in enumerate(names):
    a=load(n); h=a.shape[0]
    if h<H: a=np.vstack([a,np.zeros((H-h,W,4),np.uint8)])
    k,lab,st=comps(a)
    # الشخص = المكوّن الذي يلمس أسفل الصورة
    pid=max(range(1,k),key=lambda j:(st[j][1]+st[j][3]>=h-3)*st[j][4])
    person=(lab==pid)
    if n.startswith('10'):
        # العدسة والقصاصة تحتها متصلتان بالشخص: افصلهما هندسيًا
        yy,xx=np.mgrid[0:H,0:W]
        lensg=((yy<790)|((xx>690)&(yy<985)))&person
        person=person&~lensg
        lens=np.zeros_like(a)
        cx,cy=625,685
        d=np.hypot(xx-cx,yy-cy)
        ring=(d>=112)&(d<=146)
        handle=(xx>690)&(yy>760)&(yy<985)&lensg
        lm=(ring|handle)&lensg
        lens[lm]=a[lm]
        # إطار العدسة بالإحداثيات المحلية
        save(lens[cy-150:985,cx-150:860],'lens.png'); meta['lens']={'ox':cx-150,'oy':cy-150,'cx':150,'cy':150,'r':112}
    pm=np.zeros((H,W),np.uint8); pm[person]=255
    if ref is None: ref=pm; M=np.eye(2,3,dtype=np.float32)
    else:
        M=np.eye(2,3,dtype=np.float32)
        _,M=cv2.findTransformECC(cv2.GaussianBlur(ref,(0,0),4).astype(np.float32),cv2.GaussianBlur(pm,(0,0),4).astype(np.float32),M,cv2.MOTION_AFFINE,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,200,1e-6),None,5)
    warp=lambda img:cv2.warpAffine(img,M,(W,H),flags=cv2.INTER_LINEAR|cv2.WARP_INVERSE_MAP,borderMode=cv2.BORDER_CONSTANT,borderValue=0)
    P=a.copy(); P[~person]=0; P=warp(P); save(P,'p%02d.png'%(6+i))
    # القصاصات: كل مكوّن آخر، بإحداثيات الشخص المحاذى
    clips=[]
    Aw=a.copy(); Aw[person]=0
    if n.startswith('10'): Aw[lensg]=0
    Aw=warp(Aw)
    k2,lab2,st2=comps(Aw)
    for j in range(1,k2):
        x,y,w,h2,ar=st2[j]
        if ar<700: continue
        c=np.zeros((h2,w,4),np.uint8); m=lab2[y:y+h2,x:x+w]==j; c[m]=Aw[y:y+h2,x:x+w][m]
        fn='c%02d_%d.png'%(6+i,len(clips)); save(c,fn); clips.append({'f':fn,'x':int(x),'y':int(y),'w':int(w),'h':int(h2)})
    meta['people'][6+i]={'clips':clips,'M':M.tolist()}
    if n.startswith('10'):
        Mi=cv2.invertAffineTransform(M); p=np.array([625,685,1.0]); lc=M@p if False else None

# ---------- 11: الأساس، القصاصات الحمراء، و«تم التحقق» منفصلة ----------
a=load('11-digital-filter.png'); rgb=a[:,:,:3].astype(int); r,g,bl=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
poly=np.array([[624,350],[812,334],[824,368],[810,428],[690,431],[620,440]],np.int32)
pm=np.zeros(a.shape[:2],np.uint8); cv2.fillPoly(pm,[poly],255); pmask=(pm>0)&(a[:,:,3]>10)
cyan=(g>140)&(bl>140)&(r<140)
checkzone=np.zeros_like(pmask); checkzone[330:392,630:705]=True
tm_mask=pmask&~(cyan&~checkzone)
# أعد بناء القوس تحت القصاصة: ملاءمة دائرة لبكسلات القوس
cm=cyan&(a[:,:,3]>150)&~pmask&~checkzone
xs=[];ys=[]
for x in range(0,a.shape[1],3):
    col_=np.where(cm[300:700,x])[0]
    if len(col_): xs.append(x); ys.append(300+col_[0])
xs=np.array(xs,float); ys=np.array(ys,float)
A=np.c_[2*xs,2*ys,np.ones(len(xs))]; bb=xs**2+ys**2; cx,cy,c0=np.linalg.lstsq(A,bb,rcond=None)[0]; R=np.sqrt(c0+cx**2+cy**2)
col=np.median(a[cyan&(a[:,:,3]>200)&~pmask][:,:3],axis=0).astype(int)
base=a.copy(); tm=np.zeros_like(a); tm[tm_mask]=a[tm_mask]
big=np.array([[612,330],[830,322],[842,370],[826,452],[690,458],[600,462]],np.int32)
bm=np.zeros(a.shape[:2],np.uint8); cv2.fillPoly(bm,[big],255); bm=bm>0
yy,xx=np.mgrid[0:a.shape[0],0:a.shape[1]]; inside=np.hypot(xx-cx,yy-cy)<R
src=np.roll(base,240,axis=1)
base[bm&inside]=src[bm&inside]; base[bm&~inside]=0
arc=np.zeros(a.shape[:2],np.uint8); cv2.circle(arc,(int(cx*16),int(cy*16)),int(R*16),200,2,cv2.LINE_AA,4); arc=cv2.GaussianBlur(arc,(0,0),.6)
pm=bm.astype(np.uint8)*255
fill=(arc>0)&(pm>0)
base[fill,:3]=col; base[fill,3]=np.maximum(base[fill,3],arc[fill])
meta['arc']={'cx':float(cx),'cy':float(cy),'r':float(R),'color':col.tolist()}
ys,xs=np.where(tm[:,:,3]>0); x0,y0,x1,y1=xs.min(),ys.min(),xs.max()+1,ys.max()+1
# إزالة نص «تم التحقق» داخل الإطار
sub=tm[y0:y1,x0:x1].copy(); L=sub[:,:,:3].mean(2)
paper=sub[(sub[:,:,3]>200)&(L>150)][:,:3]; pc=np.median(paper,axis=0)*.95; sd=paper.std(0).mean()*.6
inner=np.array([[665,369],[778,366],[777,407],[666,413]],np.int32)-[x0,y0]
im_=np.zeros(L.shape,np.uint8); cv2.fillPoly(im_,[inner.astype(np.int32)],255)
rng=np.random.default_rng(1); noise=cv2.GaussianBlur(rng.normal(0,sd,L.shape),(0,0),.8)
for ch in range(3): sub[:,:,ch]=np.where(im_>0,np.clip(pc[ch]+noise,0,255),sub[:,:,ch])
al=(sub[:,:,3]>10).astype(np.uint8)*255; cl=cv2.morphologyEx(al,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
ff=cv2.copyMakeBorder(cl,2,2,2,2,cv2.BORDER_CONSTANT,0); cv2.floodFill(ff,None,(0,0),255); holes=(cv2.bitwise_not(ff)>0)[2:-2,2:-2]
fillm=(holes|(im_>0))
src_=cv2.inpaint(np.ascontiguousarray(sub[:,:,:3]),((al==0)&fillm).astype(np.uint8)*255,3,cv2.INPAINT_TELEA)
sub[fillm&(al==0),:3]=src_[fillm&(al==0)]; sub[fillm,3]=255
save(sub,'tm.png'); meta['tm']={'x':int(x0),'y':int(y0),'w':int(x1-x0),'h':int(y1-y0),'tx':722-x0,'ty':393-y0,'rot':-0.08,'size':40,'text':'تم التحقق'}
# القصاصات الحمراء
k,lab,st=comps(base); reds=[]
bid=max(range(1,k),key=lambda j:st[j][4])
for j in range(1,k):
    x,y,w,h,ar=st[j]
    if j==bid or ar<300 or (y>330 and w>500): continue
    c=np.zeros((h,w,4),np.uint8); mm=lab[y:y+h,x:x+w]==j; c[mm]=base[y:y+h,x:x+w][mm]; base[y:y+h,x:x+w][mm]=0
    fn='r11_%d.png'%len(reds); save(c,fn); reds.append({'f':fn,'x':int(x),'y':int(y),'w':int(w),'h':int(h)})
save(base,'11_base.png'); meta['reds']=reds
json.dump(meta,open(O+'meta.json','w'),ensure_ascii=False,indent=1,default=lambda o:o.item() if hasattr(o,'item') else str(o))
print('reds',len(reds),'people',{k:len(v['clips']) for k,v in meta['people'].items()},'arc',meta['arc'],'tm',meta['tm'])
# نسخة JS من البيانات (لأن fetch لا يعمل عبر file://)
M10=np.array(meta['people'][10]['M']); Mi=cv2.invertAffineTransform(M10.astype(np.float32))
meta['lens_aligned']=(Mi@np.array([625,685,1.0])).tolist()
open(O+'meta.js','w').write('window.META='+json.dumps(meta,ensure_ascii=False,default=lambda o:o.item() if hasattr(o,'item') else str(o))+';')
