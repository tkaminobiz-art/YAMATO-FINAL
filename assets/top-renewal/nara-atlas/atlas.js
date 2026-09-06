/* Progressive enhancement: the complete Namba example exists in HTML. */
(() => {
  'use strict';
  const section = document.querySelector('.nara-atlas');
  if (!section) return;
  const origins = {
    namba: {name: '大阪難波', departure: '18:27', minutes: [22, 28, 41]},
    tsuruhashi: {name: '鶴橋', departure: '18:33', minutes: [16, 22, 35]}
  };
  const switcher = section.querySelector('.nara-atlas__switch');
  const status = section.querySelector('.nara-atlas__status');
  switcher.hidden = false;
  section.querySelector('.nara-atlas__static-origin').hidden = true;
  // Text zoom must change the layout, never shrink the user's chosen text.
  const stations = section.querySelector('.nara-atlas__stations');
  const fitRoute = () => {
    const required = Math.max(...Array.from(stations.children, station => {
      const label = station.querySelector('.nara-atlas__station');
      const duration = station.querySelector('.nara-atlas__duration');
      return Math.max(label.scrollWidth, duration.scrollWidth) + 24;
    }));
    const width = section.querySelector('.nara-atlas__inner').clientWidth;
    const nominalWidth = innerWidth < 768 ? width : innerWidth <= 1050 ? (width - 35) * .65 : (width - 60) * .7;
    const largeText = parseFloat(getComputedStyle(stations.querySelector('.nara-atlas__station')).fontSize) > 22;
    section.classList.toggle('is-spacious-text', largeText || required * 3 > nominalWidth);
  };
  if ('ResizeObserver' in window) {
    const sizing = new ResizeObserver(fitRoute);
    sizing.observe(stations);
    section.querySelectorAll('.nara-atlas__station,.nara-atlas__duration').forEach(item => sizing.observe(item));
  }
  document.fonts?.ready.then(fitRoute);
  fitRoute();
  switcher.addEventListener('change', event => {
    const origin = origins[event.target.value];
    if (!origin) return;
    section.querySelector('[data-origin-label]').textContent = origin.name;
    section.querySelector('[data-source-origin]').textContent = origin.name + origin.departure + '発';
    section.querySelector('[data-station-list]').setAttribute('aria-label', origin.name + 'から奈良方面の主な駅までの所要時間');
    section.querySelectorAll('[data-minutes]').forEach((number, index) => { number.textContent = origin.minutes[index]; });
    status.textContent = origin.name + 'から生駒' + origin.minutes[0] + '分、学園前' + origin.minutes[1] + '分、近鉄奈良' + origin.minutes[2] + '分。快速急行、平日夕方の一例です。';
  });
  const photo = section.querySelector('.nara-atlas__photo img');
  const showFallback = () => {
    photo.hidden = true;
    section.querySelector('.nara-atlas__photo-fallback').hidden = false;
  };
  photo.addEventListener('error', showFallback);
  if (photo.complete && !photo.naturalWidth) showFallback();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        section.classList.add('is-entering');
        observer.disconnect();
      }
    }, {threshold: .12});
    observer.observe(section);
  }
})();
