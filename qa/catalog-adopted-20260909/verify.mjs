import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';
const base=process.env.CATALOG_BASE||'http://127.0.0.1:8955',out=process.env.CATALOG_OUT||'qa/catalog-adopted-20260909/local';await mkdir(out,{recursive:true});
const data=JSON.parse(await readFile('data/catalog-content.json','utf8'));const results={base,viewports:[],interactions:[],source:{},failures:[]};const errors=[];
function check(ok,label){if(!ok)results.failures.push(label);}
const hash=s=>createHash('sha256').update(s).digest('hex');
const original=await readFile('qa/catalog-adopted-20260909/baseline/kodawari.html','utf8'),current=await readFile('kodawari.html','utf8');
const cover=s=>s.match(/  <article class="fvs__scene fvs__scene--cover[\s\S]*?<\/article>/)[0];check(cover(original)===cover(current),'Cover markup changed');results.source.coverSha256=hash(cover(current));
const protectedHashes=JSON.parse(await readFile('qa/catalog-adopted-20260909/baseline-hashes.json','utf8'));for(const [path,expected] of Object.entries(protectedHashes)){check(hash(await readFile(path))===expected,'Protected hash '+path);}results.source.protected=Object.keys(protectedHashes).length;
check(data.pages.length===32&&new Set(data.pages.map(x=>x.id)).size===32,'32 unique units');check(data.comparisonRows.length===32,'32 comparison rows');
for(const [width,height] of [[1440,1000],[390,844],[320,844],[1024,768]]){
 const browser=await chromium.launch();const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push({width,message:e.message}));
 await p.goto(base+'/kodawari.html');await p.evaluate(()=>document.fonts.ready);await p.locator('.catalog-cover').screenshot({path:`${out}/cover-${width}.png`});
 check(await p.locator('.cr-page').count()===32,`DOM units ${width}`);check(await p.locator('#catToc a[href^="#catalog-"]').count()===32,`TOC32 ${width}`);
 const items=[];
 for(const unit of data.pages){
  await p.evaluate(id=>window.__catalogReader.go(id),unit.id);await p.waitForTimeout(80);await p.evaluate(()=>document.fonts.ready);check(await p.evaluate(()=>document.fonts.check('500 28px YamatoCatalogMincho','保証仕様')&&document.fonts.check('400 16px YamatoCatalogGothic','保証仕様')&&[...document.fonts].some(f=>f.family==='YamatoCatalogGothic'&&f.status==='loaded')),'actual fonts '+width);const loc=p.locator('#'+unit.id);
  await loc.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));
  const metrics=await loc.evaluate(el=>{
   const text=[...el.querySelectorAll('p,td,th,h2,h3,li')].filter(e=>e.getClientRects().length);
   const bad=text.filter(e=>{const s=getComputedStyle(e);return parseFloat(s.fontSize)<(e.matches('.cr-note,.cr-source,.cr-eyebrow,.cr-page-bottom')?14:16);}).map(e=>e.className+':'+getComputedStyle(e).fontSize);
   const overflow=[...el.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&!e.closest('.is-horizontal');}).map(e=>e.tagName+'.'+e.className).slice(0,10);
   return {id:el.id,number:Number(el.dataset.crPage),chapter:Number(el.dataset.crChapter),visible:!!el.getClientRects().length,rect:el.getBoundingClientRect().toJSON(),bodyFont:getComputedStyle(el.querySelector('.cr-lead')).fontFamily,headingFont:getComputedStyle(el.querySelector('h2')).fontFamily,badFontSizes:bad,overflow,badImages:[...el.querySelectorAll('img')].filter(e=>!e.naturalWidth).map(e=>e.getAttribute('src')),text:el.innerText};
  });items.push(metrics);check(metrics.visible,`hidden ${width}/${unit.id}`);check(!metrics.badFontSizes.length,`small text ${width}/${unit.id}`);check(!metrics.overflow.length,`overflow ${width}/${unit.id}`);check(!metrics.badImages.length,`image ${width}/${unit.id}`);
  if(width===1440||width===390){await p.screenshot({path:`${out}/page-${String(unit.number).padStart(2,'0')}-${width}.png`});if([7,26,28,30].includes(unit.number))await loc.screenshot({path:`${out}/full-${unit.number}-${width}.png`});}
 }
 check(await p.locator('html').evaluate(e=>e.scrollWidth<=innerWidth),`document overflow ${width}`);
 // Tab has no hidden-page destinations; all comparison cells still use exactly the shared data.
 for(const row of data.comparisonRows){const cells=await p.locator(`[data-spec-key="${row.key}"] td>span:last-child`).allTextContents();check(JSON.stringify(cells)===JSON.stringify(row.values),'values '+row.key);}
 const routeIds=await p.locator('.cr-content a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));check(!routeIds.length,'unresolved internal links');
 results.viewports.push({width,height,items,routeIds});await p.close();await browser.close();console.log(`Captured ${width}: 32 units`);
}
// Interaction coverage on both browser engines, including touch viewport and normal-motion cover.
for(const [engine,width] of [[chromium,1440],[webkit,390]]){
 const browser=await engine.launch();const p=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce',hasTouch:width<821});p.on('pageerror',e=>errors.push({width,engine:engine.name(),message:e.message}));await p.goto(base+'/kodawari.html');await p.evaluate(()=>document.fonts.ready);
 await p.locator('#catTocOpen').click();await p.locator('#catToc a[href="#catalog-stedia"]').click();await p.waitForTimeout(150);
 check(await p.evaluate(()=>__catalogReader.current())==='catalog-stedia','TOC '+engine.name());
 const zoom=p.locator('#catalog-stedia [data-cr-zoom]').first();await zoom.click();await p.locator('[data-cr-zoom-in]').click();check(await p.locator('.cr-lightbox-scroll').evaluate(e=>e.classList.contains('is-zoomed')),'zoom in');await p.locator('[data-cr-zoom-reset]').click();await p.keyboard.press('Escape');await p.waitForTimeout(200);check(await zoom.evaluate(e=>e===document.activeElement),'zoom focus '+engine.name());
 await zoom.click();await p.goBack();await p.waitForTimeout(200);check(!await p.locator('#crLightbox').evaluate(e=>e.open),'back closes zoom');check(await zoom.evaluate(e=>e===document.activeElement),'back restores focus');
 await p.evaluate(()=>__catalogReader.go('catalog-compare-water'));await p.waitForTimeout(120);
 if(width<821){const t=p.locator('#catalog-compare-water .cr-table-toggle');await t.click();const area=p.locator('#catalog-compare-water .cr-table-scroll');await area.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(100);check(await area.evaluate(e=>e.scrollWidth>e.clientWidth&&e.scrollLeft>0),'keyboard horizontal table');await t.click();}
 await p.locator('#catalog-compare-water tbody tr:first-child th a').click();await p.waitForTimeout(100);check(await p.evaluate(()=>__catalogReader.current())==='catalog-kitchen','comparison detail');await p.goBack();await p.waitForTimeout(180);check(await p.evaluate(()=>__catalogReader.current())==='catalog-compare-water','comparison history');
 await p.setViewportSize({width:width===1440?390:1440,height:844});await p.waitForTimeout(200);check(await p.evaluate(()=>__catalogReader.current())==='catalog-compare-water','resize ID '+engine.name());
 await p.locator('.cr-toolbar [data-cr-toc]').click();await p.keyboard.press('Escape');await p.waitForTimeout(100);check(await p.locator('.cr-toolbar [data-cr-toc]').evaluate(e=>e===document.activeElement),'toc focus restore');
 await p.locator('.cr-toolbar a[href="#price"]').click();await p.waitForTimeout(200);check(await p.locator('#price').evaluate(e=>e.getBoundingClientRect().top<300),'exit to main');
 await p.goto(base+'/kodawari.html#catalog-warranty');await p.waitForTimeout(200);check(await p.evaluate(()=>__catalogReader.current())==='catalog-warranty','direct hash');
 results.interactions.push({engine:engine.name(),width,status:'completed'});await p.close();await browser.close();
}
// Native reading without JavaScript and image failure still preserve all explanatory content.
const browser=await chromium.launch();
for(const width of [1440,390]){const p=await browser.newPage({viewport:{width,height:844},javaScriptEnabled:false});await p.goto(base+'/kodawari.html');check(await p.locator('.cr-page:visible').count()===32,'noJS32 '+width);check(await p.locator('html').evaluate(e=>e.scrollWidth<=innerWidth),'noJS overflow '+width);await p.close();}
const failed=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await failed.route('**/assets/catalog/adopted/*.{webp,jpg,png}',r=>r.abort());await failed.goto(base+'/kodawari.html#catalog-stedia');await failed.waitForTimeout(200);check(await failed.locator('#catalog-stedia .cr-feature').count()===4,'image failure four features');check(await failed.locator('#catalog-stedia').isVisible(),'image failure body');await failed.close();
const large=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await large.goto(base+'/kodawari.html#catalog-compare-water');await large.addStyleTag({content:'.cr-page p,.cr-page td,.cr-page th,.cr-page li{font-size:200%!important}.cr-page h2{font-size:56px!important}.cr-page h3{font-size:44px!important}'});await large.waitForTimeout(100);check(await large.locator('html').evaluate(e=>e.scrollWidth<=innerWidth),'200% text overflow');await large.screenshot({path:`out-placeholder.png`.replace('out-placeholder',out+'/text-200')});await large.close();await browser.close();
results.errors=errors;check(!errors.length,'browser errors');await writeFile(out+'/verification.json',JSON.stringify(results,null,2));console.log(JSON.stringify({failures:results.failures,errors},null,2));if(results.failures.length)process.exitCode=1;
