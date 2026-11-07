// ===== «الجندي الرقمي» — النسخة المبنية على الصور الإحدى عشرة (0–44 ث) =====
const S=1080/941, IW=941, IH=1672;
const IM={}; const MT=window.META;
function li(k,src){return new Promise(r=>{const i=new Image();i.onload=()=>{IM[k]=i;r();};i.onerror=()=>{console.error('missing',src);r();};i.src=src;});}
const LIST={f01:'frames/01-desk-opening.png',f03:'frames/03-highlighted-alert.png',f05:'frames/05-control-strings.png',
 board:'layers/04_board.png',strings:'layers/04_strings.png',base11:'layers/11_base.png',tm:'layers/tm.png',lens:'layers/lens.png'};
for(const p of[6,7,8,9,10]){LIST['p'+p]=`layers/p${String(p).padStart(2,'0')}.png`;for(const c of MT.people[p].clips)LIST[c.f]='layers/'+c.f;}
for(const c of MT.reds)LIST[c.f]='layers/'+c.f;
window.assetsReady=Promise.all([...Object.entries(LIST).map(([k,v])=>li(k,v)),document.fonts.load('900 60px Tj','الحدود'),document.fonts.load('800 60px Tj','تم')]);
const TEAL='70,226,208';
function camI(cx,cy,z,rot=0){ctx.translate(W/2,H/2);ctx.rotate(rot);ctx.scale(S*z,S*z);ctx.translate(-cx,-cy);}
function bgFill(c1='#1a212b',c2='#07090d'){const g=ctx.createRadialGradient(W/2,H*.45,60,W/2,H*.45,1300);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
function addGlow(x,y,r,col,a){if(a<=0)return;ctx.save();ctx.globalCompositeOperation='lighter';radial(ctx,x,y,r,col,a);ctx.restore();}
function smooth(a,b,x){const t=inv(a,b,x);return t*t*(3-2*t);}

// ---------------- أ) افتتاحية المكتب 0–7 ----------------
function lampA(T){const q=[[0,0],[1.17,1],[1.24,.15],[1.31,.85],[1.39,.2],[1.55,1]];let v=0;for(const[a,b]of q)if(T>=a)v=b;return v;}
const DUST=Array.from({length:70},(_,i)=>({u:hash(i*1.7),v:hash(i*3.1),s:.6+hash(i*5.3)*1.6,sp:.15+hash(i*7.9)*.35,ph:hash(i*2.3)*6.28}));
const PHONE={x:483,y:1166,ang:-.17};
function sA(T){
 const L=lampA(T);
 const z=T<5.2?lerp(1,1.22,eio(T/5.2)):lerp(1.22,5.6,ei(inv(5.2,7.0,T)));
 const cx=lerp(470,PHONE.x,eio(inv(.3,6.6,T))),cy=lerp(836,PHONE.y,eio(inv(.3,6.4,T))),rot=lerp(0,-PHONE.ang,eio(inv(5.0,7.0,T)));
 bgFill('#14181e','#050608');ctx.save();camI(cx,cy,z,rot);ctx.drawImage(IM.f01,0,0);
 // غبار داخل شعاع المصباح فقط
 ctx.save();ctx.beginPath();ctx.moveTo(645,712);ctx.lineTo(790,738);ctx.lineTo(880,975);ctx.lineTo(420,975);ctx.closePath();ctx.clip();ctx.globalCompositeOperation='lighter';
 for(const d of DUST){const yy=712+((d.v*263+T*d.sp*40)%263);const k=(yy-712)/263;const xx=lerp(645+d.u*145,420+d.u*460,k)+Math.sin(T*.7+d.ph)*6;
  const a=.55*L*Math.sin(Math.PI*k)*(.6+.4*Math.sin(T*1.3+d.ph));ctx.fillStyle=`rgba(255,226,180,${a})`;ctx.beginPath();ctx.arc(xx,yy,d.s,0,7);ctx.fill();}
 ctx.restore();
 // نبض خافت لشاشة الجوال مع الاهتزازات
 let pu=0;for(const b of[3.73,4.55,5.37,6.18])pu=Math.max(pu,bell(b,b+.5,T));addGlow(PHONE.x,PHONE.y,150,'190,210,255',.14*pu);
 ctx.restore();
 if(L<1){ctx.fillStyle=`rgba(3,4,7,${(1-L)*.8})`;ctx.fillRect(0,0,W,H);}
}
// ---------------- ب) الموجز والخبر العاجل 6.45–15 ----------------
const CARD={x:52,y:788,w:846,h:266};
function drawFeed(off,h){
 ctx.fillStyle='#0b0f15';ctx.fillRect(0,0,IW,IH);
 const passes=[[0,1],[1,h]];
 for(const[hl,al]of passes){if(al<=0)continue;ctx.save();ctx.globalAlpha=al;
  // شريط التبويبات ثابت
  ctx.save();ctx.beginPath();ctx.rect(0,0,IW,170);ctx.clip();if(!hl)ctx.filter='brightness(1.92)';ctx.drawImage(IM.f03,0,0);ctx.restore();
  // البطاقات تتحرك
  ctx.save();ctx.beginPath();ctx.rect(0,170,IW,IH-170);ctx.clip();ctx.translate(0,off);
  if(hl){ctx.drawImage(IM.f03,0,0);}
  else{ctx.save();ctx.beginPath();ctx.rect(0,170,IW,764-170);ctx.rect(0,1068,IW,IH-1068);ctx.clip();ctx.filter='brightness(1.92)';ctx.drawImage(IM.f03,0,0);ctx.restore();
   ctx.fillStyle='#141a23';ctx.beginPath();rr(ctx,CARD.x+4,CARD.y+4,CARD.w-8,CARD.h-8,12);ctx.fill();
   ctx.save();ctx.beginPath();rr(ctx,CARD.x+9,CARD.y+9,CARD.w-18,CARD.h-18,8);ctx.clip();ctx.drawImage(IM.f03,0,0);ctx.restore();}
  ctx.restore();ctx.restore();}
}
function sB(T){
 const k0=eo(inv(6.45,7.25,T)),zin=lerp(.62,1,k0),a0=inv(6.45,6.85,T);
 const off=T<7?300:lerp(300,0,eback(inv(7.0,8.15,T)));const h=eio(inv(8.25,8.75,T));
 const z=1+.3*eio(inv(8.8,14.7,T)),fx=lerp(470,475,inv(8.8,14.7,T)),fy=lerp(836,921,eio(inv(8.8,14.7,T)));
 ctx.save();ctx.globalAlpha=a0;ctx.translate(W/2,H/2);ctx.scale(zin,zin);ctx.translate(-W/2,-H/2);camI(fx,fy,z);drawFeed(off,h);
 // نبضة حمراء واحدة على حافة الخبر
 const e=inv(8.3,9.3,T);if(e>0&&e<1){ctx.save();ctx.translate(0,off);ctx.strokeStyle=`rgba(${C.RED},${(1-e)*.75})`;ctx.lineWidth=4;ctx.beginPath();rr(ctx,CARD.x-e*26,CARD.y-e*26,CARD.w+e*52,CARD.h+e*52,14+e*20);ctx.stroke();ctx.restore();}
 ctx.restore();
 const fo=inv(14.75,15,T);if(fo>0){ctx.fillStyle=`rgba(0,0,0,${fo})`;ctx.fillRect(0,0,W,H);}
}
// ---------------- ج) لوحة الأدلة 15–19.6 ----------------
function label(l){ctx.save();ctx.translate(l.cx,l.cy);ctx.rotate(l.rot);ctx.font=`900 ${l.size}px Tj`;ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.globalAlpha=.93;ctx.fillStyle='#24272c';ctx.fillText(l.text,0,2);ctx.restore();}
function sC(T){
 const P=[[15,470,760,1.5],[16.6,214,306,2.0],[17.4,212,298,2.06],[18.5,712,236,2.0],[19.15,714,232,2.06],[19.6,690,150,2.5]];
 const cx=kf(T,P.map(p=>[p[0],p[1]])),cy=kf(T,P.map(p=>[p[0],p[2]])),z=kf(T,P.map(p=>[p[0],p[3]]));const sh=shake(T,3,.5);
 bgFill('#161b22','#06080b');ctx.save();camI(cx+sh[0],cy+sh[1],z,Math.sin(T*.4)*.01);
 ctx.drawImage(IM.board,0,0);label(MT.labels.hudud);label(MT.labels.miyar);ctx.drawImage(IM.strings,0,0);ctx.restore();
 const fi=1-inv(15,15.3,T);if(fi>0){ctx.fillStyle=`rgba(0,0,0,${fi})`;ctx.fillRect(0,0,W,H);}
}
// ---------------- د) اليد والخيوط 19.44–23 ----------------
function handOff(T){const y=-26*eo(inv(22.05,22.25,T))*(1-eio(inv(22.3,23.2,T)));return[Math.sin(T*1.5)*5,Math.sin(T*1.1)*4+y];}
function sD(T){
 const z=kf(T,[[19.44,1.55],[21.2,1.0],[23,1.04]]),cy=kf(T,[[19.44,1040],[21.2,836],[23,826]]);
 const h=handOff(T),p=handOff(T-.35);p[0]*=.85;p[1]*=.85;
 bgFill('#171c24','#06080b');ctx.save();camI(470,cy,z);
 const N=140,sh=IH/N;for(let i=0;i<N;i++){const y0=i*sh,f=smooth(380,1470,y0+sh/2);ctx.drawImage(IM.f05,0,y0,IW,sh+1,lerp(h[0],p[0],f),y0+lerp(h[1],p[1],f),IW,sh+1);}
 ctx.restore();
 const fi=1-inv(19.44,19.62,T);if(fi>0){ctx.save();ctx.globalAlpha=fi;sC(19.6);ctx.restore();}
 const fo=inv(22.82,23,T);if(fo>0){ctx.fillStyle=`rgba(0,0,0,${fo})`;ctx.fillRect(0,0,W,H);}
}
// ---------------- هـ) المستخدم والقصاصات 23–33 ----------------
const PSEG=[[23,'p6'],[25.1,'p7'],[26.75,'p8'],[28.0,'p9'],[30.4,'p10']];
function clipDraw(c,T,o){// o: tin,tout,from[dx,dy],to[dx,dy],seed,flow
 if(T<o.tin||T>o.tout+.5)return;const im=IM[c.f];if(!im)return;
 const k=eo(inv(o.tin,o.tin+(o.dur||.5),T)),e=ei(inv(o.tout,o.tout+.45,T));
 let dx=(1-k)*o.from[0]+e*o.to[0],dy=(1-k)*o.from[1]+e*o.to[1]+Math.sin(T*1.3+o.seed)*5-(o.flow||0)*(T-o.tin);
 const sc=(o.slam?lerp(1.35,1,eo(inv(o.tin,o.tin+.16,T))):lerp(.86,1,eback(k)))*(1-.1*e),a=Math.min(k*1.6,1)*(1-e),rot=Math.sin(T*.9+o.seed)*.02;
 ctx.save();ctx.globalAlpha=a;ctx.translate(c.x+c.w/2+dx,c.y+c.h/2+dy);ctx.rotate(rot);ctx.scale(sc,sc);ctx.drawImage(im,-c.w/2,-c.h/2);ctx.restore();}
function sE(T,noCam){
 const z=1+.05*eio(inv(23,32.3,T));
 bgFill('#18202b','#06080c');ctx.save();camI(470,880,z);
 // الشخص: تبديل ناعم بين اللقطات المحاذاة
 const br=1+.004*Math.sin(T*Math.PI*2/3.6);ctx.save();ctx.translate(470,IH);ctx.scale(1,br);ctx.translate(-470,-IH);
 for(let i=0;i<PSEG.length;i++){const t0=PSEG[i][0],t1=i+1<PSEG.length?PSEG[i+1][0]:99;const a=Math.min(inv(t0-.35,t0,T)||(i==0?1:0),1-inv(t1-.35,t1,T));
  const aa=i==0?1-inv(t1-.35,t1,T):a;if(aa>0){ctx.globalAlpha=aa;ctx.drawImage(IM[PSEG[i][1]],0,0);}}
 ctx.globalAlpha=1;ctx.restore();
 const P=MT.people;
 clipDraw(P[6].clips[0],T,{tin:23.45,tout:25.05,from:[0,50],to:[-140,-170],seed:1});
 clipDraw(P[7].clips[0],T,{tin:25.15,tout:26.68,from:[220,0],to:[120,-200],seed:2});
 clipDraw(P[7].clips[1],T,{tin:25.35,tout:26.68,from:[-220,0],to:[-120,-200],seed:3});
 const w8=P[8].clips[0];clipDraw(w8,T,{tin:26.8,tout:27.95,from:[0,0],to:[0,-220],seed:4,slam:1,dur:.16});
 const rp=bell(26.8,27.6,T);if(rp>0)addGlow(w8.x+w8.w/2,w8.y+w8.h/2,260,C.RED,.22*rp);
 P[9].clips.forEach((c,i)=>clipDraw(c,T,{tin:28.0+i*.17,tout:30.3,from:[0,260],to:[0,-260],seed:5+i,flow:26}));
 P[10].clips.forEach((c,i)=>clipDraw(c,T,{tin:30.4+i*.05,tout:40,from:[-60,30],to:[0,0],seed:9+i,flow:4}));
 // العدسة فوق «مصدر مجهول»
 const L0=MT.lens_aligned,mc=P[6].clips[0],cc=[L0[0],L0[1]-10];
 if(T>30.42){const k=eo(inv(30.42,30.9,T));ctx.save();ctx.globalAlpha=k;ctx.translate(cc[0]-mc.x-mc.w/2,cc[1]-mc.y-mc.h/2);clipDraw(mc,T,{tin:30.42,tout:40,from:[0,20],to:[0,0],seed:1});ctx.restore();
  const lx=kf(T,[[30.6,cc[0]+330],[31.15,cc[0]+80],[31.9,cc[0]-50],[32.25,cc[0]]]),ly=kf(T,[[30.6,cc[1]+300],[31.15,cc[1]+10],[31.9,cc[1]-4],[32.25,cc[1]]]);
  if(T>30.6){const R=MT.lens.r;ctx.save();ctx.beginPath();ctx.arc(lx,ly,R,0,7);ctx.clip();ctx.fillStyle='#121821';ctx.fillRect(lx-R,ly-R,2*R,2*R);
   ctx.translate(lx,ly);ctx.scale(1.65,1.65);ctx.translate(-lx,-ly);ctx.translate(cc[0]-mc.x-mc.w/2,cc[1]-mc.y-mc.h/2);clipDraw(mc,T,{tin:30.42,tout:40,from:[0,20],to:[0,0],seed:1});ctx.restore();
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${TEAL},.06)`;ctx.beginPath();ctx.arc(lx,ly,R,0,7);ctx.fill();
   ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=6;ctx.beginPath();ctx.arc(lx,ly,R-14,3.6,4.4);ctx.stroke();ctx.restore();
   ctx.drawImage(IM.lens,lx-MT.lens.cx,ly-MT.lens.cy);
   const tp=bell(31.7,32.4,T);if(tp>0){ctx.save();ctx.strokeStyle=`rgba(${TEAL},${.5*tp})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(lx,ly,R+10+tp*20,0,7);ctx.stroke();ctx.restore();addGlow(lx,ly,R*1.8,TEAL,.12*tp);}
   sE.lens=[lx,ly,R,z];}}
 ctx.restore();
 const fi=1-inv(23,23.3,T);if(fi>0){ctx.fillStyle=`rgba(0,0,0,${fi})`;ctx.fillRect(0,0,W,H);}
 // انتقال القزحية عبر زجاج العدسة إلى الفلترة
 if(T>32.3&&sE.lens){const[lx,ly,R,zz]=sE.lens;const sx=W/2+(lx-470)*S*zz,sy=H/2+(ly-880)*S*zz;const r=lerp(R*S*zz,1500,ei(inv(32.3,33,T)));
  ctx.save();ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.clip();sF(Math.max(T,33));ctx.restore();
  ctx.save();ctx.strokeStyle=`rgba(${TEAL},.85)`;ctx.lineWidth=7;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.stroke();ctx.restore();addGlow(sx,sy,r+40,TEAL,.06);}
}
// ---------------- و) الفلترة الرقمية 33–44 ----------------
const ARC=MT.arc;function arcY(x){return ARC.cy-Math.sqrt(Math.max(0,ARC.r*ARC.r-(x-ARC.cx)**2));}
const HITS2=[];for(let k=0;k<14;k++){if(k%5==3)continue;const th=33+k*.24+.08*Math.sin(k*12.9);HITS2.push(33+(th-31)*11/9);}
function sF(T){
 const z=1+.07*eio(inv(33,43.5,T));bgFill('#16202a','#05080b');ctx.save();camI(470,900,z);
 ctx.drawImage(IM.base11,0,0);
 // نبض القوس مع ضربات القلب + نبضة الحماية
 let hb=0;for(let b=33.24;b<44;b+=.85)hb=Math.max(hb,bell(b,b+.35,T));const pz=bell(39.55,40.6,T);
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${TEAL},${.10*hb+.25*pz})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(ARC.cx,ARC.cy,ARC.r,Math.PI,2*Math.PI);ctx.stroke();ctx.restore();
 addGlow(470,700,620,TEAL,.08*pz);
 // ضوء تركوازي يمر على القوس مرة واحدة + انعكاسه على الأرض
 const sw=inv(34.0,36.0,T);if(sw>0&&sw<1){const x=lerp(-20,960,eio(sw)),y=arcY(x),ang=Math.atan2(y-ARC.cy,x-ARC.cx);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.strokeStyle=`rgba(${TEAL},.16)`;ctx.lineWidth=18;ctx.beginPath();ctx.arc(ARC.cx,ARC.cy,ARC.r,ang-.12,ang+.06);ctx.stroke();
  ctx.strokeStyle=`rgba(200,255,245,.85)`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(ARC.cx,ARC.cy,ARC.r,ang-.06,ang+.02);ctx.stroke();
  const g=ctx.createRadialGradient(x,1172,0,x,1172,150);g.addColorStop(0,`rgba(${TEAL},.32)`);g.addColorStop(1,`rgba(${TEAL},0)`);ctx.fillStyle=g;ctx.save();ctx.translate(x,1172);ctx.scale(1,.12);ctx.translate(-x,-1172);ctx.fillRect(x-150,1022,300,300);ctx.restore();
  const g2=ctx.createLinearGradient(0,1175,0,1420);g2.addColorStop(0,`rgba(${TEAL},.12)`);g2.addColorStop(1,`rgba(${TEAL},0)`);ctx.fillStyle=g2;ctx.fillRect(x-22,1175,44,245);ctx.restore();}
 // القصاصات الحمراء: تصل إلى الحد وتتلاشى عنده
 MT.reds.forEach((c,i)=>{const th=HITS2[i%HITS2.length]+(i>=HITS2.length?1.2:0),im=IM[c.f];if(!im||T<th-2.4||T>th+.5)return;const cx0=c.x+c.w/2;
  const yEnd=arcY(cx0)-c.h*.35,yS=c.y+c.h/2-560;const k=eio(inv(th-2.4,th,T)),e=inv(th,th+.45,T);
  const x=cx0+Math.sin(T*.8+i)*10*(1-k),y=lerp(yS,yEnd,k);ctx.save();ctx.globalAlpha=Math.min(1,inv(th-2.4,th-1.9,T))*(1-e);ctx.translate(x,y);ctx.rotate(Math.sin(T*.7+i*2)*.08);ctx.scale(1-.15*e,1-.15*e);ctx.drawImage(im,-c.w/2,-c.h/2);ctx.restore();
  if(e>0&&e<1)addGlow(cx0,arcY(cx0),90,C.RED,.25*(1-e));});
 // «تم التحقق» تعبر الحد وتستقر للقراءة
 const tm=MT.tm,tmx=tm.x+tm.w/2;if(T>39.2){const yC=arcY(tmx);const y=T<41.2?lerp(-120,yC,eio(inv(39.2,41.2,T))):lerp(yC,470,eo(inv(41.2,42.0,T)));
  const ts=lerp(1,1.25,eo(inv(41.3,42.1,T)));const tx=lerp(tmx,725,eo(inv(41.2,42.0,T)));ctx.save();ctx.translate(tx+Math.sin(T*.9)*3,y);ctx.rotate(tm.rot*.5+Math.sin(T*.8)*.015);ctx.scale(ts,ts);ctx.drawImage(IM.tm,-tm.w/2,-tm.h/2);
  ctx.translate(tm.tx-tm.w/2,tm.ty-tm.h/2);ctx.rotate(tm.rot);let fz=tm.size;ctx.font=`800 ${fz}px Tj`;const tw=ctx.measureText(tm.text).width;if(tw>100){fz*=100/tw;ctx.font=`800 ${fz}px Tj`;}ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#16191d';ctx.fillText(tm.text,-2,2);ctx.restore();
  const cr=bell(41.1,41.8,T);if(cr>0){ctx.save();ctx.strokeStyle=`rgba(${TEAL},${.6*cr})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(tmx,yC,40+cr*120,8+cr*16,0,0,7);ctx.stroke();ctx.restore();addGlow(tmx,yC,160,TEAL,.18*cr);}}
 ctx.restore();
 const fo=Math.pow(inv(43.4,44,T),2);if(fo>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(200,255,230,${fo})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
}
// ---------------- التجميع ----------------
function scene(T){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
 if(T<6.45)sA(T);else if(T<7.25){sA(T);sB(T);}else if(T<15)sB(T);else if(T<19.44)sC(T);else if(T<23)sD(T);else if(T<33)sE(T);else sF(T);}
let cv,ctx,MAIN,ACC,ac,TMP,GR=[];
function setup(c){cv=c;cv.width=W;cv.height=H;MAIN=ctx=cv.getContext('2d');ACC=mkCanvas(W,H);ac=ACC.getContext('2d');TMP=mkCanvas(W,H);
 for(let g=0;g<4;g++){const c2=mkCanvas(360,360),x=c2.getContext('2d'),im=x.createImageData(360,360),r=mulberry32(g+11);for(let i=0;i<im.data.length;i+=4){const v=r()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}x.putImageData(im,0,0);GR.push(c2);}}
function render(T){// تمويه حركة: ثلاث عيّنات زمنية
 const tc=TMP.getContext('2d');ac.clearRect(0,0,W,H);const fast=(T>7&&T<8.4)||(T>15&&T<19.7),n=fast?9:3,span=fast?1/90:1/100,smp=Array.from({length:n},(_,i)=>(i/(n-1)-.5)*span);
 smp.forEach((d,i)=>{ctx=tc;tc.setTransform(1,0,0,1,0,0);tc.clearRect(0,0,W,H);scene(Math.max(0,T+d));ac.globalAlpha=1/(i+1);ac.drawImage(TMP,0,0);});
 ctx=MAIN;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(ACC,0,0);
 const vg=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.6)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 const fr=Math.floor(T*30),p=ctx.createPattern(GR[fr%4],'repeat');p.setTransform(new DOMMatrix().translate(hash(fr)*360,hash(fr+1)*360).scale(1.5,1.5));
 ctx.globalCompositeOperation='overlay';ctx.globalAlpha=.09;ctx.fillStyle=p;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
