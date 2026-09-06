import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='qa/release-integration-20260907';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const source=fs.readFileSync('index.html','utf8');
const protectedSections={};
for(const [name,opening] of Object.entries({hero:'<section class="new-hero"',built:'<section class="yamato-evidence"',voice:'<section class="voices voice-proof'})){
 const start=source.indexOf(opening),end=source.indexOf('</section>',start)+10;
 protectedSections[name]=hash(source.slice(start,end));
}
protectedSections.v1top=hash(fs.readFileSync('v1top/index.html'));
fs.writeFileSync(`${dir}/protected.json`,JSON.stringify(protectedSections,null,2)+'\n');
const browser=await chromium.launch({headless:true});
for(const [name,width] of [['pc',1440],['sp',390]]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4175/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.fonts.ready);
 for(const id of ['builtProof','voice']){
  const section=page.locator(`#${id}`);await section.scrollIntoViewIfNeeded();
  await section.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));
  await section.screenshot({path:`${dir}/before-${name}-${id}.png`,scale:'css'});
 }
 await page.close();
}
await browser.close();
