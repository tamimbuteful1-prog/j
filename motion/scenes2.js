// ===================== المشهد ٣: أربع ردود فعل بالظلال (14–22) =====================
const XS=[540,1700,2860,4020];
function s3cx(t){let cx=XS[0];for(let i=0;i<3;i++){const ts=16+2*i;if(t>=ts-.3)cx=lerp(XS[i],XS[i+1],eio(inv(ts-.3,ts+.06,t)));}return cx;}
function person(i,t){const x=XS[i],l=t-(14+2*i);const by=1920;
 let col=C.COLD,g=1,head=0;
 if(i==0){g=lerp(1,.12,eio(inv(1.0,1.45,l)));head=lerp(0,28,eio(inv(1,1.5,l)));}
 if(i==1){col=l>1.0?C.RED:C.COLD;g=l>1.0?1.25:1;}
 if(i==2){col=C.RED;g=1+.6*inv(0,1.8,l)+(l>.3?.35*Math.max(0,Math.sin(l*47)):0);}
 if(i==3){col=C.GRN;g=1.05;}
 const ph=[x+20,by-170+head*1.5];
 // ضوء على الجدار من الهاتف
 ctx.globalCompositeOperation='lighter';radial(ctx,ph[0],ph[1]-200,1100,col,.30*g);radial(ctx,ph[0],ph[1],420,col,.35*g);ctx.globalCompositeOperation='source-over';
 // الظل العملاق على الجدار
 const shN=i==2?3:1;
 for(let k=0;k<shN;k++){const sg=(i==2?lerp(1.75,2.5,inv(0,1.9,l)):i==3?lerp(1.75,1.95,inv(0,1.5,l)):1.75)*(1+k*.14);
  const jx=i==2?(hash(k+Math.floor(l*12))-.5)*60*k:0;
  ctx.fillStyle=`rgba(0,0,0,${(i==2?.42:.6)*Math.min(1,g)})`;bustPath(ctx,x+40+jx+(k-1)*(i==2?160:0),by+120+head*2,1.5*sg);ctx.fill();}
 if(i==3&&l>.9){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${C.GRN},${.25*inv(.9,1.6,l)})`;ctx.lineWidth=10;ctx.shadowColor=`rgba(${C.GRN},.9)`;ctx.shadowBlur=60;bustPath(ctx,x+40,by+120,1.5*1.95);ctx.stroke();ctx.restore();}
 // حافة ضوئية + الجسد
 ctx.save();ctx.shadowColor=`rgba(${col},${.9*Math.min(1,g)})`;ctx.shadowBlur=45;ctx.fillStyle=`rgba(${col},${.85*Math.min(1,g)})`;bustPath(ctx,x,by+head-5,1.5);ctx.fill();ctx.restore();
 ctx.fillStyle='#030406';bustPath(ctx,x,by+head+6,1.49);ctx.fill();
 ctx.save();bustPath(ctx,x,by+head+6,1.49);ctx.clip();ctx.globalCompositeOperation='lighter';radial(ctx,ph[0],ph[1]-120,560,col,.13*g);ctx.restore();
 // يدان والهاتف
 ctx.fillStyle='#050608';ctx.beginPath();rr(ctx,ph[0]-70,ph[1]-40,140,90,30);ctx.fill();
 ctx.fillStyle='#0b0d11';ctx.beginPath();rr(ctx,ph[0]-55,ph[1]-120,110,190,16);ctx.fill();
 ctx.fillStyle=`rgba(${col},.5)`;ctx.beginPath();ctx.arc(ph[0]-30,ph[1]-95,6,0,7);ctx.fill();
 // الأيقونات
 ctx.save();
 if(i==0){const a=eback(inv(.4,.65,l));if(a>0){ctx.save();ctx.translate(x+200,930);ctx.scale(a,a);ctx.fillStyle=`rgba(${C.RED},.92)`;bubblePath(ctx,0,0,250,150,40);ctx.fill();maskIcon(ctx,0,0,42,'#2a0509',1);ctx.restore();}
  const mu=inv(1.15,1.5,l);if(mu>0){ctx.globalAlpha=1;ctx.strokeStyle='rgba(235,240,255,.9)';ctx.lineWidth=14;ctx.beginPath();ctx.arc(x-170,1020,90,0,Math.PI*2*mu);ctx.stroke();
   if(mu>.6){ctx.beginPath();ctx.moveTo(x-235,955);ctx.lineTo(lerp(x-235,x-105,inv(.6,1,mu)),lerp(955,1085,inv(.6,1,mu)));ctx.stroke();}
   ctx.fillStyle='rgba(235,240,255,.9)';bubblePath(ctx,x-170,1015,90,60,16);ctx.globalAlpha=.6;ctx.fill();}}
 if(i==1){const r=eo(inv(.25,.9,l));if(l>.25){const bx=lerp(ph[0],x-150,r),byy=lerp(ph[1]-150,950,r);const red=l>1.0;
   ctx.fillStyle=red?`rgba(${C.RED},.95)`:'rgba(235,240,255,.92)';ctx.save();ctx.translate(bx,byy);ctx.scale(lerp(.3,1,r),lerp(.3,1,r));bubblePath(ctx,0,0,280,160,42);ctx.fill();
   if(red){ctx.fillStyle='#2a0509';ctx.beginPath();ctx.moveTo(0,-50);ctx.lineTo(48,38);ctx.lineTo(-48,38);ctx.closePath();ctx.fill();ctx.fillStyle=`rgb(${C.RED})`;ctx.fillRect(-5,-18,10,32);ctx.fillRect(-5,20,10,10);}
   else{ctx.fillStyle='rgba(20,30,50,.6)';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(-60+k*60,0,14,0,7);ctx.fill();}}ctx.restore();}}
 if(i==2){const n=Math.min(110,Math.floor(Math.pow(2,l*3.3)));for(let k=0;k<n;k++){const st=Math.log2(k+1)/3.3;const a=l-st;const ang=hash(k)*Math.PI*2;const d=120+a*(260+hash(k+3)*500);
   const bx=x+Math.cos(ang)*d*.9,byy=1200+Math.sin(ang)*d*.8-a*120;const s=.35+hash(k+7)*.5;
   ctx.save();ctx.translate(bx,byy);ctx.rotate((hash(k+9)-.5)*.6);ctx.scale(s,s);ctx.fillStyle=`rgba(${C.RED},${.9-Math.min(.6,a*.3)})`;bubblePath(ctx,0,0,200,120,34);ctx.fill();
   if(k%3==0){ctx.fillStyle='#2a0509';ctx.beginPath();ctx.moveTo(-40,-20);ctx.lineTo(-10,10);ctx.lineTo(10,-15);ctx.lineTo(40,20);ctx.lineWidth=10;ctx.strokeStyle='#2a0509';ctx.stroke();}ctx.restore();}}
 if(i==3){const a=eback(inv(.15,.4,l));const bx=x+190,byy=960;const drain=inv(1.0,1.25,l);
  if(a>0){ctx.save();ctx.translate(bx,byy);ctx.scale(a,a);ctx.fillStyle=`rgba(${Math.round(lerp(255,90,drain))},${Math.round(lerp(46,100,drain))},${Math.round(lerp(64,110,drain))},${lerp(.95,.55,drain)})`;bubblePath(ctx,0,0,280,170,42);ctx.fill();ctx.restore();}
  const lx=lerp(x+520,bx,eio(inv(.4,.95,l))),ly=lerp(1250,byy,eio(inv(.4,.95,l)));const la=inv(.4,.55,l)*(1-inv(1.15,1.35,l));
  if(la>0){ctx.save();ctx.beginPath();ctx.arc(lx,ly,95,0,7);ctx.clip();ctx.fillStyle='rgba(3,20,14,.85)';ctx.fillRect(lx-100,ly-100,200,200);maskIcon(ctx,bx,byy,48,`rgb(${C.GRN})`,1);ctx.restore();lensIcon(ctx,lx,ly,95,`rgb(${C.GRN})`,la);}
  const ck=inv(1.0,1.3,l);if(ck>0){ctx.save();ctx.shadowColor=`rgb(${C.GRN})`;ctx.shadowBlur=30;checkIcon(ctx,x-150,940,170,eo(ck),`rgb(${C.GRN})`);ctx.restore();}
  const cn=eback(inv(1.25,1.5,l));if(cn>0){ctx.save();ctx.translate(bx,byy+180);ctx.scale(cn,cn);chainIcon(ctx,0,0,90,`rgb(${C.GRN})`,1);ctx.restore();}}
 ctx.restore();
 // قضبان الظل (مخالفة)
 if(i==1&&l>1.0){const by2=kf(l,[[1.0,-2200],[1.12,0],[1.2,-40],[1.28,0]],eo);ctx.fillStyle='rgba(0,0,0,.78)';for(let k=-4;k<=4;k++){ctx.fillRect(x+k*150-32,by2-200,64,2300);}
  ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-700,by2+260,1400,50);
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${C.RED},${.35*(1-inv(1.05,1.6,l))})`;ctx.fillRect(x-700,0,1400,H);ctx.globalCompositeOperation='source-over';}
}
function s3scene(t,cx){const l2=t-18;const sh=t>18&&t<20?shake(t*4,4+14*inv(18,19.8,t),3):[0,0];
 const z=1+.04*((t-14)%2)/2+(t>20.4?.25*ei(inv(20.4,22,t)):0);
 const ez=eio(inv(20.4,22,t));ctx.save();camT(ctx,cx+sh[0]+190*ez,1180+sh[1]-220*ez,z,0);
 ctx.fillStyle='#0d1118';ctx.fillRect(-1000,-600,6800,3200);
 ctx.fillStyle='rgba(255,255,255,.018)';for(let k=0;k<40;k++)ctx.fillRect(-700+k*160,-600,4,3200);
 for(let i=0;i<4;i++)if(Math.abs(XS[i]-cx)<1300)person(i,t);
 ctx.restore();}
const TMP=mkCanvas(W,H),tc=TMP.getContext('2d');const ACC=mkCanvas(W,H),ac=ACC.getContext('2d');
function s3(t){
 const v=Math.abs(s3cx(t+.01)-s3cx(t-.01));
 if(v>12){const N=6;ac.clearRect(0,0,W,H);const main=ctx;
  for(let k=0;k<N;k++){const tt=t+(k/(N-1)-.5)/30;ctx=tc;tc.setTransform(1,0,0,1,0,0);tc.clearRect(0,0,W,H);s3scene(tt,s3cx(tt));ctx=main;ac.globalAlpha=1/(k+1);ac.drawImage(TMP,0,0);}
  ac.globalAlpha=1;ctx.drawImage(ACC,0,0);}
 else s3scene(t,s3cx(t));
 const fi=1-inv(14,14.45,t);if(fi>0){ctx.fillStyle=`rgba(0,0,0,${fi})`;ctx.fillRect(0,0,W,H);}
 // انتقال القزحية عبر العدسة
 if(t>21.45){const r=lerp(90,1250,ei(inv(21.45,22,t)));ctx.save();ctx.beginPath();ctx.arc(W/2,H/2,r,0,7);ctx.clip();ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);s4(22.001);ctx.restore();
  ctx.save();ctx.strokeStyle=`rgb(${C.GRN})`;ctx.lineWidth=22;ctx.shadowColor=`rgb(${C.GRN})`;ctx.shadowBlur=60;ctx.beginPath();ctx.arc(W/2,H/2,r,0,7);ctx.stroke();ctx.restore();}
}
