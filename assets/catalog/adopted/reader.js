(function(){
 'use strict';
 window.YamatoCatalogReader={init:function(catalog){
  try{
   const pages=[...catalog.querySelectorAll('[data-cr-page]')],chapters=[...catalog.querySelectorAll('[data-cr-chapter-section]')];
   const cover=catalog.querySelector('.fvs__scene--cover'),compact=matchMedia('(max-width:820px)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
   const toc=document.getElementById('catToc'),box=document.getElementById('crLightbox'),toolbar=catalog.querySelector('.cr-toolbar');
   const coverMotion=catalog.querySelector('.catalog-cover__motion'),coverShell=catalog.querySelector('.catalog-cover');
   let coverCompact=compact.matches;
   let index=-1,openingSeen=false,opener=null,zoomOpener=null,zoomY=0,scrollFrame=0,navFrame=0,down=null;
   try{openingSeen=sessionStorage.getItem('yamatoCatalogOpeningSeen')==='1';}catch(ignore){}
   function rememberOpening(){openingSeen=true;try{sessionStorage.setItem('yamatoCatalogOpeningSeen','1');}catch(ignore){}}
   function settleCover(){coverShell.classList.add('is-motion-settled','is-title-in');}
   function playOpening(force){
    if(coverMotion&&coverCompact!==compact.matches){coverCompact=compact.matches;coverMotion.load();}
    if(!coverMotion||motion.matches||(!force&&openingSeen)){if(coverMotion)coverMotion.pause();settleCover();return;}
    coverShell.classList.remove('is-motion-settled','is-title-in');coverMotion.currentTime=0;
    const p=coverMotion.play();if(p&&p.catch)p.catch(settleCover);
   }
   function chapterIndex(dir){if(index<0)return dir>0?0:-1;const current=pages[index].dataset.crChapter; if(dir>0)return pages.findIndex((p,i)=>i>index&&p.dataset.crChapter!==current);const earlier=pages.filter((p,i)=>i<index&&p.dataset.crChapter!==current);return earlier.length?pages.findIndex(p=>p.dataset.crChapter===earlier.at(-1).dataset.crChapter):-1;}
   function destination(dir){return compact.matches?chapterIndex(dir):Math.min(pages.length-1,Math.max(-1,index+dir));}
   function sync(){
    const current=pages[index];catalog.querySelectorAll('[data-cr-prev]').forEach(b=>{b.disabled=index<0;b.textContent=compact.matches?'前の章':'← 前へ';b.setAttribute('aria-label',compact.matches?'前の章':'前のページ');});
    catalog.querySelectorAll('[data-cr-next]').forEach(b=>{b.disabled=compact.matches?(index>=0&&chapterIndex(1)<0):index===pages.length-1;b.textContent=compact.matches?'次の章':'次へ →';b.setAttribute('aria-label',compact.matches?'次の章':'次のページ');});
    toolbar.querySelector('.cr-position').textContent=current?`${String(current.dataset.crPage).padStart(2,'0')} / 32　${current.querySelector('h2').textContent.split('｜')[0]}`:'';
    toc.querySelectorAll('a[href]').forEach(a=>{if(a.hash===(current?'#'+current.id:'#top'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.getElementById('catNow').textContent=String(index+2).padStart(2,'0');document.getElementById('catAll').textContent=String(pages.length+1).padStart(2,'0');
   }
   function render(){
    const reading=index>=0;catalog.classList.toggle('cr-reading',reading);cover.inert=reading;cover.setAttribute('aria-hidden',String(reading));
    pages.forEach((p,i)=>{p.hidden=!reading||(!compact.matches&&i!==index);p.inert=p.hidden;});
    chapters.forEach(c=>{c.hidden=!reading||(!compact.matches&&!c.querySelector('[data-cr-page]:not([hidden])'));});sync();
   }
   function rememberPosition(){const current=pages[index];history.replaceState({...history.state,catalogId:current?.id||'top',catalogY:scrollY},'',location.href);}
   function go(to,{push=true,scroll=true,focus=true,restoredY=null}={}){
    const next=typeof to==='string'?(to==='top'?-1:pages.findIndex(p=>p.id===to)):Math.max(-1,Math.min(pages.length-1,to));
    if(typeof to==='string'&&to!=='top'&&next<0)return false;
    cancelAnimationFrame(scrollFrame);
    if(push){rememberPosition();history.pushState({catalogId:pages[next]?.id||'top'},'','#'+(pages[next]?.id||'top'));}
    const was=index;index=next;if(index>=0)coverMotion?.pause();render();
    if(index<0&&was>=0)playOpening(false);
    if(scroll){cancelAnimationFrame(navFrame);const target=pages[next]||catalog;navFrame=requestAnimationFrame(()=>{if(restoredY!==null)window.scrollTo({top:restoredY,behavior:'instant'});else target.scrollIntoView({block:'start',behavior:'instant'});if(focus&&next>=0)target.focus({preventScroll:true});navFrame=0;});}
    return true;
   }
   function trapFocus(dialog){dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const focusable=[...dialog.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')].filter(n=>n.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});}
   trapFocus(toc);trapFocus(box);
   function openToc(button){opener=button;toc.showModal();toc.querySelector('[aria-current=page]')?.scrollIntoView({block:'nearest'});document.getElementById('catTocClose').focus();}
   toc.addEventListener('close',()=>{if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus({preventScroll:true});});
   document.getElementById('catTocClose').addEventListener('click',()=>toc.close());
   toc.addEventListener('click',e=>{if(e.target===toc){const r=toc.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)toc.close();}});
   document.getElementById('catTocOpen').addEventListener('click',e=>openToc(e.currentTarget));
   document.getElementById('catNext').addEventListener('click',()=>go(0));document.getElementById('catPrev').disabled=true;
   catalog.addEventListener('click',e=>{
    const target=e.target.closest('button,a');if(!target)return;
    if(target.hasAttribute('data-cr-toc'))openToc(target);
    if(target.hasAttribute('data-cr-cover'))go(-1);
    if(target.hasAttribute('data-cr-prev'))go(destination(-1));
    if(target.hasAttribute('data-cr-next')){const next=destination(1);if(next>=0)go(next);}
    if(target.classList.contains('cr-table-toggle')){const cmp=target.closest('[data-cr-comparison]');const on=cmp.classList.toggle('is-horizontal');target.setAttribute('aria-pressed',String(on));target.textContent=on?'項目ごとに見る':'横表で比べる';}
    if(target.hasAttribute('data-cr-zoom'))openZoom(target);
   });
   document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank')return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname!==location.pathname)return;const id=decodeURIComponent(u.hash.slice(1));if(id==='top'||pages.some(p=>p.id===id)){e.preventDefault();if(toc.open){opener=null;toc.close();}go(id);}else if(catalog.contains(a)&&u.hash){rememberPosition();}});
   catalog.querySelectorAll('.cr-table-scroll').forEach(area=>area.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||!area.closest('.is-horizontal'))return;e.preventDefault();e.stopPropagation();area.scrollBy({left:e.key==='ArrowRight'?120:-120,behavior:'instant'});}));
   catalog.addEventListener('keydown',e=>{if(toc.open||box.open||!['ArrowLeft','ArrowRight'].includes(e.key)||e.target.closest('input,textarea,select,[contenteditable],.cr-table-scroll,.cr-photo-button')||getSelection()?.toString())return;if(e.altKey||e.metaKey||e.ctrlKey)return;e.preventDefault();const next=destination(e.key==='ArrowRight'?1:-1);if(next>=-1)go(next);});
   catalog.addEventListener('pointerdown',e=>{down=e.pointerType==='touch'&&!e.target.closest('button,a,.cr-table-scroll,input,textarea,select')?{x:e.clientX,y:e.clientY}:null;},{passive:true});
   catalog.addEventListener('pointerup',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;down=null;if(Math.abs(dx)<80||Math.abs(dy)>35||Math.abs(dx)<Math.abs(dy)*2.4)return;const next=destination(dx<0?1:-1);if(next>=-1)go(next);},{passive:true});catalog.addEventListener('pointercancel',()=>down=null,{passive:true});
   function headerHeight(){catalog.style.setProperty('--cr-header-height',Math.ceil(document.getElementById('hd').getBoundingClientRect().height)+'px');}
   headerHeight();new ResizeObserver(headerHeight).observe(document.getElementById('hd'));
   compact.addEventListener('change',()=>{const saved=index;render();if(saved>=0)go(saved,{push:false,focus:false});else playOpening(false);});
   window.addEventListener('scroll',()=>{if(!compact.matches||index<0||box.open||toc.open||navFrame)return;cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(()=>{const line=toolbar.getBoundingClientRect().bottom+40;let current=index;pages.forEach((p,i)=>{if(p.getBoundingClientRect().top<=line)current=i;});if(current!==index){index=current;sync();}});},{passive:true});
   function openZoom(button){zoomOpener=button;zoomY=scrollY;rememberPosition();history.pushState({...history.state,catalogZoom:true},'',location.href);const image=button.querySelector('img'),dest=box.querySelector('img');dest.src=image.currentSrc||image.src;dest.alt=image.alt;dest.width=image.naturalWidth;dest.height=image.naturalHeight;box.querySelector('.cr-lightbox-caption').textContent=button.closest('figure').querySelector('figcaption').textContent;box.querySelector('.cr-lightbox-scroll').classList.remove('is-zoomed');box.style.setProperty('--cr-zoom-width',image.naturalWidth+'px');box.querySelector('[data-cr-zoom-in]').disabled=false;box.showModal();box.querySelector('[data-cr-zoom-close]').focus();}
   function finishZoom(){if(!box.open)return;box.close();const trigger=zoomOpener,y=zoomY;requestAnimationFrame(()=>requestAnimationFrame(()=>{window.scrollTo({top:y,behavior:'instant'});trigger?.focus({preventScroll:true});}));}
   function closeZoom(){if(history.state?.catalogZoom)history.back();else finishZoom();}
   box.querySelector('[data-cr-zoom-close]').addEventListener('click',closeZoom);box.addEventListener('cancel',e=>{e.preventDefault();closeZoom();});
   box.querySelector('[data-cr-zoom-in]').addEventListener('click',e=>{box.querySelector('.cr-lightbox-scroll').classList.add('is-zoomed');e.currentTarget.disabled=true;});
   box.querySelector('[data-cr-zoom-reset]').addEventListener('click',()=>{box.querySelector('.cr-lightbox-scroll').classList.remove('is-zoomed');box.querySelector('[data-cr-zoom-in]').disabled=false;});
   box.addEventListener('click',e=>{if(e.target===box){const r=box.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeZoom();}});
   window.addEventListener('popstate',e=>{if(box.open&&!e.state?.catalogZoom){finishZoom();return;}const id=e.state?.catalogId||decodeURIComponent(location.hash.slice(1));if(id==='top'||pages.some(p=>p.id===id))go(id,{push:false,restoredY:e.state?.catalogY??null});else if(!id)go(-1,{push:false,focus:false});});
   window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if((id==='top'||pages.some(p=>p.id===id))&&id!==(pages[index]?.id||'top'))go(id,{push:false});});
   coverMotion?.addEventListener('timeupdate',()=>{if(coverMotion.currentTime>=4.45)coverShell.classList.add('is-title-in');});
   coverMotion?.addEventListener('ended',()=>{rememberOpening();settleCover();});coverMotion?.addEventListener('error',settleCover);
   document.getElementById('catOpeningSkip').addEventListener('click',()=>{coverMotion?.pause();rememberOpening();settleCover();});
   document.getElementById('catOpeningReplay').addEventListener('click',()=>playOpening(true));
   motion.addEventListener('change',()=>{if(motion.matches){coverMotion?.pause();settleCover();}});
   if(motion.matches){coverMotion?.removeAttribute('autoplay');coverMotion?.pause();settleCover();}else playOpening(false);
   render();const initial=decodeURIComponent(location.hash.slice(1));if(pages.some(p=>p.id===initial))go(initial,{push:false,focus:false});
   window.__fvs={go:n=>go(n-1),next:()=>go(destination(1)),prev:()=>go(destination(-1)),idx:()=>index+1,pages:()=>pages.length+1,mode:()=>compact.matches?'sp':'pc'};
   window.__catalogReader={pages:()=>pages.map(p=>({id:p.id,number:Number(p.dataset.crPage),chapter:Number(p.dataset.crChapter)})),current:()=>pages[index]?.id||'top',go:id=>go(id)};
  }catch(error){document.documentElement.classList.remove('cr-js');catalog.querySelectorAll('[hidden]').forEach(e=>{e.hidden=false;e.inert=false;});console.error('Catalogue reader fallback',error);window.__fvsInitError=String(error);}
 }};
})();
