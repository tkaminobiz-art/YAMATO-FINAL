import {financeFields,compactPayment} from './finance.mjs';
import {property,houses,financialProducts,estimateFor} from '../catalog.mjs';
import {commonFields} from './estimate.mjs';
import {esc,num,price,area,photo,station,icon,yen} from '../ui.mjs';
export function compareView(store){
 const s=store.get(),items=s.compareIds.map(property).filter(Boolean),c=s.common,house=houses.find(h=>h.id===c.houseId),finance=financialProducts.find(p=>p.id===c.financeId);
 if(items.length<2)return `<div class="content-wrap"><a href="#/saved" data-page="saved" class="back-link">← 保存した土地に戻る</a><h1 tabindex="-1">土地を比較する</h1><div class="empty-state"><h2>比較する土地を2〜3件選んでください</h2><p>保存した土地から候補を選べます。</p><a class="primary" href="#/saved" data-page="saved">保存した土地を見る</a></div></div>`;
 const outcomes=items.map(p=>estimateFor(p.id,c,s.budgets[p.id]??p.priceMan));let rowIndex=0;
 const row=(label,values,cls='')=>`<section class="comparison-row ${cls}" aria-labelledby="compare-row-${++rowIndex}"><h2 id="compare-row-${rowIndex}">${label}</h2><div class="comparison-values" style="--columns:${items.length}">${values.map((value,i)=>`<div><p class="comparison-property">${esc(items[i].name)}</p>${value}</div>`).join('')}</div></section>`;
 const facility=(p,type)=>{const a=p.amenities.find(x=>x.type===type&&x.name);return a?`<p>${esc(a.name)}</p><p class="note">${a.publishedMinutes!=null?'徒歩'+a.publishedMinutes+'分（掲載値）':'徒歩情報は未掲載'}${type.includes('学校')?'<br>指定通学校は未確認':''}</p>`:'<p class="note">掲載情報なし</p>';};
 return `<div class="content-wrap comparison-page"><a href="#/saved" data-page="saved" class="back-link">← 保存した土地に戻る</a><h1 tabindex="-1">${items.length}件の土地を比較する</h1><p class="page-lead">建物・自己資金・期間をそろえて、支払いと周辺環境を比べられます。</p><details class="common-settings" ${house?'':'open'}><summary>共通の試算・通勤条件 <span>${house?`${house.name} ／ 自己資金${num(c.cashMan)}万円 ／ ${c.years}年`:'建物と条件を選んでください'}</span></summary><form id="compare-form">${commonFields(c,{destinations:true})}<label class="field">金融商品<select name="financeId">${financialProducts.map(p=>`<option value="${p.id}" ${p.id===c.financeId?'selected':''}>${p.bank} ${p.name}</option>`).join('')}</select></label><details class="finance-settings"><summary>金利引下げ・費用の条件</summary>${financeFields(c.finance)}</details><p class="note">通勤先は希望条件として保持します。経路・合計時間は未確認です。</p><button class="primary" type="submit">全候補にこの条件を使う</button></form></details><p class="comparison-assumptions">${house?`建物「${house.name}」・自己資金${num(c.cashMan)}万円・${c.years}年／${finance.bank} ${finance.name}`:'建物を選ぶと月々の支払い目安が表示されます。'}<br>土地は仮予算、元利均等・ボーナスなし・諸費用別。</p><div class="comparison-head" style="--columns:${items.length}">${items.map(p=>`<article>${photo(p)}<p class="eyebrow">${esc(p.city)}</p><h2><a href="#/property/${p.id}" data-property="${p.id}">${esc(p.name)}</a></h2><button data-remove-compare="${p.id}" aria-label="${esc(p.name)}を比較から外す">比較から外す ×</button></article>`).join('')}</div>
 ${row('土地の掲載価格',items.map(p=>`<p class="comparison-price">${price(p)}<small>万円</small></p><p class="note">対象区画・販売状況は確認前</p>`))}
 ${row('試算に使う土地予算',items.map(p=>`<label class="budget-field"><span class="sr-only">${esc(p.name)}の土地予算</span><input type="number" inputmode="numeric" min="0" max="10000" step="1" data-budget="${p.id}" value="${esc(s.budgets[p.id]??p.priceMan)}">万円</label><p class="note">${s.budgets[p.id]==null?'掲載価格の下限を仮入力':'利用者が変更した仮予算'}</p>`))}
 ${row('毎月の返済目安',outcomes.map(compactPayment),'payment-row')}
 ${row('融資手数料',outcomes.map(o=>`<p>${o.error?'試算条件の確認が必要':yen(o.result.feeYen)}</p><p class="note">別途の現金支出・税込</p>`),'fee-row')}
 ${row('元利金の総返済額',outcomes.map(o=>`<p>${o.error?'条件を確認':yen(o.result.totalPaymentYen)}</p><p class="note">元利金のみ・選択条件での試算</p>`),'total-row')}
 ${row('この試算で計上した現金',outcomes.map(o=>`<p>${o.error?'条件を確認':yen(o.result.knownCashYen)}</p><p class="note">自己資金＋融資手数料＋入力したその他費用。未計上の費用は別途確認。</p>`),'cash-row')}
 ${row('土地面積',items.map(p=>`<p>${area(p)}㎡</p>`))}
 ${row('駅・バスのアクセス',items.map(p=>`<p>${station(p)}</p>${p.transport.filter(t=>t.kind==='bus').map(t=>`<p class="note">${esc(t.display)}</p>`).join('')}<p class="note">SUUMO掲載値</p>`))}
 ${row('通勤先の希望',items.map(()=>`<p>A：${esc(c.destinations[0]||'未入力')}<br>B：${esc(c.destinations[1]||'未入力')}</p><p class="note">${esc(c.arrival)}<br>物件からの経路・合計時間は未確認</p>`))}
 ${row('小学校',items.map(p=>facility(p,'小学校')))}
 ${row('中学校',items.map(p=>facility(p,'中学校')))}
 ${row('周辺のスーパー',items.map(p=>facility(p,'スーパー')))}
 ${row('周辺のコンビニ',items.map(p=>facility(p,'コンビニ')))}
 ${row('確認が必要なこと',items.map(p=>`<p class="note">${esc(p.issue)}</p>`))}
 <p class="note comparison-notes">土地の価格と面積の範囲が、同一区画の組合せとは限りません。建物商品の対応、指定校、施設への経路は個別確認が必要です。金利引下げの適用は未確認です。金利の適用月は2026年9月、確認日は9月7日です。現金支払いに未計上の費用は0円ではありません。</p><div class="form-actions"><button class="primary" data-inquiry-compare>この${items.length}件で相談内容を確認 ${icon('arrow')}</button><a href="#/saved" data-page="saved" class="secondary">候補を入れ替える</a></div></div>`;
}
