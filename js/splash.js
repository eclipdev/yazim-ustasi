// Her sayfa yenilenmesinde kısa bir açılış ekranı gösterir.
// Azaltılmış hareket tercihinde daha kısa tutulur ve yumuşak geçiş yapılmaz.
(function () {
  var splash = document.getElementById("splash");
  if (!splash) return;

  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    /* yoksay */
  }

  var hold = reduce ? 300 : 850;

  window.setTimeout(function () {
    splash.classList.add("hide");
    window.setTimeout(function () {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, reduce ? 50 : 550);
  }, hold);
})();
