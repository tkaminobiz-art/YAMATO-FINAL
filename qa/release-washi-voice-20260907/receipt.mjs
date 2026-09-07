import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='qa/release-washi-voice-20260907',review=process.argv.includes('--review');
const entry=path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')});
const paths=review?['index.html','assets/top-renewal/voice-reference/voice.css','assets/top-renewal/washi-gold/washi-gold.css','assets/top-renewal/washi-gold/peony-mask.webp','scripts/verify-homepage.mjs']:['index.html','index-washi-gold-preview.html','index-voice-reference-preview.html','assets/top-renewal/voice-reference/voice.css'];
const records=Object.fromEntries((review?['brief','copy','assets','visual','interaction']:['brief','copy','assets']).map(k=>[k,entry(`${dir}/${({copy:'copy-review',assets:'asset-decisions',visual:'visual-review',interaction:'interaction-review'}[k]||k)}.md`)]));
const screenshots=review?[{viewport:'pc',width:1440,height:900,...entry(`${dir}/local-chromium-1440-voice.png`)},{viewport:'sp',width:390,height:844,...entry(`${dir}/local-chromium-390-voice.png`)}]:[];
fs.writeFileSync(`${dir}/${review?'review':'prepare'}-receipt.json`,JSON.stringify({version:1,scope:paths.map(entry),records,screenshots},null,2)+'\n');
