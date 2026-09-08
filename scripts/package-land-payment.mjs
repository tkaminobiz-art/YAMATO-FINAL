import {readFile, writeFile, mkdir, mkdtemp, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname, join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';

const snapshot = process.argv[2] || '20260908-icon';
if (!/^[0-9]{8}(?:-[a-z0-9]+)?$/.test(snapshot)) throw new Error('Use a snapshot version: YYYYMMDD or YYYYMMDD-name');
const root = fileURLToPath(new URL(`../snapshots/land-payment-${snapshot}/`, import.meta.url));
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
const stage = await mkdtemp(join(tmpdir(), 'yamato-land-payment-'));
for (const entry of manifest.files) {
  const source = resolve(root, entry.source);
  const target = resolve(stage, entry.package);
  if (!source.startsWith(root) || !target.startsWith(stage + '/')) throw new Error('Path outside package');
  const bytes = await readFile(source);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== entry.sha256) throw new Error(`Snapshot changed: ${entry.source}`);
  await mkdir(dirname(target), {recursive:true});
  await writeFile(target, bytes);
  // The validation API imports these modules from ../assets, outside public/.
  if (entry.source.startsWith('assets/') && entry.source.endsWith('.mjs')) {
    const serverModule = resolve(stage, entry.source);
    await mkdir(dirname(serverModule), {recursive:true});
    await writeFile(serverModule, bytes);
  }
}
await copyFile(join(stage, 'public/land-payment-study.html'), join(stage, 'public/index.html'));
await writeFile(join(stage, 'vercel.json'), JSON.stringify({
  framework:null, outputDirectory:'public', buildCommand:null, installCommand:null,
  headers:[{source:'/(.*)', headers:[
    {key:'X-Robots-Tag',value:'noindex, nofollow'},
    {key:'Cache-Control',value:'no-cache'}
  ]}]
},null,2)+'\n');
await writeFile(join(stage, 'package.json'), JSON.stringify({
  name:'yamato-land-payment-preview', private:true, type:'module', engines:{node:'24.x'}
},null,2)+'\n');
console.log(JSON.stringify({directory:stage,project:manifest.project,verifiedFiles:manifest.files.length},null,2));
