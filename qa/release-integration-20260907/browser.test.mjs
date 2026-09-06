import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='qa/release-integration-20260907',base=process.env.RELEASE_TEST_URL||'http://127.0.0.1:4175';
const live=!base.includes('127.0.0.1'),report={base,date:new Date().toISOString(),screens:[],interactions:[],errors:[]};
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const protectedParts=JSON.parse(fs.readFileSync(`${dir}/protected.json`));
const source=fs.readFileSync('index.html','utf8');
for(const [name,opening] of Object.entries({hero:'<section class="new-hero"',built:'<section class="yamato-evidence"',voice:'<section class="voices voice-proof'})){
 const start=source.indexOf(opening),end=source.indexOf('</section>',start)+10;
 assert.equal(hash(source.slice(start,end)),protectedParts[name],`${name} protected markup`);
}
assert.equal(hash(fs.readFileSync('v1top/index.html')),protectedParts.v1top,'v1top unchanged');
async function settle(page,selector){
 await page.locator(selector).scrollIntoViewIfNeeded();
 await page.locator(selector).locator('img').evaluateAll(imgs=>Promise.race([Promise.all(imgs.map(i=>{i.loading='eager';return i.decode().catch(()=>{});})),new Promise(resolve=>setTimeout(resolve,10000))]));
 await page.waitForTimeout(760);
}
async function overflow(page){return page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));}
for(const [engine,type,widths] of [['chromium',chromium,live?[390,1440]:[320,390,768,1024,1440]],['webkit',webkit,[390,1440]]]){
 const browser=await type.launch({headless:true});
 try{
 for(const width of widths){
  console.log('Checking',engine,width,base);
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push({engine,width,error:e.message}));
  if(!live)await page.route('**/api/instagram',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Local QA: API not connected'})}));
  await page.goto(base+'/?v=release-qa',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#builtProof').count(),1);assert.equal(await page.locator('#voice').count(),1);
  await settle(page,'#entryCards');
  const rail=page.locator('#entryCards');assert.equal(await rail.locator(':scope > a:not([data-rail-clone])').count(),4);
  assert.equal(await rail.locator(':scope > [data-rail-clone]').count(),4);
  await page.mouse.move(0,0);
  const a=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(1200);const b=await rail.evaluate(e=>e.scrollLeft);
  assert(b>a+10,`Automatic rail motion ${engine}/${width}: ${a} to ${b}`);
  await rail.dispatchEvent('pointerdown',{pointerType:'touch'});
  const paused=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(250);
  assert(Math.abs(await rail.evaluate(e=>e.scrollLeft)-paused)<1,'Touch pauses rail');
  await page.locator('#entryNext').click();await page.waitForTimeout(500);
  assert((await rail.evaluate(e=>e.scrollLeft))>paused+20,'Manual next');
  await page.locator('#entryPrev').click();await page.waitForTimeout(500);
  if(width===390||width===1440)await page.screenshot({path:`${dir}/${live?'live':'after'}-${engine}-${width}-guide.png`,scale:'css'});
  const targets=['#reason','#lineup','#works','#visit'];
  for(const selector of targets){
   await settle(page,selector);
   const coverage=await page.locator(`${selector} [data-deep-frame]`).evaluateAll(frames=>frames.map(f=>{
    const img=f.querySelector('img'),a=f.getBoundingClientRect(),b=img.getBoundingClientRect();return{loaded:img.naturalWidth>0,covered:b.left<=a.left+1&&b.right>=a.right-1&&b.top<=a.top+1&&b.bottom>=a.bottom-1};
   }));
   assert(coverage.length>0,selector+' parallax exists');assert(coverage.every(x=>x.loaded&&x.covered),`${engine}/${width}/${selector}: image covers frame`);
   if(selector==='#lineup'&&(width===390||width===1440))await page.screenshot({path:`${dir}/${live?'live':'after'}-${engine}-${width}-lineup.png`,scale:'css'});
  }
  await settle(page,'#nara');
  assert.deepEqual(await page.locator('[data-minutes]').allTextContents(),['22','28','41']);
  await page.getByLabel('鶴橋',{exact:true}).check();assert.deepEqual(await page.locator('[data-minutes]').allTextContents(),['16','22','35']);
  await page.getByLabel('大阪難波',{exact:true}).check();
  await page.locator('.nara-atlas__source summary').click();assert(await page.locator('[data-source-origin]').isVisible());
  await page.locator('.nara-atlas__source summary').click();
  let size=await overflow(page);assert(size.document<=width,`TOP overflow ${engine}/${width}: ${size.document}`);
  assert.equal(await page.locator('.nara-atlas__primary').getAttribute('href'),'move-to-nara-preview.html#train');
  if(width===390||width===1440){
   await page.screenshot({path:`${dir}/${live?'live':'after'}-${engine}-${width}-nara.png`,scale:'css'});
   if(engine==='chromium'&&!live)await page.screenshot({path:`${dir}/after-${width===390?'sp':'pc'}.png`,scale:'css'});
  }
  report.screens.push({engine,width,route:'/',...size});
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const id of ['builtProof','voice']){
   await settle(page,`#${id}`);
   if(engine==='chromium'&&!live&&(width===390||width===1440))await page.locator(`#${id}`).screenshot({path:`${dir}/after-${width===390?'sp':'pc'}-${id}.png`,scale:'css'});
  }
  await settle(page,'#entryCards');assert(await page.locator('#cardMotion').isDisabled());
  const still=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(250);assert.equal(await rail.evaluate(e=>e.scrollLeft),still,'Reduced motion static');
  report.interactions.push({engine,width,rail:'autoplay, touch pause, previous/next, reduced motion',atlas:'origin switch and source disclosure'});
  await page.goto(base+'/works.html?v=release-qa',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  assert(await page.locator('link[href*="works-yellow.css"]').count());
  await settle(page,'main');size=await overflow(page);assert(size.document<=width,`WORKS overflow ${engine}/${width}`);
  if(width===390||width===1440)await page.screenshot({path:`${dir}/${live?'live':'after'}-${engine}-${width}-works.png`,scale:'css'});
  await page.locator('[data-gallery]').first().click();await page.locator('.viewer-image').waitFor({state:'visible'});
  assert(await page.locator('#photoViewer').isVisible());await page.locator('.viewer-next').click();await page.keyboard.press('Escape');
  assert(!(await page.locator('#photoViewer').isVisible()));
  await page.locator('[data-filter="wash"]').click();assert.equal(await page.locator('[data-filter="wash"]').getAttribute('aria-pressed'),'true');
  report.screens.push({engine,width,route:'/works.html',...size});
  await page.goto(base+'/kodawari.html?v=release-qa#price',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  assert(await page.locator('link[href*="editorial.css"]').count());
  for(const id of ['price','standard','design','after']){
   await settle(page,`#${id}`);size=await overflow(page);assert(size.document<=width,`KODAWARI overflow ${id}/${engine}/${width}: ${size.document}`);
   if(id==='price'&&(width===390||width===1440))await page.screenshot({path:`${dir}/${live?'live':'after'}-${engine}-${width}-kodawari.png`,scale:'css'});
  }
  await page.locator('[data-spec]').nth(1).click();assert.equal(await page.locator('[data-spec]').nth(1).getAttribute('aria-selected'),'true');
  await page.locator('[data-point]').nth(1).click();assert.equal(await page.locator('[data-point]').nth(1).getAttribute('aria-pressed'),'true');
  await settle(page,'#top');await page.locator('#catTocOpen').click();assert(await page.locator('#catToc').isVisible());await page.keyboard.press('Escape');
  await page.locator('#catNext').click();
  report.screens.push({engine,width,route:'/kodawari.html',...size});
  report.interactions.push({engine,width,works:'viewer, next, Escape, room filter',kodawari:'spec tabs, plan pins, catalog contents, next page'});
  await page.close();
 }
 }finally{await browser.close();fs.writeFileSync(`${dir}/${live?'live-':'browser-'}report.json`,JSON.stringify(report,null,2)+'\n');}
}
assert.deepEqual(report.errors,[],'Page errors');console.log(JSON.stringify({pages:report.screens.length,interactionRuns:report.interactions.length,errors:report.errors,base}));
