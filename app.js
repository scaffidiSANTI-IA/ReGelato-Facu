'use strict';
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  let journeyTimer = null;
  let messageTimer, toastTimer;
  try {
    paused = localStorage.getItem('circular-motion') === 'off';
  } catch { /* Storage can be unavailable; the entire page remains usable. */ }
  const motionOn = () => !paused && !reduced.matches;
  const motionButton = $('.motion-toggle');
  function applyMotion() {
    const on = motionOn();
    root.dataset.motion = on ? 'on' : 'off';
    motionButton.setAttribute('aria-label', on ? 'Pausar animaciones' : 'Activar animaciones');
    motionButton.title = reduced.matches ? 'Movimiento reducido del sistema activado' : motionButton.getAttribute('aria-label');
    $('use', motionButton).setAttribute('href', on ? '#i-pause' : '#i-play');
    if (!on) stopJourney();
  }
  motionButton.addEventListener('click', () => {
    if (reduced.matches) { showToast('Se respeta la preferencia de movimiento reducido de tu sistema.'); return; }
    paused = !paused;
    try { localStorage.setItem('circular-motion', paused ? 'off' : 'on'); } catch {}
    applyMotion();
    updateScroll();
  });
  reduced.addEventListener('change', applyMotion);
  applyMotion();
  function showToast(text) {
    const el = $('.toast');
    el.textContent = text; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  // Native scrolling, progressive reveals and a small, passive scroll handler.
  if ('IntersectionObserver' in window) {
    root.classList.add('js-ready');
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
      });
    }, { threshold: 0.07 });
    $$('.reveal').forEach(el => reveal.observe(el));
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) $$('#main-nav a').forEach(a => {
          const current = a.hash === '#' + entry.target.id;
          a.classList.toggle('is-current', current);
          current ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-18% 0px -55% 0px' });
    $$('main section[id]').forEach(s => navObserver.observe(s));
  }

  const menu = $('#main-nav');
  const menuToggle = $('.menu-toggle');
  function closeMenu() {
    menu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
  }
  menuToggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('#main-nav a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); menuToggle.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });

  // The four steps can be selected by pointer, touch or arrow keys.
  const journeyStages = [
    { label: '01 / INGREDIENTE APROVECHABLE', text: 'Frutas frescas y maduras, aptas para el consumo, descartadas por razones estéticas o de sobrestock.' },
    { label: '02 / ELABORACIÓN', text: 'La elaboración artesanal transforma las frutas recuperadas. Las pulpas y excedentes pueden reincorporarse en nuevos sabores e infusiones.' },
    { label: '03 / HELADO ARTESANAL', text: 'Helados de alta calidad a partir de fruta recuperada: la propuesta de ReGelato.' },
    { label: '04 / CONSUMIDOR', text: 'El consumidor completa el recorrido. El sistema propuesto de refill permite reutilizar los envases térmicos y volver a recargarlos.' }
  ];
  const stageTabs = $$('.journey-tabs button');
  let selectedStage = 0;
  let journeyTouched = false;
  function selectStage(index) {
    selectedStage = index;
    $('.journey-scene').dataset.stage = String(index);
    $('.scene-label').textContent = journeyStages[index].label;
    $('#stage-panel').textContent = journeyStages[index].text;
    $('#stage-panel').setAttribute('aria-labelledby', 'stage-tab-' + index);
    stageTabs.forEach((button, i) => { button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1; });
  }
  function stopJourney() {
    clearInterval(journeyTimer); journeyTimer = null;
    const btn = $('.play-journey');
    $('span', btn).textContent = 'Ver transformación';
    $('use', btn).setAttribute('href', '#i-play');
  }
  stageTabs.forEach((button, index) => {
    button.addEventListener('click', () => { journeyTouched = true; stopJourney(); selectStage(index); });
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % 4;
      if (event.key === 'ArrowLeft') next = (index + 3) % 4;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = 3;
      if (next !== undefined) { event.preventDefault(); journeyTouched = true; stopJourney(); selectStage(next); stageTabs[next].focus(); }
    });
  });
  $('.play-journey').addEventListener('click', () => {
    journeyTouched = true;
    if (journeyTimer) { stopJourney(); return; }
    if (!motionOn()) { selectStage((selectedStage + 1) % 4); return; }
    selectStage(0);
    $('.play-journey span').textContent = 'Pausar recorrido';
    $('.play-journey use').setAttribute('href', '#i-pause');
    journeyTimer = setInterval(() => { if (selectedStage === 3) stopJourney(); else selectStage(selectedStage + 1); }, 1800);
  });

  const cycleContent = [
    ['01 — Origen local', 'Productores locales y comercios de cercanía como origen de frutas frescas y maduras aptas para el consumo.'],
    ['02 — Aprovechamiento', 'Rescate de frutas imperfectas o de sobrestock, siempre aptas para el consumo.'],
    ['03 — Elaboración artesanal', 'Elaboración de helados de calidad y reincorporación de pulpas sobrantes en nuevos sabores e infusiones.'],
    ['04 — Consumo y recarga', 'Envases térmicos reutilizables de recarga (refill) e insumos 100% compostables como parte del modelo propuesto.']
  ];
  $$('[data-cycle]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.cycle);
    $$('[data-cycle]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $('.cycle-detail strong').textContent = cycleContent[index][0];
    $('.cycle-detail p').textContent = cycleContent[index][1];
  }));

  const impactCopy = [
    ['Impacto económico', 'Recuperar valor también es parte de una mirada circular.'],
    ['Impacto social', 'El vínculo con la comunidad conecta las distintas partes del proyecto.'],
    ['Impacto ambiental', 'Reducir el desperdicio forma parte del objetivo compartido.']
  ];
  const impactButtons = $$('button[data-impact]');
  impactButtons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.impact);
    impactButtons.forEach(b => { const active = Number(b.dataset.impact) === index; b.classList.toggle('is-active', active); b.setAttribute('aria-pressed', String(active)); });
    $('#impact-orbit').dataset.impact = String(index);
    const caption = $('.impact-selected');
    caption.replaceChildren();
    const strong = document.createElement('strong'); strong.textContent = impactCopy[index][0];
    caption.append(strong, document.createElement('br'), document.createTextNode(impactCopy[index][1]));
    if (motionOn()) {
      const icon = $('svg.impact-icon, svg', button);
      if (icon) icon.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-12deg) scale(1.16)' }, { transform: 'rotate(0) scale(1)' }], { duration: 500 });
    }
  }));

  const traveler = $('.traveler-wrap');
  const travelerButton = $('.traveler');
  let scrollQueued = false;
  let lastScroll = window.scrollY;
  function updateScroll() {
    scrollQueued = false;
    const y = window.scrollY;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    $('.reading-progress span').style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / max)) + ')';
    traveler.classList.toggle('is-visible', y > 330);
    traveler.setAttribute('aria-hidden', String(y <= 330));
    travelerButton.tabIndex = y > 330 ? 0 : -1;
    const impact = $('#impacto').getBoundingClientRect();
    const isImpact = impact.top < innerHeight * .65 && impact.bottom > innerHeight * .35;
    traveler.classList.toggle('is-circular', isImpact);
    if (motionOn()) {
      let offset = Math.sin(y / 500) * 45;
      const tilt = Math.max(-12, Math.min(12, (y - lastScroll) * .25));
      traveler.style.transform = 'translateY(' + offset + 'px) rotate(' + tilt + 'deg)';
      // At the triple-impact diagram the companion moves around the connected model.
      const orbit = $('#impact-orbit').getBoundingClientRect();
      const docking = innerWidth > 900 && orbit.top > 130 && orbit.bottom < innerHeight - 30;
      if (docking) {
        const angle = y / 130;
        traveler.style.left = (orbit.left + orbit.width / 2 + Math.cos(angle) * 124 - 28) + 'px';
        traveler.style.top = (orbit.top + orbit.height / 2 + Math.sin(angle) * 105 - 37) + 'px';
        traveler.style.right = 'auto';
        traveler.style.transform = 'scale(.75)';
      } else { traveler.style.left = ''; traveler.style.top = ''; traveler.style.right = ''; }
      if (!journeyTouched) {
        const journeyRect = $('.journey').getBoundingClientRect();
        if (journeyRect.top < innerHeight * .75 && journeyRect.bottom > innerHeight * .25) {
          const progress = (innerHeight * .75 - journeyRect.top) / (journeyRect.height * .8);
          selectStage(Math.min(3, Math.max(0, Math.floor(progress * 4))));
        }
      }
    } else { traveler.style.left = ''; traveler.style.top = ''; traveler.style.right = ''; traveler.style.transform = ''; }
    lastScroll = y;
  }
  window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  window.addEventListener('resize', () => { if (innerWidth > 640) closeMenu(); updateScroll(); }, { passive: true });
  updateScroll();
  travelerButton.addEventListener('click', () => {
    const message = $('.traveler-message');
    message.textContent = traveler.classList.contains('is-circular') ? '¡Todo está conectado!' : '¡Hola! Soy Copito.';
    message.classList.add('show');
    clearTimeout(messageTimer); messageTimer = setTimeout(() => message.classList.remove('show'), 2600);
    if (!motionOn()) return;
    travelerButton.classList.remove('celebrate');
    void travelerButton.offsetWidth;
    travelerButton.classList.add('celebrate');
    setTimeout(() => travelerButton.classList.remove('celebrate'), 850);
    const rect = travelerButton.getBoundingClientRect();
    for (let i = 0; i < 11; i++) {
      const particle = document.createElement('i'); particle.className = 'confetti'; particle.setAttribute('aria-hidden', 'true');
      particle.style.left = rect.left + rect.width / 2 + 'px'; particle.style.top = rect.top + 'px';
      particle.style.background = ['#d4dea7', '#e9b4a5', '#b8b986', '#d9ad70'][i % 4];
      particle.style.setProperty('--dx', (Math.random() * 130 - 75) + 'px');
      particle.style.setProperty('--dy', (Math.random() * 90 - 80) + 'px');
      particle.style.setProperty('--rot', Math.random() * 400 + 'deg');
      document.body.append(particle); setTimeout(() => particle.remove(), 1000);
    }
  });
  const hero = $('.hero-art');
  hero.addEventListener('pointermove', e => {
    if (!motionOn() || e.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--mouse-x', ((e.clientX - rect.left - rect.width / 2) / 35) + 'px');
    hero.style.setProperty('--mouse-y', ((e.clientY - rect.top - rect.height / 2) / 40) + 'px');
  });
  hero.addEventListener('pointerleave', () => { hero.style.setProperty('--mouse-x', '0px'); hero.style.setProperty('--mouse-y', '0px'); });

  document.addEventListener('visibilitychange', () => { if (document.hidden) stopJourney(); });
})();
