// Simulated provider replies (demo only — no real key, no real request leaves the browser).
const SAMPLE = 'إعلان: منتجنا الطبيعي يعالج السكري نهائيًا خلال أسبوع ودون مراجعة الطبيب. عرض حصري للمستهلك لفترة محدودة، اطلبه الآن عبر الرابط.';
function buildResult(userMsg){
  const i = userMsg.indexOf('{'); const payload = JSON.parse(userMsg.slice(i));
  const refs = payload.references || [];
  const PREF=[['av-media-exec-reg:9#2','ألا تنطوي أية دعاية أو أي إعلان على أي تضليل'],['press-law-exec-reg:73','لا يجوز نشر إعلانات تتضمن مواد من شأنها تضليل المستهلك'],['av-media-exec-reg:19','عدم احتواء بث المرخص لهم على أي معلومات كاذبة أو مضللة']];
  console.log('REFS', refs.map(r=>r.segment_id).join(' '));
  for (const [id,ph] of PREF){ const r=refs.find(x=>x.segment_id===id); if(r && r.text.includes(ph)) return mk(r.segment_id, ph); }
  const kw = ['إعلان','مضلل','الصحة','غش','تضليل','الإعلانات'];
  let seg = null, q = null;
  for (const k of kw){ for (const r of refs){ const t=r.text||''; const j=t.indexOf(k); if(j>=0){ seg=r; const s=Math.max(0,j-30); q=t.slice(s,Math.min(t.length,s+110)); break;} } if(seg)break; }
  if(!seg){ seg=refs[0]; q=(seg.text||'').slice(0,100); }
  q = q.replace(/^\S*\s/,'').replace(/\s\S*$/,'');
  return mk(seg.segment_id,q);
}
function mk(sid,q){
  return {
    classification:'conflict_indicators',
    summary:'يتضمن النص ادعاءً علاجيًا قاطعًا في سياق إعلان تجاري، وقد يُعدّ تضليلًا وفق المراجع المرفقة.',
    direct_answer:null,
    findings:[{
      user_excerpt:'يعالج السكري نهائيًا خلال أسبوع ودون مراجعة الطبيب',
      issue:'ادعاء صحي قاطع غير مثبت داخل محتوى إعلاني.',
      citations:[{segment_id:sid, quote:q}],
      interpretation:'المادة تمنع نشر إعلانات تتضمن ما قد يضلل المستهلك، والادعاء العلاجي القاطع دون دليل قد يندرج تحت ذلك.',
      suggested_rewrite:'منتج طبيعي قد يساعد ضمن نمط حياة صحي، ولا يغني عن استشارة الطبيب.'
    }],
    conditions_and_exceptions:[], unresolved:[], missing_information:[],
    limitations:'تقييم مساعد في حدود المراجع المرفقة فقط.'
  };
}
const cors = {'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS','content-type':'application/json'};
async function install(page, log){
  await page.route(/https:\/\/api\.(openai|anthropic)\.com\/.*/, async (route)=>{
    const req = route.request(); const url=req.url();
    if (req.method()==='OPTIONS') return route.fulfill({status:204, headers:cors});
    log && log('MOCK '+req.method()+' '+url);
    if (url.includes('/v1/models')) {
      const ids = url.includes('anthropic') ? ['claude-sonnet-5-5','claude-haiku-5-5','claude-opus-5-5'] : ['gpt-6','gpt-6-mini'];
      return route.fulfill({status:200, headers:cors, body:JSON.stringify({data:ids.map(id=>({id}))})});
    }
    const body = JSON.parse(req.postData()||'{}');
    await new Promise(r=>setTimeout(r,2500));
    if (url.includes('anthropic')) {
      const res = buildResult(body.messages[0].content);
      return route.fulfill({status:200, headers:cors, body:JSON.stringify({content:[{type:'text',text:JSON.stringify(res)}], usage:{input_tokens:5210,output_tokens:640}, stop_reason:'end_turn'})});
    }
    const res = buildResult(body.input);
    return route.fulfill({status:200, headers:cors, body:JSON.stringify({output_text:JSON.stringify(res), status:'completed', usage:{input_tokens:5180,output_tokens:610}})});
  });
}
module.exports = { install, SAMPLE };
