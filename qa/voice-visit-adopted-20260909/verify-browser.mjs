import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ADOPTED_URL||'http://127.0.0.1:8947',phase=process.env.ADOPTED_PHASE||'verified';
const out=`qa/voice-visit-adopted-20260909/${phase}`;await mkdir(out,{recursive:true});
const records=JSON.parse(await readFile('data/voices.json','utf8')).voices;
const results=[];let failures=0;
async function ready(page,id,state){
 await page.locator('#'+id).scrollIntoViewIfNeeded();
 await page.waitForFunction(({id,state})=>[...document.querySelectorAll('#'+id+' img')].filter(i=>i.getClientRects().length).every(i=>i.complete&&(state==='error'||i.naturalWidth>0)),{id,state});
}
for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
 const b=await type.launch();
 const cases=engine==='chromium'?[[1440,1080,'normal'],[1024,900,'normal'],[768,1024,'normal'],[390,844,'normal'],[320,740,'normal'],[390,664,'normal'],[1440,1080,'error'],[390,844,'error'],[1440,1080,'reduced'],[390,844,'reduced'],[1440,1080,'no-js'],[390,844,'no-js']]:[[1440,1080,'normal'],[390,844,'normal']];
 for(const [width,height,state] of cases.filter(c=>!process.env.ADOPTED_STATE||process.env.ADOPTED_STATE.split(',').includes(c[2]))){
  const ctx=await b.newContext({viewport:{width,height},isMobile:width<768,hasTouch:width<768,javaScriptEnabled:state!=='no-js',reducedMotion:state==='normal'?'no-preference':'reduce'});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
   if(state==='error')await p.route(/\/(art-direction\/(garden-exterior|living-wide)-\d+|sakyo-living-\d+)\.webp/,r=>r.abort('failed'));
   await p.goto(base+'/',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
   const sections=[];
   for(const id of ['voice','visit']){
    await ready(p,id,state);
    const metrics=await p.locator('#'+id).evaluate(s=>{
     const r=s.getBoundingClientRect(),problems=[];for(const e of s.querySelectorAll('h2,h3,blockquote,p,.vb26__all>span,.va26__button>span,.va26__phone>a>span')){
      const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let t;while(t=walker.nextNode()){const range=document.createRange();range.selectNode(t);for(const q of range.getClientRects())if(q.width&&(q.left<-.5||q.right>innerWidth+.5||q.top<r.top-.5||q.bottom>r.bottom+.5))problems.push(t.textContent);}
     }
     return {id:s.id,height:r.height,overflow:document.documentElement.scrollWidth>innerWidth,problems,images:[...s.querySelectorAll('img')].filter(i=>i.getClientRects().length).map(i=>({loaded:i.complete&&i.naturalWidth>0,transform:getComputedStyle(i).transform,animation:getComputedStyle(i).animationName,failed:i.parentElement.classList.contains('is-error'),fallbackHidden:i.nextElementSibling.hidden})),links:[...s.querySelectorAll('a')].map(a=>({href:a.getAttribute('href'),width:a.offsetWidth,height:a.offsetHeight}))};
    });
    assert(!metrics.overflow);assert.equal(metrics.problems.length,0,`text outside ${id}`);assert(metrics.links.every(l=>l.width>=44&&l.height>=44),'44px targets');assert(metrics.images.every(i=>i.transform==='none'&&i.animation==='none'));
    if(state==='error')assert(metrics.images.every(i=>i.failed&&!i.fallbackHidden),'visible photo failure handling');else assert(metrics.images.every(i=>i.loaded),'photo load');
    const targets=p.locator(`#${id} a`);let textHits=0;
    for(let n=0;n<await targets.count();n++){
     const a=targets.nth(n);await a.scrollIntoViewIfNeeded();
     const hits=await a.evaluate(a=>{
      const points=[],walker=document.createTreeWalker(a,NodeFilter.SHOW_TEXT);let t;
      while(t=walker.nextNode()){if(!t.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(t);for(const r of range.getClientRects()){if(!r.width)continue;for(const x of [r.left+2,(r.left+r.right)/2,r.right-2]){const y=(r.top+r.bottom)/2;points.push({text:t.textContent,hit:document.elementFromPoint(x,y)?.closest('a')===a,x,y});}}}
      const arrow=a.querySelector('.vb26__arrow');if(arrow){const r=arrow.getBoundingClientRect();points.push({text:'arrow',hit:document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2)?.closest('a')===a});}return points;
     });
     assert(hits.every(h=>h.hit),`obscured/clipped ${id} text: ${JSON.stringify(hits.filter(h=>!h.hit))}`);textHits+=hits.length;
    }
    metrics.textHitChecks=textHits;
    await targets.first().focus();await p.keyboard.press('Shift');
    for(let n=0;n<await targets.count();n++){
     const focus=await p.evaluate(()=>{const a=document.activeElement;return{href:a.getAttribute('href'),visible:a.matches(':focus-visible'),outline:getComputedStyle(a).outlineStyle,paper:getComputedStyle(a,'::after').borderTopStyle};});
     assert.equal(focus.href,metrics.links[n].href,'keyboard order');assert(focus.visible&&(focus.outline!=='none'||focus.paper==='solid'),'visible keyboard focus');if(n+1<await targets.count())await p.keyboard.press(engine==='webkit'?'Alt+Tab':'Tab');
    }
    await p.screenshot({path:`${out}/focus-${id}-${engine}-${state}-${width}-${height}.png`});await targets.last().blur();
    await p.setViewportSize({width,height:Math.max(height,Math.ceil(metrics.height)+180)});await p.locator('#'+id).screenshot({path:`${out}/${id}-${engine}-${state}-${width}-${height}.png`,style:'.site-header{visibility:hidden!important}',animations:'disabled'});await p.setViewportSize({width,height});
    await p.evaluate(id=>scrollTo({top:document.getElementById(id).getBoundingClientRect().top+scrollY-78,behavior:'instant'}),id);await p.screenshot({path:`${out}/viewport-${id}-${engine}-${state}-${width}-${height}.png`,animations:'disabled'});sections.push(metrics);
   }
   let enquiryActions=0;
   if(state!=='no-js')for(const mode of ['reserve','docs']){
    const a=p.locator(`#visit [data-contact="${mode}"]`);await a.click();await p.locator('#contactDialog').waitFor({state:'visible'});assert.equal(await p.locator('#contactTitle').textContent(),mode==='reserve'?'来場予約のご案内':'資料請求のご案内');assert.equal(await p.locator('#contactDialog input').count(),0,'Preserve existing informational dialog, no submission');
    if(mode==='reserve')await p.keyboard.press('Escape');else await p.locator('#contactDialog [data-close]').click();await p.locator('#contactDialog').waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>document.activeElement.dataset.contact),mode,'dialog focus return');enquiryActions++;
   }
   let fullAnswers=0;
   if(state==='normal'&&(width===1440||width===390)&&height!==664){
    for(const id of ['v01','v02','v08','v33']){
     await p.locator(`#voice a[data-voice-id="${id}"]`).click();await p.waitForURL(new RegExp(`/voice(?:\\.html)?#${id}$`));await p.locator('#vm').waitFor({state:'visible'});const body=await p.locator('#vmBody').innerText(),record=records.find(v=>v.id===id);assert(body.includes(record.area)&&body.includes(record.family));assert(body.includes(record.qa[0].a),'Full answer must match the same canonical record');fullAnswers++;await p.goto(base+'/',{waitUntil:'networkidle'});
    }
    await p.locator('#voice .vb26__all').click();await p.waitForURL(/\/voice(?:\.html)?$/);await p.locator('#wall .vo').first().waitFor();
   }
   assert.equal(errors.length,0,'page errors');results.push({engine,state,width,height,sections,enquiryActions,fullAnswers,errors});console.log(`${engine} ${state} ${width}x${height}: PASS`);
  }catch(e){failures++;results.push({engine,state,width,height,error:e.stack,errors});console.log(`${engine} ${state} ${width}x${height}: FAIL ${e.message}`);await p.screenshot({path:`${out}/failed-${engine}-${state}-${width}-${height}.png`}).catch(()=>{});}
  await ctx.close();
 }
 await b.close();
}
await writeFile(`${out}/results.json`,JSON.stringify({base,results,failures},null,2)+'\n');if(failures)process.exitCode=1;
