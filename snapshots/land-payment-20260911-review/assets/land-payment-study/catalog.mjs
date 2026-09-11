import {properties as sourceProperties, houses, financialProducts, rateValidity} from './data.mjs';
import {selectProperties, getEstimate} from './domain.mjs';
export {houses, financialProducts, rateValidity};
import {financeRevision,normalizeFinance} from './finance.mjs';
export {financeRevision};
export const catalogRevision='suumo-20260911-review-v1';
export const properties=sourceProperties.map(p=>Object.freeze({...p,publicId:p.id,plotId:null,availability:'unverified',revision:catalogRevision}));
const byId=new Map(properties.map(p=>[p.id,p]));
export const property=id=>byId.get(id);
export const cities=[...new Set(properties.map(p=>p.city))].sort((a,b)=>a.localeCompare(b,'ja'));
export const validIds=ids=>[...new Set(Array.isArray(ids)?ids:[])].filter(id=>byId.has(id));
export function queryCatalog(filters,sort){
 const items=selectProperties(properties,filters,sort==='region'?'price':sort);
 if(sort==='region')items.sort((a,b)=>a.city.localeCompare(b.city,'ja')||a.priceMan-b.priceMan||a.id.localeCompare(b.id));
 return items.map(p=>({property:p,matchStatus:filters.price&&filters.area&&(p.priceMaxMan>p.priceMan||p.areaMaxM2>p.areaM2)?'plot-unverified':'source-match'}));
}
export function estimateFor(id,common,landAmount,today){
 const p=property(id), house=houses.find(h=>h.id===common.houseId);
 if(!house)return {error:'建物プランを選んでください。'};
 const landMan=landAmount??p?.priceMan;
 if(landMan==null||landMan==='')return {error:'土地の予算を入力してください。'};
 try{
  const input={landMan:Number(landMan),buildingMan:house.priceMan,cashMan:Number(common.cashMan),years:Number(common.years)};
  if(common.cashMan==='')throw Error('頭金を入力してください。');
  const result=getEstimate(input,common.financeId,today,common.finance);
  return {input,result,house,property:p,revision:catalogRevision,financeRevision,finance:normalizeFinance(common.finance)};
 }catch(e){return {error:e.message};}
}
export function validateCatalog(){
 const errors=[];
 if(byId.size!==properties.length)errors.push('Duplicate listing IDs');
 for(const p of properties){
  if(!/^s\d+$/.test(p.id)||!p.source.startsWith('https://suumo.jp/'))errors.push(`Invalid source ${p.id}`);
  if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||p.priceMaxMan<p.priceMan||p.areaMaxM2<p.areaM2)errors.push(`Invalid range ${p.id}`);
  if(p.plotId!==null)errors.push(`Unverified plot ${p.id}`);
 }
 return errors;
}
