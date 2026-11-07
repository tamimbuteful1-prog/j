// ===== الحلقة التعريفية الأولى: «جندي على الحدود الرقمية» (54 ث) — ترتيب المشاهد حسب نص التعليق =====
const OUT_EP=54;
// مشهد جديد: الحدود الجغرافية ليلًا (سياج، برج مراقبة، كشّاف، حارس) ثم يتحوّل خط الحدود إلى خط رقمي
const STARS=Array.from({length:120},(_,i)=>({x:hash(i*3.3)*1080,y:hash(i*7.1)*900,s:hash(i*1.9)*1.6+.3,p:hash(i*5.7)*6}));
function sGeo(t){ // t: 0..6.2
 const z=lerp(1.0,1.22,eio(inv(0,6.2,t))),cx=lerp(540,620,eio(inv(0,6.2,t))),cy=lerp(1000,1110,eio(inv(0,6.2,t)));
 const dig=eio(inv(2.5,3.9,t)); // تقدّم التحوّل الرقمي
 ctx.save();camT(ctx,cx,cy,z,lerp(-.01,.008,inv(0,6.2,t)));
 // السماء والنجوم
 const sg=ctx.createLinearGradient(0,-300,0,1250);sg.addColorStop(0,'#070a10');sg.addColorStop(.7,'#141c27');sg.addColorStop(1,'#26303c');ctx.fillStyle=sg;ctx.fillRect(-600,-600,2300,1900);
 for(const s of STARS){ctx.fillStyle=`rgba(220,230,255,${.25+.35*Math.sin(t*2+s.p)**2})`;ctx.fillRect(s.x-200+s.x*.3,s.y-300,s.s,s.s);}
 // جبال بعيدة
 ctx.fillStyle='#0d1219';ctx.beginPath();ctx.moveTo(-600,1230);for(let x=-600;x<=1700;x+=40)ctx.lineTo(x,1150-60*Math.sin(x*.004)-40*Math.sin(x*.011+1)-25*hash(Math.floor(x/40)));ctx.lineTo(1700,1300);ctx.fill();
 // الأرض
 const gg=ctx.createLinearGradient(0,1220,0,2400);gg.addColorStop(0,'#1a1712');gg.addColorStop(1,'#08070a');ctx.fillStyle=gg;ctx.fillRect(-600,1220,2300,1300);
 // شبكة رقمية تظهر على الأرض مع التحوّل
 if(dig>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${C.GRN},${.14*dig})`;ctx.lineWidth=2;
  for(let k=-14;k<=14;k++){ctx.beginPath();ctx.moveTo(540,1225);ctx.lineTo(540+k*240,2400);ctx.stroke();}
  for(let k=1;k<16;k++){const y=1225+1100/(k*.6);if(y>2400)continue;ctx.beginPath();ctx.moveTo(-600,y);ctx.lineTo(1700,y);ctx.stroke();}ctx.restore();}
 // السياج: أعمدة تتراجع نحو الأفق + أسلاك
 const P=[];for(let k=0;k<14;k++){const d=1/(1+k*.55);P.push({x:lerp(1500,-120,1-d)-k*30,yb:lerp(1236,1700,d),h:420*d,w:16*d});}
 for(let w=0;w<4;w++){ctx.beginPath();P.forEach((p,i)=>{const y=p.yb-p.h*(.25+w*.22);i?ctx.lineTo(p.x,y+6*Math.sin(i*1.3+w)):ctx.moveTo(p.x,y);});
  ctx.strokeStyle=`rgba(${Math.round(lerp(150,38,dig))},${Math.round(lerp(150,232,dig))},${Math.round(lerp(155,160,dig))},${lerp(.55,.95,dig)})`;ctx.lineWidth=lerp(2.2,3.4,dig);ctx.stroke();}
 for(const p of P){ctx.fillStyle='#07080b';ctx.fillRect(p.x-p.w/2,p.yb-p.h,p.w,p.h);
  if(dig>0){ctx.fillStyle=`rgba(${C.GRN},${.5*dig})`;ctx.fillRect(p.x-p.w/2,p.yb-p.h,p.w,3);}}
 // خط الحدود على الأرض: يتحوّل إلى خط رقمي مضيء من القريب إلى البعيد
 const k1=dig;ctx.beginPath();P.forEach((p,i)=>{i?ctx.lineTo(p.x,p.yb):ctx.moveTo(p.x,p.yb);});ctx.strokeStyle='rgba(120,110,95,.5)';ctx.lineWidth=3;ctx.stroke();
 if(k1>0){const n=Math.max(1,Math.floor(P.length*k1));ctx.save();ctx.globalCompositeOperation='lighter';ctx.beginPath();for(let i=0;i<n;i++){const p=P[i];i?ctx.lineTo(p.x,p.yb):ctx.moveTo(p.x,p.yb);}
  ctx.strokeStyle=`rgb(${C.GRN})`;ctx.lineWidth=6;ctx.stroke();ctx.restore();}
 // برج المراقبة + كشّاف يمسح
 const TX=860,TY=1250;ctx.fillStyle='#06070a';ctx.fillRect(TX-8,TY-420,16,420);ctx.fillRect(TX+70,TY-420,16,420);
 ctx.strokeStyle='#06070a';ctx.lineWidth=6;ctx.beginPath();for(let k=0;k<4;k++){ctx.moveTo(TX,TY-k*100);ctx.lineTo(TX+78,TY-(k+1)*100);ctx.moveTo(TX+78,TY-k*100);ctx.lineTo(TX,TY-(k+1)*100);}ctx.stroke();
 ctx.fillRect(TX-30,TY-500,140,80);ctx.beginPath();ctx.moveTo(TX-45,TY-500);ctx.lineTo(TX+40,TY-560);ctx.lineTo(TX+125,TY-500);ctx.fill();
 const ang=-2.2+Math.sin(t*.9)*.55;const L0=[TX+40,TY-465];
 ctx.save();ctx.globalCompositeOperation='lighter';const bl=ctx.createLinearGradient(L0[0],L0[1],L0[0]+Math.cos(ang)*1500,L0[1]+Math.sin(ang)*-1500);
 const col=dig>.5?C.GRN:'255,236,200';bl.addColorStop(0,`rgba(${col},.30)`);bl.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=bl;
 ctx.beginPath();ctx.moveTo(L0[0],L0[1]);const a1=ang-.07,a2=ang+.07;ctx.lineTo(L0[0]+Math.cos(a1)*1700,L0[1]-Math.sin(a1)*-1700*-1);ctx.lineTo(L0[0]+Math.cos(a2)*1700,L0[1]-Math.sin(a2)*-1700*-1);ctx.closePath();ctx.fill();
 radial(ctx,L0[0],L0[1],40,col,.8);ctx.restore();
 // الحارس في المقدّمة بجانب السياج
 ctx.fillStyle='#030405';figureFill(ctx,300,1690,640);
 ctx.save();ctx.strokeStyle='#030405';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(300+40,1690-430);ctx.lineTo(300+150,1690-620);ctx.stroke();ctx.restore(); // سلاح على الكتف
 ctx.restore();
 // وميض التحوّل
 const fl=bell(3.55,4.1,t);if(fl>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${C.GRN},${.35*fl})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 const fi=1-inv(0,.5,t);if(fi>0){ctx.fillStyle=`rgba(0,0,0,${fi})`;ctx.fillRect(0,0,W,H);}
}
// [مشهد، [[زمن الإخراج، زمن المشهد]...], تلاشٍ للأسود عند البداية/النهاية]
const EP=[
 ['geo',[[0,0],[6.2,6.2]],{fo:.25}],                         // الحدود الجغرافية ← فيه معارك ثانية على الحدود الرقمية
 ['s2', [[6.2,8.4],[9.4,12.4]],{fi:.2,fo:.2}],                 // معارك ما تستهدف حدود الوطن...
 ['s3', [[9.4,18.06],[13.0,19.66]],{fi:.2}],                  // تستهدفك أنت: قيمك وثقافتك وتفكيرك
 ['s3', [[13.0,20.06],[16.4,22.0]]],                          // والدفاع يحتاج نوع مختلف من الجنود (عدسة ← قزحية)
 ['s5', [[16.4,31.0],[20.0,34.6]],{fo:.25}],                   // من هنا تبدأ مبادرة جندي على الحدود الرقمية
 ['s4', [[20.0,22.0],[25.8,28.9]],{fi:.25}],                   // بنكشف أسلوب من أساليب الأعداء
 ['s5', [[25.8,34.6],[29.6,37.4]],{fi:.2}],                    // وش التصرف الأنسب للدفاع / ومو بس كذا (نبضة الدرع)
 ['s7', [[29.6,0],[32.6,2.6]]],                                // منصة معيار مفتوحة المصدر
 ['s7', [[32.6,6.4],[38.0,9.45]]],                             // تراجع كلامك قبل تنشره
 ['s7', [[38.0,2.6],[42.6,6.4]]],                              // لقب المشروع المتميز
 ['s7', [[42.6,6.4],[44.4,7.2]],{flash:.4}],                   // رابط المنصة في الوصف
 ['s6', [[44.4,40.0],[45.4,41.6],[54,45.0]]],                  // أنا تميم الحارثي... تابعوني
];
function atEp(T){for(const s of EP){const k=s[1];if(T<k[k.length-1][0]||s===EP[EP.length-1]){let t=k[0][1];for(let i=0;i<k.length-1;i++){if(T>=k[i][0]&&T<=k[i+1][0]){t=lerp(k[i][1],k[i+1][1],(T-k[i][0])/(k[i+1][0]-k[i][0]));}}if(T>k[k.length-1][0])t=k[k.length-1][1];return{n:s[0],t,o:s[2]||{},T0:k[0][0],T1:k[k.length-1][0]};}}}
async function prepare(T){const a=atEp(T);if(a.n=='s7')await seekVid(a.t);}
const SCN2={geo:sGeo,s1,s2,s3,s4,s5,s6,s7};
function render(T){const a=atEp(T),t=a.t;ctx=MAIN;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowBlur=0;
 ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);SCN2[a.n](t);ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 if(a.n=='s4'){const k=inv(28.85,29.2,t);if(k>0){ctx.fillStyle=`rgba(0,0,0,${k})`;ctx.fillRect(0,0,W,H);}}
 const o=a.o;let blk=0;if(o.fi)blk=Math.max(blk,1-inv(a.T0,a.T0+o.fi,T));if(o.fo)blk=Math.max(blk,inv(a.T1-o.fo,a.T1,T));
 if(blk>0){ctx.fillStyle=`rgba(0,0,0,${blk})`;ctx.fillRect(0,0,W,H);}
 if(o.flash){const f=Math.pow(inv(a.T1-o.flash,a.T1,T),2);ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(200,255,230,${f})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 post(a.n=='s7'||a.n=='geo'?-1:t,T);}
