(async()=>{
const runtimeBase=new URL('.',document.currentScript.src);
const fullData=await fetch(new URL('assets/catalog/folio/full-content.json',document.baseURI)).then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json();});
const adoptedComparison=await fetch(new URL('comparison-a.html',runtimeBase)).then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.text();});
const data=await fetch(new URL('assets/catalog/folio/content.json',document.baseURI)).then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json();}),intro=data[0],equipment=data[6],comparison=data[27],small=matchMedia('(max-width:820px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
const root=document.querySelector('.folio'),paper=document.querySelector('.folio-paper'),content=document.querySelector('.folio-content'),coverScene=document.getElementById('coverScene'),paperScene=document.getElementById('paperScene'),cover=document.querySelector('.catalog-cover--motion'),video=cover.querySelector('video'),toc=document.getElementById('folioToc'),zoom=document.getElementById('folioZoom');let sheets=[],current=-1,opener=null;
function head(u,label,part){return `<p class="folio-kicker">${label}<span>${part}</span></p><h2 id="folioTitle">${u.id==='catalog-introduction'?'標準仕様を、<br>最初の見積もりから。':u.id==='catalog-compare-water'?'水まわりの仕様を、<br>3シリーズで比較。':u.title.replace(/、/g,'、<wbr>')}</h2>`;}
function open(u,label,conditions){return `<div class="folio-opening"><div class="opening-copy">${head(u,label,'全景')}${u.lead}${conditions?u.introConditions:''}</div><div class="opening-photo">${u.hero}${u.id==='catalog-stedia'&&conditions?u.links+u.source:''}</div></div>`;}
function featurePage(u,label,features,extra='',kind='details'){return `${head(u,label,'詳しく見る')}<div class="folio-${kind}">${features.join('')}</div>${extra}`;}
function makeRepresentatives(){const m=small.matches;let a=[];const add=(key,unit,title,html)=>a.push({key,unit,title,html});
add('introduction','introduction','家を選ぶ',open(intro,'01 / 家を選ぶ',!m));
if(m){add('introduction-2','introduction','家を選ぶ',featurePage(intro,'01 / 家を選ぶ',[intro.features[0]],intro.introConditions,'features'));add('introduction-3','introduction','家を選ぶ',featurePage(intro,'01 / 家を選ぶ',intro.features.slice(1),intro.links,'features'));}
else add('introduction-2','introduction','家を選ぶ',featurePage(intro,'01 / 家を選ぶ',intro.features,intro.links,'features'));
add('comparison','comparison','商品比較',adoptedComparison);
add('stedia','stedia','キッチン',open(equipment,'02 / キッチン',!m));
if(m){equipment.features.forEach((f,i)=>add('stedia-'+(i+2),'stedia','キッチン',featurePage(equipment,'02 / キッチン',[f],'')));add('stedia-6','stedia','キッチン',head(equipment,'02 / キッチン','選択できる仕様')+equipment.introConditions+equipment.links+equipment.source);}
else {add('stedia-2','stedia','キッチン',featurePage(equipment,'02 / キッチン',equipment.features.slice(0,2)));add('stedia-3','stedia','キッチン',featurePage(equipment,'02 / キッチン',equipment.features.slice(2)));}
add('water-details','water-details','設備の補足',`<div class="a-supplement"><p class="folio-kicker">やまとの家 ／ 設備の補足<span>水まわり</span></p><h2 id="folioTitle">トイレと手洗いの仕様。</h2>${comparison.lead}<div class="a-table-scroll" tabindex="0" role="region" aria-label="トイレと手洗いの3商品比較"><table class="a-table a-detail-table"><colgroup><col class="a-label-col"><col><col><col></colgroup>${comparison.tableHead}<tbody>${comparison.rows.filter(r=>r.includes('data-spec-key="toilet-1f"')||r.includes('data-spec-key="handwash"')).join('')}</tbody></table></div>${comparison.conditions}${data[16].introConditions}${comparison.links}</div>`);
sheets=a;}
const chapterNames=['家を選ぶ','キッチン','水まわり','内装','外装とスマート設備','構造と性能','設計と施工','保証と点検','仕様一覧','費用と相談'];
function resolve(key){if(!key)return -1;if(key==='catalog-compare-water')key='comparison';let n=sheets.findIndex(s=>s.key===key);if(n>=0)return n;const aliases={introduction:'catalog-introduction',stedia:'catalog-stedia','water-details':'catalog-compare-water'};key=aliases[key]||key.split('--')[0];return sheets.findIndex(s=>s.unit===key);}
function make(){
 root.classList.remove('flow-reading');makeRepresentatives();const reps=sheets;const out=[];const m=small.matches;
 const cs=getComputedStyle(paper);const measure=document.createElement('article');measure.className='catalog-cover folio-paper folio-measure';measure.style.cssText=`position:absolute;left:-20000px;top:0;visibility:hidden;pointer-events:none;transform:none;animation:none;width:${cs.width};height:${cs.height};`;
 const mc=document.createElement('div');mc.className='folio-content';measure.append(mc);root.append(measure);
 const fits=html=>{mc.innerHTML=html;const r=mc.getBoundingClientRect();return Math.max(r.top,...[...mc.querySelectorAll('*')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().bottom))<=r.bottom+1;};
 const title=(u,p)=>head(u,`${String(u.num).padStart(2,'0')} / ${chapterNames[u.chapter-1]}`,p>1?'続き':'');
 const frame=(u,blocks,p)=>`<div class="full-sheet">${title(u,p)}<div class="full-grid">${blocks.map(b=>`<div class="full-block full-${b.type}" data-source-block="${b.id}">${b.html}</div>`).join('')}</div></div>`;
 const representative=(unit,from)=>{const selected=reps.filter(s=>s.unit===from);for(const s of selected)out.push({...s,html:from==='introduction'?s.html.replace('href="#catalog-series"','href="#comparison"'):s.html,unit,key:from==='water-details'?'water-details':selected.indexOf(s)?unit+'--'+(selected.indexOf(s)+1):unit,sourceIds:['representative:'+unit]});};
 for(const u of fullData){
  if(u.id==='catalog-introduction'){representative(u.id,'introduction');out.push({...reps.find(s=>s.key==='comparison'),unit:'catalog-compare-water',sourceIds:['catalog-series:1','catalog-compare-water:1']});continue;}
  if(u.id==='catalog-stedia'){representative(u.id,'stedia');continue;}
  if(u.id==='catalog-compare-water'){representative(u.id,'water-details');continue;}
  let page=0,pending=[],consumed=new Set();const emit=(html,blocks)=>{page++;out.push({key:u.id+(page>1?'--'+page:''),unit:u.id,title:u.title.split('｜')[0],html,sourceIds:blocks.map(b=>b.id)});};
  const flush=()=>{if(pending.length){emit(frame(u,pending,page+1),pending);pending=[];}};
  const queue=b=>{const test=[...pending,b];if(pending.length&&!fits(frame(u,test,page+1)))flush();pending.push(b);};
  for(const [i,original]of u.blocks.entries()){
   if(consumed.has(i))continue;const b={...original,id:u.id+':'+i};
   if(u.id==='catalog-series'&&b.html.includes('cr-price-grid'))continue;
   if(b.type==='opening'){
    flush();const dom=document.createElement('div');dom.innerHTML=b.html;const figure=dom.querySelector('figure');const left=dom.querySelector('.cr-intro-grid')?.firstElementChild;
    const opening=`<div class="full-sheet full-opening"><div class="folio-opening"><div class="opening-copy">${title(u,1)}${left?.innerHTML||''}</div><div class="opening-photo">${figure?.outerHTML||''}</div></div></div>`;
    if(fits(opening)){emit(opening,[b]);}else{
     if(left)for(const child of left.children)queue({id:b.id,type:child.matches('.cr-intro-conditions')?'conditions':'lead',html:child.outerHTML});
     if(figure)queue({id:b.id,type:'hero',html:figure.outerHTML});flush();
    }continue;
   }
   if(b.type==='table'){
    const before=pending;pending=[];const after=u.blocks.slice(i+1).map((x,j)=>({...x,id:u.id+':'+(i+j+1)}));for(let j=i+1;j<u.blocks.length;j++)consumed.add(j);
    const box=document.createElement('div');box.innerHTML=b.html;const t=box.querySelector('table');const rows=[...t.querySelectorAll('tbody tr')];
    const tableHtml=(rs,first,last)=>`<div class="full-sheet full-reference">${title(u,page+1)}${first?before.map(x=>x.html).join(''):''}<p class="a-scroll-hint">表を左右に動かすと、3商品の仕様を確認できます。</p><div class="a-table-scroll" role="region" tabindex="0" aria-label="${u.title}"><table class="a-table"><colgroup><col class="a-label-col"><col><col><col></colgroup>${t.querySelector('thead').outerHTML}<tbody>${rs.map(r=>r.outerHTML).join('')}</tbody></table></div>${last?'<div class="full-reference-notes">'+after.map(x=>x.html).join('')+'</div>':''}</div>`;
    if(m){emit(tableHtml(rows,true,true),[...before,b,...after]);}else{let group=[],first=true;for(let j=0;j<rows.length;j++){const row=rows[j];if(group.length&&!fits(tableHtml([...group,row],first,j===rows.length-1))){emit(tableHtml(group,first,false),[...(first?before:[]),b]);first=false;group=[];}group.push(row);}if(group.length)emit(tableHtml(group,first,true),[...(first?before:[]),b,...after]);}continue;
   }
   // Keep the paid-extension condition beside every warranty period diagram.
   if(u.id==='catalog-warranty'&&b.html.startsWith('<p class="cr-important"')){if(m)continue;b.type='conditions';}
   if(m&&/cr-warranty-summary|cr-timeline/.test(b.html)){b.html+=u.blocks.find(x=>x.html.startsWith('<p class="cr-important"')).html;}
   queue(b);
  }
  if(pending.length&&pending.every(b=>b.type==='links'||b.type==='special'&&b.html.includes('cr-source'))){
   const previous=out.at(-1);if(previous?.unit===u.id){const dom=document.createElement('div');dom.innerHTML=previous.html;const grid=dom.querySelector('.full-grid');const blocks=grid?[...grid.children]:[];const moved=blocks.filter(x=>x.classList.contains('full-feature')).at(-1);
    if(moved&&blocks.length>1){const block={id:moved.dataset.sourceBlock,type:'feature',html:moved.innerHTML};if(fits(frame(u,[block,...pending],page+1))){moved.remove();previous.html=dom.innerHTML;previous.sourceIds=previous.sourceIds.filter(id=>id!==block.id);pending.unshift(block);}}
   }
  }
  flush();
 }
 measure.remove();sheets=out;
 toc.querySelectorAll(':scope > a,:scope > .full-toc-list').forEach(e=>e.remove());const list=document.createElement('div');list.className='full-toc-list';list.innerHTML='<a href="#cover">表紙</a><a href="#comparison">花・京・風を、ひと目で比較。</a>'+chapterNames.map((name,c)=>`<section><h3>${String(c+1).padStart(2,'0')} ${name}</h3>${fullData.filter(u=>u.chapter===c+1).map(u=>`<a href="#${u.id}">${u.title}<span>${String(u.num).padStart(2,'0')}</span></a>`).join('')}</section>`).join('')+'<a href="#price">サイト本編へ ↗</a>';toc.append(list);
}

function fixLinks(){content.querySelectorAll('button[data-cr-zoom]').forEach(b=>b.setAttribute('aria-label','写真を拡大'));content.querySelectorAll('.cr-photo-static').forEach(s=>{if(!s.querySelector('img'))return;const b=document.createElement('button');b.type='button';b.className='cr-photo-button';b.dataset.crZoom='';b.setAttribute('aria-label','図版を拡大');b.innerHTML=s.innerHTML;s.replaceWith(b);});}

function fit(){root.classList.remove('flow-reading');if(current<0)return;requestAnimationFrame(()=>{const r=content.getBoundingClientRect();const lowest=Math.max(...[...content.querySelectorAll('*')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().bottom));const excess=lowest>r.bottom+2;if(excess){root.classList.add('flow-reading');}root.dataset.flowReason=excess?'内容の可読性を優先した通常スクロール':'';});}
function render(focus=false){const reading=current>=0;coverScene.hidden=reading;paperScene.hidden=!reading;paperScene.classList.toggle('is-active',reading);root.classList.remove('flow-reading');document.getElementById('back').disabled=current<0;document.getElementById('forward').disabled=current===sheets.length-1;document.getElementById('forward').textContent=reading?'次へ →':'開く →';document.querySelector('.folio-position').textContent=reading?`${String(current+1).padStart(2,'0')} / ${sheets.length} · ${sheets[current].title}`:'花鳥風月';if(reading){video.pause();content.innerHTML=sheets[current].html;document.getElementById('folioNumber').textContent=String(current+1).padStart(2,'0');fixLinks();content.querySelectorAll('img').forEach(i=>{i.loading='eager';i.addEventListener('load',fit,{once:true});});fit();if(focus)paper.focus({preventScroll:true});}toc.querySelectorAll('a').forEach(a=>a.hash==='#'+(reading?sheets[current].unit:'cover')?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));}
function go(to,push=true){current=typeof to==='string'?resolve(to):Math.max(-1,Math.min(sheets.length-1,to));if(push)history.pushState({},'','#'+(sheets[current]?.key||'cover'));render(true);root.scrollIntoView({block:'start',behavior:'instant'});}
function openDialog(d,b){opener=b;d.showModal();d.querySelector('[data-close]').focus();}for(const d of [toc,zoom]){d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>{opener?.focus({preventScroll:true});});d.addEventListener('click',e=>{if(e.target===d&&e.offsetX<0)d.close();});}
document.getElementById('contents').onclick=e=>openDialog(toc,e.currentTarget);document.getElementById('back').onclick=()=>go(current-1);document.getElementById('forward').onclick=()=>go(current+1);
document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&(a.getAttribute('href')==='#cover'||a.getAttribute('href')==='#top'||resolve(a.getAttribute('href')?.slice(1))>=0)&&!e.ctrlKey&&!e.metaKey){e.preventDefault();if(toc.open){opener=null;toc.close();}go(a.hash.slice(1));}else if(a&&toc.contains(a))toc.close();const z=e.target.closest('[data-cr-zoom]');if(z){const image=z.querySelector('img'),dest=zoom.querySelector('img');dest.src=image.src;dest.alt=image.alt;zoom.querySelector('p').textContent=z.closest('figure').querySelector('figcaption').textContent;openDialog(zoom,z);}});
root.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||e.target.closest('a,button,input,.a-table-scroll')||getSelection().toString())return;e.preventDefault();go(current+(e.key==='ArrowRight'?1:-1));});
window.addEventListener('popstate',()=>go(location.hash.slice(1),false));
function settle(){video.pause();cover.classList.add('is-motion-settled','is-title-in');}
document.getElementById('catOpeningSkip').onclick=settle;document.getElementById('catOpeningReplay').onclick=()=>{if(reduce.matches){settle();return;}cover.classList.remove('is-motion-settled','is-title-in');video.currentTime=0;video.play().catch(settle);};video.addEventListener('timeupdate',()=>{if(video.currentTime>4.45)cover.classList.add('is-title-in');});video.addEventListener('ended',settle);video.addEventListener('error',settle);if(reduce.matches)settle();else video.play().catch(settle);
small.addEventListener('change',()=>{const key=sheets[current]?.unit;make();current=key?resolve(key):-1;render();});let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const key=sheets[current]?.unit;root.classList.remove('flow-reading');make();current=key?resolve(key):-1;render();},180);});make();current=resolve(location.hash.slice(1));render();await document.fonts.ready;make();current=resolve(location.hash.slice(1));render();fit();window.__folio={sheets:()=>sheets.map(({key,unit,title,sourceIds})=>({key,unit,title,sourceIds})),go,current:()=>sheets[current]?.key||'cover'};
})().catch(()=>{document.querySelector('.folio-controls').hidden=true;const fallback=document.querySelector('noscript:has(+ main)')||[...document.querySelectorAll('noscript')].find(n=>n.textContent.includes('catalog-text-version'));if(fallback){const text=document.createElement('div');text.innerHTML=fallback.textContent;document.querySelector('.folio').after(text);}});
