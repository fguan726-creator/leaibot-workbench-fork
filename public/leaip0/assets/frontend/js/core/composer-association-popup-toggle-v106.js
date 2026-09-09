(function () {
  "use strict";

  // Composer associations use the original keyword and progressive completion flow.
  // Enabled by default for fullscreen and split-screen composers.
  window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ = true;

  const SELECTOR = ".lx-suggest-panel";
  const STYLE_ID = "lx-composer-association-popup-off";

  function associationsEnabled() {
    return window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ === true;
  }

  function removePanels(root) {
    if (associationsEnabled()) return;
    if (root instanceof Element && root.matches(SELECTOR)) root.remove();
    root?.querySelectorAll?.(SELECTOR).forEach((panel) => panel.remove());
  }

  function syncStyle() {
    let style = document.getElementById(STYLE_ID);
    if (associationsEnabled()) {
      style?.remove();
      return;
    }
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `${SELECTOR}{display:none!important;visibility:hidden!important;pointer-events:none!important;}`;
      document.head.appendChild(style);
    }
  }

  function disableAssociationPanels() {
    syncStyle();
    removePanels(document);
    window.__lxHideSuggest?.();
  }

  const observer = new MutationObserver((records) => {
    if (associationsEnabled()) return;
    records.forEach((record) => record.addedNodes.forEach((node) => removePanels(node)));
  });

  function start() {
    disableAssociationPanels();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__lxSetComposerAssociationsEnabled = function (enabled) {
    window.__LX_COMPOSER_ASSOCIATIONS_ENABLED__ = enabled === true;
    syncStyle();
    if (!associationsEnabled()) disableAssociationPanels();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
