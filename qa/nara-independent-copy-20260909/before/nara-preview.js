/* Progressive journey emphasis only: content and navigation work without JavaScript. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stops = [...document.querySelectorAll('.station-list li')];
  let observer;
  function reset() {
    observer?.disconnect();
    stops.forEach(stop => stop.classList.remove('is-current'));
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-current', entry.isIntersecting));
    }, { rootMargin: '-15% 0px -35% 0px', threshold: 0.4 });
    stops.forEach(stop => observer.observe(stop));
  }
  reset();
  reduced.addEventListener('change', reset);
  window.addEventListener('pagehide', () => observer?.disconnect());
  window.addEventListener('pageshow', reset);
})();
