/* Original image-switch and profile implementation. No third-party runtime. */
(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.staff-card')];
  const status = document.querySelector('#staff-status');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const controllers = [];

  for (const card of cards) {
    const button = card.querySelector('.portrait');
    const photo = card.querySelector('.portrait__photo');
    const art = card.querySelector('.portrait__art');
    const hint = card.querySelector('.portrait__hint-text');
    const name = card.querySelector('h3').textContent;
    let ready = false, hovered = false, pinned = false, busy = null;
    let artFailed = false, start = null, dragged = false;

    function render() {
      const showing = ready && (hovered || pinned || artFailed);
      button.classList.toggle('is-photo', showing);
      button.setAttribute('aria-pressed', String(showing));
      hint.textContent = showing ? 'イラストに戻す' : '写真を見る';
      if (artFailed) {
        button.disabled = true;
        hint.textContent = '写真';
      }
    }
    function loadPhoto() {
      if (ready) return Promise.resolve(true);
      if (busy) return busy;
      // Keep the illustrated layer in place until decode succeeds. A failed load
      // is retryable on the next intentional activation.
      busy = (async () => {
        try {
          photo.src = photo.dataset.src;
          await photo.decode();
          if (!photo.naturalWidth) throw new Error('No photo pixels');
          ready = true;
          render();
          return true;
        } catch {
          return false;
        } finally {
          busy = null;
        }
      })();
      return busy;
    }
    button.addEventListener('pointerenter', event => {
      if (!hover.matches || event.pointerType === 'touch') return;
      hovered = true;
      loadPhoto().then(render);
    });
    button.addEventListener('pointerleave', () => { hovered = false; render(); });
    button.addEventListener('pointerdown', event => {
      start = {x:event.clientX,y:event.clientY};
      dragged = false;
    });
    button.addEventListener('pointermove', event => {
      if (start && Math.hypot(event.clientX-start.x,event.clientY-start.y)>10) dragged = true;
    });
    button.addEventListener('pointercancel', () => { dragged = true; start = null; });
    button.addEventListener('pointerup', () => { start = null; });
    button.addEventListener('click', async event => {
      if (dragged && event.detail !== 0) { dragged = false; return; }
      pinned = !(pinned || (ready && hovered));
      // A second tap/click returns to the illustration even if a mouse remains
      // over the frame. The next pointer entry can preview the photograph again.
      if (!pinned) hovered = false;
      const wantsPhoto = pinned;
      const loaded = await loadPhoto();
      if (!loaded && wantsPhoto) {
        pinned = false;
        status.textContent = name + 'の写真を読み込めませんでした。もう一度お試しください。';
      }
      render();
    });
    art.addEventListener('error', () => {
      artFailed = true;
      loadPhoto().then(loaded => {
        if (!loaded) status.textContent = name + 'の画像を読み込めませんでした。プロフィールの内容はご覧いただけます。';
        render();
      });
    });
    if (art.complete && !art.naturalWidth) {
      artFailed = true;
      loadPhoto().then(render);
    }
    button.disabled = false;
    const controller = {card,load:loadPhoto,reset:()=>{pinned=false;hovered=false;render();}};
    controllers.push(controller);
  }
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        controllers.find(x=>x.card===entry.target)?.load();
        near.unobserve(entry.target);
      }
    }, {rootMargin:'300px'});
    cards.forEach(card=>near.observe(card));
  }
  hover.addEventListener('change', () => controllers.forEach(x=>x.reset()));

  const filterGroup = document.querySelector('.role-filters');
  const filterButtons = [...filterGroup.querySelectorAll('button')];
  const filterTitle = document.querySelector('#filter-title');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    const selected = button.dataset.filter;
    let count = 0;
    controllers.forEach(controller => {
      controller.reset();
      const shown = selected==='all'||controller.card.dataset.category===selected;
      controller.card.hidden = !shown;
      if (shown) { count++; if (!('IntersectionObserver' in window)) controller.load(); }
    });
    const label = selected==='all'?'すべて':button.textContent.trim();
    filterTitle.textContent = label+'のスタッフ';
    status.textContent = label+'のスタッフを'+count+'名表示しています。';
  }));
  filterGroup.hidden = false;

  const dialog = document.querySelector('.profile-dialog');
  const dialogContent = dialog.querySelector('.dialog-content');
  const close = dialog.querySelector('.dialog-close');
  let returnTo = null;
  if (typeof dialog.showModal === 'function') {
    document.querySelectorAll('.profile').forEach(details => {
      const trigger = details.querySelector('summary');
      trigger.setAttribute('role','button');
      trigger.setAttribute('aria-haspopup','dialog');
      trigger.addEventListener('click', event => {
        event.preventDefault();
        returnTo = trigger;
        const content = details.querySelector('.profile__content').cloneNode(true);
        content.querySelector('.profile__name').id = 'dialog-title';
        content.querySelector('img').loading = 'eager';
        dialogContent.replaceChildren(content);
        dialog.showModal();
        document.body.classList.add('dialog-open');
        dialog.scrollTop = 0;
        close.focus();
      });
    });
    close.addEventListener('click', () => dialog.close());
    // Require both pointerdown and click on the backdrop; dragging out of the
    // dialog must not close it accidentally.
    let backdropStart = false;
    const outside = event => {
      const box = dialog.getBoundingClientRect();
      return event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom;
    };
    dialog.addEventListener('pointerdown', event => {backdropStart=event.target===dialog&&outside(event);});
    dialog.addEventListener('click', event => {
      if (backdropStart&&event.target===dialog&&outside(event)) dialog.close();
      backdropStart=false;
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      dialogContent.replaceChildren();
      returnTo?.focus({preventScroll:true});
    });
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-menu');
  function closeMenu(restoreFocus=false) {
    menu.hidden=true;
    menuToggle.setAttribute('aria-expanded','false');
    menuToggle.setAttribute('aria-label','メニューを開く');
    if (restoreFocus) menuToggle.focus();
  }
  menuToggle.hidden=false;
  menuToggle.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden=!open;
    menuToggle.setAttribute('aria-expanded',String(open));
    menuToggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
  });
  menu.addEventListener('click', event => {if(event.target.closest('a')) closeMenu();});
  document.addEventListener('keydown', event => {if(event.key==='Escape'&&!menu.hidden) closeMenu(true);});
  document.addEventListener('click', event => {
    if (!menu.hidden&&!menu.contains(event.target)&&!menuToggle.contains(event.target)) closeMenu();
  });
  document.documentElement.dataset.enhanced='true';
})();
