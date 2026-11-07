// ===== أدوات عامة =====
const W=1080,H=1920,FPS=30,DUR=45;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const inv=(a,b,x)=>clamp((x-a)/(b-a));
const eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eo=t=>1-Math.pow(1-t,3);
const ei=t=>t*t*t;
const eback=t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
const bell=(a,b,x)=>{const u=inv(a,b,x);return Math.sin(u*Math.PI);};
function hash(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function kf(t,keys,ease=eio){if(t<=keys[0][0])return keys[0][1];for(let i=0;i<keys.length-1;i++){const a=keys[i],b=keys[i+1];if(t<=b[0])return lerp(a[1],b[1],ease((t-a[0])/(b[0]-a[0])));}return keys[keys.length-1][1];}
function shake(t,amp,f=1){return[(Math.sin(t*1.7*f)+Math.sin(t*2.9*f+1.3)*.6+Math.sin(t*5.3*f+.7)*.3)*amp,(Math.sin(t*1.3*f+2)+Math.sin(t*3.1*f+.4)*.6+Math.sin(t*4.7*f+2.2)*.3)*amp];}
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function camT(c,cx,cy,z,rot=0){c.translate(W/2,H/2);c.rotate(rot);c.scale(z,z);c.translate(-cx,-cy);}
function radial(c,x,y,r,col,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);}
// ألوان الهوية
const C={RED:'255,46,64',AMB:'255,176,96',GRN:'38,232,160',UV:'160,96,255',COLD:'130,165,225',WHT:'235,240,255'};

// ===== أشكال =====
function bustPath(c,x,y,s){c.beginPath();c.moveTo(x-300*s,y);c.bezierCurveTo(x-290*s,y-170*s,x-200*s,y-230*s,x-90*s,y-250*s);c.lineTo(x-55*s,y-300*s);c.bezierCurveTo(x-125*s,y-340*s,x-125*s,y-525*s,x,y-530*s);c.bezierCurveTo(x+125*s,y-525*s,x+125*s,y-340*s,x+55*s,y-300*s);c.lineTo(x+90*s,y-250*s);c.bezierCurveTo(x+200*s,y-230*s,x+290*s,y-170*s,x+300*s,y);c.closePath();}
function figureFill(c,x,y,h){const s=h/760;c.beginPath();
 c.moveTo(x-30*s,y-668*s);c.lineTo(x-30*s,y-628*s);c.quadraticCurveTo(x-120*s,y-622*s,x-128*s,y-585*s);
 c.lineTo(x-142*s,y-430*s);c.lineTo(x-134*s,y-298*s);c.lineTo(x-112*s,y-298*s);c.lineTo(x-104*s,y-430*s);c.lineTo(x-92*s,y-520*s);
 c.lineTo(x-82*s,y-370*s);c.lineTo(x-90*s,y-330*s);c.lineTo(x-80*s,y-10*s);c.lineTo(x-36*s,y);c.lineTo(x-30*s,y-10*s);c.lineTo(x-8*s,y-300*s);
 c.lineTo(x+8*s,y-300*s);c.lineTo(x+30*s,y-10*s);c.lineTo(x+36*s,y);c.lineTo(x+80*s,y-10*s);c.lineTo(x+90*s,y-330*s);c.lineTo(x+82*s,y-370*s);
 c.lineTo(x+92*s,y-520*s);c.lineTo(x+104*s,y-430*s);c.lineTo(x+112*s,y-298*s);c.lineTo(x+134*s,y-298*s);c.lineTo(x+142*s,y-430*s);
 c.lineTo(x+128*s,y-585*s);c.quadraticCurveTo(x+120*s,y-622*s,x+30*s,y-628*s);c.lineTo(x+30*s,y-668*s);c.closePath();c.fill();
 c.beginPath();c.ellipse(x,y-700*s,46*s,54*s,0,0,Math.PI*2);c.fill();}
function bubblePath(c,x,y,w,h,r){c.beginPath();rr(c,x-w/2,y-h/2,w,h,r);c.moveTo(x-w*.2,y+h/2-2);c.lineTo(x-w*.02,y+h/2-2);c.lineTo(x-w*.32,y+h/2+h*.38);c.closePath();}
function maskIcon(c,x,y,r,col,a){ // وجه مجوّف: حساب وهمي
 c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=r*.12;c.beginPath();c.ellipse(x,y,r*.8,r,0,0,Math.PI*2);c.stroke();
 c.fillStyle=col;c.beginPath();c.ellipse(x-r*.32,y-r*.15,r*.18,r*.11,.25,0,Math.PI*2);c.ellipse(x+r*.32,y-r*.15,r*.18,r*.11,-.25,0,Math.PI*2);c.fill();c.restore();}
function checkIcon(c,x,y,s,u,col){c.save();c.strokeStyle=col;c.lineWidth=s*.16;c.lineCap='round';c.lineJoin='round';
 const p=[[-.5,0],[-.15,.35],[.55,-.4]];const L1=Math.hypot(.35,.35),L2=Math.hypot(.7,.75),T=L1+L2;let d=u*T;c.beginPath();c.moveTo(x+p[0][0]*s,y+p[0][1]*s);
 if(d<=L1){const k=d/L1;c.lineTo(x+lerp(p[0][0],p[1][0],k)*s,y+lerp(p[0][1],p[1][1],k)*s);}else{c.lineTo(x+p[1][0]*s,y+p[1][1]*s);const k=(d-L1)/L2;c.lineTo(x+lerp(p[1][0],p[2][0],k)*s,y+lerp(p[1][1],p[2][1],k)*s);}c.stroke();c.restore();}
function chainIcon(c,x,y,s,col,a){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=s*.13;c.translate(x,y);c.rotate(-.7);
 c.beginPath();rr(c,-s*.95,-s*.28,s*1.05,s*.56,s*.28);c.stroke();c.beginPath();rr(c,-s*.1,-s*.28,s*1.05,s*.56,s*.28);c.stroke();c.restore();}
function lensIcon(c,x,y,r,col,a){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=r*.14;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();
 c.lineCap='round';c.lineWidth=r*.24;c.beginPath();c.moveTo(x+r*.75,y+r*.75);c.lineTo(x+r*1.5,y+r*1.5);c.stroke();c.restore();}
function shieldPath(c,cx,cy,w,h){const t=cy-h/2;c.beginPath();c.moveTo(cx,t);c.quadraticCurveTo(cx+w*.25,t+h*.06,cx+w/2,t+h*.02);
 c.lineTo(cx+w/2,t+h*.45);c.bezierCurveTo(cx+w/2,t+h*.75,cx+w*.2,t+h*.9,cx,t+h);c.bezierCurveTo(cx-w*.2,t+h*.9,cx-w/2,t+h*.75,cx-w/2,t+h*.45);
 c.lineTo(cx-w/2,t+h*.02);c.quadraticCurveTo(cx-w*.25,t+h*.06,cx,t);c.closePath();}
