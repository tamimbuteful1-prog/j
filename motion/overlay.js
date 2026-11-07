// ===== الصور: الشهادة وصورة صاحب المبادرة =====
const IMG={};
function loadImg(k,src){return new Promise(r=>{const im=new Image();im.onload=()=>{IMG[k]=im;r();};im.onerror=()=>r();im.src=src;});}
window.imagesReady=Promise.all([loadImg('cert','assets/certificate.jpg'),loadImg('tamim','assets/tamim.jpg')]);
// بديل مؤقت إن لم تُرفع الصور
function placeholder(w,h,kind){const c=mkCanvas(w,h),x=c.getContext('2d');
 if(kind=='cert'){const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#1bb7c4');g.addColorStop(.6,'#7b3aa0');g.addColorStop(1,'#e2626b');x.fillStyle='#f7f5f1';x.fillRect(0,0,w,h);
  x.fillStyle=g;x.beginPath();x.moveTo(0,0);x.lineTo(w,0);x.lineTo(w,h*.33);x.quadraticCurveTo(w/2,h*.40,0,h*.30);x.fill();
  x.fillStyle='rgba(255,255,255,.9)';x.fillRect(w*.38,h*.1,w*.24,h*.035);x.fillStyle='rgba(0,0,0,.15)';for(const[yy,ww]of[[.5,.3],[.56,.42],[.64,.5],[.7,.16],[.75,.2]])x.fillRect(w*(.5-ww/2),h*yy,w*ww,h*.022);}
 else{x.fillStyle='#111';x.fillRect(0,0,w,h);x.fillStyle='#3a3f48';x.beginPath();x.arc(w/2,h*.38,w*.18,0,7);x.fill();x.beginPath();x.ellipse(w/2,h*.95,w*.38,h*.35,0,0,7);x.fill();}
 return c;}
function img(k){if(!IMG[k])IMG[k]=placeholder(k=='cert'?1024:1320,k=='cert'?1280:1300,k);return IMG[k];}

// رسم صورة بمنظور ثلاثي الأبعاد (دوران حول المحور الرأسي) عبر شرائح
function drawPersp(c,im,cx,cy,w,h,ry,rz,a){const N=140,f=1800,sw=im.width/N;c.save();c.translate(cx,cy);c.rotate(rz);c.globalAlpha=a;
 for(let i=0;i<N;i++){const x0=i/N-.5,x1=(i+1)/N-.5;const p0=f/(f+x0*w*Math.sin(ry)),p1=f/(f+x1*w*Math.sin(ry));
  const X0=x0*w*Math.cos(ry)*p0,X1=x1*w*Math.cos(ry)*p1,hh=h*(p0+p1)/2;c.drawImage(im,i*sw,0,sw+.6,im.height,X0,-hh/2,X1-X0+.8,hh);}
 c.restore();}
// تسلسل الشهادة (زمن الإخراج)
const CERT0=38.6,CERT1=44.0;
function certLayer(T){if(T<CERT0||T>CERT1)return;const u=T-CERT0,D=CERT1-CERT0;const im=img('cert');
 const dim=Math.min(inv(0,.4,u),1-inv(D-.4,D,u));ctx.save();ctx.fillStyle=`rgba(2,4,6,${.78*dim})`;ctx.fillRect(0,0,W,H);ctx.restore();
 // مفاتيح: دخول ← عرض كامل ← تكبير على «مشروع متميز» ← رجوع ← خروج
 const K=(keys)=>kf(u,keys,eio);
 const S=K([[0,.35],[.7,.86],[1.5,.9],[2.3,2.55],[3.6,2.7],[4.2,.86],[D,.6]]);
 const fy=K([[0,0],[1.5,0],[2.3,-.385],[3.6,-.38],[4.2,0],[D,0]]);   // نقطة التركيز داخل البطاقة (نسبة من الارتفاع)
 const ry=K([[0,.85],[.7,.32],[1.5,.22],[2.3,.16],[3.6,.12],[4.2,.28],[D,-.9]]);
 const rz=K([[0,.18],[.7,-.05],[1.5,-.04],[2.3,-.03],[3.6,-.02],[4.2,-.05],[D,-.25]]);
 const ox=K([[0,-200],[.7,0],[4.2,0],[D,900]]),oy=K([[0,1500],[.7,0],[4.2,0],[D,-1300]]);
 const a=Math.min(1,inv(0,.25,u))*(1-inv(D-.25,D,u));
 const cw=820*S,ch=cw*im.height/im.width;const cx=W/2+ox,cy=H/2+oy-fy*ch;
 // ظل
 ctx.save();ctx.globalAlpha=.6*a;ctx.fillStyle='#000';ctx.filter='blur(30px)';ctx.translate(cx+30,cy+50);ctx.rotate(rz);ctx.fillRect(-cw*.45,-ch*.45,cw*.9,ch*.9);ctx.restore();ctx.filter='none';
 drawPersp(ctx,im,cx,cy,cw,ch,ry,rz,a);
 // لمعة زجاجية تعبر البطاقة
 const sw=inv(.8,1.5,u),sw2=inv(2.5,3.2,u);for(const k of[sw,sw2]){if(k<=0||k>=1)continue;ctx.save();ctx.translate(cx,cy);ctx.rotate(rz);ctx.beginPath();ctx.rect(-cw*Math.cos(ry)/2,-ch/2,cw*Math.cos(ry),ch);ctx.clip();
  ctx.globalCompositeOperation='lighter';const x0=lerp(-cw,cw,eio(k));const g=ctx.createLinearGradient(x0-160,0,x0+160,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${.35*a})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.rotate(.3);ctx.fillRect(x0-160,-ch*1.5,320,ch*3);ctx.restore();}
 // إطار ضوئي عند التكبير
 
}
