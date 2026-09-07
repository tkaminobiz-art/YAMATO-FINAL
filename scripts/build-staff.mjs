/** Regenerate marked static cards: node scripts/build-staff.mjs [--check]. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {people}=JSON.parse(readFileSync(resolve(root,'assets/staff/staff-data.json'),'utf8'));
function renderStaff(p,i) {
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const name=escape(p.name), id=escape(p.id), nickname=escape(p.nickname),role=escape(p.role);
 const base='assets/staff/portraits/'+id;
 const nameHTML=p.id==='147195'?'<span>西口・</span><span>クロフォード</span>':name;
 const roleHTML=p.id==='147195'?'<span>管理部 部長</span><span>（コンシェルジュ）</span>':role;
 return `        <article class="staff-card" id="staff-${id}" data-category="${escape(p.category)}" data-staff-id="${id}">
          <button class="portrait${p.registration?' portrait--registered':''}" type="button" aria-label="${name}の写真表示" aria-pressed="false" aria-describedby="switch-help" disabled>
            <img class="portrait__art" src="${base}-illustration.webp" width="960" height="${p.artHeight}" alt="${name}のイラスト" ${i===0?'fetchpriority="high"':i<4?'loading="eager"':'loading="lazy"'} decoding="async">
            <img class="portrait__photo" data-src="${base}-photo.jpg" width="${p.w}" height="${p.h}" alt="" aria-hidden="true" decoding="async">
            <span class="portrait__hint" aria-hidden="true"><span class="portrait__symbol">↔</span><span class="portrait__hint-text">写真を見る</span></span>
          </button>
          <div class="staff-card__nameplate">
            <p class="staff-card__role">${roleHTML}</p>
            <h3${p.id==='147195'?' class="staff-card__long-name"':''}>${nameHTML}</h3>
            <p class="staff-card__nickname">${nickname||'&nbsp;'}</p>
            <span class="staff-card__en" aria-hidden="true">${escape(p.en)}</span>
          </div>
          <p class="staff-card__intro">${escape(p.blurb)}</p>
          <details class="profile">
            <summary aria-label="${name}のプロフィールを見る">プロフィールを見る <span aria-hidden="true">↗</span></summary>
            <div class="profile__content">
              <img class="profile__photo" src="${base}-photo.jpg" width="${p.w}" height="${p.h}" alt="${name}の写真" loading="lazy">
              <div class="profile__body"><p class="eyebrow">${escape(p.en)}</p><p class="profile__role">${role}</p><h3 class="profile__name">${name}</h3>${nickname?'<p class="profile__nickname">'+nickname+'</p>':''}<p class="profile__bio">${escape(p.bio)}</p>${p.hobby?'<dl><div><dt>趣味</dt><dd>'+escape(p.hobby)+'</dd></div></dl>':''}<p class="profile__caption">${escape(p.caption)}</p></div>
            </div>
          </details>
        </article>`;
}
const target=resolve(root,process.argv.includes('--preview')?'staff-preview.html':'staff.html');
const old=readFileSync(target,'utf8');
const start='        <!-- STAFF_CARDS_START -->',end='        <!-- STAFF_CARDS_END -->';
if(old.split(start).length!==2||old.split(end).length!==2)throw Error('Staff marker missing or ambiguous');
const result=old.slice(0,old.indexOf(start))+start+'\n'+people.map(renderStaff).join('\n')+'\n'+old.slice(old.indexOf(end));
if(process.argv.includes('--check')){if(result!==old)throw Error('Staff HTML is out of date. Run node scripts/build-staff.mjs');}else writeFileSync(target,result);
console.log(people.length+' static staff cards: '+(process.argv.includes('--check')?'up to date':'built'));
function renderCrops(people) {
 return '/* Generated per-person CSS framing. Source photographs stay unchanged. */\n'+people.filter(p=>p.registration).flatMap(p=>{
  const layers=['photo','art'].map(layer=>({layer,anchor:p.registration[layer],ratio:layer==='art'?960/p.artHeight:p.w/p.h}));
  const commonWidth=Math.max(.29,...layers.map(({anchor:[x,y,w],ratio})=>Math.max(.31/y,.69/(1-y))*w*ratio));
  return layers.map(({layer,anchor:[x,y,w],ratio})=>{
   const scale=commonWidth/(w*ratio);
   return `#staff-${p.id} .portrait__${layer}{--registered-ratio:${ratio.toFixed(6)};--registered-scale:${scale.toFixed(6)};--registered-x:${((.5/ratio-scale*x)*100).toFixed(4)}%;--registered-y:${((.31-scale*y)*100).toFixed(4)}%}`;
  });
 }).join('\n')+'\n';
}
const cropPath=resolve(root,'assets/staff/staff-crops.css'),crops=renderCrops(people);
if(process.argv.includes('--check')){if(readFileSync(cropPath,'utf8')!==crops)throw Error('Crop CSS is out of date');}else writeFileSync(cropPath,crops);
