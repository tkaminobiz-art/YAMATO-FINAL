import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const exec=promisify(execFile),base=process.env.SITE_URL,phase=process.env.PHASE||'preview';
assert(base,'SITE_URL is required');
const out='qa/map-site-publish-20260908',report={base,phase,at:new Date().toISOString(),views:[],errors:[]};
const cache=new Map();
async function protectedResponse(url){
 if(!cache.has(url))cache.set(url,(async()=>{
  const u=new URL(url),separator='\n__YAMATO_CURL_META__\n';
  const {stdout}=await exec('vercel',['curl',u.pathname+u.search,'--deployment',base,'--scope','office-ks-projects','--','--silent','--show-error','--write-out',separator+'%{http_code}\n%{content_type}\n%{redirect_url}'],{encoding:'buffer',maxBuffer:12000000,timeout:45000});
  const pos=stdout.lastIndexOf(separator);assert(pos>=0);const [code,type,location]=stdout.subarray(pos+separator.length).toString().split('\n');
  let body=stdout.subarray(0,pos);
  // Vercel injects its review toolbar into protected previews. Exclude that tooling from app QA.
  if(type?.includes('text/html'))body=Buffer.from(body.toString().replace(/<script\b[^>]*src="https:\/\/vercel\.live\/[^"]*"[^>]*><\/script>/g,''));
  return {status:Number(code),headers:{...(type?{'content-type':type}:{}),...(location?{location}:{})},body};
 })());return cache.get(url);
}
for(const [engine,name,width] of [[chromium,'chromium',1440],[webkit,'webkit',390],[webkit,'webkit',320]]){
 const browser=await engine.launch();const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:width<900,hasTouch:width<900,reducedMotion:'reduce'});
 if(phase==='preview')await ctx.route(base+'/**',async route=>route.fulfill(await protectedResponse(route.request().url())));
 const p=await ctx.newPage();p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push({name,width,error:e.message}));
 const navigate=async path=>{
  let url=base+path;
  if(phase==='preview')for(let n=0;n<5;n++){
   const r=await protectedResponse(url);
   if(r.status<300||r.status>=400)break;
   assert(r.headers.location,'redirect location');url=new URL(r.headers.location,url).href;
  }
  await p.goto(url);
 };
 const screenshot=async label=>{await p.waitForTimeout(650);await p.waitForFunction(()=>[...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}).every(i=>i.complete),{},{timeout:15000});await p.screenshot({path:`${out}/${phase}-${name}-${width}-${label}.png`,scale:'css'});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');};
 try{
  await navigate('/lots-preview.html?view=list');await p.waitForSelector('#list .property-card',{state:'attached'});
  assert.equal(new URL(p.url()).pathname,'/land-payment-study.html');assert(await p.locator('#workspace').evaluate(e=>e.classList.contains('list-mode')));
  assert.equal(await p.locator('#list .property-card').count(),40);await screenshot('list');
  await p.locator('#map-view').click();await p.waitForSelector('.cluster-pin button');await p.waitForSelector('.leaflet-tile-loaded');await screenshot('map');
  await p.locator('#open-filters').click();await p.locator('#filter-form [name=price]').selectOption('1000');await p.locator('#filter-form [type=submit]').click();assert.equal(await p.locator('#list .property-card').count(),5);
  await p.reload();await p.waitForSelector('#list .property-card',{state:'attached'});assert.equal(await p.locator('#list .property-card').count(),5);
  await p.locator('#list-view').click();await p.locator('#list [data-property]').first().click();await p.waitForSelector('[data-estimate]');await screenshot('property');
  await p.locator('[data-estimate]').first().click();await p.locator('[name=houseId][value=kyo]').check();await p.locator('#estimate-form [type=submit]').click();await p.waitForSelector('#monthly-value');assert.match(await p.locator('#monthly-value').innerText(),/\d/);await screenshot('result');
  await navigate('/lots-preview.html?view=estimate');await p.waitForSelector('#estimate-form');assert(new URL(p.url()).hash.startsWith('#/estimate/'));
  await navigate('/lots.html');await p.waitForSelector('#list .property-card',{state:'attached'});assert.equal(new URL(p.url()).pathname,'/land-payment-study.html');assert.equal(new URL(p.url()).hash.startsWith('#/search'),true);
  report.views.push({engine:name,width,list:40,mapTiles:true,filterReload:5,property:true,calculation:true,legacyList:true,legacyEstimate:true,legacyMap:true,overflow:false});
 }catch(error){await p.screenshot({path:`${out}/${phase}-failure.png`,scale:'css'});report.failure={url:p.url(),title:await p.title(),body:(await p.locator('body').innerText()).slice(0,1200)};throw error;}finally{await browser.close();writeFileSync(`${out}/${phase}-report.json`,JSON.stringify(report,null,2));}
}
assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
