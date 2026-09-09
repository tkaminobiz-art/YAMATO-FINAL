import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const qa='qa/nara-independent-copy-20260909',base=process.env.BASE_URL||'http://127.0.0.1:8952',out=process.env.QA_OUT||`${qa}/release-verified`,browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage(),results=[];
await page.goto(`${base}/move-to-nara-preview.html`,{waitUntil:'networkidle'});
await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'skip');await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,'#main');results.push({control:'keyboard skip',target:'#main',pass:true});
for(const selector of ['.section-nav a[href="lots-preview.html?view=list"]','.inline-cta .button','.closing-actions .button','.header .brand','.footer a']){
 await page.goto(`${base}/move-to-nara-preview.html`,{waitUntil:'domcontentloaded'});const href=await page.locator(selector).getAttribute('href');
 await Promise.all([page.waitForURL(u=>u.pathname!== '/move-to-nara-preview.html',{waitUntil:'domcontentloaded'}),page.locator(selector).click()]);
 const url=page.url();if(href==='/')assert.equal(new URL(url).pathname,'/');else assert.ok(url.includes('lots-preview.html')||url.includes('land-payment-study'));
 results.push({control:selector,href,url,pass:true});
}
await page.goto(`${base}/move-to-nara-preview.html`,{waitUntil:'networkidle'});
for(let i=0;i<4;i++){
 const link=page.locator('a[target="_blank"]').nth(i),href=await link.getAttribute('href');
 // Observe the real click's first navigation request. External page content is separately fact-checked from primary sources.
 let requested;const observed=new Promise(resolve=>{const listener=req=>{if(req.isNavigationRequest()&&req.url()===href){requested=req.url();context.off('request',listener);resolve();}};context.on('request',listener);});
 const [popup]=await Promise.all([page.waitForEvent('popup'),link.click()]);await Promise.race([observed,new Promise((_,reject)=>setTimeout(()=>reject(Error('external navigation not dispatched')),10000))]);assert.equal(requested,href);results.push({control:await link.textContent(),href,dispatched:requested,pass:true});await popup.close();
}
for(const a of await page.locator('a[href^="tel:"]').all()){assert.equal(await a.getAttribute('href'),'tel:0742361123');results.push({control:await a.textContent(),href:await a.getAttribute('href'),actualCall:false,pass:true});}
await fs.writeFile(`${out}/links.json`,JSON.stringify(results,null,2));console.log('CTA checks',results.length,'pass; remaining 6 in-page anchors exercised by browser-check; no telephone call');await browser.close();
