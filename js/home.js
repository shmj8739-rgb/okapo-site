/* Top-page enhancement. Runs at the end of the body, without waiting for
   DOMContentLoaded or the independent Firebase module downloads. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.addEventListener('error', event => {
    if (event.target instanceof HTMLScriptElement && event.target.src.endsWith('/js/future-okapo.js')) {
      const state = document.getElementById('future-state');
      if (state) { state.hidden = false; state.textContent = '挑戦リストを読み込めませんでした。時間をおいて再度お試しください。'; }
    }
  }, true);
  const header = document.querySelector('.lab-header');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('lab-nav');
  if (header && menu && nav) {
    header.classList.add('is-enhanced');
    menu.hidden = false;
    const close = () => { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => { if (event.target.closest('a, #calendar-menu')) close(); });
    header.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { close(); menu.focus(); }
    });
    document.addEventListener('click', event => { if (!header.contains(event.target)) close(); });
    window.matchMedia('(max-width: 850px)').addEventListener('change', close);
  }

  const calendarMenu = document.getElementById('calendar-menu');
  const calendarPanel = document.getElementById('calendar-panel');
  if (calendarMenu && calendarPanel) {
    const openCalendar = () => {
      if (!calendarPanel.open) calendarPanel.showModal();
      calendarMenu.setAttribute('aria-expanded', 'true');
    };
    calendarMenu.addEventListener('click', openCalendar);
    document.getElementById('calendar-panel-close').addEventListener('click', () => calendarPanel.close());
    calendarPanel.addEventListener('click', event => {
      if (event.target !== calendarPanel) return;
      const rect = calendarPanel.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) calendarPanel.close();
    });
    calendarPanel.addEventListener('close', () => {
      calendarMenu.setAttribute('aria-expanded', 'false');
      const mobile = window.matchMedia('(max-width: 850px)').matches;
      (mobile ? menu : calendarMenu).focus();
    });
    // Preserve existing links pointing directly to the calendar anchor.
    const followCalendarHash = () => { if (location.hash === '#anniversary-calendar') openCalendar(); };
    window.addEventListener('hashchange', followCalendarHash);
    followCalendarHash();
  }

  const completed = document.getElementById('completed-disclosure');
  if (completed) {
    const summary = completed.querySelector('summary');
    completed.addEventListener('toggle', () => summary.setAttribute('aria-expanded', String(completed.open)));
  }

  const viewer = document.querySelector('.member-viewer');
  if (viewer) {
    const slides = [...viewer.querySelectorAll('.member-slide')];
    const buttons = [...viewer.querySelectorAll('[data-member-index]')];
    const names = slides.map(slide => slide.querySelector('h3').textContent);
    const status = document.getElementById('member-status');
    let selected = 0;
    function select(index) {
      selected = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== selected; });
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
      status.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')} — ${names[selected]}`;
    }
    buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
    document.getElementById('member-prev').addEventListener('click', () => select(selected - 1));
    document.getElementById('member-next').addEventListener('click', () => select(selected + 1));
    viewer.addEventListener('keydown', event => {
      let index;
      if (event.key === 'ArrowLeft') index = selected - 1;
      if (event.key === 'ArrowRight') index = selected + 1;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = slides.length - 1;
      if (index === undefined) return;
      event.preventDefault();
      select(index);
      if (event.target.matches('[data-member-index]')) buttons[selected].focus();
    });
    let start = null;
    const surface = viewer.querySelector('.member-slides');
    surface.addEventListener('pointerdown', event => {
      if (event.isPrimary && event.pointerType !== 'mouse') start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    });
    surface.addEventListener('pointerup', event => {
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) select(selected + (dx < 0 ? 1 : -1));
    });
    surface.addEventListener('pointercancel', () => { start = null; });
    select(0);
    viewer.classList.add('is-enhanced');
    viewer.querySelector('.member-tabs').hidden = false;
    viewer.querySelector('.member-controls').hidden = false;
  }

  // Content is visible by default. A failed or slow observer can never hide it.
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('lab-enter');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    document.querySelectorAll('.lab-section-head, .content-card, .news-list > a').forEach(el => observer.observe(el));
  }

  const video = document.getElementById('hero-movie');
  const toggle = document.getElementById('movie-toggle');
  if (!video || !toggle || video.dataset.videoEnabled !== 'true') return;
  let visible = true;
  let requested = false;
  let manuallyPaused = false;
  let manualPlayback = false;
  let failed = false;
  const connection = navigator.connection;
  const shouldAutoPlay = () => !motion.matches && !connection?.saveData;
  const label = () => { toggle.textContent = video.paused ? '映像を再生' : '映像を一時停止'; };
  const play = () => {
    if (failed || !visible || document.hidden) return;
    if (!requested) { video.src = video.dataset.src; video.muted = true; requested = true; }
    const result = video.play();
    if (result) result.catch(() => { video.classList.remove('is-playing'); label(); });
  };
  const sync = () => {
    if (document.hidden || !visible || manuallyPaused || (!manualPlayback && !shouldAutoPlay())) video.pause();
    else play();
  };
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    if (video.paused) { manuallyPaused = false; manualPlayback = true; play(); }
    else { manuallyPaused = true; video.pause(); }
  });
  video.addEventListener('playing', () => { video.classList.add('is-playing'); label(); });
  video.addEventListener('pause', label);
  video.addEventListener('error', () => { failed = true; video.classList.remove('is-playing'); toggle.hidden = true; });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => { manualPlayback = false; sync(); });
  connection?.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (requested) sync(); });
    observer.observe(document.getElementById('hero'));
  }
  // Let the lightweight static hero paint first; preload remains none until here.
  window.setTimeout(sync, 1400);
})();
