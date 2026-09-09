/* The adopted Instagram view uses only the existing server's public display fields.
   Signed media URLs stay in browser memory; captions always enter through textContent. */
(() => {
 'use strict';
 const TYPES=new Set(['IMAGE','VIDEO','CAROUSEL_ALBUM']);
 const text=value=>typeof value==='string'?value:'';
 const mediaURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(u.hostname)?u.href:null;}catch{return null;}};
 const postURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&['instagram.com','www.instagram.com'].includes(u.hostname)&&/^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)?`https://www.instagram.com${u.pathname}`:null;}catch{return null;}};
 const dateFormat=new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tokyo'});
 const date=value=>dateFormat.format(new Date(value));
 const kind=post=>post.media_type==='VIDEO'?'REEL':post.media_type==='CAROUSEL_ALBUM'?'PHOTOS':'PHOTO';
 const node=(tag,className,value)=>{const e=document.createElement(tag);if(className)e.className=className;if(value!=null)e.textContent=value;return e;};
 function normalize(payload){
  if(payload?.account?.username!=='yamatonoie'||!Array.isArray(payload.posts)||payload.error)throw Error('Invalid public feed');
  const seen=new Set(),posts=[];
  for(const raw of payload.posts){
   if(!raw||typeof raw!=='object'||!/^\d{1,40}$/.test(text(raw.id))||seen.has(raw.id)||!TYPES.has(raw.media_type)||!Number.isFinite(Date.parse(raw.timestamp)))continue;
   const image=mediaURL(raw.media_type==='VIDEO'?raw.thumbnail_url:raw.media_url),permalink=postURL(raw.permalink);
   if(!image||!permalink)continue;
   const children=raw.media_type==='CAROUSEL_ALBUM'?(Array.isArray(raw.children)?raw.children:[]).filter(c=>c&&['IMAGE','VIDEO'].includes(c.media_type)).map(c=>({media_type:c.media_type,image:mediaURL(c.media_type==='VIDEO'?c.thumbnail_url:c.media_url)})).filter(c=>c.image).slice(0,20):[];
   seen.add(raw.id);posts.push({id:raw.id,media_type:raw.media_type,image,permalink,caption:text(raw.caption).slice(0,2200),timestamp:new Date(raw.timestamp).toISOString(),children});
  }
  if(payload.posts.length&&!posts.length)throw Error('No valid public post');
  return posts.sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).slice(0,10);
 }
 function init({openDialog}){
  const $=id=>document.getElementById(id),root=$('instagram');if(!root||root.dataset.igInitialized)return;root.dataset.igInitialized='true';
  const layout=$('igBLayout'),empty=$('igBEmpty'),status=$('igBStatus'),retry=$('igBRetry'),dialog=$('igDialog');
  let posts=[],selected=0,photoIndex=0,loading=false,controller=null,requestEpoch=0,swipe=null,suppressClick=false;
  const photosOf=post=>post.children.length?post.children:[{image:post.image,media_type:post.media_type}];
  function imageInto(container,url,alt,{lazy=false}={}){
   const img=new Image();img.alt=alt;img.referrerPolicy='no-referrer';img.decoding='async';if(lazy)img.loading='lazy';
   img.addEventListener('error',()=>{if(img.isConnected)container.replaceChildren(node('span','igb__image-error','画像を読み込めませんでした。'));},{once:true});
   container.replaceChildren(img);img.src=url;
  }
  function setState(state){
   root.dataset.state=state;layout.hidden=state!=='ready';empty.hidden=state==='ready';retry.hidden=state==='ready'||state==='loading';
   layout.setAttribute('aria-busy',String(state==='loading'));
   const messages={loading:'公式投稿を読み込んでいます。',empty:'現在、表示できる投稿はありません。',error:'投稿を読み込めませんでした。時間をおいて、もう一度お試しください。'};
   if(messages[state]){$('igBEmptyText').textContent=messages[state];status.textContent=state==='loading'?messages[state]:'公式アカウントからも投稿をご覧いただけます。';}
  }
  function excerpt(caption){
   const full=caption.trim();if(!full)return {lead:'',body:'この投稿には本文がありません。'};
   const first=full.split('\n')[0].trim(),chars=Array.from(first);
   let lead=chars.slice(0,64).join('');
   const rest=full.slice(lead.length).trim();
   if(chars.length<=64){const decorated=/^＼\s*(.*?)\s*／$/.exec(lead);if(decorated)lead=decorated[1];}
   const paragraph=rest.split(/\n\s*\n/)[0],bodyChars=Array.from(paragraph);
   const body=bodyChars.slice(0,140).join('')+(bodyChars.length>140?'…':'');
   return {lead,body};
  }
  function renderLead(value){
   const heading=$('igBLead');
   const words=value.split(/(家づくり|モデルハウス|ルームツアー|やまと不動産)/);
   heading.replaceChildren(...words.map((word,i)=>i%2?node('span','igb__phrase',word):document.createTextNode(word)));
   heading.hidden=!value;
  }
  function renderSelected(){
   const post=posts[selected];if(!post)return;layout.dataset.postId=post.id;
   $('igBCount').textContent=`${String(selected+1).padStart(2,'0')} / ${String(posts.length).padStart(2,'0')}`;
   $('igBDate').textContent=date(post.timestamp);$('igBDate').dateTime=post.timestamp;$('igBKind').textContent=kind(post);
   imageInto($('igBCover'),post.image,`${date(post.timestamp)}の公式Instagram投稿（${kind(post)}）`);
   $('igBHero').setAttribute('aria-label',`${date(post.timestamp)}の投稿の画像と本文を開く`);
   const copy=excerpt(post.caption);renderLead(copy.lead);$('igBExcerpt').textContent=copy.body;$('igBExcerpt').hidden=!copy.body;
   const official=$('igBOfficial');official.href=post.permalink;official.textContent=(post.media_type==='VIDEO'?'公式で動画を見る':'公式で投稿を見る')+' ↗';
   $('igBNav').hidden=posts.length<2;$('igBPrev').disabled=selected===0;$('igBNext').disabled=selected===posts.length-1;
   const others=posts.map((p,i)=>({post:p,index:i})).filter(p=>p.index!==selected);
   const next=others.filter(p=>p.index>selected),before=others.filter(p=>p.index<selected);
   const adjacent=[...next,...before.reverse()].slice(0,3).sort((a,b)=>a.index-b.index);
   const neighbors=$('igBNeighbors');neighbors.hidden=!adjacent.length;
   const buttons=adjacent.map(({post,index})=>{
    const button=node('button','igb__neighbor');button.type='button';button.dataset.postId=post.id;button.setAttribute('aria-label',`${date(post.timestamp)}の${kind(post)}投稿を表示`);
    const meta=node('span','igb__neighbor-meta'),time=node('time','',date(post.timestamp));time.dateTime=post.timestamp;meta.append(time,node('span','',kind(post)));
    const frame=node('span','igb__neighbor-media');imageInto(frame,post.image,'',{lazy:true});button.append(meta,frame);
    button.addEventListener('click',()=>{select(index);$('igBOpen').focus({preventScroll:true});});return button;
   });neighbors.replaceChildren(...buttons);
   status.textContent=`最新の${posts.length}投稿。写真を選ぶと、投稿の画像と本文を開きます。`;
  }
  function renderPhoto(){
   const post=posts[selected],photos=photosOf(post),photo=photos[photoIndex];
   imageInto($('igDialogMedia'),photo.image,`${date(post.timestamp)}の公式Instagram投稿（${photoIndex+1} / ${photos.length}枚）`);
   if(photo.media_type==='VIDEO')$('igDialogMedia').append(node('span','ig-video-label','動画のプレビュー'));
   $('igPhotoNav').hidden=photos.length<2;$('igPhotoCount').textContent=`${photoIndex+1} / ${photos.length}`;$('igPhotoPrev').disabled=photoIndex===0;$('igPhotoNext').disabled=photoIndex===photos.length-1;
   $('igDialogLink').textContent=photo.media_type==='VIDEO'?'Instagramで動画を見る':'Instagramでこの投稿を見る';
  }
  function renderDialog(){
   const post=posts[selected];if(!post)return;dialog.dataset.postId=post.id;photoIndex=0;
   $('igDialogTitle').textContent='@yamatonoie';$('igDialogCaption').textContent=post.caption||'この投稿には本文がありません。';
   $('igDialogDate').textContent=date(post.timestamp);$('igDialogDate').dateTime=post.timestamp;$('igDialogLink').href=post.permalink;
   $('igPostCount').textContent=`投稿 ${selected+1} / ${posts.length}`;$('igPostPrev').disabled=selected===0;$('igPostNext').disabled=selected===posts.length-1;
   $('igPostPrev').parentElement.hidden=posts.length<2;renderPhoto();dialog.scrollTop=0;dialog.querySelector('.ig-dialog__body').scrollTop=0;
  }
  function select(index){
   if(index<0||index>=posts.length||index===selected)return;selected=index;renderSelected();if(dialog.open)renderDialog();
  }
  function showPost(trigger){if(!posts.length)return;renderDialog();openDialog(dialog,trigger);}
  function mount(payload){
   const next=normalize(payload);requestEpoch++;controller?.abort();loading=false;retry.disabled=false;
   if(dialog.open)dialog.close();posts=next;selected=0;
   if(!posts.length){layout.removeAttribute('data-post-id');$('igBCover').replaceChildren();$('igBNeighbors').replaceChildren();setState('empty');return {displayed:0};}
   renderSelected();setState('ready');return {displayed:posts.length};
  }
  async function load(){
   if(loading)return;loading=true;const epoch=++requestEpoch;controller=new AbortController();const current=controller;
   const timeout=setTimeout(()=>current.abort(),27000);retry.disabled=true;setState('loading');
   try{const response=await fetch('/api/instagram',{signal:current.signal,credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)throw Error('Unavailable');const payload=await response.json();if(epoch!==requestEpoch)return;mount(payload);}
   catch{if(epoch===requestEpoch)setState('error');}
   finally{clearTimeout(timeout);if(current===controller){loading=false;retry.disabled=false;layout.setAttribute('aria-busy','false');}}
  }
  $('igBHero').addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();return;}showPost(e.currentTarget);});
  $('igBOpen').addEventListener('click',e=>showPost(e.currentTarget));
  $('igBPrev').addEventListener('click',()=>select(selected-1));$('igBNext').addEventListener('click',()=>select(selected+1));
  $('igPostPrev').addEventListener('click',()=>select(selected-1));$('igPostNext').addEventListener('click',()=>select(selected+1));
  $('igPhotoPrev').addEventListener('click',()=>{if(photoIndex>0){photoIndex--;renderPhoto();}});
  $('igPhotoNext').addEventListener('click',()=>{if(photoIndex<photosOf(posts[selected]).length-1){photoIndex++;renderPhoto();}});
  layout.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(selected+(e.key==='ArrowRight'?1:-1));}});
  dialog.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowRight','ArrowLeft'].includes(e.key))return;e.preventDefault();const delta=e.key==='ArrowRight'?1:-1,photos=photosOf(posts[selected]);if(photos.length>1){const target=photoIndex+delta;if(target>=0&&target<photos.length){photoIndex=target;renderPhoto();}}else select(selected+delta);});
  const hero=$('igBHero');hero.addEventListener('pointerdown',e=>{suppressClick=false;swipe=e.pointerType==='touch'?{x:e.clientX,y:e.clientY}:null;},{passive:true});
  hero.addEventListener('pointerup',e=>{if(!swipe)return;const x=e.clientX-swipe.x,y=e.clientY-swipe.y;swipe=null;if(Math.abs(x)>60&&Math.abs(y)<35){suppressClick=true;select(selected+(x<0?1:-1));}},{passive:true});
  hero.addEventListener('pointercancel',()=>{swipe=null;},{passive:true});retry.addEventListener('click',load);
  window.YamatoGallery=Object.freeze({mount});
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();if(!posts.length)load();}},{rootMargin:'300px'});observer.observe(root);}else load();
  addEventListener('pagehide',()=>controller?.abort());
 }
 window.YamatoInstagramB=Object.freeze({init});
})();
