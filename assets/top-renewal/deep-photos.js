(() => {
 'use strict';
 if(!document.body.hasAttribute('data-top-depth'))return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:767px)');
 const records=new Map(),active=new Set();let raf=0;
 const hero=document.querySelector('.new-hero'),media=hero?.querySelector('.new-hero__media');let heroVisible=false;
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 function schedule(){if(!raf&&!reduce.matches&&!document.hidden&&(active.size||heroVisible))raf=requestAnimationFrame(render);}
 function measure(record){
  const sp=mobile.matches;
  // A bounded entry card must not expose its background by moving the viewport.
  record.range=record.kind==='product'?(sp?28:36):record.kind==='instagram'?(sp?12:14):['entry','folio'].includes(record.kind)?0:(sp?16:22);
  const scale=record.kind==='product'?1.08:record.kind==='instagram'?1:record.kind==='proof'?1.06:record.kind==='folio'?1.10:1.14;
  record.imageRange=Math.max(0,record.frame.clientHeight*(scale-1)/2-1);
 }
 function render(){
  raf=0;if(reduce.matches||document.hidden)return;
  // Read all geometry before writing. Previous translation is removed to avoid scroll feedback.
  const reads=[...active].filter(r=>r.frame.isConnected).map(r=>({r,rect:r.frame.getBoundingClientRect()}));
  const heroTop=heroVisible?hero.getBoundingClientRect().top:0;
  for(const {r,rect} of reads){
   const center=rect.top-r.shift+rect.height/2;
   const progress=clamp((innerHeight*.85-center)/(innerHeight*.7),0,1);
   const position=1-progress*2;
   r.shift=position*r.range;r.frame.style.setProperty('--photo-y',`${r.shift.toFixed(2)}px`);
   r.frame.style.setProperty('--image-y',`${(position*r.imageRange).toFixed(2)}px`);
  }
  if(heroVisible)media.style.setProperty('--hero-depth-y',`${clamp(-heroTop*.24,0,mobile.matches?110:170).toFixed(2)}px`);
 }
 const observer=new IntersectionObserver(entries=>{for(const e of entries){const r=records.get(e.target);if(r)e.isIntersecting?active.add(r):active.delete(r);}schedule();},{rootMargin:'100px'});
 const resize=new ResizeObserver(entries=>{for(const e of entries){const r=records.get(e.target);if(r)measure(r);}schedule();});
 function register(frame,kind){
  if(records.has(frame))return;
  frame.dataset.deepFrame=kind;const r={frame,kind,range:0,imageRange:0,shift:0};records.set(frame,r);measure(r);observer.observe(frame);resize.observe(frame);
  frame.querySelector('img')?.addEventListener('load',()=>{measure(r);schedule();});
 }
 function wrap(img,kind,ratio){
  if(!img||img.parentElement.hasAttribute('data-deep-frame'))return;
  const frame=document.createElement('span');frame.style.setProperty('--photo-ratio',ratio);img.before(frame);frame.append(img);register(frame,kind);
 }
 document.querySelectorAll('.built-proof__photos figure>img').forEach(img=>wrap(img,'proof','4/3'));
 document.querySelectorAll('.built-folio__frame').forEach(frame=>register(frame,'folio'));
 document.querySelectorAll('.reason__image,.visit__photo').forEach(img=>wrap(img,'editorial','3/2'));
 document.querySelectorAll('.work figure>img').forEach(img=>wrap(img,'works',img.closest('.work--main')?'4/3':'3/2'));
 document.querySelectorAll('.product__photo').forEach(frame=>register(frame,'product'));
 document.querySelectorAll('.nara-editorial__photo').forEach(frame=>register(frame,'editorial'));
 // quiet-rails.js runs first; include its visual repeats without adding new links or focus targets.
 document.querySelectorAll('.entry-card__visual').forEach(frame=>{if(frame.querySelector(':scope>img'))register(frame,'entry');});
 const gallery=document.getElementById('igGallery');
 if(gallery){const refresh=()=>gallery.querySelectorAll('.ig-post__frame').forEach(frame=>{if(frame.querySelector(':scope>img'))register(frame,'instagram');});new MutationObserver(refresh).observe(gallery,{childList:true,subtree:true});refresh();}
 if(hero&&media)new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;schedule();}).observe(hero);
 function reset(){cancelAnimationFrame(raf);raf=0;for(const r of records.values()){r.shift=0;r.frame.style.removeProperty('--photo-y');r.frame.style.removeProperty('--image-y');measure(r);}media?.style.removeProperty('--hero-depth-y');schedule();}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});mobile.addEventListener('change',reset);reduce.addEventListener('change',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();});
 addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;});addEventListener('pageshow',schedule);
})();
