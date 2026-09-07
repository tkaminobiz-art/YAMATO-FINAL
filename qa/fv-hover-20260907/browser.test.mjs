import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';

const base=process.env.FV_TEST_URL||'http://127.0.0.1:4175';
const production=base.startsWith('https://');
const dir='qa/fv-hover-20260907';
const report={base,at:new Date().toISOString(),baseline:'4896d61',checks:[],errors:[]};
const player='assets/top-renewal/fv-bright/fv-player.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const state=p=>p.evaluate(()=>({time:document.querySelector('#heroVideo').currentTime,paused:document.querySelector('#heroVideo').paused,scene:document.querySelector('#newHeroCurrent').textContent,auto:document.querySelector('#newHeroPlay').getAttribute('aria-pressed'),label:document.querySelector('#newHeroPlay').getAttribute('aria-label')}));
const scene=(p,n,timeout=12000)=>p.waitForFunction(n=>document.querySelector('#newHeroCurrent').textContent===n,n,{timeout});
async function ready(p){
 await p.goto(base+'/?v=20260907-hover-play',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelector('#heroVideo').currentTime>.5,null,{timeout:30000});
}
async function advances(p){const a=await state(p);await delay(700);const b=await state(p);assert(b.time-a.time>.35,JSON.stringify({a,b}));return {from:a.time,to:b.time};}
async function pauses(p){const a=await state(p);await delay(500);const b=await state(p);assert(Math.abs(b.time-a.time)<.08,JSON.stringify({a,b}));return {from:a.time,to:b.time};}

for(const path of ['index.html','assets/top-renewal/fv-bright/fv-bright.css',...fs.readdirSync('assets/top-renewal/fv-bright').filter(p=>p!== 'fv-player.js' && p!== 'fv-bright.css').map(p=>'assets/top-renewal/fv-bright/'+p)]){
 assert.equal(sha(fs.readFileSync(path)),sha(execFileSync('git',['show','4896d61:'+path],{maxBuffer:32*1024*1024})),path+' changed');
}
report.protectedMarkupStylesAndMedia=true;
if(production){
 for(const path of ['index.html',player]){
  const r=await fetch(base+'/'+path);assert.equal(r.status,200,path);
  assert.equal(sha(Buffer.from(await r.arrayBuffer())),sha(fs.readFileSync(path)),path+' production mismatch');
 }
 report.anonymousProductionByteMatch=true;
}

for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 if(!production){
  const ctx=await browser.newContext({viewport:{width:1440,height:900}}),p=await ctx.newPage();
  await p.route('**/fv-bright/fv-player.js',r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','4896d61:'+player])}));
  await ready(p);await p.mouse.move(700,330);await delay(150);
  const stopped=await pauses(p);assert.equal((await state(p)).auto,'true');
  report.checks.push({engine,test:'baseline-hover-pause-reproduced',...stopped});await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),p=await ctx.newPage();
 p.on('pageerror',e=>report.errors.push(e.message));
 await ready(p);await p.mouse.move(700,330);
 report.checks.push({engine,test:'hover-video-continues',...await advances(p)});
 await scene(p,'03',20000);await scene(p,'04',10000);
 report.checks.push({engine,test:'hover-video-to-stills-and-next-still',scene:(await state(p)).scene});
 if(engine==='chromium'){
  await scene(p,'08',30000);assert.equal((await state(p)).auto,'false');await delay(800);assert.equal((await state(p)).scene,'08');
  await p.locator('#newHeroPlay').click();await scene(p,'01');await p.waitForFunction(()=>document.querySelector('#heroVideo').currentTime>.5);
  report.checks.push({engine,test:'finite-end-and-explicit-restart-preserved'});
 }else{
  await p.locator('.new-hero__chapter').first().click();await scene(p,'01');await p.locator('#newHeroPlay').click();await p.waitForFunction(()=>document.querySelector('#heroVideo').currentTime>.5);
 }
 await p.locator('#newHeroPlay').click();assert.equal((await state(p)).auto,'false');await pauses(p);
 await p.locator('#newHeroPlay').click();assert.equal((await state(p)).auto,'true');await advances(p);
 assert.equal((await state(p)).label,'映像と自動切替を停止');
 await p.locator('#newHeroNext').focus();assert.equal((await state(p)).auto,'false');await pauses(p);
 await p.locator('#newHeroNext').click();await scene(p,'02');assert.equal((await state(p)).auto,'false');
 report.checks.push({engine,test:'pause-resume-manual-and-focus-preserved'});
 await p.locator('.new-hero__chapter').first().click();await scene(p,'01');await p.locator('#newHeroPlay').click();await p.waitForFunction(()=>document.querySelector('#heroVideo').currentTime>.5);
 await p.evaluate(()=>window.scrollTo({top:innerHeight*2,behavior:'instant'}));await delay(250);await pauses(p);
 await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await delay(250);await advances(p);
 report.checks.push({engine,test:'offscreen-pause-and-return-resume-preserved'});
 await p.locator('#newHeroPlay').click();await p.evaluate(()=>document.fonts.ready);
 await p.screenshot({path:dir+'/'+(production?'live':'local')+'-'+engine+'-1440.png'});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await ctx.close();

 const sp=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),s=await sp.newPage();s.on('pageerror',e=>report.errors.push(e.message));
 await ready(s);assert((await s.locator('#heroVideo').evaluate(v=>v.currentSrc)).endsWith('kling-sp.mp4'));
 await s.locator('#newHeroPlay').tap();await pauses(s);await s.locator('#newHeroPlay').tap();await advances(s);
 await s.locator('#newHeroNext').tap();await scene(s,'02');assert.equal((await state(s)).auto,'false');
 await s.evaluate(()=>document.fonts.ready);await s.screenshot({path:dir+'/'+(production?'live':'local')+'-'+engine+'-390.png'});
 assert(await s.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 report.checks.push({engine,test:'mobile-video-touch-controls-and-width-preserved'});await sp.close();

 const rm=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),r=await rm.newPage(),media=[];
 r.on('request',req=>{if(req.url().includes('.mp4'))media.push(req.url());});
 await r.goto(base+'/?v=20260907-hover-play',{waitUntil:'domcontentloaded'});await r.locator('#newHeroNext').click();await scene(r,'02');
 assert(await r.locator('#newHeroPlay').isDisabled());assert.deepEqual(media,[]);
 report.checks.push({engine,test:'reduced-motion-no-video-manual-navigation'});await rm.close();await browser.close();
 console.log(engine,'passed');
}
assert.deepEqual(report.errors,[]);
fs.writeFileSync(dir+'/'+(production?'production':'local')+'-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
