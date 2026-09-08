import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const phase=process.argv[2]||'after',dir='qa/w08-photo-release-20260908/';
const base=process.argv[3]||'http://127.0.0.1:4188/';
const report={phase,views:[],errors:[]};
for(const [engine,type,widths] of [['chromium',chromium,phase==='before'?[1440,390]:[1440,1024,768,390,320]],['webkit',webkit,phase==='before'?[]:[1440,390]]]){
 if(!widths.length)continue;
 const b=await type.launch();
 for(const width of widths){
  const height=width>=768?900:844;
  const page=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  if(phase==='before')await page.route(base+'index.html?mode=still',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(dir+'before-index.html','utf8')}));
  await page.goto(base+'index.html?mode=still',{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('#howWeBuild').scrollIntoViewIfNeeded();
  await page.locator('#howWeBuild img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  await page.screenshot({path:dir+phase+'-'+engine+'-'+width+'-built.png',scale:'css'});
  await page.locator('.yamato-evidence__item').nth(1).screenshot({path:dir+phase+'-'+engine+'-'+width+'-construction.png',scale:'css'});
  await page.locator('#entryCards').scrollIntoViewIfNeeded();
  const cards=page.locator('#entryCards > a:not([aria-hidden="true"])');
  assert.equal(await cards.count(),4);
  const cardsData=[];
  for(let i=0;i<4;i++){
   const card=cards.nth(i);
   await card.scrollIntoViewIfNeeded();
   await card.locator('img').evaluate(i=>i.decode());
   await card.screenshot({path:dir+phase+'-'+engine+'-'+width+'-card'+(i+1)+'.png',scale:'css'});
   cardsData.push(await card.evaluate(el=>{const i=el.querySelector('img'),r=i.getBoundingClientRect();return {href:el.getAttribute('href'),src:i.currentSrc,alt:i.alt,natural:[i.naturalWidth,i.naturalHeight],display:[r.width,r.height],text:el.innerText}}));
  }
  await cards.first().scrollIntoViewIfNeeded();
  await page.screenshot({path:dir+phase+'-'+engine+'-'+width+'-guide.png',scale:'css'});
  if(engine==='chromium'&&[1440,390].includes(width))await page.screenshot({path:dir+phase+'-'+(width===1440?'pc':'sp')+'.png',scale:'css'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(cardsData.map(c=>c.href),['kodawari.html','lots-preview.html?view=list','lots-preview.html?view=estimate','move-to-nara-preview.html']);
  if(phase!=='before')assert(cardsData.slice(1).every(c=>c.src.includes('/real-photo/')&&!c.text.includes('イラスト')));
  await page.locator('#entryCards').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const keyboardScroll=await page.locator('#entryCards').evaluate(e=>e.scrollLeft);
  assert(keyboardScroll>0);
  report.views.push({engine,width,cards:cardsData,keyboardScroll,overflow:false});
  await page.close();
 }
 await b.close();
}
fs.writeFileSync(dir+phase+'-report.json',JSON.stringify(report,null,2));
assert.deepEqual(report.errors,[]);
console.log(JSON.stringify({phase,views:report.views.length,errors:report.errors},null,2));
