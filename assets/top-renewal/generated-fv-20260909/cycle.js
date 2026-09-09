/* Existing 18-second media, adapted to a full-width responsive composition. */
(() => {
 'use strict';
 const header=document.querySelector('.site-header');
 const onScroll=()=>header?.classList.toggle('is-scrolled',scrollY>8);
 onScroll();addEventListener('scroll',onScroll,{passive:true});
 const menu=document.getElementById('siteMenu'),toggle=document.getElementById('menuToggle');
 // The shared menu owns open/close and inert state; keep keyboard focus within it.
 document.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!menu||menu.hidden||!toggle||document.querySelector('dialog[open]'))return;
  const nodes=[toggle,...menu.querySelectorAll('a[href]')].filter(node=>node.getClientRects().length);
  const current=nodes.indexOf(document.activeElement),next=current<0?0:(current+(event.shiftKey?-1:1)+nodes.length)%nodes.length;
  event.preventDefault();event.stopImmediatePropagation();nodes[next]?.focus();
 },true);
 const hero=document.querySelector('.gf-hero'),stage=hero?.querySelector('.gf-stage');
 const video=document.getElementById('cycleVideo'),status=document.getElementById('heroStatus');
 const stills=[...document.querySelectorAll('.gf-still')];
 if(!hero||!stage||!video||!status)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),portrait=matchMedia('(max-width:767px)');
 const query=new URLSearchParams(location.search),fixed=query.get('mode')==='still';
 const stillOnly=()=>reduced.matches||navigator.connection?.saveData===true||fixed;
 let desired=!stillOnly(),visible=false,failed=false,ticket=0,stillTicket=0,stallTimer=0,phase='morning',pendingSeek=null;
 let changingSource=false,sourceRequest=0,needsBlobTransport=false;
 const blobSources=new Map();
 const requestedFrame=query.get('frame');
 if(fixed&&['morning','evening','night'].includes(requestedFrame))phase=requestedFrame;
 const say=text=>{if(status.textContent!==text)status.textContent=text;};
 const source=()=>portrait.matches?video.dataset.srcSp:video.dataset.srcPc;
 function setPhase(next){phase=next;hero.dataset.phase=next;}
 function showStill(next){
  setPhase(next);
  const request=++stillTicket,picture=stills.find(node=>node.dataset.still===next),img=picture.querySelector('img');
  picture.querySelectorAll('[data-srcset]').forEach(node=>{if(!node.srcset)node.srcset=node.dataset.srcset;});
  if(img.dataset.src&&!img.getAttribute('src'))img.src=img.dataset.src;
  const reveal=()=>{
   if(request!==stillTicket)return;
   stills.forEach(node=>{const selected=node===picture;node.classList.toggle('cycle-visible',selected);node.setAttribute('aria-hidden',String(!selected));});
   video.classList.remove('is-on');hero.dataset.playback=failed?'fallback':'still';
  };
  img.decode().then(reveal).catch(()=>{if(request===stillTicket)say('画像を読み込めないため、直前の外観を表示しています。');});
 }
 function pause(){ticket++;clearTimeout(stallTimer);video.pause();if(video.getAttribute('src'))hero.dataset.playback='paused';}
 function fallback(message){sourceRequest++;changingSource=false;pendingSeek=null;failed=true;desired=false;pause();video.classList.remove('is-on');video.removeAttribute('src');video.load();showStill(phase);say(message);}
 function armStall(){clearTimeout(stallTimer);stallTimer=setTimeout(()=>{if(desired&&visible&&!document.hidden)fallback('映像を読み込めないため、静止画で表示しています。');},12000);}
 function restorePosition(){
  // A superseded source can finish loading while the next source is being prepared.
  // Keep the saved time until the resource for the current viewport has metadata.
  if(pendingSeek===null||changingSource||video.readyState<1||video.dataset.activeSource!==source())return;
  video.currentTime=Math.min(pendingSeek,Math.max(0,video.duration-.05));pendingSeek=null;
 }
 function play(){
  if(!desired||!visible||document.hidden||failed||stillOnly()||changingSource)return;
  const request=++ticket;
  if(!video.getAttribute('src')){video.src=source();video.dataset.activeSource=source();video.dataset.transport='direct';video.muted=true;video.loop=true;}
  // Source assignment may still expose the previous metadata in this task.
  // Seek only on the new resource's loadedmetadata event.
  armStall();
  video.play().then(()=>{
   if(request!==ticket)return;
   stillTicket++;video.classList.add('is-on');hero.dataset.playback='playing';
   say('朝から夕方、夜、朝へ移り変わる映像を再生しています。');
  }).catch(()=>{if(request===ticket)fallback('映像を再生できないため、静止画で表示しています。');});
 }
 video.addEventListener('timeupdate',()=>{if(!video.paused){setPhase(video.currentTime<6?'morning':video.currentTime<12?'evening':'night');armStall();}});
 video.addEventListener('loadedmetadata',restorePosition);
 video.addEventListener('error',()=>{if(!failed&&video.getAttribute('src'))fallback('映像を読み込めないため、静止画で表示しています。');});
 const observer=new IntersectionObserver(entries=>{visible=entries[0].intersectionRatio>=.25;if(visible)play();else pause();},{threshold:[0,.25,1]});
 observer.observe(stage);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else play();});
 // Some local preview servers return the whole MP4 without HTTP range support.
 // On resize only, cache the same bytes as a Blob to make the target seekable.
 // Normal first playback remains streamed; there is no transcoding or video regeneration.
 async function resizeSource(){
  if(!video.getAttribute('src')&&!changingSource)return;
  const next=source();
  if(next===video.dataset.activeSource&&!changingSource)return;
  pendingSeek=pendingSeek??video.currentTime;
  // A loading resource has no seekable range yet; that is not evidence that the server lacks ranges.
  if(video.readyState>=3&&!video.seeking&&!changingSource&&video.currentTime>0)needsBlobTransport=needsBlobTransport||!video.seekable.length||video.seekable.end(video.seekable.length-1)<pendingSeek;
  const request=++sourceRequest;
  changingSource=true;pause();showStill(phase);
  try{
   let nextURL=next;
   if(needsBlobTransport&&pendingSeek>0){
    if(!blobSources.has(next)){
     const promise=fetch(next,{credentials:'same-origin'}).then(response=>{if(!response.ok)throw Error('media');return response.blob();}).then(blob=>URL.createObjectURL(blob));
     blobSources.set(next,promise);
    }
    nextURL=await blobSources.get(next);
   }
   if(request!==sourceRequest)return;
   video.dataset.activeSource=next;video.dataset.transport=nextURL===next?'direct':'blob-for-seek';
   video.src=nextURL;changingSource=false;play();
  }catch{if(request===sourceRequest)fallback('映像を読み込めないため、静止画で表示しています。');}
 }
 portrait.addEventListener('change',resizeSource);
 function honorPreference(){
  desired=!stillOnly()&&!failed;
  if(!desired){sourceRequest++;changingSource=false;pendingSeek=null;pause();video.classList.remove('is-on');video.removeAttribute('src');video.load();showStill(phase);say('動きを抑える設定のため、静止画で表示しています。');}
  else play();
 }
 reduced.addEventListener('change',honorPreference);navigator.connection?.addEventListener?.('change',honorPreference);
 addEventListener('pagehide',pause);
 addEventListener('pageshow',event=>{if(event.persisted){desired=!stillOnly()&&!failed;play();}});
 showStill(phase);
})();
