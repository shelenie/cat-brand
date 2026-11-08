(() => {
  const $ = (id) => document.getElementById(id);
  const svg = $('cat'), panel = $('panel'), bubble = $('bubble'), title = $('title'), lead = $('lead');
  const pupils = [$('pupilL'), $('pupilR')];
  const faces = [...document.querySelectorAll('.meter__bars i')];
  const spin = $('spin'), arrow = $('spinArrow'), spinText = $('spinText');
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
  const pick = (k) => LINES[k][(used[k] = (used[k] ?? -1) + 1) % LINES[k].length];

  let state = 'play', patience = 5, lastTouch = performance.now();

  /* ---------- Репліки ---------- */
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
  }
  function touchCat(zone) {
    lastTouch = performance.now();
    if (state === 'work') return say(pick('work'));
    if (state === 'ready') return say(pick('ready'));
    patience = Math.max(0, patience - 1);
    faces.forEach((f, i) => f.classList.toggle('off', i >= patience));
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
    if (scroll) {
      say('Так. Слухаю.', 2200);
      setTimeout(() => $('directions').scrollIntoView(), calm ? 0 : 1500);
    }
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

  /* ---------- Куди дивиться кіт: рухаються лише зіниці ---------- */
  const pointer = { x: innerWidth * 0.3, y: innerHeight * 0.4, seen: false };
  const eye = { x: 0, y: 0 };
  let turn = 0;

  function placeBubble() {
    if (innerWidth <= 900) return;
    const p = new DOMPoint(905, 165).matrixTransform(svg.getScreenCTM()), r = panel.getBoundingClientRect();
    bubble.style.left = Math.min(p.x - r.left, r.width - 290) + 'px';
    bubble.style.top = Math.max(p.y - r.top, 84) + 'px';
  }

  // Текст рівно на все коло, без розриву
  function closeRing() {
    const tp = spinText.firstElementChild, len = 2 * Math.PI * 54, n = tp.textContent.length;
    spinText.style.letterSpacing = '0px';
    spinText.style.letterSpacing = ((len - spinText.getComputedTextLength()) / n).toFixed(3) + 'px';
  }
  document.fonts.ready.then(closeRing);

  function frame(now) {
    let target;
    if (pointer.seen) {
      const p = new DOMPoint(pointer.x, pointer.y).matrixTransform(svg.getScreenCTM().inverse());
      target = { x: p.x, y: p.y };
    } else {
      // На телефоні, поки не торкнулись, кіт сам повільно озирається.
      target = { x: 695 + Math.sin(now / 1700) * 500, y: 340 + Math.cos(now / 2300) * 160 };
    }
    const dx = target.x - 695, dist = Math.abs(dx) || 1;
    const k = Math.min(1, dist / 340);
    eye.x += ((dx / dist) * 5.5 * k - eye.x) * 0.12; // лише вліво-вправо: вниз око відкриває край райдужки
        pupils.forEach((el) => el.setAttribute('transform', `translate(${eye.x.toFixed(2)} ${eye.y.toFixed(2)})`));

    // Стрілка в колі дивиться на курсор
    if (pointer.seen && !calm) {
      const r = spin.getBoundingClientRect();
      if (r.width) {
        const want = Math.atan2(pointer.y - r.top - r.height / 2, pointer.x - r.left - r.width / 2) * 180 / Math.PI + 45;
        turn += (((want - turn + 540) % 360) - 180) * 0.14;
        arrow.style.setProperty('--turn', turn.toFixed(1) + 'deg');
      }
    }

    if (state !== 'work' && now - lastTouch > 11000 && scrollY < 200) { lastTouch = now; say(pick('idle')); }
    requestAnimationFrame(frame);
  }

  /* ---------- Кільце-курсор ---------- */
  const cursor = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor__dot'), ring = document.querySelector('.cursor__ring');
  const ringPos = { x: pointer.x, y: pointer.y };
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cursor.classList.toggle('big', !!e.target.closest?.('a, button, #zones > *'));
  }, { passive: true });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
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
  setTimeout(() => say('Я працюю.', 3000), 1400);
  requestAnimationFrame(frame);
})();
