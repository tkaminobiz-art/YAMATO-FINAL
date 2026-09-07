import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='http://127.0.0.1:4175',dir='qa/release-washi-voice-20260907';
const image=fs.readFileSync('assets/top-renewal/sakyo-living-840.webp');
const payload={account:{username:'yamatonoie'},posts:Array.from({length:10},(_,i)=>({id:`qa-${i}`,media_type:'IMAGE',caption:'QA表示確認用の投稿です。本番投稿ではありません。',timestamp:`2026-09-${String(10-i).padStart(2,'0')}T09:00:00Z`,permalink:`https://www.instagram.com/p/QA_FIXTURE_${i}/`,media_url:`https://qa.cdninstagram.com/fixture-${i}.webp`}))};
const out=[];
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 try{for(const width of [390,1440]){
  const p=await browser.newPage({viewport:{width,height:width<768?844:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  await p.route('https://qa.cdninstagram.com/**',r=>r.fulfill({status:200,contentType:'image/webp',body:image}));
  await p.route('**/api/instagram',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)}));
  await p.goto(root+'/index.html',{waitUntil:'domcontentloaded'});await p.evaluate(()=>document.fonts.ready);
  await p.locator('#instagram').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-90));
  await p.locator('.ig-post').first().waitFor();assert.equal(await p.locator('.ig-post').count(),10);
  await p.locator('.ig-post img').evaluateAll(xs=>Promise.all(xs.map(i=>{i.loading='eager';return i.decode();})));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:`${dir}/gallery-fixture-${name}-${width}.png`,scale:'css'});
  await p.locator('.ig-post').first().click();assert(await p.locator('#igDialog').isVisible());await p.locator('#igPostNext').click();assert.equal(await p.locator('#igPostCount').textContent(),'投稿 02 / 10');await p.keyboard.press('Escape');assert(!(await p.locator('#igDialog').isVisible()));
  out.push({name,width,posts:10,fixture:true,galleryAndDialog:true,overflow:false});await p.close();
 }}finally{await browser.close();}
}
fs.writeFileSync(`${dir}/gallery-report.json`,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
