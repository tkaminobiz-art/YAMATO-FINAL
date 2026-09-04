(() => {
      const hero = document.querySelector('.new-hero');
      if (!hero) return;
      const scenes = [...hero.querySelectorAll('.new-hero__scene')];
      const stories = [...hero.querySelectorAll('.new-hero__story')];
      const chapterButtons = [...hero.querySelectorAll('.new-hero__chapter')];
      const prev = document.getElementById('newHeroPrev');
      const next = document.getElementById('newHeroNext');
      const play = document.getElementById('newHeroPlay');
      const count = document.getElementById('newHeroCount');
      const currentNo = document.getElementById('newHeroCurrent');
      const progress = document.getElementById('newHeroProgress');
      const live = document.getElementById('newHeroLive');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      const interval = 5200;
      const chapterRanges = chapterButtons.map((button, chapterIndex) => {
        const indexes = scenes.reduce((matches, scene, sceneIndex) => {
          if (Number(scene.dataset.chapter) === chapterIndex) matches.push(sceneIndex);
          return matches;
        }, []);
        return { start: indexes[0], end: indexes[indexes.length - 1], length: indexes.length };
      });
      let current = 0;
      let playing = !reduced.matches;
      let visible = false;
      let timer = 0;
      let transitionToken = 0;
      let pointerStart = null;
      let chapterStartsPrepared = false;

      const clearTimer = () => window.clearTimeout(timer);
      const updatePlay = () => {
        play.classList.toggle('is-playing', playing);
        play.setAttribute('aria-label', playing ? '自動切替を停止' : '自動切替を再生');
        play.disabled = reduced.matches;
        play.setAttribute('aria-disabled', String(reduced.matches));
      };
      const schedule = () => {
        clearTimer();
        if (!playing || !visible || document.hidden || reduced.matches) return;
        if (current === scenes.length - 1) {
          playing = false;
          updatePlay();
          return;
        }
        timer = window.setTimeout(() => go(current + 1), current === 0 ? 6000 : interval);
      };

      const prepare = async index => {
        const image = scenes[index].querySelector('img');
        if (!image) return;
        image.loading = 'eager';
        if (!image.complete) {
          await new Promise(resolve => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          });
        }
        if (image.decode) await image.decode().catch(() => {});
      };

      const render = index => {
        current = index;
        const activeChapter = Number(scenes[current].dataset.chapter);
        hero.dataset.chapter = String(activeChapter);
        scenes.forEach((scene, sceneIndex) => scene.classList.toggle('is-active', sceneIndex === current));
        stories.forEach((story, storyIndex) => {
          const active = storyIndex === activeChapter;
          story.classList.toggle('is-active', active);
          story.setAttribute('aria-hidden', String(!active));
        });
        chapterButtons.forEach((button, chapterIndex) => {
          const range = chapterRanges[chapterIndex];
          const active = chapterIndex === activeChapter;
          let amount = 0;
          if (current > range.end) amount = 100;
          else if (current >= range.start) amount = ((current - range.start + 1) / range.length) * 100;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
          button.querySelector('.new-hero__chapter-progress i').style.width = `${amount}%`;
        });
        currentNo.textContent = String(current + 1).padStart(2, '0');
        count.setAttribute('aria-label', `写真 ${current + 1} / ${scenes.length}`);
        progress.style.width = `${((current + 1) / scenes.length) * 100}%`;
        prepare(Math.min(current + 1, scenes.length - 1));
        schedule();
      };

      const go = async (index, manual = false) => {
        const target = (index + scenes.length) % scenes.length;
        if (manual) {
          playing = false;
          updatePlay();
        }
        const token = ++transitionToken;
        await prepare(target);
        if (token !== transitionToken) return;
        render(target);
        if (manual) {
          const chapter = stories[Number(scenes[target].dataset.chapter)];
          const label = chapter.querySelector('.new-hero__kicker').textContent.replace(/\s+/g, ' ').trim();
          live.textContent = `写真 ${target + 1} / ${scenes.length}。${label}`;
        }
      };

      prev.addEventListener('click', () => go(current - 1, true));
      next.addEventListener('click', () => go(current + 1, true));
      chapterButtons.forEach((button, chapterIndex) => {
        button.addEventListener('click', () => go(chapterRanges[chapterIndex].start, true));
      });
      play.addEventListener('click', () => {
        if (reduced.matches) return;
        const restarting = !playing && current === scenes.length - 1;
        playing = !playing;
        updatePlay();
        if (restarting) go(0);
        else schedule();
      });
      hero.addEventListener('pointerdown', event => {
        if (event.target.closest('button, a')) return;
        pointerStart = { x: event.clientX, y: event.clientY };
      }, { passive: true });
      hero.addEventListener('pointerup', event => {
        if (!pointerStart || event.target.closest('button, a')) { pointerStart = null; return; }
        const dx = event.clientX - pointerStart.x;
        const dy = event.clientY - pointerStart.y;
        pointerStart = null;
        if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.25) return;
        go(current + (dx < 0 ? 1 : -1), true);
      }, { passive: true });
      hero.addEventListener('pointercancel', () => { pointerStart = null; }, { passive: true });
      document.addEventListener('visibilitychange', schedule);
      window.addEventListener('pagehide', clearTimer);
      window.addEventListener('pageshow', schedule);
      reduced.addEventListener('change', () => {
        if (reduced.matches) {
          playing = false;
          go(0);
        }
        updatePlay();
        schedule();
      });
      new IntersectionObserver(entries => {
        const ratio = entries[0].intersectionRatio;
        if (ratio >= .35 && !chapterStartsPrepared) {
          chapterStartsPrepared = true;
          chapterRanges.forEach(({ start }) => prepare(start));
        }
        if (ratio >= .65) visible = true;
        if (ratio <= .35) visible = false;
        schedule();
      }, { threshold: [0, .35, .65, 1] }).observe(hero);

      render(0);
      updatePlay();
    })();
