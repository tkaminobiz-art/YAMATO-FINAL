import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=new URL('./local/',import.meta.url); const b=await chromium.launch({headless:true});const results=[];
for(const [width,height] of [[1440,900],[390,844]]){
 const p=await b.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});await p.goto('http://127.0.0.1:8953/',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 for(const [name,sel] of [['entrance','.entrance'],['instagram','#instagram']]){await p.locator(sel).scrollIntoViewIfNeeded(); if(name==='instagram')await p.waitForTimeout(5000);await p.screenshot({path:fileURLToPath(new URL(`before-${name}-${width}.png`,out))});}
 const protectedSections=await p.evaluate(()=>Object.fromEntries(['.site-header','#builtProof','#reason','#lineup','#works','#nara','#voice','#faq','#visit','.site-footer','#contactDialog'].map(s=>[s,document.querySelector(s)?.outerHTML||''])));
 results.push({width,height,protected:Object.fromEntries(Object.entries(protectedSections).map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')]))});await p.close();
}
const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:8907/fv-day-cycle.html',{waitUntil:'domcontentloaded'});await p.locator('#cycleVideo').waitFor();await p.waitForTimeout(3000);
const first=await p.locator('#cycleVideo').evaluate(v=>({time:v.currentTime,paused:v.paused,loop:v.loop,muted:v.muted}));await p.waitForTimeout(1500);const second=await p.locator('#cycleVideo').evaluate(v=>({time:v.currentTime,paused:v.paused,loop:v.loop,muted:v.muted}));
const fv=await p.locator('#cycleVideo').evaluate(v=>{let section=v.closest('section');return {buttons:[...section.querySelectorAll('button')].map(e=>e.textContent),visibleConceptNote:section.innerText.includes('※外観の映像は生成コンセプトです。')};});
results.push({fv:{first,second,...fv}});await writeFile(new URL('baseline.json',out),JSON.stringify(results,null,2));await b.close();console.log(JSON.stringify({baselines:results.length,FV:results.at(-1)}));
