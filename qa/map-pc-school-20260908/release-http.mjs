import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createStore} from '../../snapshots/land-payment-20260908-pc/assets/land-payment-study/state.mjs';
import {buildInquiry} from '../../snapshots/land-payment-20260908-pc/assets/land-payment-study/inquiry-contract.mjs';
const out='qa/map-pc-school-20260908/', manifest=JSON.parse(readFileSync('snapshots/land-payment-20260908-pc/manifest.json'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),checks=[];
const check=(name,ok,details)=>{checks.push({name,ok,details});};
for(const origin of ['https://yamato-land-payment-preview.vercel.app','https://yamato-final.vercel.app']){
 for(const entry of manifest.files.filter(e=>e.package.startsWith('public/'))){
  const url=origin+'/'+entry.source,r=await fetch(url,{cache:'no-store'}),hash=sha(Buffer.from(await r.arrayBuffer()));
  check('public file matches source snapshot',r.ok&&hash===entry.sha256,{url,status:r.status,sha256:hash});
 }
 const memory={getItem:()=>null,setItem:()=>{}},store=createStore(memory,memory);
 store.update(s=>{s.inquiry.ids=['s74168777','s77384816'];Object.assign(s.common,{houseId:'kyo',cashMan:'500',years:35,financeId:'nanto'});});
 const body=buildInquiry(store.get()),old=structuredClone(body);old.candidates[0].dataRevision='qa-invalid-revision';
 for(const [name,payload,status] of [['validation',{...body,dryRun:true},200],['invalid revision',{...old,dryRun:true},400],['receiver unavailable',body,503]]){
  const r=await fetch(origin+'/api/property-inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),data=await r.json();
  check('API '+name,r.status===status&&(status===400||(data.stored===false&&data.sent===false)),{origin,status:r.status,response:data});
 }
}
const root=await fetch('https://yamato-land-payment-preview.vercel.app/',{cache:'no-store'});
check('dedicated root matches HTML',root.ok&&sha(Buffer.from(await root.arrayBuffer()))===manifest.files.find(e=>e.source==='land-payment-study.html').sha256);
for(const before of JSON.parse(readFileSync(out+'release-site-before.json'))){
 const r=await fetch(before.url,{cache:'no-store'}),hash=sha(Buffer.from(await r.arrayBuffer()));
 check('main HTML unchanged',r.ok&&hash===before.sha256,{url:before.url,status:r.status,before:before.sha256,after:hash});
}
for(const [path,target] of [['lots.html','/land-payment-study.html#/search'],['lots-preview.html?view=list','/land-payment-study.html#/search?view=list'],['lots-preview.html?view=estimate','/land-payment-study.html#/estimate'],['lots-preview.html','/land-payment-study.html#/search']]){
 const r=await fetch('https://yamato-final.vercel.app/'+path,{redirect:'manual'}),location=r.headers.get('location');
 const actual=new URL(location,'https://yamato-final.vercel.app'),expected=new URL(target,'https://yamato-final.vercel.app');
 check('legacy redirect',r.status===307&&actual.origin===expected.origin&&actual.pathname===expected.pathname&&actual.hash===expected.hash,{path,status:r.status,location});
}
const result={checkedAt:new Date().toISOString(),checks,failures:checks.filter(c=>!c.ok)};
writeFileSync(out+'release-http.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({checks:checks.length,failures:result.failures}));
if(result.failures.length)process.exitCode=1;
