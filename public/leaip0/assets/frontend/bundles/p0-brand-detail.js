
;/* public/leaip0/assets/frontend/js/core/product-detail-benefits-v182.js */
(function () {
  "use strict";

  if (window.__lxProductDetailBenefitsV182) return;
  window.__lxProductDetailBenefitsV182 = true;

  function numberFrom(value) {
    var matches = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
    if (!matches || !matches.length) return 0;
    return Math.round(Number(matches[matches.length - 1]) || 0);
  }

  function format(value) {
    return Math.max(0, Math.round(value)).toLocaleString("zh-CN");
  }

  function currentPrice(detail) {
    var active = detail.querySelector('.lx-spu-chip.is-active [class*="price"], .lx-spu-chip.is-active[data-detail-price-value]');
    var activeValue = active && (active.getAttribute("data-detail-price-value") || active.textContent);
    var source = activeValue || (detail.querySelector("[data-detail-price] .detail-price-main, [data-detail-price], .detail-price-main, .detail-price") || {}).textContent;
    return numberFrom(source);
  }

  function couponFor(price) {
    if (price >= 8000) return { threshold: 8000, reduction: 500 };
    if (price >= 5000) return { threshold: 5000, reduction: 300 };
    if (price >= 3000) return { threshold: 3000, reduction: 200 };
    return { threshold: 1000, reduction: 100 };
  }

  function ensureNode(detail) {
    var info = detail.querySelector(".detail-info");
    if (!info) return null;
    var node = info.querySelector(".lx-detail-benefits-v182");
    if (!node) {
      node = document.createElement("section");
      node.className = "lx-detail-benefits-v182";
      node.setAttribute("aria-label", "商品价格与优惠");
    }
    var priceNode = info.querySelector("[data-detail-price], .detail-price");
    var reason = info.querySelector(".detail-fit-reason");
    var summary = info.querySelector(".detail-summary");
    if (priceNode) priceNode.hidden = true;
    if (summary && summary.nextElementSibling !== node) summary.insertAdjacentElement("afterend", node);
    else if (!summary && reason && reason.previousElementSibling !== node) info.insertBefore(node, reason);
    else if (!summary && !reason && !node.isConnected) info.appendChild(node);
    return node;
  }

  function renderBuybar(detail, finalPrice, sourcePrice) {
    var bar = detail.querySelector(".lx-buybar") || document.querySelector(".lx-buybar");
    var priceNode = bar && bar.querySelector(".lx-buybar-info b");
    if (!priceNode) return;
    if (priceNode.dataset.sourcePrice === String(sourcePrice)) return;
    priceNode.dataset.sourcePrice = String(sourcePrice);
    priceNode.innerHTML = '<small>国补后</small><span>¥' + format(finalPrice) + "</span>";
  }

  function placeServiceAboveActions(detail) {
    var service = detail.querySelector(".detail-service");
    var actions = detail.querySelector(".detail-actions");
    if (!service || !actions || service.parentNode !== actions.parentNode) return;
    if (service.nextElementSibling !== actions) actions.parentNode.insertBefore(service, actions);
  }

  function productSku(detail) {
    var stateProduct = window.__lxState && window.__lxState.currentProduct;
    var node = detail.querySelector("[data-product-sku], [data-sku], [data-product-id]");
    return String(
      (stateProduct && (stateProduct.sku || stateProduct.id || stateProduct.product_id)) ||
      (node && (node.dataset.productSku || node.dataset.sku || node.dataset.productId)) ||
      ""
    ).replace(/[^0-9A-Za-z_-]/g, "");
  }

  function renderProductCode(detail) {
    var actions = detail.querySelector(".detail-actions");
    if (!actions || !actions.parentNode) return;
    var sku = productSku(detail);
    if (!sku) return;
    var displaySku = /^\d+$/.test(sku) ? sku.padStart(8, "0") : sku;
    var code = detail.querySelector(".lx-detail-product-code-v188");
    if (!code) {
      code = document.createElement("p");
      code.className = "lx-detail-product-code-v188";
    }
    if (code.dataset.sku !== sku) {
      code.dataset.sku = sku;
      code.innerHTML = '<span>商品编号：</span><strong>LX-' + displaySku + "</strong>";
    }
    if (actions.nextElementSibling !== code) actions.insertAdjacentElement("afterend", code);
  }

  function render(detail) {
    if (!detail || !detail.isConnected) return;
    placeServiceAboveActions(detail);
    renderProductCode(detail);
    var price = currentPrice(detail);
    if (!price) return;
    var node = ensureNode(detail);
    if (!node) return;
    var subsidy = Math.min(2000, Math.round(price * 0.15));
    var finalPrice = Math.max(0, price - subsidy);
    renderBuybar(detail, finalPrice, price);
    if (node.dataset.sourcePrice === String(price) && node.childElementCount) return;
    var points = Math.max(1, Math.round(price * 0.10));
    var coupon = couponFor(price);
    node.dataset.sourcePrice = String(price);
    node.innerHTML =
      '<div class="lx-detail-benefits-price"><span class="lx-detail-benefits-label">国补后</span>' +
      '<strong><span>¥</span>' + format(finalPrice) + '<small>元</small></strong></div>' +
      '<div class="lx-detail-benefits-meta"><span>预计返 <b>' + format(points) + ' 乐豆</b></span>' +
      '<i aria-hidden="true"></i><span>优惠券 <b>满' + format(coupon.threshold) + '减' + format(coupon.reduction) + '</b></span></div>';
  }

  var pending = false;
  function sync() {
    pending = false;
    document.querySelectorAll(".product-detail").forEach(render);
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(sync);
  }

  document.addEventListener("lx:product-detail-rendered", schedule);
  document.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest(".lx-spu-chip, [data-detail-price-value]")) {
      setTimeout(schedule, 0);
      setTimeout(schedule, 120);
    }
  }, true);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
})();

;
