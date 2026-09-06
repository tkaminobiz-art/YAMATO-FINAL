/* Preview interactions. No analytics, personal-data persistence or live submissions. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),reduce=matchMedia('(prefers-reduced-motion: reduce)'),artMode=document.body.classList.contains('art-preview');
 const menu=$('siteMenu'),toggle=$('menuToggle');
 const menuBackground=[document.querySelector('main'),document.querySelector('.site-footer'),document.querySelector('.preview-note')];
 function setMenu(open){menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');document.body.classList.toggle('menu-lock',open);menuBackground.forEach(node=>{if(node)node.inert=open;});if(open)menu.querySelector('a')?.focus();else toggle.focus({preventScroll:true});}
 toggle.addEventListener('click',()=>setMenu(menu.hidden));
 menu.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
 document.addEventListener('keydown',e=>{
  if(menu.hidden)return;
  if(e.key==='Escape'){e.preventDefault();setMenu(false);}
  if(e.key==='Tab'){const nodes=[toggle,...menu.querySelectorAll('a')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 document.querySelectorAll('[data-expand]').forEach(button=>button.addEventListener('click',()=>{const target=$(button.dataset.expand),open=button.getAttribute('aria-expanded')!=='true';target.hidden=!open;button.setAttribute('aria-expanded',String(open));button.textContent=open?button.dataset.open:button.dataset.closed;if(!open)button.scrollIntoView({block:'nearest',behavior:'instant'});}));
 let returnFocus=null;
 function openDialog(dialog,trigger){returnFocus=trigger||document.activeElement;if(!menu.hidden)setMenu(false);dialog.showModal();document.body.classList.add('menu-lock');}
 document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const nodes=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]')].filter(node=>node.getClientRects().length);if(!nodes.length){e.preventDefault();return;}const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('menu-lock');returnFocus?.focus({preventScroll:true});});
 });
 document.querySelectorAll('[data-contact]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();$('contactTitle').textContent=link.dataset.contact==='docs'?'資料請求のご案内':'来場予約のご案内';openDialog($('contactDialog'),link);}));
 document.querySelectorAll('[data-dialog]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();openDialog($(link.dataset.dialog),link);}));

 // An optional comparison mode. Originals alone remain in the accessibility tree.
 if(!document.body.hasAttribute('data-quiet-rails')){
 const rail=$('entryCards'),motion=$('cardMotion');let moving=false,visible=false,frame=0,previous=0,hovered=false;
 const originals=[...rail.children];
 function removeClones(){rail.querySelectorAll('[data-clone]').forEach(x=>x.remove());}
 function resetCards(){moving=false;cancelAnimationFrame(frame);previous=0;removeClones();rail.classList.remove('is-motion');rail.scrollLeft=0;motion.setAttribute('aria-pressed','false');motion.textContent='動くカードを試す';}
 function animate(time){if(!moving||!visible||hovered||document.hidden||reduce.matches){previous=0;return;}if(previous){rail.scrollLeft+=(time-previous)*.012;const clone=rail.querySelector('[data-clone]');if(clone){const length=clone.offsetLeft-originals[0].offsetLeft;if(length>0&&rail.scrollLeft>=length)rail.scrollLeft-=length;}}previous=time;frame=requestAnimationFrame(animate);}
 function resumeCards(){cancelAnimationFrame(frame);previous=0;if(moving&&visible&&!hovered&&!document.hidden&&!reduce.matches)frame=requestAnimationFrame(animate);}
 function startCards(){if(reduce.matches)return;rail.classList.add('is-motion');moving=true;originals.forEach(card=>{const clone=card.cloneNode(true);clone.dataset.clone='true';clone.setAttribute('aria-hidden','true');clone.inert=true;clone.querySelectorAll('a,button').forEach(x=>x.tabIndex=-1);clone.removeAttribute('id');rail.append(clone);});motion.setAttribute('aria-pressed','true');motion.textContent='停止して一覧で見る';resumeCards();}
 motion.addEventListener('click',()=>moving?resetCards():startCards());
 rail.addEventListener('pointerenter',()=>{hovered=true;resumeCards();});rail.addEventListener('pointerleave',()=>{hovered=false;resumeCards();});
 rail.addEventListener('focusin',()=>{hovered=true;resumeCards();});rail.addEventListener('focusout',()=>{hovered=false;resumeCards();});
 rail.addEventListener('pointerdown',()=>{if(moving){hovered=true;resumeCards();}},{passive:true});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resumeCards();},{threshold:.05}).observe(rail);
 document.addEventListener('visibilitychange',resumeCards);
 function syncReduced(){if(reduce.matches){resetCards();motion.disabled=true;motion.textContent='動きを減らす設定で表示中';}else{motion.disabled=false;motion.textContent='動くカードを試す';}}
 reduce.addEventListener('change',syncReduced);syncReduced();
 if(new URL(location.href).searchParams.get('cards')==='motion')startCards();
 addEventListener('pagehide',()=>{cancelAnimationFrame(frame);previous=0;});addEventListener('pageshow',resumeCards);
 }

 // The browser receives public display fields only, never an Instagram credential.
 const gallery=$('igGallery'),igDialog=$('igDialog'),media=$('igDialogMedia'),caption=$('igDialogCaption'),dialogTitle=$('igDialogTitle'),dialogLink=$('igDialogLink');
 let posts=[],postIndex=0,photoIndex=0,loading=false,requestController=null;
 const safeText=value=>typeof value==='string'?value:'';
 const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(u.hostname)?u.href:null;}catch{return null;}};
 const postURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&['www.instagram.com','instagram.com'].includes(u.hostname)&&/^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)?`https://www.instagram.com${u.pathname}`:null;}catch{return null;}};
 const dateText=value=>Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(value)):'';
 const node=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!=null)n.textContent=text;return n;};
 function photosOf(post){return post.children?.length?post.children:[{image:post.image,media_type:post.media_type}];}
 function renderPhoto(){
  const post=posts[postIndex],photos=photosOf(post),photo=photos[photoIndex];if(!photo)return;
  const img=new Image();img.alt=`やまと不動産のInstagram投稿${photos.length>1?`（${photoIndex+1}枚目）`:''}`;img.referrerPolicy='no-referrer';img.src=photo.image;
  img.addEventListener('error',()=>{if(img.isConnected)media.replaceChildren(node('p','note','画像を読み込めませんでした。下のリンクから元の投稿をご覧ください。'));},{once:true});media.replaceChildren(img);
  if(photo.media_type==='VIDEO')media.append(node('span','ig-video-label','動画のプレビュー'));
  $('igPhotoNav').hidden=photos.length<2;$('igPhotoCount').textContent=`${photoIndex+1} / ${photos.length}`;$('igPhotoPrev').disabled=photoIndex===0;$('igPhotoNext').disabled=photoIndex===photos.length-1;
  dialogLink.textContent=photo.media_type==='VIDEO'?'Instagramで動画を見る':'Instagramでこの投稿を見る';
 }
 function renderPost(){
  const post=posts[postIndex];if(!post)return;photoIndex=0;dialogTitle.textContent='@yamatonoie';caption.textContent=post.caption||'投稿の詳しい内容はInstagramでご覧ください。';dialogLink.href=post.permalink;
  $('igDialogDate').textContent=dateText(post.timestamp);$('igDialogDate').dateTime=post.timestamp||'';$('igPostCount').textContent=`投稿 ${String(postIndex+1).padStart(2,'0')} / ${String(posts.length).padStart(2,'0')}`;
  $('igPostPrev').disabled=postIndex===0;$('igPostNext').disabled=postIndex===posts.length-1;renderPhoto();
 }
 function showPost(index,trigger){postIndex=index;renderPost();openDialog(igDialog,trigger);}
 function railIndex(){const cards=[...gallery.querySelectorAll('.ig-post')];if(!cards.length)return 0;const start=gallery.getBoundingClientRect().left;return cards.reduce((best,card,i)=>Math.abs(card.getBoundingClientRect().left-start)<Math.abs(cards[best].getBoundingClientRect().left-start)?i:best,0);}
 function railState(){if(!posts.length)return;const first=gallery.querySelector('.ig-post'),step=first.getBoundingClientRect().width+parseFloat(getComputedStyle(gallery).gap||0),index=artMode?railIndex():Math.min(posts.length-1,Math.max(0,Math.round(gallery.scrollLeft/step)));$('igRailCount').textContent=`${String(index+1).padStart(2,'0')} / ${String(posts.length).padStart(2,'0')}`;$('igPrev').disabled=gallery.scrollLeft<2;$('igNext').disabled=gallery.scrollLeft>=gallery.scrollWidth-gallery.clientWidth-2;}
 function mount(payload){
  const items=Array.isArray(payload?.posts)?payload.posts:[];
  const seen=new Set();posts=items.filter(p=>p&&typeof p==='object'&&!Array.isArray(p)).map(p=>({id:safeText(p.id),media_type:safeText(p.media_type),caption:safeText(p.caption).slice(0,2200),timestamp:safeText(p.timestamp),permalink:postURL(p.permalink),image:https(p.media_type==='VIDEO'?p.thumbnail_url:p.media_url),children:(Array.isArray(p.children)?p.children:[]).filter(c=>c&&typeof c==='object').map(c=>({image:https(c.media_type==='VIDEO'?c.thumbnail_url:c.media_url),media_type:safeText(c.media_type)})).filter(c=>c.image).slice(0,20)})).filter(p=>{if(!p.permalink||!p.image||seen.has(p.id))return false;seen.add(p.id);return true;}).sort((a,b)=>(Date.parse(b.timestamp)||0)-(Date.parse(a.timestamp)||0)).slice(0,10);
  if(igDialog.open)igDialog.close();gallery.replaceChildren();
  if(!posts.length){gallery.hidden=true;$('igControls').hidden=true;$('igEmpty').hidden=false;$('igPreview').hidden=false;$('igPreview').textContent='もう一度読み込む';$('igEmpty').querySelector('.instagram__intro p').textContent='投稿を表示できませんでした。公式アカウントからご覧いただけます。';$('igStatus').textContent='投稿の取得を確認できません。';return {displayed:0};}
  posts.forEach((post,index)=>{const button=node('button','ig-post');button.type='button';button.setAttribute('aria-label',`${dateText(post.timestamp)}の投稿を開く${post.media_type==='VIDEO'?'（動画）':''}`);
   const frame=node('span','ig-post__frame'),img=new Image();if(artMode){button.style.setProperty('--media-ratio',post.media_type==='VIDEO'?'0.5625':'0.8');img.addEventListener('load',()=>{if(!button.isConnected||!img.naturalWidth)return;button.style.setProperty('--media-ratio',String(img.naturalWidth/img.naturalHeight));railState();},{once:true});}img.src=post.image;img.alt='';img.loading='lazy';img.width=600;img.height=750;img.referrerPolicy='no-referrer';img.addEventListener('error',()=>{if(!img.isConnected)return;frame.replaceChildren(node('span','note','画像を表示できません。投稿を開いて確認'));},{once:true});frame.append(img);
   const hint=node('span','ig-post__open','投稿を開く ↗');hint.setAttribute('aria-hidden','true');frame.append(hint);button.append(frame);
   if(post.media_type==='VIDEO'||post.media_type==='CAROUSEL_ALBUM'){const kind=node('span','ig-kind',post.media_type==='VIDEO'?'▷':'▣');kind.setAttribute('aria-hidden','true');frame.append(kind);}
   const footer=node('span','ig-post__footer');footer.append(node('time','',dateText(post.timestamp)),node('span','',post.media_type==='VIDEO'?'REEL':post.media_type==='CAROUSEL_ALBUM'?'PHOTOS':'PHOTO'));button.append(footer);button.addEventListener('click',()=>showPost(index,button));gallery.append(button);});
  $('igEmpty').hidden=true;gallery.hidden=false;$('igControls').hidden=false;$('igStatus').textContent=`最新の${posts.length}投稿。写真を選ぶと、投稿の画像と説明を開きます。`;$('igPreview').hidden=true;gallery.scrollLeft=0;railState();return{displayed:posts.length};
 }
 function moveRail(direction){const cards=[...gallery.querySelectorAll('.ig-post')],card=cards[0];if(!card)return;if(artMode){const target=cards[Math.max(0,Math.min(cards.length-1,railIndex()+direction))];gallery.scrollBy({left:target.getBoundingClientRect().left-gallery.getBoundingClientRect().left,behavior:reduce.matches?'instant':'smooth'});}else gallery.scrollBy({left:direction*(card.getBoundingClientRect().width+parseFloat(getComputedStyle(gallery).gap||0)),behavior:reduce.matches?'instant':'smooth'});}
 if(artMode)gallery.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();moveRail(event.key==='ArrowRight'?1:-1);}});
 $('igPrev').addEventListener('click',()=>moveRail(-1));$('igNext').addEventListener('click',()=>moveRail(1));gallery.addEventListener('scroll',railState,{passive:true});new ResizeObserver(railState).observe(gallery);
 $('igPostPrev').addEventListener('click',()=>{if(postIndex>0){postIndex--;renderPost();}});$('igPostNext').addEventListener('click',()=>{if(postIndex<posts.length-1){postIndex++;renderPost();}});
 $('igPhotoPrev').addEventListener('click',()=>{if(photoIndex>0){photoIndex--;renderPhoto();}});$('igPhotoNext').addEventListener('click',()=>{if(photoIndex<photosOf(posts[postIndex]).length-1){photoIndex++;renderPhoto();}});
 igDialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'&&postIndex<posts.length-1){event.preventDefault();postIndex++;renderPost();}else if(event.key==='ArrowLeft'&&postIndex>0){event.preventDefault();postIndex--;renderPost();}});
 async function loadInstagram(){
  if(loading)return;loading=true;requestController=new AbortController();const timer=setTimeout(()=>requestController.abort(),27000);$('igPreview').disabled=true;$('igStatus').textContent='公式投稿を読み込んでいます。';gallery.setAttribute('aria-busy','true');
  // Same-origin cookies preserve preview access protection; the Instagram token stays server-only.
  try{const response=await fetch('/api/instagram',{signal:requestController.signal,credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)throw Error('unavailable');const result=await response.json();if(result.account?.username!=='yamatonoie')throw Error('account');mount(result);}
  catch{mount({posts:[]});}finally{clearTimeout(timer);loading=false;$('igPreview').disabled=false;gallery.removeAttribute('aria-busy');}
 }
 $('igPreview').addEventListener('click',loadInstagram);
 const igObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){igObserver.disconnect();loadInstagram();}},{rootMargin:'300px'});igObserver.observe($('instagram'));
 addEventListener('pagehide',()=>requestController?.abort());
 window.YamatoGallery=Object.freeze({mount});
})();
