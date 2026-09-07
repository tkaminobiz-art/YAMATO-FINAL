import {chromium, webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.NARA_CHECK_URL || 'http://127.0.0.1:4175/';
const phase=process.env.NARA_CHECK_PHASE || 'local';
const dir='qa/nara-copy-release-20260907/';
const report={url:base,phase,views:[],errors:[]};
const expected='奈良から大阪は意外にも近いんです。5人に一人は毎朝、大阪に出勤されています。';
const canonical=fs.readFileSync('index.html','utf8');
const preview=fs.readFileSync('index-nara-copy-preview.html','utf8').replace('      <!-- Provisional wording requested by the user; release copy remains pending. -->\n','').replace(' data-draft-copy','');
assert.equal(canonical,preview,'Canonical must match approved preview except draft markers');
for(const [name,engine,widths] of [['chromium',chromium,[1440,390,320]],['webkit',webkit,[390]]]){
 const browser=await engine.launch();
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce'});
  const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push({name,width,message:e.message}));
  const response=await page.goto(base+'?v=20260907-nara-copy#nara',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);assert.equal(await response.text(),canonical,'Served HTML must match source');
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('#nara').evaluate(el=>el.scrollIntoView({block:'start'}));
  await page.locator('.nara-atlas__photo img').evaluate(i=>i.decode());
  assert.equal(await page.locator('.nara-atlas__intro').textContent(),expected);
  const layout=await page.locator('.nara-atlas__intro').evaluate(el=>{const b=el.getBoundingClientRect();const s=getComputedStyle(el);return {x:b.x,width:b.width,height:b.height,fontSize:s.fontSize,overflow:document.documentElement.scrollWidth>innerWidth+1};});
  assert.equal(layout.overflow,false);assert(layout.x>=0&&layout.x+layout.width<=width+1);
  assert.deepEqual(await page.locator('[data-minutes]').allTextContents(),['22','28','41']);
  assert.equal(await page.locator('.nara-atlas__primary').getAttribute('href'),'move-to-nara-preview.html#train');
  assert.equal(await page.locator('.nara-atlas__secondary').getAttribute('href'),'lots-preview.html?view=list');
  await page.screenshot({path:dir+phase+'-'+name+'-'+width+'.png',scale:'css'});
  const [access,lots]=await Promise.all(['move-to-nara-preview.html','lots-preview.html?view=list'].map(path=>ctx.request.get(new URL(path,base).href)));
  assert.equal(access.status(),200);assert.equal(lots.status(),200);
  report.views.push({engine:name,width,...layout,verbatim:true,ctaResponses:[access.status(),lots.status()]});
  await ctx.close();
 }
 await browser.close();
}
assert.deepEqual(report.errors,[]);
fs.writeFileSync(dir+phase+'-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
