/* Approved eight-scene hero: staged image loading and finite, optional autoplay. */
(() => {
 'use strict';
 const root=document.querySelector('.new-hero'); if(!root)return;
 const scenes=[...root.querySelectorAll('.new-hero__scene')],stories=[...root.querySelectorAll('.new-hero__story')],chapters=[...root.querySelectorAll('.new-hero__chapter')];
 const play=document.getElementById('newHeroPlay'),live=document.getElementById('newHeroLive'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,timer=0,request=0,visible=false,auto=!reduce.matches;
 const pending=new Map();
 const prepare=index=>{
  if(pending.has(index))return pending.get(index);
  const promise=new Promise(resolve=>{
   const scene=scenes[index],img=scene.querySelector('img'); let done=false;
   const finish=ok=>{if(done)return;done=true;clearTimeout(limit);img.removeEventListener('load',loaded);img.removeEventListener('error',failed);resolve(ok);};
   const loaded=()=>finish(img.naturalWidth>0),failed=()=>finish(false),limit=setTimeout(failed,8000);
   img.addEventListener('load',loaded);img.addEventListener('error',failed);
   if(img.complete&&!img.naturalWidth&&img.hasAttribute('src')){img.removeAttribute('src');scene.querySelectorAll('source').forEach(source=>source.removeAttribute('srcset'));}
   scene.querySelectorAll('source[data-srcset]').forEach(source=>{source.srcset=source.dataset.srcset;});
   if(img.dataset.src){img.loading='eager';img.src=img.dataset.src;}
   if(img.complete&&img.currentSrc)loaded();
  });pending.set(index,promise);promise.then(ok=>{if(!ok)pending.delete(index);});return promise;
 };
 const updatePlay=()=>{play.disabled=reduce.matches;play.classList.toggle('is-playing',auto);play.setAttribute('aria-label',reduce.matches?'動きを減らす設定で静止表示':auto?'自動切替を停止':'自動切替を再生');play.setAttribute('aria-pressed',String(auto));};
 const stop=()=>{auto=false;clearTimeout(timer);updatePlay();};
 const schedule=()=>{clearTimeout(timer);if(auto&&visible&&!document.hidden&&!reduce.matches){if(current===scenes.length-1){stop();return;}timer=setTimeout(()=>go(current+1,false),current===0?6000:5200);}};
 function render(index,manual=false){
  current=index;const chapter=Number(scenes[index].dataset.chapter);
  scenes.forEach((scene,i)=>scene.classList.toggle('is-active',i===index));
  stories.forEach(s=>{const active=Number(s.dataset.chapter)===chapter;s.classList.toggle('is-active',active);s.setAttribute('aria-hidden',String(!active));});
  chapters.forEach(button=>{const active=Number(button.dataset.chapter)===chapter;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));const group=scenes.filter(s=>s.dataset.chapter===button.dataset.chapter),progress=group.indexOf(scenes[index]);button.querySelector('i').style.width=active?`${(progress+1)/group.length*100}%`:(Number(button.dataset.chapter)<chapter?'100%':'0%');});
  document.getElementById('newHeroCurrent').textContent=String(index+1).padStart(2,'0');document.getElementById('newHeroCount').setAttribute('aria-label',`写真 ${index+1} / ${scenes.length}`);document.getElementById('newHeroProgress').style.width=`${(index+1)/scenes.length*100}%`;
  if(manual)live.textContent=`写真 ${index+1} / ${scenes.length}。${stories[chapter].querySelector('h2').textContent}`;
  schedule();if(auto&&visible&&index<scenes.length-1)prepare(index+1);
 }
 async function go(index,manual=true){
  if(manual)stop();clearTimeout(timer);index=(index+scenes.length)%scenes.length;const token=++request;
  const ok=await prepare(index);if(token!==request)return;
  if(ok){render(index,manual);}else{stop();live.textContent='写真を読み込めませんでした。もう一度、矢印でお試しください。';}
 }
 document.getElementById('newHeroNext').addEventListener('click',()=>go(current+1));document.getElementById('newHeroPrev').addEventListener('click',()=>go(current-1));
 chapters.forEach(button=>button.addEventListener('click',()=>go(scenes.findIndex(s=>s.dataset.chapter===button.dataset.chapter))));
 play.addEventListener('click',()=>{if(auto){stop();return;}auto=true;updatePlay();if(current===scenes.length-1)go(0,false);else{schedule();prepare(current+1);}});
 let start=null;
 root.addEventListener('pointerdown',e=>{if(e.target.closest('button,a')||e.pointerType==='mouse')return;start={x:e.clientX,y:e.clientY};},{passive:true});
 root.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)go(current+(dx<0?1:-1));},{passive:true});
 root.addEventListener('pointercancel',()=>{start=null;});
 root.addEventListener('focusin',e=>{if(e.target!==play)stop();});
 document.addEventListener('visibilitychange',schedule);
 reduce.addEventListener('change',()=>{if(reduce.matches)stop();updatePlay();});
 new IntersectionObserver(entries=>{visible=entries[0].intersectionRatio>.55;if(visible&&auto)prepare(Math.min(current+1,scenes.length-1));schedule();},{threshold:[0,.55,1]}).observe(root);
 addEventListener('pagehide',()=>{clearTimeout(timer);request++;});
 addEventListener('pageshow',()=>schedule());updatePlay();render(0);
})();
