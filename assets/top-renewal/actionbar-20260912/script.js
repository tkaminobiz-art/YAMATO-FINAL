/* Mobile action bar, adopted plan A (2026-09-12). Shows once the hero has passed under the header; hides while 15% or more of VISIT is in view and while the menu or a dialog is open (body.menu-lock, handled in CSS). No analytics, no submissions. */
(function(){
  var bar=document.getElementById('spActionBar');
  var hero=document.getElementById('top');
  if(!bar||!hero)return;
  var visit=document.getElementById('visit');
  var visitInView=false,ticking=false;
  document.body.classList.add('has-actionbar');
  function headerH(){return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'),10)||64;}
  /* The hero counts as passed once its bottom edge reaches the header line. Anchor landings (the FV "SCROLL" link) rest 24px lower because of html scroll-padding-top, so that landing line is honoured too. */
  function lineY(){var pad=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0;return Math.max(headerH(),pad)+2;}
  function update(){
    var pastHero=hero.getBoundingClientRect().bottom<=lineY();
    bar.classList.toggle('is-visible',pastHero&&!visitInView);
    ticking=false;
  }
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  if(visit&&'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      entries.forEach(function(entry){visitInView=entry.isIntersecting&&entry.intersectionRatio>=0.15;});
      update();
    },{threshold:[0,0.15]}).observe(visit);
  }
  update();
})();
