import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const q='qa/voice-seedream-adopted-20260910',out=process.env.QA_OUT||`${q}/local`,base=process.env.QA_BASE||'http://127.0.0.1:8962';
const sizes={'1366-768':[1366,768],'1440-778':[1440,778],'1440-900':[1440,900],'1920-1080':[1920,1080],'320-844':[320,844],'390-844':[390,844],'768-1024':[768,1024],'1024-768':[1024,768],'767-844':[767,844],'1023-768':[1023,768]};
const keys=process.argv.slice(2),browser=await chromium.launch(),results=[];fs.mkdirSync(out,{recursive:true});
for(const key of keys.length?keys:Object.keys(sizes)){
 const [width,height]=sizes[key];const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/index.html#voice`,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 await page.locator('#voice img').evaluateAll(imgs=>Promise.all(imgs.filter(img=>img.getClientRects().length).map(img=>{img.loading='eager';return img.decode();})));
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelectorAll('video').forEach(v=>v.pause());window.scrollTo({top:scrollY+document.querySelector('#voice').getBoundingClientRect().top-document.querySelector('.site-header').getBoundingClientRect().height,behavior:'instant'});});
 await page.waitForTimeout(180);
 const data=await page.evaluate(()=>{
  const s=document.querySelector('#voice'),r=s.getBoundingClientRect(),header=document.querySelector('.site-header').getBoundingClientRect();
  const box=e=>{const b=e.getBoundingClientRect();return{x:b.x-r.x,y:b.y-r.y,width:b.width,height:b.height}};
  const sels=['#voiceTitle','.vb26__photos','.vb26__scene--living','.vb26__scene--exterior','.vb26__photo-note','.vb26__voices','.vb26__all',...['v01','v02','v08','v33'].flatMap(id=>[`.vb26__quote--${id}`,`.vb26__quote--${id} h3`,`.vb26__quote--${id} blockquote`])];
  const elements=Object.fromEntries(sels.map(sel=>{const e=s.querySelector(sel),c=getComputedStyle(e);return[sel,{...box(e),fontSize:c.fontSize,lineHeight:c.lineHeight,fontFamily:c.fontFamily,color:c.color,background:c.background,letterSpacing:c.letterSpacing,outlineStyle:c.outlineStyle,overflow:c.overflow,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,text:e.textContent.trim()}]}));
  const textRects=[];const walk=document.createTreeWalker(s,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode;if(!n.textContent.trim()||!n.parentElement.getClientRects().length||getComputedStyle(n.parentElement).visibility==='hidden')continue;const range=document.createRange();range.selectNode(n);for(const b of range.getClientRects())if(b.width&&b.height)textRects.push({text:n.textContent.trim(),x:b.x-r.x,y:b.y-r.y,width:b.width,height:b.height});}
  return{viewport:{width:innerWidth,height:innerHeight},header:header.toJSON(),section:r.toJSON(),sectionScrollHeight:s.scrollHeight,spare:innerHeight-header.height-r.height,documentOverflow:document.documentElement.scrollWidth-innerWidth,elements,textRects,images:[...s.querySelectorAll('img')].map(e=>({src:e.currentSrc,width:e.naturalWidth,height:e.naturalHeight,loaded:e.complete&&e.naturalWidth>0})),copy:s.textContent,dom:s.outerHTML};
 });
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const doc=await cdp.send('DOM.getDocument');data.renderedFonts={};for(const sel of ['#voiceTitle','#voice .vb26__quote--v01 blockquote','#voice .vb26__photo-note']){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:sel});data.renderedFonts[sel]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;}
 await page.screenshot({path:`${out}/viewport-${key}.png`,animations:'disabled'});
 await page.addStyleTag({content:'.site-header{visibility:hidden!important}'});await page.locator('#voice').screenshot({path:`${out}/section-${key}.png`,animations:'disabled'});
 data.errors=errors;fs.writeFileSync(`${out}/measure-${key}.json`,JSON.stringify(data,null,2));results.push(data);console.log(JSON.stringify({key,height:data.section.height,header:data.header.height,spare:data.spare,overflow:data.documentOverflow,errors}));await page.close();
}
await browser.close();fs.writeFileSync(`${out}/summary.json`,JSON.stringify(results.map(({dom,...r})=>r),null,2));
