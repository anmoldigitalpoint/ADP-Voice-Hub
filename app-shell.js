// ===== ADP Voice Hub — shared app shell =====
// Renders sidebar + topbar identical across every page, and the
// WhatsApp-join popup that shows once per visit.

const ADP_LINKS = {
  whatsapp: "https://whatsapp.com/channel/REPLACE_ME",
  telegram: "https://t.me/REPLACE_ME",
  youtube: "https://youtube.com/@REPLACE_ME"
};

const ADP_TOOLS = [
  { href: "text-to-speech.html",   icon: "🔊", label: "Text to Speech" },
  { href: "audio-to-text.html",    icon: "📝", label: "Audio to Text" },
  { href: "pdf-to-speech.html",    icon: "📕", label: "PDF to Speech" },
  { href: "voice-recorder.html",   icon: "🎙️", label: "Voice Recorder" },
  { href: "voice-enhancer.html",   icon: "✨", label: "Voice Enhancer" },
  { href: "voice-changer.html",    icon: "🎭", label: "Voice Changer" },
  { href: "vocal-remover.html",    icon: "🎤", label: "Vocal Remover" },
  { href: "audio-trimmer.html",    icon: "✂️", label: "Audio Trimmer" },
  { href: "audio-merger.html",     icon: "🔗", label: "Audio Merger" },
  { href: "format-converter.html", icon: "🔄", label: "Format Converter" },
  { href: "mp4-to-mp3.html",       icon: "🎬", label: "MP4 to MP3" },
  { href: "ringtone-maker.html",   icon: "🔔", label: "Ringtone Maker" },
  { href: "volume-booster.html",   icon: "🔉", label: "Volume Booster" },
  { href: "speed-changer.html",    icon: "⏩", label: "Speed Changer" },
  { href: "youtube-transcript.html", icon: "▶️", label: "YouTube Transcript" },
  { href: "translator.html",       icon: "🌐", label: "AI Translator" }
];

function adpCurrentFile() {
  const p = window.location.pathname.split("/").pop();
  return p === "" ? "index.html" : p;
}

function renderShell(pageTitle) {
  const current = adpCurrentFile();
  const shellRoot = document.getElementById("app-shell-root");
  if (!shellRoot) return;

  const linksHtml = ADP_TOOLS.map(t => `
    <a class="side-link ${t.href === current ? 'active' : ''}" href="${t.href}">
      <span>${t.icon}</span><span>${t.label}</span>
    </a>`).join("");

  shellRoot.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="dot">🎙️</div>
          <div>ADP <span style="color:#4f8cff">Voice Hub</span><span class="sub">VOICE HUB</span></div>
        </div>
        <div class="side-search">🔍 Search tools...</div>
        <a class="side-link ${current === 'index.html' ? 'active' : ''}" href="index.html"><span>🏠</span><span>Home</span></a>
        <div class="side-section-label">Tools</div>
        ${linksHtml}
        <div class="side-section-label">Community</div>
        <a class="side-link" href="${ADP_LINKS.whatsapp}" target="_blank" rel="noopener"><span>💬</span><span>WhatsApp Channel</span></a>
        <a class="side-link" href="${ADP_LINKS.telegram}" target="_blank" rel="noopener"><span>✈️</span><span>Telegram Group</span></a>
        <a class="side-link" href="${ADP_LINKS.youtube}" target="_blank" rel="noopener"><span>▶️</span><span>YouTube</span></a>
        <div class="install-banner">
          📲 <strong>Install ADP Voice Hub</strong>
          <div style="color:var(--muted);margin-top:4px;">Add to your home screen for the app experience.</div>
          <button id="pwa-install-btn">Install Now</button>
        </div>
        <div class="side-footer">© 2026 ADP Voice Hub</div>
      </aside>
      <div class="main-area">
        <div class="topbar">
          <div class="topbar-search">🔍 Search tools... <span style="margin-left:auto;opacity:.6;">Ctrl /</span></div>
          <div class="topbar-right">
            <span title="Toggle theme">🌙</span>
            <div class="avatar">ADP</div>
          </div>
        </div>
        <div class="page-content" id="page-content"></div>
      </div>
    </div>
  `;

  if (pageTitle) {
    const pc = document.getElementById("page-content");
    const titleBlock = document.createElement("div");
    titleBlock.innerHTML = `<h1 class="page-title">${pageTitle.title}</h1><p class="page-sub">${pageTitle.sub || ""}</p>`;
    pc.appendChild(titleBlock);
  }
}

// ---------- WhatsApp join popup (once per browser session) ----------
function showWhatsAppPopup() {
  if (sessionStorage.getItem("adp_wa_popup_shown")) return;
  sessionStorage.setItem("adp_wa_popup_shown", "1");
  const overlay = document.createElement("div");
  overlay.className = "wa-overlay";
  overlay.innerHTML = `
    <div class="wa-modal">
      <div class="ic">💬</div>
      <h3>Join our WhatsApp Channel</h3>
      <p>Get updates on new free tools, tips & voices — straight on WhatsApp.</p>
      <a class="control-btn" href="${ADP_LINKS.whatsapp}" target="_blank" rel="noopener">Join WhatsApp Channel</a>
      <a class="control-btn secondary" id="wa-close" style="display:block;">Maybe later</a>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("wa-close").onclick = () => overlay.remove();
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}

// ---------- PWA install prompt ----------
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

document.addEventListener("DOMContentLoaded", () => {
  showWhatsAppPopup();
  const btn = document.getElementById("pwa-install-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
      } else {
        alert("Apne browser ke menu (⋮) me jaake 'Add to Home Screen' / 'Install App' option choose karein.");
      }
    });
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
});
