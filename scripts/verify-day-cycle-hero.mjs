// Structural release gate for the adopted 18-second morning/evening/night FV.
// Browser playback, fallback and responsive continuity are verified separately in release QA.
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';

export function verifyDayCycleHero(html){
 const hero=html.match(/<section class="gf-hero"[\s\S]*?<\/section>/)?.[0];
 assert(hero,'Canonical day-cycle FV missing');
 const player='assets/top-renewal/generated-fv-20260909/cycle.js';
 assert.equal(html.split(`src="${player}"`).length-1,1,'Load the accepted FV player once');
 for(const retired of ['assets/top-renewal/hero.js','assets/top-renewal/fv-bright/fv-player.js','assets/top-renewal/fv-day-cycle-2026/cycle.js'])assert(!html.includes(`src="${retired}"`),'Never run a retired player alongside the current FV');
 assert.equal((hero.match(/<video\b/g)||[]).length,1,'Use a single responsive video element');
 assert(hero.includes('id="cycleVideo"')&&hero.includes('muted playsinline loop preload="none"'),'Retain muted inline looping and deferred video loading');
 assert(hero.includes('id="heroStatus"')&&hero.includes('role="status"'),'Preserve accessible media status');
 assert(!/<button\b/.test(hero),'User removed FV playback and time-switch controls');
 assert(!/<p[^>]*>[\s\S]*?※外観の映像は生成コンセプトです。/.test(hero),'Do not restore the removed FV caption');
 assert.equal((hero.match(/data-still="(?:morning|evening|night)"/g)||[]).length,3,'Retain the three static fallbacks');
 for(const file of ['morning-pc.webp','morning-sp.webp','evening-pc.webp','evening-sp.webp','night-pc.webp','night-sp.webp','loop-pc.mp4','loop-sp.mp4']){
  const path='assets/top-renewal/fv-day-cycle-2026/'+file;
  assert(hero.includes(path)&&existsSync(path),`Missing approved FV media: ${path}`);
 }
 for(const text of ['2026年7月10日現在','data-built-count="770"','href="#homePromise"'])assert(hero.includes(text),`Missing FV evidence or reading route: ${text}`);
 const promise=html.match(/<section\b[^>]*id="homePromise"[\s\S]*?<\/section>/)?.[0];
 assert(promise&&!/<a\b/.test(promise),'Approved Promise has no CTA links');
 assert(promise.includes('家族のために、')&&promise.includes('建てるように。'),'Retain adopted Promise headline');
 const js=readFileSync(player,'utf8');
 for(const capability of ['navigator.connection?.saveData','prefers-reduced-motion','visibilitychange','IntersectionObserver'])assert(js.includes(capability),`FV preference/lifecycle handler missing: ${capability}`);
 return {player:1,video:1,stills:6,loopSeconds:18,automatic:true,manualControls:0};
}

const html=readFileSync('index.html','utf8');
const result=verifyDayCycleHero(html);
if(process.argv.includes('--self-test')){
 for(const [from,to] of [['muted playsinline loop','playsinline loop'],['data-built-count="770"','data-built-count="600"'],['loop-sp.mp4','missing-sp.mp4'],['id="heroStatus"','id="removed-status"'],['<video class="gf-video"','<button>朝</button><video class="gf-video"']])assert.throws(()=>verifyDayCycleHero(html.replace(from,to)));
 console.log('FV regression checks: 5 known failures rejected');
}
console.log('Day-cycle FV verified:',JSON.stringify(result));
