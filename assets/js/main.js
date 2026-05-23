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
