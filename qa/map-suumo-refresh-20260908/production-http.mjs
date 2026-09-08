import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const manifest = JSON.parse(await readFile(new URL('../../snapshots/land-payment-20260908-suumo/manifest.json', import.meta.url), 'utf8'));
const targets = [
  {name: 'dedicated', origin: 'https://yamato-land-payment-preview.vercel.app', entry: 'https://yamato-land-payment-preview.vercel.app/land-payment-study.html'},
  {name: 'company-rewrite', origin: 'https://yamato-final.vercel.app', entry: 'https://yamato-final.vercel.app/land-payment-study.html'},
];
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const report = {checkedAt: new Date().toISOString(), revision: manifest.revision, targets: [], api: []};

for (const target of targets) {
  const files = [];
  for (const file of manifest.files.filter(({package: packagePath}) => packagePath.startsWith('public/'))) {
    const relative = file.package.slice('public/'.length);
    const url = relative === 'land-payment-study.html' ? target.entry : `${target.origin}/${relative}`;
    const response = await fetch(`${url}?release=suumo-20260908-v1`, {headers: {'cache-control': 'no-cache'}});
    const body = Buffer.from(await response.arrayBuffer());
    files.push({source: file.source, url, status: response.status, sha256: sha256(body), expectedSha256: file.sha256, ok: response.status === 200 && sha256(body) === file.sha256});
  }
  report.targets.push({name: target.name, files, ok: files.every(({ok}) => ok)});
  const apiResponse = await fetch(`${target.origin}/api/property-inquiries`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({schemaVersion: 2, candidates: [{publicId: 's21320158', name: '佐保台西町', plotId: null, dataRevision: 'suumo-20260908-v1'}], preferences: {destinations: ['', ''], arrival: '平日 8:30着', wishes: []}, estimates: [], dryRun: true}),
  });
  const apiBody = await apiResponse.json();
  report.api.push({name: target.name, status: apiResponse.status, valid: apiBody.valid, stored: apiBody.stored, sent: apiBody.sent, ok: apiResponse.status === 200 && apiBody.valid === true && apiBody.stored === false && apiBody.sent === false});
}

if (!report.targets.every(({ok}) => ok) || !report.api.every(({ok}) => ok)) throw new Error(JSON.stringify(report, null, 2));
await writeFile(new URL('production-http.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({revision: report.revision, targets: report.targets.map(({name, files}) => ({name, files: files.length})), api: report.api}));
