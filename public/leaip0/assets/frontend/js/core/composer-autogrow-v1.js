(function () {
  "use strict";

  var SELECTOR = ".assistant-panel .assistant-bottom .composer textarea";
  var MIN_HEIGHT = 21;
  var MAX_HEIGHT = 90;

  function resize(textarea) {
    if (!textarea || !textarea.matches(SELECTOR)) return;

    textarea.style.setProperty("height", MIN_HEIGHT + "px", "important");
    var nextHeight = Math.max(MIN_HEIGHT, Math.min(textarea.scrollHeight, MAX_HEIGHT));
    textarea.style.setProperty("height", nextHeight + "px", "important");
    textarea.style.setProperty(
      "overflow-y",
      textarea.scrollHeight > MAX_HEIGHT ? "auto" : "hidden",
      "important"
    );
  }

  function resizeCurrent() {
    document.querySelectorAll(SELECTOR).forEach(resize);
  }

  document.addEventListener("input", function (event) {
    resize(event.target);
  });

  document.addEventListener("focusin", function (event) {
    resize(event.target);
  });

  document.addEventListener(
    "submit",
    function (event) {
      if (!event.target.matches(".assistant-panel .assistant-bottom .composer")) return;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(resizeCurrent);
      });
    },
    true
  );

  window.addEventListener("resize", resizeCurrent, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resizeCurrent, { once: true });
  } else {
    resizeCurrent();
  }
})();
