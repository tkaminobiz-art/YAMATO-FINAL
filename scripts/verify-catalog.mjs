import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const d=JSON.parse(readFileSync('data/catalog-content.json','utf8'));
assert.equal(d.pages.length,32);assert.equal(d.chapters.length,10);assert.equal(d.comparisonRows.length,32);
assert.deepEqual(d.pages.map(p=>p.number),Array.from({length:32},(_,i)=>i+1));
assert.equal(new Set(d.pages.map(p=>p.id)).size,32);
for(const p of d.pages){assert(p.title&&p.lead&&d.chapters.some(c=>c.id===p.chapter));}
for(const r of d.comparisonRows){assert.equal(r.values.length,3);assert(r.values.every(v=>typeof v==='string'&&v.trim()));assert(d.pages.some(p=>r.href==='#'+p.id));}
const html=readFileSync('kodawari.html','utf8');
assert.equal((html.match(/data-cr-page="/g)||[]).length,32);
assert.equal((html.match(/data-spec-key="/g)||[]).length,32);
const contents=html.split('<!-- CATALOG CONTENT START -->')[1].split('<!-- CATALOG CONTENT END -->')[0];
assert(!/Q(?:0[1-9]|1[0-4])\b|確認中|R6\.7|2,280|2,080/.test(contents),'Internal or retired assertions reached customer content');
assert.equal(d.pages.find(p=>p.number===7).features.length,4);
assert(contents.includes('メーカー保証の期間を含めて合計10年間')&&contents.includes('有償メンテナンス'));
execFileSync(process.execPath,['scripts/build-catalog.mjs','--check'],{stdio:'inherit'});
console.log('Catalogue source contract passed');
