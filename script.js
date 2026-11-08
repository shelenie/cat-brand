(() => {
  // Після перезавантаження завжди починаємо з верху сайту
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  const toStart = () => scrollTo({ top: 0, behavior: 'instant' });
  toStart();
  addEventListener('pageshow', toStart, { once: true });

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
  let turn = 0, eyeX = 0, petting = false, lastPet = 0;

  /* ---------- Головний цикл ---------- */
  function frame(now) {
    // Голова нерухома. Зіниці ходять лише вліво-вправо; на телефоні кіт сам повільно озирається.
    const x = pointer.seen ? toSvg(pointer.x, pointer.y).x : 695 + Math.sin(now / 1700) * 500;
    const dx = x - 695;
    eyeX += (Math.sign(dx) * 5.5 * Math.min(1, Math.abs(dx) / 340) - eyeX) * 0.12;
    pupils.forEach((el) => el.setAttribute('transform', 'translate(' + eyeX.toFixed(2) + ' 0)'));

    // Стрілка в колі дивиться на курсор
    if (pointer.seen) {
      const r = spin.getBoundingClientRect();
      if (r.width) {
        const want = Math.atan2(pointer.y - r.top - r.height / 2, pointer.x - r.left - r.width / 2) * 180 / Math.PI;
        turn += (((want - turn + 540) % 360) - 180) * 0.14;
        arrow.style.setProperty('--turn', turn.toFixed(1) + 'deg');
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
  }, { passive: true });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.documentElement.style.cursor = 'none';
    const style = document.createElement('style');
    style.textContent = '*{cursor:none !important}';
    document.head.append(style);
    (function follow() {
      ringPos.x += (pointer.x - ringPos.x) * 0.16;
      ringPos.y += (pointer.y - ringPos.y) * 0.16;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
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
  let coverQueued = false;
  function cover() {
    coverQueued = false;
    const p = Math.max(0, Math.min(1, 1 - work.getBoundingClientRect().top / innerHeight));
    work.style.setProperty('--cover', p.toFixed(3));
  }
  addEventListener('scroll', () => { if (!coverQueued) { coverQueued = true; requestAnimationFrame(cover); } }, { passive: true });
  addEventListener('resize', cover);
  cover();

  let c = 0;
  const label = workTitle.textContent;
  workTitle.setAttribute('aria-label', label);
  workTitle.innerHTML = label.split(' ').map((w) => '<span class="w" aria-hidden="true">' + [...w].map((l) => '<span class="c" style="--c:' + (c++) + '">' + l + '</span>').join('') + '</span>').join(' ');
  if ('IntersectionObserver' in window) {
    if (!calm) { workGrid.classList.add('anim'); workTitle.classList.add('is-split'); }
    const showOnce = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      showOnce.unobserve(e.target);
    }), { threshold: 0.15 });
    showOnce.observe(workTitle);
    cases.forEach((el, i) => { el.style.setProperty('--n', i); showOnce.observe(el); });
    // Сцени рухаються, лише коли картку видно
    const liveArt = new IntersectionObserver((entries) => entries.forEach((e) => {
      e.target.classList.toggle('live', e.isIntersecting);
    }));
    cases.forEach((el) => liveArt.observe(el));
  } else cases.forEach((el) => el.classList.add('live'));

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
