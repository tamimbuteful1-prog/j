const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/anim.html');await p.evaluate(()=>document.fonts.ready);
const ts=process.argv.slice(2).map(Number);
for(const t of ts){await p.evaluate(t=>render(t),t);await p.screenshot({path:`/tmp/claude-0/-home-user-j/531f17ec-bc70-58ea-9252-00eef9588fc7/scratchpad/pv_${t}.png`});}
await b.close();})();
