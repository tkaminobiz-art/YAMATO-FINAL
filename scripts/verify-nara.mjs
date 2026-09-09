import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';

export function verifyNara(html){
 const section=html.match(/<section class="na26" id="nara"[\s\S]*?<\/section>/)?.[0];
 assert(section,'Adopted MOVE TO NARA section missing');
 for(const text of ['奈良に移住する','選択肢','大阪で働き、奈良で戸建てを。','奈良県に住む15歳以上の就業者','2020年国勢調査','573,513人','124,184人','約21.7％','平日夕方の快速急行の一例','乗り換えなし','朝の通勤時間を示すものではありません。','駅・駅から住まいの移動は含みません。'])assert(section.includes(text),`Missing Nara copy or scope: ${text}`);
 assert.deepEqual([...section.matchAll(/data-minutes="\d">(\d+)</g)].map(m=>Number(m[1])),[22,28,41],'Keep the documented Namba example');
 for(const origin of ['namba','tsuruhashi'])assert(section.includes(`value="${origin}"`),`Missing origin switch: ${origin}`);
 assert(section.includes('<details class="na26__source">')&&section.includes('大阪難波18:27発'),'Keep the source disclosure and example departure');
 for(const href of ['move-to-nara-preview.html#train','lots-preview.html?view=list'])assert(section.includes(`href="${href}"`),`Missing Nara exit: ${href}`);
 for(const source of ['eki.kintetsu.co.jp','www.pref.osaka.lg.jp/documents/12026/zyuugyouti_tuugakuti20osakahusyuukei.pdf','www.pref.nara.lg.jp/documents/12527/n030406a.xls'])assert(section.includes(source),`Missing first-party source: ${source}`);
 const base='assets/top-renewal/nara-adopted-20260909/';
 for(const name of ['style.css','section.js'])assert(html.includes(base+name)&&existsSync(base+name),`Missing Nara dependency: ${name}`);
 for(const name of ['house-exterior.webp','leaf-background.webp'])assert(existsSync(base+name),`Missing Nara asset: ${name}`);
 assert.equal(createHash('sha256').update(readFileSync(base+'house-exterior.webp')).digest('hex'),'a966f7cd07d43d36795324da6f4b61f287348dd45ecdd76883b243043b845e7b','Keep the original photograph without generative changes');
 assert(!section.includes('<video')&&!section.includes('621,634'),'Nara keeps its still photograph and consistent census population');
 for(const old of ['atlas.css','dark.css','atlas.js'])assert(!html.includes(`nara-atlas/${old}`),'Do not load the retired Nara controller or theme on TOP');
 return {originChoices:2,stations:3,exits:2,censusYear:2020,originalPhoto:true};
}
const html=readFileSync('index.html','utf8');
const result=verifyNara(html);
if(process.argv.includes('--self-test')){
 for(const [from,to] of [['573,513人','621,634人'],['data-minutes="0">22<','data-minutes="0">16<'],['value="tsuruhashi"','value="missing"'],['href="move-to-nara-preview.html#train"','href="#missing"']])assert.throws(()=>verifyNara(html.replace(from,to)));
 console.log('Nara regression checks: 4 known failures rejected');
}
console.log('Nara content verified:',JSON.stringify(result));
