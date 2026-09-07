(() => {
  'use strict';
  const dataNode=document.getElementById('worksPhotoData');
  if(!dataNode) return;
  let data;
  try{data=JSON.parse(dataNode.textContent);}catch{return;}
  const viewer=document.getElementById('photoViewer');
  const menu=document.getElementById('siteMenu');
  if(typeof viewer.showModal!=='function') return;
  const stage=viewer.querySelector('.viewer-stage');
  const image=viewer.querySelector('.viewer-image');
  const loading=viewer.querySelector('.viewer-loading');
  const error=viewer.querySelector('.viewer-error');
  const counter=viewer.querySelector('.viewer-count');
  const caption=document.getElementById('viewerCaption');
  const title=document.getElementById('viewerTitle');
  const kind=document.getElementById('viewerKind');
  const next=viewer.querySelector('.viewer-next');
  const prev=viewer.querySelector('.viewer-prev');
  const menuToggle=document.querySelector('.menu-toggle');
  let photos=[],position=0,request=0,opener=null,currentLoader=null,loadTimer=null;
  const syncLock=()=>document.body.classList.toggle('dialog-open',viewer.open||menu.open);

  function showPhoto(index){
    if(!photos.length) return;
    position=(index+photos.length)%photos.length;
    const entry=photos[position],ticket=++request;
    if(currentLoader){currentLoader.onload=null;currentLoader.onerror=null;}
    clearTimeout(loadTimer);
    image.hidden=true;image.classList.remove('is-entering');error.hidden=true;loading.hidden=false;
    stage.setAttribute('aria-busy','true');
    counter.textContent=`${position+1} / ${photos.length}`;
    caption.textContent=entry.alt;
    prev.disabled=next.disabled=photos.length<2;
    const loader=new Image();currentLoader=loader;
    const fail=()=>{
      if(ticket!==request||!viewer.open) return;
      clearTimeout(loadTimer);loading.hidden=true;error.hidden=false;stage.setAttribute('aria-busy','false');
      loader.onload=null;loader.onerror=null;
    };
    loader.onload=()=>{
      if(ticket!==request||!viewer.open) return;
      clearTimeout(loadTimer);
      image.src=entry.src;image.alt=entry.alt;image.hidden=false;
      loading.hidden=true;stage.setAttribute('aria-busy','false');image.classList.add('is-entering');
    };
    loader.onerror=fail;
    loadTimer=setTimeout(fail,15000);
    loader.src=entry.src;
  }
  function openPhotos(entries,index,heading,category,trigger){
    photos=entries;opener=trigger;title.textContent=heading;kind.textContent=category;
    viewer.showModal();syncLock();showPhoto(index);
  }
  document.querySelectorAll('[data-gallery]').forEach(link=>{
    link.addEventListener('click',event=>{
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0) return;
      const id=link.dataset.gallery,gallery=data.galleries[id];
      if(!gallery?.images?.length) return;
      event.preventDefault();
      openPhotos(gallery.images,0,gallery.heading||gallery.title,gallery.category||(id==='home'?'注文住宅・お引き渡し済み':'モデルハウス'),link);
    });
  });
  prev.addEventListener('click',()=>showPhoto(position-1));
  next.addEventListener('click',()=>showPhoto(position+1));
  document.getElementById('retryPhoto').addEventListener('click',()=>showPhoto(position));
  viewer.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();showPhoto(position+(event.key==='ArrowLeft'?-1:1));
    }
  });
  let swipeStart=null;
  stage.addEventListener('touchstart',event=>{
    swipeStart=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;
  },{passive:true});
  stage.addEventListener('touchmove',event=>{if(event.touches.length!==1)swipeStart=null;},{passive:true});
  stage.addEventListener('touchend',event=>{
    if(!swipeStart||!event.changedTouches.length) return;
    const end=event.changedTouches[0],dx=end.clientX-swipeStart.x,dy=end.clientY-swipeStart.y;swipeStart=null;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)showPhoto(position+(dx<0?1:-1));
  },{passive:true});
  stage.addEventListener('touchcancel',()=>{swipeStart=null;},{passive:true});
  viewer.addEventListener('close',()=>{
    request++;clearTimeout(loadTimer);if(currentLoader){currentLoader.onload=null;currentLoader.onerror=null;}
    swipeStart=null;image.hidden=true;image.removeAttribute('src');stage.setAttribute('aria-busy','false');syncLock();
    if(opener?.isConnected)opener.focus({preventScroll:true});
  });
  [viewer,menu].forEach(dialog=>{
    let startedOutside=false;
    const outside=event=>{const box=dialog.getBoundingClientRect();return event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom;};
    dialog.addEventListener('pointerdown',event=>{startedOutside=event.target===dialog&&outside(event);});
    dialog.addEventListener('click',event=>{if(startedOutside&&event.target===dialog&&outside(event))dialog.close();startedOutside=false;});
  });
  menuToggle.addEventListener('click',()=>{menu.showModal();menuToggle.setAttribute('aria-expanded','true');syncLock();});
  menu.addEventListener('close',()=>{menuToggle.setAttribute('aria-expanded','false');syncLock();menuToggle.focus({preventScroll:true});});

  const archiveLinks=[...document.querySelectorAll('[data-archive]')];
  const filters=[...document.querySelectorAll('[data-filter]')];
  const more=document.getElementById('archiveMore');
  const status=document.getElementById('archiveStatus');
  const empty=document.querySelector('.archive-empty');
  let selected='all',limit=8;
  const filtered=()=>archiveLinks.filter(link=>selected==='all'||link.dataset.room===selected);
  function updateArchive(){
    const matches=filtered(),visible=matches.slice(0,limit),remaining=Math.max(0,matches.length-limit);
    archiveLinks.forEach(link=>{link.hidden=!visible.includes(link);});
    filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===selected)));
    status.textContent=`${matches.length}枚中 ${visible.length}枚を表示`;
    more.hidden=remaining===0;
    more.replaceChildren(document.createTextNode(`残り${remaining}枚を見る`));
    const plus=document.createElement('span');plus.setAttribute('aria-hidden','true');plus.textContent='＋';more.append(plus);
    empty.hidden=matches.length>0;
  }
  filters.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.filter;limit=8;updateArchive();}));
  more.addEventListener('click',()=>{
    const firstNew=filtered()[limit];limit=filtered().length;updateArchive();
    if(firstNew)firstNew.focus({preventScroll:true});
  });
  archiveLinks.forEach(link=>link.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0) return;
    const visible=filtered().filter(item=>!item.hidden),index=visible.indexOf(link);
    if(index<0) return;
    event.preventDefault();
    openPhotos(visible.map(item=>data.archive[Number(item.dataset.archive)]),index,'部屋別の施工写真','2016年撮影の施工事例',link);
  }));
  document.querySelectorAll('.photo-link img').forEach(img=>{
    const fallback=img.parentElement.querySelector('.photo-unavailable');
    const fail=()=>{if(fallback)fallback.hidden=false;};
    img.addEventListener('error',fail);img.addEventListener('load',()=>{if(fallback)fallback.hidden=true;});
    if(img.complete&&!img.naturalWidth)fail();
  });
  updateArchive();
  document.documentElement.classList.add('works-enhanced');
})();
