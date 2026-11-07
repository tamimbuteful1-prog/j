// ===================== المشهد ٧: الجوال يتصفح «معيار» + الشهادة على المكتب (زمن محلي 0–10) =====================
const PH={x:540,y:980,r:-.03,sw:520,sh:885};               // الجوال وشاشته (عالم)
const CE={x:1470,y:760,r:.1,w:760};CE.h=CE.w*1280/1024;     // الشهادة على المكتب
function certHead(){const fy=-.383*CE.h;return[CE.x-Math.sin(CE.r)*fy,CE.y+Math.cos(CE.r)*fy];}
function tapScreen(tp){return[(tp.x/TAPS.vw-.5)*PH.sw,(tp.y/TAPS.vh-.5)*PH.sh];}
function finger(u){// موضع الإصبع داخل إحداثيات الجوال المحلية
 for(const tp of TAPS.taps){const a=u-tp.t;if(a>-.55&&a<.55){const[x,y]=tapScreen(tp);const k=a<0?eo(inv(-.55,0,a)):1-eo(inv(.1,.55,a));return{x:x+(1-k)*260,y:y+(1-k)*520,v:k,press:a>=0&&a<.12};}}
 const drags=[[1.0,2.4],[6.4,7.3]];for(const[a,b]of drags){if(u>a-.3&&u<b+.3){const k=inv(a,b,u);const v=Math.min(eo(inv(a-.3,a,u)),1-eo(inv(b,b+.3,u)));return{x:120,y:lerp(260,-180,eio(k)),v,press:false};}}
 return null;}
function fingerPath(c){c.beginPath();c.moveTo(-50,40);c.arc(0,40,50,Math.PI,0);c.lineTo(78,820);c.lineTo(-78,820);c.closePath();}
function drawFinger(f){if(!f||f.v<=0)return;ctx.save();ctx.translate(f.x,f.y-40);ctx.rotate(-.42);const sc=f.press?.96:1;ctx.scale(sc,sc);
 ctx.save();ctx.translate(34,40);ctx.fillStyle=`rgba(0,0,0,${.32*f.v})`;fingerPath(ctx);ctx.fill();ctx.restore();
 const g=ctx.createLinearGradient(-70,0,70,0);g.addColorStop(0,`rgba(16,12,10,${f.v})`);g.addColorStop(.55,`rgba(42,30,24,${f.v})`);g.addColorStop(1,`rgba(14,10,9,${f.v})`);ctx.fillStyle=g;fingerPath(ctx);ctx.fill();
 ctx.fillStyle=`rgba(120,96,84,${.35*f.v})`;ctx.beginPath();ctx.ellipse(0,52,30,40,0,0,7);ctx.fill();   // الظفر
 ctx.strokeStyle=`rgba(${C.AMB},${.22*f.v})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,40,50,Math.PI*1.05,Math.PI*1.6);ctx.stroke();ctx.restore();}
function s7(u){
 const hx=certHead();
 let cx=kf(u,[[0,PH.x],[2.6,PH.x],[3.5,CE.x],[4.4,hx[0]],[5.5,hx[0]],[6.4,PH.x],[10,PH.x]]),cy=kf(u,[[0,PH.y],[2.6,PH.y],[3.5,CE.y],[4.4,hx[1]],[5.5,hx[1]],[6.4,PH.y],[10,PH.y+40]]);
 const z=kf(u,[[0,1.38],[2.6,1.46],[3.5,.96],[4.4,2.5],[5.5,2.62],[6.4,1.44],[9.6,1.62]]),rot=kf(u,[[0,.02],[2.6,.03],[3.5,-.1],[5.5,-.1],[6.4,.03],[10,.0]]);
 const sh=shake(u+44,5,.6);cx+=sh[0];cy+=sh[1];
 ctx.save();camT(ctx,cx,cy,z,rot);
 // سطح المكتب
 ctx.fillStyle='#3a291e';ctx.fillRect(-1600,-1600,4800,4800);ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=3;
 for(let i=0;i<46;i++){ctx.beginPath();const y=-1400+i*95;ctx.moveTo(-1600,y);ctx.bezierCurveTo(-200,y+30*Math.sin(i),1200,y-25*Math.cos(i*1.3),3200,y+10);ctx.stroke();}
 // أوراق منقّحة ومكبّر (من نفس الغرفة)
 for(const o of[[-260,1700,.35,620,800],[60,-260,-.25,560,720]]){ctx.save();ctx.translate(o[0],o[1]);ctx.rotate(o[2]);ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(-o[3]/2+30,-o[4]/2+30,o[3],o[4]);ctx.fillStyle='#c9c1ae';ctx.fillRect(-o[3]/2,-o[4]/2,o[3],o[4]);
  ctx.fillStyle='#111';for(let k=0;k<8;k++)ctx.fillRect(-o[3]/2+50,-o[4]/2+70+k*80,(o[3]-100)*(.45+hash(k+o[0])*.55),30);ctx.restore();}
 ctx.save();ctx.translate(980,1720);ctx.rotate(.5);ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=26;ctx.beginPath();ctx.arc(30,30,120,0,7);ctx.stroke();
 ctx.strokeStyle='#8d939b';ctx.lineWidth=24;ctx.beginPath();ctx.arc(0,0,120,0,7);ctx.stroke();ctx.strokeStyle='#241e1a';ctx.lineWidth=46;ctx.beginPath();ctx.moveTo(120,0);ctx.lineTo(360,0);ctx.stroke();ctx.restore();
 // الشهادة: حواف مقوّسة، ظل، وتدرّج لوني دافئ يطابق الغرفة
 const cert=img('cert');ctx.save();ctx.translate(CE.x,CE.y);ctx.rotate(CE.r);
 ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();rr(ctx,-CE.w/2+34,-CE.h/2+40,CE.w,CE.h,44);ctx.fill();
 ctx.beginPath();rr(ctx,-CE.w/2,-CE.h/2,CE.w,CE.h,44);ctx.save();ctx.clip();
 if(cert)ctx.drawImage(cert,-CE.w/2,-CE.h/2,CE.w,CE.h);else{ctx.fillStyle='#eee';ctx.fill();}
 ctx.globalCompositeOperation='multiply';ctx.fillStyle='rgb(246,222,192)';ctx.fillRect(-CE.w/2,-CE.h/2,CE.w,CE.h);
 const vg=ctx.createRadialGradient(0,0,CE.h*.3,0,0,CE.h*.75);vg.addColorStop(0,'rgba(255,255,255,1)');vg.addColorStop(1,'rgba(150,130,110,1)');ctx.fillStyle=vg;ctx.fillRect(-CE.w/2,-CE.h/2,CE.w,CE.h);
 ctx.restore();ctx.strokeStyle='rgba(255,240,220,.25)';ctx.lineWidth=3;ctx.stroke();ctx.restore();
 // جسم الجوال
 ctx.save();ctx.translate(PH.x,PH.y);ctx.rotate(PH.r);ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();rr(ctx,-PH.sw/2-18+40,-PH.sh/2-50+46,PH.sw+36,PH.sh+100,70);ctx.fill();
 ctx.fillStyle='#0c0e12';ctx.beginPath();rr(ctx,-PH.sw/2-18,-PH.sh/2-50,PH.sw+36,PH.sh+100,70);ctx.fill();ctx.strokeStyle='#3c424c';ctx.lineWidth=4;ctx.stroke();ctx.restore();
 // الإضاءة: نفس قناع الغرفة (مصباح + ظلام)
 m.setTransform(1,0,0,1,0,0);beginMask(.93);m.save();camT(m,cx,cy,z,rot);mLight(1000,850,1500,.95,1,.8);mLight(PH.x,PH.y,700,.35);m.restore();applyMask();
 ctx.globalCompositeOperation='lighter';radial(ctx,1000,850,1300,C.AMB,.07);ctx.globalCompositeOperation='source-over';
 // الشاشة (مضيئة بذاتها)
 ctx.save();ctx.translate(PH.x,PH.y);ctx.rotate(PH.r);ctx.beginPath();rr(ctx,-PH.sw/2,-PH.sh/2,PH.sw,PH.sh,44);ctx.clip();
 if(VID.readyState>=2)ctx.drawImage(VID,-PH.sw/2,-PH.sh/2,PH.sw,PH.sh);else{ctx.fillStyle='#f1ede6';ctx.fillRect(-PH.sw/2,-PH.sh/2,PH.sw,PH.sh);}
 ctx.fillStyle='rgba(20,14,8,.12)';ctx.fillRect(-PH.sw/2,-PH.sh/2,PH.sw,PH.sh);
 for(const tp of TAPS.taps){const a=u-tp.t;if(a>=0&&a<.5){const[x,y]=tapScreen(tp);ctx.fillStyle=`rgba(255,255,255,${.35*(1-a/.5)})`;ctx.beginPath();ctx.arc(x,y,20+a*160,0,7);ctx.fill();}}
 ctx.restore();
 ctx.restore();
 const fi=1-inv(0,.4,u);if(fi>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(200,255,230,${fi})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 const fo=Math.pow(inv(9.5,10,u),2);if(fo>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(200,255,230,${fo})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
}
