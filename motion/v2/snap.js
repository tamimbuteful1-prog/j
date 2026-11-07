const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()=='error')errs.push(m.text())});
 await p.goto('file://'+path.resolve(__dirname,'index.html')+'?render');await p.evaluate(()=>assetsReady);
 const out=process.argv[2];for(const t of process.argv.slice(3).map(Number)){const d=await p.evaluate(t=>frameAt(t),t);fs.writeFileSync(`${out}/f_${t.toFixed(2)}.jpg`,Buffer.from(d.split(',')[1],'base64'));}
 console.log('errors:',errs);await b.close();})();
