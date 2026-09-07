(() => {
  'use strict';
  const number = document.querySelector('#builtProof [data-built-count]');
  if (!number) return;
  const target = Number(number.dataset.builtCount);
  if (!Number.isFinite(target) || target <= 0) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let started = false, frame = 0, observer;
  const finish = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    number.textContent = String(target);
    number.style.minWidth = '';
    number.dataset.countState = 'complete';
  };
  if (reduced.matches || !('IntersectionObserver' in window)) {
    finish();
    return;
  }
  number.dataset.countState = 'ready';
  const start = () => {
    if (started) return;
    started = true;
    observer.disconnect();
    if (reduced.matches || document.hidden) { finish(); return; }
    number.style.minWidth = `${number.getBoundingClientRect().width}px`;
    number.textContent = '0';
    number.dataset.countState = 'running';
    const began = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - began) / 1400);
      number.textContent = String(Math.floor(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
  };
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .5)) start();
  }, {threshold: .5});
  observer.observe(number);
  reduced.addEventListener('change', () => {
    if (reduced.matches) { started = true; observer.disconnect(); finish(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && started) finish(); });
  addEventListener('resize', () => { if (started) finish(); }, {passive: true});
  addEventListener('pagehide', () => { if (started) finish(); });
})();
