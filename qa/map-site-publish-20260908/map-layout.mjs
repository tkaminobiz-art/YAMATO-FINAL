import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.MAP_URL,phase=process.env.LAYOUT_PHASE||'local-fit';
const rows=[];
for(const [engine,name,width]of [[chromium,'chromium',1440],[webkit,'webkit',390],[webkit,'webkit',320]]){
 const browser=await engine.launch();const p=await browser.newPage({viewport:{width,height:844},isMobile:width<900,hasTouch:width<900});
 await p.goto(base+'#/search?view=list');await p.locator('#list .property-card').first().waitFor();await p.locator('#map-view').click();await p.locator('.cluster-pin button').first().waitFor();await p.waitForTimeout(700);
 const state=await p.evaluate(()=>{const c=document.querySelector('#property-map').getBoundingClientRect();let all=0,inside=0;for(const b of document.querySelectorAll('[data-pin],[data-cluster]')){const r=b.getBoundingClientRect(),n=b.dataset.cluster?.split(',').length||1;all+=n;if(r.x+r.width/2>=c.x&&r.x+r.width/2<=c.right&&r.y+r.height/2>=c.y&&r.y+r.height/2<=c.bottom)inside+=n;}return {all,inside};});
 rows.push({engine:name,width,...state});
 if(phase!=='before')assert.equal(state.inside,40,'All listings must be represented inside the visible map after entering from list');
 await p.waitForFunction(()=>[...document.querySelectorAll('.leaflet-tile')].every(i=>i.complete));await p.screenshot({path:`qa/map-site-publish-20260908/${phase}-${name}-${width}-map.png`,scale:'css'});
 await browser.close();
}
writeFileSync(`qa/map-site-publish-20260908/${phase}-layout.json`,JSON.stringify({base,rows},null,2));console.log(JSON.stringify(rows));
