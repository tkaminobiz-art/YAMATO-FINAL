/* All meaning is present without motion or JavaScript. Animate the count once. */
(() => {
 const section = document.querySelector('.yamato-folio');
 if (!section) return;
 if (new URLSearchParams(location.search).get('folio') === 'relaxed') section.classList.add('yamato-folio--relaxed');
 const number = section.querySelector('[data-folio-count]');
 const heading = section.querySelector('.yamato-folio__title');
 const reduce = matchMedia('(prefers-reduced-motion: reduce)');
 if (!number || !heading) return;
 const finalValue = Number(number.textContent);
 if (reduce.matches || !('IntersectionObserver' in window) || !Number.isFinite(finalValue)) {
  section.dataset.folioAnimation = 'skipped';
  return;
 }
 let started = false;
 let finished = false;
 section.dataset.folioAnimation = 'ready';
 let frame = 0;
 let observer;
 const finish = () => {
  if (finished) return;
  finished = true;
  cancelAnimationFrame(frame);
  number.textContent = String(finalValue);
  section.dataset.folioAnimation = 'complete';
  observer?.disconnect();
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('pagehide', finish);
  reduce.removeEventListener('change', onPreference);
 };
 const onVisibility = () => { if (document.hidden && started) finish(); };
 const onPreference = () => { if (reduce.matches) finish(); };
 const start = () => {
  if (started || finished) return;
  started = true;
  if (document.hidden || reduce.matches) return finish();
  section.dataset.folioAnimation = 'running';
  const began = performance.now();
  const tick = now => {
   const progress = Math.min(1, (now - began) / 900);
   number.textContent = String(Math.round(finalValue * (1 - Math.pow(1 - progress, 3))));
   if (progress >= 1) finish();
   else frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
 };
 observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
   if (entry.isIntersecting && entry.intersectionRatio >= .5) start();
   else if (!entry.isIntersecting && started) finish();
  }
 }, {threshold: [0, .5], rootMargin: '-76px 0px -10% 0px'});
 document.addEventListener('visibilitychange', onVisibility);
 window.addEventListener('pagehide', finish);
 reduce.addEventListener('change', onPreference);
 observer.observe(heading);
})();
