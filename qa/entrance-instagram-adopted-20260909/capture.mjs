import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8953/',stage=process.argv[3]||'local',sizes=(process.argv[4]||'1440,1366,1024,768,390,320').split(',').map(Number);
const out=new URL(`./${stage}/`,import.meta.url);await mkdir(out,{recursive:true});
const payload=await fetch('https://yamato-final.vercel.app/api/instagram').then(async r=>{if(!r.ok)throw Error('Live feed unavailable: '+r.status);return r.text()});const feed=JSON.parse(payload);
const browser=await chromium.launch({headless:true}),results=[];
for(const width of sizes){
 const height=width===1366?768:width<600?844:900,context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.name+': '+e.message));await page.route('**/api/instagram',r=>r.fulfill({status:200,contentType:'application/json',body:payload}));
 await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 const row={width,height,errors};
 for(const [name,sel] of [['entrance','#entrance'],['instagram','#instagram']]){
  await page.locator(sel).scrollIntoViewIfNeeded();if(name==='instagram')await page.waitForFunction(()=>document.getElementById('instagram').dataset.state==='ready');
  await page.locator(sel).evaluate(async e=>{await Promise.all([...e.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));window.scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.site-header').getBoundingClientRect().height,behavior:'instant'});});await page.waitForTimeout(150);
  await page.screenshot({path:fileURLToPath(new URL(`${name}-${width}-viewport.png`,out))});await page.locator(sel).screenshot({path:fileURLToPath(new URL(`${name}-${width}-section.png`,out)),style:".site-header,.skip-link{visibility:hidden!important}"});
  row[name]=await page.locator(sel).evaluate(e=>({height:e.getBoundingClientRect().height,headerHeight:document.querySelector('.site-header').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...e.querySelectorAll('button:not([hidden]),a')].filter(x=>x.getClientRects().length).map(x=>({label:x.textContent.trim().slice(0,40),width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height})),images:[...e.querySelectorAll('img')].map(x=>({loaded:x.complete&&x.naturalWidth>0,fit:getComputedStyle(x).objectFit})),fonts:[...e.querySelectorAll('h2,h3,p,.en26__label,.en26__quick a,.igb__neighbor-meta')].filter(x=>x.getClientRects().length).map(x=>({tag:x.tagName,text:x.textContent.trim().slice(0,28),size:getComputedStyle(x).fontSize,lineHeight:getComputedStyle(x).lineHeight}))}));
 }
 const cdp=await context.newCDPSession(page),{root}=await cdp.send('DOM.getDocument');row.platformFonts={};for(const selector of ['#entranceTitle','.en26__card h3','.en26__card p','#instagramTitle','#igBLead','#igBExcerpt']){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});row.platformFonts[selector]=(await cdp.send('CSS.enable'),await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts.map(f=>({familyName:f.familyName,isCustomFont:f.isCustomFont,glyphCount:f.glyphCount}));}
 results.push(row);await context.close();console.log(JSON.stringify({width,entranceHeight:row.entrance.height,available:height-row.entrance.headerHeight,overflow:row.entrance.overflow||row.instagram.overflow,errors}));
}
await browser.close();await writeFile(new URL('capture.json',out),JSON.stringify({base,posts:feed.posts.map(p=>({id:p.id,date:p.timestamp,type:p.media_type})),results},null,2));
