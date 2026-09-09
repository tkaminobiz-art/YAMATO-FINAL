import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch();
for(const width of [1440,390]){
 const p=await browser.newPage({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8955/kodawari.html');await p.evaluate(()=>document.fonts.ready);await p.locator('.catalog-cover').screenshot({path:`qa/catalog-adopted-20260909/local/cover-after-${width}.png`});
 for(const id of ['stedia','compare-water','warranty']){
  await p.evaluate(id=>window.__catalogReader.go('catalog-'+id),id);await p.waitForTimeout(100);await p.locator('#catalog-'+id+' img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));await p.screenshot({path:`qa/catalog-adopted-20260909/evidence/prototype-${id}-${width}.png`});
  console.log(JSON.stringify({width,id,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors}));
 }
 await p.close();
}await browser.close();
