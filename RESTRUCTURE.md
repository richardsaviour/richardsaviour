# Restructure — September 2026

The site's problem was never a shortage of content. It was that the homepage
ran nine major sections before offering a reason to act, and the portfolio sat
two clicks deep behind a link buried in the utility-belt section.

Nothing was thrown away. Everything moved somewhere it makes more sense.

---

## 1. Information architecture

| Page | Answers |
|---|---|
| **Home** | "What does he do, and can he actually do it?" |
| **Work** — `/portfolio/` | "Show me." |
| **Services** — `/services/` *(new)* | "How could he help me specifically?" |
| **About** — `/about/` *(new)* | "Who is this person?" |
| **Contact** — `/contact/` | "Let's talk." |

`/automations/` still exists in full and is linked from the Services page. It
is no longer in the main nav — it's a deep-dive, not a top-level destination.

`/videorole/` is unchanged and deliberately unlinked. It has its own standalone
layout because it's a hiring campaign page, not part of the portfolio. It is
also `noindex` now.

**The portfolio URL stayed `/portfolio/`.** Job applications already have that
link in the world. The nav label says "Work"; the address didn't move.

---

## 2. Homepage — nine sections down to six

```
01  HERO          "You found me. Now let me show you what I can do."
02  CAPABILITIES  Video · Content · Design & digital · Automation & AI
03  FEATURED WORK GameSloth · Agency showreel · AI UGC
04  HOW I HELP    Plan → Make → Revise → Publish → Improve
05  PROOF         Video testimonial + two written highlights
06  CTA
```

### What moved, and where

| Was on the homepage | Now lives on |
|---|---|
| Utility belt (pill cluster) | Services — folded into the four categories |
| "The order problem" + timeline + warning card | Services |
| Four pillars (Ownership / Momentum / Retention / Efficiency) | Services — folded into the timeline steps, so the copy survives without duplicating the argument |
| Industry-standard tools + tools-in-motion video | Services |
| The 8-question standard | Services |
| Studio / product photography coverflow | Work — it's proof, so it belongs with the proof |
| Full testimonial wall (6 quotes) | Work — `#receipts` |
| Batman / personal story | About |

### Hero

The multilingual welcome cycle is **kept**, demoted to a small rotating eyebrow
above the headline. The signature animation survives; the H1 now states what
the work is instead of saying hello for four lines.

The Vanta birds field, the word-cycle panel, its orbit rings, the spinning
badge and the doodle stars are all unchanged.

---

## 3. Work page

- **The GameSloth trailer was missing from this page entirely.** It now opens
  it, as a proper case study: problem → work → result → the five-star review
  screenshot, shown exactly as taken.
- Sections are now Video & motion / Websites / Design & studio / Social /
  Receipts, with the sticky sub-nav extended from three items to five.
- The sub-nav's sliding gold indicator re-measures from live element positions,
  so it still tracks correctly with the extra items.

---

## 4. Bugs found and fixed

1. **`main.js` overrode the video player's own `data-autoplay="false"` flag.**
   The selector grabbed every `.reel-card video`, so featured trailers played
   themselves despite being marked otherwise. Now excluded, and the whole
   observer is skipped under reduced-motion or Save-Data.

2. **three.js + Vanta were render-blocking in `<head>`** — roughly 600KB before
   first paint. They now load on idle, only on viewports ≥900px, and are
   skipped entirely under reduced-motion, Save-Data, or a 2G connection. A
   large share of this site's traffic arrives from Instagram on a phone.

3. **Mobile tap targets.** Measured at 390px: player buttons were 29×29, the
   volume track **3px tall**, carousel dots 8×8, footer links 16px high. Fixed
   under `@media (pointer: coarse)` so the desktop composition is untouched.
   The portfolio page went from 45 undersized targets to 7.

4. **Heading levels skipped h2 → h4/h5** on every page. All now run without
   gaps; CSS selectors were widened so nothing lost its styling.

5. **`</main>` closed before `.anchors-scope`** on the portfolio page —
   invalid nesting.

6. **Ghost numerals and the eyebrow decode effect** only matched the old
   section class names, so the new sections silently lost both. Selectors
   extended to `.head-split` and `.svc-intro`.

7. **The four-column slate clipped "gamesloth.app"** when placed in a ~330px
   side column. Two columns there instead.

---

## 5. Accessibility

- Skip link on every page; a real `<main>` landmark on every page.
- Visible `:focus-visible` ring — the previous sheet relied on the UA default,
  which vanishes against the dark surfaces.
- `prefers-reduced-motion` now disables the scroll comet, the marquee, the
  reveals, the greeting cycle and the word cycle.
- `aria-label` on every player control, describing which video it belongs to.
- Alt text rewritten to describe the work rather than name the file.

---

## 6. SEO

- Unique title + meta description per page, written around the actual services
  (video editing, motion graphics, content management, automation, AI) without
  stuffing the visible copy.
- Canonical URLs, Open Graph and Twitter card metadata on all pages.
- JSON-LD: `Person` on the homepage, `CollectionPage` on Work, `Service` with
  an offer catalogue on Services, `AboutPage` on About.
- `sitemap.xml` and `robots.txt` added. `/videorole/` is excluded from both.

---

## 7. New / changed files

```
NEW  assets/css/structure.css   new sections, touch targets, motion rules
NEW  services/index.html
NEW  about/index.html
NEW  sitemap.xml, robots.txt
EDIT index.html                 rebuilt
EDIT portfolio/index.html       rebuilt, GameSloth added
EDIT contact | automations | videorole | 404   nav, footer, metadata
EDIT assets/js/main.js          autoplay flag respected
EDIT assets/js/enhance.js       ghost numerals on new sections
EDIT assets/css/styles.css      heading selectors widened
EDIT assets/css/video-player.css  heading selectors widened
```

Everything else is untouched.

---

## 8. Verified

All 8 pages parse clean (html5lib). All 7 stylesheets parse clean (tinycss2).
Zero broken internal links or anchors, no duplicate IDs, one `<h1>` per page.
No horizontal overflow at 1440px or 390px. Checked in headless Chromium.

---

## 9. Still worth doing

1. **The GameSloth trailer is hotlinked from `gamesloth.app`.** If that file is
   renamed or moved, the block breaks. There's a graceful fallback, but the
   durable fix is re-uploading it to your own Cloudinary and swapping the
   `src` in `index.html` and `portfolio/index.html`.
2. **Several thumbnails come from imgur**, which is why `imgur-proxy.js` exists.
   Worth moving to Cloudinary alongside everything else.
3. **Ask Nick.** Featuring a client's product and review this prominently is
   worth a message before it goes live.
