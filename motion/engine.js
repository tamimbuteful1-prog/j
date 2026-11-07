let cv,ctx,MAIN;
const BW=270,BH=480;let b1,b1c,b2,b2c,GS,gs,GRAIN=[];
function setup(canvas){cv=canvas;cv.width=W;cv.height=H;ctx=MAIN=cv.getContext('2d');
 b1=mkCanvas(BW,BH);b1c=b1.getContext('2d');b2=mkCanvas(BW,BH);b2c=b2.getContext('2d');GS=mkCanvas(W,H);gs=GS.getContext('2d');
 for(let g=0;g<4;g++){const c=mkCanvas(360,360),x=c.getContext('2d'),im=x.createImageData(360,360),r=mulberry32(g+11);for(let i=0;i<im.data.length;i+=4){const v=r()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}x.putImageData(im,0,0);GRAIN.push(c);}}
const GLITCH=[[10.5,.15,.6],[12.0,.13,.8],[13.55,.38,1],[18.6,.06,.4],[19.2,.08,.6],[19.75,.2,.9],[26.0,.08,.5],[28.5,.12,.7],[29.0,.14,.8]];
function glitch(t){let I=0,seed=0;for(const g of GLITCH){if(t>=g[0]&&t<g[0]+g[1]){I=g[2];seed=g[0];}}if(!I)return;
 const fr=Math.floor(t*30);gs.setTransform(1,0,0,1,0,0);gs.clearRect(0,0,W,H);gs.drawImage(cv,0,0);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35*I;ctx.filter='sepia(1) saturate(8) hue-rotate(-40deg)';ctx.drawImage(GS,18*I,0);ctx.filter='sepia(1) saturate(8) hue-rotate(150deg)';ctx.drawImage(GS,-18*I,0);ctx.filter='none';
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 const n=Math.floor(6+I*14);for(let k=0;k<n;k++){const y=hash(fr*31+k)*H,h=10+hash(fr*17+k)*120*I,dx=(hash(fr*7+k)-.5)*240*I;ctx.drawImage(GS,0,y,W,h,dx,y,W,h);
  if(hash(fr+k*3)<.25){ctx.fillStyle=hash(k+fr)<.5?`rgba(${C.RED},.5)`:`rgba(${C.GRN},.35)`;ctx.fillRect(0,y,W,h*.3);}}
 ctx.restore();}
function post(t,T){ctx=MAIN;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
 // توهّج
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 glitch(t);
 // تظليل الحواف
 const vg=ctx.createRadialGradient(W/2,H/2,H*.28,W/2,H/2,H*.72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.78)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 // حبيبات فيلم
 const fr=Math.floor(T*30);const g=GRAIN[fr%4];const p=ctx.createPattern(g,'repeat');p.setTransform(new DOMMatrix().translate(hash(fr)*360,hash(fr+1)*360).scale(1.5,1.5));
 ctx.globalCompositeOperation='overlay';ctx.globalAlpha=.13;ctx.fillStyle=p;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 // ارتعاش تعريض خفيف
 const fl=.025*hash(fr*13);ctx.fillStyle=`rgba(0,0,0,${fl})`;ctx.fillRect(0,0,W,H);}
// [بداية الإخراج، نهايته، المشهد، بداية زمن المشهد، نهايته]
const SEQ=[[0,7,'s1',0,6],[7,15,'s2',6,14],[15,23,'s4',22,29.2],[23,33,'s3',14,22],[33,44,'s5',31,40],[44,54,'s7',0,10],[54,60,'s6',40,45]],OUT=60;
const SCN={s1:t=>s1(t),s2:t=>s2(t),s3:t=>s3(t),s4:t=>s4(t),s5:t=>s5(t),s6:t=>s6(t),s7:t=>s7(t)};
function at(T){for(const q of SEQ)if(T<q[1])return{n:q[2],t:q[3]+(T-q[0])*(q[4]-q[3])/(q[1]-q[0])};const q=SEQ[SEQ.length-1];return{n:q[2],t:q[4]-1e-3};}
async function prepare(T){const a=at(T);if(a.n=='s7')await seekVid(a.t);}
function render(T){const a=at(T),t=a.t;ctx=MAIN;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowBlur=0;
 ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);SCN[a.n](t);
 ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 if(a.n=='s4'){const k=inv(28.85,29.2,t);if(k>0){ctx.fillStyle=`rgba(0,0,0,${k})`;ctx.fillRect(0,0,W,H);}}
 post(a.n=='s7'?-1:t,T);}
