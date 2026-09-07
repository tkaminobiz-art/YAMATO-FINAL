import {queryCatalog,property,cities} from '../catalog.mjs';
import {esc,num,price,area,photo,station,savedButton,icon} from '../ui.mjs';
export function propertyCard(p,store,{compare=false,unverified=false}={}){
 const selected=store.get().search.selectedId===p.id;
 return `<article class="property-card ${selected?'is-selected':''}" data-id="${p.id}"><div class="card-picture"><a href="#/property/${p.id}" data-property="${p.id}" tabindex="-1" aria-hidden="true">${photo(p)}</a>${savedButton(p,store.has(p.id),true)}</div><div class="card-body"><p class="card-city">${esc(p.city)}<span>土地</span></p><h2><a href="#/property/${p.id}" data-property="${p.id}">${esc(p.name)}</a></h2><p class="card-price">${price(p)}<small>万円</small></p><p class="card-facts">${area(p)}㎡<span>${(p.areaM2/3.305785).toFixed(1)}${p.areaMaxM2>p.areaM2?'〜':''}坪</span></p><p class="card-access">${station(p)}<small>SUUMO掲載</small></p>${unverified?'<p class="status-note">価格・面積が合う区画は確認が必要です</p>':''}<div class="card-actions"><button data-map-select="${p.id}">${icon('map')}地図</button><a class="detail-link" href="#/property/${p.id}" data-property="${p.id}">詳細を見る ${icon('arrow')}</a></div>${compare?`<label class="compare-choice"><input type="checkbox" data-compare="${p.id}" ${store.get().compareIds.includes(p.id)?'checked':''}>比較に追加</label>`:''}</div></article>`;
}
export function renderSearch(store,{rebuild=true}={}){
 const s=store.get().search,rows=queryCatalog(s.filters,s.sort),list=document.querySelector('#list');
 document.querySelector('#workspace').classList.toggle('list-mode',s.view==='list');document.querySelector('#map-view').setAttribute('aria-pressed',String(s.view==='map'));document.querySelector('#list-view').setAttribute('aria-pressed',String(s.view==='list'));document.querySelector('#sort').value=s.sort;
 document.querySelector('#count').textContent=`${rows.length}件の掲載`;
 document.querySelector('#map-empty').hidden=rows.length!==0;
 const keys=Object.keys(s.filters).filter(k=>k==='regions'?s.filters.regions.length:s.filters[k]);document.querySelector('#filter-count').textContent=keys.length||'';
 document.querySelector('#match-note').textContent=s.sort==='updated'?'現在の情報提供日は全件2026年9月6日です。':rows.some(r=>r.matchStatus==='plot-unverified')?'掲載範囲からの候補です。同一区画での条件一致は未確認です。':'価格・面積・駅徒歩はSUUMO掲載値です。';
 document.querySelector('#active-filters').innerHTML=keys.map(k=>`<button data-remove-filter="${k}">${k==='regions'?esc(s.filters.regions.join('・')):k==='price'?`${num(s.filters.price)}万円まで`:k==='area'?`${s.filters.area}㎡以上`:k==='walk'?`駅徒歩${s.filters.walk}分以内`:'地図の範囲'} <span aria-hidden="true">×</span></button>`).join('')+(keys.length?'<button class="clear-all" data-reset-filters>すべて解除</button>':'');
 if(rebuild){const scroll=document.querySelector('.list-panel').scrollTop;list.innerHTML=rows.length?rows.map(r=>propertyCard(r.property,store,{unverified:r.matchStatus==='plot-unverified'})).join(''):'<div class="empty-state"><h2>条件に合う掲載がありません</h2><p>地域や予算の条件を変えてお探しください。</p><button data-reset-filters class="primary">条件を解除する</button></div>';document.querySelector('.list-panel').scrollTop=scroll;}
 renderSelection(store);return rows.map(r=>r.property);
}
export function renderSelection(store){
 const p=property(store.get().search.selectedId),node=document.querySelector('#selected-card');node.hidden=!p;if(!p){node.innerHTML='';document.querySelectorAll('.property-card').forEach(c=>c.classList.remove('is-selected'));return;}
 node.innerHTML=`<div class="selected-photo">${photo(p,'',true)}</div><div class="selected-body"><p class="eyebrow">選択中 · ${esc(p.city)}</p><h2>${esc(p.name)}</h2><p class="selected-price">${price(p)}<small>万円</small></p><p class="note">土地 ${area(p)}㎡</p><div class="selected-actions"><a href="#/property/${p.id}" data-property="${p.id}" class="primary">詳細を見る ${icon('arrow')}</a>${savedButton(p,store.has(p.id),true)}</div></div><button id="close-card" class="selection-close" aria-label="選択を解除する">${icon('close')}</button>`;
 document.querySelectorAll('.property-card').forEach(c=>c.classList.toggle('is-selected',c.dataset.id===p.id));
}
export function fillFilters(store){const form=document.querySelector('#filter-form'),f=store.get().search.filters;document.querySelector('#region-options').innerHTML=cities.map(city=>`<label><input type="checkbox" name="region" value="${esc(city)}" ${f.regions.includes(city)?'checked':''}>${esc(city)}</label>`).join('');for(const k of ['price','area','walk'])form.elements[k].value=f[k]??'';}
