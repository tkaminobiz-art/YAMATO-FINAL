import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire('/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const base='/Users/takahirokamino/Downloads/最終やまと不動産画像ファイル';
const source=JSON.parse(await readFile(base+'/調査/デジタルカタログ全面設計_20260909/EVIDENCE/assets/selected-assets.json','utf8'));
const dir='assets/catalog/adopted';await mkdir(dir,{recursive:true});const manifest={};
for(const a of source){
 if(['A05','A13','A14'].includes(a.asset_id))continue;
 const bytes=await readFile(a.path);if(createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error(a.asset_id+' source changed');
 const small=a.size[0]<1000;
 const dest=`${dir}/${a.asset_id.toLowerCase()}${small?(a.path.endsWith('.png')?'.png':'.jpg'):'.webp'}`;
 if(small)await copyFile(a.path,dest);else await sharp(bytes).rotate().resize({width:1920,withoutEnlargement:true}).webp({quality:85}).toFile(dest);
 const m=await sharp(dest).metadata();manifest[a.asset_id]={src:dest,width:m.width,height:m.height,caption:a.usage,sourceSha256:a.sha256,sha256:createHash('sha256').update(await readFile(dest)).digest('hex'),source:a.path};
}
await writeFile('qa/catalog-adopted-20260909/asset-manifest.json',JSON.stringify(manifest,null,2));console.log(Object.keys(manifest).length+' sourced images prepared');
