// Publishing a preview file is not the same as integrating it into the homepage.
// Keep both the approved 770 story and the existing navigation at the main route.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const reference=readFileSync('index-770-preview.html','utf8');
const readSection=(html,opening)=>{
  const start=html.indexOf(opening);
  assert(start>=0,`Homepage is missing ${opening}`);
  const end=html.indexOf('</section>',start);
  assert(end>start,'Section closing tag is missing');
  return html.slice(start,end+10);
};
const folioOpening='<section class="yamato-folio"';
const entranceOpening='<section class="entrance"';
const approvedFolio=readSection(reference,folioOpening);
const destinations=['kodawari.html','lots-preview.html?view=list','lots-preview.html?view=estimate','move-to-nara-preview.html'];

export function verifyHomepage(html){
  const folio=readSection(html,folioOpening),entrance=readSection(html,entranceOpening);
  assert.equal(folio,approvedFolio,'Main TOP does not contain the approved 770 section');
  assert.equal((html.match(/id="builtProof"/g)||[]).length,1,'770 section must appear once');
  assert(html.indexOf('id="top"')<html.indexOf(folioOpening),'770 must follow the FV');
  assert(html.indexOf(folioOpening)<html.indexOf(entranceOpening),'Guide section must follow 770');
  for(const asset of ['assets/top-renewal/770-editorial.css','assets/top-renewal/770-editorial.js']){
    assert(html.includes(asset),`770 dependency is not loaded: ${asset}`);
    assert(existsSync(asset),`770 dependency is missing: ${asset}`);
  }
  assert.equal((entrance.match(/class="entry-card"/g)||[]).length,4,'Preserve all four guide cards');
  const quick=entrance.match(/<nav class="quick-links"[\s\S]*?<\/nav>/)?.[0];
  assert(quick,'Quick navigation is missing');
  assert.equal((quick.match(/<a /g)||[]).length,4,'Preserve all four quick links');
  for(const href of destinations)assert(entrance.includes(`href="${href}"`),`Missing guide destination: ${href}`);
  for(const label of ['商品ラインナップ','施工事例','モデルハウス','家づくりのこだわり'])assert(quick.includes(label),`Missing quick link: ${label}`);
  for(const src of [...folio.matchAll(/\bsrc="([^"]+)"/g)].map(m=>m[1]))assert(existsSync(src),`770 artwork/photo is missing: ${src}`);
  return {section:'builtProof',guideCards:4,quickLinks:4,approvedMarkup:true};
}

const html=readFileSync('index.html','utf8');
const result=verifyHomepage(html);
if(process.argv.includes('--self-test')){
  assert.throws(()=>verifyHomepage(html.replace(readSection(html,folioOpening),'')));
  assert.throws(()=>verifyHomepage(html.replace('>770</span>','>600</span>')));
  assert.throws(()=>verifyHomepage(html.replace('class="entry-card"','class="removed-card"')));
  assert.throws(()=>verifyHomepage(html.replace('assets/top-renewal/770-editorial.css','missing.css')));
  console.log('Homepage regression checks: 4 known failures rejected');
}
console.log('Homepage content verified:',JSON.stringify(result));
