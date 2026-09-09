import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const pw=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const qa='qa/nara-independent-copy-20260909',base=process.env.BASE_URL||'http://127.0.0.1:8951',out=process.env.QA_OUT||`${qa}/local`;
await fs.mkdir(out,{recursive:true});
const source=await fs.readFile('assets/top-renewal/nara-journey.js','utf8');
const oldSource=await fs.readFile(`${qa}/before/nara-journey.js`,'utf8');
const extract=s=>vm.runInNewContext(s.match(/var jBeats=(\[[\s\S]*?\n    \]);/)[1]);
const beats=extract(source),oldBeats=extract(oldSource),normalize=s=>s.replace(/var jBeats=\[[\s\S]*?\n    \];/,'var jBeats=DISPLAY_COPY;');
assert.equal(normalize(source),normalize(oldSource),'GSAP logic preserved');
assert.deepEqual(JSON.parse(JSON.stringify(beats.map(({title,deck,cap,...r})=>r))),JSON.parse(JSON.stringify(oldBeats.map(({title,deck,cap,...r})=>r))),'journey times/stops/progress preserved');
const baseline=JSON.parse(await fs.readFile(`${qa}/baseline.json`));
for(const [file,hash]of Object.entries(baseline.protected))assert.equal(createHash('sha256').update(await fs.readFile(file)).digest('hex'),hash,`protected ${file}`);
const schedule=[['大阪難波','18:25','18:27'],['近鉄日本橋','18:28','18:28'],['大阪上本町','18:30','18:30'],['鶴橋','18:32','18:33'],['生駒','18:49','18:50'],['学園前','18:55','18:56'],['大和西大寺','19:00','19:02'],['新大宮','19:05','19:05'],['近鉄奈良','19:08','—']];
const cases=[
 {name:'chromium-pc',engine:'chromium',width:1440,height:900,mode:'normal'},
 {name:'chromium-sp',engine:'chromium',width:390,height:900,mode:'normal'},
 {name:'webkit-pc',engine:'webkit',width:1440,height:900,mode:'normal'},
 {name:'webkit-sp',engine:'webkit',width:390,height:900,mode:'normal'},
 {name:'chromium-pc-reduced',engine:'chromium',width:1440,height:900,mode:'reduce'},
 {name:'webkit-sp-reduced',engine:'webkit',width:390,height:900,mode:'reduce'},
 {name:'chromium-sp-nojs',engine:'chromium',width:390,height:900,mode:'nojs'},
 {name:'chromium-sp-blocked-gsap',engine:'chromium',width:390,height:900,mode:'blocked'},
 {name:'chromium-small',engine:'chromium',width:320,height:640,mode:'normal'},
 {name:'webkit-landscape',engine:'webkit',width:844,height:390,mode:'normal'}
];
const results=[];
function check(ok,msg){assert.ok(ok,msg);}
async function waitAnchor(page,selector){for(let i=0;i<50;i++){if(await page.evaluate(s=>Math.abs(document.querySelector(s).getBoundingClientRect().top-(parseFloat(getComputedStyle(document.querySelector(s)).scrollMarginTop)||0)-(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0))<5,selector))return;await new Promise(r=>setTimeout(r,100));}throw Error('anchor did not reach its CSS scroll-padding position: '+selector);}
async function layout(page){return await page.evaluate(()=>{
 const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&Number(s.opacity)>.5&&r.width>1&&r.height>1};
 const sels=['.iju__eyebrow','.iju__clock','#ijuPhase','#ijuTitle','#ijuDeck','#ijuConcept','.iju__skip','.iju__mode','.iju__rail-journey','.iju__arrival-summary'];
 const boxes=sels.map(s=>{const e=document.querySelector(s);if(!visible(e))return null;const range=document.createRange();range.selectNodeContents(e);const b=['.iju__skip','.iju__rail-journey','.iju__arrival-summary'].includes(s)?e.getBoundingClientRect():range.getBoundingClientRect();return {s,x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};}).filter(Boolean);
 const overflow=[];for(const s of ['#ijuTitle','#ijuDeck','.iju__clock','.iju__eyebrow','.iju__arrival-list']){const e=document.querySelector(s);if(visible(e)&&e.scrollWidth>e.clientWidth+2)overflow.push(s);}
 return {scrollWidth:document.documentElement.scrollWidth,width:innerWidth,boxes,overflow};
 });}
for(const c of cases.filter(c=>!process.env.QA_CASES||process.env.QA_CASES.split(',').includes(c.name))){
 const browser=await pw[c.engine].launch();const context=await browser.newContext({viewport:{width:c.width,height:c.height},deviceScaleFactor:1,reducedMotion:c.mode==='reduce'?'reduce':'no-preference',javaScriptEnabled:c.mode!=='nojs'});
 if(c.mode==='blocked')await context.route('**/gsap@*/**',r=>r.abort());
 const page=await context.newPage(),errors=[],badResponses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});
 const result={...c,beats:[],checks:[]};
 try{
 await page.goto(`${base}/move-to-nara-preview.html`,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`${out}/${c.name}-hero.png`});
 const shell=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name=description]').content,robots:document.querySelector('meta[name=robots]').content,forms:document.forms.length,links:[...document.querySelectorAll('a')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href'),target:a.target,rel:a.rel})),table:[...document.querySelectorAll('.timetable tbody tr')].map(r=>[...r.children].map(c=>c.textContent.trim())),images:[...document.querySelectorAll('img,source')].map(e=>Object.fromEntries([...e.attributes].filter(a=>['src','srcset','media','type','width','height','alt'].includes(a.name)).map(a=>[a.name,a.value])))}));
 assert.deepEqual(shell.table,schedule);assert.equal(shell.robots,'noindex,nofollow');assert.equal(shell.forms,0);
 check(shell.links.filter(a=>a.href==='tel:0742361123').length===2,'two real telephone hrefs');
 for(const a of shell.links){if(a.href.startsWith('#'))check(await page.locator(a.href).count()===1,`anchor ${a.href}`);if(a.target==='_blank')check(a.rel.includes('noopener')&&a.rel.includes('noreferrer'),'external rel');}
 if(c.mode==='normal'){
 await page.waitForFunction(()=>window.ScrollTrigger?.getById('nara-journey'));
 for(const [i,progress]of [0,.2,.36,.53,.61,.7,.81,.95].entries()){
  await page.evaluate(p=>{const st=ScrollTrigger.getById('nara-journey');window.scrollTo({top:st.start+(st.end-st.start)*p,behavior:'instant'});},progress);
  await page.waitForFunction(({clock,title,cap})=>document.querySelector('#ijuClock').textContent===clock&&document.querySelector('#ijuTitle').textContent===title&&document.querySelector('#ijuClockCap').textContent===cap&&Number(getComputedStyle(document.querySelector('#ijuDeck')).opacity)>.99,beats[i]);
  if(i===7)await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#ijuArrivalSummary')).opacity)>.99);
  const geom=await layout(page);check(geom.scrollWidth<=c.width+1,'page horizontal overflow');check(geom.overflow.length===0,`text clipping ${geom.overflow}`);
  const stage=await page.locator('#ijuStage').boundingBox();for(const box of geom.boxes){check(box.x>=-1&&box.right<=c.width+1,`${box.s} outside width`);check(box.y>=stage.y-1&&box.bottom<=stage.y+stage.height+1,`${box.s} outside stage`);}
  // Non-overlap of independent visible panels. Compact landscape may have pre-existing layout limits; report explicitly.
  const overlaps=[];for(let a=0;a<geom.boxes.length;a++)for(let b=a+1;b<geom.boxes.length;b++){const x=geom.boxes[a],y=geom.boxes[b];if(Math.min(x.right,y.right)-Math.max(x.x,y.x)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.y,y.y)>1)overlaps.push([x.s,y.s]);}
  check(!overlaps.length,`overlapping panels: ${JSON.stringify(overlaps)}`);
  await page.screenshot({path:`${out}/${c.name}-beat-${i+1}.png`});
  result.beats.push({index:i+1,progress,clock:beats[i].clock,title:beats[i].title,deck:beats[i].deck,geom,overlaps});
 }
 }else check(!(await page.locator('#iju').getAttribute('class')).includes('is-cine'),'fallback remains static');
 await page.locator('.iju__skip').click();await waitAnchor(page,'#train');result.checks.push('hero skip reaches train');
 await page.locator('.timetable summary').click();check(await page.locator('.timetable').getAttribute('open')!==null,'details open');check(await page.locator('.timetable tbody tr').count()===9,'all 9 stops present');
 await page.locator('.timetable').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${c.name}-timetable.png`});
 await page.locator('.timetable summary').click();check(await page.locator('.timetable').getAttribute('open')===null,'details close');
 for(const selector of ['#train','#last-mile','#drive','.closing','.footer']){
 await page.locator(selector).scrollIntoViewIfNeeded();await page.evaluate(s=>window.scrollTo({top:document.querySelector(s).getBoundingClientRect().top+scrollY-24,behavior:'instant'}),selector);
 await page.screenshot({path:`${out}/${c.name}-${selector.replace(/[.#]/g,'')}.png`});
 }
 for(const sel of ['.section-nav a[href="#train"]','.section-nav a[href="#last-mile"]','.section-nav a[href="#drive"]','.section-heading a[href="#last-mile"]','.journey-condition a']){
 const target=await page.locator(sel).getAttribute('href');await page.locator(sel).click();await waitAnchor(page,target);result.checks.push(`${sel} -> ${target}`);
 }
 const bodyOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);check(!bodyOverflow,'body overflow');
 check(errors.length===0,`page errors ${errors}`);check(badResponses.length===0,`responses ${JSON.stringify(badResponses)}`);
 if(c.mode==='reduce'){
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${c.name}-full.png`,fullPage:true});
 const inventory=await page.evaluate(()=>{const rows=[],w=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement.closest('script,style')||!/[\u3040-\u30ff\u3400-\u9fff]/.test(n.textContent))continue;const text=n.textContent.trim();if(text)rows.push({tag:n.parentElement.tagName,id:n.parentElement.id,class:n.parentElement.className,text});}for(const e of document.querySelectorAll('[aria-label],[alt],meta[name=description]'))for(const attr of ['aria-label','alt','content']){const text=e.getAttribute(attr);if(text&&/[\u3040-\u30ff\u3400-\u9fff]/.test(text))rows.push({tag:e.tagName,id:e.id,attribute:attr,text});}return rows;});
 await fs.writeFile(`${out}/text-${c.width}.json`,JSON.stringify(inventory,null,2));
 }
 result.status='pass';result.shell=shell;result.errors=errors;result.badResponses=badResponses;
 }catch(e){result.status='fail';result.error=e.stack;await page.screenshot({path:`${out}/${c.name}-FAIL.png`}).catch(()=>{});}
 await browser.close();results.push(result);await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log(c.name,result.status,result.error?.split('\n')[0]||'');
}
if(results.some(r=>r.status!=='pass'))process.exitCode=1;
