import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.WORKS_URL||'http://127.0.0.1:8938';
const phase=process.env.WORKS_PHASE||'verified';const out=`qa/works-freeform-20260909/${phase}`;await mkdir(out,{recursive:true});
const results=[];let failures=0;
const labels=['外観・外構','リビング・ダイニング','キッチン・ダイニング','施工事例をすべて見る'];
async function ready(page,error=false,nojs=false){
 await page.goto(base+'/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 await page.locator('#works').scrollIntoViewIfNeeded();
 if(error)await page.waitForFunction(()=>document.querySelectorAll('#works .is-error').length===3);
 else if(nojs) await page.waitForFunction(()=>[...document.querySelectorAll('#works img')].every(i=>i.complete&&i.naturalWidth>0));
 else await page.locator('#works').evaluate(async e=>{await Promise.all([...e.querySelectorAll('img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
}
async function verify(page,{width,height,engine,state},errors){
 const metrics=await page.locator('#works').evaluate(section=>{
   const problems=[];const sr=section.getBoundingClientRect();
   for(const el of section.querySelectorAll('.wf26__english,#worksTitle,.wf26__note,.wf26__caption>span,.wf26__all>span')){
    const range=document.createRange();range.selectNodeContents(el);
    for(const r of range.getClientRects())if(r.left<-.5||r.right>innerWidth+.5||r.top<sr.top-.5||r.bottom>sr.bottom+.5)problems.push({text:el.textContent,rect:r.toJSON()});
   }
   return {size:[section.clientWidth,section.clientHeight],horizontalOverflow:document.documentElement.scrollWidth>innerWidth,textProblems:problems,images:[...section.querySelectorAll('img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,transform:getComputedStyle(i).transform,animation:getComputedStyle(i).animationName})),links:[...section.querySelectorAll('a')].map(a=>({href:a.getAttribute('href'),label:a.getAttribute('aria-labelledby')?document.getElementById(a.getAttribute('aria-labelledby')).textContent:a.textContent.trim(),width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height}))};
 });
 assert(!metrics.horizontalOverflow,'horizontal overflow');assert.equal(metrics.textProblems.length,0,'text out of bounds');assert.equal(metrics.links.length,4);assert.deepEqual(metrics.links.map(x=>x.label),labels);assert(metrics.links.every(x=>x.href==='works.html'&&x.width>=44&&x.height>=44),'link size/destination');assert(metrics.images.every(x=>x.transform==='none'&&x.animation==='none'),'photograph must stay level and still');
 if(state!=='error')assert(metrics.images.every(x=>x.loaded),'photos must load');
 if(state!=='no-js') await page.evaluate(()=>{window.__worksClicks=[];window.__worksClickHandler=e=>{const a=e.target.closest('#works a');if(a){e.preventDefault();window.__worksClicks.push(a.getAttribute('href'));}};document.addEventListener('click',window.__worksClickHandler);});
 const hits=[];for(let i=0;i<4;i++){
  const anchor=page.locator('#works a').nth(i);const target=i<3?anchor.locator('.wf26__caption'):anchor;
  await target.scrollIntoViewIfNeeded();
  const hit=await target.evaluate(t=>{const r=t.getBoundingClientRect(),a=t.closest('a');return {label:a.textContent.trim(),height:r.height,points:[[r.left+4,r.top+4],[r.right-4,r.top+4],[r.left+4,r.bottom-4],[r.right-4,r.bottom-4],[(r.left+r.right)/2,(r.top+r.bottom)/2]].map(([x,y])=>({x,y,hit:document.elementFromPoint(x,y)?.closest('a')===a}))};});
  assert(hit.height>=44,'caption minimum 44px');assert(hit.points.every(p=>p.hit),'clipped/obscured caption');
  if(state!=='no-js') await target.click();hits.push(hit);
 }
 if(state!=='no-js') assert.equal(await page.evaluate(()=>window.__worksClicks.length),4,'four pointer interactions');
 if(state!=='no-js') await page.evaluate(()=>document.removeEventListener('click',window.__worksClickHandler));
 const focus=[];await page.locator('#works a').first().focus();await page.keyboard.press('Shift');
 for(let i=0;i<4;i++){
   const f=await page.evaluate(()=>{const a=document.activeElement,c=a.querySelector('.wf26__caption')||a;return{label:a.getAttribute('aria-labelledby')?document.getElementById(a.getAttribute('aria-labelledby')).textContent:a.textContent.trim(),focusVisible:a.matches(':focus-visible'),outline:getComputedStyle(c).outlineStyle}});
   assert.equal(f.label,labels[i]);assert(f.focusVisible&&f.outline!=='none','visible keyboard focus');focus.push(f);if(i<3)await page.keyboard.press(engine==='webkit'?'Alt+Tab':'Tab');
 }
 await page.screenshot({path:`${out}/focus-${engine}-${state}-${width}-${height}.png`});
 const fullHeight=Math.max(height,metrics.size[1]+180);await page.setViewportSize({width,height:fullHeight});
 await page.locator('#works a').last().blur();await page.locator('#works').screenshot({path:`${out}/works-${engine}-${state}-${width}-${height}.png`,animations:'disabled',style:'.site-header{visibility:hidden!important}'});
 await page.setViewportSize({width,height});await page.evaluate(()=>{const y=document.querySelector('#works').getBoundingClientRect().top+scrollY;scrollTo({top:y-78,behavior:'instant'});});
 await page.screenshot({path:`${out}/viewport-${engine}-${state}-${width}-${height}.png`,animations:'disabled'});
 if((width===1440||width===390)&&['normal','no-js'].includes(state)){
  await page.locator('#works .wf26__all').click();await page.waitForURL(/\/works(?:\.html)?$/);await page.getByRole('heading',{name:'施工事例',exact:true,level:1}).waitFor();
 }
 assert.equal(errors.length,0,'page errors');
 return {engine,state,width,height,...metrics,captionHitChecks:hits.length*5,pointerLinks:state==='no-js'?1:4,keyboardFocus:focus,keyboardStrategy:engine==='webkit'?'Option+Tab (macOS full keyboard navigation)':'Tab',errors};
}
for(const [engine,type] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.WORKS_ENGINE||name===process.env.WORKS_ENGINE)){
 const browser=await type.launch();
 const cases=engine==='chromium'?
  [[1440,1080,'normal'],[1024,900,'normal'],[768,1024,'normal'],[390,844,'normal'],[320,740,'normal'],[390,664,'normal'],[1440,1080,'error'],[390,844,'error'],[1440,1080,'reduced'],[390,844,'reduced'],[1440,1080,'no-js'],[390,844,'no-js']]:[[1440,1080,'normal'],[390,844,'normal']];
 for(const [width,height,state] of cases.filter(c=>!process.env.WORKS_STATE||process.env.WORKS_STATE.split(',').includes(c[2]))){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:state==='normal'?'no-preference':'reduce',javaScriptEnabled:state!=='no-js',isMobile:width<768,hasTouch:width<768});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   if(state==='error')await page.route(/\/art-direction\/(garden-exterior|living-wide|dining-wide)-\d+\.webp/,r=>r.abort('failed'));
   await ready(page,state==='error',state==='no-js');const checked=await verify(page,{width,height,engine,state},errors);
   if(state==='error'&&width===390){await page.unrouteAll();await page.setViewportSize({width:1440,height:1080});await page.waitForFunction(()=>[...document.querySelectorAll('#works img')].every(i=>i.complete&&i.naturalWidth>0)&&document.querySelectorAll('#works .is-error').length===0);checked.responsiveImageRecovery=true;}
   results.push(checked);console.log(`${engine} ${state} ${width}x${height}: PASS`);
  }catch(e){failures++;results.push({engine,state,width,height,error:e.stack,errors});console.log(`${engine} ${state} ${width}x${height}: FAIL ${e.message}`);await page.screenshot({path:`${out}/failed-${engine}-${state}-${width}-${height}.png`}).catch(()=>{});}
  await context.close();
 }
 await browser.close();
}
await writeFile(`${out}/results.json`,JSON.stringify({base,results,failures},null,2)+'\n');if(failures)process.exitCode=1;
