/* Only loaded by the photo-led preview. The shared API/dialog contracts remain intact. */
(() => {
 'use strict';
 if(document.body.hasAttribute('data-quiet-rails'))return;
 const rail=document.getElementById('entryCards'),prev=document.getElementById('entryPrev'),next=document.getElementById('entryNext'),count=document.getElementById('entryCount'),motion=document.getElementById('cardMotion');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const cards=()=>[...rail.children].filter(el=>!el.hasAttribute('data-clone'));
 const index=()=>{const items=cards(),left=rail.getBoundingClientRect().left;return items.reduce((best,card,i)=>Math.abs(card.getBoundingClientRect().left-left)<Math.abs(items[best].getBoundingClientRect().left-left)?i:best,0);};
 function update(){const items=cards();count.textContent=String(index()+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');prev.disabled=rail.scrollLeft<2;next.disabled=rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-2;}
 function stopMotion(){if(motion.getAttribute('aria-pressed')!=='true')return;const left=rail.scrollLeft;motion.click();rail.scrollLeft=Math.min(left,rail.scrollWidth-rail.clientWidth);}
 function move(direction){stopMotion();const items=cards(),target=items[Math.max(0,Math.min(items.length-1,index()+direction))];rail.scrollBy({left:target.getBoundingClientRect().left-rail.getBoundingClientRect().left,behavior:reduced.matches?'instant':'smooth'});}
 rail.addEventListener('pointerdown',stopMotion,{capture:true,passive:true});
 rail.addEventListener('focusin',stopMotion);
 rail.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
 prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 rail.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(rail);update();
})();
