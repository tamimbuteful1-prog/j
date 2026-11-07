// التصيير: 0–44 من الطبقات الجديدة + 44–60 من الفيديو الأصلي (تطبيق معيار والخاتمة) + الصوت الأصلي
// node render.js <master_original.mp4> <out.mp4>
const {chromium}=require('playwright');const {spawn,spawnSync}=require('child_process');const path=require('path');
(async()=>{const [orig,out]=process.argv.slice(2);const FPS=30,N=44*FPS;const seg=path.join(path.dirname(out),'v2_seg.mp4');
 const ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','slow','-crf','15','-pix_fmt','yuv420p',seg],{stdio:['pipe','ignore','inherit']});
 const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage();await p.goto('file://'+path.resolve(__dirname,'index.html')+'?render');await p.evaluate(()=>assetsReady);
 const t0=Date.now();for(let i=0;i<N;i++){const d=await p.evaluate(t=>frameAt(t),i/FPS);const buf=Buffer.from(d.split(',')[1],'base64');if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%150==0)console.log('frame',i,((Date.now()-t0)/1000|0)+'s');}
 ff.stdin.end();await b.close();await new Promise(r=>ff.on('close',r));
 const r=spawnSync('ffmpeg',['-y','-v','error','-i',seg,'-ss','44','-i',orig,'-i',path.resolve(__dirname,'../audio.wav'),
  '-filter_complex','[1:v]trim=duration=16,setpts=PTS-STARTPTS[b];[0:v][b]concat=n=2:v=1:a=0,format=yuv420p[v]','-map','[v]','-map','2:a',
  '-c:v','libx264','-preset','slow','-b:v','10M','-maxrate','14M','-bufsize','20M','-r','30','-c:a','aac','-b:a','256k','-movflags','+faststart','-t','60',out],{stdio:'inherit'});
 console.log('done',r.status,((Date.now()-t0)/1000|0)+'s');})();
