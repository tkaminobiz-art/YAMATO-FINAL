// Publishing a preview file is not the same as integrating it into the homepage.
// Keep the approved evidence/voice sections and the existing navigation at the main route.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const readSection=(html,opening)=>{
  const start=html.indexOf(opening);
  assert(start>=0,`Homepage is missing ${opening}`);
  const end=html.indexOf('</section>',start);
  assert(end>start,'Section closing tag is missing');
  return html.slice(start,end+10);
};
const builtOpening='<section class="yamato-evidence"';
const voiceOpening='<section class="voices voice-proof';
const entranceOpening='<section class="entrance"';
const destinations=['kodawari.html','lots-preview.html?view=list','lots-preview.html?view=estimate','move-to-nara-preview.html'];

export function verifyHomepage(html){
  const built=readSection(html,builtOpening),voice=readSection(html,voiceOpening),entrance=readSection(html,entranceOpening);
  assert.equal((html.match(/id="builtProof"/g)||[]).length,1,'770 section must appear once');
  assert.equal((html.match(/id="voice"/g)||[]).length,1,'Voice section must appear once');
  assert(html.indexOf('id="top"')<html.indexOf(builtOpening),'BUILT BY YAMATO must follow the FV');
  assert(html.indexOf(builtOpening)<html.indexOf(entranceOpening),'Guide section must follow BUILT BY YAMATO');
  for(const asset of ['assets/top-renewal/built-yamato-evidence.css','assets/top-renewal/voice-proof.css']){
    assert(html.includes(asset),`Approved section dependency is not loaded: ${asset}`);
    assert(existsSync(asset),`Approved section dependency is missing: ${asset}`);
  }
  assert(!html.includes('assets/top-renewal/770-editorial.js'),'Retired 770 counter script must not be loaded');
  assert.equal((built.match(/class="yamato-evidence__item"/g)||[]).length,3,'BUILT BY YAMATO must contain three evidence items');
  assert(built.includes('<strong>770</strong>'),'BUILT BY YAMATO must retain the approved 770 figure');
  for(const label of ['770棟を支えた、','3つの仕事','初回から設計士が同席','設計内容を現場で確認','引き渡し後まで社内で対応','施工事例を見る'])assert(built.includes(label),`BUILT BY YAMATO is missing: ${label}`);
  for(const src of [...built.matchAll(/\bsrc="([^"]+)"/g)].map(m=>m[1]))assert(existsSync(src),`BUILT BY YAMATO image is missing: ${src}`);

  for(const label of ['お客様の声','掲載中の声','>50<','標準仕様','完成後の対応','お客様の声をすべて見る'])assert(voice.includes(label),`Voice section is missing: ${label}`);
  for(const href of ['voice.html#v01','voice.html#v08','voice.html#v33','voice.html'])assert(voice.includes(`href="${href}"`),`Voice destination is missing: ${href}`);

  assert.equal((entrance.match(/class="entry-card"/g)||[]).length,4,'Preserve all four guide cards');
  const quick=entrance.match(/<nav class="quick-links"[\s\S]*?<\/nav>/)?.[0];
  assert(quick,'Quick navigation is missing');
  assert.equal((quick.match(/<a /g)||[]).length,4,'Preserve all four quick links');
  for(const href of destinations)assert(entrance.includes(`href="${href}"`),`Missing guide destination: ${href}`);
  for(const label of ['商品ラインナップ','施工事例','モデルハウス','家づくりのこだわり'])assert(quick.includes(label),`Missing quick link: ${label}`);
  return {sections:['builtProof','voice'],builtItems:3,voiceLinks:4,guideCards:4,quickLinks:4,approvedMarkup:true};
}

const html=readFileSync('index.html','utf8');
const result=verifyHomepage(html);
// Release integration: verify the canonical pages, not only donor preview routes.
const integrationAssets=['nara-atlas/atlas.css','nara-atlas/dark.css','nara-atlas/atlas.js','guide-maquette/guide.css','quiet-rails.css','quiet-rails.js','washi-motion.css','washi-motion.js','deep-photos.css','deep-photos.js'];
for(const asset of integrationAssets)assert(html.includes(`assets/top-renewal/${asset}`),`Missing integrated dependency: ${asset}`);
assert.equal((html.match(/class="nara-atlas"/g)||[]).length,1,'Atlas must be integrated once');
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
  assert.throws(()=>verifyHomepage(html.replace('class="voices voice-proof section"','class="voices section"')));
  assert.throws(()=>verifyHomepage(html.replace('voice.html#v33','voice.html#missing')));
  assert.throws(()=>verifyHomepage(html.replace('class="entry-card"','class="removed-card"')));
  console.log('Homepage regression checks: 7 known failures rejected');
}
console.log('Homepage content verified:',JSON.stringify(result));
