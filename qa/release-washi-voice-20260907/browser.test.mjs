import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='qa/release-washi-voice-20260907',base=process.env.QA_BASE||'http://127.0.0.1:4175',mode=process.env.QA_MODE||'local';
const {execFileSync}=await import('node:child_process');
const baseline=execFileSync('git',['show','f425a17:index.html'],{encoding:'utf8'});
const preview='/index.html',report={date:new Date().toISOString(),views:[],errors:[],interactions:[]};
const sections=['builtProof','entrance','reason','lineup','works','voice','nara','faq','instagram','news','visit','footer'];
const selector=id=>id==='entrance'?'.entrance':id==='news'?'.news':id==='footer'?'.site-footer':'#'+id;
const quick=process.argv.includes('--quick');
async function ready(page,id){
 const el=page.locator(selector(id));
 await el.evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-90));
 await el.locator('img').evaluateAll(xs=>Promise.all(xs.map(i=>{i.loading='eager';return i.decode().catch(()=>{});})));await page.waitForTimeout(220);
}
async function inventory(page){return await page.locator('main').evaluate(e=>{
 const c=e.cloneNode(true);c.querySelectorAll('#voice,.wg-paper,.wg-motif,[data-rail-clone],.ig-gallery,.new-hero__media').forEach(n=>n.remove());
 return {text:c.textContent.replace(/\s+/g,' ').trim(),links:[...c.querySelectorAll('a')].map(a=>[a.getAttribute('href'),a.textContent.replace(/\s+/g,' ').trim()])};
});}
for(const [engine,type,widths] of [['chromium',chromium,quick?[1440,390]:[320,390,768,1024,1440,1920]],['webkit',webkit,quick?[]:[390,1440]]]){
 if(!widths.length)continue;const browser=await type.launch({headless:true});
 try{for(const width of widths){
  console.log('Checking',engine,width);
  const height=width<768?844:900;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push({engine,width,error:e.message}));
  await page.route('**/api/instagram',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"Local visual QA: safe unavailable state"}'}));
  await page.route('**/__release-baseline.html',r=>r.fulfill({contentType:'text/html',body:baseline}));
  await page.goto(base+'/__release-baseline.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  const before=await inventory(page);
  if(false)for(const id of ['reason','lineup','visit']){await ready(page,id);await page.screenshot({path:`${dir}/before-${width}-${id}.png`,scale:'css'});}
  await page.goto(base+preview,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  assert.deepEqual(await inventory(page),before,'Copy and destinations unchanged');
  for(const id of sections){
   await ready(page,id);
   const metrics=await page.locator(selector(id)).evaluate(e=>{
    const rect=r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height});
    const sr=e.getBoundingClientRect();
    const art=[...e.querySelectorAll('.wg-motif')].map(a=>{const r=a.getBoundingClientRect();const s=getComputedStyle(a);return {name:a.className,...rect(r),withinViewport:r.left>=-1&&r.right<=innerWidth+1,withinSection:r.top>=sr.top-1&&r.bottom<=sr.bottom+1,pointerEvents:s.pointerEvents,mask:s.maskMode};});
    const collisions=[];
    for(const bird of e.querySelectorAll('.wg-swallow')){const a=bird.getBoundingClientRect();for(const text of e.querySelectorAll('h2,h3,p,summary,button,a')){if(text.children.length&&text.textContent.trim()==='')continue;const range=document.createRange();range.selectNodeContents(text);for(const b of range.getClientRects()){if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)collisions.push({art:bird.className,text:text.textContent.trim().slice(0,80)});}}}
    return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,art,collisions:[...new Map(collisions.map(v=>[v.text,v])).values()]};
   });
   report.views.push({engine,width,id,...metrics});
   assert(metrics.documentWidth<=width,`${id}: horizontal overflow`);
   assert(metrics.art.every(x=>x.withinViewport&&x.withinSection),`${id}: motif outside frame ${JSON.stringify(metrics.art)}`);
   if([390,1440].includes(width))await page.screenshot({path:`${dir}/${mode}-${engine}-${width}-${id}.png`,scale:'css'});
   assert.deepEqual(metrics.collisions,[],`${id}: decoration overlaps text`);
   if(id==='voice'){assert.equal(await page.locator('.voice-reference__card').count(),4);assert.equal(await page.locator('.voice-reference__quote').first().evaluate(e=>getComputedStyle(e).fontSize),width<768?'11px':'14px');await page.locator('.voice-reference__footer').scrollIntoViewIfNeeded();if([390,1440].includes(width))await page.screenshot({path:`${dir}/${mode}-${engine}-${width}-voice-lower.png`,scale:'css'});}
   if(quick)continue;
  }
  if(!quick){
   await ready(page,'nara');await page.getByLabel('鶴橋',{exact:true}).check();assert.deepEqual(await page.locator('[data-minutes]').allTextContents(),['16','22','35']);await page.getByLabel('大阪難波',{exact:true}).check();
   await page.locator('.nara-atlas__source summary').click();assert(await page.locator('[data-source-origin]').isVisible());await page.locator('.nara-atlas__source summary').click();
   await ready(page,'faq');const faq=page.locator('#faq details').first();await faq.locator('summary').click();assert.equal(await faq.getAttribute('open'),'');await faq.locator('summary').click();
   await ready(page,'visit');await page.locator('.visit [data-contact="reserve"]').click();assert(await page.locator('#contactDialog').isVisible());await page.keyboard.press('Escape');assert(!(await page.locator('#contactDialog').isVisible()));
   await ready(page,'entrance');assert(await page.locator('#cardMotion').isDisabled());
   // Existing rail deliberately remains paused after a reduced-motion preference change.
   // Check default autoplay in a fresh normal-motion visit, not by overriding that safety rule.
   await page.emulateMedia({reducedMotion:'no-preference'});await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);const rail=page.locator('#entryCards');await rail.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForTimeout(400);
   const start=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(650);assert(await rail.evaluate(e=>e.scrollLeft)>start+5,'Rail auto-start');
   await rail.dispatchEvent('pointerdown',{pointerType:'touch'});const stopped=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(250);assert(Math.abs(await rail.evaluate(e=>e.scrollLeft)-stopped)<1,'Touch pauses');
   await page.locator('#entryNext').click();await page.waitForTimeout(500);assert(await rail.evaluate(e=>e.scrollLeft)>stopped+10,'Next navigation');
   for(const id of ['reason','lineup','works','visit']){await ready(page,id);const coverage=await page.locator(selector(id)+' [data-deep-frame]').evaluateAll(xs=>xs.map(f=>{const img=f.querySelector('img'),a=f.getBoundingClientRect(),b=img.getBoundingClientRect();return img.naturalWidth>0&&b.left<=a.left+1&&b.right>=a.right-1&&b.top<=a.top+1&&b.bottom>=a.bottom-1;}));assert(coverage.every(Boolean),`Motion coverage ${id}`);}
   report.interactions.push({engine,width,atlas:'both origins and disclosure',faq:'expand/close',contact:'open/Escape',rail:'reduced motion, autoplay, touch pause, next',photos:'no uncovered parallax frame'});
  }
  if(!quick&&[390,1440].includes(width)){
   for(const id of ['v01','v02','v08','v33']){await page.goto(base+preview,{waitUntil:'domcontentloaded'});await page.locator(`#voice a[href="voice.html#${id}"]`).click();await page.locator('#vm').waitFor({state:'visible'});assert(page.url().endsWith('voice.html#'+id));await page.keyboard.press('Escape');}
   await page.goto(base+preview,{waitUntil:'domcontentloaded'});await page.locator('.voice-reference__all').click();await page.waitForFunction(()=>document.querySelectorAll('.vo').length===50);
   report.interactions.push({engine,width,voice:'4 answer modals, Escape, list 50'});
  }
  await page.close();
 }}finally{await browser.close();fs.writeFileSync(`${dir}/${mode}-${quick?'quick':'browser'}-report.json`,JSON.stringify(report,null,2)+'\n');}
}
assert.deepEqual(report.errors,[]);
console.log(JSON.stringify({views:report.views.length,collisions:report.views.filter(x=>x.collisions.length).map(({engine,width,id,collisions})=>({engine,width,id,collisions})),errors:report.errors}));
