import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const url=process.env.WORKS_URL||'http://127.0.0.1:4175/works.html',phase=process.env.WORKS_PHASE||'local',dir='qa/works-expansion-20260907';
const report={url,phase,at:new Date().toISOString(),views:[],tests:[],errors:[]};
const counts={home:7,saki:10,shijo:4,sakyo:16,miyamaki:5};
const hash=x=>createHash('sha256').update(x).digest('hex');
async function screen(p,selector,name){await p.locator(selector).evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-94));await p.waitForTimeout(200);await p.screenshot({path:`${dir}/${name}.png`,scale:'css'});}
async function loaded(p){await p.waitForFunction(()=>{const i=document.querySelector('.viewer-image');return !i.hidden&&i.complete&&i.naturalWidth>0;});}
for(const [engine,type,widths]of [['chromium',chromium,[1440,390,320]],['webkit',webkit,[1440,390]]]){
 const browser=await type.launch();
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:width>900?1000:844},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'}),p=await ctx.newPage();
  p.on('pageerror',e=>report.errors.push({engine,width,message:e.message}));
  const res=await p.goto(url,{waitUntil:'load'});assert.equal(res.status(),200);assert.equal(await res.text(),fs.readFileSync('works.html','utf8'));await p.evaluate(()=>document.fonts.ready);
  assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  const d=await p.locator('#worksPhotoData').textContent().then(JSON.parse);assert.equal(d.archive.length,20);
  for(const [id,n]of Object.entries(counts))assert.equal(d.galleries[id].images.length,n);
  if(width!==320){await screen(p,'#homes',`${phase}-${engine}-${width}-new`);await screen(p,'#shijo',`${phase}-${engine}-${width}-shijo`);await screen(p,'#models',`${phase}-${engine}-${width}-models`);}
  for(const [id,n]of Object.entries(counts)){
   const trigger=p.locator(`[data-gallery="${id}"]`).first();await trigger.click();await loaded(p);
   assert.equal(await p.locator('.viewer-count').textContent(),`1 / ${n}`);assert.equal(await p.locator('#viewerTitle').textContent(),d.galleries[id].heading||d.galleries[id].title);
   await p.keyboard.press('ArrowLeft');await loaded(p);assert.equal(await p.locator('.viewer-count').textContent(),`${n} / ${n}`);
   assert.equal(await p.locator('.viewer-image').getAttribute('src'),d.galleries[id].images[n-1].src);
   if(id==='saki'&&width!==320)await p.screenshot({path:`${dir}/${phase}-${engine}-${width}-viewer.png`,scale:'css'});
   await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.body.classList.contains('dialog-open'));assert(await trigger.evaluate(e=>document.activeElement===e));
  }
  await p.locator('#archiveMore').click();assert.equal(await p.locator('[data-archive]:visible').count(),20);
  await p.locator('[data-filter="bath"]').click();assert.equal(await p.locator('[data-archive]:visible').count(),3);
  await p.locator('[data-archive]:visible').first().click();await loaded(p);assert.equal(await p.locator('.viewer-count').textContent(),'1 / 3');await p.keyboard.press('Escape');
  assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  const header=await p.locator('.works-header').evaluate(el=>{const a=el.querySelector('.works-brand').getBoundingClientRect(),b=el.querySelector('.header-reserve').getBoundingClientRect();return a.right<=b.left;});assert(header);
  report.views.push({engine,width,galleries:counts,overflow:false,headerOverlap:false,keyboardWrap:true,focusReturn:true,archive:true});
  if(engine==='chromium'&&width===1440){
   const all=[...Object.values(d.galleries).flatMap(g=>g.images),...d.archive];
   for(const {src}of all){const r=await ctx.request.get(new URL(src,url).href);assert.equal(r.status(),200,src);assert.equal(hash(await r.body()),hash(fs.readFileSync(src)),src);}
   report.tests.push({allPhotoResponsesAndHashes:all.length});
   for(const src of ['assets/works/works-yellow.js','assets/works/works-yellow.css','index.html']){const r=await ctx.request.get(new URL(src,url).href);assert.equal(r.status(),200);assert.equal(hash(await r.body()),hash(fs.readFileSync(src)),src);}
   await p.route('**/assets/works/20260907/saki-5766.webp',r=>r.abort());await p.locator('[data-gallery="saki"]').last().click();await p.locator('.viewer-error').waitFor({state:'visible'});await p.unroute('**/assets/works/20260907/saki-5766.webp');await p.locator('#retryPhoto').click();await loaded(p);await p.keyboard.press('Escape');report.tests.push({imageFailureRetry:true});
  }
  await ctx.close();
 }
 const c=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),p=await c.newPage();await p.goto(url);assert.equal(await p.locator('[data-archive]:visible').count(),20);assert.equal(await p.locator('[data-gallery="saki"]').first().getAttribute('href'),'assets/works/20260907/saki-5766.webp');await c.close();report.tests.push({engine,noJSLinks:true});
 await browser.close();
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(`${dir}/${phase}-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
