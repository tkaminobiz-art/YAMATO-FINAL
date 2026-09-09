// Publishing a preview file is not the same as integrating it into the homepage.
// Keep the approved evidence/voice sections and the existing navigation at the main route.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const readSection=(html,id)=>{
  if(id==='builtProof'){
    const start=html.indexOf('<div class="gf-composition" id="builtProof">');
    const end=html.indexOf('<section class="wg-section wg-white entrance"',start);
    assert(start>=0&&end>start,'Approved FV and evidence composition is missing');
    return html.slice(start,end);
  }
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
  assert(built.indexOf('id="top"')<built.indexOf('id="homePromise"'),'House promise must follow the visual FV');
  assert(html.indexOf(built)<html.indexOf(entrance),'Guide section must follow BUILT BY YAMATO');
  for(const asset of ['assets/top-renewal/generated-fv-20260909/style.css','assets/top-renewal/voice-b-20260909/style.css','assets/top-renewal/washi-gold/washi-gold.css']){
    assert(html.includes(asset),`Approved section dependency is not loaded: ${asset}`);
    assert(existsSync(asset),`Approved section dependency is missing: ${asset}`);
  }
  assert(!html.includes('assets/top-renewal/770-editorial.js'),'Retired 770 counter script must not be loaded');
  assert.equal((built.match(/class="gf-job gf-job--[123]"/g)||[]).length,3,'BUILT BY YAMATO must contain three evidence items');
  assert(/<strong\b[^>]*>770<\/strong>/.test(built),'BUILT BY YAMATO must retain the approved 770 figure');
  for(const label of ['770棟を支えた、','3つの仕事','初回から設計士が同席','設計内容を現場で確認','引き渡し後まで社内で対応','施工事例を見る'])assert(built.includes(label),`BUILT BY YAMATO is missing: ${label}`);
  for(const src of [...built.matchAll(/\bsrc="([^"]+)"/g)].map(m=>m[1]))assert(existsSync(src),`BUILT BY YAMATO image is missing: ${src}`);

  assert(voice.includes('wg-section wg-white vb26'),'Adopted VOICE B must be present');
  const cards=[...voice.matchAll(/<a class="vb26__quote [^"]+" data-voice-id="([^"]+)" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.deepEqual(cards.map(m=>m[1]),['v01','v02','v08','v33'],'Four source IDs must retain their adopted order');
  const voiceData=JSON.parse(readFileSync('data/voices.json','utf8')).voices;
  const topics=['費用の説明','自由設計','標準仕様','完成後の対応'];
  cards.forEach((m,i)=>{
    const record=voiceData.find(v=>v.id===m[1]);
    assert(record,'Unknown voice ID');
    assert.equal(m[2],`voice.html#${record.id}`,'Voice must link to the same source record');
    assert(m[3].includes(`>${record.area} ${record.family}</span>`),'Customer identity must match the source record');
    assert(m[3].includes(`>${topics[i]}</span>`),'Adopted topic must remain');
    const excerpt=m[3].match(/<blockquote>([^<]+)<\/blockquote>/)?.[1];
    assert(excerpt && record.qa.some(qa=>qa.a.includes(excerpt)),'Excerpt must belong to this exact respondent');
    assert(!m[3].includes('<img'),'Construction photos are independent from individual respondents');
  });
  assert(voice.includes('href="voice.html"')&&voice.includes('お客様の声一覧'),'All voices destination is required');
  assert.equal((voice.match(/回答者の住まいとは限りません/g)||[]).length,1,'Retain the adopted single common photograph note');
  assert(voice.includes('class="vb26__photos" role="group"'),'Independent construction photograph group is required');
  for(const src of [...voice.matchAll(/\bsrc="([^"]+)"/g)].map(m=>m[1]))assert(existsSync(src),`Voice image missing: ${src}`);
  const visit=readSection(html,'visit');
  assert(visit.includes('wg-section wg-dark va26'),'Final VISIT composition is required');
  for(const text of ['VISIT <span>&amp;</span> CONTACT','モデルハウス見学','商品別の設備・仕様と、お見積もりの考え方をご案内します。','見学は無料・予約制です。','左京モデルハウスの写真。','ご案内する会場は予約時に確認します。','9:00〜19:00 ／ 火曜・水曜定休'])assert(visit.includes(text),`Visit copy missing: ${text}`);
  for(const mode of ['reserve','docs'])assert(visit.includes(`href="#contactDialog" data-contact="${mode}"`),'Existing enquiry action must remain');
  assert(visit.includes('href="tel:0742361123"')&&visit.includes('0742-36-1123'),'Telephone must remain correct');
  assert(visit.includes('src="assets/top-renewal/sakyo-living-1440.webp"'),'Visit must use the real Sakyo model-house photograph');
  for(const dep of ['assets/top-renewal/visit-adopted-20260909/style.css','assets/top-renewal/voice-b-20260909/media.js'])assert(html.includes(dep)&&existsSync(dep),`Adopted dependency missing: ${dep}`);
  // FV and Nara have newly adopted surfaces. Keep the approved paper in the unchanged sections.
  for(const id of ['entrance','lineup','works','voice','faq','instagram','visit'])assert(readSection(html,id).includes('class="wg-paper"'),`Preserve the existing paper background in #${id}`);
  for(const label of ['news','site-footer'])assert(new RegExp(`<(?:section|footer)[^>]*class="[^"]*\\b${label}\\b[^\"]*"[^>]*><span class="wg-paper"`).test(html),`Preserve the ${label} paper background`);
  for(const asset of ['assets/top-renewal/washi-gold/peony-mask.webp','assets/top-renewal/770-editorial/catalog-swallow-original.svg','assets/top-renewal/770-editorial/cotton-paper-960.webp'])assert(existsSync(asset),`Missing ornament: ${asset}`);

  assert.equal((entrance.match(/class="entry-card"/g)||[]).length,4,'Preserve all four guide cards');
  const quick=entrance.match(/<nav class="quick-links"[\s\S]*?<\/nav>/)?.[0];
  assert(quick,'Quick navigation is missing');
  assert.equal((quick.match(/<a /g)||[]).length,4,'Preserve all four quick links');
  for(const href of destinations)assert(entrance.includes(`href="${href}"`),`Missing guide destination: ${href}`);
  for(const label of ['商品ラインナップ','施工事例','モデルハウス','家づくりのこだわり'])assert(quick.includes(label),`Missing quick link: ${label}`);
  assert.equal((entrance.match(/entry-card__visual--photo/g)||[]).length,4,'All four guide cards must use the approved photographs');
  assert(!entrance.includes('entry-card__visual--maquette')&&!entrance.includes('entry-card__art-label'),'Retired guide illustrations must not return');
  for(const src of ['assets/top-renewal/sakyo-kitchen-560.webp','assets/top-renewal/real-photo/land-640.webp','assets/top-renewal/real-photo/payment-802.webp','assets/top-renewal/real-photo/commute-639.webp'])assert(entrance.includes(`src="${src}"`)&&existsSync(src),`Approved guide photograph missing: ${src}`);
  assert(html.includes('assets/top-renewal/real-photo/real-photo.css'),'Guide photograph framing stylesheet must be loaded');
  return {sections:['builtProof','voice'],builtItems:3,voiceCards:4,voiceLinks:5,guideCards:4,quickLinks:4,preservedPaperSections:9,approvedMarkup:true};
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
const integrationAssets=['nara-adopted-20260909/style.css','nara-adopted-20260909/section.js','guide-maquette/guide.css','quiet-rails.css','quiet-rails.js','washi-motion.css','washi-motion.js','deep-photos.css','deep-photos.js'];
for(const asset of integrationAssets)assert(html.includes(`assets/top-renewal/${asset}`),`Missing integrated dependency: ${asset}`);
assert.equal((html.match(/id="nara"/g)||[]).length,1,'MOVE TO NARA must be integrated once');
assert(readSection(html,'nara').includes('class="na26"'),'Nara must use its adopted white/green layout');
for(const attr of ['data-quiet-rails','data-washi-motion','data-top-depth'])assert(html.includes(attr),`Missing motion activation: ${attr}`);
assert(!html.includes('動くカードを試す'),'Guide rail should start without opt-in');
assert(readFileSync('works.html','utf8').includes('assets/works/works-yellow.css'),'Canonical works route must use the yellow design');
assert(readFileSync('kodawari.html','utf8').includes('assets/kodawari/editorial.css'),'Canonical kodawari route must use the editorial design');
if(process.argv.includes('--self-test')){
  assert.throws(()=>verifyHomepage(html.replace(readSection(html,builtOpening),'')));
  assert.throws(()=>verifyHomepage(html.replace('>770</strong>','>600</strong>')));
  assert.throws(()=>verifyHomepage(html.replace('class="gf-job gf-job--1"','class="removed-item"')));
  assert.throws(()=>verifyHomepage(html.replace('assets/top-renewal/generated-fv-20260909/style.css','missing.css')));
  assert.throws(()=>verifyHomepage(html.replace('wg-section wg-white vb26','voices section')));
  assert.throws(()=>verifyHomepage(html.replace('voice.html#v33','voice.html#missing')));
  assert.throws(()=>verifyHomepage(html.replace('class="entry-card"','class="removed-card"')));
  assert.throws(()=>verifyHomepage(html.replace('data-voice-id="v01"','data-voice-id="v02"')));
  assert.throws(()=>verifyHomepage(html.replace('>奈良市 N様邸</span>','>生駒市 H様邸</span>')));
  assert.throws(()=>verifyHomepage(html.replace('実際に掛かる本当の費用を提示して頂ける点が魅力的でした。','完成後もカーポートの設置や追加の外構工事で相談に乗ってもらっています。')));
  assert.throws(()=>verifyHomepage(html.replace('href="#contactDialog" data-contact="docs"><span>資料請求','href="#missing" data-contact="docs"><span>資料請求')));
  console.log('Homepage regression checks: 11 known failures rejected');
}
console.log('Homepage content verified:',JSON.stringify(result));
