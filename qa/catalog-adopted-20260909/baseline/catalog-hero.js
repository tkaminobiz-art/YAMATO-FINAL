(function(){
  'use strict';
  try{
  var catalog=document.querySelector('section.fvs');
  if(!catalog) return;
  var compactMedia=matchMedia('(max-width:820px)');
  var layoutMode=compactMedia.matches?'sp':'pc';
  var allScenes=[].slice.call(catalog.querySelectorAll(':scope > .fvs__scene'));
  var scenes=allScenes.filter(function(scene){var layout=scene.getAttribute('data-catalog-layout');return !layout||layout===layoutMode;});
  var countNow=document.getElementById('catNow');
  var countAll=document.getElementById('catAll');
  var prevBtn=document.getElementById('catPrev');
  var nextBtn=document.getElementById('catNext');
  var toc=document.getElementById('catToc');
  var tocOpen=document.getElementById('catTocOpen');
  var tocClose=document.getElementById('catTocClose');
  var tocList=document.getElementById('catTocList');
  var coverMotion=catalog.querySelector('.catalog-cover__motion');
  var coverShell=catalog.querySelector('.catalog-cover');
  var openingSkip=document.getElementById('catOpeningSkip');
  var openingReplay=document.getElementById('catOpeningReplay');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var openingSeen=false;
  try{openingSeen=sessionStorage.getItem('yamatoCatalogOpeningSeen')==='1';}catch(ignore){}
  var index=0,animating=false,startX=0,startY=0,pointerDown=false;
  if(countAll) countAll.textContent=String(scenes.length).padStart(2,'0');

  scenes.forEach(function(scene,i){
    scene.classList.toggle('is-active',i===0);
    scene.setAttribute('aria-hidden',i===0?'false':'true');
    if(layoutMode==='sp'&&scene.hasAttribute('data-toc-child')) return;
    var li=document.createElement('li');
    var button=document.createElement('button');
    var no=document.createElement('b');
    var label=document.createElement('span');
    button.type='button';
    no.textContent=String(i+1).padStart(2,'0');
    label.textContent=scene.getAttribute('data-toc')||scene.getAttribute('data-name')||('ページ'+(i+1));
    button.appendChild(no);button.appendChild(label);li.appendChild(button);tocList.appendChild(li);
    button.addEventListener('click',function(){ if(toc.open) toc.close(); go(i); });
  });

  function sync(){
    if(countNow) countNow.textContent=String(index+1).padStart(2,'0');
    prevBtn.disabled=index===0;
    nextBtn.disabled=index===scenes.length-1;
    prevBtn.setAttribute('aria-label',index===0?'前のページはありません':'前のページ');
    nextBtn.setAttribute('aria-label',index===scenes.length-1?'次のページはありません':'次のページ');
  }

  function settle(current,next){
    current.classList.remove('is-active','is-leaving');
    current.setAttribute('aria-hidden','true');
    next.classList.add('is-active');
    next.setAttribute('aria-hidden','false');
    animating=false;
  }

  function go(to){
    to=Math.max(0,Math.min(scenes.length-1,to));
    if(to===index||animating) return;
    var current=scenes[index],next=scenes[to],forward=to>index;
    var currentVisual=current.querySelector('.catalog-sheet,.catalog-cover')||current;
    var nextVisual=next.querySelector('.catalog-sheet,.catalog-cover')||next;
    if(index===0&&coverMotion) coverMotion.pause();
    index=to;sync();
    if(index===0) playOpening(false);
    next.classList.add('is-active');next.setAttribute('aria-hidden','false');
    current.classList.add('is-leaving');animating=true;
    if(reduce||!currentVisual.animate){settle(current,next);return;}
    var sign=forward?1:-1;
    var compact=compactMedia.matches;
    var duration=compact?300:420;
    var outgoing=currentVisual.animate(compact?[
      {opacity:1,transform:'translateX(0)'},
      {opacity:.52,transform:'translateX('+(-20*sign)+'px)'}
    ]:[
      {opacity:1,transform:'translateX(0) rotateY(0deg)'},
      {opacity:.25,transform:'translateX('+(-7*sign)+'%) rotateY('+(5*sign)+'deg)'}
    ],{duration:duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    var incoming=nextVisual.animate(compact?[
      {opacity:.7,clipPath:sign>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)',transform:'translateX('+(20*sign)+'px)'},
      {opacity:1,clipPath:'inset(0 0 0 0)',transform:'translateX(0)'}
    ]:[
      {opacity:.62,clipPath:sign>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)',transform:'translateX('+(7*sign)+'%) rotateY('+(-4*sign)+'deg)'},
      {opacity:1,clipPath:'inset(0 0 0 0)',transform:'translateX(0) rotateY(0deg)'}
    ],{duration:duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    Promise.allSettled([outgoing.finished,incoming.finished]).then(function(){outgoing.cancel();incoming.cancel();settle(current,next);});
  }

  prevBtn.addEventListener('click',function(){go(index-1);});
  nextBtn.addEventListener('click',function(){go(index+1);});
  tocOpen.addEventListener('click',function(){if(typeof toc.showModal==='function')toc.showModal();else toc.setAttribute('open','');});
  tocClose.addEventListener('click',function(){toc.close();});
  toc.addEventListener('click',function(e){if(e.target===toc)toc.close();});

  document.addEventListener('keydown',function(e){
    if(toc.open) return;
    var target=e.target;
    if(target&&(/^(INPUT|TEXTAREA|SELECT)$/).test(target.tagName)) return;
    var rect=catalog.getBoundingClientRect();
    if(rect.bottom<=0||rect.top>=innerHeight) return;
    if(e.key==='ArrowRight'){e.preventDefault();go(index+1);}
    else if(e.key==='ArrowLeft'){e.preventDefault();go(index-1);}
  });
  catalog.addEventListener('pointerdown',function(e){
    if(e.target.closest('button,a')) return;
    pointerDown=true;startX=e.clientX;startY=e.clientY;
  },{passive:true});
  catalog.addEventListener('pointerup',function(e){
    if(!pointerDown) return;pointerDown=false;
    var dx=e.clientX-startX,dy=e.clientY-startY;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.35) go(index+(dx<0?1:-1));
  },{passive:true});
  catalog.addEventListener('pointercancel',function(){pointerDown=false;},{passive:true});
  catalog.addEventListener('dragstart',function(e){if(e.target.tagName==='IMG')e.preventDefault();});
  function rememberOpening(){
    openingSeen=true;
    try{sessionStorage.setItem('yamatoCatalogOpeningSeen','1');}catch(ignore){}
  }
  function settleCover(){
    if(coverShell) coverShell.classList.add('is-motion-settled','is-title-in');
  }
  function playOpening(force){
    if(!coverMotion||reduce||(!force&&openingSeen)){
      if(coverMotion) coverMotion.pause();
      settleCover();
      return;
    }
    if(coverShell) coverShell.classList.remove('is-motion-settled','is-title-in');
    coverMotion.currentTime=0;
    var playback=coverMotion.play();
    if(playback&&playback.catch) playback.catch(settleCover);
  }
  window.__fvs={go:go,next:function(){go(index+1);},prev:function(){go(index-1);},idx:function(){return index;},pages:function(){return scenes.length;},mode:function(){return layoutMode;}};
  if(coverMotion){
    if(reduce){
      coverMotion.removeAttribute('autoplay');coverMotion.pause();settleCover();
    }else{
      coverMotion.addEventListener('timeupdate',function(){
        if(coverMotion.currentTime>=4.45&&coverShell) coverShell.classList.add('is-title-in');
      });
      coverMotion.addEventListener('ended',function(){rememberOpening();settleCover();});
      coverMotion.addEventListener('error',settleCover);
      playOpening(false);
    }
  }
  if(openingSkip) openingSkip.addEventListener('click',function(){if(coverMotion)coverMotion.pause();rememberOpening();settleCover();});
  if(openingReplay) openingReplay.addEventListener('click',function(){playOpening(true);});
  if(compactMedia.addEventListener) compactMedia.addEventListener('change',function(){location.reload();});
  sync();
  }catch(error){
    window.__fvsInitError={name:error&&error.name,message:error&&error.message};
    console.error('catalog init failed',error);
  }
})();
