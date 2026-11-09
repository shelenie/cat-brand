/* Фонові анімації: мережа у «Про мене», крапки у футері, жовта крапка після імені */
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Жовта крапка прилітає один раз
  const word = document.getElementById('footWord');
  const dot = word && word.querySelector('i');
  if (dot && !calm) {
    dot.classList.add('wait');
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      dot.classList.remove('wait');
      dot.classList.add('drop');
      o.disconnect();
    }, { threshold: .6 }).observe(word);
  }
  if (calm) return;

  function scene(sectionId, canvasId, init, tick) {
    const sec = document.getElementById(sectionId);
    const cv = document.getElementById(canvasId);
    if (!sec || !cv) return;
    const ctx = cv.getContext('2d');
    const st = { W: 0, H: 0, ctx, items: [], mouse: null };
    let raf = 0, visible = false, client = null;

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      st.W = sec.clientWidth; st.H = sec.clientHeight;
      cv.width = st.W * dpr; cv.height = st.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!st.items.length) init(st);
    }
    new ResizeObserver(size).observe(sec);
    size();

    sec.addEventListener('mousemove', (e) => { client = { x: e.clientX, y: e.clientY }; });
    sec.addEventListener('mouseleave', () => { client = null; });

    function frame(now) {
      raf = 0;
      if (!visible) return;
      if (client) {
        const r = sec.getBoundingClientRect();
        st.mouse = { x: client.x - r.left, y: client.y - r.top };
      } else st.mouse = null;
      ctx.clearRect(0, 0, st.W, st.H);
      tick(st, now);
      raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(sec);
  }

  const wrap = (p, st, m) => {
    if (p.x < -m) p.x = st.W + m; else if (p.x > st.W + m) p.x = -m;
    if (p.y < -m) p.y = st.H + m; else if (p.y > st.H + m) p.y = -m;
  };

  // Мережа: лінії лише навколо курсора
  const TEAL = '53, 112, 138';
  scene('about', 'aboutFx', (st) => {
    st.items = Array.from({ length: 80 }, () => ({ x: rnd(0, st.W), y: rnd(0, st.H), vx: rnd(-.25, .25), vy: rnd(-.25, .25), m: 0 }));
  }, (st) => {
    const { ctx, items, mouse } = st, R = 190;
    items.forEach((p) => {
      p.x += p.vx; p.y += p.vy; wrap(p, st, 4);
      p.m = mouse ? Math.max(0, 1 - Math.hypot(p.x - mouse.x, p.y - mouse.y) / R) : 0;
      ctx.fillStyle = 'rgba(' + TEAL + ',' + (.3 + p.m * .55).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.29); ctx.fill();
    });
    if (!mouse) return;
    ctx.lineWidth = 1;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      if (!a.m) continue;
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        if (!b.m) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d >= 120) continue;
        ctx.strokeStyle = 'rgba(' + TEAL + ',' + ((1 - d / 120) * Math.min(a.m, b.m) * .8).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  });

  // Світлі крапки: пливуть угору, розлітаються від курсора
  const CREAM = '247, 246, 239';
  scene('contact', 'footFx', (st) => {
    st.items = Array.from({ length: 70 }, () => {
      const r = Math.random() < .15 ? rnd(2.4, 4.2) : rnd(.7, 2);
      return { x: rnd(0, st.W), y: rnd(0, st.H), r, a: r > 2.4 ? rnd(.2, .45) : rnd(.4, .9), vy: rnd(-.32, -.08), ph: rnd(0, 6.28), w: rnd(.0004, .0012), px: 0, py: 0 };
    });
  }, (st, now) => {
    const { ctx, items, mouse } = st;
    items.forEach((p) => {
      let glow = 0;
      if (mouse) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy) || 1;
        if (d < 160) { glow = 1 - d / 160; p.px += dx / d * glow * .55; p.py += dy / d * glow * .55; }
      }
      p.px *= .93; p.py *= .93;
      p.y += p.vy + p.py;
      p.x += Math.sin(now * p.w + p.ph) * .22 + p.px;
      wrap(p, st, 10);
      ctx.fillStyle = 'rgba(' + CREAM + ',' + Math.min(1, p.a + glow * .4).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
    });
  });
})();
