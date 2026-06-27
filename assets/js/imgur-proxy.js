/* ============================================================
   Imgur -> content-proxy fallback
   ------------------------------------------------------------
   Imgur restricted UK access in 2025, so direct i.imgur.com
   requests fail for many UK visitors. This script keeps your
   imgur URLs as-is and only reroutes a request through a proxy
   when a direct load actually FAILS. Net effect:
     - non-UK visitors load straight from imgur (no third party)
     - UK visitors transparently fall back to the proxied copy

   Images  -> images.weserv.nl  (free image CDN; fetches the
              source server-side, so the UK block doesn't apply.
              Handles jpg / png / gif / webp.)
   Video   -> weserv does NOT proxy video. Either set VIDEO_PROXY
              to your own streaming proxy base, or (recommended)
              re-host the .mp4 files on your own domain / CDN.

   DROP-IN: this file is already wired into every page as the
   first tag inside <head>:
       <script src="/assets/js/imgur-proxy.js"></script>
   Loading it first lets it catch favicons and images as the
   parser inserts them.

   TUNING: see the constants at the top of the IIFE below.
   ============================================================ */
(function () {
  'use strict';

  /* ---- config ------------------------------------------------ */
  var IMG_PROXY     = 'https://images.weserv.nl/?url=';
  var VIDEO_PROXY   = '';      // e.g. 'https://your-proxy.example/?url='  ('' = leave videos alone)
  var PROXY_FAVICON = true;    // favicons can't reliably report failure, so proxy them up front
  var ALWAYS        = false;   // false = only proxy on a failed load (UK-only effect, recommended)
                               // true  = route everyone through the proxy (adds CDN caching)

  /* ---- internals --------------------------------------------- */
  var IMGUR = /^https?:\/\/i\.imgur\.com\//i;

  function toImg(url) {
    if (!url || !IMGUR.test(url) || url.indexOf('images.weserv.nl') !== -1) return url;
    var bare = url.replace(/^https?:\/\//i, '');          // weserv wants the URL without the scheme
    var out  = IMG_PROXY + encodeURIComponent(bare);
    if (/\.gif($|\?)/i.test(bare)) out += '&n=-1';        // keep animated gifs animated
    return out;
  }

  function toVideo(url) {
    if (!VIDEO_PROXY || !url || !IMGUR.test(url) || url.indexOf(VIDEO_PROXY) !== -1) return url;
    return VIDEO_PROXY + encodeURIComponent(url);
  }

  function swapImg(img) {
    if (img.dataset.imgurProxied) return;                 // guard against loops
    var src = img.currentSrc || img.getAttribute('src');
    var p   = toImg(src);
    if (p !== src) { img.dataset.imgurProxied = '1'; img.src = p; }
  }

  function handleImg(img) {
    var src = img.getAttribute('src');
    if (!src || !IMGUR.test(src)) return;
    if (ALWAYS) { swapImg(img); return; }
    img.addEventListener('error', function () { swapImg(img); }, { once: true });
    if (img.complete && img.naturalWidth === 0) swapImg(img);   // already failed (preload scanner)
  }

  function handleVideo(media) {
    var src = media.getAttribute('src');
    if (!src || !IMGUR.test(src)) return;
    if (!VIDEO_PROXY) {
      media.addEventListener('error', function () {
        console.warn('[imgur-proxy] Video failed and no VIDEO_PROXY is set. Re-host this .mp4:', src);
      }, { once: true });
      return;
    }
    if (ALWAYS) { media.src = toVideo(src); media.load && media.load(); return; }
    media.addEventListener('error', function () {
      if (media.dataset.imgurProxied) return;
      media.dataset.imgurProxied = '1';
      media.src = toVideo(src);
      media.load && media.load();
    }, { once: true });
  }

  function handleFavicon(link) {
    if (!PROXY_FAVICON) return;
    var rel = (link.getAttribute('rel') || '').toLowerCase();
    if (rel.indexOf('icon') === -1) return;
    var href = link.getAttribute('href');
    var p = toImg(href);
    if (p !== href) link.setAttribute('href', p);
  }

  function scan(node) {
    if (node.nodeType === 1) {
      if (node.tagName === 'IMG') handleImg(node);
      else if (node.tagName === 'VIDEO' || node.tagName === 'SOURCE') handleVideo(node);
      else if (node.tagName === 'LINK') handleFavicon(node);
    }
    if (node.querySelectorAll) {
      var imgs = node.querySelectorAll('img');           for (var a = 0; a < imgs.length; a++) handleImg(imgs[a]);
      var vids = node.querySelectorAll('video, source'); for (var b = 0; b < vids.length; b++) handleVideo(vids[b]);
      var lnk  = node.querySelectorAll('link[rel]');      for (var c = 0; c < lnk.length;  c++) handleFavicon(lnk[c]);
    }
  }

  // Catch nodes as the parser inserts them, so favicons/images are handled early.
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) scan(added[j]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // Final sweep once the DOM is parsed.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scan(document); });
  } else {
    scan(document);
  }
})();
