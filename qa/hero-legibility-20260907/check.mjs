import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const url=process.env.HERO_CHECK_URL||'http://127.0.0.1:4175/',phase=process.env.HERO_CHECK_PHASE||'local',dir='qa/hero-legibility-20260907/';
const report={url,views:[],errors:[]};
for(const [name,type,widths] of [['chromium',chromium,[1440,1024,901,390,320]],['webkit',webkit,[1440,390]]]){
 const browser=await type.launch();
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:width>900?900:844},reducedMotion:'reduce'}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  const response=await p.goto(url+'?mode=still&v=20260907-readable',{waitUntil:'load'});assert.equal(response.status(),200);assert.equal(await response.text(),fs.readFileSync('index.html','utf8'));await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.locator('.new-hero__promise').textContent(),'物価高でも、戸建てをあきらめないでください。');
  const result=await p.locator('.new-hero__promise').evaluate(el=>{
   const tops=[],bounds=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let n;n=walker.nextNode();)for(let i=0;i<n.length;i++){const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+1);const b=r.getBoundingClientRect();if(b.width&&b.height){tops.push(Math.round(b.top));bounds.push(b);}}
   const s=getComputedStyle(el);return{lines:new Set(tops).size,left:Math.min(...bounds.map(b=>b.left)),right:Math.max(...bounds.map(b=>b.right)),family:s.fontFamily,weight:s.fontWeight,tracking:s.letterSpacing,scrim:getComputedStyle(el,'::before').backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  if(width>900)assert.equal(result.lines,1);assert(result.left>=0&&result.right<=width);assert(!result.overflow);assert.equal(result.weight,'500');assert(result.family.includes('Noto Sans JP'));assert.equal(result.scrim,'rgba(7, 13, 17, 0.72)');
  const h=await p.locator('.new-hero__promise').boundingBox(),c=await p.locator('.new-hero__cta').boundingBox();assert(h.y+h.height<=c.y+1);await p.screenshot({path:dir+phase+'-'+name+'-'+width+'.png',scale:'css'});
  await p.locator('#newHeroNext').click();await p.waitForFunction(()=>document.querySelectorAll('.new-hero__scene')[1].classList.contains('is-active'));await p.screenshot({path:dir+phase+'-'+name+'-'+width+'-evening.png',scale:'css'});
  assert.equal(await p.locator('.new-hero__cta').getAttribute('href'),'kodawari.html');report.views.push({engine:name,width,...result,sceneSwitch:true});await ctx.close();
 }
 await browser.close();
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(dir+phase+'-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
