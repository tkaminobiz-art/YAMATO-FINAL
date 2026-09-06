(()=>{
 const section=document.querySelector('[data-built-story]');
 if(!section)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const reveals=[...section.querySelectorAll('[data-story-reveal]')];
 if(!reduced.matches&&'IntersectionObserver'in window){
  document.documentElement.classList.add('built-story-motion');
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}
  },{rootMargin:'0px 0px -8% 0px',threshold:.08});
  reveals.forEach(item=>observer.observe(item));
 }
 const house=section.querySelector('.built-story__house img');
 if(!house||reduced.matches)return;
 let queued=false;
 const render=()=>{
  queued=false;
  const rect=house.parentElement.getBoundingClientRect();
  const progress=(innerHeight/2-(rect.top+rect.height/2))/(innerHeight+rect.height);
  const shift=Math.max(-13,Math.min(13,progress*30));
  house.style.setProperty('--story-shift',`${shift.toFixed(2)}px`);
 };
 const request=()=>{if(!queued){queued=true;requestAnimationFrame(render)}};
 addEventListener('scroll',request,{passive:true});
 addEventListener('resize',request,{passive:true});
 request();
})();
