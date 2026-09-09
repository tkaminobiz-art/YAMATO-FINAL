import fs from 'node:fs/promises';const {webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const q='qa/nara-independent-copy-20260909',b=await webkit.launch(),p=await b.newPage({viewport:{width:844,height:390}});
await p.route('**/move-to-nara-preview.html',async r=>r.fulfill({contentType:'text/html; charset=utf-8',body:await fs.readFile(`${q}/before/move-to-nara-preview.html`)}));
await p.route('**/assets/top-renewal/nara-journey.js',async r=>r.fulfill({contentType:'text/javascript',body:await fs.readFile(`${q}/before/nara-journey.js`)}));
await p.route('**/assets/top-renewal/nara-journey.css',async r=>r.fulfill({contentType:'text/css',body:await fs.readFile(`${q}/before/nara-journey.css`)}));
await p.goto('http://127.0.0.1:8951/move-to-nara-preview.html',{waitUntil:'networkidle'});await p.screenshot({path:`${q}/before/landscape-844.png`});
const result=await p.evaluate(()=>['.iju__clock','.iju__skip'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return{s,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}));
await fs.writeFile(`${q}/before/landscape-844.json`,JSON.stringify(result,null,2));console.log(result);await b.close();
