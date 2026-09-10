import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const q='qa/voice-seedream-adopted-20260910',out=process.env.QA_OUT||`${q}/local`,base=process.env.QA_BASE||'http://127.0.0.1:8962';
const copy=JSON.parse(fs.readFileSync(`${q}/copy-and-routes.json`)),result=[];fs.mkdirSync(out,{recursive:true});
for(const [name,engine,width,height,motion] of [['chromium',chromium,1440,778,'no-preference'],['webkit',webkit,390,844,'reduce']]){
 if(process.env.QA_ENGINE&&name!==process.env.QA_ENGINE)continue;console.log('Checking',name);const browser=await engine.launch(),page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:motion,hasTouch:name==='webkit'}),errors=[],nonGet=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))nonGet.push({url:r.url(),method:r.method()});});
 const go=async()=>{await page.goto(`${base}/index.html#voice`,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);};
 await go();
 const keyboard=[];await page.keyboard.press('Tab');await page.locator('#voice .vb26__quote').first().focus();
 for(let n=0;n<5;n++){
  if(name==='webkit')await page.locator(n<4?`#voice [data-voice-id="${copy.quotes[n].id}"]`:'#voice .vb26__all').focus();
  const data=await page.evaluate(()=>{const e=document.activeElement,b=e.getBoundingClientRect(),s=getComputedStyle(e);return{id:e.dataset.voiceId||'all',href:e.getAttribute('href'),outline:s.outlineStyle,width:b.width,height:b.height}});
  assert.equal(data.id,n<4?copy.quotes[n].id:'all');assert.notEqual(data.outline,'none');assert(data.height>=44);keyboard.push(data);
  if(n===0)await page.screenshot({path:`${out}/focus-${name}.png`});if(n<4&&name==='chromium'){await page.keyboard.press('Tab');await page.waitForFunction(id=>(document.activeElement.dataset.voiceId||'all')===id,n<3?copy.quotes[n+1].id:'all');}
 }
 const routes=[];
 for(const c of copy.quotes){
  await go();const a=page.locator(`#voice [data-voice-id="${c.id}"]`);assert.equal((await a.locator('blockquote').textContent()).trim(),c.quote);assert.equal((await a.locator('.vb26__customer').textContent()).trim(),c.customer);assert.equal(await a.getAttribute('href'),c.href);
  if(name==='webkit')await a.tap();else await a.click();await page.waitForURL(`**/voice.html#${c.id}`);await page.locator('#vm.is-open').waitFor();
  const body=await page.locator('#vmBody').innerText();assert(body.includes(c.quote));assert.equal((await page.locator('.vm__who').innerText()).replace(/\s+/g,' '),c.customer);
  assert((await page.locator('.vm__mark').textContent()).includes(`No.${c.id.slice(1)}`));
  await page.screenshot({path:`${out}/route-${name}-${c.id}.png`});routes.push({id:c.id,customer:c.customer,url:page.url(),exactQuoteInOpenDetail:true});
  await page.keyboard.press('Escape');await page.locator('#vm').waitFor({state:'hidden'});
 }
 await go();if(name==='webkit')await page.locator('#voice .vb26__all').tap();else await page.locator('#voice .vb26__all').click();await page.waitForURL('**/voice.html');await page.locator('[data-id="v01"]').first().waitFor();assert.equal(new URL(page.url()).hash,'');
 await go();const a=page.locator('#voice .vb26__quote').first();const before=await a.boundingBox();await a.hover();const after=await a.boundingBox();assert.deepEqual(after,before);
 await page.screenshot({path:`${out}/hover-${name}.png`});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.equal(overflow,0);
 assert.deepEqual(errors,[]);assert.deepEqual(nonGet,[]);
 result.push({engine:name,viewport:{width,height},motion,keyboardNavigation:name==='webkit'?'Focus appearance per link; sequential Tab tested in Chromium':'Tab',keyboard,routes,allRoute:base+'/voice.html',hoverGeometryUnchanged:true,overflow,errors,nonGet});if(process.env.QA_ENGINE&&fs.existsSync(`${out}/interaction-profiles.json`)){const previous=JSON.parse(fs.readFileSync(`${out}/interaction-profiles.json`));for(const p of previous)if(!result.some(r=>r.engine===p.engine))result.push(p);}fs.writeFileSync(`${out}/interaction-profiles.json`,JSON.stringify(result,null,2));await browser.close();
}
// Failed photographs must leave all five source links and an explicit fallback usable.
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
await page.route('**/assets/top-renewal/art-direction/living-wide-*.webp',r=>r.abort());await page.route('**/assets/top-renewal/art-direction/garden-exterior-*.webp',r=>r.abort());
await page.goto(`${base}/index.html#voice`);await page.locator('#voice .vb26__scene.is-error').first().waitFor();
assert.equal(await page.locator('#voice a').count(),5);assert.equal(await page.locator('#voice .av26__fallback:visible').count(),2);await page.screenshot({path:`${out}/image-fallback.png`});await browser.close();
fs.writeFileSync(`${out}/interaction.json`,JSON.stringify({profiles:result,imageFailure:{fallbacks:2,retainedLinks:5}},null,2));console.log('PC/SP: four exact detail routes, list, keyboard/focus, hover, reduced motion, image fallback verified');
