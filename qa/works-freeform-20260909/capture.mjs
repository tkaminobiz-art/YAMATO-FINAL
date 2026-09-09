const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.WORKS_URL||'http://127.0.0.1:8937';
const phase=process.env.WORKS_PHASE||'iteration-1';
const out=`qa/works-freeform-20260909/${phase}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const result=[];
for(const [width,height] of [[1440,1080],[390,844],[320,740],[768,1024],[1024,900],[390,664]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 await page.locator('#works').scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('#works img')].every(i=>i.complete&&i.naturalWidth>0));
 await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('#works img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const sectionHeight=await page.locator('#works').evaluate(e=>e.clientHeight);
 await page.setViewportSize({width,height:Math.max(height,sectionHeight+180)});
 await page.locator('#works').screenshot({path:`${out}/works-${width}-${height}.png`,animations:'disabled',style:'.site-header{visibility:hidden !important}'});
 await page.setViewportSize({width,height});
 await page.evaluate(()=>{const y=document.querySelector('#works').getBoundingClientRect().top+scrollY;scrollTo({top:y-78,behavior:'instant'});});
 await page.screenshot({path:`${out}/viewport-${width}-${height}.png`,animations:'disabled'});
 const metrics=await page.locator('#works').evaluate(s=>({width:s.clientWidth,height:s.clientHeight,pageOverflow:document.documentElement.scrollWidth>innerWidth,links:[...s.querySelectorAll('a')].map(a=>{const r=a.getBoundingClientRect();const c=a.querySelector('.wf26__caption')||a;const cr=c.getBoundingClientRect();return{label:a.textContent.trim(),href:a.getAttribute('href'),size:[r.width,r.height],caption:[cr.x,cr.y,cr.width,cr.height],font:getComputedStyle(c).fontSize,clip:getComputedStyle(a).clipPath};}),images:[...s.querySelectorAll('img')].map(i=>({src:i.currentSrc,natural:[i.naturalWidth,i.naturalHeight],transform:getComputedStyle(i).transform}))}));
 result.push({viewport:[width,height],...metrics,errors});await context.close();
}
await browser.close();await writeFile(`${out}/metrics.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result.map(r=>({viewport:r.viewport,height:r.height,overflow:r.pageOverflow,errors:r.errors,links:r.links.map(x=>({caption:x.caption.slice(2),font:x.font}))})),null,2));
