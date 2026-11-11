/* ============================================================
   ROBIN — animated orb + chat widget
   1. Draws the orb wherever the page has  <span data-robin-orb>
   2. Loops the idle behaviours (wave, hop, sleep, dizzy; blinking is always on)
   3. Docks a floating button once you scroll past Robin's intro
   4. Chat window:
        - asks for the visitor's email first (so Richard can follow up)
        - then answers from ROBIN_CONFIG.apiUrl if set, otherwise offline replies
   ============================================================ */
(function () {
  const CFG = window.ROBIN_CONFIG || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EMAIL_RE = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;

  /* ---------- 1. The orb ---------- */
  const ORB_HTML =
    '<span class="orb__shadow"></span>' +
    '<span class="orb__body"><span class="orb__eye orb__eye--l"></span><span class="orb__eye orb__eye--r"></span><span class="orb__visor"></span></span>' +
    '<span class="orb__hand"></span><span class="orb__zzz">z</span>';
  function drawOrb(el) {
    el.classList.add("orb");
    el.dataset.state = "idle";
    el.innerHTML = ORB_HTML;
  }
  document.querySelectorAll("[data-robin-orb]").forEach(drawOrb);

  /* ---------- 2. Idle behaviours on a loop ---------- */
  // [state, how long it lasts in ms]
  const LOOP = [["wave", 2600], ["idle", 2600], ["hop", 1600], ["idle", 3000], ["sleep", 4200], ["idle", 2200], ["dizzy", 2200], ["idle", 3200]];
  function cycle(el) {
    if (reduce) return;
    let i = 0;
    (function next() {
      const [state, ms] = LOOP[i % LOOP.length];
      el.dataset.state = state;
      i++;
      setTimeout(next, ms);
    })();
  }
  document.querySelectorAll("[data-robin-orb][data-cycle]").forEach(cycle);

  /* ---------- 3 + 4. Dock button and chat window ---------- */
  const dock = document.createElement("button");
  dock.type = "button";
  dock.className = "rdock";
  dock.setAttribute("aria-label", "Chat with Robin");
  dock.innerHTML = '<span data-orb></span><span>Ask Robin</span>';
  drawOrb(dock.querySelector("[data-orb]"));

  const chat = document.createElement("section");
  chat.className = "rchat";
  chat.setAttribute("aria-label", "Chat with Robin");
  chat.innerHTML =
    '<header class="rchat__head"><span data-orb></span><div><p class="rchat__name">Robin</p><p class="rchat__role">Richard\'s assistant</p></div>' +
    '<button class="rchat__x" type="button" aria-label="Close chat">✕</button></header>' +
    '<div class="rchat__log" aria-live="polite"></div>' +
    '<div class="rchat__chips" hidden></div>' +
    '<form class="rchat__form"><label class="sr-only" for="robin-input">Message Robin</label>' +
    '<input id="robin-input" type="text" autocomplete="off" maxlength="600">' +
    '<button type="submit" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></form>' +
    '<p class="rchat__note">Your email is only used so Richard can follow up with you. ' +
    (CFG.privacyUrl ? '<a href="' + CFG.privacyUrl + '">Privacy</a>' : "") + "</p>";
  const chatOrb = chat.querySelector("[data-orb]");
  drawOrb(chatOrb);
  document.body.append(dock, chat);

  const log = chat.querySelector(".rchat__log");
  const chips = chat.querySelector(".rchat__chips");
  const form = chat.querySelector(".rchat__form");
  const input = form.querySelector("input");
  const sendBtn = form.querySelector("button");
  const history = [];          // [{role, content}] sent to the backend
  let greeted = false;
  let busy = false;

  /* The visitor's email. Remembered in this browser so they are asked only once. */
  let visitorEmail = "";
  try { visitorEmail = localStorage.getItem("robin_email") || ""; } catch (e) {}
  const needEmail = () => CFG.askEmailFirst !== false && !visitorEmail;

  function setInputMode() {
    input.placeholder = needEmail() ? "your@email.com" : "Type your question";
    input.autocomplete = needEmail() ? "email" : "off";
    input.inputMode = needEmail() ? "email" : "text";
    chips.hidden = needEmail();
  }

  /* Safe text → HTML: escape everything, then turn emails and links into <a> */
  function rich(text) {
    const esc = text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    return esc
      .replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, "")}</a>`)
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]*\w/g, (m) => `<a href="mailto:${m}">${m}</a>`);
  }
  function add(role, text) {
    const el = document.createElement("div");
    el.className = "msg " + (role === "user" ? "msg--me" : "msg--bot");
    el.innerHTML = rich(text);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function typing() {
    const el = document.createElement("div");
    el.className = "msg msg--bot msg--typing";
    el.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  const contactLine = () =>
    `Email Richard: ${CFG.email} (he replies in under 30 minutes)` + (CFG.calendar ? `\nOr book a call: ${CFG.calendar}` : "");

  /* ---------- Save the lead (email) so Richard can follow up ---------- */
  function saveLead(email, message) {
    visitorEmail = email;
    try { localStorage.setItem("robin_email", email); } catch (e) {}
    const url = CFG.leadUrl || (CFG.apiUrl ? CFG.apiUrl.replace(/\/chat\/?$/, "/lead") : "");
    if (!url) return;      // nothing connected yet — see robin-config.js
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, page: location.pathname, message: message || "", time: new Date().toISOString() }),
    }).catch((err) => console.warn("[Robin] could not save lead:", err));
  }

  /* ---------- Offline replies (used when apiUrl is empty or the server is down) ----------
     Keep these in line with assets/data/robin-knowledge.md                              */
  function offlineReply(q) {
    const s = q.toLowerCase();
    // true if any of the words starts a word in the question ("automat" matches "automation")
    const has = (...w) => new RegExp("\\b(" + w.join("|") + ")").test(s);
    if (s.includes("$") || has("price", "pricing", "cost", "how much", "rates?\\b", "charge", "budget", "quote", "fee"))
      return `Videos run from $10 to $100, depending on complexity. For an exact quote, send Richard the details.\n${contactLine()}`;
    if (has("outreach", "cold", "dms?\\b", "bulk", "mailbox"))
      return `Outreach is a free app Richard built: cold DMs and emails, bulk sending without limits, up to 5 mailboxes. Try it: https://outreach.richardsaviour.com\nWant your own custom version? ${contactLine()}`;
    if (has("fast", "how long", "deliver", "turnaround", "deadline", "quick", "how soon", "speed"))
      return "Fast. Most videos are done in just a few hours, no matter the complexity. Apps and automations are fully delivered in less than a week. And Richard replies to email in under 30 minutes.";
    if (has("apps?\\b", "build", "software", "website", "dashboard"))
      return `Yes. Richard can build any app you need, fully delivered in less than a week. Tell him what you have in mind.\n${contactLine()}`;
    if (has("automat", "bot", "workflow", "n8n", "crm", "trading", "ai agent", "engine"))
      return `Richard can automate anything: workflows, bots, content engines, lead follow-ups, trading tools and AI agents. For your exact setup, send him the details.\n${contactLine()}`;
    if (has("video", "edit", "explainer", "trailer", "reel", "shorts?\\b", "ads?\\b", "ugc", "animation", "talking", "youtube", "tiktok", "service", "offer"))
      return "Any type of video: explainers, talking heads, trailers, product promos, ads, AI UGC ads, shorts and reels, logo animations, motion graphics and long-form YouTube edits.";
    if (has("process", "start", "how do", "how does", "begin", "hire", "next step", "pay"))
      return `Simple: 1) Email Richard your plan, idea and scope. 2) He replies with a quote and a delivery time. 3) He delivers, and you ask for changes if needed.\n${contactLine()}`;
    if (has("review", "rating", "testimonial", "client"))
      return "Richard is rated 4.9/5 by 50+ clients. You can see the reviews on the Reviews page.";
    if (has("email", "contact", "call", "reach", "talk", "phone", "human", "richard"))
      return contactLine();
    if (has("hi\\b", "hello", "hey", "yo\\b", "good (morning|afternoon|evening)"))
      return "Hey! Ask me about videos, automation, apps, delivery time or pricing.";
    return `Good question. That one is best answered by Richard himself.\n${contactLine()}`;
  }

  /* ---------- Ask the backend (your proxy → LiteLLM, OpenAI-compatible) ---------- */
  async function askServer() {
    const res = await fetch(CFG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: visitorEmail, messages: history.slice(-12) }),
    });
    if (!res.ok) throw new Error("Robin server replied " + res.status);
    const data = await res.json();
    if (!data.reply) throw new Error("Empty reply");
    return data.reply;
  }

  async function answer(question) {
    history.push({ role: "user", content: question });
    const dots = typing();
    chatOrb.dataset.state = "hop";
    let reply;
    try {
      if (CFG.apiUrl) reply = await askServer();
      else { await new Promise((r) => setTimeout(r, 500)); reply = offlineReply(question); }
    } catch (err) {
      console.warn("[Robin] falling back to offline reply:", err);
      reply = offlineReply(question);
    }
    dots.remove();
    chatOrb.dataset.state = "idle";
    add("assistant", reply);
    history.push({ role: "assistant", content: reply });
  }

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    add("user", text);

    if (needEmail()) {
      /* Step 1: we need an email before anything is answered */
      const found = text.match(EMAIL_RE);
      if (!found) {
        add("assistant", "I just need your email first, then ask me anything 🙂");
      } else {
        // anything typed besides the email counts as their first question
        const question = text.replace(found[0], "").replace(/\s+/g, " ").trim();
        const real = /[a-z]{3,}/i.test(question) && question.length > 8;
        saveLead(found[0], real ? question : "");
        setInputMode();
        if (real) await answer(question);
        else add("assistant", "Thanks, got it ✅ What would you like to know?");
      }
    } else {
      await answer(text);
    }
    busy = false;
    sendBtn.disabled = false;
  }

  function open() {
    chat.classList.add("is-open");
    dock.classList.remove("is-in");
    if (!greeted) {
      greeted = true;
      add("assistant", needEmail()
        ? "Hi, I'm Robin, Richard's assistant 👋\nBefore we start, what's your email? Richard uses it to follow up with you."
        : "Hi again, I'm Robin 👋 Ask me anything about videos, automation or apps.");
      (CFG.chips || []).forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c;
        b.addEventListener("click", () => send(c));
        chips.appendChild(b);
      });
      setInputMode();
      chatOrb.dataset.state = "wave";
      setTimeout(() => (chatOrb.dataset.state = "idle"), 2400);
    }
    // don't pop the keyboard open on phones
    if (matchMedia("(hover: hover)").matches) input.focus();
  }
  function close() {
    chat.classList.remove("is-open");
    placeDock();
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); const t = input.value; input.value = ""; send(t); });
  chat.querySelector(".rchat__x").addEventListener("click", close);
  dock.addEventListener("click", open);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && chat.classList.contains("is-open")) close(); });
  // any element with data-robin-open opens the chat
  document.querySelectorAll("[data-robin-open]").forEach((el) =>
    el.addEventListener("click", (e) => { e.preventDefault(); open(); })
  );

  /* ---------- 3. Docking: show the floating button after Robin's intro has scrolled past.
     Pages without the intro (Reviews, legal pages) show it straight away.               */
  const intro = document.getElementById("robin");
  function placeDock() {
    if (chat.classList.contains("is-open")) return;
    const past = !intro || intro.getBoundingClientRect().bottom < innerHeight * 0.35;
    dock.classList.toggle("is-in", past);
  }
  addEventListener("scroll", placeDock, { passive: true });
  addEventListener("resize", placeDock);
  placeDock();
})();
