(() => {
  const $ = (id) => document.getElementById(id);
  const svg = $('cat'), spin = $('spin'), arrow = $('spinArrow'), spinText = $('spinText');
  const pupils = [$('pupilL'), $('pupilR')];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: innerWidth * 0.3, y: innerHeight * 0.4, seen: false };
  let eyeX = 0, turn = 0;

  // Текст рівно на все коло, без розриву
  function closeRing() {
    const n = spinText.firstElementChild.textContent.length;
    spinText.style.letterSpacing = '0px';
    spinText.style.letterSpacing = ((2 * Math.PI * 54 - spinText.getComputedTextLength()) / n).toFixed(3) + 'px';
  }
  document.fonts.ready.then(closeRing);

  function frame(now) {
    // Зіниці рухаються лише вліво-вправо. На телефоні, поки не торкнулись, кіт сам повільно озирається.
    const x = pointer.seen
      ? new DOMPoint(pointer.x, pointer.y).matrixTransform(svg.getScreenCTM().inverse()).x
      : 695 + Math.sin(now / 1700) * 500;
    const dx = x - 695;
    eyeX += (Math.sign(dx) * 5.5 * Math.min(1, Math.abs(dx) / 340) - eyeX) * 0.12;
    pupils.forEach((el) => el.setAttribute('transform', 'translate(' + eyeX.toFixed(2) + ' 0)'));

    // Стрілка в колі дивиться на курсор
    if (pointer.seen && !calm) {
      const r = spin.getBoundingClientRect();
      if (r.width) {
        const want = Math.atan2(pointer.y - r.top - r.height / 2, pointer.x - r.left - r.width / 2) * 180 / Math.PI + 45;
        turn += (((want - turn + 540) % 360) - 180) * 0.14;
        arrow.style.setProperty('--turn', turn.toFixed(1) + 'deg');
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Кільце-курсор ---------- */
  const cursor = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor__dot'), ring = document.querySelector('.cursor__ring');
  const ringPos = { x: pointer.x, y: pointer.y };
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
    dot.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
    cursor.classList.toggle('big', !!e.target.closest?.('a, button'));
  }, { passive: true });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const style = document.createElement('style');
    style.textContent = '*{cursor:none !important}';
    document.head.append(style);
    (function follow() {
      ringPos.x += (pointer.x - ringPos.x) * 0.16;
      ringPos.y += (pointer.y - ringPos.y) * 0.16;
      ring.style.transform = 'translate(' + ringPos.x + 'px, ' + ringPos.y + 'px)';
      requestAnimationFrame(follow);
    })();
  }

  requestAnimationFrame(frame);
})();
