import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='qa/release-washi-voice-20260907',base='https://yamato-final.vercel.app';
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const paths=['index.html','assets/top-renewal/voice-reference/voice.css','assets/top-renewal/washi-gold/washi-gold.css','assets/top-renewal/washi-gold/peony-mask.webp','assets/top-renewal/770-editorial/catalog-swallow-original.svg','assets/top-renewal/770-editorial/cotton-paper-960.webp','assets/top-renewal/hero.js','assets/top-renewal/nara-atlas/atlas.css','assets/top-renewal/nara-atlas/dark.css','assets/top-renewal/guide-maquette/guide.css','assets/top-renewal/built-yamato-evidence.css','works.html','kodawari.html','voice.html','v1top/index.html'];
const checks=[];
for(const path of paths){
 const url=base+'/'+(path==='index.html'?'':path)+'?release=washi-voice-20260907';
 const res=await fetch(url,{signal:AbortSignal.timeout(30000)}),body=Buffer.from(await res.arrayBuffer());
 const item={path,status:res.status,hashMatches:hash(body)===hash(fs.readFileSync(path)),sha256:hash(body)};checks.push(item);
 assert.equal(res.status,200,`${path}: HTTP status`);assert(item.hashMatches,`${path}: live content does not match release`);
}
const response=await fetch(base+'/api/instagram',{signal:AbortSignal.timeout(35000)});
const data=await response.json();
const instagram={status:response.status,posts:Array.isArray(data.posts)?data.posts.length:0};
const result={date:new Date().toISOString(),base,anonymous:true,checks,instagram};
fs.writeFileSync(`${dir}/production-verification.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
