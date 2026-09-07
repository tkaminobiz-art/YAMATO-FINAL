import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const url=process.env.BUILT_CHECK_URL||'http://127.0.0.1:4175/';
const phase=process.env.BUILT_CHECK_PHASE||'local',dir='qa/built-count-20260907/';
const report={url,views:[],errors:[],fallbacks:[]};
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 for(const width of [1440,390]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'}),page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  const response=await page.goto(url+'?mode=still&v=20260907-count#top',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);assert.equal(await response.text(),fs.readFileSync('index.html','utf8'));
  await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  assert.equal(await page.locator('[data-built-count]').getAttribute('data-count-state'),'ready');
  await page.evaluate(()=>{const el=document.querySelector('[data-built-count]');window.countSamples=[];window.countObserver=new MutationObserver(()=>{const b=el.getBoundingClientRect();window.countSamples.push({value:Number(el.textContent),width:b.width,state:el.dataset.countState});});window.countObserver.observe(el,{childList:true,attributes:true});});
  await page.locator('[data-built-count]').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('[data-built-count]').dataset.countState==='complete');
  const samples=await page.evaluate(()=>window.countSamples);
  assert(samples.some(s=>s.value>0&&s.value<770));assert(samples.every(s=>s.value>=0&&s.value<=770));
  const running=samples.filter(s=>s.state==='running');assert(Math.max(...running.map(s=>s.width))-Math.min(...running.map(s=>s.width))<1);
  assert.equal(await page.locator('[data-built-count]').textContent(),'770');
  for(const selector of ['.yamato-evidence__number strong','.yamato-evidence__number > span']) assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).color),'rgb(230, 99, 80)');
  assert.equal(await page.locator('.yamato-evidence__number').getAttribute('aria-label'),'770棟以上');
  await page.locator('#top').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
  await page.locator('#builtProof').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
  await page.waitForFunction(()=>{const b=document.querySelector('[data-built-count]').getBoundingClientRect();return b.top>=0&&b.bottom<innerHeight;});
  assert.equal(await page.locator('[data-built-count]').getAttribute('data-count-state'),'complete');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await page.locator('.nara-atlas__intro').textContent(),'奈良から大阪は意外にも近いんです。5人に一人は毎朝、大阪に出勤されています。');
  await page.screenshot({path:dir+phase+'-'+name+'-'+width+'.png',scale:'css'});
  report.views.push({engine:name,viewportWidth:width,intermediateSamples:running.length,once:true,stableWidth:true,color:'#e66350',final:770});await ctx.close();
 }
 if(name==='chromium'){
  for(const fallback of ['reduced','no-js']){
   const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',javaScriptEnabled:fallback!=='no-js'}),page=await ctx.newPage();
   await page.goto(url+'?mode=still#builtProof',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('[data-built-count]').textContent(),'770');report.fallbacks.push({fallback,final:770});await ctx.close();
  }
 }
 await browser.close();
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(dir+phase+'-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
