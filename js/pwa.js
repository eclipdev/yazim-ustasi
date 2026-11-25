/* Siteyi Chrome'da uygulama olarak kurulabilir yapar (PWA) ve üst çubuğa
   "Uygulamayı yükle" düğmesini ekler.
   Masaüstü (Electron) kabukta atlanır; orada dosyalar zaten yerelden sunulur. */
(() => {
  if (!("serviceWorker" in navigator)) return;
  if (navigator.userAgent.includes("Electron")) return;

  const { protocol, hostname } = location;
  const secure =
    protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";
  if (!secure) return;

  window.addEventListener("load", () => {
    const scope = new URL("./", document.baseURI);
    navigator.serviceWorker.register(new URL("sw.js", scope).href, { scope: scope.href }).catch(() => {
      /* Gizli sekme ya da destek yok: site normal çalışır. */
    });
  });

  // ---------- Yükle düğmesi ----------

  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    navigator.standalone === true;
  if (installed) return;

  // iPhone/iPad Safari kurulum penceresi açmaz; düğme elle ekleme yolunu gösterir.
  const ua = navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);

  let deferred = null;
  let button = null;
  let help = null;

  function buildButton() {
    if (button) return button;
    const bar = document.querySelector(".topbar-actions");
    if (!bar) return null;

    button = document.createElement("button");
    button.type = "button";
    button.className = "install-btn";
    button.id = "installBtn";
    button.hidden = true;
    button.title = "Uygulamayı bu cihaza yükle";
    button.setAttribute("aria-label", "Uygulamayı yükle");
    button.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" stroke-linecap="round" stroke-linejoin="round" />' +
      "</svg><span>Uygulamayı yükle</span>";
    button.addEventListener("click", onClick);
    bar.prepend(button);
    return button;
  }

  function show() {
    const b = buildButton();
    if (b) b.hidden = false;
  }

  function hide() {
    if (button) button.hidden = true;
    closeHelp();
  }

  function closeHelp() {
    if (help) {
      help.remove();
      help = null;
    }
  }

  function showHelp(text) {
    closeHelp();
    help = document.createElement("div");
    help.className = "install-help";
    help.setAttribute("role", "status");
    const p = document.createElement("p");
    p.textContent = text;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "linkish";
    close.textContent = "Kapat";
    close.addEventListener("click", closeHelp);
    help.append(p, close);
    document.body.append(help);
  }

  async function onClick() {
    if (deferred) {
      const prompt = deferred;
      deferred = null;
      prompt.prompt();
      try {
        const choice = await prompt.userChoice;
        if (choice && choice.outcome === "accepted") hide();
      } catch {
        /* Pencere kapandı: düğme yerinde kalır. */
      }
      return;
    }
    if (isIos) {
      showHelp("Safari'de alttaki Paylaş düğmesine dokun, sonra \"Ana Ekrana Ekle\"yi seç.");
    } else {
      showHelp(
        "Tarayıcının adres çubuğundaki yükle simgesine ya da menüdeki " +
          "\"Uygulamayı yükle\" seçeneğine tıkla."
      );
    }
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    show();
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    hide();
  });

  if (isIos) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", show, { once: true });
    } else {
      show();
    }
  }
})();
