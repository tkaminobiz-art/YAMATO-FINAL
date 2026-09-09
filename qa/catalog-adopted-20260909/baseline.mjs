import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,copyFile,mkdir} from 'node:fs/promises';
await mkdir('qa/catalog-adopted-20260909/local/reference',{recursive:true});
await copyFile('qa/catalog-adopted-20260909/baseline/kodawari.html','catalog-baseline.html');
const b=await chromium.launch(); const results=[];
for(const width of [1440,390]){
 const p=await b.newPage({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'});
 await p.goto('http://127.0.0.1:8955/catalog-baseline.html'); await p.evaluate(()=>document.fonts.ready);
 await p.locator('.catalog-cover').screenshot({animations:'disabled',path:`qa/catalog-adopted-20260909/local/reference/cover-${width}.png`});
 results.push(await p.evaluate(()=>({width:innerWidth,cover:document.querySelector('.fvs__scene--cover').outerHTML,rect:document.querySelector('.catalog-cover').getBoundingClientRect().toJSON(),fonts:[...document.querySelectorAll('.catalog-cover__title>*')].map(e=>({text:e.textContent,font:getComputedStyle(e).fontFamily,size:getComputedStyle(e).fontSize})),video:document.querySelector('.catalog-cover__motion').currentSrc})));
 await p.close();
}
await writeFile('qa/catalog-adopted-20260909/local/reference/cover-baseline.json',JSON.stringify(results,null,2));await b.close();console.log('baseline captured');
