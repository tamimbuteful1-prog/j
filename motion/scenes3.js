// ===================== المشهد ٤: لوحة الأدلة والخيوط الخفية (22–31) =====================
const CARDS=[[250,520,-.08,'f'],[790,430,.06,'b'],[540,860,.03,'m'],[210,1180,.1,'f'],[860,1110,-.07,'f'],[520,1420,-.04,'b'],[240,1700,.05,'f'],[830,1660,.09,'m'],[540,1950,0,'f']];
const STR=[[0,2],[1,2],[2,3],[2,4],[3,5],[4,5],[5,6],[5,7],[7,8],[1,4],[6,8],[0,3]];
const CORK=(()=>{const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#2e241d';x.fillRect(0,0,256,256);const r=mulberry32(3);for(let i=0;i<2600;i++){x.fillStyle=`rgba(${r()<.5?0:120},${r()<.5?0:90},${r()<.5?0:60},${r()*.18})`;x.fillRect(r()*256,r()*256,1+r()*2.5,1+r()*2.5);}return c;})();
let corkPat=null;
function uvPath(t){const P=[[900,1550],[320,1320],[620,880],[240,560],[800,440],[540,860]];const u=inv(23.5,26,t)*(P.length-1);const i=Math.min(P.length-2,Math.floor(u)),f=eio(u-i);return[lerp(P[i][0],P[i+1][0],f),lerp(P[i][1],P[i+1][1],f)];}
const BAR={x:540,y:-1150};
function anchors(t){const sway=Math.sin(t*1.3)*18+(t>28.5?-50*eo(inv(28.5,28.7,t))*(1-inv(28.7,30,t)*.6):0);const A=[];for(let k=0;k<9;k++){const a=k/8;const ax=lerp(BAR.x-300,BAR.x+300,a),ay=BAR.y+sway+Math.sin(a*Math.PI)*-30+(k%2?110:0)*(Math.abs(a-.5)<.2?1:0);A.push([ax+Math.sin(t*1.3+k)*6,ay]);}return A;}
function hiddenLayer(t,alpha){const A=anchors(t);ctx.save();ctx.globalCompositeOperation='lighter';
 ctx.strokeStyle=`rgba(200,150,255,${.85*alpha})`;ctx.lineWidth=2.6;ctx.shadowColor=`rgba(${C.UV},1)`;ctx.shadowBlur=14;
 for(let k=0;k<9;k++){const c=CARDS[k];const tx=c[0],ty=c[1]-140;const a=A[k];ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo((a[0]+tx)/2+Math.sin(t+k)*20,(a[1]+ty)/2,tx,ty);ctx.stroke();}
 ctx.shadowBlur=0;for(let k=0;k<9;k++){const c=CARDS[k];if(c[3]!='b'||k==1)maskIcon(ctx,c[0],c[1]-5,52,`rgba(210,170,255,${alpha})`,1);
  ctx.fillStyle=`rgba(200,150,255,${.5*alpha})`;for(let q=0;q<5;q++){ctx.beginPath();ctx.arc(c[0]-80+hash(k*5+q)*160,c[1]+80+hash(k*7+q)*40,4,0,7);ctx.fill();}}
 ctx.restore();}
function handShape(t,sway){ctx.save();ctx.translate(BAR.x+Math.sin(t*1.3)*18,BAR.y+sway-40);ctx.rotate(Math.sin(t*.9)*.04);
 ctx.beginPath();ctx.moveTo(-120,-1800);ctx.lineTo(140,-1800);ctx.lineTo(120,-260);ctx.lineTo(-110,-260);ctx.fill();
 ctx.beginPath();rr(ctx,-170,-300,340,240,90);ctx.fill();for(let k=0;k<4;k++){ctx.beginPath();rr(ctx,-150+k*80,-120,66,170,33);ctx.fill();}ctx.restore();}
function controller(t){const A=anchors(t);const sway=A[0][1]-BAR.y+30;ctx.save();
 const rim=inv(25.8,26.3,t);if(rim>0){ctx.save();ctx.shadowColor=`rgba(${C.UV},1)`;ctx.shadowBlur=50;ctx.fillStyle=`rgba(190,140,255,${.9*rim})`;ctx.translate(0,-8);handShape(t,sway);ctx.restore();}
 // ذراع وكف يتحكّمان
 ctx.fillStyle='#020203';ctx.save();ctx.translate(BAR.x+Math.sin(t*1.3)*18,BAR.y+sway-40);ctx.rotate(Math.sin(t*.9)*.04);
 ctx.beginPath();ctx.moveTo(-120,-1800);ctx.lineTo(140,-1800);ctx.lineTo(120,-260);ctx.lineTo(-110,-260);ctx.fill();
 ctx.beginPath();rr(ctx,-170,-300,340,240,90);ctx.fill();for(let k=0;k<4;k++){ctx.beginPath();rr(ctx,-150+k*80,-120,66,170,33);ctx.fill();}ctx.restore();
 ctx.strokeStyle='#08070a';ctx.lineWidth=40;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(A[0][0],A[0][1]);ctx.lineTo(A[8][0],A[8][1]);ctx.stroke();
 ctx.beginPath();ctx.moveTo(BAR.x,BAR.y+sway-250);ctx.lineTo(BAR.x,BAR.y+sway+230);ctx.stroke();ctx.restore();}
function s4board(t){const sh=shake(t,7,.8);const boom=t>28.5?Math.max(0,1-(t-28.5)*1.5):0;const bs=shake(t*9,26*boom,4);
 const cy=kf(t,[[22,1250],[26.2,1020],[28.5,-560],[31,-640]],eio),z=kf(t,[[22,1.0],[26.2,1.06],[28.5,.88],[31,.95]],eio);const rot=Math.sin(t*.4)*.012;
 const CX=540+sh[0]+bs[0],CY=cy+sh[1]+bs[1];
 ctx.save();camT(ctx,CX,CY,z,rot);
 ctx.fillStyle='#14161b';ctx.fillRect(-1500,-3500,4100,6500);
 if(!corkPat)corkPat=ctx.createPattern(CORK,'repeat');ctx.fillStyle=corkPat;ctx.fillRect(-80,180,1240,2050);
 ctx.fillStyle='#0b0b0c';ctx.fillRect(-110,150,1300,30);ctx.fillRect(-110,2230,1300,30);ctx.fillRect(-110,150,30,2110);ctx.fillRect(1160,150,30,2110);
 // بطاقات صور فوري
 for(let k=0;k<9;k++){const c=CARDS[k];ctx.save();ctx.translate(c[0],c[1]);ctx.rotate(c[2]);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(-120,-130,250,300);
  ctx.fillStyle='#d4ccbb';ctx.fillRect(-125,-145,250,300);ctx.fillStyle='#151820';ctx.fillRect(-105,-125,210,210);
  if(c[3]=='b'){ctx.fillStyle='#39404c';bubblePath(ctx,0,-25,150,95,26);ctx.fill();}else{ctx.fillStyle='#2e333d';bustPath(ctx,0,85,.3);ctx.fill();}
  if(c[3]=='m'){ctx.strokeStyle='rgba(190,30,45,.9)';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(-80,-100);ctx.lineTo(80,60);ctx.moveTo(80,-100);ctx.lineTo(-80,60);ctx.stroke();}
  ctx.fillStyle='#111';ctx.fillRect(-100,100,120+hash(k)*80,14);ctx.restore();}
 ctx.strokeStyle='rgba(185,28,42,.95)';ctx.lineWidth=4;for(const[a,b]of STR){const A=CARDS[a],B=CARDS[b];ctx.beginPath();ctx.moveTo(A[0],A[1]-120);ctx.quadraticCurveTo((A[0]+B[0])/2,(A[1]+B[1])/2-60,B[0],B[1]-120);ctx.stroke();}
 for(let k=0;k<9;k++){const c=CARDS[k];ctx.fillStyle='#b81c2c';ctx.beginPath();ctx.arc(c[0],c[1]-130,13,0,7);ctx.fill();}
 controller(t);
 // الإضاءة
 const R=inv(26,26.12,t);const uvOn=t>23.4&&R<1;const uv=uvPath(t);
 m.setTransform(1,0,0,1,0,0);beginMask(lerp(.93,.62,R));m.save();camT(m,CX,CY,z,rot);
 mLight(540+Math.sin(t*.5)*120,1150,780,.78,1,1.2);if(uvOn)mLight(uv[0],uv[1],300,.95);if(boom>0)mLight(BAR.x,BAR.y,900,.8*boom);
 m.restore();applyMask();
 ctx.globalCompositeOperation='lighter';radial(ctx,540,1150,800,C.AMB,.08);
 if(uvOn){radial(ctx,uv[0],uv[1],300,C.UV,.35);}
 if(R>0){ctx.fillStyle=`rgba(${C.UV},${.10*R+.5*bell(26,26.4,t)})`;ctx.fillRect(-1500,-3500,4100,6500);}
 if(boom>0)radial(ctx,BAR.x,BAR.y,1000,C.RED,.55*boom);
 ctx.globalCompositeOperation='source-over';
 // الطبقة الخفية: داخل دائرة الضوء البنفسجي أو بعد الكشف الكامل
 if(t<30.55){if(uvOn&&R<1){ctx.save();ctx.beginPath();ctx.arc(uv[0],uv[1],290,0,7);ctx.clip();hiddenLayer(t,1);ctx.restore();}
  if(R>0)hiddenLayer(t,R);}
 ctx.restore();
 return {CX,CY,z,rot};}
function s4(t){
 const cam=s4board(Math.min(t,30.55));
 if(t>=30.55){// قطع الخيوط عند خط الحدود
  const k=t-30.55;
  ctx.fillStyle=`rgba(0,0,0,${eo(inv(0,.35,k))})`;ctx.fillRect(0,0,W,H);
  for(const half of[0,1]){ctx.save();ctx.beginPath();half?ctx.rect(0,H/2,W,H/2):ctx.rect(0,0,W,H/2);ctx.clip();
   ctx.translate(0,half?k*k*900:-80*eo(inv(0,.3,k)));ctx.globalAlpha=1-inv(.05,.45,k);camT(ctx,cam.CX,cam.CY,cam.z,cam.rot);hiddenLayer(30.55,1);ctx.restore();}
  ctx.globalAlpha=1;}
 // خط الحدود الأخضر يشقّ الإطار
 if(t>30.5){const w=eo(inv(30.5,30.66,t))*W;ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgb(${C.GRN})`;ctx.shadowColor=`rgb(${C.GRN})`;ctx.shadowBlur=50;ctx.fillRect(W/2-w/2,H/2-4,w,8);
  radial(ctx,W/2,H/2,700,C.GRN,.5*bell(30.5,30.9,t));ctx.restore();}
}

// ===================== المشهد ٥: الجندي على الحدود (31–40) =====================
const YB=1250,DRX=820,DRY=900;
const HITS=[];for(let k=0;k<14;k++)HITS.push({t:33+k*.24+.08*Math.sin(k*12.9),pass:k%5==3,k});for(let k=14;k<18;k++)HITS.push({t:37.7+(k-14)*.45,pass:true,k});
for(const h of HITS){h.hx=540+(hash(h.k*3.7)-.5)*1150;const q=(h.hx-540)/DRX;h.hy=YB-DRY*Math.sqrt(Math.max(0,1-q*q));h.sx=h.hx+(hash(h.k+50)-.5)*500;h.type=h.k%3;}
const AMB=Array.from({length:140},(_,i)=>({x:hash(i*1.3)*1500-210,y:hash(i*2.1)*1400-900,s:.4+hash(i*3.3)*.8,v:60+hash(i*5.1)*120,ty:i%3}));
function incoming(x,y,s,type,col,a){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.globalAlpha=a;ctx.fillStyle=col;
 if(type==0){bubblePath(ctx,0,0,90,56,16);ctx.fill();}else if(type==1){ctx.beginPath();ctx.moveTo(0,-40);ctx.lineTo(22,10);ctx.lineTo(-6,40);ctx.lineTo(-24,0);ctx.closePath();ctx.fill();}else maskIcon(ctx,0,0,30,col,a);ctx.restore();}
function s5(t){
 const cy=kf(t,[[31,YB],[34.5,880],[39.5,800]],eio),z=kf(t,[[31,2.9],[34.5,1.0],[39.5,1.2]],eio),rot=kf(t,[[31,.05],[34.5,-.01],[39.5,.006]],eio);
 let hs=0;for(const h of HITS){const d=t-h.t;if(d>0&&d<.25&&!h.pass)hs=Math.max(hs,(.25-d)*40);}const pulse=bell(36.4,37.1,t);
 const sh=shake(t*5,hs+pulse*20,3);
 ctx.save();camT(ctx,540+sh[0],cy+sh[1],z,rot);
 // سماء
 const sg=ctx.createLinearGradient(0,-1200,0,YB);sg.addColorStop(0,'#0b0306');sg.addColorStop(.6,'#070a12');sg.addColorStop(1,'#0a1a1a');ctx.fillStyle=sg;ctx.fillRect(-1500,-2000,4100,YB+2000);
 ctx.globalCompositeOperation='lighter';radial(ctx,540,-500,1300,C.RED,.16*(1-inv(36.5,38,t)*.7));ctx.globalCompositeOperation='source-over';
 // أرضية شبكية
 ctx.fillStyle='#020506';ctx.fillRect(-1500,YB,4100,2000);
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineWidth=2;
 for(let k=-18;k<=18;k++){ctx.strokeStyle=`rgba(${C.GRN},.10)`;ctx.beginPath();ctx.moveTo(540,YB);ctx.lineTo(540+k*420,YB+1600);ctx.stroke();}
 for(let k=1;k<26;k++){const d=k-((t*1.1)%1);const y=YB+1400/d;if(y>YB+1600)continue;ctx.strokeStyle=`rgba(${C.GRN},${Math.min(.25,.5/d)})`;ctx.beginPath();ctx.moveTo(-1500,y);ctx.lineTo(2600,y);ctx.stroke();}
 ctx.restore();
 // ظل الجندي الطويل نحو الكاميرا
 ctx.save();ctx.translate(540,YB);ctx.transform(1,0,-.12,-1.9,0,0);ctx.fillStyle='rgba(0,0,0,.85)';figureFill(ctx,0,0,760);ctx.restore();
 // القبة والدرع
 const hb=Math.max(0,Math.sin(((t-31.2)/.85)*Math.PI*2))**8*.5;
 ctx.save();ctx.beginPath();ctx.ellipse(540,YB,DRX,DRY,0,Math.PI,2*Math.PI);ctx.closePath();ctx.clip();
 ctx.globalCompositeOperation='lighter';const dg=ctx.createRadialGradient(540,YB,DRY*.3,540,YB,DRY);dg.addColorStop(0,`rgba(${C.GRN},0)`);dg.addColorStop(1,`rgba(${C.GRN},${.10+hb*.15+pulse*.4})`);ctx.fillStyle=dg;ctx.fillRect(-300,YB-DRY,1700,DRY);
 // خلايا سداسية
 const scanY=YB-((t*420)%DRY);const hr=46;ctx.lineWidth=1.5;
 for(let r=0;r<22;r++)for(let q=-11;q<12;q++){const hx=540+q*hr*1.73+(r%2)*hr*.865,hy=YB-r*hr*1.5;const ex=(hx-540)/DRX,ey=(YB-hy)/DRY;const e=ex*ex+ey*ey;if(e>1)continue;
  let a=.03+.25*Math.pow(e,6)+.22*Math.max(0,1-Math.abs(hy-scanY)/60)+pulse*.4+hb*.1;
  for(const h of HITS){const d=t-h.t;if(d>0&&d<.6){const dd=Math.hypot(hx-h.hx,hy-h.hy);if(dd<220)a+=(1-dd/220)*(1-d/.6)*(h.pass?.9:.7);}}
  if(a<.04)continue;const hitRed=HITS.some(h=>!h.pass&&t-h.t>0&&t-h.t<.4&&Math.hypot(hx-h.hx,hy-h.hy)<160);
  ctx.strokeStyle=`rgba(${hitRed?C.RED:C.GRN},${Math.min(.8,a)})`;ctx.beginPath();for(let s=0;s<6;s++){const an=Math.PI/6+s*Math.PI/3;const px=hx+Math.cos(an)*hr*.95,py=hy+Math.sin(an)*hr*.95;s?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.stroke();}
 ctx.restore();
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${C.GRN},${.5+hb+pulse})`;ctx.lineWidth=4;ctx.shadowColor=`rgb(${C.GRN})`;ctx.shadowBlur=30;ctx.beginPath();ctx.ellipse(540,YB,DRX,DRY,0,Math.PI,2*Math.PI);ctx.stroke();
 if(pulse>0){const k=inv(36.4,37.3,t);ctx.strokeStyle=`rgba(${C.WHT},${(1-k)*.9})`;ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(540,YB,DRX*(.2+k*1.4),DRY*(.2+k*1.4),0,0,7);ctx.stroke();}
 ctx.restore();
 // جسيمات محيطة
 ctx.save();ctx.globalCompositeOperation='lighter';const af=t<36.5?1:1-inv(36.5,36.9,t)*.85;
 for(const p of AMB){const y=p.y+((t-31)*p.v);const yy=((y+900)%1700)-900;const ex=(p.x-540)/DRX,ey=(YB-yy)/DRY;if(ex*ex+ey*ey<1.02)continue;incoming(p.x+Math.sin(t+p.x)*20,yy,p.s,p.ty,`rgb(${C.RED})`,.55*af);}
 // الضربات
 for(const h of HITS){const d=t-h.t;
  if(d<-1.8)continue;
  if(d<0){const k=1+d/1.8;incoming(lerp(h.sx,h.hx,k),lerp(-700,h.hy,k),.9+k*.5,h.type,`rgb(${C.RED})`,Math.min(1,k*3));}
  else if(!h.pass&&d<.6){for(let s=0;s<16;s++){const an=hash(h.k*20+s)*Math.PI*2,sp=150+hash(h.k*30+s)*500;ctx.fillStyle=`rgba(${s%3?C.RED:C.AMB},${1-d/.6})`;ctx.beginPath();ctx.arc(h.hx+Math.cos(an)*sp*d,h.hy+Math.sin(an)*sp*d+300*d*d,5*(1-d/.6)+1,0,7);ctx.fill();}radial(ctx,h.hx,h.hy,200,C.RED,.5*(1-d/.6));}
  else if(h.pass&&d<2.2){const k=inv(.25,2.2,d);const col=d<.25?`rgb(${C.WHT})`:`rgb(${C.GRN})`;const px=lerp(h.hx,540+(h.hx-540)*1.7,ei(k)),py=lerp(h.hy,YB+1100,ei(k));
   if(d<.35){ctx.strokeStyle=`rgba(${C.GRN},${1-d/.35})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(h.hx,h.hy,30+d*200,0,7);ctx.stroke();}
   incoming(px,py,1.3*(1-k*.5),0,col,1-k);if(d>.2&&d<.7)checkIcon(ctx,h.hx+60,h.hy-60,60,eo(inv(.2,.45,d)),`rgba(${C.GRN},${1-inv(.5,.7,d)})`);radial(ctx,px,py,120,C.GRN,.4*(1-k));}}
 ctx.restore();
 // خط الحدود
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgb(${C.GRN})`;ctx.shadowColor=`rgb(${C.GRN})`;ctx.shadowBlur=40;ctx.fillRect(-1500,YB-4,4100,8);
 const cg=ctx.createLinearGradient(0,YB-260,0,YB);cg.addColorStop(0,`rgba(${C.GRN},0)`);cg.addColorStop(1,`rgba(${C.GRN},.22)`);ctx.shadowBlur=0;ctx.fillStyle=cg;ctx.fillRect(-1500,YB-260,4100,260);
 for(let k=-8;k<=10;k++){ctx.fillStyle=`rgba(${C.GRN},.5)`;ctx.fillRect(540+k*170-2,YB-26,4,26);}ctx.restore();
 // الجندي: حافة ضوء خضراء ثم جسد أسود
 ctx.save();ctx.shadowColor=`rgba(${C.GRN},1)`;ctx.shadowBlur=40+pulse*60;ctx.fillStyle=`rgba(${C.GRN},.95)`;figureFill(ctx,540,YB-6,764);ctx.restore();
 ctx.fillStyle='#010203';figureFill(ctx,540,YB+2,752);
 ctx.restore();
 const fi=1-inv(31,31.3,t);if(fi>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${C.GRN},${fi*.6})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 const fo=Math.pow(inv(39.4,40,t),2);if(fo>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(200,255,230,${fo})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
}

// ===================== المشهد ٦: الشعار البصري (40–45) =====================
function emblem(c,t,a){const cx=540,cy=880,w=560,h=680;const u=inv(40.1,41.3,t);c.save();c.globalAlpha=a;
 // تعبئة
 const f=inv(41.2,41.6,t);if(f>0){shieldPath(c,cx,cy,w,h);const g=c.createLinearGradient(0,cy-h/2,0,cy+h/2);g.addColorStop(0,`rgba(10,40,32,${.9*f})`);g.addColorStop(1,`rgba(3,10,9,${.9*f})`);c.fillStyle=g;c.fill();}
 c.save();c.globalCompositeOperation='lighter';c.strokeStyle=`rgb(${C.GRN})`;c.lineWidth=12;c.lineJoin='round';c.shadowColor=`rgb(${C.GRN})`;c.shadowBlur=40;
 const L=2300;c.setLineDash([L*u,L]);shieldPath(c,cx,cy,w,h);c.stroke();c.setLineDash([]);
 // الخط الحدودي داخل الدرع
 const bl=eo(inv(41.0,41.45,t));const ly=cy+110;if(bl>0){c.fillRect(cx-(w/2-10)*bl,ly-4,(w-20)*bl,8);}
 // قوس الدرع الماسح
 const ar=eo(inv(41.45,41.9,t));if(ar>0){c.lineWidth=6;c.beginPath();c.ellipse(cx,ly,190,230,0,Math.PI,Math.PI+Math.PI*ar);c.stroke();}
 c.restore();
 // الجندي
 const fg=eo(inv(41.25,41.7,t));if(fg>0){c.save();c.beginPath();c.rect(0,ly-300*fg,W,300*fg);c.clip();c.shadowColor=`rgb(${C.GRN})`;c.shadowBlur=25;c.fillStyle=`rgba(${C.GRN},.9)`;figureFill(c,cx,ly-4,272);c.restore();
  c.fillStyle='#020605';c.save();c.beginPath();c.rect(0,ly-300*fg,W,300*fg);c.clip();figureFill(c,cx,ly-1,266);c.restore();}
 // لمعة
 const sw=inv(42.2,43.0,t);if(sw>0&&sw<1){c.save();shieldPath(c,cx,cy,w,h);c.clip();c.globalCompositeOperation='lighter';const x0=lerp(-400,1400,eio(sw));const g=c.createLinearGradient(x0-150,0,x0+150,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(220,255,240,.45)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.translate(x0,cy);c.rotate(.35);c.translate(-x0,-cy);c.fillRect(x0-150,cy-900,300,1800);c.restore();}
 c.restore();}
function s6(t){const z=lerp(1.08,1.0,eo(inv(40,45,t)));const off=t>=44.3?(t<44.36?.3:t<44.42?.85:t<44.47?.5:1):0;
 ctx.save();camT(ctx,540,920,z,0);
 ctx.fillStyle='#07090d';ctx.fillRect(-500,-500,2100,2900);
 ctx.globalCompositeOperation='lighter';radial(ctx,540,880,900,C.GRN,.12*(1+bell(41.2,42,t)));radial(ctx,700,300,700,C.AMB,.08);ctx.globalCompositeOperation='source-over';
 emblem(ctx,t,1);
 // غبار أخضر
 ctx.globalCompositeOperation='lighter';for(let i=0;i<60;i++){const x=hash(i)*1080,y=(hash(i+7)*1900-(t-40)*30*(.5+hash(i+3)))%1900;ctx.fillStyle=`rgba(${C.GRN},${.35*hash(i+11)})`;ctx.beginPath();ctx.arc(x,(y+1900)%1900,1+hash(i+5)*2.5,0,7);ctx.fill();}ctx.globalCompositeOperation='source-over';
 // ظلال الستائر تمرّ فوق الشعار
 ctx.fillStyle='rgba(0,0,0,.42)';blindsPath(ctx,lerp(-300,200,inv(40,45,t)),-300+(t-40)*40,26,95,42,.3,-600,1700);ctx.fill();
 ctx.restore();
 const fi=1-inv(40,40.4,t);if(fi>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(200,255,230,${fi})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 if(off>0){ctx.fillStyle=`rgba(0,0,0,${off*.88+.12*inv(44.5,44.97,t)})`;ctx.fillRect(0,0,W,H);
  if(off==1){ctx.save();camT(ctx,540,920,z,0);ctx.globalCompositeOperation='lighter';emblem(ctx,t,.18*(1-inv(44.5,44.95,t)));ctx.restore();}}
}
