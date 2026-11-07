// ===== الأصول: الشهادة، صورة صاحب المبادرة، تسجيل منصة معيار =====
const IMG={};
function loadImg(k,src){return new Promise(r=>{const im=new Image();im.onload=()=>{IMG[k]=im;r();};im.onerror=()=>r();im.src=src;});}
const VID=document.createElement('video');VID.muted=true;VID.preload='auto';VID.playsInline=true;VID.src='assets/miyar.webm';
let TAPS={"vw": 390, "vh": 664, "taps": [{"t": 0.75, "x": 286.6015625, "y": 295.1875}, {"t": 7.55, "x": 195, "y": 260}, {"t": 9.45, "x": 195, "y": 653.0703125}], "scroll": [[0, 0], [1, 0], [2.4, 1450], [6.4, 2750], [7.3, 4388.8828125]]}; // من capture_miyar.js
window.assetsReady=Promise.all([loadImg('cert','assets/certificate.jpg'),loadImg('tamim','assets/tamim.png'),
 new Promise(r=>{VID.addEventListener('loadeddata',r,{once:true});VID.addEventListener('error',r,{once:true});VID.load();})]);
function img(k){return IMG[k];}
// ضبط إطار الفيديو قبل الرسم (للتصيير الحتمي)
function seekVid(u){const tt=Math.max(0,Math.min(9.95,u));if(Math.abs(VID.currentTime-tt)<1e-3)return Promise.resolve();
 return new Promise(r=>{VID.addEventListener('seeked',()=>r(),{once:true});VID.currentTime=tt;});}
