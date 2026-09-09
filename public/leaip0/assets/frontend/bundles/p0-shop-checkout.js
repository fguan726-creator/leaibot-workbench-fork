
;/* public/leaip0/assets/frontend/js/core/scanpay-button-standard-v101.js */
(function () {
  "use strict";

  var styleId = "lx-scanpay-button-standard-v101-style";
  if (document.getElementById(styleId)) return;

  var style = document.createElement("style");
  style.id = styleId;
  style.textContent = [
    ".lx-p0-modal .lx-scanpay-skin .sp-confirm,",
    ".lx-p0-modal .lx-scanpay-skin .sp-confirm.lx-p0-btn.primary,",
    ".lx-p0-modal .lx-scanpay-skin .lx-scanpay-confirm,",
    ".lx-p0-modal .lx-scanpay-skin [data-occ-pay-confirm],",
    ".lx-p0-modal .lx-scanpay-skin [data-confirm-payment],",
    ".lx-p0-modal.lx-scanpay-skin .lx-scanpay-confirm,",
    ".lx-p0-modal.lx-scanpay-skin [data-occ-pay-confirm],",
    ".lx-p0-modal.lx-scanpay-skin [data-confirm-payment]{",
    "border:0!important;",
    "background:linear-gradient(90deg,#4d144a 11.9%,#b8252e 100%)!important;",
    "color:#fff!important;",
    "box-shadow:none!important;",
    "filter:none!important;",
    "}",
    ".lx-p0-modal .lx-scanpay-skin .sp-confirm:hover,",
    ".lx-p0-modal .lx-scanpay-skin .sp-confirm:active,",
    ".lx-p0-modal .lx-scanpay-skin .lx-scanpay-confirm:hover,",
    ".lx-p0-modal .lx-scanpay-skin .lx-scanpay-confirm:active,",
    ".lx-p0-modal .lx-scanpay-skin [data-occ-pay-confirm]:hover,",
    ".lx-p0-modal .lx-scanpay-skin [data-occ-pay-confirm]:active,",
    ".lx-p0-modal .lx-scanpay-skin [data-confirm-payment]:hover,",
    ".lx-p0-modal .lx-scanpay-skin [data-confirm-payment]:active,",
    ".lx-p0-modal.lx-scanpay-skin .lx-scanpay-confirm:hover,",
    ".lx-p0-modal.lx-scanpay-skin .lx-scanpay-confirm:active,",
    ".lx-p0-modal.lx-scanpay-skin [data-occ-pay-confirm]:hover,",
    ".lx-p0-modal.lx-scanpay-skin [data-occ-pay-confirm]:active,",
    ".lx-p0-modal.lx-scanpay-skin [data-confirm-payment]:hover,",
    ".lx-p0-modal.lx-scanpay-skin [data-confirm-payment]:active{",
    "background:linear-gradient(90deg,#4d144a 11.9%,#b8252e 100%)!important;",
    "box-shadow:none!important;",
    "filter:none!important;",
    "transform:none!important;",
    "}",
    ".lx-p0-modal .lx-scanpay-skin .sp-confirm:focus-visible,",
    ".lx-p0-modal .lx-scanpay-skin .lx-scanpay-confirm:focus-visible,",
    ".lx-p0-modal .lx-scanpay-skin [data-occ-pay-confirm]:focus-visible,",
    ".lx-p0-modal .lx-scanpay-skin [data-confirm-payment]:focus-visible,",
    ".lx-p0-modal.lx-scanpay-skin .lx-scanpay-confirm:focus-visible,",
    ".lx-p0-modal.lx-scanpay-skin [data-occ-pay-confirm]:focus-visible,",
    ".lx-p0-modal.lx-scanpay-skin [data-confirm-payment]:focus-visible{",
    "outline:2px solid #76216d!important;",
    "outline-offset:3px!important;",
    "}",
  ].join("");

  (document.head || document.documentElement).appendChild(style);
})();

;


;/* public/leaip0/assets/frontend/js/core/order-payment-orders-sync-v102.js */
(function () {
  "use strict";

  if (window.__lxOrderPaymentOrdersSyncV102) return;
  window.__lxOrderPaymentOrdersSyncV102 = true;

  var ORDER_KEY = "lexiang.orders.v1";
  var capturedPending = null;
  var capturedAt = 0;
  var syncTimer = 0;

  function installStyle() {
    if (document.getElementById("lx-order-payment-sync-style-v102")) return;
    var style = document.createElement("style");
    style.id = "lx-order-payment-sync-style-v102";
    style.textContent =
      ".lx-orders-wrap .lx-order-live-sync{margin-top:9px;display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;font-size:13px;line-height:1.55;color:#6f6874}" +
      ".lx-orders-wrap .lx-order-config-line,.lx-orders-wrap .lx-order-payment-line{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px}" +
      ".lx-orders-wrap .lx-order-live-sync b{font-weight:500;color:#38323b}" +
      ".lx-orders-wrap .lx-order-payment-line{width:100%}" +
      ".lx-orders-wrap .lx-paid-badge{display:inline-flex;align-items:center;height:24px;padding:0 10px;border:1px solid #d9c3dd;border-radius:12px;background:#f7f0f8;color:#5f0b55;font-weight:500}" +
      ".lx-orders-wrap .ord{min-height:168px}";
    (document.head || document.documentElement).appendChild(style);
  }

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_error) { return value || null; }
  }

  function readOrders() {
    try {
      var value = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_error) { return []; }
  }

  function writeOrders(orders) {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(orders)); } catch (_error) {}
    if (window.__lxState) window.__lxState.orders = orders;
    try { window.dispatchEvent(new CustomEvent("lx:orders-updated", { detail: { orders: clone(orders) } })); } catch (_error) {}
  }

  function number(value) {
    var parsed = Number(String(value == null ? "" : value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function money(value) {
    return number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }

  function payLabel(value) {
    var key = String(value || "alipay").toLowerCase();
    if (/wechat|weixin|wx/.test(key)) return "微信支付";
    if (/union|cloud|yunshan|云闪/.test(key)) return "云闪付";
    return "支付宝";
  }

  function capturePendingOrder() {
    var state = window.__lxState || {};
    var pending = state.pendingOrderProduct || state._pendingOrderProduct || null;
    if (!pending) { capturedPending = null; capturedAt = 0; return; }
    capturedPending = clone(pending);
    capturedAt = Date.now();
    capturedPending._capturedAddress = clone(state.pendingOrderAddr || state._pendingOrderAddr || pending.address || null);
    capturedPending._capturedPaymentMethod = state.pendingOrderPayMethod || state._pendingOrderPayMethod || pending.payMethod || "alipay";
  }

  // Explicit status takes precedence over legacy paidAt. No substring matching (unpaid != paid).
  function isPaid(order) {
    var value = String(order.paymentStatus || order.payStatus || order.status || "").trim().toLowerCase();
    if (value) return ["paid", "success", "completed", "已支付", "支付成功", "已完成", "待发货", "待收货", "交易完成"].indexOf(value) !== -1;
    return Boolean(order.paidAt);
  }

  function reconcileLatestOrder() {
    if (!capturedPending || Date.now() - capturedAt > 10000) return;
    var orders = readOrders();
    if (!orders.length) return;
    var pending = capturedPending;
    var selection = null; // Never use another product's global selection as an order fallback.
    var wantedId = pending && String(pending._pendingOrderNo || pending.orderId || "");
    if (!wantedId) return;
    var index = orders.findIndex(function (item) { return String(item.orderId || "") === wantedId; });
    if (index < 0 || !isPaid(orders[index])) return; // Enrich only the matching completed demo payment.
    var old = orders[index] || {};
    var items = pending && Array.isArray(pending.items) ? clone(pending.items) : (Array.isArray(old.items) ? clone(old.items) : []);
    var first = items[0] || {};
    var config = first.configurationLabel || (selection && selection.configurationLabel) || old.configurationLabel || "";
    var color = first.colorLabel || (selection && selection.colorLabel) || old.colorLabel || "";
    var payable = number((pending && (pending.payable != null ? pending.payable : pending.price)) != null ? (pending.payable != null ? pending.payable : pending.price) : (old.paidAmount != null ? old.paidAmount : old.price));
    var original = number((pending && (pending.originalPrice != null ? pending.originalPrice : pending.original_price)) != null ? (pending.originalPrice != null ? pending.originalPrice : pending.original_price) : (first.original_price != null ? first.original_price : old.originalPrice));
    var method = (pending && (pending.payMethod || pending.paymentMethod || pending._capturedPaymentMethod)) || old.payMethod || old.paymentMethod || "alipay";
    var paidAt = old.paidAt;
    var merged = Object.assign({}, old, {
      sku: first.sku || (selection && selection.sku) || old.sku,
      name: first.name || old.name,
      image_url: first.image_url || first.image || old.image_url,
      category: first.category || old.category,
      configurationLabel: config,
      colorLabel: color,
      specs: clone(first.specs || old.specs || {}),
      items: items.length ? items : old.items,
      price: payable,
      payable: payable,
      paidAmount: payable,
      originalPrice: original,
      discountAmount: Math.max(0, original - payable),
      address: (pending && (pending._capturedAddress || pending.address)) || old.address,
      payMethod: method,
      paymentMethod: method,
      paymentMethodLabel: payLabel(method),
      paymentStatus: "paid",
      payStatus: "paid",
      status: "paid",
      paidAt: paidAt,
      transactionNo: old.transactionNo
    });
    if (JSON.stringify(old) === JSON.stringify(merged)) return;
    orders[index] = merged;
    writeOrders(orders);
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function imageUrl(value) {
    var src = String(value || "").trim();
    if (!src) return "/assets/product-placeholder.svg";
    return /^(https?:|data:|blob:|\/)/i.test(src) ? src : "/" + src.replace(/^\.\//, "");
  }

  function statusText(order) {
    if (isPaid(order)) return "已支付";
    var raw = String(order.paymentStatus || order.payStatus || order.status || "").toLowerCase();
    if (["cancelled", "canceled", "已取消"].indexOf(raw) !== -1) return "已取消";
    if (["refunded", "已退款"].indexOf(raw) !== -1) return "已退款";
    return "待付款";
  }

  function syncOrdersDom() {
    var root = document.querySelector(".lx-orders-wrap");
    if (!root) return;
    var orders = readOrders();
    var count = root.querySelector(".ohead .cnt");
    // The order center owns the count, including its demo orders and filtering.
    root.querySelectorAll(".ord").forEach(function (card, cardIndex) {
      var detail = card.querySelector("[data-order-detail]");
      var orderId = detail && detail.getAttribute("data-order-detail");
      var order = orders.find(function (item) { return String(item.orderId || "") === String(orderId || ""); });
      if (!order) return;
      var name = card.querySelector(".nm");
      if (name) { var nextName = order.name || "订单商品"; if (name.textContent !== nextName) name.textContent = nextName; if (name.title !== nextName) name.title = nextName; }
      var img = card.querySelector(".shot img");
      if (img) { var nextSrc = imageUrl(order.image_url); if (img.getAttribute("src") !== nextSrc) img.src = nextSrc; var nextAlt = order.name || "订单商品"; if (img.alt !== nextAlt) img.alt = nextAlt; }
      var amount = card.querySelector(".amt");
      var amountHtml = '<span class="cur">¥</span>' + money(order.paidAmount != null ? order.paidAmount : order.price);
      if (amount && amount.innerHTML !== amountHtml) amount.innerHTML = amountHtml;
      var status = card.querySelector(".ost");
      if (status) { var statusHtml = '<span class="d"></span>' + statusText(order); var statusClass = isPaid(order) ? "ost done" : "ost"; if (status.className !== statusClass) status.className = statusClass; if (status.innerHTML !== statusHtml) status.innerHTML = statusHtml; }
      var mid = card.querySelector(".mid");
      if (!mid) return;
      var block = mid.querySelector(".lx-order-live-sync");
      if (!block) { block = document.createElement("div"); block.className = "lx-order-live-sync"; mid.appendChild(block); }
      var config = order.configurationLabel || "";
      var color = order.colorLabel || "";
      var method = order.paymentMethodLabel || payLabel(order.paymentMethod || order.payMethod);
      var paid = money(order.paidAmount != null ? order.paidAmount : order.price);
      var transaction = order.transactionNo ? '<span>支付流水：' + esc(order.transactionNo) + '</span>' : "";
      var nextHtml =
        '<div class="lx-order-config-line">' +
          (config ? '<span><b>配置：</b>' + esc(config) + '</span>' : "") +
          (color ? '<span><b>颜色：</b>' + esc(color) + '</span>' : "") +
        '</div>' +
        '<div class="lx-order-payment-line"><span class="lx-paid-badge">' + esc(statusText(order)) + '</span><span><b>支付方式：</b>' + esc(method) + '</span><span><b>' + (isPaid(order) ? '实付' : '应付') + '：</b>¥' + esc(paid) + '</span>' + transaction + '</div>';
      if (block.innerHTML !== nextHtml) block.innerHTML = nextHtml;
    });
  }

  function scheduleSync() {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(syncOrdersDom, 24);
  }

  document.addEventListener("pointerdown", function (event) {
    if (event.target.closest && event.target.closest("[data-occ-pay-confirm], [data-confirm-payment], .lx-scanpay-confirm")) capturePendingOrder();
  }, true);

  document.addEventListener("click", function (event) {
    var target = event.target.closest && event.target.closest("[data-occ-pay-confirm], [data-confirm-payment], .lx-scanpay-confirm");
    if (target) {
      capturePendingOrder();
      [50, 350, 900, 1600].forEach(function (delay) { window.setTimeout(function () { reconcileLatestOrder(); syncOrdersDom(); }, delay); });
      return;
    }
    var text = String((event.target.closest && event.target.closest("button,a,[role=button]"))?.textContent || "").trim();
    if (/我的订单|查看订单|订单详情/.test(text) || event.target.closest?.("[data-occ-view-orders],[data-order-detail]")) {
      if (Date.now() - capturedAt < 10000) reconcileLatestOrder();
      scheduleSync();
    }
  }, true);

  window.addEventListener("lx:orders-updated", scheduleSync);
  window.addEventListener("storage", function (event) { if (!event || event.key === ORDER_KEY) scheduleSync(); });
  installStyle();
  // Keep a lightweight mount detector, but ignore changes outside the order center.
  new MutationObserver(function (records) {
    var relevant = records.some(function (record) {
      if (record.target.nodeType === 1 && record.target.closest(".lx-orders-wrap")) return true;
      return Array.prototype.some.call(record.addedNodes, function (node) {
        return node.nodeType === 1 && node.isConnected &&
          (node.matches(".lx-orders-wrap") || node.querySelector(".lx-orders-wrap"));
      });
    });
    if (relevant) scheduleSync();
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(scheduleSync, 600); // Startup is read-only; never infer payment success.
})();

;


;/* public/leaip0/assets/frontend/js/core/view-orders-recommendation-card-v103.js */
(function () {
  "use strict";

  if (window.__lxViewOrdersRecommendationCardV103) return;
  window.__lxViewOrdersRecommendationCardV103 = true;

  function approvedNextIcon() {
    if (typeof window.__lxApprovedIcon === "function") {
      return window.__lxApprovedIcon("global-next");
    }
    return '<img class="lx-approved-icon-img" src="../icons/global-next.svg" alt="" aria-hidden="true">';
  }

  function upgrade(button) {
    if (!button || button.dataset.lxViewOrdersCardReady === "1") return;

    button.dataset.lxViewOrdersCardReady = "1";
    button.className = "answer-cta lx-answer-page lx-auth-answer-card lx-edu-auth-reco lx-payment-confirm-reco lx-view-orders-reco";
    button.type = "button";
    button.setAttribute("data-lx-result-id", "info:orders");
    button.setAttribute("aria-label", "查看我的订单");
    button.setAttribute("aria-pressed", "false");
    button.innerHTML =
      '<span class="answer-cta-title">查看订单</span>' +
      '<span class="answer-cta-icon" aria-hidden="true">' +
      approvedNextIcon() +
      "</span>";

    var actions = button.closest(".lx-p0-actions");
    if (actions && actions.children.length === 1 && actions.parentNode) {
      actions.parentNode.insertBefore(button, actions);
      actions.remove();
    }
  }

  function sync(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-occ-view-orders]").forEach(upgrade);
  }

  function start() {
    sync(document);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches("[data-occ-view-orders]")) upgrade(node);
          sync(node);
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

;


;/* public/leaip0/assets/frontend/js/core/paid-order-result-card-v104.js */
(function () {
  "use strict";

  if (window.__lxPaidOrderResultCardV104) return;
  window.__lxPaidOrderResultCardV104 = true;

  var ORDER_KEY = "lexiang.orders.v1";

  // Explicit status takes precedence over legacy paidAt. No substring matching (unpaid != paid).
  function isPaid(order) {
    var value = String(order.paymentStatus || order.payStatus || order.status || "").trim().toLowerCase();
    if (value) return ["paid", "success", "completed", "已支付", "支付成功", "已完成", "待发货", "待收货", "交易完成"].indexOf(value) !== -1;
    return Boolean(order.paidAt);
  }

  function readOrders() {
    try { var orders = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]"); return Array.isArray(orders) ? orders : []; }
    catch (error) { return []; }
  }
  function upgradeMatching(card, orders) {
    var id = card.getAttribute("data-lx-order-id");
    if (!id) return; // Legacy cards without an identity must not borrow another order's status.
    var order = orders.find(function (item) { return String(item.orderId || "") === id; });
    if (order && isPaid(order)) upgrade(card);
  }

  function upgrade(card) {
    if (!card || card.dataset.lxPaidOrderCardReady === "1") return;
    card.dataset.lxPaidOrderCardReady = "1";
    card.dataset.lxViewOrdersCardReady = "1";
    card.classList.add("lx-paid-order-reco", "lx-view-orders-reco");
    card.removeAttribute("data-open-payment-confirm");
    card.removeAttribute("data-lx-recommended-modal");
    card.removeAttribute("data-lx-recommended-modal-payload");
    card.setAttribute("data-occ-view-orders", "1");
    card.setAttribute("data-lx-order-status", "paid");
    card.setAttribute("data-lx-result-id", "info:orders");
    card.setAttribute("aria-label", "查看已支付订单");
    card.setAttribute("aria-pressed", "false");

    var title = card.querySelector(".answer-cta-title");
    if (title) title.textContent = "已支付订单";
  }

  var pendingCardSelector = '.lx-payment-confirm-reco[data-open-payment-confirm], .lx-payment-confirm-reco[data-lx-recommended-modal="pending-payment"]';

  function collectCards(root, cards) {
    if (root.matches && root.matches(pendingCardSelector)) cards.add(root);
    root.querySelectorAll(pendingCardSelector).forEach(function (card) { cards.add(card); });
  }

  function syncCards(cards) {
    if (!cards.size) return; // No order storage read for unrelated DOM additions.
    var orders = readOrders();
    if (!orders.length) return;
    cards.forEach(function (card) { upgradeMatching(card, orders); });
  }

  function sync(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var cards = new Set();
    collectCards(scope, cards);
    syncCards(cards);
  }

  function syncDocument() {
    sync(document);
  }

  function start() {
    syncDocument();
    window.addEventListener("lx:orders-updated", syncDocument);
    window.addEventListener("pageshow", syncDocument);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) syncDocument();
    });
    window.addEventListener("storage", function (event) {
      if (event.key === ORDER_KEY) syncDocument();
    });

    new MutationObserver(function (records) {
      var cards = new Set();
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && node.isConnected) collectCards(node, cards);
        });
      });
      syncCards(cards); // One storage snapshot per mutation batch; overlapping roots are deduplicated.
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

;


;/* public/leaip0/assets/frontend/js/core/address-regions-v142.js */
window.__lxAddressRegionsV142=[{"code":"11","name":"北京市","children":[{"code":"1101","name":"市辖区","children":[{"code":"110101","name":"东城区"},{"code":"110102","name":"西城区"},{"code":"110105","name":"朝阳区"},{"code":"110106","name":"丰台区"},{"code":"110107","name":"石景山区"},{"code":"110108","name":"海淀区"},{"code":"110109","name":"门头沟区"},{"code":"110111","name":"房山区"},{"code":"110112","name":"通州区"},{"code":"110113","name":"顺义区"},{"code":"110114","name":"昌平区"},{"code":"110115","name":"大兴区"},{"code":"110116","name":"怀柔区"},{"code":"110117","name":"平谷区"},{"code":"110118","name":"密云区"},{"code":"110119","name":"延庆区"}]}]},{"code":"12","name":"天津市","children":[{"code":"1201","name":"市辖区","children":[{"code":"120101","name":"和平区"},{"code":"120102","name":"河东区"},{"code":"120103","name":"河西区"},{"code":"120104","name":"南开区"},{"code":"120105","name":"河北区"},{"code":"120106","name":"红桥区"},{"code":"120110","name":"东丽区"},{"code":"120111","name":"西青区"},{"code":"120112","name":"津南区"},{"code":"120113","name":"北辰区"},{"code":"120114","name":"武清区"},{"code":"120115","name":"宝坻区"},{"code":"120116","name":"滨海新区"},{"code":"120117","name":"宁河区"},{"code":"120118","name":"静海区"},{"code":"120119","name":"蓟州区"}]}]},{"code":"13","name":"河北省","children":[{"code":"1301","name":"石家庄市","children":[{"code":"130102","name":"长安区"},{"code":"130104","name":"桥西区"},{"code":"130105","name":"新华区"},{"code":"130107","name":"井陉矿区"},{"code":"130108","name":"裕华区"},{"code":"130109","name":"藁城区"},{"code":"130110","name":"鹿泉区"},{"code":"130111","name":"栾城区"},{"code":"130121","name":"井陉县"},{"code":"130123","name":"正定县"},{"code":"130125","name":"行唐县"},{"code":"130126","name":"灵寿县"},{"code":"130127","name":"高邑县"},{"code":"130128","name":"深泽县"},{"code":"130129","name":"赞皇县"},{"code":"130130","name":"无极县"},{"code":"130131","name":"平山县"},{"code":"130132","name":"元氏县"},{"code":"130133","name":"赵县"},{"code":"130171","name":"石家庄高新技术产业开发区"},{"code":"130172","name":"石家庄循环化工园区"},{"code":"130181","name":"辛集市"},{"code":"130183","name":"晋州市"},{"code":"130184","name":"新乐市"}]},{"code":"1302","name":"唐山市","children":[{"code":"130202","name":"路南区"},{"code":"130203","name":"路北区"},{"code":"130204","name":"古冶区"},{"code":"130205","name":"开平区"},{"code":"130207","name":"丰南区"},{"code":"130208","name":"丰润区"},{"code":"130209","name":"曹妃甸区"},{"code":"130224","name":"滦南县"},{"code":"130225","name":"乐亭县"},{"code":"130227","name":"迁西县"},{"code":"130229","name":"玉田县"},{"code":"130271","name":"河北唐山芦台经济开发区"},{"code":"130272","name":"唐山市汉沽管理区"},{"code":"130273","name":"唐山高新技术产业开发区"},{"code":"130274","name":"河北唐山海港经济开发区"},{"code":"130281","name":"遵化市"},{"code":"130283","name":"迁安市"},{"code":"130284","name":"滦州市"}]},{"code":"1303","name":"秦皇岛市","children":[{"code":"130302","name":"海港区"},{"code":"130303","name":"山海关区"},{"code":"130304","name":"北戴河区"},{"code":"130306","name":"抚宁区"},{"code":"130321","name":"青龙满族自治县"},{"code":"130322","name":"昌黎县"},{"code":"130324","name":"卢龙县"},{"code":"130371","name":"秦皇岛市经济技术开发区"},{"code":"130372","name":"北戴河新区"}]},{"code":"1304","name":"邯郸市","children":[{"code":"130402","name":"邯山区"},{"code":"130403","name":"丛台区"},{"code":"130404","name":"复兴区"},{"code":"130406","name":"峰峰矿区"},{"code":"130407","name":"肥乡区"},{"code":"130408","name":"永年区"},{"code":"130423","name":"临漳县"},{"code":"130424","name":"成安县"},{"code":"130425","name":"大名县"},{"code":"130426","name":"涉县"},{"code":"130427","name":"磁县"},{"code":"130430","name":"邱县"},{"code":"130431","name":"鸡泽县"},{"code":"130432","name":"广平县"},{"code":"130433","name":"馆陶县"},{"code":"130434","name":"魏县"},{"code":"130435","name":"曲周县"},{"code":"130471","name":"邯郸经济技术开发区"},{"code":"130473","name":"邯郸冀南新区"},{"code":"130481","name":"武安市"}]},{"code":"1305","name":"邢台市","children":[{"code":"130502","name":"襄都区"},{"code":"130503","name":"信都区"},{"code":"130505","name":"任泽区"},{"code":"130506","name":"南和区"},{"code":"130522","name":"临城县"},{"code":"130523","name":"内丘县"},{"code":"130524","name":"柏乡县"},{"code":"130525","name":"隆尧县"},{"code":"130528","name":"宁晋县"},{"code":"130529","name":"巨鹿县"},{"code":"130530","name":"新河县"},{"code":"130531","name":"广宗县"},{"code":"130532","name":"平乡县"},{"code":"130533","name":"威县"},{"code":"130534","name":"清河县"},{"code":"130535","name":"临西县"},{"code":"130571","name":"河北邢台经济开发区"},{"code":"130581","name":"南宫市"},{"code":"130582","name":"沙河市"}]},{"code":"1306","name":"保定市","children":[{"code":"130602","name":"竞秀区"},{"code":"130606","name":"莲池区"},{"code":"130607","name":"满城区"},{"code":"130608","name":"清苑区"},{"code":"130609","name":"徐水区"},{"code":"130623","name":"涞水县"},{"code":"130624","name":"阜平县"},{"code":"130626","name":"定兴县"},{"code":"130627","name":"唐县"},{"code":"130628","name":"高阳县"},{"code":"130629","name":"容城县"},{"code":"130630","name":"涞源县"},{"code":"130631","name":"望都县"},{"code":"130632","name":"安新县"},{"code":"130633","name":"易县"},{"code":"130634","name":"曲阳县"},{"code":"130635","name":"蠡县"},{"code":"130636","name":"顺平县"},{"code":"130637","name":"博野县"},{"code":"130638","name":"雄县"},{"code":"130671","name":"保定高新技术产业开发区"},{"code":"130672","name":"保定白沟新城"},{"code":"130681","name":"涿州市"},{"code":"130682","name":"定州市"},{"code":"130683","name":"安国市"},{"code":"130684","name":"高碑店市"}]},{"code":"1307","name":"张家口市","children":[{"code":"130702","name":"桥东区"},{"code":"130703","name":"桥西区"},{"code":"130705","name":"宣化区"},{"code":"130706","name":"下花园区"},{"code":"130708","name":"万全区"},{"code":"130709","name":"崇礼区"},{"code":"130722","name":"张北县"},{"code":"130723","name":"康保县"},{"code":"130724","name":"沽源县"},{"code":"130725","name":"尚义县"},{"code":"130726","name":"蔚县"},{"code":"130727","name":"阳原县"},{"code":"130728","name":"怀安县"},{"code":"130730","name":"怀来县"},{"code":"130731","name":"涿鹿县"},{"code":"130732","name":"赤城县"},{"code":"130771","name":"张家口经济开发区"},{"code":"130772","name":"张家口市察北管理区"},{"code":"130773","name":"张家口市塞北管理区"}]},{"code":"1308","name":"承德市","children":[{"code":"130802","name":"双桥区"},{"code":"130803","name":"双滦区"},{"code":"130804","name":"鹰手营子矿区"},{"code":"130821","name":"承德县"},{"code":"130822","name":"兴隆县"},{"code":"130824","name":"滦平县"},{"code":"130825","name":"隆化县"},{"code":"130826","name":"丰宁满族自治县"},{"code":"130827","name":"宽城满族自治县"},{"code":"130828","name":"围场满族蒙古族自治县"},{"code":"130871","name":"承德高新技术产业开发区"},{"code":"130881","name":"平泉市"}]},{"code":"1309","name":"沧州市","children":[{"code":"130902","name":"新华区"},{"code":"130903","name":"运河区"},{"code":"130921","name":"沧县"},{"code":"130922","name":"青县"},{"code":"130923","name":"东光县"},{"code":"130924","name":"海兴县"},{"code":"130925","name":"盐山县"},{"code":"130926","name":"肃宁县"},{"code":"130927","name":"南皮县"},{"code":"130928","name":"吴桥县"},{"code":"130929","name":"献县"},{"code":"130930","name":"孟村回族自治县"},{"code":"130971","name":"河北沧州经济开发区"},{"code":"130972","name":"沧州高新技术产业开发区"},{"code":"130973","name":"沧州渤海新区"},{"code":"130981","name":"泊头市"},{"code":"130982","name":"任丘市"},{"code":"130983","name":"黄骅市"},{"code":"130984","name":"河间市"}]},{"code":"1310","name":"廊坊市","children":[{"code":"131002","name":"安次区"},{"code":"131003","name":"广阳区"},{"code":"131022","name":"固安县"},{"code":"131023","name":"永清县"},{"code":"131024","name":"香河县"},{"code":"131025","name":"大城县"},{"code":"131026","name":"文安县"},{"code":"131028","name":"大厂回族自治县"},{"code":"131071","name":"廊坊经济技术开发区"},{"code":"131081","name":"霸州市"},{"code":"131082","name":"三河市"}]},{"code":"1311","name":"衡水市","children":[{"code":"131102","name":"桃城区"},{"code":"131103","name":"冀州区"},{"code":"131121","name":"枣强县"},{"code":"131122","name":"武邑县"},{"code":"131123","name":"武强县"},{"code":"131124","name":"饶阳县"},{"code":"131125","name":"安平县"},{"code":"131126","name":"故城县"},{"code":"131127","name":"景县"},{"code":"131128","name":"阜城县"},{"code":"131171","name":"河北衡水高新技术产业开发区"},{"code":"131172","name":"衡水滨湖新区"},{"code":"131182","name":"深州市"}]}]},{"code":"14","name":"山西省","children":[{"code":"1401","name":"太原市","children":[{"code":"140105","name":"小店区"},{"code":"140106","name":"迎泽区"},{"code":"140107","name":"杏花岭区"},{"code":"140108","name":"尖草坪区"},{"code":"140109","name":"万柏林区"},{"code":"140110","name":"晋源区"},{"code":"140121","name":"清徐县"},{"code":"140122","name":"阳曲县"},{"code":"140123","name":"娄烦县"},{"code":"140171","name":"山西转型综合改革示范区"},{"code":"140181","name":"古交市"}]},{"code":"1402","name":"大同市","children":[{"code":"140212","name":"新荣区"},{"code":"140213","name":"平城区"},{"code":"140214","name":"云冈区"},{"code":"140215","name":"云州区"},{"code":"140221","name":"阳高县"},{"code":"140222","name":"天镇县"},{"code":"140223","name":"广灵县"},{"code":"140224","name":"灵丘县"},{"code":"140225","name":"浑源县"},{"code":"140226","name":"左云县"},{"code":"140271","name":"山西大同经济开发区"}]},{"code":"1403","name":"阳泉市","children":[{"code":"140302","name":"城区"},{"code":"140303","name":"矿区"},{"code":"140311","name":"郊区"},{"code":"140321","name":"平定县"},{"code":"140322","name":"盂县"}]},{"code":"1404","name":"长治市","children":[{"code":"140403","name":"潞州区"},{"code":"140404","name":"上党区"},{"code":"140405","name":"屯留区"},{"code":"140406","name":"潞城区"},{"code":"140423","name":"襄垣县"},{"code":"140425","name":"平顺县"},{"code":"140426","name":"黎城县"},{"code":"140427","name":"壶关县"},{"code":"140428","name":"长子县"},{"code":"140429","name":"武乡县"},{"code":"140430","name":"沁县"},{"code":"140431","name":"沁源县"}]},{"code":"1405","name":"晋城市","children":[{"code":"140502","name":"城区"},{"code":"140521","name":"沁水县"},{"code":"140522","name":"阳城县"},{"code":"140524","name":"陵川县"},{"code":"140525","name":"泽州县"},{"code":"140581","name":"高平市"}]},{"code":"1406","name":"朔州市","children":[{"code":"140602","name":"朔城区"},{"code":"140603","name":"平鲁区"},{"code":"140621","name":"山阴县"},{"code":"140622","name":"应县"},{"code":"140623","name":"右玉县"},{"code":"140671","name":"山西朔州经济开发区"},{"code":"140681","name":"怀仁市"}]},{"code":"1407","name":"晋中市","children":[{"code":"140702","name":"榆次区"},{"code":"140703","name":"太谷区"},{"code":"140721","name":"榆社县"},{"code":"140722","name":"左权县"},{"code":"140723","name":"和顺县"},{"code":"140724","name":"昔阳县"},{"code":"140725","name":"寿阳县"},{"code":"140727","name":"祁县"},{"code":"140728","name":"平遥县"},{"code":"140729","name":"灵石县"},{"code":"140781","name":"介休市"}]},{"code":"1408","name":"运城市","children":[{"code":"140802","name":"盐湖区"},{"code":"140821","name":"临猗县"},{"code":"140822","name":"万荣县"},{"code":"140823","name":"闻喜县"},{"code":"140824","name":"稷山县"},{"code":"140825","name":"新绛县"},{"code":"140826","name":"绛县"},{"code":"140827","name":"垣曲县"},{"code":"140828","name":"夏县"},{"code":"140829","name":"平陆县"},{"code":"140830","name":"芮城县"},{"code":"140881","name":"永济市"},{"code":"140882","name":"河津市"}]},{"code":"1409","name":"忻州市","children":[{"code":"140902","name":"忻府区"},{"code":"140921","name":"定襄县"},{"code":"140922","name":"五台县"},{"code":"140923","name":"代县"},{"code":"140924","name":"繁峙县"},{"code":"140925","name":"宁武县"},{"code":"140926","name":"静乐县"},{"code":"140927","name":"神池县"},{"code":"140928","name":"五寨县"},{"code":"140929","name":"岢岚县"},{"code":"140930","name":"河曲县"},{"code":"140931","name":"保德县"},{"code":"140932","name":"偏关县"},{"code":"140971","name":"五台山风景名胜区"},{"code":"140981","name":"原平市"}]},{"code":"1410","name":"临汾市","children":[{"code":"141002","name":"尧都区"},{"code":"141021","name":"曲沃县"},{"code":"141022","name":"翼城县"},{"code":"141023","name":"襄汾县"},{"code":"141024","name":"洪洞县"},{"code":"141025","name":"古县"},{"code":"141026","name":"安泽县"},{"code":"141027","name":"浮山县"},{"code":"141028","name":"吉县"},{"code":"141029","name":"乡宁县"},{"code":"141030","name":"大宁县"},{"code":"141031","name":"隰县"},{"code":"141032","name":"永和县"},{"code":"141033","name":"蒲县"},{"code":"141034","name":"汾西县"},{"code":"141081","name":"侯马市"},{"code":"141082","name":"霍州市"}]},{"code":"1411","name":"吕梁市","children":[{"code":"141102","name":"离石区"},{"code":"141121","name":"文水县"},{"code":"141122","name":"交城县"},{"code":"141123","name":"兴县"},{"code":"141124","name":"临县"},{"code":"141125","name":"柳林县"},{"code":"141126","name":"石楼县"},{"code":"141127","name":"岚县"},{"code":"141128","name":"方山县"},{"code":"141129","name":"中阳县"},{"code":"141130","name":"交口县"},{"code":"141181","name":"孝义市"},{"code":"141182","name":"汾阳市"}]}]},{"code":"15","name":"内蒙古自治区","children":[{"code":"1501","name":"呼和浩特市","children":[{"code":"150102","name":"新城区"},{"code":"150103","name":"回民区"},{"code":"150104","name":"玉泉区"},{"code":"150105","name":"赛罕区"},{"code":"150121","name":"土默特左旗"},{"code":"150122","name":"托克托县"},{"code":"150123","name":"和林格尔县"},{"code":"150124","name":"清水河县"},{"code":"150125","name":"武川县"},{"code":"150172","name":"呼和浩特经济技术开发区"}]},{"code":"1502","name":"包头市","children":[{"code":"150202","name":"东河区"},{"code":"150203","name":"昆都仑区"},{"code":"150204","name":"青山区"},{"code":"150205","name":"石拐区"},{"code":"150206","name":"白云鄂博矿区"},{"code":"150207","name":"九原区"},{"code":"150221","name":"土默特右旗"},{"code":"150222","name":"固阳县"},{"code":"150223","name":"达尔罕茂明安联合旗"},{"code":"150271","name":"包头稀土高新技术产业开发区"}]},{"code":"1503","name":"乌海市","children":[{"code":"150302","name":"海勃湾区"},{"code":"150303","name":"海南区"},{"code":"150304","name":"乌达区"}]},{"code":"1504","name":"赤峰市","children":[{"code":"150402","name":"红山区"},{"code":"150403","name":"元宝山区"},{"code":"150404","name":"松山区"},{"code":"150421","name":"阿鲁科尔沁旗"},{"code":"150422","name":"巴林左旗"},{"code":"150423","name":"巴林右旗"},{"code":"150424","name":"林西县"},{"code":"150425","name":"克什克腾旗"},{"code":"150426","name":"翁牛特旗"},{"code":"150428","name":"喀喇沁旗"},{"code":"150429","name":"宁城县"},{"code":"150430","name":"敖汉旗"}]},{"code":"1505","name":"通辽市","children":[{"code":"150502","name":"科尔沁区"},{"code":"150521","name":"科尔沁左翼中旗"},{"code":"150522","name":"科尔沁左翼后旗"},{"code":"150523","name":"开鲁县"},{"code":"150524","name":"库伦旗"},{"code":"150525","name":"奈曼旗"},{"code":"150526","name":"扎鲁特旗"},{"code":"150571","name":"通辽经济技术开发区"},{"code":"150581","name":"霍林郭勒市"}]},{"code":"1506","name":"鄂尔多斯市","children":[{"code":"150602","name":"东胜区"},{"code":"150603","name":"康巴什区"},{"code":"150621","name":"达拉特旗"},{"code":"150622","name":"准格尔旗"},{"code":"150623","name":"鄂托克前旗"},{"code":"150624","name":"鄂托克旗"},{"code":"150625","name":"杭锦旗"},{"code":"150626","name":"乌审旗"},{"code":"150627","name":"伊金霍洛旗"}]},{"code":"1507","name":"呼伦贝尔市","children":[{"code":"150702","name":"海拉尔区"},{"code":"150703","name":"扎赉诺尔区"},{"code":"150721","name":"阿荣旗"},{"code":"150722","name":"莫力达瓦达斡尔族自治旗"},{"code":"150723","name":"鄂伦春自治旗"},{"code":"150724","name":"鄂温克族自治旗"},{"code":"150725","name":"陈巴尔虎旗"},{"code":"150726","name":"新巴尔虎左旗"},{"code":"150727","name":"新巴尔虎右旗"},{"code":"150781","name":"满洲里市"},{"code":"150782","name":"牙克石市"},{"code":"150783","name":"扎兰屯市"},{"code":"150784","name":"额尔古纳市"},{"code":"150785","name":"根河市"}]},{"code":"1508","name":"巴彦淖尔市","children":[{"code":"150802","name":"临河区"},{"code":"150821","name":"五原县"},{"code":"150822","name":"磴口县"},{"code":"150823","name":"乌拉特前旗"},{"code":"150824","name":"乌拉特中旗"},{"code":"150825","name":"乌拉特后旗"},{"code":"150826","name":"杭锦后旗"}]},{"code":"1509","name":"乌兰察布市","children":[{"code":"150902","name":"集宁区"},{"code":"150921","name":"卓资县"},{"code":"150922","name":"化德县"},{"code":"150923","name":"商都县"},{"code":"150924","name":"兴和县"},{"code":"150925","name":"凉城县"},{"code":"150926","name":"察哈尔右翼前旗"},{"code":"150927","name":"察哈尔右翼中旗"},{"code":"150928","name":"察哈尔右翼后旗"},{"code":"150929","name":"四子王旗"},{"code":"150981","name":"丰镇市"}]},{"code":"1522","name":"兴安盟","children":[{"code":"152201","name":"乌兰浩特市"},{"code":"152202","name":"阿尔山市"},{"code":"152221","name":"科尔沁右翼前旗"},{"code":"152222","name":"科尔沁右翼中旗"},{"code":"152223","name":"扎赉特旗"},{"code":"152224","name":"突泉县"}]},{"code":"1525","name":"锡林郭勒盟","children":[{"code":"152501","name":"二连浩特市"},{"code":"152502","name":"锡林浩特市"},{"code":"152522","name":"阿巴嘎旗"},{"code":"152523","name":"苏尼特左旗"},{"code":"152524","name":"苏尼特右旗"},{"code":"152525","name":"东乌珠穆沁旗"},{"code":"152526","name":"西乌珠穆沁旗"},{"code":"152527","name":"太仆寺旗"},{"code":"152528","name":"镶黄旗"},{"code":"152529","name":"正镶白旗"},{"code":"152530","name":"正蓝旗"},{"code":"152531","name":"多伦县"},{"code":"152571","name":"乌拉盖管理区管委会"}]},{"code":"1529","name":"阿拉善盟","children":[{"code":"152921","name":"阿拉善左旗"},{"code":"152922","name":"阿拉善右旗"},{"code":"152923","name":"额济纳旗"},{"code":"152971","name":"内蒙古阿拉善高新技术产业开发区"}]}]},{"code":"21","name":"辽宁省","children":[{"code":"2101","name":"沈阳市","children":[{"code":"210102","name":"和平区"},{"code":"210103","name":"沈河区"},{"code":"210104","name":"大东区"},{"code":"210105","name":"皇姑区"},{"code":"210106","name":"铁西区"},{"code":"210111","name":"苏家屯区"},{"code":"210112","name":"浑南区"},{"code":"210113","name":"沈北新区"},{"code":"210114","name":"于洪区"},{"code":"210115","name":"辽中区"},{"code":"210123","name":"康平县"},{"code":"210124","name":"法库县"},{"code":"210181","name":"新民市"}]},{"code":"2102","name":"大连市","children":[{"code":"210202","name":"中山区"},{"code":"210203","name":"西岗区"},{"code":"210204","name":"沙河口区"},{"code":"210211","name":"甘井子区"},{"code":"210212","name":"旅顺口区"},{"code":"210213","name":"金州区"},{"code":"210214","name":"普兰店区"},{"code":"210224","name":"长海县"},{"code":"210281","name":"瓦房店市"},{"code":"210283","name":"庄河市"}]},{"code":"2103","name":"鞍山市","children":[{"code":"210302","name":"铁东区"},{"code":"210303","name":"铁西区"},{"code":"210304","name":"立山区"},{"code":"210311","name":"千山区"},{"code":"210321","name":"台安县"},{"code":"210323","name":"岫岩满族自治县"},{"code":"210381","name":"海城市"}]},{"code":"2104","name":"抚顺市","children":[{"code":"210402","name":"新抚区"},{"code":"210403","name":"东洲区"},{"code":"210404","name":"望花区"},{"code":"210411","name":"顺城区"},{"code":"210421","name":"抚顺县"},{"code":"210422","name":"新宾满族自治县"},{"code":"210423","name":"清原满族自治县"}]},{"code":"2105","name":"本溪市","children":[{"code":"210502","name":"平山区"},{"code":"210503","name":"溪湖区"},{"code":"210504","name":"明山区"},{"code":"210505","name":"南芬区"},{"code":"210521","name":"本溪满族自治县"},{"code":"210522","name":"桓仁满族自治县"}]},{"code":"2106","name":"丹东市","children":[{"code":"210602","name":"元宝区"},{"code":"210603","name":"振兴区"},{"code":"210604","name":"振安区"},{"code":"210624","name":"宽甸满族自治县"},{"code":"210681","name":"东港市"},{"code":"210682","name":"凤城市"}]},{"code":"2107","name":"锦州市","children":[{"code":"210702","name":"古塔区"},{"code":"210703","name":"凌河区"},{"code":"210711","name":"太和区"},{"code":"210726","name":"黑山县"},{"code":"210727","name":"义县"},{"code":"210781","name":"凌海市"},{"code":"210782","name":"北镇市"}]},{"code":"2108","name":"营口市","children":[{"code":"210802","name":"站前区"},{"code":"210803","name":"西市区"},{"code":"210804","name":"鲅鱼圈区"},{"code":"210811","name":"老边区"},{"code":"210881","name":"盖州市"},{"code":"210882","name":"大石桥市"}]},{"code":"2109","name":"阜新市","children":[{"code":"210902","name":"海州区"},{"code":"210903","name":"新邱区"},{"code":"210904","name":"太平区"},{"code":"210905","name":"清河门区"},{"code":"210911","name":"细河区"},{"code":"210921","name":"阜新蒙古族自治县"},{"code":"210922","name":"彰武县"}]},{"code":"2110","name":"辽阳市","children":[{"code":"211002","name":"白塔区"},{"code":"211003","name":"文圣区"},{"code":"211004","name":"宏伟区"},{"code":"211005","name":"弓长岭区"},{"code":"211011","name":"太子河区"},{"code":"211021","name":"辽阳县"},{"code":"211081","name":"灯塔市"}]},{"code":"2111","name":"盘锦市","children":[{"code":"211102","name":"双台子区"},{"code":"211103","name":"兴隆台区"},{"code":"211104","name":"大洼区"},{"code":"211122","name":"盘山县"}]},{"code":"2112","name":"铁岭市","children":[{"code":"211202","name":"银州区"},{"code":"211204","name":"清河区"},{"code":"211221","name":"铁岭县"},{"code":"211223","name":"西丰县"},{"code":"211224","name":"昌图县"},{"code":"211281","name":"调兵山市"},{"code":"211282","name":"开原市"}]},{"code":"2113","name":"朝阳市","children":[{"code":"211302","name":"双塔区"},{"code":"211303","name":"龙城区"},{"code":"211321","name":"朝阳县"},{"code":"211322","name":"建平县"},{"code":"211324","name":"喀喇沁左翼蒙古族自治县"},{"code":"211381","name":"北票市"},{"code":"211382","name":"凌源市"}]},{"code":"2114","name":"葫芦岛市","children":[{"code":"211402","name":"连山区"},{"code":"211403","name":"龙港区"},{"code":"211404","name":"南票区"},{"code":"211421","name":"绥中县"},{"code":"211422","name":"建昌县"},{"code":"211481","name":"兴城市"}]}]},{"code":"22","name":"吉林省","children":[{"code":"2201","name":"长春市","children":[{"code":"220102","name":"南关区"},{"code":"220103","name":"宽城区"},{"code":"220104","name":"朝阳区"},{"code":"220105","name":"二道区"},{"code":"220106","name":"绿园区"},{"code":"220112","name":"双阳区"},{"code":"220113","name":"九台区"},{"code":"220122","name":"农安县"},{"code":"220171","name":"长春经济技术开发区"},{"code":"220172","name":"长春净月高新技术产业开发区"},{"code":"220173","name":"长春高新技术产业开发区"},{"code":"220174","name":"长春汽车经济技术开发区"},{"code":"220182","name":"榆树市"},{"code":"220183","name":"德惠市"},{"code":"220184","name":"公主岭市"}]},{"code":"2202","name":"吉林市","children":[{"code":"220202","name":"昌邑区"},{"code":"220203","name":"龙潭区"},{"code":"220204","name":"船营区"},{"code":"220211","name":"丰满区"},{"code":"220221","name":"永吉县"},{"code":"220271","name":"吉林经济开发区"},{"code":"220272","name":"吉林高新技术产业开发区"},{"code":"220273","name":"吉林中国新加坡食品区"},{"code":"220281","name":"蛟河市"},{"code":"220282","name":"桦甸市"},{"code":"220283","name":"舒兰市"},{"code":"220284","name":"磐石市"}]},{"code":"2203","name":"四平市","children":[{"code":"220302","name":"铁西区"},{"code":"220303","name":"铁东区"},{"code":"220322","name":"梨树县"},{"code":"220323","name":"伊通满族自治县"},{"code":"220382","name":"双辽市"}]},{"code":"2204","name":"辽源市","children":[{"code":"220402","name":"龙山区"},{"code":"220403","name":"西安区"},{"code":"220421","name":"东丰县"},{"code":"220422","name":"东辽县"}]},{"code":"2205","name":"通化市","children":[{"code":"220502","name":"东昌区"},{"code":"220503","name":"二道江区"},{"code":"220521","name":"通化县"},{"code":"220523","name":"辉南县"},{"code":"220524","name":"柳河县"},{"code":"220581","name":"梅河口市"},{"code":"220582","name":"集安市"}]},{"code":"2206","name":"白山市","children":[{"code":"220602","name":"浑江区"},{"code":"220605","name":"江源区"},{"code":"220621","name":"抚松县"},{"code":"220622","name":"靖宇县"},{"code":"220623","name":"长白朝鲜族自治县"},{"code":"220681","name":"临江市"}]},{"code":"2207","name":"松原市","children":[{"code":"220702","name":"宁江区"},{"code":"220721","name":"前郭尔罗斯蒙古族自治县"},{"code":"220722","name":"长岭县"},{"code":"220723","name":"乾安县"},{"code":"220771","name":"吉林松原经济开发区"},{"code":"220781","name":"扶余市"}]},{"code":"2208","name":"白城市","children":[{"code":"220802","name":"洮北区"},{"code":"220821","name":"镇赉县"},{"code":"220822","name":"通榆县"},{"code":"220871","name":"吉林白城经济开发区"},{"code":"220881","name":"洮南市"},{"code":"220882","name":"大安市"}]},{"code":"2224","name":"延边朝鲜族自治州","children":[{"code":"222401","name":"延吉市"},{"code":"222402","name":"图们市"},{"code":"222403","name":"敦化市"},{"code":"222404","name":"珲春市"},{"code":"222405","name":"龙井市"},{"code":"222406","name":"和龙市"},{"code":"222424","name":"汪清县"},{"code":"222426","name":"安图县"}]}]},{"code":"23","name":"黑龙江省","children":[{"code":"2301","name":"哈尔滨市","children":[{"code":"230102","name":"道里区"},{"code":"230103","name":"南岗区"},{"code":"230104","name":"道外区"},{"code":"230108","name":"平房区"},{"code":"230109","name":"松北区"},{"code":"230110","name":"香坊区"},{"code":"230111","name":"呼兰区"},{"code":"230112","name":"阿城区"},{"code":"230113","name":"双城区"},{"code":"230123","name":"依兰县"},{"code":"230124","name":"方正县"},{"code":"230125","name":"宾县"},{"code":"230126","name":"巴彦县"},{"code":"230127","name":"木兰县"},{"code":"230128","name":"通河县"},{"code":"230129","name":"延寿县"},{"code":"230183","name":"尚志市"},{"code":"230184","name":"五常市"}]},{"code":"2302","name":"齐齐哈尔市","children":[{"code":"230202","name":"龙沙区"},{"code":"230203","name":"建华区"},{"code":"230204","name":"铁锋区"},{"code":"230205","name":"昂昂溪区"},{"code":"230206","name":"富拉尔基区"},{"code":"230207","name":"碾子山区"},{"code":"230208","name":"梅里斯达斡尔族区"},{"code":"230221","name":"龙江县"},{"code":"230223","name":"依安县"},{"code":"230224","name":"泰来县"},{"code":"230225","name":"甘南县"},{"code":"230227","name":"富裕县"},{"code":"230229","name":"克山县"},{"code":"230230","name":"克东县"},{"code":"230231","name":"拜泉县"},{"code":"230281","name":"讷河市"}]},{"code":"2303","name":"鸡西市","children":[{"code":"230302","name":"鸡冠区"},{"code":"230303","name":"恒山区"},{"code":"230304","name":"滴道区"},{"code":"230305","name":"梨树区"},{"code":"230306","name":"城子河区"},{"code":"230307","name":"麻山区"},{"code":"230321","name":"鸡东县"},{"code":"230381","name":"虎林市"},{"code":"230382","name":"密山市"}]},{"code":"2304","name":"鹤岗市","children":[{"code":"230402","name":"向阳区"},{"code":"230403","name":"工农区"},{"code":"230404","name":"南山区"},{"code":"230405","name":"兴安区"},{"code":"230406","name":"东山区"},{"code":"230407","name":"兴山区"},{"code":"230421","name":"萝北县"},{"code":"230422","name":"绥滨县"}]},{"code":"2305","name":"双鸭山市","children":[{"code":"230502","name":"尖山区"},{"code":"230503","name":"岭东区"},{"code":"230505","name":"四方台区"},{"code":"230506","name":"宝山区"},{"code":"230521","name":"集贤县"},{"code":"230522","name":"友谊县"},{"code":"230523","name":"宝清县"},{"code":"230524","name":"饶河县"}]},{"code":"2306","name":"大庆市","children":[{"code":"230602","name":"萨尔图区"},{"code":"230603","name":"龙凤区"},{"code":"230604","name":"让胡路区"},{"code":"230605","name":"红岗区"},{"code":"230606","name":"大同区"},{"code":"230621","name":"肇州县"},{"code":"230622","name":"肇源县"},{"code":"230623","name":"林甸县"},{"code":"230624","name":"杜尔伯特蒙古族自治县"},{"code":"230671","name":"大庆高新技术产业开发区"}]},{"code":"2307","name":"伊春市","children":[{"code":"230717","name":"伊美区"},{"code":"230718","name":"乌翠区"},{"code":"230719","name":"友好区"},{"code":"230722","name":"嘉荫县"},{"code":"230723","name":"汤旺县"},{"code":"230724","name":"丰林县"},{"code":"230725","name":"大箐山县"},{"code":"230726","name":"南岔县"},{"code":"230751","name":"金林区"},{"code":"230781","name":"铁力市"}]},{"code":"2308","name":"佳木斯市","children":[{"code":"230803","name":"向阳区"},{"code":"230804","name":"前进区"},{"code":"230805","name":"东风区"},{"code":"230811","name":"郊区"},{"code":"230822","name":"桦南县"},{"code":"230826","name":"桦川县"},{"code":"230828","name":"汤原县"},{"code":"230881","name":"同江市"},{"code":"230882","name":"富锦市"},{"code":"230883","name":"抚远市"}]},{"code":"2309","name":"七台河市","children":[{"code":"230902","name":"新兴区"},{"code":"230903","name":"桃山区"},{"code":"230904","name":"茄子河区"},{"code":"230921","name":"勃利县"}]},{"code":"2310","name":"牡丹江市","children":[{"code":"231002","name":"东安区"},{"code":"231003","name":"阳明区"},{"code":"231004","name":"爱民区"},{"code":"231005","name":"西安区"},{"code":"231025","name":"林口县"},{"code":"231081","name":"绥芬河市"},{"code":"231083","name":"海林市"},{"code":"231084","name":"宁安市"},{"code":"231085","name":"穆棱市"},{"code":"231086","name":"东宁市"}]},{"code":"2311","name":"黑河市","children":[{"code":"231102","name":"爱辉区"},{"code":"231123","name":"逊克县"},{"code":"231124","name":"孙吴县"},{"code":"231181","name":"北安市"},{"code":"231182","name":"五大连池市"},{"code":"231183","name":"嫩江市"}]},{"code":"2312","name":"绥化市","children":[{"code":"231202","name":"北林区"},{"code":"231221","name":"望奎县"},{"code":"231222","name":"兰西县"},{"code":"231223","name":"青冈县"},{"code":"231224","name":"庆安县"},{"code":"231225","name":"明水县"},{"code":"231226","name":"绥棱县"},{"code":"231281","name":"安达市"},{"code":"231282","name":"肇东市"},{"code":"231283","name":"海伦市"}]},{"code":"2327","name":"大兴安岭地区","children":[{"code":"232701","name":"漠河市"},{"code":"232721","name":"呼玛县"},{"code":"232722","name":"塔河县"},{"code":"232761","name":"加格达奇区"},{"code":"232762","name":"松岭区"},{"code":"232763","name":"新林区"},{"code":"232764","name":"呼中区"}]}]},{"code":"31","name":"上海市","children":[{"code":"3101","name":"市辖区","children":[{"code":"310101","name":"黄浦区"},{"code":"310104","name":"徐汇区"},{"code":"310105","name":"长宁区"},{"code":"310106","name":"静安区"},{"code":"310107","name":"普陀区"},{"code":"310109","name":"虹口区"},{"code":"310110","name":"杨浦区"},{"code":"310112","name":"闵行区"},{"code":"310113","name":"宝山区"},{"code":"310114","name":"嘉定区"},{"code":"310115","name":"浦东新区"},{"code":"310116","name":"金山区"},{"code":"310117","name":"松江区"},{"code":"310118","name":"青浦区"},{"code":"310120","name":"奉贤区"},{"code":"310151","name":"崇明区"}]}]},{"code":"32","name":"江苏省","children":[{"code":"3201","name":"南京市","children":[{"code":"320102","name":"玄武区"},{"code":"320104","name":"秦淮区"},{"code":"320105","name":"建邺区"},{"code":"320106","name":"鼓楼区"},{"code":"320111","name":"浦口区"},{"code":"320113","name":"栖霞区"},{"code":"320114","name":"雨花台区"},{"code":"320115","name":"江宁区"},{"code":"320116","name":"六合区"},{"code":"320117","name":"溧水区"},{"code":"320118","name":"高淳区"}]},{"code":"3202","name":"无锡市","children":[{"code":"320205","name":"锡山区"},{"code":"320206","name":"惠山区"},{"code":"320211","name":"滨湖区"},{"code":"320213","name":"梁溪区"},{"code":"320214","name":"新吴区"},{"code":"320281","name":"江阴市"},{"code":"320282","name":"宜兴市"}]},{"code":"3203","name":"徐州市","children":[{"code":"320302","name":"鼓楼区"},{"code":"320303","name":"云龙区"},{"code":"320305","name":"贾汪区"},{"code":"320311","name":"泉山区"},{"code":"320312","name":"铜山区"},{"code":"320321","name":"丰县"},{"code":"320322","name":"沛县"},{"code":"320324","name":"睢宁县"},{"code":"320371","name":"徐州经济技术开发区"},{"code":"320381","name":"新沂市"},{"code":"320382","name":"邳州市"}]},{"code":"3204","name":"常州市","children":[{"code":"320402","name":"天宁区"},{"code":"320404","name":"钟楼区"},{"code":"320411","name":"新北区"},{"code":"320412","name":"武进区"},{"code":"320413","name":"金坛区"},{"code":"320481","name":"溧阳市"}]},{"code":"3205","name":"苏州市","children":[{"code":"320505","name":"虎丘区"},{"code":"320506","name":"吴中区"},{"code":"320507","name":"相城区"},{"code":"320508","name":"姑苏区"},{"code":"320509","name":"吴江区"},{"code":"320576","name":"苏州工业园区"},{"code":"320581","name":"常熟市"},{"code":"320582","name":"张家港市"},{"code":"320583","name":"昆山市"},{"code":"320585","name":"太仓市"}]},{"code":"3206","name":"南通市","children":[{"code":"320612","name":"通州区"},{"code":"320613","name":"崇川区"},{"code":"320614","name":"海门区"},{"code":"320623","name":"如东县"},{"code":"320671","name":"南通经济技术开发区"},{"code":"320681","name":"启东市"},{"code":"320682","name":"如皋市"},{"code":"320685","name":"海安市"}]},{"code":"3207","name":"连云港市","children":[{"code":"320703","name":"连云区"},{"code":"320706","name":"海州区"},{"code":"320707","name":"赣榆区"},{"code":"320722","name":"东海县"},{"code":"320723","name":"灌云县"},{"code":"320724","name":"灌南县"},{"code":"320771","name":"连云港经济技术开发区"}]},{"code":"3208","name":"淮安市","children":[{"code":"320803","name":"淮安区"},{"code":"320804","name":"淮阴区"},{"code":"320812","name":"清江浦区"},{"code":"320813","name":"洪泽区"},{"code":"320826","name":"涟水县"},{"code":"320830","name":"盱眙县"},{"code":"320831","name":"金湖县"},{"code":"320871","name":"淮安经济技术开发区"}]},{"code":"3209","name":"盐城市","children":[{"code":"320902","name":"亭湖区"},{"code":"320903","name":"盐都区"},{"code":"320904","name":"大丰区"},{"code":"320921","name":"响水县"},{"code":"320922","name":"滨海县"},{"code":"320923","name":"阜宁县"},{"code":"320924","name":"射阳县"},{"code":"320925","name":"建湖县"},{"code":"320971","name":"盐城经济技术开发区"},{"code":"320981","name":"东台市"}]},{"code":"3210","name":"扬州市","children":[{"code":"321002","name":"广陵区"},{"code":"321003","name":"邗江区"},{"code":"321012","name":"江都区"},{"code":"321023","name":"宝应县"},{"code":"321071","name":"扬州经济技术开发区"},{"code":"321081","name":"仪征市"},{"code":"321084","name":"高邮市"}]},{"code":"3211","name":"镇江市","children":[{"code":"321102","name":"京口区"},{"code":"321111","name":"润州区"},{"code":"321112","name":"丹徒区"},{"code":"321171","name":"镇江新区"},{"code":"321181","name":"丹阳市"},{"code":"321182","name":"扬中市"},{"code":"321183","name":"句容市"}]},{"code":"3212","name":"泰州市","children":[{"code":"321202","name":"海陵区"},{"code":"321203","name":"高港区"},{"code":"321204","name":"姜堰区"},{"code":"321281","name":"兴化市"},{"code":"321282","name":"靖江市"},{"code":"321283","name":"泰兴市"}]},{"code":"3213","name":"宿迁市","children":[{"code":"321302","name":"宿城区"},{"code":"321311","name":"宿豫区"},{"code":"321322","name":"沭阳县"},{"code":"321323","name":"泗阳县"},{"code":"321324","name":"泗洪县"},{"code":"321371","name":"宿迁经济技术开发区"}]}]},{"code":"33","name":"浙江省","children":[{"code":"3301","name":"杭州市","children":[{"code":"330102","name":"上城区"},{"code":"330105","name":"拱墅区"},{"code":"330106","name":"西湖区"},{"code":"330108","name":"滨江区"},{"code":"330109","name":"萧山区"},{"code":"330110","name":"余杭区"},{"code":"330111","name":"富阳区"},{"code":"330112","name":"临安区"},{"code":"330113","name":"临平区"},{"code":"330114","name":"钱塘区"},{"code":"330122","name":"桐庐县"},{"code":"330127","name":"淳安县"},{"code":"330182","name":"建德市"}]},{"code":"3302","name":"宁波市","children":[{"code":"330203","name":"海曙区"},{"code":"330205","name":"江北区"},{"code":"330206","name":"北仑区"},{"code":"330211","name":"镇海区"},{"code":"330212","name":"鄞州区"},{"code":"330213","name":"奉化区"},{"code":"330225","name":"象山县"},{"code":"330226","name":"宁海县"},{"code":"330281","name":"余姚市"},{"code":"330282","name":"慈溪市"}]},{"code":"3303","name":"温州市","children":[{"code":"330302","name":"鹿城区"},{"code":"330303","name":"龙湾区"},{"code":"330304","name":"瓯海区"},{"code":"330305","name":"洞头区"},{"code":"330324","name":"永嘉县"},{"code":"330326","name":"平阳县"},{"code":"330327","name":"苍南县"},{"code":"330328","name":"文成县"},{"code":"330329","name":"泰顺县"},{"code":"330381","name":"瑞安市"},{"code":"330382","name":"乐清市"},{"code":"330383","name":"龙港市"}]},{"code":"3304","name":"嘉兴市","children":[{"code":"330402","name":"南湖区"},{"code":"330411","name":"秀洲区"},{"code":"330421","name":"嘉善县"},{"code":"330424","name":"海盐县"},{"code":"330481","name":"海宁市"},{"code":"330482","name":"平湖市"},{"code":"330483","name":"桐乡市"}]},{"code":"3305","name":"湖州市","children":[{"code":"330502","name":"吴兴区"},{"code":"330503","name":"南浔区"},{"code":"330521","name":"德清县"},{"code":"330522","name":"长兴县"},{"code":"330523","name":"安吉县"}]},{"code":"3306","name":"绍兴市","children":[{"code":"330602","name":"越城区"},{"code":"330603","name":"柯桥区"},{"code":"330604","name":"上虞区"},{"code":"330624","name":"新昌县"},{"code":"330681","name":"诸暨市"},{"code":"330683","name":"嵊州市"}]},{"code":"3307","name":"金华市","children":[{"code":"330702","name":"婺城区"},{"code":"330703","name":"金东区"},{"code":"330723","name":"武义县"},{"code":"330726","name":"浦江县"},{"code":"330727","name":"磐安县"},{"code":"330781","name":"兰溪市"},{"code":"330782","name":"义乌市"},{"code":"330783","name":"东阳市"},{"code":"330784","name":"永康市"}]},{"code":"3308","name":"衢州市","children":[{"code":"330802","name":"柯城区"},{"code":"330803","name":"衢江区"},{"code":"330822","name":"常山县"},{"code":"330824","name":"开化县"},{"code":"330825","name":"龙游县"},{"code":"330881","name":"江山市"}]},{"code":"3309","name":"舟山市","children":[{"code":"330902","name":"定海区"},{"code":"330903","name":"普陀区"},{"code":"330921","name":"岱山县"},{"code":"330922","name":"嵊泗县"}]},{"code":"3310","name":"台州市","children":[{"code":"331002","name":"椒江区"},{"code":"331003","name":"黄岩区"},{"code":"331004","name":"路桥区"},{"code":"331022","name":"三门县"},{"code":"331023","name":"天台县"},{"code":"331024","name":"仙居县"},{"code":"331081","name":"温岭市"},{"code":"331082","name":"临海市"},{"code":"331083","name":"玉环市"}]},{"code":"3311","name":"丽水市","children":[{"code":"331102","name":"莲都区"},{"code":"331121","name":"青田县"},{"code":"331122","name":"缙云县"},{"code":"331123","name":"遂昌县"},{"code":"331124","name":"松阳县"},{"code":"331125","name":"云和县"},{"code":"331126","name":"庆元县"},{"code":"331127","name":"景宁畲族自治县"},{"code":"331181","name":"龙泉市"}]}]},{"code":"34","name":"安徽省","children":[{"code":"3401","name":"合肥市","children":[{"code":"340102","name":"瑶海区"},{"code":"340103","name":"庐阳区"},{"code":"340104","name":"蜀山区"},{"code":"340111","name":"包河区"},{"code":"340121","name":"长丰县"},{"code":"340122","name":"肥东县"},{"code":"340123","name":"肥西县"},{"code":"340124","name":"庐江县"},{"code":"340176","name":"合肥高新技术产业开发区"},{"code":"340177","name":"合肥经济技术开发区"},{"code":"340178","name":"合肥新站高新技术产业开发区"},{"code":"340181","name":"巢湖市"}]},{"code":"3402","name":"芜湖市","children":[{"code":"340202","name":"镜湖区"},{"code":"340207","name":"鸠江区"},{"code":"340209","name":"弋江区"},{"code":"340210","name":"湾沚区"},{"code":"340212","name":"繁昌区"},{"code":"340223","name":"南陵县"},{"code":"340271","name":"芜湖经济技术开发区"},{"code":"340272","name":"安徽芜湖三山经济开发区"},{"code":"340281","name":"无为市"}]},{"code":"3403","name":"蚌埠市","children":[{"code":"340302","name":"龙子湖区"},{"code":"340303","name":"蚌山区"},{"code":"340304","name":"禹会区"},{"code":"340311","name":"淮上区"},{"code":"340321","name":"怀远县"},{"code":"340322","name":"五河县"},{"code":"340323","name":"固镇县"},{"code":"340371","name":"蚌埠市高新技术开发区"},{"code":"340372","name":"蚌埠市经济开发区"}]},{"code":"3404","name":"淮南市","children":[{"code":"340402","name":"大通区"},{"code":"340403","name":"田家庵区"},{"code":"340404","name":"谢家集区"},{"code":"340405","name":"八公山区"},{"code":"340406","name":"潘集区"},{"code":"340421","name":"凤台县"},{"code":"340422","name":"寿县"}]},{"code":"3405","name":"马鞍山市","children":[{"code":"340503","name":"花山区"},{"code":"340504","name":"雨山区"},{"code":"340506","name":"博望区"},{"code":"340521","name":"当涂县"},{"code":"340522","name":"含山县"},{"code":"340523","name":"和县"}]},{"code":"3406","name":"淮北市","children":[{"code":"340602","name":"杜集区"},{"code":"340603","name":"相山区"},{"code":"340604","name":"烈山区"},{"code":"340621","name":"濉溪县"}]},{"code":"3407","name":"铜陵市","children":[{"code":"340705","name":"铜官区"},{"code":"340706","name":"义安区"},{"code":"340711","name":"郊区"},{"code":"340722","name":"枞阳县"}]},{"code":"3408","name":"安庆市","children":[{"code":"340802","name":"迎江区"},{"code":"340803","name":"大观区"},{"code":"340811","name":"宜秀区"},{"code":"340822","name":"怀宁县"},{"code":"340825","name":"太湖县"},{"code":"340826","name":"宿松县"},{"code":"340827","name":"望江县"},{"code":"340828","name":"岳西县"},{"code":"340871","name":"安徽安庆经济开发区"},{"code":"340881","name":"桐城市"},{"code":"340882","name":"潜山市"}]},{"code":"3410","name":"黄山市","children":[{"code":"341002","name":"屯溪区"},{"code":"341003","name":"黄山区"},{"code":"341004","name":"徽州区"},{"code":"341021","name":"歙县"},{"code":"341022","name":"休宁县"},{"code":"341023","name":"黟县"},{"code":"341024","name":"祁门县"}]},{"code":"3411","name":"滁州市","children":[{"code":"341102","name":"琅琊区"},{"code":"341103","name":"南谯区"},{"code":"341122","name":"来安县"},{"code":"341124","name":"全椒县"},{"code":"341125","name":"定远县"},{"code":"341126","name":"凤阳县"},{"code":"341171","name":"中新苏滁高新技术产业开发区"},{"code":"341172","name":"滁州经济技术开发区"},{"code":"341181","name":"天长市"},{"code":"341182","name":"明光市"}]},{"code":"3412","name":"阜阳市","children":[{"code":"341202","name":"颍州区"},{"code":"341203","name":"颍东区"},{"code":"341204","name":"颍泉区"},{"code":"341221","name":"临泉县"},{"code":"341222","name":"太和县"},{"code":"341225","name":"阜南县"},{"code":"341226","name":"颍上县"},{"code":"341271","name":"阜阳合肥现代产业园区"},{"code":"341272","name":"阜阳经济技术开发区"},{"code":"341282","name":"界首市"}]},{"code":"3413","name":"宿州市","children":[{"code":"341302","name":"埇桥区"},{"code":"341321","name":"砀山县"},{"code":"341322","name":"萧县"},{"code":"341323","name":"灵璧县"},{"code":"341324","name":"泗县"},{"code":"341371","name":"宿州马鞍山现代产业园区"},{"code":"341372","name":"宿州经济技术开发区"}]},{"code":"3415","name":"六安市","children":[{"code":"341502","name":"金安区"},{"code":"341503","name":"裕安区"},{"code":"341504","name":"叶集区"},{"code":"341522","name":"霍邱县"},{"code":"341523","name":"舒城县"},{"code":"341524","name":"金寨县"},{"code":"341525","name":"霍山县"}]},{"code":"3416","name":"亳州市","children":[{"code":"341602","name":"谯城区"},{"code":"341621","name":"涡阳县"},{"code":"341622","name":"蒙城县"},{"code":"341623","name":"利辛县"}]},{"code":"3417","name":"池州市","children":[{"code":"341702","name":"贵池区"},{"code":"341721","name":"东至县"},{"code":"341722","name":"石台县"},{"code":"341723","name":"青阳县"}]},{"code":"3418","name":"宣城市","children":[{"code":"341802","name":"宣州区"},{"code":"341821","name":"郎溪县"},{"code":"341823","name":"泾县"},{"code":"341824","name":"绩溪县"},{"code":"341825","name":"旌德县"},{"code":"341871","name":"宣城市经济开发区"},{"code":"341881","name":"宁国市"},{"code":"341882","name":"广德市"}]}]},{"code":"35","name":"福建省","children":[{"code":"3501","name":"福州市","children":[{"code":"350102","name":"鼓楼区"},{"code":"350103","name":"台江区"},{"code":"350104","name":"仓山区"},{"code":"350105","name":"马尾区"},{"code":"350111","name":"晋安区"},{"code":"350112","name":"长乐区"},{"code":"350121","name":"闽侯县"},{"code":"350122","name":"连江县"},{"code":"350123","name":"罗源县"},{"code":"350124","name":"闽清县"},{"code":"350125","name":"永泰县"},{"code":"350128","name":"平潭县"},{"code":"350181","name":"福清市"}]},{"code":"3502","name":"厦门市","children":[{"code":"350203","name":"思明区"},{"code":"350205","name":"海沧区"},{"code":"350206","name":"湖里区"},{"code":"350211","name":"集美区"},{"code":"350212","name":"同安区"},{"code":"350213","name":"翔安区"}]},{"code":"3503","name":"莆田市","children":[{"code":"350302","name":"城厢区"},{"code":"350303","name":"涵江区"},{"code":"350304","name":"荔城区"},{"code":"350305","name":"秀屿区"},{"code":"350322","name":"仙游县"}]},{"code":"3504","name":"三明市","children":[{"code":"350404","name":"三元区"},{"code":"350405","name":"沙县区"},{"code":"350421","name":"明溪县"},{"code":"350423","name":"清流县"},{"code":"350424","name":"宁化县"},{"code":"350425","name":"大田县"},{"code":"350426","name":"尤溪县"},{"code":"350428","name":"将乐县"},{"code":"350429","name":"泰宁县"},{"code":"350430","name":"建宁县"},{"code":"350481","name":"永安市"}]},{"code":"3505","name":"泉州市","children":[{"code":"350502","name":"鲤城区"},{"code":"350503","name":"丰泽区"},{"code":"350504","name":"洛江区"},{"code":"350505","name":"泉港区"},{"code":"350521","name":"惠安县"},{"code":"350524","name":"安溪县"},{"code":"350525","name":"永春县"},{"code":"350526","name":"德化县"},{"code":"350527","name":"金门县"},{"code":"350581","name":"石狮市"},{"code":"350582","name":"晋江市"},{"code":"350583","name":"南安市"}]},{"code":"3506","name":"漳州市","children":[{"code":"350602","name":"芗城区"},{"code":"350603","name":"龙文区"},{"code":"350604","name":"龙海区"},{"code":"350605","name":"长泰区"},{"code":"350622","name":"云霄县"},{"code":"350623","name":"漳浦县"},{"code":"350624","name":"诏安县"},{"code":"350626","name":"东山县"},{"code":"350627","name":"南靖县"},{"code":"350628","name":"平和县"},{"code":"350629","name":"华安县"}]},{"code":"3507","name":"南平市","children":[{"code":"350702","name":"延平区"},{"code":"350703","name":"建阳区"},{"code":"350721","name":"顺昌县"},{"code":"350722","name":"浦城县"},{"code":"350723","name":"光泽县"},{"code":"350724","name":"松溪县"},{"code":"350725","name":"政和县"},{"code":"350781","name":"邵武市"},{"code":"350782","name":"武夷山市"},{"code":"350783","name":"建瓯市"}]},{"code":"3508","name":"龙岩市","children":[{"code":"350802","name":"新罗区"},{"code":"350803","name":"永定区"},{"code":"350821","name":"长汀县"},{"code":"350823","name":"上杭县"},{"code":"350824","name":"武平县"},{"code":"350825","name":"连城县"},{"code":"350881","name":"漳平市"}]},{"code":"3509","name":"宁德市","children":[{"code":"350902","name":"蕉城区"},{"code":"350921","name":"霞浦县"},{"code":"350922","name":"古田县"},{"code":"350923","name":"屏南县"},{"code":"350924","name":"寿宁县"},{"code":"350925","name":"周宁县"},{"code":"350926","name":"柘荣县"},{"code":"350981","name":"福安市"},{"code":"350982","name":"福鼎市"}]}]},{"code":"36","name":"江西省","children":[{"code":"3601","name":"南昌市","children":[{"code":"360102","name":"东湖区"},{"code":"360103","name":"西湖区"},{"code":"360104","name":"青云谱区"},{"code":"360111","name":"青山湖区"},{"code":"360112","name":"新建区"},{"code":"360113","name":"红谷滩区"},{"code":"360121","name":"南昌县"},{"code":"360123","name":"安义县"},{"code":"360124","name":"进贤县"}]},{"code":"3602","name":"景德镇市","children":[{"code":"360202","name":"昌江区"},{"code":"360203","name":"珠山区"},{"code":"360222","name":"浮梁县"},{"code":"360281","name":"乐平市"}]},{"code":"3603","name":"萍乡市","children":[{"code":"360302","name":"安源区"},{"code":"360313","name":"湘东区"},{"code":"360321","name":"莲花县"},{"code":"360322","name":"上栗县"},{"code":"360323","name":"芦溪县"}]},{"code":"3604","name":"九江市","children":[{"code":"360402","name":"濂溪区"},{"code":"360403","name":"浔阳区"},{"code":"360404","name":"柴桑区"},{"code":"360423","name":"武宁县"},{"code":"360424","name":"修水县"},{"code":"360425","name":"永修县"},{"code":"360426","name":"德安县"},{"code":"360428","name":"都昌县"},{"code":"360429","name":"湖口县"},{"code":"360430","name":"彭泽县"},{"code":"360481","name":"瑞昌市"},{"code":"360482","name":"共青城市"},{"code":"360483","name":"庐山市"}]},{"code":"3605","name":"新余市","children":[{"code":"360502","name":"渝水区"},{"code":"360521","name":"分宜县"}]},{"code":"3606","name":"鹰潭市","children":[{"code":"360602","name":"月湖区"},{"code":"360603","name":"余江区"},{"code":"360681","name":"贵溪市"}]},{"code":"3607","name":"赣州市","children":[{"code":"360702","name":"章贡区"},{"code":"360703","name":"南康区"},{"code":"360704","name":"赣县区"},{"code":"360722","name":"信丰县"},{"code":"360723","name":"大余县"},{"code":"360724","name":"上犹县"},{"code":"360725","name":"崇义县"},{"code":"360726","name":"安远县"},{"code":"360728","name":"定南县"},{"code":"360729","name":"全南县"},{"code":"360730","name":"宁都县"},{"code":"360731","name":"于都县"},{"code":"360732","name":"兴国县"},{"code":"360733","name":"会昌县"},{"code":"360734","name":"寻乌县"},{"code":"360735","name":"石城县"},{"code":"360781","name":"瑞金市"},{"code":"360783","name":"龙南市"}]},{"code":"3608","name":"吉安市","children":[{"code":"360802","name":"吉州区"},{"code":"360803","name":"青原区"},{"code":"360821","name":"吉安县"},{"code":"360822","name":"吉水县"},{"code":"360823","name":"峡江县"},{"code":"360824","name":"新干县"},{"code":"360825","name":"永丰县"},{"code":"360826","name":"泰和县"},{"code":"360827","name":"遂川县"},{"code":"360828","name":"万安县"},{"code":"360829","name":"安福县"},{"code":"360830","name":"永新县"},{"code":"360881","name":"井冈山市"}]},{"code":"3609","name":"宜春市","children":[{"code":"360902","name":"袁州区"},{"code":"360921","name":"奉新县"},{"code":"360922","name":"万载县"},{"code":"360923","name":"上高县"},{"code":"360924","name":"宜丰县"},{"code":"360925","name":"靖安县"},{"code":"360926","name":"铜鼓县"},{"code":"360981","name":"丰城市"},{"code":"360982","name":"樟树市"},{"code":"360983","name":"高安市"}]},{"code":"3610","name":"抚州市","children":[{"code":"361002","name":"临川区"},{"code":"361003","name":"东乡区"},{"code":"361021","name":"南城县"},{"code":"361022","name":"黎川县"},{"code":"361023","name":"南丰县"},{"code":"361024","name":"崇仁县"},{"code":"361025","name":"乐安县"},{"code":"361026","name":"宜黄县"},{"code":"361027","name":"金溪县"},{"code":"361028","name":"资溪县"},{"code":"361030","name":"广昌县"}]},{"code":"3611","name":"上饶市","children":[{"code":"361102","name":"信州区"},{"code":"361103","name":"广丰区"},{"code":"361104","name":"广信区"},{"code":"361123","name":"玉山县"},{"code":"361124","name":"铅山县"},{"code":"361125","name":"横峰县"},{"code":"361126","name":"弋阳县"},{"code":"361127","name":"余干县"},{"code":"361128","name":"鄱阳县"},{"code":"361129","name":"万年县"},{"code":"361130","name":"婺源县"},{"code":"361181","name":"德兴市"}]}]},{"code":"37","name":"山东省","children":[{"code":"3701","name":"济南市","children":[{"code":"370102","name":"历下区"},{"code":"370103","name":"市中区"},{"code":"370104","name":"槐荫区"},{"code":"370105","name":"天桥区"},{"code":"370112","name":"历城区"},{"code":"370113","name":"长清区"},{"code":"370114","name":"章丘区"},{"code":"370115","name":"济阳区"},{"code":"370116","name":"莱芜区"},{"code":"370117","name":"钢城区"},{"code":"370124","name":"平阴县"},{"code":"370126","name":"商河县"},{"code":"370176","name":"济南高新技术产业开发区"}]},{"code":"3702","name":"青岛市","children":[{"code":"370202","name":"市南区"},{"code":"370203","name":"市北区"},{"code":"370211","name":"黄岛区"},{"code":"370212","name":"崂山区"},{"code":"370213","name":"李沧区"},{"code":"370214","name":"城阳区"},{"code":"370215","name":"即墨区"},{"code":"370281","name":"胶州市"},{"code":"370283","name":"平度市"},{"code":"370285","name":"莱西市"}]},{"code":"3703","name":"淄博市","children":[{"code":"370302","name":"淄川区"},{"code":"370303","name":"张店区"},{"code":"370304","name":"博山区"},{"code":"370305","name":"临淄区"},{"code":"370306","name":"周村区"},{"code":"370321","name":"桓台县"},{"code":"370322","name":"高青县"},{"code":"370323","name":"沂源县"}]},{"code":"3704","name":"枣庄市","children":[{"code":"370402","name":"市中区"},{"code":"370403","name":"薛城区"},{"code":"370404","name":"峄城区"},{"code":"370405","name":"台儿庄区"},{"code":"370406","name":"山亭区"},{"code":"370481","name":"滕州市"}]},{"code":"3705","name":"东营市","children":[{"code":"370502","name":"东营区"},{"code":"370503","name":"河口区"},{"code":"370505","name":"垦利区"},{"code":"370522","name":"利津县"},{"code":"370523","name":"广饶县"},{"code":"370571","name":"东营经济技术开发区"},{"code":"370572","name":"东营港经济开发区"}]},{"code":"3706","name":"烟台市","children":[{"code":"370602","name":"芝罘区"},{"code":"370611","name":"福山区"},{"code":"370612","name":"牟平区"},{"code":"370613","name":"莱山区"},{"code":"370614","name":"蓬莱区"},{"code":"370671","name":"烟台高新技术产业开发区"},{"code":"370676","name":"烟台经济技术开发区"},{"code":"370681","name":"龙口市"},{"code":"370682","name":"莱阳市"},{"code":"370683","name":"莱州市"},{"code":"370685","name":"招远市"},{"code":"370686","name":"栖霞市"},{"code":"370687","name":"海阳市"}]},{"code":"3707","name":"潍坊市","children":[{"code":"370702","name":"潍城区"},{"code":"370703","name":"寒亭区"},{"code":"370704","name":"坊子区"},{"code":"370705","name":"奎文区"},{"code":"370724","name":"临朐县"},{"code":"370725","name":"昌乐县"},{"code":"370772","name":"潍坊滨海经济技术开发区"},{"code":"370781","name":"青州市"},{"code":"370782","name":"诸城市"},{"code":"370783","name":"寿光市"},{"code":"370784","name":"安丘市"},{"code":"370785","name":"高密市"},{"code":"370786","name":"昌邑市"}]},{"code":"3708","name":"济宁市","children":[{"code":"370811","name":"任城区"},{"code":"370812","name":"兖州区"},{"code":"370826","name":"微山县"},{"code":"370827","name":"鱼台县"},{"code":"370828","name":"金乡县"},{"code":"370829","name":"嘉祥县"},{"code":"370830","name":"汶上县"},{"code":"370831","name":"泗水县"},{"code":"370832","name":"梁山县"},{"code":"370871","name":"济宁高新技术产业开发区"},{"code":"370881","name":"曲阜市"},{"code":"370883","name":"邹城市"}]},{"code":"3709","name":"泰安市","children":[{"code":"370902","name":"泰山区"},{"code":"370911","name":"岱岳区"},{"code":"370921","name":"宁阳县"},{"code":"370923","name":"东平县"},{"code":"370982","name":"新泰市"},{"code":"370983","name":"肥城市"}]},{"code":"3710","name":"威海市","children":[{"code":"371002","name":"环翠区"},{"code":"371003","name":"文登区"},{"code":"371071","name":"威海火炬高技术产业开发区"},{"code":"371072","name":"威海经济技术开发区"},{"code":"371073","name":"威海临港经济技术开发区"},{"code":"371082","name":"荣成市"},{"code":"371083","name":"乳山市"}]},{"code":"3711","name":"日照市","children":[{"code":"371102","name":"东港区"},{"code":"371103","name":"岚山区"},{"code":"371121","name":"五莲县"},{"code":"371122","name":"莒县"},{"code":"371171","name":"日照经济技术开发区"}]},{"code":"3713","name":"临沂市","children":[{"code":"371302","name":"兰山区"},{"code":"371311","name":"罗庄区"},{"code":"371312","name":"河东区"},{"code":"371321","name":"沂南县"},{"code":"371322","name":"郯城县"},{"code":"371323","name":"沂水县"},{"code":"371324","name":"兰陵县"},{"code":"371325","name":"费县"},{"code":"371326","name":"平邑县"},{"code":"371327","name":"莒南县"},{"code":"371328","name":"蒙阴县"},{"code":"371329","name":"临沭县"},{"code":"371371","name":"临沂高新技术产业开发区"}]},{"code":"3714","name":"德州市","children":[{"code":"371402","name":"德城区"},{"code":"371403","name":"陵城区"},{"code":"371422","name":"宁津县"},{"code":"371423","name":"庆云县"},{"code":"371424","name":"临邑县"},{"code":"371425","name":"齐河县"},{"code":"371426","name":"平原县"},{"code":"371427","name":"夏津县"},{"code":"371428","name":"武城县"},{"code":"371471","name":"德州天衢新区"},{"code":"371481","name":"乐陵市"},{"code":"371482","name":"禹城市"}]},{"code":"3715","name":"聊城市","children":[{"code":"371502","name":"东昌府区"},{"code":"371503","name":"茌平区"},{"code":"371521","name":"阳谷县"},{"code":"371522","name":"莘县"},{"code":"371524","name":"东阿县"},{"code":"371525","name":"冠县"},{"code":"371526","name":"高唐县"},{"code":"371581","name":"临清市"}]},{"code":"3716","name":"滨州市","children":[{"code":"371602","name":"滨城区"},{"code":"371603","name":"沾化区"},{"code":"371621","name":"惠民县"},{"code":"371622","name":"阳信县"},{"code":"371623","name":"无棣县"},{"code":"371625","name":"博兴县"},{"code":"371681","name":"邹平市"}]},{"code":"3717","name":"菏泽市","children":[{"code":"371702","name":"牡丹区"},{"code":"371703","name":"定陶区"},{"code":"371721","name":"曹县"},{"code":"371722","name":"单县"},{"code":"371723","name":"成武县"},{"code":"371724","name":"巨野县"},{"code":"371725","name":"郓城县"},{"code":"371726","name":"鄄城县"},{"code":"371728","name":"东明县"},{"code":"371771","name":"菏泽经济技术开发区"},{"code":"371772","name":"菏泽高新技术开发区"}]}]},{"code":"41","name":"河南省","children":[{"code":"4101","name":"郑州市","children":[{"code":"410102","name":"中原区"},{"code":"410103","name":"二七区"},{"code":"410104","name":"管城回族区"},{"code":"410105","name":"金水区"},{"code":"410106","name":"上街区"},{"code":"410108","name":"惠济区"},{"code":"410122","name":"中牟县"},{"code":"410171","name":"郑州经济技术开发区"},{"code":"410172","name":"郑州高新技术产业开发区"},{"code":"410173","name":"郑州航空港经济综合实验区"},{"code":"410181","name":"巩义市"},{"code":"410182","name":"荥阳市"},{"code":"410183","name":"新密市"},{"code":"410184","name":"新郑市"},{"code":"410185","name":"登封市"}]},{"code":"4102","name":"开封市","children":[{"code":"410202","name":"龙亭区"},{"code":"410203","name":"顺河回族区"},{"code":"410204","name":"鼓楼区"},{"code":"410205","name":"禹王台区"},{"code":"410212","name":"祥符区"},{"code":"410221","name":"杞县"},{"code":"410222","name":"通许县"},{"code":"410223","name":"尉氏县"},{"code":"410225","name":"兰考县"}]},{"code":"4103","name":"洛阳市","children":[{"code":"410302","name":"老城区"},{"code":"410303","name":"西工区"},{"code":"410304","name":"瀍河回族区"},{"code":"410305","name":"涧西区"},{"code":"410307","name":"偃师区"},{"code":"410308","name":"孟津区"},{"code":"410311","name":"洛龙区"},{"code":"410323","name":"新安县"},{"code":"410324","name":"栾川县"},{"code":"410325","name":"嵩县"},{"code":"410326","name":"汝阳县"},{"code":"410327","name":"宜阳县"},{"code":"410328","name":"洛宁县"},{"code":"410329","name":"伊川县"},{"code":"410371","name":"洛阳高新技术产业开发区"}]},{"code":"4104","name":"平顶山市","children":[{"code":"410402","name":"新华区"},{"code":"410403","name":"卫东区"},{"code":"410404","name":"石龙区"},{"code":"410411","name":"湛河区"},{"code":"410421","name":"宝丰县"},{"code":"410422","name":"叶县"},{"code":"410423","name":"鲁山县"},{"code":"410425","name":"郏县"},{"code":"410471","name":"平顶山高新技术产业开发区"},{"code":"410472","name":"平顶山市城乡一体化示范区"},{"code":"410481","name":"舞钢市"},{"code":"410482","name":"汝州市"}]},{"code":"4105","name":"安阳市","children":[{"code":"410502","name":"文峰区"},{"code":"410503","name":"北关区"},{"code":"410505","name":"殷都区"},{"code":"410506","name":"龙安区"},{"code":"410522","name":"安阳县"},{"code":"410523","name":"汤阴县"},{"code":"410526","name":"滑县"},{"code":"410527","name":"内黄县"},{"code":"410571","name":"安阳高新技术产业开发区"},{"code":"410581","name":"林州市"}]},{"code":"4106","name":"鹤壁市","children":[{"code":"410602","name":"鹤山区"},{"code":"410603","name":"山城区"},{"code":"410611","name":"淇滨区"},{"code":"410621","name":"浚县"},{"code":"410622","name":"淇县"},{"code":"410671","name":"鹤壁经济技术开发区"}]},{"code":"4107","name":"新乡市","children":[{"code":"410702","name":"红旗区"},{"code":"410703","name":"卫滨区"},{"code":"410704","name":"凤泉区"},{"code":"410711","name":"牧野区"},{"code":"410721","name":"新乡县"},{"code":"410724","name":"获嘉县"},{"code":"410725","name":"原阳县"},{"code":"410726","name":"延津县"},{"code":"410727","name":"封丘县"},{"code":"410771","name":"新乡高新技术产业开发区"},{"code":"410772","name":"新乡经济技术开发区"},{"code":"410773","name":"新乡市平原城乡一体化示范区"},{"code":"410781","name":"卫辉市"},{"code":"410782","name":"辉县市"},{"code":"410783","name":"长垣市"}]},{"code":"4108","name":"焦作市","children":[{"code":"410802","name":"解放区"},{"code":"410803","name":"中站区"},{"code":"410804","name":"马村区"},{"code":"410811","name":"山阳区"},{"code":"410821","name":"修武县"},{"code":"410822","name":"博爱县"},{"code":"410823","name":"武陟县"},{"code":"410825","name":"温县"},{"code":"410871","name":"焦作城乡一体化示范区"},{"code":"410882","name":"沁阳市"},{"code":"410883","name":"孟州市"}]},{"code":"4109","name":"濮阳市","children":[{"code":"410902","name":"华龙区"},{"code":"410922","name":"清丰县"},{"code":"410923","name":"南乐县"},{"code":"410926","name":"范县"},{"code":"410927","name":"台前县"},{"code":"410928","name":"濮阳县"},{"code":"410971","name":"河南濮阳工业园区"},{"code":"410972","name":"濮阳经济技术开发区"}]},{"code":"4110","name":"许昌市","children":[{"code":"411002","name":"魏都区"},{"code":"411003","name":"建安区"},{"code":"411024","name":"鄢陵县"},{"code":"411025","name":"襄城县"},{"code":"411071","name":"许昌经济技术开发区"},{"code":"411081","name":"禹州市"},{"code":"411082","name":"长葛市"}]},{"code":"4111","name":"漯河市","children":[{"code":"411102","name":"源汇区"},{"code":"411103","name":"郾城区"},{"code":"411104","name":"召陵区"},{"code":"411121","name":"舞阳县"},{"code":"411122","name":"临颍县"},{"code":"411171","name":"漯河经济技术开发区"}]},{"code":"4112","name":"三门峡市","children":[{"code":"411202","name":"湖滨区"},{"code":"411203","name":"陕州区"},{"code":"411221","name":"渑池县"},{"code":"411224","name":"卢氏县"},{"code":"411271","name":"河南三门峡经济开发区"},{"code":"411281","name":"义马市"},{"code":"411282","name":"灵宝市"}]},{"code":"4113","name":"南阳市","children":[{"code":"411302","name":"宛城区"},{"code":"411303","name":"卧龙区"},{"code":"411321","name":"南召县"},{"code":"411322","name":"方城县"},{"code":"411323","name":"西峡县"},{"code":"411324","name":"镇平县"},{"code":"411325","name":"内乡县"},{"code":"411326","name":"淅川县"},{"code":"411327","name":"社旗县"},{"code":"411328","name":"唐河县"},{"code":"411329","name":"新野县"},{"code":"411330","name":"桐柏县"},{"code":"411371","name":"南阳高新技术产业开发区"},{"code":"411372","name":"南阳市城乡一体化示范区"},{"code":"411381","name":"邓州市"}]},{"code":"4114","name":"商丘市","children":[{"code":"411402","name":"梁园区"},{"code":"411403","name":"睢阳区"},{"code":"411421","name":"民权县"},{"code":"411422","name":"睢县"},{"code":"411423","name":"宁陵县"},{"code":"411424","name":"柘城县"},{"code":"411425","name":"虞城县"},{"code":"411426","name":"夏邑县"},{"code":"411471","name":"豫东综合物流产业聚集区"},{"code":"411472","name":"河南商丘经济开发区"},{"code":"411481","name":"永城市"}]},{"code":"4115","name":"信阳市","children":[{"code":"411502","name":"浉河区"},{"code":"411503","name":"平桥区"},{"code":"411521","name":"罗山县"},{"code":"411522","name":"光山县"},{"code":"411523","name":"新县"},{"code":"411524","name":"商城县"},{"code":"411525","name":"固始县"},{"code":"411526","name":"潢川县"},{"code":"411527","name":"淮滨县"},{"code":"411528","name":"息县"},{"code":"411571","name":"信阳高新技术产业开发区"}]},{"code":"4116","name":"周口市","children":[{"code":"411602","name":"川汇区"},{"code":"411603","name":"淮阳区"},{"code":"411621","name":"扶沟县"},{"code":"411622","name":"西华县"},{"code":"411623","name":"商水县"},{"code":"411624","name":"沈丘县"},{"code":"411625","name":"郸城县"},{"code":"411627","name":"太康县"},{"code":"411628","name":"鹿邑县"},{"code":"411671","name":"周口临港开发区"},{"code":"411681","name":"项城市"}]},{"code":"4117","name":"驻马店市","children":[{"code":"411702","name":"驿城区"},{"code":"411721","name":"西平县"},{"code":"411722","name":"上蔡县"},{"code":"411723","name":"平舆县"},{"code":"411724","name":"正阳县"},{"code":"411725","name":"确山县"},{"code":"411726","name":"泌阳县"},{"code":"411727","name":"汝南县"},{"code":"411728","name":"遂平县"},{"code":"411729","name":"新蔡县"},{"code":"411771","name":"河南驻马店经济开发区"}]},{"code":"4190","name":"省直辖县级行政区划","children":[{"code":"419001","name":"济源市"}]}]},{"code":"42","name":"湖北省","children":[{"code":"4201","name":"武汉市","children":[{"code":"420102","name":"江岸区"},{"code":"420103","name":"江汉区"},{"code":"420104","name":"硚口区"},{"code":"420105","name":"汉阳区"},{"code":"420106","name":"武昌区"},{"code":"420107","name":"青山区"},{"code":"420111","name":"洪山区"},{"code":"420112","name":"东西湖区"},{"code":"420113","name":"汉南区"},{"code":"420114","name":"蔡甸区"},{"code":"420115","name":"江夏区"},{"code":"420116","name":"黄陂区"},{"code":"420117","name":"新洲区"}]},{"code":"4202","name":"黄石市","children":[{"code":"420202","name":"黄石港区"},{"code":"420203","name":"西塞山区"},{"code":"420204","name":"下陆区"},{"code":"420205","name":"铁山区"},{"code":"420222","name":"阳新县"},{"code":"420281","name":"大冶市"}]},{"code":"4203","name":"十堰市","children":[{"code":"420302","name":"茅箭区"},{"code":"420303","name":"张湾区"},{"code":"420304","name":"郧阳区"},{"code":"420322","name":"郧西县"},{"code":"420323","name":"竹山县"},{"code":"420324","name":"竹溪县"},{"code":"420325","name":"房县"},{"code":"420381","name":"丹江口市"}]},{"code":"4205","name":"宜昌市","children":[{"code":"420502","name":"西陵区"},{"code":"420503","name":"伍家岗区"},{"code":"420504","name":"点军区"},{"code":"420505","name":"猇亭区"},{"code":"420506","name":"夷陵区"},{"code":"420525","name":"远安县"},{"code":"420526","name":"兴山县"},{"code":"420527","name":"秭归县"},{"code":"420528","name":"长阳土家族自治县"},{"code":"420529","name":"五峰土家族自治县"},{"code":"420581","name":"宜都市"},{"code":"420582","name":"当阳市"},{"code":"420583","name":"枝江市"}]},{"code":"4206","name":"襄阳市","children":[{"code":"420602","name":"襄城区"},{"code":"420606","name":"樊城区"},{"code":"420607","name":"襄州区"},{"code":"420624","name":"南漳县"},{"code":"420625","name":"谷城县"},{"code":"420626","name":"保康县"},{"code":"420682","name":"老河口市"},{"code":"420683","name":"枣阳市"},{"code":"420684","name":"宜城市"}]},{"code":"4207","name":"鄂州市","children":[{"code":"420702","name":"梁子湖区"},{"code":"420703","name":"华容区"},{"code":"420704","name":"鄂城区"}]},{"code":"4208","name":"荆门市","children":[{"code":"420802","name":"东宝区"},{"code":"420804","name":"掇刀区"},{"code":"420822","name":"沙洋县"},{"code":"420881","name":"钟祥市"},{"code":"420882","name":"京山市"}]},{"code":"4209","name":"孝感市","children":[{"code":"420902","name":"孝南区"},{"code":"420921","name":"孝昌县"},{"code":"420922","name":"大悟县"},{"code":"420923","name":"云梦县"},{"code":"420981","name":"应城市"},{"code":"420982","name":"安陆市"},{"code":"420984","name":"汉川市"}]},{"code":"4210","name":"荆州市","children":[{"code":"421002","name":"沙市区"},{"code":"421003","name":"荆州区"},{"code":"421022","name":"公安县"},{"code":"421024","name":"江陵县"},{"code":"421071","name":"荆州经济技术开发区"},{"code":"421081","name":"石首市"},{"code":"421083","name":"洪湖市"},{"code":"421087","name":"松滋市"},{"code":"421088","name":"监利市"}]},{"code":"4211","name":"黄冈市","children":[{"code":"421102","name":"黄州区"},{"code":"421121","name":"团风县"},{"code":"421122","name":"红安县"},{"code":"421123","name":"罗田县"},{"code":"421124","name":"英山县"},{"code":"421125","name":"浠水县"},{"code":"421126","name":"蕲春县"},{"code":"421127","name":"黄梅县"},{"code":"421171","name":"龙感湖管理区"},{"code":"421181","name":"麻城市"},{"code":"421182","name":"武穴市"}]},{"code":"4212","name":"咸宁市","children":[{"code":"421202","name":"咸安区"},{"code":"421221","name":"嘉鱼县"},{"code":"421222","name":"通城县"},{"code":"421223","name":"崇阳县"},{"code":"421224","name":"通山县"},{"code":"421281","name":"赤壁市"}]},{"code":"4213","name":"随州市","children":[{"code":"421303","name":"曾都区"},{"code":"421321","name":"随县"},{"code":"421381","name":"广水市"}]},{"code":"4228","name":"恩施土家族苗族自治州","children":[{"code":"422801","name":"恩施市"},{"code":"422802","name":"利川市"},{"code":"422822","name":"建始县"},{"code":"422823","name":"巴东县"},{"code":"422825","name":"宣恩县"},{"code":"422826","name":"咸丰县"},{"code":"422827","name":"来凤县"},{"code":"422828","name":"鹤峰县"}]},{"code":"4290","name":"省直辖县级行政区划","children":[{"code":"429004","name":"仙桃市"},{"code":"429005","name":"潜江市"},{"code":"429006","name":"天门市"},{"code":"429021","name":"神农架林区"}]}]},{"code":"43","name":"湖南省","children":[{"code":"4301","name":"长沙市","children":[{"code":"430102","name":"芙蓉区"},{"code":"430103","name":"天心区"},{"code":"430104","name":"岳麓区"},{"code":"430105","name":"开福区"},{"code":"430111","name":"雨花区"},{"code":"430112","name":"望城区"},{"code":"430121","name":"长沙县"},{"code":"430181","name":"浏阳市"},{"code":"430182","name":"宁乡市"}]},{"code":"4302","name":"株洲市","children":[{"code":"430202","name":"荷塘区"},{"code":"430203","name":"芦淞区"},{"code":"430204","name":"石峰区"},{"code":"430211","name":"天元区"},{"code":"430212","name":"渌口区"},{"code":"430223","name":"攸县"},{"code":"430224","name":"茶陵县"},{"code":"430225","name":"炎陵县"},{"code":"430281","name":"醴陵市"}]},{"code":"4303","name":"湘潭市","children":[{"code":"430302","name":"雨湖区"},{"code":"430304","name":"岳塘区"},{"code":"430321","name":"湘潭县"},{"code":"430371","name":"湖南湘潭高新技术产业园区"},{"code":"430372","name":"湘潭昭山示范区"},{"code":"430373","name":"湘潭九华示范区"},{"code":"430381","name":"湘乡市"},{"code":"430382","name":"韶山市"}]},{"code":"4304","name":"衡阳市","children":[{"code":"430405","name":"珠晖区"},{"code":"430406","name":"雁峰区"},{"code":"430407","name":"石鼓区"},{"code":"430408","name":"蒸湘区"},{"code":"430412","name":"南岳区"},{"code":"430421","name":"衡阳县"},{"code":"430422","name":"衡南县"},{"code":"430423","name":"衡山县"},{"code":"430424","name":"衡东县"},{"code":"430426","name":"祁东县"},{"code":"430473","name":"湖南衡阳松木经济开发区"},{"code":"430476","name":"湖南衡阳高新技术产业园区"},{"code":"430481","name":"耒阳市"},{"code":"430482","name":"常宁市"}]},{"code":"4305","name":"邵阳市","children":[{"code":"430502","name":"双清区"},{"code":"430503","name":"大祥区"},{"code":"430511","name":"北塔区"},{"code":"430522","name":"新邵县"},{"code":"430523","name":"邵阳县"},{"code":"430524","name":"隆回县"},{"code":"430525","name":"洞口县"},{"code":"430527","name":"绥宁县"},{"code":"430528","name":"新宁县"},{"code":"430529","name":"城步苗族自治县"},{"code":"430581","name":"武冈市"},{"code":"430582","name":"邵东市"}]},{"code":"4306","name":"岳阳市","children":[{"code":"430602","name":"岳阳楼区"},{"code":"430603","name":"云溪区"},{"code":"430611","name":"君山区"},{"code":"430621","name":"岳阳县"},{"code":"430623","name":"华容县"},{"code":"430624","name":"湘阴县"},{"code":"430626","name":"平江县"},{"code":"430671","name":"岳阳市屈原管理区"},{"code":"430681","name":"汨罗市"},{"code":"430682","name":"临湘市"}]},{"code":"4307","name":"常德市","children":[{"code":"430702","name":"武陵区"},{"code":"430703","name":"鼎城区"},{"code":"430721","name":"安乡县"},{"code":"430722","name":"汉寿县"},{"code":"430723","name":"澧县"},{"code":"430724","name":"临澧县"},{"code":"430725","name":"桃源县"},{"code":"430726","name":"石门县"},{"code":"430771","name":"常德市西洞庭管理区"},{"code":"430781","name":"津市市"}]},{"code":"4308","name":"张家界市","children":[{"code":"430802","name":"永定区"},{"code":"430811","name":"武陵源区"},{"code":"430821","name":"慈利县"},{"code":"430822","name":"桑植县"}]},{"code":"4309","name":"益阳市","children":[{"code":"430902","name":"资阳区"},{"code":"430903","name":"赫山区"},{"code":"430921","name":"南县"},{"code":"430922","name":"桃江县"},{"code":"430923","name":"安化县"},{"code":"430971","name":"益阳市大通湖管理区"},{"code":"430972","name":"湖南益阳高新技术产业园区"},{"code":"430981","name":"沅江市"}]},{"code":"4310","name":"郴州市","children":[{"code":"431002","name":"北湖区"},{"code":"431003","name":"苏仙区"},{"code":"431021","name":"桂阳县"},{"code":"431022","name":"宜章县"},{"code":"431023","name":"永兴县"},{"code":"431024","name":"嘉禾县"},{"code":"431025","name":"临武县"},{"code":"431026","name":"汝城县"},{"code":"431027","name":"桂东县"},{"code":"431028","name":"安仁县"},{"code":"431081","name":"资兴市"}]},{"code":"4311","name":"永州市","children":[{"code":"431102","name":"零陵区"},{"code":"431103","name":"冷水滩区"},{"code":"431122","name":"东安县"},{"code":"431123","name":"双牌县"},{"code":"431124","name":"道县"},{"code":"431125","name":"江永县"},{"code":"431126","name":"宁远县"},{"code":"431127","name":"蓝山县"},{"code":"431128","name":"新田县"},{"code":"431129","name":"江华瑶族自治县"},{"code":"431171","name":"永州经济技术开发区"},{"code":"431173","name":"永州市回龙圩管理区"},{"code":"431181","name":"祁阳市"}]},{"code":"4312","name":"怀化市","children":[{"code":"431202","name":"鹤城区"},{"code":"431221","name":"中方县"},{"code":"431222","name":"沅陵县"},{"code":"431223","name":"辰溪县"},{"code":"431224","name":"溆浦县"},{"code":"431225","name":"会同县"},{"code":"431226","name":"麻阳苗族自治县"},{"code":"431227","name":"新晃侗族自治县"},{"code":"431228","name":"芷江侗族自治县"},{"code":"431229","name":"靖州苗族侗族自治县"},{"code":"431230","name":"通道侗族自治县"},{"code":"431271","name":"怀化市洪江管理区"},{"code":"431281","name":"洪江市"}]},{"code":"4313","name":"娄底市","children":[{"code":"431302","name":"娄星区"},{"code":"431321","name":"双峰县"},{"code":"431322","name":"新化县"},{"code":"431381","name":"冷水江市"},{"code":"431382","name":"涟源市"}]},{"code":"4331","name":"湘西土家族苗族自治州","children":[{"code":"433101","name":"吉首市"},{"code":"433122","name":"泸溪县"},{"code":"433123","name":"凤凰县"},{"code":"433124","name":"花垣县"},{"code":"433125","name":"保靖县"},{"code":"433126","name":"古丈县"},{"code":"433127","name":"永顺县"},{"code":"433130","name":"龙山县"}]}]},{"code":"44","name":"广东省","children":[{"code":"4401","name":"广州市","children":[{"code":"440103","name":"荔湾区"},{"code":"440104","name":"越秀区"},{"code":"440105","name":"海珠区"},{"code":"440106","name":"天河区"},{"code":"440111","name":"白云区"},{"code":"440112","name":"黄埔区"},{"code":"440113","name":"番禺区"},{"code":"440114","name":"花都区"},{"code":"440115","name":"南沙区"},{"code":"440117","name":"从化区"},{"code":"440118","name":"增城区"}]},{"code":"4402","name":"韶关市","children":[{"code":"440203","name":"武江区"},{"code":"440204","name":"浈江区"},{"code":"440205","name":"曲江区"},{"code":"440222","name":"始兴县"},{"code":"440224","name":"仁化县"},{"code":"440229","name":"翁源县"},{"code":"440232","name":"乳源瑶族自治县"},{"code":"440233","name":"新丰县"},{"code":"440281","name":"乐昌市"},{"code":"440282","name":"南雄市"}]},{"code":"4403","name":"深圳市","children":[{"code":"440303","name":"罗湖区"},{"code":"440304","name":"福田区"},{"code":"440305","name":"南山区"},{"code":"440306","name":"宝安区"},{"code":"440307","name":"龙岗区"},{"code":"440308","name":"盐田区"},{"code":"440309","name":"龙华区"},{"code":"440310","name":"坪山区"},{"code":"440311","name":"光明区"}]},{"code":"4404","name":"珠海市","children":[{"code":"440402","name":"香洲区"},{"code":"440403","name":"斗门区"},{"code":"440404","name":"金湾区"}]},{"code":"4405","name":"汕头市","children":[{"code":"440507","name":"龙湖区"},{"code":"440511","name":"金平区"},{"code":"440512","name":"濠江区"},{"code":"440513","name":"潮阳区"},{"code":"440514","name":"潮南区"},{"code":"440515","name":"澄海区"},{"code":"440523","name":"南澳县"}]},{"code":"4406","name":"佛山市","children":[{"code":"440604","name":"禅城区"},{"code":"440605","name":"南海区"},{"code":"440606","name":"顺德区"},{"code":"440607","name":"三水区"},{"code":"440608","name":"高明区"}]},{"code":"4407","name":"江门市","children":[{"code":"440703","name":"蓬江区"},{"code":"440704","name":"江海区"},{"code":"440705","name":"新会区"},{"code":"440781","name":"台山市"},{"code":"440783","name":"开平市"},{"code":"440784","name":"鹤山市"},{"code":"440785","name":"恩平市"}]},{"code":"4408","name":"湛江市","children":[{"code":"440802","name":"赤坎区"},{"code":"440803","name":"霞山区"},{"code":"440804","name":"坡头区"},{"code":"440811","name":"麻章区"},{"code":"440823","name":"遂溪县"},{"code":"440825","name":"徐闻县"},{"code":"440881","name":"廉江市"},{"code":"440882","name":"雷州市"},{"code":"440883","name":"吴川市"}]},{"code":"4409","name":"茂名市","children":[{"code":"440902","name":"茂南区"},{"code":"440904","name":"电白区"},{"code":"440981","name":"高州市"},{"code":"440982","name":"化州市"},{"code":"440983","name":"信宜市"}]},{"code":"4412","name":"肇庆市","children":[{"code":"441202","name":"端州区"},{"code":"441203","name":"鼎湖区"},{"code":"441204","name":"高要区"},{"code":"441223","name":"广宁县"},{"code":"441224","name":"怀集县"},{"code":"441225","name":"封开县"},{"code":"441226","name":"德庆县"},{"code":"441284","name":"四会市"}]},{"code":"4413","name":"惠州市","children":[{"code":"441302","name":"惠城区"},{"code":"441303","name":"惠阳区"},{"code":"441322","name":"博罗县"},{"code":"441323","name":"惠东县"},{"code":"441324","name":"龙门县"}]},{"code":"4414","name":"梅州市","children":[{"code":"441402","name":"梅江区"},{"code":"441403","name":"梅县区"},{"code":"441422","name":"大埔县"},{"code":"441423","name":"丰顺县"},{"code":"441424","name":"五华县"},{"code":"441426","name":"平远县"},{"code":"441427","name":"蕉岭县"},{"code":"441481","name":"兴宁市"}]},{"code":"4415","name":"汕尾市","children":[{"code":"441502","name":"城区"},{"code":"441521","name":"海丰县"},{"code":"441523","name":"陆河县"},{"code":"441581","name":"陆丰市"}]},{"code":"4416","name":"河源市","children":[{"code":"441602","name":"源城区"},{"code":"441621","name":"紫金县"},{"code":"441622","name":"龙川县"},{"code":"441623","name":"连平县"},{"code":"441624","name":"和平县"},{"code":"441625","name":"东源县"}]},{"code":"4417","name":"阳江市","children":[{"code":"441702","name":"江城区"},{"code":"441704","name":"阳东区"},{"code":"441721","name":"阳西县"},{"code":"441781","name":"阳春市"}]},{"code":"4418","name":"清远市","children":[{"code":"441802","name":"清城区"},{"code":"441803","name":"清新区"},{"code":"441821","name":"佛冈县"},{"code":"441823","name":"阳山县"},{"code":"441825","name":"连山壮族瑶族自治县"},{"code":"441826","name":"连南瑶族自治县"},{"code":"441881","name":"英德市"},{"code":"441882","name":"连州市"}]},{"code":"4419","name":"东莞市","children":[{"code":"441900003","name":"东城街道"},{"code":"441900004","name":"南城街道"},{"code":"441900005","name":"万江街道"},{"code":"441900006","name":"莞城街道"},{"code":"441900101","name":"石碣镇"},{"code":"441900102","name":"石龙镇"},{"code":"441900103","name":"茶山镇"},{"code":"441900104","name":"石排镇"},{"code":"441900105","name":"企石镇"},{"code":"441900106","name":"横沥镇"},{"code":"441900107","name":"桥头镇"},{"code":"441900108","name":"谢岗镇"},{"code":"441900109","name":"东坑镇"},{"code":"441900110","name":"常平镇"},{"code":"441900111","name":"寮步镇"},{"code":"441900112","name":"樟木头镇"},{"code":"441900113","name":"大朗镇"},{"code":"441900114","name":"黄江镇"},{"code":"441900115","name":"清溪镇"},{"code":"441900116","name":"塘厦镇"},{"code":"441900117","name":"凤岗镇"},{"code":"441900118","name":"大岭山镇"},{"code":"441900119","name":"长安镇"},{"code":"441900121","name":"虎门镇"},{"code":"441900122","name":"厚街镇"},{"code":"441900123","name":"沙田镇"},{"code":"441900124","name":"道滘镇"},{"code":"441900125","name":"洪梅镇"},{"code":"441900126","name":"麻涌镇"},{"code":"441900127","name":"望牛墩镇"},{"code":"441900128","name":"中堂镇"},{"code":"441900129","name":"高埗镇"},{"code":"441900401","name":"松山湖"},{"code":"441900402","name":"东莞港"},{"code":"441900403","name":"东莞生态园"},{"code":"441900404","name":"东莞滨海湾新区"}]},{"code":"4420","name":"中山市","children":[{"code":"442000001","name":"石岐街道"},{"code":"442000002","name":"东区街道"},{"code":"442000003","name":"中山港街道"},{"code":"442000004","name":"西区街道"},{"code":"442000005","name":"南区街道"},{"code":"442000006","name":"五桂山街道"},{"code":"442000007","name":"民众街道"},{"code":"442000008","name":"南朗街道"},{"code":"442000101","name":"黄圃镇"},{"code":"442000103","name":"东凤镇"},{"code":"442000105","name":"古镇镇"},{"code":"442000106","name":"沙溪镇"},{"code":"442000107","name":"坦洲镇"},{"code":"442000108","name":"港口镇"},{"code":"442000109","name":"三角镇"},{"code":"442000110","name":"横栏镇"},{"code":"442000111","name":"南头镇"},{"code":"442000112","name":"阜沙镇"},{"code":"442000114","name":"三乡镇"},{"code":"442000115","name":"板芙镇"},{"code":"442000116","name":"大涌镇"},{"code":"442000117","name":"神湾镇"},{"code":"442000118","name":"小榄镇"}]},{"code":"4451","name":"潮州市","children":[{"code":"445102","name":"湘桥区"},{"code":"445103","name":"潮安区"},{"code":"445122","name":"饶平县"}]},{"code":"4452","name":"揭阳市","children":[{"code":"445202","name":"榕城区"},{"code":"445203","name":"揭东区"},{"code":"445222","name":"揭西县"},{"code":"445224","name":"惠来县"},{"code":"445281","name":"普宁市"}]},{"code":"4453","name":"云浮市","children":[{"code":"445302","name":"云城区"},{"code":"445303","name":"云安区"},{"code":"445321","name":"新兴县"},{"code":"445322","name":"郁南县"},{"code":"445381","name":"罗定市"}]}]},{"code":"45","name":"广西壮族自治区","children":[{"code":"4501","name":"南宁市","children":[{"code":"450102","name":"兴宁区"},{"code":"450103","name":"青秀区"},{"code":"450105","name":"江南区"},{"code":"450107","name":"西乡塘区"},{"code":"450108","name":"良庆区"},{"code":"450109","name":"邕宁区"},{"code":"450110","name":"武鸣区"},{"code":"450123","name":"隆安县"},{"code":"450124","name":"马山县"},{"code":"450125","name":"上林县"},{"code":"450126","name":"宾阳县"},{"code":"450181","name":"横州市"}]},{"code":"4502","name":"柳州市","children":[{"code":"450202","name":"城中区"},{"code":"450203","name":"鱼峰区"},{"code":"450204","name":"柳南区"},{"code":"450205","name":"柳北区"},{"code":"450206","name":"柳江区"},{"code":"450222","name":"柳城县"},{"code":"450223","name":"鹿寨县"},{"code":"450224","name":"融安县"},{"code":"450225","name":"融水苗族自治县"},{"code":"450226","name":"三江侗族自治县"}]},{"code":"4503","name":"桂林市","children":[{"code":"450302","name":"秀峰区"},{"code":"450303","name":"叠彩区"},{"code":"450304","name":"象山区"},{"code":"450305","name":"七星区"},{"code":"450311","name":"雁山区"},{"code":"450312","name":"临桂区"},{"code":"450321","name":"阳朔县"},{"code":"450323","name":"灵川县"},{"code":"450324","name":"全州县"},{"code":"450325","name":"兴安县"},{"code":"450326","name":"永福县"},{"code":"450327","name":"灌阳县"},{"code":"450328","name":"龙胜各族自治县"},{"code":"450329","name":"资源县"},{"code":"450330","name":"平乐县"},{"code":"450332","name":"恭城瑶族自治县"},{"code":"450381","name":"荔浦市"}]},{"code":"4504","name":"梧州市","children":[{"code":"450403","name":"万秀区"},{"code":"450405","name":"长洲区"},{"code":"450406","name":"龙圩区"},{"code":"450421","name":"苍梧县"},{"code":"450422","name":"藤县"},{"code":"450423","name":"蒙山县"},{"code":"450481","name":"岑溪市"}]},{"code":"4505","name":"北海市","children":[{"code":"450502","name":"海城区"},{"code":"450503","name":"银海区"},{"code":"450512","name":"铁山港区"},{"code":"450521","name":"合浦县"}]},{"code":"4506","name":"防城港市","children":[{"code":"450602","name":"港口区"},{"code":"450603","name":"防城区"},{"code":"450621","name":"上思县"},{"code":"450681","name":"东兴市"}]},{"code":"4507","name":"钦州市","children":[{"code":"450702","name":"钦南区"},{"code":"450703","name":"钦北区"},{"code":"450721","name":"灵山县"},{"code":"450722","name":"浦北县"}]},{"code":"4508","name":"贵港市","children":[{"code":"450802","name":"港北区"},{"code":"450803","name":"港南区"},{"code":"450804","name":"覃塘区"},{"code":"450821","name":"平南县"},{"code":"450881","name":"桂平市"}]},{"code":"4509","name":"玉林市","children":[{"code":"450902","name":"玉州区"},{"code":"450903","name":"福绵区"},{"code":"450921","name":"容县"},{"code":"450922","name":"陆川县"},{"code":"450923","name":"博白县"},{"code":"450924","name":"兴业县"},{"code":"450981","name":"北流市"}]},{"code":"4510","name":"百色市","children":[{"code":"451002","name":"右江区"},{"code":"451003","name":"田阳区"},{"code":"451022","name":"田东县"},{"code":"451024","name":"德保县"},{"code":"451026","name":"那坡县"},{"code":"451027","name":"凌云县"},{"code":"451028","name":"乐业县"},{"code":"451029","name":"田林县"},{"code":"451030","name":"西林县"},{"code":"451031","name":"隆林各族自治县"},{"code":"451081","name":"靖西市"},{"code":"451082","name":"平果市"}]},{"code":"4511","name":"贺州市","children":[{"code":"451102","name":"八步区"},{"code":"451103","name":"平桂区"},{"code":"451121","name":"昭平县"},{"code":"451122","name":"钟山县"},{"code":"451123","name":"富川瑶族自治县"}]},{"code":"4512","name":"河池市","children":[{"code":"451202","name":"金城江区"},{"code":"451203","name":"宜州区"},{"code":"451221","name":"南丹县"},{"code":"451222","name":"天峨县"},{"code":"451223","name":"凤山县"},{"code":"451224","name":"东兰县"},{"code":"451225","name":"罗城仫佬族自治县"},{"code":"451226","name":"环江毛南族自治县"},{"code":"451227","name":"巴马瑶族自治县"},{"code":"451228","name":"都安瑶族自治县"},{"code":"451229","name":"大化瑶族自治县"}]},{"code":"4513","name":"来宾市","children":[{"code":"451302","name":"兴宾区"},{"code":"451321","name":"忻城县"},{"code":"451322","name":"象州县"},{"code":"451323","name":"武宣县"},{"code":"451324","name":"金秀瑶族自治县"},{"code":"451381","name":"合山市"}]},{"code":"4514","name":"崇左市","children":[{"code":"451402","name":"江州区"},{"code":"451421","name":"扶绥县"},{"code":"451422","name":"宁明县"},{"code":"451423","name":"龙州县"},{"code":"451424","name":"大新县"},{"code":"451425","name":"天等县"},{"code":"451481","name":"凭祥市"}]}]},{"code":"46","name":"海南省","children":[{"code":"4601","name":"海口市","children":[{"code":"460105","name":"秀英区"},{"code":"460106","name":"龙华区"},{"code":"460107","name":"琼山区"},{"code":"460108","name":"美兰区"}]},{"code":"4602","name":"三亚市","children":[{"code":"460202","name":"海棠区"},{"code":"460203","name":"吉阳区"},{"code":"460204","name":"天涯区"},{"code":"460205","name":"崖州区"}]},{"code":"4603","name":"三沙市","children":[{"code":"460321","name":"西沙群岛"},{"code":"460322","name":"南沙群岛"},{"code":"460323","name":"中沙群岛的岛礁及其海域"}]},{"code":"4604","name":"儋州市","children":[{"code":"460400100","name":"那大镇"},{"code":"460400101","name":"和庆镇"},{"code":"460400102","name":"南丰镇"},{"code":"460400103","name":"大成镇"},{"code":"460400104","name":"雅星镇"},{"code":"460400105","name":"兰洋镇"},{"code":"460400106","name":"光村镇"},{"code":"460400107","name":"木棠镇"},{"code":"460400108","name":"海头镇"},{"code":"460400109","name":"峨蔓镇"},{"code":"460400111","name":"王五镇"},{"code":"460400112","name":"白马井镇"},{"code":"460400113","name":"中和镇"},{"code":"460400114","name":"排浦镇"},{"code":"460400115","name":"东成镇"},{"code":"460400116","name":"新州镇"},{"code":"460400499","name":"洋浦经济开发区"},{"code":"460400500","name":"华南热作学院"}]},{"code":"4690","name":"省直辖县级行政区划","children":[{"code":"469001","name":"五指山市"},{"code":"469002","name":"琼海市"},{"code":"469005","name":"文昌市"},{"code":"469006","name":"万宁市"},{"code":"469007","name":"东方市"},{"code":"469021","name":"定安县"},{"code":"469022","name":"屯昌县"},{"code":"469023","name":"澄迈县"},{"code":"469024","name":"临高县"},{"code":"469025","name":"白沙黎族自治县"},{"code":"469026","name":"昌江黎族自治县"},{"code":"469027","name":"乐东黎族自治县"},{"code":"469028","name":"陵水黎族自治县"},{"code":"469029","name":"保亭黎族苗族自治县"},{"code":"469030","name":"琼中黎族苗族自治县"}]}]},{"code":"50","name":"重庆市","children":[{"code":"5001","name":"市辖区","children":[{"code":"500101","name":"万州区"},{"code":"500102","name":"涪陵区"},{"code":"500103","name":"渝中区"},{"code":"500104","name":"大渡口区"},{"code":"500105","name":"江北区"},{"code":"500106","name":"沙坪坝区"},{"code":"500107","name":"九龙坡区"},{"code":"500108","name":"南岸区"},{"code":"500109","name":"北碚区"},{"code":"500110","name":"綦江区"},{"code":"500111","name":"大足区"},{"code":"500112","name":"渝北区"},{"code":"500113","name":"巴南区"},{"code":"500114","name":"黔江区"},{"code":"500115","name":"长寿区"},{"code":"500116","name":"江津区"},{"code":"500117","name":"合川区"},{"code":"500118","name":"永川区"},{"code":"500119","name":"南川区"},{"code":"500120","name":"璧山区"},{"code":"500151","name":"铜梁区"},{"code":"500152","name":"潼南区"},{"code":"500153","name":"荣昌区"},{"code":"500154","name":"开州区"},{"code":"500155","name":"梁平区"},{"code":"500156","name":"武隆区"}]},{"code":"5002","name":"县","children":[{"code":"500229","name":"城口县"},{"code":"500230","name":"丰都县"},{"code":"500231","name":"垫江县"},{"code":"500233","name":"忠县"},{"code":"500235","name":"云阳县"},{"code":"500236","name":"奉节县"},{"code":"500237","name":"巫山县"},{"code":"500238","name":"巫溪县"},{"code":"500240","name":"石柱土家族自治县"},{"code":"500241","name":"秀山土家族苗族自治县"},{"code":"500242","name":"酉阳土家族苗族自治县"},{"code":"500243","name":"彭水苗族土家族自治县"}]}]},{"code":"51","name":"四川省","children":[{"code":"5101","name":"成都市","children":[{"code":"510104","name":"锦江区"},{"code":"510105","name":"青羊区"},{"code":"510106","name":"金牛区"},{"code":"510107","name":"武侯区"},{"code":"510108","name":"成华区"},{"code":"510112","name":"龙泉驿区"},{"code":"510113","name":"青白江区"},{"code":"510114","name":"新都区"},{"code":"510115","name":"温江区"},{"code":"510116","name":"双流区"},{"code":"510117","name":"郫都区"},{"code":"510118","name":"新津区"},{"code":"510121","name":"金堂县"},{"code":"510129","name":"大邑县"},{"code":"510131","name":"蒲江县"},{"code":"510181","name":"都江堰市"},{"code":"510182","name":"彭州市"},{"code":"510183","name":"邛崃市"},{"code":"510184","name":"崇州市"},{"code":"510185","name":"简阳市"}]},{"code":"5103","name":"自贡市","children":[{"code":"510302","name":"自流井区"},{"code":"510303","name":"贡井区"},{"code":"510304","name":"大安区"},{"code":"510311","name":"沿滩区"},{"code":"510321","name":"荣县"},{"code":"510322","name":"富顺县"}]},{"code":"5104","name":"攀枝花市","children":[{"code":"510402","name":"东区"},{"code":"510403","name":"西区"},{"code":"510411","name":"仁和区"},{"code":"510421","name":"米易县"},{"code":"510422","name":"盐边县"}]},{"code":"5105","name":"泸州市","children":[{"code":"510502","name":"江阳区"},{"code":"510503","name":"纳溪区"},{"code":"510504","name":"龙马潭区"},{"code":"510521","name":"泸县"},{"code":"510522","name":"合江县"},{"code":"510524","name":"叙永县"},{"code":"510525","name":"古蔺县"}]},{"code":"5106","name":"德阳市","children":[{"code":"510603","name":"旌阳区"},{"code":"510604","name":"罗江区"},{"code":"510623","name":"中江县"},{"code":"510681","name":"广汉市"},{"code":"510682","name":"什邡市"},{"code":"510683","name":"绵竹市"}]},{"code":"5107","name":"绵阳市","children":[{"code":"510703","name":"涪城区"},{"code":"510704","name":"游仙区"},{"code":"510705","name":"安州区"},{"code":"510722","name":"三台县"},{"code":"510723","name":"盐亭县"},{"code":"510725","name":"梓潼县"},{"code":"510726","name":"北川羌族自治县"},{"code":"510727","name":"平武县"},{"code":"510781","name":"江油市"}]},{"code":"5108","name":"广元市","children":[{"code":"510802","name":"利州区"},{"code":"510811","name":"昭化区"},{"code":"510812","name":"朝天区"},{"code":"510821","name":"旺苍县"},{"code":"510822","name":"青川县"},{"code":"510823","name":"剑阁县"},{"code":"510824","name":"苍溪县"}]},{"code":"5109","name":"遂宁市","children":[{"code":"510903","name":"船山区"},{"code":"510904","name":"安居区"},{"code":"510921","name":"蓬溪县"},{"code":"510923","name":"大英县"},{"code":"510981","name":"射洪市"}]},{"code":"5110","name":"内江市","children":[{"code":"511002","name":"市中区"},{"code":"511011","name":"东兴区"},{"code":"511024","name":"威远县"},{"code":"511025","name":"资中县"},{"code":"511083","name":"隆昌市"}]},{"code":"5111","name":"乐山市","children":[{"code":"511102","name":"市中区"},{"code":"511111","name":"沙湾区"},{"code":"511112","name":"五通桥区"},{"code":"511113","name":"金口河区"},{"code":"511123","name":"犍为县"},{"code":"511124","name":"井研县"},{"code":"511126","name":"夹江县"},{"code":"511129","name":"沐川县"},{"code":"511132","name":"峨边彝族自治县"},{"code":"511133","name":"马边彝族自治县"},{"code":"511181","name":"峨眉山市"}]},{"code":"5113","name":"南充市","children":[{"code":"511302","name":"顺庆区"},{"code":"511303","name":"高坪区"},{"code":"511304","name":"嘉陵区"},{"code":"511321","name":"南部县"},{"code":"511322","name":"营山县"},{"code":"511323","name":"蓬安县"},{"code":"511324","name":"仪陇县"},{"code":"511325","name":"西充县"},{"code":"511381","name":"阆中市"}]},{"code":"5114","name":"眉山市","children":[{"code":"511402","name":"东坡区"},{"code":"511403","name":"彭山区"},{"code":"511421","name":"仁寿县"},{"code":"511423","name":"洪雅县"},{"code":"511424","name":"丹棱县"},{"code":"511425","name":"青神县"}]},{"code":"5115","name":"宜宾市","children":[{"code":"511502","name":"翠屏区"},{"code":"511503","name":"南溪区"},{"code":"511504","name":"叙州区"},{"code":"511523","name":"江安县"},{"code":"511524","name":"长宁县"},{"code":"511525","name":"高县"},{"code":"511526","name":"珙县"},{"code":"511527","name":"筠连县"},{"code":"511528","name":"兴文县"},{"code":"511529","name":"屏山县"}]},{"code":"5116","name":"广安市","children":[{"code":"511602","name":"广安区"},{"code":"511603","name":"前锋区"},{"code":"511621","name":"岳池县"},{"code":"511622","name":"武胜县"},{"code":"511623","name":"邻水县"},{"code":"511681","name":"华蓥市"}]},{"code":"5117","name":"达州市","children":[{"code":"511702","name":"通川区"},{"code":"511703","name":"达川区"},{"code":"511722","name":"宣汉县"},{"code":"511723","name":"开江县"},{"code":"511724","name":"大竹县"},{"code":"511725","name":"渠县"},{"code":"511781","name":"万源市"}]},{"code":"5118","name":"雅安市","children":[{"code":"511802","name":"雨城区"},{"code":"511803","name":"名山区"},{"code":"511822","name":"荥经县"},{"code":"511823","name":"汉源县"},{"code":"511824","name":"石棉县"},{"code":"511825","name":"天全县"},{"code":"511826","name":"芦山县"},{"code":"511827","name":"宝兴县"}]},{"code":"5119","name":"巴中市","children":[{"code":"511902","name":"巴州区"},{"code":"511903","name":"恩阳区"},{"code":"511921","name":"通江县"},{"code":"511922","name":"南江县"},{"code":"511923","name":"平昌县"}]},{"code":"5120","name":"资阳市","children":[{"code":"512002","name":"雁江区"},{"code":"512021","name":"安岳县"},{"code":"512022","name":"乐至县"}]},{"code":"5132","name":"阿坝藏族羌族自治州","children":[{"code":"513201","name":"马尔康市"},{"code":"513221","name":"汶川县"},{"code":"513222","name":"理县"},{"code":"513223","name":"茂县"},{"code":"513224","name":"松潘县"},{"code":"513225","name":"九寨沟县"},{"code":"513226","name":"金川县"},{"code":"513227","name":"小金县"},{"code":"513228","name":"黑水县"},{"code":"513230","name":"壤塘县"},{"code":"513231","name":"阿坝县"},{"code":"513232","name":"若尔盖县"},{"code":"513233","name":"红原县"}]},{"code":"5133","name":"甘孜藏族自治州","children":[{"code":"513301","name":"康定市"},{"code":"513322","name":"泸定县"},{"code":"513323","name":"丹巴县"},{"code":"513324","name":"九龙县"},{"code":"513325","name":"雅江县"},{"code":"513326","name":"道孚县"},{"code":"513327","name":"炉霍县"},{"code":"513328","name":"甘孜县"},{"code":"513329","name":"新龙县"},{"code":"513330","name":"德格县"},{"code":"513331","name":"白玉县"},{"code":"513332","name":"石渠县"},{"code":"513333","name":"色达县"},{"code":"513334","name":"理塘县"},{"code":"513335","name":"巴塘县"},{"code":"513336","name":"乡城县"},{"code":"513337","name":"稻城县"},{"code":"513338","name":"得荣县"}]},{"code":"5134","name":"凉山彝族自治州","children":[{"code":"513401","name":"西昌市"},{"code":"513402","name":"会理市"},{"code":"513422","name":"木里藏族自治县"},{"code":"513423","name":"盐源县"},{"code":"513424","name":"德昌县"},{"code":"513426","name":"会东县"},{"code":"513427","name":"宁南县"},{"code":"513428","name":"普格县"},{"code":"513429","name":"布拖县"},{"code":"513430","name":"金阳县"},{"code":"513431","name":"昭觉县"},{"code":"513432","name":"喜德县"},{"code":"513433","name":"冕宁县"},{"code":"513434","name":"越西县"},{"code":"513435","name":"甘洛县"},{"code":"513436","name":"美姑县"},{"code":"513437","name":"雷波县"}]}]},{"code":"52","name":"贵州省","children":[{"code":"5201","name":"贵阳市","children":[{"code":"520102","name":"南明区"},{"code":"520103","name":"云岩区"},{"code":"520111","name":"花溪区"},{"code":"520112","name":"乌当区"},{"code":"520113","name":"白云区"},{"code":"520115","name":"观山湖区"},{"code":"520121","name":"开阳县"},{"code":"520122","name":"息烽县"},{"code":"520123","name":"修文县"},{"code":"520181","name":"清镇市"}]},{"code":"5202","name":"六盘水市","children":[{"code":"520201","name":"钟山区"},{"code":"520203","name":"六枝特区"},{"code":"520204","name":"水城区"},{"code":"520281","name":"盘州市"}]},{"code":"5203","name":"遵义市","children":[{"code":"520302","name":"红花岗区"},{"code":"520303","name":"汇川区"},{"code":"520304","name":"播州区"},{"code":"520322","name":"桐梓县"},{"code":"520323","name":"绥阳县"},{"code":"520324","name":"正安县"},{"code":"520325","name":"道真仡佬族苗族自治县"},{"code":"520326","name":"务川仡佬族苗族自治县"},{"code":"520327","name":"凤冈县"},{"code":"520328","name":"湄潭县"},{"code":"520329","name":"余庆县"},{"code":"520330","name":"习水县"},{"code":"520381","name":"赤水市"},{"code":"520382","name":"仁怀市"}]},{"code":"5204","name":"安顺市","children":[{"code":"520402","name":"西秀区"},{"code":"520403","name":"平坝区"},{"code":"520422","name":"普定县"},{"code":"520423","name":"镇宁布依族苗族自治县"},{"code":"520424","name":"关岭布依族苗族自治县"},{"code":"520425","name":"紫云苗族布依族自治县"}]},{"code":"5205","name":"毕节市","children":[{"code":"520502","name":"七星关区"},{"code":"520521","name":"大方县"},{"code":"520523","name":"金沙县"},{"code":"520524","name":"织金县"},{"code":"520525","name":"纳雍县"},{"code":"520526","name":"威宁彝族回族苗族自治县"},{"code":"520527","name":"赫章县"},{"code":"520581","name":"黔西市"}]},{"code":"5206","name":"铜仁市","children":[{"code":"520602","name":"碧江区"},{"code":"520603","name":"万山区"},{"code":"520621","name":"江口县"},{"code":"520622","name":"玉屏侗族自治县"},{"code":"520623","name":"石阡县"},{"code":"520624","name":"思南县"},{"code":"520625","name":"印江土家族苗族自治县"},{"code":"520626","name":"德江县"},{"code":"520627","name":"沿河土家族自治县"},{"code":"520628","name":"松桃苗族自治县"}]},{"code":"5223","name":"黔西南布依族苗族自治州","children":[{"code":"522301","name":"兴义市"},{"code":"522302","name":"兴仁市"},{"code":"522323","name":"普安县"},{"code":"522324","name":"晴隆县"},{"code":"522325","name":"贞丰县"},{"code":"522326","name":"望谟县"},{"code":"522327","name":"册亨县"},{"code":"522328","name":"安龙县"}]},{"code":"5226","name":"黔东南苗族侗族自治州","children":[{"code":"522601","name":"凯里市"},{"code":"522622","name":"黄平县"},{"code":"522623","name":"施秉县"},{"code":"522624","name":"三穗县"},{"code":"522625","name":"镇远县"},{"code":"522626","name":"岑巩县"},{"code":"522627","name":"天柱县"},{"code":"522628","name":"锦屏县"},{"code":"522629","name":"剑河县"},{"code":"522630","name":"台江县"},{"code":"522631","name":"黎平县"},{"code":"522632","name":"榕江县"},{"code":"522633","name":"从江县"},{"code":"522634","name":"雷山县"},{"code":"522635","name":"麻江县"},{"code":"522636","name":"丹寨县"}]},{"code":"5227","name":"黔南布依族苗族自治州","children":[{"code":"522701","name":"都匀市"},{"code":"522702","name":"福泉市"},{"code":"522722","name":"荔波县"},{"code":"522723","name":"贵定县"},{"code":"522725","name":"瓮安县"},{"code":"522726","name":"独山县"},{"code":"522727","name":"平塘县"},{"code":"522728","name":"罗甸县"},{"code":"522729","name":"长顺县"},{"code":"522730","name":"龙里县"},{"code":"522731","name":"惠水县"},{"code":"522732","name":"三都水族自治县"}]}]},{"code":"53","name":"云南省","children":[{"code":"5301","name":"昆明市","children":[{"code":"530102","name":"五华区"},{"code":"530103","name":"盘龙区"},{"code":"530111","name":"官渡区"},{"code":"530112","name":"西山区"},{"code":"530113","name":"东川区"},{"code":"530114","name":"呈贡区"},{"code":"530115","name":"晋宁区"},{"code":"530124","name":"富民县"},{"code":"530125","name":"宜良县"},{"code":"530126","name":"石林彝族自治县"},{"code":"530127","name":"嵩明县"},{"code":"530128","name":"禄劝彝族苗族自治县"},{"code":"530129","name":"寻甸回族彝族自治县"},{"code":"530181","name":"安宁市"}]},{"code":"5303","name":"曲靖市","children":[{"code":"530302","name":"麒麟区"},{"code":"530303","name":"沾益区"},{"code":"530304","name":"马龙区"},{"code":"530322","name":"陆良县"},{"code":"530323","name":"师宗县"},{"code":"530324","name":"罗平县"},{"code":"530325","name":"富源县"},{"code":"530326","name":"会泽县"},{"code":"530381","name":"宣威市"}]},{"code":"5304","name":"玉溪市","children":[{"code":"530402","name":"红塔区"},{"code":"530403","name":"江川区"},{"code":"530423","name":"通海县"},{"code":"530424","name":"华宁县"},{"code":"530425","name":"易门县"},{"code":"530426","name":"峨山彝族自治县"},{"code":"530427","name":"新平彝族傣族自治县"},{"code":"530428","name":"元江哈尼族彝族傣族自治县"},{"code":"530481","name":"澄江市"}]},{"code":"5305","name":"保山市","children":[{"code":"530502","name":"隆阳区"},{"code":"530521","name":"施甸县"},{"code":"530523","name":"龙陵县"},{"code":"530524","name":"昌宁县"},{"code":"530581","name":"腾冲市"}]},{"code":"5306","name":"昭通市","children":[{"code":"530602","name":"昭阳区"},{"code":"530621","name":"鲁甸县"},{"code":"530622","name":"巧家县"},{"code":"530623","name":"盐津县"},{"code":"530624","name":"大关县"},{"code":"530625","name":"永善县"},{"code":"530626","name":"绥江县"},{"code":"530627","name":"镇雄县"},{"code":"530628","name":"彝良县"},{"code":"530629","name":"威信县"},{"code":"530681","name":"水富市"}]},{"code":"5307","name":"丽江市","children":[{"code":"530702","name":"古城区"},{"code":"530721","name":"玉龙纳西族自治县"},{"code":"530722","name":"永胜县"},{"code":"530723","name":"华坪县"},{"code":"530724","name":"宁蒗彝族自治县"}]},{"code":"5308","name":"普洱市","children":[{"code":"530802","name":"思茅区"},{"code":"530821","name":"宁洱哈尼族彝族自治县"},{"code":"530822","name":"墨江哈尼族自治县"},{"code":"530823","name":"景东彝族自治县"},{"code":"530824","name":"景谷傣族彝族自治县"},{"code":"530825","name":"镇沅彝族哈尼族拉祜族自治县"},{"code":"530826","name":"江城哈尼族彝族自治县"},{"code":"530827","name":"孟连傣族拉祜族佤族自治县"},{"code":"530828","name":"澜沧拉祜族自治县"},{"code":"530829","name":"西盟佤族自治县"}]},{"code":"5309","name":"临沧市","children":[{"code":"530902","name":"临翔区"},{"code":"530921","name":"凤庆县"},{"code":"530922","name":"云县"},{"code":"530923","name":"永德县"},{"code":"530924","name":"镇康县"},{"code":"530925","name":"双江拉祜族佤族布朗族傣族自治县"},{"code":"530926","name":"耿马傣族佤族自治县"},{"code":"530927","name":"沧源佤族自治县"}]},{"code":"5323","name":"楚雄彝族自治州","children":[{"code":"532301","name":"楚雄市"},{"code":"532302","name":"禄丰市"},{"code":"532322","name":"双柏县"},{"code":"532323","name":"牟定县"},{"code":"532324","name":"南华县"},{"code":"532325","name":"姚安县"},{"code":"532326","name":"大姚县"},{"code":"532327","name":"永仁县"},{"code":"532328","name":"元谋县"},{"code":"532329","name":"武定县"}]},{"code":"5325","name":"红河哈尼族彝族自治州","children":[{"code":"532501","name":"个旧市"},{"code":"532502","name":"开远市"},{"code":"532503","name":"蒙自市"},{"code":"532504","name":"弥勒市"},{"code":"532523","name":"屏边苗族自治县"},{"code":"532524","name":"建水县"},{"code":"532525","name":"石屏县"},{"code":"532527","name":"泸西县"},{"code":"532528","name":"元阳县"},{"code":"532529","name":"红河县"},{"code":"532530","name":"金平苗族瑶族傣族自治县"},{"code":"532531","name":"绿春县"},{"code":"532532","name":"河口瑶族自治县"}]},{"code":"5326","name":"文山壮族苗族自治州","children":[{"code":"532601","name":"文山市"},{"code":"532622","name":"砚山县"},{"code":"532623","name":"西畴县"},{"code":"532624","name":"麻栗坡县"},{"code":"532625","name":"马关县"},{"code":"532626","name":"丘北县"},{"code":"532627","name":"广南县"},{"code":"532628","name":"富宁县"}]},{"code":"5328","name":"西双版纳傣族自治州","children":[{"code":"532801","name":"景洪市"},{"code":"532822","name":"勐海县"},{"code":"532823","name":"勐腊县"}]},{"code":"5329","name":"大理白族自治州","children":[{"code":"532901","name":"大理市"},{"code":"532922","name":"漾濞彝族自治县"},{"code":"532923","name":"祥云县"},{"code":"532924","name":"宾川县"},{"code":"532925","name":"弥渡县"},{"code":"532926","name":"南涧彝族自治县"},{"code":"532927","name":"巍山彝族回族自治县"},{"code":"532928","name":"永平县"},{"code":"532929","name":"云龙县"},{"code":"532930","name":"洱源县"},{"code":"532931","name":"剑川县"},{"code":"532932","name":"鹤庆县"}]},{"code":"5331","name":"德宏傣族景颇族自治州","children":[{"code":"533102","name":"瑞丽市"},{"code":"533103","name":"芒市"},{"code":"533122","name":"梁河县"},{"code":"533123","name":"盈江县"},{"code":"533124","name":"陇川县"}]},{"code":"5333","name":"怒江傈僳族自治州","children":[{"code":"533301","name":"泸水市"},{"code":"533323","name":"福贡县"},{"code":"533324","name":"贡山独龙族怒族自治县"},{"code":"533325","name":"兰坪白族普米族自治县"}]},{"code":"5334","name":"迪庆藏族自治州","children":[{"code":"533401","name":"香格里拉市"},{"code":"533422","name":"德钦县"},{"code":"533423","name":"维西傈僳族自治县"}]}]},{"code":"54","name":"西藏自治区","children":[{"code":"5401","name":"拉萨市","children":[{"code":"540102","name":"城关区"},{"code":"540103","name":"堆龙德庆区"},{"code":"540104","name":"达孜区"},{"code":"540121","name":"林周县"},{"code":"540122","name":"当雄县"},{"code":"540123","name":"尼木县"},{"code":"540124","name":"曲水县"},{"code":"540127","name":"墨竹工卡县"},{"code":"540171","name":"格尔木藏青工业园区"},{"code":"540172","name":"拉萨经济技术开发区"},{"code":"540173","name":"西藏文化旅游创意园区"},{"code":"540174","name":"达孜工业园区"}]},{"code":"5402","name":"日喀则市","children":[{"code":"540202","name":"桑珠孜区"},{"code":"540221","name":"南木林县"},{"code":"540222","name":"江孜县"},{"code":"540223","name":"定日县"},{"code":"540224","name":"萨迦县"},{"code":"540225","name":"拉孜县"},{"code":"540226","name":"昂仁县"},{"code":"540227","name":"谢通门县"},{"code":"540228","name":"白朗县"},{"code":"540229","name":"仁布县"},{"code":"540230","name":"康马县"},{"code":"540231","name":"定结县"},{"code":"540232","name":"仲巴县"},{"code":"540233","name":"亚东县"},{"code":"540234","name":"吉隆县"},{"code":"540235","name":"聂拉木县"},{"code":"540236","name":"萨嘎县"},{"code":"540237","name":"岗巴县"}]},{"code":"5403","name":"昌都市","children":[{"code":"540302","name":"卡若区"},{"code":"540321","name":"江达县"},{"code":"540322","name":"贡觉县"},{"code":"540323","name":"类乌齐县"},{"code":"540324","name":"丁青县"},{"code":"540325","name":"察雅县"},{"code":"540326","name":"八宿县"},{"code":"540327","name":"左贡县"},{"code":"540328","name":"芒康县"},{"code":"540329","name":"洛隆县"},{"code":"540330","name":"边坝县"}]},{"code":"5404","name":"林芝市","children":[{"code":"540402","name":"巴宜区"},{"code":"540421","name":"工布江达县"},{"code":"540423","name":"墨脱县"},{"code":"540424","name":"波密县"},{"code":"540425","name":"察隅县"},{"code":"540426","name":"朗县"},{"code":"540481","name":"米林市"}]},{"code":"5405","name":"山南市","children":[{"code":"540502","name":"乃东区"},{"code":"540521","name":"扎囊县"},{"code":"540522","name":"贡嘎县"},{"code":"540523","name":"桑日县"},{"code":"540524","name":"琼结县"},{"code":"540525","name":"曲松县"},{"code":"540526","name":"措美县"},{"code":"540527","name":"洛扎县"},{"code":"540528","name":"加查县"},{"code":"540529","name":"隆子县"},{"code":"540531","name":"浪卡子县"},{"code":"540581","name":"错那市"}]},{"code":"5406","name":"那曲市","children":[{"code":"540602","name":"色尼区"},{"code":"540621","name":"嘉黎县"},{"code":"540622","name":"比如县"},{"code":"540623","name":"聂荣县"},{"code":"540624","name":"安多县"},{"code":"540625","name":"申扎县"},{"code":"540626","name":"索县"},{"code":"540627","name":"班戈县"},{"code":"540628","name":"巴青县"},{"code":"540629","name":"尼玛县"},{"code":"540630","name":"双湖县"}]},{"code":"5425","name":"阿里地区","children":[{"code":"542521","name":"普兰县"},{"code":"542522","name":"札达县"},{"code":"542523","name":"噶尔县"},{"code":"542524","name":"日土县"},{"code":"542525","name":"革吉县"},{"code":"542526","name":"改则县"},{"code":"542527","name":"措勤县"}]}]},{"code":"61","name":"陕西省","children":[{"code":"6101","name":"西安市","children":[{"code":"610102","name":"新城区"},{"code":"610103","name":"碑林区"},{"code":"610104","name":"莲湖区"},{"code":"610111","name":"灞桥区"},{"code":"610112","name":"未央区"},{"code":"610113","name":"雁塔区"},{"code":"610114","name":"阎良区"},{"code":"610115","name":"临潼区"},{"code":"610116","name":"长安区"},{"code":"610117","name":"高陵区"},{"code":"610118","name":"鄠邑区"},{"code":"610122","name":"蓝田县"},{"code":"610124","name":"周至县"}]},{"code":"6102","name":"铜川市","children":[{"code":"610202","name":"王益区"},{"code":"610203","name":"印台区"},{"code":"610204","name":"耀州区"},{"code":"610222","name":"宜君县"}]},{"code":"6103","name":"宝鸡市","children":[{"code":"610302","name":"渭滨区"},{"code":"610303","name":"金台区"},{"code":"610304","name":"陈仓区"},{"code":"610305","name":"凤翔区"},{"code":"610323","name":"岐山县"},{"code":"610324","name":"扶风县"},{"code":"610326","name":"眉县"},{"code":"610327","name":"陇县"},{"code":"610328","name":"千阳县"},{"code":"610329","name":"麟游县"},{"code":"610330","name":"凤县"},{"code":"610331","name":"太白县"}]},{"code":"6104","name":"咸阳市","children":[{"code":"610402","name":"秦都区"},{"code":"610403","name":"杨陵区"},{"code":"610404","name":"渭城区"},{"code":"610422","name":"三原县"},{"code":"610423","name":"泾阳县"},{"code":"610424","name":"乾县"},{"code":"610425","name":"礼泉县"},{"code":"610426","name":"永寿县"},{"code":"610428","name":"长武县"},{"code":"610429","name":"旬邑县"},{"code":"610430","name":"淳化县"},{"code":"610431","name":"武功县"},{"code":"610481","name":"兴平市"},{"code":"610482","name":"彬州市"}]},{"code":"6105","name":"渭南市","children":[{"code":"610502","name":"临渭区"},{"code":"610503","name":"华州区"},{"code":"610522","name":"潼关县"},{"code":"610523","name":"大荔县"},{"code":"610524","name":"合阳县"},{"code":"610525","name":"澄城县"},{"code":"610526","name":"蒲城县"},{"code":"610527","name":"白水县"},{"code":"610528","name":"富平县"},{"code":"610581","name":"韩城市"},{"code":"610582","name":"华阴市"}]},{"code":"6106","name":"延安市","children":[{"code":"610602","name":"宝塔区"},{"code":"610603","name":"安塞区"},{"code":"610621","name":"延长县"},{"code":"610622","name":"延川县"},{"code":"610625","name":"志丹县"},{"code":"610626","name":"吴起县"},{"code":"610627","name":"甘泉县"},{"code":"610628","name":"富县"},{"code":"610629","name":"洛川县"},{"code":"610630","name":"宜川县"},{"code":"610631","name":"黄龙县"},{"code":"610632","name":"黄陵县"},{"code":"610681","name":"子长市"}]},{"code":"6107","name":"汉中市","children":[{"code":"610702","name":"汉台区"},{"code":"610703","name":"南郑区"},{"code":"610722","name":"城固县"},{"code":"610723","name":"洋县"},{"code":"610724","name":"西乡县"},{"code":"610725","name":"勉县"},{"code":"610726","name":"宁强县"},{"code":"610727","name":"略阳县"},{"code":"610728","name":"镇巴县"},{"code":"610729","name":"留坝县"},{"code":"610730","name":"佛坪县"}]},{"code":"6108","name":"榆林市","children":[{"code":"610802","name":"榆阳区"},{"code":"610803","name":"横山区"},{"code":"610822","name":"府谷县"},{"code":"610824","name":"靖边县"},{"code":"610825","name":"定边县"},{"code":"610826","name":"绥德县"},{"code":"610827","name":"米脂县"},{"code":"610828","name":"佳县"},{"code":"610829","name":"吴堡县"},{"code":"610830","name":"清涧县"},{"code":"610831","name":"子洲县"},{"code":"610881","name":"神木市"}]},{"code":"6109","name":"安康市","children":[{"code":"610902","name":"汉滨区"},{"code":"610921","name":"汉阴县"},{"code":"610922","name":"石泉县"},{"code":"610923","name":"宁陕县"},{"code":"610924","name":"紫阳县"},{"code":"610925","name":"岚皋县"},{"code":"610926","name":"平利县"},{"code":"610927","name":"镇坪县"},{"code":"610929","name":"白河县"},{"code":"610981","name":"旬阳市"}]},{"code":"6110","name":"商洛市","children":[{"code":"611002","name":"商州区"},{"code":"611021","name":"洛南县"},{"code":"611022","name":"丹凤县"},{"code":"611023","name":"商南县"},{"code":"611024","name":"山阳县"},{"code":"611025","name":"镇安县"},{"code":"611026","name":"柞水县"}]}]},{"code":"62","name":"甘肃省","children":[{"code":"6201","name":"兰州市","children":[{"code":"620102","name":"城关区"},{"code":"620103","name":"七里河区"},{"code":"620104","name":"西固区"},{"code":"620105","name":"安宁区"},{"code":"620111","name":"红古区"},{"code":"620121","name":"永登县"},{"code":"620122","name":"皋兰县"},{"code":"620123","name":"榆中县"},{"code":"620171","name":"兰州新区"}]},{"code":"6202","name":"嘉峪关市","children":[{"code":"620201001","name":"雄关街道"},{"code":"620201002","name":"钢城街道"},{"code":"620201100","name":"新城镇"},{"code":"620201101","name":"峪泉镇"},{"code":"620201102","name":"文殊镇"}]},{"code":"6203","name":"金昌市","children":[{"code":"620302","name":"金川区"},{"code":"620321","name":"永昌县"}]},{"code":"6204","name":"白银市","children":[{"code":"620402","name":"白银区"},{"code":"620403","name":"平川区"},{"code":"620421","name":"靖远县"},{"code":"620422","name":"会宁县"},{"code":"620423","name":"景泰县"}]},{"code":"6205","name":"天水市","children":[{"code":"620502","name":"秦州区"},{"code":"620503","name":"麦积区"},{"code":"620521","name":"清水县"},{"code":"620522","name":"秦安县"},{"code":"620523","name":"甘谷县"},{"code":"620524","name":"武山县"},{"code":"620525","name":"张家川回族自治县"}]},{"code":"6206","name":"武威市","children":[{"code":"620602","name":"凉州区"},{"code":"620621","name":"民勤县"},{"code":"620622","name":"古浪县"},{"code":"620623","name":"天祝藏族自治县"}]},{"code":"6207","name":"张掖市","children":[{"code":"620702","name":"甘州区"},{"code":"620721","name":"肃南裕固族自治县"},{"code":"620722","name":"民乐县"},{"code":"620723","name":"临泽县"},{"code":"620724","name":"高台县"},{"code":"620725","name":"山丹县"}]},{"code":"6208","name":"平凉市","children":[{"code":"620802","name":"崆峒区"},{"code":"620821","name":"泾川县"},{"code":"620822","name":"灵台县"},{"code":"620823","name":"崇信县"},{"code":"620825","name":"庄浪县"},{"code":"620826","name":"静宁县"},{"code":"620881","name":"华亭市"}]},{"code":"6209","name":"酒泉市","children":[{"code":"620902","name":"肃州区"},{"code":"620921","name":"金塔县"},{"code":"620922","name":"瓜州县"},{"code":"620923","name":"肃北蒙古族自治县"},{"code":"620924","name":"阿克塞哈萨克族自治县"},{"code":"620981","name":"玉门市"},{"code":"620982","name":"敦煌市"}]},{"code":"6210","name":"庆阳市","children":[{"code":"621002","name":"西峰区"},{"code":"621021","name":"庆城县"},{"code":"621022","name":"环县"},{"code":"621023","name":"华池县"},{"code":"621024","name":"合水县"},{"code":"621025","name":"正宁县"},{"code":"621026","name":"宁县"},{"code":"621027","name":"镇原县"}]},{"code":"6211","name":"定西市","children":[{"code":"621102","name":"安定区"},{"code":"621121","name":"通渭县"},{"code":"621122","name":"陇西县"},{"code":"621123","name":"渭源县"},{"code":"621124","name":"临洮县"},{"code":"621125","name":"漳县"},{"code":"621126","name":"岷县"}]},{"code":"6212","name":"陇南市","children":[{"code":"621202","name":"武都区"},{"code":"621221","name":"成县"},{"code":"621222","name":"文县"},{"code":"621223","name":"宕昌县"},{"code":"621224","name":"康县"},{"code":"621225","name":"西和县"},{"code":"621226","name":"礼县"},{"code":"621227","name":"徽县"},{"code":"621228","name":"两当县"}]},{"code":"6229","name":"临夏回族自治州","children":[{"code":"622901","name":"临夏市"},{"code":"622921","name":"临夏县"},{"code":"622922","name":"康乐县"},{"code":"622923","name":"永靖县"},{"code":"622924","name":"广河县"},{"code":"622925","name":"和政县"},{"code":"622926","name":"东乡族自治县"},{"code":"622927","name":"积石山保安族东乡族撒拉族自治县"}]},{"code":"6230","name":"甘南藏族自治州","children":[{"code":"623001","name":"合作市"},{"code":"623021","name":"临潭县"},{"code":"623022","name":"卓尼县"},{"code":"623023","name":"舟曲县"},{"code":"623024","name":"迭部县"},{"code":"623025","name":"玛曲县"},{"code":"623026","name":"碌曲县"},{"code":"623027","name":"夏河县"}]}]},{"code":"63","name":"青海省","children":[{"code":"6301","name":"西宁市","children":[{"code":"630102","name":"城东区"},{"code":"630103","name":"城中区"},{"code":"630104","name":"城西区"},{"code":"630105","name":"城北区"},{"code":"630106","name":"湟中区"},{"code":"630121","name":"大通回族土族自治县"},{"code":"630123","name":"湟源县"}]},{"code":"6302","name":"海东市","children":[{"code":"630202","name":"乐都区"},{"code":"630203","name":"平安区"},{"code":"630222","name":"民和回族土族自治县"},{"code":"630223","name":"互助土族自治县"},{"code":"630224","name":"化隆回族自治县"},{"code":"630225","name":"循化撒拉族自治县"}]},{"code":"6322","name":"海北藏族自治州","children":[{"code":"632221","name":"门源回族自治县"},{"code":"632222","name":"祁连县"},{"code":"632223","name":"海晏县"},{"code":"632224","name":"刚察县"}]},{"code":"6323","name":"黄南藏族自治州","children":[{"code":"632301","name":"同仁市"},{"code":"632322","name":"尖扎县"},{"code":"632323","name":"泽库县"},{"code":"632324","name":"河南蒙古族自治县"}]},{"code":"6325","name":"海南藏族自治州","children":[{"code":"632521","name":"共和县"},{"code":"632522","name":"同德县"},{"code":"632523","name":"贵德县"},{"code":"632524","name":"兴海县"},{"code":"632525","name":"贵南县"}]},{"code":"6326","name":"果洛藏族自治州","children":[{"code":"632621","name":"玛沁县"},{"code":"632622","name":"班玛县"},{"code":"632623","name":"甘德县"},{"code":"632624","name":"达日县"},{"code":"632625","name":"久治县"},{"code":"632626","name":"玛多县"}]},{"code":"6327","name":"玉树藏族自治州","children":[{"code":"632701","name":"玉树市"},{"code":"632722","name":"杂多县"},{"code":"632723","name":"称多县"},{"code":"632724","name":"治多县"},{"code":"632725","name":"囊谦县"},{"code":"632726","name":"曲麻莱县"}]},{"code":"6328","name":"海西蒙古族藏族自治州","children":[{"code":"632801","name":"格尔木市"},{"code":"632802","name":"德令哈市"},{"code":"632803","name":"茫崖市"},{"code":"632821","name":"乌兰县"},{"code":"632822","name":"都兰县"},{"code":"632823","name":"天峻县"},{"code":"632857","name":"大柴旦行政委员会"}]}]},{"code":"64","name":"宁夏回族自治区","children":[{"code":"6401","name":"银川市","children":[{"code":"640104","name":"兴庆区"},{"code":"640105","name":"西夏区"},{"code":"640106","name":"金凤区"},{"code":"640121","name":"永宁县"},{"code":"640122","name":"贺兰县"},{"code":"640181","name":"灵武市"}]},{"code":"6402","name":"石嘴山市","children":[{"code":"640202","name":"大武口区"},{"code":"640205","name":"惠农区"},{"code":"640221","name":"平罗县"}]},{"code":"6403","name":"吴忠市","children":[{"code":"640302","name":"利通区"},{"code":"640303","name":"红寺堡区"},{"code":"640323","name":"盐池县"},{"code":"640324","name":"同心县"},{"code":"640381","name":"青铜峡市"}]},{"code":"6404","name":"固原市","children":[{"code":"640402","name":"原州区"},{"code":"640422","name":"西吉县"},{"code":"640423","name":"隆德县"},{"code":"640424","name":"泾源县"},{"code":"640425","name":"彭阳县"}]},{"code":"6405","name":"中卫市","children":[{"code":"640502","name":"沙坡头区"},{"code":"640521","name":"中宁县"},{"code":"640522","name":"海原县"}]}]},{"code":"65","name":"新疆维吾尔自治区","children":[{"code":"6501","name":"乌鲁木齐市","children":[{"code":"650102","name":"天山区"},{"code":"650103","name":"沙依巴克区"},{"code":"650104","name":"新市区"},{"code":"650105","name":"水磨沟区"},{"code":"650106","name":"头屯河区"},{"code":"650107","name":"达坂城区"},{"code":"650109","name":"米东区"},{"code":"650121","name":"乌鲁木齐县"}]},{"code":"6502","name":"克拉玛依市","children":[{"code":"650202","name":"独山子区"},{"code":"650203","name":"克拉玛依区"},{"code":"650204","name":"白碱滩区"},{"code":"650205","name":"乌尔禾区"}]},{"code":"6504","name":"吐鲁番市","children":[{"code":"650402","name":"高昌区"},{"code":"650421","name":"鄯善县"},{"code":"650422","name":"托克逊县"}]},{"code":"6505","name":"哈密市","children":[{"code":"650502","name":"伊州区"},{"code":"650521","name":"巴里坤哈萨克自治县"},{"code":"650522","name":"伊吾县"}]},{"code":"6523","name":"昌吉回族自治州","children":[{"code":"652301","name":"昌吉市"},{"code":"652302","name":"阜康市"},{"code":"652323","name":"呼图壁县"},{"code":"652324","name":"玛纳斯县"},{"code":"652325","name":"奇台县"},{"code":"652327","name":"吉木萨尔县"},{"code":"652328","name":"木垒哈萨克自治县"}]},{"code":"6527","name":"博尔塔拉蒙古自治州","children":[{"code":"652701","name":"博乐市"},{"code":"652702","name":"阿拉山口市"},{"code":"652722","name":"精河县"},{"code":"652723","name":"温泉县"}]},{"code":"6528","name":"巴音郭楞蒙古自治州","children":[{"code":"652801","name":"库尔勒市"},{"code":"652822","name":"轮台县"},{"code":"652823","name":"尉犁县"},{"code":"652824","name":"若羌县"},{"code":"652825","name":"且末县"},{"code":"652826","name":"焉耆回族自治县"},{"code":"652827","name":"和静县"},{"code":"652828","name":"和硕县"},{"code":"652829","name":"博湖县"}]},{"code":"6529","name":"阿克苏地区","children":[{"code":"652901","name":"阿克苏市"},{"code":"652902","name":"库车市"},{"code":"652922","name":"温宿县"},{"code":"652924","name":"沙雅县"},{"code":"652925","name":"新和县"},{"code":"652926","name":"拜城县"},{"code":"652927","name":"乌什县"},{"code":"652928","name":"阿瓦提县"},{"code":"652929","name":"柯坪县"}]},{"code":"6530","name":"克孜勒苏柯尔克孜自治州","children":[{"code":"653001","name":"阿图什市"},{"code":"653022","name":"阿克陶县"},{"code":"653023","name":"阿合奇县"},{"code":"653024","name":"乌恰县"}]},{"code":"6531","name":"喀什地区","children":[{"code":"653101","name":"喀什市"},{"code":"653121","name":"疏附县"},{"code":"653122","name":"疏勒县"},{"code":"653123","name":"英吉沙县"},{"code":"653124","name":"泽普县"},{"code":"653125","name":"莎车县"},{"code":"653126","name":"叶城县"},{"code":"653127","name":"麦盖提县"},{"code":"653128","name":"岳普湖县"},{"code":"653129","name":"伽师县"},{"code":"653130","name":"巴楚县"},{"code":"653131","name":"塔什库尔干塔吉克自治县"}]},{"code":"6532","name":"和田地区","children":[{"code":"653201","name":"和田市"},{"code":"653221","name":"和田县"},{"code":"653222","name":"墨玉县"},{"code":"653223","name":"皮山县"},{"code":"653224","name":"洛浦县"},{"code":"653225","name":"策勒县"},{"code":"653226","name":"于田县"},{"code":"653227","name":"民丰县"}]},{"code":"6540","name":"伊犁哈萨克自治州","children":[{"code":"654002","name":"伊宁市"},{"code":"654003","name":"奎屯市"},{"code":"654004","name":"霍尔果斯市"},{"code":"654021","name":"伊宁县"},{"code":"654022","name":"察布查尔锡伯自治县"},{"code":"654023","name":"霍城县"},{"code":"654024","name":"巩留县"},{"code":"654025","name":"新源县"},{"code":"654026","name":"昭苏县"},{"code":"654027","name":"特克斯县"},{"code":"654028","name":"尼勒克县"}]},{"code":"6542","name":"塔城地区","children":[{"code":"654201","name":"塔城市"},{"code":"654202","name":"乌苏市"},{"code":"654203","name":"沙湾市"},{"code":"654221","name":"额敏县"},{"code":"654224","name":"托里县"},{"code":"654225","name":"裕民县"},{"code":"654226","name":"和布克赛尔蒙古自治县"}]},{"code":"6543","name":"阿勒泰地区","children":[{"code":"654301","name":"阿勒泰市"},{"code":"654321","name":"布尔津县"},{"code":"654322","name":"富蕴县"},{"code":"654323","name":"福海县"},{"code":"654324","name":"哈巴河县"},{"code":"654325","name":"青河县"},{"code":"654326","name":"吉木乃县"}]},{"code":"6590","name":"自治区直辖县级行政区划","children":[{"code":"659001","name":"石河子市"},{"code":"659002","name":"阿拉尔市"},{"code":"659003","name":"图木舒克市"},{"code":"659004","name":"五家渠市"},{"code":"659005","name":"北屯市"},{"code":"659006","name":"铁门关市"},{"code":"659007","name":"双河市"},{"code":"659008","name":"可克达拉市"},{"code":"659009","name":"昆玉市"},{"code":"659010","name":"胡杨河市"},{"code":"659011","name":"新星市"},{"code":"659012","name":"白杨市"}]}]}];
;


;/* public/leaip0/assets/frontend/js/core/address-dialog-v142.js */
(()=>{
 if(window.__lxAddressDialogV142)return;window.__lxAddressDialogV142=true;
 const data=window.__lxAddressRegionsV142||[];
 function init(){document.querySelectorAll('#lxAddrRegion').forEach(input=>{
  if(input.dataset.cascadeReady)return;input.dataset.cascadeReady='true';
  const modal=input.closest('.lx-p0-modal');if(!modal)return;modal.classList.add('lx-address-standard');
  const field=input.closest('label');input.type='hidden';field.querySelectorAll('svg').forEach(n=>n.remove());field.classList.add('lx-address-regions');
  const selects=['省 / 直辖市','市','区 / 县'].map(label=>{const s=document.createElement('select');s.setAttribute('aria-label',label);s.required=true;field.appendChild(s);return s});
  function fill(select,items,label){select.replaceChildren(new Option('请选择'+label,''));items.forEach(item=>select.add(new Option(item.name,item.code)));select.disabled=!items.length;}
  fill(selects[0],data,'省');fill(selects[1],[],'市');fill(selects[2],[],'区');
  function cities(){return data.find(p=>p.code===selects[0].value)?.children||[]}
  function districts(){return cities().find(c=>c.code===selects[1].value)?.children||[]}
  function sync(){input.value=selects.every(s=>s.value)?selects.map(s=>s.selectedOptions[0].text).join(' / '):'';input.dispatchEvent(new Event('input',{bubbles:true}));}
  selects[0].addEventListener('change',()=>{fill(selects[1],cities(),'市');fill(selects[2],[],'区');sync()});
  selects[1].addEventListener('change',()=>{fill(selects[2],districts(),'区');sync()});selects[2].addEventListener('change',sync);
  [['lxAddrName','收货人姓名'],['lxAddrPhone','手机号'],['lxAddrRegion','所在地区'],['lxAddrDetail','详细地址']].forEach(([id,label])=>{
   const el=modal.querySelector('#'+id),box=el.closest('label'),wrapper=document.createElement('div');wrapper.className='lx-address-control';box.before(wrapper);const title=document.createElement('span');title.className='lx-address-label';title.textContent='* '+label;wrapper.append(title,box);
   el.setAttribute('aria-label',label);if(id!=='lxAddrRegion')el.required=true;
   box.querySelectorAll('svg').forEach(n=>n.remove());
   if(id==='lxAddrPhone'){el.type='tel';el.inputMode='tel';el.pattern='1[3-9][0-9]{9}';el.maxLength=11;}
  });
  const save=modal.querySelector('[data-addr-save]');if(save){const footer=document.createElement('div');footer.className='lx-address-footer';save.before(footer);const cancel=document.createElement('button');cancel.type='button';cancel.textContent='取消';cancel.className='lx-address-cancel';cancel.onclick=()=>modal.querySelector('.x.lx-p0-close')?.click();footer.append(cancel,save);}
 });}
 document.addEventListener('click',event=>{const save=event.target.closest('[data-addr-save]');if(!save)return;const modal=save.closest('.lx-address-standard');if(!modal)return;
  for(const el of modal.querySelectorAll('#lxAddrName,#lxAddrPhone,.lx-address-regions select,#lxAddrDetail')){
   if(!el.value.trim()||!el.checkValidity()){event.preventDefault();event.stopImmediatePropagation();el.disabled=false;el.reportValidity();el.focus();return;}
  }
 },true);
 new MutationObserver(init).observe(document.body,{childList:true,subtree:true});init();
})();

;


;/* public/leaip0/assets/frontend/js/core/buy-modal-direct-v1.js */
/* p0-purchase-context:start */
/* Product-to-order boundary. No title scraping, demo fallback, or payment writes. */
(() => {
  'use strict';
  const clean = value => String(value ?? '').trim();
  const esc = value => clean(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalize(product) {
    if (!product || typeof product !== 'object') throw new Error('请选择具体商品后再下单');
    const sku=clean(product.sku), name=clean(product.name), price=Number(product.price);
    if (!sku || !name || !Number.isFinite(price) || price <= 0) throw new Error('商品数据不完整，请重新打开商品详情');
    let specs=product.specs || {};
    if(typeof specs==='string'){try{specs=JSON.parse(specs);}catch{specs={};}}
    if(!specs || typeof specs!=='object' || Array.isArray(specs))specs={};
    const description=clean(specs.configuration_name || product.description);
    const image=clean(product.image_url || product.image || specs.white_image_url);
    const parts=description.split(/\s*\/\s*/);
    const memory=parts.find(p=>/\d+\s*G(?:B)?\s*(?:LP|DDR|内存)/i.test(p))?.match(/\d+\s*G(?:B)?/i)?.[0];
    const storage=parts.find(p=>/固态|硬盘|SSD|PCIe/i.test(p))?.match(/^\s*\d+(?:\.\d+)?\s*(?:TB|GB)?/i)?.[0]?.trim();
    const configurationLabel=[memory,storage].filter(Boolean).join('+') || description;
    if(image && !/^(?:https?:\/\/|\/|\.\.?\/)/i.test(image)) throw new Error('商品图片地址无效');
    return Object.freeze({
      sku,name,price,originalPrice:price,discount:0,image_url:image,configurationLabel,
      category:clean(product.category),series:clean(specs.spu_name || product.category || '联想'),
      configuration:description || '以所选商品详情为准',
      size:clean(specs.screen_size || specs.display_size || description.match(/\d+(?:\.\d+)?\s*英寸/)?.[0] || '以商品详情为准'),
      color:clean(specs.color || product.color),specs:Object.freeze({...specs})
    });
  }
  function targetSku(button, state) {
    const card=button?.closest?.('[data-buy-sku],[data-open-product],[data-product-id],[data-sku]');
    const explicit=clean(card?.dataset.buySku || card?.dataset.openProduct || card?.dataset.productId || card?.dataset.sku);
    if(explicit)return explicit;
    if(button?.closest?.('.product-detail,.detail-main,.detail-page,.lx-product-detail,.lx-buybar')) {
      const active=state?.tabs?.find(t=>t.id===state.activeTabId && t.kind==='detail');
      return clean(active?.sku || state?.currentProduct?.sku);
    }
    return '';
  }
  async function read(sku) {
    if(!sku)throw new Error('未能确定所选商品，请从商品详情重新下单');
    if(!window.__lxProductData?.product)throw new Error('商品数据服务未准备好，请稍后重试');
    const product=normalize(await window.__lxProductData.product(sku));
    if(product.sku!==String(sku))throw new Error('商品配置已变化，请重新选择');
    return product;
  }
  function fromButton(button){return read(targetSku(button,window.__lxState));}
  async function options(sku){
    if(!window.__lxProductData?.variants)throw new Error('配置数据服务未准备好');
    const result=await window.__lxProductData.variants(sku);
    if(!Array.isArray(result?.variants)||!result.variants.length)throw new Error('暂时无法读取商品配置，请重试');
    return result.variants;
  }
  function renderConfig({dialog,product,quantity,onSelect,onError}) {
    dialog.className='lx-buy-direct-dialog lx-order-edit-dialog lx-config-dialog';
    dialog.innerHTML='<header class="lx-order-edit-head"><button class="lx-order-edit-back" type="button" data-config-back aria-label="返回"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>修改商品</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-order-edit-body"><div data-purchase-options role="status">正在读取本系列配置…</div><div class="lx-config-quantity"><div class="lx-config-quantity-copy"><h3>商品数量</h3><small>最多购买5件</small></div><div class="lx-config-stepper"><button type="button" data-config-minus aria-label="减少数量" '+(quantity<=1?'disabled':'')+'>−</button><output data-config-count>'+quantity+'</output><button type="button" data-config-plus aria-label="增加数量" '+(quantity>=5?'disabled':'')+'>＋</button></div></div></div><footer class="lx-order-edit-footer"><button type="button" data-config-save>保存修改</button></footer>';
    const host=dialog.querySelector('[data-purchase-options]');
    const current=()=>host.isConnected && dialog.contains(host);
    function fail(error){if(!current())return;host.textContent=error.message;const retry=document.createElement('button');retry.type='button';retry.textContent='重试';retry.onclick=()=>renderConfig({dialog,product,quantity,onSelect,onError});host.append(' ',retry);onError?.(error);}
    options(product.sku).then(rows=>{
      if(!current())return;
      const variants=rows.map(normalize);
      host.removeAttribute('role');
      host.innerHTML=[['color','颜色'],['size','尺寸'],['configuration','配置']].map(([key,label])=>{
        const values=[...new Set(variants.map(row=>row[key]).filter(Boolean))];
        if(!values.length)values.push(product[key] || '以商品详情为准');
        return '<section class="lx-config-section"><h3>'+label+'</h3><div class="lx-config-options">'+values.map(value=>{
          const selected=(product[key] || '以商品详情为准')===value;
          const matches=variants.filter(row=>row[key]===value);
          const same=matches.find(row=>['color','size','configuration'].every(k=>k===key || row[k]===product[k]));
          const next=same || matches[0];
          return '<button class="lx-config-option'+(selected && next?' is-active':'')+'" type="button" data-purchase-sku="'+esc(next?.sku || product.sku)+'" aria-pressed="'+selected+'" title="'+esc(value)+'"'+(!next?' disabled':'')+'>' + esc(key==='configuration' && next ? next.configurationLabel : value) + '</button>';
        }).join('')+'</div></section>';
      }).join('');
      host.querySelectorAll('[data-purchase-sku]').forEach(button=>button.addEventListener('click',async()=>{
        const sku=button.dataset.purchaseSku;
        host.querySelectorAll('button').forEach(b=>b.disabled=true);host.setAttribute('aria-busy','true');
        try{const selected=await read(sku);if(current())onSelect(selected);}catch(error){fail(error);}
      }));
    }).catch(fail);
  }
  window.__lxPurchaseContext=Object.freeze({normalize,targetSku,read,fromButton,options,renderConfig});
})();

/* p0-purchase-context:end */
/* v59-checkout-payment-standard-answer-card-20260904 */
/* checkout-address-invoice-store-position-v61-20260905 */
/* checkout-layout-v62-20260905 */
/* checkout-flash-card-inner-layout-v63-20260905 */
/* fulfillment-checkout-height-v64-20260905 */
/* checkout-benefit-info-v65-20260905 */
(() => {
  const AIR_13_IMAGE = '/leai%20product%20data/shop-chat%20product%20data/%E7%AC%94%E8%AE%B0%E6%9C%AC/08_SPU_%E8%81%94%E6%83%B3%E5%B0%8F%E6%96%B0_Air_13/%E7%99%BD%E5%BA%95%E5%9B%BE.jpg';
  const FALLBACK_IMAGE = '/assets/product-placeholder.svg';
  const SPARKLE_ICON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23000" d="M12 1l1.8 5.2L19 8l-5.2 1.8L12 15l-1.8-5.2L5 8l5.2-1.8L12 1zm7 12l1 2.9 3 1.1-3 1-1 3-1-3-3-1 3-1.1L19 13zM5 14l1.2 3.5L10 19l-3.8 1.3L5 24l-1.2-3.7L0 19l3.8-1.5L5 14z"/%3E%3C/svg%3E';
  const ADDRESS_ICON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="none" stroke="%23681057" stroke-width="1.8" d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12z"/%3E%3Ccircle cx="12" cy="9" r="2.4" fill="%23681057"/%3E%3C/svg%3E';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const imageForProduct = (name, current) => /小新\s*Air\s*13/i.test(name) ? AIR_13_IMAGE : (current && !/^https?:\/\//i.test(current) ? current : FALLBACK_IMAGE);

  if (!document.querySelector('[data-buy-modal-direct-style]')) {
    const style = document.createElement('style');
    style.dataset.buyModalDirectStyle = 'true';
    style.textContent = '';
    style.textContent += `.lx-buy-direct-detail{margin-top:8px}.lx-buy-direct-detail-button,.lx-buy-direct-detail-button:hover,.lx-buy-direct-detail-button:focus{text-decoration:underline!important;text-underline-offset:3px}.lx-buy-price-line.is-clickable:hover{background:#fcf8fc}.lx-buy-benefit-dialog{height:min(560px,calc(100vh - 32px))}.lx-buy-benefit-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-height:0;overflow:auto}.lx-buy-coupon-card{position:relative;min-height:84px;display:grid;grid-template-columns:88px minmax(0,1fr) 18px;gap:8px;align-items:center;padding:12px;border:1px solid transparent;border-radius:9px;background:linear-gradient(110deg,#fff3f7,#e8edff);color:#332d35;text-align:left;cursor:pointer}.lx-buy-coupon-card.is-selected{border-color:#681057;box-shadow:0 0 0 1px rgba(104,16,87,.08)}.lx-buy-coupon-value{color:#ff3434;font-size:14px;line-height:1}.lx-buy-coupon-value b{font-size:30px}.lx-buy-coupon-value small{display:block;margin-top:5px;font-size:10px}.lx-buy-coupon-copy{min-width:0;font-size:10px;line-height:1.5}.lx-buy-coupon-copy strong,.lx-buy-coupon-copy span{display:block}.lx-buy-coupon-copy span{color:#6f6872}.lx-buy-benefit-radio{width:16px;height:16px;box-sizing:border-box;border:1px solid #c7bdc7;border-radius:50%;background:#fff}.lx-buy-coupon-card.is-selected .lx-buy-benefit-radio{border:5px solid #681057}.lx-buy-wallet-box{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;width:min(350px,100%);height:42px;box-sizing:border-box;border:1px solid #e4dce7;border-radius:4px;background:#fcfaff}.lx-buy-wallet-box input{width:100%;height:40px;padding:0 14px;border:0;background:transparent;outline:0;font:inherit}.lx-buy-wallet-box span{padding:0 14px;color:#ff3434}.lx-buy-wallet-hint{margin:10px 0 0;color:#665f68}.lx-buy-wallet-hint em{color:#ff3434;font-style:normal}.lx-invoice-dialog{height:min(620px,calc(100vh - 32px))}.lx-invoice-type-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.lx-invoice-type-grid .lx-order-channel{display:flex;min-height:42px;align-items:center;justify-content:center;padding:8px;color:#38333a;text-align:center;white-space:nowrap}.lx-invoice-type-grid .lx-order-channel.is-active{padding:8px;color:#4d144a}.lx-invoice-notice{margin:0 0 18px;padding:12px 14px;border-radius:7px;background:#faf8fc;color:#7b747e;font-size:11px;line-height:1.6}.lx-invoice-form{grid-template-columns:112px minmax(0,1fr);gap:12px 14px}.lx-invoice-form input{height:42px}.lx-invoice-form input:disabled{background:#f7f5f8;color:#8e8791}.lx-invoice-consent{display:flex;align-items:center;gap:10px;margin-top:18px;color:#3f3942}.lx-invoice-consent input{accent-color:#681057}.lx-order-edit-footer.has-secondary{gap:12px}.lx-order-edit-footer .secondary{border:1px solid #d3bfd2;background:#fff;color:#4d144a}.lx-order-edit-footer.has-secondary button{width:104px}@media(max-width:620px){.lx-buy-benefit-list{grid-template-columns:1fr}.lx-invoice-type-grid{grid-template-columns:1fr}.lx-invoice-form{grid-template-columns:92px minmax(0,1fr)}}`;
    style.textContent += `.lx-buy-wallet-box{width:100%;border-color:#f0c6cc;background:#fff1f2}.lx-buy-wallet-box input{min-width:0;-webkit-appearance:none;appearance:none}.lx-buy-coupon-field input{width:100%;border-color:#f0c6cc;background:#fff1f2}`;
    style.textContent += `.lx-payment-dialog{display:flex;flex-direction:column;overflow:hidden}.lx-payment-dialog h2{margin-bottom:0}.lx-payment-stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 18px;text-align:center}.lx-payment-state{margin:0 0 18px;color:#4d144a;font-size:17px;font-weight:700}.lx-payment-wait{display:flex;align-items:center;gap:18px;margin:0 0 18px;color:#6c6570;font-size:13px}.lx-payment-wait strong{color:#19171b;font-size:18px}.lx-payment-countdown{color:#b8252e;font-variant-numeric:tabular-nums}.lx-payment-product{max-width:420px;margin:0;color:#4d474f;font-size:13px;line-height:1.8}.lx-payment-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:auto;padding-top:16px}.lx-payment-actions button{height:38px;min-width:108px;padding:0 22px;border:1px solid #d3bfd2;border-radius:100px;background:#fff;color:#4d144a;font-size:13px;font-weight:600;cursor:pointer}.lx-payment-actions .primary{border:0;background:linear-gradient(90deg,#4d144a 12%,#b8252e);color:#fff}.lx-payment-success-icon{width:58px;height:58px;display:grid;place-items:center;margin-bottom:18px;border-radius:50%;background:linear-gradient(135deg,#4d144a,#b8252e);color:#fff;font-size:30px}.lx-payment-success-title{margin:0 0 10px;font-size:20px}.lx-payment-success-meta{margin:0;color:#77717d;line-height:1.8}.lx-payment-success-meta b{color:#19171b}`;
    style.textContent += `[data-buy-modal-direct]{position:fixed;inset:0;z-index:100000;font-family:"Source Han Sans CN","PingFang SC",sans-serif;font-size:12px}.lx-buy-direct-mask{position:absolute;inset:0;background:rgba(31,20,38,.55);backdrop-filter:blur(3px)}.lx-buy-direct-dialog{position:absolute;left:50%;top:50%;width:min(540px,calc(100vw - 32px));max-height:calc(100vh - 32px);transform:translate(-50%,-50%);box-sizing:border-box;padding:20px 22px 18px;border:1px solid #e2ddeb;border-radius:12px;background:#fff;color:#19171b;box-shadow:0 18px 52px rgba(31,20,38,.18);overflow:auto}.lx-buy-direct-dialog h2{width:max-content;display:flex;align-items:center;margin:0 0 14px;background:linear-gradient(90deg,#4d144a 12%,#b8252e);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;font-size:16px;font-weight:600;line-height:22px}.lx-buy-direct-dialog h2:before{content:"";width:16px;height:16px;flex:0 0 16px;margin-right:8px;background:linear-gradient(135deg,#4d144a 12%,#b8252e);-webkit-mask:url('/assets/icons/global-sparkle.svg') center/contain no-repeat;mask:url('/assets/icons/global-sparkle.svg') center/contain no-repeat}.lx-buy-direct-close{position:absolute;right:18px;top:16px;width:24px;height:24px;border:0;background:transparent;color:#77717d;font-size:22px;line-height:1;cursor:pointer}.lx-buy-direct-card{padding:14px 16px 12px;border:1px solid #e2ddeb;border-radius:8px;background:#fcfaff}.lx-buy-direct-product{display:grid;grid-template-columns:60px 1fr auto;gap:12px;align-items:center;padding-bottom:10px;border-bottom:1px solid #e6dfe9}.lx-buy-direct-product img{width:60px;height:60px;object-fit:contain;border-radius:4px;background:#fff}.lx-buy-direct-product-copy{display:grid;gap:4px;min-width:0}.lx-buy-direct-product-copy strong{overflow:hidden;font-size:13px;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.lx-buy-direct-product-copy span{color:#37313b;font-size:11px}.lx-buy-direct-config{border:0;background:transparent;color:#4d144a;font-size:12px;font-weight:600;cursor:pointer}.lx-buy-direct-section{padding:7px 0;border-bottom:1px solid #e6dfe9}.lx-buy-direct-section:last-of-type{border-bottom:0}.lx-buy-direct-row{display:grid;grid-template-columns:70px 1fr;gap:0;padding:2px 0;font-size:12px;line-height:16px}.lx-buy-direct-row strong{font-weight:600}.lx-buy-direct-price{display:flex;align-items:baseline;gap:8px;margin-top:10px;line-height:22px}.lx-buy-direct-price strong{font-size:12px}.lx-buy-direct-price b{color:#ff2f2f;font-size:16px}.lx-buy-direct-price span{color:#19171b;font-size:12px}.lx-buy-direct-price span em{color:#ff2f2f;font-style:normal}.lx-buy-direct-detail{margin-top:0;color:#454545;font-size:12px;line-height:16px}.lx-buy-direct-detail strong{color:#454545;font-weight:500}.lx-buy-direct-detail span{margin-left:8px;color:#ff2f2f}.lx-buy-direct-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:14px}.lx-buy-direct-actions button{width:96px;height:35px;min-width:0;padding:0;border:1px solid #d3bfd2;border-radius:100px;background:#fff;color:#4d144a;font-size:13px;font-weight:500;cursor:pointer}.lx-buy-direct-actions .primary{width:92px;border:0;background:linear-gradient(90deg,#4d144a 12%,#b8252e);color:#fff}.lx-buy-direct-footnote{margin:7px 0 0;text-align:right;color:#c1a9c0;font-size:10px;line-height:12px}@media(max-width:560px){.lx-buy-direct-dialog{padding:18px 14px}.lx-buy-direct-card{padding:12px}.lx-buy-direct-product{grid-template-columns:52px 1fr auto}.lx-buy-direct-product img{width:52px;height:52px}.lx-buy-direct-row{grid-template-columns:66px 1fr}.lx-buy-direct-price{flex-wrap:wrap}.lx-buy-direct-actions{justify-content:stretch}.lx-buy-direct-actions button{flex:1;width:auto}}`;
    style.textContent += `.lx-buy-direct-config,.lx-buy-direct-detail-button{text-decoration:none!important}.lx-buy-direct-detail-button{padding:0;border:0;background:transparent;color:#454545;font:inherit;font-weight:500;cursor:pointer}.lx-buy-direct-detail-button:hover,.lx-buy-direct-detail-button:focus,.lx-buy-direct-config:hover,.lx-buy-direct-config:focus{color:inherit;text-decoration:none!important}.lx-buy-sub-dialog{width:min(620px,calc(100vw - 32px));height:min(560px,calc(100vh - 32px));padding:24px 28px 22px;display:flex;flex-direction:column;overflow:hidden}.lx-buy-sub-dialog h2{margin-bottom:20px;background:none;color:#19171b;-webkit-text-fill-color:initial;font-size:19px;font-weight:700}.lx-buy-sub-dialog h2:before{content:none}.lx-buy-price-list{border-top:0}.lx-buy-price-line{display:grid;grid-template-columns:1fr auto 14px;align-items:center;min-height:48px;border-bottom:1px solid #e5dfe8;font-size:13px}.lx-buy-price-line:last-child{border-bottom:0}.lx-buy-price-line strong{font-weight:500}.lx-buy-price-line .amount{color:#19171b;font-weight:500}.lx-buy-price-line .discount{color:#ff2f2f}.lx-buy-price-line .muted{color:#979797}.lx-buy-price-line .arrow{color:#979797;font-size:18px;text-align:right}.lx-buy-price-line.is-clickable{cursor:pointer}.lx-buy-sub-footer{display:flex;align-items:center;gap:12px;margin:auto 0 0;padding:16px 0 0;border-top:1px solid #e5dfe8}.lx-buy-sub-total{display:flex;align-items:baseline;gap:12px;margin-right:auto}.lx-buy-sub-total b{color:#ff2f2f;font-size:22px}.lx-buy-sub-total span{font-size:12px}.lx-buy-sub-total em{color:#ff2f2f;font-style:normal}.lx-buy-sub-footer button,.lx-buy-coupon-actions button{height:38px;min-width:108px;padding:0 22px;border:1px solid #d3bfd2;border-radius:100px;background:#fff;color:#4d144a;font-size:13px;font-weight:600;cursor:pointer}.lx-buy-sub-footer .primary,.lx-buy-coupon-actions .primary{border:0;background:linear-gradient(90deg,#4d144a 12%,#b8252e);color:#fff}.lx-buy-coupon-field{display:grid;gap:11px}.lx-buy-coupon-field label{font-size:13px;font-weight:600}.lx-buy-coupon-field input{height:46px;box-sizing:border-box;padding:0 14px;border:1px solid #681057;border-radius:6px;outline:none;font:inherit}.lx-buy-coupon-field input:focus{box-shadow:0 0 0 2px rgba(104,16,87,.12)}.lx-buy-coupon-field small{color:#8b838e}.lx-buy-coupon-actions{display:flex;justify-content:flex-end;gap:12px;margin:auto 0 0;padding:16px 0 0;border-top:1px solid #e5dfe8}@media(max-width:620px){.lx-buy-sub-dialog{padding:20px;height:min(520px,calc(100vh - 24px))}}`;
    style.textContent += `.lx-order-edit-dialog{width:min(620px,calc(100vw - 32px));height:min(620px,calc(100vh - 32px));padding:0;display:flex;flex-direction:column;overflow:hidden}.lx-order-edit-head{height:58px;flex:none;display:flex;align-items:center;gap:14px;padding:0 22px;border-bottom:1px solid #e8e2eb}.lx-order-edit-head h2{margin:0;background:none;color:#19171b;-webkit-text-fill-color:initial;font-size:19px;font-weight:700}.lx-order-edit-head h2:before{content:none}.lx-order-edit-back{border:0;background:transparent;color:#5d5661;font-size:24px;cursor:pointer}.lx-order-edit-body{flex:1;min-height:0;padding:20px 26px;overflow:auto}.lx-order-address{display:grid;grid-template-columns:22px 1fr auto;gap:10px;align-items:center;padding:13px 14px;border:1px solid #e8e0eb;border-radius:8px;background:#faf8fc}.lx-order-address b{font-size:13px}.lx-order-address button{border:0;background:transparent;color:#681057;cursor:pointer}.lx-order-edit-section{padding:16px 0;border-bottom:1px solid #ebe5ed}.lx-order-edit-section h3{margin:0 0 10px;font-size:14px}.lx-order-channel-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.lx-order-channel{display:grid;gap:3px;padding:10px 12px;border:1px solid #ddd5e1;border-radius:8px;background:#fff;text-align:left;cursor:pointer}.lx-order-channel.is-active{border:2px solid #681057;padding:9px 11px;background:#fcf8fc}.lx-order-channel small{color:#979197}.lx-order-subtitle{display:flex;justify-content:space-between;margin:14px 0 8px;font-weight:600}.lx-order-subtitle small{color:#9a949d;font-weight:400}.lx-order-quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.lx-order-quick{display:flex;align-items:center;gap:7px;height:40px;padding:0 9px;border:1px solid #ddd5e1;border-radius:7px;background:#fff;cursor:pointer}.lx-order-quick.is-active{border-color:#681057;background:#fcf8fc}.lx-order-logo{width:24px;height:24px;display:grid;place-items:center;border-radius:6px;background:#1677ff;color:#fff;font-weight:700}.lx-order-provider{width:100%;display:grid;grid-template-columns:30px auto 1fr 14px;gap:8px;align-items:center;margin-top:8px;padding:9px 10px;border:1px solid #ddd5e1;border-radius:7px;background:#fff;text-align:left;cursor:pointer}.lx-order-provider .lx-order-logo{background:#8b245d}.lx-order-provider small{color:#99939c}.lx-order-chevron{width:7px;height:7px;border-right:1px solid #8c8790;border-bottom:1px solid #8c8790;transform:rotate(45deg)}.lx-order-provider.is-expanded .lx-order-chevron{transform:rotate(225deg)}.lx-order-plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:7px}.lx-order-plan{display:grid;grid-template-columns:auto 1fr 14px;gap:6px;align-items:center;padding:8px;border:1px solid #ddd5e1;border-radius:7px;background:#fff;text-align:left;cursor:pointer}.lx-order-plan.is-active{border-color:#681057;background:#fcf8fc}.lx-order-plan span,.lx-order-plan small{display:block}.lx-order-plan small{color:#99939c}.lx-order-radio{width:12px;height:12px;border:1px solid #b9b3bc;border-radius:50%}.lx-order-plan.is-active .lx-order-radio{border:4px solid #681057;box-sizing:border-box}.lx-order-form{display:grid;grid-template-columns:82px 1fr;gap:10px 12px;align-items:center}.lx-order-form input{height:38px;box-sizing:border-box;padding:0 11px;border:1px solid #d9cfdd;border-radius:6px;outline:none}.lx-order-form input:focus{border-color:#681057}.lx-order-combobox{position:relative}.lx-order-combobox input{width:100%}.lx-order-code-menu{position:absolute;top:calc(100% + 4px);right:0;left:0;z-index:3;padding:5px;border:1px solid #ddd5e1;border-radius:6px;background:#fff;box-shadow:0 8px 20px rgba(40,22,41,.12)}.lx-order-code-menu button{width:100%;padding:8px;border:0;border-radius:4px;background:#fff;text-align:left;cursor:pointer}.lx-order-code-menu button:hover{background:#f7f2f8}.lx-order-invoice{width:100%;height:48px;display:grid;grid-template-columns:auto 1fr 14px;gap:12px;align-items:center;margin-top:16px;padding:0 14px;border:1px solid #e5dfe8;border-radius:8px;background:#fff;text-align:left;cursor:pointer}.lx-order-invoice span{color:#7f7882;text-align:right}.lx-order-edit-footer{height:62px;flex:none;display:flex;justify-content:flex-end;align-items:center;padding:0 26px;border-top:1px solid #e8e2eb;background:#fff}.lx-order-edit-footer button{width:104px;height:36px;border:0;border-radius:100px;background:linear-gradient(90deg,#4d144a,#b8252e);color:#fff;font-weight:600;cursor:pointer}@media(max-width:620px){.lx-order-quick-grid{grid-template-columns:1fr 1fr}.lx-order-plan-grid{grid-template-columns:1fr}.lx-order-edit-body{padding:16px}.lx-order-form{grid-template-columns:72px 1fr}}`;
    style.textContent += `.lx-buy-direct-dialog{width:min(620px,calc(100vw - 32px));height:min(560px,calc(100vh - 32px))}.lx-order-edit-dialog{height:min(560px,calc(100vh - 32px))}.lx-buy-sub-footer,.lx-buy-coupon-actions{border-top:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){display:flex;flex-direction:column}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{flex:1}`;
    style.textContent += `.lx-order-edit-head{height:64px;padding:0 18px;gap:8px}.lx-order-edit-head h2{font-size:20px;line-height:28px}.lx-order-edit-back{width:40px;height:40px;display:grid;place-items:center;padding:0;border-radius:8px;font-size:28px;line-height:1}.lx-order-edit-back:hover,.lx-order-edit-back:focus{background:#f6f2f7;color:#4d144a}.lx-order-edit-body{padding:18px 26px 24px}.lx-order-address{min-height:54px;box-sizing:border-box;padding:11px 14px;background:#fbf9fc}.lx-order-address>span{color:#681057}.lx-order-address b{font-size:13px;line-height:19px}.lx-order-edit-section{padding:18px 0}.lx-order-edit-section h3{margin-bottom:12px;font-size:14px;line-height:20px}.lx-order-channel{min-height:58px;padding:10px 12px}.lx-order-channel.is-active{padding:9px 11px;border-color:#681057;background:#fbf7fb}.lx-order-channel strong{font-size:13px;line-height:18px}.lx-order-channel small{color:#979197;font-size:11px;line-height:16px}.lx-order-subtitle{margin:16px 0 9px;font-size:13px;line-height:18px}.lx-order-subtitle small{color:#979197;font-size:10px}.lx-order-quick{height:42px;color:#2b272d;font-size:12px}.lx-order-provider{min-height:50px;margin-top:9px}.lx-order-provider b{font-size:13px}.lx-order-provider small{color:#979197;font-size:11px}.lx-order-plan-grid{gap:8px;margin-top:8px}.lx-order-plan{min-height:54px;padding:8px 10px}.lx-order-plan strong{font-size:13px}.lx-order-plan span{font-size:11px;line-height:15px}.lx-order-plan small{color:#979197;font-size:10px}.lx-order-edit-footer{height:64px;padding:0 26px}.lx-order-edit-footer button{height:38px}.lx-order-form{gap:11px 12px}.lx-order-form label{font-size:12px;color:#454047}.lx-order-form input{height:40px;font-size:12px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{display:flex;flex-direction:column}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{margin-top:auto;padding-top:14px}.lx-order-plan-grid[hidden]{display:none!important}`;
    style.textContent += `.lx-order-edit-head,.lx-order-edit-footer,.lx-buy-sub-footer,.lx-buy-coupon-actions{border-top:0!important;border-bottom:0!important}`;
    style.textContent += `.lx-order-plan{grid-template-columns:auto minmax(0,1fr);column-gap:10px;align-items:center}.lx-order-plan-cost{display:grid!important;gap:2px;min-width:0}.lx-order-plan-cost b{color:#4d144a;font-size:13px;line-height:18px;white-space:nowrap}.lx-order-plan-cost small{font-size:10px;line-height:14px}.lx-order-plan-term{white-space:nowrap}`;
    style.textContent += `.lx-order-address>img{display:block;width:16px;height:16px;object-fit:contain}.lx-order-address{grid-template-columns:16px minmax(0,1fr) auto}`;
    style.textContent += `.lx-order-channel,.lx-order-quick,.lx-order-plan{box-sizing:border-box;border:.8px solid rgba(77,20,74,.1);border-radius:4px;background:#fff}.lx-order-channel.is-active,.lx-order-quick.is-active,.lx-order-plan.is-active{border-color:#4d144a;background:#f9eff6}.lx-order-channel.is-active{padding:10px 12px}.lx-order-plan.is-active .lx-order-radio{border-color:#4d144a}`;
    style.textContent += `.lx-order-edit-back,.lx-order-edit-back:hover,.lx-order-edit-back:focus,.lx-order-edit-back:active{background:transparent!important;color:#5d5661;outline:0}.lx-order-edit-body>.lx-order-edit-section:first-child{padding-top:0}.lx-order-code-menu{top:auto;bottom:calc(100% + 4px);max-height:132px;overflow:auto;z-index:8}.lx-order-combobox{z-index:2}`;
    style.textContent += `.lx-config-section{padding:0 0 20px;margin-bottom:20px;border-bottom:1px solid rgba(77,20,74,.1)}.lx-config-section h3{margin:0 0 13px;font-size:14px;line-height:20px}.lx-config-options{display:flex;flex-wrap:wrap;gap:10px}.lx-config-option{min-width:126px;height:40px;padding:0 16px;border:.8px solid rgba(77,20,74,.1);border-radius:4px;background:#fff;color:#38333a;font:inherit;font-size:13px;cursor:pointer}.lx-config-option.is-active{border-color:#4d144a;background:#f9eff6;color:#4d144a}.lx-config-option:disabled{background:#f7f6f7;color:#bbb6bd;cursor:not-allowed}.lx-config-quantity{display:flex;align-items:center;justify-content:space-between}.lx-config-quantity-copy{display:flex;align-items:center;gap:10px}.lx-config-quantity-copy h3{margin:0;font-size:14px}.lx-config-quantity-copy small{color:#99939c}.lx-config-stepper{display:grid;grid-template-columns:36px 48px 36px;height:36px}.lx-config-stepper button,.lx-config-stepper output{display:grid;place-items:center;box-sizing:border-box;border:.8px solid rgba(77,20,74,.1);background:#fff;color:#38333a;font-size:18px}.lx-config-stepper button:first-child{border-radius:6px 0 0 6px}.lx-config-stepper button:last-child{border-radius:0 6px 6px 0}.lx-config-stepper output{border-right:0;border-left:0;font-size:14px}.lx-config-stepper button:disabled{color:#c8c3ca;background:#f7f6f7}.lx-config-dialog .lx-order-edit-body{padding-top:12px}`;
    style.textContent += `.lx-order-channel.is-active,.lx-order-quick.is-active,.lx-order-plan.is-active,.lx-config-option.is-active{border-color:transparent;background:linear-gradient(#f9eff6,#f9eff6) padding-box,linear-gradient(90deg,#4d144a 0%,#b8252e 100%) border-box;color:#4d144a}`;
    style.textContent += `body>.lx-p0-toast{position:fixed!important;z-index:100100!important}`;
    style.textContent += `.lx-order-channel.is-active,.lx-order-quick.is-active,.lx-order-plan.is-active,.lx-config-option.is-active{border-width:1px!important;border-style:solid!important}.lx-order-plan{grid-template-columns:auto 1fr}.lx-order-radio{display:none!important}.lx-order-edit-section{border-bottom:0!important}.lx-invoice-dialog .lx-order-edit-body{padding-top:8px}.lx-invoice-dialog .lx-order-edit-section{padding-bottom:16px;margin-bottom:0}`;
    style.textContent += `.lx-order-code-menu{top:auto;bottom:calc(100% + 4px)}.lx-order-combobox:after{content:"";position:absolute;right:14px;top:50%;width:7px;height:7px;border-right:1px solid #8c8790;border-bottom:1px solid #8c8790;transform:translateY(-65%) rotate(45deg);pointer-events:none}.lx-order-combobox input{padding-right:36px;cursor:pointer}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{padding:0;border:0;background:#fff}`;
    style.textContent += `.lx-config-section{padding:0 0 16px;margin:0 0 16px;border-bottom:0}.lx-config-section h3{margin-bottom:12px}.lx-config-quantity{padding-top:0}`;
    style.textContent += `.lx-order-edit-head{gap:8px}.lx-order-edit-back{width:24px;height:24px;flex:0 0 24px;font-size:24px;line-height:24px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{padding:14px 16px 12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product{padding-bottom:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-section{padding:9px 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-row{padding:3px 0;line-height:18px}.lx-buy-direct-config{display:inline-flex;align-items:center;gap:6px}.lx-buy-direct-config i{width:6px;height:6px;border-top:1px solid currentColor;border-right:1px solid currentColor;transform:rotate(45deg)}`;
    style.textContent += `.lx-buy-coupon-field input{border:.8px solid rgba(77,20,74,.1);box-shadow:none!important}.lx-buy-coupon-field input:focus{border-color:#4d144a;box-shadow:none!important}`;
    style.textContent += `.lx-buy-direct-config,.lx-buy-direct-config:hover,.lx-buy-direct-config:focus,.lx-buy-direct-config:active{color:#4d144a!important;background:transparent!important;text-decoration:none!important}.lx-config-stepper{grid-template-columns:30px 40px 30px;height:32px}.lx-config-stepper button,.lx-config-stepper output{font-size:16px}.lx-config-stepper output{font-size:13px}`;
    style.textContent += `.lx-buy-sub-head{display:flex;align-items:center;gap:8px;margin:0 0 20px}.lx-buy-sub-head h2{margin:0}.lx-buy-sub-head .lx-order-edit-back{width:24px;height:24px;flex:0 0 24px;font-size:24px;line-height:24px}`;
    style.textContent += `.lx-order-edit-head{padding-right:18px;padding-left:18px}.lx-order-edit-back,.lx-buy-sub-head .lx-order-edit-back{width:24px;height:24px;flex:0 0 24px}.lx-buy-sub-head{transform:translate(-10px,-4px)}`;
    style.textContent += `.lx-order-edit-head h2,.lx-buy-sub-dialog h2{font-size:18px;line-height:26px;font-weight:700}`;
    style.textContent += `.lx-order-code-menu{top:calc(100% + 4px);bottom:auto}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{gap:0;background:transparent}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-section{margin:0 0 10px;padding:12px 14px;border:1px solid #ebe4ed;border-radius:12px;background:#fff}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product{grid-template-columns:60px 1fr auto;min-height:64px;box-sizing:border-box}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-section{border-bottom:1px solid #ebe4ed}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-section:last-of-type{border-bottom:1px solid #ebe4ed}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-row{padding:2px 0}.lx-order-summary{margin:0;padding:13px 14px;border:1px solid #f0ddea;border-radius:12px;background:#fcf3fa}.lx-order-summary .lx-buy-direct-price{margin-top:0}.lx-order-summary .lx-buy-direct-detail{margin-top:6px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{padding-top:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{margin-top:5px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin:0 0 10px;padding:12px 14px;border:1px solid #ebe4ed;border-radius:12px;background:#fff}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product{min-height:60px;margin:0;padding:0 0 9px;border:0;border-radius:0;background:transparent}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{margin:0;padding:0;border:0;border-radius:0;background:transparent}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{padding:10px 14px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product img{width:60px;height:60px;object-fit:contain;background:#fafafa}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{border-color:#e6ddea;background:linear-gradient(135deg,#fff 0%,#fcf9fe 100%)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy strong{font-size:14px;font-weight:600}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping{background:#fff}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{background:#fcfbfd}.lx-buy-national-subsidy{width:100%;display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:9px;margin:0 0 10px;padding:10px 13px;border:1px solid #cfeee1;border-radius:10px;background:linear-gradient(90deg,#effcf6,#fbfffd);color:#3d4d47;text-align:left;cursor:pointer}.lx-buy-national-subsidy i{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#d9f7e8;color:#108957;font-size:15px;font-style:normal}.lx-buy-national-subsidy strong{display:block;color:#35433e;font-size:12px;line-height:18px}.lx-buy-national-subsidy small{display:block;margin-top:1px;color:#87938e;font-size:10px;line-height:14px}.lx-buy-national-subsidy b{color:#5d1755;font-size:12px;white-space:nowrap}.lx-buy-national-subsidy b::after{content:"›";margin-left:5px;font-size:17px;font-weight:400;vertical-align:-1px}.lx-buy-national-subsidy.is-claimed{border-color:#e1ebe5;background:#f7fbf9}.lx-buy-national-subsidy.is-claimed b{color:#4b8066}.lx-order-summary{border-color:#efd8e9;background:linear-gradient(135deg,#fff7fc,#fcf2fa)}.lx-order-summary .lx-buy-direct-price b{font-size:18px}.lx-order-summary .lx-buy-direct-detail{display:flex;align-items:center;gap:8px}.lx-order-summary .lx-buy-direct-detail span{margin-left:0}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){height:min(660px,calc(100vh - 32px));overflow-y:auto;scrollbar-width:none;background:#fff}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)::-webkit-scrollbar{display:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)::before{content:"";position:absolute;z-index:0;top:0;right:0;left:0;height:142px;border-radius:12px 12px 0 0;background:radial-gradient(120% 130px at 18% 0%,rgba(255,138,92,.16) 0%,rgba(255,138,92,.08) 34%,transparent 70%),radial-gradient(120% 150px at 92% 0%,rgba(146,86,214,.16) 0%,rgba(146,86,214,.08) 36%,transparent 72%);pointer-events:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)>*{position:relative;z-index:1}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) h2{margin-bottom:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{padding-top:4px}`;
    style.textContent += `.lx-buy-national-subsidy{border:0;background:linear-gradient(90.759621deg,#d2f7e1 0%,rgba(245,254,249,0) 132.9%);box-shadow:none}.lx-buy-national-subsidy i{background:rgba(210,247,225,.76);color:#168a59}.lx-buy-national-subsidy strong{color:#000;font-weight:500}.lx-buy-national-subsidy small{color:#697972}.lx-buy-national-subsidy b{color:#4d144a;font-weight:600}.lx-buy-national-subsidy.is-claimed{border:0;background:linear-gradient(90.759621deg,#d2f7e1 0%,rgba(245,254,249,0) 132.9%)}.lx-buy-national-subsidy.is-claimed b{color:#4d144a}`;
    style.textContent += `.lx-buy-payment-success{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;padding:46px 28px 34px;text-align:center}.lx-buy-payment-success-icon{width:40px;height:40px;display:grid;place-items:center;margin-bottom:16px;border-radius:50%;background:#35ad72;color:#fff;font-size:23px;line-height:1}.lx-buy-payment-success h2{display:block!important;width:auto!important;margin:0 0 8px!important;background:none!important;color:#19171b!important;-webkit-text-fill-color:initial!important;font-size:20px!important}.lx-buy-payment-success h2:before{content:none!important}.lx-buy-payment-success p{margin:0;color:#77717d;font-size:13px;line-height:20px}.lx-buy-payment-success-card{width:min(360px,100%);display:grid;grid-template-columns:1fr auto;gap:8px 18px;box-sizing:border-box;margin:22px 0;padding:14px 16px;border:1px solid #e6dfe9;border-radius:8px;background:#fcfaff;text-align:left}.lx-buy-payment-success-card span{color:#8b858e}.lx-buy-payment-success-card strong{font-weight:500;text-align:right}.lx-buy-payment-success .primary{min-width:132px;height:38px;padding:0 24px;border:0;border-radius:100px;background:linear-gradient(90deg,#4d144a 12%,#b8252e);color:#fff;font-size:13px;font-weight:500;cursor:pointer}.lx-buy-payment-success small{margin-top:10px;color:#a39da6;font-size:11px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)>.lx-buy-direct-close{position:absolute!important;z-index:2;top:16px;right:18px;left:auto;margin:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)>h2{margin:0 36px 16px 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{padding-top:0}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{background:#fff}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{padding-right:0;padding-left:0}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{border-color:#ebe5ed;background:#fcfbfd;box-shadow:0 1px 2px rgba(57,35,63,.025)}.lx-buy-national-subsidy{border-radius:12px}.lx-order-summary{border-color:#efdbe9;box-shadow:0 1px 2px rgba(95,31,78,.02)}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{display:grid;grid-template-columns:100px minmax(0,1fr) auto;grid-template-areas:"visual heading action" "visual specs specs";column-gap:18px;row-gap:15px;box-sizing:border-box;min-height:156px;padding:20px 22px;border-radius:18px;box-shadow:0 10px 28px rgba(52,39,58,.07),inset 0 1px 0 rgba(255,255,255,.78)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product{display:contents}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{grid-area:visual;width:100px;height:100px;align-self:center;border-radius:8px;filter:drop-shadow(0 7px 8px rgba(35,30,38,.09))}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy{grid-area:heading;align-self:start;gap:7px;padding-top:5px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy strong{font-size:15px;line-height:22px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy span{font-size:12px;line-height:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-config{grid-area:action;align-self:start;min-height:34px;margin-top:2px;padding:0 12px;border-radius:100px;box-shadow:0 5px 16px rgba(52,39,58,.06)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{grid-area:specs;display:grid;grid-template-columns:.75fr 1.35fr .75fr 1.55fr;gap:12px;align-self:end;min-width:0;margin:0;padding:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row{display:grid;grid-template-columns:1fr;gap:5px;min-width:0;padding:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row strong,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row strong{font-size:11px;line-height:16px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row span{font-size:12px;line-height:18px}@media(max-width:560px){.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:76px minmax(0,1fr) auto;column-gap:12px;padding:16px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:76px;height:76px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{grid-template-columns:1fr 1fr}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-config{padding:0 8px}}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{border-color:transparent;background:#fff;box-shadow:0 12px 34px rgba(43,34,48,.09),0 2px 8px rgba(43,34,48,.045),inset 0 1px 0 rgba(255,255,255,.95)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{background:#fff;box-shadow:0 8px 24px rgba(43,34,48,.08);filter:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{margin:0;padding:10px 14px;border:0;border-radius:0;background:transparent;box-shadow:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{margin-bottom:8px}`;
    style.textContent += `.lx-buy-national-subsidy,.lx-buy-national-subsidy.is-claimed{width:100%;height:30px;min-height:30px;display:flex;align-items:center;justify-content:flex-start;gap:16px;box-sizing:border-box;margin:0 0 10px;padding:0 7px;border:0!important;border-radius:2px!important;background:linear-gradient(90.759621deg,#d2f7e1 0%,rgba(245,254,249,0) 132.9%)!important;box-shadow:none!important}.lx-buy-national-subsidy i{display:none!important}.lx-buy-national-subsidy>span{display:block;flex:0 0 auto}.lx-buy-national-subsidy strong{display:block;color:#000;font-size:12px;font-weight:500;line-height:13px;white-space:nowrap}.lx-buy-national-subsidy small{display:none!important}.lx-buy-national-subsidy b,.lx-buy-national-subsidy.is-claimed b{display:block;flex:0 0 auto;color:#4d144a;font-size:12px;font-weight:400;line-height:14px;white-space:nowrap}.lx-buy-national-subsidy b::after{content:none!important}`;
    style.textContent += `.lx-buy-national-subsidy,.lx-buy-national-subsidy.is-claimed{width:max-content;max-width:100%;gap:12px;padding-right:12px;padding-left:12px}.lx-order-summary{padding:8px 14px;border:0!important;border-radius:0;background:transparent!important;box-shadow:none!important}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){height:auto;min-height:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{flex:0 0 auto}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{box-shadow:0 7px 22px rgba(43,34,48,.05),0 1px 4px rgba(43,34,48,.025),inset 0 1px 0 rgba(255,255,255,.95)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{box-shadow:0 5px 16px rgba(43,34,48,.04)}.lx-buy-national-subsidy,.lx-buy-national-subsidy.is-claimed{width:320px;max-width:calc(100% - 14px);margin-left:14px;background:linear-gradient(90deg,#d1f7df 0%,#e0f9e9 52%,#effbf4 76%,rgba(255,255,255,0) 100%)!important}`;
    style.textContent += `.lx-order-edit-dialog .lx-order-address{grid-template-columns:28px minmax(0,1fr) auto;gap:14px;min-height:78px;padding:18px 20px;border:0;border-radius:18px;background:#fff;box-shadow:0 7px 22px rgba(43,34,48,.05),0 1px 4px rgba(43,34,48,.025),inset 0 1px 0 rgba(255,255,255,.95)}.lx-order-edit-dialog .lx-order-address>img{width:28px;height:28px;padding:6px;box-sizing:border-box;border-radius:8px;background:#fff;box-shadow:0 5px 16px rgba(43,34,48,.04)}.lx-order-edit-dialog .lx-order-address b{font-size:14px;line-height:21px}.lx-order-edit-dialog .lx-order-address button{padding:7px 10px;border-radius:100px;background:#fff;color:#4d144a;box-shadow:0 5px 16px rgba(43,34,48,.05);font-weight:500}`;
    style.textContent += `.lx-buy-sub-dialog .lx-buy-price-list{padding:0 4px}.lx-buy-sub-dialog .lx-buy-price-line{min-height:52px;border-bottom:0}.lx-buy-sub-dialog .lx-buy-price-line.is-clickable{margin-top:2px}.lx-buy-sub-dialog .lx-buy-price-line.is-clickable:hover{background:transparent}`;
    style.textContent += `.lx-order-edit-head h2,.lx-buy-sub-dialog h2{font-size:18px;line-height:26px;font-weight:700}.lx-config-section h3,.lx-order-edit-section h3{font-size:14px;line-height:20px;font-weight:600}.lx-order-edit-body,.lx-buy-price-list{font-size:13px}.lx-order-edit-body small,.lx-buy-price-list .muted{font-size:12px}.lx-order-edit-footer button,.lx-buy-sub-footer button{font-size:13px;font-weight:600}.lx-config-dialog{height:min(560px,calc(100vh - 32px));min-height:0}.lx-config-dialog .lx-order-edit-body{padding:10px 26px 18px;flex:1 1 auto}.lx-config-dialog .lx-config-section{margin:0 0 14px;padding:0}.lx-config-dialog .lx-config-section h3{margin-bottom:10px}.lx-config-dialog .lx-config-options{display:grid;grid-template-columns:repeat(3,144px);gap:16px}.lx-config-dialog .lx-config-option{width:144px;min-width:0;height:40px;padding:0 12px;border-radius:100px;font-size:13px;white-space:nowrap}.lx-config-dialog .lx-config-quantity{padding-top:0}.lx-config-dialog .lx-order-edit-footer{height:56px;padding:0 26px}@media(max-width:620px){.lx-config-dialog .lx-config-options{grid-template-columns:repeat(2,minmax(0,1fr))}.lx-config-dialog .lx-config-option{width:100%;height:40px;border-radius:100px;font-size:12px}}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-body{padding-top:12px;padding-bottom:16px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{height:56px}`;
    style.textContent += `.lx-order-edit-footer{height:78px!important;box-sizing:border-box;align-items:flex-start;padding:16px 26px 24px}.lx-config-dialog .lx-order-edit-footer{height:78px!important;padding:16px 26px 24px!important}.lx-buy-sub-footer,.lx-buy-coupon-actions{min-height:56px;box-sizing:border-box;align-items:flex-start;padding:16px 0 2px}.lx-config-dialog .lx-config-section:last-of-type{margin-bottom:24px}`;
    style.textContent += `.lx-config-dialog .lx-config-section:nth-of-type(-n+2) .lx-config-option{height:36px}`;
    style.textContent += `.lx-buy-direct-detail-button,.lx-buy-direct-detail-button:hover,.lx-buy-direct-detail-button:focus{text-decoration:underline!important;text-decoration-thickness:1px!important;text-underline-offset:3px}`;
    style.textContent += `.lx-invoice-dialog .lx-order-edit-body{padding:12px 26px 16px}.lx-invoice-dialog .lx-order-edit-section{margin:0;padding:0;border:0}.lx-invoice-dialog .lx-order-channel-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.lx-invoice-dialog .lx-order-channel{display:flex;align-items:center;justify-content:center;min-height:42px;padding:0 10px;border-radius:4px;text-align:center}.lx-invoice-dialog .lx-order-channel strong{font-weight:400}.lx-invoice-dialog .lx-order-channel.is-active{padding:0 10px}.lx-invoice-dialog .lx-order-channel.is-active strong{font-weight:600}.lx-invoice-dialog .lx-order-channel small{display:none}.lx-invoice-tip{margin:16px 0 20px;padding:12px 14px;border-radius:4px;background:#fbf9fc;color:#77717d;font-size:12px;line-height:18px}.lx-invoice-form{display:grid;grid-template-columns:100px minmax(0,1fr);gap:10px 12px;align-items:center}.lx-invoice-form label{font-size:12px;color:#454047}.lx-invoice-form input{width:100%;height:40px;box-sizing:border-box;padding:0 12px;border:1px solid #d9cfdd;border-radius:6px;background:#fff;color:#2b272d;font:12px "Source Han Sans CN","PingFang SC",sans-serif;outline:none}.lx-invoice-form input[readonly]{background:#f8f5f8;color:#77717d}.lx-invoice-form input:focus{border-color:#681057}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{position:relative;margin-top:6px;padding-top:14px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment::before{content:"";position:absolute;top:0;right:14px;left:14px;height:1px;background:rgba(77,20,74,.10)}.lx-buy-national-subsidy,.lx-buy-national-subsidy.is-claimed{width:380px;max-width:calc(100% - 14px)}`;
    style.textContent += `.lx-buy-direct-actions button{width:132px;height:44px;font-size:14px}.lx-buy-direct-actions .primary,.lx-buy-sub-footer .primary,.lx-order-edit-footer button{width:164px;height:44px;font-size:14px}.lx-config-dialog .lx-order-edit-footer{height:92px!important;padding:16px 26px 28px!important}.lx-config-dialog .lx-order-edit-footer button{width:164px;height:44px}`;
    style.textContent += `.lx-buy-sub-dialog h2{margin-bottom:24px}.lx-buy-sub-dialog .lx-buy-price-list{padding:2px 4px 0}.lx-buy-sub-dialog .lx-buy-price-line{min-height:44px}.lx-buy-sub-dialog .lx-buy-price-line.is-clickable{margin-top:0}.lx-buy-sub-dialog .lx-buy-sub-footer{min-height:64px;padding:14px 0 6px}.lx-buy-sub-footer button{min-width:116px;height:44px;font-size:14px}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form{grid-template-columns:70px minmax(0,1fr);gap:10px 8px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice{height:40px;margin-top:12px;padding:0 11px;border-color:#d9cfdd;border-radius:6px;gap:8px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice strong{font-size:12px;font-weight:400;color:#454047}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice span{font-size:12px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-provider{min-height:46px;margin-top:6px;padding:8px 10px;border:0;border-radius:0;background:transparent}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-provider+.lx-order-provider{margin-top:4px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-provider.is-expanded{background:#fbf9fc;border-radius:8px}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-body{padding-top:8px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-address{min-height:64px;padding:14px 16px;gap:12px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-address>img{width:26px;height:26px;padding:5px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-address b{font-size:13px;line-height:19px}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-subtitle{margin:20px 0 10px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-row{display:grid;grid-template-columns:70px minmax(0,1fr);gap:8px;align-items:center;margin-top:10px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-label{font-size:12px;color:#454047}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-row .lx-order-invoice{grid-template-columns:1fr 14px;width:100%;height:40px;margin:0;padding:0 11px;border-color:#d9cfdd;border-radius:6px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-row .lx-order-invoice span{color:#7f7882;text-align:left}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-plan{min-height:64px;padding:10px 14px;grid-template-columns:auto minmax(0,1fr);gap:12px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-plan-term{font-size:13px;line-height:20px;white-space:nowrap}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-plan-cost{display:grid;gap:1px;font-size:11px;line-height:15px;color:#454047}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-plan-cost b{font-size:14px;font-weight:600;color:#4d144a}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-plan-cost small{font-size:9px;line-height:13px;color:#9a949d}`;
    style.textContent += `.lx-config-dialog .lx-config-option,.lx-config-dialog .lx-config-section:nth-of-type(-n+2) .lx-config-option{width:144px;height:40px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{background:transparent;box-shadow:none}.lx-order-edit-footer,.lx-config-dialog .lx-order-edit-footer{height:88px!important;padding:16px 26px 28px!important}`;
    style.textContent += `.lx-buy-sub-dialog{padding-top:20px}.lx-buy-sub-head{margin:0 0 12px;transform:translate(-10px,0)}.lx-buy-sub-head h2{margin:0}.lx-coupon-dialog h2{margin-bottom:16px}.lx-coupon-dialog .lx-buy-coupon-field{gap:10px}`;
    style.textContent += `.lx-buy-direct-footnote{margin:0;padding-top:10px;line-height:16px}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-channel-grid{gap:12px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-quick-grid{gap:10px}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-subtitle{margin:18px 0 10px}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-quick-grid+.lx-order-subtitle{margin:16px 0 14px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-subtitle small{font-size:11px;line-height:16px;color:#979197}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-provider{margin-top:6px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-provider+.lx-order-provider{margin-top:6px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section h3{margin-bottom:14px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form input,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-row .lx-order-invoice{border-color:rgba(77,20,74,.14);background:#fff}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{background:#fff}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-row .lx-order-chevron{justify-self:end;margin-right:3px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{padding-top:14px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){width:min(620px,calc(100vw - 32px));height:min(560px,calc(100vh - 32px));overflow-y:auto}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-body{padding-top:2px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-address button{padding:0;background:transparent;box-shadow:none}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-address>img{width:24px;height:24px;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none}`;
    style.textContent += `.lx-order-edit-dialog .lx-order-channel small{font-size:10px;line-height:15px}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-subtitle{align-items:center;margin:18px 0 10px;font-size:14px;line-height:20px}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-quick-grid+.lx-order-subtitle{margin:22px 0 12px;padding-top:14px;border-top:1px solid rgba(77,20,74,.10)}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-subtitle>span{font-weight:600}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-subtitle small{font-size:10px;line-height:15px}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-provider:first-of-type{margin-top:0}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{transform:translateY(10px)}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-top:12px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){padding:22px 38px 24px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) h2{margin-bottom:0;font-size:20px;line-height:28px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{padding:0;background:transparent}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin:22px 0 18px;padding:22px 24px;border:0;border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(43,34,48,.06)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product{grid-template-columns:92px minmax(0,1fr) auto;gap:18px;min-height:92px;padding:0 0 16px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:92px;height:92px;border-radius:6px;background:#fff;box-shadow:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy{gap:7px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy strong{font-size:16px;font-weight:700;line-height:23px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy span{font-size:13px;line-height:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-config{height:32px;padding:0 13px;border:1px solid rgba(77,20,74,.18);border-radius:100px;box-shadow:0 4px 14px rgba(43,34,48,.05);font-size:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{display:grid;grid-template-columns:72px minmax(110px,1fr) 54px minmax(130px,1fr);gap:5px 12px;padding:0;border:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row{display:contents}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec strong{font-size:12px;line-height:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec span{font-size:12px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping{margin:0 0 12px;padding:0 4px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{margin:0 0 14px;padding:14px 4px 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping .lx-buy-direct-row,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment .lx-buy-direct-row{grid-template-columns:72px 1fr;gap:0;padding:4px 0;font-size:12px;line-height:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping strong,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment strong{font-weight:600}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy{width:100%;max-width:none;box-sizing:border-box;margin:0 0 16px;padding:9px 14px;border-radius:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{padding:0 4px;background:transparent}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary .lx-buy-direct-price{gap:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary .lx-buy-direct-price b{font-size:23px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{padding-top:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{padding-top:3px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy+.lx-order-summary{margin-top:10px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px;margin:0 0 16px;padding:16px 18px 12px;border-radius:16px;background:linear-gradient(135deg,#fcfbff,#fff)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card>.lx-order-shipping,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card>.lx-order-payment{display:contents}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card>.lx-order-payment::before{content:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card .lx-buy-direct-row{display:grid;grid-template-columns:18px 62px minmax(0,1fr);gap:7px;align-items:start;margin:0;padding:0!important;font-size:11px;line-height:17px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card .lx-buy-direct-row>img{width:18px;height:18px;object-fit:contain;filter:invert(13%) sepia(38%) saturate(2059%) hue-rotate(258deg) brightness(77%) contrast(102%)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card .lx-buy-direct-row strong{font-size:11px;line-height:17px;white-space:nowrap}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card .lx-buy-direct-row span{min-width:0;font-size:11px;line-height:17px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card .lx-buy-national-subsidy{grid-column:1/-1;width:100%;max-width:none;margin:4px 0 0;padding:8px 12px;border-radius:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-info-card+.lx-order-summary{margin-top:10px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) h2{font-size:18px;line-height:26px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-top:18px;padding:18px 22px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product{grid-template-columns:76px minmax(0,1fr) auto;gap:15px;min-height:76px;padding-bottom:13px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:76px;height:76px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy{gap:5px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy strong{font-size:15px;line-height:21px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy span{font-size:12px;line-height:17px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row{display:grid;grid-template-columns:1fr;gap:4px;min-width:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec strong{font-size:11px;line-height:16px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec span{font-size:12px;line-height:17px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy{width:320px;max-width:100%;margin-bottom:16px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin:22px 0 18px;padding:22px 24px;border-radius:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product{grid-template-columns:92px minmax(0,1fr) auto;gap:18px;min-height:92px;padding-bottom:16px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:92px;height:92px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy{gap:7px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy strong{font-size:16px;line-height:23px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-product-copy span{font-size:13px;line-height:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-config{height:32px;padding:0 13px;font-size:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{gap:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row{gap:5px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec strong{font-size:12px;line-height:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec span{font-size:12px;line-height:18px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product{grid-template-columns:112px minmax(0,1fr) auto;min-height:112px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:112px;height:112px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{grid-template-columns:minmax(74px,1fr) minmax(132px,1.6fr) minmax(72px,.95fr) minmax(140px,1.3fr);gap:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{width:max-content;margin-left:auto;transform:translateY(10px);text-align:right}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{transform:translateX(-10px)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-config{border:0;box-shadow:0 6px 18px rgba(43,34,48,.06)}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{width:100%;min-width:0;grid-template-columns:140px 240px 135px minmax(0,1fr);gap:8px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row{min-width:0;overflow:hidden}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row span{display:block;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:92px minmax(0,1fr) auto}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:92px;height:92px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{grid-template-columns:.75fr 1.35fr .75fr 1.55fr;gap:12px;min-width:0;overflow:hidden}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row{min-width:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){display:flex;flex-direction:column;padding-bottom:24px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{display:flex;flex:1 1 auto;min-height:0;flex-direction:column}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{margin-top:auto;padding-top:16px;transform:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{margin:6px 0 0;padding-top:0;transform:none}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy span{color:#6f6972}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec strong{color:#302b32;font-weight:600}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec span{color:#6f6972;font-weight:400}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping{margin-bottom:14px;padding-bottom:2px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{margin-bottom:16px;padding-top:16px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping .lx-buy-direct-row,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment .lx-buy-direct-row{padding:5px 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping strong,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment strong{color:#302b32;font-weight:600}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping span,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment span{color:#5f5961}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy{margin-bottom:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary .lx-buy-direct-detail{margin-top:7px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{color:#b6a7b5}`;
    style.textContent += `.lx-buy-national-subsidy b,.lx-buy-national-subsidy.is-claimed b{font-weight:600}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){overflow:hidden}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{min-height:140px;padding:16px 18px;row-gap:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{padding-top:6px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{padding-top:0}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{padding-right:18px;padding-left:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{transform:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping{margin-bottom:10px;padding:0 0 8px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{margin-bottom:14px;padding:12px 0 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{width:max-content;max-width:100%;margin:6px 0 0 auto;text-align:right;transform:none}.lx-order-edit-back,.lx-buy-sub-head .lx-order-edit-back{width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;padding:4px;border:0;border-radius:6px;font-size:0;line-height:0}.lx-order-edit-back img{display:block;width:20px;height:20px;object-fit:contain}.lx-order-edit-head{gap:6px}.lx-buy-sub-head{gap:6px;margin:0 0 12px;transform:none}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){padding-right:30px;padding-left:30px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{padding-top:2px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{margin-top:2px;transform:translateY(-2px)}`;
    style.textContent += `.lx-invoice-form{grid-template-columns:80px minmax(0,1fr);gap:10px 8px}`;
    style.textContent += `.lx-invoice-tip{margin:14px 0 18px;padding:0;border-radius:0;background:transparent;color:#8b858e;font-size:11px;line-height:16px}`;
    style.textContent += `.lx-coupon-dialog .lx-buy-coupon-actions button{width:132px;min-width:0;height:44px;padding:0;font-size:14px}.lx-coupon-dialog .lx-buy-coupon-actions .primary{width:164px}`;
    style.textContent += `.lx-config-dialog .lx-config-options{grid-template-columns:repeat(3,140px);gap:16px}.lx-config-dialog .lx-config-option,.lx-config-dialog .lx-config-section:nth-of-type(-n+2) .lx-config-option{width:140px;height:38px;padding:0 10px;font-size:12px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){height:auto;max-height:calc(100vh - 48px);padding:18px 28px 20px;overflow-y:auto}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{display:block;flex:none;min-height:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin:14px 0 12px;padding:14px 18px;min-height:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product{min-height:82px;padding-bottom:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:82px;height:82px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-shipping{margin-bottom:7px;padding-bottom:5px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment{margin-bottom:8px;padding-top:8px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy{grid-template-columns:minmax(0,1fr) auto;margin-bottom:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{margin-top:14px;padding-top:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{margin-top:5px;line-height:14px}`;
    style.textContent += `.lx-order-edit-back,.lx-buy-sub-head .lx-order-edit-back{width:24px;height:24px;flex:0 0 24px;margin:0;padding:2px;border:0;border-radius:4px;background:transparent}.lx-order-edit-back img{width:18px;height:18px;display:block;object-fit:contain}.lx-order-edit-back:hover,.lx-order-edit-back:focus{background:transparent;color:inherit}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){padding-top:24px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-top:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-payment::before{right:0;left:0;background:rgba(77,20,74,.06)}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{margin-bottom:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{margin-top:0;line-height:16px}`;
    style.textContent += `.lx-buy-direct-dialog,.lx-buy-sub-dialog,.lx-order-edit-dialog{width:min(620px,calc(100vw - 32px));height:min(560px,calc(100vh - 32px))!important;min-height:min(560px,calc(100vh - 32px));max-height:calc(100vh - 32px)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){padding:22px 30px 24px;overflow:hidden}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-card{display:flex;flex:1 1 auto;min-height:0;flex-direction:column}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{margin-top:auto;padding-top:2px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{margin:2px 0 0 auto;line-height:14px;transform:translateY(-2px)}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{margin:2px 0 10px;padding:8px 12px;border:1px solid #eee6f0;border-radius:12px;background:linear-gradient(135deg,#fcf9fd 0%,#faf7fc 100%)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin:0;padding:5px 0;border:0;background:transparent}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin-top:7px;padding-top:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment::before{right:0;left:0;background:rgba(77,20,74,.055)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-national-subsidy{width:100%;max-width:none;margin:9px 0 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{margin:0;padding:10px 12px;border:1px solid #f0e3ed!important;border-radius:12px;background:linear-gradient(135deg,#fff9fd,#fcf6fb)!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form input,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-combobox input,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice{border-color:#e5d9e8;background:#faf7fc}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form input:focus,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-combobox input:focus,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice:focus{border-color:#7a286c;background:#fff;box-shadow:0 0 0 3px rgba(122,40,108,.08)}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{border-color:#ebe5ed;background:#fff}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{border-color:#ebe5ed!important;background:#fff!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:82px minmax(0,1fr) auto;grid-template-rows:auto auto;grid-template-areas:"visual heading action" "visual specs specs";row-gap:14px;min-height:144px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy{align-self:start;padding-top:2px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy span{margin-top:3px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{align-self:start}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{padding:8px 0;border:0!important;border-radius:0;background:transparent!important;box-shadow:none!important}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{margin:0 0 10px;padding:0;border:0;border-radius:0;background:transparent}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{padding:0 0 8px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin-top:6px;padding:12px 0 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-national-subsidy{margin-top:10px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{margin-bottom:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{padding-bottom:8px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin-top:8px;padding-top:12px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping .lx-buy-direct-row,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row{padding:4px 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-national-subsidy{margin-top:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{margin:0;padding-top:8px;padding-bottom:8px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{margin:0 0 10px;padding:12px 14px 10px;border:1px solid #eee8ef;border-radius:12px;background:#fcfbfd}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{padding:0 0 6px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin-top:6px;padding:10px 0 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping .lx-buy-direct-row,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row{padding:3px 0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-national-subsidy{margin-top:8px;margin-bottom:0}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:82px minmax(0,1fr) auto;column-gap:14px;row-gap:8px;min-height:136px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy{gap:4px;padding-top:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy span{margin-top:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{align-self:start}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{padding-bottom:2px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin-top:2px;padding-top:8px}`;
    style.textContent += `.lx-order-edit-back img[src$="order-modal-back.svg"]{transform:none!important}`;
    style.textContent += `.lx-order-edit-back img{width:16px;height:16px;display:block;transform:scaleX(-1)}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)>h2{position:relative;margin-bottom:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)>h2::after{content:"订单已校验 · 配置与收货信息完整";position:absolute;top:32px;left:0;display:block;padding:4px 10px;border-radius:100px;background:#f7f0f7;color:#6b2863;font-size:10px;font-weight:500;line-height:14px;white-space:nowrap}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-top:42px;border:1px solid rgba(255,255,255,.8);box-shadow:0 10px 26px rgba(43,34,48,.055),inset 0 1px 0 rgba(255,255,255,.98)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row+.lx-buy-direct-row{margin-top:8px;padding-top:10px;border-top:1px solid rgba(77,20,74,.06)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{padding-top:12px;border-top:1px solid rgba(77,20,74,.06)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{margin-top:6px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{display:grid;grid-template-columns:auto minmax(0,1.4fr) auto minmax(0,1.25fr);gap:0;align-items:center}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row{position:relative;display:block;min-width:0;padding:0 14px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row:first-child{padding-left:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row+ .lx-buy-direct-row::before{content:"";position:absolute;left:0;top:50%;width:1px;height:12px;background:#e6dfe8;transform:translateY(-50%)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec strong{display:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec span{display:block;color:#6f6972;font-size:12px;line-height:18px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)>h2::after{content:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-top:18px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{margin:0 0 10px;padding:0;border:0;border-radius:0;background:transparent}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{position:relative;padding:0 0 10px 30px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping::before{content:"";position:absolute;top:5px;left:0;width:18px;height:18px;background:url('/assets/icons/order-address-location.svg') center/contain no-repeat}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin-top:7px;padding:10px 0 0;border-top:1px solid rgba(77,20,74,.06)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row{position:relative;padding:3px 0 3px 30px;border:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row::before{content:"";position:absolute;top:3px;left:0;width:18px;height:18px;background:url('/assets/icons/global-cart.svg') center/contain no-repeat}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row+ .lx-buy-direct-row{margin-top:8px;padding-top:10px;border-top:1px solid rgba(77,20,74,.06)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row+ .lx-buy-direct-row::before{top:10px;background-image:url('/assets/icons/mall-orders.svg')}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog)>h2::after{display:none!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:68px minmax(0,1fr) auto;min-height:118px!important;padding:12px 18px;row-gap:8px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:68px;height:68px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{display:flex;align-items:center;gap:0;min-width:0;overflow:hidden}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row{flex:0 1 auto;padding:0 10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row:first-child{padding-left:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec .lx-buy-direct-row:last-child{padding-right:0}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{padding-bottom:6px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin-top:0;padding-top:0;border-top:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment::before{display:none}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row{padding-top:3px;padding-bottom:3px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row+ .lx-buy-direct-row{margin-top:2px;padding-top:3px;border-top:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row+ .lx-buy-direct-row::before{top:3px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-national-subsidy{margin-top:8px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{border-top-color:rgba(77,20,74,.045)}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-head{gap:6px!important;padding-left:18px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-head>.lx-order-edit-back{display:grid!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-head h2{margin-left:0!important}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{padding-left:0!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping::before{content:none!important;display:none!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping .lx-buy-direct-row,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row{grid-template-columns:72px minmax(0,1fr)!important;gap:8px!important;padding-left:0!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row::before{content:none!important;display:none!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{border-top:0!important}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form input:focus,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-combobox input:focus,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice:focus,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form input:focus-visible,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-combobox input:focus-visible,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice:focus-visible{box-shadow:none!important;outline:none!important}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{min-height:0!important;padding-top:16px;padding-bottom:16px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{align-self:center}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{align-self:end}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{margin-top:18px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{position:relative;top:8px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{position:relative;top:8px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-summary{padding-bottom:18px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{top:16px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{top:16px}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy.is-claimed{border-radius:4px!important}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-combobox{position:relative;z-index:30!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-code-menu{top:auto!important;bottom:calc(100% + 4px)!important;z-index:100!important;max-height:none!important;overflow:visible!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{position:relative;z-index:1}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-bottom:12px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-national-subsidy.is-claimed{background:linear-gradient(90deg,#D2F7E1 0%,rgba(245,254,249,0) 100%)!important}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-address{grid-template-columns:14px minmax(0,1fr) auto!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-address>img{width:14px!important;height:14px!important}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{margin:0!important;padding:16px 18px 14px!important;border:0!important;border-radius:18px!important;background:#fff!important;box-shadow:0 10px 26px rgba(43,34,48,.055),inset 0 1px 0 rgba(255,255,255,.98)!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{margin:0!important;padding:0 0 7px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment{margin:0!important;padding:0!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping .lx-buy-direct-row,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row{padding:4px 0!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-national-subsidy{margin:10px 0 0!important}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{position:relative;top:8px}`;
    style.textContent += `/* LX_ORDER_CONTENT_RHYTHM_V152 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin:24px 0 12px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{top:0}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{margin:0!important;padding:14px 18px 12px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping{padding-bottom:5px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-shipping .lx-buy-direct-row,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-payment .lx-buy-direct-row{padding:3px 0!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-national-subsidy{margin-top:8px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{margin:16px 0 0!important;padding:0 4px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{margin-top:16px!important}`;
    style.textContent += `/* LX_ORDER_CARD_GAP_V160 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-bottom:30px!important;padding-bottom:24px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{align-self:start!important}`;
    style.textContent += `/* LX_ORDER_EDIT_WIDTH_V162 */.lx-order-edit-dialog:not(.lx-config-dialog){width:min(620px,calc(100vw - 48px))!important;max-width:620px!important}`;
    style.textContent += `/* LX_ORDER_EDIT_FOOTER_V163 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{background:transparent!important;border-top:0!important;box-shadow:none!important}.lx-order-edit-dialog .lx-order-edit-back>img{transform:scaleX(-1)!important}`;
    style.textContent += `/* LX_ORDER_EDIT_COMPACT_V164 */.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog){height:min(640px,calc(100vh - 48px))!important}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-body{padding-top:8px!important}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-address{min-height:64px!important;padding:12px 18px!important;border:0!important;box-shadow:0 8px 24px rgba(50,29,57,.08)!important}`;
    style.textContent += `/* LX_PAYMENT_TABS_V158 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs{display:flex;align-items:stretch;gap:28px;height:38px;margin:0 0 14px;border-bottom:1px solid rgba(77,20,74,.12)}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs .lx-order-channel{position:relative;min-height:0;padding:0 0 10px;border:0!important;border-radius:0!important;background:transparent!important;color:#5f5961;font-size:14px;line-height:20px;font-weight:500;box-shadow:none!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs .lx-order-channel::after{content:"";position:absolute;right:0;bottom:-1px;left:0;height:2px;border-radius:2px;background:transparent}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs .lx-order-channel.is-active{color:#681057;font-weight:600}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs .lx-order-channel.is-active::after{background:linear-gradient(90deg,#4d144a 0%,#b8252e 100%)}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-corporate-panel{display:grid;gap:6px;padding:14px;border:1px solid rgba(77,20,74,.12);border-radius:8px;background:#fbf9fc;color:#706a73;font-size:12px;line-height:18px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-corporate-panel b{color:#302b32;font-size:13px;line-height:18px}`;
    style.textContent += `/* LX_ORDER_EDIT_POLISH_V159 */.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog){width:min(760px,calc(100vw - 48px));height:min(720px,88vh);border-radius:20px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-head{height:72px;padding:0 24px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-body{padding:20px 32px 28px;overscroll-behavior:contain;scrollbar-gutter:stable}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-address{min-height:82px;padding:14px 18px;border:1px solid #e2ddeb;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(50,29,57,.08)}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-section{padding:24px 0 18px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-section h3{margin:0 0 12px;font-size:18px;line-height:26px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-payment-tabs{height:44px;gap:30px;margin-bottom:18px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-quick-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-quick{height:48px;padding:0 12px;border-radius:8px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-provider{min-height:50px;padding:9px 12px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-footer{height:84px!important;padding:14px 32px!important;border-top:1px solid #e2ddeb!important;box-shadow:0 -8px 24px rgba(50,29,57,.08)}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-footer button{width:190px;height:46px;border-radius:8px}.lx-order-edit-dialog button:focus-visible,.lx-order-edit-dialog input:focus-visible,.lx-order-edit-dialog select:focus-visible{outline:2px solid #a262d7;outline-offset:2px}@media(max-width:640px){.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog){width:calc(100vw - 32px);height:calc(100vh - 32px)}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-body{padding:16px}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-footer{padding:12px 16px!important}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-footer button{width:100%}}`;
    style.textContent += `/* LX_PAYMENT_TITLE_V159 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section:first-of-type>h3{margin-bottom:16px!important;font-size:18px!important;line-height:26px!important}`;
    style.textContent += `/* LX_ORDER_SUMMARY_SPACING_V151 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-order-summary{margin:22px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-direct-price{margin:0;gap:10px}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card .lx-buy-direct-detail{margin-top:6px}`;
    style.textContent += `/* LX_MODAL_BUTTON_STANDARD_V144 */.lx-buy-direct-actions,.lx-buy-sub-footer,.lx-buy-coupon-actions{gap:12px}.lx-buy-direct-actions button,.lx-buy-sub-footer button,.lx-buy-coupon-actions button,.lx-order-edit-footer button{box-sizing:border-box;width:132px!important;min-width:132px!important;height:44px!important;min-height:44px!important;padding:0 22px!important;border-radius:999px!important;font-size:14px!important;line-height:20px!important;font-weight:600!important;box-shadow:none!important;transform:none!important}.lx-buy-direct-actions .primary,.lx-buy-sub-footer .primary,.lx-buy-coupon-actions .primary,.lx-order-edit-footer button{width:164px!important;min-width:164px!important;border:0!important;background:linear-gradient(90deg,#4d144a 11.9%,#b8252e 100%)!important;color:#fff!important}.lx-buy-direct-actions button:not(.primary),.lx-buy-sub-footer button:not(.primary),.lx-buy-coupon-actions button:not(.primary){border:1px solid #d8c5db!important;background:#fff!important;color:#4d144a!important}`;
    style.textContent += `/* LX_ORDER_FOOTNOTE_ALIGNMENT_V150 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{position:relative;top:-16px;margin-top:4px!important;padding:8px 0!important}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{padding-bottom:20px!important}`;
    style.textContent += `.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions,.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{top:24px}`;
    style.textContent += `/* LX_ORDER_MODAL_PARITY_V165 */.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog){height:min(560px,calc(100vh - 32px))!important;min-height:min(560px,calc(100vh - 32px))!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-rows:68px 18px!important;row-gap:8px!important;min-height:132px!important;padding:16px 18px 22px!important;box-sizing:border-box!important;overflow:hidden!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{align-self:end!important}`;
    style.textContent += `/* LX_ORDER_VERTICAL_RHYTHM_V166 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog){padding-top:18px!important;padding-bottom:20px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-rows:56px 18px!important;row-gap:4px!important;min-height:112px!important;padding:14px 18px 16px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{align-self:start!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{top:0!important;margin-top:12px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{top:0!important;margin-top:4px!important;padding:0!important}`;
    style.textContent += `.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section:last-child{padding-top:12px;padding-bottom:12px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section:last-child h3{margin-bottom:10px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form{grid-template-columns:70px minmax(0,1fr);gap:8px 10px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form label,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-label{color:#5f5961}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-form input,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-row .lx-order-invoice{height:38px;border-color:#e5dce8;background:#fcfbfd}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-row{grid-template-columns:70px minmax(0,1fr);gap:10px;margin-top:8px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-invoice-row .lx-order-invoice{height:38px}`;
    style.textContent += `/* LX_PRODUCT_CARD_BOTTOM_BREATHING_ROOM_V158 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{padding-bottom:32px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{margin-bottom:0!important}`;
    style.textContent += `/* LX_ORDER_CARD_COMPACT_V167 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-bottom:14px!important;padding-bottom:16px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec span{font-size:11px!important;line-height:16px!important}.lx-buy-sub-dialog .lx-order-edit-back>img{transform:scaleX(-1)!important}`;
    style.textContent += `/* LX_MODAL_SCROLLBAR_V168 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{border-top:0!important;background:transparent!important;box-shadow:none!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-body{scrollbar-gutter:auto!important}.lx-buy-direct-dialog,.lx-order-edit-body,.lx-buy-sub-dialog,[data-buy-modal-direct] [style*="overflow"]{scrollbar-width:thin;scrollbar-color:transparent transparent}.lx-buy-direct-dialog::-webkit-scrollbar,.lx-order-edit-body::-webkit-scrollbar,.lx-buy-sub-dialog::-webkit-scrollbar,[data-buy-modal-direct] [style*="overflow"]::-webkit-scrollbar{width:0;height:0}.lx-buy-direct-dialog:hover::-webkit-scrollbar,.lx-order-edit-body:hover::-webkit-scrollbar,.lx-buy-sub-dialog:hover::-webkit-scrollbar,[data-buy-modal-direct] [style*="overflow"]:hover::-webkit-scrollbar{width:5px;height:5px}.lx-buy-direct-dialog::-webkit-scrollbar-track,.lx-order-edit-body::-webkit-scrollbar-track,.lx-buy-sub-dialog::-webkit-scrollbar-track,[data-buy-modal-direct] [style*="overflow"]::-webkit-scrollbar-track{background:transparent}.lx-buy-direct-dialog::-webkit-scrollbar-thumb,.lx-order-edit-body::-webkit-scrollbar-thumb,.lx-buy-sub-dialog::-webkit-scrollbar-thumb,[data-buy-modal-direct] [style*="overflow"]::-webkit-scrollbar-thumb{border-radius:999px;background:rgba(137,103,170,.24)}.lx-buy-direct-dialog:hover::-webkit-scrollbar-thumb,.lx-order-edit-body:hover::-webkit-scrollbar-thumb,.lx-buy-sub-dialog:hover::-webkit-scrollbar-thumb,[data-buy-modal-direct] [style*="overflow"]:hover::-webkit-scrollbar-thumb{background:rgba(137,103,170,.38)}`;
    style.textContent += `/* LX_PAYMENT_IDENTITY_V169 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-quick img.lx-order-logo{display:block;flex:0 0 28px;width:28px;height:28px;border-radius:7px;background:transparent!important;object-fit:contain}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs{height:34px!important;margin-bottom:8px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs .lx-order-channel{padding-bottom:7px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-corporate-panel{display:block;padding:3px 0 0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#76707a;font-size:13px;line-height:20px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-corporate-panel b{display:none}`;
    style.textContent += `/* LX_ORDER_PAYMENT_TUNING_V170 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-rows:48px 16px!important;row-gap:4px!important;margin-bottom:12px!important;padding:12px 18px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:96px!important;height:96px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-subtitle,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-subtitle>span{color:#9a949d!important;font-weight:400!important}.lx-order-edit-dialog:not(.lx-config-dialog) [data-corporate-payment][hidden]{display:none!important}`;
    style.textContent += `/* LX_ORDER_LAYOUT_REFINEMENT_V171 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:80px minmax(0,1fr) auto!important;grid-template-rows:80px 18px!important;column-gap:16px!important;row-gap:6px!important;min-height:0!important;margin-bottom:12px!important;padding:16px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:80px!important;height:80px!important;align-self:start!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy{padding-top:0!important;align-self:start!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{align-self:center!important}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-quick-grid+.lx-order-subtitle{padding-top:0!important;border-top:0!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-corporate-panel{font-size:12px!important;line-height:18px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-corporate-panel::before{content:"*";margin-right:3px;color:#a59ea8}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section:last-child{border-bottom:0!important}`;
    style.textContent += `/* LX_ORDER_FOOTER_SUMMARY_V172 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{height:150px!important;min-height:150px!important;box-sizing:border-box!important;overflow:hidden!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-body{border-top:0!important;border-bottom:0!important;box-shadow:none!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer::before,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer::after{display:none!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-selected-payment{margin-right:auto;color:#8f8992;font-size:12px;line-height:18px;font-weight:400}`;
    style.textContent += `/* LX_PAYMENT_PANEL_V173 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-body{padding-top:4px!important}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]{margin-top:2px;padding:14px 16px 12px;border:1px solid #f0ebf2;border-radius:12px;background:rgba(104,16,87,.025)}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-subtitle:first-child{margin-top:0!important}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-subtitle{margin-bottom:8px!important}.lx-order-edit-dialog:not(.lx-config-dialog) [data-online-payment]>.lx-order-quick-grid+.lx-order-subtitle{margin-top:16px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer *{border-top-color:transparent!important}`;
    style.textContent += `/* LX_PRODUCT_CARD_THREE_ROWS_V174 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:64px minmax(0,1fr) auto!important;grid-template-rows:64px 16px!important;column-gap:14px!important;row-gap:4px!important;height:112px!important;min-height:112px!important;margin-bottom:10px!important;padding:12px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{width:64px!important;height:64px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy{gap:2px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{align-self:start!important}`;
    style.textContent += `/* LX_ORDER_SECTION_SPACING_V175 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs{border-bottom:0!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section:first-of-type{padding-bottom:28px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section:last-child{padding-top:8px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section:last-child h3{margin-bottom:2px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{border:0!important;border-block:0!important;box-shadow:0 0 transparent!important;background:#fff!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer::before,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer::after{content:none!important;display:none!important}`;
    style.textContent += `/* LX_ORDER_TAB_AND_FOOTER_V177 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-body{padding-top:16px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs{height:28px!important;margin-bottom:8px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs .lx-order-channel{padding-bottom:2px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-payment-tabs .lx-order-channel::after{right:auto!important;bottom:2px!important;left:50%!important;width:38px!important;transform:translateX(-50%)}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{position:relative!important;z-index:2!important;margin-top:-1px!important;border:0!important;box-shadow:none!important}`;
    style.textContent += `/* LX_ORDER_SPEC_AND_ACTIONS_V178 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-rows:64px 20px!important;height:116px!important;min-height:116px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec span{font-size:12px!important;line-height:20px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{top:12px!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{top:12px!important}`;
    style.textContent += `/* LX_PRODUCT_SPEC_COMPACT_V179 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec{transform:translateY(-4px)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-spec span{font-size:11px!important;line-height:18px!important}`;
    style.textContent += `/* LX_PRODUCT_VISUAL_ALIGNMENT_V176 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:96px minmax(0,1fr) auto!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{justify-self:center!important}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product-copy{transform:translateY(5px)}.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-config{transform:translateY(5px)}`;
    style.textContent += `/* LX_SUPPLEMENT_FORM_LAYOUT_V180 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-section{padding-top:16px!important;padding-bottom:16px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-section h3{margin:0 0 14px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid>label{display:grid;gap:6px;min-width:0;color:#5f5961;font-size:12px;line-height:18px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid>.lx-order-supplement-note{grid-column:1 / -1}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid input,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid .lx-order-invoice{width:100%;height:38px;box-sizing:border-box;margin:0;padding:0 11px;border:1px solid #e5dce8;border-radius:6px;background:#fcfbfd;font-size:12px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid .lx-order-combobox{width:100%}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid .lx-order-invoice{display:grid;grid-template-columns:minmax(0,1fr) 14px;gap:8px;align-items:center;text-align:left}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid .lx-order-invoice span{color:#7f7882;text-align:left}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid .lx-order-chevron{justify-self:end;margin-right:3px}@media(max-width:640px){.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid{grid-template-columns:1fr}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid>.lx-order-supplement-note{grid-column:auto}}`;
    style.textContent += `/* LX_PRODUCT_CARD_BOTTOM_COMPACT_V181 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-rows:64px 18px!important;row-gap:0!important;height:100px!important;min-height:100px!important;padding-block:9px!important;margin-bottom:8px!important}`;
    style.textContent += `/* LX_PRODUCT_CARD_GAP_V182 */.lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{margin-bottom:12px!important}`;
    style.textContent += `/* LX_ORDER_HEADER_AND_FOOTER_CLEANUP_V183 */.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-body{padding-top:14px!important}.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-footer{border:0!important;border-top:0!important;border-bottom:0!important;box-shadow:none!important;outline:0!important}`;
    style.textContent += `/* LX_SUPPLEMENT_FIELD_TOKENS_V184 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid input,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid .lx-order-invoice{border:1px solid #e4dee7!important;background:#fff!important;box-shadow:none!important;outline:0!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid input:focus,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid .lx-order-invoice:focus,.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-supplement-grid .lx-order-invoice:focus-visible{border-color:#b493bf!important;box-shadow:none!important;outline:0!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-section:first-of-type{padding-bottom:16px!important}`;
    style.textContent += `/* LX_ORDER_HEADER_COMPACT_AND_BRAND_LOGOS_V185 */.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-body{padding-top:8px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-quick .lx-order-logo{background:transparent!important;border-radius:0!important}`;
    style.textContent += `/* LX_SELECTED_PAYMENT_ALIGNMENT_V186 */.lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-footer{height:84px!important;align-items:center!important;padding:0 32px!important}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-selected-payment{display:flex;align-items:baseline;gap:8px;margin-right:auto!important;line-height:20px}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-selected-payment>span{color:#8f8992;font-size:12px;font-weight:400}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-selected-payment>strong{color:#681057;font-size:14px;font-weight:600;letter-spacing:.01em}`;
    style.textContent += `/* LX_INVOICE_TABS_COMPACT_V187 */.lx-invoice-dialog .lx-order-edit-body{padding:6px 26px 16px!important}.lx-invoice-dialog .lx-order-edit-section{padding:0 0 8px!important}.lx-invoice-dialog .lx-order-channel-grid{display:flex!important;align-items:flex-start;gap:30px!important;height:36px}.lx-invoice-dialog .lx-order-channel{position:relative;display:flex!important;flex:0 0 auto!important;min-height:36px!important;height:36px!important;padding:0 0 6px!important;border:0!important;border-radius:0!important;background:transparent!important;color:#625d65;text-align:left!important}.lx-invoice-dialog .lx-order-channel strong{font-size:14px;line-height:20px;font-weight:500!important;white-space:nowrap}.lx-invoice-dialog .lx-order-channel.is-active{padding:0 0 6px!important;border:0!important;background:transparent!important;color:#681057}.lx-invoice-dialog .lx-order-channel.is-active strong{font-weight:600!important}.lx-invoice-dialog .lx-order-channel.is-active::after{content:"";position:absolute;bottom:0;left:50%;width:42px;height:2px;border-radius:999px;background:linear-gradient(90deg,#681057,#c12631);transform:translateX(-50%)}.lx-invoice-dialog .lx-invoice-tip{margin:6px 0 14px!important}`;
    style.textContent += `/* LX_PAYMENT_ICON_AND_STATE_SYNC_V188 */.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-quick .lx-order-logo{width:22px!important;height:22px!important;min-width:22px!important;object-fit:contain}.lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-provider .lx-order-logo{width:24px!important;height:24px!important;min-width:24px!important;object-fit:contain;background:transparent!important;border-radius:0!important}`;
    style.textContent += `/* LX_INVOICE_SPACING_AND_VAT_TIP_V189 */.lx-order-edit-dialog.lx-invoice-dialog .lx-order-edit-head{height:56px!important}.lx-order-edit-dialog.lx-invoice-dialog .lx-order-edit-body{padding-top:6px!important}.lx-order-edit-dialog.lx-invoice-dialog .lx-order-edit-section:first-of-type{margin:0!important;padding:0 0 12px!important}.lx-order-edit-dialog.lx-invoice-dialog .lx-invoice-tip{margin:0 0 12px!important}.lx-order-edit-dialog.lx-invoice-dialog .lx-invoice-form{row-gap:8px}`;
    style.textContent += `/* LX_MODAL_SPACING_V190 */
      .lx-order-edit-dialog.lx-invoice-dialog .lx-invoice-form{margin-top:16px!important;row-gap:12px!important}
      .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-head{height:60px!important}
      .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-body{padding-top:4px!important}
      .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-supplement-section{padding-top:16px!important}
      .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-supplement-section h3{margin-bottom:12px!important}
      .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-supplement-grid{row-gap:20px!important}
      .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-supplement-grid>label{gap:8px!important}
    `;
    style.textContent += `/* LX_PAYMENT_FOOTER_V191 */
      .lx-order-edit-dialog:not(.lx-config-dialog) [data-corporate-payment]{display:none!important}
      .lx-order-edit-dialog .lx-order-selected-payment.is-corporate{flex:1;min-width:0;margin-right:20px!important;align-items:center}
      .lx-order-edit-dialog .lx-order-selected-payment.is-corporate>span{font-size:12px;line-height:18px;font-weight:400}
      .lx-order-edit-dialog .lx-order-edit-footer>button{flex-shrink:0}
    `;
    style.textContent += `/* LX_MODAL_FOCUS_AND_SHADOW_V192 */
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-head{height:52px!important}
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-body{padding-top:12px!important;scroll-padding-top:12px}
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-address{box-shadow:0 6px 18px rgba(50,29,57,.08)!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog input:not([type=radio]):not([type=checkbox]):not([aria-invalid=true]),
      [data-buy-modal-direct] .lx-buy-direct-dialog textarea:not([aria-invalid=true]),
      [data-buy-modal-direct] .lx-buy-direct-dialog select:not([aria-invalid=true]){border:1px solid #e2ddeb!important;box-shadow:none!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog input:not([type=radio]):not([type=checkbox]):not([aria-invalid=true]):focus,
      [data-buy-modal-direct] .lx-buy-direct-dialog textarea:not([aria-invalid=true]):focus,
      [data-buy-modal-direct] .lx-buy-direct-dialog select:not([aria-invalid=true]):focus,
      [data-buy-modal-direct] .lx-buy-direct-dialog .lx-order-invoice:focus-visible{border-color:#4d144a!important;outline:1px solid #4d144a!important;outline-offset:-1px!important;box-shadow:none!important}
    `;
    style.textContent += `/* LX_MODAL_ALIGNMENT_V193 */
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-product>img{align-self:center!important;justify-self:center!important;object-fit:contain;object-position:center}
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-head{height:64px!important;padding-top:12px!important;box-sizing:border-box}
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog):not(.lx-invoice-dialog) .lx-order-edit-head .lx-buy-direct-close{top:28px!important}
    `;
    style.textContent += `/* LX_CORPORATE_NOTICE_V197: design-system surface-weak */
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog) [data-corporate-payment]:not([hidden]){display:block!important;margin:12px 0 0!important;padding:10px 12px!important;border:0!important;border-radius:6px!important;background:#fcfaff!important;color:#625b68!important;font-size:12px!important;line-height:20px!important;font-weight:400!important}
      [data-buy-modal-direct] .lx-order-edit-dialog [data-corporate-payment][hidden]{display:none!important}
    `;
    style.textContent += `/* LX_PAYMENT_REFERENCE_V196 */
      [data-buy-modal-direct] .lx-order-reference .lx-order-edit-section{padding:18px 0!important;border-top:1px solid #e2ddeb!important;border-bottom:0!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-edit-section h3{font-size:16px!important;line-height:24px!important;margin:0 0 12px!important}
      [data-buy-modal-direct] .lx-order-reference [data-online-payment]{padding:0!important;border:0!important;border-radius:0!important;background:transparent!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-payment-tabs{gap:32px!important;margin-bottom:12px!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-payment-tabs .lx-order-channel{font-size:14px!important;line-height:22px!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-subtitle{margin:0 0 8px!important;font-size:12px!important;font-weight:400!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-quick-grid{gap:12px!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-quick{position:relative;height:48px!important;min-height:48px!important;padding:0 14px!important;gap:10px!important;font-size:12px!important;border-radius:7px!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-quick img.lx-order-logo{width:24px!important;height:24px!important;flex-basis:24px!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-quick.is-active{padding-right:14px!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-quick.is-active:after{content:none!important;display:none!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installments{margin-top:16px}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installments summary{display:flex;align-items:center;gap:12px;list-style:none;cursor:pointer;color:#979797;font-size:12px;line-height:24px}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installments summary::-webkit-details-marker{display:none}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installments summary small{font-size:10px}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installments summary .lx-order-chevron{margin-left:auto;margin-right:10px}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installments[open] summary .lx-order-chevron{transform:rotate(225deg)}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installment-note{margin:0 0 0 auto;text-align:right;color:#979797;font-size:10px;line-height:16px}
      [data-buy-modal-direct] .lx-order-reference .lx-order-edit-section.lx-order-supplement-section{margin-top:0!important;border-top:0!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-supplement-grid{row-gap:12px!important;column-gap:18px!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-supplement-grid>label{gap:6px!important;font-size:12px!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-supplement-grid input,[data-buy-modal-direct] .lx-order-reference .lx-order-invoice{height:34px!important;min-height:34px!important;padding:0 12px!important;border-radius:6px!important;font-size:12px!important}
    `;
    style.textContent += `/* LX_INSTALLMENTS_SINGLE_LEVEL_V198 */
      [data-buy-modal-direct] .lx-order-reference .lx-order-address + .lx-order-edit-section{border-top:0!important}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installment-heading{display:flex;align-items:center;gap:12px;color:#979797;font-size:12px;line-height:24px}
      [data-buy-modal-direct] .lx-order-reference .lx-order-installment-heading small{font-size:10px}
    `;
    style.textContent += `/* LX_ORDER_CARD_LAYOUT_V201 */
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card{grid-template-columns:80px minmax(0,1fr) auto!important;column-gap:14px!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-config{grid-row:1 / 3!important;align-self:center!important;transform:none!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-bottom-card{margin-bottom:0!important;padding-bottom:16px!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary{margin:18px 0 0!important;padding:0 18px!important;top:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary .lx-buy-direct-price{margin:0!important;gap:10px}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-summary .lx-buy-direct-detail{margin-top:6px!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{margin-top:24px!important;top:0!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{margin-top:12px!important;top:0!important}
    `;
    style.textContent += `/* LX_ORDER_SECTION_RHYTHM_V202 */
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-order-reference .lx-order-edit-body > .lx-order-address{margin-bottom:0!important}
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-order-reference .lx-order-edit-body > .lx-order-edit-section{margin:0!important;padding:24px 0 0!important;border:0!important}
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-order-reference .lx-order-edit-body > .lx-order-edit-section > h3{margin:0 0 12px!important;font-size:18px!important;font-weight:700!important;line-height:26px!important}
    `;
    style.textContent += `/* LX_ALIGNMENT_AND_TITLES_V203 */
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions,
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-footnote{position:relative!important;top:12px!important}
      [data-buy-modal-direct] .lx-buy-sub-dialog .lx-buy-price-line{display:grid!important;grid-template-columns:minmax(0,1fr) auto 16px!important;column-gap:8px!important;align-items:center!important}
      [data-buy-modal-direct] .lx-buy-sub-dialog .lx-buy-price-line>span{line-height:22px!important;align-self:center!important;transform:none!important;vertical-align:middle!important}
      [data-buy-modal-direct] .lx-buy-sub-dialog .lx-buy-price-line>span:nth-child(2){text-align:right!important;justify-self:end!important}
      [data-buy-modal-direct] .lx-buy-sub-dialog .lx-buy-price-line .arrow{display:flex!important;align-items:center!important;justify-content:center!important;height:22px!important;padding:0!important;margin:0!important}
    `;
    style.textContent += `/* LX_SIMPLIFIED_HEADINGS_ACTIONS_V204 */
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-order-reference .lx-order-edit-body > .lx-order-edit-section > h3{display:none!important}
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-order-reference .lx-order-edit-footer > button[data-order-save]{position:relative;top:6px!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{top:0!important}
    `;
    style.textContent += `/* LX_INVOICE_HEADER_ACTIONS_V205 */
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-invoice-dialog .lx-order-edit-head{height:64px!important;padding-top:12px!important;box-sizing:border-box}
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-invoice-dialog .lx-order-edit-head .lx-buy-direct-close{top:28px!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{top:10px!important}
    `;
    style.textContent += `/* LX_FORM_PARITY_V206 */
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-order-reference .lx-order-supplement-grid input,
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-order-reference .lx-order-supplement-grid .lx-order-invoice,
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-invoice-dialog .lx-invoice-form input{height:40px!important;min-height:40px!important;box-sizing:border-box!important}
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-invoice-dialog .lx-invoice-form input[readonly]{background:#fcfaff!important;color:#77717d!important}
    `;
    style.textContent += `/* LX_FORM_LABEL_GAP_V207 */
      [data-buy-modal-direct] .lx-order-edit-dialog.lx-order-reference .lx-order-supplement-grid > label{gap:10px!important}
    `;
    style.textContent += `/* LX_BUTTON_OFFSETS_V208 */
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-buy-direct-actions{top:16px!important}
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-config{transform:translateY(-8px)!important}
    `;
    style.textContent += `/* LX_FOOTER_PARITY_V209 */
      [data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card .lx-buy-direct-config{font-weight:400!important}
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer{height:84px!important;min-height:84px!important;box-sizing:border-box!important;padding:16px 32px 24px!important;display:flex!important;align-items:center!important;flex-shrink:0!important}
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer > button[data-order-save],
      [data-buy-modal-direct] .lx-order-edit-dialog:not(.lx-config-dialog) .lx-order-edit-footer > button[data-invoice-save]{position:static!important;top:auto!important;bottom:auto!important;transform:none!important;margin:0!important;align-self:center!important;width:164px!important;height:44px!important;min-height:44px!important}
    `;
    style.textContent += `html body [data-buy-modal-direct] .lx-buy-direct-dialog:has(>.lx-buy-payment-success){width:min(460px,calc(100vw - 32px))!important;height:auto!important;min-height:0!important;max-height:calc(100vh - 32px)!important;padding:32px 24px 24px!important;overflow:auto!important}html body [data-buy-modal-direct] .lx-buy-payment-success{height:auto!important;min-height:0!important;padding:12px 0 0!important}html body [data-buy-modal-direct] .lx-buy-payment-success-card{margin:18px 0!important}`;
    style.textContent += `/* LX_INVOICE_AND_PAYMENT_FLOW_V59 */
      [data-buy-modal-direct] .lx-invoice-form textarea{width:100%;min-height:72px;box-sizing:border-box;padding:10px 12px;border:1px solid #d9cfdd;border-radius:6px;background:#fff;color:#2b272d;font:12px/18px "Source Han Sans CN","PingFang SC",sans-serif;outline:none;resize:vertical}
      [data-buy-modal-direct] .lx-invoice-form textarea:focus{border-color:#681057}
      [data-buy-modal-direct] .lx-invoice-delay-field{margin-top:14px}
      [data-buy-modal-direct] .lx-invoice-delay-trigger{width:100%;display:grid;grid-template-columns:100px minmax(0,1fr) 16px;gap:12px;align-items:center;min-height:44px;padding:0 12px;border:1px solid #d9cfdd;border-radius:6px;background:#fff;color:#454047;text-align:left;cursor:pointer}
      [data-buy-modal-direct] .lx-invoice-delay-value{color:#8d8790}.lx-invoice-delay-value.has-value{color:#2b272d}
      [data-buy-modal-direct] .lx-invoice-delay-chevron{width:7px;height:7px;justify-self:end;border-right:1px solid #8c8790;border-bottom:1px solid #8c8790;transform:rotate(-45deg)}
      [data-buy-modal-direct] .lx-invoice-delay-help{margin:8px 0 0 112px;color:#8b858e;font-size:11px;line-height:18px}
      [data-buy-modal-direct] .lx-invoice-notice-entry{margin-left:auto;margin-right:30px;padding:0;border:0;background:transparent;color:#681057;font:12px "Source Han Sans CN","PingFang SC",sans-serif;cursor:pointer}
      [data-buy-modal-direct] .lx-invoice-delay-layer,[data-buy-modal-direct] .lx-invoice-notice-layer{position:absolute;inset:0;z-index:8;display:grid;place-items:center;padding:16px;background:rgba(31,20,38,.55)}
      [data-buy-modal-direct] .lx-invoice-delay-dialog{width:min(420px,calc(100vw - 32px));padding:0;border-radius:12px;background:#fff;box-shadow:0 18px 52px rgba(31,20,38,.2);overflow:hidden}
      [data-buy-modal-direct] .lx-invoice-delay-head{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;border-bottom:1px solid #e8e2eb}
      [data-buy-modal-direct] .lx-invoice-delay-head h3{margin:0;font-size:17px}.lx-invoice-delay-close{border:0;background:transparent;color:#77717d;font-size:22px;cursor:pointer}
      [data-buy-modal-direct] .lx-invoice-delay-body{padding:22px}.lx-invoice-delay-note{margin:0 0 16px;color:#77717d;line-height:19px}.lx-invoice-delay-date-label{display:grid;gap:8px;color:#454047}.lx-invoice-delay-date{height:42px;padding:0 12px;border:1px solid #d9cfdd;border-radius:6px;font:inherit}
      [data-buy-modal-direct] .lx-invoice-delay-footer{display:flex;justify-content:flex-end;gap:10px;padding:14px 22px 18px;border-top:1px solid #e8e2eb}.lx-invoice-delay-footer button{height:36px;padding:0 18px;border:1px solid #d3bfd2;border-radius:100px;background:#fff;color:#4d144a;cursor:pointer}.lx-invoice-delay-footer .primary{border:0;background:linear-gradient(90deg,#4d144a,#b8252e);color:#fff}
      [data-buy-modal-direct] .lx-invoice-notice-dialog{width:min(760px,calc(100vw - 32px));max-height:calc(100vh - 32px);display:flex;flex-direction:column;border-radius:12px;background:#fff;box-shadow:0 18px 52px rgba(31,20,38,.2);overflow:hidden}
      [data-buy-modal-direct] .lx-invoice-notice-body{min-height:0;padding:28px 30px 20px;overflow:auto;color:#5f5a62;font-size:13px;line-height:1.75}
      [data-buy-modal-direct] .lx-invoice-notice-body h3{margin:0 0 8px;color:#29262b;font-size:15px}.lx-invoice-notice-body h3:not(:first-child){margin-top:20px}.lx-invoice-notice-body ol{margin:0;padding-left:24px}
      [data-buy-modal-direct] .lx-invoice-notice-footer{display:flex;justify-content:flex-end;padding:16px 30px;border-top:1px solid #e8e2eb}.lx-invoice-notice-footer button{width:132px;height:38px;border:0;border-radius:100px;background:linear-gradient(90deg,#4d144a,#b8252e);color:#fff;font-weight:600;cursor:pointer}
      .lx-payment-chat-card.answer-cta{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;width:min(100%,300px);min-height:70px;margin:11px 0 6px;padding:13px 14px;border:1px solid var(--answer-card-border,#e2ddeb);border-radius:14px;background:var(--answer-card-bg,#fcfaff);color:#252525;cursor:pointer;overflow:hidden;box-shadow:var(--answer-card-shadow,0 3px 10px rgba(77,20,74,.035));text-align:left;font-family:inherit}
      .lx-payment-chat-card .answer-cta-copy{position:relative;z-index:1;display:grid;gap:3px;flex:1;min-width:0;text-align:left}.lx-payment-chat-card .answer-cta-title{display:block;max-width:100%;overflow:hidden;color:var(--answer-card-title,#4d144a);font-size:13.5px;font-weight:600;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}.lx-payment-chat-card .answer-cta-icon{position:relative;z-index:1;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;flex:none;border:1px solid var(--answer-card-icon-border,rgba(155,142,182,.62));border-radius:50%;background:var(--answer-card-icon-bg,rgba(255,255,255,.72))}.lx-payment-chat-card .answer-cta-icon:before{content:"";width:9px;height:9px;border-top:1.5px solid var(--answer-card-arrow,rgba(155,142,182,.62));border-right:1.5px solid var(--answer-card-arrow,rgba(155,142,182,.62));transform:translateX(-2px) rotate(45deg)}.lx-payment-chat-card-state,.lx-payment-chat-card-desc{display:none!important}
      @media(max-width:620px){[data-buy-modal-direct] .lx-invoice-delay-help{margin-left:0}[data-buy-modal-direct] .lx-invoice-delay-trigger{grid-template-columns:92px minmax(0,1fr) 16px}[data-buy-modal-direct] .lx-invoice-notice-body{padding:22px 20px 16px}}
    `;
    style.textContent += `/* LX_CHECKOUT_ADDRESS_INVOICE_V57 */
      [data-buy-modal-direct] .lx-order-address-copy{min-width:0;display:grid;gap:4px}
      [data-buy-modal-direct] .lx-order-address-copy strong{overflow:hidden;color:#252126;font-size:13px;line-height:19px;text-overflow:ellipsis;white-space:nowrap}
      [data-buy-modal-direct] .lx-order-address-copy span{overflow:hidden;color:#6f6872;font-size:12px;line-height:18px;text-overflow:ellipsis;white-space:nowrap}
      [data-buy-modal-direct] .lx-address-dialog,[data-buy-modal-direct] .lx-invoice-dialog{width:min(620px,calc(100vw - 32px))!important;height:min(560px,calc(100vh - 32px))!important;min-height:min(560px,calc(100vh - 32px))!important}
      [data-buy-modal-direct] .lx-address-head{padding:0 32px}
      [data-buy-modal-direct] .lx-address-tabs{height:100%;display:flex;align-items:center;gap:32px}
      [data-buy-modal-direct] .lx-address-tabs button{position:relative;height:100%;padding:0;border:0;background:transparent;color:#1d191f;font:600 18px/26px "Source Han Sans CN","PingFang SC",sans-serif;cursor:pointer}
      [data-buy-modal-direct] .lx-address-tabs button.is-active{color:#681057}
      [data-buy-modal-direct] .lx-address-tabs button.is-active::after{content:"";position:absolute;right:0;bottom:10px;left:0;height:3px;border-radius:3px;background:linear-gradient(90deg,#4d144a,#b8252e)}
      [data-buy-modal-direct] .lx-address-select-body{padding:24px 32px!important}
      [data-buy-modal-direct] .lx-address-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 18px}
      [data-buy-modal-direct] .lx-address-card{position:relative;min-height:112px;box-sizing:border-box;border:1px solid #eee8f0;border-radius:10px;background:#fbf9fc;overflow:hidden}
      [data-buy-modal-direct] .lx-address-card.is-selected{border-color:#681057;background:linear-gradient(135deg,#fff8fc,#f0f2ff);box-shadow:0 0 0 1px rgba(184,37,46,.35)}
      [data-buy-modal-direct] .lx-address-card-main{width:100%;height:100%;min-height:112px;display:grid;align-content:start;gap:12px;padding:18px 42px 18px 20px;border:0;background:transparent;color:#242025;text-align:left;cursor:pointer}
      [data-buy-modal-direct] .lx-address-card-main strong{display:flex;align-items:center;gap:10px;font-size:14px;line-height:20px}
      [data-buy-modal-direct] .lx-address-card-main strong span:last-child{font-weight:500}
      [data-buy-modal-direct] .lx-address-card-main em{padding:3px 7px;border-radius:3px;background:#681057;color:#fff;font-size:10px;font-style:normal;font-weight:500}
      [data-buy-modal-direct] .lx-address-card-main small{display:-webkit-box;overflow:hidden;color:#655f67;font-size:12px;line-height:19px;-webkit-box-orient:vertical;-webkit-line-clamp:2}
      [data-buy-modal-direct] .lx-address-card-edit{position:absolute;top:12px;right:12px;width:26px;height:26px;padding:0;border:0;background:transparent;color:#9c6e98;font-size:18px;line-height:26px;cursor:pointer}
      [data-buy-modal-direct] .lx-address-create-body{padding:28px 40px!important}
      [data-buy-modal-direct] .lx-address-form{display:grid;grid-template-columns:82px minmax(0,1fr);gap:18px 16px;align-items:center}
      [data-buy-modal-direct] .lx-address-form>label{color:#242025;font-size:14px;font-weight:600}
      [data-buy-modal-direct] .lx-address-form>input,[data-buy-modal-direct] .lx-address-form>select,[data-buy-modal-direct] .lx-address-form>textarea{width:100%;box-sizing:border-box;border:1px solid #e6dfeb;border-radius:5px;background:#fcfaff;color:#2b272d;font:13px/20px "Source Han Sans CN","PingFang SC",sans-serif;outline:none}
      [data-buy-modal-direct] .lx-address-form>input,[data-buy-modal-direct] .lx-address-form>select{height:44px;padding:0 14px}
      [data-buy-modal-direct] .lx-address-form>textarea{height:98px;padding:12px 14px;resize:none}
      [data-buy-modal-direct] .lx-address-form>input:focus,[data-buy-modal-direct] .lx-address-form>select:focus,[data-buy-modal-direct] .lx-address-form>textarea:focus{border-color:#681057;box-shadow:0 0 0 2px rgba(104,16,87,.08)}
      [data-buy-modal-direct] .lx-address-default{grid-column:1/-1;display:flex;align-items:center;gap:8px!important;margin-top:12px;color:#69636c!important;font-weight:400!important;cursor:pointer}
      [data-buy-modal-direct] .lx-address-default input{width:18px;height:18px;margin:0;accent-color:#681057}
      [data-buy-modal-direct] .lx-address-footer button,[data-buy-modal-direct] .lx-invoice-notice-footer button{width:164px!important;height:44px!important}
      [data-buy-modal-direct] .lx-invoice-type-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center}
      [data-buy-modal-direct] .lx-invoice-type-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      [data-buy-modal-direct] .lx-invoice-type-grid .lx-order-channel{min-height:42px;place-items:center;padding:8px 6px;text-align:center}
      [data-buy-modal-direct] .lx-invoice-notice-entry{margin:0!important;padding:0;border:0;background:transparent;color:#681057;font:12px/20px "Source Han Sans CN","PingFang SC",sans-serif;white-space:nowrap;cursor:pointer}
      [data-buy-modal-direct] .lx-invoice-delay-field{display:grid;grid-template-columns:80px minmax(0,1fr);gap:8px 8px;align-items:center;margin-top:14px}
      [data-buy-modal-direct] .lx-invoice-delay-field>label{color:#454047;font-size:12px;line-height:18px}
      [data-buy-modal-direct] .lx-invoice-delay-trigger{grid-template-columns:minmax(0,1fr) 16px;gap:12px}
      [data-buy-modal-direct] .lx-invoice-delay-help{grid-column:2;margin:0;color:#8b858e;font-size:11px;line-height:18px}
      [data-buy-modal-direct] .lx-invoice-notice-view .lx-invoice-notice-body{padding:20px 32px!important;overflow:auto;color:#5f5a62;font-size:12px;line-height:1.7}
      [data-buy-modal-direct] .lx-invoice-notice-view .lx-invoice-notice-body section{padding:18px 22px;border-radius:10px;background:#fbf9fc}
      [data-buy-modal-direct] .lx-invoice-notice-view .lx-invoice-notice-body h3{margin:0 0 8px;color:#29262b;font-size:14px}
      [data-buy-modal-direct] .lx-invoice-notice-view .lx-invoice-notice-body h3:not(:first-child){margin-top:16px}
      [data-buy-modal-direct] .lx-invoice-notice-view .lx-invoice-notice-body ol{margin:0;padding-left:22px}
      [data-buy-modal-direct] .lx-invoice-notice-view .lx-invoice-notice-footer{display:flex;justify-content:flex-end;padding:16px 32px!important}
      @media(max-width:620px){[data-buy-modal-direct] .lx-address-grid{grid-template-columns:1fr}[data-buy-modal-direct] .lx-address-create-body{padding:20px 18px!important}[data-buy-modal-direct] .lx-address-form{grid-template-columns:64px minmax(0,1fr);gap:14px 10px}[data-buy-modal-direct] .lx-invoice-type-row{grid-template-columns:1fr}[data-buy-modal-direct] .lx-invoice-notice-entry{justify-self:end}[data-buy-modal-direct] .lx-invoice-delay-field{grid-template-columns:80px minmax(0,1fr)}}
    `;
    style.textContent += '[data-purchase-options] .lx-config-option{overflow:hidden;text-overflow:ellipsis}[data-buy-modal-direct] [hidden]{display:none!important}';
    style.textContent += `/* checkout-benefit-info-v65 */ [data-buy-modal-direct] .lx-benefit-info{display:inline-flex;align-items:center;justify-content:center;flex:0 0 20px;width:20px;height:20px;min-width:0;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:#918b99;cursor:pointer;vertical-align:middle;line-height:1}[data-buy-modal-direct] .lx-benefit-info:hover{color:#681057}[data-buy-modal-direct] .lx-benefit-info:focus-visible{outline:2px solid #681057;outline-offset:2px}[data-buy-modal-direct] .lx-benefit-info svg{display:block}`;
    document.head.appendChild(style);
  }

  const normalizeHistoricPaymentCards = (root = document) => {
    const cards = [...(root.matches?.('.lx-payment-chat-card') ? [root] : []), ...(root.querySelectorAll?.('.lx-payment-chat-card') || [])];
    cards.forEach((card) => {
      card.classList.add('answer-cta');
      card.classList.remove('is-paid');
      card.querySelectorAll('.lx-payment-chat-card-state,.lx-payment-chat-card-desc').forEach((node) => node.remove());
      let title = card.querySelector('.lx-payment-chat-card-title');
      if (!title) {
        title = document.createElement('span');
        title.className = 'lx-payment-chat-card-title';
        card.prepend(title);
      }
      title.classList.add('answer-cta-title');
      if (title.textContent.trim() !== '支付信息待确认') title.textContent = '支付信息待确认';
      if (!title.closest('.answer-cta-copy')) {
        const copy = document.createElement('span');
        copy.className = 'answer-cta-copy';
        title.before(copy);
        copy.appendChild(title);
      }
      let icon = card.querySelector('.lx-payment-chat-card-icon');
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'lx-payment-chat-card-icon';
        icon.setAttribute('aria-hidden', 'true');
        card.appendChild(icon);
      }
      icon.classList.add('answer-cta-icon');
    });
  };
  normalizeHistoricPaymentCards();
  const historicPaymentCardObserver = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) normalizeHistoricPaymentCards(node);
  })));
  if (document.documentElement) historicPaymentCardObserver.observe(document.documentElement, { childList: true, subtree: true });

  const visibleDetailProduct = button => window.__lxPurchaseContext.fromButton(button);

  const repairedImages = new WeakSet();
  const repairProductImages = (root = document) => {
    const images = [...(root.matches?.('img') ? [root] : []), ...(root.querySelectorAll?.('img') || [])];
    images.forEach((image) => {
      if (repairedImages.has(image)) return;
      repairedImages.add(image);
      const label = `${image.alt || ''} ${image.closest('.detail-main, .product-detail')?.textContent || ''}`;
      if (/小新\s*Air\s*13/i.test(label)) image.src = AIR_13_IMAGE;
      image.addEventListener('error', () => {
        if (image.src.endsWith(FALLBACK_IMAGE)) return;
        image.src = /小新\s*Air\s*13/i.test(label) ? AIR_13_IMAGE : FALLBACK_IMAGE;
      }, { once: true });
    });
  };

  const showToast = (message, duration = 2400) => {
    let toast = document.querySelector('.lx-p0-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'lx-p0-toast';
      document.body.appendChild(toast);
    }
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
  };

  const openOrderModal = (product) => {
    if (!product || !product.name || !(Number(product.price) > 0)) { showToast("商品数据不完整，请重新选择商品"); return; }
    const previousModal = document.querySelector('[data-buy-modal-direct]');
    previousModal?._lxCleanup?.();
    previousModal?.remove();
    document.querySelectorAll('.lx-p0-toast').forEach((toast) => toast.classList.remove('show'));
    const modal = document.createElement('div');
    modal.dataset.buyModalDirect = 'true';
    const orderState = { payment: '支付宝', expanded: '', note: '请工作日送达，送货前电话联系', customerCode: 'CUS-BJ-20260803', addressId: 'address-1', recipientName: '联小想', recipientPhone: '13028280000', recipientRegion: '北京市海淀区中关村软件园2期', recipientDetail: '北京联想总部东区E1', invoice: '普通发票-个人', invoiceDraft: '增值税专票', invoiceTitle: '个人', invoiceTaxNo: '123123123123123', invoicePhone: '13504289879', invoiceEmail: 'ziyu@lenovo.com', invoiceAddress: '北京市海淀区上地西路6号', invoiceRegisteredPhone: '01058868888', invoiceBank: '招商银行北京双榆树支行', invoiceBankAccount: '861580122210002', invoiceRemark: '', invoiceDelayDate: '', invoiceConsent: true };
    const addressBook = [
      { id: 'address-1', name: '联小想', phone: '13028280000', region: '北京市海淀区中关村软件园2期', detail: '北京联想总部东区E1', isDefault: true },
      { id: 'address-2', name: '李晓宁', phone: '13810001234', region: '北京市海淀区西北旺镇', detail: '中关村软件园一期8号楼' },
      { id: 'address-3', name: '王晨', phone: '13610005678', region: '北京市朝阳区望京街道', detail: '阜通东大街6号院' },
      { id: 'address-4', name: '陈思远', phone: '13910008765', region: '上海市浦东新区张江镇', detail: '祖冲之路2290号' },
      { id: 'address-5', name: '赵敏', phone: '13710004321', region: '广东省深圳市南山区粤海街道', detail: '科技园南区高新南一道' }
    ];
    const selectedAddress = () => addressBook.find((address) => address.id === orderState.addressId) || addressBook[0];
    const applyAddress = (address) => {
      orderState.addressId = address.id;
      orderState.recipientName = address.name;
      orderState.recipientPhone = address.phone;
      orderState.recipientRegion = address.region;
      orderState.recipientDetail = address.detail;
    };
    const recipientAddress = () => `${orderState.recipientRegion}${orderState.recipientDetail}`;
    const configState = product.sku ? { color: product.color || '', size: product.size || '以商品详情为准', spec: product.configuration || '以所选商品详情为准', quantity: 1 } : { color: '凝雾灰', size: '13英寸', spec: '8GB+256GB WIFI', quantity: 1 };
    const initialCouponAmount = Number(product.discount) || 0;
    const benefitState = { couponId: initialCouponAmount ? 'coupon-best' : 'coupon-none', couponAmount: initialCouponAmount, beanPoints: 0, beanAmount: 0, redPacketAmount: 0 };
    const payableAmount = () => Math.max(0, (Number(product.originalPrice) || 0) * configState.quantity - benefitState.couponAmount - benefitState.beanAmount - benefitState.redPacketAmount);
    const totalDiscount = () => benefitState.couponAmount + benefitState.beanAmount + benefitState.redPacketAmount;
    const invoicePreview = () => orderState.invoice === '普通发票-个人' ? '电子普通发票（个人）' : orderState.invoice === '普通发票-单位' ? '电子普通发票（单位）' : '增值税专用发票';
    const orderHtml = () => `<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><h2 id="lxBuyDirectTitle">联想乐享为你生成订单</h2><div class="lx-buy-direct-card"><div class="lx-order-product-card"><div class="lx-buy-direct-product"><img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"><div class="lx-buy-direct-product-copy"><strong>${escapeHtml(product.name)}</strong><span>X${configState.quantity}</span></div><button class="lx-buy-direct-config" type="button" data-edit-config>修改配置<i aria-hidden="true"></i></button></div><div class="lx-buy-direct-section lx-buy-direct-product-spec"><div class="lx-buy-direct-row"><strong>系列：</strong><span>Lenovo</span></div><div class="lx-buy-direct-row"><strong>型号：</strong><span title="${escapeHtml(product.name)}">${escapeHtml(product.series || product.name)}</span></div><div class="lx-buy-direct-row"><strong>尺寸：</strong><span>${escapeHtml(configState.size)}</span></div><div class="lx-buy-direct-row"><strong>配置：</strong><span title="${escapeHtml(configState.spec)}">${escapeHtml(product.configurationLabel || configState.spec)}${configState.color ? " · " + escapeHtml(configState.color) : ""}</span></div></div></div><div class="lx-buy-direct-section lx-order-shipping"><div class="lx-buy-direct-row"><strong>收货信息：</strong><span>${escapeHtml(orderState.recipientName)}　${escapeHtml(orderState.recipientPhone)}</span></div><div class="lx-buy-direct-row"><strong>收货地址：</strong><span>${escapeHtml(recipientAddress())}</span></div></div><div class="lx-buy-direct-section lx-order-payment"><div class="lx-buy-direct-row"><strong>支付方式：</strong><span data-order-preview-payment>${escapeHtml(orderState.payment.includes('支付') || orderState.payment.includes('分期') ? orderState.payment : `${orderState.payment}支付`)}</span></div><div class="lx-buy-direct-row"><strong>发票信息：</strong><span data-order-preview-invoice>${escapeHtml(invoicePreview())}</span></div></div><div class="lx-order-summary"><div class="lx-buy-direct-price"><strong>等待支付：</strong><b>¥${payableAmount().toLocaleString('zh-CN')}</b><span>节省了：<em>¥${totalDiscount().toLocaleString('zh-CN')}</em></span></div><div class="lx-buy-direct-detail"><button class="lx-buy-direct-detail-button" type="button" data-price-detail>查看价格明细</button><span>可修改优惠券/乐豆等优惠</span><button type="button" class="lx-benefit-info" data-benefit-info aria-label="优惠使用说明"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/></svg></button></div></div><div class="lx-buy-direct-actions"><button type="button" data-edit-order>修改订单</button><button type="button" class="primary" data-pay-now>立即支付</button></div><p class="lx-buy-direct-footnote">*修改配置包括商品配置及数量；修改订单包括收货地址、支付方式、发票等</p></div>`;
    modal.innerHTML = `<div class="lx-buy-direct-mask"></div><section class="lx-buy-direct-dialog" role="dialog" aria-modal="true" aria-labelledby="lxBuyDirectTitle">${orderHtml()}</section>`;
    document.body.appendChild(modal);
    modal.querySelector('img')?.addEventListener('error', (event) => { event.currentTarget.src = FALLBACK_IMAGE; }, { once: true });
    const dialog = modal.querySelector('.lx-buy-direct-dialog');
    const mountNationalSubsidy = () => {
      const payment = dialog.querySelector('.lx-order-payment');
      if (!payment || dialog.querySelector('.lx-buy-national-subsidy')) return;
      const shipping = dialog.querySelector('.lx-order-shipping');
      if (shipping && !dialog.querySelector('.lx-order-bottom-card')) {
        const bottomCard = document.createElement('div');
        bottomCard.className = 'lx-order-bottom-card';
        shipping.before(bottomCard);
        bottomCard.append(shipping, payment);
      }
      payment.insertAdjacentHTML('afterend', '<button class="lx-buy-national-subsidy" type="button" data-claim-national-subsidy><span><strong>国家补贴资格可领取</strong><small>领取后将在结算时自动核验，价格以实际支付为准</small></span><b>立即领取</b></button>');
      const summary = dialog.querySelector('.lx-order-summary');
      const bottomCard = dialog.querySelector('.lx-order-bottom-card');
      if (summary && bottomCard) bottomCard.after(summary);
    };
    mountNationalSubsidy();

    const paymentState = { orderId: `LX${Date.now()}`, remaining: 23 * 60 * 60 + 59 * 60 + 51, timer: 0, width: 0, height: 0, paidOrder: null, paid: false, chatCard: null };
    const stopPaymentTimer = () => { if (paymentState.timer) window.clearInterval(paymentState.timer); paymentState.timer = 0; };
    modal._lxCleanup = stopPaymentTimer;
    const formatRemaining = () => {
      const hours = Math.floor(paymentState.remaining / 3600);
      const minutes = Math.floor((paymentState.remaining % 3600) / 60);
      const seconds = paymentState.remaining % 60;
      return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
    };
    const lockPaymentDialogSize = () => {
      if (!paymentState.width || !paymentState.height) {
        const rect = dialog.getBoundingClientRect();
        paymentState.width = Math.round(rect.width);
        paymentState.height = Math.round(rect.height);
      }
      dialog.style.width = `${paymentState.width}px`;
      dialog.style.height = `${paymentState.height}px`;
    };
    const persistPaidOrder = () => {
      if (paymentState.paidOrder) return paymentState.paidOrder;
      const benefits = [];
      if (benefitState.couponAmount) benefits.push(`优惠券 -¥${benefitState.couponAmount.toLocaleString('zh-CN')}`);
      if (benefitState.beanAmount) benefits.push(`乐豆 -¥${benefitState.beanAmount.toLocaleString('zh-CN')}`);
      if (benefitState.redPacketAmount) benefits.push(`限时红包 -¥${benefitState.redPacketAmount.toLocaleString('zh-CN')}`);
      const paidOrder = {
        sku: product.sku || product.name,
        name: product.name,
        image_url: product.image_url,
        category: product.category || '联想商品',
        type: 'normal',
        typeLabel: '普通订单',
        price: payableAmount(),
        paidAmount: payableAmount(),
        payable: payableAmount(),
        originalPrice: (Number(product.originalPrice) || 0) * configState.quantity,
        discountAmount: totalDiscount(),
        quantity: configState.quantity,
        configurationLabel: `${configState.size}｜${configState.spec}｜${configState.color}`,
        orderId: paymentState.orderId,
        createdAt: new Date().toLocaleString('zh-CN'),
        paidAt: new Date().toLocaleString('zh-CN'),
        status: '待发货',
        address: { name: orderState.recipientName, phone: orderState.recipientPhone, region: orderState.recipientRegion, detail: orderState.recipientDetail },
        recipient: { name: orderState.recipientName, phone: orderState.recipientPhone, address: recipientAddress() },
        shippingAddress: recipientAddress(),
        note: orderState.note,
        customerCode: orderState.customerCode,
        payMethod: orderState.payment,
        paymentMethod: orderState.payment,
        invoice: { text: invoicePreview(), type: orderState.invoice, title: orderState.invoiceTitle, remark: orderState.invoiceRemark, delayDate: orderState.invoice === '增值税专票' ? orderState.invoiceDelayDate : '' },
        invoiceText: invoicePreview(),
        benefitNote: benefits.join('、')
      };
      let orders = Array.isArray(window.__lxState?.orders) ? window.__lxState.orders : [];
      orders = orders.filter((item) => item?.orderId !== paidOrder.orderId);
      orders.unshift(paidOrder);
      if (window.__lxState) window.__lxState.orders = orders;
      try { localStorage.setItem('lexiang.orders.v1', JSON.stringify(orders)); } catch (error) {}
      window.dispatchEvent(new Event('lx:orders-updated'));
      paymentState.paidOrder = paidOrder;
      return paidOrder;
    };
    const showPaymentProcessing = () => {
      modal.hidden = false;
      lockPaymentDialogSize();
      stopPaymentTimer();
      dialog.className = 'lx-buy-direct-dialog lx-payment-dialog';
      dialog.innerHTML = `<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><h2 id="lxBuyDirectTitle">正在支付</h2><div class="lx-payment-stage"><p class="lx-payment-state">正在支付</p><div class="lx-payment-wait"><strong>待付款</strong><span>剩余：<b class="lx-payment-countdown" data-payment-countdown>${formatRemaining()}</b></span></div><p class="lx-payment-product">【${escapeHtml(product.name)}】正在支付中，请稍等...</p></div><div class="lx-payment-actions"><button type="button" data-go-pay>去支付</button><button type="button" class="primary" data-confirm-payment>确认支付状态</button></div>`;
      paymentState.timer = window.setInterval(() => {
        paymentState.remaining = Math.max(0, paymentState.remaining - 1);
        const countdown = dialog.querySelector('[data-payment-countdown]');
        if (countdown) countdown.textContent = formatRemaining();
        if (!paymentState.remaining) stopPaymentTimer();
      }, 1000);
    };
    const showPaymentSuccess = () => {
      stopPaymentTimer();
      const paidOrder = persistPaidOrder();
      paymentState.paid = true;
      updatePaymentChatCard();
      modal.hidden = false;
      lockPaymentDialogSize();
      dialog.className = 'lx-buy-direct-dialog lx-payment-dialog';
      dialog.innerHTML = `<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><h2 id="lxBuyDirectTitle">支付成功</h2><div class="lx-payment-stage"><span class="lx-payment-success-icon" aria-hidden="true">✓</span><strong class="lx-payment-success-title">订单支付成功</strong><p class="lx-payment-success-meta">订单号：<b>${escapeHtml(paidOrder.orderId)}</b><br>实付：<b>¥${payableAmount().toLocaleString('zh-CN')}</b></p></div><div class="lx-payment-actions"><button type="button" class="primary" data-view-paid-order>查看订单</button></div>`;
    };
    const updatePaymentChatCard = () => {
      const card = paymentState.chatCard;
      if (!card?.isConnected) return;
      card.setAttribute('aria-label', `查看${product.name}的支付信息`);
    };
    const openPaymentFromChatCard = () => {
      if (!modal.isConnected) return;
      if (paymentState.paid) showPaymentSuccess();
      else showPaymentProcessing();
      dialog.querySelector('.lx-buy-direct-close')?.focus();
    };
    const appendPaymentChatCard = () => {
      if (paymentState.chatCard?.isConnected) return;
      const query = `立即支付【${product.name}】`;
      const splitHost = document.querySelector('.lx-p0-messages');
      const host = splitHost || document.querySelector('.lxfd-thread');
      if (!host) { showPaymentProcessing(); return; }
      const fullscreen = host.classList.contains('lxfd-thread');
      if (fullscreen) {
        const shell = host.closest('.lxfd');
        const stage = host.closest('.lxfd-stage');
        const welcome = stage?.querySelector('.lxfd-welcome');
        shell?.style.setProperty('display', 'block', 'important');
        shell?.style.setProperty('visibility', 'visible', 'important');
        welcome?.style.setProperty('display', 'none', 'important');
        host.classList.add('show');
        stage?.classList.add('is-chatting');
        document.body.classList.remove('lxfd-exiting', 'lxfd-split-returning');
        document.body.classList.add('assistant-fullscreen', 'lx-auto-fs');
        document.body.dataset.state = 'chat';
      }
      const userMessage = document.createElement('div');
      userMessage.className = fullscreen ? 'lxfd-msg-user' : 'lx-p0-message msg user';
      userMessage.dataset.lxPaymentQuery = paymentState.orderId;
      if (fullscreen) userMessage.textContent = query;
      else userMessage.innerHTML = `<div class="user-bubble">${escapeHtml(query)}</div>`;
      host.appendChild(userMessage);
      const answerMarkup = `<p>已为你打开【${escapeHtml(product.name)}】的支付页面，请完成支付。</p><button class="answer-cta lx-payment-chat-card" type="button" data-payment-chat-card="${escapeHtml(paymentState.orderId)}"><span class="answer-cta-copy"><span class="answer-cta-title lx-payment-chat-card-title">支付信息待确认</span></span><span class="answer-cta-icon lx-payment-chat-card-icon" aria-hidden="true"></span></button>`;
      let assistantMessage = splitHost ? window.__lxAgentAPI?.addAiMessage?.(answerMarkup) : null;
      if (!assistantMessage) {
        assistantMessage = document.createElement('div');
        assistantMessage.className = fullscreen ? 'lxfd-msg-ai lx-chat-skin' : 'lx-p0-message msg ai lx-chat-skin';
        assistantMessage.innerHTML = fullscreen ? `<div class="lxfd-ai-body">${answerMarkup}</div>` : `<div class="ai-body">${answerMarkup}</div>`;
        host.appendChild(assistantMessage);
      }
      paymentState.chatCard = assistantMessage.querySelector('[data-payment-chat-card]');
      paymentState.chatCard?.addEventListener('click', openPaymentFromChatCard);
      updatePaymentChatCard();
      if (window.__lxState) {
        window.__lxState.queryHistory = Array.isArray(window.__lxState.queryHistory) ? window.__lxState.queryHistory : [];
        window.__lxState.queryHistory.push(query);
      }
      window.__lxSetConversationQuery?.(query);
      host.scrollTop = host.scrollHeight;
      try { window.__lxSaveConversationNow?.(); } catch (_) {}
    };
    const openPaymentPage = () => {
      const paymentUrl = /支付宝|花呗/.test(orderState.payment) ? 'https://www.alipay.com/' : /微信/.test(orderState.payment) ? 'https://pay.weixin.qq.com/' : /京东/.test(orderState.payment) ? 'https://www.jdpay.com/' : 'https://www.alipay.com/';
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    };
    const openPaidOrderDetail = () => {
      const paidOrder = persistPaidOrder();
      stopPaymentTimer();
      modal.remove();
      window.dispatchEvent(new Event('lx:orders-updated'));

      const clickOrderCenterDetail = () => {
        const trigger = Array.from(document.querySelectorAll('[data-order-detail-id]')).find((item) => String(item.dataset.orderDetailId) === String(paidOrder.orderId));
        if (!trigger) return false;
        trigger.click();
        return true;
      };

      if (typeof window.__lxOpenOrdersCenter === 'function') {
        window.__lxOpenOrdersCenter({ question: '' });
        let attempts = 0;
        const openWhenReady = () => {
          if (clickOrderCenterDetail()) return;
          attempts += 1;
          if (attempts < 30) window.setTimeout(openWhenReady, 100);
          else showToast('订单已生成，请从右上角“订单”中查看');
        };
        window.requestAnimationFrame(openWhenReady);
        return;
      }

      // 单文件离线版保留旧订单中心，仍通过它自己的“订单详情”委托入口打开。
      window.__lxBridge?.prepareRootSplitState?.();
      window.__lxAgentAPI?.lxRevealContent?.();
      const legacyTrigger = document.createElement('button');
      legacyTrigger.type = 'button';
      legacyTrigger.hidden = true;
      legacyTrigger.dataset.orderDetail = paidOrder.orderId;
      document.body.appendChild(legacyTrigger);
      legacyTrigger.click();
      legacyTrigger.remove();
    };
    const showOrder = () => { dialog.className = 'lx-buy-direct-dialog'; dialog.innerHTML = orderHtml(); mountNationalSubsidy(); };
    const showConfigEdit = () => {
      if (product.sku) return window.__lxPurchaseContext.renderConfig({dialog, product, quantity: configState.quantity, onSelect: selected => {
        product = selected; configState.color = selected.color; configState.size = selected.size; configState.spec = selected.configuration;
        benefitState.couponId = "coupon-none"; benefitState.couponAmount = 0; benefitState.beanPoints = 0; benefitState.beanAmount = 0; benefitState.redPacketAmount = 0;
        showConfigEdit();
      }});
      const options = (name, values, disabled = []) => values.map((value) => `<button class="lx-config-option${configState[name] === value ? ' is-active' : ''}" type="button" data-config-key="${name}" data-config-value="${value}" ${disabled.includes(value) ? 'disabled' : ''}>${value}</button>`).join('');
      dialog.className = 'lx-buy-direct-dialog lx-order-edit-dialog lx-config-dialog';
      dialog.innerHTML = `<header class="lx-order-edit-head"><button class="lx-order-edit-back" type="button" data-config-back aria-label="返回"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>修改商品</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-order-edit-body"><section class="lx-config-section"><h3>颜色</h3><div class="lx-config-options">${options('color',['凝雾灰','深空灰','星空银'])}</div></section><section class="lx-config-section"><h3>尺寸</h3><div class="lx-config-options">${options('size',['11英寸','13英寸','14英寸'],['11英寸'])}</div></section><section class="lx-config-section"><h3>配置</h3><div class="lx-config-options">${options('spec',['8GB+128GB WIFI','8GB+256GB WIFI','16GB+512GB WIFI'],['8GB+128GB WIFI'])}</div></section><div class="lx-config-quantity"><div class="lx-config-quantity-copy"><h3>商品数量</h3><small>最多购买5件</small></div><div class="lx-config-stepper"><button type="button" data-config-minus ${configState.quantity <= 1 ? 'disabled' : ''}>−</button><output data-config-count>${configState.quantity}</output><button type="button" data-config-plus ${configState.quantity >= 5 ? 'disabled' : ''}>＋</button></div></div></div><footer class="lx-order-edit-footer"><button type="button" data-config-save>保存修改</button></footer>`;
      dialog.querySelector('[data-config-back]').addEventListener('click', (event) => { event.stopPropagation(); showOrder(); });
    };
    const showPriceDetail = () => {
      dialog.className = 'lx-buy-direct-dialog lx-buy-sub-dialog';
      dialog.innerHTML = `<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><header class="lx-buy-sub-head"><button class="lx-order-edit-back" type="button" data-price-back aria-label="返回"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>价格明细</h2></header><div class="lx-buy-price-list"><div class="lx-buy-price-line"><strong>商品金额</strong><span class="amount">¥${((Number(product.originalPrice) || 0) * configState.quantity).toLocaleString('zh-CN')}.00</span><span></span></div><div class="lx-buy-price-line"><strong>运费</strong><span class="amount">＋¥0.00</span><span></span></div><div class="lx-buy-price-line is-clickable" data-open-benefit="coupon"><strong>优惠券</strong><span class="discount">−¥${benefitState.couponAmount.toLocaleString('zh-CN')}.00</span><span class="arrow">›</span></div><div class="lx-buy-price-line is-clickable" data-open-benefit="beans"><strong>乐豆</strong><span class="discount">−¥${benefitState.beanAmount.toLocaleString('zh-CN')}.00</span><span class="arrow">›</span></div><div class="lx-buy-price-line is-clickable" data-open-benefit="redpacket"><strong>限时红包</strong><span class="discount">−¥${benefitState.redPacketAmount.toLocaleString('zh-CN')}.00</span><span class="arrow">›</span></div><div class="lx-buy-price-line"><strong>其他优惠</strong><span class="discount">−¥0.00</span><span></span></div><div class="lx-buy-price-line is-clickable" data-open-coupon-code><strong>优惠码</strong><span class="muted">请输入优惠码</span><span class="arrow">›</span></div></div><div class="lx-buy-sub-footer"><div class="lx-buy-sub-total"><b>¥${payableAmount().toLocaleString('zh-CN')}.00</b><span>节省了：<em>¥${totalDiscount().toLocaleString('zh-CN')}.00</em></span></div><button class="primary" type="button" data-price-confirm>确定</button></div>`;
      dialog.querySelector('[data-price-back]').addEventListener('click', (event) => { event.stopPropagation(); showOrder(); });
    };
    const showCouponCode = () => {
      dialog.className = 'lx-buy-direct-dialog lx-buy-sub-dialog';
      dialog.innerHTML = `<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><h2>使用优惠码</h2><div class="lx-buy-coupon-field"><label for="lxCouponCode">优惠码</label><input id="lxCouponCode" type="text" placeholder="请输入优惠码" autocomplete="off"><small>输入优惠码后确认领取，系统会自动更新优惠和待支付金额。</small></div><div class="lx-buy-coupon-actions"><button type="button" data-coupon-back>返回</button><button type="button" class="primary" data-coupon-confirm>确认使用</button></div>`;
      dialog.querySelector('[data-coupon-back]').addEventListener('click', (event) => { event.stopPropagation(); showPriceDetail(); });
      dialog.querySelector('input')?.focus();
    };
    const showCouponSelect = () => {
      const coupons = [
        { id: 'coupon-best', value: initialCouponAmount || 500, label: `¥${initialCouponAmount || 500}`, rule: '当前商品专享券', date: '2026.09.01–2026.09.30' },
        { id: 'coupon-300', value: 300, label: '¥300', rule: '满6000元可用', date: '2026.09.01–2026.09.30' },
        { id: 'coupon-100', value: 100, label: '¥100', rule: '满3000元可用', date: '2026.09.01–2026.09.30' },
        { id: 'coupon-none', value: 0, label: '不使用', rule: '暂不使用优惠券', date: '可随时重新选择' }
      ];
      dialog.className = 'lx-buy-direct-dialog lx-buy-sub-dialog lx-buy-benefit-dialog';
      dialog.innerHTML = `<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><header class="lx-buy-sub-head"><button class="lx-order-edit-back" type="button" data-benefit-back aria-label="返回"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>优惠券</h2></header><div class="lx-buy-benefit-list">${coupons.map((coupon) => `<button class="lx-buy-coupon-card${benefitState.couponId === coupon.id ? ' is-selected' : ''}" type="button" data-coupon-choice="${coupon.id}" data-coupon-value="${coupon.value}"><span class="lx-buy-coupon-value">${coupon.label.startsWith('¥') ? `¥<b>${coupon.label.slice(1)}</b>` : `<small>${coupon.label}</small>`}</span><span class="lx-buy-coupon-copy"><strong>${coupon.rule}</strong><span>${coupon.date}</span><span>详细说明</span></span><i class="lx-buy-benefit-radio" aria-hidden="true"></i></button>`).join('')}</div><div class="lx-buy-coupon-actions"><button type="button" data-benefit-back>返回</button><button type="button" class="primary" data-benefit-confirm>确认</button></div>`;
    };
    const showWalletBenefit = (type) => {
      const isBeans = type === 'beans';
      const title = isBeans ? '乐豆' : '限时红包';
      const value = isBeans ? benefitState.beanPoints : benefitState.redPacketAmount;
      const discount = isBeans ? benefitState.beanAmount : benefitState.redPacketAmount;
      dialog.className = 'lx-buy-direct-dialog lx-buy-sub-dialog lx-buy-benefit-dialog';
      dialog.innerHTML = `<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><header class="lx-buy-sub-head"><button class="lx-order-edit-back" type="button" data-benefit-back aria-label="返回"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>${title}</h2></header><div class="lx-buy-wallet-box"><input type="text" inputmode="${isBeans ? 'numeric' : 'decimal'}" value="${value}" data-wallet-input="${type}" aria-label="${title}使用数量"><span data-wallet-discount>已抵 ${discount} 元</span></div><p class="lx-buy-wallet-hint">共 <em>${isBeans ? '5600' : '50'}</em> ${isBeans ? '乐豆' : '元限时红包'}，此单最高可用 <em>${isBeans ? '5600 乐豆，抵 56' : '50'}</em> 元</p><div class="lx-buy-coupon-actions"><button type="button" data-benefit-back>返回</button><button type="button" class="primary" data-wallet-confirm="${type}">确定</button></div>`;
      dialog.querySelector('[data-wallet-input]')?.focus();
    };
    const quickPaymentNames = ['支付宝', '花呗', '微信支付', '京东支付'];
    let lastOnlinePayment = orderState.payment === '对公支付' ? '支付宝' : orderState.payment;
    const updatePaymentFooter = () => {
      const selected = dialog.querySelector('[data-order-selected-payment]');
      if (!selected) return;
      const corporate = orderState.payment === '对公支付';
      selected.classList.toggle('is-corporate', corporate);
      selected.setAttribute('aria-live', 'polite');
      const paymentName = String(orderState.payment).split(' · ')[0];
      selected.innerHTML = corporate
        ? ''
        : [...quickPaymentNames, '花呗分期', '信用卡分期'].includes(paymentName) ? `<span>支付方式：</span><strong>${escapeHtml(paymentName)}</strong>` : '';
    };
    const showOrderEdit = () => {
      const quick = [['支付宝','/assets/icons/payment-alipay-reference.svg'],['花呗','/assets/icons/payment-huabei-official.svg'],['微信支付','/assets/icons/payment-wechat-reference.svg'],['京东支付','/assets/icons/payment-jd-official.svg']];
      const providers = [['huabei','花呗分期','/assets/icons/payment-huabei-official.svg'],['credit','信用卡分期','/assets/icons/payment-credit-card.svg']];
      const plans = [[3,.023],[6,.045],[12,.075]];
      const quickHtml = quick.map(([name, logo]) => `<button class="lx-order-quick${orderState.payment === name ? ' is-active' : ''}" type="button" data-order-payment="${name}"><img class="lx-order-logo" src="${logo}" alt="" aria-hidden="true">${name}</button>`).join('');
      const providersHtml = providers.map(([id, name, logo]) => {
        const planHtml = plans.map(([period, rate]) => { const value = `${name} · ${period}期`; const monthly = Math.round(payableAmount() * (1 + rate) / period).toLocaleString('zh-CN'); return `<button class="lx-order-plan${orderState.payment === value ? ' is-active' : ''}" type="button" data-order-payment="${value}"><strong class="lx-order-plan-term">${period}期</strong><span class="lx-order-plan-cost"><b>¥${monthly}/期</b><small>费率 ${(rate * 100).toFixed(2)}%</small></span><i class="lx-order-radio"></i></button>`; }).join('');
        return `<div><button class="lx-order-provider${orderState.expanded === id ? ' is-expanded' : ''}" type="button" data-order-provider="${id}"><img class="lx-order-logo" src="${logo}" alt="" aria-hidden="true"><b>${name}</b><small>支持 3、6 或 12 期</small><i class="lx-order-chevron"></i></button><div class="lx-order-plan-grid" ${orderState.expanded === id ? '' : 'hidden'}>${planHtml}</div></div>`;
      }).join('');
      const codes = ['CUS-BJ-20260803','CUS-SH-20260718','CUS-GZ-20260626'];
      dialog.className = 'lx-buy-direct-dialog lx-order-edit-dialog';
      const isCorporate = orderState.payment === '对公支付';
      dialog.innerHTML = `<header class="lx-order-edit-head"><button class="lx-order-edit-back" type="button" data-order-back aria-label="返回"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>修改订单</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-order-edit-body"><div class="lx-order-address"><img src="/assets/icons/order-address-location.svg" alt="" aria-hidden="true"><div class="lx-order-address-copy"><strong>${escapeHtml(orderState.recipientName)}　${escapeHtml(orderState.recipientPhone)}</strong><span>${escapeHtml(recipientAddress())}</span></div><button type="button" data-address-edit>修改地址</button></div><section class="lx-order-edit-section"><h3>选择支付方式</h3><div class="lx-order-payment-tabs" role="tablist" aria-label="支付方式"><button class="lx-order-channel${isCorporate ? '' : ' is-active'}" type="button" role="tab" aria-selected="${!isCorporate}" data-order-channel="online">在线支付</button><button class="lx-order-channel${isCorporate ? ' is-active' : ''}" type="button" role="tab" aria-selected="${isCorporate}" data-order-channel="corporate">对公支付</button></div><div data-online-payment ${isCorporate ? 'hidden' : ''}><div class="lx-order-subtitle">快捷支付</div><div class="lx-order-quick-grid">${quickHtml}</div><div class="lx-order-subtitle"><span>分期支付</span><small>*手续费以支付平台实际收取为准</small></div>${providersHtml}</div><div class="lx-order-corporate-panel" data-corporate-payment ${isCorporate ? '' : 'hidden'}>提交订单后将由企业客户经理与您确认付款及增值税专用发票信息。</div></section><section class="lx-order-edit-section lx-order-supplement-section"><h3>订单补充信息</h3><div class="lx-order-supplement-grid"><label class="lx-order-supplement-note" for="lxOrderNote"><span>订单备注</span><input id="lxOrderNote" data-order-note value="${escapeHtml(orderState.note)}"></label><label for="lxOrderCustomer"><span>客户编码</span><div class="lx-order-combobox"><input id="lxOrderCustomer" data-order-customer value="${escapeHtml(orderState.customerCode)}" readonly aria-haspopup="listbox" aria-expanded="false"><div class="lx-order-code-menu" data-order-code-menu role="listbox" hidden>${codes.map((code) => `<button type="button" role="option" data-order-code="${code}">${code}</button>`).join('')}</div></div></label><label><span>发票信息</span><button class="lx-order-invoice" type="button" data-order-invoice><span>${escapeHtml(invoicePreview())}</span><i class="lx-order-chevron"></i></button></label></div></section></div><footer class="lx-order-edit-footer"><span class="lx-order-selected-payment" data-order-selected-payment>当前选择　${escapeHtml(orderState.payment)}</span><button type="button" data-order-save>确认</button></footer>`;
      dialog.classList.add('lx-order-reference');
      dialog.querySelector('.lx-order-edit-section h3').textContent = '支付方式';
      dialog.querySelector('.lx-order-supplement-section h3').textContent = '订单信息';
      dialog.querySelectorAll('.lx-order-edit-body > .lx-order-edit-section > h3').forEach((heading) => {
        heading.style.setProperty('font-size', '18px', 'important');
        heading.style.setProperty('font-weight', '700', 'important');
        heading.style.setProperty('line-height', '26px', 'important');
        heading.style.setProperty('font-family', 'inherit', 'important');
        heading.style.setProperty('letter-spacing', '0', 'important');
        heading.style.setProperty('transform', 'none', 'important');
      });
      const onlinePanel = dialog.querySelector('[data-online-payment]');
      const installmentHeading = onlinePanel.querySelectorAll('.lx-order-subtitle')[1];
      const installments = document.createElement('div');
      installments.className = 'lx-order-installments';
      installments.innerHTML = '<div class="lx-order-installment-heading">分期支付</div>';
      while (installmentHeading.nextElementSibling) installments.appendChild(installmentHeading.nextElementSibling);
      installmentHeading.replaceWith(installments);
      const installmentNote = document.createElement('p');
      installmentNote.className = 'lx-order-installment-note';
      installmentNote.textContent = '*手续费以支付平台实际收取为准';
      installments.querySelector('.lx-order-installment-heading').appendChild(installmentNote);
      const updateSelectedPayment = () => {
        const selected = dialog.querySelector('[data-order-selected-payment]');
        updatePaymentFooter();
      };
      updateSelectedPayment();
      dialog.querySelector('[data-order-back]').addEventListener('click', (event) => { event.stopPropagation(); showOrder(); });
    };
    const showAddressManager = (tab = 'select', editId = '') => {
      const isCreate = tab === 'create';
      dialog.className = 'lx-buy-direct-dialog lx-order-edit-dialog lx-address-dialog';
      const tabs = `<div class="lx-address-tabs" role="tablist" aria-label="地址管理"><button class="${isCreate ? '' : 'is-active'}" type="button" role="tab" aria-selected="${!isCreate}" data-address-tab="select">选择地址</button><button class="${isCreate ? 'is-active' : ''}" type="button" role="tab" aria-selected="${isCreate}" data-address-tab="create">新建地址</button></div>`;
      if (isCreate) {
        const editing = addressBook.find((address) => address.id === editId);
        dialog.innerHTML = `<header class="lx-order-edit-head lx-address-head">${tabs}<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-order-edit-body lx-address-create-body"><form class="lx-address-form" data-address-form data-address-editing="${escapeHtml(editing?.id || '')}"><label for="lxAddressName">姓名：</label><input id="lxAddressName" name="name" value="${escapeHtml(editing?.name || '')}" placeholder="请输入姓名" autocomplete="name"><label for="lxAddressPhone">手机：</label><input id="lxAddressPhone" name="phone" value="${escapeHtml(editing?.phone || '')}" placeholder="请输入手机号" inputmode="tel" autocomplete="tel"><label for="lxAddressRegion">省市：</label><select id="lxAddressRegion" name="region"><option value="">请选择省/市/区/街道</option><option value="北京市海淀区中关村街道"${editing?.region === '北京市海淀区中关村街道' ? ' selected' : ''}>北京市 / 海淀区 / 中关村街道</option><option value="北京市海淀区中关村软件园2期"${editing?.region === '北京市海淀区中关村软件园2期' ? ' selected' : ''}>北京市 / 海淀区 / 中关村软件园2期</option><option value="上海市浦东新区张江镇"${editing?.region === '上海市浦东新区张江镇' ? ' selected' : ''}>上海市 / 浦东新区 / 张江镇</option><option value="广东省深圳市南山区粤海街道"${editing?.region === '广东省深圳市南山区粤海街道' ? ' selected' : ''}>广东省 / 深圳市 / 南山区 / 粤海街道</option></select><label for="lxAddressDetail">地址：</label><textarea id="lxAddressDetail" name="detail" placeholder="请输入详细地址">${escapeHtml(editing?.detail || '')}</textarea><label class="lx-address-default"><input type="checkbox" name="isDefault" ${editing?.isDefault ? 'checked' : ''}><span>设为默认地址</span></label></form></div><footer class="lx-order-edit-footer lx-address-footer"><button type="button" data-address-save>保存</button></footer>`;
        dialog.querySelector('#lxAddressName')?.focus();
        return;
      }
      const cards = addressBook.map((address) => `<article class="lx-address-card${orderState.addressId === address.id ? ' is-selected' : ''}" data-address-card="${address.id}"><button class="lx-address-card-main" type="button" data-address-select="${address.id}"><strong>${address.isDefault ? '<em>默认</em>' : ''}<span>${escapeHtml(address.name)}</span><span>${escapeHtml(address.phone)}</span></strong><small>${escapeHtml(address.region + address.detail)}</small></button><button class="lx-address-card-edit" type="button" data-address-card-edit="${address.id}" aria-label="编辑${escapeHtml(address.name)}的地址">✎</button></article>`).join('');
      dialog.innerHTML = `<header class="lx-order-edit-head lx-address-head">${tabs}<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-order-edit-body lx-address-select-body"><div class="lx-address-grid">${cards}</div></div><footer class="lx-order-edit-footer lx-address-footer"><button type="button" data-address-confirm>确定</button></footer>`;
    };
    const invoiceDateValue = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const invoiceDelayLimits = () => {
      const minimum = new Date();
      minimum.setHours(12, 0, 0, 0);
      minimum.setDate(minimum.getDate() + 1);
      const maximum = new Date(minimum);
      maximum.setFullYear(maximum.getFullYear() + 1);
      return { minimum: invoiceDateValue(minimum), maximum: invoiceDateValue(maximum) };
    };
    const formatInvoiceDelayDate = (value) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
      return match ? `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日` : '请选择开票日期';
    };
    const syncInvoiceDraft = () => {
      dialog.querySelectorAll('[data-invoice-field]').forEach((input) => { if (!input.disabled) orderState[input.dataset.invoiceField] = input.value.trim(); });
      const consent = dialog.querySelector('[data-invoice-consent]');
      if (consent) orderState.invoiceConsent = consent.checked;
    };
    const closeInvoiceDelayPicker = () => modal.querySelector('[data-invoice-delay-layer]')?.remove();
    const showInvoiceDelayPicker = () => {
      syncInvoiceDraft();
      closeInvoiceDelayPicker();
      const limits = invoiceDelayLimits();
      const initialValue = orderState.invoiceDelayDate && orderState.invoiceDelayDate >= limits.minimum && orderState.invoiceDelayDate <= limits.maximum ? orderState.invoiceDelayDate : limits.minimum;
      modal.insertAdjacentHTML('beforeend', `<div class="lx-invoice-delay-layer" data-invoice-delay-layer><section class="lx-invoice-delay-dialog" role="dialog" aria-modal="true" aria-labelledby="lxInvoiceDelayTitle"><header class="lx-invoice-delay-head"><h3 id="lxInvoiceDelayTitle">选择延时开票日期</h3><button class="lx-invoice-delay-close" type="button" data-invoice-delay-cancel aria-label="关闭延时开票日期选择">×</button></header><div class="lx-invoice-delay-body"><p class="lx-invoice-delay-note">最早可选择明天，最多可延后一年。</p><label class="lx-invoice-delay-date-label" for="lxInvoiceDelayDate">开票日期<input class="lx-invoice-delay-date" id="lxInvoiceDelayDate" type="date" min="${limits.minimum}" max="${limits.maximum}" value="${initialValue}" data-invoice-delay-input></label></div><footer class="lx-invoice-delay-footer"><button type="button" data-invoice-delay-clear>清除日期</button><button type="button" data-invoice-delay-cancel>取消</button><button class="primary" type="button" data-invoice-delay-confirm>确定</button></footer></section></div>`);
      const input = modal.querySelector('[data-invoice-delay-input]');
      input?.focus();
      try { input?.showPicker?.(); } catch (_) {}
    };
    const showInvoiceNotice = () => {
      syncInvoiceDraft();
      dialog.className = 'lx-buy-direct-dialog lx-order-edit-dialog lx-invoice-dialog lx-invoice-notice-view';
      dialog.innerHTML = `<header class="lx-order-edit-head"><button class="lx-order-edit-back" type="button" data-invoice-notice-back aria-label="返回发票信息"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>发票须知</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-order-edit-body lx-invoice-notice-body"><section><h3>开具发票说明</h3><ol><li>联想在线商城所售商品，每张订单都会开具“商品专用发票”。</li><li>发票金额为订单金额，含配送费。</li><li>发票内容默认为订购的商品明细，不支持修改。</li><li>使用优惠券支付的金额不开具发票；积分商品不提供发票。</li><li>发票抬头不能为空，可选择个人或公司名称，请仔细核对发票类型和公司名称。</li><li>联想实行货票同行；不能同行时按收货地址另行寄送。</li><li>目前只有联想（上海）电子科技有限公司能开具电子票。</li><li>第三方卖家商品或服务的发票由卖家按实际情况开具。</li></ol><h3>电子发票常见问题</h3><ol><li>电子发票与纸质发票具有同等法律效力。</li><li>订单确认收货后开具电子发票。</li><li>电子发票与纸质普票法律效力相同，不建议更换。</li><li>增值税专用发票资质在“我的商城—设置—发票抬头管理”维护并审核通过。</li><li>全电发票是票面信息全面数字化、全国统一赋码的电子发票。</li><li>增值税专用发票（数电票）预计在确认收货后 5 个工作日内开具，可在订单详情下载。</li><li>联想自营商品已全面实现增值税专用发票（数电票）。</li></ol></section></div><footer class="lx-order-edit-footer lx-invoice-notice-footer"><button type="button" data-invoice-notice-close>我知道了</button></footer>`;
      dialog.querySelector('[data-invoice-notice-close]')?.focus();
    };
    const showInvoiceEdit = () => {
      const options = [{ label: '普通发票-个人', value: '普通发票-个人' },{ label: '普通发票-单位', value: '普通发票-单位' },{ label: '增值税专票', value: '增值税专票' }];
      const isVat = orderState.invoiceDraft === '增值税专票';
      const isPersonal = orderState.invoiceDraft === '普通发票-个人';
      const fields = isVat
        ? `<div class="lx-invoice-form"><label for="lxInvoiceCompany">单位名称</label><input id="lxInvoiceCompany" value="联想（北京）有限公司" readonly><label for="lxInvoiceTaxId">纳税人识别号</label><input id="lxInvoiceTaxId" data-invoice-field="invoiceTaxNo" value="9111010870000458B" readonly><label for="lxInvoiceAddress">注册地址</label><input id="lxInvoiceAddress" data-invoice-field="invoiceAddress" value="${escapeHtml(orderState.invoiceAddress)}"><label for="lxInvoicePhone">注册电话</label><input id="lxInvoicePhone" data-invoice-field="invoiceRegisteredPhone" value="${escapeHtml(orderState.invoiceRegisteredPhone)}"><label for="lxInvoiceBank">开户银行</label><input id="lxInvoiceBank" data-invoice-field="invoiceBank" value="${escapeHtml(orderState.invoiceBank)}"><label for="lxInvoiceAccount">银行账号</label><input id="lxInvoiceAccount" data-invoice-field="invoiceBankAccount" value="${escapeHtml(orderState.invoiceBankAccount)}"><label for="lxInvoiceRemark">备注</label><textarea id="lxInvoiceRemark" data-invoice-field="invoiceRemark" placeholder="请填写备注">${escapeHtml(orderState.invoiceRemark)}</textarea></div><div class="lx-invoice-delay-field"><label>延时开票</label><button class="lx-invoice-delay-trigger" type="button" data-invoice-delay-open><span class="lx-invoice-delay-value${orderState.invoiceDelayDate ? ' has-value' : ''}">${escapeHtml(formatInvoiceDelayDate(orderState.invoiceDelayDate))}</span><i class="lx-invoice-delay-chevron" aria-hidden="true"></i></button><p class="lx-invoice-delay-help">选择后将在该日期起进入开票处理；请在此日期前确保增票资质已审核通过。未选择则按原开票时效处理。</p></div>`
        : `<div class="lx-invoice-form"><label for="lxInvoiceTitle">发票抬头</label><input id="lxInvoiceTitle" data-invoice-field="invoiceTitle" value="${isPersonal ? '个人' : '联想（北京）有限公司'}">${isPersonal ? '' : '<label for="lxInvoiceTaxId">纳税人识别号</label><input id="lxInvoiceTaxId" data-invoice-field="invoiceTaxNo" value="123123123123123">'}<label for="lxInvoiceRecipientPhone">收票人手机</label><input id="lxInvoiceRecipientPhone" data-invoice-field="invoicePhone" value="${escapeHtml(orderState.invoicePhone)}"><label for="lxInvoiceEmail">收票人邮箱</label><input id="lxInvoiceEmail" data-invoice-field="invoiceEmail" value="${escapeHtml(orderState.invoiceEmail)}">${isPersonal ? '' : `<label for="lxInvoiceRemark">备注</label><textarea id="lxInvoiceRemark" data-invoice-field="invoiceRemark" placeholder="请填写备注">${escapeHtml(orderState.invoiceRemark)}</textarea>`}</div>`;
      dialog.className = 'lx-buy-direct-dialog lx-order-edit-dialog lx-invoice-dialog';
      dialog.innerHTML = `<header class="lx-order-edit-head"><button class="lx-order-edit-back" type="button" data-invoice-back aria-label="返回"><img src="/assets/icons/order-modal-back.svg" alt="" aria-hidden="true"></button><h2>发票信息</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-order-edit-body"><section class="lx-order-edit-section"><div class="lx-invoice-type-row"><div class="lx-order-channel-grid lx-invoice-type-grid">${options.map((option) => `<button class="lx-order-channel${orderState.invoiceDraft === option.value ? ' is-active' : ''}" type="button" data-invoice-option="${option.value}"><strong>${option.label}</strong></button>`).join('')}</div><button class="lx-invoice-notice-entry" type="button" data-invoice-notice-open>发票须知</button></div></section><p class="lx-invoice-tip">*自营商品的增值税专用发票（数电票）会在确认收货后预计 5 个工作日内开具。</p>${fields}</div><footer class="lx-order-edit-footer"><button type="button" data-invoice-save>保存</button></footer>`;
      if (!isVat) dialog.querySelector('.lx-invoice-tip').remove();
      dialog.querySelector('[data-invoice-back]').addEventListener('click', (event) => { event.stopPropagation(); showOrderEdit(); });
    };
    modal.addEventListener('pointerdown', (event) => {
      const target = event.target;
      if (target.closest('[data-order-back],[data-config-back]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showOrder();
      } else if (target.closest('[data-price-back]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showOrder();
      } else if (target.closest('[data-invoice-back]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showOrderEdit();
      } else if (target.closest('[data-coupon-back]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showPriceDetail();
      } else if (target.closest('[data-benefit-back]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showPriceDetail();
      }
    }, true);
    modal.addEventListener('click', (event) => {
      const target = event.target;
      const openCodeMenu = dialog.querySelector('[data-order-code-menu]:not([hidden])');
      if (openCodeMenu && !target.closest('.lx-order-combobox')) { openCodeMenu.hidden = true; dialog.querySelector('[data-order-customer]')?.setAttribute('aria-expanded','false'); }
      if (target.closest('[data-invoice-notice-close],[data-invoice-notice-back]')) return showInvoiceEdit();
      if (target.closest('.lx-buy-direct-close')) { stopPaymentTimer(); if (paymentState.chatCard) { modal.hidden = true; return; } return modal.remove(); }
      if (target.closest('.lx-buy-direct-mask')) return;
      if (target.closest('[data-pay-now]')) { openPaymentPage(); appendPaymentChatCard(); showPaymentProcessing(); return; }
      if (target.closest('[data-go-pay]')) return openPaymentPage();
      if (target.closest('[data-confirm-payment]')) return showPaymentSuccess();
      if (target.closest('[data-view-paid-order]')) return openPaidOrderDetail();
      if (target.closest('[data-price-detail]')) return showPriceDetail();
      if (target.closest('[data-benefit-info]')) return showToast('预订单支付前，优惠仍可用于其他商品;支付发票成功将锁定至本单，取消订单后自动释放', 6000);
      if (target.closest('[data-open-coupon-code]')) return showCouponCode();
      const benefitButton = target.closest('[data-open-benefit]');
      if (benefitButton) return benefitButton.dataset.openBenefit === 'coupon' ? showCouponSelect() : showWalletBenefit(benefitButton.dataset.openBenefit);
      if (target.closest('[data-coupon-back]')) return showPriceDetail();
      if (target.closest('[data-benefit-back]')) return showPriceDetail();
      if (target.closest('[data-price-confirm]')) return showOrder();
      if (target.closest('[data-edit-config]')) return showConfigEdit();
      if (target.closest('[data-config-back]')) return showOrder();
      const configOption = target.closest('[data-config-key]');
      if (configOption) { configState[configOption.dataset.configKey] = configOption.dataset.configValue; return showConfigEdit(); }
      if (target.closest('[data-config-minus]')) { configState.quantity = Math.max(1, configState.quantity - 1); return showConfigEdit(); }
      if (target.closest('[data-config-plus]')) { configState.quantity = Math.min(5, configState.quantity + 1); return showConfigEdit(); }
      if (target.closest('[data-config-save]')) return showOrder();
      if (target.closest('[data-edit-order]')) { orderState.expanded = ''; return showOrderEdit(); }
      if (target.closest('[data-order-back]')) return showOrder();
      if (target.closest('[data-order-invoice]')) return showInvoiceEdit();
      if (target.closest('[data-invoice-notice-open]')) return showInvoiceNotice();
      if (target.closest('[data-invoice-back]')) return showOrderEdit();
      const invoiceOption = target.closest('[data-invoice-option]');
      if (invoiceOption) { syncInvoiceDraft(); orderState.invoiceDraft = invoiceOption.dataset.invoiceOption; return showInvoiceEdit(); }
      if (target.closest('[data-invoice-delay-open]')) return showInvoiceDelayPicker();
      const delayLayer = target.closest('[data-invoice-delay-layer]');
      if (delayLayer && target === delayLayer) { closeInvoiceDelayPicker(); return; }
      if (target.closest('[data-invoice-delay-cancel]')) { closeInvoiceDelayPicker(); return; }
      if (target.closest('[data-invoice-delay-clear]')) { orderState.invoiceDelayDate = ''; closeInvoiceDelayPicker(); showInvoiceEdit(); return; }
      if (target.closest('[data-invoice-delay-confirm]')) {
        const delayInput = modal.querySelector('[data-invoice-delay-input]');
        if (!delayInput?.value) { delayInput?.focus(); return; }
        orderState.invoiceDelayDate = delayInput.value;
        closeInvoiceDelayPicker();
        showInvoiceEdit();
        showToast('延时开票日期已选择');
        return;
      }
      if (target.closest('[data-invoice-save]')) {
        syncInvoiceDraft(); orderState.invoice = orderState.invoiceDraft;
        return showOrderEdit();
      }
      const couponChoice = target.closest('[data-coupon-choice]');
      if (couponChoice) {
        benefitState.couponId = couponChoice.dataset.couponChoice;
        benefitState.couponAmount = Number(couponChoice.dataset.couponValue) || 0;
        dialog.querySelectorAll('[data-coupon-choice]').forEach((button) => button.classList.toggle('is-selected', button === couponChoice));
        return;
      }
      if (target.closest('[data-benefit-confirm]')) return showPriceDetail();
      const walletConfirm = target.closest('[data-wallet-confirm]');
      if (walletConfirm) {
        const type = walletConfirm.dataset.walletConfirm;
        const raw = Math.max(0, Number(dialog.querySelector('[data-wallet-input]')?.value) || 0);
        if (type === 'beans') {
          benefitState.beanPoints = Math.min(5600, Math.round(raw));
          benefitState.beanAmount = Math.min(56, Math.floor(benefitState.beanPoints / 100));
        } else {
          benefitState.redPacketAmount = Math.min(50, Math.round(raw * 100) / 100);
        }
        return showPriceDetail();
      }
      const provider = target.closest('[data-order-provider]');
      if (provider) {
        const shouldExpand = orderState.expanded !== provider.dataset.orderProvider;
        dialog.querySelectorAll('[data-order-provider]').forEach((button) => {
          button.classList.remove('is-expanded');
          button.nextElementSibling.hidden = true;
        });
        orderState.expanded = shouldExpand ? provider.dataset.orderProvider : '';
        if (shouldExpand) {
          provider.classList.add('is-expanded');
          provider.nextElementSibling.hidden = false;
          const providerName = provider.dataset.orderProvider === 'huabei' ? '花呗分期' : '信用卡分期';
          if (!String(orderState.payment).startsWith(providerName)) orderState.payment = providerName;
          lastOnlinePayment = orderState.payment;
          dialog.querySelectorAll('[data-order-payment]').forEach((button) => button.classList.toggle('is-active', button.dataset.orderPayment === orderState.payment));
          updatePaymentFooter();
        }
        return;
      }
      const payment = target.closest('[data-order-payment]');
      if (payment) {
        orderState.payment = payment.dataset.orderPayment;
        lastOnlinePayment = orderState.payment;
        dialog.querySelectorAll('[data-order-payment]').forEach((button) => button.classList.toggle('is-active', button === payment));
        const selectedPayment = dialog.querySelector('[data-order-selected-payment]');
        updatePaymentFooter();
        return;
      }
      const channel = target.closest('[data-order-channel]');
      if (channel) {
        dialog.querySelectorAll('[data-order-channel]').forEach((button) => button.classList.toggle('is-active', button === channel));
        const online = dialog.querySelector('[data-online-payment]');
        const corporate = dialog.querySelector('[data-corporate-payment]');
        online.hidden = channel.dataset.orderChannel === 'corporate';
        corporate.hidden = !online.hidden;
        dialog.querySelectorAll('[data-order-channel]').forEach((button) => button.setAttribute('aria-selected', String(button === channel)));
        if (online.hidden) {
          if (orderState.payment !== '对公支付') lastOnlinePayment = orderState.payment;
          orderState.payment = '对公支付';
        } else {
          orderState.payment = lastOnlinePayment;
          dialog.querySelectorAll('[data-order-payment]').forEach((button) => button.classList.toggle('is-active', button.dataset.orderPayment === orderState.payment));
        }
        const selectedPayment = dialog.querySelector('[data-order-selected-payment]');
        updatePaymentFooter();
        return;
      }
      const customerInput = target.closest('[data-order-customer]');
      if (customerInput) { const menu = dialog.querySelector('[data-order-code-menu]'); menu.hidden = !menu.hidden; customerInput.setAttribute('aria-expanded', String(!menu.hidden)); return; }
      if (target.closest('[data-claim-national-subsidy]')) { showToast('国补资格将在结算时核验，价格以实际支付为准'); return; }
      if (target.closest('[data-address-edit]')) return showAddressManager('select');
      const addressTab = target.closest('[data-address-tab]');
      if (addressTab) return showAddressManager(addressTab.dataset.addressTab);
      const addressCardEdit = target.closest('[data-address-card-edit]');
      if (addressCardEdit) return showAddressManager('create', addressCardEdit.dataset.addressCardEdit);
      const addressChoice = target.closest('[data-address-select]');
      if (addressChoice) {
        orderState.addressId = addressChoice.dataset.addressSelect;
        dialog.querySelectorAll('[data-address-card]').forEach((card) => card.classList.toggle('is-selected', card.dataset.addressCard === orderState.addressId));
        return;
      }
      if (target.closest('[data-address-confirm]')) {
        applyAddress(selectedAddress());
        showOrderEdit();
        showToast('收货地址已更新');
        return;
      }
      if (target.closest('[data-address-save]')) {
        const form = dialog.querySelector('[data-address-form]');
        const name = form?.elements.name?.value.trim() || '';
        const phone = form?.elements.phone?.value.trim() || '';
        const region = form?.elements.region?.value.trim() || '';
        const detail = form?.elements.detail?.value.trim() || '';
        if (!name) return form?.elements.name?.focus();
        if (!/^1\d{10}$/.test(phone)) { showToast('请输入正确的11位手机号'); return form?.elements.phone?.focus(); }
        if (!region) return form?.elements.region?.focus();
        if (!detail) return form?.elements.detail?.focus();
        const editingId = form.dataset.addressEditing;
        let saved = addressBook.find((address) => address.id === editingId);
        if (!saved) { saved = { id: `address-${Date.now()}` }; addressBook.push(saved); }
        if (form.elements.isDefault.checked) addressBook.forEach((address) => { address.isDefault = false; });
        Object.assign(saved, { name, phone, region, detail, isDefault: form.elements.isDefault.checked });
        orderState.addressId = saved.id;
        applyAddress(saved);
        showAddressManager('select');
        showToast(editingId ? '地址已保存' : '新地址已保存');
        return;
      }
      const code = target.closest('[data-order-code]');
      if (code) { orderState.customerCode = code.dataset.orderCode; const input = dialog.querySelector('[data-order-customer]'); input.value = orderState.customerCode; input.setAttribute('aria-expanded','false'); dialog.querySelector('[data-order-code-menu]').hidden = true; return; }
      if (target.closest('[data-order-save]')) {
        orderState.note = dialog.querySelector('[data-order-note]')?.value.trim() || '';
        orderState.customerCode = dialog.querySelector('[data-order-customer]')?.value.trim() || '';
        showOrder();
        dialog.querySelector('[data-order-preview-payment]').textContent = orderState.payment.includes('支付') || orderState.payment.includes('分期') ? orderState.payment : `${orderState.payment}支付`;
        return;
      }
      if (target.closest('[data-coupon-confirm]')) {
        const code = dialog.querySelector('#lxCouponCode')?.value.trim();
        if (!code) return dialog.querySelector('#lxCouponCode')?.focus();
        showPriceDetail();
      }
    });
    modal.querySelector('.primary')?.focus();
  };

  window.__lxOpenUnifiedDiscountOrder = product => {
    try { return openOrderModal({...window.__lxPurchaseContext.normalize(product), originalPrice: Number(product.originalPrice || product.original_price || product.price), discount: Math.max(0, Number(product.discount) || 0)}); } catch (error) { showToast(error.message); }
  };

  const removeRepeatedOfflineErrors = () => {
    document.querySelectorAll('.lx-p0-messages .lx-p0-message.ai, .lx-p0-messages .msg.ai').forEach((message) => {
      if (/当前 AI 服务暂时不可用/.test(message.textContent || '')) message.remove();
    });
  };

  let purchaseRequest = 0; const purchaseButtons = new WeakMap();
  window.addEventListener('click', async (event) => {
    const button = event.target.closest?.('button, a[role="button"]');
    const label = String(button?.textContent || '').replace(/\s+/g, '').trim();
    const isUnifiedBuy = button && !button.closest('[data-buy-modal-direct]') && !button.dataset.bizQuote && (/^(?:一键领取?优惠下单|一键领优惠下单|立即购买|立即下单|去购买|去下单|去结算|结算|提交订单)$/.test(label) || button.matches('[data-buy-now],[data-action="buy"],[data-order-action="buy"]'));
    if (!isUnifiedBuy) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const request = ++purchaseRequest; purchaseButtons.set(button, request);
    button.setAttribute("aria-busy", "true");
    try { const product = await visibleDetailProduct(button); if (request === purchaseRequest && button.isConnected && window.__lxPurchaseContext.targetSku(button, window.__lxState) === product.sku) {
      const state=window.__lxState;
      if (!state || !window.__lxBridge?.sendChat) throw new Error('下单服务尚未就绪，请重试');
      if (state.sending || state._buyFlowRunning) return;
      state._pendingDiscountOrderProduct=product;
      state._unifiedOrderSourceProduct=product;
      await window.__lxBridge.sendChat(`我要购买${product.name}，请帮我自动领取所有可用优惠并生成待支付订单`);
    } }
    catch (error) { if (request === purchaseRequest) showToast(error.message || "商品读取失败，请重试"); }
    finally { if (purchaseButtons.get(button) === request) { button.removeAttribute("aria-busy"); purchaseButtons.delete(button); } }
  }, true);

  repairProductImages();
  removeRepeatedOfflineErrors();
  // Batch added subtrees once per frame. Never rescan the entire chat per node.
  const pendingRoots = new Set(); let repairFrame = 0;
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) pendingRoots.add(node);
    if (!pendingRoots.size || repairFrame) return;
    repairFrame = requestAnimationFrame(() => {
      repairFrame = 0; const roots = [...pendingRoots]; pendingRoots.clear();
      for (const node of roots) {
        if (!node.isConnected || roots.some(parent => parent !== node && parent.contains(node))) continue;
        repairProductImages(node);
        const selector = '.lx-p0-messages .lx-p0-message.ai, .lx-p0-messages .msg.ai';
        const messages = [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)];
        for (const message of messages) if (/当前 AI 服务暂时不可用/.test(message.textContent || '')) message.remove();
      }
    });
  }).observe(document.body, { childList: true, subtree: true });

  const previewMode = new URLSearchParams(location.search).get('showOrder');
  if (previewMode) {
    const showPreview = () => {
      openOrderModal({ name: '联想小新 Air 13', originalPrice: 7299, discount: 400, price: 6899, image_url: AIR_13_IMAGE });
      if (previewMode === 'price' || previewMode === 'coupon') document.querySelector('[data-price-detail]')?.click();
      if (previewMode === 'coupon') document.querySelector('[data-open-benefit="coupon"]')?.click();
      if (previewMode === 'beans') { document.querySelector('[data-price-detail]')?.click(); document.querySelector('[data-open-benefit="beans"]')?.click(); }
      if (previewMode === 'redpacket') { document.querySelector('[data-price-detail]')?.click(); document.querySelector('[data-open-benefit="redpacket"]')?.click(); }
      if (previewMode === 'edit' || previewMode === 'address' || previewMode === 'address-new') document.querySelector('[data-edit-order]')?.click();
      if (previewMode === 'address' || previewMode === 'address-new') document.querySelector('[data-address-edit]')?.click();
      if (previewMode === 'address-new') document.querySelector('[data-address-tab="create"]')?.click();
      if (previewMode === 'invoice') { document.querySelector('[data-edit-order]')?.click(); document.querySelector('[data-order-invoice]')?.click(); }
      if (previewMode === 'invoice-unit') { document.querySelector('[data-edit-order]')?.click(); document.querySelector('[data-order-invoice]')?.click(); document.querySelector('[data-invoice-option="普通发票-单位"]')?.click(); }
      if (previewMode === 'invoice-vat') { document.querySelector('[data-edit-order]')?.click(); document.querySelector('[data-order-invoice]')?.click(); document.querySelector('[data-invoice-option="增值税专票"]')?.click(); }
      if (previewMode === 'invoice-notice') { document.querySelector('[data-edit-order]')?.click(); document.querySelector('[data-order-invoice]')?.click(); document.querySelector('[data-invoice-notice-open]')?.click(); }
      if (previewMode === 'config') document.querySelector('[data-edit-config]')?.click();
      if (previewMode === 'payment') document.querySelector('[data-pay-now]')?.click();
      if (previewMode === 'success') { document.querySelector('[data-pay-now]')?.click(); document.querySelector('[data-confirm-payment]')?.click(); }
    };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', showPreview, { once: true }) : showPreview();
  }
})();

/* v60-fulfillment-subsidy-checkout-20260904 */
(function () {
  'use strict';
  var originalOpen = window.__lxOpenUnifiedDiscountOrder;
  if (typeof originalOpen !== 'function' || window.__lxFulfillmentCheckoutV60) return;

  var stores = [
    { id: 'xibeiwang', name: '联想官方体验店（西北旺万象汇店）', address: '北京市海淀区马连洼街道德政路16号院万象汇A区 F4 405', hours: '9:30-21:00', phone: '13426251637', distance: '200m' },
    { id: 'zhongguancun', name: '联想来酷智生活（中关村店）', address: '北京市海淀区中关村大街19号新中关购物中心 B1', hours: '10:00-21:30', phone: '010 6602 6688', distance: '2.6km' },
    { id: 'wukesong', name: '联想官方体验店（五棵松华熙店）', address: '北京市海淀区复兴路69号华熙LIVE南区 1F', hours: '10:00-22:00', phone: '010 5971 6888', distance: '4.1km' }
  ];
  var orderAddress = '北京市海淀区中关村软件园2期北京联想总部东区E1';
  var sessions = new WeakMap();

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function shopIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16l-1.2-5H5.2L4 9Zm1 0v10h14V9M8 19v-6h8v6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3.5 9c0 1.4 1.1 2.5 2.5 2.5S8.5 10.4 8.5 9c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  }
  function locationIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="9" r="2.4" fill="currentColor"/></svg>';
  }
  function qrMarkup() {
    return '<div class="lx-demo-qr" aria-label="模拟二维码"><svg viewBox="0 0 84 84" role="img"><rect width="84" height="84" fill="#fff"/><g fill="#000"><path d="M3 3h24v24H3zm4 4v16h16V7zm4 4h8v8h-8zM57 3h24v24H57zm4 4v16h16V7zm4 4h8v8h-8zM3 57h24v24H3zm4 4v16h16V61zm4 4h8v8h-8z" fill-rule="evenodd"/><path d="M33 4h6v6h-6zm9 0h5v12h-5zm-9 15h6v6h-6zm11 2h7v7h-7zm-13 10h7v6h-7zm11 0h6v6h-6zm10 0h8v6h-8zm12 0h6v8h-6zm10 0h7v6h-7zM30 41h7v7h-7zm11-2h6v13h-6zm10 2h6v6h-6zm10 0h13v6H61zm-28 15h7v6h-7zm10 0h6v13h-6zm10-5h7v7h-7zm11 0h6v13h-6zm10-1h7v7h-7zM31 67h7v7h-7zm11 5h8v8h-8zm11-10h6v18h-6zm10 5h7v6h-7zm11-6h7v19h-7z"/></g></svg></div>';
  }

  if (!document.querySelector('[data-fulfillment-checkout-v60-style]')) {
    var style = document.createElement('style');
    style.dataset.fulfillmentCheckoutV60Style = 'true';
    style.textContent = '.lx-fulfillment-suggestion{margin:10px 0 0;color:#353037;font-size:14px;line-height:1.8}.lx-fulfillment-link{display:inline;padding:0 2px;border:0;border-bottom:1px solid currentColor;background:transparent;color:#681057;font:inherit;font-weight:700;line-height:inherit;cursor:pointer}.lx-fulfillment-link:hover,.lx-fulfillment-link:focus{color:#a51f42}[data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card.has-store-kicker{grid-template-areas:"store store store" "visual heading action" "visual specs specs"!important;grid-template-rows:16px 48px 16px!important;height:100px!important;min-height:100px!important;row-gap:1px!important;padding-block:9px!important;overflow:hidden!important}[data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card.has-store-kicker .lx-buy-direct-product>img{width:48px!important;height:48px!important;align-self:start!important}[data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card.has-store-kicker .lx-buy-direct-product-copy{align-self:start!important;min-height:48px!important}[data-buy-modal-direct] .lx-buy-direct-dialog:not(.lx-buy-sub-dialog):not(.lx-order-edit-dialog) .lx-order-product-card.has-store-kicker .lx-buy-direct-product-spec{align-self:start!important;min-height:16px!important}.lx-order-store-kicker{grid-area:store;align-self:start;display:flex;align-items:center;gap:6px;min-height:16px;margin:0 0 2px;color:#681057;font-size:11px;font-weight:600}.lx-order-store-kicker svg{width:15px;height:15px}.lx-fulfillment-address{display:grid;gap:10px;padding:2px 0}.lx-fulfillment-address-row{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:10px;align-items:start}.lx-fulfillment-address-row svg{width:20px;height:20px;color:#575258}.lx-fulfillment-address-copy{display:grid;gap:3px;min-width:0}.lx-fulfillment-address-copy strong{font-size:13px;font-weight:600;line-height:19px}.lx-fulfillment-address-copy span{overflow:hidden;color:#77717d;font-size:11px;line-height:17px;text-overflow:ellipsis;white-space:nowrap}.lx-fulfillment-address-row button{padding:1px 0;border:0;border-bottom:1px solid currentColor;background:transparent;color:#77717d;font:inherit;cursor:pointer}.lx-fulfillment-pickup-address{color:#77717d;font-size:11px;line-height:17px}.lx-fulfillment-contact{display:flex;gap:14px;padding-left:0;font-size:12px}.lx-fulfillment-contact b{font-weight:600}.lx-fulfillment-dialog{padding:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}.lx-fulfillment-head{height:64px;flex:none;display:flex;align-items:center;padding:0 26px}.lx-fulfillment-head h2{margin:0!important;background:none!important;color:#19171b!important;-webkit-text-fill-color:initial!important;font-size:20px!important}.lx-fulfillment-head h2:before{content:none!important}.lx-fulfillment-body{flex:1;min-height:0;padding:12px 26px 18px;overflow:auto}.lx-fulfillment-form{display:grid;grid-template-columns:70px 1fr 55px 1fr;gap:12px;align-items:center;margin-bottom:20px}.lx-fulfillment-form label{font-weight:600}.lx-fulfillment-form input{height:42px;box-sizing:border-box;padding:0 12px;border:1px solid #e2ddeb;border-radius:4px;background:#fbf9fc;font:inherit}.lx-fulfillment-section-title{margin:0 0 12px;font-size:14px}.lx-fulfillment-location{display:flex;align-items:center;gap:10px;min-height:52px;box-sizing:border-box;margin-bottom:14px;padding:0 14px;border:1px solid #ebe5ed;border-radius:4px;background:#fbf9fc;color:#681057}.lx-fulfillment-location svg{width:22px;flex:0 0 22px}.lx-fulfillment-location span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lx-fulfillment-location b{margin-left:auto}.lx-fulfillment-store-list{display:grid;gap:10px}.lx-fulfillment-store{position:relative;display:grid;gap:7px;min-height:104px;box-sizing:border-box;padding:17px 96px 15px 18px;border:1px solid #ebe5ed;border-radius:8px;background:#fcfbfd;color:#272329;text-align:left;cursor:pointer}.lx-fulfillment-store.is-active{border-color:#681057;box-shadow:inset 0 0 0 1px #b8252e}.lx-fulfillment-store strong{font-size:14px}.lx-fulfillment-store span{color:#77717d}.lx-fulfillment-store small{color:#5e5861}.lx-fulfillment-store em{position:absolute;right:18px;bottom:22px;color:#681057;font-size:13px;font-style:normal;font-weight:600}.lx-fulfillment-footer{height:70px;flex:none;display:flex;align-items:center;justify-content:flex-end;padding:0 26px;background:#fff}.lx-fulfillment-footer button{width:164px;height:44px;border:0;border-radius:100px;background:linear-gradient(90deg,#4d144a,#b8252e);color:#fff;font-size:14px;font-weight:600;cursor:pointer}.lx-subsidy-dialog .lx-fulfillment-body{padding-top:4px}.lx-subsidy-step{margin:0 0 16px}.lx-subsidy-step h3{margin:0 0 6px;font-size:14px}.lx-subsidy-step p{margin:0;color:#5f5863;line-height:1.7}.lx-subsidy-outline{height:34px;margin-top:8px;padding:0 18px;border:1px solid #681057;border-radius:100px;background:#fff;color:#681057;cursor:pointer}.lx-subsidy-qr-row{display:flex;align-items:center;gap:16px}.lx-subsidy-qr-copy{color:#5f5863;line-height:1.65}.lx-subsidy-code{display:grid;grid-template-columns:1fr auto;width:min(460px,100%);height:42px;border:1px solid #e3dce6;border-radius:100px;overflow:hidden}.lx-subsidy-code input{min-width:0;padding:0 16px;border:0;outline:0}.lx-subsidy-code button{margin:4px;padding:0 16px;border:0;border-radius:100px;background:#eadce6;color:#fff;cursor:pointer}.lx-demo-qr{width:86px;height:86px;flex:0 0 86px;padding:6px;box-sizing:border-box;border:1px solid #e6e1e8;background:#fff}.lx-demo-qr svg{width:100%;height:100%;display:block}.lx-realname-notice{margin:0 0 24px;padding:10px 12px;border-radius:6px;background:#fff0e9;color:#b46048}.lx-realname-grid{display:grid;grid-template-columns:55px 1fr 55px 1fr;gap:20px 12px;align-items:center}.lx-realname-grid label:before{content:"*";margin-right:4px;color:#cf2c2c}.lx-realname-grid input{height:40px;min-width:0;box-sizing:border-box;padding:0 12px;border:1px solid #e3dce6;background:#fbf9fc}.lx-realname-code{display:grid;grid-template-columns:1fr auto}.lx-realname-code button{border:0;border-left:1px solid #e3dce6;background:#fff;color:#681057}.lx-realname-consent{display:flex;align-items:center;gap:7px;margin-top:auto;color:#5f5863}.lx-realname-consent input{accent-color:#681057}.lx-realname-actions{display:flex;gap:16px}.lx-realname-actions .secondary{border:1px solid #681057;background:#fff;color:#681057}.lx-pickup-success{height:100%;display:flex;flex-direction:column;padding:12px 4px 0}.lx-pickup-success-title{display:flex;align-items:center;gap:10px;margin:0 0 14px;font-size:21px}.lx-pickup-success-title i{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#50d5a0;color:#fff;font-style:normal}.lx-pickup-success-copy{margin:0;font-size:15px;line-height:1.8}.lx-pickup-success-copy b{font-weight:700}.lx-pickup-code{display:grid;gap:10px;margin:22px 0 16px;padding:18px;border-radius:16px;background:#fcfbfd}.lx-pickup-code-head{display:flex;align-items:center;gap:8px;font-size:17px}.lx-pickup-code-head span{padding:2px 10px;border-radius:100px;background:#faedf8;color:#681057;font-size:12px}.lx-pickup-code .lx-demo-qr{justify-self:center;width:122px;height:122px}.lx-pickup-code strong{justify-self:center;font-size:20px;letter-spacing:3px}.lx-pickup-success .lx-payment-actions{margin-top:auto}@media(max-width:620px){.lx-fulfillment-form,.lx-realname-grid{grid-template-columns:72px 1fr}.lx-fulfillment-store{padding-right:72px}.lx-fulfillment-head,.lx-fulfillment-footer{padding-right:18px;padding-left:18px}.lx-fulfillment-body{padding-right:18px;padding-left:18px}}';
    document.head.appendChild(style);
  }

  function normalizeProduct(product) {
    var copy = Object.assign({}, product);
    copy.image_url = copy.image_url || copy.image || '';
    copy.originalPrice = Number(copy.originalPrice || copy.original_price || copy.price);
    copy.discount = Math.max(0, Number(copy.discount) || 0);
    return copy;
  }
  function latestAssistantBody() {
    var messages = Array.prototype.slice.call(document.querySelectorAll('.lx-p0-messages .lx-p0-message.ai, .lx-p0-messages .msg.ai, .lxfd-thread .lxfd-msg-ai'));
    var message = messages[messages.length - 1];
    return message && (message.querySelector('.ai-body,.lxfd-ai-body') || message);
  }
  function appendSuggestion(product, attempt) {
    attempt = attempt || 0;
    var body = latestAssistantBody();
    if (!body) {
      if (attempt < 10) window.setTimeout(function () { appendSuggestion(product, attempt + 1); }, 160);
      return;
    }
    var key = String(product.sku || product.name || 'product');
    if (body.querySelector('[data-fulfillment-suggestion]')) return;
    var suggestion = document.createElement('p');
    suggestion.className = 'lx-fulfillment-suggestion';
    suggestion.dataset.fulfillmentSuggestion = key;
    suggestion.innerHTML = '查询到您附近门店存在此商品的库存，您是否想要今日就可取到商品呢，您可 <button class="lx-fulfillment-link" type="button" data-open-fulfillment="pickup">到店自提</button> <button class="lx-fulfillment-link" type="button" data-open-fulfillment="flash">门店闪送</button> 进行下单哦~';
    suggestion._lxProduct = product;
    var card = body.querySelector('.answer-cta,[data-answer-card],.lx-answer-card');
    if (card) body.insertBefore(suggestion, card);
    else body.appendChild(suggestion);
    var thread = body.closest('.lx-p0-messages,.lxfd-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  }
  function shippingMarkup(session) {
    var store = session.store;
    if (session.mode === 'pickup') {
      return '<div class="lx-fulfillment-address"><div class="lx-fulfillment-address-row">' + shopIcon() + '<span class="lx-fulfillment-address-copy"><strong>' + esc(store.name) + '</strong></span><button type="button" data-select-fulfillment-store>选择门店</button></div><div class="lx-fulfillment-pickup-address">' + esc(store.address) + '</div><div class="lx-fulfillment-contact"><b>联小想</b><span>13028280000</span></div></div>';
    }
    if (session.mode === 'flash') {
      return '<div class="lx-fulfillment-address"><div class="lx-fulfillment-address-row">' + shopIcon() + '<span class="lx-fulfillment-address-copy"><strong>' + esc(store.name) + '</strong></span><button type="button" data-select-fulfillment-store>选择门店</button></div><div class="lx-fulfillment-address-row">' + locationIcon() + '<span class="lx-fulfillment-address-copy"><strong>联小想　13028280000</strong><span>' + orderAddress + '</span></span></div></div>';
    }
    return '';
  }
  function decorateOrder(session) {
    var dialog = session.modal.querySelector('.lx-buy-direct-dialog');
    var shipping = dialog && dialog.querySelector('.lx-order-shipping');
    if (!shipping || session.mode === 'delivery') return;
    if (shipping.dataset.fulfillmentMode !== session.mode) {
      shipping.innerHTML = shippingMarkup(session);
      shipping.dataset.fulfillmentMode = session.mode;
    }
    if (session.mode === 'flash') {
      var card = dialog.querySelector('.lx-order-product-card');
      if (card && !card.querySelector('.lx-order-store-kicker')) {
        card.classList.add('has-store-kicker');
        card.insertAdjacentHTML('afterbegin', '<span class="lx-order-store-kicker">' + shopIcon() + esc(session.store.name) + '</span>');
      }
    }
  }
  function rememberSize(session) {
    if (session.size) return;
    var dialog = session.modal.querySelector('.lx-buy-direct-dialog');
    var rect = dialog && dialog.getBoundingClientRect();
    if (rect && rect.width && rect.height) session.size = { width: Math.round(rect.width), height: Math.round(rect.height) };
  }
  function applySize(dialog, session) {
    rememberSize(session);
    if (!session.size) return;
    dialog.style.width = session.size.width + 'px';
    dialog.style.height = session.size.height + 'px';
  }
  function renderCustom(session, className, html) {
    var dialog = session.modal.querySelector('.lx-buy-direct-dialog');
    applySize(dialog, session);
    dialog.className = 'lx-buy-direct-dialog lx-fulfillment-dialog ' + className;
    dialog.innerHTML = html;
  }
  function rerenderOrder(session) {
    return window.__lxOpenUnifiedDiscountOrder(session.product, { mode: session.mode, storeId: session.store.id, skipSuggestion: true, size: session.size });
  }
  function storeCards(session) {
    return stores.map(function (store) {
      return '<button class="lx-fulfillment-store' + (session.draftStoreId === store.id ? ' is-active' : '') + '" type="button" data-fulfillment-store="' + store.id + '"><strong>' + esc(store.name) + '</strong><span>' + esc(store.address) + '</span><small>营业时间　' + store.hours + '　　电话　' + store.phone + '</small><em>距离 ' + store.distance + '</em></button>';
    }).join('');
  }
  function showStoreSelector(session) {
    session.draftStoreId = session.store.id;
    var contact = session.mode === 'pickup' ? '<div class="lx-fulfillment-form"><label for="lxPickupName">收货人</label><input id="lxPickupName" value="联小想"><label for="lxPickupPhone">电话</label><input id="lxPickupPhone" value="13028280000"></div><h3 class="lx-fulfillment-section-title">选择地址</h3>' : '';
    renderCustom(session, 'lx-store-selector-dialog', '<header class="lx-fulfillment-head"><h2>选择门店</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-fulfillment-body">' + contact + '<div class="lx-fulfillment-location">' + locationIcon() + '<span>位置：' + orderAddress + '</span><b>›</b></div><div class="lx-fulfillment-store-list">' + storeCards(session) + '</div></div><footer class="lx-fulfillment-footer"><button type="button" data-fulfillment-store-confirm>确定</button></footer>');
  }
  function subsidyGuide(session) {
    var authText = session.authenticated ? '实名认证已完成，可继续领取国家补贴。' : '检测您还未实名认证，请先完成实名可使用国家补贴优惠';
    var authButton = session.authenticated ? '已完成认证' : '实名认证';
    var html = '<header class="lx-fulfillment-head"><h2>领取国家补贴</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header><div class="lx-fulfillment-body">';
    html += '<section class="lx-subsidy-step"><h3>第一步：实名认证</h3><p>' + authText + '</p><button class="lx-subsidy-outline" type="button" data-national-realname>' + authButton + '</button></section>';
    html += '<section class="lx-subsidy-step"><h3>第二步：去“京通微信小程序”领取/复制国补资格码</h3><div class="lx-subsidy-qr-row">' + qrMarkup() + '<div class="lx-subsidy-qr-copy">进入“京通小程序”<br>搜索“北京政府补贴”或点击“首页京通码”<br>点击“以旧换新资格码”<br>完成认证并领取</div></div></section>';
    html += '<section class="lx-subsidy-step"><h3>第三步：粘贴国补资格码享补贴</h3><div class="lx-subsidy-code"><input type="text" data-subsidy-code placeholder="请输入资格码"><button type="button" data-subsidy-bind>绑定资格码</button></div></section>';
    html += '<section class="lx-subsidy-step"><h3>第四步：回联想下单，下单时选择符合条件的发票自动抵扣</h3></section></div><footer class="lx-fulfillment-footer"><button type="button" data-subsidy-back>返回订单</button></footer>';
    renderCustom(session, 'lx-subsidy-dialog', html);
  }
  function showRealName(session) {
    var html = '<header class="lx-fulfillment-head"><h2>实名认证</h2><button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button></header>';
    html += '<div class="lx-fulfillment-body" style="display:flex;flex-direction:column"><p class="lx-realname-notice">实名认证需获取您的姓名、银行卡、手机号、证件信息（支持中国身份证）</p>';
    html += '<div class="lx-realname-grid"><label for="lxRealName">姓名</label><input id="lxRealName" placeholder="请输入姓名"><label for="lxRealId">证件</label><input id="lxRealId" placeholder="请输入证件号"><label for="lxRealPhone">手机</label><input id="lxRealPhone" placeholder="请输入手机号"><label for="lxRealCode">验证码</label><span class="lx-realname-code"><input id="lxRealCode" placeholder="请输入验证码"><button type="button" data-auth-code>获取验证码</button></span></div>';
    html += '<label class="lx-realname-consent"><input type="checkbox" data-realname-consent>我同意《实名认证协议》《联想网站隐私政策》</label><small style="margin-top:6px;color:#a39da6">请填写您的真实个人信息，一经填写不支持修改。禁止通过内部额度/福利，将产品进行二次销售从中牟利。</small></div>';
    html += '<footer class="lx-fulfillment-footer lx-realname-actions"><button class="secondary" type="button" data-realname-back>返回</button><button type="button" data-realname-next>下一步</button></footer>';
    renderCustom(session, 'lx-realname-dialog', html);
  }
  function pickupSuccess(session) {
    return '<button class="lx-buy-direct-close" type="button" aria-label="关闭">×</button><div class="lx-pickup-success"><h3 class="lx-pickup-success-title"><i>✓</i>支付成功</h3><p class="lx-pickup-success-copy">已成功购买' + esc(session.product.name) + '，您可前往<b>' + esc(session.store.name) + '</b>凭自提码进行核销取货。</p><div class="lx-pickup-code"><div class="lx-pickup-code-head">自提码 <span>到店出示</span></div>' + qrMarkup() + '<strong>ABCDEFJ</strong></div><div class="lx-payment-actions"><button type="button" class="primary" data-view-paid-order>查看订单</button></div></div>';
  }
  function customizeSuccess(session, dialog) {
    var title = dialog.querySelector('#lxBuyDirectTitle');
    if (!title || title.textContent.trim() !== '支付成功') return;
    var newest = window.__lxState && window.__lxState.orders && window.__lxState.orders[0];
    if (newest && session.mode !== 'delivery') {
      newest.type = session.mode;
      newest.typeLabel = session.mode === 'pickup' ? '到店自提' : '门店闪送';
      newest.status = session.mode === 'pickup' ? '待取货' : '待发货';
      newest.fulfillmentMode = session.mode;
      newest.fulfillmentStore = session.store;
      if (session.mode === 'pickup') newest.pickupStore = session.store;
      try { localStorage.setItem('lexiang.orders.v1', JSON.stringify(window.__lxState.orders)); } catch (ignore) {}
    }
    if (session.mode !== 'pickup' || dialog.dataset.pickupSuccess === 'true') return;
    dialog.dataset.pickupSuccess = 'true';
    dialog.innerHTML = pickupSuccess(session);
  }
  function observe(session) {
    var dialog = session.modal.querySelector('.lx-buy-direct-dialog');
    var observer = new MutationObserver(function () {
      decorateOrder(session);
      customizeSuccess(session, dialog);
    });
    observer.observe(dialog, { childList: true, subtree: true });
    session.observer = observer;
  }
  function openWithMode(product, options) {
    options = options || {};
    var normalized = normalizeProduct(product);
    originalOpen(normalized);
    var modal = document.querySelector('[data-buy-modal-direct]');
    if (!modal) return;
    var mode = options.mode === 'pickup' || options.mode === 'flash' ? options.mode : 'delivery';
    var selectedStore = stores.filter(function (store) { return store.id === options.storeId; })[0] || stores[0];
    var session = { modal: modal, product: normalized, mode: mode, store: selectedStore, size: options.size || null, authenticated: false, draftStoreId: '' };
    sessions.set(modal, session);
    modal.dataset.fulfillmentMode = mode;
    if (mode === 'pickup' || mode === 'flash') {
      var fulfillmentDialog = modal.querySelector('.lx-buy-direct-dialog');
      if (fulfillmentDialog) {
        var fulfillmentHeight = Math.min(600, Math.max(0, window.innerHeight - 32));
        fulfillmentDialog.style.setProperty('height', fulfillmentHeight + 'px', 'important');
        fulfillmentDialog.style.setProperty('min-height', fulfillmentHeight + 'px', 'important');
      }
    }
    window.requestAnimationFrame(function () { rememberSize(session); decorateOrder(session); });
    observe(session);
    if (!options.skipSuggestion && mode === 'delivery') appendSuggestion(normalized);
    return modal;
  }

  window.__lxOpenUnifiedDiscountOrder = openWithMode;
  window.__lxFulfillmentCheckoutV60 = Object.freeze({ stores: stores, open: openWithMode });

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('[data-open-fulfillment]');
    if (link) {
      var suggestion = link.closest('[data-fulfillment-suggestion]');
      if (!suggestion || !suggestion._lxProduct) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openWithMode(suggestion._lxProduct, { mode: link.dataset.openFulfillment, skipSuggestion: true });
      return;
    }
    var modal = event.target.closest && event.target.closest('[data-buy-modal-direct]');
    var session = modal && sessions.get(modal);
    if (!session) return;
    var action = event.target.closest('[data-select-fulfillment-store],[data-fulfillment-store],[data-fulfillment-store-confirm],[data-claim-national-subsidy],[data-national-realname],[data-subsidy-back],[data-realname-back],[data-realname-next],[data-auth-code],[data-subsidy-bind]');
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (action.matches('[data-select-fulfillment-store]')) return showStoreSelector(session);
    if (action.matches('[data-fulfillment-store]')) {
      session.draftStoreId = action.dataset.fulfillmentStore;
      Array.prototype.forEach.call(modal.querySelectorAll('[data-fulfillment-store]'), function (card) { card.classList.toggle('is-active', card === action); });
      return;
    }
    if (action.matches('[data-fulfillment-store-confirm]')) {
      session.store = stores.filter(function (store) { return store.id === session.draftStoreId; })[0] || session.store;
      return rerenderOrder(session);
    }
    if (action.matches('[data-claim-national-subsidy]')) return subsidyGuide(session);
    if (action.matches('[data-national-realname]')) return showRealName(session);
    if (action.matches('[data-subsidy-back]')) return rerenderOrder(session);
    if (action.matches('[data-realname-back]')) return subsidyGuide(session);
    if (action.matches('[data-auth-code]')) {
      action.textContent = '60s后重试';
      action.disabled = true;
      window.setTimeout(function () {
        if (action.isConnected) { action.textContent = '获取验证码'; action.disabled = false; }
      }, 3000);
      return;
    }
    if (action.matches('[data-realname-next]')) {
      if (!modal.querySelector('[data-realname-consent]').checked) {
        window.alert('请先阅读并同意实名认证协议及隐私政策');
        return;
      }
      session.authenticated = true;
      return subsidyGuide(session);
    }
    if (action.matches('[data-subsidy-bind]')) {
      var input = modal.querySelector('[data-subsidy-code]');
      if (!input.value.trim()) { input.focus(); return; }
      action.textContent = '已绑定';
      action.disabled = true;
    }
  }, true);

  var previewMode = new URLSearchParams(location.search).get('showOrder');
  if (['pickup', 'flash', 'pickup-store', 'flash-store', 'subsidy', 'realname', 'pickup-success'].indexOf(previewMode) >= 0) {
    window.setTimeout(function () {
      var mode = previewMode.indexOf('flash') === 0 ? 'flash' : previewMode === 'subsidy' || previewMode === 'realname' ? 'delivery' : 'pickup';
      var modal = openWithMode({ sku: 'preview-y7000p', name: '联想拯救者Y7000P 2025 16英寸电竞游戏笔记本', price: 9799, originalPrice: 9999, discount: 200, image_url: '/assets/product-placeholder.svg', series: '拯救者', size: '16英寸', configuration: '16G/1T SSD', configurationLabel: '16G/1T SSD' }, { mode: mode, skipSuggestion: true });
      var session = modal && sessions.get(modal);
      if (!session) return;
      if (previewMode.indexOf('-store') > 0) showStoreSelector(session);
      if (previewMode === 'subsidy') subsidyGuide(session);
      if (previewMode === 'realname') showRealName(session);
      if (previewMode === 'pickup-success') {
        var dialog = modal.querySelector('.lx-buy-direct-dialog');
        applySize(dialog, session);
        dialog.className = 'lx-buy-direct-dialog lx-payment-dialog';
        dialog.innerHTML = pickupSuccess(session);
      }
    }, 50);
  }
})();
