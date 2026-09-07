/* One logical clock: video.currentTime for chapter 1, paused active-time for still scenes.
   No parallel scene timeout runs while video playback owns the clock. */
(() => {
 'use strict';
 const root=document.querySelector('.new-hero'),video=document.querySelector('#heroVideo');
 const scenes=[...root.querySelectorAll('.new-hero__scene')],stories=[...root.querySelectorAll('.new-hero__story')],chapters=[...root.querySelectorAll('.new-hero__chapter')];
 const play=document.querySelector('#newHeroPlay'),live=document.querySelector('#newHeroLive'),status=document.querySelector('#heroMediaStatus');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:900px)'),query=new URLSearchParams(location.search);
 const noVideo=()=>reduce.matches||navigator.connection?.saveData||query.get('mode')==='still';
 let current=0,auto=!noVideo(),visible=false,elapsed=0,last=0,raf=0,request=0,busy=false,failed=false,mediaStarted=false,videoEnding=false,loadingSince=0,observedVideoTime=0;
 const pending=new Map();
 const runnable=()=>auto&&visible&&!document.hidden&&!reduce.matches&&!busy;
 const prepare=index=>{
  if(pending.has(index))return pending.get(index);
  const img=scenes[index].querySelector('img');img.loading='eager';
  const promise=new Promise(resolve=>{
   let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(limit);img.removeEventListener('load',loaded);img.removeEventListener('error',errored);resolve(ok);};
   const loaded=()=>finish(img.naturalWidth>0),errored=()=>finish(false),limit=setTimeout(errored,8000);
   img.addEventListener('load',loaded);img.addEventListener('error',errored);
   scenes[index].querySelectorAll('source[data-srcset]').forEach(s=>s.srcset=s.dataset.srcset);
   if(img.dataset.src)img.src=img.dataset.src;
   if(img.complete&&img.currentSrc)loaded();
  });pending.set(index,promise);promise.then(ok=>{if(!ok)pending.delete(index);});return promise;
 };
 function updatePlay(){play.disabled=reduce.matches;play.classList.toggle('is-playing',auto);play.setAttribute('aria-pressed',String(auto));play.setAttribute('aria-label',reduce.matches?'動きを減らす設定で静止表示':auto?'映像と自動切替を停止':'映像と自動切替を再生');}
 function paint(index,manual=false){
  current=index;const chapter=Number(scenes[index].dataset.chapter);root.dataset.activeChapter=String(chapter);
  scenes.forEach((s,i)=>s.classList.toggle('is-active',i===index));
  stories.forEach(s=>{const active=+s.dataset.chapter===chapter;s.classList.toggle('is-active',active);s.setAttribute('aria-hidden',String(!active));});
  chapters.forEach(b=>{const active=+b.dataset.chapter===chapter;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));const group=scenes.filter(s=>s.dataset.chapter===b.dataset.chapter);b.querySelector('i').style.width=active?`${(group.indexOf(scenes[index])+1)/group.length*100}%`:(+b.dataset.chapter<chapter?'100%':'0%');});
  document.querySelector('#newHeroCurrent').textContent=String(index+1).padStart(2,'0');document.querySelector('#newHeroCount').setAttribute('aria-label',`場面 ${index+1} / 8`);document.querySelector('#newHeroProgress').style.width=`${(index+1)/8*100}%`;
  if(manual)live.textContent=`場面 ${index+1} / 8。${stories[chapter].querySelector('h2').textContent}`;
 }
 function stop(){auto=false;request++;busy=false;video.pause();last=0;updatePlay();}
 function fallback(reason){if(failed)return;failed=true;video.pause();video.classList.remove('is-visible');mediaStarted=false;videoEnding=false;elapsed=0;status.textContent=reason+'静止画で表示しています。';}
 async function beginVideo(){
  if(mediaStarted||failed||noVideo()||current>1)return;
  // Manual dusk navigation resumes from the final still, never jumps back into daylight.
  if(current===1){videoEnding=true;return;}
  mediaStarted=true;loadingSince=performance.now();observedVideoTime=0;prepare(1);prepare(2);
  video.src=mobile.matches?video.dataset.srcSp:video.dataset.srcPc;video.muted=true;
  try{await video.play();}catch{fallback('動画を自動再生できませんでした。');}
  if(!runnable())video.pause();
 }
 function sync(){
  last=0;loadingSince=performance.now();
  if(!runnable()){video.pause();return;}
  if(current<2&&!noVideo()&&!failed){beginVideo();if(mediaStarted&&!video.ended&&video.paused)video.play().catch(()=>fallback('動画を再生できませんでした。'));}
 }
 async function go(index,manual=true){
  if(manual)stop();index=(index+8)%8;busy=true;video.pause();const token=++request;
  const ok=await prepare(index);if(token!==request)return;busy=false;
  if(!ok){stop();live.textContent='画像を読み込めませんでした。矢印でもう一度お試しください。';return;}
  video.classList.remove('is-visible');elapsed=0;mediaStarted=false;videoEnding=false;paint(index,manual);if(index===7&&auto)stop();sync();
  if(auto&&index<7)prepare(index+1);
 }
 function tick(now){
  raf=requestAnimationFrame(tick);const dt=last?Math.min(now-last,250):0;last=now;if(!runnable())return;
  if(current<2&&!noVideo()&&!failed){
   if(!mediaStarted&&!videoEnding){beginVideo();return;}
   if(videoEnding){elapsed+=dt;if(elapsed>=1200)go(2,false);return;}
   if(video.readyState<2){if(now-loadingSince>8000)fallback('動画の読込みに時間がかかっています。');return;}
   if(video.currentTime>observedVideoTime+0.0001){observedVideoTime=video.currentTime;loadingSince=now;}
   if(now-loadingSince>8000&&!video.ended){fallback('動画の再生が止まったため、');return;}
   if(video.currentTime>0){video.classList.add('is-visible');}
   if(video.currentTime>=6&&current===0)paint(1);
   if(video.ended){videoEnding=true;elapsed=0;}return;
  }
  elapsed+=dt;const duration=current===0?6000:5200;if(elapsed>=duration){if(current===7)stop();else go(current+1,false);}
 }
 video.addEventListener('error',()=>fallback('動画を読み込めませんでした。'));
 video.addEventListener('ended',()=>{videoEnding=true;elapsed=0;});
 document.querySelector('#newHeroNext').addEventListener('click',()=>go(current+1));document.querySelector('#newHeroPrev').addEventListener('click',()=>go(current-1));
 chapters.forEach(b=>b.addEventListener('click',()=>go(scenes.findIndex(s=>s.dataset.chapter===b.dataset.chapter))));
 play.addEventListener('click',()=>{if(auto){stop();return;}auto=true;updatePlay();if(current===7)go(0,false);else sync();});
 root.addEventListener('focusin',e=>{if(e.target!==play)stop();});
 // Hover does not interrupt the hero; deliberate controls and focus/touch still pause it.
 let touch=null;root.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.target.closest('a,button'))return;stop();touch={x:e.clientX,y:e.clientY};},{passive:true});
 root.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)go(current+(dx<0?1:-1));},{passive:true});root.addEventListener('pointercancel',()=>touch=null);
 document.addEventListener('visibilitychange',sync);
 reduce.addEventListener('change',()=>{if(reduce.matches){stop();video.pause();video.removeAttribute('src');video.load();video.classList.remove('is-visible');}updatePlay();});
 mobile.addEventListener('change',()=>{stop();video.removeAttribute('src');video.load();mediaStarted=false;failed=false;video.classList.remove('is-visible');go(current);});
 new IntersectionObserver(entries=>{visible=entries[0].intersectionRatio>.55;sync();},{threshold:[0,.55,1]}).observe(root);
 addEventListener('pagehide',()=>{video.pause();cancelAnimationFrame(raf);request++;});addEventListener('pageshow',()=>{cancelAnimationFrame(raf);last=0;raf=requestAnimationFrame(tick);sync();});
 if(noVideo())status.textContent='静止画モード。矢印で昼・夕方と各場面を確認できます。';
 updatePlay();paint(0);prepare(0);raf=requestAnimationFrame(tick);
})();
