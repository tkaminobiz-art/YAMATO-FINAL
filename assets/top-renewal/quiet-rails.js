(() => {
 'use strict';
 if(!document.body.hasAttribute('data-quiet-rails'))return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 for(const [railId,toggleId,prevId,nextId,countId] of [['entryCards','cardMotion','entryPrev','entryNext','entryCount'],['voiceRail','voiceMotion','voicePrev','voiceNext','voiceCount']]){
  const rail=document.getElementById(railId),toggle=document.getElementById(toggleId),prev=document.getElementById(prevId),next=document.getElementById(nextId),counter=document.getElementById(countId);
  if(!rail||!toggle)continue;
  const originals=[...rail.children];let paused=reduce.matches,visible=false,frame=0,last=0,position=0,cycle=0;
  // Decorative repeat has no duplicate IDs or sequential keyboard stops. Its links retain native destinations.
  const copies=originals.map(card=>{const clone=card.cloneNode(true);clone.dataset.railClone='';clone.setAttribute('aria-hidden','true');[clone,...clone.querySelectorAll('[id]')].forEach(n=>n.removeAttribute('id'));[clone,...clone.querySelectorAll('a,button,[tabindex]')].forEach(n=>n.setAttribute('tabindex','-1'));rail.append(clone);return clone;});
  function measure(){cycle=copies[0].offsetLeft-originals[0].offsetLeft;position=rail.scrollLeft;update();}
  function update(){const step=cycle/originals.length;if(step>0)counter.textContent=`${String(Math.floor((rail.scrollLeft+step*.25)/step)%originals.length+1).padStart(2,'0')} / ${String(originals.length).padStart(2,'0')}`;}
  function label(){toggle.disabled=reduce.matches;toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=reduce.matches?'動きを減らす設定で表示中':paused?'自動スクロールを再開':'自動スクロールを停止';rail.dataset.motion=paused?'paused':visible&&!document.hidden?'running':'idle';}
  const pixelsPerMs=document.body.hasAttribute('data-washi-motion')?.018:.012;
  function tick(time){if(paused||!visible||document.hidden||reduce.matches||cycle<=0){last=0;return;}if(last){position=(position+Math.min(time-last,50)*pixelsPerMs)%cycle;rail.scrollLeft=position;update();}last=time;frame=requestAnimationFrame(tick);}
  function schedule(){cancelAnimationFrame(frame);last=0;position=rail.scrollLeft;label();if(!paused&&visible&&!document.hidden&&!reduce.matches)frame=requestAnimationFrame(tick);}
  function stop(){paused=true;schedule();}
  toggle.addEventListener('click',()=>{paused=!paused;schedule();});
  rail.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')stop();});
  rail.addEventListener('pointerdown',stop,{passive:true});
  rail.addEventListener('wheel',stop,{passive:true});
  rail.addEventListener('focusin',stop);
  // Do not move the reader's pointer focus into the aria-hidden repeat.
  rail.addEventListener('mousedown',e=>{if(e.target.closest('[data-rail-clone]'))e.preventDefault();});
  function move(direction){stop();const step=cycle/originals.length;if(!step)return;let target=(Math.floor((rail.scrollLeft+step*.25)/step)+direction)*step;if(target<0)target=cycle-step;if(target>rail.scrollWidth-rail.clientWidth)target%=cycle;rail.scrollTo({left:target,behavior:reduce.matches?'instant':'smooth'});}
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  rail.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
  rail.addEventListener('scroll',update,{passive:true});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.2}).observe(rail);
  new ResizeObserver(measure).observe(rail);
  document.addEventListener('visibilitychange',schedule);
  reduce.addEventListener('change',()=>{paused=true;schedule();});
  addEventListener('pagehide',()=>cancelAnimationFrame(frame));addEventListener('pageshow',schedule);
  measure();schedule();
 }
})();
