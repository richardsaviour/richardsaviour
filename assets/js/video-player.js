/* =============================================================
   RICHARD SAVIOUR — SHARED VIDEO CARD PLAYER
   Drives any element marked [data-video-card]. Markup contract:
     .reel-video-block > video + .play-overlay
     .video-controls   > [data-progress] > [data-fill] [data-thumb]
                       > [data-action="playpause|rewind|forward|mute|fullscreen"]
                       > [data-action="volume"] (input[type=range])
                       > [data-time]

   Opt-outs via attributes on the card:
     data-autoplay="false"  — do not auto-play when scrolled into view
     data-loop="false"      — do not loop
   ============================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatTime(s) {
    if (!isFinite(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function initVideoCard(card) {
    if (card.dataset.vpInit === '1') return;
    card.dataset.vpInit = '1';

    var video     = card.querySelector('video');
    var btnPP     = card.querySelector('[data-action="playpause"]');
    var btnRew    = card.querySelector('[data-action="rewind"]');
    var btnFwd    = card.querySelector('[data-action="forward"]');
    var btnMute   = card.querySelector('[data-action="mute"]');
    var volSlider = card.querySelector('[data-action="volume"]');
    var btnFS     = card.querySelector('[data-action="fullscreen"]');
    var progress  = card.querySelector('[data-progress]');
    var fill      = card.querySelector('[data-fill]');
    var thumb     = card.querySelector('[data-thumb]');
    var timeEl    = card.querySelector('[data-time]');

    if (!video || !btnPP) return;

    var autoplay = card.dataset.autoplay !== 'false' && !reduceMotion;

    video.muted = true;
    if (volSlider) volSlider.value = 1;

    function updatePlayState() {
      var paused = video.paused;
      card.classList.toggle('is-paused', paused);
      var ip = btnPP.querySelector('.icon-play');
      var ia = btnPP.querySelector('.icon-pause');
      if (ip) ip.style.display = paused ? '' : 'none';
      if (ia) ia.style.display = paused ? 'none' : '';
    }

    function updateProgress() {
      if (!video.duration || !fill) return;
      var pct = (video.currentTime / video.duration) * 100;
      fill.style.width = pct + '%';
      if (thumb) thumb.style.left = pct + '%';
      if (timeEl) timeEl.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
    }

    function updateMuteUI() {
      if (!btnMute) return;
      var muted = video.muted || video.volume === 0;
      var un = btnMute.querySelector('.icon-unmuted');
      var mu = btnMute.querySelector('.icon-muted');
      if (un) un.style.display = muted ? 'none' : '';
      if (mu) mu.style.display = muted ? '' : 'none';
      card.classList.toggle('is-muted', muted);
    }

    btnPP.addEventListener('click', function () {
      video.paused ? video.play().catch(function () {}) : video.pause();
    });
    if (btnRew) btnRew.addEventListener('click', function () {
      video.currentTime = Math.max(0, video.currentTime - 5);
    });
    if (btnFwd) btnFwd.addEventListener('click', function () {
      video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
    });

    if (btnMute) btnMute.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 1;
      if (volSlider) volSlider.value = video.muted ? 0 : video.volume;
      updateMuteUI();
    });

    if (volSlider) volSlider.addEventListener('input', function () {
      video.volume = parseFloat(volSlider.value);
      video.muted = video.volume === 0;
      updateMuteUI();
    });

    if (btnFS) btnFS.addEventListener('click', function () {
      var target = card.querySelector('.reel-video-block') || card;
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
      } else {
        var req = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen;
        if (req) req.call(target);
      }
    });

    video.addEventListener('click', function () {
      video.paused ? video.play().catch(function () {}) : video.pause();
    });
    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);

    /* graceful failure — if the file will not load, say so instead of
       leaving a dead black rectangle on the page */
    video.addEventListener('error', function () {
      card.classList.add('is-errored');
    });

    /* scrubbing */
    if (progress) {
      var scrubbing = false;
      var scrubTo = function (clientX) {
        var rect = progress.getBoundingClientRect();
        var pct = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
        video.currentTime = pct * (video.duration || 0);
      };
      progress.addEventListener('mousedown', function (e) { scrubbing = true; scrubTo(e.clientX); });
      document.addEventListener('mousemove', function (e) { if (scrubbing) scrubTo(e.clientX); });
      document.addEventListener('mouseup', function () { scrubbing = false; });
      progress.addEventListener('touchstart', function (e) { scrubbing = true; scrubTo(e.touches[0].clientX); }, { passive: true });
      document.addEventListener('touchmove', function (e) { if (scrubbing) scrubTo(e.touches[0].clientX); }, { passive: true });
      document.addEventListener('touchend', function () { scrubbing = false; });
    }

    /* play / pause as the card enters and leaves the viewport */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (autoplay) video.play().catch(function () {});
          } else if (!video.paused) {
            video.pause();
          }
        });
      }, { threshold: 0.4 });
      io.observe(card);
    }

    updatePlayState();
    updateMuteUI();
  }

  function initAll() {
    document.querySelectorAll('[data-video-card]').forEach(initVideoCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
