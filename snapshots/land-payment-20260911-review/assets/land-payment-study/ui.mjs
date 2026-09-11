export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num=v=>Number(v).toLocaleString('ja-JP');
export const price=p=>p.priceMaxMan>p.priceMan?`${num(p.priceMan)}〜${num(p.priceMaxMan)}`:num(p.priceMan);
export const area=p=>p.areaMaxM2>p.areaM2?`${num(p.areaM2)}〜${num(p.areaMaxM2)}`:num(p.areaM2);
export const yen=v=>num(v)+'円';
export const photo=(p,cls='',eager=false)=>p.image?`<img class="${cls} ${p.imageType?.includes('区画図')?'is-plan':''}" src="${esc(p.image)}" alt="${esc(p.name)}・${esc(p.imageType)}（SUUMO掲載）" loading="${eager?'eager':'lazy'}" decoding="async" referrerpolicy="no-referrer">`:'<div class="photo-fallback">写真はSUUMOでご確認ください</div>';
export const link=(href,text)=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${text}<span aria-hidden="true"> ↗</span></a>`;
export const station=p=>p.walkMin!=null?`${esc(p.station)} 徒歩${p.walkMin}分`:'駅までの徒歩時間は情報なし';
export const icon=(name)=>{const paths={heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',map:'m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6',list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',filter:'M4 7h16M7 4v6M4 17h16m-7-3v6',arrow:'M4 12h16m-6-6 6 6-6 6',close:'m6 6 12 12M18 6 6 18',expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',check:'m5 12 4 4L19 6'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]?`<path d="${paths[name]}"/>`:''}</svg>`;};
export const savedButton=(p,saved,compact=false)=>`<button class="save-button ${saved?'is-saved':''} ${compact?'icon-only':''}" data-save="${p.id}" aria-pressed="${saved}" aria-label="${esc(p.name)}を${saved?'保存から外す':'候補に保存'}">${icon('heart')}${compact?'':`<span>${saved?'保存済み':'候補に保存'}</span>`}</button>`;
export const definition=rows=>`<dl class="definition">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

// Editorial wording is separate from the unchanged source snapshot.
export const sourceNote=text=>String(text??'')
 .replace('掲載の地図位置は目安です。区画番号・入口位置と販売状況は確認が必要です。','地図の位置は目安です。区画番号・入口・現在の販売状況は担当者にご確認ください。')
 .replace(' 中菜畑は物件名が全31区画、概要表が総23区画と異なります。',' 中菜畑はSUUMOの物件名に全31区画、概要表に全23区画と記載されています。正しい区画数は確認が必要です。')
 .replace('指定通学校は未確認です。','通学区域は担当者にご確認ください。')
 .replace('この掲載には情報がありません。','SUUMOに情報の掲載がありません。')
 .replace('バスの方面・乗車時間は未確認です。','バスの行き先・乗車時間は未確認です。');
