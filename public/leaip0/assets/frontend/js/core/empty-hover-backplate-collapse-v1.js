(function () {
  "use strict";

  if (window.__lxEmptyHoverBackplateCollapseV1) return;
  window.__lxEmptyHoverBackplateCollapseV1 = true;

  function hasVisiblePrompt(bottom) {
    var panel = bottom && bottom.querySelector(".hover-prompt-panel");
    if (!panel) return false;
    var list = panel.querySelector("[data-hover-prompt-list],.hover-prompt-list") || panel;
    return Array.from(list.children || []).some(function (child) {
      return !child.hidden && child.getAttribute("aria-hidden") !== "true" && String(child.textContent || "").trim();
    });
  }

  function collapseEmptyBackplates(root) {
    var bottoms = [];
    if (root && root.matches && root.matches(".assistant-bottom")) bottoms.push(root);
    if (root && root.querySelectorAll) bottoms = bottoms.concat(Array.from(root.querySelectorAll(".assistant-bottom")));
    if (!bottoms.length && root === document) bottoms = Array.from(document.querySelectorAll(".assistant-bottom"));

    bottoms.forEach(function (bottom) {
      if (hasVisiblePrompt(bottom)) return;
      bottom.classList.remove("has-hover-prompts");
      var panel = bottom.querySelector(".hover-prompt-panel");
      if (panel) {
        panel.style.removeProperty("height");
        panel.style.removeProperty("min-height");
      }
      var assistant = bottom.closest(".assistant-panel");
      if (assistant) assistant.classList.remove("assistant-hover-active", "assistant-glass-active");
    });
  }

  var queued = false;
  function schedule(root) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      collapseEmptyBackplates(root || document);
    });
  }

  new MutationObserver(function (records) {
    var relevant = records.some(function (record) {
      var target = record.target && record.target.nodeType === 1 ? record.target : record.target.parentElement;
      return target && target.closest && target.closest(".assistant-bottom,.hover-prompt-panel");
    });
    if (relevant) schedule(document);
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden", "aria-hidden"] });

  document.addEventListener("transitionend", function (event) {
    if (event.target && event.target.closest && event.target.closest(".assistant-bottom")) schedule(document);
  }, true);

  schedule(document);
})();
