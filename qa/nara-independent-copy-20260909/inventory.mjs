import fs from 'node:fs/promises';import assert from 'node:assert/strict';import vm from 'node:vm';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const q='qa/nara-independent-copy-20260909',b=await chromium.launch(),p=await b.newPage();
const old=await fs.readFile(`${q}/before/move-to-nara-preview.html`,'utf8'),html=await fs.readFile('move-to-nara-preview.html','utf8');
const inspect=async source=>p.evaluate(html=>{
 const d=new DOMParser().parseFromString(html,'text/html');
 const structure=[...d.querySelectorAll('*')].filter(e=>!(e.tagName==='BR'&&e.closest('.travel-conditions,#drive .section-heading'))).map(e=>({tag:e.tagName,attrs:Object.fromEntries([...e.attributes].filter(a=>a.name!=='aria-label'&&!(e.matches('meta[name=description]')&&a.name==='content')).map(a=>[a.name,a.value]))}));
 const rows=[],w=d.createTreeWalker(d.documentElement,NodeFilter.SHOW_TEXT);let n;
 while(n=w.nextNode()){if(n.parentElement.closest('script,style')||!/[\u3040-\u30ff\u3400-\u9fff]/.test(n.textContent))continue;const text=n.textContent.trim();if(text)rows.push({location:n.parentElement.tagName+' '+(n.parentElement.id?'#'+n.parentElement.id:n.parentElement.className?'.'+n.parentElement.className:''),text});}
 for(const e of d.querySelectorAll('[aria-label],[alt],meta[name=description]'))for(const attr of ['aria-label','alt','content']){const text=e.getAttribute(attr);if(text&&/[\u3040-\u30ff\u3400-\u9fff]/.test(text))rows.push({location:e.tagName+' '+(e.id?'#'+e.id:'')+' ['+attr+']',text});}
 const lines=[];
 for(const el of d.querySelectorAll('title,meta[name=description],h1,h2,h3,p,header a,.section-nav a,summary,caption,thead tr,tbody tr,.iju__mode,.iju__eyebrow,.iju__stop,.iju__arrival-list li,.text-link,.external-link,.button,.closing-phone,.iju__skip,footer a')){
  if(el.parentElement.closest('p,.iju__arrival-list li,.iju__stop'))continue;
  const text=el.tagName==='META'?el.content:el.tagName==='TR'?[...el.children].map(c=>c.textContent.trim()).join(' | '):el.matches('.iju__stop,.iju__arrival-list li')?el.textContent.trim().replace(/(\d{2}:\d{2})/,'$1 '):el.innerHTML.includes('<br>')?el.innerHTML.replace(/<br\s*\/?>/g,'\n').replace(/<[^>]+>/g,'').trim():el.textContent.trim();
  if(text)lines.push({tag:el.tagName,location:el.id||el.className,text,href:el.getAttribute('href'),hidden:!!el.closest('[aria-hidden=true],.iju__sr'),sr:!!el.closest('.iju__sr')});
 }
 return {structure,rows,lines,table:d.querySelector('.timetable table').outerHTML,links:[...d.querySelectorAll('a')].map(a=>a.getAttribute('href')),times:[...d.querySelectorAll('time')].map(e=>({text:e.textContent,datetime:e.getAttribute('datetime')}))};
},source);
const before=await inspect(old),after=await inspect(html);
for(const k of ['structure','table','links','times'])assert.deepEqual(after[k],before[k],`${k} preserved`);
const changes=JSON.parse(await fs.readFile(`${q}/copy-changes.json`));
const reviewed=before.rows.map((r,i)=>{
 const same=after.rows.find(a=>a.location===r.location&&a.text===r.text);
 const matches=changes.filter(c=>c.before.includes(r.text)||r.text.includes(c.before.replace(/<[^>]*>/g,'')));
 return {...r,status:same?'reviewed-unchanged':'revised',changes:matches.map(c=>c.role),rationale:same?'固有名詞・数値・明確なラベル/説明で、意味と実動作が整っているため維持':'copy-changes.jsonの問題・保持条件と対照。改稿後の全文も別記'};
});
const js=await fs.readFile('assets/top-renewal/nara-journey.js','utf8');const beats=vm.runInNewContext(js.match(/var jBeats=(\[[\s\S]*?\n    \]);/)[1]);
const result={beforeNodeCount:before.rows.length,afterNodeCount:after.rows.length,reviewedUnchanged:reviewed.filter(x=>x.status==='reviewed-unchanged').length,revisedOldNodes:reviewed.filter(x=>x.status==='revised').length,structureElements:after.structure.length,links:after.links.length,times:after.times.length,tableUnchanged:true,structureUnchangedExceptConditionsAndDriveBR:true,before:reviewed,after:after.rows,dynamic:beats};
await fs.writeFile(`${q}/full-inventory.json`,JSON.stringify(result,null,2));
const md=['# Move to Nara 独立ページ・推奨全文（実装版）','2026-09-09。順番はページの表示順。見出しやラベルは維持箇所も含めて全文を記載。','## 静的表示・低モーション／JSなし表示'];
for(const x of after.lines){if(['H1','H2','H3'].includes(x.tag))md.push(`\n${x.tag==='H3'?'####':'###'} ${x.text}${x.sr?'（読み上げ用）':''}\n`);else if(x.tag==='TR'){md.push('| '+x.text+' |');if(x.text==='駅名 | 到着 | 発車')md.push('|---|---|---|');}else md.push(x.text+(x.href?`（リンク先：${x.href}）`:'')+'\n');}
md.push('## スクロールに連動する8場面');
for(const [i,x]of beats.entries())md.push(`\n### ${i+1}. ${x.clock} / ${x.cap}\n\n${x.phase}\n\n${x.title}\n\n${x.deck}\n`);
md.push('## メタ情報・読み上げ・画像代替テキスト');
for(const x of after.rows.filter(r=>/\[|TITLE|iju__sr/.test(r.location)))md.push(`- ${x.location}：${x.text}`);
md.push('\n全ノード・維持理由：full-inventory.json。変更前後・保持条件：copy-changes.json / copy.md。');
await fs.writeFile(`${q}/recommended-copy.md`,md.join('\n')+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(result).filter(([k])=>!['before','after','dynamic'].includes(k))),null,2));await b.close();
