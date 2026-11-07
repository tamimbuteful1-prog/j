// ===== الحلقة الأولى — أسلوب بصري للكبار: وثائقي/غرفة عمليات (بدون كرتون، بدون نص) =====
const PAL={bg:'#0a0d11',bone:'216,210,196',steel:'93,107,122',red:'196,52,58',teal:'95,179,166',cool:'150,175,205'};
// ---------- خريطة تضاريس إجرائية (تظليل ارتفاعات كالصور الجوية) ----------
const HM=(()=>{const w=480,h=860,c=mkCanvas(w,h),x=c.getContext('2d'),im=x.createImageData(w,h);
 const P=new Float32Array(256*256);const r=mulberry32(21);for(let i=0;i<P.length;i++)P[i]=r();
 const vn=(X,Y)=>{const xi=Math.floor(X),yi=Math.floor(Y),xf=X-xi,yf=Y-yi,s=t=>t*t*(3-2*t);const g=(a,b)=>P[((a&255)<<8)|(b&255)];
  return lerp(lerp(g(xi,yi),g(xi+1,yi),s(xf)),lerp(g(xi,yi+1),g(xi+1,yi+1),s(xf)),s(yf));};
 const H=new Float32Array(w*h);for(let y=0;y<h;y++)for(let X=0;X<w;X++){let a=0,f=1/90,amp=1;for(let o=0;o<6;o++){a+=amp*vn(X*f+7,y*f+3);f*=2.03;amp*=.5;}
  const rid=1-Math.abs(vn(X/140+20,y/140+9)*2-1);H[y*w+X]=a*.75+rid*rid*.5;}
 const ret={w,h,H,c};for(let y=1;y<h-1;y++)for(let X=1;X<w-1;X++){const i=y*w+X;const dx=(H[i+1]-H[i-1])*9,dy=(H[i+w]-H[i-w])*9;
  let sh=(-dx*.7-dy*.5+1)/Math.sqrt(dx*dx+dy*dy+1);sh=clamp(sh*.85+.15);const e=H[i]/1.6;
  const base=[lerp(40,138,e),lerp(39,128,e),lerp(35,108,e)];const k=4*i;im.data[k]=base[0]*sh;im.data[k+1]=base[1]*sh;im.data[k+2]=base[2]*sh*1.02;im.data[k+3]=255;}
 x.putImageData(im,0,0);
 // نسخة نقطية (رقمية) من نفس التضاريس
 const d=mkCanvas(w,h),dx_=d.getContext('2d');dx_.fillStyle='#07090c';dx_.fillRect(0,0,w,h);
 for(let y=4;y<h;y+=7)for(let X=4;X<w;X+=7){const v=H[y*w+X]/1.6;const s=.6+v*2.4;dx_.fillStyle=`rgba(${PAL.steel},${.25+v*.6})`;dx_.fillRect(X-s/2,y-s/2,s,s);}
 ret.d=d;return ret;})();
const BORDER=[[-40,640],[90,560],[170,590],[260,470],[340,430],[430,300],[520,260]]; // خط الحدود على الخريطة (إحداثيات الخريطة)
function poly(c,pts,sx,sy){c.beginPath();pts.forEach((p,i)=>{const X=p[0]*sx,Y=p[1]*sy;i?c.lineTo(X,Y):c.moveTo(X,Y);});}
function hud(a){ctx.save();ctx.strokeStyle=`rgba(${PAL.bone},${.35*a})`;ctx.lineWidth=2;const m=60,l=60;
 for(const[x,y,dx,dy]of[[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]]){ctx.beginPath();ctx.moveTo(x,y+dy*l);ctx.lineTo(x,y);ctx.lineTo(x+dx*l,y);ctx.stroke();}
 ctx.lineWidth=1;for(let i=0;i<40;i++){const y=200+i*38;ctx.beginPath();ctx.moveTo(W-m,y);ctx.lineTo(W-m-(i%5?10:22),y);ctx.stroke();}
 ctx.beginPath();ctx.moveTo(W/2-18,H/2);ctx.lineTo(W/2-6,H/2);ctx.moveTo(W/2+6,H/2);ctx.lineTo(W/2+18,H/2);ctx.moveTo(W/2,H/2-18);ctx.lineTo(W/2,H/2-6);ctx.moveTo(W/2,H/2+6);ctx.lineTo(W/2,H/2+18);ctx.stroke();ctx.restore();}
// ---------- أ) الحدود الجغرافية ← الرقمية (0–6.2) ----------
function eGeo(u){const sx=W/HM.w,sy=H/HM.h;const z=lerp(1.0,1.55,eio(inv(0,6.2,u)));const fx=lerp(540,600,eio(inv(0,6.2,u))),fy=lerp(960,880,eio(inv(0,6.2,u)));
 const dig=eio(inv(2.5,4.0,u));
 ctx.save();ctx.translate(W/2,H/2);ctx.rotate(lerp(.02,-.03,u/6.2));ctx.scale(z,z);ctx.translate(-fx,-fy);
 ctx.globalAlpha=1-dig;ctx.drawImage(HM.c,0,0,W,H);ctx.globalAlpha=dig;ctx.drawImage(HM.d,0,0,W,H);ctx.globalAlpha=1;
 // ظلال أعمدة السياج على طول الحدود
 ctx.save();ctx.globalAlpha=1-dig;for(let i=0;i<BORDER.length-1;i++){const a=BORDER[i],b=BORDER[i+1];for(let k=0;k<6;k++){const t=k/6;const X=lerp(a[0],b[0],t)*sx,Y=lerp(a[1],b[1],t)*sy;
  ctx.fillStyle='rgba(10,9,8,.6)';ctx.save();ctx.translate(X,Y);ctx.rotate(.6);ctx.fillRect(0,-1.5,26,3);ctx.restore();ctx.fillStyle=`rgba(${PAL.bone},.7)`;ctx.fillRect(X-2,Y-2,4,4);}}ctx.restore();
 // الخط: متقطّع بلون العظم ← خط تركوازي متصل
 ctx.save();ctx.lineWidth=2.4/z;ctx.setLineDash([14,10]);ctx.strokeStyle=`rgba(${PAL.bone},${.8*(1-dig)})`;poly(ctx,BORDER,sx,sy);ctx.stroke();ctx.setLineDash([]);
 const n=dig*(BORDER.length-1);ctx.strokeStyle=`rgba(${PAL.teal},.95)`;ctx.lineWidth=3/z;ctx.beginPath();for(let i=0;i<=Math.floor(n)&&i<BORDER.length;i++){const p=BORDER[i];i?ctx.lineTo(p[0]*sx,p[1]*sy):ctx.moveTo(p[0]*sx,p[1]*sy);}
 if(n%1>0&&Math.floor(n)+1<BORDER.length){const a=BORDER[Math.floor(n)],b=BORDER[Math.floor(n)+1],f=n%1;ctx.lineTo(lerp(a[0],b[0],f)*sx,lerp(a[1],b[1],f)*sy);}ctx.stroke();ctx.restore();
 // خط مسح أفقي بعد التحوّل
 if(u>4){const y=lerp(-200,H+200,((u-4)/2.2)%1);ctx.fillStyle=`rgba(${PAL.teal},.10)`;ctx.fillRect(-200,y,W+400,3/z);}
 ctx.restore();
 hud(Math.min(1,u/1.2));
 const fi=1-inv(0,.8,u);if(fi>0){ctx.fillStyle=`rgba(0,0,0,${fi})`;ctx.fillRect(0,0,W,H);}}
// ---------- ب) شبكة الحملات فوق الخريطة النقطية (6.2–9.4) ----------
function eNet(u){ctx.drawImage(HM.d,-60,-100,W+120,H+200);ctx.fillStyle='rgba(5,7,10,.55)';ctx.fillRect(0,0,W,H);
 const z=lerp(.62,.42,eio(inv(0,3.2,u))),tt=2.85+u*1.35;ctx.save();camT(ctx,0,0,z,u*.02);
 ctx.strokeStyle=`rgba(${PAL.red},.45)`;ctx.lineWidth=1.2/z;ctx.beginPath();
 for(const n of NET){if(n.p<0||tt<n.ta-.3)continue;const P=NET[n.p],e=eo(inv(n.ta-.3,n.ta,tt));ctx.moveTo(P.x,P.y);ctx.lineTo(lerp(P.x,n.x,e),lerp(P.y,n.y,e));}ctx.stroke();
 for(const n of NET){if(tt<n.ta)continue;const k=tt-n.ta,s=(n.p<0?12:5)/z*.5+(k<.3?(.3-k)*20:0);ctx.fillStyle=n.f?`rgba(${PAL.red},.95)`:`rgba(${PAL.bone},.75)`;ctx.fillRect(n.x-s/2,n.y-s/2,s,s);}
 ctx.restore();hud(1);}
// ---------- ج/د) الرأس في الظل: الاستهداف ثم الحاجز (9.4–16.4) ----------
const PROF=[[.30,.05],[.55,.02],[.75,.12],[.80,.30],[.80,.36],[.91,.47],[.82,.52],[.845,.56],[.81,.60],[.835,.635],[.80,.72],[.72,.80],[.58,.78],[.62,.95],[.66,1.2],[.18,1.2],[.26,.86],[.13,.55],[.17,.2]];
function profPath(c,x,y,s){c.beginPath();const p=PROF.map(q=>[x+(q[0]-.5)*s,y+(q[1]-.5)*s]);c.moveTo((p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2);
 for(let i=1;i<=p.length;i++){const a=p[i%p.length],b=p[(i+1)%p.length];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);}c.closePath();}
function head(u,glow){const hx=600,hy=880,hs=900;
 const bg=ctx.createRadialGradient(780,1250,50,780,1250,1300);bg.addColorStop(0,'#141a22');bg.addColorStop(1,'#050608');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.translate(hx,hy);ctx.scale(1+.04*u/7,1+.04*u/7);ctx.translate(-hx,-hy);
 // حافة ضوئية باردة من شاشة الجوال (أسفل الوجه)
 ctx.save();ctx.filter='blur(6px)';ctx.fillStyle=`rgba(${PAL.cool},${.55*glow})`;profPath(ctx,hx+7,hy+4,hs);ctx.fill();ctx.restore();
 ctx.fillStyle='#040506';profPath(ctx,hx,hy,hs);ctx.fill();
 ctx.save();profPath(ctx,hx,hy,hs);ctx.clip();const g=ctx.createRadialGradient(hx+380,hy+420,10,hx+380,hy+420,520);g.addColorStop(0,`rgba(${PAL.cool},${.22*glow})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();
 ctx.restore();return[hx+.33*hs-60,hy-.2*hs];}
function eTarget(u){const T=head(u,1);const P=[[1.0],[1.8],[2.6]];
 // خطوط واردة رفيعة من الشبكة تتجه نحو الرأس
 ctx.save();ctx.lineWidth=1.6;for(let i=0;i<22;i++){const st=i*.11;const k=eio(inv(st,st+1.4,u));if(k<=0)continue;const sx=-40,sy=200+hash(i)*1500;const cx=(sx+T[0])/2,cy=sy-200+hash(i+5)*300;
  ctx.strokeStyle=`rgba(${PAL.red},${.55*(1-.5*inv(2.8,3.6,u))})`;ctx.beginPath();ctx.moveTo(sx,sy);const N=20;for(let s=1;s<=N*k;s++){const t=s/N;ctx.lineTo((1-t)**2*sx+2*(1-t)*t*cx+t*t*T[0],(1-t)**2*sy+2*(1-t)*t*cy+t*t*T[1]);}ctx.stroke();}ctx.restore();
 // شبكة تصويب تضيق مع كل نبضة (أنت / قيمك وثقافتك / تفكيرك)
 let r=320;for(const[p]of P)r-=70*eo(inv(p,p+.3,u));const fl=Math.max(...P.map(([p])=>bell(p,p+.45,u)));
 ctx.save();ctx.strokeStyle=`rgba(${PAL.red},${.5+.4*fl})`;ctx.lineWidth=1.5;for(const rr of[r,r*.62]){ctx.beginPath();ctx.arc(T[0],T[1],rr,0,7);ctx.stroke();}
 for(let a=0;a<4;a++){const an=a*Math.PI/2+u*.15;ctx.beginPath();ctx.moveTo(T[0]+Math.cos(an)*r*1.12,T[1]+Math.sin(an)*r*1.12);ctx.lineTo(T[0]+Math.cos(an)*r*.8,T[1]+Math.sin(an)*r*.8);ctx.stroke();}ctx.restore();
 hud(.6);}
function eBarrier(u){const T=head(3.6+u,1);const bx=lerp(-60,330,eo(inv(.2,.9,u)));
 // حاجز شفاف رفيع يوقف الخطوط قبل الرأس
 ctx.save();ctx.fillStyle=`rgba(${PAL.teal},.06)`;ctx.fillRect(bx-40,0,40,H);ctx.strokeStyle=`rgba(${PAL.teal},.9)`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx,0);ctx.lineTo(bx,H);ctx.stroke();
 for(let y=0;y<H;y+=48){ctx.beginPath();ctx.moveTo(bx,y);ctx.lineTo(bx-12,y);ctx.stroke();}ctx.restore();
 ctx.save();ctx.lineWidth=1.6;for(let i=0;i<22;i++){const sy=200+hash(i)*1500;const hit=bx-2;const a=1-inv(.5,1.6,u+hash(i)*.4);if(a<=0)continue;ctx.strokeStyle=`rgba(${PAL.red},${.55*a})`;ctx.beginPath();ctx.moveTo(-40,sy);ctx.lineTo(hit,lerp(sy,T[1],.18));ctx.stroke();
  ctx.fillStyle=`rgba(${PAL.bone},${.6*a})`;ctx.fillRect(hit-3,lerp(sy,T[1],.18)-3,6,6);}ctx.restore();
 hud(.6);const fo=inv(3.0,3.4,u);if(fo>0){ctx.fillStyle=`rgba(0,0,0,${fo})`;ctx.fillRect(0,0,W,H);}}
// ---------- هـ) الجندي على الحدود الرقمية: أرض نقطية بمنظور وأفق (16.4–20) ----------
function soldier(c,x,y,h){c.save();c.filter='blur(1.2px)';figureFill(c,x,y,h);c.restore();}
function eHorizon(u){const hz=lerp(820,760,eio(inv(0,3.6,u)));
 const sk=ctx.createLinearGradient(0,0,0,hz);sk.addColorStop(0,'#05070a');sk.addColorStop(1,'#1f2833');ctx.fillStyle=sk;ctx.fillRect(0,0,W,hz);
 for(const s of STARS2){ctx.fillStyle=`rgba(${PAL.bone},${s.a})`;ctx.fillRect(s.x,s.y*hz/900,1.4,1.4);}
 ctx.fillStyle='#07090c';ctx.fillRect(0,hz,W,H-hz);
 // أرض من نقاط التضاريس بمنظور
 const cam=lerp(0,140,u/3.6);for(let r=1;r<70;r++){const d=r*.9;const y=hz+900/d;if(y>H+20)continue;const sp=46/d*16;
  for(let k=-40;k<=40;k++){const wx=k*sp*.9;const X=W/2+wx*1;const hm=HM.H[(Math.floor((r*11+cam))%HM.h)*HM.w+((k+40)*5)%HM.w]/1.6;const s=Math.max(1,3.2/d*6*(.5+hm));
   if(X<-10||X>W+10)continue;ctx.fillStyle=`rgba(${PAL.steel},${Math.min(.9,(.3+hm*.8)*(1.2-d/70))})`;ctx.fillRect(X-s/2,y-s/2,s,s);}}
 // خط الحدود يمتد من المقدّمة إلى الأفق
 const LX=y=>lerp(W/2,W/2+140,(y-hz)/(H-hz));ctx.strokeStyle=`rgba(${PAL.teal},.95)`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(LX(H),H);ctx.lineTo(W/2,hz);ctx.stroke();
 ctx.strokeStyle=`rgba(${PAL.teal},.25)`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,hz);ctx.lineTo(W,hz);ctx.stroke();
 // الجندي واقف على الخط، ظهره للكاميرا، وضوء جواله خافت
 const fy=lerp(1380,1340,eio(u/3.6)),fh=lerp(560,520,eio(u/3.6)),fx=LX(fy);
 ctx.fillStyle='rgba(0,0,0,.6)';ctx.save();ctx.translate(fx,fy);ctx.scale(1,.08);ctx.beginPath();ctx.ellipse(0,0,120,120,0,0,7);ctx.fill();ctx.restore();
 ctx.fillStyle='#020304';soldier(ctx,fx,fy,fh);
 const gx=fx+60*fh/760,gy=fy-fh*.47;ctx.save();ctx.globalCompositeOperation='lighter';radial(ctx,gx,gy,90,PAL.cool,.12);ctx.restore();
 hud(.5);const fi=1-inv(0,.4,u),fo=inv(3.35,3.6,u);const b=Math.max(fi,fo);if(b>0){ctx.fillStyle=`rgba(0,0,0,${b})`;ctx.fillRect(0,0,W,H);}}
const STARS2=Array.from({length:160},(_,i)=>({x:hash(i*2.7)*W,y:hash(i*9.1)*900,a:.1+hash(i*4.4)*.4}));
// ---------- و) الملفات: كشف الخيوط الخفية ثم «مزرعة» الحسابات المنسّقة (20–25.8) ----------
const PAPERTEX=(()=>{const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#cfc8b9';x.fillRect(0,0,256,256);const r=mulberry32(5);for(let i=0;i<5000;i++){const v=r();x.fillStyle=`rgba(${v<.5?60:255},${v<.5?52:248},${v<.5?44:236},${r()*.08})`;x.fillRect(r()*256,r()*256,1+r()*2,1+r()*2);}return c;})();
window.SLATE=(()=>{const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#111419';x.fillRect(0,0,256,256);const r=mulberry32(9);for(let i=0;i<9000;i++){x.fillStyle=`rgba(255,255,255,${r()*.025})`;x.fillRect(r()*256,r()*256,1,1);}return c;})();
const DOCS=[[230,560,-.06],[820,520,.05],[525,930,.02],[220,1300,.07],[830,1280,-.05],[530,1650,.03]];
function doc(x,y,rot,i){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(.72,.72);ctx.fillStyle='rgba(0,0,0,.55)';ctx.filter='blur(14px)';ctx.fillRect(-150,-180,320,390);ctx.filter='none';
 ctx.fillStyle=ctx.createPattern(PAPERTEX,'repeat');ctx.fillRect(-160,-200,320,400);
 ctx.fillStyle='#2b2d31';ctx.fillRect(-130,-170,260,10);ctx.fillStyle='#1a1b1e';for(let k=0;k<3;k++)ctx.fillRect(-130,-140+k*26,(k==2?150:260),14);
 const g=ctx.createLinearGradient(-130,-50,130,90);g.addColorStop(0,'#4a4d52');g.addColorStop(1,'#26282c');ctx.fillStyle=g;ctx.fillRect(-130,-50,140,120);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(-60,10,30,0,7);ctx.fill();
 ctx.fillStyle='rgba(40,40,42,.65)';for(let k=0;k<10;k++)ctx.fillRect(25,-50+k*13,100*(.5+hash(i*10+k)*.5),5);
 for(let k=0;k<5;k++)ctx.fillRect(-130,90+k*16,260*(.6+hash(i*7+k)*.4),5);ctx.restore();}
function eDossier(u){const z=kf(u,[[0,1.0],[2.6,1.04],[4.0,.66],[5.8,.62]]),cy=kf(u,[[0,1060],[2.6,1040],[4.0,380],[5.8,340]]);
 ctx.save();camT(ctx,540,cy,z,Math.sin(u*.3)*.01);ctx.fillStyle=ctx.createPattern(window.SLATE,'repeat');ctx.fillRect(-800,-2200,2700,4400);
 DOCS.forEach((d,i)=>doc(d[0],d[1],d[2],i));
 // الضوء العلوي
 ctx.restore();const lg=ctx.createRadialGradient(W/2,H*.55,100,W/2,H*.55,1100);lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(1,'rgba(0,0,0,.75)');ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
 ctx.save();camT(ctx,540,cy,z,Math.sin(u*.3)*.01);
 // شريط مسح يكشف الخيوط
 const sw=inv(.6,2.5,u);const sy=lerp(1800,200,sw);if(sw>0&&sw<1){ctx.fillStyle=`rgba(${PAL.bone},.06)`;ctx.fillRect(-800,sy-60,2700,120);ctx.fillStyle=`rgba(${PAL.bone},.35)`;ctx.fillRect(-800,sy,2700,2);}
 const ORG=[540,-560];ctx.lineWidth=1.6;
 DOCS.forEach((d,i)=>{const vis=u>2.5?1:clamp((sy<d[1]?1:0));if(!vis)return;ctx.strokeStyle=`rgba(${PAL.red},${.7})`;ctx.beginPath();ctx.moveTo(d[0],d[1]-144);ctx.quadraticCurveTo((d[0]+ORG[0])/2+(i%2?60:-60),(d[1]+ORG[1])/2,ORG[0],ORG[1]+40);ctx.stroke();ctx.fillStyle=`rgb(${PAL.red})`;ctx.fillRect(d[0]-4,d[1]-148,8,8);});
 // «مزرعة» حسابات متطابقة: مصدر واحد منسّق
 const fa=eo(inv(3.6,4.4,u)),blink=bell(5.35,5.75,u);if(fa>0){for(let r=0;r<9;r++)for(let c=0;c<12;c++){const X=ORG[0]-385+c*70,Y=ORG[1]-560+r*70;ctx.globalAlpha=fa;
  ctx.fillStyle=blink>0?`rgba(${PAL.red},${.35+.6*blink})`:'#1b2028';ctx.fillRect(X-26,Y-26,52,52);ctx.fillStyle='#0b0d10';ctx.beginPath();ctx.arc(X,Y-6,10,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(X,Y+18,17,12,0,Math.PI,2*Math.PI);ctx.fill();}ctx.globalAlpha=1;}
 ctx.restore();hud(.5);const fi=1-inv(0,.3,u),fo=inv(5.5,5.8,u);const b=Math.max(fi,fo);if(b>0){ctx.fillStyle=`rgba(0,0,0,${b})`;ctx.fillRect(0,0,W,H);}}
// ---------- ز) القرار: ثلاثة مسارات، واحد فقط يكتمل (25.8–29.6) ----------
function eDecision(u){ctx.fillStyle=ctx.createPattern(window.SLATE,'repeat');ctx.fillRect(0,0,W,H);const S0=[540,520],ends=[[240,1420],[540,1480],[840,1420]];
 const inc=eo(inv(0,.6,u));ctx.strokeStyle=`rgba(${PAL.bone},.5)`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(540,120);ctx.lineTo(540,lerp(120,S0[1],inc));ctx.stroke();
 ctx.fillStyle=`rgb(${PAL.red})`;ctx.fillRect(S0[0]-14,lerp(120,S0[1],inc)-14,28,28);
 ends.forEach((e,i)=>{const k=eio(inv(.7+i*.12,1.9+i*.12,u));if(k<=0)return;const st=i==2?'teal':i==1?'red':'steel';const fade=i==2?1:1-.6*inv(2.2,2.8,u);
  ctx.strokeStyle=`rgba(${PAL[st]},${.85*fade})`;ctx.lineWidth=i==2?3:2;ctx.beginPath();ctx.moveTo(S0[0],S0[1]+20);const mx=(S0[0]+e[0])/2,my=(S0[1]+e[1])/2;
  const N=30;for(let s=1;s<=N*k;s++){const t=s/N;ctx.lineTo((1-t)**2*S0[0]+2*(1-t)*t*e[0]+t*t*e[0],(1-t)**2*(S0[1]+20)+2*(1-t)*t*my+t*t*e[1]);}ctx.stroke();
  if(k>=1){if(i==1){const c=eo(inv(2.0,2.3,u));ctx.strokeStyle=`rgba(${PAL.red},.9)`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e[0]-30*c,e[1]-30*c);ctx.lineTo(e[0]+30*c,e[1]+30*c);ctx.moveTo(e[0]+30*c,e[1]-30*c);ctx.lineTo(e[0]-30*c,e[1]+30*c);ctx.stroke();}
   if(i==0){ctx.strokeStyle=`rgba(${PAL.steel},${.6*fade})`;ctx.lineWidth=2;ctx.strokeRect(e[0]-16,e[1]-16,32,32);}
   if(i==2){const c=inv(2.3,2.7,u);ctx.strokeStyle=`rgb(${PAL.teal})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e[0],e[1],34,0,7*c);ctx.stroke();checkIcon(ctx,e[0],e[1],40,eo(inv(2.45,2.8,u)),`rgb(${PAL.teal})`);}}});
 hud(.5);const fi=1-inv(0,.3,u);if(fi>0){ctx.fillStyle=`rgba(0,0,0,${fi})`;ctx.fillRect(0,0,W,H);}
 const fo=Math.pow(inv(3.4,3.8,u),2);if(fo>0){ctx.fillStyle=`rgba(0,0,0,${fo})`;ctx.fillRect(0,0,W,H);}}
// ---------- ط) الختام: صورة صاحب المبادرة بإضاءة جانبية وخط الحدود خلفه (44.4–54) ----------
function eClose(u){ctx.fillStyle='#07090c';ctx.fillRect(0,0,W,H);const im=img('tamim');const z=lerp(1.0,1.07,u/9.6);
 const ly=1180;const lw=eo(inv(.5,1.8,u))*W*.55;ctx.strokeStyle=`rgba(${PAL.teal},.85)`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2-lw,ly);ctx.lineTo(W/2+lw,ly);ctx.stroke();
 if(im){ctx.save();ctx.translate(W/2,1240);ctx.scale(z,z);const iw=860,ih=iw*im.height/im.width;ctx.globalAlpha=eo(inv(0,1.0,u));ctx.filter='saturate(.8) contrast(1.06) brightness(.92)';ctx.drawImage(im,-iw/2,-ih*.92,iw,ih);ctx.filter='none';
  const sg=ctx.createLinearGradient(-iw/2,0,iw/2,0);sg.addColorStop(0,'rgba(7,9,12,.75)');sg.addColorStop(.55,'rgba(7,9,12,0)');ctx.fillStyle=sg;ctx.fillRect(-iw/2,-ih,iw,ih*1.1);
  const bg=ctx.createLinearGradient(0,-ih*.3,0,ih*.08);bg.addColorStop(0,'rgba(7,9,12,0)');bg.addColorStop(1,'rgba(7,9,12,1)');ctx.fillStyle=bg;ctx.fillRect(-iw/2,-ih*.3,iw,ih*.4);ctx.restore();}
 const off=u>=8.0?(u<8.06?.3:u<8.12?.8:u<8.17?.5:.85+.15*inv(8.4,9.5,u)):0;if(off>0){ctx.fillStyle=`rgba(0,0,0,${off})`;ctx.fillRect(0,0,W,H);}
 const fi=1-inv(0,.5,u);if(fi>0){ctx.fillStyle=`rgba(0,0,0,${fi})`;ctx.fillRect(0,0,W,H);}}
// ---------- الترتيب الزمني (مطابق لـ ep1.js والصوت) ----------
const EPB=[[0,6.2,'geo'],[6.2,9.4,'net'],[9.4,13.0,'tgt'],[13.0,16.4,'bar'],[16.4,20.0,'hor'],[20.0,25.8,'dos'],[25.8,29.6,'dec'],
 [29.6,32.6,'s7',0,2.6],[32.6,38.0,'s7',6.4,9.45],[38.0,42.6,'s7',2.6,6.4],[42.6,44.4,'s7',6.4,7.2,1],[44.4,54,'cls']];
const FN={geo:eGeo,net:eNet,tgt:eTarget,bar:eBarrier,hor:eHorizon,dos:eDossier,dec:eDecision,cls:eClose};
window.S7_ADULT=true;
function segB(T){for(const s of EPB)if(T<s[1]||s===EPB[EPB.length-1])return s;}
async function prepare(T){const s=segB(T);if(s[2]=='s7')await seekVid(lerp(s[3],s[4],(T-s[0])/(s[1]-s[0])));}
function render(T){const s=segB(T);ctx=MAIN;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowBlur=0;ctx.fillStyle=PAL.bg;ctx.fillRect(0,0,W,H);
 const u=T-s[0];if(s[2]=='s7'){s7(lerp(s[3],s[4],u/(s[1]-s[0])));ctx.setTransform(1,0,0,1,0,0);
  if(s[5]){const f=Math.pow(inv(s[1]-s[0]-.45,s[1]-s[0],u),2);ctx.fillStyle=`rgba(0,0,0,${f})`;ctx.fillRect(0,0,W,H);}
  const d=Math.max(0,1-u/.35)*(s[3]==0?1:0);if(d>0){ctx.fillStyle=`rgba(0,0,0,${d})`;ctx.fillRect(0,0,W,H);}}
 else FN[s[2]](u);
 ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';post(-1,T);}
