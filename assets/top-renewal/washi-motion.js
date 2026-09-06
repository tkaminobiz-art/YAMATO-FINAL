(() => {
 'use strict';
 if(!document.body.hasAttribute('data-washi-motion'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const native=CSS.supports('animation-timeline: view()');
 const figures=document.body.hasAttribute('data-top-depth')?[]:[...document.querySelectorAll('.product__photo')];
 const active=new Set(),animations=new Set(),seen=new WeakSet();
 let frame=0;
 // Progressive enhancement: without this file the complete original image is shown.
 const measure=figure=>{
  const img=figure.querySelector('img');
  if(!img.naturalWidth)return;
  figure.style.setProperty('--depth-overflow',`${Math.max(0,figure.clientWidth*img.naturalHeight/img.naturalWidth-figure.clientHeight)}px`);
 };
 function render(){
  frame=0;if(reduced.matches||document.hidden||native)return;
  const reads=[...active].map(figure=>({figure,rect:figure.getBoundingClientRect(),css:getComputedStyle(figure)}));
  for(const {figure,rect,css} of reads){
   const p=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
   const start=Number(css.getPropertyValue('--depth-start')),end=Number(css.getPropertyValue('--depth-end'));
   const overflow=parseFloat(css.getPropertyValue('--depth-overflow'))||0;
   figure.querySelector('img').style.setProperty('--depth-y',`${-overflow*(start+(end-start)*p)}px`);
   const from=parseFloat(css.getPropertyValue('--float-start'))||0,to=parseFloat(css.getPropertyValue('--float-end'))||0;
   figure.style.transform=`translateY(${from+(to-from)*p}px)`;
  }
 }
 function schedule(){if(!frame&&!native&&!reduced.matches&&!document.hidden&&active.size)frame=requestAnimationFrame(render);}
 const resize=new ResizeObserver(entries=>{entries.forEach(({target})=>measure(target));schedule();});
 const observer=new IntersectionObserver(entries=>{for(const e of entries)e.isIntersecting?active.add(e.target):active.delete(e.target);schedule();},{rootMargin:'50px'});
 figures.forEach(figure=>{figure.dataset.depth='';const img=figure.querySelector('img');img.addEventListener('load',()=>{measure(figure);schedule();});measure(figure);resize.observe(figure);observer.observe(figure);});
 if(!native)addEventListener('scroll',schedule,{passive:true});
 // Animate only after observation, never hide pending content in CSS. Navigation and failed JS stay readable.
 const targets=document.querySelectorAll('.built-proof__copy,.built-proof__photos,.entry-heading,.reason__body,.reason figure,.section-head,.work figure,.voice-heading>div,.nara__grid>div:first-child,.nara__routes,.faq-grid>div:first-child,.social-heading,.news-grid>div:first-child,.visit__body,.visit__grid>figure,.catalog');
 const entrance=new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries){
   if(!isIntersecting||seen.has(target))continue;
   seen.add(target);entrance.unobserve(target);
   if(reduced.matches||document.hidden||typeof target.animate!=='function')continue;
   const animation=target.animate([{opacity:.45,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:680,easing:'cubic-bezier(.22,1,.36,1)',delay:target.matches('.built-proof__photos,.nara__routes')?90:0});
   animations.add(animation);animation.onfinish=()=>animations.delete(animation);animation.oncancel=()=>animations.delete(animation);
  }
 },{threshold:.12});
 targets.forEach(target=>entrance.observe(target));
 function stopAnimations(){for(const a of animations)a.cancel();animations.clear();cancelAnimationFrame(frame);frame=0;}
 reduced.addEventListener('change',()=>{stopAnimations();figures.forEach(figure=>{figure.style.transform='';measure(figure);});schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAnimations();else schedule();});
 addEventListener('pagehide',stopAnimations);addEventListener('pageshow',schedule);
})();
