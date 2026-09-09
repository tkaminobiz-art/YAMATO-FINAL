const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');import fs from 'node:fs/promises';
const baseHTML=await fs.readFile('qa/voice-visit-adopted-20260909/before-index.html','utf8');
const b=await chromium.launch(),report={lower:[],bounds:[]};
for(const width of [1440,390]){
 const states=[];for(const baseline of [true,false]){
  const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});if(baseline)await p.route('http://127.0.0.1:8948/?mode=still',route=>route.fulfill({contentType:'text/html',body:baseHTML}));await p.goto('http://127.0.0.1:8948/?mode=still',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  const props=['display','position','width','height','padding','margin','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundImage','backgroundColor','border','borderRadius','objectFit','objectPosition','gridTemplateColumns','gap','textAlign'];
  states.push(await p.evaluate(props=>Object.fromEntries(['.site-header','#builtProof','.entrance','#reason','#lineup','#works','#nara','#faq','#instagram','.site-footer'].map(selector=>[selector,[document.querySelector(selector),...document.querySelector(selector).querySelectorAll('*')].map(n=>({tag:n.tagName,values:Object.fromEntries(props.map(k=>[k,getComputedStyle(n)[k]]))}))])),props));await p.close();
 }
 const diffs=[];for(const selector of Object.keys(states[0]))for(let i=0;i<states[0][selector].length;i++){const a=states[0][selector][i],c=states[1][selector][i];for(const prop of Object.keys(a.values))if(a.values[prop]!==c.values[prop])diffs.push({selector,node:i,tag:a.tag,prop,original:a.values[prop],current:c.values[prop]});}
 report.lower.push({width,comparedNodes:Object.values(states[0]).reduce((n,a)=>n+a.length,0),differences:diffs});
}
await b.close();await fs.writeFile('qa/voice-visit-adopted-20260909/style-boundary.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.lower.some(r=>r.differences.length))process.exitCode=1;
