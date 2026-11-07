// ===== طبقة الطباعة الحركية (Kinetic Type) — بزمن الإخراج T =====
const TC={W:'#EEF2F8',D:'#9AA6B8',R:`rgb(${C.RED})`,G:`rgb(${C.GRN})`,A:`rgb(${C.AMB})`};
// [بداية، نهاية، أسلوب، أسطر[نص، حجم، وزن، لون، y، تأخير، نمط]]  — *كلمة* = تمييز بلون السطر
const TYPO=[
 [0.6,3.5,'stamp',[['أخطاءنا في الدفاع',112,900,'W',380,0],['*يستفيد منها الأعداء ضدنا*',96,900,'R',520,.95]]],
 [3.7,6.5,'rise',[['كلنا مرّينا بهالموقف…',62,500,'D',380,0],['نشوف أحد يسيء لنا… أو للسعودية',62,700,'W',490,.6]]],
 [7.4,9.9,'stamp',[['نهاجمه',120,900,'R',330,0],['ونرد عليه',96,900,'R',470,.55],['ونسيء له',96,900,'R',600,1.1]]],
 [10.1,12.4,'redact',[['ترا هذا الشخص جزء من',60,700,'W',300,0],['*حملات منظّمة*',150,900,'R',440,.35],['تستهدف قيمنا وأخلاقنا',64,700,'W',590,.85]]],
 [12.5,14.6,'rise',[['وتصنع لنا',72,700,'W',1400,0],['*أعداء*',200,900,'R',1580,.25],['ما كانوا موجودين… بالاستفزاز',58,500,'D',1745,.65]]],
 [15.4,17.1,'stamp',[['١',52,800,'D',230,0,'tag'],['يا نسكت',170,900,'W',410,.05]]],
 [17.7,19.6,'stamp',[['٢',52,800,'R',230,0,'tag'],['*يا نرد*',170,900,'R',410,.05]]],
 [20.2,22.1,'stamp',[['٣',52,800,'R',230,0,'tag'],['*يا ننجرّ*',170,900,'R',410,.05],['للمكان اللي هم يبونه',60,500,'D',560,.4]]],
 [22.6,24.3,'stamp',[['طيب…',80,700,'W',300,0],['*إيش الحل؟*',160,900,'G',450,.35]]],
 [25.3,27.5,'stamp',[['مبادرة',56,700,'D',800,0],['جندي',200,900,'W',960,.2],['*على الحدود الرقمية*',92,800,'G',1110,.5]]],
 [27.7,34.3,'rise',[['سلسلة قصيرة نتعلم فيها مع بعض',44,700,'A',1250,0,'tag'],['كيف نتحقق من المصدر والسياق',70,800,'W',1390,.35],['كيف نفرّق بين النقد والتضليل',70,800,'W',1520,1.9],['*متى نرد… ومتى نتغاضى*',80,900,'G',1660,4.4]]],
 [35.6,38.5,'stamp',[['وفتحت لكم',56,700,'D',200,0],['*معيار*',220,900,'G',370,.2]]],
 [44.2,50.7,'stamp',[['مجانًا',46,800,'G',190,0,'tag'],['نفحص فيها',64,700,'W',320,.3],['*النصوص والصوت والفيديو*',92,900,'G',450,.6],['لضبط المحتوى',64,700,'W',580,1.2]]],
 [54.2,58.1,'rise',[['أنا تميم الحارثي',96,900,'W',1430,0],['*جندي على الحدود الرقمية*',70,800,'G',1555,.5],['تابعوني',52,800,'A',1690,1.2,'tag']]],
];
function layLine(L){const[s,z0,w,,,,st]=L;let z=z0;const segs=st=='tag'?s.split('|'):s.split(' ');
 let on=false;const raw=segs.map(g=>{let a=on;if(g.startsWith('*')){a=true;on=true;g=g.slice(1);}if(g.endsWith('*')){g=g.slice(0,-1);on=false;}return{g,a};});
 for(let pass=0;pass<2;pass++){ctx.font=`${w} ${z}px Tj`;const gap=st=='tag'?z*.9:z*.26,pad=st=='tag'?z*.55:0;
  let tot=0;for(const it of raw){it.w=ctx.measureText(it.g).width+pad*2;tot+=it.w;}tot+=gap*(raw.length-1);
  if(tot>950&&pass==0){z=z*950/tot;continue;}let x=W/2+tot/2;for(const it of raw){it.x=x;x-=it.w+gap;}return{items:raw,z,tot,pad};}}
function typoLayer(T){
 for(const[t0,t1,fx,lines,ex]of TYPO){if(T<t0-.01||T>t1+.01)continue;
  const e=ex=='cut'?(T>=t1?1:0):eio(inv(t1-.35,t1,T));
  const lay=lines.map(layLine);const ys=lines.map(l=>l[4]);const y0=Math.min(...ys)-140,y1=Math.max(...ys)+60;
  // خلفية معتمة لقراءة أفضل
  const ba=inv(t0,t0+.3,T)*(1-e);ctx.save();ctx.translate(W/2,(y0+y1)/2);ctx.scale(1,(y1-y0+260)/1200);const g=ctx.createRadialGradient(0,0,0,0,0,640);g.addColorStop(0,`rgba(0,0,0,${.62*ba})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(-W,-640,2*W,1280);ctx.restore();
  lines.forEach((L,li)=>{const[s,,w,cc,y,d,st]=L;const{items,z,tot,pad}=lay[li];const col=TC[cc];const st0=t0+(d||0);if(T<st0)return;
   ctx.save();ctx.font=`${w} ${z}px Tj`;ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='middle';
   let la=1,sc=1,ghost=0,clipX=null,bar=null;
   if(fx=='stamp'){const k=inv(st0,st0+.32,T);sc=lerp(1.45,1,eo(k));la=Math.min(1,k*2.5);ghost=1-inv(st0+.05,st0+.45,T);}
   if(fx=='redact'){const b1=eo(inv(st0,st0+.22,T)),r=eio(inv(st0+.26,st0+.6,T));const R0=W/2+tot/2+20,L0=W/2-tot/2-20;
    const right=lerp(R0,L0,r),left=lerp(R0,L0,b1);bar=[Math.min(left,right),y-z*.55,Math.abs(right-left),z*1.1];clipX=right;if(r<=0)clipX=1e4;}
   ctx.translate(W/2,y-e*24);ctx.scale(sc,sc);ctx.translate(-W/2,-y);
   if(clipX!==null){ctx.beginPath();ctx.rect(clipX,-1e4,2e4,3e4);ctx.clip();}
   items.forEach((it,i)=>{let a=la,dy=0,bl=0;
    if(fx=='rise'){const k=eo(inv(st0+i*.08,st0+i*.08+.45,T));a=k;dy=(1-k)*38;bl=(1-k)*9;}
    a*=(1-e);bl+=e*8;if(a<=.002)return;const c=it.a||st=='tag'?col:(cc=='D'?TC.D:TC.W);const ty=y+dy+z*.06;
    if(st=='tag'){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();rr(ctx,it.x-it.w,y-z*.85,it.w,z*1.6,z*.8);ctx.stroke();ctx.restore();}
    if(bl>.4)ctx.filter=`blur(${bl.toFixed(1)}px)`;
    ctx.globalAlpha=a;ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=28;ctx.fillStyle=c;ctx.fillText(it.g,it.x-pad,ty);ctx.shadowBlur=0;
    if(it.a&&st!='tag'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*.45;ctx.shadowColor=col;ctx.shadowBlur=40;ctx.fillText(it.g,it.x-pad,ty);ctx.restore();}
    if(ghost>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=ghost*.55*a;ctx.fillStyle=`rgb(${C.RED})`;ctx.fillText(it.g,it.x-pad+10*ghost,ty);ctx.fillStyle='rgb(60,200,255)';ctx.fillText(it.g,it.x-pad-10*ghost,ty);ctx.restore();}
    ctx.filter='none';});
   ctx.restore();
   if(bar&&bar[2]>1){ctx.save();ctx.globalAlpha=1-e;ctx.fillStyle=cc=='R'?TC.R:cc=='G'?TC.G:'#EEF2F8';ctx.fillRect(...bar);ctx.restore();}
  });}
}
