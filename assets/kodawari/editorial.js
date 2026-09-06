(() => {
  'use strict';
  // Content is readable without JavaScript. Enhance only after all targets exist.
  const tabs = [...document.querySelectorAll('[data-spec]')];
  const panels = [...document.querySelectorAll('[data-spec-panel]')];
  const tablist = document.querySelector('[data-spec-tabs]');
  if (tablist && tabs.length === panels.length && tabs.length) {
    tablist.classList.add('is-interactive');
    tablist.setAttribute('role', 'tablist');
    tabs.forEach((tab, index) => {
      tab.id = `spec-tab-${tab.dataset.spec}`;
      tab.setAttribute('role', 'tab');
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', tab.id);
      panels[index].tabIndex = 0;
    });
    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus({preventScroll: true});
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); select(next, true); }
      });
    });
    select(0);
  }

  const pins = [...document.querySelectorAll('[data-point]')];
  const points = [...document.querySelectorAll('[data-point-copy]')];
  if (pins.length && pins.every(pin => points.some(point => point.dataset.pointCopy === pin.dataset.point))) {
    document.querySelector('.plan-pins').classList.add('is-interactive');
    const selectPoint = key => {
      pins.forEach(pin => pin.setAttribute('aria-pressed', String(pin.dataset.point === key)));
      points.forEach(point => { point.hidden = point.dataset.pointCopy !== key; });
    };
    pins.forEach(pin => pin.addEventListener('click', () => selectPoint(pin.dataset.point)));
    selectPoint(pins[0].dataset.point);
  }

  const links = [...document.querySelectorAll('.koda-nav a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let scheduled = false;
  const updateChapter = () => {
    const offset = window.innerWidth < 768 ? 145 : 168;
    let active = 0;
    sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= offset) active = i; });
    links.forEach((link, i) => {
      if (i === active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateChapter); }
  }, {passive: true});
  window.addEventListener('resize', updateChapter, {passive: true});
  updateChapter();

  const menu = document.getElementById('hdMenu');
  const burger = document.getElementById('hdBurger');
  const closeButton = document.getElementById('hdMenuClose');
  if (menu && burger && closeButton) {
    let returnFocus;
    const pageRegions = [document.querySelector('header.hd'), document.querySelector('section.fvs'), document.querySelector('main.koda'), document.querySelector('.koda-footer')].filter(Boolean);
    menu.inert = true;
    // Keep this preview's chapter links on the preview instead of the legacy page.
    menu.querySelectorAll('a').forEach(link => {
      const raw = link.getAttribute('href');
      if (/^kodawari\.html#/.test(raw)) link.setAttribute('href', raw.replace('kodawari.html', ''));
      else if (raw === 'kodawari.html') link.setAttribute('href', '#price');
      else if (raw === 'lots.html') link.setAttribute('href', 'lots-preview.html?view=list');
      if (link.textContent.trim() === '間取り・花風京') link.textContent = '商品ラインナップ';
    });
    const closeMenu = () => {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      menu.inert = true;
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      pageRegions.forEach(region => { region.inert = false; });
      returnFocus?.focus({preventScroll: true});
    };
    burger.addEventListener('click', () => {
      // Safari does not focus buttons on pointer click; always return to the trigger.
      returnFocus = burger;
      menu.inert = false;
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      pageRegions.forEach(region => { region.inert = true; });
      document.body.classList.add('is-locked');
      closeButton.focus({preventScroll: true});
    });
    closeButton.addEventListener('click', closeMenu);
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
      if (event.key !== 'Tab') return;
      const focusable = [...menu.querySelectorAll('a[href],button:not([disabled])')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  }
})();
