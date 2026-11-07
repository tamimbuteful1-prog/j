const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()=='error')errs.push(m.text())});
 await p.goto('file://'+path.resolve(__dirname,'index.html')+'?render');await p.evaluate(()=>fontsReady);
 const out=process.argv[2];const ts=process.argv.slice(3).map(Number);
 for(const t of ts){const t0=Date.now();const d=await p.evaluate(t=>frameAt(t),t);fs.writeFileSync(`${out}/f_${t.toFixed(2)}.jpg`,Buffer.from(d.split(',')[1],'base64'));console.log(t,Date.now()-t0,'ms');}
 console.log('errors:',errs);await b.close();})();
