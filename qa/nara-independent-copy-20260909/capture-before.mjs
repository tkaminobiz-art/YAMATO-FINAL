const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');import fs from 'node:fs/promises';
const out='qa/nara-independent-copy-20260909/before';const b=await chromium.launch();
for(const width of [1440,390]){
 const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});await p.goto('http://127.0.0.1:8951/move-to-nara-preview.html',{waitUntil:'networkidle'});await p.screenshot({path:`${out}/page-${width}.png`,fullPage:true});
 const texts=await p.evaluate(()=>{const rows=[],w=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement.closest('script,style')||!/[\u3040-\u30ff\u3400-\u9fff]/.test(n.textContent))continue;const text=n.textContent.trim();if(text)rows.push({tag:n.parentElement.tagName,id:n.parentElement.id,class:n.parentElement.className,text});}for(const e of document.querySelectorAll('[aria-label],[alt],meta[name=description],title'))for(const attr of ['aria-label','alt','content']){const text=e.getAttribute(attr);if(text&&/[\u3040-\u30ff\u3400-\u9fff]/.test(text))rows.push({tag:e.tagName,id:e.id,attribute:attr,text});}return rows;});await fs.writeFile(`${out}/text-${width}.json`,JSON.stringify(texts,null,2));await p.close();
}
await b.close();
