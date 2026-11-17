// Tema tercihini ilk boyamadan önce uygular (FOUC/titreme olmasın).
(function () {
  try {
    var theme = JSON.parse(localStorage.getItem("yazim.theme") || '"auto"');
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    }
  } catch (e) {
    /* localStorage kapalıysa varsayılan tema kullanılır */
  }
})();
