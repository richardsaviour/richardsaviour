/* ============================================================
   ROBIN — SETTINGS (the only file you edit to connect Robin)
   ============================================================

   apiUrl
     Leave "" and Robin runs in OFFLINE mode: it answers common
     questions from built-in replies and points people to email.

     To make Robin a real AI chatbot, deploy server/robin-proxy on
     your VPS (see DEPLOY.md) and put its public HTTPS address here:
       "https://robin.richardsaviour.com/chat"
     The server reads assets/data/robin-knowledge.md before every answer.

   leadUrl
     Where a visitor's email is sent the moment they give it to Robin.
     - Leave "" once apiUrl is set: leads then go to the same server
       (it saves them in leads.csv on the VPS).
     - Or paste an n8n Webhook URL here to catch leads without the VPS
       server. It receives JSON: { email, page, message, time }.
     IMPORTANT: while BOTH are "", Robin still asks for the email but
     it is NOT saved anywhere.

   Your LiteLLM base URL and API key do NOT go in this file.
   They live in server/robin-proxy/.env on the VPS, so nobody
   can read them from the website.
   ============================================================ */
window.ROBIN_CONFIG = {
  apiUrl: "https://robin.richardsaviour.com/chat",
  leadUrl: "",
  askEmailFirst: true,     // false = Robin answers without asking for an email
  email: "richardsaviourz@gmail.com",
  calendar: "https://calendly.com/richardsaviour/activecall30mins",
  privacyUrl: "privacy.html",
  chips: ["What videos can you make?", "How fast is delivery?", "How much does a video cost?", "Can you build me an app?"],
};
