import {normalizeFinance,periodLabel,choices} from './finance.mjs';
import {property,validIds,estimateFor,catalogRevision,financeRevision,houses,financialProducts} from './catalog.mjs';
export const inquiryWishes=['販売中の区画と価格','通勤の経路・時間','指定通学校・通学路','前面道路・坂道','ハザード情報','建物商品・費用','見学を希望'];
export function buildInquiry(state,today){
 const draft=state.drafts[state.inquiry.draftId],common=draft?.common??state.common;
 const estimates=[],estimateIssues=[];const checked=(id,land)=>draft&&draft.financeRevision!==financeRevision?{error:'計算条件が更新されました。返済額を再計算してください。'}:estimateFor(id,common,land,today);
 for(const id of state.inquiry.ids){const p=property(id),land=draft?.propertyId===id?draft.landMan:state.budgets[id]??p.priceMan;const o=checked(id,land);if(o.error&&common.houseId)estimateIssues.push({publicId:id,message:o.error});if(!o.error)estimates.push({publicId:id,landAmountBasis:'user-budget',input:o.input,houseId:o.house.id,financeId:common.financeId,financeRevision:o.financeRevision,dataRevision:catalogRevision,paymentYen:o.result.paymentYen,feeYen:o.result.feeYen,finance:o.finance,periods:o.result.periods,lastPaymentYen:o.result.lastPaymentYen,assumption:o.result.assumption,totalPaymentYen:o.result.totalPaymentYen,knownCashYen:o.result.knownCashYen,otherCashYen:o.result.otherCashYen});}
 if(draft&&!draft.propertyId){const o=checked(null,draft.landMan);if(o.error)estimateIssues.push({publicId:null,message:o.error});if(!o.error)estimates.push({publicId:null,landAmountBasis:draft.ownLand?'owned-land':'user-budget',input:o.input,houseId:o.house.id,financeId:common.financeId,financeRevision:o.financeRevision,dataRevision:catalogRevision,paymentYen:o.result.paymentYen,feeYen:o.result.feeYen,finance:o.finance,periods:o.result.periods,lastPaymentYen:o.result.lastPaymentYen,assumption:o.result.assumption,totalPaymentYen:o.result.totalPaymentYen,knownCashYen:o.result.knownCashYen,otherCashYen:o.result.otherCashYen});}
 return {schemaVersion:2,candidates:state.inquiry.ids.map(id=>({publicId:id,name:property(id).name,plotId:null,dataRevision:catalogRevision})),preferences:{destinations:common.destinations,arrival:common.arrival,wishes:state.inquiry.wishes??[]},estimates,estimateIssues,createdAt:new Date().toISOString(),scope:'土地と建物の予算をもとにした返済額の目安です。金利引下げや融資の利用には条件があります。税金・保険料などの諸費用は別途ご確認ください。見学の日時は決まっていません。'};
}
export function validateInquiry(body){
 if(!body||body.schemaVersion!==2||!Array.isArray(body.candidates)||body.candidates.length>3||!Array.isArray(body.estimates)||body.estimates.length>3)throw Error('相談内容を読み取れませんでした。ページを再読み込みしてください。');
 const ids=body.candidates.map(c=>c.publicId);if(validIds(ids).length!==ids.length)throw Error('現在掲載されていない土地が含まれています。相談する土地を選び直してください。');
 if(body.candidates.some(c=>c.plotId!==null||c.dataRevision!==catalogRevision))throw Error('物件情報が更新されています。土地を選び直してください。');
 if(!ids.length&&!body.estimates.length)throw Error('相談したい土地を選ぶか、返済額を計算してください。');
 if(new Set(body.estimates.map(e=>e.publicId)).size!==body.estimates.length)throw Error('同じ候補の試算が重複しています。');
 const estimates=body.estimates.map(e=>{if(e.publicId!==null&&!ids.includes(e.publicId))throw Error('試算の物件が候補と一致しません。');if(e.dataRevision!==catalogRevision)throw Error('試算の物件情報が更新されています。');if(!['landMan','cashMan','years'].every(k=>typeof e.input?.[k]==='number'&&Number.isFinite(e.input[k])))throw Error('試算の金額・年数は数値で指定してください。');if(!e.finance||Object.entries(normalizeFinance(e.finance)).some(([k,v])=>e.finance[k]!==v))throw Error('金利の設定内容を確認し、再計算してください。');const o=estimateFor(e.publicId,{houseId:e.houseId,financeId:e.financeId,cashMan:e.input?.cashMan,years:e.input?.years,finance:e.finance},e.input?.landMan);if(o.error)throw Error(o.error);if(e.financeRevision!==o.financeRevision)throw Error('金利・費用の条件が更新されています。再計算してください。');return {publicId:e.publicId,paymentYen:o.result.paymentYen,feeYen:o.result.feeYen,houseId:o.house.id,input:o.input,finance:o.finance,periods:o.result.periods,lastPaymentYen:o.result.lastPaymentYen,assumption:o.result.assumption,totalPaymentYen:o.result.totalPaymentYen,knownCashYen:o.result.knownCashYen};});
 const destinations=body.preferences?.destinations;if(!Array.isArray(destinations)||destinations.length>2||destinations.some(d=>typeof d!=='string'||d.length>50))throw Error('通勤先は2人分まで、それぞれ50文字以内で入力してください。');
 if(typeof body.preferences?.arrival!=='string'||body.preferences.arrival.length>40)throw Error('到着したい時間は40文字以内で入力してください。');
 if(!Array.isArray(body.preferences?.wishes)||body.preferences.wishes.some(w=>!inquiryWishes.includes(w)))throw Error('相談項目を確認してください。');
 return {candidateIds:ids,estimates};
}
// Keep persisted/API values stable while using familiar labels on screen and in downloads.
export const inquiryWishLabel=w=>({'通勤の経路・時間':'通勤経路・所要時間','指定通学校・通学路':'通う学校・通学路','建物商品・費用':'建物プラン・費用'})[w]??w;
export function inquiryText(body){
 const names=new Map(body.candidates.map(p=>[p.publicId,p.name])),yen=n=>n.toLocaleString('ja-JP')+'円';
 const estimates=body.estimates.flatMap(e=>{
  const loan=financialProducts.find(p=>p.id===e.financeId),house=houses.find(h=>h.id===e.houseId);
  return [`【${names.get(e.publicId)??'土地予算からのシミュレーション'}】`,
   `土地の予算：${e.input.landMan}万円`, `建物プラン：${house?.name}（税込${e.input.buildingMan}万円）`,
   `頭金（土地・建物分）：${e.input.cashMan}万円`, `返済期間：${e.input.years}年`,
   `住宅ローン：${loan?.bank} ${loan?.name}`, `当初の返済額（目安）：${yen(e.paymentYen)}／月`,
   e.assumption, '掲載金利：2026年9月（2026年9月7日確認）',
   ...e.periods.map(p=>`${periodLabel(p)}：年${p.rate}%、${yen(p.paymentYen)}／月`),
   `最終回の返済額：${yen(e.lastPaymentYen)}`,
   ...(e.financeId==='nanto'?['','変動金利は、設定した金利が完済まで続くものとして計算しています。']:['','【フラット35の金利引下げ設定】',
   ...(e.finance.flatMode==='standard'?['金利引下げなし']:Object.entries(choices).map(([k,v])=>`${({family:'ご家族',performance:'住宅性能',maintenance:'長期優良住宅',region:'地域の制度',site:'建築する土地の条件'})[k]}：${v.find(([key])=>key===e.finance[k])?.[1]}`)),
   '実際に金利引下げを利用できるかは、担当者と金融機関にご確認ください。']),
   '',`借入額と利息の合計：${yen(e.totalPaymentYen)}`,
   `融資手数料：${yen(e.feeYen)}（税込・現金払いとして計算）`,
   `現金で支払う金額（小計）：${yen(e.knownCashYen)}`,
   `その他の諸費用：${e.otherCashYen==null?'未入力（小計に含みません）':yen(e.otherCashYen)}`,
   '現金の小計は、頭金・融資手数料・入力した諸費用の合計です。未入力の費用は含まれていません。',''];
 });
 return ['やまと不動産への相談内容（未送信）','',...body.candidates.map(p=>`相談したい土地：${p.name}／販売中の区画・価格は要確認`),'',...estimates,
  ...(body.estimateIssues??[]).map(e=>`${names.get(e.publicId)??'土地予算からのシミュレーション'}：返済額を計算できませんでした。${e.message}`),'',
  `通勤先の駅（1人目）：${body.preferences.destinations[0]||'未入力'}`,`通勤先の駅（2人目）：${body.preferences.destinations[1]||'未入力'}`,
  `到着したい時間：${body.preferences.arrival}`,`相談したいこと：${body.preferences.wishes.map(inquiryWishLabel).join('・')||'未選択'}`,'',body.scope,
  '','この書類を保存・コピーしても、相談内容は送信されません。'].join('\n');
}
