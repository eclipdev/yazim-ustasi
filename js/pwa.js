/* Uygulama katmanı (PWA):
   - service worker kaydı (Chrome'da "uygulama olarak yükle" ve çevrimdışı açılış),
   - üst çubukta "Uygulamayı yükle" ve "Paylaş" düğmeleri,
   - ?yukle bağlantısıyla gelenlere kurulum kartı,
   - uygulama kuruluyken tarayıcı sekmesinde "Uygulamada aç" hatırlatması.
   Masaüstü (Electron) kabukta service worker ve kurulum kısmı atlanır; paylaşım çalışır. */
(() => {
  // Paylaşılan adres her zaman canlı site olur; yerel sunucu ya da exe adresi paylaşılmaz.
  const SITE_URL = "https://eclipdev.github.io/yazim-ustasi/";
  const INSTALL_URL = SITE_URL + "?yukle";
  const QR_SVG = "assets/qr-yukle.svg";
  const QR_PNG = "assets/qr-yukle.png";
  const NOTE_KEY = "dyio.appNoteClosed";

  const ua = navigator.userAgent;
  const isElectron = ua.includes("Electron");
  const isIos =
    /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    navigator.standalone === true;
  const { protocol, hostname } = location;
  const secure =
    protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";
  const canInstall = "serviceWorker" in navigator && !isElectron && secure && !standalone;

  if ("serviceWorker" in navigator && !isElectron && secure) {
    window.addEventListener("load", () => {
      const scope = new URL("./", document.baseURI);
      navigator.serviceWorker.register(new URL("sw.js", scope).href, { scope: scope.href }).catch(() => {
        /* Gizli sekme ya da destek yok: site normal çalışır. */
      });
    });
  }

  const ICON_DOWNLOAD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
    '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" stroke-linecap="round" stroke-linejoin="round" /></svg>';
  const ICON_SHARE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
    '<circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" />' +
    '<path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" stroke-linecap="round" /></svg>';

  let deferred = null;
  let installBtn = null;
  let help = null;
  let card = null;
  let panel = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  async function copyText(text, input) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      if (!input) return false;
      input.focus();
      input.select();
      try {
        return document.execCommand("copy");
      } catch {
        return false;
      }
    }
  }

  // ---------- Alt not ----------

  function closeHelp() {
    if (help) {
      help.remove();
      help = null;
    }
  }

  function showHelp(text, onClose) {
    closeHelp();
    help = el("div", "install-help");
    help.setAttribute("role", "status");
    const close = el("button", "linkish", "Kapat");
    close.type = "button";
    close.addEventListener("click", () => {
      closeHelp();
      if (onClose) onClose();
    });
    help.append(el("p", "", text), close);
    document.body.append(help);
  }

  // ---------- Paylaş ----------

  function closePanel() {
    if (!panel) return;
    panel.remove();
    panel = null;
    document.removeEventListener("keydown", onPanelKey);
    const btn = document.getElementById("shareBtn");
    if (btn) btn.focus();
  }

  function onPanelKey(event) {
    if (event.key === "Escape") closePanel();
  }

  function openPanel() {
    closePanel();
    panel = el("div", "share-layer");
    const scrim = el("div", "share-scrim");
    scrim.addEventListener("click", closePanel);

    const box = el("div", "share-card");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "shareTitle");

    const title = el("h2", "share-title", "Uygulamayı paylaş");
    title.id = "shareTitle";
    const lead = el(
      "p",
      "share-lead",
      "Bağlantıyı gönder ya da QR kodu okut. Açan kişi Chrome ya da Edge'de uygulamayı tek dokunuşla kurar."
    );

    const qr = el("img", "share-qr");
    qr.src = QR_SVG;
    qr.alt = "Kurulum bağlantısının QR kodu";
    qr.width = 200;
    qr.height = 200;

    const input = el("input", "share-link");
    input.type = "text";
    input.readOnly = true;
    input.value = INSTALL_URL;
    input.setAttribute("aria-label", "Kurulum bağlantısı");
    input.addEventListener("focus", () => input.select());

    const status = el("p", "share-status");
    status.setAttribute("role", "status");

    const copy = el("button", "btn primary small", "Bağlantıyı kopyala");
    copy.type = "button";
    copy.addEventListener("click", async () => {
      const ok = await copyText(INSTALL_URL, input);
      status.textContent = ok ? "Bağlantı kopyalandı." : "Kopyalanamadı; bağlantıyı seçip kopyala.";
    });

    const download = el("a", "btn ghost small", "QR kodunu indir");
    download.href = QR_PNG;
    download.download = "dogru-yazarim-qr.png";

    const actions = el("div", "share-actions");
    actions.append(copy, download);

    const close = el("button", "linkish share-close", "Kapat");
    close.type = "button";
    close.addEventListener("click", closePanel);

    box.append(title, lead, qr, input, actions, status, close);
    panel.append(scrim, box);
    document.body.append(panel);
    document.addEventListener("keydown", onPanelKey);
    copy.focus();
  }

  async function onShare() {
    // Telefonda sistemin paylaşım menüsü (WhatsApp vb.); bilgisayarda QR'lı panel.
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Doğru Yazarım İyi Oynarım",
          text: "Yazım kurallarıyla oyun. Bağlantıyı açıp uygulamayı yükleyebilirsin.",
          url: INSTALL_URL,
        });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    openPanel();
  }

  function buildShareButton() {
    const bar = document.querySelector(".topbar-actions");
    if (!bar || document.getElementById("shareBtn")) return;
    const btn = el("button", "icon-btn");
    btn.type = "button";
    btn.id = "shareBtn";
    btn.title = "Paylaş";
    btn.setAttribute("aria-label", "Uygulamayı paylaş");
    btn.innerHTML = ICON_SHARE;
    btn.addEventListener("click", onShare);
    bar.prepend(btn);
  }

  buildShareButton();

  if (!canInstall) return;

  // ---------- Yükle düğmesi ----------

  function buildInstallButton() {
    if (installBtn) return installBtn;
    const bar = document.querySelector(".topbar-actions");
    if (!bar) return null;
    installBtn = el("button", "install-btn");
    installBtn.type = "button";
    installBtn.id = "installBtn";
    installBtn.hidden = true;
    installBtn.title = "Uygulamayı bu cihaza yükle";
    installBtn.setAttribute("aria-label", "Uygulamayı yükle");
    installBtn.innerHTML = ICON_DOWNLOAD + "<span>Uygulamayı yükle</span>";
    installBtn.addEventListener("click", onInstall);
    bar.prepend(installBtn);
    return installBtn;
  }

  function showInstall() {
    const b = buildInstallButton();
    if (b) b.hidden = false;
  }

  function hideInstall() {
    if (installBtn) installBtn.hidden = true;
    closeHelp();
  }

  async function runPrompt() {
    if (!deferred) return null;
    const prompt = deferred;
    deferred = null;
    prompt.prompt();
    try {
      const choice = await prompt.userChoice;
      return choice ? choice.outcome : null;
    } catch {
      return null;
    }
  }

  async function onInstall() {
    if (deferred) {
      const outcome = await runPrompt();
      if (outcome === "accepted") installed();
      else setCard("ready-again");
      return;
    }
    if (isIos) {
      showHelp("Safari'de alttaki Paylaş düğmesine dokun, sonra \"Ana Ekrana Ekle\"yi seç.");
    } else {
      showHelp(
        "Tarayıcının adres çubuğundaki yükle simgesine ya da menüdeki " +
          "\"Uygulamayı yükle\" seçeneğine tıkla. Opera ve Firefox masaüstü kurulumu desteklemez; " +
          "siteyi Chrome ya da Edge ile aç."
      );
    }
  }

  function installed() {
    deferred = null;
    hideInstall();
    setCard("done");
  }

  // ---------- ?yukle kurulum kartı ----------

  const wantsCard = new URLSearchParams(location.search).has("yukle");
  let cardState = "waiting";

  const CARD_TEXT = {
    waiting: "Tarayıcın hazırlanıyor…",
    ready: "Tek dokunuşla kur; uygulama ana ekrana ya da başlat menüsüne kendi simgesiyle eklenir.",
    "ready-again": "Kurulum penceresi kapandı. Yeniden denemek için düğmeye bas.",
    ios: "Safari'de alttaki Paylaş düğmesine dokun, sonra \"Ana Ekrana Ekle\"yi seç.",
    unsupported:
      "Bu tarayıcı uygulama kurmayı desteklemiyor (Opera ve Firefox masaüstü gibi) ya da uygulama " +
      "zaten kurulu. Bağlantıyı kopyalayıp Chrome ya da Edge ile aç.",
    present:
      "Uygulama bu cihazda zaten kurulu. Adres çubuğundaki \"Uygulamada aç\" simgesine tıkla " +
      "ya da masaüstündeki kısayoldan aç.",
    done: "Kuruldu. Uygulamayı ana ekrandaki ya da masaüstündeki simgeden açabilirsin.",
  };

  function closeCard() {
    if (card) {
      card.remove();
      card = null;
    }
    try {
      history.replaceState(null, "", location.pathname + location.hash);
    } catch {
      /* yok say */
    }
  }

  function buildCard() {
    const main = document.querySelector("main");
    if (!main) return;
    card = el("section", "install-card");
    card.setAttribute("aria-labelledby", "installCardTitle");

    const body = el("div", "install-card-body");
    const tag = el("span", "menu-tag", "Kurulum");
    const title = el("h2", "", "Uygulamayı cihazına yükle");
    title.id = "installCardTitle";
    const text = el("p", "install-card-text");
    text.setAttribute("role", "status");

    const go = el("button", "btn primary", "Uygulamayı yükle");
    go.type = "button";
    go.dataset.role = "go";
    go.addEventListener("click", onInstall);

    const copy = el("button", "btn ghost", "Bağlantıyı kopyala");
    copy.type = "button";
    copy.dataset.role = "copy";
    copy.addEventListener("click", async () => {
      const ok = await copyText(INSTALL_URL);
      copy.textContent = ok ? "Kopyalandı" : "Kopyalanamadı";
    });

    const close = el("button", "linkish", "Kapat");
    close.type = "button";
    close.addEventListener("click", closeCard);

    const actions = el("div", "install-card-actions");
    actions.append(go, copy, close);
    body.append(tag, title, text, actions);

    const side = el("figure", "install-card-qr");
    const qr = el("img");
    qr.src = QR_SVG;
    qr.alt = "Kurulum bağlantısının QR kodu";
    qr.width = 150;
    qr.height = 150;
    side.append(qr, el("figcaption", "", "Telefona kurmak için okut"));

    card.append(body, side);
    main.prepend(card);
    renderCard();
  }

  function renderCard() {
    if (!card) return;
    card.querySelector(".install-card-text").textContent = CARD_TEXT[cardState];
    const ready = cardState === "ready" || cardState === "ready-again";
    card.querySelector('[data-role="go"]').hidden = !ready;
    card.querySelector('[data-role="copy"]').hidden = cardState !== "unsupported";
  }

  function setCard(state) {
    if (state === "ready-again" && !deferred) state = "unsupported";
    cardState = state;
    renderCard();
  }

  // ---------- Olaylar ----------

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    showInstall();
    setCard("ready");
  });

  window.addEventListener("appinstalled", installed);

  if (wantsCard) buildCard();

  if (isIos) {
    showInstall();
    setCard("ios");
  } else if (wantsCard) {
    // Kurulum sinyali birkaç saniyede gelmezse tarayıcı desteklemiyor demektir.
    setTimeout(() => {
      if (cardState === "waiting") setCard("unsupported");
    }, 3500);
  }

  // Uygulama kuruluysa (Chrome / Edge, manifestteki related_applications) hatırlatır.
  // Tarayıcılar sitenin kurulu uygulamayı kendiliğinden açmasına izin vermez.
  async function checkInstalledApp() {
    if (typeof navigator.getInstalledRelatedApps !== "function") return;
    let apps = [];
    try {
      apps = await navigator.getInstalledRelatedApps();
    } catch {
      return;
    }
    if (!apps.some((app) => app.platform === "webapp")) return;

    hideInstall();
    if (card) {
      setCard("present");
      return;
    }
    try {
      if (sessionStorage.getItem(NOTE_KEY) === "1") return;
    } catch {
      /* Depolama kapalı: not yine gösterilir. */
    }
    showHelp(CARD_TEXT.present, () => {
      try {
        sessionStorage.setItem(NOTE_KEY, "1");
      } catch {
        /* yok say */
      }
    });
  }

  window.addEventListener("load", checkInstalledApp);
})();
