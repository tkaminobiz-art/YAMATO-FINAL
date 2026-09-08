import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='qa/w08-photo-release-20260908/';
const baseline=JSON.parse(fs.readFileSync(dir+'baseline.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const preserved=['staff.html','works.html','voice.html','data/voices.json','assets/top-renewal/fv-bright/fv-bright.css','assets/top-renewal/quiet-rails.js'];
const changed=baseline.scope.filter(p=>!p.startsWith('scripts/'));
changed.push('assets/top-renewal/built-story/site-coordination.webp');
const report={checkedAt:new Date().toISOString(),implementationCommit:process.argv[2]||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),files:[],errors:[],preserved:[]};
for(const p of preserved){
 const previous=execFileSync('git',['show',baseline.baseline+':'+p]);
 const current=fs.readFileSync(p);
 if(!previous.equals(current))report.errors.push('Unrelated source changed: '+p);
 report.preserved.push({path:p,unchanged:previous.equals(current)});
}
const results=await Promise.all([...changed,...preserved].map(async path=>{
 const local=fs.readFileSync(path),expected=sha(local),url='https://yamato-final.vercel.app/'+path;
 const r=await fetch(url,{cache:'no-store'});const data=Buffer.from(await r.arrayBuffer());
 return {path,url,status:r.status,sha256:sha(data),expectedSha256:expected,matches:r.status===200&&sha(data)===expected};
}));
report.files=results;
for(const r of results)if(!r.matches)report.errors.push('Public file mismatch: '+r.path);
for(const [p,expected] of Object.entries(baseline.unrelatedTrackedFiles))if(sha(fs.readFileSync(p))!==expected)report.errors.push('Unrelated working file changed: '+p);
report.unrelatedWorkingFilesPreserved=Object.keys(baseline.unrelatedTrackedFiles).length;
fs.writeFileSync(dir+'production-integrity.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({files:report.files.length,errors:report.errors,preserved:report.preserved.length,unrelatedWorkingFilesPreserved:report.unrelatedWorkingFilesPreserved}));
if(report.errors.length)process.exitCode=1;
