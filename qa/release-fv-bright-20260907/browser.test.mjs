import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4175',dir='qa/release-fv-bright-20260907',prefix=base.includes('vercel')?'live':'local';
const report={base,views:[],errors:[],motion:[],fallback:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(const [engine,type,widths] of [['chromium',chromium,[320,390,768,900,1024,1440,1920]],['webkit',webkit,[390,1440]]]){
 const browser=await type.launch();
 for(const width of widths){
  console.log('static',engine,width);const height=width===320?667:width===900?1100:width<600?844:900;
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<600});const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  const videos=[];p.on('request',r=>{if(r.url().endsWith('.mp4'))videos.push(r.url());});await p.goto(base+'/',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  for(const index of (width===390||width===1440?[0,1,2,3,4,5,6,7]:[0,1])){
   if(index>0){await p.locator('#newHeroNext').click();await p.waitForFunction(n=>document.querySelector('#newHeroCurrent').textContent===String(n+1).padStart(2,'0'),index);}
   await p.locator('.new-hero__scene.is-active img').evaluate(img=>img.decode());
   const d=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};return {overflow:document.documentElement.scrollWidth-innerWidth,hero:rect(document.querySelector('.new-hero')),title:rect(document.querySelector('.new-hero__story.is-active h2')),cta:rect(document.querySelector('.new-hero__cta')),chapters:rect(document.querySelector('.new-hero__chapters')),controls:rect(document.querySelector('.new-hero__controls')),image:document.querySelector('.new-hero__scene.is-active img').currentSrc};});
   assert(d.overflow<=1,engine+width+' overflow');
   for(const key of ['title','cta','chapters','controls']){assert(d[key].x>=0&&d[key].right<=width+1,key+' horizontal');assert(d[key].y>=d.hero.y&&d[key].bottom<=d.hero.bottom+1,key+' vertical');}
   assert(d.cta.bottom<=d.chapters.y+1,'CTA intersects chapters');assert(d.title.bottom<=d.cta.y+1,'Title intersects CTA');
   if(index<2)assert(d.image.includes(width<=900?(index?'A-dusk-sp':'A-day-sp'):(index?'A-dusk-pc':'A-gpt-image-2')),'Wrong responsive image');
   if(width===390||width===1440)await p.screenshot({path:dir+'/'+prefix+'-'+engine+'-'+width+'-scene-'+index+'.png'});
   report.views.push({engine,width,height,index,...d});
  }
  assert.equal(videos.length,0,'Reduced motion requested video');
  await p.locator('.new-hero__cta').click();await p.waitForURL('**/kodawari.html');assert(await p.locator('h1').count()>0);await ctx.close();
 }
 // Regular playback: actual clock, not mock time, desktop and touch-emulated mobile.
 for(const width of [390,1440]){
  console.log('motion',engine,width);
  const ctx=await browser.newContext({viewport:{width,height:width<600?844:900},hasTouch:width<600});const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(base+'/',{waitUntil:'domcontentloaded'});await p.mouse.move(1,1);await p.waitForFunction(()=>document.querySelector('#heroVideo').currentTime>.3,{},{timeout:25000});
  const v=await p.locator('#heroVideo').evaluate(v=>({src:v.currentSrc,muted:v.muted,inline:v.playsInline,ready:v.readyState}));
  assert(v.src.endsWith(width<600?'kling-sp.mp4':'kling-pc.mp4'));assert(v.muted&&v.inline);
  await p.locator('#newHeroPlay').click();const t=await p.locator('#heroVideo').evaluate(v=>v.currentTime);await sleep(500);assert(Math.abs(await p.locator('#heroVideo').evaluate(v=>v.currentTime)-t)<.08);
  await p.locator('#newHeroPlay').click();await p.mouse.move(1,1);await p.waitForFunction(t=>document.querySelector('#heroVideo').currentTime>t+.2,t);
  await p.evaluate(()=>scrollTo(0,innerHeight*2));await sleep(250);const off=await p.locator('#heroVideo').evaluate(v=>v.currentTime);await sleep(400);assert(Math.abs(await p.locator('#heroVideo').evaluate(v=>v.currentTime)-off)<.08);
  await p.evaluate(()=>scrollTo(0,0));await p.mouse.move(1,1);
  await p.waitForFunction(()=>document.querySelector('#newHeroCurrent').textContent==='03',{},{timeout:22000});
  // Remain at 03 or later after the video end hold; capture actual finite progression.
  const sequence=[];for(let i=0;i<34;i++){const s=await p.locator('#newHeroCurrent').textContent();if(sequence.at(-1)!==s)sequence.push(s);if(s==='08'&&await p.locator('#newHeroPlay').getAttribute('aria-pressed')==='false')break;await sleep(1000);}
  assert.equal(await p.locator('#newHeroCurrent').textContent(),'08');assert.equal(await p.locator('#newHeroPlay').getAttribute('aria-pressed'),'false');await sleep(400);assert.equal(await p.locator('#newHeroCurrent').textContent(),'08');
  await p.locator('.new-hero__chapter[data-chapter="0"]').click();await p.waitForFunction(()=>document.querySelector('#newHeroCurrent').textContent==='01');await p.locator('#newHeroNext').click();await p.waitForFunction(()=>document.querySelector('#newHeroCurrent').textContent==='02');await p.locator('#newHeroPlay').click();await p.mouse.move(1,1);await p.waitForFunction(()=>document.querySelector('#newHeroCurrent').textContent==='03',{},{timeout:5000});
  report.motion.push({engine,width,...v,finiteSequence:sequence,pauseResume:true,offscreenPause:true,manualDuskResume:true});await ctx.close();
 }
 await browser.close();
}
// Isolate no-video paths and rejected playback without making real requests.
const browser=await chromium.launch();
for(const kind of ['save-data','video-error','play-rejection']){
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 if(kind==='save-data')await ctx.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true}}));
 if(kind==='play-rejection')await ctx.addInitScript(()=>HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('blocked','NotAllowedError'));});
 const p=await ctx.newPage(),requests=[];p.on('request',r=>{if(r.url().endsWith('.mp4'))requests.push(r.url());});if(kind==='video-error')await p.route('**/*.mp4',r=>r.abort());
 await p.goto(base+'/');await sleep(1000);if(kind==='save-data'){assert.equal(requests.length,0);assert.equal(await p.locator('#newHeroPlay').getAttribute('aria-pressed'),'false');}
 else await p.waitForFunction(()=>document.querySelector('#heroMediaStatus').textContent.includes('静止画'));
 await p.locator('#newHeroNext').click();await p.waitForFunction(()=>document.querySelector('#newHeroCurrent').textContent==='02');await p.locator('.new-hero__scene.is-active img').evaluate(i=>i.decode());report.fallback.push({kind,videoRequests:requests.length,manualDusk:true});await ctx.close();
}
await browser.close();assert.deepEqual(report.errors,[]);fs.writeFileSync(dir+'/'+prefix+'-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({views:report.views.length,motion:report.motion,fallback:report.fallback,errors:report.errors}));
