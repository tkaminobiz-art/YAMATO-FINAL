import {financeDefaults,normalizeFinance} from './finance.mjs';
import {schoolLimits,searchSorts} from './school.mjs';
import {property,validIds,cities,houses,financialProducts,catalogRevision} from './catalog.mjs';
export const SESSION_KEY='yamato-land-study:session:v2',SAVED_KEY='yamato-land-study:saved:v2';
const copy=v=>structuredClone(v);
const defaults=()=>({version:2,conditionsEpoch:0,route:{page:'search'},search:{view:'map',selectedId:null,filters:{regions:[]},sort:'price',center:null,zoom:null,boundsPending:false,scroll:0,listScroll:0},common:{houseId:null,cashMan:'0',years:35,financeId:'nanto',finance:financeDefaults(),destinations:['',''],arrival:'平日 8:30着'},drafts:{},compareIds:[],budgets:{},inquiry:{ids:[],draftId:null},revision:catalogRevision});
const number=(v,min,max,fallback)=>v!==''&&Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):fallback;
export function sanitizeFilters(value={}){
 const f={regions:[...new Set(Array.isArray(value.regions)?value.regions:[])].filter(x=>cities.includes(x))};
 for(const [k,allowed] of Object.entries({price:[1000,1500,2000,2500,3000],area:[150,180],walk:[10,15,20],primary:schoolLimits,junior:schoolLimits}))if(allowed.includes(Number(value[k])))f[k]=Number(value[k]);
 const b=value.bounds;
 if(b&&['north','south','east','west'].every(k=>Number.isFinite(Number(b[k])))&&b.north>=b.south&&b.east>=b.west&&Math.abs(b.north)<=90&&Math.abs(b.south)<=90&&Math.abs(b.east)<=180&&Math.abs(b.west)<=180)f.bounds=Object.fromEntries(Object.entries(b).filter(([k])=>['north','south','east','west'].includes(k)).map(([k,v])=>[k,Number(v)]));
 return f;
}
function normalizeCommon(c={}){return {houseId:houses.some(x=>x.id===c.houseId)?c.houseId:null,cashMan:c.cashMan===''?'':String(number(c.cashMan,0,20000,0)),years:number(c.years,1,50,35),financeId:financialProducts.some(x=>x.id===c.financeId)?c.financeId:'nanto',finance:financeDefaults(),finance:normalizeFinance(c.finance),destinations:[0,1].map(i=>String(c.destinations?.[i]??'').slice(0,50)),arrival:String(c.arrival??'平日 8:30着').slice(0,40)};}
export function normalizeState(raw){
 const s=defaults();if(!raw||raw.version!==2)return s;
 s.conditionsEpoch=number(raw.conditionsEpoch,0,Number.MAX_SAFE_INTEGER,0);s.common=normalizeCommon(raw.common);s.search.filters=sanitizeFilters(raw.search?.filters);
 s.search.view=raw.search?.view==='list'?'list':'map';s.search.selectedId=property(raw.search?.selectedId)?.id??null;
 s.search.sort=searchSorts.includes(raw.search?.sort)?raw.search.sort:'price';
 s.search.boundsPending=!!raw.search?.boundsPending;
 if(Array.isArray(raw.search?.center)&&raw.search.center.length===2&&raw.search.center.every(Number.isFinite)&&Math.abs(raw.search.center[0])<=90&&Math.abs(raw.search.center[1])<=180)s.search.center=raw.search.center;
 s.search.zoom=number(raw.search?.zoom,3,18,null);s.search.scroll=number(raw.search?.scroll,0,1000000,0);s.search.listScroll=number(raw.search?.listScroll,0,1000000,0);
 s.compareIds=validIds(raw.compareIds).slice(0,3);
 for(const [id,budget]of Object.entries(raw.budgets??{}))if(property(id))s.budgets[id]=budget===''?'':number(budget,0,10000,'');
 for(const [key,d]of Object.entries(raw.drafts??{}).slice(-100)){
  if(!/^[a-z0-9-]{1,80}$/.test(key)||d.propertyId&&!property(d.propertyId))continue;
  s.drafts[key]={id:key,propertyId:d.propertyId??null,landMan:d.landMan===''?'':String(number(d.landMan,0,10000,0)),common:normalizeCommon(d.common),calculated:!!d.calculated,financeRevision:typeof d.financeRevision==='string'?d.financeRevision:'legacy',revision:typeof d.revision==='string'?d.revision:catalogRevision,ownLand:!!d.ownLand};
 }
 s.inquiry={ids:validIds(raw.inquiry?.ids).slice(0,3),draftId:s.drafts[raw.inquiry?.draftId]?raw.inquiry.draftId:null,wishes:Array.isArray(raw.inquiry?.wishes)?raw.inquiry.wishes.filter(v=>typeof v==='string'&&v.length<=40):[]};
 return s;
}
export function createStore(storage,savedStorage){
 const unavailable={getItem(){throw Error('unavailable');},setItem(){throw Error('unavailable');}};
 if(storage===undefined){try{storage=globalThis.sessionStorage??unavailable;}catch{storage=unavailable;}}
 if(savedStorage===undefined){try{savedStorage=globalThis.localStorage??unavailable;}catch{savedStorage=unavailable;}}
 let state=defaults(),saved={},sessionAvailable=true,savedAvailable=true;
 try{state=normalizeState(JSON.parse(storage.getItem(SESSION_KEY)));}catch{sessionAvailable=false;}
 try{const raw=JSON.parse(savedStorage.getItem(SAVED_KEY));if(raw?.version===2)for(const [id,entry]of Object.entries(raw.items??{}))if(/^s\d+$/.test(id)&&entry&&typeof entry.name==='string')saved[id]={name:entry.name.slice(0,100),savedAt:String(entry.savedAt??''),revision:String(entry.revision??'')};}catch{savedAvailable=false;}
 const persist=()=>{try{storage.setItem(SESSION_KEY,JSON.stringify(state));sessionAvailable=true;}catch{sessionAvailable=false;}};
 const saveCandidates=()=>{try{savedStorage.setItem(SAVED_KEY,JSON.stringify({version:2,items:saved}));savedAvailable=true;}catch{savedAvailable=false;}};
 persist();saveCandidates();
 return {get:()=>state,snapshot:()=>copy(state),restore(raw){const current=state,route=state.route;state=normalizeState(raw);if(state.conditionsEpoch!==current.conditionsEpoch){for(const k of ['common','drafts','budgets','inquiry','conditionsEpoch'])state[k]=copy(current[k]);}state.route=route;persist();},update(fn){fn(state);persist();},saved:()=>copy(saved),has:id=>!!saved[id],toggle(id){if(saved[id])delete saved[id];else {const p=property(id);if(!p)return; saved[id]={name:p.name,savedAt:new Date().toISOString(),revision:catalogRevision};}saveCandidates();},syncSaved(raw){try{const data=JSON.parse(raw);if(data?.version!==2)return;const next={};for(const [id,e]of Object.entries(data.items??{}))if(/^s\d+$/.test(id)&&typeof e?.name==='string')next[id]={name:e.name.slice(0,100),savedAt:String(e.savedAt??''),revision:String(e.revision??'')};saved=next;}catch{}},capabilities:()=>({sessionAvailable,savedAvailable}),clearConditions(){state.conditionsEpoch+=1;state.inquiry={ids:state.inquiry.ids,draftId:null,wishes:[]};state.common=defaults().common;state.drafts={};state.budgets={};persist();}};
}
export function createDraft(state,propertyId=null){
 const existing=Object.values(state.drafts).find(d=>d.propertyId===propertyId&&!d.ownLand);
 if(existing)return existing;
 const p=property(propertyId),id=globalThis.crypto?.randomUUID?.()??`draft-${Date.now()}`;
 const draft={id,propertyId:p?.id??null,landMan:p?String(state.budgets[p.id]??p.priceMan):'',common:copy(state.common),calculated:false,revision:catalogRevision,ownLand:false};state.drafts[id]=draft;return draft;
}
