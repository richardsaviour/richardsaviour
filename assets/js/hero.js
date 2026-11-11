/* ============================================================
   HERO
   1. Builds the rotating ring of cards (brands + logo-animation GIFs)
   2. Starts the Vanta birds in the background (with safe fallbacks)
   ============================================================ */

/* ---------- 1. Ring cards ----------
   To add / remove / reorder a card, edit the two lists below.
   img:      picture for the card. If missing or it fails to load,
             the card shows the initials on a colour tile.
   logo:     true = fit the whole image inside the tile (for logos/mascots)
   Tip: put logo files in assets/img/brands/ and point img at them —
        local files load faster and never break.                      */
/* Brands I've worked with */
const BRANDS = [
  { name: "GameSloth",        initials: "GS",  img: "assets/img/brands/gamesloth.webp", logo: true },
  { name: "TBCreations",      initials: "TB",  img: "https://i.imgur.com/LAIm5st.png" },
  { name: "PuddlesBGone",     initials: "PB",  img: "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/18aTc2noRdTgWNe6Okwj/media/6798cedb9dbb3778fe036dac.png" },
  { name: "Mind Trainer Pro", initials: "MT",  img: "https://assets.cdn.filesafe.space/RQxOzYrxraN8KvkfDnWp/media/67518cb26c55b54d25e14b90.png" },
  { name: "HybridDude",       initials: "HD",  img: "https://i.imgur.com/K6Ur4Lf.jpeg" },
  { name: "Royal of India",   initials: "RI",  img: "https://i.imgur.com/EIy10TB.jpeg" },
  { name: "585 Cash Lanes",   initials: "585", img: "https://i.imgur.com/P9WMViA.jpeg" },
  { name: "Bible Haven",      initials: "BH",  img: "https://i.imgur.com/34B0J9X.jpeg" },
];
/* Logo-animation GIFs. One is placed after every brand card, so the ring stays full.
   Add more GIFs to this list and they join the rotation. */
const GIFS = [
  "assets/img/anim/growspace.gif",
  "assets/img/anim/solar.gif",
  "assets/img/anim/creative-green.gif",
];
/* brand, gif, brand, gif, ... */
const RING = BRANDS.flatMap((brand, i) => [
  brand,
  { name: "Logo animation", initials: "", img: GIFS[i % GIFS.length] },
]);

/* Tile colours for the initials fallback (brand palette) */
const TILES = [
  ["#fff", "#3c0f0f"], ["#e2a324", "#3c0f0f"], ["#b89c7a", "#3c0f0f"], ["#4b352a", "#fff"],
];

function buildRing(ring) {
  RING.forEach((item, i) => {
    const [bg, ink] = TILES[i % TILES.length];
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = `--i:${i};--n:${RING.length};--tile:${bg};--tile-ink:${ink}`;

    const art = document.createElement("div");
    art.className = "card__art" + (item.logo ? " card__art--logo" : "");
    art.textContent = item.initials;
    if (item.img) {
      const img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => img.remove();      // keep the initials tile
      img.src = item.img;
      art.appendChild(img);
    }

    const name = document.createElement("div");
    name.className = "card__name";
    name.textContent = item.name;

    card.append(art, name);
    ring.appendChild(card);
  });
}
document.querySelectorAll(".orbit__spin").forEach(buildRing);

/* ---------- 2. Vanta birds ----------
   - Transparent background, brand colours, a small flock (kept quiet on purpose).
   - Skipped if the visitor asked for reduced motion or WebGL is missing —
     the plain maroon background simply stays.
   - Stopped while the hero is off-screen to save battery.                 */
(function birds() {
  const hero = document.getElementById("hero");
  const el = document.getElementById("birds");
  if (!hero || !el) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = matchMedia("(max-width: 660px)").matches;
  let effect = null;

  function start() {
    if (effect || reduce || !window.VANTA || !window.VANTA.BIRDS) return;
    try {
      effect = window.VANTA.BIRDS({
        el,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        backgroundAlpha: 0,          // see-through: the maroon hero shows behind
        color1: 0xe2a324,            // burnt yellow
        color2: 0xb89c7a,            // tan
        colorMode: "lerp",
        quantity: small ? 2 : 3,     // 2 = 16 birds, 3 = 64 birds
        birdSize: small ? 1 : 0.8,
        wingSpan: 22,
        speedLimit: 3.5,
        separation: 70,
        alignment: 30,
        cohesion: 25,
      });
    } catch (err) {
      effect = null;                 // WebGL not available — plain background stays
    }
  }
  function stop() {
    if (effect) { effect.destroy(); effect = null; }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(hero);
  } else {
    start();
  }
})();
