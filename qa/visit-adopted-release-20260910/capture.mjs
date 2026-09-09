import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const q='qa/visit-adopted-release-20260910',version=process.argv[2]||'before';
const evidence=process.env.QA_OUT||`${q}/local`;
const cases={'1366-768':[1366,768],'1440-778':[1440,778],'1440-900':[1440,900],'1920-1080':[1920,1080],'320-844':[320,844],'390-844':[390,844],'768-1024':[768,1024],'1024-768':[1024,768],'1440-600':[1440,600],'768-600':[768,600],'959-768':[959,768],'960-768':[960,768],'1099-768':[1099,768],'1100-768':[1100,768]};
const keys=process.argv.slice(3);const browser=await chromium.launch();const results=[];fs.mkdirSync(`${evidence}`,{recursive:true});
for(const key of keys.length?keys:Object.keys(cases).slice(0,8)){
 const [width,height]=cases[key];const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.QA_BASE||'http://127.0.0.1:8961'}/index.html#visit`,{waitUntil:'load'});
 await page.evaluate(()=>document.fonts.ready);await page.locator('#visit .va26__scene img').evaluate(e=>e.decode());
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelectorAll('video').forEach(v=>v.pause());const h=document.querySelector('.site-header').getBoundingClientRect().height;window.scrollTo({top:window.scrollY+document.querySelector('#visit').getBoundingClientRect().top-h,behavior:'instant'});});
 await page.waitForTimeout(300);
 const data=await page.evaluate(()=>{
  const s=document.querySelector('#visit'),r=s.getBoundingClientRect(),hr=document.querySelector('.site-header').getBoundingClientRect();
  const box=e=>{const b=e.getBoundingClientRect();return{x:b.x-r.x,y:b.y-r.y,width:b.width,height:b.height}};
  const selectors=['.va26__header','.va26__brand','.va26__english','#visitTitle','.va26__description','.va26__scene','.va26__scene img','.va26__photo-note','.va26__contact','.va26__button--primary','.va26__button:not(.va26__button--primary)','.va26__phone','.va26__phone > p','.va26__phone > a','.va26__hours','.va26__flower--top','.va26__flower--bottom'];
  const elements=Object.fromEntries(selectors.map(sel=>{const e=s.querySelector(sel),c=getComputedStyle(e);return[sel,{...box(e),fontSize:c.fontSize,lineHeight:c.lineHeight,fontFamily:c.fontFamily,display:c.display,visibility:c.visibility,opacity:c.opacity,overflow:c.overflow,objectFit:c.objectFit,objectPosition:c.objectPosition,transform:c.transform,text:e.textContent.trim(),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}]}));
  const fullStyles=[s,...s.querySelectorAll('*')].map(e=>{const c=getComputedStyle(e);return{tag:e.tagName,cls:e.className.baseVal??e.className,box:box(e),styles:Object.fromEntries([...c].map(k=>[k,c.getPropertyValue(k)]))}});
  const textRects=[];const walk=document.createTreeWalker(s,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode;if(!n.textContent.trim()||!n.parentElement.getClientRects().length)continue;const range=document.createRange();range.selectNode(n);for(const b of range.getClientRects())if(b.width&&b.height)textRects.push({text:n.textContent.trim(),x:b.x-r.x,y:b.y-r.y,width:b.width,height:b.height});}
  return{viewport:{width:innerWidth,height:innerHeight},header:hr.toJSON(),section:r.toJSON(),available:innerHeight-hr.height,spare:innerHeight-hr.height-r.height,sectionScrollHeight:s.scrollHeight,documentOverflow:document.documentElement.scrollWidth-innerWidth,elements,textRects,fullStyles,images:[...s.querySelectorAll('img')].map(e=>({src:e.currentSrc,width:e.naturalWidth,height:e.naturalHeight,complete:e.complete})),copy:s.textContent,dom:s.outerHTML,contactDialog:document.querySelector('#contactDialog').outerHTML,fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,status:f.status,weight:f.weight}))};
 });
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const doc=await cdp.send('DOM.getDocument');data.renderedFonts={};for(const sel of ['#visitTitle','#visit .va26__description','#visit .va26__photo-note','#visit .va26__english','#visit .va26__phone > a']){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:sel});data.renderedFonts[sel]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;}
 await page.screenshot({path:`${evidence}/viewport-${key}.png`,animations:'disabled'});
 await page.addStyleTag({content:'.site-header{visibility:hidden!important}'});await page.locator('#visit').screenshot({path:`${evidence}/section-${key}.png`,animations:'disabled'});
 if(width<768){await page.addStyleTag({content:'#visit.va26{background:#45080c!important}#visit.va26 > .wg-paper{opacity:0!important}'});await page.locator('#visit').screenshot({path:`${evidence}/background-normalized-${key}.png`,animations:'disabled'});}
 data.errors=errors;results.push(data);fs.writeFileSync(`${evidence}/measure-${key}.json`,JSON.stringify(data,null,2));console.log(JSON.stringify({version,key,section:data.section.height,header:data.header.height,spare:data.spare,errors}));await page.close();
}
await browser.close();fs.writeFileSync(`${evidence}/summary.json`,JSON.stringify(results.map(({fullStyles,dom,contactDialog,...r})=>r),null,2));
