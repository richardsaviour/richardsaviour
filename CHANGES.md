# Site update — August 2026

## 1. Featured client work (new section on the homepage)

A `00 / Featured` block sits between the marquee and the utility belt, high
enough that it is seen without scrolling far.

- **Left column** — the gamesloth product trailer in the site's own video
  player, plus a "slate" strip (Client / Product / Scope / Sourced).
- **Right column** — Nick's Upwork review shown as the original screenshot,
  a 5.0 sticker, his byline, and a green "Upwork" verified chip.

**Why the screenshot rather than retyped text:** the screenshot is the
receipt. Nothing is transcribed, so nothing can drift from what Nick
actually wrote.

**Readability:** a wide review screenshot scaled into a column renders at
roughly 6px type — visible but not readable. So there is an always-visible
**"Read the full review"** button under the image (not a hover-only chip)
that opens a lightbox at up to 1000px. Escape or a backdrop click closes it
and focus returns to the button.

### Two things to action

1. **The trailer is hotlinked from `gamesloth.app`.** If Nick moves or
   renames that file, the homepage block breaks. There is a graceful
   fallback message ("served from gamesloth.app and isn't loading right
   now" + a link to their site), but the durable fix is to re-upload the
   trailer to your own Cloudinary and swap the `src` in `index.html`.
2. **Ask Nick first.** Featuring a client's product and review publicly is
   worth a message before it goes live.

## 2. Hero wordmark

`Welcome to my website` — both underlines removed (there were two: a
gradient bar in `styles.css` and a hand-drawn squiggle in `refresh.css`).
"Welcome to my" stays Inter Tight 800; "website" is now Fraunces italic in
gold, matching the `.serif-italic` accent used in every other heading.

## 3. Italic fonts (site-wide bug)

The Google Fonts URL requested `Fraunces:opsz,wght` with **no `ital` axis**.
Every italic on the site — "utility belt", "order problem", "website" — was
a synthetic browser slant of the upright font, which is why the type looked
off. Fixed on all six pages by loading the real italic axis for both
Fraunces and Inter Tight, and by enabling Fraunces' `WONK` axis for its
genuine alternate letterforms.

## 4. Portfolio sub-nav

**Root cause:** `position: sticky` with `<body>` as its containing block, so
the bar had no stopping point and rode over the CTA and footer forever.

**Fixes:**
- Wrapped the bar and the three work sections in `.anchors-scope`, so it now
  releases at the end of `#social-media`.
- It retracts and returns in step with the main nav, so scrolling down never
  leaves a capsule parked on top of a heading.
- Rebuilt as a dark glass capsule matching the main nav, with a sliding gold
  indicator, horizontal scroll on mobile, and click-to-scroll offsets that
  stop headings landing underneath the bar.

## 5. Video player (bug)

The player CSS and JS existed **inline on `portfolio/index.html` only**, so
the homepage controls rendered unstyled. Both are now shared:
`assets/css/video-player.css` and `assets/js/video-player.js`. The inline
copies were removed. The JS also gained `data-autoplay="false"` support and
an error state that shows fallback copy instead of a dead black rectangle.

## 6. Motion layer (motion.dev)

`assets/js/motion-layer.js`, loaded as a module from the Motion v13 CDN.
Spring entrance for the featured block, scroll-linked parallax, hero depth
on scroll, spec-bar line draw, and a spring for the sub-nav indicator.

**Safety:** it is pure enhancement. `.rs-motion-ready` goes on `<html>` only
after a successful import, a 3.5s failsafe un-hides anything still
invisible, and nothing here writes `transform` on an element `enhance.js`
already animates (magnetic buttons, marquee skew, word-cycle panel).

## New / changed files

```
NEW  assets/css/upgrade.css        featured section, lightbox, polish
NEW  assets/css/video-player.css   extracted from portfolio/index.html
NEW  assets/js/video-player.js     extracted + generalised
NEW  assets/js/motion-layer.js     motion.dev enhancement module
EDIT assets/css/styles.css         hero word, sub-nav rebuild
EDIT assets/css/refresh.css        squiggle underline removed
EDIT assets/js/main.js             sub-nav indicator, scroll offsets
EDIT assets/js/enhance.js          lightbox, sub-nav tuck
EDIT index.html                    featured section, font link, assets
EDIT portfolio/index.html          scope wrapper, inline CSS/JS removed
EDIT contact | automations | videorole | 404    font link, assets
```

## Verified

All six pages: 0 JavaScript errors, 0 horizontal overflow, clean HTML parse
(html5lib), clean CSS parse (tinycss2). Checked in headless Chromium at
1440px and 390px. Sub-nav release, tuck/return, and the lightbox round-trip
were each tested directly.
