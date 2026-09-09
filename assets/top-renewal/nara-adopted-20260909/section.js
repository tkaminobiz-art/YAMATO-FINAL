/* Progressive enhancement: all Namba copy, values and disclosures exist in HTML. */
(() => {
  'use strict';
  const section = document.querySelector('.na26');
  if (!section || section.dataset.enhanced) return;
  section.dataset.enhanced = 'true';
  const origins = {
    namba: {name:'大阪難波', departure:'18:27', minutes:[22,28,41]},
    tsuruhashi: {name:'鶴橋', departure:'18:33', minutes:[16,22,35]}
  };
  const switcher = section.querySelector('.na26__switch');
  switcher.hidden = false;
  switcher.addEventListener('change', event => {
    const origin = origins[event.target.value];
    if (!origin || event.target.type !== 'radio') return;
    section.querySelector('[data-origin-label]').textContent = origin.name;
    section.querySelector('[data-source-origin]').textContent = origin.name + origin.departure + '発';
    section.querySelector('[data-station-list]').setAttribute('aria-label',origin.name+'から奈良方面の主な駅までの所要時間');
    section.querySelectorAll('[data-minutes]').forEach((element,index) => {element.textContent=origin.minutes[index];});
    section.querySelector('.na26__status').textContent=origin.name+'から生駒'+origin.minutes[0]+'分、学園前'+origin.minutes[1]+'分、近鉄奈良'+origin.minutes[2]+'分。快速急行、平日夕方の一例です。';
  });
  const stations = section.querySelector('.na26__stations');
  const fitText = () => {
    const naturalNeeded = Math.max(...Array.from(stations.children,item => Math.max(item.querySelector('.na26__station').scrollWidth,item.querySelector('.na26__duration b').scrollWidth+28)+20));
    const enlarged = parseFloat(getComputedStyle(stations.querySelector('.na26__station')).fontSize)>22;
    section.classList.toggle('is-spacious-text',enlarged || naturalNeeded*3>stations.clientWidth);
  };
  if ('ResizeObserver' in window) {
    const observer=new ResizeObserver(fitText);
    observer.observe(stations);
  }
  document.fonts?.ready.then(fitText);
  fitText();
  const photo=section.querySelector('.na26__home img');
  const failedPhoto=()=>{photo.hidden=true;section.querySelector('.na26__photo-fallback').hidden=false;section.classList.add('is-photo-unavailable');};
  photo.addEventListener('error',failedPhoto);
  if(photo.complete&&!photo.naturalWidth)failedPhoto();
})();
