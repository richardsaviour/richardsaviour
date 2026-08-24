/* =============================================================
   RICHARD SAVIOUR — MOTION LAYER  (motion.dev)

   Loaded as <script type="module">, so browsers without ESM skip
   it entirely and the CSS reveals in enhance.js carry the page.

   Two hard rules:
     1. Nothing here may hide content unless the library has
        already loaded. `.rs-motion-ready` goes on <html> only
        after a successful import, and a failsafe un-hides
        anything still invisible after 3.5s.
     2. Nothing here writes `transform` on an element enhance.js
        already animates (magnetic buttons, marquee skew, the
        word-cycle panel). Those keep their existing effects.
   ============================================================= */

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let M = null;
try {
  M = await import('https://cdn.jsdelivr.net/npm/motion@13.1.1/+esm');
} catch (e) {
  M = null;
}

/* Failsafe — whatever happened above, never leave content hidden. */
setTimeout(function () {
  document.querySelectorAll('[data-motion-in]').forEach(function (el) {
    if (getComputedStyle(el).opacity === '0') {
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.style.transform = 'none';
    }
  });
}, 3500);

if (M && !REDUCE) {
  const { animate, scroll, inView, stagger } = M;

  /* One physical personality across the site, rather than five
     unrelated easing curves. */
  const SETTLE = { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 };
  const SNAP   = { type: 'spring', stiffness: 420, damping: 30 };
  const GLIDE  = { type: 'spring', stiffness: 320, damping: 34 };

  document.documentElement.classList.add('rs-motion-ready');

  /* Exposed so main.js can spring the portfolio sub-nav pill
     instead of falling back to its CSS transition. */
  window.__rsMotion = { animate, spring: GLIDE };

  /* ---------------------------------------------------------
     1. FEATURED BLOCK — staggered spring entrance
     --------------------------------------------------------- */
  try {
    const featured = document.querySelector('#featured-work');
    if (featured) {
      const parts = Array.prototype.slice.call(featured.querySelectorAll(
        '.fw-video-tag, .fw-card, .fw-slate > div, .fw-review, .fw-foot'
      ));
      parts.forEach(function (el) { el.setAttribute('data-motion-in', ''); });

      inView(featured, function () {
        animate(
          parts,
          { opacity: [0, 1], y: [26, 0], filter: ['blur(7px)', 'blur(0px)'] },
          Object.assign({}, SETTLE, { delay: stagger(0.07) })
        );

        /* the score sticker lands last, with a little overshoot */
        const sticker = featured.querySelector('.fw-sticker');
        if (sticker) {
          animate(
            sticker,
            { scale: [0.35, 1], rotate: [-42, -11] },
            { type: 'spring', stiffness: 260, damping: 13, delay: 0.5 }
          );
        }
      }, { amount: 0.2 });
    }
  } catch (e) { /* silent */ }

  /* ---------------------------------------------------------
     2. SCROLL-LINKED PARALLAX
     data-parallax="0.4" drifts down, negative drifts up. The two
     columns move at different rates, which is what stops a
     two-column block from reading as a flat slide. Runs on the
     native ScrollTimeline where the browser supports it.
     --------------------------------------------------------- */
  try {
    if (!window.matchMedia('(max-width: 1000px)').matches) {
      document.querySelectorAll('[data-parallax]').forEach(function (el) {
        const depth = parseFloat(el.getAttribute('data-parallax')) || 0;
        if (!depth) return;
        const shift = 46 * depth;
        scroll(
          animate(el, { y: [shift, -shift] }, { ease: 'linear' }),
          { target: el, offset: ['start end', 'end start'] }
        );
      });
    }
  } catch (e) { /* silent */ }

  /* ---------------------------------------------------------
     3. HERO DEPTH
     Hero copy lifts and softens as it leaves, so the birds
     canvas behind it reads as a separate plane.
     --------------------------------------------------------- */
  try {
    const heroContent = document.querySelector('.hero-content');
    const hero = document.querySelector('.hero');
    if (heroContent && hero && !window.matchMedia('(max-width: 768px)').matches) {
      scroll(
        animate(heroContent, { y: [0, -64], opacity: [1, 0.2] }, { ease: 'linear' }),
        { target: hero, offset: ['start start', 'end start'] }
      );
    }
  } catch (e) { /* silent */ }

  /* ---------------------------------------------------------
     4. SPEC-BAR LINE DRAW
     The hairline behind each section tab draws itself in from
     the left as the heading arrives.
     --------------------------------------------------------- */
  try {
    document.querySelectorAll('.section-head').forEach(function (head) {
      head.style.setProperty('--spec-scale', '0');
      inView(head, function () {
        animate(head, { '--spec-scale': 1 }, { duration: 0.95, ease: [0.22, 1, 0.36, 1] });
      }, { amount: 0.35 });
    });
  } catch (e) { /* silent */ }

  /* ---------------------------------------------------------
     5. SPRING PRESS
     Only on controls enhance.js does NOT already make magnetic,
     so the two effects never fight over `transform`.
     --------------------------------------------------------- */
  try {
    document.querySelectorAll('.fw-shot, .play-overlay').forEach(function (el) {
      el.addEventListener('pointerenter', function () { animate(el, { scale: 1.012 }, SNAP); });
      el.addEventListener('pointerleave', function () { animate(el, { scale: 1 }, SNAP); });
      el.addEventListener('pointerdown',  function () { animate(el, { scale: 0.988 }, SNAP); });
      el.addEventListener('pointerup',    function () { animate(el, { scale: 1.012 }, SNAP); });
    });
  } catch (e) { /* silent */ }
}
