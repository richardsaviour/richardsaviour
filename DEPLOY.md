# Deploy guide

Two parts. Part 1 puts the site online. Part 2 turns Robin into a real AI chatbot.
The site works fully after Part 1 — Robin just answers from built-in replies until Part 2 is done.

---

## Part 1 — Put the site on GitHub Pages

1. Open your site repo on GitHub (the one that holds the old site).
2. Delete the old files, but **keep the `CNAME` file** (it holds `richardsaviour.com`).
3. Upload everything inside this folder (`index.html`, `reviews.html`, `terms.html`, `privacy.html`, `assets/`, `server/`, `.nojekyll`, `.gitignore`, `DEPLOY.md`).
4. Commit.
5. In the repo: **Settings → Pages**. Source = "Deploy from a branch", Branch = `main`, folder = `/ (root)`. Save.
6. Wait about a minute, then open https://richardsaviour.com and hard-refresh (Ctrl + F5).

New repo instead? Do steps 3 to 5, then in Settings → Pages type `richardsaviour.com` under "Custom domain".

---

## Part 2 — Connect Robin to your LiteLLM gateway (on the VPS)

Robin's AI brain cannot live on GitHub Pages, because your API key would be visible to everyone.
So a tiny server (`server/robin-proxy`) runs on your VPS. It holds the key and talks to LiteLLM.

    website  →  robin-proxy (VPS, port 8787)  →  LiteLLM (VPS, port 4000)

### Step 1 — Install Node.js on the VPS
Download the LTS installer from https://nodejs.org and run it. Then check in PowerShell:

    node -v

It must say v18 or higher.

### Step 2 — Copy the proxy folder to the VPS
Copy `server/robin-proxy` to the VPS, for example to `C:\robin-proxy`.

### Step 3 — Fill in the settings
In `C:\robin-proxy`, copy `.env.example` to `.env`, open it in Notepad, and set:

- `LITELLM_BASE_URL` — your LiteLLM address with `/v1` at the end (usually `http://localhost:4000/v1`)
- `LITELLM_API_KEY` — a LiteLLM key
- `ROBIN_MODEL` — the LiteLLM model group Robin should use (for example `text`)
- `ALLOWED_ORIGINS` — `https://richardsaviour.com,https://www.richardsaviour.com`

### Step 4 — Start it and test
    cd C:\robin-proxy
    node server.js

In a second PowerShell window:

    Invoke-RestMethod http://localhost:8787/health

You should see `ok : True`.

### Step 5 — Give it a public HTTPS address
The website is HTTPS, so the proxy must be HTTPS too. Easiest way: a Cloudflare Tunnel
(needs richardsaviour.com DNS on Cloudflare). On the VPS:

    winget install --id Cloudflare.cloudflared
    cloudflared tunnel login
    cloudflared tunnel create robin
    cloudflared tunnel route dns robin robin.richardsaviour.com
    cloudflared tunnel run --url http://localhost:8787 robin

If outreach.richardsaviour.com already reaches your VPS another way (a reverse proxy),
use that same method to point `robin.richardsaviour.com` at `http://localhost:8787` instead.

Test from any browser: https://robin.richardsaviour.com/health

### Step 6 — Tell the website where Robin lives
Open `assets/js/robin-config.js` in the repo and set:

    apiUrl: "https://robin.richardsaviour.com/chat",

Commit. Open the site, ask Robin something. Done.

From now on Robin reads `robin-knowledge.md` before every answer, and every visitor's
email and questions are saved on the VPS:

- `C:\robin-proxy\leads.csv` — one row per email (open it in Excel)
- `C:\robin-proxy\chats.jsonl` — every question and answer, with the email

Want each new lead in n8n too? Put an n8n Webhook URL in `LEAD_WEBHOOK_URL` in `.env`.

### Step 7 — Keep it running after a reboot
    npm install -g pm2 pm2-windows-startup
    cd C:\robin-proxy
    pm2 start server.js --name robin
    pm2 save
    pm2-startup install

Run the tunnel as a service too:

    cloudflared service install

---

## Catching Robin's leads before the VPS server is ready (optional)

Robin always asks for an email first. Until Part 2 is done, that email is **not saved anywhere**.
To start saving leads today with n8n only:

1. In n8n, make a workflow that starts with a **Webhook** node (method POST).
2. Add what you want after it (Google Sheets row, Telegram message, email to yourself).
3. Copy the **Production URL** of the webhook and activate the workflow.
4. Paste it into `leadUrl` in `assets/js/robin-config.js`. Commit.

The webhook receives: `email`, `page`, `message`, `time`.

To stop Robin asking for emails, set `askEmailFirst: false` in the same file.

---

## Everyday edits

| I want to… | Edit this |
|---|---|
| Change what Robin knows or says | `assets/data/robin-knowledge.md` (Robin picks it up within 10 minutes) |
| Add or remove a video | `VIDEOS` list at the top of `assets/js/site.js` |
| Add or remove a brand or GIF in the hero ring | `BRANDS` and `GIFS` lists at the top of `assets/js/hero.js` |
| Add a review screenshot or video testimonial | `reviews.html` (copy an existing block) |
| Edit the Terms or Privacy text | `terms.html`, `privacy.html` |
| Change colors or fonts | top of `assets/css/base.css` |
| Change hero sizes and positions | "layout numbers" blocks in `assets/css/hero.css` |

## What lives where

- **GitHub Pages (static):** the whole site, Robin's look, Robin's offline replies.
- **VPS now:** `server/robin-proxy` (Robin's AI replies).
- **VPS later:** the client dashboard (sign-up, project scope, tasks with dates, payments by card
  through Paystack, US account or crypto). It will be its own app, for example at
  `clients.richardsaviour.com`. The homepage section is only an animation today.

## Font licence

`assets/fonts/acthirey-demo.woff2` is the DEMO of Acthirey, which is for personal use only.
Buy the commercial licence before the site goes live, then replace the file (keep the same name
or update the path at the top of `assets/css/base.css`).

## Terms and Privacy pages

`terms.html` and `privacy.html` are plain-English starting drafts, not legal advice.
They name Nigeria as the governing law. Have a lawyer check them before you rely on them.
