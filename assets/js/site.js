/* ============================================================
   SITE — video grid + lightbox, automation flow, dashboard mock
   ============================================================ */

/* ---------- Video samples ----------
   To add a video: upload it to Cloudinary, then add a line here.
   id    = the part of the Cloudinary URL after /video/upload/ (no .mp4)
   label = the one-line content type shown on the card
   Thumbnails are a frame from inside each video (Cloudinary picks it). */
const CLOUD = "https://res.cloudinary.com/dbtuidmoh/video/upload/";
const VIDEOS = [
  { id: "v1782668210/Mix_1_vutcez",                            label: "Agency showreel" },
  { id: "v1791778569/6becd1b9eb9881461c5b2c703ded468a_qgpa3o", label: "Showreel" },
  { id: "v1789829456/gamesloth-product-trailer-v1_zvj2ic",     label: "Product trailer" },
  { id: "v1791778570/richardedit_lnd3py",                      label: "Talking head" },
  { id: "v1782666070/Explainers_-_Richard_Saviour_mnsrw4",     label: "2D explainer" },
  { id: "v1782666047/saas_product_promo_-_richard_saviour_h0jwn6", label: "SaaS app promo" },
  { id: "v1782666054/general_video_editing_e9mlpw",            label: "Short-form edit" },
  { id: "v1782672359/8e2f883e7594c3df52b1f385d979e2da_720w_bekua2", label: "AI UGC ad" },
  { id: "v1782666041/logo_animation_Richard_Saviour_f5gxsf",   label: "Logo animation" },
  { id: "v1782667618/88447b707f483e52ecf9d092efefed96_720w_1_geeqiw", label: "Motion graphics" },
];
const thumb = (id) => `${CLOUD}so_auto,c_limit,w_640,q_auto,f_auto/${id}.jpg`;
const file = (id) => `${CLOUD}${id}.mp4`;

/* ---------- Lightbox: glance, click, watch, close ---------- */
const lightbox = (() => {
  const box = document.getElementById("lb");
  if (!box) return { open() {} };
  const video = document.getElementById("lb-video");
  const label = document.getElementById("lb-label");
  let list = [];
  let at = 0;
  let opener = null;

  function show(i) {
    at = (i + list.length) % list.length;
    video.src = list[at].src;
    video.poster = list[at].poster || "";
    label.textContent = list[at].label || "";
    video.play().catch(() => {});       // autoplay may be blocked; controls are there
  }
  function open(items, i, from) {
    list = items;
    opener = from || null;
    box.classList.toggle("lb--single", items.length < 2);
    box.hidden = false;
    document.body.style.overflow = "hidden";
    show(i);
    box.querySelector("[data-lb-close]").focus();
  }
  function close() {
    video.pause();
    video.removeAttribute("src");       // stop downloading
    video.load();
    box.hidden = true;
    document.body.style.overflow = "";
    if (opener) opener.focus();
  }
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target.closest("[data-lb-close]")) close();
    else if (e.target.closest("[data-lb-prev]")) show(at - 1);
    else if (e.target.closest("[data-lb-next]")) show(at + 1);
  });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(at - 1);
    if (e.key === "ArrowRight") show(at + 1);
  });
  return { open };
})();

/* Builds one video card (used on the home grid and the Reviews page) */
function videoCard(item, onClick) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "vcard";
  card.setAttribute("aria-label", `Play: ${item.label}`);
  const img = new Image();
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";
  img.onerror = () => img.remove();
  img.src = item.poster;
  card.innerHTML = `<span class="vcard__play"><svg><use href="#i-play"/></svg></span><span class="vcard__label"></span>`;
  card.querySelector(".vcard__label").textContent = item.label;
  card.prepend(img);
  card.addEventListener("click", () => onClick(card));
  return card;
}

/* Home page grid */
(function grid() {
  const grid = document.getElementById("vgrid");
  if (!grid) return;
  const items = VIDEOS.map((v) => ({ src: file(v.id), poster: thumb(v.id), label: v.label }));
  items.forEach((item, i) => grid.appendChild(videoCard(item, (card) => lightbox.open(items, i, card))));
})();

/* Reviews page: any element with data-video="<cloudinary id>" becomes a playable card */
document.querySelectorAll("[data-video]").forEach((slot) => {
  const item = { src: file(slot.dataset.video), poster: thumb(slot.dataset.video), label: slot.dataset.label || "" };
  slot.replaceWith(videoCard(item, (card) => lightbox.open([item], 0, card)));
});

/* ---------- Automation flow: labels rotate through use cases ---------- */
const FLOWS = [
  { name: "Lead follow-up",    steps: ["New lead comes in", "AI writes the reply", "CRM updated, email sent"] },
  { name: "Content engine",    steps: ["New video idea", "Script, edit, captions", "Posted on every channel"] },
  { name: "Trading tool",      steps: ["Market signal", "Bot checks your rules", "Trade placed, alert sent"] },
  { name: "Client app",        steps: ["Client signs up", "App sets up their space", "Welcome pack delivered"] },
];
(function flow() {
  const box = document.getElementById("flow");
  if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const name = document.getElementById("flow-name");
  const slots = box.querySelectorAll("[data-flow]");
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % FLOWS.length;
    box.classList.add("is-swapping");
    setTimeout(() => {
      name.textContent = FLOWS[i].name;
      slots.forEach((s, n) => (s.textContent = FLOWS[i].steps[n]));
      box.classList.remove("is-swapping");
    }, 320);
  }, 3600);
})();

/* ---------- Dashboard mock: milestones tick off one by one, then payment releases ---------- */
(function mock() {
  const box = document.getElementById("mock");
  if (!box) return;
  const rows = [...box.querySelectorAll(".mock__list li")];
  const fill = document.getElementById("mock-fill");
  const done = document.getElementById("mock-done");
  const pay = box.querySelector(".mock__pay");
  const payTitle = document.getElementById("mock-pay-title");
  const paySub = document.getElementById("mock-pay-sub");
  let step = 0;
  let timer = null;

  function paint() {
    rows.forEach((r, n) => r.classList.toggle("is-done", n < step));
    const ticked = Math.min(step, rows.length);
    done.textContent = ticked;
    fill.style.width = `${(ticked / rows.length) * 100}%`;
    const paid = step > rows.length;
    pay.classList.toggle("is-paid", paid);
    payTitle.textContent = paid ? "Payment released" : "Payment held in escrow";
    paySub.textContent = paid ? "You approved every milestone" : "Released by you when everything is ticked";
  }
  function tick() {
    step = step > rows.length + 2 ? 0 : step + 1;   // +2 = hold the finished state a moment
    paint();
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { step = 3; paint(); return; }
  // only run while the mock is on screen
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) timer = setInterval(tick, 1100);
  }, { threshold: .3 }).observe(box);
})();

/* ---------- Outreach app card: mailboxes take turns sending, counter climbs ---------- */
(function sender() {
  const box = document.getElementById("sender");
  if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const boxes = [...box.querySelectorAll(".sender__boxes li")];
  const count = document.getElementById("sender-n");
  const last = document.getElementById("sender-last");
  let n = 0;
  let timer = null;
  function tick() {
    const i = n % boxes.length;
    n++;
    boxes.forEach((b, k) => b.classList.toggle("is-on", k === i));
    count.textContent = (n * 7).toLocaleString();
    last.textContent = `Mailbox ${i + 1} · ${n % 3 === 0 ? "DM" : "email"} sent`;
  }
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) timer = setInterval(tick, 900);
  }, { threshold: .3 }).observe(box);
})();

/* ---------- "Copy email" buttons: <button data-copy="text"> ---------- */
document.querySelectorAll("[data-copy]").forEach((btn) => {
  const label = btn.textContent;
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = "Copied";
    } catch (err) {
      btn.textContent = btn.dataset.copy;     // clipboard blocked: show it so it can be selected
    }
    setTimeout(() => (btn.textContent = label), 2000);
  });
});

/* ---------- Review screenshots: click to read them big ---------- */
(function zoom() {
  const shots = document.querySelectorAll(".shot img");
  if (!shots.length) return;
  const box = document.createElement("div");
  box.className = "zoom";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Review screenshot");
  box.innerHTML = '<button class="lb__x" type="button" aria-label="Close">✕</button><div class="zoom__scroll"><img alt=""></div>';
  document.body.appendChild(box);
  const big = box.querySelector("img");
  let opener = null;

  function open(img) {
    opener = img;
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    box.hidden = false;
    document.body.style.overflow = "hidden";
    box.querySelector("button").focus();
  }
  function close() {
    box.hidden = true;
    document.body.style.overflow = "";
    if (opener) opener.focus();
  }
  shots.forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Open review screenshot: " + img.alt);
    img.addEventListener("click", () => open(img));
    img.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img); } });
  });
  box.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (!box.hidden && e.key === "Escape") close(); });
})();

/* ---------- Scroll animation: blocks rise in as they enter and slip out as they leave ----------
   Add or remove selectors in REVEAL to choose what animates.
   Turned off for visitors who ask for reduced motion.                                       */
(function reveal() {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const REVEAL = [
    ".bento > *", ".next", ".vgrid .vcard", ".claim", ".sechead",
    ".auto__say", ".auto__show", ".outreach", ".dash__say", ".mock",
    ".mailme__in > *", ".foot .wrap", ".rsec > .h2", ".rsec__grid > *", ".vtest", ".legal",
  ];
  const items = [...document.querySelectorAll(REVEAL.join(","))];
  if (!items.length) return;

  // stagger: items that share a parent come in one after another
  const order = new Map();
  items.forEach((el) => {
    const n = order.get(el.parentElement) || 0;
    order.set(el.parentElement, n + 1);
    el.style.setProperty("--d", Math.min(n, 6) * 70 + "ms");
    el.classList.add("reveal");
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const el = e.target;
      const seen = e.intersectionRect.height;
      // in: a fair slice is on screen. out: almost none is.
      if (seen >= Math.min(e.boundingClientRect.height * 0.3, innerHeight * 0.25)) {
        el.classList.add("is-in");
      } else if (seen < Math.min(e.boundingClientRect.height * 0.12, innerHeight * 0.08)) {
        el.classList.remove("is-in");
        // leave upward when it exits through the top, downward through the bottom
        el.dataset.exit = e.boundingClientRect.top < 0 ? "top" : "bottom";
      }
    });
  }, { threshold: [0, 0.05, 0.12, 0.2, 0.3, 0.5, 0.8, 1] });
  items.forEach((el) => io.observe(el));
})();
