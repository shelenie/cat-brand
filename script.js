(() => {
  const $ = (id) => document.getElementById(id);
  const svg = $('cat'), panel = $('panel');
  const bubble = $('bubble'), title = $('title'), lead = $('lead');
  const pupils = [$('pupilL'), $('pupilR')];
  const meter = $('meter'), meterTitle = $('meterTitle'), meterSub = $('meterSub'), meterFill = $('meterFill');
  const METER = [
    ['Терпець урвався', 'кнопка зліва. Він почекає'],
    ['Терпець кота', 'останнє попередження'],
    ['Терпець кота', 'вносить вас у CRM'],
    ['Терпець кота', 'дивиться косо'],
    ['Терпець кота', 'уже щось помітив'],
    ['Терпець кота', 'ще є. Можете перевірити'],
  ];
  function showMeter([t, s], left, level, hit) {
    meter.classList.add('swap');
    setTimeout(() => { meterTitle.textContent = t; meterSub.textContent = s; meter.classList.remove('swap'); }, calm ? 0 : 200);
    meterFill.style.setProperty('--left', left);
    meter.dataset.level = level;
    if (hit && !calm) { meter.classList.remove('hit'); void meter.offsetWidth; meter.classList.add('hit'); }
  }
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COPY = {
    play: ['Кота<br>не чіпати.', 'Він керівник відділу автоматизації і зараз дуже зайнятий. Будь ласка, просто пройдіть повз.', 'Гаразд, до діла'],
    ready: ['Ну все.<br>Досить.', 'Кіт витратив на вас увесь робочий день. Перейдемо до діла?', 'Гаразд, до діла'],
    work: ['Спочатку задача.<br>Потім рішення.', 'Допомагаю бізнесу налагоджувати процеси за допомогою автоматизації, інтеграцій, AI та веброзробки. Підбираю інструменти під конкретну потребу.', 'Дивитися роботи'],
  };
  const LINES = {
    head: ['Я бачив.', 'Це було гладження без погодження.', 'Оформіть заявку.', 'Ще раз, і я внесу це в CRM.'],
    nose: ['Це ніс. Не кнопка.', 'Кнопка зліва.', 'Ніс не інтегрується.'],
    ear: ['Вухо на техобслуговуванні.', 'Вуха приймають лише webhooks.'],
    sweater: ['Не чіпайте светр. Він корпоративний.', 'Светр не входить у вартість проєкту.'],
    ready: ['Кнопка зліва. Я почекаю.', 'Я сказав: досить.', 'У мене дедлайн.'],
    work: ['Слухаю. Яка задача?', 'Робочі години. Гладження за графіком.', 'Заявку прийнято. Ні.'],
    idle: ['Ви ще тут?', 'Я все бачу.', 'Можна й погортати сайт.'],
  };
  const used = {};
  const pick = (k) => {
    const list = LINES[k], i = (used[k] = (used[k] ?? -1) + 1) % list.length;
    return list[i];
  };

  let state = 'play', patience = 5, lastTouch = performance.now();

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
    }, calm ? 0 : 220);
    state = next;
    if (next === 'work') showMeter(['Терпець відновлено', 'кіт на робочому місці'], 1, 'ok', false);
  }
  function touchCat(zone) {
    lastTouch = performance.now();
    if (state === 'work') return say(pick('work'));
    if (state === 'ready') return say(pick('ready'));
    patience = Math.max(0, patience - 1);
    showMeter(METER[patience], patience / 5, patience <= 1 ? 'low' : 'ok', true);
    if (patience === 0) {
      setCopy('ready');
      say('Усе. Терпець закінчився.', 3600);
    } else {
      say(pick(zone));
    }
  }
  function goToWork(scroll = true) {
    if (state === 'work') {
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
  document.querySelector('[data-zone="head"]').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); touchCat('head'); }
  });

  // Якщо людина прогорнула сайт без гри, хіро вже діловий, коли вона повернеться.
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting && state !== 'work') goToWork(false);
  }, { threshold: 0.12 }).observe(panel);

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
  let eyeX = 0;

  /* ---------- Головний цикл ---------- */
  function frame(now) {
    // Голова нерухома. Зіниці ходять лише вліво-вправо; на телефоні кіт сам повільно озирається.
    const x = pointer.seen ? toSvg(pointer.x, pointer.y).x : 695 + Math.sin(now / 1700) * 500;
    const dx = x - 695;
    eyeX += (Math.sign(dx) * 5.5 * Math.min(1, Math.abs(dx) / 340) - eyeX) * 0.12;
    pupils.forEach((el) => el.setAttribute('transform', 'translate(' + eyeX.toFixed(2) + ' 0)'));

    if (state !== 'work' && now - lastTouch > 11000 && scrollY < 200) { lastTouch = now; say(pick('idle')); }
    requestAnimationFrame(frame);
  }

  /* ---------- Вказівник і кільце ---------- */
  const cursor = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor__dot'), ring = document.querySelector('.cursor__ring');
  const ringPos = { x: pointer.x, y: pointer.y };
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
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

  addEventListener('resize', placeBubble);
  placeBubble();
  setTimeout(() => say('Я працюю.', 3000), 1200);
  requestAnimationFrame(frame);
})();
