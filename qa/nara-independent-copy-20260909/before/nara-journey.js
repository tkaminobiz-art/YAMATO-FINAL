/* Production journey only: native scrolling; no Lenis, global observers or TOP code. */
(()=>{'use strict';
const d=document,reduce=matchMedia('(prefers-reduced-motion: reduce)');
let context=null;
function setup(){
 context?.revert();context=null;d.getElementById('iju')?.classList.remove('is-cine');
 if(reduce.matches||!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const mobile=matchMedia('(max-width:700px)').matches;
 context=gsap.context(()=>{
  var iju=d.getElementById('iju'), ijuStage=d.getElementById('ijuStage');
  if(iju&&ijuStage){
    iju.classList.add('is-cine');
    var jA=ijuStage.querySelector('.iju__sA'), jUrban=ijuStage.querySelector('.iju__sUrban'), jRide=ijuStage.querySelector('.iju__sRide'), jApproach=ijuStage.querySelector('.iju__sApproach'), jNara=ijuStage.querySelector('.iju__sNara');
    var jAimg=jA&&jA.querySelector('img'), jUrbanImg=jUrban&&jUrban.querySelector('img'), jRideImg=jRide&&jRide.querySelector('img'), jApproachImg=jApproach&&jApproach.querySelector('img'), jNaraImg=jNara&&jNara.querySelector('img');
    var jClock=d.getElementById('ijuClock'), jCap=d.getElementById('ijuClockCap');
    var jPhase=d.getElementById('ijuPhase'), jTitle=d.getElementById('ijuTitle'), jDeck=d.getElementById('ijuDeck');
    var jConcept=d.getElementById('ijuConcept'), jFill=d.getElementById('ijuRouteFill'), jJourney=d.getElementById('ijuJourney');
    var jStops=[].slice.call(ijuStage.querySelectorAll('.iju__stop'));
    var jImages=[].slice.call(ijuStage.querySelectorAll('.iju__scene img'));
    if('IntersectionObserver' in window){
      var jWarm=new IntersectionObserver(function(entries){
        if(!entries[0].isIntersecting) return;
        jWarm.disconnect();
        jImages.forEach(function(img){
          img.loading='eager';
          if(img.decode) img.decode().catch(function(){});
        });
      },{rootMargin:'140% 0px 140% 0px'});
      jWarm.observe(ijuStage);
    }
    var jBeats=[
      {at:0,phase:'Osaka Namba ／ Departure',title:'大阪難波から近鉄奈良へ。',deck:'快速急行は乗り換えなし。',cap:'大阪難波',clock:'18:27',stop:0},
      {at:.15,phase:'Rail Access ／ 41 Minutes',title:'近鉄奈良まで41分。',deck:'快速急行の運行例です。',cap:'乗換なし',clock:'18:27',stop:0},
      {at:.32,phase:'Tsuruhashi ／ 5 Minutes',title:'鶴橋まで5分。',deck:'近鉄奈良方面へ直通。',cap:'鶴橋',clock:'18:32',stop:1},
      {at:.5,phase:'Ikoma ／ 22 Minutes',title:'生駒まで22分。',deck:'乗り換えなし。',cap:'生駒',clock:'18:49',stop:2},
      {at:.58,phase:'Gakuen-mae ／ 28 Minutes',title:'学園前まで28分。',deck:'大和西大寺、新大宮を経て近鉄奈良へ。',cap:'学園前',clock:'18:55',stop:3},
      {at:.66,phase:'Yamato-Saidaiji ／ 8 Minutes Left',title:'近鉄奈良まであと8分。',deck:'新大宮に停車。',cap:'大和西大寺',clock:'19:00',stop:4,compact:true},
      {at:.77,phase:'Shin-Omiya ／ 3 Minutes Left',title:'近鉄奈良まであと3分。',deck:'次は近鉄奈良。',cap:'新大宮',clock:'19:05',stop:5,compact:true},
      {at:.88,phase:'Kintetsu Nara ／ Arrival',title:'近鉄奈良に到着。',deck:'大阪難波から41分の運行例。',cap:'近鉄奈良',clock:'19:08',stop:6}
    ];
    var jBeat=-1;
    function jClamp(v){ return Math.max(0,Math.min(1,v)); }
    function jSmooth(a,b,v){ v=jClamp((v-a)/(b-a)); return v*v*(3-2*v); }
    function jSetBeat(i){
      if(i===jBeat) return; jBeat=i;
      var b=jBeats[i];
      if(jPhase) jPhase.textContent=b.phase;
      if(jTitle) jTitle.innerHTML=b.titleHtml||b.title;
      if(jTitle) jTitle.classList.toggle('is-compact',!!b.compact);
      if(jDeck) jDeck.textContent=b.deck;
      if(jCap) jCap.textContent=b.cap;
      gsap.fromTo([jPhase,jTitle,jDeck],{autoAlpha:0,y:10},{autoAlpha:1,y:0,duration:.42,ease:'power2.out',stagger:.035,overwrite:true});
    }
    function jRailProgress(p){
      var points=[[0,0],[.32,.122],[.5,.537],[.58,.683],[.66,.805],[.77,.927],[.88,1],[1,1]],i;
      for(i=1;i<points.length;i++) if(p<=points[i][0]){
        var a=points[i-1],b=points[i],t=(p-a[0])/(b[0]-a[0]);
        return a[1]+(b[1]-a[1])*jClamp(t);
      }
      return 1;
    }
    function jRender(p){
      p=jClamp(p);
      var leaveOsaka=jSmooth(.1,.15,p), enterCountry=jSmooth(.44,.5,p), enterApproach=jSmooth(.62,.68,p), arriveNara=jSmooth(.78,.84,p);
      gsap.set(jA,{autoAlpha:1-leaveOsaka});
      gsap.set(jUrban,{autoAlpha:leaveOsaka*(1-enterCountry)});
      gsap.set(jRide,{autoAlpha:enterCountry*(1-enterApproach)});
      gsap.set(jApproach,{autoAlpha:enterApproach*(1-arriveNara)});
      gsap.set(jNara,{autoAlpha:arriveNara});
      gsap.set(jAimg,{scale:1+.052*Math.min(1,p/.22)});
      gsap.set(jUrbanImg,{scale:1.045-.018*jClamp((p-.12)/.22),xPercent:-.8*jClamp((p-.14)/.2)});
      gsap.set(jRideImg,{scale:1.045-.02*jClamp((p-.34)/.22),xPercent:-1.1*jClamp((p-.36)/.2)});
      gsap.set(jApproachImg,{scale:1.06-.03*jClamp((p-.64)/.22),xPercent:-.7});
      gsap.set(jNaraImg,{scale:1.055-.035*arriveNara,xPercent:-.8});
      gsap.set(jFill,{scaleX:jRailProgress(p)});
      gsap.set(jConcept,{opacity:.78*jSmooth(.14,.26,p)});

      var bi=0, si=0, i;
      for(i=1;i<jBeats.length;i++) if(p>=jBeats[i].at) bi=i;
      si=jBeats[bi].stop;
      if(jClock) jClock.textContent=jBeats[bi].clock;
      jSetBeat(bi);
      if(jJourney) jJourney.classList.toggle('is-arrived',bi===jBeats.length-1);
      jStops.forEach(function(stop,idx){
        stop.classList.toggle('is-past',idx<si);
        stop.classList.toggle('is-active',idx===si);
      });
    }

    gsap.set([jUrban,jRide,jApproach,jNara],{autoAlpha:0});
    gsap.set(jA,{autoAlpha:1});
    jRender(0);
    ScrollTrigger.create({
      id:'nara-journey',trigger:ijuStage,pin:true,pinSpacing:true,start:'top top',
      end:function(){ return '+='+Math.round(innerHeight*4.6); },
      scrub:mobile?1:.7,anticipatePin:1,invalidateOnRefresh:true,
      onUpdate:function(self){ jRender(self.progress); },
      onRefresh:function(self){ jRender(self.progress); }
    });
  }


 });
}
setup();reduce.addEventListener('change',setup);
d.fonts?.ready.then(()=>window.ScrollTrigger?.refresh());
addEventListener('pageshow',()=>window.ScrollTrigger?.refresh());
})();
