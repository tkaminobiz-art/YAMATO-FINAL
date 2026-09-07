import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='qa/works-expansion-20260907',review=process.argv.includes('--review');
const hash=async path=>({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
const records={};for(const n of ['brief','copy','assets',...(review?['visual','interaction']:[])])records[n]=await hash(`${dir}/${n}.md`);
const paths=['works.html','assets/works/works-yellow.js','assets/works/works-yellow.css'];
if(review){const m=JSON.parse(await readFile(`${dir}/asset-manifest.json`));for(const p of m)paths.push(p.src,p.thumb);}
const screenshots=review?await Promise.all([{viewport:'pc',width:1440,height:1000,path:`${dir}/local-chromium-1440-new.png`},{viewport:'sp',width:390,height:844,path:`${dir}/local-webkit-390-new.png`}].map(async p=>({...p,...await hash(p.path)}))):[];
await writeFile(`${dir}/receipt.json`,JSON.stringify({version:1,scope:await Promise.all([...new Set(paths)].map(hash)),records,screenshots},null,2));
