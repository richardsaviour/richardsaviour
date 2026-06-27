/* =============================================================
   RICHARD SAVIOUR — SHARED GLOBAL JS
   - Fail-safe loader
   - Scroll reveal
   - Nav state on scroll
   - Mobile nav toggle
   - Active nav link
   - Smooth scroll
   - Button bubbles auto-inject
   - Decorative video autoplay-in-view
   ============================================================= */
(function () {
  'use strict';

  /* ===== LOADER: fail-safe ===== */
  const rsLoader = document.getElementById('rs-loader');
  let loaderHidden = false;

  function hideLoader() {
    if (loaderHidden) return;
    loaderHidden = true;
    document.body.classList.remove('is-loading');
    if (rsLoader) {
      rsLoader.classList.add('hide');
      window.setTimeout(() => {
        if (rsLoader && rsLoader.parentNode) rsLoader.parentNode.removeChild(rsLoader);
      }, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(hideLoader, 400));
  } else {
    window.setTimeout(hideLoader, 400);
  }
  window.addEventListener('load', () => window.setTimeout(hideLoader, 300));
  /* Hard fail-safe: never let the loader stick longer than 2.8 seconds */
  window.setTimeout(hideLoader, 2800);

  /* ===== AUTO-INJECT BUTTON BUBBLES ===== */
  document.querySelectorAll('.btn').forEach(btn => {
    if (btn.querySelector('.btn-bubbles')) return;
    const wrap = document.createElement('span');
    wrap.className = 'btn-bubbles';
    wrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++) wrap.appendChild(document.createElement('span'));
    btn.insertBefore(wrap, btn.firstChild);
  });

  /* ===== SCROLL REVEAL ===== */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ===== NAV STATE ON SCROLL ===== */
  const nav = document.querySelector('.nav');
  function setNavState() {
    if (!nav) return;
    if (window.scrollY > 80) {
      nav.style.background = 'rgba(13,13,14,0.96)';
      nav.style.boxShadow = '0 18px 45px rgba(0,0,0,0.28)';
    } else {
      nav.style.background = 'rgba(13,13,14,0.92)';
      nav.style.boxShadow = '0 18px 45px rgba(0,0,0,0.22)';
    }
  }
  setNavState();
  window.addEventListener('scroll', setNavState, { passive: true });

  /* ===== MOBILE NAV TOGGLE ===== */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.textContent = open ? 'Close' : 'Menu';
    });
    /* Close mobile menu when a link is clicked */
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (navLinks.classList.contains('is-open')) {
          navLinks.classList.remove('is-open');
          navToggle.textContent = 'Menu';
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ===== ACTIVE NAV LINK (clean-URL aware) =====
     Works whether the page is served as "/", "/portfolio", "/portfolio/",
     or (in dev) "/portfolio/index.html". Normalises both sides to a
     leading-slash, trailing-slash-stripped form before comparing. */
  try {
    const normalise = (p) => {
      if (!p) return '/';
      // strip query / hash
      p = p.split('#')[0].split('?')[0];
      // strip trailing index.html
      p = p.replace(/\/index\.html$/i, '/');
      // ensure leading slash
      if (!p.startsWith('/')) p = '/' + p;
      // collapse trailing slash (but keep root "/")
      if (p.length > 1) p = p.replace(/\/+$/, '');
      return p;
    };

    const here = normalise(window.location.pathname);

    document.querySelectorAll('.nav-links a').forEach(a => {
      const linkPath = normalise(a.getAttribute('href') || '');
      if (linkPath === here) a.classList.add('is-active');
    });
  } catch (e) { /* fail silently */ }

  /* ===== SMOOTH SCROLL FOR ANCHOR LINKS ===== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ===== DECORATIVE VIDEO AUTOPLAY-IN-VIEW ===== */
  const decorativeVideos = document.querySelectorAll(
    '.media-card video[autoplay], .section-hero-image video[autoplay], video[data-autoplay-in-view], .reel-card video'
  );
  if ('IntersectionObserver' in window && decorativeVideos.length) {
    const videoIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const v = entry.target;
        if (entry.isIntersecting) {
          if (!v.muted) v.muted = true;
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.2 });
    decorativeVideos.forEach(v => videoIO.observe(v));
  }

  /* ===== ANCHOR-NAV ACTIVE STATE (portfolio page) ===== */
  const anchorNav = document.querySelector('.section-anchors');
  if (anchorNav && 'IntersectionObserver' in window) {
    const anchorLinks = anchorNav.querySelectorAll('a');
    const sectionMap = new Map();
    anchorLinks.forEach(a => {
      const id = (a.getAttribute('href') || '').replace('#', '');
      if (!id) return;
      const sec = document.getElementById(id);
      if (sec) sectionMap.set(sec, a);
    });
    const secIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          anchorLinks.forEach(l => l.classList.remove('is-active'));
          const a = sectionMap.get(entry.target);
          if (a) a.classList.add('is-active');
        }
      });
    }, { threshold: [0.2, 0.4], rootMargin: '-20% 0px -40% 0px' });
    sectionMap.forEach((_a, sec) => secIO.observe(sec));
  }
})();

/* =============================================================
   RICHARD SAVIOUR — SCROLL FLOW (bird-guided thread)
   Builds an organic spline through every [data-flow] anchor,
   reveals it on scroll, and flies a small flock along it.
   Scroll speed drives flight speed; idle => hover/orbit on the
   focused section. Colour evolves down the page. rAF-driven.
   ============================================================= */
(function () {
  'use strict';

  const flow   = document.getElementById('rs-flow');
  const svg    = document.getElementById('rs-flow-svg');
  if (!flow || !svg) return;

  const ghost  = document.getElementById('rs-flow-ghost');
  const glow   = document.getElementById('rs-flow-glow');
  const line   = document.getElementById('rs-flow-line');
  const endEl  = document.getElementById('rs-flow-end');
  const dotEl  = endEl ? endEl.querySelector('.dot-core') : null;
  const ringEl = endEl ? endEl.querySelector('.ring-pulse') : null;
  const flock  = document.getElementById('rs-flow-birds');
  const grad   = document.getElementById('rs-flow-grad');
  const gradStops = grad ? grad.querySelectorAll('stop') : [];
  const fadeGrad = document.getElementById('rs-flow-fade');
  const maskRect = document.getElementById('rs-flow-mask-rect');
  const NS = 'http://www.w3.org/2000/svg';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  function lerpAngle(a, b, t) {
    let d = b - a;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  /* ---------- colour palette (orange -> amber -> yellow-green -> green -> red) ---------- */
  const PALETTE = [
    { p: 0.00, h: 32,  s: 74, l: 53 },
    { p: 0.25, h: 45,  s: 86, l: 55 },
    { p: 0.50, h: 78,  s: 55, l: 48 },
    { p: 0.75, h: 145, s: 56, l: 44 },
    { p: 1.00, h: 8,   s: 78, l: 53 }
  ];
  function colorAt(pos, shift) {
    pos = clamp(pos, 0, 1);
    let a = PALETTE[0], b = PALETTE[PALETTE.length - 1];
    for (let i = 0; i < PALETTE.length - 1; i++) {
      if (pos >= PALETTE[i].p && pos <= PALETTE[i + 1].p) { a = PALETTE[i]; b = PALETTE[i + 1]; break; }
    }
    const t = (b.p === a.p) ? 0 : (pos - a.p) / (b.p - a.p);
    const h = a.h + (b.h - a.h) * t + (shift || 0);
    const s = a.s + (b.s - a.s) * t;
    const l = a.l + (b.l - a.l) * t;
    return 'hsl(' + h.toFixed(1) + ' ' + s.toFixed(1) + '% ' + l.toFixed(1) + '%)';
  }

  /* ---------- device-aware config ---------- */
  function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }
  function birdCount() { return reduced ? 0 : (isMobile() ? 3 : 5); }

  const BIRD_D = 'M11 0 L-7 -6 Q-2 0 -7 6 Z';

  /* ---------- state ---------- */
  let W = 0, H = 0, totalLen = 0;
  let SEG = 150;             // visible comet length (short moving line, not the full path)
  let samples = [];          // [{l, y}] for Y -> length lookup
  let anchors = [];          // [{y, len}]
  let birds = [];
  let headLen = 0;
  let smoothVel = 0;
  let mode = 0;              // 0 travel, 1 hover
  let idleMs = 0;
  let sectionBoost = 0;
  let prevNow = performance.now();
  let colorTick = 0;
  let running = false, rafId = 0;
  let lastFocus = null;
  let lastShift = 0;

  /* ---------- build the spline through the anchors ---------- */
  function gatherPoints() {
    const els = Array.prototype.slice.call(document.querySelectorAll('[data-flow]'));
    if (!els.length) return [];
    const sx = window.scrollX, sy = window.scrollY;
    const mobile = isMobile();
    const laneA = mobile ? W * 0.30 : W * 0.34;
    const laneB = mobile ? W * 0.70 : W * 0.66;
    const laneW = mobile ? 0.5 : 0.4;   // how strongly to weave vs. follow content
    const margin = mobile ? 26 : 60;

    let pts = els.map(function (el, i) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 + sx;
      const cy = r.top + r.height / 2 + sy;
      const lane = (i % 2 === 0) ? laneA : laneB;
      let x = cx * (1 - laneW) + lane * laneW;
      x = clamp(x, margin, W - margin);
      return { x: x, y: cy };
    });

    pts.sort(function (a, b) { return a.y - b.y; });

    // de-dupe near-equal Y so the spline stays clean
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      if (!out.length || pts[i].y - out[out.length - 1].y > 12) out.push(pts[i]);
    }
    if (out.length < 2) return out;

    // graceful lead-in from the top and resolve toward the footer
    out.unshift({ x: out[0].x, y: Math.max(110, out[0].y - Math.min(260, window.innerHeight * 0.28)) });
    const last = out[out.length - 1];
    out.push({ x: last.x, y: Math.min(H - 30, last.y + 150) });
    return out;
  }

  // Catmull-Rom -> cubic Bezier
  function toPath(p) {
    if (p.length < 2) return '';
    let d = 'M ' + p[0].x.toFixed(1) + ' ' + p[0].y.toFixed(1);
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' +
                   c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' +
                   p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }

  function lengthAtY(y) {
    const s = samples;
    if (!s.length) return 0;
    if (y <= s[0].y) return s[0].l;
    if (y >= s[s.length - 1].y) return s[s.length - 1].l;
    let lo = 0, hi = s.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (s[mid].y < y) lo = mid + 1; else hi = mid; }
    const i = Math.max(1, lo), a = s[i - 1], b = s[i];
    return a.l + (b.l - a.l) * ((y - a.y) / ((b.y - a.y) || 1));
  }

  function ensureBirds() {
    const n = birdCount();
    if (birds.length === n) return;
    while (flock.firstChild) flock.removeChild(flock.firstChild);
    birds = [];
    for (let i = 0; i < n; i++) {
      const g = document.createElementNS(NS, 'g');
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', BIRD_D);
      g.appendChild(path);
      flock.appendChild(g);
      birds.push({
        el: g, phase: Math.random() * Math.PI * 2,
        orbit: Math.random() * Math.PI * 2,
        dir: i % 2 ? 1 : -1, amp: 0.5 + Math.random() * 0.6, ang: 0
      });
    }
  }

  function build() {
    W = document.documentElement.clientWidth;
    H = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    const pts = gatherPoints();
    if (pts.length < 2) { flow.style.opacity = '0'; return false; }

    const d = toPath(pts);
    ghost.setAttribute('d', d);
    glow.setAttribute('d', d);
    line.setAttribute('d', d);

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    flow.style.height = H + 'px';

    if (grad) { grad.setAttribute('y1', 0); grad.setAttribute('y2', H); }

    totalLen = line.getTotalLength();

    // ---- comet setup: draw only a short segment, fade its tail ----
    SEG = isMobile() ? 90 : 150;
    const dash = SEG + ' ' + (totalLen + SEG);   // one short dash, then a gap longer than the path
    line.style.strokeDasharray = dash;
    glow.style.strokeDasharray = dash;
    line.setAttribute('mask', 'url(#rs-flow-mask)');
    glow.setAttribute('mask', 'url(#rs-flow-mask)');
    if (maskRect) { maskRect.setAttribute('width', W); maskRect.setAttribute('height', H); }
    // The faint full-route line reads as "a long line" — hide it so only the
    // moving comet shows. Flip to '' if you ever want the route hint back.
    ghost.style.display = 'none';

    // length/Y lookup table
    const N = clamp(Math.round(totalLen / 24), 120, 460);
    samples = [];
    for (let i = 0; i <= N; i++) {
      const l = totalLen * i / N;
      const pt = line.getPointAtLength(l);
      samples.push({ l: l, y: pt.y });
    }

    // anchor -> length, for section detection
    anchors = pts.map(function (p) { return { y: p.y, len: lengthAtY(p.y) }; });

    ensureBirds();
    return true;
  }

  /* ---------- frame ---------- */
  const LOOKAHEAD = 0.46;

  function frame(now) {
    const dt = clamp((now - prevNow) / 16.67, 0.2, 3);
    const elapsed = now - prevNow;
    prevNow = now;

    const sy = window.scrollY;
    const focusY = sy + window.innerHeight * LOOKAHEAD;

    // velocity (smoothed, absolute)
    if (lastFocus === null) lastFocus = focusY;
    const rawV = Math.abs(focusY - lastFocus);
    lastFocus = focusY;
    smoothVel += (rawV - smoothVel) * 0.2;
    const vel = Math.min(smoothVel, 70);

    // head follows the viewport centre along the path
    const targetHead = lengthAtY(focusY);
    headLen += (targetHead - headLen) * 0.12;
    const head = clamp(headLen, 0, totalLen);

    // comet: only a short segment ending at the head is drawn.
    // dashoffset = SEG - head places the dash over [head - SEG, head].
    line.style.strokeDashoffset = (SEG - head);
    glow.style.strokeDashoffset = (SEG - head);

    // taper the tail: run the fade gradient from the tail point (transparent)
    // to the head point (opaque), so the streak fades out like a wishing star.
    if (fadeGrad) {
      const tailL = clamp(head - SEG, 0, totalLen);
      const hPt = line.getPointAtLength(clamp(head, 0, totalLen));
      const tPt = line.getPointAtLength(tailL);
      fadeGrad.setAttribute('x1', tPt.x.toFixed(1));
      fadeGrad.setAttribute('y1', tPt.y.toFixed(1));
      fadeGrad.setAttribute('x2', hPt.x.toFixed(1));
      fadeGrad.setAttribute('y2', hPt.y.toFixed(1));
    }

    // fade the overlay in past the hero
    flow.style.opacity = clamp((sy - 60) / (window.innerHeight * 0.5), 0, 1);

    // idle / hover state
    if (smoothVel < 0.5) idleMs += elapsed; else idleMs = 0;
    const wantHover = idleMs > 220 ? 1 : 0;
    mode += (wantHover - mode) * 0.06;

    // head point + nearest anchor
    const hp = line.getPointAtLength(head);
    let nearest = Infinity;
    for (let i = 0; i < anchors.length; i++) nearest = Math.min(nearest, Math.abs(anchors[i].len - head));
    const atSection = (mode > 0.4 && nearest < 70);
    sectionBoost += ((atSection ? 1 : 0) - sectionBoost) * 0.08;
    if (endEl) endEl.classList.toggle('at-section', atSection);

    // end marker
    if (endEl) {
      endEl.setAttribute('transform', 'translate(' + hp.x.toFixed(1) + ',' + hp.y.toFixed(1) + ')');
      endEl.setAttribute('opacity', clamp(head / 40, 0, 1).toFixed(2));
    }

    // colour drift (throttled)
    if ((colorTick++ % 4) === 0) {
      lastShift = Math.sin(now / 4200) * 7;
      const offs = [0, 0.25, 0.5, 0.75, 1];
      for (let i = 0; i < gradStops.length; i++) {
        gradStops[i].setAttribute('stop-color', colorAt(offs[i] || 0, lastShift));
      }
      const col = colorAt(hp.y / H, lastShift);
      if (dotEl) dotEl.setAttribute('fill', col);
      if (ringEl) ringEl.setAttribute('stroke', col);
    }

    // flock
    const spacing = (isMobile() ? 24 : 34) * (1 + vel / 70 * 1.1);
    const lead = (isMobile() ? 30 : 60) + vel * 1.4;

    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];

      // travel position (leader ahead, flock trailing up the path)
      const bl = clamp(head + lead - i * spacing, 0, totalLen);
      const tp = line.getPointAtLength(bl);
      const a1 = line.getPointAtLength(clamp(bl - 2.5, 0, totalLen));
      const a2 = line.getPointAtLength(clamp(bl + 2.5, 0, totalLen));
      const travelAng = Math.atan2(a2.y - a1.y, a2.x - a1.x);

      // organic perpendicular spread
      const px = -Math.sin(travelAng), py = Math.cos(travelAng);
      const spread = (isMobile() ? 9 : 15) * (0.5 + vel / 50) * b.amp;
      const off = Math.sin(now / 600 + b.phase) * spread;
      const tx = tp.x + px * off, ty = tp.y + py * off;

      // hover / orbit position
      b.orbit += dt * (0.02 + 0.006 * i) * b.dir;
      const R = (isMobile() ? 16 : 24) + i * (isMobile() ? 7 : 10) + sectionBoost * (isMobile() ? 12 : 18);
      const hx = hp.x + Math.cos(b.orbit) * R;
      const hy = hp.y + Math.sin(b.orbit) * R * 0.62;
      const hoverAng = b.orbit + Math.PI / 2 * b.dir;

      // blend travel <-> hover
      const m = mode;
      const x = tx * (1 - m) + hx * m;
      const y = ty * (1 - m) + hy * m;
      const targetAng = lerpAngle(travelAng, hoverAng, m);
      b.ang = lerpAngle(b.ang, targetAng, 0.22);

      // wingbeat (faster with scroll speed)
      b.phase += dt * (0.22 + vel * 0.012);
      const flap = 0.66 + 0.4 * Math.abs(Math.sin(b.phase));

      const base = (isMobile() ? 0.72 : 0.95) * (i === 0 ? 1.14 : Math.max(0.7, 1 - i * 0.06));
      b.el.setAttribute('transform',
        'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') ' +
        'rotate(' + (b.ang * 180 / Math.PI).toFixed(1) + ') ' +
        'scale(' + base.toFixed(2) + ',' + (base * flap).toFixed(2) + ')');

      if ((colorTick % 4) === 1) {
        b.el.setAttribute('fill', colorAt(y / H, lastShift));
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  /* ---------- lifecycle ---------- */
  function start() {
    if (running || reduced) return;
    running = true;
    prevNow = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

  let resizeT;
  function scheduleBuild() {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      const ok = build();
      if (ok && reduced) { flow.style.opacity = '1'; }
    }, 160);
  }

  // init
  if (build()) {
    if (reduced) {
      flow.style.opacity = '1';   // static faint thread only
    } else {
      start();
    }
  }

  window.addEventListener('resize', scheduleBuild, { passive: true });
  window.addEventListener('orientationchange', scheduleBuild, { passive: true });
  window.addEventListener('load', scheduleBuild);

  // content height can change (images, reveals, fonts)
  if ('ResizeObserver' in window) {
    let last = H;
    const ro = new ResizeObserver(function () {
      const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      if (Math.abs(h - last) > 40) { last = h; scheduleBuild(); }
    });
    ro.observe(document.body);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
})();
