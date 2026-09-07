import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const url=process.env.PROMISE_CHECK_URL||'http://127.0.0.1:4175/';
const phase=process.env.PROMISE_CHECK_PHASE||'local',dir='qa/hero-promise-20260907/';
const expected='物価高でも、戸建てをあきらめないでください。',report={url,views:[],errors:[]};
for(const [engine,type,widths] of [['chromium',chromium,[1440,1024,901,390,320]],['webkit',webkit,[1440,390]]]){
 const browser=await type.launch();
 for(const width of widths){
  const height=width>900?900:844,ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),p=await ctx.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));
  const response=await p.goto(url+'?mode=still&v=20260907-promise',{waitUntil:'load'});
  assert.equal(response.status(),200);assert.equal(await response.text(),fs.readFileSync('index.html','utf8'));
  await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.locator('.new-hero__promise').textContent(),expected);
  const result=await p.locator('.new-hero__promise').evaluate(el=>{
   const tops=[],bounds=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   for(let node;node=walker.nextNode();)for(let i=0;i<node.length;i++){const r=document.createRange();r.setStart(node,i);r.setEnd(node,i+1);const b=r.getBoundingClientRect();if(b.width&&b.height){tops.push(Math.round(b.top));bounds.push({left:b.left,right:b.right});}}
   return{lines:new Set(tops).size,left:Math.min(...bounds.map(b=>b.left)),right:Math.max(...bounds.map(b=>b.right)),fontSize:getComputedStyle(el).fontSize,overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  if(width>900)assert.equal(result.lines,1,`${engine} ${width} desktop must stay on one line`);
  assert(result.left>=0&&result.right<=width,`${engine} ${width} text clipped`);assert(!result.overflow);
  const heading=await p.locator('.new-hero__promise').boundingBox(),cta=await p.locator('.new-hero__cta').boundingBox();assert(heading.y+heading.height<=cta.y+1);
  await p.screenshot({path:dir+phase+'-'+engine+'-'+width+'.png',scale:'css'});
  await p.locator('.new-hero__chapter[data-chapter="1"]').click();await p.waitForFunction(()=>document.querySelector('.new-hero').dataset.activeChapter==='1');
  await p.locator('.new-hero__chapter[data-chapter="0"]').click();await p.waitForFunction(()=>document.querySelector('.new-hero').dataset.activeChapter==='0');
  assert.equal(await p.locator('.new-hero__promise').textContent(),expected);
  assert.equal(await p.locator('.new-hero__cta').getAttribute('href'),'kodawari.html');
  report.views.push({engine,width,...result,chapterControls:true});await ctx.close();
 }
 await browser.close();
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(dir+phase+'-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
