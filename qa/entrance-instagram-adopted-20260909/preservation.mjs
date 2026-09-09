import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const source=execFileSync('git',['show','e67fa4f6b04a1cffb59371f1476b72fa7a3c3a77:index.html'],{encoding:'utf8'}),current=readFileSync('index.html','utf8');
function neutralize(s){return s.replace(/<section class="wg-section wg-white entrance"[\s\S]*?<\/section>/,'GUIDE').replace(/<section class="wg-section wg-white instagram section"[\s\S]*?<\/section>/,'INSTAGRAM').replace('ig-dialog igb-dialog','ig-dialog').replace(/\s*<link rel="stylesheet" href="assets\/top-renewal\/(?:entrance-adopted-20260909|instagram-b-20260909)\/style.css">/g,'').replace(/\s*<script src="assets\/top-renewal\/instagram-b-20260909\/feed.js" defer><\/script>/,'').replace(/>\s+</g,'><').trim();}
assert.equal(neutralize(current),neutralize(source),'No other homepage section, metadata, control or dependency can change');
const oldJS=execFileSync('git',['show','e67fa4f6b04a1cffb59371f1476b72fa7a3c3a77:assets/top-renewal/top.js'],{encoding:'utf8'}),newJS=readFileSync('assets/top-renewal/top.js','utf8');
const branch=" // The adopted TOP owns its selected-post view; other previews retain their existing gallery.\n if(document.querySelector('#instagram[data-instagram-b]')){\n  window.YamatoInstagramB?.init({openDialog});\n  return;\n }\n\n";
assert.equal(newJS.replace(branch,''),oldJS,'The legacy preview gallery and shared menu/dialog functions are byte-identical');
const hashes=JSON.parse(readFileSync('qa/entrance-instagram-adopted-20260909/baseline-hashes.json','utf8'));for(const [path,expected] of Object.entries(hashes))assert.equal(sha(readFileSync(path)),expected,'Protected source changed: '+path);
const report={baseline:'e67fa4f6b04a1cffb59371f1476b72fa7a3c3a77',unrelatedHomepageMarkup:'byte-equivalent after whitespace normalization and two declared section/dependency replacements',legacySharedJS:'byte-identical after the one declared TOP guard',protectedFiles:Object.keys(hashes),passed:true};writeFileSync('qa/entrance-instagram-adopted-20260909/local/preservation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
