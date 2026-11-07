// ===== قناع الإضاءة =====
const MK=mkCanvas(W,H),m=MK.getContext('2d');
function beginMask(a){m.setTransform(1,0,0,1,0,0);m.globalCompositeOperation='source-over';m.clearRect(0,0,W,H);m.fillStyle=`rgba(1,2,5,${a})`;m.fillRect(0,0,W,H);m.globalCompositeOperation='destination-out';}
function mLight(x,y,r,s,sx=1,sy=1){m.save();m.translate(x,y);m.scale(sx,sy);const g=m.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(0,0,0,${s})`);g.addColorStop(.55,`rgba(0,0,0,${s*.6})`);g.addColorStop(1,'rgba(0,0,0,0)');m.fillStyle=g;m.fillRect(-r,-r,2*r,2*r);m.restore();}
function applyMask(){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.drawImage(MK,0,0);ctx.restore();}
// شرائح الستائر (ظلال)
function blindsPath(c,ox,oy,n,gap,thick,slant,x0,x1){c.beginPath();for(let i=0;i<n;i++){const y=oy+i*gap;c.moveTo(x0+ox,y+x0*slant);c.lineTo(x1+ox,y+x1*slant);c.lineTo(x1+ox,y+x1*slant+thick);c.lineTo(x0+ox,y+x0*slant+thick);c.closePath();}}

// ===================== المشهد ١: غرفة التحقيق (0–6) =====================
function lampS1(t){if(t<1)return 0;const q=[[1,1],[1.06,.08],[1.12,.85],[1.19,.15],[1.33,1]];let v=0;for(const[a,b]of q)if(t>=a)v=b;return v*(.97+.03*Math.sin(t*53));}
const DUST=Array.from({length:90},(_,i)=>({x:hash(i)*900+150,y:hash(i+300)*600+950,s:hash(i+600)*2.5+.8,v:hash(i+900)*.5+.2}));
function s1(t){
 const L=lampS1(t), p=eio(inv(4.5,6,t));
 const z=lerp(1.0,4.7,ei(inv(2.6,6,t)))*(1+.03*inv(0,2.6,t));
 const cx=lerp(540,560,eio(inv(2.2,6,t))), cy=lerp(1060,1490,eio(inv(1.8,6,t)));
 const buzz=(t>3.2&&t<3.55)||(t>3.9&&t<4.25)||(t>4.6&&t<4.95)?1:0;
 const [sx,sy]=shake(t,6*(1-p),.7); const rot=lerp(-.018,.012,inv(0,6,t));
 ctx.save();camT(ctx,cx+sx,cy+sy,z,rot);
 // الجدار
 const wg=ctx.createLinearGradient(0,-300,0,1300);wg.addColorStop(0,'#232a36');wg.addColorStop(1,'#343c49');ctx.fillStyle=wg;ctx.fillRect(-1500,-1500,4100,2800);
 // لوحة أدلة خلفية (تلميح)
 ctx.fillStyle='#3a2d23';ctx.fillRect(110,250,700,560);
 for(let i=0;i<7;i++){ctx.save();ctx.translate(170+(i%4)*165+hash(i)*30,300+Math.floor(i/4)*250+hash(i+9)*40);ctx.rotate((hash(i+3)-.5)*.2);ctx.fillStyle='#cfc8b8';ctx.fillRect(0,0,110,130);ctx.fillStyle='#1d2027';ctx.fillRect(10,10,90,85);ctx.restore();}
 ctx.strokeStyle='rgba(190,30,45,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(220,330);ctx.quadraticCurveTo(400,420,560,330);ctx.quadraticCurveTo(560,500,390,600);ctx.lineTo(720,620);ctx.stroke();
 // المكتب
 ctx.fillStyle='#3d2b1f';ctx.beginPath();ctx.moveTo(-700,1290);ctx.lineTo(1780,1290);ctx.lineTo(2400,2600);ctx.lineTo(-1300,2600);ctx.fill();
 ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=2;for(let i=0;i<14;i++){ctx.beginPath();ctx.moveTo(-700,1310+i*60);ctx.bezierCurveTo(200,1300+i*62,700,1320+i*58,1780,1305+i*61);ctx.stroke();}
 ctx.fillStyle='#16110d';ctx.fillRect(-1500,1282,4100,10);
 // ظلال الأغراض (الضوء من أعلى اليمين)
 ctx.fillStyle='rgba(0,0,0,.55)';
 const objs=[[290,1640,.3,330,430],[440,1740,-.15,300,400]];
 for(const o of objs){ctx.save();ctx.translate(o[0]-45,o[1]+22);ctx.rotate(o[2]);ctx.transform(1,0,-.35,1,0,0);ctx.fillRect(-o[3]/2,-o[4]/2,o[3],o[4]);ctx.restore();}
 ctx.save();ctx.translate(500,1510);ctx.rotate(-.35);ctx.transform(1,0,-.5,.5,0,0);rr(ctx,-100,-200,200,400,30);ctx.fill();ctx.restore();
 ctx.beginPath();ctx.ellipse(210,1480,90,40,-.3,0,7);ctx.fill();
 // أوراق بشرائط تنقيح سوداء
 for(const o of objs){ctx.save();ctx.translate(o[0],o[1]);ctx.rotate(o[2]);ctx.fillStyle='#c9c1ae';ctx.fillRect(-o[3]/2,-o[4]/2,o[3],o[4]);
  ctx.fillStyle='#111';for(let k=0;k<6;k++)ctx.fillRect(-o[3]/2+30,-o[4]/2+50+k*52,(o[3]-60)*(.5+hash(k+o[0])*.5),20);ctx.restore();}
 // مكبّر
 ctx.save();ctx.translate(250,1450);ctx.rotate(-.3);ctx.strokeStyle='#8d939b';ctx.lineWidth=14;ctx.beginPath();ctx.ellipse(0,0,75,38,0,0,7);ctx.stroke();ctx.strokeStyle='#2a2420';ctx.lineWidth=26;ctx.beginPath();ctx.moveTo(78,10);ctx.lineTo(200,50);ctx.stroke();ctx.restore();
 // كوب
 ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.ellipse(850,1600,90,36,0,0,7);ctx.fill();
 ctx.fillStyle='#d8d3c8';ctx.fillRect(850,1490,120,100);ctx.beginPath();ctx.ellipse(910,1590,60,22,0,0,7);ctx.fill();ctx.fillStyle='#1a120c';ctx.beginPath();ctx.ellipse(910,1490,60,22,0,0,7);ctx.fill();
 // المصباح
 ctx.strokeStyle='#1c2026';ctx.lineWidth=22;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(1010,1400);ctx.lineTo(1060,1120);ctx.lineTo(860,970);ctx.stroke();
 ctx.fillStyle='#1c2026';ctx.beginPath();ctx.ellipse(1010,1410,110,34,0,0,7);ctx.fill();
 ctx.save();ctx.translate(840,960);ctx.rotate(.55);ctx.beginPath();ctx.moveTo(-40,-60);ctx.lineTo(40,-60);ctx.lineTo(110,60);ctx.lineTo(-110,60);ctx.closePath();ctx.fill();ctx.restore();
 // الهاتف
 const pr=lerp(-.35,0,p), psy=lerp(.5,1,p);
 const bj=buzz?Math.sin(t*240)*3:0;
 function phoneT(){ctx.translate(560+bj,1490);ctx.rotate(pr);ctx.scale(1,psy);}
 ctx.save();phoneT();ctx.fillStyle='#0c0e12';ctx.beginPath();rr(ctx,-100,-200,200,400,30);ctx.fill();ctx.strokeStyle='#3c424c';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#05070a';ctx.beginPath();rr(ctx,-91,-191,182,382,24);ctx.fill();ctx.restore();
 // ===== الإضاءة =====
 m.setTransform(1,0,0,1,0,0);beginMask(.95);m.save();camT(m,cx+sx,cy+sy,z,rot);
 mLight(600,1520,600,.97*L,1,.5);mLight(820,1060,380,.55*L);mLight(470,560,520,.42*L);
 // ضوء القمر عبر الستائر
 m.fillStyle='rgba(0,0,0,.4)';blindsPath(m,0,-260,13,74,36,.42,-400,900);m.fill();
 // سيارة مارّة: شرائح تمر عبر الجدار
 const car=bell(1.8,4.4,t);if(car>0){m.fillStyle=`rgba(0,0,0,${.55*car})`;blindsPath(m,lerp(-900,900,inv(1.8,4.4,t)),100,10,80,40,-.18,-200,500);m.fill();}
 m.restore();applyMask();
 // صبغات ضوئية مضافة
 ctx.globalCompositeOperation='lighter';
 radial(ctx,600,1520,560,C.AMB,.16*L);
 ctx.fillStyle=`rgba(${C.COLD},.045)`;blindsPath(ctx,0,-260,13,74,36,.42,-400,900);ctx.fill();
 if(car>0){ctx.fillStyle=`rgba(255,210,160,${.08*car})`;blindsPath(ctx,lerp(-900,900,inv(1.8,4.4,t)),100,10,80,40,-.18,-200,500);ctx.fill();}
 // مخروط الضوء
 const cg=ctx.createLinearGradient(840,980,600,1550);cg.addColorStop(0,`rgba(${C.AMB},${.2*L})`);cg.addColorStop(1,`rgba(${C.AMB},0)`);
 ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(800,1000);ctx.lineTo(900,1010);ctx.lineTo(1120,1600);ctx.lineTo(80,1600);ctx.closePath();ctx.fill();
 for(const d of DUST){const yy=d.y-((t*d.v*40)%300);const xx=d.x+Math.sin(t*d.v+d.x)*20;const k=inv(1000,1050,yy)*(1-inv(1500,1600,yy));
  ctx.fillStyle=`rgba(255,220,170,${.5*L*k})`;ctx.beginPath();ctx.arc(xx,yy,d.s,0,7);ctx.fill();}
 // شاشة الهاتف المضيئة
 const scr=t<3.2?0:(.75+.25*Math.sin(t*9))*Math.min(1,(t-3.2)*6);
 if(scr>0){radial(ctx,560,1490,420,C.COLD,.22*scr);
  ctx.save();phoneT();ctx.globalCompositeOperation='source-over';const sg=ctx.createLinearGradient(0,-190,0,190);sg.addColorStop(0,'#2a3f66');sg.addColorStop(1,'#0e1828');
  ctx.fillStyle=sg;ctx.globalAlpha=scr;ctx.beginPath();rr(ctx,-91,-191,182,382,24);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();rr(ctx,-70,-150,140,52,14);ctx.fill();
  ctx.fillStyle=`rgb(${C.RED})`;ctx.beginPath();ctx.arc(-44,-124,14,0,7);ctx.fill();
  ctx.fillStyle='rgba(20,30,50,.9)';ctx.beginPath();ctx.arc(0,30,34,0,7);ctx.fill();
  ctx.globalCompositeOperation='lighter';
  for(const pt of [3.2,3.9,4.6,5.3]){const k=inv(pt,pt+.8,t);if(k>0&&k<1){ctx.strokeStyle=`rgba(${C.RED},${(1-k)*.9})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(-44,-124,14+k*170,0,7);ctx.stroke();}}
  ctx.restore();}
 ctx.restore();
 // وميض الانتقال إلى الشاشة
 const fl=Math.pow(inv(5.45,6,t),2);if(fl>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(150,185,255,${fl})`;ctx.fillRect(0,0,W,H);}
 ctx.globalCompositeOperation='source-over';
}

// ===================== المشهد ٢: الانتشار (6–14) =====================
const NET=(()=>{const r=mulberry32(7);const N=[{x:0,y:0,d:0,p:-1,ta:2.85,f:false}];let fr=[0];
 for(let d=1;d<=7;d++){const nf=[];for(const i of fr){const n=N[i];const k=d==1?6:(2+(r()<.55?1:0));const ba=Math.atan2(n.y,n.x);
  for(let j=0;j<k;j++){if(N.length>1500)break;const a=d==1?j/k*Math.PI*2+r()*.3:ba+(r()-.5)*1.7;const len=(150+r()*130)*(1+d*.12);
   N.push({x:n.x+Math.cos(a)*len,y:n.y+Math.sin(a)*len*1.25,d,p:i,ta:n.ta+.55*Math.pow(.8,d)+r()*.28,f:r()<.22});nf.push(N.length-1);}}fr=nf;}
 return N;})();
const XL=Array.from({length:380},(_,k)=>[Math.floor(hash(k*3.1)*NET.length),Math.floor(hash(k*7.7+1)*NET.length),5+k*.007]);
function cardDraw(c,i,y,hl,u){const x=70,w=940,h=330;c.save();
 c.fillStyle=hl?'#1a0d12':'#111722';c.beginPath();rr(c,x,y,w,h,28);c.fill();
 if(hl){c.strokeStyle=`rgba(${C.RED},${.6+.4*Math.sin(u*14)})`;c.lineWidth=5;c.stroke();}
 c.fillStyle=hl?'#2a1016':'#1f2836';c.beginPath();c.arc(x+70,y+70,40,0,7);c.fill();
 if(hl)maskIcon(c,x+70,y+70,30,`rgb(${C.RED})`,1);
 c.fillStyle='rgba(255,255,255,.10)';c.beginPath();rr(c,x+130,y+48,220+hash(i)*120,18,9);c.fill();c.beginPath();rr(c,x+130,y+80,140,14,7);c.fill();
 if(i%3!=1){c.fillStyle=hl?'#3a121b':'#18202d';c.beginPath();rr(c,x+40,y+135,w-80,150,18);c.fill();
  c.fillStyle=hl?`rgba(${C.RED},.5)`:'rgba(255,255,255,.06)';c.beginPath();c.moveTo(x+90,y+270);c.lineTo(x+260,y+170);c.lineTo(x+380,y+250);c.lineTo(x+470,y+200);c.lineTo(x+620,y+270);c.fill();}
 else{c.fillStyle='rgba(255,255,255,.08)';for(let k=0;k<4;k++){c.beginPath();rr(c,x+40,y+140+k*40,(w-80)*(.55+hash(i*9+k)*.45),18,9);c.fill();}}
 c.restore();}
function heart(c,x,y,s){c.beginPath();c.moveTo(x,y+s*.35);c.bezierCurveTo(x-s,y-s*.3,x-s*.4,y-s*.95,x,y-s*.35);c.bezierCurveTo(x+s*.4,y-s*.95,x+s,y-s*.3,x,y+s*.35);c.fill();}
function s2(t){const u=t-6;
 ctx.fillStyle='#06080d';ctx.fillRect(0,0,W,H);
 const fa=1-inv(2.4,3.0,u);
 if(fa>0){ctx.save();ctx.globalAlpha=fa;
  const zf=lerp(1,1.12,eio(inv(1.3,2.5,u)));ctx.translate(W/2,H/2);ctx.scale(zf,zf);ctx.translate(-W/2,-H/2);
  const sc=kf(u,[[0,3200],[1.35,0]],eo);
  for(let i=-2;i<16;i++){const y=H/2-165+(i-5)*370+sc;if(y<-400||y>H+40)continue;const hl=i==5&&u>1.25;
   if(i==5){const cs=lerp(1,0,ei(inv(2.4,2.85,u)));ctx.save();ctx.translate(W/2,y+165);ctx.rotate(inv(2.4,2.85,u)*.4);ctx.scale(cs*lerp(1,1.05,inv(1.3,1.6,u)),cs);ctx.translate(-W/2,-(y+165));
    
    cardDraw(ctx,i,y,hl,u);ctx.restore();}
   else{ctx.save();ctx.globalAlpha=fa*(u>1.25?lerp(1,.25,inv(1.25,1.6,u)):1);cardDraw(ctx,i,y,false,u);ctx.restore();}}
  // تفاعلات تتطاير
  if(u>1.4&&u<2.6){ctx.globalCompositeOperation='lighter';for(let k=0;k<40;k++){const st=1.4+k*.028;const a=u-st;if(a<0||a>1)continue;
   const xx=W/2+(hash(k)-.5)*700+Math.sin(a*6+k)*30,yy=H/2+120-a*(500+hash(k+5)*400);ctx.fillStyle=`rgba(${C.RED},${(1-a)*.9})`;
   if(k%2)heart(ctx,xx,yy,26);else{ctx.beginPath();ctx.moveTo(xx-18,yy+10);ctx.lineTo(xx,yy-16);ctx.lineTo(xx+18,yy+10);ctx.closePath();ctx.fill();}}ctx.globalCompositeOperation='source-over';}
  // شريط علوي فارغ
  ctx.fillStyle='rgba(10,14,22,.95)';ctx.fillRect(0,0,W,150);ctx.fillStyle='rgba(255,255,255,.08)';for(let k=0;k<4;k++){ctx.beginPath();rr(ctx,80+k*240,70,180,30,15);ctx.fill();}
  ctx.restore();}
 // الشبكة
 if(u>2.75){const z=lerp(2.4,.31,eio(inv(2.8,8,u))),rot=u*.03;
  ctx.save();ctx.globalAlpha=inv(2.75,2.95,u);
  ctx.globalCompositeOperation='lighter';radial(ctx,W/2,H/2,1100,C.RED,.12+.12*inv(3,8,u));
  camT(ctx,0,0,z,rot);const lw=1.6/z;
  ctx.strokeStyle=`rgba(${C.RED},.22)`;ctx.lineWidth=lw*.7;ctx.beginPath();
  for(const[a,b,s]of XL){if(u<s)continue;const A=NET[a],B=NET[b];if(u<A.ta||u<B.ta)continue;ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);}ctx.stroke();
  ctx.strokeStyle=`rgba(${C.RED},.6)`;ctx.lineWidth=lw;ctx.beginPath();
  for(const n of NET){if(n.p<0||u<n.ta-.3)continue;const P=NET[n.p];const e=eo(inv(n.ta-.3,n.ta,u));ctx.moveTo(P.x,P.y);ctx.lineTo(lerp(P.x,n.x,e),lerp(P.y,n.y,e));}ctx.stroke();
  // نبضات على الروابط
  ctx.fillStyle='rgba(255,140,150,.9)';for(let i=1;i<NET.length;i+=3){const n=NET[i];if(u<n.ta)continue;const ph=((u-n.ta)*1.3+hash(i))%1;const P=NET[n.p];ctx.beginPath();ctx.arc(lerp(P.x,n.x,ph),lerp(P.y,n.y,ph),3.2/z,0,7);ctx.fill();}
  for(let i=0;i<NET.length;i++){const n=NET[i];if(u<n.ta)continue;const k=u-n.ta;const r=(i==0?26:n.f?13:9)*(1+Math.max(0,1-k*3));
   ctx.fillStyle=n.f?'rgba(255,90,100,.95)':`rgba(${C.RED},.85)`;ctx.beginPath();ctx.arc(n.x,n.y,Math.max(r,2.2/z),0,7);ctx.fill();
   if(k<.5){ctx.strokeStyle=`rgba(255,120,130,${(.5-k)*1.6})`;ctx.lineWidth=lw*1.5;ctx.beginPath();ctx.arc(n.x,n.y,r+k*120,0,7);ctx.stroke();}
   if(n.f&&z>.9)maskIcon(ctx,n.x,n.y,r*.75,'#1a0508',1);}
  ctx.restore();}
 // وميض البداية
 const fl=1-inv(0,.35,u);if(fl>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(150,185,255,${fl})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 const fl2=bell(2.75,3.05,u);if(fl2>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,120,130,${fl2*.7})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 if(u>7.92){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);}
}
