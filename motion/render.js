// تصيير الحلقة إطارًا بإطار ثم دمجها مع الصوت: node render.js
const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
(async()=>{const FPS=30,DUR=60,N=FPS*DUR;
 const ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-i','audio.wav',
  '-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-profile:v','high','-movflags','+faststart',
  '-c:a','aac','-b:a','256k','-shortest','digital-border-soldier.mp4'],{cwd:__dirname,stdio:['pipe','inherit','inherit']});
 const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage();await p.goto('file://'+path.resolve(__dirname,'index.html')+'?render');await p.evaluate(()=>fontsReady);
 const t0=Date.now();
 for(let i=0;i<N;i++){const d=await p.evaluate(t=>frameAt(t),i/FPS);const buf=Buffer.from(d.split(',')[1],'base64');
  if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%150==0)console.log('frame',i,((Date.now()-t0)/1000).toFixed(0)+'s');}
 ff.stdin.end();await b.close();await new Promise(r=>ff.on('close',r));console.log('done',((Date.now()-t0)/1000).toFixed(0)+'s');})();
