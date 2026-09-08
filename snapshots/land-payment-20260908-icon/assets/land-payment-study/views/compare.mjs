import {financeFields,compactPayment} from './finance.mjs';
import {property,houses,financialProducts,estimateFor} from '../catalog.mjs';
import {commonFields} from './estimate.mjs';
import {sourceNote,esc,num,price,area,photo,station,icon,yen} from '../ui.mjs';
export function compareView(store){
 const s=store.get(),items=s.compareIds.map(property).filter(Boolean),c=s.common,house=houses.find(h=>h.id===c.houseId),finance=financialProducts.find(p=>p.id===c.financeId);
 if(items.length<2)return `<div class="content-wrap"><a href="#/saved" data-page="saved" class="back-link">← 保存した土地に戻る</a><h1 tabindex="-1">土地を比較する</h1><div class="empty-state"><h2>比較する土地を2〜3件選んでください</h2><p>保存した土地から候補を選べます。</p><a class="primary" href="#/saved" data-page="saved">保存した土地を見る</a></div></div>`;
 const outcomes=items.map(p=>estimateFor(p.id,c,s.budgets[p.id]??p.priceMan));let rowIndex=0;
 const row=(label,values,cls='')=>`<section class="comparison-row ${cls}" aria-labelledby="compare-row-${++rowIndex}"><h2 id="compare-row-${rowIndex}">${label}</h2><div class="comparison-values" style="--columns:${items.length}">${values.map((value,i)=>`<div><p class="comparison-property">${esc(items[i].name)}</p>${value}</div>`).join('')}</div></section>`;
 const facility=(p,type)=>{const a=p.amenities.find(x=>x.type===type&&x.name);return a?`<p>${esc(a.name)}</p><p class="note">${a.publishedMeters!=null?num(a.publishedMeters)+'m ／ ':''}${a.publishedMinutes!=null?'徒歩'+a.publishedMinutes+'分（SUUMO掲載）':'徒歩時間の情報なし'}${type.includes('学校')?'<br>通学区域は要確認':''}</p>`:'<p class="note">情報なし</p>';};
 return `<div class="content-wrap comparison-page"><a href="#/saved" data-page="saved" class="back-link">← 保存した土地に戻る</a><h1 tabindex="-1">${items.length}件の土地を比較する</h1><p class="page-lead">同じ建物プラン・頭金・返済期間で、返済額と周辺環境を比較できます。</p><details class="common-settings" ${house?'':'open'}><summary>計算条件・通勤先を変更 <span>${house?`${house.name} ／ 頭金${num(c.cashMan)}万円 ／ ${c.years}年`:'建物プランを選んでください'}</span></summary><form id="compare-form">${commonFields(c,{destinations:true})}<label class="field">住宅ローン<select name="financeId">${financialProducts.map(p=>`<option value="${p.id}" ${p.id===c.financeId?'selected':''}>${p.bank} ${p.name}</option>`).join('')}</select></label><details class="finance-settings"><summary>金利・諸費用を詳しく設定</summary>${financeFields(c.finance)}</details><p class="note">通勤先は相談時の確認用に保存します。経路や所要時間の自動計算には対応していません。</p><button class="primary" type="submit">この条件で比較する</button></form></details><p class="comparison-assumptions">${house?`建物「${house.name}」・頭金${num(c.cashMan)}万円・${c.years}年／${finance.bank} ${finance.name}`:'建物プランを選ぶと毎月の返済額が表示されます。'}<br>土地は入力した予算で計算します。元利均等返済・ボーナス返済なし。諸費用は別途必要です。</p><div class="comparison-head" style="--columns:${items.length}">${items.map(p=>`<article>${photo(p)}<p class="eyebrow">${esc(p.city)}</p><h2><a href="#/property/${p.id}" data-property="${p.id}">${esc(p.name)}</a></h2><button data-remove-compare="${p.id}" aria-label="${esc(p.name)}を比較から外す">比較から外す ×</button></article>`).join('')}</div>
 ${row('土地の掲載価格',items.map(p=>`<p class="comparison-price">${price(p)}<small>万円</small></p><p class="note">販売中の区画・価格は要確認</p>`))}
 ${row('計算に使う土地予算',items.map(p=>`<label class="budget-field"><span class="sr-only">${esc(p.name)}の土地予算</span><input type="number" inputmode="numeric" min="0" max="10000" step="1" data-budget="${p.id}" value="${esc(s.budgets[p.id]??p.priceMan)}">万円</label><p class="note">${s.budgets[p.id]==null?'掲載価格の下限で計算':'入力した予算で計算'}</p>`))}
 ${row('毎月の返済額（目安）',outcomes.map(compactPayment),'payment-row')}
 ${row('融資手数料',outcomes.map(o=>`<p>${o.error?'計算条件をご確認ください':yen(o.result.feeYen)}</p><p class="note">現金払いとして計算（税込）</p>`),'fee-row')}
 ${row('借入額と利息の合計',outcomes.map(o=>`<p>${o.error?'条件を確認':yen(o.result.totalPaymentYen)}</p><p class="note">選んだ金利が適用された場合。手数料・諸費用は別途。</p>`),'total-row')}
 ${row('現金で支払う金額（小計）',outcomes.map(o=>`<p>${o.error?'条件を確認':yen(o.result.knownCashYen)}</p><p class="note">頭金・融資手数料・入力した諸費用の合計。未入力の費用は含みません。</p>`),'cash-row')}
 ${row('土地面積',items.map(p=>`<p>${area(p)}㎡</p>`))}
 ${row('駅・バス停',items.map(p=>`<p>${station(p)}</p>${p.transport.filter(t=>t.kind==='bus').map(t=>`<p class="note">${esc(t.display)}</p>`).join('')}<p class="note">SUUMO掲載情報</p>`))}
 ${row('通勤先',items.map(()=>`<p>1人目：${esc(c.destinations[0]||'未入力')}<br>2人目：${esc(c.destinations[1]||'未入力')}</p><p class="note">${esc(c.arrival)}<br>通勤経路・所要時間は未確認</p>`))}
 ${row('小学校',items.map(p=>facility(p,'小学校')))}
 ${row('中学校',items.map(p=>facility(p,'中学校')))}
 ${row('周辺のスーパー',items.map(p=>facility(p,'スーパー')))}
 ${row('周辺のコンビニ',items.map(p=>facility(p,'コンビニ')))}
 ${row('確認が必要なこと',items.map(p=>`<p class="note">${esc(sourceNote(p.issue))}</p>`))}
 <p class="note comparison-notes">価格と面積に幅がある物件は、両方の条件を満たす区画があるか担当者にご確認ください。建築できるプラン・通学区域・施設までの経路も確認が必要です。金利引下げの利用は保証されません。金利は2026年9月の情報です（9月7日確認）。未入力の諸費用は小計に含みません。</p><div class="form-actions"><button class="primary" data-inquiry-compare>この${items.length}件の相談内容を確認する ${icon('arrow')}</button><a href="#/saved" data-page="saved" class="secondary">比較する土地を変更</a></div></div>`;
}
