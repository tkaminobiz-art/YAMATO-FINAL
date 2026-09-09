import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const baseline=execFileSync('git',['show','e67fa4f6b04a1cffb59371f1476b72fa7a3c3a77:index.html'],{encoding:'utf8'}),b=await chromium.launch();
for(const width of [1440,390])for(const stage of ['before','after']){const page=await b.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});if(stage==='before')await page.route('http://127.0.0.1:8954/',r=>r.fulfill({status:200,contentType:'text/html',body:baseline}));await page.goto('http://127.0.0.1:8954/',{waitUntil:'networkidle'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#top img,.site-header img')].map(i=>i.decode().catch(()=>{})));scrollTo(0,0)});await page.screenshot({path:fileURLToPath(new URL(`./local/protected-fv-${stage}-${width}.png`,import.meta.url))});await page.close();}
await b.close();console.log('Baseline and packaged FV/header views captured under identical static conditions.');
