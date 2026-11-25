/* Siteyi Chrome'da uygulama olarak kurulabilir yapar (PWA).
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
})();
