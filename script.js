(() => {
  // Після перезавантаження лишаємось там, де були; новий візит починається згори
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const navType = (performance.getEntriesByType('navigation')[0] || {}).type;
  let savedY = null;
  try { savedY = navType === 'reload' ? Number(sessionStorage.getItem('scrollY')) : null; } catch (e) {}
  const restoreY = () => { if (savedY) scrollTo({ top: savedY, behavior: 'instant' }); };
  restoreY();
  addEventListener('load', restoreY, { once: true });
  addEventListener('pagehide', () => { try { sessionStorage.setItem('scrollY', String(scrollY)); } catch (e) {} });

  const $ = (id) => document.getElementById(id);
  const svg = $('cat'), panel = $('panel'), spin = $('spin'), arrow = $('spinArrow'), spinText = $('spinText');
  const bubble = $('bubble'), title = $('title'), lead = $('lead');
  const pupils = [$('pupilL'), $('pupilR')];
  const meter = $('meter'), meterTitle = $('meterTitle'), meterSub = $('meterSub'), meterFill = $('meterFill');
  const MAX = 10; // по дві поділки на кожну фразу
  const METER = [
    ['Терпець урвався', 'кнопка зліва. Він почекає'],
    ['Терпець кота', 'останнє попередження'],
    ['Терпець кота', 'вносить вас у CRM'],
    ['Терпець кота', 'дивиться косо'],
    ['Терпець кота', 'уже щось помітив'],
    ['Терпець кота', 'ще є. Можете перевірити'],
  ];
  function showMeter([t, s], left, level, hit) {
    if (meterTitle.textContent !== t || meterSub.textContent !== s) {
      meter.classList.add('swap');
      setTimeout(() => { meterTitle.textContent = t; meterSub.textContent = s; meter.classList.remove('swap'); }, calm ? 0 : 200);
    }
    meterFill.style.setProperty('--left', left);
    meter.dataset.level = level;
    if (hit && !calm) { meter.classList.remove('hit'); void meter.offsetWidth; meter.classList.add('hit'); }
  }
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COPY = {
    play: ['Кота<br>не<br>чіпати.', 'Він керівник відділу автоматизації і зараз дуже зайнятий. Будь ласка, просто пройдіть повз.', 'Гаразд, до діла'],
    ready: ['Ну все.<br>Досить.', 'Кіт витратив на вас увесь робочий день. Перейдемо до діла?', 'Гаразд, до діла'],
    work: ['Спочатку задача.<br>Потім рішення.', 'Допомагаю бізнесу налагоджувати процеси за допомогою автоматизації, інтеграцій, AI та веброзробки. Підбираю інструменти під конкретну потребу.', 'Дивитися роботи'],
  };
  const LINES = {
    head: ['Я бачив.', 'Це було гладження без погодження.', 'Оформіть заявку.', 'Ще раз, і я внесу це в CRM.', 'Погладили. Виставляю рахунок.', 'Моя голова не в скоупі.', 'Доступ до голови тільки через адміна.', 'Це порушення SLA.', 'Фіксую інцидент.', 'Руки. Геть.'],
    nose: ['Це ніс. Не кнопка.', 'Кнопка зліва.', 'Ніс не інтегрується.', 'Ніс не приймає POST-запити.', 'Натискання на ніс не тестувалось.', 'Ніс у продакшені. Не чіпати.', 'Це не тачпад.'],
    ear: ['Вухо на техобслуговуванні.', 'Вуха приймають лише webhooks.', 'Чую все. Реагувати не буду.', 'Вухо працює в режимі read-only.', 'Вуха не синхронізуються.', 'Це антена. Вона зайнята.'],
    sweater: ['Не чіпайте светр. Він корпоративний.', 'Светр не входить у вартість проєкту.', 'Це мерч. Він не продається.', 'Светр на гарантії.', "Ручне в'язання. Руки прибрали.", 'Светр оновлень не потребує.'],
    empty: ['Промазали. Кіт тут.', 'Тут порожньо. Як у вашому беклозі.', 'Клік записано. Навіщо, невідомо.', 'Це фон. Він теж на роботі.', 'Кіт усе бачить.', 'Тут міг бути ваш бриф.', 'Наступного разу цільтесь.', 'Порожнє місце теж має KPI.', 'Там нічого не інтегровано.', 'Ще один клік у нікуди. Записую.', 'Цей піксель нічого вам не винен.'],
    ready: ['Кнопка зліва. Я почекаю.', 'Я сказав: досить.', 'У мене дедлайн.', 'Терпець у відпустці.', 'Обговорення закрито.', 'Наступне вікно через квартал.', 'Кнопка досі зліва.'],
    work: ['Слухаю. Яка задача?', 'Робочі години. Гладження за графіком.', 'Заявку прийнято. Ні.', 'Це не та задача.', 'Спершу бриф, потім кіт.', 'Я на дзвінку.', 'Поставте задачу в таск-трекер.', 'Кіт зайнятий логікою.'],
    idle: ['Ви ще тут?', 'Я все бачу.', 'Можна й погортати сайт.', 'Тиша підозріла.', 'Скрол не кусається.', 'Кіт ще не пішов.', 'Чекаю на дії. Без поспіху.', 'Ви думаєте? Кіт теж.'],
  };
  // Кожна репліка звучить один раз, поки не закінчаться всі в її групі
  const said = new Set();
  const pick = (k) => {
    let left = LINES[k].filter((l) => !said.has(l));
    if (!left.length) { LINES[k].forEach((l) => said.delete(l)); left = LINES[k]; }
    const line = left[Math.floor(Math.random() * left.length)];
    said.add(line);
    return line;
  };

  let state = 'play', patience = MAX, lastTouch = performance.now();

  /* ---------- Репліки й реакції ---------- */
  let bubbleTimer;
  function say(text, ms = 2600) {
    bubble.textContent = text;
    bubble.classList.add('on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('on'), ms);
  }
  function setCopy(next) {
    const [h, l, btn] = COPY[next];
    title.classList.add('swap'); lead.classList.add('swap');
    setTimeout(() => {
      document.body.dataset.state = next;
      title.innerHTML = h; lead.textContent = l; $('toWorkLabel').textContent = btn;
      title.classList.remove('swap'); lead.classList.remove('swap');
      placeSpin();
    }, calm ? 0 : 220);
    state = next;
    if (next === 'work') refill();
  }
  function refill() {
    patience = MAX;
    showMeter(['Терпець відновлено', 'кіт на робочому місці'], 1, 'ok', false);
  }
  function touchCat(zone) {
    lastTouch = performance.now();
    if (patience > 0) {
      patience -= 1;
      showMeter(METER[Math.ceil(patience / 2)], patience / MAX, patience <= 2 ? 'low' : 'ok', true);
    }
    if (patience === 0 && state === 'play') {
      setCopy('ready');
      return say('Усе. Терпець закінчився.', 3600);
    }
    if (state === 'ready') return say(pick('ready'));
    if (state === 'work') return say(patience === 0 ? 'Усе. Терпець закінчився.' : pick('work'));
    say(pick(zone));
  }
  function goToWork(scroll = true) {
    if (state === 'work') {
      if (patience < MAX) refill();
      if (scroll) $('work').scrollIntoView();
      return;
    }
    setCopy('work');
    say('Так. Слухаю.', 2200);
    if (scroll) setTimeout(() => $('directions').scrollIntoView(), calm ? 0 : 1700);
  }
  $('toWork').addEventListener('click', () => goToWork());
  $('spin').addEventListener('click', () => goToWork());

  document.querySelectorAll('#zones > *').forEach((z) => z.addEventListener('click', () => touchCat(z.dataset.zone)));
  // Клік повз кота теж не лишається без відповіді
  svg.addEventListener('click', (e) => { if (!e.target.closest('#zones > *')) touchCat('empty'); });
  document.querySelector('[data-zone="head"]').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); touchCat('head'); }
  });


  /* ---------- Координати ---------- */
  const toSvg = (cx, cy) => {
    const p = new DOMPoint(cx, cy).matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  };
  const toScreen = (x, y) => new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());

  function placeBubble() {
    if (innerWidth <= 900) return;
    const p = toScreen(905, 165), r = panel.getBoundingClientRect();
    bubble.style.left = Math.min(p.x - r.left, r.width - 290) + 'px';
    bubble.style.top = Math.max(p.y - r.top, 84) + 'px';
  }

  /* ---------- Куди дивиться кіт ---------- */
  const pointer = { x: innerWidth * 0.3, y: innerHeight * 0.4, seen: false };
  let turn = 0, eyeX = 0, eyeDrawn = '', turnDrawn = '', petting = false, lastPet = 0;

  /* ---------- Головний цикл ---------- */
  function frame(now) {
    // Голова нерухома. Зіниці ходять лише вліво-вправо; на телефоні кіт сам повільно озирається.
    const x = pointer.seen ? toSvg(pointer.x, pointer.y).x : 695 + Math.sin(now / 1700) * 500;
    const dx = x - 695;
    eyeX += (Math.sign(dx) * 5.5 * Math.min(1, Math.abs(dx) / 340) - eyeX) * 0.12;
    const eyeNow = eyeX.toFixed(1);
    if (eyeNow !== eyeDrawn) {
      eyeDrawn = eyeNow;
      pupils.forEach((el) => el.setAttribute('transform', 'translate(' + eyeNow + ' 0)'));
    }

    // Стрілка в колі дивиться на курсор
    if (pointer.seen) {
      const r = spin.getBoundingClientRect();
      if (r.width) {
        const want = Math.atan2(pointer.y - r.top - r.height / 2, pointer.x - r.left - r.width / 2) * 180 / Math.PI;
        turn += (((want - turn + 540) % 360) - 180) * 0.14;
        const turnNow = turn.toFixed(1);
        if (turnNow !== turnDrawn) { turnDrawn = turnNow; arrow.style.setProperty('--turn', turnNow + 'deg'); }
      }
    }

    // Курсор на коті теж вважається гладженням
    if (!petting) lastPet = now;
    else if (patience > 0 && now - lastPet > 4000) { lastPet = now; touchCat('head'); }

    if (state !== 'work' && now - lastTouch > 11000 && scrollY < 200) { lastTouch = now; say(pick('idle')); }
    requestAnimationFrame(frame);
  }

  /* ---------- Вказівник і кільце ---------- */
  const cursor = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor__dot'), ring = document.querySelector('.cursor__ring');
  const ringPos = { x: pointer.x, y: pointer.y };
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
    petting = e.pointerType === 'mouse' && !!e.target.closest?.('#zones > *');
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cursor.classList.toggle('big', !!e.target.closest?.('a, button, #zones > *'));
    cursor.classList.toggle('on-cat', petting);
  }, { passive: true });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.documentElement.style.cursor = 'none';
    const style = document.createElement('style');
    style.textContent = '*{cursor:none !important}';
    document.head.append(style);
    (function follow() {
      ringPos.x += (pointer.x - ringPos.x) * 0.16;
      ringPos.y += (pointer.y - ringPos.y) * 0.16;
      ring.style.translate = `${ringPos.x.toFixed(1)}px ${ringPos.y.toFixed(1)}px`;
      requestAnimationFrame(follow);
    })();
  }

  // Кнопки мають мінімальний розмір, а коло стискається з вікном: не даємо їм зійтись
  function placeSpin() {
    spin.style.setProperty('--push', '0px');
    const r = spin.getBoundingClientRect();
    if (!r.width) return;
    const push = Math.max(0, document.querySelector('.btn--ghost').getBoundingClientRect().right + 12 - r.left);
    spin.style.setProperty('--push', push.toFixed(1) + 'px');
  }
  /* ---------- Кіт коментує напрями ---------- */
  const catNote = $('catNote'), noteDefault = catNote.textContent;
  let noteTimer;
  function setNote(text) {
    if (catNote.textContent === text) return;
    catNote.classList.add('swap');
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { catNote.textContent = text; catNote.classList.remove('swap'); }, calm ? 0 : 160);
  }
  document.querySelectorAll('.dir').forEach((card) => {
    card.addEventListener('mouseenter', () => setNote(card.dataset.cat));
    card.addEventListener('mouseleave', () => setNote(noteDefault));
  });

  /* ---------- Поява карток при скролі ---------- */
  const bento = document.querySelector('.bento');
  if (!calm && 'IntersectionObserver' in window) {
    bento.classList.add('anim');
    const showDir = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        showDir.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    bento.querySelectorAll('.dir').forEach((card, i) => {
      card.style.setProperty('--n', i % 3);
      card.style.setProperty('--r', (i % 2 ? 3 : -3) + 'deg');
      card.querySelectorAll('.tools li').forEach((li, t) => li.style.setProperty('--t', t));
      showDir.observe(card);
    });
  }

  /* ---------- Кнопка «вгору»: з'являється, коли хіро лишилось позаду ---------- */
  const toTop = $('toTop');
  const toggleTop = () => toTop.classList.toggle('is-shown', scrollY > innerHeight * 0.9);
  addEventListener('scroll', toggleTop, { passive: true });
  toggleTop();
  toTop.addEventListener('click', () => scrollTo({ top: 0 }));

  /* ---------- Роботи: заголовок по літерах, поява, нахил ---------- */
  const work = $('work'), workGrid = $('workGrid'), workTitle = $('workTitle');
  const cases = [...workGrid.querySelectorAll('.case')];
  // Паралакс фону: шар рухається повільніше за картки
  const workBg = $('workBg');
  let parallaxQueued = false;
  function parallax() {
    parallaxQueued = false;
    const r = work.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)));
    workBg.style.setProperty('--py', ((p - .5) * .6 * r.height).toFixed(1) + 'px');
  }
  if (!calm) {
    addEventListener('scroll', () => { if (!parallaxQueued) { parallaxQueued = true; requestAnimationFrame(parallax); } }, { passive: true });
    addEventListener('resize', parallax);
    parallax();
  }

  let c = 0;
  const label = workTitle.textContent;
  workTitle.setAttribute('aria-label', label);
  workTitle.innerHTML = label.split(' ').map((w) => '<span class="w" aria-hidden="true">' + [...w.replace(/,$/, '')].map((l) => '<span class="c" style="--c:' + (c++) + '">' + l + '</span>').join('') + '</span>' + (w.endsWith(',') ? '<span aria-hidden="true">,</span>' : '')).join(' ');
  if ('IntersectionObserver' in window) {
    if (!calm) { workGrid.classList.add('anim'); workTitle.classList.add('is-split'); }
    const showOnce = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      showOnce.unobserve(e.target);
    }), { threshold: 0.15 });
    showOnce.observe(workTitle);
    cases.forEach((el, i) => { el.style.setProperty('--n', i); showOnce.observe(el); });
    const steps = document.querySelector('.steps');
    if (!calm) steps.classList.add('anim');
    const stepItems = [...steps.querySelectorAll('li')];
    stepItems.forEach((el, i) => el.style.setProperty('--n', i));
    // Запускаємо, коли картки вже на екрані, а не тільки-но з'явились знизу
    const stepsIn = new IntersectionObserver((entries, o) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      stepItems.forEach((el) => el.classList.add('in'));
      o.disconnect();
    }), { rootMargin: '0px 0px -35% 0px' });
    stepsIn.observe(steps);
    // Кіт коментує кроки
    const procNote = $('procNote'), procDefault = procNote.textContent;
    let procTimer;
    const setProc = (text) => {
      if (procNote.textContent === text) return;
      procNote.classList.add('swap');
      clearTimeout(procTimer);
      procTimer = setTimeout(() => { procNote.textContent = text; procNote.classList.remove('swap'); }, calm ? 0 : 160);
    };
    stepItems.forEach((el) => {
      el.addEventListener('mouseenter', () => setProc(el.dataset.cat));
      el.addEventListener('mouseleave', () => setProc(procDefault));
    });
    // Сцени рухаються, лише коли картку видно
    const liveArt = new IntersectionObserver((entries) => entries.forEach((e) => {
      e.target.classList.toggle('live', e.isIntersecting);
    }));
    cases.forEach((el) => liveArt.observe(el));
  } else cases.forEach((el) => el.classList.add('live'));

  // Роботи: проєкт відкривається на весь екран
  const caseView = $('caseView'), caseViewIn = $('caseViewIn'), caseClose = $('caseClose');
  let openCase = null;
  function fromCard(card) {
    const r = card.getBoundingClientRect();
    return 'translate(' + r.left + 'px, ' + r.top + 'px) scale(' + (r.width / innerWidth) + ', ' + (r.height / innerHeight) + ')';
  }
  function showCase(card) {
    openCase = card;
    caseViewIn.innerHTML = card.innerHTML;
    caseViewIn.querySelectorAll('video').forEach((v) => { v.controls = true; });
    document.documentElement.style.overflow = 'hidden';
    caseView.hidden = false;
    caseView.scrollTop = 0;
    caseClose.focus();
    if (!calm) caseView.animate([{ transform: fromCard(card), opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2, 1, .3, 1)' });
  }
  function hideCase() {
    if (!openCase) return;
    const card = openCase;
    openCase = null;
    const done = () => { caseView.hidden = true; caseViewIn.innerHTML = ''; document.documentElement.style.overflow = ''; card.focus({ preventScroll: true }); };
    if (calm) return done();
    caseView.animate([{ transform: 'none', opacity: 1 }, { transform: fromCard(card), opacity: 0 }], { duration: 280, easing: 'ease-in', fill: 'forwards' }).finished.then((a) => { done(); a.cancel(); });
  }
  cases.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.addEventListener('click', () => showCase(card));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCase(card); } });
  });
  caseClose.addEventListener('click', hideCase);
  caseView.addEventListener('click', (e) => { if (e.target === caseView || e.target === caseViewIn) hideCase(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCase(); });

  /* ---------- Примітки кота прилітають справа ---------- */
  if (!calm && 'IntersectionObserver' in window) {
    const noteHeads = [...document.querySelectorAll('.section__head')].filter((head) => head.querySelector('.note'));
    noteHeads.forEach((head) => head.querySelector('.note').classList.add('fly'));
    // Стежимо за заголовком: сама примітка стартує за межами екрана
    const notesIn = new IntersectionObserver((entries, o) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.querySelector('.note').classList.add('in');
      o.unobserve(e.target);
    }), { rootMargin: '0px 0px -20% 0px' });
    noteHeads.forEach((head) => notesIn.observe(head));
  }

  /* ---------- «Про мене» наїжджає на «Як я працюю» ---------- */
  const stack = $('stack');
  if (stack) {
    const proc = $('process'), about = $('about');
    const wide = matchMedia('(min-width: 901px)');
    let travel = 0;
    function fadeRule() {
      if (!stack.classList.contains('on')) return about.style.removeProperty('--rule');
      const left = about.getBoundingClientRect().top / travel;
      about.style.setProperty('--rule', Math.max(0, Math.min(1, left / .12)).toFixed(3));
    }
    function measureStack() {
      const on = wide.matches;
      if (on) {
        const top = Math.min(0, innerHeight - proc.offsetHeight);
        travel = innerHeight;
        stack.style.setProperty('--proc-top', top + 'px');
        stack.style.setProperty('--d', travel + 'px');
        about.style.setProperty('--d', travel + 'px');
      }
      stack.classList.toggle('on', on);
      fadeRule();
    }
    measureStack();
    new ResizeObserver(measureStack).observe(proc);
    addEventListener('resize', measureStack);
    wide.addEventListener('change', measureStack);
    addEventListener('scroll', () => requestAnimationFrame(fadeRule), { passive: true });
  }

  /* ---------- Кіт визирає з-за фото ---------- */
  const aboutCat = $('aboutCat');
  if (aboutCat && !calm) {
    aboutCat.classList.add('down');
    new IntersectionObserver((entries, o) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      aboutCat.classList.remove('down');
      o.disconnect();
    }), { threshold: .35 }).observe(aboutCat.parentElement);
  }

  /* ---------- Велике слово у футері на всю ширину ---------- */
  const footWord = $('footWord');
  function fitFootWord() {
    footWord.style.fontSize = '100px';
    footWord.style.fontSize = (100 * footWord.parentElement.clientWidth / footWord.getBoundingClientRect().width).toFixed(2) + 'px';
  }
  // Слово показуємо вже в потрібному шрифті й розмірі, висоту блоку задано в CSS
  footWord.style.visibility = 'hidden';
  fitFootWord();
  document.fonts.ready.then(() => {
    fitFootWord();
    footWord.style.visibility = '';
    // Шрифти змінили висоту секцій: повертаємось точно до якоря з адреси
    const anchor = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (anchor) scrollTo({ top: Math.round(anchor.getBoundingClientRect().top + scrollY), behavior: 'instant' });
  });
  addEventListener('resize', fitFootWord);
  // Кнопка «вгору» не заважає великому слову
  new IntersectionObserver(([e]) => toTop.classList.toggle('in-foot', e.isIntersecting)).observe(footWord);

  /* ---------- Меню при прокрутці вгору ---------- */
  const floatBar = document.createElement('div');
  floatBar.className = 'floatbar';
  floatBar.innerHTML = document.querySelector('.top').innerHTML;
  document.body.append(floatBar);
  let lastY = scrollY, navTimer = 0;
  // Після кліку по пункту меню воно ховається і не з'являється, доки триває переїзд
  const waitNav = () => { clearTimeout(navTimer); navTimer = setTimeout(() => { navTimer = 0; lastY = scrollY; }, 200); };
  floatBar.addEventListener('click', (e) => {
    if (!e.target.closest('a[href^="#"]')) return;
    floatBar.classList.remove('show');
    waitNav();
  });
  addEventListener('scroll', () => {
    if (navTimer) { waitNav(); return; }
    const y = scrollY, dy = y - lastY;
    if (Math.abs(dy) < 4) return;
    floatBar.classList.toggle('show', dy < 0 && y > innerHeight * .8);
    lastY = y;
  }, { passive: true });

  /* ---------- «Про мене»: точно на початок секції ---------- */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#about"]');
    if (!link) return;
    e.preventDefault();
    const about = $('about'), target = () => Math.round(about.getBoundingClientRect().top + scrollY);
    scrollTo({ top: target(), behavior: calm ? 'auto' : 'smooth' });
    // Висоти секцій могли змінитися дорогою: доводимо точно
    addEventListener('scrollend', () => {
      if (Math.abs(about.getBoundingClientRect().top) > 1) scrollTo({ top: target(), behavior: 'auto' });
    }, { once: true });
    history.replaceState(null, '', '#about');
  });

  addEventListener('resize', () => { placeBubble(); placeSpin(); });
  placeBubble();
  placeSpin();
  document.fonts.ready.then(placeSpin);
  setTimeout(() => say('Я працюю.', 3000), 1200);
  // Текст рівно на все коло, без розриву
  document.fonts.ready.then(() => {
    const n = spinText.firstElementChild.textContent.length;
    spinText.style.letterSpacing = '0px';
    spinText.style.letterSpacing = ((2 * Math.PI * 52 - spinText.getComputedTextLength()) / n).toFixed(3) + 'px';
  });
  requestAnimationFrame(frame);
})();
