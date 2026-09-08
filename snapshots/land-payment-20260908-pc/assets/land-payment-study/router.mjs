import {searchSorts} from './school.mjs';
import {property,validIds} from './catalog.mjs';
import {sanitizeFilters,createDraft} from './state.mjs';
export function parseRoute(hash){
 let text;try{text=decodeURI(hash.replace(/^#\/?/,''));}catch{return {page:'search'};}
 if(text==='map'||!text)return {page:'search'};
 if(text==='simulation')return {page:'estimate'};
 const [path,query='']=text.split('?'),[page,id]=path.split('/');
 if(['property','estimate','result'].includes(page))return {page,id};
 if(page==='compare')return {page,ids:validIds(new URLSearchParams(query).get('ids')?.split(','))};
 if(['saved','inquiry'].includes(page))return {page};
 if(page==='search'){
  const q=new URLSearchParams(query),f={regions:q.getAll('region')};for(const k of ['price','area','walk','primary','junior'])f[k]=q.get(k);
  const b=q.get('bounds')?.split(',').map(Number);if(b?.length===4)f.bounds={north:b[0],south:b[1],east:b[2],west:b[3]};
  return {page:'search',filters:sanitizeFilters(f),sort:q.get('sort')||'price',view:q.get('view')||'map',fromUrl:true};
 }
 return {page:'search'};
}
export function routeHash(route,state){
 if(route.page==='search'){
  const q=new URLSearchParams(),s=state.search;for(const r of s.filters.regions)q.append('region',r);for(const k of ['price','area','walk','primary','junior'])if(s.filters[k])q.set(k,s.filters[k]);
  if(s.filters.bounds){const b=s.filters.bounds;q.set('bounds',[b.north,b.south,b.east,b.west].map(v=>Number(v.toFixed(6))).join(','));}
  if(s.sort!=='price')q.set('sort',s.sort);if(s.view==='list')q.set('view','list');return '#/search'+(q.size?'?'+q:'');
 }
 if(route.page==='compare')return '#/compare?ids='+state.compareIds.join(',');
 return '#/'+route.page+(route.id?'/'+encodeURIComponent(route.id):'');
}
export function createRouter(store,{render,capture,onMissing=()=>{}}){
 // Search history already restores its recorded position in render().
 history.scrollRestoration='manual';
 function safeRoute(r){if(r.page==='estimate'&&!r.id){let d;store.update(s=>{d=createDraft(s);});return {...r,id:d.id};}if(r.page==='property'&&!property(r.id)){onMissing('この物件は現在掲載されていません。');return {page:'search'};}if(['estimate','result'].includes(r.page)&&!store.get().drafts[r.id]){onMissing('この端末には計算条件がありません。「予算から計算」からご入力ください。');return {page:'search'};}return r;}
 function saveEntry(){capture();history.replaceState({yamato:2,snapshot:store.snapshot()},'',routeHash(store.get().route,store.get()));}
 function go(route,{replace=false,restored=false,fitBounds=false}={}){
  if(!restored)saveEntry();route=safeRoute(route);store.update(s=>{s.route=route;if(route.page==='property')s.search.selectedId=route.id;});
  if(!restored)history[replace?'replaceState':'pushState']({yamato:2,snapshot:store.snapshot()},'',routeHash(route,store.get()));
  render(route,{restored,fitBounds});
 }
 function applySearchUrl(route){
  if(route.page!=='search'||!route.fromUrl)return false;
  const filterHash=filters=>routeHash({page:'search'},{search:{filters,sort:'price',view:'map'}});
  const changed=filterHash(store.get().search.filters)!==filterHash(route.filters);
  store.update(s=>{s.search.filters=route.filters;s.search.sort=searchSorts.includes(route.sort)?route.sort:'price';s.search.view=route.view==='list'?'list':'map';if(changed)Object.assign(s.search,{selectedId:null,center:null,zoom:null,scroll:0,listScroll:0,boundsPending:false});});
  return changed;
 }
 const pop=e=>{if(e.state?.yamato===2)store.restore(e.state.snapshot);const route=parseRoute(location.hash),fitBounds=applySearchUrl(route);go(route,{restored:true,fitBounds});};
 window.addEventListener('popstate',pop);
 let route=parseRoute(location.hash);
 applySearchUrl(route);
 if(route.page==='compare'&&route.ids.length)store.update(s=>{s.compareIds=route.ids.slice(0,3);});
 route=safeRoute(route);store.update(s=>{s.route=route;});history.replaceState({yamato:2,snapshot:store.snapshot()},'',routeHash(route,store.get()));
 window.addEventListener('pagehide',saveEntry);
 return {go,start:()=>render(route,{restored:true}),replace:saveEntry};
}
