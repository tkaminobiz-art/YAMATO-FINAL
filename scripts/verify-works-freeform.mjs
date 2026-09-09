import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';

export function verifyWorks(html) {
  const section = html.match(/<section\b[^>]*\bid="works"[\s\S]*?<\/section>/)?.[0];
  assert(section, 'WORKS section is missing');
  assert(section.includes('wf26'), 'Use the adopted freeform WORKS composition');
  const links = [...section.matchAll(/<a\b[^>]*href="([^"]+)"/g)];
  assert.equal(links.length, 4, 'Retain three categories and the all-works link');
  assert(links.every(link => link[1] === 'works.html'), 'WORKS links must use the canonical gallery');
  for (const label of ['WORKS','施工事例','やまとの家 施工写真','外観・外構','リビング・ダイニング','キッチン・ダイニング','施工事例をすべて見る']) {
    assert(section.includes(label), `Missing approved WORKS copy: ${label}`);
  }
  assert.equal((section.match(/<img /g)||[]).length, 3, 'Use the three original photographs, not a generated composite');
  for (const name of ['garden-exterior','living-wide','dining-wide']) {
    assert(section.includes(`assets/top-renewal/art-direction/${name}-800.webp`), `Missing original photograph: ${name}`);
  }
  for (const dependency of ['style.css','photos.js']) {
    assert(html.includes(`assets/top-renewal/works-freeform-20260909/${dependency}`), `Missing WORKS dependency: ${dependency}`);
  }
  return {photographs:3, links:4, canonicalRoute:'works.html', approvedCopy:true};
}

const result=verifyWorks(readFileSync('index.html','utf8'));
const originals={
  'garden-exterior-2000.webp':'52905fd02fcdacceb95ee8d558b52786ae35f57cd6bc75e62f0ae00ff9aaae97',
  'living-wide-1200.webp':'ee7a2ce54b791fe8fb485d33e238b37b1bf1e570e6ad063bd289d450ab7cc972',
  'dining-wide-1200.webp':'9ec71b8290b3ea6047c48fdd4f39516e10fe8814cd7270039eb6c488f66bab98'
};
for(const [name,sha] of Object.entries(originals)) {
  const file=`assets/top-renewal/art-direction/${name}`;
  assert(existsSync(file), `Missing source: ${file}`);
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),sha,`Approved photograph changed: ${file}`);
}
console.log('WORKS freeform verified:',JSON.stringify(result));
