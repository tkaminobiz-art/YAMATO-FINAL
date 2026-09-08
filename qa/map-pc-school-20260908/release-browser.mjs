import {chromium,webkit} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFileSync} from 'node:fs';
import {properties,queryCatalog} from '../../snapshots/land-payment-20260908-pc/assets/land-payment-study/catalog.mjs';
const out='qa/map-pc-school-20260908/',checks=[],shots=[],errors=[];
for(const [site,base] of [['dedicated','https://yamato-land-payment-preview.vercel.app/'],['main','https://yamato-final.vercel.app/land-payment-study.html']]){
 for(const [engine,device,width,height] of [[chromium,'pc',1280,720],[webkit,'sp',390,844]]){
  const label=site+'-'+device,b=await engine.launch(engine===chromium?{executablePath:'/Users/takahirokamino/.agent-browser/browsers/chrome-149.0.7827.55/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'}:{});
  const p=await b.newPage({viewport:{width,height},isMobile:device==='sp',hasTouch:device==='sp',reducedMotion:'reduce'});p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push({label,error:e.message}));
  // Retain Leaflet's map object for bounds checks; all actions use the production UI.
  await p.route('**/assets/land-payment-study/app.mjs',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:'const qaCreateMap=L.map;L.map=function(...args){const m=qaCreateMap.apply(this,args);globalThis.__qaMap=m;return m;};\n'+await r.text()});});
  const check=(name,ok,details)=>{checks.push({label,name,ok,details});if(!ok)throw Error(label+': '+name);};
  const settle=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const ids=()=>p.locator('#list .property-card').evaluateAll(ns=>ns.map(n=>n.dataset.id));
  const shot=async name=>{await settle();await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.height&&r.bottom>0&&r.top<innerHeight}).map(i=>Promise.race([i.decode().catch(()=>{}),new Promise(r=>setTimeout(r,3500))])));});const path=out+'release-'+label+'-'+name+'.png';await p.screenshot({path,scale:'css'});shots.push({label,name,path});check(name+' no overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));};
  try{
   await p.goto(base+'#/search?view=list',{waitUntil:'domcontentloaded'});await p.locator('#count').filter({hasText:'40件'}).waitFor();await settle();
   check('40 listings',await p.locator('#list .property-card').count()===40);
   check('PC list entry shows map; SP keeps list',await p.locator('#map-shell').isVisible()===(device==='pc'));
   if(device==='sp')await p.locator('#map-view').click();await p.locator('.leaflet-tile-loaded').first().waitFor();await settle();
   check('all 40 coordinates inside map',await p.evaluate(rows=>rows.every(r=>__qaMap.getBounds().contains([r.lat,r.lng])),properties));
   if(device==='pc')check('map fits first viewport',await p.locator('#map-shell').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
   await shot('map');
   if(device==='pc'){await p.mouse.move(640,500);await p.mouse.wheel(0,1100);await p.waitForFunction(()=>scrollY>900);check('map scrolls away normally',await p.locator('#map-shell').evaluate(e=>e.getBoundingClientRect().bottom<0));await p.evaluate(()=>scrollTo(0,0));await p.locator('.results-jump').click();}
   else await p.locator('#list-view').click();
   for(const sort of ['primary','junior']){await p.locator('#sort').selectOption(sort);check(sort+' sort matches source',JSON.stringify(await ids())===JSON.stringify(queryCatalog({},sort).map(r=>r.property.id)));}
   check('missing junior distance last',(await ids()).at(-1)==='s78578283');
   await p.locator('#open-filters').click();await p.locator('#school-filters summary').click();await p.locator('[name=primary]').selectOption('800');await p.locator('[name=junior]').selectOption('1200');await p.locator('#filter-form [type=submit]').click();
   const expected=queryCatalog({primary:800,junior:1200},'junior').map(r=>r.property.id);
   check('combined distance filter',JSON.stringify(await ids())===JSON.stringify(expected));
   await p.reload({waitUntil:'domcontentloaded'});await p.locator('#count').filter({hasText:expected.length+'件'}).waitFor();await settle();
   check('reload retains filters and sort',JSON.stringify(await ids())===JSON.stringify(expected)&&await p.locator('#sort').inputValue()==='junior'&&p.url().includes('primary=800')&&p.url().includes('junior=1200'));
   if(device==='pc'){await p.locator('.results-jump').click();check('list anchor survives reload',await p.locator('.results-heading').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.top<innerHeight;}));}
   await shot('filtered-list');
   const first=(await ids())[0];await p.locator(`#list [data-map-select=${first}]`).click();check('list to map selects property',await p.locator('#selected-card').isVisible());
   await p.locator('#selected-card [data-property]').click();await p.locator('.property-detail').waitFor();check('property detail route',p.url().endsWith('/'+first));await p.goBack();await p.locator('#selected-card').waitFor();check('back retains selection',await p.locator('#selected-card [data-property]').getAttribute('data-property')===first);
   if(site==='main')for(const [path,page] of [['lots.html','search'],['lots-preview.html?view=list','search'],['lots-preview.html?view=estimate','estimate'],['lots-preview.html','search']]){await p.goto('https://yamato-final.vercel.app/'+path,{waitUntil:'domcontentloaded'});await p.locator(page==='search'?'#search-screen':'#estimate-form').waitFor();const u=new URL(p.url()),correctRoute=page==='estimate'?/^#\/estimate\/[a-z0-9-]+$/.test(u.hash):u.hash===(path.includes('view=list')?'#/search?view=list':'#/search');check('legacy entry '+path,u.pathname==='/land-payment-study.html'&&correctRoute,{url:p.url()});}
   check('no page errors',!errors.some(e=>e.label===label));
  }finally{await b.close();writeFileSync(out+'release-browser.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,shots,errors},null,2)+'\n');}
 }
}
console.log(JSON.stringify({checks:checks.length,failures:checks.filter(c=>!c.ok),screenshots:shots.length,errors}));
