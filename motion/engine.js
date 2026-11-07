let cv,ctx,MAIN;
const BW=270,BH=480;let b1,b1c,b2,b2c,GS,gs,GRAIN=[];
function setup(canvas){cv=canvas;cv.width=W;cv.height=H;ctx=MAIN=cv.getContext('2d');
 b1=mkCanvas(BW,BH);b1c=b1.getContext('2d');b2=mkCanvas(BW,BH);b2c=b2.getContext('2d');GS=mkCanvas(W,H);gs=GS.getContext('2d');
 for(let g=0;g<4;g++){const c=mkCanvas(360,360),x=c.getContext('2d'),im=x.createImageData(360,360),r=mulberry32(g+11);for(let i=0;i<im.data.length;i+=4){const v=r()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}x.putImageData(im,0,0);GRAIN.push(c);}}
const GLITCH=[[10.5,.15,.6],[12.0,.13,.8],[13.55,.38,1],[18.6,.06,.4],[19.2,.08,.6],[19.75,.2,.9],[26.0,.08,.5],[28.5,.12,.7],[30.45,.12,.8]];
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
const SEG=[[0,6,0,7],[6,14,7,15],[14,22,15,25],[22,31,25,35],[31,40,35,52],[40,45,52,58]],OUT=58;
function storyT(T){for(const[a,b,c,d]of SEG)if(T<d)return a+(T-c)*(b-a)/(d-c);return 45-1e-3;}
function render(T){const t=storyT(T);ctx=MAIN;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowBlur=0;
 ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 if(t<6)s1(t);else if(t<14)s2(t);else if(t<22)s3(t);else if(t<31)s4(t);else if(t<40)s5(t);else s6(t);
 ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';certLayer(T);typoLayer(T);
 post(t,T);}
