import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4175',dir='qa/release-staff-20260907',prefix=base.includes('vercel')?'live':'local';
const roster=JSON.parse(fs.readFileSync('assets/staff/staff-data.json','utf8')).people;
const report={base,views:[],errors:[],interactions:[]};
const dimensions=()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,header:[...document.querySelector('.site-header').children].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};})});
for(const [engine,type,widths] of [['chromium',chromium,[320,390,768,1024,1280,1440,1920]],['webkit',webkit,[390,1440]]]){
 const browser=await type.launch();
 for(const width of widths){
  console.log(engine,width);
  const ctx=await browser.newContext({viewport:{width,height:width<600?844:900},deviceScaleFactor:1,hasTouch:width<600,reducedMotion:'reduce'});
  const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  let d=await page.evaluate(dimensions);assert(d.overflow<=1,'TOP overflow');for(let i=1;i<d.header.length;i++)assert(d.header[i].left>=d.header[i-1].right-1,'TOP header overlap '+width);
  if(width===390||width===1440)await page.screenshot({path:dir+'/'+prefix+'-'+engine+'-'+width+'-home-header.png'});
  if(await page.locator('.header-links').isVisible())await page.locator('.header-links a[href="staff.html"]').click();
  else{await page.locator('#menuToggle').click();await page.locator('#siteMenu a[href="staff.html"]').click();}
  await page.waitForURL('**/staff.html');await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.staff-card').count(),18);
  assert.equal(await page.locator('.preview-note').count(),0);
  d=await page.evaluate(dimensions);assert(d.overflow<=1,'Staff overflow '+width);for(let i=1;i<d.header.length;i++)assert(d.header[i].left>=d.header[i-1].right-1,'Staff header overlap '+width);
  report.views.push({engine,width,...d});
  if(width===390||width===1440)await page.screenshot({path:dir+'/'+prefix+'-'+engine+'-'+width+'-staff.png'});
  for(const [filter,count] of Object.entries({sales:3,design:3,construction:5,admin:3,leadership:4,all:18})){await page.locator('[data-filter="'+filter+'"]').click();assert.equal(await page.locator('.staff-card:visible').count(),count);}
  if(width===390||width===1440){
   for(const p of roster){
    const card=page.locator('[data-staff-id="'+p.id+'"]');await card.scrollIntoViewIfNeeded();const button=card.locator('.portrait');
    await button.focus();await page.keyboard.press('Enter');await page.waitForFunction(id=>document.querySelector('[data-staff-id="'+id+'"] .portrait').getAttribute('aria-pressed')==='true',p.id);
    assert(await card.locator('.portrait__photo').evaluate(img=>img.naturalWidth>0));await page.keyboard.press('Enter');
    await card.locator('summary').click();assert.equal(await page.locator('#dialog-title').textContent(),p.name);assert(await page.locator('dialog').evaluate(d=>d.open));
    await page.locator('dialog img').evaluate(img=>img.decode());await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog').open);
    assert(await card.locator('summary').evaluate(el=>el===document.activeElement));
   }
   report.interactions.push({engine,width,profiles:18,portraitKeyboard:18,filters:6,escapeFocus:18});
   await page.evaluate(()=>scrollTo(0,0));await page.locator('.menu-toggle').click();assert(await page.locator('#site-menu').isVisible());await page.keyboard.press('Escape');assert(!await page.locator('#site-menu').isVisible());
  }
  await ctx.close();
 }
 // Native details are the no-JS fallback, not an empty enhanced-only page.
 const off=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});const p=await off.newPage();await p.goto(base+'/staff.html');await p.locator('.profile summary').first().click();assert(await p.locator('.profile').first().getAttribute('open')!==null);assert(await p.locator('.profile__photo').first().isVisible());await off.close();
 await browser.close();
}
// Real mouse hover and touch tap have different intent.
const browser=await chromium.launch();
for(const touch of [false,true]){const ctx=await browser.newContext({viewport:{width:touch?390:1440,height:900},hasTouch:touch});const p=await ctx.newPage();await p.goto(base+'/staff.html');const b=p.locator('.portrait').first();await b.scrollIntoViewIfNeeded();if(touch)await b.tap();else await b.hover();await p.waitForFunction(()=>document.querySelector('.portrait').getAttribute('aria-pressed')==='true');if(touch)await b.tap();else await p.mouse.move(5,5);await p.waitForFunction(()=>document.querySelector('.portrait').getAttribute('aria-pressed')==='false');await ctx.close();}
await browser.close();assert.deepEqual(report.errors,[]);fs.writeFileSync(dir+'/'+prefix+'-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({views:report.views.length,interactions:report.interactions,errors:report.errors}));
