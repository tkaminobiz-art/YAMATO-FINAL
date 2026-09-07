import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8'),hero=html.match(/<section class="new-hero"[\s\S]*?<\/section>/)?.[0];
assert(hero,'Canonical FV missing');
assert.equal((html.match(/src="assets\/top-renewal\/fv-bright\/fv-player.js"/g)||[]).length,1);
assert(!html.includes('src="assets/top-renewal/hero.js"'),'Never run two hero players');
assert.equal((hero.match(/class="new-hero__scene(?: is-active)?"/g)||[]).length,8);
assert.equal((hero.match(/class="new-hero__story(?: is-active)?"/g)||[]).length,3);
assert(hero.includes('href="kodawari.html">家づくりの中身を見る</a>'));
assert(hero.includes('id="heroMediaStatus"')&&hero.includes('id="heroVideo"'));
assert(hero.includes('muted playsinline preload="none"'));
for(const file of ['A-gpt-image-2.webp','A-day-sp.webp','A-dusk-pc.webp','A-dusk-sp.webp','kling-pc.mp4','kling-sp.mp4']){
 const path='assets/top-renewal/fv-bright/'+file;assert(hero.includes(path));assert(existsSync(path));
}
assert(html.includes('FVの第1・2章と商品外観は生成コンセプトです。'));
assert(!hero.includes('snapshot/')&&!hero.includes('site/')&&!hero.includes('seedance'));
const js=readFileSync('assets/top-renewal/fv-bright/fv-player.js','utf8');
assert(!js.includes('reviewMediaStatus')&&!js.includes('seedance')&&!js.includes('web/'));
assert(js.includes('navigator.connection?.saveData')&&js.includes('prefers-reduced-motion'));
console.log('Bright FV: eight scenes, three messages, one player, six approved media files, disclosure retained');
