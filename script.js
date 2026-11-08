(() => {
  const $ = (id) => document.getElementById(id);
  const svg = $('cat'), panel = $('panel'), rig = $('rig'), react = $('react');
  const bubble = $('bubble'), yarn = $('yarn'), title = $('title'), lead = $('lead');
  const pupils = [
    { el: $('pupilL'), lid: $('lidL'), x: 622, y: 332 },
    { el: $('pupilR'), lid: $('lidR'), x: 769, y: 333 },
  ];
  const bars = [...document.querySelectorAll('.meter__bars i')];
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
    yarn: ['Я цього не помічаю.', 'Клубок не є пріоритетом цього кварталу.', 'Гаразд. Один раз. Для тестування.', 'Це не гра. Це QA.'],
    ready: ['Кнопка зліва. Я почекаю.', 'Я сказав: досить.', 'У мене дедлайн.'],
    work: ['Слухаю. Яка задача?', 'Робочі години. Гладження за графіком.', 'Заявку прийнято. Ні.'],
    idle: ['Ви ще тут?', 'Я все бачу.', 'Можна й погортати сайт.'],
  };
  const FX = { head: 'squish', nose: 'nod', ear: 'shake', sweater: 'nod', yarn: 'shake' };
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
  function fx(name) {
    if (!name) return;
    react.classList.remove('squish', 'shake', 'nod');
    void react.getBoundingClientRect();
    react.classList.add(name);
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
    fx(FX[zone]);
    if (state === 'work') return say(pick('work'));
    if (state === 'ready') return say(pick('ready'));
    patience = Math.max(0, patience - 1);
    bars.forEach((b, i) => b.classList.toggle('off', i >= patience));
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

  // Якщо людина прогорнула сайт без гри, кіт уже в окулярах, коли вона повернеться.
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
  const eye = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };
  let blinkUntil = 0, nextBlink = performance.now() + 3000;

  /* ---------- Клубок ---------- */
  const SIZE = () => yarn.offsetWidth;
  const ball = { x: 0, y: 0, vx: 0, vy: 0, drag: false, active: false, hitAt: 0, moved: false };
  let lastMoves = [];

  function bounds() {
    const p = panel.getBoundingClientRect(), s = svg.getBoundingClientRect();
    return { w: p.width - SIZE(), floor: s.bottom - p.top - SIZE() - 10 };
  }
  function drawBall() {
    yarn.style.transform = `translate(${ball.x}px, ${ball.y}px) rotate(${ball.x * 1.4}deg)`;
  }
  function resetBall() {
    const b = bounds();
    ball.x = innerWidth > 900 ? b.w * 0.37 : b.w * 0.82;
    ball.y = b.floor;
    drawBall();
  }

  yarn.addEventListener('pointerdown', (e) => {
    yarn.setPointerCapture(e.pointerId);
    ball.drag = true; ball.active = true; ball.vx = ball.vy = 0;
    lastMoves = [];
    e.preventDefault();
  });
  yarn.addEventListener('pointermove', (e) => {
    if (!ball.drag) return;
    const r = panel.getBoundingClientRect(), s = SIZE() / 2;
    ball.x = e.clientX - r.left - s;
    ball.y = e.clientY - r.top - s;
    lastMoves.push({ x: ball.x, y: ball.y, t: e.timeStamp });
    if (lastMoves.length > 5) lastMoves.shift();
    drawBall();
  });
  const release = () => {
    if (!ball.drag) return;
    ball.drag = false;
    if (lastMoves.length > 1) {
      const a = lastMoves[0], b = lastMoves[lastMoves.length - 1], dt = Math.max(b.t - a.t, 8) / 16.7;
      ball.vx = Math.max(-46, Math.min(46, (b.x - a.x) / dt));
      ball.vy = Math.max(-46, Math.min(46, (b.y - a.y) / dt));
      ball.moved = true;
    }
  };
  yarn.addEventListener('pointerup', release);
  yarn.addEventListener('pointercancel', release);

  function stepBall(now) {
    if (ball.drag || !ball.active) return;
    const b = bounds();
    ball.vy += 1.15;
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.y > b.floor) { ball.y = b.floor; ball.vy *= -0.56; ball.vx *= 0.9; }
    if (ball.y < 0) { ball.y = 0; ball.vy *= -0.6; }
    if (ball.x < 0) { ball.x = 0; ball.vx *= -0.7; }
    if (ball.x > b.w) { ball.x = b.w; ball.vx *= -0.7; }

    // Удар об голову кота
    const r = panel.getBoundingClientRect(), s = SIZE() / 2;
    const c = toSvg(ball.x + s + r.left, ball.y + s + r.top);
    const dx = c.x - 695, dy = c.y - 310, d = Math.hypot(dx, dy), speed = Math.hypot(ball.vx, ball.vy);
    if (d < 262 && speed > 3) {
      const nx = dx / d, ny = dy / d, dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) { ball.vx -= 1.7 * dot * nx; ball.vy -= 1.7 * dot * ny; }
      if (now - ball.hitAt > 900) { ball.hitAt = now; touchCat('yarn'); }
    }
    drawBall();
    if (Math.abs(ball.vx) < 0.15 && Math.abs(ball.vy) < 1.3 && ball.y >= b.floor - 1) {
      ball.active = false;
      if (ball.moved) { ball.moved = false; if (now - ball.hitAt > 900) touchCat('yarn'); }
    }
  }

  /* ---------- Головний цикл ---------- */
  function frame(now) {
    stepBall(now);

    // Клубок цікавіший за курсор, поки рухається.
    let target;
    if (ball.drag || ball.active) {
      const r = panel.getBoundingClientRect(), s = SIZE() / 2;
      target = toSvg(ball.x + s + r.left, ball.y + s + r.top);
    } else if (pointer.seen) {
      target = toSvg(pointer.x, pointer.y);
    } else {
      // На телефоні, поки не торкнулись, кіт сам повільно озирається.
      target = { x: 695 + Math.sin(now / 1700) * 500, y: 340 + Math.cos(now / 2300) * 160 };
    }

    const dx = target.x - 695, dy = target.y - 332, dist = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, dist / 340);
    eye.x += ((dx / dist) * 13 * k - eye.x) * 0.16;
    eye.y += ((dy / dist) * 7 * k - eye.y) * 0.16;
    pupils.forEach((p) => p.el.setAttribute('transform', `translate(${eye.x.toFixed(2)} ${eye.y.toFixed(2)})`));

    const tx = Math.max(-1, Math.min(1, dx / 700)), ty = Math.max(-1, Math.min(1, dy / 500));
    tilt.x += (tx - tilt.x) * 0.07;
    tilt.y += (ty - tilt.y) * 0.07;
    if (!calm) {
      const breathe = Math.sin(now / 1500) * 0.0035;
      rig.style.transform = `translate(${(tilt.x * 11).toFixed(2)}px, ${(tilt.y * 6).toFixed(2)}px) rotate(${(tilt.x * 1.5).toFixed(3)}deg) scale(${(1.05 + breathe).toFixed(4)})`;
    }

    if (now > nextBlink) { blinkUntil = now + 130; nextBlink = now + 2400 + Math.random() * 3600; }
    const squint = state === 'work' ? 0 : (5 - patience) * 1.6;
    const lid = now < blinkUntil ? 40 : -4 + squint;
    pupils.forEach((p) => p.lid.setAttribute('transform', `translate(0 ${lid})`));

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
    cursor.classList.toggle('big', !!e.target.closest?.('a, button, .yarn, #zones > *'));
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

  addEventListener('resize', () => { placeBubble(); if (!ball.active && !ball.drag) resetBall(); });
  resetBall();
  placeBubble();
  setTimeout(() => say('Я працюю.', 3000), 1200);
  requestAnimationFrame(frame);
})();
