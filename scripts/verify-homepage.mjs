// Publishing a preview file is not the same as integrating it into the homepage.
// Keep the approved evidence/voice sections and the existing navigation at the main route.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const readSection=(html,id)=>{
  const opening=html.match(new RegExp(`<section\\b[^>]*id="${id}"[^>]*>`))?.[0] || (id==='entrance' ? html.match(/<section\b[^>]*class="[^"]*\bentrance\b[^"]*"[^>]*>/)?.[0] : null);
  assert(opening,`Homepage is missing #${id}`);
  const start=html.indexOf(opening);
  assert(start>=0,`Homepage is missing ${opening}`);
  const end=html.indexOf('</section>',start);
  assert(end>start,'Section closing tag is missing');
  return html.slice(start,end+10);
};
const builtOpening='builtProof';
const voiceOpening='voice';
const entranceOpening='entrance';
const destinations=['kodawari.html','lots-preview.html?view=list','lots-preview.html?view=estimate','move-to-nara-preview.html'];

export function verifyHomepage(html){
  const built=readSection(html,builtOpening),voice=readSection(html,voiceOpening),entrance=readSection(html,entranceOpening);
  assert.equal((html.match(/id="builtProof"/g)||[]).length,1,'770 section must appear once');
  assert.equal((html.match(/id="voice"/g)||[]).length,1,'Voice section must appear once');
  assert(html.indexOf('id="top"')<html.indexOf('id="builtProof"'),'BUILT BY YAMATO must follow the FV');
  assert(html.indexOf(built)<html.indexOf(entrance),'Guide section must follow BUILT BY YAMATO');
  for(const asset of ['assets/top-renewal/built-yamato-evidence.css','assets/top-renewal/voice-reference/voice.css','assets/top-renewal/washi-gold/washi-gold.css']){
    assert(html.includes(asset),`Approved section dependency is not loaded: ${asset}`);
    assert(existsSync(asset),`Approved section dependency is missing: ${asset}`);
  }
  assert(!html.includes('assets/top-renewal/770-editorial.js'),'Retired 770 counter script must not be loaded');
  assert.equal((built.match(/class="yamato-evidence__item"/g)||[]).length,3,'BUILT BY YAMATO must contain three evidence items');
  assert(built.includes('<strong>770</strong>'),'BUILT BY YAMATO must retain the approved 770 figure');
  for(const label of ['770棟を支えた、','3つの仕事','初回から設計士が同席','設計内容を現場で確認','引き渡し後まで社内で対応','施工事例を見る'])assert(built.includes(label),`BUILT BY YAMATO is missing: ${label}`);
  for(const src of [...built.matchAll(/\bsrc="([^"]+)"/g)].map(m=>m[1]))assert(existsSync(src),`BUILT BY YAMATO image is missing: ${src}`);

  assert(voice.includes('voice-reference wg-section'),'Approved photo-card voice layout must be present');
  assert.equal((voice.match(/class="voice-reference__card"/g)||[]).length,4,'Voice section must contain four cards');
  for(const label of ['お客様の声','費用の説明','自由設計','標準仕様','完成後の対応','お客様の声一覧'])assert(voice.includes(label),`Voice section is missing: ${label}`);
  for(const href of ['voice.html#v01','voice.html#v02','voice.html#v08','voice.html#v33','voice.html'])assert(voice.includes(`href="${href}"`),`Voice destination is missing: ${href}`);
  assert.equal((voice.match(/回答者の住まいとは限りません/g)||[]).length,4,'Every voice photo must retain its correspondence disclaimer');
  const voiceData=readFileSync('data/voices.json','utf8');
  for(const match of voice.matchAll(/class="voice-reference__quote">([^<]+)</g))assert(voiceData.includes(match[1]),'Voice quote must be an exact original excerpt');
  for(const src of [...voice.matchAll(/\bsrc="([^"]+)"/g)].map(m=>m[1]))assert(existsSync(src),`Voice image missing: ${src}`);
  assert.equal((html.match(/class="wg-paper"/g)||[]).length,12,'All twelve approved paper backgrounds must remain');
  for(const asset of ['assets/top-renewal/washi-gold/peony-mask.webp','assets/top-renewal/770-editorial/catalog-swallow-original.svg','assets/top-renewal/770-editorial/cotton-paper-960.webp'])assert(existsSync(asset),`Missing ornament: ${asset}`);

  assert.equal((entrance.match(/class="entry-card"/g)||[]).length,4,'Preserve all four guide cards');
  const quick=entrance.match(/<nav class="quick-links"[\s\S]*?<\/nav>/)?.[0];
  assert(quick,'Quick navigation is missing');
  assert.equal((quick.match(/<a /g)||[]).length,4,'Preserve all four quick links');
  for(const href of destinations)assert(entrance.includes(`href="${href}"`),`Missing guide destination: ${href}`);
  for(const label of ['商品ラインナップ','施工事例','モデルハウス','家づくりのこだわり'])assert(quick.includes(label),`Missing quick link: ${label}`);
  return {sections:['builtProof','voice'],builtItems:3,voiceCards:4,voiceLinks:5,guideCards:4,quickLinks:4,paperSections:12,approvedMarkup:true};
}

const html=readFileSync('index.html','utf8');
const result=verifyHomepage(html);
for(const cls of ['header-links','menu__links','footer-links']){
  const nav=html.match(new RegExp('<(?:nav|div) class="'+cls+'"[^>]*>([\\s\\S]*?)</(?:nav|div)>'))?.[1];
  assert(nav?.includes('href="staff.html"'),'Canonical staff navigation missing: '+cls);
}
const staff=readFileSync('staff.html','utf8');
assert.equal((staff.match(/<article class="staff-card"/g)||[]).length,18,'Staff release must retain 18 profiles');
assert(!staff.includes('staff-preview.html')&&!staff.includes('<aside class="preview-note"'),'Staff page must use canonical links without the draft banner');
// Release integration: verify the canonical pages, not only donor preview routes.
const integrationAssets=['nara-atlas/atlas.css','nara-atlas/dark.css','nara-atlas/atlas.js','guide-maquette/guide.css','quiet-rails.css','quiet-rails.js','washi-motion.css','washi-motion.js','deep-photos.css','deep-photos.js'];
for(const asset of integrationAssets)assert(html.includes(`assets/top-renewal/${asset}`),`Missing integrated dependency: ${asset}`);
assert.equal((html.match(/id="nara"/g)||[]).length,1,'Atlas must be integrated once');
assert(readSection(html,'nara').includes('nara-atlas'),'Nara must retain its approved Atlas layout');
assert.equal((html.match(/entry-card__visual--maquette/g)||[]).length,3,'All three guide illustrations must be integrated');
for(const attr of ['data-quiet-rails','data-washi-motion','data-top-depth'])assert(html.includes(attr),`Missing motion activation: ${attr}`);
assert(!html.includes('動くカードを試す'),'Guide rail should start without opt-in');
assert(readFileSync('works.html','utf8').includes('assets/works/works-yellow.css'),'Canonical works route must use the yellow design');
assert(readFileSync('kodawari.html','utf8').includes('assets/kodawari/editorial.css'),'Canonical kodawari route must use the editorial design');
if(process.argv.includes('--self-test')){
  assert.throws(()=>verifyHomepage(html.replace(readSection(html,builtOpening),'')));
  assert.throws(()=>verifyHomepage(html.replace('>770</strong>','>600</strong>')));
  assert.throws(()=>verifyHomepage(html.replace('class="yamato-evidence__item"','class="removed-item"')));
  assert.throws(()=>verifyHomepage(html.replace('assets/top-renewal/built-yamato-evidence.css','missing.css')));
  assert.throws(()=>verifyHomepage(html.replace('voice-reference wg-section','voices section')));
  assert.throws(()=>verifyHomepage(html.replace('voice.html#v33','voice.html#missing')));
  assert.throws(()=>verifyHomepage(html.replace('class="entry-card"','class="removed-card"')));
  console.log('Homepage regression checks: 7 known failures rejected');
}
console.log('Homepage content verified:',JSON.stringify(result));
