/* =============================================================
   RICHARD SAVIOUR — ENHANCEMENT LAYER (shared, all pages)
   Everything here is progressive enhancement: wrapped in
   try/catch, gated on reduced-motion, and safe to fail.
   ============================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var EASE_TICK = 1000 / 60;

  /* =====================================================
     1. SCROLL PROGRESS BAR
     ===================================================== */
  try {
    var prog = document.createElement('div');
    prog.className = 'rs-progress';
    prog.setAttribute('aria-hidden', 'true');
    prog.innerHTML = '<i></i>';
    document.body.appendChild(prog);
    var progBar = prog.firstChild;
    var progTicking = false;
    function updateProgress() {
      progTicking = false;
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      var p = Math.min(1, Math.max(0, window.scrollY / max));
      progBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () {
      if (!progTicking) { progTicking = true; window.requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  } catch (e) { /* silent */ }

  /* =====================================================
     2. NAV: hide on scroll down, show on scroll up
     ===================================================== */
  try {
    var nav = document.querySelector('.nav');
    if (nav) {
      var lastY = window.scrollY;
      var navTicking = false;
      function updateNav() {
        navTicking = false;
        var y = window.scrollY;
        var delta = y - lastY;
        // never hide near the top, or while the mobile menu is open
        var menuOpen = document.querySelector('.nav-links.is-open');
        if (y < 160 || menuOpen) {
          nav.classList.remove('nav-hidden');
        } else if (delta > 6) {
          nav.classList.add('nav-hidden');
        } else if (delta < -6) {
          nav.classList.remove('nav-hidden');
        }
        lastY = y;
      }
      window.addEventListener('scroll', function () {
        if (!navTicking) { navTicking = true; window.requestAnimationFrame(updateNav); }
      }, { passive: true });
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     3. LOADER COUNTER (00 → 100)
     ===================================================== */
  try {
    var loader = document.getElementById('rs-loader');
    if (loader && !reduceMotion) {
      var count = document.createElement('div');
      count.className = 'rs-loader-count';
      count.textContent = '00';
      loader.appendChild(count);
      var n = 0;
      var cInt = window.setInterval(function () {
        // ease toward 100 — quick start, brief settle
        n += Math.max(1, Math.round((100 - n) / 7));
        if (n >= 100 || !document.body.classList.contains('is-loading')) {
          n = 100;
          window.clearInterval(cInt);
        }
        count.textContent = (n < 10 ? '0' : '') + n;
      }, 55);
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     4. SPLIT-WORD HEADLINE REVEALS
     Walks text nodes so inline spans (.serif-italic etc.)
     keep their styling; <br> is preserved.
     ===================================================== */
  try {
    if (!reduceMotion) {
      var splitTargets = document.querySelectorAll(
        '.section-head .display-l, .page-hero h1, .final-cta h2, .belt-grid .display-l, .tools-copy .display-l'
      );

      function splitNode(node) {
        // returns number of word units created inside node
        var made = 0;
        var children = Array.prototype.slice.call(node.childNodes);
        children.forEach(function (child) {
          if (child.nodeType === 3) {
            var text = child.textContent;
            if (!text.trim()) return;
            var frag = document.createDocumentFragment();
            var parts = text.split(/(\s+)/);
            parts.forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(' '));
              } else {
                var mask = document.createElement('span');
                mask.className = 'ew';
                var inner = document.createElement('span');
                inner.className = 'ew-i';
                inner.textContent = part;
                mask.appendChild(inner);
                frag.appendChild(mask);
                made++;
              }
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR' &&
                     !child.classList.contains('lang-stage') &&
                     !child.classList.contains('ew')) {
            made += splitNode(child);
          }
        });
        return made;
      }

      var splitObserver = ('IntersectionObserver' in window)
        ? new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('ew-go');
                splitObserver.unobserve(entry.target);
              }
            });
          }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' })
        : null;

      splitTargets.forEach(function (el) {
        if (el.querySelector('.lang-stage')) return; // hero language cycler stays untouched
        var made = splitNode(el);
        if (made === 0) return;
        var words = el.querySelectorAll('.ew-i');
        words.forEach(function (w, i) {
          w.style.setProperty('--ewd', (i * 0.045).toFixed(3) + 's');
        });
        el.classList.add('ew-ready');
        if (splitObserver) splitObserver.observe(el);
        else el.classList.add('ew-go');
      });

      // fail-safe: never leave a headline hidden
      window.setTimeout(function () {
        document.querySelectorAll('.ew-ready:not(.ew-go)').forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('ew-go');
        });
      }, 3000);
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     5. EYEBROW DECODE (scramble-in on reveal)
     ===================================================== */
  try {
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var GLYPHS = '#/\\|<>-·+*';
      var eyebrows = document.querySelectorAll('.eyebrow');
      var scrambleIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          scrambleIO.unobserve(entry.target);
          var el = entry.target;
          var original = el.textContent;
          if (!original || original.length > 60) return;
          var frame = 0;
          var totalFrames = 16;
          var iv = window.setInterval(function () {
            frame++;
            var out = '';
            for (var i = 0; i < original.length; i++) {
              var ch = original[i];
              if (ch === ' ' || ch === '·' || ch === '/') { out += ch; continue; }
              // characters lock in from left to right
              var lockAt = (i / original.length) * (totalFrames - 4);
              out += (frame > lockAt) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            el.textContent = out;
            if (frame >= totalFrames) {
              window.clearInterval(iv);
              el.textContent = original;
            }
          }, 38);
        });
      }, { threshold: 0.5 });
      eyebrows.forEach(function (el) { scrambleIO.observe(el); });
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     6. CUSTOM CURSOR (fine pointers only)
     ===================================================== */
  try {
    if (finePointer && !reduceMotion) {
      var dot = document.createElement('div');
      dot.className = 'rs-cursor-dot';
      var ring = document.createElement('div');
      ring.className = 'rs-cursor-ring';
      ring.innerHTML = '<span class="rs-cursor-label">View</span>';
      document.body.appendChild(dot);
      document.body.appendChild(ring);
      document.body.classList.add('has-cursor');

      var cx = -100, cy = -100;   // target
      var rx = -100, ry = -100;   // ring (lags)
      var cursorShown = false;

      document.addEventListener('mousemove', function (e) {
        cx = e.clientX; cy = e.clientY;
        if (!cursorShown) {
          cursorShown = true;
          rx = cx; ry = cy;
          document.body.classList.add('cursor-on');
        }
      }, { passive: true });

      document.addEventListener('mouseleave', function () {
        document.body.classList.remove('cursor-on');
        cursorShown = false;
      });
      document.addEventListener('mousedown', function () { document.body.classList.add('cursor-down'); });
      document.addEventListener('mouseup', function () { document.body.classList.remove('cursor-down'); });

      function cursorLoop() {
        dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
        rx += (cx - rx) * 0.16;
        ry += (cy - ry) * 0.16;
        ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px) translate(-50%,-50%)';
        window.requestAnimationFrame(cursorLoop);
      }
      window.requestAnimationFrame(cursorLoop);

      // hover states via delegation
      var INTERACTIVE = 'a, button, .btn, .pill, .cf-btn, .nav-toggle, [role="tab"]';
      var VIEWABLE = '.cf-card, .work-card, .step-image, .batman-frame, .tools-video-frame, .featured-video';
      document.addEventListener('mouseover', function (e) {
        var t = e.target;
        // iframes (incl. ones injected later, e.g. Calendly) swallow pointer
        // events — hand back the native cursor while over them
        if (t.tagName === 'IFRAME' || (t.closest && t.closest('iframe, .calendly-inline-widget'))) {
          document.body.classList.remove('has-cursor', 'cursor-on', 'cursor-hover', 'cursor-view');
          return;
        }
        if (!document.body.classList.contains('has-cursor')) {
          document.body.classList.add('has-cursor');
          if (cursorShown) document.body.classList.add('cursor-on');
        }
        if (t.closest && t.closest(VIEWABLE)) {
          document.body.classList.add('cursor-view');
          document.body.classList.remove('cursor-hover');
        } else if (t.closest && t.closest(INTERACTIVE)) {
          document.body.classList.add('cursor-hover');
          document.body.classList.remove('cursor-view');
        } else {
          document.body.classList.remove('cursor-hover', 'cursor-view');
        }
      }, { passive: true });
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     7. MAGNETIC BUTTONS
     ===================================================== */
  try {
    if (finePointer && !reduceMotion) {
      var magnets = document.querySelectorAll('.btn, .section-cta, .cf-btn');
      magnets.forEach(function (el) {
        var strength = el.classList.contains('cf-btn') ? 5 : 7;
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var x = ((e.clientX - r.left) / r.width - 0.5) * 2;
          var y = ((e.clientY - r.top) / r.height - 0.5) * 2;
          el.style.transform = 'translate(' + (x * strength).toFixed(1) + 'px,' + (y * strength).toFixed(1) + 'px)';
        });
        el.addEventListener('mouseleave', function () {
          el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
          el.style.transform = '';
          window.setTimeout(function () { el.style.transition = ''; }, 500);
        });
      });
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     8. SPOTLIGHT CARDS (sheen follows the pointer)
     ===================================================== */
  try {
    if (finePointer) {
      var spots = document.querySelectorAll('.pillar-card, .testi-card, .why-item, .warning-card, .tools-video-frame');
      spots.forEach(function (card) {
        card.classList.add('rs-spot');
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
          card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        }, { passive: true });
      });
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     9. STAGGERED CLUSTERS
     Grids whose children already carry .reveal get a
     per-child delay; others get the .js-stagger machinery.
     ===================================================== */
  try {
    if (!reduceMotion) {
      var STAGGER_MS = 80;

      // a) grids of individual .reveal children → just add delays
      document.querySelectorAll('.pillars-grid, .testi-grid, .why-grid').forEach(function (grid) {
        var kids = Array.prototype.slice.call(grid.children).filter(function (k) {
          return k.classList.contains('reveal');
        });
        kids.forEach(function (kid, i) {
          kid.style.transitionDelay = (i * STAGGER_MS) + 'ms';
          kid.addEventListener('transitionend', function clear() {
            kid.style.transitionDelay = '';
            kid.removeEventListener('transitionend', clear);
          });
        });
      });

      // b) clusters without child reveals → own observer
      if ('IntersectionObserver' in window) {
        var sgIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('sg-go');
              sgIO.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.pills-cluster, .tools-tags, .timeline').forEach(function (cluster) {
          var kids = Array.prototype.slice.call(cluster.children);
          if (!kids.length) return;
          kids.forEach(function (kid, i) {
            kid.style.setProperty('--sgd', (i * 0.06).toFixed(2) + 's');
          });
          cluster.classList.add('js-stagger');
          sgIO.observe(cluster);
        });

        // fail-safe: never leave a cluster invisible
        window.setTimeout(function () {
          document.querySelectorAll('.js-stagger:not(.sg-go)').forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('sg-go');
          });
        }, 3000);
      }
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     10. MARQUEE VELOCITY SKEW
     ===================================================== */
  try {
    var marquee = document.querySelector('.marquee');
    if (marquee && !reduceMotion) {
      var mLastY = window.scrollY;
      var skew = 0;
      var skewTarget = 0;
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        skewTarget = Math.max(-6, Math.min(6, (y - mLastY) * 0.25));
        mLastY = y;
      }, { passive: true });
      (function skewLoop() {
        skewTarget *= 0.9;
        skew += (skewTarget - skew) * 0.12;
        if (Math.abs(skew) > 0.02) {
          marquee.style.transform = 'skewX(' + skew.toFixed(2) + 'deg)';
        } else if (marquee.style.transform) {
          marquee.style.transform = '';
        }
        window.requestAnimationFrame(skewLoop);
      })();
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     11. GENTLE IMAGE PARALLAX
     ===================================================== */
  try {
    if (!reduceMotion) {
      var pxTargets = Array.prototype.slice.call(
        document.querySelectorAll('.step-image img, .batman-frame img')
      );
      if (pxTargets.length) {
        var pxTicking = false;
        function parallax() {
          pxTicking = false;
          var vh = window.innerHeight;
          pxTargets.forEach(function (img) {
            var r = img.parentElement.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            var progress = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 … 0.5
            var shift = Math.max(-1, Math.min(1, progress)) * -14;
            img.style.transform = 'translateY(' + shift.toFixed(1) + 'px) scale(1.12)';
          });
        }
        window.addEventListener('scroll', function () {
          if (!pxTicking) { pxTicking = true; window.requestAnimationFrame(parallax); }
        }, { passive: true });
        parallax();
      }
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     12. AMBIENT AURORA in final CTA
     ===================================================== */
  try {
    var finalCta = document.querySelector('.final-cta');
    if (finalCta && !finalCta.querySelector('.rs-aurora')) {
      var aur = document.createElement('div');
      aur.className = 'rs-aurora';
      aur.setAttribute('aria-hidden', 'true');
      finalCta.insertBefore(aur, finalCta.firstChild);
    }
  } catch (e) { /* silent */ }

  /* =====================================================
     13. GHOST NUMERALS
     Reads the "01 / …" pattern from section eyebrows and
     paints an oversized outlined numeral behind the section.
     ===================================================== */
  try {
    document.querySelectorAll('.section-head .eyebrow, .tools-copy .eyebrow, .belt-grid .eyebrow, .batman-text .eyebrow').forEach(function (eb) {
      var m = (eb.textContent || '').match(/^\s*(\d{2})\s*\//);
      if (!m) return;
      var host = eb.closest('.container');
      if (!host || host.querySelector('.ghost-num')) return;
      var g = document.createElement('span');
      g.className = 'ghost-num';
      g.setAttribute('aria-hidden', 'true');
      g.textContent = m[1];
      host.insertBefore(g, host.firstChild);
    });
  } catch (e) { /* silent */ }

})();
