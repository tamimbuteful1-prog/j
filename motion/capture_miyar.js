// تسجيل تصفّح منصة معيار من جوال (390×844 @2x) إطارًا بإطار → assets/miyar.webm + assets/miyar_taps.json
const {chromium,devices}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');const path=require('path');
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,inv=(a,b,x)=>Math.max(0,Math.min(1,(x-a)/(b-a))),lerp=(a,b,t)=>a+(b-a)*t;
(async()=>{const FPS=30,DUR=10,N=FPS*DUR;
 const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],locale:'ar-SA',deviceScaleFactor:2});const p=await c.newPage();
 await p.goto('https://tamimimpact.com/',{waitUntil:'networkidle',timeout:60000});await p.waitForTimeout(2000);
 const R=async s=>p.evaluate(s=>{const e=[...document.querySelectorAll(s.q)].find(e=>!s.t||(e.innerText||'').includes(s.t));if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2+scrollY,w:r.width,h:r.height};},s);
 const btn=await R({q:'a',t:'معيار'}),ta=await R({q:'textarea'}),chk=await R({q:'button',t:'افحص النص'});
 const vh=844;const Y1=1450,Y2=2750,Y3=ta.y-260;
 const scrollAt=t=>t<1.0?0:t<2.4?lerp(0,Y1,ease(inv(1.0,2.4,t))):t<6.4?lerp(Y1,Y2,inv(2.4,6.4,t)):t<7.3?lerp(Y2,Y3,ease(inv(6.4,7.3,t))):Y3;
 const TXT='كلهم نفس الشي… ما فيهم خير!';
 const taps=[{t:.75,x:btn.x,y:btn.y},{t:7.55,x:ta.x,y:ta.y-Y3},{t:9.45,x:chk.x,y:chk.y-Y3}];
 fs.writeFileSync(path.join(__dirname,'assets/miyar_taps.json'),JSON.stringify({vw:390,vh,taps,scroll:[[0,0],[1,0],[2.4,Y1],[6.4,Y2],[7.3,Y3]]}));
 const ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libvpx-vp9','-b:v','4M','-row-mt','1','-deadline','good','-cpu-used','2','-pix_fmt','yuv420p','assets/miyar.webm'],{cwd:__dirname,stdio:['pipe','ignore','inherit']});
 for(let i=0;i<N;i++){const t=i/FPS;const y=scrollAt(t);await p.evaluate(y=>window.scrollTo(0,y),y);
  const k=Math.floor(inv(7.75,9.2,t)*TXT.length);await p.evaluate(v=>{const e=document.querySelector('textarea');if(e&&e.value!==v){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},TXT.slice(0,k));
  await p.waitForTimeout(25);const buf=await p.screenshot({type:'jpeg',quality:90});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('ok',JSON.stringify({btn,ta,chk,Y3}));})();
